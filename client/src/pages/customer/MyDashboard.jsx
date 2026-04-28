import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X } from 'lucide-react';

const MyDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer BCA');
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    api.get('/my-bookings')
       .then(res => setBookings(res.data))
       .catch(err => console.error(err));
  };

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    if (!proofFile) return alert('Silakan pilih file bukti pembayaran');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('bookingId', selectedBooking.id);
    formData.append('amount', selectedBooking.totalPrice);
    formData.append('method', paymentMethod);
    formData.append('proofFile', proofFile);

    try {
      await api.post('/payments', formData);
      alert('Bukti pembayaran berhasil diunggah! Menunggu konfirmasi admin.');
      setSelectedBooking(null);
      setProofFile(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengunggah pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
      <h1>Dashboard Saya</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Kelola tiket dan perjalanan Anda di sini.</p>

      {bookings.length === 0 ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p>Anda belum memiliki riwayat pemesanan.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {bookings.map(b => {
            const hasPayment = b.payments && b.payments.length > 0;
            return (
            <div key={b.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '8px' }}>{b.trip.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {b.pax} Pax &bull; Rp {b.totalPrice.toLocaleString()}
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <span className={`badge ${b.status}`}>Status Booking: {b.status.toUpperCase()}</span>
                  {hasPayment && b.status !== 'confirmed' && <span className="badge pending">Menunggu Verifikasi Pembayaran</span>}
                </div>
              </div>
              <div>
                {b.status === 'pending' && !hasPayment && (
                  <button className="btn btn-accent" style={{ padding: '8px 16px' }} onClick={() => setSelectedBooking(b)}>
                    Bayar Sekarang
                  </button>
                )}
                {b.status === 'confirmed' && (
                  <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => setSelectedTicket(b)}>Lihat E-Ticket</button>
                )}
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Payment Modal */}
      {selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setSelectedBooking(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent' }}>
              <X size={20} color="var(--text-muted)"/>
            </button>
            <h3 style={{ marginBottom: '16px' }}>Upload Bukti Pembayaran</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Total Tagihan: <strong>Rp {selectedBooking.totalPrice.toLocaleString()}</strong>
            </p>
            
            <form onSubmit={handleUploadPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Metode Pembayaran</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Bank Transfer BCA">Bank Transfer BCA (0987654321)</option>
                  <option value="Bank Mandiri">Bank Mandiri (1234567890)</option>
                  <option value="E-Wallet GoPay">E-Wallet GoPay (08123456789)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>File Bukti (Image/PDF)</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="input" 
                  onChange={(e) => setProofFile(e.target.files[0])}
                  style={{ background: 'var(--bg-light)' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }} disabled={loading}>
                {loading ? 'Mengunggah...' : 'Upload Pembayaran'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* E-Ticket Modal */}
      {selectedTicket && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          
          <div className="ticket-print-area card" style={{ width: '100%', maxWidth: '600px', background: 'white', position: 'relative', overflow: 'hidden' }}>
            {/* Ticket Header */}
            <div style={{ background: 'var(--primary)', color: 'white', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/logo.jpg" alt="Logo" style={{ height: '40px', background: 'white', borderRadius: '4px', padding: '4px' }} />
                <h2 style={{ margin: 0 }}>E-Ticket Skena Trip</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Booking ID</p>
                <h3 style={{ margin: 0 }}>#BK-{selectedTicket.id.toString().padStart(4, '0')}</h3>
              </div>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Nama Pelanggan</p>
                  <p style={{ fontWeight: '600', fontSize: '18px', color: '#0f172a' }}>{JSON.parse(localStorage.getItem('user'))?.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Destinasi</p>
                  <p style={{ fontWeight: '600', fontSize: '18px', color: '#0f172a' }}>{selectedTicket.trip.title}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tanggal Perjalanan</p>
                  <p style={{ fontWeight: '600', color: '#0f172a' }}>{new Date(selectedTicket.trip.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Durasi & Pax</p>
                  <p style={{ fontWeight: '600', color: '#0f172a' }}>{selectedTicket.trip.duration} &bull; {selectedTicket.pax} Orang</p>
                </div>
              </div>
              
              <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status Pembayaran</p>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>LUNAS</h3>
                </div>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SKENATRIP-BK-${selectedTicket.id}`} alt="QR Code" style={{ width: '80px', height: '80px' }} />
              </div>
            </div>
            
            {/* Action Buttons (Hidden on Print) */}
            <div className="no-print" style={{ padding: '16px 32px', background: 'var(--bg-light)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={() => setSelectedTicket(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>Tutup</button>
              <button onClick={() => window.print()} className="btn btn-accent">Cetak / Simpan PDF</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MyDashboard;
