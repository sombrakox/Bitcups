import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type AccountUser = { id: number; name: string; email: string; role: string };
type AuthStatus = 'checking' | 'authenticated' | 'guest' | 'unavailable';
type AuthContextValue = {
  user: AccountUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(`Falha ao consultar sessão (${response.status})`);
      const result = await response.json();
      if (id !== requestId.current) return;
      if (result.user) {
        setUser(result.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('guest');
      }
    } catch {
      if (id !== requestId.current) return;
      // Network/server errors do not mean that the user explicitly logged out.
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    const onChange = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('bitcups:auth-changed', onChange);
    return () => {
      requestId.current++;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('bitcups:auth-changed', onChange);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Não foi possível sair. Tente novamente.');
    ++requestId.current;
    setUser(null);
    setStatus('guest');
    window.dispatchEvent(new Event('bitcups:auth-changed'));
  }, []);

  return <AuthContext.Provider value={{ user, status, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthSession precisa estar dentro de AuthProvider');
  return context;
}
