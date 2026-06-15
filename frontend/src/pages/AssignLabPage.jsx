import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Spinner, EmptyState, Card } from '../components/common/UI.jsx';
import { FlaskIcon, CalendarIcon, RefreshIcon, CheckCircleIcon } from '../components/common/Icons.jsx';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = ['08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00'];
const SLOT_LABELS = { '08:00-10:00':'8:00–10:00 AM','10:00-12:00':'10:00 AM–12:00 PM','12:00-14:00':'12:00–2:00 PM','14:00-16:00':'2:00–4:00 PM' };

// apiPrefix: 'admin' or 'assistant'
export default function AssignLabPage({ apiPrefix }) {
  const { addToast } = useToast();
  const [labs, setLabs] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('single'); // 'single' | 'semester' | 'custom'
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    lab: '', lecturer: '', studentBatch: '',
    timeSlot: '', purpose: '',
    // single
    date: '',
    // semester
    semesterId: '', dayOfWeek: '',
    // custom
  });
  const [customDates, setCustomDates] = useState([]);
  const [preview, setPreview] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    const labsUrl = apiPrefix === 'admin' ? '/admin/labs' : '/assistant/my-labs';
    Promise.all([
      api.get(labsUrl).then(r => setLabs(r.data.filter ? r.data.filter(l => l.isActive !== false) : r.data)),
      api.get('/admin/users?role=lecturer').then(r => setLecturers(r.data.filter(u => u.isApproved))).catch(() =>
        api.get('/admin/users').then(r => setLecturers(r.data.filter(u => u.role === 'lecturer' && u.isApproved)))
      ),
      api.get('/admin/batches').then(r => setBatches(r.data)),
      api.get('/semesters').then(r => setSemesters(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [apiPrefix]);

  useEffect(() => { load(); }, [load]);

  const set = key => e => { setForm(f => ({ ...f, [key]: e.target.value })); setResult(null); };

  // Generate preview for semester mode
  useEffect(() => {
    if (mode !== 'semester' || !form.semesterId || form.dayOfWeek === '') { setPreview([]); return; }
    const sem = semesters.find(s => s._id === form.semesterId);
    if (!sem) return;
    const day = parseInt(form.dayOfWeek);
    const cur = new Date(sem.startDate); cur.setHours(12,0,0,0);
    const end = new Date(sem.endDate); end.setHours(23,59,59,999);
    while (cur.getDay() !== day) cur.setDate(cur.getDate() + 1);
    const dates = [];
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    setPreview(dates);
  }, [form.semesterId, form.dayOfWeek, mode, semesters]);

  // All days in selected semester for custom picker
  const allDays = React.useMemo(() => {
    if (mode !== 'custom' || !form.semesterId) return [];
    const sem = semesters.find(s => s._id === form.semesterId);
    if (!sem) return [];
    const days = [];
    const cur = new Date(sem.startDate); cur.setHours(12,0,0,0);
    const end = new Date(sem.endDate); end.setHours(23,59,59,999);
    while (cur <= end) { days.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }
    return days;
  }, [form.semesterId, mode, semesters]);

  const toggleDate = (d) => setCustomDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const validate = () => {
    if (!form.lab)          { addToast('Select a lab', 'error'); return false; }
    if (!form.lecturer)     { addToast('Select a lecturer', 'error'); return false; }
    if (!form.studentBatch) { addToast('Select a student batch', 'error'); return false; }
    if (!form.timeSlot)     { addToast('Select a time slot', 'error'); return false; }
    if (mode === 'single' && !form.date) { addToast('Select a date', 'error'); return false; }
    if (mode === 'semester' && (!form.semesterId || form.dayOfWeek === '')) { addToast('Select semester and day of week', 'error'); return false; }
    if (mode === 'custom' && customDates.length === 0) { addToast('Select at least one date', 'error'); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setResult(null);
    try {
      if (mode === 'single') {
        const { data } = await api.post(`/${apiPrefix}/assign-lab`, {
          lab: form.lab, lecturer: form.lecturer, studentBatch: form.studentBatch,
          date: form.date, timeSlot: form.timeSlot, purpose: form.purpose,
        });
        setResult({ success: true, message: data.message });
        addToast(data.message, 'success');
      } else {
        const payload = {
          lab: form.lab, lecturer: form.lecturer, studentBatch: form.studentBatch,
          timeSlot: form.timeSlot, purpose: form.purpose,
          ...(form.semesterId ? { semesterId: form.semesterId } : {}),
          ...(mode === 'semester' ? { dayOfWeek: parseInt(form.dayOfWeek) } : { selectedDates: customDates }),
        };
        const { data } = await api.post(`/${apiPrefix}/assign-lab/semester`, payload);
        setResult({ success: true, message: data.message });
        addToast(data.message, 'success');
      }
      // Reset form on success
      setForm({ lab: '', lecturer: '', studentBatch: '', timeSlot: '', purpose: '', date: '', semesterId: '', dayOfWeek: '' });
      setCustomDates([]);
      setPreview([]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Assignment failed';
      setResult({ success: false, message: msg });
      addToast(msg, 'error');
    } finally { setSubmitting(false); }
  };

  const inputStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', padding: '9px 12px', width: '100%', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' };
  const labelStyle = { fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' };

  const Field = ({ label, as, children, type='text', ...props }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      {as === 'select'
        ? <select style={inputStyle} {...props}>{children}</select>
        : <input style={inputStyle} type={type} {...props} />}
    </div>
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner /></div>;

  const submitLabel = mode === 'single'
    ? 'Assign Lab Session'
    : mode === 'semester'
    ? `Assign ${preview.length} Sessions`
    : `Assign ${customDates.length} Session${customDates.length !== 1 ? 's' : ''}`;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Assign Lab</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Directly assign lab sessions — no lecturer request needed</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}>
          <RefreshIcon size={14} /> Refresh
        </button>
      </div>

      <div style={{ maxWidth: 640 }}>
        <Card>
          {/* Mode selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Assignment Type</label>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              {[['single','Single Session'],['semester','Whole Semester'],['custom','Pick Dates']].map(([v, label]) => (
                <button key={v} onClick={() => { setMode(v); setResult(null); setCustomDates([]); setPreview([]); }}
                  style={{ flex: 1, padding: '9px 8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: mode === v ? '#4f6ef7' : 'var(--bg3)', color: mode === v ? '#fff' : 'var(--text2)', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Lab */}
            <Field label="Lab *" as="select" value={form.lab} onChange={set('lab')}>
              <option value="">Select lab</option>
              {labs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.location}</option>)}
            </Field>

            {/* Lecturer */}
            <Field label="Lecturer *" as="select" value={form.lecturer} onChange={set('lecturer')}>
              <option value="">Select lecturer</option>
              {lecturers.map(l => <option key={l._id} value={l._id}>{l.name} ({l.email})</option>)}
            </Field>

            {/* Student Batch */}
            <Field label="Student Batch *" as="select" value={form.studentBatch} onChange={set('studentBatch')}>
              <option value="">Select batch</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.name} — {b.focusArea}</option>)}
            </Field>

            {/* Time Slot */}
            <Field label="Time Slot *" as="select" value={form.timeSlot} onChange={set('timeSlot')}>
              <option value="">Select time slot</option>
              {TIME_SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
            </Field>

            {/* Purpose */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>Purpose / Subject</label>
              <input style={inputStyle} type="text" placeholder="e.g. Database Systems Lab" value={form.purpose} onChange={set('purpose')} />
            </div>

            {/* Single date */}
            {mode === 'single' && (
              <Field label="Date *" type="date" value={form.date} onChange={set('date')} min={new Date().toISOString().split('T')[0]} />
            )}

            {/* Semester mode */}
            {(mode === 'semester' || mode === 'custom') && (
              <Field label="Semester *" as="select" value={form.semesterId} onChange={set('semesterId')}>
                <option value="">Select semester</option>
                {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Field>
            )}

            {mode === 'semester' && (
              <>
                <Field label="Day of Week *" as="select" value={form.dayOfWeek} onChange={set('dayOfWeek')}>
                  <option value="">Select day</option>
                  {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
                </Field>
                {preview.length > 0 && (
                  <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>
                      {preview.length} sessions will be created
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {preview.map((d, i) => (
                        <span key={i} style={{ padding: '3px 8px', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '6px', fontSize: '11px', color: '#4f6ef7' }}>
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Custom date picker */}
            {mode === 'custom' && form.semesterId && (
              <div>
                <label style={labelStyle}>Select Dates ({customDates.length} selected)</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '6px' }}>
                  {allDays.map(dateStr => {
                    const d = new Date(dateStr + 'T12:00:00');
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isSelected = customDates.includes(dateStr);
                    return (
                      <button key={dateStr} onClick={() => !isWeekend && toggleDate(dateStr)} disabled={isWeekend}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${isSelected ? '#4f6ef7' : 'var(--border)'}`, background: isSelected ? '#4f6ef7' : 'var(--bg2)', color: isSelected ? '#fff' : isWeekend ? 'var(--text3)' : 'var(--text2)', fontSize: '11px', cursor: isWeekend ? 'default' : 'pointer', opacity: isWeekend ? 0.4 : 1 }}>
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span style={{ fontSize: '9px', marginLeft: '3px', opacity: 0.7 }}>{DAYS[d.getDay()].slice(0,3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: result.success ? 'rgba(61,214,140,0.1)' : 'rgba(247,90,90,0.1)', border: `1px solid ${result.success ? 'rgba(61,214,140,0.35)' : 'rgba(247,90,90,0.35)'}`, color: result.success ? '#3dd68c' : '#f75a5a', fontSize: '13px', fontWeight: '500' }}>
                {result.success && <CheckCircleIcon size={14} style={{ marginRight: '6px' }} />}
                {result.message}
              </div>
            )}

            {/* Submit */}
            <button onClick={submit} disabled={submitting}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: submitting ? '#2a5ab8' : '#4f6ef7', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'all 0.15s' }}>
              {submitting ? 'Assigning...' : submitLabel}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center' }}>
              Assigned sessions are immediately <strong style={{ color: '#3dd68c' }}>approved</strong> — no approval step needed
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
