import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X } from 'lucide-react';

const AdminOverview = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);



  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resBookings = await api.get('/bookings');
      setBookings(resBookings.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      fetchData(); // Refresh table data after updating
    } catch (err) {
      alert('Gagal mengubah status');
    }
  };

  // Prepare data for Recharts PieChart
  const statusCount = bookings.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(statusCount).map(key => ({
    name: key.toUpperCase(), value: statusCount[key]
  }));
  
  // Custom colors matching the Design System Badges
  const COLORS = {
    'PENDING': '#eab308',
    'CONFIRMED': '#059669',
    'CANCELLED': '#dc2626'
  };

  if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center' }}>Loading Admin Data...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginBottom: '32px' }}>
          {/* Analytics Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h3>Rasio Pemesanan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Status pesanan keseluruhan</p>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Total Pendapatan (Terkonfirmasi)</h4>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  Rp {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}
                </p>
             </div>
             <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Menunggu Persetujuan Admin</h4>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308' }}>
                  {bookings.filter(b => b.status === 'pending').length} Pesanan
                </p>
             </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px' }}>Manajemen Pesanan Masuk</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 0' }}>ID Booking</th>
                  <th>Data Pelanggan</th>
                  <th>Destinasi Trip</th>
                  <th>Pax</th>
                  <th>Total Tagihan</th>
                  <th>Status</th>
                  <th>Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 0', fontWeight: '600' }}>#BK-{b.id.toString().padStart(4, '0')}</td>
                    <td>{b.user.name} <br/><span style={{fontSize:'12px', color:'var(--text-muted)'}}>{b.user.email}</span></td>
                    <td style={{ fontWeight: '500' }}>{b.trip.title}</td>
                    <td>{b.pax} Orang</td>
                    <td style={{ fontWeight: '600' }}>Rp {b.totalPrice.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${b.status}`}>{b.status.toUpperCase()}</span>
                    </td>
                    <td>
                      {b.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleUpdateStatus(b.id, 'confirmed')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Setujui</button>
                          <button onClick={() => handleUpdateStatus(b.id, 'cancelled')} className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#fee2e2', color: '#dc2626' }}>Tolak</button>
                          {b.payments && b.payments.length > 0 && (
                            <button onClick={() => setSelectedProofUrl(b.payments[0].proofUrl.startsWith('http') ? b.payments[0].proofUrl : `http://localhost:3001${b.payments[0].proofUrl}`)} className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '12px' }}>Cek Bukti</button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Telah ditangani</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)' }}>Tidak ada pesanan.</p>}
          </div>
        </div>
      {/* Image Proof Modal */}
      {selectedProofUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button onClick={() => setSelectedProofUrl(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'var(--bg-white)', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--text-main)"/>
            </button>
            <img src={selectedProofUrl} alt="Bukti Pembayaran" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
