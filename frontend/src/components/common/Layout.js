import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardIcon, UsersIcon, FlaskIcon, GraduationIcon, SettingsIcon,
  CalendarPlusIcon, CalendarIcon, ClipboardIcon, InboxIcon,
  LogOutIcon, ChevronLeftIcon, ChevronRightIcon
} from './Icons';

const navItems = {
  admin: [
    { to: '/admin',          label: 'Dashboard',       Icon: DashboardIcon,    end: true },
    { to: '/admin/users',    label: 'Users',            Icon: UsersIcon },
    { to: '/admin/labs',     label: 'Labs',             Icon: FlaskIcon },
    { to: '/admin/batches',  label: 'Student Batches',  Icon: GraduationIcon },
    { to: '/admin/settings', label: 'Settings',         Icon: SettingsIcon },
  ],
  lecturer: [
    { to: '/lecturer',          label: 'Dashboard',    Icon: DashboardIcon,    end: true },
    { to: '/lecturer/book',     label: 'Book a Lab',   Icon: CalendarPlusIcon },
    { to: '/lecturer/bookings', label: 'My Requests',  Icon: ClipboardIcon },
  ],
  lab_assistant: [
    { to: '/assistant',          label: 'Dashboard',    Icon: DashboardIcon, end: true },
    { to: '/assistant/requests', label: 'Lab Requests', Icon: InboxIcon },
    { to: '/assistant/my-labs',  label: 'My Labs',      Icon: FlaskIcon },
  ],
  student: [
    { to: '/student',          label: 'Dashboard',    Icon: DashboardIcon, end: true },
    { to: '/student/sessions', label: 'Lab Sessions', Icon: CalendarIcon },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items = navItems[user?.role] || [];
  const roleColors = {
    admin: '#4f6ef7',
    lecturer: '#7c3aed',
    lab_assistant: '#10b981',
    student: '#f59e0b',
  };
  const roleLabels = {
    admin: 'Admin',
    lecturer: 'Lecturer',
    lab_assistant: 'Lab Assistant',
    student: 'Student',
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const sideW = collapsed ? 64 : 240;
  const accent = roleColors[user?.role] || '#4f6ef7';

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
        overflow: 'hidden',
      }}>

        {/* Logo row */}
        <div style={{
          padding: '18px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: 68,
        }}>
          {/* Logo icon — always visible, click to expand when collapsed */}
          <div
            onClick={collapsed ? () => setCollapsed(false) : undefined}
            style={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              background: `linear-gradient(135deg, ${accent}, #7c3aed)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: '#fff',
              cursor: collapsed ? 'pointer' : 'default',
            }}
          >U</div>

          {/* Brand text — only when expanded */}
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '15px', color: 'var(--text)', whiteSpace: 'nowrap' }}>UniLab</div>
              <div style={{ fontSize: '11px', color: accent, fontWeight: '500' }}>{roleLabels[user?.role]}</div>
            </div>
          )}

          {/* Toggle button — always visible */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              marginLeft: collapsed ? 'auto' : undefined,
              flexShrink: 0,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              color: 'var(--text2)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border2, #3a4a6a)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}
          >
            {collapsed
              ? <ChevronRightIcon size={14} />
              : <ChevronLeftIcon size={14} />}
          </button>
        </div>

        {/* Nav links */}
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
                background: isActive ? `${accent}20` : 'transparent',
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

        {/* User info + Logout */}
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
              gap: '11px',
              padding: collapsed ? '10px 0' : '9px 11px',
              borderRadius: '9px',
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2d0f0f'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LogOutIcon size={17} style={{ flexShrink: 0 }} />
            {!collapsed && 'Logout'}
          </button>
        </div>
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
