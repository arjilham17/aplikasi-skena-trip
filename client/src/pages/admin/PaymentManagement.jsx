import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, X, Trash, CreditCard, QrCode, ToggleLeft, ToggleRight, Info } from 'lucide-react';

const PaymentManagement = () => {
  const [methods, setMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'bank', accountName: '', accountNo: '', instruction: '' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await api.get('/admin/payment-methods');
      setMethods(res.data);
    } catch (err) { console.error(err); }
  };

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({ 
        name: method.name, 
        type: method.type, 
        accountName: method.accountName || '', 
        accountNo: method.accountNo || '', 
        instruction: method.instruction || '' 
      });
    } else {
      setEditingMethod(null);
      setFormData({ name: '', type: 'bank', accountName: '', accountNo: '', instruction: '' });
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) data.append('imageFile', imageFile);

    try {
      if (editingMethod) {
        await api.put(`/admin/payment-methods/${editingMethod.id}`, data);
      } else {
        await api.post('/admin/payment-methods', data);
      }
      setShowModal(false);
      fetchMethods();
    } catch (err) {
      alert('Gagal menyimpan metode pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (method) => {
    try {
      await api.put(`/admin/payment-methods/${method.id}`, { isActive: !method.isActive });
      fetchMethods();
    } catch (err) { alert('Gagal mengubah status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus metode pembayaran ini?')) return;
    try {
      await api.delete(`/admin/payment-methods/${id}`);
      fetchMethods();
    } catch (err) { alert('Gagal menghapus'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Metode Pembayaran</h2>
          <p style={{ color: 'var(--text-muted)' }}>Atur cara pelanggan membayar pesanan mereka.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16}/> Tambah Metode
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {methods.map(method => (
          <div key={method.id} className="card" style={{ padding: '24px', opacity: method.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-light)', borderRadius: '12px', color: 'var(--primary)' }}>
                {method.type === 'qris' ? <QrCode size={24}/> : <CreditCard size={24}/>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => toggleStatus(method)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: method.isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {method.isActive ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                </button>
                <button onClick={() => handleDelete(method.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                  <Trash size={18}/>
                </button>
              </div>
            </div>

            <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>{method.name}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {method.type === 'qris' ? 'Pembayaran via QRIS' : `${method.accountNo} a.n ${method.accountName}`}
            </p>

            {method.imageUrl && (
              <div style={{ width: '100%', height: '100px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                <img src={`http://localhost:3001${method.imageUrl}`} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}

            <button onClick={() => handleOpenModal(method)} className="btn" style={{ width: '100%', background: 'var(--bg-light)', border: '1px solid var(--border)', fontSize: '14px' }}>
              Edit Detail
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
            <h3 style={{ marginBottom: '24px' }}>{editingMethod ? 'Edit Metode' : 'Tambah Metode Baru'}</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nama Metode (e.g. Transfer BCA)</label>
                <input type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tipe</label>
                <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="bank">Transfer Bank</option>
                  <option value="qris">QRIS (Upload Gambar)</option>
                </select>
              </div>

              {formData.type === 'bank' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nama Pemilik Rekening</label>
                    <input type="text" className="input" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nomor Rekening</label>
                    <input type="text" className="input" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} required />
                  </div>
                </>
              )}

              {formData.type === 'qris' && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Upload QR Code</label>
                  <input type="file" className="input" onChange={e => setImageFile(e.target.files[0])} required={!editingMethod} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Instruksi Pembayaran</label>
                <textarea className="input" rows="3" value={formData.instruction} onChange={e => setFormData({...formData, instruction: e.target.value})} placeholder="e.g. Masukkan berita acara 'Booking Trip'"></textarea>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Metode'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
