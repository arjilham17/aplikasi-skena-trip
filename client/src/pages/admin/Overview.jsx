import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X, Filter, Download, FileText, Calendar, Table, MessageCircle, HelpCircle, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOverview = () => {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  
  // Filter States
  const [filterType, setFilterType] = useState('all'); // all, month, week, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resBookings, resExpenses] = await Promise.all([
        api.get('/bookings'),
        api.get('/expenses')
      ]);
      setBookings(resBookings.data);
      setExpenses(resExpenses.data);
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

  // ─── Filter Logic ────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter(b => {
    // Search filter
    const matchesSearch = 
      b.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#BK-${b.id.toString().padStart(4, '0')}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    const bookingDate = new Date(b.createdAt);
    const now = new Date();
    
    if (filterType === 'month') {
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }
    if (filterType === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0,0,0,0);
      return bookingDate >= startOfWeek;
    }
    if (filterType === 'custom') {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      return bookingDate >= start && bookingDate <= end;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (filterType === 'all') return true;
    const expDate = new Date(e.expenseDate);
    const now = new Date();

    if (filterType === 'month') {
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }
    if (filterType === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      return expDate >= startOfWeek;
    }
    if (filterType === 'custom') {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      return expDate >= start && expDate <= end;
    }
    return true;
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin';

  const totalRevenue = filteredBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // ─── Export Logic ────────────────────────────────────────────────────────
  const prepareExportData = () => {
    return filteredBookings.map(b => ({
      'ID Booking': `#BK-${b.id.toString().padStart(4, '0')}`,
      'Tanggal': new Date(b.createdAt).toLocaleDateString('id-ID'),
      'Pelanggan': b.user.name,
      'Email': b.user.email,
      'Trip': b.trip.title,
      'Pax': b.pax,
      'Total Tagihan': b.totalPrice,
      'Status': b.status.toUpperCase()
    }));
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Penjualan Skena Trip", 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    
    const data = prepareExportData();
    const columns = Object.keys(data[0]);
    const rows = data.map(row => Object.values(row));

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillStyle: [21, 76, 60] } // #154c3c
    });

    doc.save(`Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Prepare data for Recharts PieChart
  const statusCount = filteredBookings.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(statusCount).map(key => ({
    name: key.toUpperCase(), value: statusCount[key]
  }));
  
  const COLORS = {
    'PENDING': '#eab308',
    'CONFIRMED': '#059669',
    'CANCELLED': '#dc2626'
  };

  if (loading) return (
    <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p>Loading Admin Data...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Filter & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Dashboard Penjualan</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Pantau performa bisnis dan kelola pesanan</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Export Dropdown - simplified for UI */}
          <div style={{ display: 'flex', background: 'var(--bg-white)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
             <button onClick={exportToCSV} className="btn-icon-text" title="Export CSV" style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
               <FileText size={16} /> CSV
             </button>
             <button onClick={exportToExcel} className="btn-icon-text" title="Export Excel" style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', borderLeft: '1px solid var(--border)' }}>
               <Table size={16} /> Excel
             </button>
             <button onClick={exportToPDF} className="btn-icon-text" title="Export PDF" style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', borderLeft: '1px solid var(--border)' }}>
               <Download size={16} /> PDF
             </button>
          </div>
        </div>
      </div>

      <div className="card grid-responsive" style={{ padding: '20px', marginBottom: '32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Cari Nama Customer, Trip, atau Booking ID..." 
            className="input" 
            style={{ paddingLeft: '40px', margin: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={18} color="var(--primary)" />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Filter:</span>
          </div>
        
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'month', 'week', 'custom'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: filterType === t ? 'var(--primary)' : 'var(--border)',
                  background: filterType === t ? 'var(--primary)' : 'transparent',
                  color: filterType === t ? 'white' : 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t === 'all' ? 'Semua' : t === 'month' ? 'Bulan Ini' : t === 'week' ? 'Minggu Ini' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {filterType === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="input"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>s/d</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="input"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            />
          </div>
        )}
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginBottom: '32px' }}>
          {/* Analytics Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>Rasio Pemesanan</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Status pesanan periode terpilih</p>
              </div>
            </div>
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
            {pieData.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Tidak ada data.</p>}
          </div>

          {/* Quick Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isSuperAdmin ? '1fr 1fr' : '1fr', gap: '24px' }}>
             {loading ? (
                [...Array(isSuperAdmin ? 2 : 1)].map((_, i) => (
                  <div key={i} className="card" style={{ padding: '32px' }}>
                     <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                     <div className="skeleton skeleton-title" style={{ width: '80%', height: '40px' }}></div>
                     <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '16px' }}></div>
                  </div>
                ))
             ) : (
               <>
                 <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
                       <Calendar size={120} color="var(--primary)" />
                    </div>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isSuperAdmin ? 'Total Pendapatan' : 'Pesanan Sukses'}</h4>
                    <p style={{ fontSize: '36px', fontWeight: '850', color: 'var(--primary)', margin: 0 }}>
                      {isSuperAdmin ? `Rp ${totalRevenue.toLocaleString()}` : `${filteredBookings.filter(b => b.status === 'confirmed').length} Trip`}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                       {isSuperAdmin ? 'Dihitung dari pesanan terkonfirmasi' : 'Total perjalanan yang telah dibayar'}
                    </p>
                 </div>
                 
                 {isSuperAdmin && (
                   <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: netProfit >= 0 ? 'var(--primary)' : '#dc2626', color: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <h4 style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keuntungan Bersih (Net Profit)</h4>
                        <div className="tooltip-container">
                          <HelpCircle size={14} color="rgba(255,255,255,0.6)" />
                          <div className="tooltip-content">
                            Pendapatan kotor (Confirmed) dikurangi seluruh pengeluaran operasional lapangan.
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '36px', fontWeight: '850', margin: 0 }}>
                        Rp {netProfit.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                        Pendapatan dikurangi pengeluaran (periode terpilih)
                      </p>
                   </div>
                 )}
               </>
             )}
          </div>
          
          {/* Third stat for super admin: Pending Count */}
          {isSuperAdmin && (
            <div className="card" style={{ gridColumn: 'span 2', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#fef9c3', padding: '10px', borderRadius: '10px' }}><FileText size={24} color="#eab308" /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Antrean Verifikasi</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{filteredBookings.filter(b => b.status === 'pending').length} pesanan butuh persetujuan</div>
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Pengeluaran</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>- Rp {totalExpenses.toLocaleString()}</div>
               </div>
            </div>
          )}
        </div>

        {/* Bookings Table */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>Manajemen Pesanan Masuk</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Menampilkan {filteredBookings.length} pesanan</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <th style={{ padding: '16px 0' }}>ID Booking</th>
                  <th>Data Pelanggan</th>
                  <th>Destinasi Trip</th>
                  <th>Pax</th>
                  <th>Total Tagihan</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 0', fontWeight: '700', fontSize: '13px' }}>#BK-{b.id.toString().padStart(4, '0')}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.user.name}</div>
                      <div style={{fontSize:'12px', color:'var(--text-muted)'}}>{b.user.email}</div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{b.trip.title}</td>
                    <td>{b.pax} <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Orang</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>Rp {b.totalPrice.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${b.status}`}>{b.status.toUpperCase()}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {b.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => handleUpdateStatus(b.id, 'confirmed')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Setujui</button>
                          <button onClick={() => handleUpdateStatus(b.id, 'cancelled')} className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: 'none' }}>Tolak</button>
                          {b.user.whatsapp && (
                            <button 
                              onClick={() => {
                                const waNumber = b.user.whatsapp.replace(/\D/g, '').startsWith('0') 
                                  ? '62' + b.user.whatsapp.replace(/\D/g, '').slice(1) 
                                  : b.user.whatsapp.replace(/\D/g, '');
                                const waText = encodeURIComponent(`Halo ${b.user.name}, kami dari Skena Trip ingin menindaklanjuti pesanan Anda #BK-${b.id.toString().padStart(4, '0')} untuk trip ${b.trip.title}.`);
                                window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
                              }}
                              className="btn btn-accent"
                              style={{ padding: '6px 12px', fontSize: '12px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', border: 'none' }}
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </button>
                          )}
                          {b.payments && b.payments.length > 0 && (
                            <button onClick={() => setSelectedProofUrl(b.payments[0].proofUrl.startsWith('http') ? b.payments[0].proofUrl : `http://localhost:3001${b.payments[0].proofUrl}`)} className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '12px' }}>Bukti</button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Telah ditangani</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="empty-state" style={{ padding: '64px', border: 'none' }}>
                <div className="empty-state-icon">
                  <Table size={32} />
                </div>
                <h4 style={{ margin: 0 }}>Tidak ada pesanan</h4>
                <p style={{ fontSize: '13px', margin: 0 }}>Tidak ada pesanan yang sesuai dengan filter saat ini.</p>
              </div>
            )}
          </div>
        </div>

      {/* Image Proof Modal */}
      <AnimatePresence>
        {selectedProofUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ position: 'relative', maxWidth: '800px', width: '100%', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h4 style={{ margin: 0 }}>Bukti Pembayaran</h4>
                 <button onClick={() => setSelectedProofUrl(null)} style={{ background: '#f1f5f9', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer', display: 'flex' }}>
                   <X size={20} color="#64748b"/>
                 </button>
              </div>
              <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc' }}>
                 <img src={selectedProofUrl} alt="Bukti Pembayaran" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminOverview;
