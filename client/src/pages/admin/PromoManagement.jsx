import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash, CheckCircle, XCircle } from 'lucide-react';

const PromoManagement = () => {
  const [promos, setPromos] = useState([]);
  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountType, setDiscountType] = useState('flat');

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = () => {
    api.get('/promos').then(res => setPromos(res.data)).catch(console.error);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/promos', { code: code.toUpperCase(), discountAmount, discountType });
      setCode(''); setDiscountAmount(''); setDiscountType('flat');
      fetchPromos();
    } catch (err) { alert('Gagal menambahkan promo. Mungkin kode sudah ada.'); }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/promos/${id}`, { isActive: !currentStatus });
      fetchPromos();
    } catch (err) { alert('Gagal mengubah status promo'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus promo ini?')) {
      try {
        await api.delete(`/promos/${id}`);
        fetchPromos();
      } catch (err) { alert('Gagal menghapus promo'); }
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Manajemen Kode Promo</h2>

      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>Buat Promo Baru</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Kode Promo (cth: DISKON50)</label>
            <input type="text" className="input" value={code} onChange={e => setCode(e.target.value)} required placeholder="KODEPROMO" style={{ textTransform: 'uppercase' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tipe Potongan</label>
            <select className="input" value={discountType} onChange={e => setDiscountType(e.target.value)}>
              <option value="flat">Nominal (Rp)</option>
              <option value="percentage">Persentase (%)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Besar Potongan</label>
            <input type="number" className="input" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} required placeholder={discountType === 'percentage' ? "50" : "50000"} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Tambah</button>
        </form>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Kode Promo</th>
              <th>Potongan Harga</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '18px', color: 'var(--primary)' }}>{p.code}</td>
                <td style={{ fontWeight: '500' }}>{p.discountType === 'percentage' ? `${p.discountAmount}%` : `Rp ${p.discountAmount.toLocaleString()}`}</td>
                <td>
                  <button onClick={() => toggleActive(p.id, p.isActive)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: p.isActive ? '#059669' : '#dc2626', fontWeight: '600' }}>
                    {p.isActive ? <><CheckCircle size={18} /> Aktif</> : <><XCircle size={18} /> Tidak Aktif</>}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleDelete(p.id)} className="btn" style={{ background: '#fee2e2', color: '#dc2626', padding: '6px', minWidth: 'auto' }}><Trash size={16}/></button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada kode promo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PromoManagement;
