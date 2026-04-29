import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MapPin, Star, Calendar, MessageSquare, Image as ImageIcon, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
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
  }, [id]);

  const [bookingMsg, setBookingMsg] = useState({ text: '', type: '' });

  const handleBooking = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setBookingMsg({ text: 'Silakan login terlebih dahulu untuk memesan.', type: 'error' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setShowPaymentModal(true);
  };

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
      setShowPaymentModal(false);
      setBookingMsg({ text: 'Pemesanan berhasil! Mengarahkan ke Dashboard...', type: 'success' });
      setTimeout(() => navigate('/my-dashboard'), 2000);
    } catch (error) {
      const isIncomplete = error.response?.data?.incompleteProfile;
      setBookingMsg({ 
        text: error.response?.data?.message || error.response?.data?.error || 'Gagal melakukan pemesanan', 
        type: 'error',
        incomplete: isIncomplete
      });
      setShowPaymentModal(false);
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
          <h1>{trip.title}</h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16}/> {trip.destination} &bull; {trip.duration}
          </p>
        </div>
        {trip.avgRating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-white)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
             <Star size={20} color="#eab308" fill="#eab308" />
             <span style={{ fontWeight: '700', fontSize: '18px' }}>{trip.avgRating.toFixed(1)}</span>
             <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>({trip.reviews?.length} Ulasan)</span>
          </div>
        )}
      </motion.div>
      
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ height: '450px', width: '100%', background: 'var(--bg-light)', borderRadius: '16px', overflow: 'hidden', position: 'relative', marginBottom: '32px' }}>
            {trip.image ? (
              <img 
                src={`http://localhost:3001${trip.image}`} 
                alt="Trip" 
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: trip.imagePosition || 'center' }} 
              />
            ) : null}
            <div 
              style={{ 
                display: trip.image ? 'none' : 'flex', 
                width: '100%', 
                height: '100%', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '16px',
                color: 'var(--text-muted)'
              }}
            >
              <ImageIcon size={64} strokeWidth={1} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Foto Petualangan Belum Tersedia</span>
            </div>
          </div>
          
          <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px' }}>Deskripsi</h3>
            <p style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>{trip.description}</p>
          </div>

          {/* Itinerary Timeline */}
          {trip.itinerary?.length > 0 && (
            <div style={{ marginTop: '48px', marginBottom: '48px' }}>
              <h3 style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={24} color="var(--primary)" /> Itinerary Perjalanan
              </h3>
              
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2 }
                  }
                }}
                style={{ position: 'relative', paddingLeft: '32px' }}
              >
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)', zIndex: 0 }}></div>
                
                <div style={{ display: 'grid', gap: '40px' }}>
                  {trip.itinerary.map((item, index) => (
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
                        background: 'var(--primary)', 
                        border: '4px solid white',
                        boxShadow: '0 0 0 1px var(--border)',
                        zIndex: 1
                      }}></div>

                      <div>
                         <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              </motion.div>
            </div>
          )}

          {/* Reviews Section */}
          <div style={{ marginTop: '48px' }}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={24} color="var(--primary)" /> Ulasan Pelanggan
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
                            <img src={`http://localhost:3001${review.user.profilePicUrl}`} alt={review.user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
                        <img src={`http://localhost:3001${review.imageUrl}`} alt="Review Photo" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(`http://localhost:3001${review.imageUrl}`, '_blank')} />
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Kode Promo:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={promoCode} 
                  onChange={(e) => { setPromoCode(e.target.value); setAppliedPromo(null); setPromoError(''); }}
                  className="input"
                  placeholder="Masukkan kode promo"
                  style={{ textTransform: 'uppercase' }}
                />
                <button onClick={validatePromo} className="btn" style={{ background: 'var(--bg-light)', border: '1px solid var(--border)' }}>Pakai</button>
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
              <span style={{ fontWeight: 'bold' }}>Total Pembayaran:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '20px' }}>Rp {finalTotal.toLocaleString()}</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>Pilih Metode Pembayaran:</label>
              <div style={{ display: 'grid', gap: '10px' }}>
                {paymentMethods.map(method => (
                  <div 
                    key={method.id} 
                    onClick={() => setSelectedMethod(method)}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '10px', 
                      border: `2px solid ${selectedMethod?.id === method.id ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      background: selectedMethod?.id === method.id ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{method.name}</div>
                    {selectedMethod?.id === method.id && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                        {method.type === 'qris' ? (
                          <div style={{ textAlign: 'center' }}>
                            <img src={`http://localhost:3001${method.imageUrl}`} alt="QRIS" style={{ width: '100%', maxWidth: '150px', marginBottom: '8px' }} />
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
    </motion.div>
  );
};

export default TripDetail;
