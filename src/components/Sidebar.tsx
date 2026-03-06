'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import { useBranding } from '@/context/BrandingContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  Map,
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
  Palette,
  PlugZap,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';
import { getOnColorText, rgbaFromHex } from '@/lib/color-contrast';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  moduleCode: ModuleCode;
  label: string;
  icon: LucideIcon;
  path: string;
  requiredAction?: PermissionAction;
  adminOnly?: boolean;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { moduleCode: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { moduleCode: 'trayectoria', label: 'Trayectoria', icon: Map, path: '/dashboard/trayectoria' },
  { moduleCode: 'aprendizaje', label: 'Aprendizaje', icon: BookOpen, path: '/dashboard/aprendizaje' },
  { moduleCode: 'metodologia', label: 'Metodología', icon: Book, path: '/dashboard/metodologia' },
  { moduleCode: 'mentorias', label: 'Mentorías', icon: Video, path: '/dashboard/mentorias' },
  { moduleCode: 'networking', label: 'Networking', icon: Users, path: '/dashboard/networking' },
  { moduleCode: 'convocatorias', label: 'Convocatorias', icon: Briefcase, path: '/dashboard/convocatorias' },
  { moduleCode: 'mensajes', label: 'Mensajes', icon: MessageSquare, path: '/dashboard/mensajes' },
  { moduleCode: 'workshops', label: 'Workshops', icon: Presentation, path: '/dashboard/workshops' },
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
  { moduleCode: 'contenido', label: 'Contenidos', icon: Box, path: '/dashboard/contenido' },
  { moduleCode: 'analitica', label: 'Analítica', icon: PieChart, path: '/dashboard/analitica' },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    moduleCode: 'usuarios',
    label: 'Panel Administración',
    icon: ShieldCheck,
    path: '/dashboard/administracion',
    requiredAction: 'manage',
    adminOnly: true,
  },
  {
    moduleCode: 'usuarios',
    label: 'Gestión Usuarios',
    icon: Settings,
    path: '/dashboard/usuarios',
    adminOnly: true,
  },
  {
    moduleCode: 'usuarios',
    label: 'Branding y Marca',
    icon: Palette,
    path: '/dashboard/administracion/branding',
    requiredAction: 'manage',
    adminOnly: true,
  },
  {
    moduleCode: 'usuarios',
    label: 'Integraciones',
    icon: PlugZap,
    path: '/dashboard/administracion/integraciones',
    requiredAction: 'manage',
    adminOnly: true,
  },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currentUser, currentRole, can, logout } = useUser();
  const { branding, tokens } = useBranding();
  const { confirm } = useAppDialog();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!currentUser || !currentRole) return null;

  const hasAccess = (item: NavItem) => {
    if (item.adminOnly && currentRole !== 'admin') return false;
    return can(item.moduleCode, item.requiredAction ?? 'view');
  };

  const mainNavItems = MAIN_NAV_ITEMS.filter(hasAccess);
  const adminNavItems = ADMIN_NAV_ITEMS.filter(hasAccess);
  const allVisibleNavItems = [...mainNavItems, ...adminNavItems];
  const activeNavPath =
    allVisibleNavItems
      .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0]?.path ?? null;
  const isProfileActive = pathname === '/dashboard/perfil' || pathname.startsWith('/dashboard/perfil/');
  const onPrimaryText = getOnColorText(tokens.colors.primary);
  const isLightPrimary = onPrimaryText === '#0f172a';
  const mutedText = isLightPrimary ? rgbaFromHex('#0f172a', 0.72) : rgbaFromHex('#ffffff', 0.76);
  const subtleText = isLightPrimary ? rgbaFromHex('#0f172a', 0.56) : rgbaFromHex('#ffffff', 0.58);
  const borderColor = isLightPrimary ? rgbaFromHex('#0f172a', 0.18) : rgbaFromHex('#ffffff', 0.16);
  const activeBg = isLightPrimary ? rgbaFromHex('#0f172a', 0.14) : rgbaFromHex('#ffffff', 0.18);
  const controlBg = isLightPrimary ? rgbaFromHex('#0f172a', 0.12) : rgbaFromHex('#ffffff', 0.14);

  const onLogoutClick = async () => {
    const approved = await confirm({
      title: '¿Cerrar sesión?',
      message: '¿Estás seguro que deseas salir de la plataforma?',
      tone: 'warning',
      confirmText: 'Sí, salir',
      cancelText: 'Cancelar',
    });

    if (!approved) return;
    await logout();
  };

  const navItem = (item: NavItem) => {
    const isActive = item.path === activeNavPath;
    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={onClose}
        className={clsx(
          'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 font-medium text-sm group relative',
          isActive ? 'shadow-md border-l-4' : '',
          isLightPrimary ? 'hover:bg-black/10' : 'hover:bg-white/10',
          isCollapsed && 'justify-center px-0',
        )}
        style={{
          color: isActive ? onPrimaryText : mutedText,
          borderLeftColor: isActive ? tokens.colors.accent : 'transparent',
          backgroundColor: isActive ? activeBg : 'transparent',
        }}
        title={isCollapsed ? item.label : undefined}
      >
        <div className={clsx('transition-all duration-200', isCollapsed ? 'scale-110' : '')}>
          {React.createElement(item.icon, { size: 20 })}
        </div>
        {!isCollapsed && <span className="truncate">{item.label}</span>}

        {isCollapsed && (
          <div
            className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
            style={{
              backgroundColor: onPrimaryText,
              color: isLightPrimary ? '#ffffff' : '#0f172a',
            }}
          >
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
          'fixed inset-y-0 left-0 z-30 flex flex-col shadow-2xl transition-all duration-300 md:static border-r overflow-x-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-20' : 'w-72',
        )}
        style={{
          backgroundColor: tokens.colors.primary,
          borderColor,
          color: mutedText,
        }}
      >
        <div
          className={clsx(
            'p-6 flex items-center border-b',
            isCollapsed ? 'justify-center' : 'justify-between',
          )}
          style={{ borderColor }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt={branding.platformName} className="w-8 h-8 rounded object-cover" />
              ) : (
                <Gem className="w-8 h-8 animate-pulse-slow" style={{ color: tokens.colors.accent }} />
              )}
              <span className="font-bold text-xl tracking-wide font-sans truncate max-w-40" style={{ color: onPrimaryText }}>
                {branding.platformName}
              </span>
            </div>
          )}
          {isCollapsed && (
            branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt={branding.platformName} className="w-8 h-8 rounded object-cover" />
            ) : (
              <Gem className="w-8 h-8" style={{ color: tokens.colors.accent }} />
            )
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg transition-colors absolute -right-3 top-7 border shadow-sm z-50"
            style={{
              backgroundColor: controlBg,
              color: mutedText,
              borderColor,
            }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button onClick={onClose} className="md:hidden p-2 transition-colors" style={{ color: mutedText }}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {mainNavItems.length > 0 ? (
            mainNavItems.map(navItem)
          ) : (
            <p className="text-xs px-2 py-3" style={{ color: subtleText }}>
              No tienes módulos habilitados.
            </p>
          )}

          {adminNavItems.length > 0 && (
            <>
              {!isCollapsed && (
                <div className="pt-4 pb-2 px-2">
                  <p
                    className="text-[10px] uppercase tracking-[0.16em] font-semibold"
                    style={{ color: subtleText }}
                  >
                    Administración
                  </p>
                </div>
              )}
              <div className="space-y-1">{adminNavItems.map(navItem)}</div>
            </>
          )}
        </nav>

        <div className="p-4 border-t" style={{ borderColor }}>
          <Link
            href="/dashboard/perfil"
            onClick={onClose}
            className={clsx(
              'flex items-center gap-3 mb-4 p-2 rounded-lg transition cursor-pointer',
              isLightPrimary ? 'hover:bg-black/10' : 'hover:bg-white/10',
              isProfileActive && 'border-l-4 shadow-md',
            )}
            style={{
              borderLeftColor: isProfileActive ? tokens.colors.accent : 'transparent',
              backgroundColor: isProfileActive ? activeBg : 'transparent',
            }}
            title={isCollapsed ? 'Mi perfil' : undefined}
          >
            <div
              className={`w-10 h-10 rounded-full ${currentUser.color} border-2 flex items-center justify-center text-white font-bold text-lg shadow-lg`}
              style={{ borderColor }}
            >
              {currentUser.avatar}
            </div>
            <div className={clsx('overflow-hidden transition-all duration-300', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
              <p className="text-sm font-semibold truncate" style={{ color: onPrimaryText }}>
                {currentUser.name}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: tokens.colors.accent }}>{currentUser.role}</p>
            </div>
          </Link>
          <button
            onClick={() => void onLogoutClick()}
            className={clsx(
              'flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg transition text-sm font-medium border',
              isLightPrimary ? 'hover:bg-black/10' : 'hover:bg-white/10',
              isCollapsed && 'px-0',
            )}
            style={{
              color: mutedText,
              borderColor,
              backgroundColor: controlBg,
            }}
          >
            <LogOut size={16} /> {!isCollapsed && 'Salir'}
          </button>
        </div>
      </aside>
    </>
  );
}
