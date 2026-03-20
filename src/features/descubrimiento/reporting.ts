import { COMP_DEFINITIONS, DB, PILLAR_INFO } from "./DiagnosticsData";
import type {
  DiscoveryAnswers,
  DiscoveryPillarKey,
  DiscoveryReportFilter,
  DiscoveryScoreResult,
  DiscoveryScoreRow,
  DiscoveryStatusDescriptor,
  DiscoveryUserState,
} from "./types";

export const DISCOVERY_ITEMS_PER_PAGE = 6;
export const DISCOVERY_TOTAL_ITEMS = DB.length;

const PILLAR_SCORE_CODES: Record<
  DiscoveryPillarKey,
  DiscoveryScoreRow["pillarCode"]
> = {
  within: "shine_within",
  out: "shine_out",
  up: "shine_up",
  beyond: "shine_beyond",
};

const PILLAR_ROUTINES: Record<
  DiscoveryPillarKey,
  { title: string; actions: string[]; signal: string }
> = {
  within: {
    title: "Autoliderazgo y presencia interna",
    actions: [
      "Abre una bitácora breve de cierre diario: evento, emoción dominante y aprendizaje concreto.",
      "Antes de una conversación exigente, define una intención y una señal física que te recuerde regular tu respuesta.",
      "Pide feedback puntual sobre una conducta específica y convierte ese insumo en un ajuste observable para la siguiente semana.",
    ],
    signal:
      "Tu mejora se vuelve visible cuando bajas la reactividad y aumentas la coherencia entre lo que piensas, dices y ejecutas.",
  },
  out: {
    title: "Influencia, escucha y comunicación",
    actions: [
      "En cada reunión clave, reserva un bloque para escuchar, sintetizar y confirmar acuerdos antes de cerrar.",
      "Practica feedback específico: conducta, impacto y siguiente paso, evitando juicios generales sobre la persona.",
      "Ajusta el mensaje según la audiencia y valida comprensión con una pregunta corta al final de cada intercambio importante.",
    ],
    signal:
      "El cambio se nota cuando tus mensajes generan más claridad, menos fricción y más compromiso explícito del equipo.",
  },
  up: {
    title: "Estrategia, criterio y ecosistema",
    actions: [
      "Reserva un espacio semanal para revisar riesgos, prioridades y decisiones que no puedes seguir postergando.",
      "Mapea stakeholders críticos y define qué conversación, visibilidad o patrocinio necesitas activar este mes.",
      "Cuando aparezca un problema repetido, documenta síntoma, causa raíz, decisión y criterio para evitar retrabajo.",
    ],
    signal:
      "La evolución aparece cuando dejas de operar solo por urgencia y empiezas a mover prioridades con más lectura de contexto.",
  },
  beyond: {
    title: "Legado, cultura y expansión del liderazgo",
    actions: [
      "Haz explícito qué comportamientos culturales quieres modelar y revisa si hoy los haces visibles en tus rituales.",
      "Delegar no es solo transferir tareas: acuerda autonomía, criterio y nivel de soporte para desarrollar a otras personas.",
      "Conecta cada meta del equipo con su impacto en personas, organización y comunidad para reforzar sentido y responsabilidad.",
    ],
    signal:
      "Tu madurez crece cuando el equipo no solo ejecuta mejor, sino que también amplía autonomía, sentido y cultura compartida.",
  },
};

function answeredItemsCount(answers: DiscoveryAnswers): number {
  return DB.reduce((count, question) => {
    const answer = answers[String(question.id)];
    return answer === undefined ? count : count + 1;
  }, 0);
}

export function calculateDiscoveryCompletionPercent(
  answers: DiscoveryAnswers,
): number {
  return Math.round((answeredItemsCount(answers) / DISCOVERY_TOTAL_ITEMS) * 100);
}

