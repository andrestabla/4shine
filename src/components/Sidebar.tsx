'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import {
    ChartLine, Map, User, Video, Users, Calendar, PenTool,
    Settings, Box, PieChart, Briefcase, LogOut, Gem, LayoutDashboard,
    BookOpen, MessageSquare, Book, FileText, Presentation,
    LucideIcon, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import clsx from 'clsx';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { currentUser, currentRole, logout } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentView = searchParams.get('view') || 'dashboard';

    const [showExitModal, setShowExitModal] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    if (!currentUser || !currentRole) return null;

    const navItem = (label: string, icon: LucideIcon, view: string) => {
        const isActive = currentView === view;
        return (
            <button
                onClick={() => {
                    router.push(`/dashboard?view=${view}`);
                    if (onClose) onClose();
                }}
                className={clsx(
                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 font-medium text-sm group relative",
                    isActive
                        ? "bg-slate-800 text-white shadow-md border-l-4 border-amber-500"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                    isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? label : undefined}
            >
                <div className={clsx("transition-all duration-200", isCollapsed ? "scale-110" : "")}>
                    {React.createElement(icon, { size: 20 })}
                </div>
                {!isCollapsed && <span className="truncate">{label}</span>}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {label}
                    </div>
                )}
            </button>
        );
    };

    return (
        <>
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-30 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300 md:static border-r border-slate-800",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                isCollapsed ? "w-20" : "w-72"
            )}>
                <div className={clsx("p-6 flex items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3">
                            <Gem className="w-8 h-8 text-amber-500 animate-pulse-slow" />
                            <span className="font-bold text-white text-xl tracking-wide font-sans">4Shine</span>
                        </div>
                    )}
                    {isCollapsed && <Gem className="w-8 h-8 text-amber-500" />}

                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors absolute -right-3 top-7 border border-slate-700 shadow-sm z-50"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="mb-6">
                        {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 animate-fade-in">Principal</p>}
                        {navItem("Dashboard", LayoutDashboard, "dashboard")}
                    </div>

                    {currentRole === 'lider' && (
                        <div className="mb-6">
                            {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 animate-fade-in">Mi Crecimiento</p>}
                            {navItem("Mi Trayectoria", Map, "trayectoria")}
                            {navItem("Aprendizaje", BookOpen, "aprendizaje")}

                            {navItem("Mi Perfil", User, "perfil")}
                            {navItem("Mis Mentorías", Video, "mentorias")}
                            {navItem("Mensajes", MessageSquare, "mensajes")}
                        </div>
                    )}

                    {currentRole === 'mentor' && (
                        <div className="mb-6">
                            {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 animate-fade-in">Gestión de Talento</p>}
                            {navItem("Formación Mentores", Book, "formacion-mentores")}
                            {navItem("Mis Lideres", Users, "lideres")}
                            {navItem("Mentorías", Calendar, "mentorias")}
                            {navItem("Aprendizaje", BookOpen, "aprendizaje")}
                            {navItem("Mi Perfil", User, "perfil")}
                        </div>
                    )}

                    {currentRole === 'gestor' && (
                        <div className="mb-6">
                            {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 animate-fade-in">Administración de Programa</p>}
                            {navItem("Trayectorias Globales", Map, "trayectoria")}
                            {navItem("Metodología", Book, "metodologia")}
                            {navItem("Gestión del Aprendizaje", BookOpen, "aprendizaje")}

                            {navItem("Gestión Mentorías", Video, "mentorias")}
                            {navItem("Moderar Networking", Users, "networking")}
                            {navItem("Gestión Convocatorias", Briefcase, "convocatorias")}
                            {navItem("Formación Mentores", Book, "gestion-formacion-mentores")}
                            {navItem("Mi Perfil", User, "perfil")}
                        </div>
                    )}

                    {currentRole === 'admin' && (
                        <div className="mb-6">
                            {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 animate-fade-in">Administración</p>}
                            {navItem("Gestión Usuarios", Settings, "usuarios")}
                            {navItem("Contenidos", Box, "contenido")}
                            {navItem("Analítica", PieChart, "analitica")}
                        </div>
                    )}

                    <div className="pt-4 mt-2 border-t border-slate-800">
                        {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 animate-fade-in">Comunidad</p>}
                        {navItem("Networking", Users, "networking")}
                        {navItem("Convocatorias", Briefcase, "convocatorias")}
                        {navItem("Workshops", Presentation, "workshops")}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer">
                        <div className={`w-10 h-10 rounded-full ${currentUser.color} border-2 border-slate-600 flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                            {currentUser.avatar}
                        </div>
                        <div className={clsx("overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">{currentUser.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowExitModal(true)}
                        className={clsx(
                            "flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-sm font-medium border border-transparent hover:border-red-500/20",
                            isCollapsed && "px-0"
                        )}
                    >
                        <LogOut size={16} /> {!isCollapsed && "Salir"}
                    </button>
                </div>
            </aside>

            {/* Logout Modal */}
            {showExitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Cerrar Sesión?</h3>
                            <p className="text-slate-500 text-sm">¿Estás seguro que deseas salir de la plataforma?</p>
                        </div>
                        <div className="flex border-t border-slate-100">
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setShowExitModal(false);
                                    logout();
                                }}
                                className="flex-1 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-l border-slate-100"
                            >
                                Sí, Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
