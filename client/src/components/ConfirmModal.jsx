import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Ya, Hapus', cancelText = 'Batal', type = 'danger' }) => {
  if (!isOpen) return null;

  const accentColor = type === 'danger' ? 'var(--danger)' : 'var(--primary)';
  const iconBg = type === 'danger' ? 'var(--danger-bg)' : 'var(--bg-light)';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: accentColor }}>
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>{message}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button className="btn" style={{ background: 'var(--bg-light)', color: 'var(--text-main)' }} onClick={onCancel}>{cancelText}</button>
          <button className="btn" style={{ background: accentColor, color: 'white' }} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
