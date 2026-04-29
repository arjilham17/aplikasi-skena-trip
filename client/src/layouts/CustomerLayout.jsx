import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, User, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import api from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : null;
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [profileData, setProfileData] = useState(initialUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    api.get('/settings').then(res => setSiteSettings(res.data)).catch(console.error);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const { pathname } = useLocation();

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
          <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
            {siteSettings?.logoUrl ? (
              <img src={`http://localhost:3001${siteSettings.logoUrl}`} alt={siteSettings.siteName} style={{ height: '48px', objectFit: 'contain' }} />
            ) : (
              <img src="/logo.jpg" alt="Skena Trip Logo" style={{ height: '48px', objectFit: 'contain' }} />
            )}
            {(!siteSettings?.logoUrl || windowWidth > 480) && (
              <span style={{ marginLeft: '12px', fontWeight: '800', fontSize: '20px', color: 'var(--primary)', fontFamily: 'Outfit' }}>
                {siteSettings?.siteName || 'Skena Trip'}
              </span>
            )}
          </Link>
          
          {windowWidth <= 768 ? (
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', color: 'var(--text-main)', border: 'none' }}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          ) : (
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
                    {profileData.name}
                  </Link>
                  <Link to="/my-dashboard" className="btn btn-accent" style={{ padding: '8px 16px' }}>Pesanan</Link>
                  {['admin', 'superadmin', 'super_admin'].includes(profileData.role) && (
                    <Link to="/admin" className="btn btn-primary" style={{ padding: '8px 16px' }}>Dashboard</Link>
                  )}
                  <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary" style={{ padding: '8px 24px' }}>Login</Link>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Menu Dropdown */}
        {windowWidth <= 768 && isMenuOpen && (
          <div className="glass" style={{ position: 'absolute', top: '70px', left: 0, right: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <Link to="/explore" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Compass size={20} /> Explore Trip
            </Link>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600' }}>Mode Gelap</span>
              <button onClick={toggleTheme} style={{ background: 'var(--bg-light)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {profileData ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                      {profileData?.profilePicUrl ? (
                        <img src={`http://localhost:3001${profileData.profilePicUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    Profil Saya
                </Link>
                <Link to="/my-dashboard" onClick={() => setIsMenuOpen(false)} className="btn btn-accent">Pesanan Saya</Link>
                {['admin', 'superadmin', 'super_admin'].includes(profileData.role) && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="btn btn-primary">Dashboard Admin</Link>
                )}
                <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary">Login / Register</Link>
            )}
          </div>
        )}
      </header>
      
      <main style={{ paddingTop: pathname === '/' ? '0' : '70px' }}>
        {pathname !== '/' && (
          <div className="container" style={{ marginTop: '32px' }}>
            <Breadcrumbs />
          </div>
        )}
        <Outlet />
      </main>
      
      <footer style={{ marginTop: '80px', padding: '60px 0', borderTop: '1px solid var(--border)', background: 'var(--bg-white)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'left' }}>
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '16px' }}>{siteSettings?.siteName || 'Skena Trip'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{siteSettings?.slogan || 'Teman Perjalanan Skena Kamu'}</p>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px' }}>Kontak</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Email: {siteSettings?.contactEmail}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>WA: {siteSettings?.contactPhone}</p>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px' }}>Alamat</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{siteSettings?.address}</p>
          </div>
        </div>
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <p>&copy; {new Date().getFullYear()} {siteSettings?.siteName || 'Skena Trip'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
