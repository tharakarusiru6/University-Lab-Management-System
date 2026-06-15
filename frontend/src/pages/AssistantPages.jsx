import React, { useState, useEffect, useCallback } from 'react';
import AssignLabPage from './AssignLabPage.jsx';
import { Routes, Route } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Badge, Modal, Input, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { AlertCircleIcon, RefreshIcon, CheckCircleIcon, ClipboardIcon, FlaskIcon, MapPinIcon, UsersGroupIcon, CalendarIcon, ClockIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/common/Icons.jsx';

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
function AssistantRequestsSection({ bookings }) {
  const [view, setView] = useState('list');
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Recent Requests</h3>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {['list','grid'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: view === v ? '#4f6ef7' : 'var(--bg3)', color: view === v ? '#fff' : 'var(--text2)' }}>
              {v === 'list' ? 'List' : 'Grid'}
            </button>
          ))}
        </div>
      </div>
      {bookings.length === 0 ? <EmptyState Icon={ClipboardIcon} title="No requests yet" /> : (
        view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bookings.map(b => (
              <div key={b._id} style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '13px', color: 'var(--text)' }}>{b.lab?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{b.lecturer?.name} · {b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {bookings.map(b => (
              <div key={b._id} style={{ padding: '14px', background: 'var(--bg3)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{b.lab?.name}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{b.lecturer?.name}</div>
                <div style={{ fontSize: '11px', color: '#4f6ef7', fontWeight: '500' }}>{b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                {b.studentBatch?.name && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.studentBatch.name}</div>}
              </div>
            ))}
          </div>
        )
      )}
    </Card>
  );
}

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

      <AssistantRequestsSection bookings={bookings.slice(0, 6)} />
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


function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.currentPassword || !form.newPassword) { addToast('Please fill all fields', 'error'); return; }
    if (form.newPassword !== form.confirmPassword) { addToast('Passwords do not match', 'error'); return; }
    if (form.newPassword.length < 6) { addToast('New password must be at least 6 characters', 'error'); return; }
    setLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      addToast('Password changed successfully', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { addToast(err.response?.data?.message || 'Failed to change password', 'error'); }
    finally { setLoading(false); }
  };

  const roleLabel = { lecturer: 'Lecturer', lab_assistant: 'Lab Assistant', student: 'Student', admin: 'Admin' };

  return (
    <div className="page">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Account Settings</h1>
        <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Manage your profile and security</p>
      </div>
      <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Profile info card */}
        <div style={{ background: 'var(--surface, var(--bg2))', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text)' }}>Profile</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(79,142,247,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '700', color: '#4f6ef7', fontFamily: 'Syne, sans-serif'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text)' }}>{user?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Role</div>
              <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{roleLabel[user?.role] || user?.role}</div>
            </div>
            {user?.academicYear && (
              <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Academic Year</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{user.academicYear}</div>
              </div>
            )}
            {user?.focusArea && (
              <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Focus Area</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{user.focusArea}</div>
              </div>
            )}
            {user?.registerNumber && (
              <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Reg. Number</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{user.registerNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Change password card */}
        <div style={{ background: 'var(--surface, var(--bg2))', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text)' }}>Change Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'newPassword',     label: 'New Password',     placeholder: 'Enter new password (min 6 chars)' },
              { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '10px 12px', width: '100%', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#4f6ef7'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}
            <button
              onClick={save}
              disabled={loading}
              style={{
                marginTop: '6px', padding: '11px', borderRadius: '8px', border: 'none',
                background: loading ? '#2a5ab8' : '#4f6ef7', color: '#fff',
                fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const TIME_SLOTS_SCHEDULE = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00'];
const SLOT_LABELS_SCHEDULE = {
  '08:00-10:00': '8:00 – 10:00 AM',
  '10:00-12:00': '10:00 AM – 12:00 PM',
  '12:00-14:00': '12:00 – 2:00 PM',
  '14:00-16:00': '2:00 – 4:00 PM',
};
const STATUS_COLORS = {
  approved: { bg: 'rgba(61,214,140,0.12)', border: 'rgba(61,214,140,0.35)', text: '#3dd68c', dot: '#3dd68c' },
  pending:  { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.35)',  text: '#f5a623', dot: '#f5a623' },
  rejected: { bg: 'rgba(247,90,90,0.08)',  border: 'rgba(247,90,90,0.25)',   text: '#f75a5a', dot: '#f75a5a' },
};

function SchedulePage({ apiPrefix }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({ bookings: [], labs: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/${apiPrefix}/schedule?date=${date}`)
      .then(r => setData(r.data))
      .catch(() => setData({ bookings: [], labs: [] }))
      .finally(() => setLoading(false));
  }, [date, apiPrefix]);

  useEffect(() => { load(); }, [load]);

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]); };
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]); };
  const today   = () => setDate(new Date().toISOString().split('T')[0]);
  const isToday = date === new Date().toISOString().split('T')[0];

  const grid = {};
  data.labs.forEach(lab => { grid[lab._id] = {}; });
  data.bookings.forEach(b => {
    if (b.lab?._id) { grid[b.lab._id] = grid[b.lab._id] || {}; grid[b.lab._id][b.timeSlot] = b; }
  });

  const totalSlots  = data.labs.length * TIME_SLOTS_SCHEDULE.length;
  const bookedSlots = data.bookings.filter(b => b.status !== 'rejected').length;
  const freeSlots   = totalSlots - bookedSlots;
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Lab Schedule</h1>
        <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>View lab availability and bookings by day</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={prevDay} style={{ width: 34, height: 34, borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeftIcon size={16} />
          </button>
          <div style={{ textAlign: 'center', minWidth: 220 }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{displayDate}</div>
            {isToday && <div style={{ fontSize: '11px', color: '#4f6ef7', fontWeight: '500', marginTop: '1px' }}>Today</div>}
          </div>
          <button onClick={nextDay} style={{ width: 34, height: 34, borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRightIcon size={16} />
          </button>
          {!isToday && <button onClick={today} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Today</button>}
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '13px', outline: 'none', colorScheme: 'dark' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(61,214,140,0.12)', color: '#3dd68c', border: '1px solid rgba(61,214,140,0.3)' }}>{freeSlots} Free</span>
            <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(79,142,247,0.12)', color: '#4f6ef7', border: '1px solid rgba(79,142,247,0.3)' }}>{bookedSlots} Booked</span>
          </div>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            {['grid','list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: view === v ? '#4f6ef7' : 'var(--bg3)', color: view === v ? '#fff' : 'var(--text2)' }}>{v === 'grid' ? 'Grid' : 'List'}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner /></div>
      ) : data.labs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text2)', marginBottom: '4px' }}>No labs found</div>
          <div style={{ fontSize: '13px' }}>No labs are assigned yet</div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg2)', borderRadius: '8px', minWidth: 150 }}>Lab</th>
                {TIME_SLOTS_SCHEDULE.map(slot => (
                  <th key={slot} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--bg2)', borderRadius: '8px', minWidth: 155 }}>{SLOT_LABELS_SCHEDULE[slot]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.labs.map(lab => (
                <tr key={lab._id}>
                  <td style={{ padding: '10px 14px', background: 'var(--bg2)', borderRadius: '8px', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{lab.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{lab.location}</div>
                    {lab.capacity && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>Cap: {lab.capacity}</div>}
                  </td>
                  {TIME_SLOTS_SCHEDULE.map(slot => {
                    const booking = grid[lab._id]?.[slot];
                    const sc = booking ? STATUS_COLORS[booking.status] : null;
                    return (
                      <td key={slot} style={{ padding: '4px', verticalAlign: 'top' }}>
                        {booking ? (
                          <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '8px', padding: '8px 10px', minHeight: 84 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                              <span style={{ fontSize: '10px', fontWeight: '600', color: sc.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{booking.status}</span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', lineHeight: 1.3 }}>{booking.studentBatch?.name || 'N/A'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>{booking.lecturer?.name}</div>
                            {booking.purpose && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.purpose}</div>}
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(61,214,140,0.04)', border: '1px dashed rgba(61,214,140,0.2)', borderRadius: '8px', minHeight: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(61,214,140,0.45)', fontWeight: '500' }}>Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '15px', color: 'var(--text2)', fontWeight: '500', marginBottom: '4px' }}>No bookings on this day</div>
              <div style={{ fontSize: '13px' }}>All lab slots are free</div>
            </div>
          ) : data.bookings.map(b => {
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            return (
              <div key={b._id} style={{ background: 'var(--bg2)', border: `1px solid ${sc.border}`, borderLeft: `3px solid ${sc.dot}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: sc.text }}>{SLOT_LABELS_SCHEDULE[b.timeSlot]}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.status}</div>
                </div>
                <div style={{ minWidth: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Lab</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{b.lab?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.lab?.location}</div>
                </div>
                <div style={{ minWidth: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Batch</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{b.studentBatch?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.studentBatch?.academicYear} · {b.studentBatch?.focusArea}</div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Lecturer</div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{b.lecturer?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.lecturer?.email}</div>
                </div>
                {b.purpose && (
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Purpose</div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{b.purpose}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


const SLOT_LABELS_R = { '08:00-10:00':'8:00–10:00 AM','10:00-12:00':'10:00 AM–12:00 PM','12:00-14:00':'12:00–2:00 PM','14:00-16:00':'2:00–4:00 PM' };

function RecurringRequestsPage() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [modal, setModal] = useState(null); // the recurring booking being reviewed
  const [decisions, setDecisions] = useState({}); // { index: 'approved'|'rejected' }
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/semesters/recurring-requests')
      .then(r => setRequests(r.data))
      .catch(() => addToast('Failed to load recurring requests', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (req) => {
    setModal(req);
    // default all to approved
    const d = {};
    req.sessions.forEach((_, i) => { d[i] = req.sessions[i].status === 'pending' ? 'approved' : req.sessions[i].status; });
    setDecisions(d);
    setRejectReason('');
  };

  const toggleSession = (index) => {
    setDecisions(prev => ({ ...prev, [index]: prev[index] === 'approved' ? 'rejected' : 'approved' }));
  };

  const approveAll = () => {
    const d = {};
    modal.sessions.forEach((_, i) => { d[i] = 'approved'; });
    setDecisions(d);
  };

  const rejectAll = () => {
    const d = {};
    modal.sessions.forEach((_, i) => { d[i] = 'rejected'; });
    setDecisions(d);
  };

  const submit = async () => {
    setProcessing(modal._id);
    try {
      const sessionDecisions = Object.entries(decisions).map(([index, status]) => ({
        index: parseInt(index), status,
        rejectionReason: status === 'rejected' ? (rejectReason || 'Rejected by lab assistant') : '',
      }));
      const { data } = await api.patch(`/semesters/recurring-requests/${modal._id}/process`, { sessionDecisions });
      addToast(data.message, 'success');
      setModal(null);
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to process', 'error');
    } finally { setProcessing(null); }
  };

  const statusColor = { approved: '#3dd68c', pending: '#f5a623', rejected: '#f75a5a', partial: '#4f6ef7' };
  const statusBg    = { approved: 'rgba(61,214,140,0.1)', pending: 'rgba(245,166,35,0.1)', rejected: 'rgba(247,90,90,0.1)', partial: 'rgba(79,142,247,0.1)' };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Recurring Requests</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Semester-wide lab booking requests from lecturers</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}>
          <RefreshIcon size={14} /> Refresh
        </button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner /></div>
      : requests.length === 0 ? <EmptyState Icon={ClipboardIcon} title="No recurring requests" description="Recurring semester booking requests from lecturers will appear here" />
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map(req => (
            <div key={req._id} style={{ background: 'var(--bg2)', border: `1px solid ${statusColor[req.status]}44`, borderLeft: `3px solid ${statusColor[req.status]}`, borderRadius: '12px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{req.lab?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{req.semester?.name} · {SLOT_LABELS_R[req.timeSlot]}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>By {req.lecturer?.name} · {req.studentBatch?.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: statusBg[req.status], color: statusColor[req.status], border: `1px solid ${statusColor[req.status]}44`, textTransform: 'capitalize' }}>
                    {req.status}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{req.sessions?.length} sessions</span>
                </div>
              </div>

              {/* Session summary pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                {req.sessions?.map((s, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', background: statusBg[s.status], color: statusColor[s.status], border: `1px solid ${statusColor[s.status]}33` }}>
                    {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
              </div>

              {req.status === 'pending' && (
                <button onClick={() => openModal(req)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Review Request
                </button>
              )}
              {(req.status === 'partial' || req.status === 'approved' || req.status === 'rejected') && (
                <button onClick={() => openModal(req)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}>
                  View Details
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>Review Recurring Request</h2>
                <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '3px' }}>{modal.lab?.name} · {SLOT_LABELS_R[modal.timeSlot]}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Lecturer', value: modal.lecturer?.name },
                { label: 'Batch', value: modal.studentBatch?.name },
                { label: 'Semester', value: modal.semester?.name },
                { label: 'Purpose', value: modal.purpose || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button onClick={approveAll} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid rgba(61,214,140,0.35)', background: 'rgba(61,214,140,0.1)', color: '#3dd68c', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                ✓ Approve All ({modal.sessions.length})
              </button>
              <button onClick={rejectAll} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid rgba(247,90,90,0.35)', background: 'rgba(247,90,90,0.08)', color: '#f75a5a', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                ✕ Reject All
              </button>
            </div>

            {/* Per-session toggle */}
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Sessions — click to toggle approve/reject
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {modal.sessions.map((s, i) => {
                const dec = decisions[i] || s.status;
                const isApproved = dec === 'approved';
                return (
                  <button key={i} onClick={() => toggleSession(i)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${isApproved ? 'rgba(61,214,140,0.4)' : 'rgba(247,90,90,0.4)'}`, background: isApproved ? 'rgba(61,214,140,0.12)' : 'rgba(247,90,90,0.1)', color: isApproved ? '#3dd68c' : '#f75a5a', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    <span style={{ marginLeft: '6px', fontSize: '10px' }}>{isApproved ? '✓' : '✕'}</span>
                  </button>
                );
              })}
            </div>

            {/* Rejection reason */}
            {Object.values(decisions).some(d => d === 'rejected') && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Rejection Reason</div>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                  placeholder="Reason for rejected sessions..."
                  style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', padding: '8px 12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={!!processing}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: processing ? '#2a5ab8' : '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                {processing ? 'Processing...' : `Submit Decision (${Object.values(decisions).filter(d => d === 'approved').length} approved, ${Object.values(decisions).filter(d => d === 'rejected').length} rejected)`}
              </button>
            </div>
          </div>
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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recurring" element={<RecurringRequestsPage />} />
        <Route path="assign-lab" element={<AssignLabPage apiPrefix="assistant" />} />
        <Route path="schedule" element={<SchedulePage apiPrefix="assistant" />} />
      </Routes>
    </div>
  );
}
