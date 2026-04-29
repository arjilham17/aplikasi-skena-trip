import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import Home from './pages/customer/Home';
import Explore from './pages/customer/Explore';
import TripDetail from './pages/customer/TripDetail';
import Login from './pages/customer/Login';
import Profile from './pages/customer/Profile';
import MyDashboard from './pages/customer/MyDashboard';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/Overview';
import TripManagement from './pages/admin/TripManagement';
import PromoManagement from './pages/admin/PromoManagement';
import UserManagement from './pages/admin/UserManagement';
import PassengerManifest from './pages/admin/PassengerManifest';
import SiteSettings from './pages/admin/SiteSettings';

// Guard: hanya super admin yang boleh masuk halaman tertentu
const SuperAdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user && (user.role === 'superadmin' || user.role === 'super_admin');
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  return children;
};

function App() {
  return (
    <Router>
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
