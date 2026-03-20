"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { useBranding } from "@/context/BrandingContext";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
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
  Compass,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ModuleCode, PermissionAction } from "@/lib/permissions";
import { getOnColorText, rgbaFromHex } from "@/lib/color-contrast";

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
  {
    moduleCode: "dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    moduleCode: "trayectoria",
    label: "Trayectoria",
    icon: Map,
    path: "/dashboard/trayectoria",
  },
  {
    moduleCode: "descubrimiento",
    label: "Descubrimiento",
    icon: Compass,
    path: "/dashboard/descubrimiento",
  },
  {
    moduleCode: "aprendizaje",
    label: "Aprendizaje",
    icon: BookOpen,
    path: "/dashboard/aprendizaje",
  },
  {
    moduleCode: "metodologia",
    label: "Metodología",
    icon: Book,
    path: "/dashboard/metodologia",
  },
  {
    moduleCode: "mentorias",
    label: "Mentorías",
    icon: Video,
    path: "/dashboard/mentorias",
  },
  {
    moduleCode: "networking",
    label: "Networking",
    icon: Users,
    path: "/dashboard/networking",
  },
  {
    moduleCode: "convocatorias",
    label: "Convocatorias",
    icon: Briefcase,
    path: "/dashboard/convocatorias",
  },
  {
    moduleCode: "mensajes",
    label: "Mensajes",
    icon: MessageSquare,
    path: "/dashboard/mensajes",
  },
  {
    moduleCode: "workshops",
    label: "Workshops",
    icon: Presentation,
    path: "/dashboard/workshops",
  },
  {
    moduleCode: "lideres",
    label: "Líderes",
    icon: Users,
    path: "/dashboard/lideres",
  },
  {
    moduleCode: "formacion_mentores",
    label: "Formación iShiners",
    icon: Book,
    path: "/dashboard/formacion-mentores",
  },
  {
    moduleCode: "gestion_formacion_mentores",
    label: "Gestión Formación iShiners",
    icon: Book,
    path: "/dashboard/gestion-formacion-mentores",
  },
  {
    moduleCode: "contenido",
    label: "Contenidos",
    icon: Box,
    path: "/dashboard/contenido",
  },
  {
    moduleCode: "analitica",
    label: "Analítica",
    icon: PieChart,
    path: "/dashboard/analitica",
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    moduleCode: "usuarios",
    label: "Panel Administración",
    icon: ShieldCheck,
    path: "/dashboard/administracion",
    requiredAction: "manage",
    adminOnly: true,
  },
  {
    moduleCode: "usuarios",
    label: "Gestión Usuarios",
    icon: Settings,
    path: "/dashboard/usuarios",
    adminOnly: true,
  },
  {
    moduleCode: "usuarios",
    label: "Branding y Marca",
    icon: Palette,
    path: "/dashboard/administracion/branding",
    requiredAction: "manage",
    adminOnly: true,
  },
  {
    moduleCode: "usuarios",
    label: "Integraciones",
    icon: PlugZap,
    path: "/dashboard/administracion/integraciones",
    requiredAction: "manage",
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
    if (item.adminOnly && currentRole !== "admin") return false;
    return can(item.moduleCode, item.requiredAction ?? "view");
  };

  const mainNavItems = MAIN_NAV_ITEMS.filter(hasAccess);
  const adminNavItems = ADMIN_NAV_ITEMS.filter(hasAccess);
  const allVisibleNavItems = [...mainNavItems, ...adminNavItems];
  const activeNavPath =
    allVisibleNavItems
      .filter(
        (item) =>
          pathname === item.path || pathname.startsWith(`${item.path}/`),
      )
      .sort((a, b) => b.path.length - a.path.length)[0]?.path ?? null;
  const isProfileActive =
    pathname === "/dashboard/perfil" ||
    pathname.startsWith("/dashboard/perfil/");
  const onPrimaryText = getOnColorText(tokens.colors.primary);
  const isLightPrimary = onPrimaryText === "#0f172a";
  const mutedText = isLightPrimary
    ? rgbaFromHex("#0f172a", 0.8)
    : rgbaFromHex("#ffffff", 0.82);
  const subtleText = isLightPrimary
    ? rgbaFromHex("#0f172a", 0.62)
    : rgbaFromHex("#ffffff", 0.62);
  const borderColor = isLightPrimary
    ? rgbaFromHex("#0f172a", 0.14)
    : rgbaFromHex("#ffffff", 0.14);
  const activeBg = isLightPrimary ? "#ffffff" : "rgba(255,255,255,0.94)";
  const controlBg = isLightPrimary
    ? rgbaFromHex("#0f172a", 0.08)
    : rgbaFromHex("#ffffff", 0.12);
  const panelBg = isLightPrimary
    ? rgbaFromHex("#ffffff", 0.88)
    : rgbaFromHex("#ffffff", 0.12);
  const shellGradient = `linear-gradient(180deg, color-mix(in srgb, ${tokens.colors.primary} 92%, #5f2b72 8%) 0%, color-mix(in srgb, ${tokens.colors.primary} 74%, #2f123b 26%) 100%)`;
  const sidebarHighlights = [
    {
      title: currentRole === "lider" ? "Ruta activa" : "Experiencia guiada",
      text:
        currentRole === "lider"
          ? `${currentUser.stats?.progress ?? 0}% de avance visible en tu programa.`
          : "Acompaña la experiencia con una vista clara, móvil y accionable.",
      icon: BookOpen,
    },
    {
      title: "Soporte cercano",
      text: "Accede rápido a mensajes, mentorías y seguimiento desde cualquier pantalla.",
      icon: MessageSquare,
    },
  ];

  const onLogoutClick = async () => {
    const approved = await confirm({
      title: "¿Cerrar sesión?",
      message: "¿Estás seguro que deseas salir de la plataforma?",
      tone: "warning",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
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
          "group relative flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left text-sm font-semibold transition-all duration-200",
          isActive
            ? "translate-x-1 shadow-[0_14px_28px_rgba(32,17,41,0.18)]"
            : isLightPrimary
              ? "hover:bg-black/10"
              : "hover:bg-white/10",
          isCollapsed && "justify-center px-0",
        )}
        style={{
          color: isActive ? "#4f2360" : mutedText,
          backgroundColor: isActive ? activeBg : "transparent",
        }}
        title={isCollapsed ? item.label : undefined}
      >
        <div
          className={clsx(
            "transition-all duration-200",
            isCollapsed ? "scale-110" : "",
          )}
        >
          {React.createElement(item.icon, { size: 20 })}
        </div>
        {!isCollapsed && <span className="truncate">{item.label}</span>}

        {isCollapsed && (
          <div
            className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50"
            style={{
              backgroundColor: onPrimaryText,
              color: isLightPrimary ? "#ffffff" : "#0f172a",
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
          "fixed inset-y-0 left-0 z-30 flex h-screen flex-col overflow-x-hidden border-r shadow-2xl transition-all duration-300 md:static md:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-20" : "w-[18.5rem]",
        )}
        style={{
          background: shellGradient,
          borderColor,
          color: mutedText,
        }}
      >
        <div
          className={clsx(
            "flex items-center border-b p-6",
            isCollapsed ? "justify-center" : "justify-between",
          )}
          style={{ borderColor }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoUrl}
                  alt={branding.platformName}
                  className="h-10 w-10 rounded-xl bg-white/10 object-cover p-1"
                />
              ) : (
                <Gem
                  className="h-8 w-8 animate-pulse-slow"
                  style={{ color: tokens.colors.accent }}
                />
              )}
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: subtleText }}
                >
                  Plataforma
                </p>
                <span
                  className="block max-w-40 truncate text-xl font-black tracking-tight"
                  style={{ color: onPrimaryText }}
                >
                  {branding.platformName}
                </span>
              </div>
            </div>
          )}
          {isCollapsed &&
            (branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={branding.platformName}
                className="h-9 w-9 rounded-xl bg-white/10 object-cover p-1"
              />
            ) : (
              <Gem
                className="h-8 w-8"
                style={{ color: tokens.colors.accent }}
              />
            ))}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-7 z-50 hidden rounded-full border bg-white p-1.5 text-[#4f2360] shadow-sm transition-colors md:flex"
            style={{
              borderColor,
            }}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          <button
            onClick={onClose}
            className="rounded-2xl p-2 transition-colors md:hidden"
            style={{ color: mutedText }}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4">
          {mainNavItems.length > 0 ? (
            <div className="space-y-1.5">{mainNavItems.map(navItem)}</div>
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
              <div className="space-y-1.5">{adminNavItems.map(navItem)}</div>
            </>
          )}

          {!isCollapsed && (
            <div className="space-y-3 pt-2">
              {sidebarHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[18px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  style={{
                    backgroundColor: panelBg,
                    borderColor,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="rounded-[14px] bg-white/14 p-2.5"
                      style={{ color: tokens.colors.accent }}
                    >
                      <item.icon size={16} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: onPrimaryText }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: mutedText }}
                      >
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className="border-t p-4" style={{ borderColor }}>
          <Link
            href="/dashboard/perfil"
            onClick={onClose}
            className={clsx(
              "mb-4 flex cursor-pointer items-center gap-3 rounded-[18px] border p-3 transition",
              isLightPrimary ? "hover:bg-black/10" : "hover:bg-white/10",
              isCollapsed && "justify-center gap-0",
            )}
            style={{
              borderColor: isProfileActive
                ? rgbaFromHex("#ffffff", 0.28)
                : borderColor,
              backgroundColor: isProfileActive ? activeBg : "transparent",
            }}
            title={isCollapsed ? "Mi perfil" : undefined}
          >
            <div
              className={`relative flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ${currentUser.color} border-2 text-lg font-bold text-white shadow-lg`}
              style={{ borderColor }}
            >
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                currentUser.avatar
              )}
            </div>
            <div
              className={clsx(
                "overflow-hidden transition-all duration-300",
                isCollapsed ? "hidden" : "w-auto opacity-100",
              )}
            >
              <p
                className="truncate text-sm font-semibold"
                style={{ color: onPrimaryText }}
              >
                {currentUser.name}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: tokens.colors.accent }}
              >
                {currentUser.role}
              </p>
            </div>
          </Link>
          <button
            onClick={() => void onLogoutClick()}
            className={clsx(
              "flex w-full items-center justify-center gap-2 rounded-[16px] border px-4 py-3 text-sm font-semibold transition",
              isLightPrimary ? "hover:bg-black/10" : "hover:bg-white/10",
              isCollapsed && "px-0",
            )}
            style={{
              color: mutedText,
              borderColor,
              backgroundColor: controlBg,
            }}
          >
            <LogOut size={16} /> {!isCollapsed && "Salir"}
          </button>
        </div>
      </aside>
    </>
  );
}
