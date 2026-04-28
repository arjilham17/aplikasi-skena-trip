import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div>
      <section style={{
        height: '90vh',
        background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1920")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center'
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '64px', marginBottom: '16px' }}>Petualangan <span style={{ color: 'var(--primary)' }}>Skena Trip</span></h1>
          <p style={{ fontSize: '20px', marginBottom: '32px' }}>Temukan paket wisata eksklusif.</p>
          <Link to="/explore" className="btn btn-primary">Mulai Eksplorasi <ArrowRight size={20} /></Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
