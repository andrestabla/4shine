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
  Globe,
  CreditCard,
  Lock,
  PowerOff,
} from "lucide-react";
import type { ViewerAccessState } from "@/features/access/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ModuleCode, PermissionAction } from "@/lib/permissions";
import { anchorKeyForPath } from "@/features/tour/catalog";
import { moduleKeysForPath } from "@/features/modulos/catalog";
import { useModuleVisibility } from "@/context/ModuleVisibilityContext";
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
  /** Si se define, el ítem solo se muestra para estos roles. */
  roles?: string[];
}

// Módulos que el rol permite ver pero que muestran "muro" (ModuleLockedScreen)
// si el plan no los incluye. Se marcan con un candado en el menú para evitar el
// clic-sorpresa (auditoría UX B1).
const PLAN_LOCKED_MODULES: Partial<Record<ModuleCode, (a: ViewerAccessState) => boolean>> = {
  trayectoria: (a) => !a.canAccessTrayectoria,
  networking: (a) => !a.canAccessNetworking,
  convocatorias: (a) => !a.canAccessConvocatorias,
  mensajes: (a) => !a.canAccessMensajes,
  workshops: (a) => !a.canAccessWorkshops,
};

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
    label: "Formación Advisors",
    icon: Book,
    path: "/dashboard/formacion-mentores",
  },
  {
    moduleCode: "gestion_formacion_mentores",
    label: "Gestión Formación Advisors",
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
  {
    // Conversión interna, visible para quienes pueden suscribirse (auditoría UX B3).
    moduleCode: "dashboard",
    label: "Suscripción",
    icon: CreditCard,
    path: "/dashboard/suscripcion",
    roles: ["lider", "invitado"],
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
  {
    moduleCode: "usuarios",
    label: "Site",
    icon: Globe,
    path: "/dashboard/administracion/site",
    requiredAction: "manage",
    adminOnly: true,
  },
  {
    moduleCode: "usuarios",
    label: "Planes y Precios",
    icon: CreditCard,
    path: "/dashboard/administracion/planes",
    requiredAction: "manage",
    adminOnly: true,
  },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currentUser, currentRole, can, logout, viewerAccess } = useUser();
  const { branding, tokens } = useBranding();
  const { confirm } = useAppDialog();
  const { isModuleEnabled } = useModuleVisibility();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const sidebarLogoUrl =
    branding.logoDarkUrl?.trim() || branding.logoUrl?.trim() || "";
  const showPlatformName = branding.showPlatformName !== false;

  if (!currentUser || !currentRole) return null;

  const hasAccess = (item: NavItem) => {
    if (item.adminOnly && currentRole !== "admin") return false;
    if (item.roles && currentRole && !item.roles.includes(currentRole)) return false;
    // Módulo apagado en /administracion/modulos: desaparece del menú para
    // todos menos el admin, que lo conserva marcado (ver isModuleOff).
    if (currentRole !== "admin" && isNavItemModuleOff(item)) return false;
    return can(item.moduleCode, item.requiredAction ?? "view");
  };

  /** Solo aplica a ítems cuyo path coincide con un módulo del catálogo. */
  const isNavItemModuleOff = (item: NavItem) =>
    moduleKeysForPath(item.path).some((key) => !isModuleEnabled(key));

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
  const shellGradient = `linear-gradient(180deg, ${tokens.colors.primary} 0%, color-mix(in srgb, ${tokens.colors.primary} 86%, black 14%) 100%)`;

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
    const locked = Boolean(viewerAccess && PLAN_LOCKED_MODULES[item.moduleCode]?.(viewerAccess));
    // Solo el admin llega aquí con un módulo apagado (hasAccess filtra al resto).
    const moduleOff = isNavItemModuleOff(item);
    return (
      <Link
        key={item.path}
        href={item.path}
        data-tour={anchorKeyForPath(item.path)}
        onClick={onClose}
        className={clsx(
          "group relative flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm font-semibold transition-all duration-200",
          isActive
            ? "shadow-[0_10px_24px_rgba(32,17,41,0.14)]"
            : isLightPrimary
              ? "hover:bg-black/10"
              : "hover:bg-white/10",
          (locked || moduleOff) && !isActive && "opacity-70",
          isCollapsed && "justify-center px-0",
        )}
        style={{
          color: isActive ? "#4f2360" : mutedText,
          backgroundColor: isActive ? activeBg : "transparent",
        }}
        title={
          isCollapsed
            ? moduleOff
              ? `${item.label} · apagado para los usuarios`
              : locked
                ? `${item.label} · requiere plan`
                : item.label
            : undefined
        }
      >
        <div
          className={clsx(
            "transition-all duration-200",
            isCollapsed ? "scale-110" : "",
          )}
        >
          {React.createElement(item.icon, { size: 20 })}
        </div>
        {!isCollapsed && (
          <span className="flex flex-1 items-center gap-2 truncate">
            <span className="truncate">{item.label}</span>
            {moduleOff ? (
              <PowerOff
                size={13}
                className="ml-auto shrink-0 opacity-70"
                aria-label="Apagado para los usuarios"
              />
            ) : locked ? (
              <Lock size={13} className="ml-auto shrink-0 opacity-60" aria-label="Requiere plan" />
            ) : null}
          </span>
        )}

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
        data-dashboard-sidebar
        className={clsx(
          // h-[100dvh] usa el dynamic viewport height (importante en mobile Safari/Chrome
          // donde 100vh incluye la barra del navegador y empuja el footer fuera de pantalla).
          "fixed inset-y-0 left-0 z-30 flex h-[100dvh] flex-col overflow-x-hidden border-r shadow-[0_18px_40px_rgba(31,16,41,0.18)] transition-all duration-300 md:static md:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-20" : "w-[17.75rem]",
        )}
        style={{
          background: shellGradient,
          borderColor,
          color: mutedText,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div
          className={clsx(
            "flex border-b",
            isCollapsed
              ? "flex-col items-center gap-4 p-4"
              : "items-center justify-between p-6",
          )}
          style={{ borderColor }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              {sidebarLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sidebarLogoUrl}
                  alt={branding.platformName}
                  className="h-10 w-auto max-w-[8rem] object-contain"
                />
              ) : (
                <Gem
                  className="h-8 w-8"
                  style={{ color: tokens.colors.accent }}
                />
              )}
              {showPlatformName && (
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
              )}
            </div>
          )}
          {isCollapsed &&
            (sidebarLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sidebarLogoUrl}
                alt={branding.platformName}
                className="h-10 w-auto max-w-[3.5rem] object-contain"
              />
            ) : (
              <Gem
                className="h-8 w-8"
                style={{ color: tokens.colors.accent }}
              />
            ))}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border transition hover:bg-white/10 md:flex"
            style={{ borderColor, color: onPrimaryText }}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
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

        <nav className="flex-1 min-h-0 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain p-4 [-webkit-overflow-scrolling:touch]">
          {mainNavItems.length > 0 ? (
            <div className="space-y-1">{mainNavItems.map(navItem)}</div>
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

        <div className="shrink-0 border-t p-4" style={{ borderColor, background: shellGradient }}>
          <Link
            href="/dashboard/perfil"
            onClick={onClose}
            className={clsx(
              "mb-4 flex cursor-pointer items-center gap-3 rounded-[1.05rem] border p-3 transition",
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
                style={{ color: isProfileActive ? "#4f2360" : onPrimaryText }}
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
              "flex w-full items-center justify-center gap-2 rounded-[1rem] border px-4 py-3 text-sm font-semibold transition",
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
