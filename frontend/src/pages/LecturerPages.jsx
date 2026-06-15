import React, { useState, useEffect, useCallback } from 'react';
import { LecturerRecurringPage } from './SemesterPages.jsx';
import { Routes, Route } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Badge, Modal, Input, Select, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { ClipboardIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon, CalendarPlusIcon, CalendarIcon, ClockIcon, FlaskIcon, MapPinIcon, UsersGroupIcon, EditIcon, TrashIcon, SettingsIcon } from '../components/common/Icons.jsx';

const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00'];
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
function LecturerSessionsSection({ sessions }) {
  const [view, setView] = useState('list');
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Upcoming Approved Sessions</h3>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {['list','grid'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: view === v ? '#4f6ef7' : 'var(--bg3)', color: view === v ? '#fff' : 'var(--text2)' }}>
              {v === 'list' ? 'List' : 'Grid'}
            </button>
          ))}
        </div>
      </div>
      {sessions.length === 0 ? <EmptyState Icon={CalendarIcon} title="No upcoming sessions" description="Book a lab to get started" /> : (
        view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.map(b => (
              <div key={b._id} style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '2px' }}>{b.lab?.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · {SLOT_LABELS[b.timeSlot]}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{b.studentBatch?.name}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {sessions.map(b => (
              <div key={b._id} style={{ padding: '14px', background: 'var(--bg3)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{b.lab?.name}</div>
                <div style={{ fontSize: '11px', color: '#4f6ef7', fontWeight: '500' }}>{new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{SLOT_LABELS[b.timeSlot]}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.studentBatch?.name}</div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )
      )}
    </Card>
  );
}

function LecturerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lecturer/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  const upcoming = bookings.filter(b => b.status === 'approved' && new Date(b.date) >= new Date()).slice(0, 5);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={36} /></div>;

  return (
    <div className="page">
      <PageHeader title="Lecturer Dashboard" subtitle="Manage your lab booking requests" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Requests', value: stats.total, color: '#4f6ef7', Icon: ClipboardIcon },
          { label: 'Pending', value: stats.pending, color: '#f59e0b', Icon: AlertCircleIcon },
          { label: 'Approved', value: stats.approved, color: '#10b981', Icon: CheckCircleIcon },
          { label: 'Rejected', value: stats.rejected, color: '#ef4444', Icon: XCircleIcon },
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

      <LecturerSessionsSection sessions={upcoming} />
    </div>
  );
}

// ── BOOK LAB ──────────────────────────────────────────────────────────────
function BookLabPage() {
  const { addToast } = useToast();
  const [labs, setLabs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [form, setForm] = useState({ lab: '', studentBatch: '', date: '', timeSlot: '', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/lecturer/labs'), api.get('/lecturer/batches')])
      .then(([labsR, batchesR]) => { setLabs(labsR.data); setBatches(batchesR.data); })
      .finally(() => setDataLoading(false));
  }, []);

  // Load availability when lab + date selected
  useEffect(() => {
    if (form.lab && form.date) {
      api.get('/lecturer/availability', { params: { labId: form.lab, date: form.date } })
        .then(r => setAvailability(r.data));
    }
  }, [form.lab, form.date]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const bookedSlots = availability.map(a => a.timeSlot);

  const submit = async () => {
    if (!form.lab || !form.studentBatch || !form.date || !form.timeSlot || !form.purpose) {
      addToast('Please fill all fields', 'error'); return;
    }
    setLoading(true);
    try {
      await api.post('/lecturer/bookings', form);
      addToast('Booking request submitted!', 'success');
      setSuccess(true);
      setForm({ lab: '', studentBatch: '', date: '', timeSlot: '', purpose: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  if (dataLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={36} /></div>;

  return (
    <div className="page">
      <PageHeader title="Book a Lab" subtitle="Submit a lab booking request for your students" />

      {success && (
        <div style={{ padding: '16px 20px', background: '#0d2f23', border: '1px solid var(--success)', borderRadius: 'var(--radius)', marginBottom: '24px', color: '#6ee7b7' }}>
          Your request has been submitted and is pending lab assistant approval.
        </div>
      )}

      <div style={{ maxWidth: 600 }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Select label="Select Lab" value={form.lab} onChange={set('lab')}>
              <option value="">Choose a lab...</option>
              {labs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.location} (cap. {l.capacity})</option>)}
            </Select>

            <Select label="Student Batch" value={form.studentBatch} onChange={set('studentBatch')}>
              <option value="">Choose student batch...</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.academicYear} · {b.focusArea})</option>)}
            </Select>

            <Input label="Date" type="date" value={form.date} onChange={set('date')} min={today} />

            {form.lab && form.date && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                  Select Time Slot
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {TIME_SLOTS.map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = form.timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setForm(f => ({ ...f, timeSlot: slot }))}
                        style={{
                          padding: '14px 12px',
                          borderRadius: '10px',
                          border: `2px solid ${isSelected ? 'var(--accent)' : isBooked ? 'var(--border)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--accent)22' : isBooked ? 'var(--bg3)' : 'var(--bg3)',
                          color: isBooked ? 'var(--text3)' : isSelected ? 'var(--accent-light)' : 'var(--text)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          textAlign: 'center'
                        }}
                      >
                        <div>{SLOT_LABELS[slot]}</div>
                        {isBooked && <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--danger)' }}>Already booked</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                Purpose / Description
              </label>
              <textarea
                value={form.purpose}
                onChange={set('purpose')}
                placeholder="e.g. Network Configuration Lab — Week 5 practical session"
                rows={3}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', width: '100%', resize: 'vertical' }}
              />
            </div>

            <Button onClick={submit} loading={loading} style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
              Submit Booking Request
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── MY BOOKINGS ──────────────────────────────────────────────────────────
function BookingCard({ b, onEdit, onCancel, onViewStudents }) {
  const dateStr = React.useMemo(() => {
    try {
      return b.date ? new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
    } catch { return 'Invalid date'; }
  }, [b.date]);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{b.lab?.name || 'Unknown Lab'}</h3>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{b.lab?.location || ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status={b.status} />
          {b.status === 'pending' && (
            <>
              <button
                onClick={() => onEdit(b)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)', color: '#4f6ef7', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
              >
                <EditIcon size={13} /> Edit
              </button>
              <button
                onClick={() => onCancel(b._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', background: 'rgba(247,90,90,0.1)', border: '1px solid rgba(247,90,90,0.3)', color: 'var(--danger)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
              >
                <TrashIcon size={13} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '13px' }}>
        <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
          <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</div>
          <div>{dateStr}</div>
          <div style={{ color: '#7c9ef8', marginTop: '2px' }}>{SLOT_LABELS[b.timeSlot] || b.timeSlot}</div>
        </div>
        <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
          <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Batch</div>
          <div style={{ fontWeight: '500' }}>{b.studentBatch?.name || 'No batch'}</div>
          <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '2px' }}>
            {[b.studentBatch?.academicYear, b.studentBatch?.focusArea].filter(Boolean).join(' · ')}
          </div>
          {(b.studentBatch?.students?.length ?? 0) > 0 && (
            <button
              onClick={() => onViewStudents(b.studentBatch)}
              style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg2)', color: '#4f6ef7', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}
            >
              <UsersGroupIcon size={12} />
              View {b.studentBatch.students.length} Students
            </button>
          )}
        </div>
      </div>

      {b.purpose && (
        <div style={{ fontSize: '13px', color: 'var(--text2)', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose: </span>
          {b.purpose}
        </div>
      )}
      {b.status === 'rejected' && b.rejectionReason && (
        <div style={{ padding: '10px 12px', background: '#2d0f0f', border: '1px solid var(--danger)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
          <strong>Rejection Reason:</strong> {b.rejectionReason}
        </div>
      )}
      {b.handledBy?.name && (
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          Handled by {b.handledBy.name}
          {b.handledAt ? ` · ${new Date(b.handledAt).toLocaleDateString()}` : ''}
        </div>
      )}
    </Card>
  );
}

function MyBookingsPage() {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [studentModal, setStudentModal] = useState(null);
  const [editModal, setEditModal] = useState(null);   // booking being edited
  const [cancelId, setCancelId] = useState(null);     // booking id to confirm cancel
  const [editForm, setEditForm] = useState({});
  const [labs, setLabs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/lecturer/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.get('/lecturer/labs').then(r => setLabs(r.data)).catch(() => {});
    api.get('/lecturer/batches').then(r => setBatches(r.data)).catch(() => {});
  }, [load]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const openEdit = (b) => {
    let dateStr = '';
    try { dateStr = b.date ? new Date(b.date).toISOString().split('T')[0] : ''; } catch(e) {}
    setEditForm({
      lab: b.lab?._id || '',
      studentBatch: b.studentBatch?._id || '',
      date: dateStr,
      timeSlot: b.timeSlot || TIME_SLOTS[0],
      purpose: b.purpose || '',
    });
    setEditModal(b);
  };

  const submitEdit = async () => {
    setSaving(true);
    try {
      await api.patch(`/lecturer/bookings/${editModal._id}`, editForm);
      addToast('Booking updated successfully', 'success');
      setEditModal(null);
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally { setSaving(false); }
  };

  const confirmCancel = async () => {
    try {
      await api.delete(`/lecturer/bookings/${cancelId}`);
      addToast('Booking cancelled', 'success');
      setCancelId(null);
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Cancel failed', 'error');
    }
  };

  const setField = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page">
      <PageHeader title="My Lab Requests" subtitle="Track all your booking requests" action={<Button size="sm" variant="secondary" onClick={load}>↻ Refresh</Button>} />

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
            background: filter === s ? 'var(--accent)' : 'var(--bg3)',
            color: filter === s ? '#fff' : 'var(--text2)',
            textTransform: 'capitalize'
          }}>{s}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0
            ? <EmptyState Icon={ClipboardIcon} title="No requests found" description="Submit a booking request from the Book a Lab page" />
            : filtered.map(b => (
            <BookingCard
              key={b._id}
              b={b}
              onEdit={openEdit}
              onCancel={setCancelId}
              onViewStudents={setStudentModal}
            />
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Booking Request">
        {editModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Lab */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lab</label>
              <select
                value={editForm.lab}
                onChange={setField('lab')}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '10px 12px', width: '100%', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Select lab</option>
                {labs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.location}</option>)}
              </select>
            </div>

            {/* Student Batch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Batch</label>
              <select
                value={editForm.studentBatch}
                onChange={setField('studentBatch')}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '10px 12px', width: '100%', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Select batch</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.academicYear} · {b.focusArea})</option>)}
              </select>
            </div>

            {/* Date + Time Slot side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={setField('date')}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '10px 12px', width: '100%', outline: 'none', colorScheme: 'dark' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Slot</label>
                <select
                  value={editForm.timeSlot}
                  onChange={setField('timeSlot')}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '10px 12px', width: '100%', outline: 'none', cursor: 'pointer' }}
                >
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose</label>
              <textarea
                value={editForm.purpose}
                onChange={setField('purpose')}
                rows={3}
                placeholder="Describe the purpose of this lab session..."
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '10px 12px', width: '100%', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
              <button
                onClick={() => setEditModal(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={saving}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: saving ? '#2a5ab8' : '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* ── Cancel Confirm Modal ── */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Booking">
        <p style={{ color: 'var(--text2)', marginBottom: '20px', fontSize: '14px' }}>
          Are you sure you want to cancel this booking request? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setCancelId(null)}>Keep It</Button>
          <Button variant="danger" onClick={confirmCancel}>Yes, Cancel</Button>
        </div>
      </Modal>

      {/* ── Student List Modal ── */}
      <Modal open={!!studentModal} onClose={() => setStudentModal(null)} title={studentModal ? `${studentModal.name} — Students` : ''}>
        {studentModal && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <Badge color="accent">{studentModal.academicYear}</Badge>
              <Badge color="neutral">{studentModal.focusArea}</Badge>
              <Badge color="info">{studentModal.students.length} students</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
              {studentModal.students.map((s, i) => (
                <div key={s._id || i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(79,142,247,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '600', color: '#4f6ef7',
                  }}>
                    {s.name ? s.name.charAt(0).toUpperCase() : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{s.name}</div>
                    {s.registerNumber && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{s.registerNumber}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', flexShrink: 0 }}>#{i + 1}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setStudentModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
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
export default function LecturerApp() {
  return (
    <div style={{ padding: '32px' }}>
      <Routes>
        <Route index element={<LecturerDashboard />} />
        <Route path="book" element={<BookLabPage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="semester-booking" element={<LecturerRecurringPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
