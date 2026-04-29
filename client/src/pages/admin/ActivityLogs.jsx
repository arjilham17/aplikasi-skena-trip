import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, User, Clock, Search, Filter } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Gagal memuat log aktivitas', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return '#059669'; // Green
    if (action.includes('DELETE')) return '#dc2626'; // Red
    if (action.includes('UPDATE')) return '#d97706'; // Amber
    if (action.includes('VERIFY')) return '#2563eb'; // Blue
    return 'var(--text-main)';
  };

  const filteredLogs = logs.filter(log => 
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat Log Aktivitas...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={32} color="var(--primary)" /> Log Aktivitas
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau riwayat tindakan penting yang dilakukan oleh Admin & Super Admin</p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Cari aktivitas atau admin..." 
            className="input" 
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada log aktivitas yang ditemukan.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredLogs.map(log => (
              <div key={log.id} style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                background: 'var(--bg-light)', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--bg-white)', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <User size={20} color="var(--primary)" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {log.user?.name} <span style={{ fontWeight: '400', fontSize: '12px', color: 'white', background: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase' }}>{log.user?.role}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: getActionColor(log.action), marginRight: '8px' }}>[{log.action}]</span>
                    {log.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
