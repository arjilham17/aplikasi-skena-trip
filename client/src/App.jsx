import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import CustomerLayout from './layouts/CustomerLayout';
import Home from './pages/customer/Home';
import Explore from './pages/customer/Explore';
import TripDetail from './pages/customer/TripDetail';
import Login from './pages/customer/Login';
import Profile from './pages/customer/Profile';
import MyDashboard from './pages/customer/MyDashboard';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';

// Lazy Load Admin Pages
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/admin/Overview'));
const TripManagement = React.lazy(() => import('./pages/admin/TripManagement'));
const PromoManagement = React.lazy(() => import('./pages/admin/PromoManagement'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const PassengerManifest = React.lazy(() => import('./pages/admin/PassengerManifest'));
const SiteSettings = React.lazy(() => import('./pages/admin/SiteSettings'));
const ActivityLogs = React.lazy(() => import('./pages/admin/ActivityLogs'));
const ExpenseManagement = React.lazy(() => import('./pages/admin/ExpenseManagement'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-light)' }}>
    <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }}></div>
  </div>
);

// Guard: hanya super admin yang boleh masuk halaman tertentu
const SuperAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user && (user.role === 'superadmin' || user.role === 'super_admin');
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  return children;
};
// Reset scroll on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Floating Button
const ScrollToTopBtn = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const toggleVisible = () => {
      if (window.pageYOffset > 300) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener('scroll', toggleVisible);
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  return (
    <div 
      className={`scroll-top-btn ${visible ? 'visible' : ''}`} 
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={24} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ScrollToTopBtn />
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="trip/:id" element={<TripDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="my-dashboard" element={<MyDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
          </Route>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="trips" element={<TripManagement />} />
            <Route path="promos" element={<PromoManagement />} />
            <Route path="users" element={<SuperAdminRoute><UserManagement /></SuperAdminRoute>} />
            <Route path="manifest" element={<PassengerManifest />} />
            <Route path="settings" element={<SuperAdminRoute><SiteSettings /></SuperAdminRoute>} />
            <Route path="logs" element={<SuperAdminRoute><ActivityLogs /></SuperAdminRoute>} />
            <Route path="expenses" element={<ExpenseManagement />} />
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
