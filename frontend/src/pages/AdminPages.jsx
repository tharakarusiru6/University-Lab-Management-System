import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Badge, Modal, Input, Select, Spinner, EmptyState, StatusBadge } from '../components/common/UI.jsx';
import { UsersIcon, AlertCircleIcon, FlaskIcon, GraduationIcon, ClipboardIcon, UserCheckIcon, UserXIcon, PlusIcon, EditIcon, TrashIcon, MapPinIcon, UsersGroupIcon, KeyIcon, RefreshIcon } from '../components/common/Icons.jsx';

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
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={36} /></div>;

  return (
    <div className="page">
      <PageHeader title="Dashboard" subtitle="Overview of the UniLab system" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard Icon={UsersIcon} label="Total Users" value={stats?.totalUsers ?? 0} color="#4f6ef7" />
        <StatCard Icon={AlertCircleIcon} label="Pending Approvals" value={stats?.pendingApprovals ?? 0} color="#f59e0b" sub={stats?.pendingApprovals > 0 ? <Link to="/admin/users?tab=pending">Review →</Link> : null} />
        <StatCard Icon={FlaskIcon} label="Active Labs" value={stats?.totalLabs ?? 0} color="#10b981" />
        <StatCard Icon={GraduationIcon} label="Student Batches" value={stats?.totalBatches ?? 0} color="#7c3aed" />
      </div>

      <Card>
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Recent Booking Requests</h3>
        {stats?.recentBookings?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.recentBookings.map(b => (
              <div key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg3)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{b.lab?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>by {b.lecturer?.name} · {new Date(b.date).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        ) : <EmptyState Icon={ClipboardIcon} title="No bookings yet" />}
      </Card>
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
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                {b.students?.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setStudentModal(b)}>
                    <UsersGroupIcon size={13} /> View Students
                  </Button>
                )}
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
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (form.newPassword !== form.confirmPassword) { addToast('Passwords do not match', 'error'); return; }
    setLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      addToast('Password changed successfully', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Manage your admin account" />
      <div style={{ maxWidth: 480 }}>
        <Card>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Change Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: '8px', fontSize: '13px', color: 'var(--text2)' }}>
              Logged in as: <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
            </div>
            <Input label="Current Password" type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
            <Input label="New Password" type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
            <Input label="Confirm New Password" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            <Button onClick={save} loading={loading}>Update Password</Button>
          </div>
        </Card>
      </div>
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
      </Routes>
    </div>
  );
}
