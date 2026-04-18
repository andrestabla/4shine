export const YEARS_EXPERIENCE_OPTIONS = [
  { key: "1-5",  label: "Entre 1 y 5 años",   storedValue: 3,  min: 1,  max: 5  },
  { key: "6-10", label: "Entre 6 y 10 años",  storedValue: 8,  min: 6,  max: 10 },
  { key: "11-15",label: "Entre 11 y 15 años", storedValue: 13, min: 11, max: 15 },
  { key: "16-20",label: "Entre 16 y 20 años", storedValue: 18, min: 16, max: 20 },
  { key: "20+",  label: "Más de 20 años",     storedValue: 21, min: 21, max: Number.POSITIVE_INFINITY },
] as const;

export type YearsExperienceKey = (typeof YEARS_EXPERIENCE_OPTIONS)[number]["key"];

export function yearsToLabel(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return "-";
  const range = YEARS_EXPERIENCE_OPTIONS.find((r) => value >= r.min && value <= r.max);
  return range?.label ?? "-";
}

export function yearsToKey(value: number | null | undefined): YearsExperienceKey | "" {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return "";
  const range = YEARS_EXPERIENCE_OPTIONS.find((r) => value >= r.min && value <= r.max);
  return range?.key ?? "";
}

export function keyToStoredValue(key: string): number | null {
  return YEARS_EXPERIENCE_OPTIONS.find((r) => r.key === key)?.storedValue ?? null;
}
