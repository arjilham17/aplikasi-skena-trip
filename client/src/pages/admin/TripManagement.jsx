import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Edit, Trash, Plus, X, DollarSign, Clock } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedTripForItinerary, setSelectedTripForItinerary] = useState(null);
  const [itineraryForm, setItineraryForm] = useState({ time: '', activity: '', description: '' });
  const [financeData, setFinanceData] = useState(null);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({ title: '', destination: '', description: '', price: '', quota: '', date: '', duration: '', imagePosition: '50% 50%' });
  const [imageFile, setImageFile] = useState(null);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, initPosX: 50, initPosY: 50 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, tripId: null });

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user && (user.role === 'superadmin' || user.role === 'super_admin');

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

  const handleOpenItinerary = async (trip) => {
    try {
      const res = await api.get(`/trips/${trip.id}`);
      setSelectedTripForItinerary(res.data);
      setShowItineraryModal(true);
    } catch (err) { alert('Gagal memuat itinerary'); }
  };

  const handleAddItinerary = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/trips/${selectedTripForItinerary.id}/itinerary`, itineraryForm);
      setItineraryForm({ time: '', activity: '', description: '' });
      handleOpenItinerary(selectedTripForItinerary); // Refresh
    } catch (err) { alert('Gagal menambah itinerary'); }
  };

  const handleDeleteItinerary = async (id) => {
    try {
      await api.delete(`/itinerary/${id}`);
      handleOpenItinerary(selectedTripForItinerary); // Refresh
    } catch (err) { alert('Gagal menghapus itinerary'); }
  };

  const handleDelete = async (id) => {
    setConfirmModal({ isOpen: true, tripId: id });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/trips/${confirmModal.tripId}`);
      fetchTrips();
      setConfirmModal({ isOpen: false, tripId: null });
    } catch (err) {
      alert('Gagal menghapus trip. Pastikan tidak ada booking yang terikat dengan trip ini.');
      setConfirmModal({ isOpen: false, tripId: null });
    }
  };

  const handleShowFinance = async (tripId) => {
    setLoadingFinance(true);
    setShowFinanceModal(true);
    try {
      const res = await api.get(`/admin/trips/${tripId}/finance`);
      setFinanceData(res.data);
    } catch (err) {
      alert('Gagal memuat data keuangan');
      setShowFinanceModal(false);
    } finally {
      setLoadingFinance(false);
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
                    <button onClick={() => handleOpenItinerary(trip)} className="btn" style={{ padding: '6px', minWidth: 'auto', background: 'var(--bg-light)', border: '1px solid var(--border)' }} title="Atur Itinerary"><Clock size={16}/></button>
                    {isSuperAdmin && (
                      <button onClick={() => handleShowFinance(trip.id)} className="btn btn-primary" style={{ padding: '6px', minWidth: 'auto', background: '#059669' }} title="Laporan Keuangan"><DollarSign size={16}/></button>
                    )}
                    <button onClick={() => handleOpenModal(trip)} className="btn btn-accent" style={{ padding: '6px', minWidth: 'auto' }}><Edit size={16}/></button>
                    {isSuperAdmin && (
                      <button onClick={() => handleDelete(trip.id)} className="btn" style={{ padding: '6px', minWidth: 'auto', background: '#fee2e2', color: '#dc2626' }}><Trash size={16}/></button>
                    )}
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
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>💡 Tips Gambar Trip:</strong> Rasio 4:3 atau 1:1. Resolusi ideal 800 x 600 px.
                  </div>
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

      {/* Finance Modal */}
      {showFinanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setShowFinanceModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)"/></button>
            <h3 style={{ marginBottom: '24px' }}>Analisis Keuntungan</h3>
            
            {loadingFinance ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Menghitung...</p>
            ) : financeData ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pendapatan (Confirmed)</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>Rp {financeData.totalRevenue.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Dihitung dari {financeData.bookingCount} pesanan</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Pengeluaran</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>- Rp {financeData.totalExpenses.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{financeData.expenseCount} item pengeluaran lapangan</div>
                </div>

                <div style={{ padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Keuntungan Bersih (Net Profit)</div>
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>Rp {financeData.netProfit.toLocaleString()}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {/* Itinerary Modal */}
      {showItineraryModal && selectedTripForItinerary && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowItineraryModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)"/></button>
            <h3 style={{ marginBottom: '24px' }}>Itinerary: {selectedTripForItinerary.title}</h3>
            
            <form onSubmit={handleAddItinerary} style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gap: '12px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px' }}>
                  <input type="text" placeholder="08:00" className="input" value={itineraryForm.time} onChange={e => setItineraryForm({...itineraryForm, time: e.target.value})} required />
                  <input type="text" placeholder="Nama Aktivitas" className="input" value={itineraryForm.activity} onChange={e => setItineraryForm({...itineraryForm, activity: e.target.value})} required />
               </div>
               <textarea placeholder="Deskripsi aktivitas (opsional)" className="input" rows="2" value={itineraryForm.description} onChange={e => setItineraryForm({...itineraryForm, description: e.target.value})}></textarea>
               <button type="submit" className="btn btn-primary">Tambah Langkah</button>
            </form>

            <div style={{ display: 'grid', gap: '16px' }}>
               {selectedTripForItinerary.itinerary?.length === 0 ? (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada itinerary.</p>
               ) : (
                 selectedTripForItinerary.itinerary.map(item => (
                   <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                         <div style={{ fontWeight: 'bold', color: 'var(--primary)', minWidth: '60px' }}>{item.time}</div>
                         <div>
                            <div style={{ fontWeight: '600' }}>{item.activity}</div>
                            {item.description && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.description}</div>}
                         </div>
                      </div>
                      <button onClick={() => handleDeleteItinerary(item.id)} style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash size={14}/></button>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Hapus Trip?"
        message="Tindakan ini tidak dapat dibatalkan. Trip yang sudah dihapus tidak dapat dikembalikan."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, tripId: null })}
      />
    </div>
  );
};

export default TripManagement;
