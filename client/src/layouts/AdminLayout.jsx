import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Plane, Receipt, LogOut, Ticket, User } from 'lucide-react';
import api from '../services/api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const initialUser = userStr ? JSON.parse(userStr) : null;
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

  if (!initialUser || !['admin', 'superadmin', 'super_admin'].includes(initialUser.role)) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userProfileUpdated'));
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Manajemen Trip', path: '/admin/trips', icon: <Plane size={20} /> },
    { name: 'Kode Promo', path: '/admin/promos', icon: <Ticket size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'var(--bg-white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpg" alt="Logo" style={{ height: '32px' }} />
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--primary)' }}>Admin Center</h2>
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
        <header style={{ height: '70px', background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px' }}>
          <a href="/" target="_blank" className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '14px' }}>Buka Katalog Customer</a>
        </header>
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
