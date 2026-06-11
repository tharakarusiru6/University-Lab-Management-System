import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Select } from '../components/common/UI';

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const FOCUS_AREAS = ['Computer Science', 'Information Technology', 'Software Engineering', 'Cybersecurity', 'Data Science', 'Network Engineering', 'Artificial Intelligence'];

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      addToast('Welcome back!', 'success');
      const routes = { admin: '/admin', lecturer: '/lecturer', lab_assistant: '/assistant', student: '/student' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.07) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: '900', fontFamily: 'Syne, sans-serif', color: '#fff',
            boxShadow: '0 0 40px rgba(79,110,247,0.3)'
          }}>U</div>
          <h1 style={{ fontSize: '28px', fontFamily: 'Syne, sans-serif', fontWeight: '800', marginBottom: '6px' }}>UniLab</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>University Laboratory Management System</p>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Sign In</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input label="Email Address" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@university.edu" required />
            <Input label="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Sign In
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text2)' }}>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', academicYear: '', focusArea: '', registerNumber: '' });
  const [loading, setLoading] = useState(false);

  const isStudent = form.role === 'student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error'); return;
    }
    setLoading(true);
    try {
      const { default: api } = await import('../utils/api');
      await api.post('/auth/register', form);
      addToast(isStudent ? 'Account created! Please login.' : 'Registration submitted. Await admin approval.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(79,110,247,0.07) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontFamily: 'Syne, sans-serif', fontWeight: '800', marginBottom: '6px' }}>Create Account</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Join the UniLab system</p>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select label="I am a" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="lab_assistant">Lab Assistant</option>
            </Select>

            <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Dr. / Mr. / Ms. ..." required />
            <Input label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@university.edu" required />

            {isStudent && (
              <>
                <Input label="University Register Number" value={form.registerNumber} onChange={set('registerNumber')} placeholder="e.g. 2021/CS/001" required />
                <Select label="Academic Year" value={form.academicYear} onChange={set('academicYear')} required={isStudent}>
                  <option value="">Select academic year</option>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
                <Select label="Focus Area / Department" value={form.focusArea} onChange={set('focusArea')} required={isStudent}>
                  <option value="">Select focus area</option>
                  {FOCUS_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </Select>
              </>
            )}

            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required minLength={8} />
            <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" required />

            {!isStudent && (
              <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                ℹ️ Your account will require admin approval before you can login.
              </div>
            )}

            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
              Create Account
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text2)' }}>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
