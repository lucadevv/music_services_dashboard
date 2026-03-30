import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Key, Globe, LogOut, Database, Heart } from 'lucide-react';
import { fetchClient } from '../../data/api';

// ─── Health dot widget ──────────────────────────────────────────────────────
function HealthWidget() {
  const [status, setStatus] = useState<'ok' | 'error' | 'loading'>('loading');
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetchClient<{ status: string; version?: string }>('/../../health');
        setStatus(res.status === 'ok' || res.status === 'healthy' ? 'ok' : 'error');
        setVersion(res.version ?? null);
      } catch {
        setStatus('error');
      }
    };
    check();
    const interval = setInterval(check, 30_000); // recheck cada 30s
    return () => clearInterval(interval);
  }, []);

  const color = status === 'ok' ? 'var(--success)' : status === 'error' ? 'var(--error)' : 'var(--text-secondary)';
  const label = status === 'ok' ? 'Online' : status === 'error' ? 'Error' : '…';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', marginBottom: '1.5rem' }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0,
        boxShadow: status === 'ok' ? `0 0 6px ${color}` : 'none',
        animation: status === 'ok' ? 'pulse 2s infinite' : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color }}>Backend {label}</div>
        {version && <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>v{version}</div>}
      </div>
      <Heart size={12} color={color} />
    </div>
  );
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'API Keys', path: '/api-keys', icon: <Key size={20} /> },
    { name: 'Browser Accounts', path: '/browser', icon: <Globe size={20} /> },
    { name: 'Cache Manager', path: '/cache', icon: <Database size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        width: '260px',
        borderLeft: 'none',
        borderTop: 'none',
        borderBottom: 'none',
        borderRadius: '0',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem'
      }}>
        <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>◆</span>
            yt-music admin
          </h1>
        </div>

        {/* Health status */}
        <HealthWidget />

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'rgba(248, 32, 32, 0.12)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                      borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    }}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: '12px',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--error)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
