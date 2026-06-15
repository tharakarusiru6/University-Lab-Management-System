import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Badge, Modal, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { CalendarIcon, PlusIcon, TrashIcon, EditIcon, GraduationIcon, ChevronLeftIcon, ChevronRightIcon, RefreshIcon, ClipboardIcon, FlaskIcon } from '../components/common/Icons.jsx';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = ['08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00'];
const SLOT_LABELS = { '08:00-10:00':'8:00–10:00 AM','10:00-12:00':'10:00 AM–12:00 PM','12:00-14:00':'12:00–2:00 PM','14:00-16:00':'2:00–4:00 PM' };

function fmt(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtInput(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

// ── Admin: Semester List ───────────────────────────────────────────────────
export function AdminSemesterPage() {
  const { addToast } = useToast();
  const [semesters, setSemesters] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', studentBatches: [], description: '' });
  const [saving, setSaving] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const loadSemesters = api.get('/semesters').then(r => setSemesters(r.data)).catch(err => {
      console.error('Semesters error:', err.response?.data?.message || err.message);
      addToast('Failed to load semesters: ' + (err.response?.data?.message || err.message), 'error');
    });
    const loadBatches = api.get('/admin/batches').then(r => setBatches(r.data)).catch(err => {
      console.error('Batches error:', err.response?.data?.message || err.message);
    });
    Promise.all([loadSemesters, loadBatches]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', academicYear: '', startDate: '', endDate: '', studentBatches: [], description: '' });
    setModal(true);
  };

  const openEdit = (sem) => {
    setEditTarget(sem);
    setForm({
      name: sem.name,
      startDate: fmtInput(sem.startDate),
      endDate: fmtInput(sem.endDate),
      studentBatches: sem.studentBatches?.map(b => b._id || b) || [],
      description: sem.description || '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      addToast('Please fill all required fields', 'error'); return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/semesters/${editTarget._id}`, form);
        addToast('Semester updated', 'success');
      } else {
        await api.post('/semesters', form);
        addToast('Semester created', 'success');
      }
      setModal(false);
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const deleteSem = async (id) => {
    if (!window.confirm('Delete this semester and ALL its bookings?')) return;
    try {
      await api.delete(`/semesters/${id}`);
      addToast('Semester deleted', 'success');
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  const toggleBatch = (id) => setForm(f => ({
    ...f,
    studentBatches: f.studentBatches.includes(id)
      ? f.studentBatches.filter(b => b !== id)
      : [...f.studentBatches, id]
  }));

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const today = new Date(); today.setHours(0,0,0,0);
  const active  = semesters.filter(s => new Date(s.endDate) >= today);
  const expired = semesters.filter(s => new Date(s.endDate) < today);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Semesters</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Manage academic semesters for recurring lab bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}>
            <RefreshIcon size={14} /> Refresh
          </button>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            <PlusIcon size={14} /> New Semester
          </button>
        </div>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner /></div> : (
        <>
          {active.length === 0 && expired.length === 0 && (
            <EmptyState Icon={CalendarIcon} title="No semesters yet" description="Create a semester to enable recurring lab bookings for lecturers" />
          )}

          {active.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Active Semesters</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                {active.map(sem => <SemesterCard key={sem._id} sem={sem} onEdit={openEdit} onDelete={deleteSem} onDetail={setDetailModal} />)}
              </div>
            </>
          )}

          {expired.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Expired</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {expired.map(sem => <SemesterCard key={sem._id} sem={sem} onEdit={openEdit} onDelete={deleteSem} onDetail={setDetailModal} expired />)}
              </div>
            </>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit Semester' : 'Create Semester'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Semester Name *" placeholder="e.g. Semester 1 — 2024/2025" value={form.name} onChange={set('name')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} />
            <Field label="End Date *"   type="date" value={form.endDate}   onChange={set('endDate')} />
          </div>
          <Field label="Description" placeholder="Optional notes about this semester" value={form.description} onChange={set('description')} />

          {/* Student Batches */}
          <div>
            <label style={labelStyle}>Student Batches</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 200, overflowY: 'auto', marginTop: '6px' }}>
              {batches.map(b => (
                <label key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: form.studentBatches.includes(b._id) ? 'rgba(79,142,247,0.1)' : 'var(--bg3)', border: `1px solid ${form.studentBatches.includes(b._id) ? 'rgba(79,142,247,0.4)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={form.studentBatches.includes(b._id)} onChange={() => toggleBatch(b._id)} style={{ accentColor: '#4f6ef7' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{b.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.academicYear} · {b.focusArea} · {b.students?.length ?? 0} students</div>
                  </div>
                </label>
              ))}
              {batches.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '8px' }}>No batches found — create batches first</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setModal(false)} style={secBtn}>Cancel</button>
            <button onClick={save} disabled={saving} style={primBtn(saving)}>{saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Semester'}</button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.name || ''}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <InfoBox label="Duration" value={`${fmt(detailModal.startDate)} → ${fmt(detailModal.endDate)}`} />
            </div>
            {detailModal.description && <InfoBox label="Description" value={detailModal.description} />}
            <div>
              <div style={labelStyle}>Student Batches ({detailModal.studentBatches?.length ?? 0})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {detailModal.studentBatches?.length > 0
                  ? detailModal.studentBatches.map(b => (
                    <span key={b._id} style={{ padding: '4px 10px', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '20px', fontSize: '12px', color: '#4f6ef7' }}>{b.name}</span>
                  ))
                  : <span style={{ fontSize: '13px', color: 'var(--text3)' }}>No batches assigned</span>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetailModal(null)} style={secBtn}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SemesterCard({ sem, onEdit, onDelete, onDetail, expired }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(sem.endDate);
  const start = new Date(sem.startDate);
  const totalDays = Math.round((end - start) / (1000*60*60*24));
  const elapsed = Math.max(0, Math.round((today - start) / (1000*60*60*24)));
  const pct = Math.min(100, Math.round((elapsed / totalDays) * 100));

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${expired ? 'var(--border)' : 'rgba(79,142,247,0.25)'}`, borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: expired ? 0.65 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{sem.name}</div>

        </div>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: expired ? 'rgba(247,90,90,0.1)' : 'rgba(61,214,140,0.1)', color: expired ? '#f75a5a' : '#3dd68c', border: `1px solid ${expired ? 'rgba(247,90,90,0.3)' : 'rgba(61,214,140,0.3)'}` }}>
          {expired ? 'Expired' : 'Active'}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
        <span style={{ color: 'var(--text3)' }}>From </span>{fmt(sem.startDate)}
        <span style={{ color: 'var(--text3)' }}> to </span>{fmt(sem.endDate)}
      </div>

      {!expired && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#4f6ef7', borderRadius: '3px', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', padding: '3px 9px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text2)' }}>
          {sem.studentBatches?.length ?? 0} batch{sem.studentBatches?.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => onDetail(sem)} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer' }}>Details</button>
        <button onClick={() => onEdit(sem)} style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid rgba(79,142,247,0.3)', background: 'rgba(79,142,247,0.1)', color: '#4f6ef7', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
        <button onClick={() => onDelete(sem._id)} style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid rgba(247,90,90,0.3)', background: 'rgba(247,90,90,0.08)', color: '#f75a5a', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
      </div>
    </div>
  );
}

// ── Lecturer: Book a Semester ─────────────────────────────────────────────
export function LecturerRecurringPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [labs, setLabs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected semester
  const [mode, setMode] = useState('whole'); // 'whole' | 'custom'
  const [form, setForm] = useState({ lab: '', studentBatch: '', timeSlot: '', dayOfWeek: '', purpose: '' });
  const [customDates, setCustomDates] = useState([]);
  const [preview, setPreview] = useState([]); // calculated dates
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/semesters').then(r => setSemesters(r.data)).catch(err => console.error('semesters:', err.response?.data?.message || err.message)),
      api.get('/lecturer/labs').then(r => setLabs(r.data)).catch(() => {}),
      api.get('/lecturer/batches').then(r => setBatches(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const set = key => e => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setResult(null);
  };

  // Generate preview dates
  useEffect(() => {
    if (!selected || mode !== 'whole' || form.dayOfWeek === '') { setPreview([]); return; }
    const day = parseInt(form.dayOfWeek);
    const cur = new Date(selected.startDate);
    const end = new Date(selected.endDate);
    cur.setHours(12,0,0,0); end.setHours(23,59,59,999);
    while (cur.getDay() !== day) cur.setDate(cur.getDate() + 1);
    const dates = [];
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    setPreview(dates);
  }, [selected, form.dayOfWeek, mode]);

  const toggleCustomDate = (dateStr) => {
    setCustomDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
    setResult(null);
  };

  // Generate all days in semester for custom picker
  const allDaysInSemester = React.useMemo(() => {
    if (!selected) return [];
    const days = [];
    const cur = new Date(selected.startDate); cur.setHours(12,0,0,0);
    const end = new Date(selected.endDate); end.setHours(23,59,59,999);
    while (cur <= end) { days.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }
    return days;
  }, [selected]);

  const submit = async () => {
    if (!selected) { addToast('Select a semester', 'error'); return; }
    if (!form.lab || !form.studentBatch || !form.timeSlot) { addToast('Fill all required fields', 'error'); return; }
    if (mode === 'whole' && form.dayOfWeek === '') { addToast('Select a day of week', 'error'); return; }
    if (mode === 'custom' && customDates.length === 0) { addToast('Select at least one date', 'error'); return; }
    setSubmitting(true);
    try {
      const payload = {
        lab: form.lab,
        studentBatch: form.studentBatch,
        timeSlot: form.timeSlot,
        purpose: form.purpose,
        ...(mode === 'whole' ? { dayOfWeek: parseInt(form.dayOfWeek) } : { selectedDates: customDates }),
      };
      const { data } = await api.post(`/semesters/${selected._id}/book`, payload);
      setResult({ success: true, message: data.message, count: data.count });
      addToast(data.message, 'success');
      // Clear form after success
      setForm({ lab: '', studentBatch: '', timeSlot: '', dayOfWeek: '', purpose: '' });
      setCustomDates([]);
      setPreview([]);
      setMode('whole');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed';
      setResult({ success: false, message: msg });
      addToast(msg, 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner /></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Semester Booking</h1>
        <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Book a lab for an entire semester or select specific dates</p>
      </div>

      {semesters.length === 0 ? (
        <EmptyState Icon={CalendarIcon} title="No active semesters" description="The admin hasn't created any semesters yet. Contact your administrator." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Left: semester picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>Select Semester</div>
            {semesters.map(sem => (
              <button key={sem._id} onClick={() => { setSelected(sem); setResult(null); setCustomDates([]); setPreview([]); }}
                style={{ padding: '14px 16px', borderRadius: '10px', border: `2px solid ${selected?._id === sem._id ? '#4f6ef7' : 'var(--border)'}`, background: selected?._id === sem._id ? 'rgba(79,142,247,0.08)' : 'var(--bg2)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>{sem.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmt(sem.startDate)} — {fmt(sem.endDate)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{sem.studentBatches?.length ?? 0} batch(es)</div>
              </button>
            ))}
          </div>

          {/* Right: booking form */}
          {selected ? (
            <Card>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>{selected.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>{fmt(selected.startDate)} — {fmt(selected.endDate)}</div>

              {/* Lab + Batch + Slot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <Field label="Lab *" as="select" value={form.lab} onChange={set('lab')}>
                  <option value="">Select lab</option>
                  {labs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.location}</option>)}
                </Field>
                <Field label="Student Batch *" as="select" value={form.studentBatch} onChange={set('studentBatch')}>
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.academicYear} · {b.focusArea})</option>)}
                </Field>
                <Field label="Time Slot *" as="select" value={form.timeSlot} onChange={set('timeSlot')}>
                  <option value="">Select time slot</option>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
                </Field>
                <Field label="Purpose" placeholder="e.g. Database Systems Lab" value={form.purpose} onChange={set('purpose')} />
              </div>

              {/* Mode toggle */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Booking Mode</div>
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  {[['whole','Whole Semester (Weekly)'],['custom','Pick Specific Dates']].map(([v, label]) => (
                    <button key={v} onClick={() => { setMode(v); setResult(null); }}
                      style={{ flex: 1, padding: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: mode === v ? '#4f6ef7' : 'var(--bg3)', color: mode === v ? '#fff' : 'var(--text2)', transition: 'all 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Whole semester mode: pick day of week */}
              {mode === 'whole' && (
                <div style={{ marginBottom: '16px' }}>
                  <Field label="Day of Week *" as="select" value={form.dayOfWeek} onChange={e => { set('dayOfWeek')(e); setResult(null); }}>
                    <option value="">Select day</option>
                    {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
                  </Field>
                  {preview.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>
                        Preview — {preview.length} session{preview.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: 120, overflowY: 'auto' }}>
                        {preview.map((d, i) => (
                          <span key={i} style={{ padding: '3px 8px', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '6px', fontSize: '11px', color: '#4f6ef7' }}>
                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom date picker */}
              {mode === 'custom' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                    Select Dates ({customDates.length} selected)
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {allDaysInSemester.map(dateStr => {
                      const d = new Date(dateStr + 'T12:00:00');
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const isSelected = customDates.includes(dateStr);
                      return (
                        <button key={dateStr} onClick={() => !isWeekend && toggleCustomDate(dateStr)}
                          disabled={isWeekend}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${isSelected ? '#4f6ef7' : 'var(--border)'}`, background: isSelected ? '#4f6ef7' : isWeekend ? 'var(--bg2)' : 'var(--bg2)', color: isSelected ? '#fff' : isWeekend ? 'var(--text3)' : 'var(--text2)', fontSize: '11px', cursor: isWeekend ? 'default' : 'pointer', opacity: isWeekend ? 0.4 : 1 }}>
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          <span style={{ fontSize: '9px', marginLeft: '2px', opacity: 0.7 }}>{DAYS[d.getDay()].slice(0,3)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div style={{ padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', background: result.success ? 'rgba(61,214,140,0.1)' : 'rgba(247,90,90,0.1)', border: `1px solid ${result.success ? 'rgba(61,214,140,0.35)' : 'rgba(247,90,90,0.35)'}`, color: result.success ? '#3dd68c' : '#f75a5a', fontSize: '13px', fontWeight: '500' }}>
                  {result.message}
                </div>
              )}

              <button onClick={submit} disabled={submitting}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: submitting ? '#2a5ab8' : '#4f6ef7', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : mode === 'whole' ? `Submit ${preview.length} Bookings` : `Submit ${customDates.length} Booking${customDates.length !== 1 ? 's' : ''}`}
              </button>
            </Card>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', background: 'var(--bg2)', borderRadius: '12px', border: '1px dashed var(--border)', color: 'var(--text3)', fontSize: '14px' }}>
              ← Select a semester to begin
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared small components ─────────────────────────────────────────────────
const labelStyle = { fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '9px 12px', width: '100%', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' };
const primBtn = (disabled) => ({ padding: '9px 20px', borderRadius: '8px', border: 'none', background: disabled ? '#2a5ab8' : '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 });
const secBtn = { padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' };

function Field({ label, as, children, type = 'text', ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      {as === 'select'
        ? <select style={inputStyle} {...props}>{children}</select>
        : <input style={inputStyle} type={type} {...props} />}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{value}</div>
    </div>
  );
}
