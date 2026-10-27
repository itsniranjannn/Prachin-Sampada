import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setReady(true); return null; }
    try {
      const { user: u } = await api('/auth/me');
      setUser(u);
      return u;
    } catch (e) {
      if (e.status === 401) { setToken(null); setUser(null); }
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({
    user, ready, refresh,
    async login(email, password) {
      const { token, user: u } = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(token); setUser(u); return u;
    },
    async register(payload) {
      const { token, user: u } = await api('/auth/register', { method: 'POST', body: payload });
      setToken(token); setUser(u); return u;
    },
    logout() { setToken(null); setUser(null); },
    setUser,
  }), [user, ready, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
