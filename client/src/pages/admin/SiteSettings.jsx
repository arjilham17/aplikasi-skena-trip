import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Save, Upload, Globe, Phone, Mail, MapPin } from 'lucide-react';

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    siteName: '',
    slogan: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logoUrl: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      if (logoFile) formData.append('logoFile', logoFile);

      await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Pengaturan berhasil diperbarui!');
      window.location.reload(); // Refresh to update all logos in layout
    } catch (err) {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
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
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
            Rekomendasi: File PNG/JPG transparan, rasio 1:1 atau landscape pendek.
          </p>
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
          </div>

          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-accent" style={{ padding: '12px 32px' }} disabled={saving}>
              <Save size={20} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
