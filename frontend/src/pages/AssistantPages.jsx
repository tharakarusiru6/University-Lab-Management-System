import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Badge, Modal, Input, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { AlertCircleIcon, CheckCircleIcon, ClipboardIcon, FlaskIcon, MapPinIcon, UsersGroupIcon, CalendarIcon, ClockIcon } from '../components/common/Icons.jsx';

const SLOT_LABELS = { '08:00-10:00': '8:00 AM – 10:00 AM', '10:00-12:00': '10:00 AM – 12:00 PM', '12:00-14:00': '12:00 PM – 2:00 PM', '14:00-16:00': '2:00 PM – 4:00 PM' };

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function AssistantDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assistant/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const pending = bookings.filter(b => b.status === 'pending').length;
  const approved = bookings.filter(b => b.status === 'approved').length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={36} /></div>;

  return (
    <div className="page">
      <PageHeader title="Lab Assistant Dashboard" subtitle="Review and manage lab booking requests" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Pending Review', value: pending, color: '#f59e0b', Icon: AlertCircleIcon },
          { label: 'Approved', value: approved, color: '#10b981', Icon: CheckCircleIcon },
          { label: 'Total Requests', value: bookings.length, color: '#4f6ef7', Icon: ClipboardIcon },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <s.Icon size={22} color={s.color} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {pending > 0 && (
        <div style={{ padding: '16px 20px', background: '#2d1f00', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', marginBottom: '24px', color: '#fcd34d', fontSize: '14px' }}>
          You have <strong>{pending}</strong> pending booking request{pending !== 1 ? 's' : ''} awaiting review.
        </div>
      )}

      <Card>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Recent Requests</h3>
        {bookings.length === 0 ? <EmptyState Icon={ClipboardIcon} title="No requests yet" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookings.slice(0, 5).map(b => (
              <div key={b._id} style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{b.lab?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{b.lecturer?.name} · {new Date(b.date).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── REQUESTS ──────────────────────────────────────────────────────────────
function RequestsPage() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/assistant/bookings' : `/assistant/bookings?status=${filter}`;
      const r = await api.get(url);
      setBookings(r.data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handle = async (id, status, rejectionReason) => {
    setActionLoading(id);
    try {
      await api.patch(`/assistant/bookings/${id}`, { status, rejectionReason });
      addToast(status === 'approved' ? 'Booking approved!' : 'Booking rejected', status === 'approved' ? 'success' : 'info');
      setRejectModal(null); setRejectReason('');
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="page">
      <PageHeader title="Lab Requests" subtitle="Review booking requests for your labs" action={<Button size="sm" variant="secondary" onClick={load}>↻ Refresh</Button>} />

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
            background: filter === s ? 'var(--accent)' : 'var(--bg3)',
            color: filter === s ? '#fff' : 'var(--text2)',
          }}>{s}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {bookings.length === 0 ? <EmptyState Icon={ClipboardIcon} title={`No ${filter} requests`} /> : bookings.map(b => (
            <Card key={b._id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{b.lab?.name}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{b.lab?.location}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', fontSize: '13px' }}>
                  <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase' }}>Requested By</div>
                    <div style={{ fontWeight: '500' }}>{b.lecturer?.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{b.lecturer?.email}</div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase' }}>Date & Time</div>
                    <div>{new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div style={{ color: 'var(--accent-light)' }}>{SLOT_LABELS[b.timeSlot]}</div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase' }}>Student Batch</div>
                    <div>{b.studentBatch?.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{b.studentBatch?.academicYear} · {b.studentBatch?.focusArea}</div>
                    <div style={{ color: 'var(--text3)', fontSize: '11px' }}>{b.studentBatch?.students?.length || 0} students</div>
                  </div>
                </div>

                {b.purpose && (
                  <div style={{ fontSize: '13px', color: 'var(--text2)', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase' }}>Purpose: </strong>{b.purpose}
                  </div>
                )}

                {b.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <Button
                      variant="success"
                      loading={actionLoading === b._id}
                      onClick={() => handle(b._id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setRejectModal(b._id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {b.status === 'rejected' && b.rejectionReason && (
                  <div style={{ padding: '10px 12px', background: '#2d0f0f', border: '1px solid var(--danger)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
                    <strong>Rejection Reason:</strong> {b.rejectionReason}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={rejectModal !== null} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Booking Request" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text2)' }}>Please provide a reason for rejecting this request. The lecturer will be notified.</p>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Reason (optional)</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Lab under maintenance on that day..."
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', width: '100%', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" loading={actionLoading === rejectModal} onClick={() => handle(rejectModal, 'rejected', rejectReason)}>Confirm Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── MY LABS ───────────────────────────────────────────────────────────────
function MyLabsPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assistant/my-labs').then(r => setLabs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <PageHeader title="My Labs" subtitle="Labs assigned to you for management" />

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {labs.length === 0 ? <EmptyState Icon={FlaskIcon} title="No labs assigned" description="Contact your admin to get assigned to labs" /> : labs.map(lab => (
            <Card key={lab._id}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{lab.name}</h3>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>{lab.location}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <Badge color="neutral">Cap: {lab.capacity}</Badge>
                <Badge color={lab.isActive ? 'success' : 'danger'}>{lab.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              {lab.equipment?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {lab.equipment.map(e => <Badge key={e} color="neutral">{e}</Badge>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssistantApp() {
  return (
    <div style={{ padding: '32px' }}>
      <Routes>
        <Route index element={<AssistantDashboard />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="my-labs" element={<MyLabsPage />} />
      </Routes>
    </div>
  );
}
