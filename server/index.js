const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sharp = require('sharp');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'skena-trip-secret-key';

// ── Nodemailer transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==========================================
// MIDDLEWARES
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid.' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Akses ditolak. Membutuhkan hak akses admin.' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Akses ditolak. Fitur ini hanya untuk Super Admin.' });
  }
};

// ==========================================
// UTILS
// ==========================================
const createActivityLog = async (userId, action, details) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: action,
        details: details
      }
    });
  } catch (error) {
    console.error('FAILED TO CREATE ACTIVITY LOG:', error);
  }
};

const createAdminNotification = async (type, message) => {
  try {
    await prisma.adminNotification.create({
      data: { type, message }
    });
  } catch (error) {
    console.error('FAILED TO CREATE ADMIN NOTIFICATION:', error);
  }
};
// Image Optimization Helper
const optimizeImage = async (file) => {
  if (!file) return;
  const filePath = file.path;
  const tempPath = filePath + '_temp';
  
  try {
    await sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(tempPath);
    
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error('IMAGE OPTIMIZATION ERROR:', err);
  }
};

// ==========================================
// AUTH API (Standard & Google OAuth)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'customer' }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    if (!user.password) return res.status(400).json({ error: 'Please login using Google Auth' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token: sessionToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ── Forgot Password ────────────────────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib diisi.' });

    const user = await prisma.user.findUnique({ where: { email } });
    // Selalu kembalikan pesan sukses agar tidak bocorkan info akun mana yang ada
    if (!user || !user.password) {
      return res.json({ message: 'Jika email terdaftar, link reset telah dikirim.' });
    }

    // Hapus token lama yang belum dipakai untuk email ini
    await prisma.passwordResetToken.deleteMany({ where: { email, used: false } });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt }
    });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

    await transporter.sendMail({
      from: `"Skena Trip" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🔑 Reset Password Skena Trip',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#f8fafc;border-radius:16px;overflow:hidden">
          <div style="background:#154c3c;padding:32px;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">Skena Trip</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#0f172a;margin-bottom:8px">Reset Password</h2>
            <p style="color:#64748b;margin-bottom:24px">Halo <strong>${user.name}</strong>, kami menerima permintaan reset password untuk akun Anda.</p>
            <p style="color:#64748b;margin-bottom:24px">Klik tombol di bawah untuk membuat password baru. Link ini berlaku selama <strong>1 jam</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#154c3c;color:white;padding:14px 28px;border-radius:10px;font-weight:600;text-decoration:none;margin-bottom:24px">Reset Password Saya</a>
            <p style="color:#94a3b8;font-size:13px">Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <p style="color:#94a3b8;font-size:12px">Atau salin URL ini ke browser:<br><code style="word-break:break-all">${resetUrl}</code></p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Jika email terdaftar, link reset telah dikirim.' });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ error: 'Gagal mengirim email. Periksa konfigurasi SMTP di server.' });
  }
});

// ── Reset Password ──────────────────────────────────────────────────────────
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record) return res.status(400).json({ error: 'Link reset tidak valid.' });
    if (record.used) return res.status(400).json({ error: 'Link reset sudah pernah digunakan.' });
    if (new Date() > record.expiresAt) return res.status(400).json({ error: 'Link reset sudah kedaluwarsa. Minta link baru.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    });

    res.json({ message: 'Password berhasil diperbarui. Silakan login dengan password baru.' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USER PROFILE API
// ==========================================

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/users/profile', authenticateToken, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, address, gender, whatsapp } = req.body;
    let updateData = { name, address, gender, whatsapp };
    
    if (req.file) {
      updateData.profilePicUrl = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData
    });
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    
    if (!user.password) return res.status(400).json({ error: 'Pengguna Google Auth tidak bisa mengganti password' });
    
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) return res.status(400).json({ error: 'Password lama salah' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// TRIPS API
// ==========================================

app.get('/api/trips', async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({ 
      include: {
        bookings: {
          where: { status: { in: ['pending', 'confirmed'] } },
          select: { pax: true }
        }
      },
      orderBy: { createdAt: 'desc' } 
    });

    const tripsWithPax = trips.map(trip => {
      const currentPax = trip.bookings.reduce((sum, b) => sum + b.pax, 0);
      const { bookings, ...tripData } = trip;
      return { ...tripData, currentPax };
    });

    res.json(tripsWithPax);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/trips/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({ 
      where: { id: parseInt(req.params.id) },
      include: {
        bookings: {
          where: { status: { in: ['pending', 'confirmed'] } },
          select: { pax: true }
        },
        itinerary: { orderBy: { time: 'asc' } }
      }
    });

    if (trip) {
      const currentPax = trip.bookings.reduce((sum, b) => sum + b.pax, 0);
      const reviews = await prisma.review.findMany({
        where: { tripId: parseInt(req.params.id) },
        include: { user: { select: { name: true, profilePicUrl: true } } },
        orderBy: { createdAt: 'desc' }
      });
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
      const { bookings, ...tripData } = trip;
      res.json({ ...tripData, currentPax, reviews, avgRating });
    } else {
      res.status(404).json({ error: 'Trip not found' });
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/trips', authenticateToken, isAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { title, description, destination, date, price, quota, duration, imagePosition } = req.body;
    let data = {
      title,
      description,
      destination,
      date: new Date(date),
      price: parseFloat(price),
      quota: parseInt(quota),
      duration,
      imagePosition: imagePosition || 'center'
    };

    if (req.file) {
      await optimizeImage(req.file);
      data.image = `/uploads/${req.file.filename}`;
    }
    
    const trip = await prisma.trip.create({ data });
    await createActivityLog(req.user.userId, 'CREATE_TRIP', `Admin membuat trip baru: ${trip.title}`);
    res.status(201).json(trip);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/trips/:id', authenticateToken, isAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { title, description, destination, date, price, quota, duration, imagePosition } = req.body;
    let data = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (destination) data.destination = destination;
    if (date) data.date = new Date(date);
    if (price) data.price = parseFloat(price);
    if (quota) data.quota = parseInt(quota);
    if (duration) data.duration = duration;
    if (imagePosition) data.imagePosition = imagePosition;
    
    if (req.file) {
      await optimizeImage(req.file);
      data.image = `/uploads/${req.file.filename}`;
    }

    const trip = await prisma.trip.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    await createActivityLog(req.user.userId, 'UPDATE_TRIP', `Admin memperbarui trip: ${trip.title} (ID: ${trip.id})`);
    res.json(trip);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/trips/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    await prisma.trip.delete({ where: { id: tripId } });
    await createActivityLog(req.user.userId, 'DELETE_TRIP', `Super Admin menghapus trip: ${trip?.title || 'Unknown'} (ID: ${tripId})`);
    await createAdminNotification('DELETION', `Trip "${trip?.title || 'Unknown'}" (ID: ${tripId}) telah dihapus oleh ${req.user.name}`);
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/trips/:id/duplicate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const originalId = parseInt(req.params.id);
    const original = await prisma.trip.findUnique({ 
      where: { id: originalId },
      include: { itinerary: true }
    });
    
    if (!original) return res.status(404).json({ error: 'Trip asal tidak ditemukan' });

    // Buat data baru dari original, ubah judul
    const { id, createdAt, updatedAt, itinerary, ...data } = original;
    const duplicatedTrip = await prisma.trip.create({
      data: {
        ...data,
        title: `${original.title} (Duplikat)`,
        // Itinerary juga diduplikasi jika ada
        itinerary: {
          create: itinerary.map(({ id, tripId, ...item }) => item)
        }
      }
    });

    await createActivityLog(req.user.userId, 'DUPLICATE_TRIP', `Admin menduplikasi trip: ${original.title} (ID Baru: ${duplicatedTrip.id})`);
    res.status(201).json(duplicatedTrip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// BOOKINGS API
// ==========================================

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { tripId, pax, promoCode } = req.body;
    const userId = req.user.userId; // Get from JWT
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.address || !user.whatsapp || !user.gender || !user.name) {
      return res.status(400).json({ 
        error: 'Profil belum lengkap.', 
        incompleteProfile: true,
        message: 'Mohon lengkapi profil Anda (Alamat, Jenis Kelamin, dan WhatsApp) sebelum melakukan pemesanan.' 
      });
    }

    const trip = await prisma.trip.findUnique({ where: { id: parseInt(tripId) } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    // Check quota
    const totalBooked = await prisma.booking.aggregate({
      where: {
        tripId: parseInt(tripId),
        status: { in: ['pending', 'confirmed'] }
      },
      _sum: { pax: true }
    });
    
    const currentPax = totalBooked._sum.pax || 0;
    const requestedPax = parseInt(pax);

    if (currentPax + requestedPax > trip.quota) {
      const remaining = trip.quota - currentPax;
      return res.status(400).json({ 
        error: remaining <= 0 
          ? 'Mohon maaf, kuota trip ini sudah habis.' 
          : `Kuota tidak mencukupi. Sisa kuota yang tersedia hanya ${remaining} seat.` 
      });
    }

    let totalPrice = trip.price * requestedPax;
    let appliedPromo = null;

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode.toUpperCase() } });
      if (promo && promo.isActive) {
        const discount = promo.discountType === 'percentage' 
          ? Math.round(totalPrice * (promo.discountAmount / 100)) 
          : Math.round(promo.discountAmount);
        totalPrice = Math.max(0, Math.round(totalPrice - discount));
        appliedPromo = promo.code;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        tripId: parseInt(tripId),
        pax: parseInt(pax),
        totalPrice,
        promoCode: appliedPromo,
        status: 'pending'
      }
    });
    res.status(201).json(booking);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// Get user's own bookings
app.get('/api/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: { 
        trip: { select: { title: true, date: true, duration: true, price: true, image: true } },
        payments: true,
        paymentMethod: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin Get All Bookings
app.get('/api/bookings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true, trip: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin Get Pending Bookings Count
app.get('/api/bookings/pending-count', authenticateToken, isAdmin, async (req, res) => {
  try {
    const count = await prisma.booking.count({
      where: { status: 'pending' }
    });
    res.json({ count });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/bookings/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; 
    const booking = await prisma.booking.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    await createActivityLog(req.user.userId, 'UPDATE_BOOKING_STATUS', `Admin mengubah status pesanan #${booking.id} menjadi ${status.toUpperCase()}`);
    res.json(booking);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// PAYMENTS API
// ==========================================

app.post('/api/payments', authenticateToken, upload.single('proofFile'), async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;
    
    // Validate booking belongs to user
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });
    if (!booking) return res.status(404).json({error: 'Booking not found'});
    if (booking.userId !== req.user.userId) return res.status(403).json({error: 'Forbidden'});

    if (req.file) {
      await optimizeImage(req.file);
    }
    const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!proofUrl) return res.status(400).json({error: 'Bukti pembayaran wajib diunggah'});

    const payment = await prisma.payment.create({
      data: {
        bookingId: parseInt(bookingId),
        amount: parseFloat(amount),
        method,
        proofUrl,
        status: 'pending_verification'
      }
    });
    res.status(201).json(payment);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/payments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { booking: { include: { user: true, trip: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/payments/:id/verify', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; 
    
    const payment = await prisma.payment.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });

    if (status === 'paid') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'confirmed' }
      });
    }

    await createActivityLog(req.user.userId, 'VERIFY_PAYMENT', `Admin memverifikasi pembayaran (ID: ${payment.id}) untuk pesanan #${payment.bookingId} sebagai ${status.toUpperCase()}`);
    res.json(payment);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// EXPENSES API (Admin)
