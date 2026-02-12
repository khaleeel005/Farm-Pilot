import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getCurrentUser, logout as apiLogout } from '@/lib/api';
import { authEvents } from '@/lib/authEvents';

type User = {
  id: number;
  username: string;
  role: 'owner' | 'staff';
  email?: string;
};

type BackendUser = {
  id: number;
  username: string;
  role: string;
  email?: string;
};

type ContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<boolean>;
  logout: () => void;
};

const UserContext = createContext<ContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchInFlight = useRef(false);
  const hasInitialized = useRef(false);

  const fetchUser = async (): Promise<boolean> => {
    if (fetchInFlight.current) {
      return false;
    }
    fetchInFlight.current = true;
    setLoading(true);
    try {
      const u = await getCurrentUser() as BackendUser | null;
      if (u) {
        setUser({
          id: u.id,
          username: u.username,
          role: u.role === 'owner' ? 'owner' : 'staff',
          email: u.email,
        });
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch {
      setUser(null);
      return false;
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    fetchUser();
    const onLogin = () => void fetchUser();
    const onRefresh = () => void fetchUser();
    const onLogout = () => {
      setUser(null);
    };

    authEvents.on('login', onLogin);
    authEvents.on('refresh', onRefresh);
    authEvents.on('logout', onLogout);
    return () => {
      authEvents.off('login', onLogin);
      authEvents.off('refresh', onRefresh);
      authEvents.off('logout', onLogout);
    };
  }, []);

  const handleLogout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, refresh: fetchUser, logout: handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
