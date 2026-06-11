import React from 'react';

// ── Button ──────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, ...props }) {
  const sizes = { sm: '8px 14px', md: '10px 20px', lg: '13px 28px' };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
    danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
    success: { background: 'transparent', color: 'var(--success)', border: '1px solid var(--success)' },
    ghost: { background: 'transparent', color: 'var(--accent-light)', border: 'none' },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        padding: sizes[size],
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        letterSpacing: '0.02em',
        ...variants[variant],
        ...(props.style || {})
      }}
    >
      {loading && <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
      {children}
    </button>
  );
}

// ── Input ───────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <input
        {...props}
        style={{
          background: 'var(--bg3)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: '8px',
          color: 'var(--text)',
          padding: '10px 14px',
          fontSize: '14px',
          transition: 'border-color 0.2s',
          width: '100%',
          ...(props.style || {})
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────
export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <select
        {...props}
        style={{
          background: 'var(--bg3)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: '8px',
          color: 'var(--text)',
          padding: '10px 14px',
          fontSize: '14px',
          transition: 'border-color 0.2s',
          width: '100%',
          ...(props.style || {})
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

// ── Card ────────────────────────────────────────────
export function Card({ children, style, ...props }) {
  return (
    <div
      {...props}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        ...style
      }}
    >
      {children}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────
export function Badge({ children, color = 'accent' }) {
  const colors = {
    accent: { bg: '#0f1f3d', color: 'var(--accent-light)', border: '#1e3a6e' },
    success: { bg: '#0d2f23', color: '#6ee7b7', border: '#065f46' },
    warning: { bg: '#2d1f00', color: '#fcd34d', border: '#78350f' },
    danger: { bg: '#2d0f0f', color: '#fca5a5', border: '#7f1d1d' },
    neutral: { bg: 'var(--bg3)', color: 'var(--text2)', border: 'var(--border)' },
  };
  const c = colors[color] || colors.accent;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '500',
      display: 'inline-flex', alignItems: 'center', gap: '5px'
    }}>
      {children}
    </span>
  );
}

// ── Spinner ─────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block'
    }} />
  );
}

// ── Modal ───────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
          maxHeight: '90vh', overflow: 'auto', animation: 'fadeIn 0.2s ease',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {title && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontFamily: 'Syne, sans-serif' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        )}
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pending: { color: 'warning', label: 'Pending' },
    approved: { color: 'success', label: 'Approved' },
    rejected: { color: 'danger', label: 'Rejected' },
  };
  const s = map[status] || { color: 'neutral', label: status };
  return <Badge color={s.color}>{s.label}</Badge>;
}

// ── Empty State ──────────────────────────────────────
export function EmptyState({ Icon, icon, title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', opacity: 0.35 }}>
        {Icon
          ? <Icon size={52} color="var(--text2)" strokeWidth={1.25} />
          : <span style={{ fontSize: '48px' }}>{icon || '○'}</span>
        }
      </div>
      <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text)' }}>{title}</h3>
      {description && <p style={{ fontSize: '14px' }}>{description}</p>}
    </div>
  );
}
