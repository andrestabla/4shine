'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ViewerAccessState } from '@/features/access/types';
import type { BootstrapPayload, Role, User } from '@/server/bootstrap/types';
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
  sessionUser: SessionUser | null;
  bootstrapData: BootstrapPayload | null;
  viewerAccess: ViewerAccessState | null;
  modulePermissions: ModulePermissionMap;
  isHydrating: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (moduleCode: ModuleCode, action?: PermissionAction) => boolean;
  refreshBootstrap: () => Promise<void>;
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

const ROLE_LABEL: Record<Role, string> = {
  lider: 'Líder',
  mentor: 'Mentor',
  gestor: 'Gestor del Programa',
  admin: 'Administrador',
};

const ROLE_COLOR: Record<Role, string> = {
  lider: 'bg-amber-500',
  mentor: 'bg-blue-600',
  gestor: 'bg-teal-600',
  admin: 'bg-slate-700',
};

function fallbackUser(sessionUser: SessionUser): User {
  return {
    id: sessionUser.id,
    name: sessionUser.name,
    role: ROLE_LABEL[sessionUser.role],
    avatar: sessionUser.name.charAt(0).toUpperCase() || 'U',
    color: ROLE_COLOR[sessionUser.role],
    company: '4Shine',
    location: 'Remoto',
    stats: {},
  };
}

function buildCurrentUser(sessionUser: SessionUser, payload: BootstrapPayload): User {
  if (payload.currentUser) {
    return {
      ...payload.currentUser,
      id: payload.currentUser.id || sessionUser.id,
      name: sessionUser.name || payload.currentUser.name,
    };
  }

  const payloadUser = payload.users?.[sessionUser.role];
  if (!payloadUser) {
    return fallbackUser(sessionUser);
  }

  return {
    ...payloadUser,
    id: payloadUser.id || sessionUser.id,
    name: sessionUser.name || payloadUser.name,
  };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [bootstrapData, setBootstrapData] = useState<BootstrapPayload | null>(null);
  const [modulePermissions, setModulePermissions] = useState<ModulePermissionMap>(emptyModulePermissionMap());
  const [isHydrating, setIsHydrating] = useState(true);
  const router = useRouter();

  const clearSession = React.useCallback(() => {
    setCurrentRole(null);
    setCurrentUser(null);
    setSessionUser(null);
    setBootstrapData(null);
    setModulePermissions(emptyModulePermissionMap());
  }, []);

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

  const applySession = React.useCallback(
    async (nextSessionUser: SessionUser): Promise<void> => {
      const [permissions, data] = await Promise.all([fetchPermissions(), hydrateFromBackend()]);

      setSessionUser(nextSessionUser);
      setCurrentRole(nextSessionUser.role);
      setModulePermissions(permissions);
      setBootstrapData(data);
      setCurrentUser(buildCurrentUser(nextSessionUser, data));
    },
    [fetchPermissions],
  );

  const refreshBootstrap = React.useCallback(async () => {
    if (!sessionUser) {
      return;
    }

    const data = await hydrateFromBackend();
    setBootstrapData(data);
    setCurrentUser(buildCurrentUser(sessionUser, data));
  }, [sessionUser]);

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
            clearSession();
            setIsHydrating(false);
          }
          return;
        }

        const payload = (await response.json()) as AuthMeResponse;

        if (!payload.ok || !payload.user) {
          if (!cancelled) {
            clearSession();
            setIsHydrating(false);
          }
          return;
        }

        await applySession(payload.user);
      } catch (error) {
        console.error('Session restore failed', error);
        if (!cancelled) {
          clearSession();
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
  }, [applySession, clearSession]);

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
    if (!currentUser || !currentRole) return;

    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);

    setBootstrapData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentUser: {
          ...prev.currentUser,
          ...updates,
        },
        users: {
          ...prev.users,
          [currentRole]: {
            ...prev.users[currentRole],
            ...updates,
          },
        },
      };
    });
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
      clearSession();
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
        sessionUser,
        bootstrapData,
        viewerAccess: bootstrapData?.viewerAccess ?? null,
        modulePermissions,
        isHydrating,
        isAuthenticated: !!sessionUser,
        login,
        logout,
        can,
        refreshBootstrap,
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
