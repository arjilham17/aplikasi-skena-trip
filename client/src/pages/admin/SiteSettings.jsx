import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Save, Upload, Globe, Phone, Mail, MapPin, TrendingUp, Image, Plus, Trash, HelpCircle, Image as ImageIcon } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    siteName: '',
    slogan: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logoUrl: '',
    expenseThreshold: 1000000,
    heroTitle: '',
    heroSubtitle: '',
    heroImageUrl: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [heroPreviewUrl, setHeroPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, imgId: null });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
      if (res.data.logoUrl) {
        setPreviewUrl(`http://localhost:3001${res.data.logoUrl}`);
      }
      if (res.data.heroImageUrl) {
        setHeroPreviewUrl(`http://localhost:3001${res.data.heroImageUrl}`);
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('siteName', settings.siteName);
      formData.append('slogan', settings.slogan);
      formData.append('contactEmail', settings.contactEmail);
      formData.append('contactPhone', settings.contactPhone);
      formData.append('address', settings.address);
      formData.append('expenseThreshold', settings.expenseThreshold);
      formData.append('heroTitle', settings.heroTitle);
      formData.append('heroSubtitle', settings.heroSubtitle);
      if (logoFile) formData.append('logoFile', logoFile);
      if (heroImageFile) formData.append('heroImageFile', heroImageFile);

      await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Pengaturan berhasil diperbarui!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setSuccessMsg('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHero = async () => {
    try {
      await api.delete(`/settings/hero-images/${confirmModal.imgId}`);
      fetchSettings();
      setConfirmModal({ isOpen: false, imgId: null });
    } catch (err) {
      alert('Gagal menghapus foto');
      setConfirmModal({ isOpen: false, imgId: null });
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Pengaturan...</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={32} color="var(--primary)" /> Pengaturan Situs
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Kelola identitas visual dan informasi kontak perusahaan</p>
        {successMsg && (
          <div style={{ marginTop: '16px', padding: '12px 20px', background: successMsg.includes('Gagal') ? '#fee2e2' : '#d1fae5', color: successMsg.includes('Gagal') ? '#dc2626' : '#059669', borderRadius: '12px', fontWeight: '600', animation: 'fadeIn 0.3s' }}>
            {successMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }} className="grid-responsive">
        {/* Logo Section */}
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Logo Perusahaan</h3>
          <div style={{ 
            width: '100%', 
            aspectRatio: '1/1', 
            background: 'var(--bg-light)', 
            borderRadius: '12px', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'hidden',
            border: '2px dashed var(--border)',
            marginBottom: '20px'
          }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Logo Preview" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            ) : (
              <Globe size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
            )}
          </div>
          <label className="btn btn-primary" style={{ width: '100%', cursor: 'pointer' }}>
            <Upload size={18} /> Unggah Logo Baru
            <input type="file" hidden onChange={handleLogoChange} accept="image/*" />
          </label>
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <strong>💡 Tips Logo:</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li>Rasio 1:1 (Kotak) atau Landscape pendek.</li>
              <li>Ukuran ideal: 512 x 512 px.</li>
              <li>Gunakan format PNG transparan agar rapi.</li>
            </ul>
          </div>
        </div>

        {/* Hero Editor Section */}
        <div className="card" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Image size={24} color="var(--primary)" /> Pengaturan Hero Homepage
            </h3>
            <label className={`btn btn-primary ${settings.heroImages?.length >= 10 ? 'disabled' : ''}`} style={{ cursor: settings.heroImages?.length >= 10 ? 'not-allowed' : 'pointer', opacity: settings.heroImages?.length >= 10 ? 0.5 : 1 }}>
              <Plus size={18} /> Tambah Foto Hero ({settings.heroImages?.length || 0}/10)
              <input 
                type="file" 
                hidden 
                accept="image/*" 
                disabled={settings.heroImages?.length >= 10}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('heroImage', file);
                  try {
                    await api.post('/settings/hero-images', formData);
                    fetchSettings();
                  } catch (err) {
                    alert(err.response?.data?.error || 'Gagal mengunggah foto');
                  }
                }} 
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="grid-responsive">
             <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Judul Hero (H1)</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Contoh: Temukan Petualangan Skena Kamu"
                    value={settings.heroTitle} 
                    onChange={e => setSettings({...settings, heroTitle: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Sub-judul Hero</label>
                  <textarea 
                    className="input" 
                    placeholder="Penjelasan singkat di bawah judul..."
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={settings.heroSubtitle} 
                    onChange={e => setSettings({...settings, heroSubtitle: e.target.value})}
                  />
                </div>
             </div>
             <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px' }}>Koleksi Foto Background (Slider)</label>
                {settings.heroImages?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-state-icon" style={{ width: '60px', height: '60px' }}>
                      <ImageIcon size={24} />
                    </div>
                    <h4 style={{ margin: 0 }}>Belum ada foto</h4>
                    <p style={{ fontSize: '13px', margin: 0 }}>Tambahkan maksimal 10 foto untuk membuat slider otomatis.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                    {settings.heroImages.map(img => (
                      <div key={img.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={`http://localhost:3001${img.url}`} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setConfirmModal({ isOpen: true, imgId: img.id });
                          }}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220, 38, 38, 0.8)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-light)', padding: '10px', borderRadius: '8px' }}>
                   <strong>📸 Tips Background:</strong>
                   <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                     <li>Resolusi Full HD (1920 x 1080 px).</li>
                     <li>Gunakan gambar landscape yang jernih.</li>
                     <li>Ukuran file di bawah 1MB agar website cepat.</li>
                   </ul>
                </div>
             </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Nama Website / Perusahaan</label>
              <input 
                type="text" 
                className="input" 
                value={settings.siteName} 
                onChange={e => setSettings({...settings, siteName: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Slogan / Tagline</label>
              <input 
                type="text" 
                className="input" 
                value={settings.slogan} 
                onChange={e => setSettings({...settings, slogan: e.target.value})}
              />
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-responsive">
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Email Kontak</label>
                <div style={{ position: 'relative' }}>
                   <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                   <input 
                    type="email" 
                    className="input" 
                    style={{ paddingLeft: '40px' }}
                    value={settings.contactEmail} 
                    onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>WhatsApp / Telepon</label>
                <div style={{ position: 'relative' }}>
                   <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                   <input 
                    type="text" 
                    className="input" 
                    style={{ paddingLeft: '40px' }}
                    value={settings.contactPhone} 
                    onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Alamat Kantor</label>
              <div style={{ position: 'relative' }}>
                 <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                 <textarea 
                  className="input" 
                  style={{ paddingLeft: '40px', minHeight: '80px', resize: 'vertical' }}
                  value={settings.address} 
                  onChange={e => setSettings({...settings, address: e.target.value})}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <label style={{ fontWeight: '600', margin: 0 }}>Threshold Pengeluaran Tinggi (Rp)</label>
                <div className="tooltip-container">
                  <HelpCircle size={14} color="var(--text-muted)" />
                  <div className="tooltip-content">
                    Batas nominal untuk memicu notifikasi peringatan jika pengeluaran lapangan melebihi angka ini.
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                 <TrendingUp size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input 
                  type="number" 
                  className="input" 
                  style={{ paddingLeft: '40px' }}
                  value={settings.expenseThreshold} 
                  onChange={e => setSettings({...settings, expenseThreshold: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-accent" style={{ padding: '12px 32px' }} disabled={saving}>
              <Save size={20} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Hapus Foto Hero?"
        message="Foto ini akan segera dihapus dari slider halaman utama."
        onConfirm={handleDeleteHero}
        onCancel={() => setConfirmModal({ isOpen: false, imgId: null })}
      />
    </div>
  );
};

export default SiteSettings;
