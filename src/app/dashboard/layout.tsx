'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser } = useUser();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Redirigir si no hay usuario (protección básica de ruta)
        if (!currentUser) {
            router.push('/');
        }
    }, [currentUser, router]);

    if (!currentUser) return null; // o un Loading spinner

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
