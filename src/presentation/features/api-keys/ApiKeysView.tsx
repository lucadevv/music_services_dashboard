import React, { useEffect, useState } from 'react';
import { fetchClient } from '../../../data/api';
import type { APIKey, APIKeyListResponse, APIKeyUpdate } from '../../../domain/types';
import { Key, Plus, Trash2, CheckCircle, XCircle, Shield, RefreshCw, Copy, Pencil } from 'lucide-react';

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      title="Copiar"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: copied ? 'var(--success)' : 'var(--text-secondary)' }}
    >
      <Copy size={16} />
    </button>
  );
}

export default function ApiKeysView() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Crear
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKeyData, setNewKeyData] = useState<{ api_key: string; title: string } | null>(null);

  // Editar
  const [editKey, setEditKey] = useState<APIKey | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const resp = await fetchClient<APIKeyListResponse>('/admin/api-keys/');
      setKeys(resp.keys);
      setTotal(resp.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadKeys(); }, []);

  const openEdit = (k: APIKey) => {
    setEditKey(k);
    setEditTitle(k.title);
    setEditDesc(k.description ?? '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return alert('Título requerido');
    try {
      const resp = await fetchClient<APIKey>('/admin/api-keys/', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || undefined }),
      });
      setNewKeyData({ api_key: resp.api_key, title: resp.title });
      setShowCreateModal(false);
      setNewTitle(''); setNewDesc('');
      loadKeys();
    } catch (e: any) { alert(e.message || 'Error al crear'); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKey) return;
    setEditSaving(true);
    try {
      const body: APIKeyUpdate = {
        title: editTitle.trim() || null,
        description: editDesc.trim() || null,
      };
      await fetchClient<APIKey>(`/admin/api-keys/${editKey.key_id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setEditKey(null);
      loadKeys();
    } catch (e: any) { alert(e.message || 'Error al guardar'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (key_id: string, is_admin: boolean) => {
    if (is_admin) return alert('No se puede revocar una llave de administrador.');
    if (!confirm('¿Revocar esta llave permanentemente?')) return;
    try {
      await fetchClient(`/admin/api-keys/${key_id}`, { method: 'DELETE' });
      loadKeys();
    } catch (e: any) { alert(e.message || 'Error borrando token'); }
  };

  const toggleEnabled = async (key_id: string, current: boolean, is_admin: boolean) => {
    if (is_admin) return;
    try {
      await fetchClient(`/admin/api-keys/${key_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !current }),
      });
      loadKeys();
    } catch (e: any) { alert(e.message || 'Error actualizando estado'); }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>API Keys</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {total} {total === 1 ? 'llave registrada' : 'llaves registradas'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button id="refresh-keys-btn" onClick={loadKeys} className="btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RefreshCw size={18} /> Refrescar
          </button>
          <button id="create-key-btn" className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Plus size={18} /> Nueva Key
          </button>
        </div>
      </div>

      {/* Banner secreto recién creado */}
      {newKeyData && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} /> Llave creada exitosamente
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            ⚠️ Anotá esto ahora — <strong>no se volverá a mostrar</strong>.
          </p>
          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', wordBreak: 'break-all' }}>
            <span>{newKeyData.api_key}</span>
            <CopyButton text={newKeyData.api_key} />
          </div>
          <button id="dismiss-key-banner-btn" onClick={() => setNewKeyData(null)} className="btn-secondary" style={{ marginTop: '1rem' }}>
            Entendido, ya lo guardé
          </button>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando llaves...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem 1.25rem' }}>Key ID</th>
                <th style={{ padding: '1rem 1.25rem' }}>Título / Descripción</th>
                <th style={{ padding: '1rem 1.25rem' }}>Tipo</th>
                <th style={{ padding: '1rem 1.25rem' }}>Creada</th>
                <th style={{ padding: '1rem 1.25rem' }}>Último uso</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.key_id}
                  style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {k.key_id.substring(0, 8)}…
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 500 }}>{k.title}</div>
                    {k.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{k.description}</div>}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {k.is_admin ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 8px', borderRadius: '20px' }}>
                        <Shield size={12} /> Admin
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: '20px' }}>
                        <Key size={12} /> Cliente
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(k.created_at)}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(k.last_used)}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <button
                      id={`toggle-key-${k.key_id}`}
                      onClick={() => toggleEnabled(k.key_id, k.enabled, k.is_admin)}
                      disabled={k.is_admin}
                      title={k.is_admin ? 'Las llaves admin no se pueden deshabilitar' : (k.enabled ? 'Deshabilitar' : 'Habilitar')}
                      style={{ background: 'transparent', border: 'none', cursor: k.is_admin ? 'not-allowed' : 'pointer', opacity: k.is_admin ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {k.enabled
                        ? <><CheckCircle color="var(--success)" size={18} /><span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Activa</span></>
                        : <><XCircle color="var(--error)" size={18} /><span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>Inactiva</span></>
                      }
                    </button>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        id={`edit-key-${k.key_id}`}
                        className="btn-secondary"
                        onClick={() => openEdit(k)}
                        title="Editar título y descripción"
                        style={{ padding: '0.3rem 0.6rem', borderColor: 'transparent' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        id={`delete-key-${k.key_id}`}
                        className="btn-secondary"
                        onClick={() => handleDelete(k.key_id, k.is_admin)}
                        disabled={k.is_admin}
                        title={k.is_admin ? 'No se puede revocar una llave admin' : 'Revocar llave'}
                        style={{ padding: '0.3rem 0.6rem', color: k.is_admin ? 'var(--text-secondary)' : 'var(--error)', borderColor: 'transparent', opacity: k.is_admin ? 0.4 : 1, cursor: k.is_admin ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {keys.length === 0 && <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay llaves creadas.</p>}
        </div>
      )}

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Nueva API Key</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>El secreto solo se muestra una vez al crear.</p>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Título <span style={{ color: 'var(--error)' }}>*</span></label>
                <input id="new-key-title-input" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ej: Mobile App, NestJS Backend..." autoFocus />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Descripción <span style={{ fontSize: '0.8rem' }}>(opcional)</span></label>
                <input id="new-key-desc-input" className="input-field" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Para qué se va a usar esta key..." />
              </div>
              <div className="flex-between">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Generar Llave</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editKey && (
        <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditKey(null); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>Editar API Key</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
              {editKey.key_id.substring(0, 8)}…
            </p>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Título</label>
                <input
                  id="edit-key-title-input"
                  className="input-field"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Título de la key"
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Descripción <span style={{ fontSize: '0.8rem' }}>(opcional)</span></label>
                <input
                  id="edit-key-desc-input"
                  className="input-field"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Descripción de uso..."
                />
              </div>
              <div className="flex-between">
                <button type="button" className="btn-secondary" onClick={() => setEditKey(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={editSaving}>
                  {editSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