// ==========================================

app.post('/api/expenses', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tripId, itemName, category, amount, expenseDate, receiptUrl } = req.body;
    const amountVal = parseFloat(amount);
    
    const expense = await prisma.expense.create({
      data: {
        tripId: parseInt(tripId),
        itemName,
        category,
        amount: amountVal,
        expenseDate: new Date(expenseDate),
        receiptUrl
      }
    });
    
    await createActivityLog(req.user.userId, 'CREATE_EXPENSE', `Admin mencatat pengeluaran: ${itemName} (Rp ${amountVal.toLocaleString()}) untuk Trip ID: ${tripId}`);
    
    // Check threshold for notification
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (settings && amountVal >= settings.expenseThreshold) {
      await createAdminNotification('HIGH_EXPENSE', `Pengeluaran tinggi terdeteksi: ${itemName} senilai Rp ${amountVal.toLocaleString()} (Threshold: Rp ${settings.expenseThreshold.toLocaleString()})`);
    }

    res.status(201).json(expense);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/expenses', authenticateToken, isAdmin, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { trip: true },
      orderBy: { expenseDate: 'desc' }
    });
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/expenses/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { tripId, itemName, category, amount, expenseDate } = req.body;
    const expense = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: {
        tripId: parseInt(tripId),
        itemName,
        category,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate)
      }
    });
    await createActivityLog(req.user.userId, 'UPDATE_EXPENSE', `Super Admin memperbarui pengeluaran: ${itemName} (ID: ${expense.id})`);
    res.json(expense);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/expenses/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    await prisma.expense.delete({ where: { id: expenseId } });
    await createActivityLog(req.user.userId, 'DELETE_EXPENSE', `Super Admin menghapus pengeluaran: ${expense?.itemName || 'Unknown'} (ID: ${expenseId})`);
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/admin/trips/:id/finance', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    
    // Total Revenue (Confirmed/Paid Bookings)
    const bookings = await prisma.booking.findMany({
      where: { tripId: tripId, status: 'confirmed' }
    });
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Total Expenses
    const expenses = await prisma.expense.findMany({
      where: { tripId: tripId }
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    res.json({
      tripId,
      totalRevenue,
      totalExpenses,
      netProfit,
      expenseCount: expenses.length,
      bookingCount: bookings.length
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// PROMO CODES API
// ==========================================

app.get('/api/promos', authenticateToken, isAdmin, async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(promos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/promos', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { code, discountAmount, discountType } = req.body;
    const promo = await prisma.promoCode.create({
      data: { code: code.toUpperCase(), discountAmount: parseFloat(discountAmount), discountType: discountType || 'flat' }
    });
    await createActivityLog(req.user.userId, 'CREATE_PROMO', `Admin membuat kode promo baru: ${promo.code}`);
    res.status(201).json(promo);
  } catch (error) { 
    console.error('PROMO CREATION ERROR:', error);
    res.status(400).json({ error: error.message }); 
  }
});

app.put('/api/promos/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { isActive, discountAmount, discountType } = req.body;
    const data = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (discountAmount !== undefined) data.discountAmount = parseFloat(discountAmount);
    if (discountType !== undefined) data.discountType = discountType;
    
    const promo = await prisma.promoCode.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(promo);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/promos/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const promoId = parseInt(req.params.id);
    const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
    await prisma.promoCode.delete({ where: { id: promoId } });
    await createActivityLog(req.user.userId, 'DELETE_PROMO', `Super Admin menghapus kode promo: ${promo?.code || 'Unknown'} (ID: ${promoId})`);
    await createAdminNotification('DELETION', `Kode Promo "${promo?.code || 'Unknown'}" (ID: ${promoId}) telah dihapus oleh ${req.user.name}`);
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/promos/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo) return res.status(404).json({ error: 'Kode promo tidak ditemukan' });
    if (!promo.isActive) return res.status(400).json({ error: 'Kode promo sudah tidak aktif' });
    
    res.json({ discountAmount: promo.discountAmount, discountType: promo.discountType });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// PASSENGER MANIFEST API (Admin)
// ==========================================

// GET /api/manifest?tripId=<id>  → daftar peserta terkonfirmasi per trip
app.get('/api/manifest', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tripId } = req.query;

    // Fetch all trips for the dropdown selector
    const trips = await prisma.trip.findMany({
      select: { id: true, title: true, date: true, destination: true },
      orderBy: { date: 'asc' }
    });

    if (!tripId) {
      return res.json({ trips, passengers: [], trip: null });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: parseInt(tripId) },
      select: { id: true, title: true, date: true, destination: true, quota: true }
    });

    if (!trip) return res.status(404).json({ error: 'Trip tidak ditemukan.' });

    const bookings = await prisma.booking.findMany({
      where: {
        tripId: parseInt(tripId),
        status: 'confirmed'
      },
      include: {
        user: {
          select: { id: true, name: true, whatsapp: true, email: true, gender: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Expand pax: each booking may have >1 seat, count total seats
    const passengers = bookings.map((b, idx) => ({
      no: idx + 1,
      bookingId: b.id,
      name: b.user.name,
      email: b.user.email,
      whatsapp: b.user.whatsapp || '-',
      gender: b.user.gender || '-',
      pax: b.pax,
      totalPrice: b.totalPrice,
      bookedAt: b.createdAt
    }));

    const totalPax = bookings.reduce((sum, b) => sum + b.pax, 0);

    res.json({ trips, trip, passengers, totalPax });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USER MANAGEMENT API (Super Admin Only)
// ==========================================

// Get all users (with summary stats)
app.get('/api/admin/users', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        whatsapp: true,
        profilePicUrl: true,
        createdAt: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update user role (Super Admin cannot change their own role)
app.put('/api/admin/users/:id/role', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const { role } = req.body;

    const validRoles = ['customer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid. Pilih: customer, admin, atau superadmin.' });
    }

    // Prevent changing own role
    if (targetId === req.user.userId) {
      return res.status(403).json({ error: 'Anda tidak bisa mengubah role akun Anda sendiri.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

    // Enforce single Super Admin rule
    if (role === 'superadmin') {
      const existingSuperAdmin = await prisma.user.findFirst({
        where: {
          role: { in: ['superadmin', 'super_admin'] },
          id: { not: targetId }
        }
      });
      if (existingSuperAdmin) {
        return res.status(409).json({
          error: `Super Admin sudah ada (${existingSuperAdmin.name}). Hanya boleh ada 1 Super Admin.`
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json(updatedUser);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// Delete a user (cannot delete self or another super admin)
app.delete('/api/admin/users/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);

    if (targetId === req.user.userId) {
      return res.status(403).json({ error: 'Anda tidak bisa menghapus akun Anda sendiri.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    if (targetUser.role === 'superadmin' || targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Super Admin tidak bisa dihapus.' });
    }

    // Delete related records first (cascade-safe)
    const userBookings = await prisma.booking.findMany({ where: { userId: targetId }, select: { id: true } });
    const bookingIds = userBookings.map(b => b.id);
    if (bookingIds.length > 0) {
      await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.booking.deleteMany({ where: { userId: targetId } });
    }

    await prisma.user.delete({ where: { id: targetId } });
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// Reset Password (Super Admin)
app.post('/api/admin/users/:id/reset-password', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id: targetId },
      data: { password: hashedPassword },
      select: { id: true, name: true, email: true }
    });

    await createActivityLog(req.user.userId, 'RESET_PASSWORD', `Super Admin mereset password untuk user: ${user.name} (${user.email})`);
    res.json({ message: `Password untuk ${user.name} berhasil direset.` });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// SITE SETTINGS API
// ==========================================

app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: { heroImages: true }
    });
    if (!settings) {
      settings = await prisma.siteSettings.create({ 
        data: { id: 1 },
        include: { heroImages: true }
      });
    }
    res.json(settings);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/settings', authenticateToken, isAdmin, upload.fields([
  { name: 'logoFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { siteName, slogan, contactEmail, contactPhone, address, expenseThreshold, heroTitle, heroSubtitle } = req.body;
    let data = { 
      siteName, 
      slogan, 
      contactEmail, 
      contactPhone, 
      address,
      expenseThreshold: expenseThreshold ? parseFloat(expenseThreshold) : undefined,
      heroTitle,
      heroSubtitle
    };
    
    if (req.files && req.files.logoFile) {
      data.logoUrl = `/uploads/${req.files.logoFile[0].filename}`;
    }
    
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { ...data, id: 1 }
    });
    res.json(settings);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// HERO IMAGES MANAGEMENT
app.post('/api/settings/hero-images', authenticateToken, isAdmin, upload.single('heroImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const currentCount = await prisma.heroImage.count({ where: { siteSettingsId: 1 } });
    if (currentCount >= 10) return res.status(400).json({ error: 'Maksimal 10 foto hero diizinkan' });

    const heroImage = await prisma.heroImage.create({
      data: {
        url: `/uploads/${req.file.filename}`,
        siteSettingsId: 1
      }
    });
    res.status(201).json(heroImage);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/settings/hero-images/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.heroImage.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// ACTIVITY LOGS API (Super Admin)
// ==========================================

app.get('/api/admin/logs', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200 // Limit to last 200 logs
    });
    res.json(logs);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Admin Notifications API
app.get('/api/admin/notifications', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/notifications/unread-count', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const count = await prisma.adminNotification.count({
      where: { isRead: false }
    });
    res.json({ count });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/admin/notifications/:id/read', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    await prisma.adminNotification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// REVIEWS API
// ==========================================

app.post('/api/reviews', authenticateToken, upload.single('reviewImage'), async (req, res) => {
  try {
    const { tripId, rating, comment } = req.body;
    
    // Check if user has a confirmed booking for this trip
    const booking = await prisma.booking.findFirst({
      where: {
        userId: req.user.userId,
        tripId: parseInt(tripId),
        status: 'confirmed'
      }
    });

    if (!booking) {
      return res.status(403).json({ error: 'Anda hanya dapat memberikan ulasan untuk trip yang telah Anda ikuti dan dikonfirmasi.' });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { userId: req.user.userId, tripId: parseInt(tripId) }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Anda sudah memberikan ulasan untuk trip ini.' });
    }

    let imageUrl = null;
    if (req.file) {
      await optimizeImage(req.file);
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        imageUrl,
        userId: req.user.userId,
        tripId: parseInt(tripId)
      }
    });

    res.status(201).json(review);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/reviews/featured', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { rating: { gte: 4 } },
      take: 6,
      include: { 
        user: { select: { name: true, profilePicUrl: true } },
        trip: { select: { title: true, destination: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// PAYMENT METHODS API
// ==========================================

app.get('/api/payment-methods', async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({ where: { isActive: true } });
    res.json(methods);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/payment-methods', authenticateToken, isAdmin, async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(methods);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/admin/payment-methods', authenticateToken, isSuperAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { name, type, accountName, accountNo, instruction } = req.body;
    let imageUrl = null;
    if (req.file) {
      await optimizeImage(req.file);
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const method = await prisma.paymentMethod.create({
      data: {
        name,
        type,
        accountName,
        accountNo,
        instruction,
        imageUrl,
        isActive: true
      }
    });

    await createActivityLog(req.user.userId, 'CREATE_PAYMENT_METHOD', `Super Admin membuat metode pembayaran: ${name}`);
    res.status(201).json(method);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/admin/payment-methods/:id', authenticateToken, isSuperAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { name, type, accountName, accountNo, instruction, isActive } = req.body;
    let data = {};
    if (name) data.name = name;
    if (type) data.type = type;
    if (accountName !== undefined) data.accountName = accountName;
    if (accountNo !== undefined) data.accountNo = accountNo;
    if (instruction !== undefined) data.instruction = instruction;
    if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      await optimizeImage(req.file);
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const method = await prisma.paymentMethod.update({
      where: { id: parseInt(req.params.id) },
      data
    });

    await createActivityLog(req.user.userId, 'UPDATE_PAYMENT_METHOD', `Super Admin memperbarui metode pembayaran: ${method.name}`);
    res.json(method);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/admin/payment-methods/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const method = await prisma.paymentMethod.delete({ where: { id: parseInt(req.params.id) } });
    await createActivityLog(req.user.userId, 'DELETE_PAYMENT_METHOD', `Super Admin menghapus metode pembayaran: ${method.name}`);
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// ITINERARY API
// ==========================================

app.post('/api/trips/:id/itinerary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { time, activity, description } = req.body;
    const item = await prisma.itineraryItem.create({
      data: {
        time,
        activity,
        description,
        tripId: parseInt(req.params.id)
      }
    });
    res.status(201).json(item);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/itinerary/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.itineraryItem.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

