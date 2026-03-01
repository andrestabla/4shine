'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role, USERS } from '@/data/mockData';
import { useRouter } from 'next/navigation';

interface UserContextType {
    currentUser: User | null;
    currentRole: Role | null;
    login: (role: Role) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    // Inicialmente null. En una app real, verificaríamos sesión al inicio.
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const router = useRouter();

    // Restore session on mount
    React.useEffect(() => {
        const storedRole = localStorage.getItem('4shine_role') as Role;
        if (storedRole && USERS[storedRole]) {
            setCurrentRole(storedRole);
            setCurrentUser(USERS[storedRole]);
        }
    }, []);

    const login = (role: Role) => {
        localStorage.setItem('4shine_role', role);
        setCurrentRole(role);
        setCurrentUser(USERS[role]);
        // En una app real aquí iría la llamada a la API
        router.push('/dashboard');
    };

    const updateUser = (updates: Partial<User>) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            setCurrentUser(updatedUser);
            // In a real app, send 'updates' to API here
        }
    };

    const logout = () => {
        localStorage.removeItem('4shine_role');
        setCurrentUser(null);
        setCurrentRole(null);
        router.push('/');
    };

    return (
        <UserContext.Provider value={{ currentUser, currentRole, login, logout, updateUser }}>
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
