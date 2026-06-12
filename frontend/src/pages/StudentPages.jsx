import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Spinner, EmptyState } from '../components/common/UI';
import { CalendarIcon, ClockIcon, MapPinIcon, FlaskIcon, BookOpenIcon, UsersGroupIcon } from '../components/common/Icons';

const SLOT_LABELS = { '08:00-10:00': '8:00 AM – 10:00 AM', '10:00-12:00': '10:00 AM – 12:00 PM', '12:00-14:00': '12:00 PM – 2:00 PM', '14:00-16:00': '2:00 PM – 4:00 PM' };

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{subtitle}</p>}
    </div>
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
      <Card style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Upcoming Lab Sessions</h3>
        {upcoming.length === 0 ? <EmptyState Icon={CalendarIcon} title="No upcoming sessions" description="Your lecturer hasn't scheduled any lab sessions yet." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcoming.map(s => (
              <div key={s._id} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', borderLeft: '3px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '15px' }}>{s.lab?.name}</h4>
                  <Badge color="neutral">{s.lab?.location}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Date</div>
                    <div style={{ fontWeight: '500' }}>{new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Time</div>
                    <div style={{ color: 'var(--success)', fontWeight: '500' }}>{SLOT_LABELS[s.timeSlot]}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Lecturer</div>
                    <div>{s.lecturer?.name}</div>
                  </div>
                </div>
                {s.purpose && <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text2)' }}><em>{s.purpose}</em></div>}
              </div>
            ))}
          </div>
        )}
      </Card>
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

export default function StudentApp() {
  return (
    <div style={{ padding: '32px' }}>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="sessions" element={<SessionsPage />} />
      </Routes>
    </div>
  );
}
