import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const Home = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [featuredReviews, setFeaturedReviews] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/settings').then(res => setSettings(res.data)),
      api.get('/reviews/featured').then(res => setFeaturedReviews(res.data))
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Slideshow Logic
  useEffect(() => {
    if (settings?.heroImages?.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % settings.heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [settings]);

  const defaultHero = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1920";
  const currentHeroUrl = settings?.heroImages?.length > 0 
    ? `http://localhost:3001${settings.heroImages[currentImageIndex].url}`
    : defaultHero;

  return (
    <div style={{ overflow: 'hidden' }}>
      <section style={{
        height: '90vh',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '0 20px',
        background: '#000' // Base color
      }}>
        {/* Background Slideshow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("${currentHeroUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1
            }}
          />
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="skeleton" style={{ height: '60px', width: '600px', maxWidth: '90vw', marginBottom: '24px', background: 'rgba(255,255,255,0.2)' }}></div>
              <div className="skeleton" style={{ height: '24px', width: '400px', maxWidth: '80vw', marginBottom: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div className="skeleton" style={{ height: '56px', width: '200px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)' }}></div>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', marginBottom: '16px', fontWeight: '850' }}>
                {settings?.heroTitle || 'Temukan Petualangan Skena Kamu'}
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px auto', opacity: 0.9 }}>
                {settings?.heroSubtitle || 'Jelajahi destinasi tersembunyi dengan gaya hidup skena yang autentik.'}
              </p>
              <Link to="/explore" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>Mulai Eksplorasi <ArrowRight size={20} /></Link>
            </>
          )}
        </motion.div>

        {/* Indicators */}
        {settings?.heroImages?.length > 1 && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
            {settings.heroImages.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: idx === currentImageIndex ? '30px' : '8px', 
                  height: '8px', 
                  borderRadius: '4px', 
                  background: idx === currentImageIndex ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s ease'
                }} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      {(loading || featuredReviews.length > 0) && (
        <section style={{ padding: '100px 20px', background: 'var(--bg-white)' }}>
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              style={{ textAlign: 'center', marginBottom: '64px' }}
            >
              <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '14px' }}>Testimoni</span>
              <h2 style={{ fontSize: '42px', marginTop: '12px' }}>Apa Kata Mereka?</h2>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.2
                  }
                }
              }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}
            >
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="card" style={{ padding: '32px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
                    <div className="skeleton skeleton-text" style={{ height: '80px', marginTop: '20px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                      <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px' }}></div>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                featuredReviews.map(review => (
                  <motion.div 
                    key={review.id} 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -10, boxShadow: 'var(--shadow-xl)' }}
                    className="card" 
                    style={{ padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s ease' }}
                  >
                    <Quote size={40} color="var(--primary)" style={{ opacity: 0.1, position: 'absolute', top: '24px', right: '24px' }} />
                    
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} color={i < review.rating ? '#eab308' : 'var(--border)'} fill={i < review.rating ? '#eab308' : 'transparent'} />
                      ))}
                    </div>

                    <p style={{ fontStyle: 'italic', lineHeight: '1.8', marginBottom: '24px', flex: 1, color: 'var(--text-main)' }}>
                      "{review.comment}"
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                        {review.user.profilePicUrl ? (
                          <img src={`http://localhost:3001${review.user.profilePicUrl}`} alt={review.user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : review.user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700' }}>{review.user.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Peserta Trip {review.trip.destination}</div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
