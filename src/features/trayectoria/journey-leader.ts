export type JourneyMilestoneCode =
  | "discovery"
  | "wb1"
  | "wb2"
  | "wb3"
  | "wb4"
  | "wb5"
  | "wb6"
  | "wb7"
  | "wb8"
  | "wb9"
  | "wb10";

export interface JourneyWeekStep {
  weekNumber: number;
  weekLabel: string;
  transformationMoment: string;
  milestoneCode: JourneyMilestoneCode;
  kind: "discovery" | "workbook";
  trajectory: string;
  learning: string;
  mentorship: string;
  networking: string;
  opportunities: string;
  workshops: string;
}

export interface JourneyPhaseDefinition {
  id: "discovery" | "shine_within" | "shine_out" | "shine_up" | "shine_beyond";
  title: string;
  shortTitle: string;
  subtitle: string;
  weekRangeLabel: string;
  /** Semanas del cronograma oficial que cubre la fase (ambas inclusive). */
  weekStart: number;
  weekEnd: number;
  transformationMoment: string;
  milestoneCodes: JourneyMilestoneCode[];
  goal: string;
  routePath: string;
  accent: {
    border: string;
    soft: string;
    solid: string;
    text: string;
    glow: string;
  };
}

function step(
  weekNumber: number,
  transformationMoment: string,
  milestoneCode: JourneyMilestoneCode,
  trajectory: string,
  learning: string,
  mentorship: string,
  networking: string,
  opportunities: string,
  workshops: string,
): JourneyWeekStep {
  return {
    weekNumber,
    weekLabel: `Semana ${weekNumber}`,
    transformationMoment,
    milestoneCode,
    kind: milestoneCode === "discovery" ? "discovery" : "workbook",
    trajectory,
    learning,
    mentorship,
    networking,
    opportunities,
    workshops,
  };
}

