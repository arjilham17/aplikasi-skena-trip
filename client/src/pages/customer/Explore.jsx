import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { MapPin, Search } from 'lucide-react';

const Explore = () => {
  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/trips').then(res => setTrips(res.data)).catch(console.error);
  }, []);

  const filteredTrips = trips.filter(trip => 
    trip.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Katalog Trip</h1>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cari nama atau destinasi..." 
            className="input" 
            style={{ paddingLeft: '48px', width: '100%', borderRadius: '100px', boxShadow: 'var(--shadow-sm)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-white)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <Search size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-main)' }}>Trip tidak ditemukan</h3>
          <p style={{ color: 'var(--text-muted)' }}>Coba gunakan kata kunci pencarian destinasi yang lain.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
          {filteredTrips.map(trip => (
            <div key={trip.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ height: '200px', background: 'var(--bg-light)', overflow: 'hidden' }}>
                <img src={trip.image ? `http://localhost:3001${trip.image}` : `https://images.unsplash.com/photo-1518182170546-076616fd628a?auto=format&fit=crop&q=80&w=800`} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: trip.imagePosition || 'center' }} />
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', marginBottom: '8px' }}><MapPin size={16}/> {trip.destination}</div>
                <h3 style={{ marginBottom: '16px', flex: 1 }}>{trip.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '18px' }}>Rp {trip.price.toLocaleString()}</span>
                  <Link to={`/trip/${trip.id}`} className="btn btn-primary" style={{ padding: '8px 16px' }}>Detail</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
