import React, { useEffect, useState, useCallback } from 'react';
import { fetchClient } from '../../../data/api';
import type { StatsResponse, CacheStatsResponse, CacheClearResponse } from '../../../domain/types';
import { Activity, Database, HardDrive, RefreshCw, Zap, Shield, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Sub-componente: muestra un Record<string, unknown> como tabla key-value ─────
function RecordPanel({ data, title, icon }: { data: Record<string, unknown> | null | undefined; title: string; icon: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, marginBottom: expanded ? '1rem' : 0 }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem' }}>
          {icon} {title}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {entries.map(([key, val]) => {
            const display = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—');
            const isGood = display === 'true' || display === 'closed' || display === 'enabled';
            const isBad = display === 'false' || display === 'open' || display === 'disabled';
            return (
              <div key={key} style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  fontFamily: typeof val === 'number' ? 'monospace' : 'inherit',
                  color: isGood ? 'var(--success)' : isBad ? 'var(--error)' : 'var(--text-primary)',
                }}>
                  {display}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta simple de métrica ─────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '0.9rem' }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color }}>{value}</h3>
      {sub && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sub}</p>}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────────
export default function DashboardStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, cacheData] = await Promise.allSettled([
        fetchClient<StatsResponse>('/admin/stats/stats'),
        fetchClient<CacheStatsResponse>('/admin/cache/stats'),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      else console.error('Error stats:', statsData.reason);

      if (cacheData.status === 'fulfilled') setCacheStats(cacheData.value);
      else console.error('Error cache stats:', cacheData.reason);

      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleClearCache = async () => {
    if (!confirm('¿Vaciar todo el caché de streams? Esto forzará re-fetch de las URLs de YouTube.')) return;
    setClearingCache(true);
    try {
      const res = await fetchClient<CacheClearResponse>('/admin/cache/clear', { method: 'DELETE' });
      alert(`✅ Caché vaciado. Estado: ${res.status}`);
      loadAll();
    } catch (e: any) {
      alert(`❌ Error: ${e.message || 'No se pudo limpiar el caché'}`);
    } finally {
      setClearingCache(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '12px' }}>Cargando stats del sistema...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>System Dashboard</h2>
          {lastRefresh && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Actualizado: {lastRefresh.toLocaleTimeString('es-AR')}
            </p>
          )}
        </div>
        <button
          id="refresh-stats-btn"
          onClick={loadAll}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <RefreshCw size={18} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refrescar
        </button>
      </div>

      {/* Tarjetas de métricas clave */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <MetricCard
          label="Servicio"
          value={stats?.service ?? '—'}
          sub={stats?.version ? `v${stats.version}` : 'versión desconocida'}
          icon={<Activity size={20} />}
          color="var(--success)"
        />
        <MetricCard
          label="Caché — Entradas"
          value={cacheStats?.keys ?? '—'}
          sub={cacheStats?.size ? `Tamaño: ${cacheStats.size}` : undefined}
          icon={<Database size={20} />}
          color="var(--accent-primary)"
        />
        <MetricCard
          label="Caché — TTL"
          value={cacheStats?.ttl != null ? `${cacheStats.ttl}s` : '—'}
          sub="Tiempo de vida por entrada"
          icon={<Zap size={20} />}
          color="var(--warning)"
        />
        {stats?.error && (
          <MetricCard
            label="Error de Stats"
            value="⚠️ Parcial"
            sub={stats.error}
            icon={<Shield size={20} />}
            color="var(--error)"
          />
        )}
      </div>

      {/* Panels dinámicos por sección */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <RecordPanel data={stats?.rate_limiting} title="Rate Limiting" icon={<Shield size={18} color="var(--accent-primary)" />} />
        <RecordPanel data={stats?.caching} title="Caching" icon={<Database size={18} color="var(--warning)" />} />
        <RecordPanel data={stats?.cache_manager} title="Cache Manager" icon={<HardDrive size={18} color="var(--success)" />} />
        <RecordPanel data={stats?.circuit_breaker} title="Circuit Breaker" icon={<Zap size={18} color="var(--error)" />} />
        <RecordPanel data={stats?.performance} title="Performance" icon={<Activity size={18} color="var(--text-secondary)" />} />
      </div>

      {/* Panel de mantenimiento */}
      <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={20} /> Mantenimiento
          </h3>
          <button
            id="clear-cache-btn"
            onClick={handleClearCache}
            disabled={clearingCache}
            className="btn-secondary"
            style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.4)', opacity: clearingCache ? 0.6 : 1 }}
          >
            {clearingCache ? '⏳ Vaciando...' : '🗑️ Vaciar Caché'}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Vaciar el caché fuerza la regeneración de las firmas de YouTube en las próximas peticiones de stream.
          Esto puede aumentar transitoriamente la carga del backend.
        </p>
      </div>
    </div>
  );
}
