import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Compass, User, LogOut, Sun, Moon } from 'lucide-react';
import api from '../services/api';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : null;
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [profileData, setProfileData] = useState(initialUser);

  useEffect(() => {
    const loadProfile = () => {
       const storedUser = localStorage.getItem('user');
       if (storedUser) setProfileData(JSON.parse(storedUser));
       else setProfileData(null);
    };

    if (initialUser) {
      api.get('/users/profile').then(res => {
         setProfileData(res.data);
         localStorage.setItem('user', JSON.stringify(res.data));
      }).catch(console.error);
    }

    window.addEventListener('userProfileUpdated', loadProfile);
    return () => window.removeEventListener('userProfileUpdated', loadProfile);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userProfileUpdated'));
    navigate('/login');
  };

  return (
    <div>
      <header className="glass" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '70px',
        zIndex: 1000, display: 'flex', alignItems: 'center'
      }}>
        <nav className="container" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.jpg" alt="Skena Trip Logo" style={{ height: '52px', objectFit: 'contain' }} />
          </Link>
          
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Link to="/explore" style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={18} /> Explore
            </Link>
            
            <button onClick={toggleTheme} style={{ background: 'transparent', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {profileData ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-main)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {profileData?.profilePicUrl ? (
                      <img src={`http://localhost:3001${profileData.profilePicUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  Hai, {profileData.name}
                </Link>
                <Link to="/my-dashboard" className="btn btn-accent" style={{ padding: '8px 16px' }}>Pesanan Saya</Link>
                {['admin', 'superadmin', 'super_admin'].includes(profileData.role) && (
                  <Link to="/admin" className="btn btn-primary" style={{ padding: '8px 16px' }}>Dashboard</Link>
                )}
                <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '8px 24px' }}>
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>
      
      <main>
        <Outlet />
      </main>
      
      <footer style={{ marginTop: '80px', padding: '40px 0', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>&copy; 2026 Skena Trip. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CustomerLayout;