export const LEADER_JOURNEY_STEPS: JourneyWeekStep[] = [
  step(
    1,
    "Descubrimiento",
    "discovery",
    "Diagnóstico: ver, desarrollar y descargar resultados. Un solo intento.",
    "Todos los contenidos free y 4Shine, destacando la información introductoria del marco 4Shine.",
    "Ver próximas mentorías.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    2,
    "Shine Within (Esencia)",
    "wb1",
    "WB1: Creencias, identidad y pilares personales. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks está habilitado el WB1.",
    "Ver próximas mentorías.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    3,
    "Shine Within (Esencia)",
    "wb1",
    "WB1: Creencias, identidad y pilares personales. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks solo está habilitado el WB1.",
    "Mentoría 1. Creencias, identidad y pilares personales.\nVer próximas mentorías.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    4,
    "Shine Within (Esencia)",
    "wb1",
    "WB1: Creencias, identidad y pilares personales. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks solo está habilitado el WB1.",
    "Ver próximas mentorías.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    5,
    "Shine Within (Esencia)",
    "wb2",
    "WB2: Gestión emocional y PDI estratégico. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks están habilitados WB2 y WB1.",
    "Mentoría 2. Gestión emocional y PDI estratégico.\nVer próximas mentorías.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    6,
    "Shine Within (Esencia)",
    "wb2",
    "WB2: Gestión emocional y PDI estratégico. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks están habilitados WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    7,
    "Shine Within (Esencia)",
    "wb3",
    "WB3: Propósito y valores no negociables. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks están habilitados WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    8,
    "Shine Within (Esencia)",
    "wb3",
    "WB3: Propósito y valores no negociables. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Within. En la subsección de workbooks están habilitados WB3, WB2 y WB1.",
    "Mentoría 3. Propósito y valores no negociables.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    9,
    "Shine Out (Presencia Estratégica)",
    "wb4",
    "WB4: Narrativa profesional y Elevator Pitch. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Out. En la subsección de workbooks están habilitados WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    10,
    "Shine Out (Presencia Estratégica)",
    "wb4",
    "WB4: Narrativa profesional y Elevator Pitch. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Out. En la subsección de workbooks están habilitados WB4, WB3, WB2 y WB1.",
    "Mentoría 4. Narrativa profesional y Elevator Pitch.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    11,
    "Shine Out (Presencia Estratégica)",
    "wb5",
    "WB5: Comunicación ejecutiva estratégica. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Out. En la subsección de workbooks están habilitados WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    12,
    "Shine Out (Presencia Estratégica)",
    "wb5",
    "WB5: Comunicación ejecutiva estratégica. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Out. En la subsección de workbooks están habilitados WB5, WB4, WB3, WB2 y WB1.",
    "Mentoría 5. Comunicación ejecutiva estratégica.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    13,
    "Shine Out (Presencia Estratégica)",
    "wb6",
    "WB6: Lenguaje verbal y no verbal de impacto. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Out. En la subsección de workbooks están habilitados WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    14,
    "Shine Out (Presencia Estratégica)",
    "wb6",
    "WB6: Lenguaje verbal y no verbal de impacto. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Out. En la subsección de workbooks están habilitados WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Mentoría 6. Lenguaje verbal y no verbal de impacto.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    15,
    "Shine Up (Ecosistema Relacional)",
    "wb7",
    "WB7: Mapeo del ecosistema estratégico. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Up. En la subsección de workbooks están habilitados WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    16,
    "Shine Up (Ecosistema Relacional)",
    "wb7",
    "WB7: Mapeo del ecosistema estratégico. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Up. En la subsección de workbooks están habilitados WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Mentoría 7. Mapeo del ecosistema estratégico.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    17,
    "Shine Up (Ecosistema Relacional)",
    "wb7",
    "WB7: Mapeo del ecosistema estratégico. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Up. En la subsección de workbooks están habilitados WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    18,
    "Shine Up (Ecosistema Relacional)",
    "wb8",
    "WB8: Pensamiento estratégico y toma de decisiones. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Up. En la subsección de workbooks están habilitados WB8, WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    19,
    "Shine Up (Ecosistema Relacional)",
    "wb8",
    "WB8: Pensamiento estratégico y toma de decisiones. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Up. En la subsección de workbooks están habilitados WB8, WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Mentoría 8. Pensamiento estratégico y toma de decisiones.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    20,
    "Shine Up (Ecosistema Relacional)",
    "wb8",
    "WB8: Pensamiento estratégico y toma de decisiones. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Up. En la subsección de workbooks están habilitados WB8, WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    21,
    "Shine Beyond (El Legado)",
    "wb9",
    "WB9: Latido de marca ejecutiva. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Beyond. En la subsección de workbooks están habilitados WB9, WB8, WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Mentoría 9. Latido de marca ejecutiva.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    22,
    "Shine Beyond (El Legado)",
    "wb9",
    "WB9: Latido de marca ejecutiva. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Beyond. En la subsección de workbooks están habilitados WB9, WB8, WB7, WB6, WB5, WB4, WB3, WB2 y WB1.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    23,
    "Shine Beyond (El Legado)",
    "wb10",
    "WB10: Visión estratégica personal. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Beyond. En la subsección de workbooks están habilitados todos.",
    "Mentoría 10. Visión estratégica personal.\nVer próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
  step(
    24,
    "Shine Beyond (El Legado)",
    "wb10",
    "WB10: Visión estratégica personal. Direcciona al workbook para trabajarlo.",
    "Todos los contenidos free y 4Shine asociados directamente con Shine Beyond. En la subsección de workbooks están habilitados todos.",
    "Ver próximas mentorías.\nVer grabaciones de mentorías anteriores.",
    "Ver\nConectar",
    "Ver\nAplicar",
    "Ver\nAplicar",
  ),
];

export const LEADER_JOURNEY_PHASES: JourneyPhaseDefinition[] = [
  {
    id: "discovery",
    title: "Descubrimiento",
    shortTitle: "Diagnóstico inicial",
    subtitle: "Leer el punto de partida y activar la ruta de transformación.",
    weekRangeLabel: "Semana 1",
    weekStart: 1,
    weekEnd: 1,
    transformationMoment: "Descubrimiento",
    milestoneCodes: ["discovery"],
    goal: "Completa el diagnóstico 4Shine y descarga tu lectura ejecutiva.",
    routePath: "/dashboard/descubrimiento",
    accent: {
      border: "border-sky-200",
      soft: "bg-sky-50",
      solid: "bg-sky-500",
      text: "text-sky-700",
      glow: "shadow-[0_18px_34px_rgba(14,165,233,0.12)]",
    },
  },
  {
    id: "shine_within",
    title: "Shine Within",
    shortTitle: "Esencia",
    subtitle: "Autoliderazgo, identidad y regulación para sostener decisiones más conscientes.",
    weekRangeLabel: "Semanas 2-8",
    weekStart: 2,
    weekEnd: 8,
    transformationMoment: "Shine Within (Esencia)",
    milestoneCodes: ["wb1", "wb2", "wb3"],
    goal: "Trabaja tu base interna con WB1, WB2 y WB3 para llegar a una visión más clara de ti.",
    routePath: "/dashboard/aprendizaje",
    accent: {
      border: "border-emerald-200",
      soft: "bg-emerald-50",
      solid: "bg-emerald-500",
      text: "text-emerald-700",
      glow: "shadow-[0_18px_34px_rgba(16,185,129,0.12)]",
    },
  },
  {
    id: "shine_out",
    title: "Shine Out",
    shortTitle: "Presencia estratégica",
    subtitle: "Narrativa, comunicación e impacto visible en tu entorno.",
    weekRangeLabel: "Semanas 9-14",
    weekStart: 9,
    weekEnd: 14,
    transformationMoment: "Shine Out (Presencia Estratégica)",
    milestoneCodes: ["wb4", "wb5", "wb6"],
    goal: "Convierte tu identidad en presencia ejecutiva con narrativa, voz y comunicación de alto impacto.",
    routePath: "/dashboard/aprendizaje",
    accent: {
      border: "border-amber-200",
      soft: "bg-amber-50",
      solid: "bg-amber-500",
      text: "text-amber-700",
      glow: "shadow-[0_18px_34px_rgba(245,158,11,0.12)]",
    },
  },
  {
    id: "shine_up",
    title: "Shine Up",
    shortTitle: "Ecosistema relacional",
    subtitle: "Estrategia, red y toma de decisiones con lectura de sistema.",
    weekRangeLabel: "Semanas 15-20",
    weekStart: 15,
    weekEnd: 20,
    transformationMoment: "Shine Up (Ecosistema Relacional)",
    milestoneCodes: ["wb7", "wb8"],
    goal: "Expande tu criterio estratégico con visibilidad, red y decisiones más estructuradas.",
    routePath: "/dashboard/aprendizaje",
    accent: {
      border: "border-indigo-200",
      soft: "bg-indigo-50",
      solid: "bg-indigo-500",
      text: "text-indigo-700",
      glow: "shadow-[0_18px_34px_rgba(99,102,241,0.12)]",
    },
  },
  {
    id: "shine_beyond",
    title: "Shine Beyond",
    shortTitle: "Legado",
    subtitle: "Marca, visión y expansión del liderazgo más allá del rol actual.",
    weekRangeLabel: "Semanas 21-24",
    weekStart: 21,
    weekEnd: 24,
    transformationMoment: "Shine Beyond (El Legado)",
    milestoneCodes: ["wb9", "wb10"],
    goal: "Cierra el programa con marca ejecutiva y una visión estratégica personal accionable.",
    routePath: "/dashboard/aprendizaje",
    accent: {
      border: "border-fuchsia-200",
      soft: "bg-fuchsia-50",
      solid: "bg-fuchsia-500",
      text: "text-fuchsia-700",
      glow: "shadow-[0_18px_34px_rgba(217,70,239,0.12)]",
    },
  },
];

// ─── Progreso global de la ruta (fuente única) ───────────────────────────────
// Promedia el avance de TODOS los hitos del journey (discovery + workbooks),
// usando los mismos milestoneCodes que las fases. Lo usan el dashboard y la
// página de Trayectoria para mostrar el mismo número.

export interface RouteProgressWorkbook {
  templateCode: string;
  completionPercent: number;
}

export interface RouteProgressDiscovery {
  completionPercent: number;
}

export function computeRouteProgressPercent(
  workbooks: RouteProgressWorkbook[],
  discovery: RouteProgressDiscovery | null,
): number {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
  const progress = new Map<JourneyMilestoneCode, number>();
  progress.set("discovery", clamp(discovery?.completionPercent ?? 0));
  for (const wb of workbooks) {
    progress.set(wb.templateCode as JourneyMilestoneCode, clamp(wb.completionPercent));
  }

  const codes = new Set<JourneyMilestoneCode>();
  for (const phase of LEADER_JOURNEY_PHASES) {
    for (const code of phase.milestoneCodes) codes.add(code);
  }
  const values = [...codes].map((code) => progress.get(code) ?? 0);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}



/** Total de semanas del Camino del líder. */
export const LEADER_JOURNEY_TOTAL_WEEKS = 24;

/**
 * Semana de calendario en la que va el líder, contada desde el inicio de su
 * programa. Devuelve null si no hay fecha de inicio.
 *
 * Es DISTINTA del avance: mide tiempo transcurrido, no trabajo hecho. La
 * comparación entre ambas es justamente lo que revela si alguien se quedó atrás.
 * No se acota a 24: pasar de 24 es información valiosa, no un error.
 */
export function calculateCalendarWeek(programStartedAt: string | null): number | null {
  if (!programStartedAt) return null;
  const start = new Date(programStartedAt);
  if (Number.isNaN(start.getTime())) return null;
  const elapsedDays = (Date.now() - start.getTime()) / 86_400_000;
  if (elapsedDays < 0) return 1;
  return Math.floor(elapsedDays / 7) + 1;
}

/** Fase que le correspondería a esa semana según el cronograma oficial. */
export function phaseForCalendarWeek(week: number): JourneyPhaseDefinition {
  const phase = LEADER_JOURNEY_PHASES.find((item) => week >= item.weekStart && week <= item.weekEnd);
  // Más allá de la semana 24 el cronograma terminó: corresponde la última fase.
  return phase ?? LEADER_JOURNEY_PHASES[LEADER_JOURNEY_PHASES.length - 1];
}
