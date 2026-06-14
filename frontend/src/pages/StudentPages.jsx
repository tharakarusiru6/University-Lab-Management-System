import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Badge, Spinner, EmptyState } from '../components/common/UI.jsx';
import { CalendarIcon, ClockIcon, MapPinIcon, FlaskIcon, BookOpenIcon, UsersGroupIcon , SettingsIcon } from '../components/common/Icons.jsx';

const SLOT_LABELS = { '08:00-10:00': '8:00 AM – 10:00 AM', '10:00-12:00': '10:00 AM – 12:00 PM', '12:00-14:00': '12:00 PM – 2:00 PM', '14:00-16:00': '2:00 PM – 4:00 PM' };

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{subtitle}</p>}
    </div>
  );
}

function StudentSessionsSection({ sessions }) {
  const [view, setView] = useState('list');
  return (
    <Card style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Upcoming Lab Sessions</h3>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {['list','grid'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: view === v ? '#4f6ef7' : 'var(--bg3)', color: view === v ? '#fff' : 'var(--text2)' }}>
              {v === 'list' ? 'List' : 'Grid'}
            </button>
          ))}
        </div>
      </div>
      {sessions.length === 0 ? <EmptyState Icon={CalendarIcon} title="No upcoming sessions" description="Your lecturer hasn't scheduled any lab sessions yet." /> : (
        view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map(s => (
              <div key={s._id} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', borderLeft: '3px solid #3dd68c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{s.lab?.name}</h4>
                  <Badge color="neutral">{s.lab?.location}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '13px' }}>
                  <div><div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Date</div><div style={{ fontWeight: '500' }}>{new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>
                  <div><div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Time</div><div style={{ color: '#3dd68c', fontWeight: '500' }}>{SLOT_LABELS[s.timeSlot]}</div></div>
                  <div><div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Lecturer</div><div>{s.lecturer?.name}</div></div>
                </div>
                {s.purpose && <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text2)' }}><em>{s.purpose}</em></div>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {sessions.map(s => (
              <div key={s._id} style={{ padding: '14px', background: 'var(--bg3)', borderRadius: '10px', border: '1px solid #3dd68c44', borderTop: '3px solid #3dd68c', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{s.lab?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.lab?.location}</div>
                <div style={{ fontSize: '11px', color: '#4f6ef7', fontWeight: '500' }}>{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div style={{ fontSize: '11px', color: '#3dd68c', fontWeight: '500' }}>{SLOT_LABELS[s.timeSlot]}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{s.lecturer?.name}</div>
                {s.purpose && <div style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic' }}>{s.purpose}</div>}
              </div>
            ))}
          </div>
        )
      )}
    </Card>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/student/sessions'), api.get('/student/batches')])
      .then(([sessR, batR]) => { setSessions(sessR.data); setBatches(batR.data); })
      .finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(s => new Date(s.date) >= new Date()).slice(0, 3);
  const past = sessions.filter(s => new Date(s.date) < new Date()).slice(0, 3);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={36} /></div>;

  return (
    <div className="page">
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}!`} subtitle="Your lab schedule and sessions" />

      {/* Profile card */}
      <Card style={{ marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: '#fff', fontFamily: 'Syne', flexShrink: 0 }}>
          {user?.name?.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{user?.name}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge color="warning">{user?.academicYear}</Badge>
            <Badge color="accent">{user?.focusArea}</Badge>
            <Badge color="neutral">{user?.registerNumber}</Badge>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Syne', color: '#f59e0b' }}>{sessions.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Total Sessions</div>
        </div>
      </Card>

      {/* Batches */}
      {batches.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Your Student Batches</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {batches.map(b => (
              <div key={b._id} style={{ padding: '10px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px' }}>
                <div style={{ fontWeight: '500' }}>{b.name}</div>
                <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{b.academicYear} · {b.focusArea}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming sessions */}
      <StudentSessionsSection sessions={upcoming} />
    </div>
  );
}

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/sessions').then(r => setSessions(r.data)).finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(s => new Date(s.date) >= new Date());
  const past = sessions.filter(s => new Date(s.date) < new Date());

  return (
    <div className="page">
      <PageHeader title="My Lab Sessions" subtitle="All your scheduled lab sessions" />

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <>
          {upcoming.length > 0 && (
            <>
              <h3 style={{ fontSize: '14px', color: 'var(--success)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upcoming Sessions ({upcoming.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {upcoming.map(s => <SessionCard key={s._id} session={s} upcoming />)}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h3 style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Past Sessions ({past.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {past.map(s => <SessionCard key={s._id} session={s} />)}
              </div>
            </>
          )}

          {sessions.length === 0 && <EmptyState Icon={CalendarIcon} title="No lab sessions yet" description="Your lecturer will schedule sessions that will appear here." />}
        </>
      )}
    </div>
  );
}

function SessionCard({ session: s, upcoming }) {
  return (
    <Card style={{ borderLeft: `3px solid ${upcoming ? 'var(--success)' : 'var(--border)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{s.lab?.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>{s.lab?.location} · Capacity {s.lab?.capacity}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Date</div>
              <div>{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Time</div>
              <div style={{ color: upcoming ? 'var(--success)' : 'var(--text2)' }}>{SLOT_LABELS[s.timeSlot]}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Lecturer</div>
              <div>{s.lecturer?.name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Batch</div>
              <div>{s.studentBatch?.name}</div>
            </div>
          </div>
          {s.purpose && <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text2)', padding: '8px 12px', background: 'var(--bg3)', borderRadius: '8px' }}><em>{s.purpose}</em></div>}
        </div>
      </div>
    </Card>
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
export default function StudentApp() {
  return (
    <div style={{ padding: '32px' }}>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
