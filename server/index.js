const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');
const JWT_SECRET = process.env.JWT_SECRET || 'skena-trip-secret-key';

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

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.decode(token); 
    if (!decoded) return res.status(400).json({ error: 'Invalid Google token' });
    
    const email = decoded.email;
    const name = decoded.name;
    const googleId = decoded.sub; 

    if (!email) return res.status(400).json({ error: 'Email not found in token' });

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleId }, { email: email }] }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name: name || 'Google User', email: email, googleId: googleId, role: 'customer' }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { email: email },
        data: { googleId: googleId }
      });
    }

    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login/Register successful',
      token: sessionToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
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
    const trips = await prisma.trip.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(trips);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/trips/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: parseInt(req.params.id) } });
    if (trip) res.json(trip); else res.status(404).json({ error: 'Trip not found' });
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
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    
    const trip = await prisma.trip.create({ data });
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
    
    if (req.file) data.image = `/uploads/${req.file.filename}`;

    const trip = await prisma.trip.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(trip);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/trips/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.trip.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// BOOKINGS API
// ==========================================

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { tripId, pax, promoCode } = req.body;
    const userId = req.user.userId; // Get from JWT
    
    const trip = await prisma.trip.findUnique({ where: { id: parseInt(tripId) } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    let totalPrice = trip.price * parseInt(pax);
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
      include: { trip: true, payments: true },
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

app.put('/api/bookings/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; 
    const booking = await prisma.booking.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
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

    res.json(payment);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ==========================================
// EXPENSES API (Admin)
// ==========================================

app.post('/api/expenses', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tripId, itemName, category, amount, expenseDate, receiptUrl } = req.body;
    const expense = await prisma.expense.create({
      data: {
        tripId: parseInt(tripId),
        itemName,
        category,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        receiptUrl
      }
    });
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

app.delete('/api/promos/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.promoCode.delete({ where: { id: parseInt(req.params.id) } });
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
