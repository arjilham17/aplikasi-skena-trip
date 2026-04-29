import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { MapPin, Search, ChevronDown, SortAsc, Calendar, Users, Image as ImageIcon } from 'lucide-react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

const Explore = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, date-near, popular
  const [emptyAnim, setEmptyAnim] = useState(null);

  useEffect(() => {
    fetch('https://lottie.host/7469795e-1490-449e-b12e-a0e44501a4e1/zLd1MvF3O1.json')
      .then(res => res.json())
      .then(data => setEmptyAnim(data))
      .catch(err => console.error('Lottie error:', err));
  }, []);

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
        <h1 style={{ marginBottom: '24px' }}>Katalog Trip</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }} className="grid-responsive">
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari nama atau destinasi..." 
              className="input" 
              style={{ paddingLeft: '48px', width: '100%', borderRadius: '12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sorting */}
          <div style={{ position: 'relative' }}>
            <SortAsc size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <select 
              className="input" 
              style={{ paddingLeft: '40px', borderRadius: '12px' }}
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
              whileHover={{ y: -10 }}
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', transition: 'all 0.3s ease' }}
            >
              <div style={{ height: '220px', background: 'var(--bg-light)', overflow: 'hidden', position: 'relative' }}>
                {trip.image ? (
                  <img 
                    src={`http://localhost:3001${trip.image}`} 
                    alt={trip.title} 
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: trip.imagePosition || 'center' }} 
                  />
                ) : null}
                <div 
                  style={{ 
                    display: trip.image ? 'none' : 'flex', 
                    width: '100%', 
                    height: '100%', 
                    background: 'var(--bg-light)', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <ImageIcon size={48} strokeWidth={1} />
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>Foto belum tersedia</span>
                </div>
                
                {/* Labels */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                   <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', backdropFilter: 'blur(4px)' }}>
                      {trip.duration}
                   </div>
                </div>

                {trip.currentPax >= trip.quota && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#dc2626', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 'bold' }}>
                    PENUH
                  </div>
                )}
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '13px' }}>
                  <MapPin size={14}/> {trip.destination}
                </div>
                <h3 style={{ marginBottom: '16px', flex: 1, fontSize: '18px', lineHeight: '1.4' }}>{trip.title}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> {new Date(trip.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14}/> {trip.currentPax}/{trip.quota} Pax</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mulai dari</span>
                    <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '18px' }}>Rp {trip.price.toLocaleString()}</span>
                  </div>
                  <Link to={`/trip/${trip.id}`} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>Detail</Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Explore;
