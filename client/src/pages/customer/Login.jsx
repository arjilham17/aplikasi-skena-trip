import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../services/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('userProfileUpdated'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, formData);
      
      if (!isLogin) {
        setIsLogin(true);
        setError('Registrasi berhasil! Silakan login.');
        return;
      }
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('userProfileUpdated'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div style={{ paddingTop: '120px', minHeight: '80vh', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', alignSelf: 'flex-start' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px', textAlign: 'center' }}>
          {isLogin ? 'Selamat Datang Kembali' : 'Daftar Akun Baru'}
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>
          {isLogin ? 'Masuk ke akun Skena Trip Anda' : 'Mulai petualangan Anda bersama kami'}
        </p>

        {error && (
          <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {!isLogin && (
            <input 
              type="text" 
              className="input" 
              placeholder="Nama Lengkap" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required={!isLogin}
            />
          )}
          <input 
            type="email" 
            className="input" 
            placeholder="Email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required 
          />
          <input 
            type="password" 
            className="input" 
            placeholder="Password" 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required 
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            {isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ATAU</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
            useOneTap
          />
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: 'var(--primary)', fontWeight: '600', background: 'transparent' }}>
            {isLogin ? 'Daftar Sekarang' : 'Masuk di sini'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
