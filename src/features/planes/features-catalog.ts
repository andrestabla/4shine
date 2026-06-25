import type { PlanFeatureDef, PlanFeatureKey } from './types';

/**
 * Catálogo estático de features que un plan puede habilitar.
 * Cada feature mapea a un módulo del sistema (MODULE_CODES).
 */
export const PLAN_FEATURES: PlanFeatureDef[] = [
  {
    key: 'trayectoria',
    moduleCode: 'trayectoria',
    moduleLabel: 'Trayectoria',
    label: 'Trayectoria',
    description: 'Acceso a la ruta estructurada del programa.',
    supportsQuota: false,
  },
  {
    key: 'descubrimiento',
    moduleCode: 'descubrimiento',
    moduleLabel: 'Descubrimiento',
    label: 'Descubrimiento',
    description: 'Diagnóstico ejecutivo y reportes 4Shine.',
    supportsQuota: false,
  },
  {
    key: 'aprendizaje_recursos_free',
    moduleCode: 'aprendizaje',
    moduleLabel: 'Aprendizaje',
    label: 'Recursos free',
    description: 'Biblioteca gratuita de aprendizaje.',
    supportsQuota: false,
  },
  {
    key: 'aprendizaje_cursos',
    moduleCode: 'aprendizaje',
    moduleLabel: 'Aprendizaje',
    label: 'Cursos',
    description: 'Catálogo completo de cursos del programa.',
    supportsQuota: false,
  },
  {
    key: 'aprendizaje_workbooks',
    moduleCode: 'aprendizaje',
    moduleLabel: 'Aprendizaje',
    label: 'Workbooks',
    description: 'Workbooks descargables y guías de trabajo.',
    supportsQuota: false,
  },
  {
    key: 'mentorias_grupales',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Mentorías grupales',
    description: 'Sesiones grupales en vivo con Advisor.',
    supportsQuota: true,
  },
  {
    key: 'mentorias_1on1',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Mentorías 1:1',
    description: 'Sesiones individuales con Advisor asignado.',
    supportsQuota: true,
  },
  {
    key: 'mentorias_comprar',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Comprar mentorías extra',
    description: 'Permite adquirir packs de mentoría adicionales.',
    supportsQuota: false,
  },
  {
    key: 'networking',
    moduleCode: 'networking',
    moduleLabel: 'Networking',
    label: 'Networking',
    description: 'Comunidad y conexiones entre líderes.',
    supportsQuota: false,
  },
  {
    key: 'mensajes',
    moduleCode: 'mensajes',
    moduleLabel: 'Mensajes',
    label: 'Mensajes',
    description: 'Chat directo con Advisor y otros miembros.',
    supportsQuota: false,
  },
  {
    key: 'convocatorias',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Convocatorias',
    description: 'Oportunidades laborales y de visibilidad.',
    supportsQuota: false,
  },
  {
    key: 'workshops',
    moduleCode: 'workshops',
    moduleLabel: 'Workshops',
    label: 'Workshops',
    description: 'Talleres en vivo del ecosistema 4Shine.',
    supportsQuota: false,
  },
];

export const PLAN_FEATURE_KEYS: PlanFeatureKey[] = PLAN_FEATURES.map((f) => f.key);

export function isValidFeatureKey(key: string): key is PlanFeatureKey {
  return PLAN_FEATURE_KEYS.includes(key as PlanFeatureKey);
}

export function getFeatureDef(key: PlanFeatureKey): PlanFeatureDef | undefined {
  return PLAN_FEATURES.find((f) => f.key === key);
}

/**
 * Agrupa features por módulo para renderizado de tablas/grids.
 */
export function groupFeaturesByModule(): Array<{
  moduleCode: string;
  moduleLabel: string;
  features: PlanFeatureDef[];
}> {
  const groups = new Map<string, { moduleLabel: string; features: PlanFeatureDef[] }>();
  for (const feature of PLAN_FEATURES) {
    const existing = groups.get(feature.moduleCode);
    if (existing) {
      existing.features.push(feature);
    } else {
      groups.set(feature.moduleCode, {
        moduleLabel: feature.moduleLabel,
        features: [feature],
      });
    }
  }
  return Array.from(groups.entries()).map(([moduleCode, value]) => ({
    moduleCode,
    moduleLabel: value.moduleLabel,
    features: value.features,
  }));
}
