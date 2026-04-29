import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Wallet, Plus, Trash, Search, Filter, TrendingDown, Receipt, Edit } from 'lucide-react';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    tripId: '',
    itemName: '',
    category: 'Akomodasi',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptUrl: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin';

  const categories = ['Akomodasi', 'Transportasi', 'Konsumsi', 'Tiket Wisata', 'Pemandu/Guide', 'Lain-lain'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, tripRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/trips')
      ]);
      setExpenses(expRes.data);
      setTrips(tripRes.data);
    } catch (err) {
      console.error('Gagal memuat data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData);
        alert('Pengeluaran berhasil diperbarui!');
      } else {
        await api.post('/expenses', formData);
        alert('Pengeluaran berhasil dicatat!');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan pengeluaran');
    }
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      tripId: exp.tripId,
      itemName: exp.itemName,
      category: exp.category,
      amount: exp.amount,
      expenseDate: new Date(exp.expenseDate).toISOString().split('T')[0],
      receiptUrl: exp.receiptUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus pengeluaran');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      tripId: '',
      itemName: '',
      category: 'Akomodasi',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: ''
    });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Data Keuangan...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={32} color="var(--primary)" /> Pengeluaran Trip
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Input dan pantau biaya operasional lapangan untuk setiap trip</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Catat Biaya
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Tanggal</th>
              <th>Trip</th>
              <th>Item / Kebutuhan</th>
              <th>Kategori</th>
              <th>Jumlah (Rp)</th>
              {isSuperAdmin && <th style={{ textAlign: 'right', paddingRight: '16px' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px' }}>{new Date(exp.expenseDate).toLocaleDateString('id-ID')}</td>
                <td style={{ fontWeight: '600' }}>{exp.trip?.title}</td>
                <td>{exp.itemName}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    background: 'var(--bg-light)', 
                    border: '1px solid var(--border)' 
                  }}>{exp.category}</span>
                </td>
                <td style={{ color: '#dc2626', fontWeight: '700' }}>- Rp {exp.amount.toLocaleString()}</td>
                {isSuperAdmin && (
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(exp)} className="btn btn-accent" style={{ padding: '6px', minWidth: 'auto' }}><Edit size={16}/></button>
                      <button onClick={() => handleDelete(exp.id)} className="btn" style={{ padding: '6px', minWidth: 'auto', background: '#fee2e2', color: '#dc2626' }}><Trash size={16}/></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada catatan pengeluaran.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
             <button onClick={handleCloseModal} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
               <Plus size={24} style={{ transform: 'rotate(45deg)' }} color="var(--text-muted)"/>
             </button>
             <h3 style={{ marginBottom: '24px' }}>{editingExpense ? 'Edit Catatan Biaya' : 'Catat Pengeluaran Baru'}</h3>
             
             <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Pilih Trip</label>
                  <select 
                    className="input" 
                    value={formData.tripId} 
                    onChange={e => setFormData({...formData, tripId: e.target.value})}
                    required
                  >
                    <option value="">-- Pilih Trip --</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({new Date(t.date).toLocaleDateString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nama Item / Kebutuhan</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Contoh: Sewa Kapal, Makan Siang Day 1"
                    value={formData.itemName} 
                    onChange={e => setFormData({...formData, itemName: e.target.value})}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Kategori</label>
                    <select 
                      className="input" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Jumlah (Rp)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.amount} 
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tanggal Pengeluaran</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={formData.expenseDate} 
                    onChange={e => setFormData({...formData, expenseDate: e.target.value})}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '14px' }}>
                   {editingExpense ? 'Perbarui Data' : 'Simpan Pengeluaran'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
