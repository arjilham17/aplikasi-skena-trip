import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [pax, setPax] = useState(1);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    api.get(`/trips/${id}`).then(res => setTrip(res.data)).catch(console.error);
  }, [id]);

  const handleBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Silakan login terlebih dahulu untuk memesan.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', { tripId: trip.id, pax, promoCode: appliedPromo ? appliedPromo.code : null });
      alert('Pemesanan berhasil! Anda akan diarahkan ke Dashboard.');
      navigate('/my-dashboard');
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal melakukan pemesanan');
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

  if (!trip) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;

  const subTotal = Math.round(trip.price * pax);
  const promoValue = appliedPromo?.discountType === 'percentage' 
                     ? Math.round(subTotal * (appliedPromo.discountAmount / 100)) 
                     : Math.round(appliedPromo?.discountAmount || 0);
  const finalTotal = appliedPromo ? Math.max(0, subTotal - promoValue) : subTotal;

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <h1>{trip.title}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{trip.destination} &bull; {trip.duration}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '24px' }}>
        <div>
          <img src={trip.image ? `http://localhost:3001${trip.image}` : "https://images.unsplash.com/photo-1518182170546-076616fd628a?auto=format&fit=crop&q=80&w=800"} alt="Trip" style={{ width: '100%', borderRadius: '16px', marginBottom: '24px', objectFit: 'cover', maxHeight: '400px', objectPosition: trip.imagePosition || 'center' }} />
          <h3>Deskripsi</h3>
          <p style={{ marginTop: '12px', lineHeight: '1.8' }}>{trip.description}</p>
        </div>

        <div>
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

            <button 
              className="btn btn-accent" 
              style={{ width: '100%', padding: '16px' }}
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Booking Sekarang'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Sisa Kuota: {trip.quota} kursi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
