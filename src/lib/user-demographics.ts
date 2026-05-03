export const USER_JOB_ROLE_OPTIONS = [
  "Director/C-Level",
  "Gerente/Mando medio",
  "Coordinador",
  "Lider de proyecto con equipo a cargo",
  "Especialista sin personal a cargo",
] as const;

export const USER_GENDER_OPTIONS = [
  "Hombre",
  "Mujer",
  "Prefiero no decirlo",
] as const;

export const USER_COUNTRY_OPTIONS = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Ecuador",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
] as const;

export type UserJobRoleOption = (typeof USER_JOB_ROLE_OPTIONS)[number];
export type UserGenderOption = (typeof USER_GENDER_OPTIONS)[number];
export type UserCountryOption = (typeof USER_COUNTRY_OPTIONS)[number];

export const USER_JOB_ROLE_SET = new Set<string>(USER_JOB_ROLE_OPTIONS);
export const USER_GENDER_SET = new Set<string>(USER_GENDER_OPTIONS);
export const USER_COUNTRY_SET = new Set<string>(USER_COUNTRY_OPTIONS);
