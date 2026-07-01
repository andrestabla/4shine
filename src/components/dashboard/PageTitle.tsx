"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

// Etiquetas legibles por segmento de ruta para los breadcrumbs del admin (B7).
const SEGMENT_LABELS: Record<string, string> = {
  administracion: "Administración",
  usuarios: "Usuarios",
  branding: "Branding",
  integraciones: "Integraciones",
  site: "Site",
  planes: "Planes",
  pagos: "Pagos",
  notificaciones: "Notificaciones",
  plantillas: "Plantillas",
  eventos: "Eventos",
  enviar: "Enviar",
  historial: "Historial",
  popups: "Popups",
  "recordatorios-grupales": "Recordatorios",
  "asistente-ia": "Asistente IA",
  tour: "Tour",
  politicas: "Políticas",
  documentacion: "Documentación",
  nueva: "Nueva",
  nuevo: "Nuevo",
};

interface Crumb {
  label: string;
  href: string;
  isLast: boolean;
}

// Construye la miga de pan solo para secciones administrativas. Raíz en
// "Administración". Los segmentos no reconocidos (ids) se muestran como "Detalle".
function buildAdminBreadcrumbs(pathname: string): Crumb[] | null {
  const isAdmin =
    pathname.startsWith("/dashboard/administracion") || pathname.startsWith("/dashboard/usuarios");
  if (!isAdmin) return null;

  const segments = pathname.replace(/^\/dashboard\//, "").split("/").filter(Boolean);
  const crumbs: Crumb[] = [
    { label: "Administración", href: "/dashboard/administracion", isLast: false },
  ];

  let href = "/dashboard";
  for (const seg of segments) {
    href += `/${seg}`;
    if (seg === "administracion") continue; // ya está como raíz
    const label = SEGMENT_LABELS[seg] ?? "Detalle";
    crumbs.push({ label, href, isLast: false });
  }
  if (crumbs.length <= 1) return null; // en el hub, no hace falta miga
  crumbs[crumbs.length - 1].isLast = true;
  return crumbs;
}

export function PageTitle({
  title: _title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const crumbs = buildAdminBreadcrumbs(pathname);

  return (
    <div className="mb-4">
      {crumbs && (
        <nav aria-label="Ruta" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-[var(--app-muted)]">
          {crumbs.map((c) => (
            <React.Fragment key={c.href}>
              {c.isLast ? (
                <span className="font-semibold text-[var(--app-ink)]">{c.label}</span>
              ) : (
                <Link href={c.href} className="transition hover:text-[var(--app-ink)]">
                  {c.label}
                </Link>
              )}
              {!c.isLast && <ChevronRight size={12} className="opacity-50" />}
            </React.Fragment>
          ))}
        </nav>
      )}
      {subtitle && (
        <p className="max-w-3xl text-sm leading-[1.6] text-[var(--app-muted)] md:text-[0.95rem]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
