'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role, USERS } from '@/data/mockData';
import { useRouter } from 'next/navigation';
import { hydrateFromBackend } from '@/lib/bootstrap-client';
import {
  canModuleAction,
  emptyModulePermissionMap,
  type ModuleCode,
  type ModulePermissionMap,
  type ModulePermissions,
  type PermissionAction,
  toModulePermissionMap,
} from '@/lib/permissions';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface UserContextType {
  currentUser: User | null;
  currentRole: Role | null;
  modulePermissions: ModulePermissionMap;
  isHydrating: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (moduleCode: ModuleCode, action?: PermissionAction) => boolean;
  updateUser: (updates: Partial<User>) => void;
}

interface AuthMeResponse {
  ok: boolean;
  user?: SessionUser;
  error?: string;
}

interface PermissionsResponse {
  ok: boolean;
  permissions?: ModulePermissions[];
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
  const [modulePermissions, setModulePermissions] = useState<ModulePermissionMap>(emptyModulePermissionMap());
  const [isHydrating, setIsHydrating] = useState(true);
  const router = useRouter();

  const fetchPermissions = React.useCallback(async (): Promise<ModulePermissionMap> => {
    const response = await fetch('/api/v1/auth/permissions', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return emptyModulePermissionMap();
    }

    const payload = (await response.json()) as PermissionsResponse;
    if (!payload.ok || !payload.permissions) {
      return emptyModulePermissionMap();
    }

    return toModulePermissionMap(payload.permissions);
  }, []);

  const applySession = React.useCallback(async (sessionUser: SessionUser): Promise<void> => {
    const [permissions] = await Promise.all([fetchPermissions(), hydrateFromBackend()]);
    setModulePermissions(permissions);
    setCurrentRole(sessionUser.role);
    setCurrentUser(buildUserFromRole(sessionUser.role, sessionUser));
  }, [fetchPermissions]);

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
            setModulePermissions(emptyModulePermissionMap());
            setIsHydrating(false);
          }
          return;
        }

        const payload = (await response.json()) as AuthMeResponse;

        if (!payload.ok || !payload.user) {
          if (!cancelled) {
            setCurrentRole(null);
            setCurrentUser(null);
            setModulePermissions(emptyModulePermissionMap());
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
          setModulePermissions(emptyModulePermissionMap());
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
  }, [applySession]);

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
      setModulePermissions(emptyModulePermissionMap());
      router.push('/');
    }
  };

  const can = (moduleCode: ModuleCode, action: PermissionAction = 'view') =>
    canModuleAction(modulePermissions, moduleCode, action);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentRole,
        modulePermissions,
        isHydrating,
        isAuthenticated: !!currentUser,
        login,
        logout,
        can,
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
