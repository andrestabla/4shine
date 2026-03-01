'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useUser } from '@/context/UserContext';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface RouteAccess {
    moduleCode: ModuleCode;
    action?: PermissionAction;
}

const ACCESS_BY_PATH: Record<string, RouteAccess> = {
    '/dashboard': { moduleCode: 'dashboard' },
    '/dashboard/trayectoria': { moduleCode: 'trayectoria' },
    '/dashboard/aprendizaje': { moduleCode: 'aprendizaje' },
    '/dashboard/metodologia': { moduleCode: 'metodologia' },
    '/dashboard/mentorias': { moduleCode: 'mentorias' },
    '/dashboard/networking': { moduleCode: 'networking' },
    '/dashboard/convocatorias': { moduleCode: 'convocatorias' },
    '/dashboard/mensajes': { moduleCode: 'mensajes' },
    '/dashboard/workshops': { moduleCode: 'workshops' },
    '/dashboard/perfil': { moduleCode: 'perfil' },
    '/dashboard/lideres': { moduleCode: 'lideres' },
    '/dashboard/formacion-mentores': { moduleCode: 'formacion_mentores' },
    '/dashboard/gestion-formacion-mentores': { moduleCode: 'gestion_formacion_mentores' },
    '/dashboard/usuarios': { moduleCode: 'usuarios', action: 'view' },
    '/dashboard/administracion': { moduleCode: 'usuarios', action: 'manage' },
    '/dashboard/administracion/branding': { moduleCode: 'usuarios', action: 'manage' },
    '/dashboard/administracion/integraciones': { moduleCode: 'usuarios', action: 'manage' },
    '/dashboard/contenido': { moduleCode: 'contenido' },
    '/dashboard/analitica': { moduleCode: 'analitica' },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser, isHydrating, isAuthenticated, can } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const routeAccess = ACCESS_BY_PATH[pathname];
    const canViewRoute = routeAccess
        ? can(routeAccess.moduleCode, routeAccess.action ?? 'view')
        : true;

    useEffect(() => {
        if (!isHydrating && !isAuthenticated) {
            router.push('/');
        }
    }, [isHydrating, isAuthenticated, router]);

    useEffect(() => {
        if (!isHydrating && isAuthenticated && !canViewRoute) {
            router.push(can('dashboard', 'view') ? '/dashboard' : '/');
        }
    }, [can, canViewRoute, isAuthenticated, isHydrating, router]);

    if (isHydrating) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                Cargando sesión...
            </div>
        );
    }

    if (!currentUser) return null;
    if (!canViewRoute) return null;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300",
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] flex flex-col w-full">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-h-full pb-20 animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
