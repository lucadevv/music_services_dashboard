import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchClient } from '../../../data/api';
import type {
  CacheStatsResponse,
  CacheClearResponse,
  APIKeyVerifyResponse,
  StreamCacheStatusResponse,
  CacheInfoResponse,
} from '../../../domain/types';
import {
  Database, HardDrive, Zap, Search, Trash2, Info,
  CheckCircle, XCircle, RefreshCw, Shield, Clock, Key
} from 'lucide-react';

// ─── Panel: Stats globales de caché ────────────────────────────────────────
function CacheStatsPanel() {
  const [stats, setStats] = useState<CacheStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchClient<CacheStatsResponse>('/admin/cache/stats');
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClearAll = async () => {
    if (!confirm('¿Vaciar TODO el caché de streams? Las próximas peticiones tendrán que re-fetchear las URLs de YouTube.')) return;
    setClearing(true);
    setClearResult(null);
    try {
      const res = await fetchClient<CacheClearResponse>('/admin/cache/clear', { method: 'DELETE' });
      setClearResult(`✅ Caché vaciado — ${res.status}`);
      load();
    } catch (e: any) {
      setClearResult(`❌ Error: ${e.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--accent-primary)" /> Caché Global de Streams
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button id="refresh-cache-stats-btn" onClick={load} disabled={loading} className="btn-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center', opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refrescar
          </button>
          <button id="clear-all-cache-btn" onClick={handleClearAll} disabled={clearing} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Trash2 size={16} /> {clearing ? 'Vaciando…' : 'Vaciar todo'}
          </button>
        </div>
      </div>

      {clearResult && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px', background: clearResult.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {clearResult}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {([
          { label: 'Entradas', value: stats?.keys ?? '—', icon: (<Key size={18} color="var(--accent-primary)" />), color: 'var(--accent-primary)' },
          { label: 'Tamaño total', value: stats?.size ?? '—', icon: (<HardDrive size={18} color="var(--warning)" />), color: 'var(--warning)' },
          { label: 'TTL por defecto', value: stats?.ttl != null ? `${stats.ttl}s` : '—', icon: (<Clock size={18} color="var(--success)" />), color: 'var(--success)' },
        ] satisfies Array<{ label: string; value: string | number; icon: ReactNode; color: string }>).map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
              {icon}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CacheLookupPanel() {
  const [videoId, setVideoId] = useState('');
  const [status, setStatus] = useState<StreamCacheStatusResponse | null>(null);
  const [info, setInfo] = useState<CacheInfoResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId.trim()) return;
    setLookupLoading(true);
    setStatus(null);
    setInfo(null);
    setDeleteMsg(null);
    try {
      const [statusRes, infoRes] = await Promise.allSettled([
        fetchClient<StreamCacheStatusResponse>(`/admin/cache/status/${videoId.trim()}`),
        fetchClient<CacheInfoResponse>(`/admin/cache/info/${videoId.trim()}`),
      ]);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value);
      if (infoRes.status === 'fulfilled') setInfo(infoRes.value);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!videoId.trim()) return;
    if (!confirm(`¿Invalidar caché del video "${videoId.trim()}"?`)) return;
    setDeleteLoading(true);
    setDeleteMsg(null);
    try {
      await fetchClient(`/admin/cache/${videoId.trim()}`, { method: 'DELETE' });
      setDeleteMsg('✅ Caché del video invalidado correctamente.');
      setStatus(null);
      setInfo(null);
    } catch (e: any) {
      setDeleteMsg(`❌ Error: ${e.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatSeconds = (secs?: number | null) => {
    if (secs == null) return '—';
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
        <Search size={20} color="var(--warning)" /> Lookup por Video ID
      </h3>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          id="video-id-lookup-input"
          className="input-field"
          value={videoId}
          onChange={e => setVideoId(e.target.value)}
          placeholder="Ej: dQw4w9WgXcQ"
          style={{ flex: 1, fontFamily: 'monospace' }}
        />
        <button
          id="lookup-video-btn"
          type="submit"
          className="btn-primary"
          disabled={lookupLoading || !videoId.trim()}
          style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap', opacity: !videoId.trim() ? 0.5 : 1 }}
        >
          <Search size={16} /> {lookupLoading ? 'Buscando…' : 'Consultar'}
        </button>
      </form>

      {/* Resultado */}
      {status && (
        <div style={{ marginBottom: '1rem' }}>
          {/* Status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: status.cached ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${status.cached ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {status.cached
                ? <CheckCircle color="var(--success)" size={22} />
                : <XCircle color="var(--error)" size={22} />
              }
              <div>
                <div style={{ fontWeight: 600, color: status.cached ? 'var(--success)' : 'var(--error)' }}>
                  {status.cached ? '✅ En caché' : '❌ No cacheado'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {status.videoId}
                </div>
              </div>
            </div>
            {status.cached && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>TTL restante</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={16} /> {formatSeconds(status.expiresIn)}
                </div>
              </div>
            )}
          </div>

          {/* Info detallada si hay */}
          {!!info?.cached && (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <Info size={14} /> Metadata del caché
              </div>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                {JSON.stringify(info.cached, null, 2)}
              </pre>
            </div>
          )}

          {/* Acción de invalidar */}
          {status.cached && (
            <button
              id="invalidate-cache-btn"
              onClick={handleDeleteSingle}
              disabled={deleteLoading}
              className="btn-secondary"
              style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Trash2 size={16} /> {deleteLoading ? 'Invalidando…' : 'Invalidar este video'}
            </button>
          )}
        </div>
      )}

      {deleteMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: deleteMsg.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {deleteMsg}
        </div>
      )}
    </div>
  );
}

// ─── Panel: Verificar API Key ───────────────────────────────────────────────
function VerifyKeyPanel() {
  const [keyInput, setKeyInput] = useState('');
  const [result, setResult] = useState<APIKeyVerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({ api_key: keyInput.trim() });
      const res = await fetchClient<APIKeyVerifyResponse>(`/auth/api-keys/verify?${params}`
        , { method: 'POST' });
      setResult(res);
    } catch (e: any) {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
        <Shield size={20} color="var(--accent-primary)" /> Verificar API Key
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Pegá una API key para verificar si es válida y a quién pertenece.
      </p>

      <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          id="verify-key-input"
          className="input-field"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="yt_abc123..."
          style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}
        />
        <button
          id="verify-key-btn"
          type="submit"
          className="btn-primary"
          disabled={loading || !keyInput.trim()}
          style={{ whiteSpace: 'nowrap', opacity: !keyInput.trim() ? 0.5 : 1 }}
        >
          {loading ? 'Verificando…' : 'Verificar'}
        </button>
      </form>

      {result && (
        <div style={{
          padding: '1.25rem',
          borderRadius: '10px',
          background: result.valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${result.valid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          {result.valid
            ? <CheckCircle color="var(--success)" size={28} />
            : <XCircle color="var(--error)" size={28} />
          }
          <div>
            <div style={{ fontWeight: 600, color: result.valid ? 'var(--success)' : 'var(--error)', marginBottom: '4px' }}>
              {result.valid ? '✅ Key válida' : '❌ Key inválida o revocada'}
            </div>
            {result.valid && result.title && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Pertenece a: <strong style={{ color: 'var(--text-primary)' }}>{result.title}</strong>
                {result.key_id && <span style={{ fontFamily: 'monospace', marginLeft: '8px', fontSize: '0.8rem' }}>({result.key_id.substring(0, 8)}…)</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vista principal Cache Manager ─────────────────────────────────────────
export default function CacheView() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Cache Manager</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Gestión del caché de URLs de stream y verificación de API keys.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <CacheStatsPanel />
        </div>
        <CacheLookupPanel />
        <VerifyKeyPanel />
      </div>
    </div>
  );
}
