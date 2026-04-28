import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', address: '', gender: '', whatsapp: '', profilePicUrl: '' });
  const [profilePicFile, setProfilePicFile] = useState(null);
  
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile({
        name: res.data.name || '',
        address: res.data.address || '',
        gender: res.data.gender || '',
        whatsapp: res.data.whatsapp || '',
        profilePicUrl: res.data.profilePicUrl || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', profile.name);
    formData.append('address', profile.address);
    formData.append('gender', profile.gender);
    formData.append('whatsapp', profile.whatsapp);
    if (profilePicFile) formData.append('profilePic', profilePicFile);

    try {
      const res = await api.put('/users/profile', formData);
      alert('Profil berhasil diperbarui!');
      
      const oldUserStr = localStorage.getItem('user');
      if (oldUserStr) {
        const oldUser = JSON.parse(oldUserStr);
        const updatedUser = { ...oldUser, name: profile.name, profilePicUrl: res.data.profilePicUrl || oldUser.profilePicUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }

      setProfile(prev => ({ ...prev, profilePicUrl: res.data.profilePicUrl || prev.profilePicUrl }));
      setProfilePicFile(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/change-password', passwords);
      alert('Password berhasil diubah!');
      setPasswords({ oldPassword: '', newPassword: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '80vh', paddingBottom: '100px' }}>
      <h1 style={{ marginBottom: '32px' }}>Pengaturan Profil</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        {/* Profile Data Form */}
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px' }}>Informasi Pribadi</h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--border)' }}>
                {profile.profilePicUrl ? (
                  <img src={`http://localhost:3001${profile.profilePicUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={40} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Ubah Foto Profil</label>
                <input type="file" accept="image/*" onChange={(e) => setProfilePicFile(e.target.files[0])} className="input" style={{ padding: '8px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nama Lengkap</label>
              <input type="text" className="input" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nomor WhatsApp</label>
              <input type="tel" className="input" value={profile.whatsapp} onChange={e => setProfile({...profile, whatsapp: e.target.value})} placeholder="Contoh: 081234567890" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Jenis Kelamin</label>
              <select className="input" value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})}>
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Alamat Lengkap</label>
              <textarea className="input" rows="3" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card" style={{ padding: '32px', alignSelf: 'flex-start' }}>
          <h3 style={{ marginBottom: '24px' }}>Ubah Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password Lama</label>
              <input type="password" className="input" value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password Baru</label>
              <input type="password" className="input" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} required minLength="6" />
            </div>

            <button type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
