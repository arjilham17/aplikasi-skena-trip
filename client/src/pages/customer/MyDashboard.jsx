import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Download, Star, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

const MyDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const ticketRef = React.useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTripId, setReviewTripId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchSettings();
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = () => {
    api.get('/payment-methods').then(res => setPaymentMethods(res.data)).catch(console.error);
  };

  const fetchBookings = () => {
    setIsLoadingBookings(true);
    api.get('/my-bookings')
       .then(res => setBookings(res.data))
       .catch(err => console.error(err))
       .finally(() => setIsLoadingBookings(false));
  };

  const fetchSettings = () => {
    setIsLoadingSettings(true);
    api.get('/settings')
      .then(res => setSiteSettings(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingSettings(false));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('tripId', reviewTripId);
    formData.append('rating', rating);
    formData.append('comment', comment);
    if (reviewImage) formData.append('reviewImage', reviewImage);

    try {
      await api.post('/reviews', formData);
      alert('Ulasan Anda berhasil dikirim! Terima kasih.');
      setShowReviewModal(false);
      setRating(5);
      setComment('');
      setReviewImage(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengirim ulasan');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    if (!proofFile) return alert('Silakan pilih file bukti pembayaran');
    
    setLoading(true);
    const formData = new FormData();
    const methodObj = paymentMethods.find(m => m.id === parseInt(selectedMethodId));
    formData.append('bookingId', selectedBooking.id);
    formData.append('amount', selectedBooking.totalPrice);
    formData.append('method', methodObj ? methodObj.name : 'Unknown');
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

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const fileName = siteSettings?.siteName?.replace(/\s+/g, '-') || 'SkenaTrip';
      link.download = `E-Ticket-${fileName}-${selectedTicket.id}.png`;
      link.click();
    } catch (err) {
      console.error('Gagal mengunduh tiket:', err);
      alert('Gagal mengunduh tiket. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
      <h1>Dashboard Saya</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Kelola tiket dan perjalanan Anda di sini.</p>

      {isLoadingBookings ? (
        <div style={{ display: 'grid', gap: '24px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '20%' }}></div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '20px' }}></div>
                </div>
              </div>
              <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShoppingBag size={40} />
          </div>
          <h2>Belum ada pesanan</h2>
          <p>Sepertinya Anda belum merencanakan petualangan apa pun. Mari temukan destinasi impian Anda!</p>
          <a href="/explore" className="btn btn-primary">Eksplorasi Trip Sekarang</a>
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
                    <button 
                      className="btn btn-accent" 
                      style={{ padding: '8px 16px' }} 
                      onClick={() => {
                        setSelectedBooking(b);
                        if (b.paymentMethodId) setSelectedMethodId(b.paymentMethodId.toString());
                        else if (paymentMethods.length > 0) setSelectedMethodId(paymentMethods[0].id.toString());
                      }}
                    >
                      Bayar Sekarang
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {b.status === 'confirmed' && (
                      <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => setSelectedTicket(b)}>Lihat E-Ticket</button>
                    )}
                    {b.status === 'confirmed' && (
                      <button 
                        className="btn" 
                        style={{ padding: '8px 16px', background: 'var(--bg-light)', border: '1px solid var(--border)' }} 
                        onClick={() => { setReviewTripId(b.tripId); setShowReviewModal(true); }}
                      >
                        Beri Ulasan
                      </button>
                    )}
                  </div>
                </div>
            </div>
          )})}
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="card" 
              style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative' }}
            >
              <button onClick={() => setSelectedBooking(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)"/>
              </button>
              <h3 style={{ marginBottom: '16px' }}>Upload Bukti Pembayaran</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                Total Tagihan: <strong>Rp {selectedBooking.totalPrice.toLocaleString()}</strong>
              </p>
              
              <form onSubmit={handleUploadPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Pilih Metode Pembayaran</label>
                  <select 
                    className="input" 
                    value={selectedMethodId} 
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                  >
                    {paymentMethods.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {selectedMethodId && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', fontSize: '13px' }}>
                      {paymentMethods.find(m => m.id.toString() === selectedMethodId.toString())?.type === 'qris' ? (
                        <div style={{ textAlign: 'center' }}>
                           <img 
                             src={`http://localhost:3001${paymentMethods.find(m => m.id.toString() === selectedMethodId.toString())?.imageUrl}`} 
                             alt="QRIS" 
                             style={{ width: '100%', maxWidth: '150px', marginBottom: '8px', borderRadius: '4px' }} 
                           />
                           <p>Scan QRIS untuk membayar</p>
                        </div>
                      ) : (
                        <div>
                          <div><strong>No. Rek:</strong> {paymentMethods.find(m => m.id.toString() === selectedMethodId.toString())?.accountNo}</div>
                          <div><strong>A.N:</strong> {paymentMethods.find(m => m.id.toString() === selectedMethodId.toString())?.accountName}</div>
                        </div>
                      )}
                    </div>
                  )}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* E-Ticket Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="no-print" 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              ref={ticketRef} 
              className="ticket-print-area card" 
              style={{ width: '100%', maxWidth: '600px', background: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'none' }}
            >
            {/* Ticket Header */}
            <div style={{ background: 'var(--primary)', color: 'white', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={siteSettings?.logoUrl ? `http://localhost:3001${siteSettings.logoUrl}` : "/logo.jpg"} 
                  alt="Logo" 
                  style={{ height: '40px', background: 'white', borderRadius: '4px', padding: '4px', minWidth: '40px', objectFit: 'contain' }} 
                />
                <h2 style={{ margin: 0 }}>E-Ticket {siteSettings?.siteName || 'Skena Trip'}</h2>
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
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${(siteSettings?.siteName || 'SKENATRIP').toUpperCase().replace(/\s+/g, '-')}-BK-${selectedTicket.id}`} alt="QR Code" style={{ width: '80px', height: '80px' }} />
              </div>
            </div>
            
            {/* Action Buttons (Hidden on Print) */}
            <div className="no-print" style={{ padding: '16px 32px', background: 'var(--bg-light)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={() => setSelectedTicket(null)} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>Tutup</button>
              <button onClick={handleDownloadTicket} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={downloading}>
                {downloading ? 'Mengunduh...' : <><Download size={18}/> Unduh Tiket (.png)</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card" 
              style={{ width: '100%', maxWidth: '450px', padding: '32px', position: 'relative' }}
            >
              <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)"/>
              </button>
              <h3 style={{ marginBottom: '24px' }}>Tulis Ulasan Perjalanan</h3>
              
              <form onSubmit={handleReviewSubmit} style={{ display: 'grid', gap: '20px' }}>
                 <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>Rating Anda</label>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={32} 
                          style={{ cursor: 'pointer' }}
                          color={star <= rating ? '#eab308' : 'var(--border)'} 
                          fill={star <= rating ? '#eab308' : 'transparent'}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>
                 </div>

                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Komentar</label>
                    <textarea 
                      className="input" 
                      rows="4" 
                      placeholder="Ceritakan pengalaman seru Anda..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    ></textarea>
                 </div>

                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Foto Trip (Opsional)</label>
                    <label className="btn" style={{ width: '100%', background: 'var(--bg-light)', border: '1px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <ImageIcon size={18}/> {reviewImage ? reviewImage.name : 'Pilih Foto'}
                      <input type="file" hidden accept="image/*" onChange={(e) => setReviewImage(e.target.files[0])} />
                    </label>
                 </div>

                 <button type="submit" className="btn btn-primary" style={{ padding: '12px' }} disabled={loading}>
                   {loading ? 'Mengirim...' : 'Kirim Ulasan'}
                 </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyDashboard;
