'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role, USERS } from '@/data/mockData';
import { useRouter } from 'next/navigation';
import { hydrateFromBackend } from '@/lib/bootstrap-client';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface UserContextType {
  currentUser: User | null;
  currentRole: Role | null;
  isHydrating: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface AuthMeResponse {
  ok: boolean;
  user?: SessionUser;
  error?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function buildUserFromRole(role: Role, sessionUser?: SessionUser): User {
  const base = USERS[role];
  return {
    ...base,
    name: sessionUser?.name ?? base.name,
    role: base.role,
  };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const router = useRouter();

  const applySession = async (sessionUser: SessionUser): Promise<void> => {
    await hydrateFromBackend();
    setCurrentRole(sessionUser.role);
    setCurrentUser(buildUserFromRole(sessionUser.role, sessionUser));
  };

  React.useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const response = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setCurrentRole(null);
            setCurrentUser(null);
            setIsHydrating(false);
          }
          return;
        }

        const payload = (await response.json()) as AuthMeResponse;

        if (!payload.ok || !payload.user) {
          if (!cancelled) {
            setCurrentRole(null);
            setCurrentUser(null);
            setIsHydrating(false);
          }
          return;
        }

        await applySession(payload.user);
      } catch (error) {
        console.error('Session restore failed', error);
        if (!cancelled) {
          setCurrentRole(null);
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    setIsHydrating(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as AuthMeResponse;

      if (!response.ok || !payload.ok || !payload.user) {
        setIsHydrating(false);
        return { ok: false, error: payload.error ?? 'Invalid credentials' };
      }

      await applySession(payload.user);
      setIsHydrating(false);
      router.push('/dashboard');
      return { ok: true };
    } catch (error) {
      console.error('Login failed', error);
      setIsHydrating(false);
      return { ok: false, error: 'Login failed' };
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setCurrentRole(null);
      setCurrentUser(null);
      router.push('/');
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentRole,
        isHydrating,
        isAuthenticated: !!currentUser,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
