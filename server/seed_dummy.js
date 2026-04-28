const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Membersihkan data lama (kecuali Admin)...');
  // Delete existing data to prevent duplicates (except Admin User to keep login access)
  await prisma.expense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'customer' } });
  
  // Create Trips
  console.log('Menambahkan Trip...');
  const trip1 = await prisma.trip.create({
    data: {
      title: 'Eksplorasi Sumba Eksotis',
      description: 'Menjelajahi sabana luas, desa adat, dan pantai tersembunyi di Pulau Sumba. Termasuk penginapan, transportasi lokal, dan guide.',
      destination: 'Sumba, NTT',
      date: new Date('2026-08-15T00:00:00Z'),
      price: 4500000,
      quota: 15,
      duration: '4 Hari 3 Malam',
      rating: 4.9
    }
  });

  const trip2 = await prisma.trip.create({
    data: {
      title: 'Pendakian Rinjani via Sembalun',
      description: 'Taklukkan puncak tertinggi kedua di Indonesia dengan pemandangan Danau Segara Anak yang memukau. Termasuk porter dan tenda VIP.',
      destination: 'Lombok, NTB',
      date: new Date('2026-09-10T00:00:00Z'),
      price: 2800000,
      quota: 20,
      duration: '3 Hari 2 Malam',
      rating: 4.8
    }
  });

  const trip3 = await prisma.trip.create({
    data: {
      title: 'Diving Trip Raja Ampat',
      description: 'Menyelam di surga bawah laut dengan keanekaragaman hayati terbaik di dunia. Khusus untuk penyelam bersertifikat PADI.',
      destination: 'Raja Ampat, Papua',
      date: new Date('2026-10-05T00:00:00Z'),
      price: 12500000,
      quota: 10,
      duration: '5 Hari 4 Malam',
      rating: 5.0
    }
  });

  // Create Dummy Users
  console.log('Menambahkan Pelanggan...');
  const hashedPw = await bcrypt.hash('Pelanggan123!', 10);
  const cust1 = await prisma.user.create({
    data: {
      name: 'Andi Saputra',
      email: 'andi@example.com',
      password: hashedPw,
      role: 'customer'
    }
  });

  const cust2 = await prisma.user.create({
    data: {
      name: 'Rina Melati',
      email: 'rina@example.com',
      password: hashedPw,
      role: 'customer'
    }
  });

  // Create Dummy Bookings
  console.log('Menambahkan Pesanan Booking...');
  const booking1 = await prisma.booking.create({
    data: {
      userId: cust1.id,
      tripId: trip1.id,
      pax: 2,
      totalPrice: trip1.price * 2,
      status: 'confirmed'
    }
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: cust2.id,
      tripId: trip2.id,
      pax: 1,
      totalPrice: trip2.price * 1,
      status: 'pending'
    }
  });

  // Create Dummy Payments
  console.log('Menambahkan Data Pembayaran...');
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: booking1.totalPrice,
      method: 'Bank Transfer BCA',
      proofUrl: 'https://example.com/receipt-bca.jpg',
      status: 'paid'
    }
  });

  // Create Dummy Expenses
  console.log('Menambahkan Data Pengeluaran Operasional...');
  await prisma.expense.create({
    data: {
      tripId: trip1.id,
      itemName: 'Sewa Hiace 4 Hari',
      category: 'Transportasi',
      amount: 2500000,
      expenseDate: new Date('2026-08-10T00:00:00Z')
    }
  });

  await prisma.expense.create({
    data: {
      tripId: trip1.id,
      itemName: 'Konsumsi Peserta H1 & H2',
      category: 'Konsumsi',
      amount: 1800000,
      expenseDate: new Date('2026-08-15T00:00:00Z')
    }
  });

  console.log('Berhasil! Database telah terisi dengan data dummy lengkap.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
