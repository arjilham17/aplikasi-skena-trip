import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MapPin, Search, ChevronDown, SortAsc, Calendar, Users, Image as ImageIcon } from 'lucide-react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/getImageUrl';

import emptyAnim from '../../assets/empty-trip.json';
import { ShowcaseCard } from '../../components/ui/ShowcaseCard';

const Explore = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, date-near, popular

  useEffect(() => {
    setLoading(true);
    api.get('/trips')
      .then(res => setTrips(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAndSortedTrips = trips
    .filter(trip => {
      return trip.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'date-near') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'popular') return (b.currentPax || 0) - (a.currentPax || 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '80vh' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '24px', color: 'var(--text-main)', fontFamily: 'Cormorant Garamond, serif', fontSize: '2.75rem', fontWeight: 500 }}>Katalog Trip</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', background: 'var(--bg-white)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} className="grid-responsive">
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={20} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
            <input 
              type="text" 
              placeholder="Cari nama atau destinasi..." 
              className="input" 
              style={{ paddingLeft: '48px', width: '100%', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sorting */}
          <div style={{ position: 'relative' }}>
            <SortAsc size={18} color="var(--primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
            <select 
              className="input" 
              style={{ paddingLeft: '40px', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text-main)', width: '100%' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
      ) : filteredAndSortedTrips.length === 0 ? (
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
          <button className="btn btn-primary" onClick={() => { setSearchTerm(''); setSortBy('newest'); }}>
            Reset Pencarian
          </button>
        </div>
      ) : (
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
          {filteredAndSortedTrips.map(trip => (
            <motion.div 
              key={trip.id} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <ShowcaseCard
                tagline={`${trip.duration} | ${trip.currentPax}/${trip.quota} Pax`}
                heading={trip.title}
                description={trip.destination}
                imageUrl={trip.image ? getImageUrl(trip.image) : "https://images.unsplash.com/photo-1518182170546-076616fd628a?auto=format&fit=crop&q=80&w=800"}
                ctaText={`Detail Rp ${trip.price.toLocaleString()}`}
                onCtaClick={() => navigate(`/trip/${trip.id}`)}
                brandName={new Date(trip.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                services={trip.currentPax >= trip.quota ? ["PENUH"] : ["TERSEDIA"]}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Explore;
