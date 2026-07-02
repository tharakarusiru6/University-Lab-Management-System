import React, { useState, useEffect, useCallback } from 'react';
import { AdminSemesterPage } from './SemesterPages.jsx';
import AssignLabPage from './AssignLabPage.jsx';
import { Routes, Route, Link } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Badge, Modal, Input, Select, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { UsersIcon, AlertCircleIcon, FlaskIcon, GraduationIcon, ClipboardIcon, UserCheckIcon, UserXIcon, PlusIcon, EditIcon, TrashIcon, MapPinIcon, UsersGroupIcon, KeyIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CheckCircleIcon } from '../components/common/Icons.jsx';

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const FOCUS_AREAS = ['Computer Science', 'Information Technology', 'Software Engineering', 'Cybersecurity', 'Data Science', 'Network Engineering', 'Artificial Intelligence'];
const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00'];

function StatCard({ Icon, label, value, color = '#4f6ef7', sub }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: 52, height: 52, borderRadius: '14px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={24} color={color} /></div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </Card>
  );
}

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
function AdminBookingSection({ bookings }) {
  const [view, setView] = useState('list');
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Recent Booking Requests</h3>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {['list','grid'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: view === v ? '#4f6ef7' : 'var(--bg3)', color: view === v ? '#fff' : 'var(--text2)' }}>
              {v === 'list' ? 'List' : 'Grid'}
            </button>
          ))}
        </div>
      </div>
      {bookings.length === 0 ? <EmptyState Icon={ClipboardIcon} title="No bookings yet" description="Booking requests from lecturers will appear here" /> : (
        view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bookings.map(b => (
              <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg3)', borderRadius: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{b.lab?.name || 'Unknown Lab'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{b.lecturer?.name} · {b.studentBatch?.name} · {b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {bookings.map(b => (
              <div key={b._id} style={{ padding: '14px', background: 'var(--bg3)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{b.lab?.name || 'Unknown Lab'}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{b.studentBatch?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.lecturer?.name}</div>
                <div style={{ fontSize: '11px', color: '#4f6ef7', fontWeight: '500' }}>{b.date ? new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
              </div>
            ))}
          </div>
        )
      )}
    </Card>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={36} /></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Dashboard</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Overview of the UniLab system</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' }}>
          <RefreshIcon size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard Icon={UsersIcon}       label="Total Users"       value={stats?.totalUsers ?? 0}      color="#4f6ef7" sub={`${stats?.totalStudents ?? 0} students`} />
        <StatCard Icon={UserCheckIcon}   label="Pending Approvals" value={stats?.pendingApprovals ?? 0} color="#f59e0b" sub={stats?.pendingApprovals > 0 ? 'Needs attention' : 'All clear'} />
        <StatCard Icon={FlaskIcon}       label="Active Labs"       value={stats?.totalLabs ?? 0}       color="#10b981" sub={`${stats?.totalAssistants ?? 0} assistants`} />
        <StatCard Icon={GraduationIcon}  label="Student Batches"   value={stats?.totalBatches ?? 0}    color="#7c3aed" />
      </div>

      {/* Recent bookings */}
      <AdminBookingSection bookings={stats?.recentBookings ?? []} />
    </div>
  );
}

