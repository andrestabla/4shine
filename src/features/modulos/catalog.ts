import type { ModuleCode } from '@/lib/permissions';

/**
 * Catálogo de módulos y submódulos que el administrador puede encender o
 * apagar en /dashboard/administracion/modulos.
 *
 * Vive en código (no en BD) para que no se desincronice de las rutas reales:
 * la BD solo guarda las excepciones, y todo lo que no tenga fila está encendido.
 */

export interface ModuleCatalogChild {
  /** Clave de persistencia. Siempre "<padre>.<hijo>". */
  key: string;
  label: string;
  /** Prefijo de ruta que identifica al submódulo. */
  path: string;
  /**
   * Prefijos adicionales que pertenecen al mismo submódulo. Necesario cuando una
   * misma función vive en varias rutas (p. ej. los workbooks V3 en
   * /aprendizaje/workbooks-v2), porque si no, apagarlo dejaría una puerta abierta.
   */
  altPaths?: string[];
  description: string;
}

export interface ModuleCatalogEntry {
  key: string;
  label: string;
  moduleCode: ModuleCode;
  path: string;
  description: string;
  /**
   * Los módulos protegidos no se pueden apagar. Administración queda fuera a
   * propósito: apagarla dejaría al admin sin forma de volver a encender nada.
   */
  isProtected?: boolean;
  children?: ModuleCatalogChild[];
}

export const MODULE_CATALOG: ModuleCatalogEntry[] = [
  {
    key: 'dashboard',
    label: 'Inicio',
    moduleCode: 'dashboard',
    path: '/dashboard',
    description: 'Panel principal de cada rol.',
    isProtected: true,
  },
  {
    key: 'perfil',
    label: 'Perfil',
    moduleCode: 'perfil',
    path: '/dashboard/perfil',
    description: 'Perfil profesional del usuario.',
    isProtected: true,
  },
  {
    key: 'usuarios',
    label: 'Administración',
    moduleCode: 'usuarios',
    path: '/dashboard/administracion',
    description: 'Centro administrativo. No se puede apagar: es la única vía para reactivar módulos.',
    isProtected: true,
  },
  {
    key: 'trayectoria',
    label: 'Trayectoria',
    moduleCode: 'trayectoria',
    path: '/dashboard/trayectoria',
    description: 'Seguimiento de progreso y hitos de liderazgo.',
  },
  {
    key: 'descubrimiento',
    label: 'Descubrimiento',
    moduleCode: 'descubrimiento',
    path: '/dashboard/descubrimiento',
    description: 'Prueba diagnóstica 4Shine y su lectura ejecutiva.',
  },
  {
    key: 'aprendizaje',
    label: 'Aprendizaje',
    moduleCode: 'aprendizaje',
    path: '/dashboard/aprendizaje',
    description: 'Biblioteca de contenidos y workbooks del programa.',
    children: [
      {
        key: 'aprendizaje.recursos',
        label: 'Recursos',
        path: '/dashboard/aprendizaje/recursos',
        description: 'Videos, lecturas y pódcast del catálogo.',
      },
      {
        key: 'aprendizaje.workbooks',
        label: 'Workbooks',
        path: '/dashboard/aprendizaje/workbooks',
        altPaths: ['/dashboard/aprendizaje/workbooks-v2'],
        description: 'Cuadernos de trabajo WB1–WB10 (incluye la versión V3 con voz e IA).',
      },
    ],
  },
  {
    key: 'mentorias',
    label: 'Mentorías',
    moduleCode: 'mentorias',
    path: '/dashboard/mentorias',
    description: 'Agenda y gestión de sesiones de mentoría.',
    children: [
      {
        key: 'mentorias.programa',
        label: 'Mentorías del programa',
        path: '/dashboard/mentorias/programa',
        description: 'Sesiones 1:1 incluidas en el programa.',
      },
      {
        key: 'mentorias.grupales',
        label: 'Sesiones grupales',
        path: '/dashboard/mentorias/grupales',
        description: 'Sesiones grupales y masterclasses.',
      },
      {
        key: 'mentorias.comprar',
        label: 'Comprar mentorías',
        path: '/dashboard/mentorias/comprar',
        description: 'Compra de sesiones adicionales.',
      },
    ],
  },
  {
    key: 'networking',
    label: 'Networking',
    moduleCode: 'networking',
    path: '/dashboard/networking',
    description: 'Comunidad y conexiones profesionales.',
    children: [
      {
        key: 'networking.comunidades',
        label: 'Comunidades',
        path: '/dashboard/networking/comunidades',
        description: 'Grupos temáticos de la comunidad.',
      },
      {
        key: 'networking.perfiles',
        label: 'Perfiles',
        path: '/dashboard/networking/perfiles',
        description: 'Directorio de perfiles de otros líderes.',
      },
    ],
  },
  {
    key: 'convocatorias',
    label: 'Convocatorias',
    moduleCode: 'convocatorias',
    path: '/dashboard/convocatorias',
    description: 'Ofertas y convocatorias laborales.',
    children: [
      {
        key: 'convocatorias.solicitar',
        label: 'Solicitar convocatoria',
        path: '/dashboard/convocatorias/solicitar',
        description: 'Formulario para solicitar una convocatoria.',
      },
    ],
  },
  {
    key: 'mensajes',
    label: 'Mensajes',
    moduleCode: 'mensajes',
    path: '/dashboard/mensajes',
    description: 'Mensajería entre usuarios de la plataforma.',
  },
  {
    key: 'workshops',
    label: 'Workshops',
    moduleCode: 'workshops',
    path: '/dashboard/workshops',
    description: 'Talleres y eventos colaborativos.',
    children: [
      {
        key: 'workshops.crear',
        label: 'Crear workshop',
        path: '/dashboard/workshops/new',
        description: 'Creación de nuevos talleres.',
      },
    ],
  },
  {
    key: 'lideres',
    label: 'Líderes',
    moduleCode: 'lideres',
    path: '/dashboard/lideres',
    description: 'Gestión de líderes para advisors y gestores.',
  },
  {
    key: 'formacion_mentores',
    label: 'Formación Advisors',
    moduleCode: 'formacion_mentores',
    path: '/dashboard/formacion-mentores',
    description: 'Ruta de capacitación para advisors.',
  },
  {
    key: 'gestion_formacion_mentores',
    label: 'Gestión Formación Advisors',
    moduleCode: 'gestion_formacion_mentores',
    path: '/dashboard/gestion-formacion-mentores',
    description: 'Asignación y seguimiento de la formación de advisors.',
  },
  {
    key: 'contenido',
    label: 'Contenidos',
    moduleCode: 'contenido',
    path: '/dashboard/contenido',
    description: 'Administración global de contenidos.',
  },
  {
    key: 'analitica',
    label: 'Analítica',
    moduleCode: 'analitica',
    path: '/dashboard/analitica',
    description: 'Analítica y reportes globales.',
  },
];

