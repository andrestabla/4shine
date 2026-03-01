'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import {
  Map,
  User,
  Video,
  Users,
  Settings,
  Box,
  PieChart,
  Briefcase,
  LogOut,
  Gem,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Book,
  Presentation,
  LucideIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { ModuleCode } from '@/lib/permissions';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  moduleCode: ModuleCode;
  label: string;
  icon: LucideIcon;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { moduleCode: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { moduleCode: 'trayectoria', label: 'Trayectoria', icon: Map, path: '/dashboard/trayectoria' },
  { moduleCode: 'aprendizaje', label: 'Aprendizaje', icon: BookOpen, path: '/dashboard/aprendizaje' },
  { moduleCode: 'metodologia', label: 'Metodología', icon: Book, path: '/dashboard/metodologia' },
  { moduleCode: 'mentorias', label: 'Mentorías', icon: Video, path: '/dashboard/mentorias' },
  { moduleCode: 'networking', label: 'Networking', icon: Users, path: '/dashboard/networking' },
  { moduleCode: 'convocatorias', label: 'Convocatorias', icon: Briefcase, path: '/dashboard/convocatorias' },
  { moduleCode: 'mensajes', label: 'Mensajes', icon: MessageSquare, path: '/dashboard/mensajes' },
  { moduleCode: 'workshops', label: 'Workshops', icon: Presentation, path: '/dashboard/workshops' },
  { moduleCode: 'perfil', label: 'Perfil', icon: User, path: '/dashboard/perfil' },
  { moduleCode: 'lideres', label: 'Líderes', icon: Users, path: '/dashboard/lideres' },
  {
    moduleCode: 'formacion_mentores',
    label: 'Formación Mentores',
    icon: Book,
    path: '/dashboard/formacion-mentores',
  },
  {
    moduleCode: 'gestion_formacion_mentores',
    label: 'Gestión Formación Mentores',
    icon: Book,
    path: '/dashboard/gestion-formacion-mentores',
  },
  { moduleCode: 'usuarios', label: 'Gestión Usuarios', icon: Settings, path: '/dashboard/usuarios' },
  { moduleCode: 'contenido', label: 'Contenidos', icon: Box, path: '/dashboard/contenido' },
  { moduleCode: 'analitica', label: 'Analítica', icon: PieChart, path: '/dashboard/analitica' },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currentUser, currentRole, can, logout } = useUser();
  const pathname = usePathname();

  const [showExitModal, setShowExitModal] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!currentUser || !currentRole) return null;

  const navItems = NAV_ITEMS.filter((item) => can(item.moduleCode, 'view'));

  const navItem = (item: NavItem) => {
    const isActive = pathname === item.path;
    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={onClose}
        className={clsx(
          'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 font-medium text-sm group relative',
          isActive
            ? 'bg-slate-800 text-white shadow-md border-l-4 border-amber-500'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
          isCollapsed && 'justify-center px-0',
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <div className={clsx('transition-all duration-200', isCollapsed ? 'scale-110' : '')}>
          {React.createElement(item.icon, { size: 20 })}
        </div>
        {!isCollapsed && <span className="truncate">{item.label}</span>}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300 md:static border-r border-slate-800',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-20' : 'w-72',
        )}
      >
        <div
          className={clsx(
            'p-6 flex items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm',
            isCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Gem className="w-8 h-8 text-amber-500 animate-pulse-slow" />
              <span className="font-bold text-white text-xl tracking-wide font-sans">4Shine</span>
            </div>
          )}
          {isCollapsed && <Gem className="w-8 h-8 text-amber-500" />}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors absolute -right-3 top-7 border border-slate-700 shadow-sm z-50"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.length > 0 ? (
            navItems.map(navItem)
          ) : (
            <p className="text-xs text-slate-500 px-2 py-3">No tienes módulos habilitados.</p>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-slate-800/50 transition cursor-pointer">
            <div
              className={`w-10 h-10 rounded-full ${currentUser.color} border-2 border-slate-600 flex items-center justify-center text-white font-bold text-lg shadow-lg`}
            >
              {currentUser.avatar}
            </div>
            <div className={clsx('overflow-hidden transition-all duration-300', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
              <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className={clsx(
              'flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-sm font-medium border border-transparent hover:border-red-500/20',
              isCollapsed && 'px-0',
            )}
          >
            <LogOut size={16} /> {!isCollapsed && 'Salir'}
          </button>
        </div>
      </aside>

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
                onClick={async () => {
                  setShowExitModal(false);
                  await logout();
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
