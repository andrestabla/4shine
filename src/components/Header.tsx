"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useBranding } from "@/context/BrandingContext";
import {
  Bell,
  Search,
  Menu,
  Check,
  Info,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import type { Notification } from "@/server/bootstrap/types";

const PATH_TITLES: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/trayectoria": "Trayectoria",
  "/dashboard/descubrimiento": "Descubrimiento",
  "/dashboard/aprendizaje": "Aprendizaje",
  "/dashboard/metodologia": "Metodología",
  "/dashboard/mentorias": "Mentorías",
  "/dashboard/networking": "Networking",
  "/dashboard/convocatorias": "Convocatorias",
  "/dashboard/mensajes": "Mensajes",
  "/dashboard/workshops": "Workshops",
  "/dashboard/perfil": "Perfil",
  "/dashboard/lideres": "Líderes",
  "/dashboard/formacion-mentores": "Formación iShiners",
  "/dashboard/gestion-formacion-mentores": "Gestión Formación iShiners",
  "/dashboard/usuarios": "Gestión Usuarios",
  "/dashboard/administracion": "Administración",
  "/dashboard/administracion/branding": "Branding y Marca",
  "/dashboard/administracion/integraciones": "Integraciones",
  "/dashboard/contenido": "Gestión Contenido",
  "/dashboard/analitica": "Analítica",
};

function resolvePageTitle(pathname: string): string {
  const exactMatch = PATH_TITLES[pathname];
  if (exactMatch) return exactMatch;

  const longestPrefix = Object.entries(PATH_TITLES)
    .filter(([path]) => pathname.startsWith(`${path}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];

  return longestPrefix?.[1] ?? "Dashboard";
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser, bootstrapData } = useUser();
  const { tokens } = useBranding();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();

  React.useEffect(() => {
    setNotifications(bootstrapData?.notifications ?? []);
  }, [bootstrapData]);

  const pageTitle = useMemo(() => {
    return resolvePageTitle(pathname);
  }, [pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare size={16} className="text-blue-500" />;
      case "alert":
        return <AlertCircle size={16} className="text-amber-500" />;
      case "success":
        return <Check size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-[var(--app-muted)]" />;
    }
  };

  return (
    <header
      data-dashboard-header
      className="sticky top-0 z-20 border-b border-[var(--app-border)] bg-[rgba(252,249,255,0.92)] px-4 py-4 md:px-8"
    >
      <div className="mx-auto flex w-full max-w-[var(--brand-page-max-width)] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={onMenuClick}
            className="app-button-secondary min-h-0 rounded-[1rem] p-2 md:hidden"
          >
            <Menu size={24} />
          </button>
          <div className="min-w-0">
            <p className="app-section-kicker hidden md:block">
              4Shine Platform
            </p>
            <h1
              className="app-display-title truncate text-[2rem] font-semibold leading-none md:text-[2.3rem]"
              data-display-font="true"
            >
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden md:flex">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)] transition-colors" />
            <input
              type="text"
              placeholder="Buscar..."
              className="app-input h-12 w-56 pl-11 pr-4 lg:w-72"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[var(--app-border)] bg-white/88 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--app-ink)]"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="app-panel-strong absolute right-0 mt-4 w-[22rem] origin-top-right overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                  <h3 className="text-sm font-bold text-[var(--app-ink)]">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-bold text-[var(--app-ink)] hover:underline"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={clsx(
                          "relative flex gap-3 border-b border-[rgba(91,52,117,0.08)] px-4 py-4 transition hover:bg-white/80",
                          !notif.read ? "bg-[rgba(245,183,209,0.14)]" : "",
                        )}
                      >
                        <div className="mt-1 shrink-0">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <p
                            className={clsx(
                              "text-sm text-[var(--app-ink)]",
                              !notif.read ? "font-bold" : "",
                            )}
                          >
                            {notif.title}
                          </p>
                          <p className="mt-1 text-xs leading-snug text-[var(--app-muted)]">
                            {notif.message}
                          </p>
                          <p className="mt-2 text-[10px] text-[var(--app-muted)]/80">
                            {notif.time}
                          </p>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="absolute right-2 top-2 rounded-[0.75rem] p-1 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)]"
                            title="Marcar como leída"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-[var(--app-muted)]">
                      No tienes notificaciones
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-8 w-px bg-[var(--app-border)] md:block" />

          <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--app-border)] bg-white/92 px-2 py-1.5 sm:px-2.5">
            <div className="hidden text-right md:block">
              <p className="text-sm font-extrabold text-[var(--app-ink)]">
                {currentUser?.name}
              </p>
              <p className="text-xs capitalize text-[var(--app-muted)]">
                {currentUser?.role}
              </p>
            </div>
            <div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-[0_10px_24px_rgba(59,22,73,0.22)]"
              style={{ backgroundColor: tokens.colors.primary }}
            >
              {currentUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                (currentUser?.avatar ?? currentUser?.name.charAt(0) ?? "U")
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
