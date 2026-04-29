import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  ClipboardList, Search, Users, Phone, ChevronDown,
  Copy, Check, Printer, MapPin, Calendar, Loader2,
  FileText, Table, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Date(n).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

const fmtWA = (raw) => {
  if (!raw || raw === '-') return null;
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('0') ? '62' + digits.slice(1) : digits;
};

// ─── Component ───────────────────────────────────────────────────────────────

const PassengerManifest = () => {
  const [trips, setTrips]           = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [tripInfo, setTripInfo]     = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [totalPax, setTotalPax]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [copied, setCopied]         = useState(false);
  const [search, setSearch]         = useState('');
  const printRef                    = useRef();

  // ── Load trip list on mount ───────────────────────────────────────────────
  useEffect(() => {
    api.get('/manifest')
      .then(res => setTrips(res.data.trips || []))
      .catch(console.error)
      .finally(() => setTripsLoading(false));
  }, []);

  // ── Load manifest whenever trip selection changes ─────────────────────────
  useEffect(() => {
    if (!selectedTripId) {
      setTripInfo(null);
      setPassengers([]);
      setTotalPax(0);
      return;
    }
    setLoading(true);
    api.get(`/manifest?tripId=${selectedTripId}`)
      .then(res => {
        setTripInfo(res.data.trip);
        setPassengers(res.data.passengers || []);
        setTotalPax(res.data.totalPax || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTripId]);

  // ── Filtered passengers ───────────────────────────────────────────────────
  const filtered = passengers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.whatsapp.includes(search)
  );

  // ── Copy WhatsApp numbers ─────────────────────────────────────────────────
  const handleCopyNumbers = () => {
    const nums = passengers
      .map(p => fmtWA(p.whatsapp))
      .filter(Boolean)
      .join('\n');
    if (!nums) return;
    navigator.clipboard.writeText(nums).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Export Logic ────────────────────────────────────────────────────────
  const prepareExportData = () => {
    return passengers.map((p, idx) => ({
      'No': idx + 1,
      'ID Booking': `#BK-${p.bookingId.toString().padStart(4, '0')}`,
      'Nama Peserta': p.name,
      'Email': p.email,
      'No. WhatsApp': p.whatsapp,
      'Gender': p.gender,
      'Pax': p.pax,
      'Tgl Booking': new Date(p.bookedAt).toLocaleDateString('id-ID')
    }));
  };

  const exportToCSV = () => {
    const data = prepareExportData();
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Manifest_${tripInfo.title.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Manifest");
    XLSX.writeFile(wb, `Manifest_${tripInfo.title.replace(/\s+/g, '_')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Passenger Manifest Skena Trip", 14, 15);
    doc.setFontSize(11);
    doc.text(`Trip: ${tripInfo.title}`, 14, 23);
    doc.text(`Destinasi: ${tripInfo.destination} | Tanggal: ${fmt(tripInfo.date)}`, 14, 29);
    doc.text(`Total Peserta: ${totalPax} Seat`, 14, 35);
    
    const data = prepareExportData();
    const columns = Object.keys(data[0]);
    const rows = data.map(row => Object.values(row));

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillStyle: [21, 76, 60] }
    });

    doc.save(`Manifest_${tripInfo.title.replace(/\s+/g, '_')}.pdf`);
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), #1a6b54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ClipboardList size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Manifest Penumpang
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Daftar peserta terkonfirmasi beserta nomor WhatsApp per Trip
            </p>
          </div>
        </div>
      </div>

      {/* ── Trip Selector Card ── */}
      <div className="card no-print" style={{ padding: '24px', marginBottom: '24px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          PILIH TRIP
        </label>
        <div style={{ position: 'relative', maxWidth: '520px' }}>
          {tripsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Loader2 size={16} className="spin" /> Memuat daftar trip…
            </div>
          ) : (
            <>
              <select
                id="trip-selector"
                value={selectedTripId}
                onChange={e => setSelectedTripId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-white)',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif',
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              >
                <option value="">— Pilih Trip untuk melihat manifest —</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}  ·  {fmt(t.date)}  ·  {t.destination}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  color: 'var(--text-muted)'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Manifest Area ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>Memuat manifest…</p>
        </div>
      ) : selectedTripId && tripInfo ? (
        <div ref={printRef} id="manifest-print-area">

          {/* ── Trip Info Banner ── */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #1a6b54 100%)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '20px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Manifest Perjalanan
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>
                {tripInfo.title}
              </h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', opacity: 0.9 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {tripInfo.destination}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> {fmt(tripInfo.date)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} /> {totalPax} / {tripInfo.quota} Seat
                </span>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <button onClick={exportToCSV} title="Export CSV" style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                  <FileText size={16} /> CSV
                </button>
                <button onClick={exportToExcel} title="Export Excel" style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  <Table size={16} /> Excel
                </button>
                <button onClick={exportToPDF} title="Export PDF" style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  <Download size={16} /> PDF
                </button>
              </div>

              <button
                id="print-manifest-btn"
                onClick={handlePrint}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '10px',
                  background: 'white',
                  border: 'none',
                  color: 'var(--primary)', fontWeight: '700', fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Total Peserta Terkonfirmasi', value: passengers.length, color: '#059669', bg: '#d1fae5' },
              { label: 'Total Seat Terisi', value: `${totalPax} Seat`, color: '#0ea5e9', bg: '#e0f2fe' },
              { label: 'Ada No. WhatsApp', value: passengers.filter(p => p.whatsapp !== '-').length, color: '#7c3aed', bg: '#ede9fe' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '20px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{stat.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* ── Search Bar ── */}
          <div className="no-print" style={{ marginBottom: '16px', position: 'relative', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="manifest-search"
              type="text"
              placeholder="Cari nama atau nomor WA…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {/* ── Passenger Table ── */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                Daftar Penumpang
                <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: '400', color: 'var(--text-muted)' }}>
                  ({filtered.length} peserta)
                </span>
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-light)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 24px', width: '50px' }}>#</th>
                    <th style={{ padding: '12px 16px' }}>Nama Peserta</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>No. WhatsApp</th>
                    <th style={{ padding: '12px 16px' }}>Gender</th>
                    <th style={{ padding: '12px 16px' }}>Pax</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi WA</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                        {search ? 'Tidak ada peserta yang cocok dengan pencarian.' : 'Belum ada peserta terkonfirmasi untuk trip ini.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, idx) => {
                      const waNum = fmtWA(p.whatsapp);
                      return (
                        <tr
                          key={p.bookingId}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '13px' }}>
                            {p.no}
                          </td>
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              #BK-{p.bookingId.toString().padStart(4, '0')}
                            </div>
                          </td>
                          <td style={{ padding: '16px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {p.email}
                          </td>
                          <td style={{ padding: '16px 16px' }}>
                            {p.whatsapp !== '-' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Phone size={14} color="#059669" />
                                <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                                  {p.whatsapp}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>— Belum diisi —</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 16px' }}>
                            {p.gender !== '-' ? (
                              <span style={{
                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                background: p.gender?.toLowerCase() === 'pria' ? '#dbeafe' : '#fce7f3',
                                color: p.gender?.toLowerCase() === 'pria' ? '#1d4ed8' : '#9d174d'
                              }}>
                                {p.gender}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '16px 16px' }}>
                            <span style={{ fontWeight: '600' }}>{p.pax}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> seat</span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }} className="no-print">
                            {waNum ? (
                              <a
                                href={`https://wa.me/${waNum}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 14px', borderRadius: '8px',
                                  background: '#dcfce7', color: '#16a34a',
                                  fontWeight: '600', fontSize: '12px',
                                  transition: 'all 0.2s'
                                }}
                                title={`Chat WA: ${p.whatsapp}`}
                              >
                                <Phone size={13} /> Chat WA
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tidak tersedia</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── WhatsApp Numbers Block ── */}
            {passengers.filter(p => p.whatsapp !== '-').length > 0 && (
              <div style={{
                margin: '0 24px 24px',
                padding: '16px 20px',
                background: '#f0fdf4',
                border: '1px dashed #86efac',
                borderRadius: '10px',
                marginTop: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontWeight: '600', fontSize: '13px', color: '#16a34a', margin: 0 }}>
                    📋 Nomor WA untuk Grup Koordinasi
                  </p>
                  <button
                    onClick={handleCopyNumbers}
                    className="no-print"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px', borderRadius: '8px',
                      background: '#16a34a', color: 'white',
                      fontWeight: '600', fontSize: '12px', cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Tersalin!' : 'Salin Semua'}
                  </button>
                </div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '13px', color: '#15803d',
                  lineHeight: '1.8', userSelect: 'all',
                  maxHeight: '120px', overflowY: 'auto'
                }}>
                  {passengers
                    .filter(p => p.whatsapp !== '-')
                    .map(p => fmtWA(p.whatsapp))
                    .filter(Boolean)
                    .join('\n')
                    .split('\n')
                    .map((num, i) => <div key={i}>{num}</div>)
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      ) : selectedTripId && !loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p>Trip tidak ditemukan.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} style={{ marginBottom: '16px', opacity: 0.25 }} />
          <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Pilih sebuah Trip di atas</p>
          <p style={{ fontSize: '14px' }}>Manifest peserta terkonfirmasi akan ditampilkan di sini.</p>
        </div>
      )}

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          #manifest-print-area, #manifest-print-area * { visibility: visible; }
          #manifest-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PassengerManifest;
