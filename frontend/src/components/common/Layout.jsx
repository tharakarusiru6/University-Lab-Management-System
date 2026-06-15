import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  DashboardIcon, UsersIcon, FlaskIcon, GraduationIcon, SettingsIcon,
  CalendarPlusIcon, CalendarIcon, ClipboardIcon, InboxIcon,
  LogOutIcon, ChevronLeftIcon, ChevronRightIcon
} from './Icons';

const navItems = {
  admin: [
    { to: '/admin',           label: 'Dashboard',      Icon: DashboardIcon,    end: true },
    { to: '/admin/users',     label: 'Users',           Icon: UsersIcon },
    { to: '/admin/labs',      label: 'Labs',            Icon: FlaskIcon },
    { to: '/admin/batches',   label: 'Student Batches', Icon: GraduationIcon },
    { to: '/admin/semesters', label: 'Semesters',       Icon: CalendarIcon },
    { to: '/admin/schedule',  label: 'Schedule',        Icon: ClipboardIcon },
    { to: '/admin/settings',  label: 'Settings',        Icon: SettingsIcon },
  ],
  lecturer: [
    { to: '/lecturer',                  label: 'Dashboard',       Icon: DashboardIcon,    end: true },
    { to: '/lecturer/book',             label: 'Book a Lab',      Icon: CalendarPlusIcon },
    { to: '/lecturer/semester-booking', label: 'Semester Booking', Icon: CalendarIcon },
    { to: '/lecturer/bookings',         label: 'My Requests',     Icon: ClipboardIcon },
    { to: '/lecturer/settings',         label: 'Settings',        Icon: SettingsIcon },
  ],
  lab_assistant: [
    { to: '/assistant',           label: 'Dashboard',         Icon: DashboardIcon, end: true },
    { to: '/assistant/requests',  label: 'Lab Requests',      Icon: InboxIcon },
    { to: '/assistant/recurring', label: 'Recurring Requests',Icon: CalendarIcon },
    { to: '/assistant/my-labs',   label: 'My Labs',           Icon: FlaskIcon },
    { to: '/assistant/schedule',  label: 'Schedule',          Icon: ClipboardIcon },
    { to: '/assistant/settings',  label: 'Settings',          Icon: SettingsIcon },
  ],
  student: [
    { to: '/student',          label: 'Dashboard',    Icon: DashboardIcon, end: true },
    { to: '/student/sessions', label: 'Lab Sessions', Icon: CalendarIcon },
    { to: '/student/settings', label: 'Settings',     Icon: SettingsIcon },
  ],
};

const roleColors  = { admin: '#4f6ef7', lecturer: '#7c3aed', lab_assistant: '#10b981', student: '#f59e0b' };
const roleLabels  = { admin: 'Admin', lecturer: 'Lecturer', lab_assistant: 'Lab Assistant', student: 'Student' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items  = navItems[user?.role] || [];
  const accent = roleColors[user?.role] || '#4f6ef7';
  const sideW  = collapsed ? 64 : 240;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sideW,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        transition: 'width 0.25s ease',
        zIndex: 100,
        overflow: 'visible',   /* allow toggle tab to stick out */
      }}>

        {/* Inner scroll container (hides overflow of content) */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

          {/* Logo */}
          <div style={{
            padding: '18px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '12px',
            minHeight: 68, overflow: 'hidden',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              background: `linear-gradient(135deg, ${accent}, #7c3aed)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: '#fff',
            }}>U</div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '15px', color: 'var(--text)', whiteSpace: 'nowrap' }}>UniLab</div>
                <div style={{ fontSize: '11px', color: accent, fontWeight: '500' }}>{roleLabels[user?.role]}</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  padding: collapsed ? '10px 0' : '9px 11px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '9px',
                  color: isActive ? '#fff' : 'var(--text2)',
                  background: isActive ? `${accent}22` : 'transparent',
                  borderLeft: collapsed ? 'none' : (isActive ? `2px solid ${accent}` : '2px solid transparent'),
                  fontSize: '13.5px',
                  fontWeight: isActive ? '500' : '400',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                })}
              >
                <item.Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
            {!collapsed && (
              <div style={{ padding: '8px 11px', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '11px', padding: collapsed ? '10px 0' : '9px 11px',
                borderRadius: '9px', background: 'none', border: 'none',
                color: 'var(--danger)', fontSize: '13.5px', cursor: 'pointer',
                transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,90,90,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOutIcon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && 'Logout'}
            </button>
          </div>
        </div>

        {/* ── Floating toggle tab — sticks out on the RIGHT edge of sidebar ── */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute',
            /* vertically centred in the nav area — roughly middle of screen */
            top: '50%',
            right: -14,          /* half-sticks outside the sidebar */
            transform: 'translateY(-50%)',
            width: 28,
            height: 52,
            borderRadius: '0 8px 8px 0',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderLeft: 'none',
            color: 'var(--text2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 101,
            transition: 'background 0.15s, color 0.15s',
            boxShadow: '3px 0 8px rgba(0,0,0,0.25)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2, #202840)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
        </button>

      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        marginLeft: sideW,
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}>
        {children}
      </main>
    </div>
  );
}
