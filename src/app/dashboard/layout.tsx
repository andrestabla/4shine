"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useUser } from "@/context/UserContext";
import { useBranding } from "@/context/BrandingContext";
import type { ModuleCode, PermissionAction } from "@/lib/permissions";
import { trackAuditEvent } from "@/lib/audit-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { SupportBubble } from "@/components/SupportBubble";


interface RouteAccess {
  moduleCode: ModuleCode;
  action?: PermissionAction;
}

const ACCESS_BY_PATH: Record<string, RouteAccess> = {
  "/dashboard": { moduleCode: "dashboard" },
  "/dashboard/trayectoria": { moduleCode: "trayectoria" },
  "/dashboard/descubrimiento": { moduleCode: "descubrimiento" },
  "/dashboard/aprendizaje": { moduleCode: "aprendizaje" },
  "/dashboard/metodologia": { moduleCode: "metodologia" },
  "/dashboard/mentorias": { moduleCode: "mentorias" },
  "/dashboard/networking": { moduleCode: "networking" },
  "/dashboard/convocatorias": { moduleCode: "convocatorias" },
  "/dashboard/mensajes": { moduleCode: "mensajes" },
  "/dashboard/workshops": { moduleCode: "workshops" },
  "/dashboard/perfil": { moduleCode: "perfil" },
  "/dashboard/lideres": { moduleCode: "lideres" },
  "/dashboard/formacion-mentores": { moduleCode: "formacion_mentores" },
  "/dashboard/gestion-formacion-mentores": {
    moduleCode: "gestion_formacion_mentores",
  },
  "/dashboard/usuarios": { moduleCode: "usuarios", action: "view" },
  "/dashboard/administracion": { moduleCode: "usuarios", action: "manage" },
  "/dashboard/administracion/branding": {
    moduleCode: "usuarios",
    action: "manage",
  },
  "/dashboard/administracion/integraciones": {
    moduleCode: "usuarios",
    action: "manage",
  },
  "/dashboard/contenido": { moduleCode: "contenido" },
  "/dashboard/analitica": { moduleCode: "analitica" },
};

function resolveRouteAccess(pathname: string): RouteAccess | undefined {
  if (ACCESS_BY_PATH[pathname]) {
    return ACCESS_BY_PATH[pathname];
  }

  if (
    pathname.startsWith("/dashboard/aprendizaje/workbooks-v2") ||
    pathname.startsWith("/dashboard/aprendizaje/workbooks/")
  ) {
    return { moduleCode: "aprendizaje" };
  }

  if (pathname.startsWith("/dashboard/usuarios/")) {
    return { moduleCode: "usuarios", action: "view" };
  }

  return undefined;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isHydrating, isAuthenticated, can } = useUser();
  const { tokens } = useBranding();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const didTrackLoad = useRef(false);
  const routeAccess = resolveRouteAccess(pathname);
  const canViewRoute = routeAccess
    ? can(routeAccess.moduleCode, routeAccess.action ?? "view")
    : true;

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      router.push("/");
    }
  }, [isHydrating, isAuthenticated, router]);

  useEffect(() => {
    if (!isHydrating && isAuthenticated && !canViewRoute) {
      router.push(can("dashboard", "view") ? "/dashboard" : "/");
    }
  }, [can, canViewRoute, isAuthenticated, isHydrating, router]);

  useEffect(() => {
    if (isHydrating || !isAuthenticated || !canViewRoute) return;

    trackAuditEvent({
      action: "ui_page_view",
      moduleCode: routeAccess?.moduleCode ?? "dashboard",
      entityTable: "ui.navigation",
      metadata: {
        path: pathname,
      },
    });
  }, [
    canViewRoute,
    isAuthenticated,
    isHydrating,
    pathname,
    routeAccess?.moduleCode,
  ]);

  useEffect(() => {
    if (didTrackLoad.current) return;
    if (isHydrating || !isAuthenticated) return;

    didTrackLoad.current = true;
    trackAuditEvent({
      action: "ui_dashboard_load",
      moduleCode: "dashboard",
      entityTable: "ui.session",
      metadata: {
        path: pathname,
      },
    });
  }, [isAuthenticated, isHydrating, pathname]);

  if (isHydrating) {
    const loaderText = tokens.text.loaderText?.trim() ?? "";
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-6">
        <div className="text-center">
          {tokens.assets.loaderAssetUrl.trim().length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tokens.assets.loaderAssetUrl}
                alt={loaderText || "Cargando"}
                className="mx-auto h-14 w-auto"
              />
            </>
          ) : (
            <Loader2
              size={42}
              className="mx-auto animate-spin"
              style={{ color: tokens.colors.accent }}
            />
          )}

          {tokens.text.visibility.loaderText && loaderText.length > 0 && (
            <p className="mt-3 text-sm text-[var(--app-muted)]">{loaderText}</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) return null;
  if (!canViewRoute) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)]">
      {/* Mobile Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-20 bg-[rgba(49,31,68,0.38)] md:hidden transition-opacity duration-300",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative flex w-full flex-1 flex-col overflow-y-auto bg-transparent">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div
          className="relative z-10 mx-auto min-h-full w-full animate-fade-in px-4 pb-20 pt-5 md:px-8 md:pt-8"
          style={{ maxWidth: tokens.layout.pageMaxWidth }}
        >
          {children}
        </div>
      </main>
      <SupportBubble />
    </div>
  );
}

