import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users, Search, Shield, ShieldCheck, ShieldAlert,
  Trash2, UserCog, ChevronDown, X, AlertTriangle
} from 'lucide-react';

// ─── Role Config ────────────────────────────────────────────
const ROLES = {
  customer:   { label: 'Customer',    color: '#3b82f6', bg: '#eff6ff' },
  admin:      { label: 'Admin',       color: '#8b5cf6', bg: '#f5f3ff' },
  superadmin: { label: 'Super Admin', color: '#dc2626', bg: '#fef2f2' },
  super_admin:{ label: 'Super Admin', color: '#dc2626', bg: '#fef2f2' },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLES[role] || ROLES.customer;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      color: cfg.color, background: cfg.bg
    }}>
      {role === 'superadmin' || role === 'super_admin'
        ? <ShieldAlert size={12} />
        : role === 'admin'
          ? <ShieldCheck size={12} />
          : <Shield size={12} />}
      {cfg.label}
    </span>
  );
};

// ─── Confirm Delete Modal ────────────────────────────────────
const ConfirmModal = ({ user, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div className="card" style={{ padding: '32px', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
      }}>
        <AlertTriangle size={32} color="#dc2626" />
      </div>
      <h3 style={{ marginBottom: '8px' }}>Hapus Pengguna?</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Akun <strong>{user.name}</strong> ({user.email}) beserta semua data booking dan pembayarannya akan dihapus permanen.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={onCancel}
          className="btn"
          style={{ background: 'var(--bg-light)', color: 'var(--text-main)', padding: '10px 24px' }}
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          className="btn"
          style={{ background: '#dc2626', color: 'white', padding: '10px 24px' }}
        >
          <Trash2 size={16} /> Ya, Hapus
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────
const UserManagement = () => {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [deletingUser, setDeletingUser] = useState(null);
  const [updatingId, setUpdatingId]     = useState(null);
  const [toast, setToast]               = useState(null);

  const currentUserStr = localStorage.getItem('user');
  const currentUser    = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      showToast('Gagal memuat data pengguna.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('Role berhasil diperbarui.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengubah role.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      showToast(`Akun ${deletingUser.name} berhasil dihapus.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menghapus pengguna.', 'error');
    } finally {
      setDeletingUser(null);
    }
  };

  // ── Filter & Search ──────────────────────────────────────
  const filtered = users.filter(u => {
    const matchesRole   = filterRole === 'all' || u.role === filterRole || (filterRole === 'superadmin' && u.role === 'super_admin');
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // ── Stats ────────────────────────────────────────────────
  const stats = {
    total:      users.length,
    customer:   users.filter(u => u.role === 'customer').length,
    admin:      users.filter(u => u.role === 'admin').length,
    superadmin: users.filter(u => u.role === 'superadmin' || u.role === 'super_admin').length,
  };

  // true jika sudah ada super admin di sistem
  const hasSuperAdmin = stats.superadmin > 0;

  const isSelf = (id) => currentUser?.id === id;
  const isSuperAdminTarget = (role) => role === 'superadmin' || role === 'super_admin';

  // ── Render ───────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 2000,
          padding: '14px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '14px',
          background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: toast.type === 'success' ? '#059669' : '#dc2626',
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'success' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {deletingUser && (
        <ConfirmModal
          user={deletingUser}
          onConfirm={handleDelete}
          onCancel={() => setDeletingUser(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #154c3c, #1a6b52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Users size={24} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Manajemen Pengguna</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Kelola akun dan hak akses seluruh pengguna platform
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'
          }}>
            🔒 Super Admin Only
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Pengguna',  value: stats.total,      icon: <Users size={20} />,      color: '#154c3c', bg: '#f0fdf4' },
          { label: 'Customer',        value: stats.customer,   icon: <Shield size={20} />,     color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Admin',           value: stats.admin,      icon: <ShieldCheck size={20}/>, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Super Admin',     value: stats.superadmin, icon: <ShieldAlert size={20}/>, color: '#dc2626', bg: '#fef2f2' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'customer', 'admin', 'superadmin'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none',
                background: filterRole === role ? 'var(--primary)' : 'var(--bg-light)',
                color:      filterRole === role ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {role === 'all' ? 'Semua' : role === 'superadmin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
              {' '}
              ({role === 'all' ? stats.total : role === 'superadmin' ? stats.superadmin : stats[role] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            Memuat data pengguna...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border)' }}>
                  {['Pengguna', 'Email', 'Total Booking', 'Role', 'Bergabung', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                      Tidak ada pengguna yang cocok.
                    </td>
                  </tr>
                ) : (
                  filtered.map(user => (
                    <tr
                      key={user.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Avatar + Name */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #154c3c, #1a6b52)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '700', fontSize: '15px', overflow: 'hidden'
                          }}>
                            {user.profilePicUrl
                              ? <img src={`http://localhost:3001${user.profilePicUrl}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {user.name}
                              {isSelf(user.id) && (
                                <span style={{ marginLeft: '6px', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', background: '#fef3c7', color: '#d97706', fontWeight: '700' }}>
                                  Anda
                                </span>
                              )}
                            </div>
                            {user.whatsapp && (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                📱 {user.whatsapp}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        {user.email}
                      </td>

                      {/* Booking count */}
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                          background: user._count.bookings > 0 ? '#d1fae5' : 'var(--bg-light)',
                          color: user._count.bookings > 0 ? '#059669' : 'var(--text-muted)'
                        }}>
                          {user._count.bookings} booking
                        </span>
                      </td>

                      {/* Role Selector */}
                      <td style={{ padding: '16px' }}>
                        {isSelf(user.id) || isSuperAdminTarget(user.role) ? (
                          <RoleBadge role={user.role} />
                        ) : (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <select
                              value={user.role}
                              disabled={updatingId === user.id}
                              onChange={e => handleRoleChange(user.id, e.target.value)}
                              style={{
                                appearance: 'none', padding: '6px 32px 6px 12px',
                                borderRadius: '20px', border: `1.5px solid ${ROLES[user.role]?.color || '#ccc'}`,
                                background: ROLES[user.role]?.bg || 'white',
                                color: ROLES[user.role]?.color || 'inherit',
                                fontWeight: '600', fontSize: '12px', cursor: 'pointer',
                                outline: 'none', opacity: updatingId === user.id ? 0.5 : 1
                              }}
                            >
                              <option value="customer">Customer</option>
                              <option value="admin">Admin</option>
                              {/* Opsi Super Admin hanya muncul jika belum ada super admin */}
                              {!hasSuperAdmin && (
                                <option value="superadmin">Super Admin</option>
                              )}
                            </select>
                            <ChevronDown size={12} style={{
                              position: 'absolute', right: '10px', top: '50%',
                              transform: 'translateY(-50%)', pointerEvents: 'none',
                              color: ROLES[user.role]?.color || '#666'
                            }} />
                            {updatingId === user.id && (
                              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>Menyimpan...</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px' }}>
                        {!isSelf(user.id) && !isSuperAdminTarget(user.role) ? (
                          <button
                            id={`delete-user-${user.id}`}
                            onClick={() => setDeletingUser(user)}
                            title="Hapus pengguna"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '36px', height: '36px', borderRadius: '8px',
                              background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Footer info */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-light)', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCog size={14} />
              Menampilkan <strong>{filtered.length}</strong> dari <strong>{users.length}</strong> pengguna
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
