import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Plane, LogOut, Ticket, User, Users, ClipboardList, Bell, Settings, X, Sun, Moon, History, Wallet, AlertTriangle, Check, Menu } from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../utils/getImageUrl';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : null;
  const hasInitialUser = Boolean(userStr);
  const [profileData, setProfileData] = useState(initialUser);
  const [pendingCount, setPendingCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/bookings/pending-count');
      setPendingCount(prev => {
        if (res.data.count > prev) {
          // Play sound if count increases
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
        return res.data.count;
      });
    } catch (err) {
      console.error('Failed to fetch pending count', err);
    }
  };

  const fetchAlertsData = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuper = user.role === 'superadmin' || user.role === 'super_admin';
    if (isSuper) {
      api.get('/admin/notifications/unread-count').then(res => setAlertCount(res.data.count)).catch(console.error);
      api.get('/admin/notifications').then(res => setAlerts(res.data)).catch(console.error);
    }
  };

  useEffect(() => {
    let initialTimer;
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
      
      // Initial fetch
      initialTimer = setTimeout(() => {
        fetchPendingCount();
        fetchAlertsData();
      }, 0);
      api.get('/settings').then(res => setSiteSettings(res.data)).catch(console.error);
    }

    const interval = setInterval(() => {
      if (hasInitialUser) {
        fetchPendingCount();
        fetchAlertsData();
      }
    }, 10000); // Check every 10 seconds

    window.addEventListener('userProfileUpdated', loadProfile);
    return () => {
      window.removeEventListener('userProfileUpdated', loadProfile);
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [hasInitialUser]);

  if (!initialUser || !['admin', 'superadmin', 'super_admin'].includes(initialUser.role)) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userProfileUpdated'));
    navigate('/login');
  };

  const isSuperAdmin = initialUser && (initialUser.role === 'superadmin' || initialUser.role === 'super_admin');

  const navItems = [
    { name: 'Dashboard',           path: '/admin',        icon: <LayoutDashboard size={20} /> },
    { name: 'Manajemen Trip',      path: '/admin/trips',  icon: <Plane size={20} /> },
    { name: 'Kode Promo',          path: '/admin/promos',    icon: <Ticket size={20} /> },
    { name: 'Manifest Peserta',    path: '/admin/manifest',  icon: <ClipboardList size={20} /> },
    { name: 'Pengeluaran Trip',    path: '/admin/expenses',  icon: <Wallet size={20} /> },
    ...(isSuperAdmin ? [
      { name: 'Manajemen Pengguna', path: '/admin/users', icon: <Users size={20} /> },
      { name: 'Metode Pembayaran',  path: '/admin/payments', icon: <Wallet size={20} /> },
      { name: 'Pengaturan Situs',   path: '/admin/settings', icon: <Settings size={20} /> },
      { name: 'Log Aktivitas',     path: '/admin/logs', icon: <History size={20} /> }
    ] : []),
  ];

  const isMobile = windowWidth <= 1024;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light)', position: 'relative' }}>
      {/* Mobile Backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.45)', 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 998 
          }} 
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{ 
          width: '260px', 
          background: 'var(--bg-white)', 
          borderRight: '1px solid var(--border)', 
          display: 'flex', 
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          bottom: 0,
          left: isMobile ? (isMobileMenuOpen ? 0 : '-280px') : 0,
          zIndex: isMobile ? 999 : 10,
          boxShadow: isMobile && isMobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          height: isMobile ? '100vh' : 'auto'
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {siteSettings?.logoUrl ? (
              <img src={getImageUrl(siteSettings.logoUrl)} alt="Logo" style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <img src="/logo.jpg" alt="Logo" style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: '50%' }} />
            )}
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-main)', fontFamily: 'Cormorant Garamond', fontWeight: '700' }}>{siteSettings?.siteName || 'Admin Center'}</h2>
          </div>
          {isMobile && (
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => { if (isMobile) setIsMobileMenuOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  background: isActive ? 'var(--primary)' : 'transparent', 
                  color: isActive ? 'white' : 'var(--text-muted)', 
                  fontWeight: isActive ? '600' : '500', 
                  transition: 'all 0.15s ease' 
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
               {profileData?.profilePicUrl ? (
                 <img src={getImageUrl(profileData.profilePicUrl)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <User size={20} />
               )}
             </div>
             <div>
               <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{profileData?.name}</div>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profileData?.role}</div>
             </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 14px', background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: '70px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: windowWidth <= 768 ? '0 16px' : '0 32px', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-main)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '8px',
                  borderRadius: '6px'
                }}
                aria-label="Buka menu admin"
              >
                <Menu size={24} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={toggleTheme} style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }} aria-label="Ganti Tema">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {isSuperAdmin && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAlerts(!showAlerts)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '6px' }} aria-label="Peringatan Sistem">
                  <AlertTriangle size={22} color={alertCount > 0 ? 'var(--accent)' : 'var(--text-muted)'} />
                  {alertCount > 0 && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--accent)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{alertCount}</span>
                  )}
                </button>
                {showAlerts && (
                  <div className="card" style={{ position: 'absolute', top: '40px', right: 0, width: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 100, padding: '16px', boxShadow: 'var(--shadow-lg)' }}>
                    <h4 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
                      Peringatan Sistem
                      <button onClick={() => setShowAlerts(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                    </h4>
                    {alerts.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Tidak ada peringatan.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {alerts.map(alert => (
                          <div 
                            key={alert.id} 
                            onClick={async () => {
                              if (!alert.isRead) {
                                await api.put(`/admin/notifications/${alert.id}/read`);
                                fetchAlertsData();
                              }
                            }}
                            style={{ 
                              padding: '12px', 
                              borderRadius: '8px', 
                              background: alert.isRead ? 'transparent' : 'var(--bg-light)', 
                              border: '1px solid var(--border)', 
                              fontSize: '13px',
                              cursor: 'pointer',
                              opacity: alert.isRead ? 0.6 : 1
                            }}
                          >
                            <div style={{ fontWeight: '700', marginBottom: '4px', color: alert.type === 'DELETION' ? 'var(--status-danger-text)' : 'var(--accent)', display: 'flex', justifyContent: 'space-between' }}>
                              {alert.type === 'DELETION' ? 'Penghapusan Data' : 'Pengeluaran Tinggi'}
                              {alert.isRead && <Check size={14} color="var(--status-success-text)" />}
                            </div>
                            {alert.message}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px' }} onClick={() => navigate('/admin')}>
              <Bell size={22} color={pendingCount > 0 ? 'var(--status-danger-text)' : 'var(--text-muted)'} />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--status-danger-text)', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 4px', border: '2px solid white' }}>
                  {pendingCount}
                </span>
              )}
            </div>
            <a href="/" target="_blank" className="btn btn-accent btn-sm" style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}>Katalog</a>
          </div>
        </header>
        
        <main style={{ flex: 1, overflowY: 'auto', padding: windowWidth <= 768 ? '16px' : '32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
