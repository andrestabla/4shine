"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Etiquetas legibles para los segmentos de ruta más comunes (con acentos).
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  administracion: "Administración",
  notificaciones: "Mensajes y Notificaciones",
  plantillas: "Plantillas",
  eventos: "Eventos",
  popups: "Popup Builder",
  historial: "Historial",
  enviar: "Enviar mensajes",
  "recordatorios-grupales": "Recordatorios grupales",
  branding: "Branding y Marca",
  integraciones: "Integraciones",
  planes: "Planes y Precios",
  tour: "Tour de Onboarding",
  "asistente-ia": "Asistente IA",
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
};

function prettify(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  const clean = decodeURIComponent(segment).replace(/-/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Botón global "volver al nivel anterior": navega al path padre (un segmento
 * arriba). Se oculta en la raíz del dashboard. Se renderiza debajo del header,
 * en el área de contenido.
 */
export function DashboardBackButton() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return null; // /dashboard → sin nivel superior

  const parentParts = parts.slice(0, -1);
  const parentPath = "/" + parentParts.join("/");
  const label = prettify(parentParts[parentParts.length - 1] ?? "dashboard");

  return (
    <Link
      href={parentPath}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--brand-primary)]"
    >
      <ArrowLeft size={16} />
      Volver a {label}
    </Link>
  );
}
