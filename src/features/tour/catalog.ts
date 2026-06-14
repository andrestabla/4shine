import type { ModuleCode, PermissionAction } from '@/lib/permissions';

/**
 * Catálogo estático de "objetivos" (anchors) que un paso del tour puede
 * resaltar. Cada anchor mapea a un elemento real del shell del dashboard
 * mediante un atributo data-tour (NO clases, que son dinámicas por branding)
 * y, opcionalmente, a la ruta a la que el tour debe navegar y al módulo cuyo
 * permiso se requiere para que el objetivo exista en el DOM.
 */

export type TourAnchorArea = 'sidebar' | 'header';

export interface TourAnchorDef {
  key: string; // coincide con tour_steps.anchor_key
  label: string; // mostrado en el selector del editor de admin
  selector: string; // p.ej. '[data-tour="nav-mentorias"]'
  route: string | null; // destino de router.push; null = sin navegación (header)
  area: TourAnchorArea;
  moduleCode?: ModuleCode; // para descartar pasos sin permiso
  requiredAction?: PermissionAction; // por defecto 'view'
}

/**
 * Deriva la clave de anchor a partir del path de un ítem del sidebar. El
 * último segmento del path es único entre los ítems de navegación, así que
 * sirve como clave estable. Compartido entre el catálogo y Sidebar.tsx para
 * que ambos coincidan.
 */
export function anchorKeyForPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? 'dashboard';
  return `nav-${last}`;
}

interface NavAnchorSeed {
  path: string;
  label: string;
  moduleCode: ModuleCode;
  requiredAction?: PermissionAction;
}

// Refleja MAIN_NAV_ITEMS + ADMIN_NAV_ITEMS de src/components/Sidebar.tsx
const SIDEBAR_SEEDS: NavAnchorSeed[] = [
  { path: '/dashboard', label: 'Inicio', moduleCode: 'dashboard' },
  { path: '/dashboard/trayectoria', label: 'Trayectoria', moduleCode: 'trayectoria' },
  { path: '/dashboard/descubrimiento', label: 'Descubrimiento', moduleCode: 'descubrimiento' },
  { path: '/dashboard/aprendizaje', label: 'Aprendizaje', moduleCode: 'aprendizaje' },
  { path: '/dashboard/metodologia', label: 'Metodología', moduleCode: 'metodologia' },
  { path: '/dashboard/mentorias', label: 'Mentorías', moduleCode: 'mentorias' },
  { path: '/dashboard/networking', label: 'Networking', moduleCode: 'networking' },
  { path: '/dashboard/convocatorias', label: 'Convocatorias', moduleCode: 'convocatorias' },
  { path: '/dashboard/mensajes', label: 'Mensajes', moduleCode: 'mensajes' },
  { path: '/dashboard/workshops', label: 'Workshops', moduleCode: 'workshops' },
  { path: '/dashboard/lideres', label: 'Líderes', moduleCode: 'lideres' },
  { path: '/dashboard/formacion-mentores', label: 'Formación Advisers', moduleCode: 'formacion_mentores' },
  {
    path: '/dashboard/gestion-formacion-mentores',
    label: 'Gestión Formación Advisers',
    moduleCode: 'gestion_formacion_mentores',
  },
  { path: '/dashboard/contenido', label: 'Contenidos', moduleCode: 'contenido' },
  { path: '/dashboard/analitica', label: 'Analítica', moduleCode: 'analitica' },
  { path: '/dashboard/administracion', label: 'Panel Administración', moduleCode: 'usuarios', requiredAction: 'manage' },
  { path: '/dashboard/usuarios', label: 'Gestión Usuarios', moduleCode: 'usuarios' },
  { path: '/dashboard/administracion/branding', label: 'Branding y Marca', moduleCode: 'usuarios', requiredAction: 'manage' },
  { path: '/dashboard/administracion/integraciones', label: 'Integraciones', moduleCode: 'usuarios', requiredAction: 'manage' },
  { path: '/dashboard/administracion/site', label: 'Site', moduleCode: 'usuarios', requiredAction: 'manage' },
  { path: '/dashboard/administracion/planes', label: 'Planes y Precios', moduleCode: 'usuarios', requiredAction: 'manage' },
];

const SIDEBAR_ANCHORS: TourAnchorDef[] = SIDEBAR_SEEDS.map((seed) => ({
  key: anchorKeyForPath(seed.path),
  label: `Menú · ${seed.label}`,
  selector: `[data-tour="${anchorKeyForPath(seed.path)}"]`,
  route: seed.path,
  area: 'sidebar',
  moduleCode: seed.moduleCode,
  requiredAction: seed.requiredAction,
}));

const HEADER_ANCHORS: TourAnchorDef[] = [
  {
    key: 'header-notifications',
    label: 'Barra superior · Notificaciones',
    selector: '[data-tour="header-notifications"]',
    route: null,
    area: 'header',
  },
  {
    key: 'header-profile',
    label: 'Barra superior · Perfil',
    selector: '[data-tour="header-profile"]',
    route: null,
    area: 'header',
  },
  {
    key: 'header-logout',
    label: 'Barra superior · Cerrar sesión',
    selector: '[data-tour="header-logout"]',
    route: null,
    area: 'header',
  },
];

export const TOUR_ANCHORS: TourAnchorDef[] = [...SIDEBAR_ANCHORS, ...HEADER_ANCHORS];

const ANCHOR_BY_KEY = new Map(TOUR_ANCHORS.map((a) => [a.key, a]));

export function getAnchor(key: string): TourAnchorDef | undefined {
  return ANCHOR_BY_KEY.get(key);
}
