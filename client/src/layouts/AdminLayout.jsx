import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Plane, Receipt, LogOut, Ticket, User, Users, ClipboardList, Bell, Settings, Menu, X, Sun, Moon, History, Wallet, AlertTriangle, Check } from 'lucide-react';
import api from '../services/api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
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
      
      // Initial fetch
      fetchPendingCount();
      fetchAlertsData();
      api.get('/settings').then(res => setSiteSettings(res.data)).catch(console.error);
    }

    const interval = setInterval(() => {
      if (initialUser) {
        fetchPendingCount();
        fetchAlertsData();
      }
    }, 10000); // Check every 10 seconds

    window.addEventListener('userProfileUpdated', loadProfile);
    return () => {
      window.removeEventListener('userProfileUpdated', loadProfile);
      clearInterval(interval);
    };
  }, []);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'var(--bg-white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {siteSettings?.logoUrl ? (
              <img src={`http://localhost:3001${siteSettings.logoUrl}`} alt="Logo" style={{ height: '32px' }} />
            ) : (
              <img src="/logo.jpg" alt="Logo" style={{ height: '32px' }} />
            )}
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--primary)' }}>{siteSettings?.siteName || 'Admin Center'}</h2>
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: isActive ? 'var(--primary)' : 'transparent', color: isActive ? 'white' : 'var(--text-muted)', fontWeight: isActive ? '600' : '400', transition: 'all 0.2s' }}>
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
               {profileData?.profilePicUrl ? (
                 <img src={`http://localhost:3001${profileData.profilePicUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <User size={20} />
               )}
             </div>
             <div>
               <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{profileData?.name}</div>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profileData?.role}</div>
             </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '70px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 32px', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {windowWidth <= 768 && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Menu size={24} /></button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={toggleTheme} style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {isSuperAdmin && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAlerts(!showAlerts)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <AlertTriangle size={22} color={alertCount > 0 ? '#e88915' : 'var(--text-muted)'} />
                  {alertCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e88915', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{alertCount}</span>
                  )}
                </button>
                {showAlerts && (
                  <div className="card" style={{ position: 'absolute', top: '40px', right: 0, width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 100, padding: '16px', boxShadow: 'var(--shadow-lg)' }}>
                    <h4 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Peringatan Sistem
                      <button onClick={() => setShowAlerts(false)} style={{ background: 'transparent', border: 'none' }}><X size={16} /></button>
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
                            <div style={{ fontWeight: '700', marginBottom: '4px', color: alert.type === 'DELETION' ? '#dc2626' : '#e88915', display: 'flex', justifyContent: 'space-between' }}>
                              {alert.type === 'DELETION' ? 'Penghapusan Data' : 'Pengeluaran Tinggi'}
                              {alert.isRead && <Check size={14} color="#059669" />}
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

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/admin')}>
              <Bell size={22} color={pendingCount > 0 ? '#dc2626' : 'var(--text-muted)'} />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 4px', border: '2px solid white' }}>
                  {pendingCount}
                </span>
              )}
            </div>
            <a href="/" target="_blank" className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}>Katalog</a>
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
