import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, SortAsc } from 'lucide-react';
import lottieModule from 'lottie-react';
import { motion } from 'framer-motion';

const Lottie = lottieModule.default || lottieModule;
import { getImageUrl } from '../../utils/getImageUrl';

import emptyAnim from '../../assets/empty-trip.json';
import { ShowcaseCard } from '../../components/ui/ShowcaseCard';

const Explore = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, date-near, popular
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/wishlist/ids')
      .then(res => setWishlistIds(res.data || []))
      .catch(() => {});
  }, []);

  const handleToggleWishlist = async (tripId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (window.confirm('Silakan masuk ke akun Anda untuk menyimpan trip ke wishlist. Masuk sekarang?')) {
        navigate('/login');
      }
      return;
    }
    try {
      const res = await api.post(`/wishlist/${tripId}`);
      if (res.data?.wishlisted) {
        setWishlistIds(prev => [...prev, tripId]);
      } else {
        setWishlistIds(prev => prev.filter(id => id !== tripId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getQuotaBadge = (trip) => {
    const currentPax = trip.currentPax || 0;
    const remaining = Math.max(0, trip.quota - currentPax);
    if (remaining === 0) {
      return { 
        text: '🔒 PENUH', 
        color: 'var(--status-danger-text)', 
        bg: 'var(--status-danger-bg)', 
        borderColor: 'var(--status-danger-border)' 
      };
    }
    if (remaining <= 3) {
      return { 
        text: `⚡ Sisa ${remaining} Kursi!`, 
        color: 'var(--status-warning-text)', 
        bg: 'var(--status-warning-bg)', 
        borderColor: 'var(--status-warning-border)' 
      };
    }
    return { 
      text: `✓ Sisa ${remaining} Kursi`, 
      color: 'var(--status-success-text)', 
      bg: 'var(--status-success-bg)', 
      borderColor: 'var(--status-success-border)' 
    };
  };

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      setLoading(true);
      api.get('/trips', {
        params: {
          page,
          limit: 9,
          search: searchTerm.trim() || undefined,
          sortBy
        }
      })
        .then(res => {
          if (!isMounted) return;
          if (res.data?.data && res.data?.pagination) {
            setTrips(res.data.data);
            setPagination(res.data.pagination);
          } else if (Array.isArray(res.data)) {
            setTrips(res.data);
            setPagination({ page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 });
          }
        })
        .catch(console.error)
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [page, searchTerm, sortBy]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  return (
    <div className="container" style={{ paddingTop: '16px', paddingBottom: '80px', minHeight: '80vh' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '24px', color: 'var(--text-main)', fontFamily: 'Cormorant Garamond, serif', fontSize: '2.75rem', fontWeight: 500 }}>Katalog Trip</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: 'var(--bg-white)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} className="grid-responsive">
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={20} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
            <input 
              type="text" 
              placeholder="Cari nama atau destinasi..." 
              className="input" 
              style={{ paddingLeft: '48px', width: '100%', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Sorting */}
          <div style={{ position: 'relative' }}>
            <SortAsc size={18} color="var(--primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
            <select 
              className="input" 
              style={{ paddingLeft: '40px', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text-main)', width: '100%' }}
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="newest">Terbaru</option>
              <option value="price-low">Harga Termurah</option>
              <option value="date-near">Tanggal Terdekat</option>
              <option value="popular">Terpopuler</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
              <div style={{ padding: '24px', flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                <div className="skeleton skeleton-title" style={{ width: '90%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '16px' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <div className="skeleton" style={{ height: '32px', width: '80px' }}></div>
                  <div className="skeleton" style={{ height: '32px', width: '60px' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <div style={{ width: '250px', height: '250px', margin: '0 auto' }}>
            <Lottie 
              animationData={emptyAnim} 
              loop={true}
            />
          </div>
          <h2>Trip tidak ditemukan</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto' }}>
            Kami tidak menemukan perjalanan yang cocok dengan pencarian atau filter Anda. Coba gunakan kata kunci lain.
          </p>
          <button className="btn btn-primary" onClick={() => { setSearchTerm(''); setSortBy('newest'); setPage(1); }}>
            Reset Pencarian
          </button>
        </div>
      ) : (
        <>
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}
          >
            {trips.map(trip => (
              <motion.div 
                key={trip.id} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <ShowcaseCard
                  tagline={`${trip.duration} | ${trip.currentPax}/${trip.quota} Pax`}
                  quotaBadge={getQuotaBadge(trip)}
                  isWishlisted={wishlistIds.includes(trip.id)}
                  onWishlistClick={() => handleToggleWishlist(trip.id)}
                  heading={trip.title}
                  description={trip.destination}
                  imageUrl={trip.image ? getImageUrl(trip.image) : "https://images.unsplash.com/photo-1518182170546-076616fd628a?auto=format&fit=crop&q=80&w=800"}
                  ctaText={`Detail Rp ${trip.price.toLocaleString()}`}
                  onCtaClick={() => navigate(`/trip/${trip.id}`)}
                  brandName={new Date(trip.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  services={trip.currentPax >= trip.quota ? ["PENUH"] : [`SISA ${Math.max(0, trip.quota - (trip.currentPax || 0))} SEAT`]}
                />
              </motion.div>
            ))}
          </motion.div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '48px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                Sebelumnya
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, padding: '0 8px', textAlign: 'center' }}>
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} trip)
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                style={{ opacity: page >= pagination.totalPages ? 0.5 : 1, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
