import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { X, Download, Star, ShoppingBag, Heart, ChevronDown, ChevronUp, CreditCard, ExternalLink, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/getImageUrl';

const MyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'wishlist'
  const [bookings, setBookings] = useState([]);
  const [wishlists, setWishlists] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingWishlists, setIsLoadingWishlists] = useState(false);
  const [expandedPayments, setExpandedPayments] = useState({});

  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTripId, setReviewTripId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  function fetchPaymentMethods() {
    api.get('/payment-methods').then(res => setPaymentMethods(res.data)).catch(console.error);
  }

  function fetchBookings() {
    setIsLoadingBookings(true);
    api.get('/my-bookings')
       .then(res => setBookings(res.data))
       .catch(err => console.error(err))
       .finally(() => setIsLoadingBookings(false));
  }

  function fetchWishlists() {
    setIsLoadingWishlists(true);
    api.get('/wishlist')
       .then(res => setWishlists(res.data || []))
       .catch(err => console.error(err))
       .finally(() => setIsLoadingWishlists(false));
  }

  const handleRemoveWishlist = async (tripId) => {
    try {
      await api.post(`/wishlist/${tripId}`);
      setWishlists(prev => prev.filter(w => w.trip.id !== tripId));
    } catch (err) {
      console.error(err);
    }
  };

  const togglePaymentDetails = (bookingId) => {
    setExpandedPayments(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  function fetchSettings() {
    api.get('/settings')
      .then(res => setSiteSettings(res.data))
      .catch(console.error);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
      fetchWishlists();
      fetchSettings();
      fetchPaymentMethods();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('tripId', reviewTripId);
    formData.append('rating', rating);
    formData.append('comment', comment);

    try {
      await api.post('/reviews', formData);
      alert('Ulasan Anda berhasil dikirim! Terima kasih.');
      setShowReviewModal(false);
      setRating(5);
      setComment('');
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

  const [nowTimestamp] = useState(() => Date.now());

  const canCancelBooking = (booking) => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') return false;
    if (!booking.trip?.date) return false;
    const diffHours = (new Date(booking.trip.date).getTime() - nowTimestamp) / (1000 * 60 * 60);
    return diffHours >= 72;
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Pembatalan mandiri hanya berlaku minimal H-3 keberangkatan dan tidak dapat diubah kembali.')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      alert('Pesanan berhasil dibatalkan.');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membatalkan pesanan.');
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
      <h1 style={{ color: 'var(--text-main)', fontFamily: 'Cormorant Garamond, serif', fontSize: '2.75rem', fontWeight: 500, marginBottom: '8px' }}>Dashboard Saya</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Kelola tiket, riwayat pembayaran, dan trip impian Anda di sini.</p>

      {/* Feature 6: Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 18px',
            fontSize: '15px',
            fontWeight: activeTab === 'bookings' ? '700' : '500',
            color: activeTab === 'bookings' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: activeTab === 'bookings' ? '3px solid var(--accent)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <ShoppingBag size={18} />
          Pesanan Saya ({bookings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 18px',
            fontSize: '15px',
            fontWeight: activeTab === 'wishlist' ? '700' : '500',
            color: activeTab === 'wishlist' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: activeTab === 'wishlist' ? '3px solid var(--accent)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Heart size={18} fill={activeTab === 'wishlist' ? 'var(--accent)' : 'none'} />
          Wishlist Saya ({wishlists.length})
        </button>
      </div>

      {activeTab === 'bookings' && (
        isLoadingBookings ? (
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
              const isExpanded = !!expandedPayments[b.id];
              const verifiedPaid = b.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
              const remainingBalance = Math.max(0, b.totalPrice - verifiedPaid);

              return (
              <div key={b.id} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>{b.trip.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {b.pax} Pax &bull; Total: Rp {b.totalPrice.toLocaleString()}
                    </p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`badge ${b.status}`} style={{ opacity: 0.9 }}>Status: {b.status.toUpperCase()}</span>
                      {hasPayment && b.status !== 'confirmed' && <span className="badge pending" style={{ opacity: 0.9 }}>Menunggu Verifikasi</span>}
                    </div>
                  </div>

                  <div>
                    {b.status === 'pending' && !hasPayment && (
                      <button 
                        className="btn btn-accent" 
                        style={{ padding: '8px 16px', marginBottom: '8px' }} 
                        onClick={() => {
                          setSelectedBooking(b);
                          if (b.paymentMethodId) setSelectedMethodId(b.paymentMethodId.toString());
                          else if (paymentMethods.length > 0) setSelectedMethodId(paymentMethods[0].id.toString());
                        }}
                      >
                        Bayar Sekarang
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {b.status === 'confirmed' && (
                        <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => setSelectedTicket(b)}>Lihat E-Ticket</button>
                      )}
                      {b.status === 'confirmed' && (
                        <button 
                          className="btn" 
                          style={{ padding: '8px 16px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text-main)' }} 
                          onClick={() => { setReviewTripId(b.tripId); setShowReviewModal(true); }}
                        >
                          Beri Ulasan
                        </button>
                      )}
                      {canCancelBooking(b) && (
                        <button 
                          className="btn" 
                          style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '13px' }} 
                          onClick={() => handleCancelBooking(b.id)}
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feature 9: Riwayat Pembayaran Detail Toggle */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => togglePaymentDetails(b.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 0'
                    }}
                  >
                    <CreditCard size={15} />
                    Riwayat & Rincian Pembayaran ({b.payments?.length || 0})
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ marginTop: '12px', background: 'var(--bg-light)', padding: '16px', borderRadius: '10px' }}
                    >
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Daftar Pembayaran / Cicilan
                      </h4>
                      {(!b.payments || b.payments.length === 0) ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Belum ada transaksi pembayaran yang dicatat.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {b.payments.map((p, idx) => {
                            const isPaid = p.status === 'paid';
                            const isPendingVerif = p.status === 'pending_verification';
                            const badgeColor = isPaid ? '#16a34a' : isPendingVerif ? '#b45309' : '#64748b';
                            const badgeBg = isPaid ? '#dcfce7' : isPendingVerif ? '#fef3c7' : '#f1f5f9';
                            const label = isPaid ? 'Terverifikasi' : isPendingVerif ? 'Menunggu Verifikasi' : 'Belum Dibayar';

                            return (
                              <div 
                                key={p.id || idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'var(--bg-white)',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  flexWrap: 'wrap',
                                  gap: '8px'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                                    Rp {p.amount.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Metode: {p.method} &bull; {new Date(p.paymentDate || p.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: badgeColor, background: badgeBg, padding: '3px 8px', borderRadius: '12px' }}>
                                    {label}
                                  </span>
                                  {p.proofUrl && (
                                    <a
                                      href={getImageUrl(p.proofUrl)}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ fontSize: '12px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 500 }}
                                    >
                                      Bukti <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed var(--border)', paddingTop: '10px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Total Biaya: <strong>Rp {b.totalPrice.toLocaleString()}</strong></span>
                        <span>Total Terbayar: <strong style={{ color: '#16a34a' }}>Rp {verifiedPaid.toLocaleString()}</strong></span>
                        {remainingBalance > 0 ? (
                          <span>Sisa Pembayaran: <strong style={{ color: '#dc2626' }}>Rp {remainingBalance.toLocaleString()}</strong></span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ LUNAS</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )
      )}

      {/* Feature 6: Tab Wishlist Content */}
      {activeTab === 'wishlist' && (
        isLoadingWishlists ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
                <div className="skeleton" style={{ width: '120px', height: '90px', borderRadius: '8px' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-title" style={{ width: '50%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : wishlists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Heart size={40} color="var(--accent)" />
            </div>
            <h2>Wishlist Masih Kosong</h2>
            <p>Belum ada trip favorit yang Anda simpan. Temukan destinasi seru dan simpan untuk nanti!</p>
            <a href="/explore" className="btn btn-primary">Jelajahi Trip Sekarang</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {wishlists.map(item => {
              const trip = item.trip;
              const remainingPax = Math.max(0, trip.quota - (trip.currentPax || 0));
              return (
                <div key={item.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: '260px' }}>
                    <img
                      src={trip.image ? getImageUrl(trip.image) : "https://images.unsplash.com/photo-1518182170546-076616fd628a?auto=format&fit=crop&q=80&w=400"}
                      alt={trip.title}
                      style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'var(--text-main)' }}>{trip.title}</h3>
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                        {trip.destination} &bull; {trip.duration} &bull; Rp {trip.price.toLocaleString()}
                      </p>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: remainingPax === 0 ? '#b91c1c' : remainingPax <= 3 ? '#b45309' : '#047857',
                        background: remainingPax === 0 ? '#fee2e2' : remainingPax <= 3 ? '#fef3c7' : '#d1fae5',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}>
                        {remainingPax === 0 ? '🔒 Penuh' : `Sisa ${remainingPax} seat`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '8px 16px' }}
                      onClick={() => navigate(`/trip/${trip.id}`)}
                    >
                      Lihat Detail Trip
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus dari wishlist"
                      onClick={() => handleRemoveWishlist(trip.id)}
                      title="Hapus dari Wishlist"
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
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
              <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Upload Bukti Pembayaran</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                Total Tagihan: <strong>Rp {selectedBooking.totalPrice.toLocaleString()}</strong>
              </p>
              
              <form onSubmit={handleUploadPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Pilih Metode Pembayaran</label>
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
                             src={getImageUrl(paymentMethods.find(m => m.id.toString() === selectedMethodId.toString())?.imageUrl)} 
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>File Bukti (Image/PDF)</label>
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
                  src={siteSettings?.logoUrl ? getImageUrl(siteSettings.logoUrl) : "/logo.jpg"} 
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
              <h3 style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Tulis Ulasan Perjalanan</h3>
              
              <form onSubmit={handleReviewSubmit} style={{ display: 'grid', gap: '20px' }}>
                 <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Rating Anda</label>
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>Komentar</label>
                    <textarea 
                      className="input" 
                      rows="4" 
                      placeholder="Ceritakan pengalaman seru Anda..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    ></textarea>
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
