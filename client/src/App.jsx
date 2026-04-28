import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import Home from './pages/customer/Home';
import Explore from './pages/customer/Explore';
import TripDetail from './pages/customer/TripDetail';
import Login from './pages/customer/Login';
import Profile from './pages/customer/Profile';
import MyDashboard from './pages/customer/MyDashboard';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/Overview';
import TripManagement from './pages/admin/TripManagement';
import PromoManagement from './pages/admin/PromoManagement';

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
        </Route>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="trips" element={<TripManagement />} />
          <Route path="promos" element={<PromoManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
