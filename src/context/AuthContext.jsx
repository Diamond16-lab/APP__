/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, login as loginRequest, logout as logoutRequest } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;

    getSession()
      .then((sessionUser) => {
        if (!active) return;
        setUser(sessionUser);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (!active) return;
        setBooting(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    booting,
    isAuthenticated: Boolean(user),
    async login(username, password) {
      const sessionUser = await loginRequest(username, password);
      setUser(sessionUser);
      return sessionUser;
    },
    async logout() {
      await logoutRequest();
      setUser(null);
    },
    setUser,
  }), [booting, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
