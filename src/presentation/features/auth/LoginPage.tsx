import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const [keyInput, setKeyInput] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const { login, error, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setErrorLocal('La llave es requerida');
      return;
    }
    
    setErrorLocal('');
    try {
      await login(keyInput.trim());
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      // El error ya es manejado por el context, pero podemos dejar un feedback visual acá si queremos
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>yt-music-api</h2>
        
        {(error || errorLocal) && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid var(--error)' }}>
            {error || errorLocal}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>X-Admin-Key</label>
            <input 
              className="input-field" 
              type="password" 
              placeholder="Ingresa tu clave maestra..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}
