import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchClient } from '../../data/api';

interface AuthContextType {
  isAuthenticated: boolean;
  adminKey: string | null;
  login: (key: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminKey, setAdminKey] = useState<string | null>(sessionStorage.getItem('adminKey'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyKey = async () => {
      if (!adminKey) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      try {
        await fetchClient('/admin/auth/status');
        setIsAuthenticated(true);
      } catch (e: any) {
        console.error('Session key invalid', e);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    verifyKey();
  }, [adminKey]);

  const login = async (key: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Intentamos con la API un endpoint que requiera la key para validar
      sessionStorage.setItem('adminKey', key);
      await fetchClient('/admin/auth/status');
      setAdminKey(key);
      setIsAuthenticated(true);
    } catch (e: any) {
      sessionStorage.removeItem('adminKey');
      setError(e.message || 'Key de administrador inválida');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminKey');
    setAdminKey(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminKey, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