// ── USERS ──────────────────────────────────────────────────────────────────
function UsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === 'pending' ? '/admin/pending-users' : `/admin/users${tab !== 'all' ? `?role=${tab}` : ''}`;
      const r = await api.get(url);
      setUsers(r.data);
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id, approved) => {
    try {
      await api.patch(`/admin/users/${id}/approve`, { approved });
      addToast(approved ? 'User approved' : 'User rejected', approved ? 'success' : 'info');
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  };

  const toggle = async (id) => {
    try {
      const r = await api.patch(`/admin/users/${id}/toggle`);
      addToast(r.data.message, 'info');
      load();
    } catch (err) { addToast('Failed', 'error'); }
  };

  const tabs = [
    { key: 'all', label: 'All Users' },
    { key: 'pending', label: 'Pending Approval' },
    { key: 'lecturer', label: 'Lecturers' },
    { key: 'lab_assistant', label: 'Lab Assistants' },
    { key: 'student', label: 'Students' },
  ];

  const roleBadge = { admin: 'Admin', lecturer: 'Lecturer', lab_assistant: 'Lab Assistant', student: 'Student' };

  return (
    <div className="page">
      <PageHeader title="User Management" subtitle="Manage all system users and approvals" />

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px',
            background: tab === t.key ? 'var(--accent)' : 'var(--bg3)',
            color: tab === t.key ? '#fff' : 'var(--text2)', cursor: 'pointer', transition: 'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {users.length === 0 ? <EmptyState Icon={UsersIcon} title="No users found" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Email', 'Role', 'Details', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg3)33' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{u.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}><Badge color={u.role === 'admin' ? 'accent' : 'neutral'}>{roleBadge[u.role]}</Badge></td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '12px' }}>
                        {u.role === 'student' ? <span>{u.academicYear} · {u.focusArea}<br /><span style={{ color: 'var(--text3)' }}>{u.registerNumber}</span></span> : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge color={!u.isActive ? 'danger' : u.isApproved ? 'success' : 'warning'}>
                          {!u.isActive ? 'Inactive' : u.isApproved ? 'Active' : 'Pending'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {!u.isApproved && u.role !== 'student' && (
                              <>
                                <Button size="sm" variant="success" onClick={() => approve(u._id, true)}>Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => approve(u._id, false)}>Reject</Button>
                              </>
                            )}
                            <Button size="sm" variant="secondary" onClick={() => toggle(u._id)}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── LABS ──────────────────────────────────────────────────────────────────
function LabsPage() {
  const { addToast } = useToast();
  const [labs, setLabs] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | lab object
  const [form, setForm] = useState({ name: '', location: '', capacity: '', description: '', equipment: '', assignedAssistants: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [labsR, usersR] = await Promise.all([api.get('/admin/labs'), api.get('/admin/users?role=lab_assistant')]);
      setLabs(labsR.data);
      setAssistants(usersR.data.filter(u => u.isApproved));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ name: '', location: '', capacity: '', description: '', equipment: '', assignedAssistants: [] }); setModal('add'); };
  const openEdit = (lab) => { setForm({ ...lab, equipment: lab.equipment?.join(', ') || '', assignedAssistants: lab.assignedAssistants?.map(a => a._id || a) || [] }); setModal(lab); };

  const save = async () => {
    try {
      const payload = { ...form, capacity: Number(form.capacity), equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean) };
      if (modal === 'add') await api.post('/admin/labs', payload);
      else await api.patch(`/admin/labs/${modal._id}`, payload);
      addToast(modal === 'add' ? 'Lab created' : 'Lab updated', 'success');
      setModal(null); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  };

  const deleteLab = async (id) => {
    if (!window.confirm('Delete this lab?')) return;
    try { await api.delete(`/admin/labs/${id}`); addToast('Lab deleted', 'info'); load(); }
    catch (err) { addToast('Failed', 'error'); }
  };

  const toggleAssistant = (id) => {
    setForm(f => ({
      ...f, assignedAssistants: f.assignedAssistants.includes(id)
        ? f.assignedAssistants.filter(a => a !== id)
        : [...f.assignedAssistants, id]
    }));
  };

  return (
    <div className="page">
      <PageHeader title="Lab Management" subtitle="Create and manage university labs" action={<Button onClick={openAdd}>+ Add Lab</Button>} />

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {labs.length === 0 ? <EmptyState Icon={FlaskIcon} title="No labs yet" description="Add your first lab" /> : labs.map(lab => (
            <Card key={lab._id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{lab.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{lab.location}</div>
                </div>
                <Badge color={lab.isActive ? 'success' : 'danger'}>{lab.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              {lab.description && <p style={{ fontSize: '13px', color: 'var(--text2)' }}>{lab.description}</p>}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Badge color="neutral">Capacity: {lab.capacity}</Badge>
                <Badge color="neutral">Assistants: {lab.assignedAssistants?.length || 0}</Badge>
              </div>
              {lab.assignedAssistants?.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                  Assistants: {lab.assignedAssistants.map(a => a.name).join(', ')}
                </div>
              )}
              {lab.equipment?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {lab.equipment.map(e => <Badge key={e} color="neutral">{e}</Badge>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <Button size="sm" variant="secondary" onClick={() => openEdit(lab)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => deleteLab(lab._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Lab' : 'Edit Lab'} width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Lab Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Lab A" required />
          <Input label="Location / Room" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Block B, Room 204" required />
          <Input label="Capacity (students)" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="30" required />
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this lab" />
          <Input label="Equipment (comma-separated)" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} placeholder="Computers, Oscilloscopes, Network Kit" />

          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
              Assign Lab Assistants
            </label>
            {assistants.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No approved lab assistants available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {assistants.map(a => (
                  <label key={a._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: form.assignedAssistants.includes(a._id) ? 'var(--accent)22' : 'var(--bg3)', border: `1px solid ${form.assignedAssistants.includes(a._id) ? 'var(--accent)' : 'var(--border)'}`, transition: 'all 0.2s' }}>
                    <input type="checkbox" checked={form.assignedAssistants.includes(a._id)} onChange={() => toggleAssistant(a._id)} style={{ accentColor: 'var(--accent)' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{a.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{a.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save}>{modal === 'add' ? 'Create Lab' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── BATCHES ──────────────────────────────────────────────────────────────
function BatchesPage() {
  const { addToast } = useToast();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [studentModal, setStudentModal] = useState(null);
  const [form, setForm] = useState({ name: '', academicYear: '', focusArea: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/admin/batches'); setBatches(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await api.post('/admin/batches', form);
      addToast('Batch created and students auto-assigned', 'success');
      setModal(false); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  };

  const syncBatch = async (id) => {
    try {
      const { data } = await api.post(`/admin/batches/${id}/sync`);
      addToast(data.message, 'success');
      loadBatches();
    } catch (err) {
      addToast(err.response?.data?.message || 'Sync failed', 'error');
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm('Delete this batch?')) return;
    try { await api.delete(`/admin/batches/${id}`); addToast('Batch deleted', 'info'); load(); }
    catch { addToast('Failed', 'error'); }
  };

  return (
    <div className="page">
      <PageHeader title="Student Batches" subtitle="Group students by academic year and focus area" action={<Button onClick={() => setModal(true)}>+ Create Batch</Button>} />

      {loading ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {batches.length === 0 ? <EmptyState Icon={GraduationIcon} title="No batches yet" description="Create student batches to group students for lab sessions" /> : batches.map(b => (
            <Card key={b._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px' }}>{b.name}</h3>
                <Badge color="accent">{b.students?.length ?? 0} students</Badge>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <Badge color="neutral">{b.academicYear}</Badge>
                <Badge color="neutral">{b.focusArea}</Badge>
              </div>
              {b.students?.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>
                  {b.students.slice(0, 3).map(s => s.name).join(', ')}{b.students.length > 3 ? ` +${b.students.length - 3} more` : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <Button size="sm" variant="secondary" onClick={() => setStudentModal(b)}>
                  <UsersGroupIcon size={13} /> Students ({b.students?.length || 0})
                </Button>
                <Button size="sm" variant="secondary" onClick={() => syncBatch(b._id)} title="Scan and add new matching students">
                  <RefreshIcon size={13} /> Sync
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteBatch(b._id)}>Delete</Button>
              </div>
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
              <Badge color="info">{studentModal.students.length} student{studentModal.students.length !== 1 ? 's' : ''}</Badge>
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
                    {s.name ? s.name.charAt(0).toUpperCase() : (i + 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{s.name}</div>
                    {s.registrationNumber && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{s.registrationNumber}</div>
                    )}
                    {s.email && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.email}</div>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Create Student Batch">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Batch Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CS 2nd Year 2024" required />
          <Select label="Academic Year" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}>
            <option value="">Select academic year</option>
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select label="Focus Area" value={form.focusArea} onChange={e => setForm(f => ({ ...f, focusArea: e.target.value }))}>
            <option value="">Select focus area</option>
            {FOCUS_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Students matching the selected academic year and focus area will be automatically added to this batch.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save}>Create Batch</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────
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

  return (
    <div className="page">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.7rem', fontFamily: 'Syne, sans-serif', fontWeight: '700', color: 'var(--text)' }}>Account Settings</h1>
        <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Manage your admin profile and security</p>
      </div>
      <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Profile card */}
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
              <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>System Admin</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Access Level</div>
              <div style={{ fontSize: '13px', color: '#4f6ef7', fontWeight: '600' }}>Full Access</div>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div style={{ background: 'var(--surface, var(--bg2))', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text)' }}>Change Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'currentPassword', label: 'Current Password',     placeholder: 'Enter current password' },
              { key: 'newPassword',     label: 'New Password',         placeholder: 'Enter new password (min 6 chars)' },
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



function generateSchedulePDF({ bookings, labs, title, subtitle, rangeLabel, batchId, batchName }) {
  if (batchId) { bookings = bookings.filter(b => (b.studentBatch?._id || b.studentBatch) === batchId); }
  const TIME_SLOTS = ['08:00-10:00','10:00-12:00','12:00-14:00','14:00-16:00'];
  const SLOT_LABELS = {
    '08:00-10:00':'8:00 – 10:00 AM',
    '10:00-12:00':'10:00 AM – 12:00 PM',
    '12:00-14:00':'12:00 – 2:00 PM',
    '14:00-16:00':'2:00 – 4:00 PM'
  };
  const STATUS_BG     = { approved:'#d1fae5', pending:'#fef3c7', rejected:'#fee2e2' };
  const STATUS_TEXT   = { approved:'#065f46', pending:'#92400e', rejected:'#991b1b' };
  const STATUS_BORDER = { approved:'#6ee7b7', pending:'#fcd34d', rejected:'#fca5a5' };
  const STATUS_DOT    = { approved:'#10b981', pending:'#f59e0b', rejected:'#ef4444' };

  // For single-day: grid view; for range: list grouped by date
  const isRange = rangeLabel && rangeLabel.includes('→');

  // Only show approved bookings in PDF
  bookings = bookings.filter(b => b.status === 'approved');

  // Build grid for single-day
  const grid = {};
  labs.forEach(lab => { grid[lab._id] = {}; });
  bookings.forEach(b => {
    const labId = b.lab?._id || b.lab;
    if (labId) { grid[labId] = grid[labId] || {}; grid[labId][b.timeSlot] = b; }
  });

  // Group by date for range view
  const byDate = {};
  if (isRange) {
    bookings.forEach(b => {
      const d = new Date(b.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(b);
    });
  }

  const approved = bookings.filter(b => b.status === 'approved').length;
  const pending  = bookings.filter(b => b.status === 'pending').length;
  const rejected = bookings.filter(b => b.status === 'rejected').length;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#111;padding:28px 32px;font-size:12px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #2563eb}
.logo-box{display:flex;align-items:center;gap:10px}
.logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px}
.logo-text{font-size:18px;font-weight:800;color:#1e293b;letter-spacing:-0.5px}
.logo-sub{font-size:10px;color:#6b7280;margin-top:2px}
.header-right{text-align:right}
.h-title{font-size:16px;font-weight:700;color:#1e293b}
.h-sub{font-size:11px;color:#6b7280;margin-top:2px}
.h-range{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600;margin-top:6px;border:1px solid #bfdbfe}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}
.stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center}
.stat-val{font-size:22px;font-weight:800;color:#1e293b}
.stat-val.green{color:#059669}
.stat-val.yellow{color:#d97706}
.stat-val.red{color:#dc2626}
.stat-lbl{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-top:2px}
.legend{display:flex;gap:16px;margin-bottom:14px;align-items:center}
.leg-item{display:flex;align-items:center;gap:6px;font-size:10px;color:#374151}
.leg-dot{width:8px;height:8px;border-radius:50%}
.section-title{font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e5e7eb}
/* Grid table */
table{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:11px}
th{background:#1e293b;color:#fff;padding:9px 10px;text-align:left;border:1px solid #334155;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em}
th.center{text-align:center}
td{border:1px solid #e2e8f0;vertical-align:top;padding:0}
.lab-cell{padding:9px 12px;background:#f8fafc;min-width:120px;vertical-align:middle}
.lab-name{font-weight:700;color:#1e293b;font-size:11px}
.lab-loc{font-size:9px;color:#6b7280;margin-top:2px}
.lab-cap{font-size:9px;color:#9ca3af;margin-top:1px}
.slot-cell{padding:5px;height:80px;min-width:120px}
.booked{border-radius:5px;padding:6px 7px;height:100%;display:flex;flex-direction:column}
.s-row{display:flex;align-items:center;gap:4px;margin-bottom:3px}
.s-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.s-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
.b-batch{font-size:10px;font-weight:600;color:#1e293b;line-height:1.3}
.b-lect{font-size:9px;color:#4b5563;margin-top:2px}
.b-purp{font-size:8px;color:#6b7280;margin-top:2px;font-style:italic;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}
.free{color:#d1d5db;font-size:9px;font-style:italic;height:100%;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:5px;border:1px dashed #e5e7eb}
/* List / range table */
.list-tbl th{font-size:9px}
.list-tbl td{padding:7px 10px;font-size:10px;vertical-align:middle}
.list-tbl tr:nth-child(even) td{background:#f8fafc}
.date-header td{background:#1e293b !important;color:#fff;font-weight:700;font-size:10px;padding:7px 12px}
.badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af}
@media print{body{padding:14px 18px}@page{size:A4 landscape;margin:10mm}}
</style>
</head>
<body>

<div class="header">
  <div class="logo-box">
    <div class="logo-icon">U</div>
    <div>
      <div class="logo-text">UniLab</div>
      <div class="logo-sub">University Laboratory Management System</div>
    </div>
  </div>
  <div class="header-right">
    <div class="h-title">${title}</div>
    <div class="h-sub">${subtitle}</div>
    <div class="h-range">${rangeLabel}</div>
  </div>
</div>



${!isRange ? `
<div class="section-title">Timetable Grid</div>
<table>
  <thead>
    <tr>
      <th>Lab</th>
      ${TIME_SLOTS.map(s=>`<th class="center">${SLOT_LABELS[s]}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${labs.map(lab => `<tr>
      <td class="lab-cell">
        <div class="lab-name">${lab.name}</div>
        <div class="lab-loc">${lab.location||''}</div>
        ${lab.capacity?`<div class="lab-cap">Cap: ${lab.capacity}</div>`:''}
      </td>
      ${TIME_SLOTS.map(slot => {
        const b = grid[lab._id]?.[slot];
        if (b) {
          return `<td class="slot-cell">
            <div class="booked" style="background:${STATUS_BG[b.status]||'#fef3c7'};border:1px solid ${STATUS_BORDER[b.status]||'#fcd34d'}">
              <div class="s-row">
                <div class="s-dot" style="background:${STATUS_DOT[b.status]||'#f59e0b'}"></div>
                <span class="s-lbl" style="color:${STATUS_TEXT[b.status]||'#92400e'}">${b.status}</span>
              </div>
              <div class="b-batch">${b.studentBatch?.name||'N/A'}</div>
              <div class="b-lect">${b.lecturer?.name||''}</div>
              ${b.purpose?`<div class="b-purp">${b.purpose}</div>`:''}
            </div>
          </td>`;
        }
        return `<td class="slot-cell"><div class="free">Free</div></td>`;
      }).join('')}
    </tr>`).join('')}
  </tbody>
</table>` : ''}

${isRange && Object.keys(byDate).length > 0 ? `
<div class="section-title">Session Schedule</div>
<table class="list-tbl">
  <thead>
    <tr>
      <th>Date</th><th>Time Slot</th><th>Lab</th><th>Batch</th><th>Lecturer</th><th>Purpose</th><th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(byDate).map(([dateStr, bks]) => `
      ${bks.map((b,i) => `<tr ${i===0?'':''}">
        <td style="font-weight:600;color:#1e293b">${i===0?dateStr:''}</td>
        <td style="font-weight:500">${SLOT_LABELS[b.timeSlot]||b.timeSlot}</td>
        <td><strong>${b.lab?.name||'N/A'}</strong><br><span style="color:#6b7280;font-size:9px">${b.lab?.location||''}</span></td>
        <td>${b.studentBatch?.name||'N/A'}<br><span style="color:#6b7280;font-size:9px">${b.studentBatch?.focusArea||''}</span></td>
        <td>${b.lecturer?.name||'N/A'}</td>
        <td style="color:#6b7280">${b.purpose||'—'}</td>
        <td><span class="badge" style="background:${STATUS_BG[b.status]||'#fef3c7'};color:${STATUS_TEXT[b.status]||'#92400e'};border:1px solid ${STATUS_BORDER[b.status]||'#fcd34d'}">${b.status}</span></td>
      </tr>`).join('')}
    `).join('')}
  </tbody>
</table>` : ''}

${bookings.length === 0 ? '<p style="color:#9ca3af;font-style:italic;text-align:center;padding:40px">No bookings found for this selection.</p>' : ''}

<div class="footer">
  <span>UniLab — University Laboratory Management System</span>
  <span>Generated: ${new Date().toLocaleString()}</span>
</div>

<script>window.onload=function(){window.print();}</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function SchedulePage({ apiPrefix }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({ bookings: [], labs: [] });
  const [batches, setBatches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [filterType, setFilterType] = useState('all'); // 'all'|'lab'|'batch'
  const [filterValue, setFilterValue] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/${apiPrefix}/schedule?date=${date}`).then(r => setData(r.data)).catch(() => setData({ bookings: [], labs: [] })),
      api.get('/admin/batches').then(r => setBatches(r.data)).catch(() => {}),
      api.get('/semesters').then(r => setSemesters(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
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

      {/* PDF Filter + Export Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Export PDF</span>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterValue(''); }}
          style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
          <option value="day_all">Today — All Labs</option>
          <option value="day_lab">Today — By Lab</option>
          <option value="day_batch">Today — By Batch</option>
          <option value="semester">Whole Semester</option>
          <option value="semester_batch">Whole Semester — By Batch</option>
        </select>
        {filterType === 'day_lab' && (
          <select value={filterValue} onChange={e => setFilterValue(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">Select lab</option>
            {data.labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        )}
        {filterType === 'day_batch' && (
          <select value={filterValue} onChange={e => setFilterValue(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">Select batch</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
        {(filterType === 'semester' || filterType === 'semester_batch') && (
          <select value={filterValue} onChange={e => setFilterValue(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">Select semester</option>
            {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        )}
        {filterType === 'semester_batch' && (
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
            <option value="">Select batch</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
        <button
          onClick={async () => {
            if (filterType === 'semester' || filterType === 'semester_batch') {
              if (!filterValue) { alert('Please select a semester'); return; }
              if (filterType === 'semester_batch' && !batchFilter) { alert('Please select a batch'); return; }
              try {
                const r = await api.get(`/${apiPrefix}/schedule/semester/${filterValue}`);
                const sem = semesters.find(s => s._id === filterValue);
                const batchObj = filterType === 'semester_batch' ? batches.find(b => b._id === batchFilter) : null;
                generateSchedulePDF({
                  bookings: r.data.bookings,
                  labs: r.data.labs,
                  title: batchObj ? `Semester Schedule — ${batchObj.name}` : 'Semester Lab Schedule',
                  subtitle: sem?.name || 'Semester',
                  rangeLabel: `${new Date(r.data.semester?.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} → ${new Date(r.data.semester?.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`,
                  batchId: batchObj ? batchFilter : null,
                  batchName: batchObj?.name,
                });
              } catch(e) { alert('Failed to load semester data'); }
            } else {
              let bkgs = [...data.bookings];
              let lbs = [...data.labs];
              if (filterType === 'day_lab' && filterValue) {
                bkgs = bkgs.filter(b => (b.lab?._id || b.lab) === filterValue);
                lbs = lbs.filter(l => l._id === filterValue);
              } else if (filterType === 'day_batch' && filterValue) {
                bkgs = bkgs.filter(b => (b.studentBatch?._id || b.studentBatch) === filterValue);
              }
              generateSchedulePDF({
                bookings: bkgs,
                labs: lbs,
                title: 'Daily Lab Schedule',
                subtitle: filterType === 'day_batch' ? `Batch: ${batches.find(b=>b._id===filterValue)?.name||'All'}` : 'All Labs',
                rangeLabel: displayDate,
              });
            }
          }}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#4f6ef7', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
          ⬇ Download PDF
        </button>
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

export default function AdminApp() {
  return (
    <div style={{ padding: '32px' }}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="labs" element={<LabsPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="schedule" element={<SchedulePage apiPrefix="admin" />} />
        <Route path="semesters" element={<AdminSemesterPage />} />
        <Route path="assign-lab" element={<AssignLabPage apiPrefix="admin" />} />
      </Routes>
    </div>
  );
}
