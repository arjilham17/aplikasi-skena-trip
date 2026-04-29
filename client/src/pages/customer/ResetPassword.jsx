import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  // Redirect to login after success
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => navigate('/login'), 4000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#059669'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error');
      setMessage('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setMessage('Password minimal 6 karakter.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
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
        maxWidth: '440px',
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
            background: status === 'success'
              ? 'linear-gradient(135deg, #059669, #047857)'
              : 'linear-gradient(135deg, var(--primary), #1a6b54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', transition: 'background 0.4s'
          }}>
            {status === 'success' ? <CheckCircle size={30} color="white" /> : <Lock size={30} color="white" />}
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 8px', color: 'var(--text-main)' }}>
            {status === 'success' ? 'Password Berhasil Diubah!' : 'Buat Password Baru'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
            {status === 'success'
              ? 'Anda akan diarahkan ke halaman login dalam beberapa detik…'
              : 'Masukkan password baru Anda. Minimal 6 karakter.'
            }
          </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '16px', background: '#d1fae5', borderRadius: '12px',
              color: '#065f46', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px'
            }}>
              ✅ {message}
            </div>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Ke Halaman Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Error Banner */}
            {status === 'error' && (
              <div style={{
                padding: '12px 16px', background: '#fee2e2', color: '#dc2626',
                borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <XCircle size={16} />
                {message}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Password Baru
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  id="new-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'transparent',
                    color: 'var(--text-muted)', padding: '4px'
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength Meter */}
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '4px',
                        background: i <= strength ? strengthColor : '#e2e8f0',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: strengthColor, fontWeight: '600' }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Konfirmasi Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)'
                }} />
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className="input"
                  placeholder="Ulangi password baru"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  style={{
                    paddingLeft: '40px', paddingRight: '44px',
                    borderColor: confirm && confirm !== password ? '#ef4444' : ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'transparent',
                    color: 'var(--text-muted)', padding: '4px'
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  Password tidak cocok
                </p>
              )}
              {confirm && confirm === password && (
                <p style={{ color: '#059669', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} /> Password cocok
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="reset-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={status === 'loading'}
              style={{ width: '100%', marginTop: '8px', opacity: status === 'loading' ? 0.7 : 1 }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Lock size={16} /> Simpan Password Baru
                </>
              )}
            </button>

            <Link
              to="/login"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px'
              }}
            >
              <ArrowLeft size={14} /> Kembali ke Login
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

export default ResetPassword;
