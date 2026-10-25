import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, User, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import api from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import { getImageUrl } from '../utils/getImageUrl';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : null;
  const hasInitialUser = Boolean(userStr);
  
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

    if (hasInitialUser) {
      api.get('/users/profile').then(res => {
         setProfileData(res.data);
         localStorage.setItem('user', JSON.stringify(res.data));
      }).catch(console.error);
    }

    window.addEventListener('userProfileUpdated', loadProfile);
    return () => window.removeEventListener('userProfileUpdated', loadProfile);
  }, [hasInitialUser]);

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
              <img src={getImageUrl(siteSettings.logoUrl)} alt={siteSettings.siteName} style={{ height: '48px', width: '48px', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <img src="/logo.jpg" alt="Skena Trip Logo" style={{ height: '48px', width: '48px', objectFit: 'cover', borderRadius: '50%' }} />
            )}
            {(!siteSettings?.logoUrl || windowWidth > 480) && (
              <span style={{ marginLeft: '12px', fontWeight: '800', fontSize: '20px', color: 'var(--text-main)', fontFamily: 'Cormorant Garamond' }}>
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
                        <img src={getImageUrl(profileData.profilePicUrl)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

        {/* Mobile Menu Backdrop */}
        {windowWidth <= 768 && isMenuOpen && (
          <div 
            className="drawer-backdrop"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Tutup menu"
          />
        )}

        {/* Mobile Menu Dropdown */}
        {windowWidth <= 768 && isMenuOpen && (
          <div className="glass" style={{ position: 'absolute', top: '70px', left: 0, right: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', zIndex: 999 }}>
            <Link to="/explore" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
              <Compass size={20} /> Explore Trip
            </Link>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>Mode Tampilan</span>
              <button onClick={toggleTheme} aria-label="Ganti mode tampilan" style={{ background: 'var(--bg-light)', padding: '8px 12px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                {theme === 'light' ? <><Moon size={18} /> Gelap</> : <><Sun size={18} /> Terang</>}
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {profileData ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                   <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                      {profileData?.profilePicUrl ? (
                        <img src={getImageUrl(profileData.profilePicUrl)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{profileData.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{profileData.email}</div>
                    </div>
                </Link>
                <Link to="/my-dashboard" onClick={() => setIsMenuOpen(false)} className="btn btn-secondary btn-block">Pesanan & Wishlist</Link>
                {['admin', 'superadmin', 'super_admin'].includes(profileData.role) && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="btn btn-primary btn-block">Dashboard Admin</Link>
                )}
                <button onClick={handleLogout} className="btn btn-block" style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger-border)', fontWeight: '600' }}>
                  <LogOut size={18} /> Keluar Akun
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary btn-block">Masuk / Daftar Akun</Link>
            )}
          </div>
        )}
      </header>
      
      <main style={{ paddingTop: pathname === '/' ? '0' : '72px' }}>
        {pathname !== '/' && (
          <div className="container" style={{ marginTop: '16px', marginBottom: '8px' }}>
            <Breadcrumbs />
          </div>
        )}
        <Outlet />
      </main>
      
      <footer style={{ marginTop: '80px', padding: '50px 0 30px', borderTop: '1px solid var(--border)', background: 'var(--bg-white)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', textAlign: 'left' }}>
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '22px' }}>{siteSettings?.siteName || 'Skena Trip'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>{siteSettings?.slogan || 'Teman Perjalanan dan Petualangan Seru Terbaik Kamu.'}</p>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Explore Nusantara dengan aman, nyaman, dan terjangkau.
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '14px', fontSize: '16px' }}>Navigasi Cepat</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <Link to="/explore" style={{ color: 'var(--text-muted)' }}>Katalog Trip</Link>
              <Link to="/my-dashboard" style={{ color: 'var(--text-muted)' }}>Pesanan & Wishlist</Link>
              <Link to="/profile" style={{ color: 'var(--text-muted)' }}>Profil Akun</Link>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '14px', fontSize: '16px' }}>Pusat Bantuan</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              {siteSettings?.contactEmail && <p style={{ margin: 0 }}>Email: {siteSettings.contactEmail}</p>}
              {siteSettings?.contactPhone && (
                <a 
                  href={`https://wa.me/${siteSettings.contactPhone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  WhatsApp: {siteSettings.contactPhone}
                </a>
              )}
              {siteSettings?.address && <p style={{ margin: 0, marginTop: '4px' }}>Alamat: {siteSettings.address}</p>}
            </div>
          </div>
        </div>
        <div className="container" style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} {siteSettings?.siteName || 'Skena Trip'}. Hak Cipta Dilindungi.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Aman & Terpercaya</span>
            <span>✦</span>
            <span>Pasti Berangkat</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