export function scoreDiscoveryAnswers(
  answers: DiscoveryAnswers,
): DiscoveryScoreResult {
  const pillars: Record<
    DiscoveryPillarKey,
    { likert: number[]; sjt: number[] }
  > = {
    within: { likert: [], sjt: [] },
    out: { likert: [], sjt: [] },
    up: { likert: [], sjt: [] },
    beyond: { likert: [], sjt: [] },
  };

  const compScores: Record<string, number[]> = {};

  for (const question of DB) {
    const answer = answers[String(question.id)];
    if (answer === undefined || answer === null || answer === "") continue;

    if (question.type === "likert") {
      const value = Number(answer);
      if (!Number.isFinite(value) || value <= 0) continue;
      pillars[question.pillar].likert.push(value);
      const competencyKey = `${question.pillar}|${question.comp}`;
      if (!compScores[competencyKey]) {
        compScores[competencyKey] = [];
      }
      compScores[competencyKey].push(value);
      continue;
    }

    const option = question.options?.find((item) => item.id === answer);
    if (!option) continue;
    pillars[question.pillar].sjt.push(option.weight);
  }

  const calcPillarMetric = (
    pillarKey: DiscoveryPillarKey,
  ): DiscoveryScoreResult["pillarMetrics"][DiscoveryPillarKey] => {
    const current = pillars[pillarKey];
    const likertTotal = current.likert.reduce((acc, value) => acc + value, 0);
    const sjtTotal = current.sjt.reduce((acc, value) => acc + value, 0);
    const likertCount = current.likert.length;
    const likertNorm =
      likertCount > 0 ? (likertTotal - likertCount) / (4 * likertCount) : 0;
    const sjtMax = pillarKey === "within" ? 30 : 9;
    const sjtNorm = current.sjt.length > 0 ? sjtTotal / sjtMax : 0;
    const totalPct = ((likertNorm + sjtNorm) / 2) * 100;

    return {
      total: Math.max(0, Math.round(totalPct)),
      likert: Math.max(0, Math.round(likertNorm * 100)),
      sjt: Math.max(0, Math.round(sjtNorm * 100)),
    };
  };

  const pillarMetrics = {
    within: calcPillarMetric("within"),
    out: calcPillarMetric("out"),
    up: calcPillarMetric("up"),
    beyond: calcPillarMetric("beyond"),
  };

  const globalIndex = Math.round(
    (pillarMetrics.within.total +
      pillarMetrics.out.total +
      pillarMetrics.up.total +
      pillarMetrics.beyond.total) /
      4,
  );

  const compList = Object.entries(compScores)
    .map(([key, values]) => {
      const [pillar, name] = key.split("|");
      const average =
        values.reduce((acc, value) => acc + value, 0) / values.length;
      return {
        pillar: pillar as DiscoveryPillarKey,
        name,
        score: Number(average.toFixed(1)),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "es"));

  return {
    pillarMetrics,
    globalIndex,
    compList,
  };
}

export function toDiscoveryScoreRows(
  scores: DiscoveryScoreResult,
): DiscoveryScoreRow[] {
  return (Object.keys(PILLAR_SCORE_CODES) as DiscoveryPillarKey[]).map(
    (pillarKey) => ({
      pillarCode: PILLAR_SCORE_CODES[pillarKey],
      score: scores.pillarMetrics[pillarKey].total,
    }),
  );
}

export function getDiscoveryStatus(value: number): DiscoveryStatusDescriptor {
  if (value >= 71) {
    return {
      label: "Fortaleza",
      tone: "emerald",
      color: "#0f766e",
      softColor: "rgba(16, 185, 129, 0.14)",
    };
  }

  if (value >= 41) {
    return {
      label: "Desarrollo",
      tone: "amber",
      color: "#c2410c",
      softColor: "rgba(245, 158, 11, 0.16)",
    };
  }

  return {
    label: "Brecha crítica",
    tone: "rose",
    color: "#be123c",
    softColor: "rgba(244, 63, 94, 0.16)",
  };
}

function listInline(items: string[]): string {
  if (items.length === 0) return "sin datos suficientes";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function topCompetencies(
  scores: DiscoveryScoreResult,
  pillar?: DiscoveryPillarKey,
) {
  const pool = pillar
    ? scores.compList.filter((item) => item.pillar === pillar)
    : scores.compList;
  return [...pool].sort((left, right) => right.score - left.score);
}

function bottomCompetencies(
  scores: DiscoveryScoreResult,
  pillar?: DiscoveryPillarKey,
) {
  const pool = pillar
    ? scores.compList.filter((item) => item.pillar === pillar)
    : scores.compList;
  return [...pool].sort((left, right) => left.score - right.score);
}

function describeGap(name: string): string {
  return COMP_DEFINITIONS[name] ?? "Competencia clave del modelo 4Shine.";
}

function describeGapBullets(items: string[]): string {
  return items
    .map((item) => `- **${item}**: ${describeGap(item)}`)
    .join("\n");
}

function buildPriorityNarrative(
  scores: DiscoveryScoreResult,
  pillar: DiscoveryPillarKey,
): string {
  const metric = scores.pillarMetrics[pillar];
  const status = getDiscoveryStatus(metric.total);
  const gap = bottomCompetencies(scores, pillar)
    .slice(0, 2)
    .map((item) => item.name);
  const strength = topCompetencies(scores, pillar)
    .slice(0, 2)
    .map((item) => item.name);
  const balanceGap = Math.abs(metric.likert - metric.sjt);
  const balanceNote =
    balanceGap >= 15
      ? `Hoy hay una diferencia visible entre lo que percibes de ti y lo que aparece en el juicio situacional (${metric.likert}% vs ${metric.sjt}%). Esa brecha sugiere que conviene aterrizar la intención en conducta observable.`
      : `Tu autopercepción y tu criterio situacional se mueven en una banda relativamente coherente (${metric.likert}% vs ${metric.sjt}%), lo que da una base estable para acelerar este pilar.`;

  return [
    `## Lectura del pilar`,
    `${PILLAR_INFO[pillar].title} hoy aparece en nivel **${status.label.toLowerCase()}** con un resultado de **${metric.total}%**. Tus señales más favorables están en ${listInline(strength)}, mientras que conviene priorizar ${listInline(gap)} para destrabar el siguiente salto.`,
    "",
    `## Lo que ya sostiene este pilar`,
    `Las fortalezas visibles en ${listInline(strength)} muestran que no partes de cero. Ya cuentas con recursos internos para mover decisiones, conversaciones o hábitos dentro de este frente.`,
    "",
    `## Puntos críticos de atención`,
    describeGapBullets(gap),
    "",
    balanceNote,
    "",
    `## Intervención táctica`,
    PILLAR_ROUTINES[pillar].actions
      .slice(0, 3)
      .map((action, index) => `${index + 1}. ${action}`)
      .join("\n"),
    "",
    `## Señal de progreso`,
    PILLAR_ROUTINES[pillar].signal,
  ].join("\n");
}

export function buildDiscoveryReport(
  filter: DiscoveryReportFilter,
  state: DiscoveryUserState,
  scores: DiscoveryScoreResult,
): string {
  if (filter !== "all") {
    return buildPriorityNarrative(scores, filter);
  }

  const globalStatus = getDiscoveryStatus(scores.globalIndex);
  const topPillar = (
    Object.entries(scores.pillarMetrics) as [
      DiscoveryPillarKey,
      DiscoveryScoreResult["pillarMetrics"][DiscoveryPillarKey],
    ][]
  ).sort((left, right) => right[1].total - left[1].total)[0];
  const priorityPillar = (
    Object.entries(scores.pillarMetrics) as [
      DiscoveryPillarKey,
      DiscoveryScoreResult["pillarMetrics"][DiscoveryPillarKey],
    ][]
  ).sort((left, right) => left[1].total - right[1].total)[0];
  const strengths = topCompetencies(scores).slice(0, 4).map((item) => item.name);
  const gaps = bottomCompetencies(scores).slice(0, 4).map((item) => item.name);

  return [
    "## Tu perfil estratégico",
    `${state.name}, tu lectura actual se ubica en **${scores.globalIndex}%** y hoy refleja un nivel **${globalStatus.label.toLowerCase()}**. La combinación entre ${listInline(strengths.slice(0, 2))} y ${listInline(gaps.slice(0, 2))} muestra un liderazgo con capacidad real de avance, pero todavía con frentes que requieren método y consistencia.`,
    "",
    `Tu pilar más sólido hoy es **${PILLAR_INFO[topPillar[0]].title}** (${topPillar[1].total}%) y tu frente más sensible está en **${PILLAR_INFO[priorityPillar[0]].title}** (${priorityPillar[1].total}%). Esa combinación te dice dónde apalancarte y dónde concentrar la energía del próximo ciclo.`,
    "",
    "## Lo que hoy ya te impulsa",
    describeGapBullets(strengths.slice(0, 3)),
    "",
    "## Riesgos visibles",
    describeGapBullets(gaps.slice(0, 3)),
    "",
    "## Plan de aceleración de 30 días",
    `1. Dedica el foco principal a **${PILLAR_INFO[priorityPillar[0]].title}**. No intentes mover todo al tiempo; el progreso sostenible aparece cuando priorizas un frente y lo conviertes en disciplina semanal.`,
    `2. Usa tu fortaleza en **${PILLAR_INFO[topPillar[0]].title}** para sostener el cambio. Lo que ya haces bien debe convertirse en plataforma para abordar ${listInline(gaps.slice(0, 2))}.`,
    `3. Revisa cada semana una situación concreta donde se haya puesto a prueba tu liderazgo y pregúntate qué decisión, conversación o hábito habría elevado el estándar.`,
    "",
    "## Señal que conviene observar",
    `Vas en la dirección correcta cuando tu criterio no depende solo de la intención. La mejora real se ve cuando cambian tus conversaciones, tus decisiones y la manera en que otros experimentan tu liderazgo.`,
  ].join("\n");
}

export function buildDiscoveryReports(
  state: DiscoveryUserState,
  scores: DiscoveryScoreResult,
): Record<DiscoveryReportFilter, string> {
  return {
    all: buildDiscoveryReport("all", state, scores),
    within: buildDiscoveryReport("within", state, scores),
    out: buildDiscoveryReport("out", state, scores),
    up: buildDiscoveryReport("up", state, scores),
    beyond: buildDiscoveryReport("beyond", state, scores),
  };
}
