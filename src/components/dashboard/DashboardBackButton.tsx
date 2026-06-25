"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Registro de rutas reales del dashboard (patrones; [x] = segmento dinámico).
// El botón sube al ancestro REAL más cercano para no enlazar a rutas inexistentes
// (p. ej. /networking/comunidades no es una página → sube a /networking).
const DASHBOARD_ROUTES: string[] = [
  "/dashboard",
  "/dashboard/administracion",
  "/dashboard/administracion/asistente-ia",
  "/dashboard/administracion/branding",
  "/dashboard/administracion/documentacion",
  "/dashboard/administracion/documentacion/[slug]",
  "/dashboard/administracion/integraciones",
  "/dashboard/administracion/notificaciones",
  "/dashboard/administracion/notificaciones/enviar",
  "/dashboard/administracion/notificaciones/eventos",
  "/dashboard/administracion/notificaciones/historial",
  "/dashboard/administracion/notificaciones/plantillas",
  "/dashboard/administracion/notificaciones/plantillas/[id]",
  "/dashboard/administracion/notificaciones/plantillas/nueva",
  "/dashboard/administracion/notificaciones/popups",
  "/dashboard/administracion/notificaciones/recordatorios-grupales",
  "/dashboard/administracion/pagos",
  "/dashboard/administracion/planes",
  "/dashboard/administracion/planes/[id]",
  "/dashboard/administracion/planes/nuevo",
  "/dashboard/administracion/politicas",
  "/dashboard/administracion/site",
  "/dashboard/administracion/site/[pageId]",
  "/dashboard/administracion/tour",
  "/dashboard/analitica",
  "/dashboard/aprendizaje",
  "/dashboard/aprendizaje/recursos/[contentId]",
  "/dashboard/aprendizaje/workbooks-v2",
  "/dashboard/aprendizaje/workbooks-v2/[slug]",
  "/dashboard/aprendizaje/workbooks/[slug]",
  "/dashboard/aprendizaje/workbooks/[slug]/editar",
  "/dashboard/contenido",
  "/dashboard/contenido/[contentId]/actividad",
  "/dashboard/contenido/[contentId]/tarea",
  "/dashboard/convocatorias",
  "/dashboard/convocatorias/[id]",
  "/dashboard/convocatorias/[id]/editar",
  "/dashboard/convocatorias/nueva",
  "/dashboard/convocatorias/solicitar",
  "/dashboard/descubrimiento",
  "/dashboard/formacion-mentores",
  "/dashboard/formacion-mentores/[contentId]",
  "/dashboard/gestion-formacion-mentores",
  "/dashboard/lideres",
  "/dashboard/lideres/[userId]",
  "/dashboard/mensajes",
  "/dashboard/mentorias",
  "/dashboard/mentorias/comprar",
  "/dashboard/mentorias/grupales",
  "/dashboard/mentorias/programa",
  "/dashboard/networking",
  "/dashboard/networking/comunidades/[groupId]",
  "/dashboard/networking/perfiles/[userId]",
  "/dashboard/perfil",
  "/dashboard/suscripcion",
  "/dashboard/trayectoria",
  "/dashboard/usuarios",
  "/dashboard/usuarios/[userId]",
  "/dashboard/usuarios/nuevo",
  "/dashboard/workshops",
  "/dashboard/workshops/[workshopId]",
  "/dashboard/workshops/[workshopId]/edit",
  "/dashboard/workshops/new",
];

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  administracion: "Administración",
  notificaciones: "Mensajes y Notificaciones",
  plantillas: "Plantillas",
  eventos: "Eventos",
  popups: "Popup Builder",
  historial: "Historial",
  branding: "Branding y Marca",
  integraciones: "Integraciones",
  planes: "Planes y Precios",
  tour: "Tour de Onboarding",
  "asistente-ia": "Asistente IA",
  documentacion: "Documentación técnica",
  site: "Site",
  politicas: "Política de Privacidad",
  pagos: "Pagos de mentorías",
  lideres: "Líderes",
  usuarios: "Usuarios",
  mentorias: "Mentorías",
  networking: "Networking",
  convocatorias: "Convocatorias",
  workshops: "Workshops",
  aprendizaje: "Aprendizaje",
  trayectoria: "Trayectoria",
  descubrimiento: "Descubrimiento",
  perfil: "Perfil",
  mensajes: "Mensajes",
  suscripcion: "Mi suscripción",
  contenido: "Contenido",
  "formacion-mentores": "Formación Advisors",
};

function prettify(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  const clean = decodeURIComponent(segment).replace(/-/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function matchesPrefix(routeParts: string[], pathParts: string[]): boolean {
  if (routeParts.length >= pathParts.length) return false;
  return routeParts.every((seg, i) => seg.startsWith("[") || seg === pathParts[i]);
}

/**
 * Botón global "volver al nivel anterior": navega al ancestro REAL más cercano
 * (ruta existente que es prefijo del path actual). Debajo del header. Se oculta
 * en la raíz /dashboard.
 */
export function DashboardBackButton() {
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  if (pathParts.length <= 1) return null;

  let best: string[] | null = null;
  for (const route of DASHBOARD_ROUTES) {
    const rp = route.split("/").filter(Boolean);
    if (matchesPrefix(rp, pathParts) && (!best || rp.length > best.length)) {
      best = rp;
    }
  }
  if (!best) return null;

  const href = "/" + pathParts.slice(0, best.length).join("/");
  const lastSeg = best[best.length - 1];
  const label = lastSeg.startsWith("[") ? "Volver" : `Volver a ${prettify(lastSeg)}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--brand-primary)]"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
