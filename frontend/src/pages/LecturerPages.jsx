import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Badge, Modal, Input, Select, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { ClipboardIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon, CalendarPlusIcon, CalendarIcon, ClockIcon, FlaskIcon, MapPinIcon, UsersGroupIcon } from '../components/common/Icons.jsx';

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

      <Card>
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Upcoming Approved Sessions</h3>
        {upcoming.length === 0 ? <EmptyState Icon={CalendarIcon} title="No upcoming sessions" description="Book a lab to get started" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcoming.map(b => (
              <div key={b._id} style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '2px' }}>{b.lab?.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                    {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · {SLOT_LABELS[b.timeSlot]}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{b.studentBatch?.name}</div>
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
function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [studentModal, setStudentModal] = useState(null); // holds the batch object

  const load = useCallback(() => {
    setLoading(true);
    api.get('/lecturer/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

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
          {filtered.length === 0 ? <EmptyState Icon={ClipboardIcon} title="No requests found" description="Submit a booking request from the Book a Lab page" /> : filtered.map(b => (
            <Card key={b._id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{b.lab?.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{b.lab?.location}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '13px' }}>
                <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</div>
                  <div>{new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style={{ color: 'var(--accent-light)' }}>{SLOT_LABELS[b.timeSlot]}</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Batch</div>
                  <div style={{ fontWeight: '500' }}>{b.studentBatch?.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '2px' }}>{b.studentBatch?.academicYear} · {b.studentBatch?.focusArea}</div>
                  {b.studentBatch?.students?.length > 0 && (
                    <button
                      onClick={() => setStudentModal(b.studentBatch)}
                      style={{
                        marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                        background: 'var(--bg2)', color: 'var(--primary, #4f6ef7)',
                        fontSize: '11px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow, rgba(79,142,247,0.12))'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
                    >
                      <UsersGroupIcon size={12} />
                      View {b.studentBatch.students.length} Students
                    </button>
                  )}
                </div>
              </div>
              {b.purpose && (
                <div style={{ fontSize: '13px', color: 'var(--text2)', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose: </span>{b.purpose}
                </div>
              )}
              {b.status === 'rejected' && b.rejectionReason && (
                <div style={{ padding: '10px 12px', background: '#2d0f0f', border: '1px solid var(--danger)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
                  <strong>Rejection Reason:</strong> {b.rejectionReason}
                </div>
              )}
              {b.handledBy && (
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  Handled by {b.handledBy.name} · {b.handledAt && new Date(b.handledAt).toLocaleDateString()}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Student List Modal */}
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
                    background: 'var(--primary-glow, rgba(79,142,247,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '600', color: 'var(--primary, #4f6ef7)',
                  }}>
                    {s.name ? s.name.charAt(0).toUpperCase() : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{s.name}</div>
                    {s.registrationNumber && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{s.registrationNumber}</div>
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


export default function LecturerApp() {
  return (
    <div style={{ padding: '32px' }}>
      <Routes>
        <Route index element={<LecturerDashboard />} />
        <Route path="book" element={<BookLabPage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
      </Routes>
    </div>
  );
}
