import competencyMapJson from './competency-map.json';

export type CompetencyMap = Record<string, Record<string, Record<string, string[]>>>;

export interface CompetencyOption {
  label: string;
  value: string;
}

export const COMPETENCY_MAP = competencyMapJson as CompetencyMap;

export const PILLAR_CODE_BY_LABEL: Record<string, string> = {
  'Shine Within': 'shine_within',
  'Shine Out': 'shine_out',
  'Shine Up': 'shine_up',
  'Shine Beyond': 'shine_beyond',
};

export const PILLAR_LABEL_BY_CODE = Object.fromEntries(
  Object.entries(PILLAR_CODE_BY_LABEL).map(([label, code]) => [code, label]),
) as Record<string, string>;

export const COMPETENCY_PILLAR_OPTIONS: CompetencyOption[] = Object.entries(PILLAR_CODE_BY_LABEL).map(([label, value]) => ({
  label,
  value,
}));

export function getPillarLabelFromCode(code: string | null | undefined): string {
  if (!code) return 'Sin pilar';
  return PILLAR_LABEL_BY_CODE[code] ?? code;
}

export function getComponentOptionsByPillarCode(pillarCode: string | null | undefined): CompetencyOption[] {
  const pillarLabel = pillarCode ? PILLAR_LABEL_BY_CODE[pillarCode] : null;
  if (!pillarLabel || !COMPETENCY_MAP[pillarLabel]) {
    return [];
  }

  return Object.keys(COMPETENCY_MAP[pillarLabel]).map((component) => ({
    label: component,
    value: component,
  }));
}

export function getCompetencyOptions(
  pillarCode: string | null | undefined,
  component: string | null | undefined,
): CompetencyOption[] {
  const pillarLabel = pillarCode ? PILLAR_LABEL_BY_CODE[pillarCode] : null;
  if (!pillarLabel || !component) {
    return [];
  }

  const competencies = COMPETENCY_MAP[pillarLabel]?.[component];
  if (!competencies) {
    return [];
  }

  return Object.keys(competencies).map((competency) => ({
    label: competency,
    value: competency,
  }));
}

export function getObservableBehaviors(
  pillarCode: string | null | undefined,
  component: string | null | undefined,
  competency: string | null | undefined,
): string[] {
  const pillarLabel = pillarCode ? PILLAR_LABEL_BY_CODE[pillarCode] : null;
  if (!pillarLabel || !component || !competency) {
    return [];
  }

  return COMPETENCY_MAP[pillarLabel]?.[component]?.[competency] ?? [];
}
