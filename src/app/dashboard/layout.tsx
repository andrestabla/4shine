'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useUser } from '@/context/UserContext';
import type { ModuleCode } from '@/lib/permissions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

const MODULE_BY_PATH: Record<string, ModuleCode> = {
    '/dashboard': 'dashboard',
    '/dashboard/trayectoria': 'trayectoria',
    '/dashboard/aprendizaje': 'aprendizaje',
    '/dashboard/metodologia': 'metodologia',
    '/dashboard/mentorias': 'mentorias',
    '/dashboard/networking': 'networking',
    '/dashboard/convocatorias': 'convocatorias',
    '/dashboard/mensajes': 'mensajes',
    '/dashboard/workshops': 'workshops',
    '/dashboard/perfil': 'perfil',
    '/dashboard/lideres': 'lideres',
    '/dashboard/formacion-mentores': 'formacion_mentores',
    '/dashboard/gestion-formacion-mentores': 'gestion_formacion_mentores',
    '/dashboard/usuarios': 'usuarios',
    '/dashboard/contenido': 'contenido',
    '/dashboard/analitica': 'analitica',
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
    const moduleCode = MODULE_BY_PATH[pathname];
    const canViewRoute = moduleCode ? can(moduleCode, 'view') : true;

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
