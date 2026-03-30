import React, { useEffect, useState } from 'react';
import { fetchClient } from '../../../data/api';
import type { BrowserAccount, BrowserListResponse, BrowserTestResponse } from '../../../domain/types';
import { Globe, Plus, Trash2, CheckCircle, XCircle, Play, RefreshCw, Users, AlertTriangle } from 'lucide-react';

function formatTimestamp(ts?: number | null): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getRateLimitRemaining(ts?: number | null): string | null {
  if (!ts) return null;
  const now = Date.now() / 1000;
  if (ts <= now) return null;
  const secs = Math.round(ts - now);
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)}min`;
}

export default function BrowserView() {
  const [accounts, setAccounts] = useState<BrowserAccount[]>([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [availableAccounts, setAvailableAccounts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testResult, setTestResult] = useState<BrowserTestResponse | null>(null);

  const [addMode, setAddMode] = useState<'url' | 'headers'>('url');
  const [newName, setNewName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [headersInput, setHeadersInput] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const resp = await fetchClient<BrowserListResponse>('/admin/auth/browser');
      setAccounts(resp.accounts);
      setTotalAccounts(resp.total);
      setAvailableAccounts(resp.available);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (addMode === 'url') {
        if (!urlInput.trim()) return alert('URL requerida');
        const params = new URLSearchParams({ url: urlInput.trim() });
        if (newName.trim()) params.append('name', newName.trim());
        await fetchClient(`/admin/auth/browser/from-url?${params.toString()}`, { method: 'POST' });
      } else {
        if (!headersInput.trim()) return alert('Headers requeridos');
        let parsed: unknown;
        try { parsed = JSON.parse(headersInput); } catch { return alert('JSON inválido'); }
        const params = new URLSearchParams();
        if (newName.trim()) params.append('name', newName.trim());
        await fetchClient(`/admin/auth/browser/from-headers?${params.toString()}`, {
          method: 'POST',
          body: JSON.stringify(parsed),
        });
      }
      setShowModal(false);
      setUrlInput('');
      setHeadersInput('');
      setNewName('');
      loadAccounts();
    } catch (e: any) {
      alert(e.message || 'Error agregando cuenta');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`¿Eliminar la cuenta "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetchClient(`/admin/auth/browser/${encodeURIComponent(name)}`, { method: 'DELETE' });
      loadAccounts();
    } catch (e: any) {
      alert(e.message || 'Error borrando cuenta');
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await fetchClient<BrowserTestResponse>('/admin/auth/browser/test', { method: 'POST' });
      setTestResult(res);
      loadAccounts();
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Error desconocido' });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Cuentas de Navegador</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {availableAccounts}/{totalAccounts} cuentas disponibles
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button id="refresh-browser-btn" className="btn-secondary" onClick={loadAccounts} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RefreshCw size={18} /> Refrescar
          </button>
          <button id="test-auth-btn" className="btn-secondary" onClick={handleTest} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Play size={18} /> Test Auth
          </button>
          <button id="add-account-btn" className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Plus size={18} /> Agregar Cuenta
          </button>
        </div>
      </div>

      {/* Resumen de cuentas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={28} color="var(--accent-primary)" />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalAccounts}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total cuentas</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle size={28} color="var(--success)" />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{availableAccounts}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Disponibles</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <XCircle size={28} color={totalAccounts - availableAccounts > 0 ? 'var(--error)' : 'var(--text-secondary)'} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalAccounts - availableAccounts > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
              {totalAccounts - availableAccounts}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rate limited</div>
          </div>
        </div>
      </div>

      {/* Resultado del test */}
      {testResult && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${testResult.success ? 'var(--success)' : 'var(--error)'}`,
            background: testResult.success ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {testResult.success ? <CheckCircle color="var(--success)" size={20} /> : <XCircle color="var(--error)" size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: testResult.success ? 'var(--success)' : 'var(--error)', display: 'block', marginBottom: '4px' }}>
                  {testResult.success ? '✅ Autenticación exitosa' : '❌ Fallo de autenticación'}
                </strong>

                {/* Mensaje raw del backend */}
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: testResult.success ? 0 : '10px' }}>
                  {testResult.account_used && <span style={{ color: 'var(--success)', marginRight: '8px' }}>Cuenta: {testResult.account_used}</span>}
                  {testResult.message}
                </div>

                {/* Diagnóstico para errores conocidos del backend */}
                {!testResult.success && (() => {
                  const msg = testResult.message || '';

                  if (msg.includes('unexpected keyword argument')) {
                    const fnMatch = msg.match(/(\w+\.\w+)\(\)/);
                    const fn = fnMatch ? fnMatch[1] : 'función interna';
                    return (
                      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        <div style={{ color: 'var(--warning)', fontWeight: 600, marginBottom: '4px' }}>⚠️ Error en el backend — incompatibilidad de versión</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          La función <code style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: '3px' }}>{fn}</code> de{' '}
                          <code style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: '3px' }}>ytmusicapi</code> no acepta ese argumento en la versión instalada.
                        </div>
                        <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                          La <strong style={{ color: 'var(--text-primary)' }}>cuenta sí está cargada correctamente</strong> — este error es del test, no del registro.
                          Actualizá la librería en el servidor:
                        </div>
                        <code style={{ display: 'block', marginTop: '8px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px', color: 'var(--success)', fontSize: '0.8rem' }}>
                          pip install --upgrade ytmusicapi
                        </code>
                      </div>
                    );
                  }

                  if (msg.includes('503') || msg.toLowerCase().includes('service unavailable') || msg.toLowerCase().includes('no accounts')) {
                    return (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        <div style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '4px' }}>🔴 Sin cuentas disponibles</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          No hay ninguna cuenta de navegador activa para autenticarse. Agregá al menos una cuenta válida.
                        </div>
                      </div>
                    );
                  }

                  if (msg.toLowerCase().includes('cookie') || msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('403')) {
                    return (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        <div style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '4px' }}>🔑 Credenciales inválidas o expiradas</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Las cookies o el token de la cuenta registrada ya no son válidos. Eliminá la cuenta y volvé a agregarla con headers actualizados desde YouTube Music.
                        </div>
                      </div>
                    );
                  }

                  // Error genérico
                  return (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--error)' }}>Error del backend.</strong> Revisá los logs del servidor para más detalles.
                    </div>
                  );
                })()}
              </div>
            </div>
            <button onClick={() => setTestResult(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '8px' }}>✕</button>
          </div>
        </div>
      )}

      {/* Descripción */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Las cuentas de navegador autentican las peticiones a YouTube Music. El sistema rota automáticamente entre cuentas disponibles y aplica backoff cuando una cuenta entra en rate limit.
        </p>
      </div>

      {/* Tabla de cuentas */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Cargando cuentas...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem 1.25rem' }}>Nombre</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem' }}>Errores</th>
                <th style={{ padding: '1rem 1.25rem' }}>Rate Limit expira</th>
                <th style={{ padding: '1rem 1.25rem' }}>Último uso</th>
                <th style={{ padding: '1rem 1.25rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => {
                const rateLimitLeft = getRateLimitRemaining(acc.rate_limited_until);
                return (
                  <tr
                    key={acc.name}
                    style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={16} color="var(--text-secondary)" />
                        <span style={{ fontWeight: 500 }}>{acc.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {acc.available ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.82rem' }}>
                          <CheckCircle size={13} /> Disponible
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.82rem' }}>
                          <XCircle size={13} /> Rate Limited
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {acc.error_count > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--warning)' }}>
                          <AlertTriangle size={14} /> {acc.error_count}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: rateLimitLeft ? 'var(--error)' : 'var(--text-secondary)' }}>
                      {rateLimitLeft ? `⏳ ${rateLimitLeft}` : '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatTimestamp(acc.last_used)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        id={`delete-account-${acc.name}`}
                        className="btn-secondary"
                        onClick={() => handleDelete(acc.name)}
                        style={{ padding: '0.3rem 0.6rem', color: 'var(--error)', borderColor: 'transparent' }}
                        title="Eliminar cuenta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {accounts.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Globe size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No hay cuentas configuradas.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Agregá una cuenta para que el servicio pueda autenticarse con YouTube Music.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal agregar cuenta */}
      {showModal && (
        <div
          id="add-account-modal-overlay"
          className="flex-center"
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 1000, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Agregar Cuenta de Navegador</h3>

            {/* Tabs modo */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <button
                id="mode-url-btn"
                onClick={() => setAddMode('url')}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: addMode === 'url' ? 600 : 400, background: addMode === 'url' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: addMode === 'url' ? 'white' : 'var(--text-secondary)' }}
              >
                🔗 Desde URL
              </button>
              <button
                id="mode-headers-btn"
                onClick={() => setAddMode('headers')}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: addMode === 'headers' ? 600 : 400, background: addMode === 'headers' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: addMode === 'headers' ? 'white' : 'var(--text-secondary)' }}
              >
                📋 Headers JSON
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Nombre <span style={{ fontSize: '0.8rem' }}>(opcional)</span>
                </label>
                <input
                  id="account-name-input"
                  className="input-field"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: cuenta_principal"
                />
              </div>

              {addMode === 'url' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    URL del JSON <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    id="account-url-input"
                    className="input-field"
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://raw.githubusercontent.com/usuario/repo/main/headers.json"
                    required
                    style={{ marginBottom: '0.75rem' }}
                  />
                  {/* Explicación del formato esperado */}
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📄 El JSON en esa URL debe tener esta estructura:</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify({
                          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                          "Accept": "*/*",
                          "Accept-Language": "en-US,en;q=0.5",
                          "Content-Type": "application/json",
                          "X-Goog-AuthUser": "0",
                          "x-origin": "https://music.youtube.com",
                          "Cookie": "LOGIN_INFO=REEMPLAZAR; SID=REEMPLAZAR; HSID=REEMPLAZAR; SSID=REEMPLAZAR; APISID=REEMPLAZAR; SAPISID=REEMPLAZAR",
                          "Authorization": "SAPISIDHASH TIMESTAMP_REEMPLAZAR_HASH_REEMPLAZAR"
                        }, null, 2))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent-primary)', padding: '2px 6px' }}
                      >
                        📋 Copiar estructura
                      </button>
                    </div>
                    <pre style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{`{
  "User-Agent": "Mozilla/5.0 ...",
  "Accept": "*/*",
  "Content-Type": "application/json",
  "X-Goog-AuthUser": "0",
  "x-origin": "https://music.youtube.com",
  "Cookie": "LOGIN_INFO=...; SID=...; SAPISID=...",
  "Authorization": "SAPISIDHASH 1234567890_abc..."
}`}</pre>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Headers JSON <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <button
                      type="button"
                      id="load-template-btn"
                      onClick={() => setHeadersInput(JSON.stringify({
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                        "Accept": "*/*",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Content-Type": "application/json",
                        "X-Goog-AuthUser": "0",
                        "x-origin": "https://music.youtube.com",
                        "Cookie": "LOGIN_INFO=REEMPLAZAR; SID=REEMPLAZAR; HSID=REEMPLAZAR; SSID=REEMPLAZAR; APISID=REEMPLAZAR; SAPISID=REEMPLAZAR",
                        "Authorization": "SAPISIDHASH TIMESTAMP_REEMPLAZAR_HASH_REEMPLAZAR"
                      }, null, 2))}
                      style={{ background: 'transparent', border: '1px dashed var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent-primary)', padding: '3px 10px' }}
                    >
                      ✨ Cargar template
                    </button>
                  </div>
                  <textarea
                    id="account-headers-input"
                    className="input-field"
                    value={headersInput}
                    onChange={e => setHeadersInput(e.target.value)}
                    placeholder={`{
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Content-Type": "application/json",
  "X-Goog-AuthUser": "0",
  "x-origin": "https://music.youtube.com",
  "Cookie": "LOGIN_INFO=...; SID=...; HSID=...; SSID=...; APISID=...; SAPISID=...",
  "Authorization": "SAPISIDHASH 1234567890_abc123..."
}`}
                    style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.5 }}
                    required
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    💡 Obtené estos valores desde las DevTools del browser (F12 → Network → cualquier request a music.youtube.com → Request Headers).
                    Hacé clic en <strong>✨ Cargar template</strong> y reemplazá los valores <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: '3px' }}>REEMPLAZAR</code> con los tuyos.
                  </p>
                </div>
              )}

              <div className="flex-between">
                <button id="cancel-add-account-btn" type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button id="submit-add-account-btn" type="submit" className="btn-primary">
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
