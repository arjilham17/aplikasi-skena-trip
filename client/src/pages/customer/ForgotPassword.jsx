import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(res.data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 60%, #ecfdf5 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(21,76,60,0.12)',
        border: '1px solid rgba(21,76,60,0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary), #1a6b54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Mail size={30} color="white" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 8px', color: 'var(--text-main)' }}>
            Lupa Password?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
            Masukkan email akun Anda. Kami akan mengirimkan link untuk membuat password baru.
          </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#d1fae5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <CheckCircle size={32} color="#059669" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
              Email Terkirim!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
              {message}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '28px' }}>
              Periksa folder <strong>inbox</strong> maupun <strong>spam</strong> Anda. Link reset berlaku selama <strong>1 jam</strong>.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px',
                background: 'var(--primary)', color: 'white',
                fontWeight: '600', fontSize: '14px'
              }}
            >
              <ArrowLeft size={16} /> Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Error Banner */}
            {status === 'error' && (
              <div style={{
                padding: '12px 16px', background: '#fee2e2', color: '#dc2626',
                borderRadius: '10px', fontSize: '14px', lineHeight: '1.5'
              }}>
                {message}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Alamat Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  id="forgot-email"
                  type="email"
                  className="input"
                  placeholder="emailanda@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="forgot-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={status === 'loading'}
              style={{ width: '100%', marginTop: '8px', opacity: status === 'loading' ? 0.7 : 1 }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Mengirim Email…
                </>
              ) : (
                <>
                  <Mail size={16} /> Kirim Link Reset
                </>
              )}
            </button>

            {/* Back to Login */}
            <Link
              to="/login"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px',
                transition: 'color 0.2s'
              }}
            >
              <ArrowLeft size={14} /> Kembali ke halaman Login
            </Link>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