/** Claves que nunca pueden apagarse, por seguridad de acceso. */
export const PROTECTED_MODULE_KEYS = new Set(
  MODULE_CATALOG.filter((entry) => entry.isProtected).map((entry) => entry.key),
);

/** Todas las claves válidas (módulos + submódulos). */
export const ALL_MODULE_KEYS = new Set(
  MODULE_CATALOG.flatMap((entry) => [entry.key, ...(entry.children ?? []).map((c) => c.key)]),
);

/** moduleCode → clave del módulo de nivel superior. */
export const MODULE_KEY_BY_CODE = new Map<string, string>(
  MODULE_CATALOG.map((entry) => [entry.moduleCode, entry.key]),
);

/**
 * Resuelve qué clave de módulo/submódulo gobierna una ruta del dashboard.
 * Devuelve de la más específica a la más general, para que un submódulo
 * apagado bloquee su ruta aunque el padre siga encendido.
 */
export function moduleKeysForPath(pathname: string): string[] {
  const keys: string[] = [];
  for (const entry of MODULE_CATALOG) {
    for (const child of entry.children ?? []) {
      const paths = [child.path, ...(child.altPaths ?? [])];
      if (paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        keys.push(child.key);
      }
    }
    // "/dashboard" es prefijo de todo: solo cuenta como coincidencia exacta.
    if (entry.path === '/dashboard') {
      if (pathname === '/dashboard') keys.push(entry.key);
      continue;
    }
    if (pathname === entry.path || pathname.startsWith(`${entry.path}/`)) {
      keys.push(entry.key);
    }
  }
  return keys;
}
