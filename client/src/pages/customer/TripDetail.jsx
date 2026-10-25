import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MapPin, Star, MessageSquare, Image as ImageIcon, Clock, Share2, Heart, Copy, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/getImageUrl';
import { LayeredStack } from '../../components/ui/LayeredStack';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pax, setPax] = useState(1);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Feature 6: Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Feature 7: Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feature 8: Gallery Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    api.get(`/trips/${id}`)
      .then(res => setTrip(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
    
    api.get('/payment-methods')
      .then(res => {
        setPaymentMethods(res.data);
        if (res.data.length > 0) setSelectedMethod(res.data[0]);
      })
      .catch(console.error);

    const token = localStorage.getItem('token');
    if (token && id) {
      api.get('/wishlist/ids')
        .then(res => {
          if (Array.isArray(res.data)) {
            setIsWishlisted(res.data.includes(parseInt(id)));
          }
        })
        .catch(() => {});
    }
  }, [id]);

  const toggleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (window.confirm('Silakan masuk ke akun Anda untuk menyimpan trip ke wishlist. Masuk sekarang?')) {
        navigate('/login');
      }
      return;
    }
    try {
      const res = await api.post(`/wishlist/${trip.id}`);
      setIsWishlisted(!!res.data?.wishlisted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!trip) return;
    const text = `Halo! Yuk cek trip seru "${trip.title}" ke ${trip.destination} di Skena Trip:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (!trip) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.title,
          text: `Trip ke ${trip.destination} bersama Skena Trip`,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') handleCopyLink();
      }
    } else {
      setShowShareModal(true);
    }
  };

  const [bookingMsg, setBookingMsg] = useState({ text: '', type: '' });

  const confirmBooking = async () => {
    setLoading(true);
    setBookingMsg({ text: '', type: '' });
    try {
      await api.post('/bookings', { 
        tripId: trip.id, 
        pax, 
        promoCode: appliedPromo ? appliedPromo.code : null,
        paymentMethodId: selectedMethod?.id 
      });
      setBookingMsg({ text: 'Pemesanan berhasil! Mengarahkan ke Dashboard...', type: 'success' });
      setTimeout(() => navigate('/my-dashboard'), 2000);
    } catch (error) {
      const isIncomplete = error.response?.data?.incompleteProfile;
      setBookingMsg({ 
        text: error.response?.data?.message || error.response?.data?.error || 'Gagal melakukan pemesanan', 
        type: 'error',
        incomplete: isIncomplete
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePromo = async () => {
    if (!promoCode) return;
    setPromoError('');
    try {
      const res = await api.post('/promos/validate', { code: promoCode });
      setAppliedPromo({ code: promoCode, discountAmount: res.data.discountAmount, discountType: res.data.discountType });
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Promo tidak valid');
      setAppliedPromo(null);
    }
  };

  const galleryImages = (() => {
    if (!trip) return [];
    let list = [];
    if (Array.isArray(trip.images)) {
      list = trip.images;
    } else if (typeof trip.images === 'string') {
      try { list = JSON.parse(trip.images); } catch { list = []; }
    }
    if (list.length === 0 && trip.image) {
      list = [trip.image];
    }
    return list;
  })();

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && galleryImages.length > 1) {
        setLightboxIndex(prev => (prev + 1) % galleryImages.length);
      }
      if (e.key === 'ArrowLeft' && galleryImages.length > 1) {
        setLightboxIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryImages.length]);

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ width: '300px' }}>
            <div className="skeleton skeleton-title" style={{ width: '100%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          </div>
          <div className="skeleton" style={{ width: '150px', height: '44px', borderRadius: '12px' }}></div>
        </div>
        
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
          <div>
            <div className="skeleton" style={{ width: '100%', height: '450px', borderRadius: '16px', marginBottom: '32px' }}></div>
            <div className="card" style={{ padding: '32px' }}>
               <div className="skeleton skeleton-title" style={{ width: '30%' }}></div>
               <div className="skeleton skeleton-text"></div>
               <div className="skeleton skeleton-text"></div>
               <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div>
            <div className="card" style={{ padding: '24px' }}>
               <div className="skeleton skeleton-title"></div>
               <div className="skeleton" style={{ height: '60px', width: '100%', marginBottom: '20px' }}></div>
               <div className="skeleton skeleton-text"></div>
               <div className="skeleton skeleton-text"></div>
               <div className="skeleton" style={{ height: '50px', width: '100%', marginTop: '20px' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Trip tidak ditemukan</div>;

  const currentPax = trip.currentPax || 0;
  const isFull = currentPax >= trip.quota;
  const remainingSeats = Math.max(0, trip.quota - currentPax);

  const subTotal = Math.round(trip.price * pax);
  const promoValue = appliedPromo?.discountType === 'percentage' 
                     ? Math.round(subTotal * (appliedPromo.discountAmount / 100)) 
                     : Math.round(appliedPromo?.discountAmount || 0);
  const finalTotal = appliedPromo ? Math.max(0, subTotal - promoValue) : subTotal;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="container" 
      style={{ paddingTop: '100px', paddingBottom: '100px' }}
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 style={{ color: 'var(--text-main)', fontFamily: 'Cormorant Garamond, serif', fontSize: '2.75rem', fontWeight: 500, lineHeight: '1.2' }}>{trip.title}</h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16}/> {trip.destination} &bull; {trip.duration}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {trip.avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-white)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
               <Star size={20} color="#eab308" fill="#eab308" />
               <span style={{ fontWeight: '700', fontSize: '18px' }}>{trip.avgRating.toFixed(1)}</span>
               <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>({trip.reviews?.length} Ulasan)</span>
            </div>
          )}

          {/* Feature 6: Wishlist button */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label="Wishlist"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: isWishlisted ? '#fee2e2' : 'var(--bg-white)',
              color: isWishlisted ? '#dc2626' : 'var(--text-main)',
              border: '1px solid ' + (isWishlisted ? '#fca5a5' : 'var(--border)'),
              cursor: 'pointer'
            }}
          >
            <Heart size={18} fill={isWishlisted ? '#dc2626' : 'none'} color={isWishlisted ? '#dc2626' : 'currentColor'} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{isWishlisted ? 'Tersimpan' : 'Favorit'}</span>
          </button>

          {/* Feature 7: Share button */}
          <button
            type="button"
            onClick={handleNativeShare}
            aria-label="Bagikan"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'var(--bg-white)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            <Share2 size={18} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Bagikan</span>
          </button>
        </div>
      </motion.div>
      
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Feature 8: Foto Trip & Galeri Lightbox */}
          <div style={{ marginBottom: '48px', position: 'relative', zIndex: 10 }}>
            {galleryImages.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <LayeredStack 
                  className="w-full" 
                  style={{ 
                    minHeight: '450px', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '20px',
                    padding: '20px',
                    background: 'var(--bg-light)',
                    borderRadius: '16px'
                  }}
                >
                  {galleryImages.map((img, i) => (
                    <img 
                      key={i} 
                      src={getImageUrl(img)} 
                      alt={`Trip Image ${i + 1}`}
                      onClick={() => setLightboxIndex(i)}
                      title="Klik untuk perbesar foto"
                      style={{ 
                        width: '100%', 
                        aspectRatio: '3/4', 
                        objectFit: 'cover', 
                        borderRadius: '12px', 
                        boxShadow: 'var(--shadow-lg)',
                        border: '4px solid white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }} 
                    />
                  ))}
                </LayeredStack>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    zIndex: 25,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <ImageIcon size={16} /> Lihat Semua ({galleryImages.length} Foto)
                </button>
              </div>
            ) : (
              <div style={{ height: '450px', width: '100%', background: 'var(--bg-light)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                <ImageIcon size={64} strokeWidth={1} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Foto Petualangan Belum Tersedia</span>
              </div>
            )}
          </div>
          
          <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Deskripsi</h3>
            <p style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>{trip.description}</p>
          </div>

          {/* Itinerary Timeline */}
          {trip.itinerary?.length > 0 && (
            <div style={{ marginTop: '48px', marginBottom: '48px' }}>
              <h3 style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={24} color="var(--accent)" /> Itinerary Perjalanan
              </h3>
              
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                style={{ display: 'grid', gap: '32px' }}
              >
                {Object.entries(
                  trip.itinerary
                    .sort((a, b) => (a.day - b.day) || a.time.localeCompare(b.time))
                    .reduce((acc, item) => {
                      if (!acc[item.day]) acc[item.day] = [];
                      acc[item.day].push(item);
                      return acc;
                    }, {})
                ).map(([day, items]) => (
                  <div key={day}>
                    {/* Day Badge */}
                    <div style={{ marginBottom: '24px' }}>
                       <span style={{ 
                         background: 'var(--accent)', 
                         color: 'white', 
                         padding: '6px 16px', 
                         borderRadius: '100px', 
                         fontSize: '13px', 
                         fontWeight: '800',
                         boxShadow: 'var(--shadow-md)'
                       }}>
                         HARI {day}
                       </span>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '32px' }}>
                      {/* Vertical Line */}
                      <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)', zIndex: 0 }}></div>
                      
                      <div style={{ display: 'grid', gap: '40px' }}>
                        {items.map((item) => (
                          <motion.div 
                            key={item.id} 
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            style={{ position: 'relative' }}
                          >
                            {/* Timeline Dot */}
                            <div style={{ 
                              position: 'absolute', 
                              left: '-32px', 
                              top: '4px', 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%', 
                              background: 'var(--accent)', 
                              border: '4px solid var(--bg-white)',
                              boxShadow: '0 0 0 1px var(--border)',
                              zIndex: 1
                            }}></div>

                            <div>
                               <div style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {item.time}
                               </div>
                               <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                                  {item.activity}
                               </div>
                               {item.description && (
                                 <div style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    {item.description}
                                 </div>
                               )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Reviews Section */}
          <div style={{ marginTop: '48px' }}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={24} color="var(--accent)" /> Ulasan Pelanggan
            </h3>
            
            {(!trip.reviews || trip.reviews.length === 0) ? (
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <div className="empty-state-icon">
                  <MessageSquare size={32} />
                </div>
                <h3>Belum ada ulasan</h3>
                <p>Jadilah yang pertama memberikan ulasan untuk petualangan ini!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '24px' }}>
                {trip.reviews.map(review => (
                  <div key={review.id} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                          {review.user.profilePicUrl ? (
                            <img src={getImageUrl(review.user.profilePicUrl)} alt={review.user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : review.user.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{review.user.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} color={i < review.rating ? '#eab308' : 'var(--border)'} fill={i < review.rating ? '#eab308' : 'transparent'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ lineHeight: '1.6', marginBottom: review.imageUrl ? '16px' : 0 }}>{review.comment}</p>
                    {review.imageUrl && (
                      <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={getImageUrl(review.imageUrl)} alt="Review Photo" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(getImageUrl(review.imageUrl), '_blank')} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '8px' }}>Detail Harga</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '24px' }}>
              Rp {trip.price.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ pax</span>
            </p>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Jumlah Peserta (Pax):</label>
              <input 
                type="number" 
                min="1" 
                max={trip.quota} 
                value={pax} 
                onChange={(e) => setPax(e.target.value)}
                className="input"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>Kode Promo:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={promoCode} 
                  onChange={(e) => { setPromoCode(e.target.value); setAppliedPromo(null); setPromoError(''); }}
                  className="input"
                  placeholder="Masukkan kode promo"
                  style={{ textTransform: 'uppercase' }}
                />
                <button onClick={validatePromo} className="btn" style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>Pakai</button>
              </div>
              {promoError && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>{promoError}</p>}
              {appliedPromo && <p style={{ color: '#059669', fontSize: '12px', marginTop: '8px' }}>Promo berhasil digunakan! (-{appliedPromo.discountType === 'percentage' ? appliedPromo.discountAmount + '%' : 'Rp ' + appliedPromo.discountAmount.toLocaleString()})</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>Rp {subTotal.toLocaleString()}</span>
            </div>
            
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#059669' }}>
                <span>Diskon Promo:</span>
                <span>-Rp {promoValue.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Total Pembayaran:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '20px' }}>Rp {finalTotal.toLocaleString()}</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: 'var(--text-main)' }}>Pilih Metode Pembayaran:</label>
              <div style={{ display: 'grid', gap: '10px' }}>
                {paymentMethods.map(method => (
                  <div 
                    key={method.id} 
                    onClick={() => setSelectedMethod(method)}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '10px', 
                      border: `2px solid ${selectedMethod?.id === method.id ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      background: selectedMethod?.id === method.id ? 'rgba(201, 115, 58, 0.1)' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{method.name}</div>
                    {selectedMethod?.id === method.id && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                        {method.type === 'qris' ? (
                          <div style={{ textAlign: 'center' }}>
                            <img src={getImageUrl(method.imageUrl)} alt="QRIS" style={{ width: '100%', maxWidth: '150px', marginBottom: '8px' }} />
                            <p>Scan QR di atas untuk membayar</p>
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginBottom: '4px' }}><strong>No. Rek:</strong> {method.accountNo}</div>
                            <div><strong>A.N:</strong> {method.accountName}</div>
                          </div>
                        )}
                        {method.instruction && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>{method.instruction}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              disabled={loading || isFull || !selectedMethod}
              onClick={confirmBooking}
            >
              {loading ? 'Memproses...' : isFull ? 'Trip Penuh' : 'Bayar Sekarang'}
            </button>


            {bookingMsg.text && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                borderRadius: '8px', 
                background: bookingMsg.type === 'error' ? '#fee2e2' : '#d1fae5', 
                color: bookingMsg.type === 'error' ? '#dc2626' : '#059669', 
                fontSize: '13px', 
                fontWeight: '600',
                border: `1px solid ${bookingMsg.type === 'error' ? '#fecaca' : '#34d399'}`
              }}>
                {bookingMsg.text}
                {bookingMsg.incomplete && (
                  <button 
                    onClick={() => navigate('/profile')}
                    style={{ 
                      display: 'block', 
                      marginTop: '10px', 
                      background: '#dc2626', 
                      color: 'white', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      fontSize: '12px',
                      fontWeight: '700',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  >
                    Lengkapi Profil Sekarang
                  </button>
                )}
              </div>
            )}
            <p style={{ textAlign: 'center', fontSize: '12px', color: isFull ? '#dc2626' : 'var(--text-muted)', marginTop: '12px', fontWeight: isFull ? '600' : '400' }}>
              {isFull ? 'Maaf, kuota sudah habis terjual!' : `Sisa Kuota: ${remainingSeats} kursi lagi`}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Feature 7: Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 1500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{ maxWidth: '420px', width: '100%', padding: '24px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Bagikan Trip</h3>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Ajak teman atau keluarga ikut menjelajahi {trip.destination}!
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleShareWhatsApp}
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontWeight: 600,
                    padding: '12px',
                    borderRadius: '8px'
                  }}
                >
                  Bagikan ke WhatsApp
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyLink}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '8px' }}
                >
                  {copied ? <Check size={18} color="#16a34a" /> : <Copy size={18} />}
                  {copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature 8: Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.94)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px'
            }}
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div 
              style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', zIndex: 10, paddingBottom: '12px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ fontSize: '15px', fontWeight: 500, opacity: 0.9 }}>
                {trip.title} &bull; Foto {lightboxIndex + 1} dari {galleryImages.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Stage */}
            <div 
              style={{ position: 'relative', width: '100%', maxWidth: '1100px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
                  aria-label="Foto Sebelumnya"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    zIndex: 20,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <img
                src={getImageUrl(galleryImages[lightboxIndex])}
                alt={`Galeri Foto ${lightboxIndex + 1}`}
                style={{
                  maxHeight: '75vh',
                  maxWidth: '85vw',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                }}
              />

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(prev => (prev + 1) % galleryImages.length)}
                  aria-label="Foto Selanjutnya"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    zIndex: 20,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Strip */}
            {galleryImages.length > 1 && (
              <div 
                style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '90vw', padding: '12px 0', zIndex: 10 }}
                onClick={(e) => e.stopPropagation()}
              >
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    style={{
                      border: idx === lightboxIndex ? '2px solid #fff' : '2px solid transparent',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      opacity: idx === lightboxIndex ? 1 : 0.5,
                      cursor: 'pointer',
                      padding: 0,
                      background: 'none',
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '56px', height: '42px', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TripDetail;
