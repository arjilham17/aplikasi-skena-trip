import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Edit, Trash, Plus, X } from 'lucide-react';

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({ title: '', destination: '', description: '', price: '', quota: '', date: '', duration: '', imagePosition: '50% 50%' });
  const [imageFile, setImageFile] = useState(null);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, initPosX: 50, initPosY: 50 });

  const parsePosition = (posString) => {
    if (!posString) return { x: 50, y: 50 };
    if (posString === 'top') return { x: 50, y: 0 };
    if (posString === 'bottom') return { x: 50, y: 100 };
    if (posString === 'left') return { x: 0, y: 50 };
    if (posString === 'right') return { x: 100, y: 50 };
    if (posString === 'center') return { x: 50, y: 50 };
    const match = posString.match(/(\d+)%\s+(\d+)%/);
    if (match) return { x: parseInt(match[1]), y: parseInt(match[2]) };
    return { x: 50, y: 50 };
  };

  const currentPos = parsePosition(formData.imagePosition);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initPosX: currentPos.x,
      initPosY: currentPos.y
    });
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDragging) return;
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    let newX = dragState.initPosX - (deltaX * 0.5);
    let newY = dragState.initPosY - (deltaY * 0.5);
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    setFormData({...formData, imagePosition: `${Math.round(newX)}% ${Math.round(newY)}%`});
  };

  const handleMouseUp = () => {
    setDragState({ ...dragState, isDragging: false });
  };

  const previewUrl = imageFile 
    ? URL.createObjectURL(imageFile) 
    : (editingTrip?.image ? `http://localhost:3001${editingTrip.image}` : `https://images.unsplash.com/photo-1518182170546-076616fd628a?auto=format&fit=crop&q=80&w=800`);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = () => {
    api.get('/trips').then(res => setTrips(res.data)).catch(console.error);
  };

  const handleOpenModal = (trip = null) => {
    if (trip) {
      setEditingTrip(trip);
      setFormData({
        title: trip.title, destination: trip.destination, description: trip.description,
        price: trip.price, quota: trip.quota, date: trip.date.split('T')[0], duration: trip.duration || '', imagePosition: trip.imagePosition || '50% 50%'
      });
    } else {
      setEditingTrip(null);
      setFormData({ title: '', destination: '', description: '', price: '', quota: '', date: '', duration: '', imagePosition: '50% 50%' });
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) data.append('imageFile', imageFile);

    try {
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, data);
        alert('Trip diperbarui!');
      } else {
        await api.post('/trips', data);
        alert('Trip baru ditambahkan!');
      }
      setShowModal(false);
      fetchTrips();
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus trip ini?')) {
      try {
        await api.delete(`/trips/${id}`);
        fetchTrips();
      } catch (err) {
        alert('Gagal menghapus trip. Pastikan tidak ada booking yang terikat dengan trip ini.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manajemen Katalog Trip</h2>
        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={16}/> Tambah Trip Baru</button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px' }}>Destinasi & Judul</th>
              <th>Harga</th>
              <th>Tanggal</th>
              <th>Kuota</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(trip => (
              <tr key={trip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '600' }}>{trip.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{trip.destination}</div>
                </td>
                <td style={{ fontWeight: '500' }}>Rp {trip.price.toLocaleString()}</td>
                <td>{new Date(trip.date).toLocaleDateString()}</td>
                <td>{trip.quota} Pax</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenModal(trip)} className="btn btn-accent" style={{ padding: '6px', minWidth: 'auto' }}><Edit size={16}/></button>
                    <button onClick={() => handleDelete(trip.id)} className="btn" style={{ padding: '6px', minWidth: 'auto', background: '#fee2e2', color: '#dc2626' }}><Trash size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)"/></button>
            <h3 style={{ marginBottom: '24px' }}>{editingTrip ? 'Edit Trip' : 'Tambah Trip Baru'}</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Judul Trip</label>
                  <input type="text" className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Destinasi (Kota/Daerah)</label>
                  <input type="text" className="input" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Deskripsi Lengkap</label>
                <textarea className="input" rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Harga (Rp)</label>
                  <input type="number" className="input" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Kuota Maks (Pax)</label>
                  <input type="number" className="input" value={formData.quota} onChange={e => setFormData({...formData, quota: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Durasi (cth: 3H2M)</label>
                  <input type="text" className="input" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tanggal Keberangkatan</label>
                  <input type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Gambar Cover (Opsional)</label>
                  <input type="file" className="input" style={{ padding: '8px' }} onChange={e => setImageFile(e.target.files[0])} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Atur Posisi Gambar (Geser kursor pada gambar)</label>
                <div 
                  style={{ width: '100%', height: '200px', background: 'var(--bg-light)', borderRadius: '8px', overflow: 'hidden', cursor: dragState.isDragging ? 'grabbing' : 'grab', position: 'relative' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: formData.imagePosition || '50% 50%', pointerEvents: 'none' }} 
                  />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    {formData.imagePosition}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Simpan Trip</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;
