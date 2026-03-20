"use client"
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, FileText, Lock, Plus, Printer, X, Trash2 } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WB1IdentificationFields = {
    leaderName: string
    role: string
    cohort: string
    startDate: string
}

type StoryEventType = 'logro' | 'logro-golpe' | 'golpe'

type StoryEvent = {
    id: string
    type: StoryEventType
    approxDate: string
    happened: string
    interpreted: string
    learned: string
    belief: string
}

type StoryPageFields = {
    timelineRange: string
    actOrigin: string
    actBreak: string
    actRebuild: string
    patternDecision: string[]
    patternTrigger: string[]
    patternResource: string[]
}

type StoryEventDraft = Omit<StoryEvent, 'id'>
type StoryActHelpKey = 'acto1' | 'acto2' | 'acto3'
type StoryActFieldKey = 'actOrigin' | 'actBreak' | 'actRebuild'
type StoryTextFieldKey = 'timelineRange' | 'actOrigin' | 'actBreak' | 'actRebuild'
type PatternListKey = 'patternDecision' | 'patternTrigger' | 'patternResource'
type IdentitySegmentKey = 'roles' | 'principios' | 'presion' | 'calma' | 'aporte' | 'evito' | 'triggers' | 'recursos'

type StoryActGuide = {
    helpKey: StoryActHelpKey
    fieldKey: StoryActFieldKey
    title: string
    guidingQuestions: string[]
    example: string
}

type PatternListConfig = {
    key: PatternListKey
    title: string
    example: string
}

type IdentitySegmentConfig = {
    key: IdentitySegmentKey
    title: string
    color: string
}

type IdentityMatrixFieldKey = 'say' | 'do' | 'impact'

type IdentityMatrixRow = {
    say: string
    do: string
    impact: string
}

type StakeholderFieldKey = 'personRole' | 'strength' | 'blindspot'

type StakeholderRow = {
    personRole: string
    strength: string
    blindspot: string
}

type FundamentalValuesFields = {
    selected10: string[]
    selected5: string[]
    selected3: string[]
}

type ValueDecisionFieldKey = 'decision1' | 'decision2'

type ValueDecisionRow = {
    value: string
    decision1: string
    decision2: string
}

type NoNegotiableFieldKey = 'behavior' | 'implication'

type NoNegotiableRow = {
    value: string
    behavior: string
    implication: string
}

type FoaQuadrantKey = 'strengths' | 'opportunities' | 'threats'

type FoaQuadrantConfig = {
    key: FoaQuadrantKey
    title: string
    containerClassName: string
}

type EnergySign = '' | '+' | '-'

type EnergyAdjust = '' | 'Más' | 'Menos' | 'Rediseñar'

type EnergyMapFieldKey = 'activity' | 'sign' | 'energy' | 'reason' | 'adjust'

type EnergyMapRow = {
    activity: string
    sign: EnergySign
    energy: string
    reason: string
    adjust: EnergyAdjust
}

type BeliefAbcFieldKey = 'activator' | 'belief' | 'emotion' | 'action'

type BeliefAbcRow = {
    activator: string
    belief: string
    emotion: string
    action: string
}

type BeliefEvidenceFieldKey = 'limitingBelief' | 'evidenceFor' | 'evidenceAgainst' | 'newMeaning'

type BeliefEvidenceRow = {
    limitingBelief: string
    evidenceFor: string
    evidenceAgainst: string
    newMeaning: string
}

type BeliefImpactAffectedRow = {
    person: string
    impact: string
}

type EmpoweringBeliefFieldKey = 'limitingBelief' | 'idealBelief' | 'bridgeBelief'

type EmpoweringBeliefRow = {
    limitingBelief: string
    idealBelief: string
    bridgeBelief: string
}

type BridgeExperimentFieldKey = 'bridgeBelief' | 'dailyBehavior' | 'evidence' | 'indicator'

type BridgeExperimentRow = {
    bridgeBelief: string
    dailyBehavior: string
    evidence: string
    indicator: string
}

type MantraCardFieldKey = 'mantra' | 'situation' | 'behavior' | 'signal'

type MantraCardRow = {
    mantra: string
    situation: string
    behavior: string
    signal: string
}

type FutureSelfBlockKey =
    | 'identity'
    | 'values'
    | 'habits'
    | 'decisions'
    | 'skills'
    | 'environment'
    | 'impact'
    | 'metrics'
    | 'risks'

type FutureSelfListBlockKey = 'identity' | 'values' | 'habits' | 'decisions' | 'skills' | 'metrics'

type FutureSelfEnvironmentFieldKey = 'surround' | 'eliminate' | 'protect'

type FutureSelfImpactFieldKey = 'serve' | 'transform' | 'result'

type FutureSelfRiskFieldKey = 'risk' | 'prevention'

type FutureSelfRiskRow = {
    risk: string
    prevention: string
}

type BackcastingPeriodKey = 'year10' | 'year3' | 'year1' | 'days30'

type BackcastingFieldKey = 'achievement' | 'habit' | 'evidence'

type BackcastingRow = {
    achievement: string
    habit: string
    evidence: string
}

type FutureLetterChecklistKey = 'nonNegotiables' | 'habit' | 'decision' | 'impact'

type FutureLetterChecklist = Record<FutureLetterChecklistKey, boolean>

type MentorCriterionLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'

type MentorCriterionDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'

type MentorCriterionFieldKey = 'level' | 'evidence' | 'decision'

type MentorCriterionRow = {
    criterion: string
    level: MentorCriterionLevel
    evidence: string
    decision: MentorCriterionDecision
}

type LeaderEvaluationFieldKey = 'response' | 'evidence' | 'action'

type LeaderEvaluationRow = {
    question: string
    response: string
    evidence: string
    action: string
}

type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'

type FutureSelfFields = {
    identity: string[]
    values: string[]
    habits: string[]
    decisions: string[]
    skills: string[]
    environment: {
        surround: string
        eliminate: string
        protect: string
    }
    impact: {
        serve: string
        transform: string
        result: string
    }
    metrics: string[]
    risks: FutureSelfRiskRow[]
}

type PageItem = {
    id: number
    label: string
    shortLabel: string
}

const ID_STORAGE_KEY = 'workbooks-v2-wb1-identification'
const STORY_FIELDS_STORAGE_KEY = 'workbooks-v2-wb1-story-fields'
const STORY_EVENTS_STORAGE_KEY = 'workbooks-v2-wb1-story-events'
const IDENTITY_WHEEL_STORAGE_KEY = 'workbooks-v2-wb1-identity-wheel'
const IDENTITY_MATRIX_STORAGE_KEY = 'workbooks-v2-wb1-identity-matrix'
const STAKEHOLDER_MIRROR_STORAGE_KEY = 'workbooks-v2-wb1-stakeholder-mirror'
const FUNDAMENTAL_VALUES_STORAGE_KEY = 'workbooks-v2-wb1-fundamental-values'
const VALUE_DECISIONS_STORAGE_KEY = 'workbooks-v2-wb1-value-decisions'
const NO_NEGOTIABLE_PHRASES_STORAGE_KEY = 'workbooks-v2-wb1-no-negotiable-phrases'
const FOA_STORAGE_KEY = 'workbooks-v2-wb1-foa'
const ENERGY_MAP_STORAGE_KEY = 'workbooks-v2-wb1-energy-map'
const BELIEF_ABC_STORAGE_KEY = 'workbooks-v2-wb1-belief-abc'
const BELIEF_EVIDENCE_STORAGE_KEY = 'workbooks-v2-wb1-belief-evidence'
const BELIEF_IMPACT_STORAGE_KEY = 'workbooks-v2-wb1-belief-impact'
const EMPOWERING_BELIEF_STORAGE_KEY = 'workbooks-v2-wb1-empowering-beliefs'
const BRIDGE_EXPERIMENT_STORAGE_KEY = 'workbooks-v2-wb1-bridge-experiment'
const MANTRA_CARDS_STORAGE_KEY = 'workbooks-v2-wb1-mantras'
const FUTURE_SELF_STORAGE_KEY = 'workbooks-v2-wb1-future-self'
const BACKCASTING_STORAGE_KEY = 'workbooks-v2-wb1-backcasting'
const FUTURE_LETTER_STORAGE_KEY = 'workbooks-v2-wb1-future-letter'
const EVALUATION_MENTOR_STORAGE_KEY = 'workbooks-v2-wb1-evaluation-mentor'
const EVALUATION_LEADER_STORAGE_KEY = 'workbooks-v2-wb1-evaluation-leader'
const EVALUATION_SYNTHESIS_STORAGE_KEY = 'workbooks-v2-wb1-evaluation-synthesis'

const STORY_EVENT_LIMIT = 5
const PATTERN_LIST_LIMIT = 10
const IDENTITY_BULLET_LIMIT = 3
const IDENTITY_MATRIX_ROWS = 10
const STAKEHOLDER_ROWS = 3
const VALUE_DECISION_ROWS = 5
const NO_NEGOTIABLE_ROWS = 3
const FOA_BULLET_LIMIT = 5
const ENERGY_MAP_ROWS = 20
const ENERGY_PATTERN_BULLETS = 3
const BELIEF_ABC_ROWS = 3
const BELIEF_EVIDENCE_ROWS = 5
const BELIEF_IMPACT_BULLETS = 5
const BELIEF_IMPACT_AFFECTED_ROWS = 3
const EMPOWERING_BELIEF_ROWS = 3
const BRIDGE_EXPERIMENT_ROWS = 3
const MANTRA_ROWS = 3
const FUTURE_SELF_IDENTITY_ROWS = 2
const FUTURE_SELF_VALUES_ROWS = 3
const FUTURE_SELF_HABITS_ROWS = 5
const FUTURE_SELF_DECISIONS_ROWS = 3
const FUTURE_SELF_SKILLS_ROWS = 3
const FUTURE_SELF_METRICS_ROWS = 3
const FUTURE_SELF_RISK_ROWS = 3
const BACKCASTING_ROWS = 4
const MENTOR_CRITERIA_ROWS = 5
const LEADER_EVALUATION_ROWS = 7
const IDENTITY_WHEEL_SIZES = [620, 760, 920] as const

const PAGES: PageItem[] = [
    { id: 1, label: '1. Portada', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Storytelling personal', shortLabel: 'Storytelling' },
    { id: 4, label: '4. Definición de identidad actual', shortLabel: 'Identidad' },
    { id: 5, label: '5. Valores fundamentales', shortLabel: 'Valores' },
    { id: 6, label: '6. Fortalezas y áreas de oportunidad', shortLabel: 'FOA' },
    { id: 7, label: '7. Creencias limitantes (PNL)', shortLabel: 'Creencias PNL' },
    { id: 8, label: '8. Nuevas creencias empoderadoras', shortLabel: 'Empoderadoras' },
    { id: 9, label: '9. Mantras personales', shortLabel: 'Mantras' },
    { id: 10, label: '10. Identidad futura 10X', shortLabel: 'Futuro 10X' },
    { id: 11, label: '11. Evaluación', shortLabel: 'Evaluación' }
]

const OBJECTIVE_OUTCOMES = [
    'Tu historia personal resumida en una narrativa clara (sin victimismo ni épica vacía).',
    'Una identidad actual definida con hechos (no con adjetivos).',
    'Tus valores fundamentales priorizados y tus no negociables explícitos.',
    'Un mapa de fortalezas y áreas de oportunidad con evidencia reciente.',
    'Un inventario de creencias limitantes (y su origen) y su reemplazo por creencias empoderadoras.',
    'Mantras personales diseñados para sostener conducta bajo presión.',
    'Tu identidad futura 10X (visión, hábitos y decisiones) y un primer plan de activación.'
]

const WORKBOOK_COMPONENTS = [
    'Identidad y coherencia personal',
    'Valores y principios no negociables',
    'Sistema de creencias (mindset)',
    'Reflexión y aprendizaje (autoconciencia)'
]

const FOURSHINE_COMPETENCIES = [
    'Gestión de creencias (mindset)',
    'Integridad y coherencia',
    'Responsabilidad radical (accountability)',
    'Autenticidad',
    'Práctica reflexiva y apertura al feedback',
    'Claridad de propósito y valores (Ikigai como marco)'
]

const OBSERVABLE_BEHAVIORS = [
    'Coherencia: tomas decisiones alineadas con tus valores incluso bajo presión.',
    'Accountability: asumes públicamente tu parte cuando algo falla y defines correcciones concretas.',
    'Mindset: identificas una creencia limitante, la cuestionas y ejecutas un reemplazo conductual.',
    'Autenticidad: sostienes tu estilo sin máscara corporativa y sin perder firmeza.',
    'Reflexión: conviertes experiencias en aprendizaje (registras, sintetizas y ajustas conducta).'
]

const RESPONSE_RULES = [
    'Responde con bullets concretos.',
    'Si puedes, agrega un ejemplo corto (1 línea) por bullet.',
    'No uses adjetivos ("muy intenso"), usa comportamiento ("microgestión", "evito conversar", "me cierro").'
]

const STEP1_IDENTIFICATION_POINTS = ['5 momentos clave', '3 golpes / crisis / quiebres', '3 logros (no solo "éxitos"; también superaciones)']

const EVENT_TEMPLATE_FIELDS = [
    'Tipo',
    'Fecha aproximada',
    'Qué ocurrió (hecho)',
    'Qué decidí / interpreté',
    'Qué aprendí',
    'Qué creencia se instaló'
]

const STEP2_DISCOVERY_ACTS = [
    'Acto 1 (origen): qué identidad se formó',
    'Acto 2 (quiebre): qué creencia fue desafiada',
    'Acto 3 (reconstrucción): qué nueva versión tuya emergió'
]

const STEP2_WRITING_RULES = [
    '10-15 líneas por acto (no más).',
    'Escribe en primera persona (Yo...) y en hechos, no solo emociones.',
    'En cada acto incluye 3 elementos obligatorios: contexto (dónde/época/rol), escena clave (qué pasó), efecto en ti (qué cambió: decisión, creencia, comportamiento).'
]

const STEP3_EXAMPLES: PatternListConfig[] = [
    {
        key: 'patternDecision',
        title: '1. Patrón que se repite en mis decisiones',
        example: 'Bajo presión priorizo control y velocidad sobre conversación (cierro rápido).'
    },
    {
        key: 'patternTrigger',
        title: '2. Situación que más activa miedo/defensa',
        example: 'Crítica o cuestionamiento público (especialmente frente a equipo o dirección).'
    },
    {
        key: 'patternResource',
        title: '3. Mi recurso más consistente',
        example: 'Capacidad de análisis + disciplina para ejecutar (cuando ordeno el problema, avanzo).'
    }
]

const IDENTITY_SEGMENTS: IdentitySegmentConfig[] = [
    { key: 'roles', title: 'Roles clave (líder, padre/madre, profesional, etc.)', color: '#dbeafe' },
    { key: 'principios', title: 'Principios (lo que NO negocias)', color: '#e0e7ff' },
    { key: 'presion', title: 'Estilo bajo presión', color: '#fef3c7' },
    { key: 'calma', title: 'Estilo en calma', color: '#dcfce7' },
    { key: 'aporte', title: 'Lo que aportas (valor)', color: '#cffafe' },
    { key: 'evito', title: 'Lo que evitas', color: '#fee2e2' },
    { key: 'triggers', title: 'Lo que te dispara (triggers)', color: '#fde68a' },
    { key: 'recursos', title: 'Lo que te sostiene (recursos)', color: '#ddd6fe' }
]

const IDENTITY_MATRIX_INSTRUCTIONS = [
    'Escribe frases reales que tú dices como líder (promesas, principios, mensajes frecuentes).',
    'En "Lo que hago", registra hechos recientes (últimos 20-30 días): qué hiciste/dijiste, con quién, en qué contexto.',
    'En "Impacto", escribe el efecto observable en otras personas (conducta, clima, confianza, resultados).',
    'Si hay incoherencia, no la justifiques: solo descríbela. Ahí está el trabajo.'
]

const STAKEHOLDER_MIRROR_INSTRUCTIONS = [
    'Elige 3 personas (idealmente de roles distintos): 1 jefe/sponsor, 1 par/colega y 1 colaborador/alguien a quien lideras.',
    'Para cada persona, escribe tu hipótesis en 2 frases: "Mi fortaleza, según esta persona, sería..." y "Mi punto ciego, según esta persona, sería...".',
    'Sé concreto: describe conductas, no adjetivos.'
]

const VALUE_DECISION_INSTRUCTIONS = [
    'Para cada valor seleccionado previamente como más determinante, escribe 2 decisiones recientes (últimos 20-40 días) que lo demuestren.',
    'Regla: una decisión debe ser observable: elegiste, priorizaste, dijiste no, actuaste, corregiste, conversaste.'
]

const NO_NEGOTIABLE_INSTRUCTIONS = [
    'Para cada uno de tus 3 valores no negociables, completa esta frase: "Bajo presión, yo NO ______ aunque eso implique ______."',
    'Regla: el primer espacio debe ser un comportamiento concreto (no un valor abstracto).'
]

const FOA_INSTRUCTIONS = [
    'Completa cada sección con bullets concretos (máx. 5 por sección).',
    'Escribe hechos o situaciones observables, no adjetivos vagos.',
    'Si puedes, añade una evidencia breve (proyecto, fecha, resultado).',
    'Fortalezas = internas (lo que ya tienes y funciona).',
    'Áreas de oportunidad = externas o potenciales (dónde crecer o capturar valor).',
    'Amenazas = externas (riesgos que pueden frenarte).'
]

const ENERGY_MAP_INSTRUCTIONS = [
    'Lista tus actividades típicas de una semana (mínimo 12, máximo 20).',
    'Marca cada actividad con: + si te carga (te da energía); - si te drena (te consume).',
    'Asigna Energía 0-10 para mayor precisión.',
    'Escribe el por qué (causa concreta).',
    'Define el ajuste: Más / Menos / Rediseñar.',
    'Rediseñar = cambiar cómo la haces (duración, horario, con quién, formato), no eliminarla.'
]

const ENERGY_ADJUST_OPTIONS: EnergyAdjust[] = ['', 'Más', 'Menos', 'Rediseñar']

const BELIEF_ABC_INSTRUCTIONS = [
    'Completa el modelo para 3 situaciones reales recientes (últimos 20-30 días).',
    'A (Activador): qué pasó (hecho observable, sin interpretación).',
    'B (Belief / Creencia): qué te dijiste en ese momento (frase interna).',
    'C (Consecuencia): qué sentiste (emoción + intensidad 0-10) y qué hiciste (conducta observable).',
    'Regla: en A no escribas opiniones. En C describe conducta: tono, palabras, decisión, silencio, control, etc.'
]

const BELIEF_EVIDENCE_INSTRUCTIONS = [
    'Escribe una creencia limitante (en primera persona, como pensamiento automático).',
    'Registra evidencia a favor (hechos reales que parecen confirmarla).',
    'Registra evidencia en contra (hechos reales que la contradicen).',
    'Escribe un nuevo significado posible (reencuadre creíble, no positivo vacío).',
    'Regla: evidencia = hechos observables (situación, fecha aproximada, resultado). No opiniones.'
]

const BELIEF_IMPACT_INSTRUCTIONS = [
    'Elige 1 creencia limitante (la más relevante) y responde con bullets concretos.',
    'No expliques por qué; describe costos, oportunidades perdidas y afectados.'
]

const EMPOWERING_BELIEF_INSTRUCTIONS = [
    'Escribe tu creencia limitante tal como aparece en tu mente.',
    'Escribe una creencia ideal (tu versión más alta).',
    'Crea una creencia puente: debe ser creíble hoy y accionable (algo que puedas probar con conducta).',
    'Regla: la creencia puente no suena perfecta; suena realista y ejecutable.'
]

const BRIDGE_EXPERIMENT_INSTRUCTIONS = [
    'Para cada nueva creencia empoderadora (o creencia puente), diseña un experimento de 7 días.',
    'El objetivo es probarla con conducta, no repetirla mentalmente.',
    'La conducta debe ser mínima (5-10 min) y diaria.',
    'La evidencia debe ser observable (mensaje enviado, conversación realizada, registro hecho, decisión tomada).',
    'El indicador debe ser medible (conteo o escala 0-10).'
]

const MANTRA_INSTRUCTIONS = [
    'Propósito: crear frases cortas que activen tu identidad cuando el contexto te presiona.',
    'Fórmula recomendada: “Yo soy + acción + valor + impacto”.'
]

const MANTRA_EXAMPLES = [
    '“Yo soy un líder que decide con integridad y protege la confianza.”',
    '“Yo soy un líder que aprende rápido y convierte errores en mejora.”'
]

const MANTRA_SIGNAL_HINT = 'Ejemplos rápidos: alarma, nota en pantalla, sticker, fondo de pantalla, pulsera, post-it.'

const FUTURE_SELF_INSTRUCTIONS = [
    'Propósito: diseñar quién serás, no solo lo que lograrás.',
    'Regla: escribe en presente (como si ya fueras tu versión 10X).',
    'Completa cada bloque con bullets y hechos concretos.'
]

const FUTURE_SELF_BLOCK_ORDER: FutureSelfBlockKey[] = [
    'identity',
    'values',
    'habits',
    'decisions',
    'skills',
    'environment',
    'impact',
    'metrics',
    'risks'
]

const BACKCASTING_PERIODS: Array<{ key: BackcastingPeriodKey; label: string; shortLabel: string }> = [
    { key: 'year10', label: 'Año 10', shortLabel: 'Año 10' },
    { key: 'year3', label: 'Año 3', shortLabel: 'Año 3' },
    { key: 'year1', label: 'Año 1', shortLabel: 'Año 1' },
    { key: 'days30', label: 'Próximos 30 días', shortLabel: '30 días' }
]

const BACKCASTING_INSTRUCTIONS = [
    'Dibuja una línea hacia atrás: Año 10 -> Año 3 -> Año 1 -> Próximos 30 días.',
    'En cada punto define 3 cosas: logro, hábito y evidencia concreta.'
]

const FUTURE_LETTER_WORD_MIN = 500
const FUTURE_LETTER_WORD_MAX = 700

const FUTURE_LETTER_INSTRUCTIONS = [
    'Escribe una carta de 1 página comenzando así: “Hoy te escribo desde mi identidad 10X... Esto fue lo que dejé de negociar...”.',
    'Incluye obligatoriamente: qué dejaste de negociar (3 bullets), qué hábito te transformó, qué decisión marcó el cambio y qué impacto estás generando.'
]

const FUTURE_LETTER_EXAMPLE = `Hoy te escribo desde mi identidad 10X. No llegué aquí por suerte: llegué por coherencia. Hubo un momento en que entendí que mi vida y mi liderazgo no podían seguir siendo negociables según el contexto. Esto fue lo que dejé de negociar:
• Mi integridad: no maquillo información ni tomo atajos éticos, incluso si eso me cuesta aprobación o velocidad.
• Mi energía y salud: no vivo en modo urgencia permanente; protejo descanso, foco y recuperación como parte del trabajo.
• El respeto en la conversación: no elevo el tono ni cierro por control; sostengo firmeza con calma y escucha.
El hábito que me transformó fue simple pero decisivo: dos bloques diarios de trabajo profundo (sin interrupciones) y una pausa de 20 segundos antes de responder bajo presión. Ese hábito me devolvió claridad mental, bajó mi reactividad y elevó la calidad de mis decisiones. Dejé de reaccionar para “salvar el día” y empecé a construir semana a semana.
La decisión que marcó el cambio fue concreta: renuncié a decir “sí” a urgencias no críticas y empecé a delegar ejecución con criterios claros, aunque al inicio me diera miedo “perder control”. La primera vez que lo hice, sentí incomodidad, pero también libertad. Entendí que mi rol no era demostrar que podía con todo, sino crear condiciones para que el equipo funcionara sin depender de mí.
Hoy mi impacto se ve en a quién sirvo: lidero y acompaño a personas y equipos que necesitan claridad, confianza y dirección para crecer. Sirvo a líderes que quieren ser consistentes, no perfectos; a equipos que quieren autonomía real; a organizaciones que buscan resultados sostenibles sin quemar a su gente. Mi trabajo ya no es solo entregar: es instalar capacidades, elevar conversaciones y dejar estructuras que siguen funcionando cuando yo no estoy.`

const FUTURE_LETTER_CHECK_LABELS: Record<FutureLetterChecklistKey, string> = {
    nonNegotiables: 'Incluye 3 bullets de no negociables',
    habit: 'Menciona el hábito clave que te transformó',
    decision: 'Menciona una decisión concreta de cambio',
    impact: 'Menciona el impacto y a quién sirves'
}

const MENTOR_EVALUATION_INSTRUCTIONS = [
    'Evalúa con evidencia observable (ideal: últimos 20 días).',
    'Marca un solo nivel por criterio (N1-N4).',
    'Registra comentario/evidencia observable y define decisión por criterio.',
    'Cierra con observaciones generales y decisión global.',
    'Si falta evidencia, puedes escribir “Completar”.'
]

const MENTOR_CRITERIA = [
    'Coherencia entre discurso y decisiones',
    'Identificación real de creencias limitantes',
    'Nivel de responsabilidad asumida',
    'Claridad en valores no negociables',
    'Evidencia de cambio conductual inicial'
] as const

const MENTOR_LEVEL_OPTIONS: MentorCriterionLevel[] = ['N1', 'N2', 'N3', 'N4']

const MENTOR_DECISION_OPTIONS: MentorCriterionDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']

const MENTOR_LEVEL_INDICATORS = [
    'N1 Declarativo: describe conceptos sin ejemplos verificables; justifica incoherencias.',
    'N2 Consciente: reconoce contradicciones; cambio frágil bajo presión.',
    'N3 Integrado: muestra decisiones reales alineadas con identidad/valores.',
    'N4 Alineación estratégica: coherencia sostenida incluso bajo presión; modela para otros.'
]

const LEADER_EVALUATION_INSTRUCTIONS = [
    'Responde desde hechos recientes, no desde intención.',
    'Incluye al menos 1 evidencia por respuesta.',
    'Define una acción/compromiso de 30 días por pregunta.',
    'Usa este bloque para acordar tu plan con el iShine.'
]

const LEADER_EVALUATION_QUESTIONS = [
    '¿Qué creencia limitante identifiqué que estaba afectando mi liderazgo?',
    '¿Dónde sigo negociando mis valores bajo presión?',
    '¿Qué decisión reciente demuestra mayor coherencia interna?',
    '¿Qué resistencia interna aún no logro transformar?',
    '¿Qué conversación evité por miedo a sostener mi identidad?',
    '¿Qué patrón repetitivo revela incoherencia entre lo que digo y lo que hago?',
    '¿Qué decisión estratégica futura pondrá a prueba mis valores?'
] as const

const LEADER_HELP_EXAMPLES: Array<{ response: string; evidence: string; action: string }> = [
    {
        response: '“Identifiqué la creencia: si pido apoyo pierdo autoridad.”',
        evidence: '“En comité del 12 mar evité pedir contexto y luego rehice el entregable.”',
        action: '“Durante 30 días pediré 1 apoyo específico por semana y registraré resultado.”'
    },
    {
        response: '“Sigo negociando la transparencia cuando hay presión por resultados.”',
        evidence: '“En la reunión X omití un riesgo para evitar fricción.”',
        action: '“Cada semana registraré 1 riesgo clave y lo comunicaré en la reunión de seguimiento.”'
    },
    {
        response: '“Una decisión reciente fue decir no a un plazo inviable y renegociar alcance.”',
        evidence: '“Correo del 21 feb con nuevo acuerdo y aprobación del sponsor.”',
        action: '“Aplicaré este criterio en cada planificación semanal del próximo mes.”'
    },
    {
        response: '“Aún me cuesta tolerar el desacuerdo en público sin acelerar el cierre.”',
        evidence: '“En sesión del equipo interrumpí dos veces para cerrar rápido.”',
        action: '“Practicaré una pausa de 20 segundos antes de responder en reuniones críticas.”'
    },
    {
        response: '“Evité una conversación de feedback con un par por temor a conflicto.”',
        evidence: '“Tenía la reunión pendiente desde hace 3 semanas y la reprogramé dos veces.”',
        action: '“Agendaré esa conversación esta semana con guion de hechos + pedido claro.”'
    },
    {
        response: '“Repito el patrón de prometer velocidad y luego microgestionar ejecución.”',
        evidence: '“En sprint pasado revisé tareas delegadas tres veces por día.”',
        action: '“Definiré 2 puntos de control semanales en lugar de seguimiento diario.”'
    },
    {
        response: '“La decisión futura será priorizar integridad de datos sobre urgencia comercial.”',
        evidence: '“Caso reciente: rechacé ajustar cifras sin trazabilidad y propuse alternativa.”',
        action: '“En 30 días aplicaré checklist ético antes de cerrar reportes sensibles.”'
    }
]

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - iShine' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const FOA_QUADRANTS: FoaQuadrantConfig[] = [
    {
        key: 'strengths',
        title: 'Fortalezas',
        containerClassName: 'border-emerald-200 bg-emerald-50'
    },
    {
        key: 'opportunities',
        title: 'Áreas de oportunidad',
        containerClassName: 'border-amber-200 bg-amber-50'
    },
    {
        key: 'threats',
        title: 'Amenazas',
        containerClassName: 'border-red-200 bg-red-50'
    }
]

const FUNDAMENTAL_VALUES = [
    'Integridad',
    'Honestidad',
    'Responsabilidad',
    'Coherencia',
    'Justicia',
    'Respeto',
    'Humildad',
    'Valentía',
    'Disciplina',
    'Excelencia',
    'Servicio',
    'Impacto',
    'Contribución',
    'Compasión',
    'Empatía',
    'Lealtad',
    'Confianza',
    'Transparencia',
    'Autonomía',
    'Libertad',
    'Seguridad',
    'Estabilidad',
    'Aprendizaje',
    'Crecimiento',
    'Innovación',
    'Creatividad',
    'Colaboración',
    'Familia',
    'Bienestar',
    'Espiritualidad / Sentido'
] as const

const STEP2_ACT_GUIDES: StoryActGuide[] = [
    {
        helpKey: 'acto1',
        fieldKey: 'actOrigin',
        title: 'Acto 1 - Origen (qué te formó)',
        guidingQuestions: [
            '¿Qué tipo de entorno me moldeó (familia, escuela, trabajo, cultura)?',
            '¿Qué reglas no escritas aprendí?',
            '¿Qué gané con esas reglas? ¿Qué me costaron?'
        ],
        example:
            'Crecí aprendiendo que el valor personal se demuestra con resultados y responsabilidad. Desde temprano asumí tareas "de adulto": resolver, responder, no fallar. En la universidad y luego en el trabajo, reforcé esa idea: si entregaba rápido y bien, ganaba confianza y espacio. Empecé a construir una identidad de "persona confiable", pero con una condición: casi no pedía ayuda. Me acostumbré a llevar carga extra para evitar exponer dudas. Con el tiempo, ese patrón se volvió una marca: eficiencia, cumplimiento y control del detalle. La regla interna era clara: "si no tengo certeza, mejor lo resuelvo yo". Esa forma de operar me dio reputación y crecimiento, pero también me entrenó en silencio, autosuficiencia y presión interna.'
    },
    {
        helpKey: 'acto2',
        fieldKey: 'actBreak',
        title: 'Acto 2 - Quiebre (qué me confrontó)',
        guidingQuestions: [
            '¿Qué evento o etapa me mostró que mi manera de operar ya no funcionaba?',
            '¿Qué emoción dominó? ¿Qué perdí o arriesgué?',
            '¿Qué parte de mí quedó en evidencia (miedo, control, orgullo, inseguridad)?'
        ],
        example:
            'Cuando asumí un rol con mayor visibilidad, ya no bastaba con trabajar duro: tenía que coordinar, delegar y sostener conversaciones difíciles. En una reunión importante, un par cuestionó mi propuesta frente a otros y sentí que mi autoridad estaba en juego. Reaccioné defendiendo mi punto con rigidez, cerrando el debate. El equipo se volvió silencioso y al final la decisión no fue mejor, solo fue más rápida. Ahí entendí el quiebre: mi necesidad de control y de "no verme vulnerable" estaba dañando la colaboración. En lugar de construir confianza, estaba construyendo distancia. Me confrontó una verdad incómoda: el liderazgo no se mide por tener siempre la razón, sino por elevar la calidad de las decisiones y del equipo. Ese día vi mi patrón: bajo presión, me cerraba.'
    },
    {
        helpKey: 'acto3',
        fieldKey: 'actRebuild',
        title: 'Acto 3 - Reconstrucción (qué me redefinió)',
        guidingQuestions: [
            '¿Qué decisión tomé después del quiebre?',
            '¿Qué habilidad o virtud desarrollé?',
            '¿Qué nueva identidad empezó a aparecer? (no perfecta, pero real)'
        ],
        example:
            'Después de ese episodio decidí aprender a pausar, preguntar y pedir apoyo de forma específica. Empecé a preparar reuniones con claridad, pero abriendo espacio para perspectivas distintas. Practiqué decir: "No lo tengo completo, necesito tu mirada en esto". También aprendí a separar "ser cuestionado" de "ser desautorizado". En vez de responder para ganar, empecé a responder para construir. Descubrí una nueva forma de firmeza: calma, claridad y escucha. Aún me cuesta cuando siento crítica pública, pero ahora lo veo como un disparador y no como una amenaza absoluta. Me redefiní desde una idea distinta: "mi autoridad crece cuando hago preguntas mejores y sostengo conversaciones más maduras". Ese cambio me devolvió energía, porque ya no tengo que cargar solo.'
    }
]

const EVENT_TYPE_STYLE: Record<StoryEventType, { label: string; nodeClass: string; badgeClass: string }> = {
    logro: {
        label: 'Logro',
        nodeClass: 'bg-emerald-500 border-emerald-600',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    'logro-golpe': {
        label: 'Logro / Golpe',
        nodeClass: 'bg-amber-400 border-amber-500',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    golpe: {
        label: 'Golpe / Crisis / Quiebre',
        nodeClass: 'bg-red-500 border-red-600',
        badgeClass: 'bg-red-100 text-red-800 border-red-200'
    }
}

const EXAMPLE_EVENT: StoryEventDraft = {
    type: 'logro-golpe',
    approxDate: '2021-08',
    happened:
        'Me ascendieron a un rol de mayor responsabilidad. Durante las primeras 3 semanas recibí tareas nuevas sin inducción formal. No pedí apoyo ni aclaré expectativas con mi jefe, aunque tuve dudas en varios entregables.',
    interpreted:
        'Decidí que pedir ayuda o admitir dudas podía hacer que cuestionaran mi capacidad para el cargo. Interpreté que "un líder debe resolver solo" y que mostrar incertidumbre reduce autoridad.',
    learned:
        'Aprendí que mi silencio aumentó el riesgo: trabajé más horas, cometí errores evitables y demoré decisiones por miedo a preguntar. También aprendí que la autoridad real se fortalece cuando pido apoyo específico y tomo decisiones con información completa.',
    belief: 'Si pido ayuda, pierdo autoridad. Un líder debe poder con todo sin mostrar vulnerabilidad.'
}

const defaultEventDraft = (): StoryEventDraft => ({
    type: 'logro',
    approxDate: '',
    happened: '',
    interpreted: '',
    learned: '',
    belief: ''
})

function emptyPatternList() {
    return Array.from({ length: PATTERN_LIST_LIMIT }, () => '')
}

function emptyIdentityList() {
    return Array.from({ length: IDENTITY_BULLET_LIMIT }, () => '')
}

function defaultIdentityWheelFields() {
    return {
        roles: emptyIdentityList(),
        principios: emptyIdentityList(),
        presion: emptyIdentityList(),
        calma: emptyIdentityList(),
        aporte: emptyIdentityList(),
        evito: emptyIdentityList(),
        triggers: emptyIdentityList(),
        recursos: emptyIdentityList()
    } satisfies Record<IdentitySegmentKey, string[]>
}

function defaultIdentityMatrixRows() {
    return Array.from({ length: IDENTITY_MATRIX_ROWS }, () => ({
        say: '',
        do: '',
        impact: ''
    }))
}

function defaultStakeholderRows() {
    return Array.from({ length: STAKEHOLDER_ROWS }, () => ({
        personRole: '',
        strength: '',
        blindspot: ''
    }))
}

function defaultFundamentalValuesFields(): FundamentalValuesFields {
    return {
        selected10: [],
        selected5: [],
        selected3: []
    }
}

function defaultValueDecisionRows() {
    return Array.from({ length: VALUE_DECISION_ROWS }, () => ({
        value: '',
        decision1: '',
        decision2: ''
    }))
}

function defaultNoNegotiableRows() {
    return Array.from({ length: NO_NEGOTIABLE_ROWS }, () => ({
        value: '',
        behavior: '',
        implication: ''
    }))
}

function emptyFoaList() {
    return Array.from({ length: FOA_BULLET_LIMIT }, () => '')
}

function defaultFoaFields() {
    return {
        strengths: emptyFoaList(),
        opportunities: emptyFoaList(),
        threats: emptyFoaList()
    } satisfies Record<FoaQuadrantKey, string[]>
}

function emptyEnergyPatternList() {
    return Array.from({ length: ENERGY_PATTERN_BULLETS }, () => '')
}

function defaultEnergyMapRows() {
    return Array.from({ length: ENERGY_MAP_ROWS }, () => ({
        activity: '',
        sign: '' as EnergySign,
        energy: '',
        reason: '',
        adjust: '' as EnergyAdjust
    }))
}

function defaultBeliefAbcRows() {
    return Array.from({ length: BELIEF_ABC_ROWS }, () => ({
        activator: '',
        belief: '',
        emotion: '',
        action: ''
    }))
}

function defaultBeliefEvidenceRows() {
    return Array.from({ length: BELIEF_EVIDENCE_ROWS }, () => ({
        limitingBelief: '',
        evidenceFor: '',
        evidenceAgainst: '',
        newMeaning: ''
    }))
}

function emptyBeliefImpactBullets() {
    return Array.from({ length: BELIEF_IMPACT_BULLETS }, () => '')
}

function defaultBeliefImpactAffectedRows() {
    return Array.from({ length: BELIEF_IMPACT_AFFECTED_ROWS }, () => ({
        person: '',
        impact: ''
    }))
}

function defaultEmpoweringBeliefRows() {
    return Array.from({ length: EMPOWERING_BELIEF_ROWS }, () => ({
        limitingBelief: '',
        idealBelief: '',
        bridgeBelief: ''
    }))
}

function defaultBridgeExperimentRows() {
    return Array.from({ length: BRIDGE_EXPERIMENT_ROWS }, () => ({
        bridgeBelief: '',
        dailyBehavior: '',
        evidence: '',
        indicator: ''
    }))
}

function defaultMantraRows() {
    return Array.from({ length: MANTRA_ROWS }, () => ({
        mantra: '',
        situation: '',
        behavior: '',
        signal: ''
    }))
}

function emptyFutureSelfList(limit: number) {
    return Array.from({ length: limit }, () => '')
}

function defaultFutureSelfRiskRows() {
    return Array.from({ length: FUTURE_SELF_RISK_ROWS }, () => ({
        risk: '',
        prevention: ''
    }))
}

function defaultFutureSelfFields(): FutureSelfFields {
    return {
        identity: emptyFutureSelfList(FUTURE_SELF_IDENTITY_ROWS),
        values: emptyFutureSelfList(FUTURE_SELF_VALUES_ROWS),
        habits: emptyFutureSelfList(FUTURE_SELF_HABITS_ROWS),
        decisions: emptyFutureSelfList(FUTURE_SELF_DECISIONS_ROWS),
        skills: emptyFutureSelfList(FUTURE_SELF_SKILLS_ROWS),
        environment: {
            surround: '',
            eliminate: '',
            protect: ''
        },
        impact: {
            serve: '',
            transform: '',
            result: ''
        },
        metrics: emptyFutureSelfList(FUTURE_SELF_METRICS_ROWS),
        risks: defaultFutureSelfRiskRows()
    }
}

function defaultBackcastingRows() {
    return Array.from({ length: BACKCASTING_ROWS }, () => ({
        achievement: '',
        habit: '',
        evidence: ''
    }))
}

function defaultMentorCriteriaRows(): MentorCriterionRow[] {
    return MENTOR_CRITERIA.map((criterion) => ({
        criterion,
        level: '',
        evidence: '',
        decision: ''
    }))
}

function defaultLeaderEvaluationRows(): LeaderEvaluationRow[] {
    return LEADER_EVALUATION_QUESTIONS.map((question) => ({
        question,
        response: '',
        evidence: '',
        action: ''
    }))
}

function defaultFutureSelfSuggestions(): Record<FutureSelfBlockKey, string[]> {
    return {
        identity: [],
        values: [],
        habits: [],
        decisions: [],
        skills: [],
        environment: [],
        impact: [],
        metrics: [],
        risks: []
    }
}

function normalizePatternList(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, PATTERN_LIST_LIMIT)
        return [...list, ...Array.from({ length: PATTERN_LIST_LIMIT - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, PATTERN_LIST_LIMIT)
        return [...list, ...Array.from({ length: PATTERN_LIST_LIMIT - list.length }, () => '')]
    }

    return emptyPatternList()
}

function normalizeIdentityList(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, IDENTITY_BULLET_LIMIT)
        return [...list, ...Array.from({ length: IDENTITY_BULLET_LIMIT - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, IDENTITY_BULLET_LIMIT)
        return [...list, ...Array.from({ length: IDENTITY_BULLET_LIMIT - list.length }, () => '')]
    }

    return emptyIdentityList()
}

function normalizeIdentityMatrixRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { say: '', do: '', impact: '' }
                }
                const candidate = row as Partial<Record<IdentityMatrixFieldKey, unknown>>
                return {
                    say: typeof candidate.say === 'string' ? candidate.say : '',
                    do: typeof candidate.do === 'string' ? candidate.do : '',
                    impact: typeof candidate.impact === 'string' ? candidate.impact : ''
                }
            })
            .slice(0, IDENTITY_MATRIX_ROWS)

        return [...rows, ...Array.from({ length: IDENTITY_MATRIX_ROWS - rows.length }, () => ({ say: '', do: '', impact: '' }))]
    }

    return defaultIdentityMatrixRows()
}

function normalizeStakeholderRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { personRole: '', strength: '', blindspot: '' }
                }
                const candidate = row as Partial<Record<StakeholderFieldKey, unknown>>
                return {
                    personRole: typeof candidate.personRole === 'string' ? candidate.personRole : '',
                    strength: typeof candidate.strength === 'string' ? candidate.strength : '',
                    blindspot: typeof candidate.blindspot === 'string' ? candidate.blindspot : ''
                }
            })
            .slice(0, STAKEHOLDER_ROWS)

        return [...rows, ...Array.from({ length: STAKEHOLDER_ROWS - rows.length }, () => ({ personRole: '', strength: '', blindspot: '' }))]
    }

    return defaultStakeholderRows()
}

function normalizeFundamentalValuesList(value: unknown, max: number) {
    if (!Array.isArray(value)) return []

    const allowed = new Set<string>(FUNDAMENTAL_VALUES)
    const seen = new Set<string>()
    const next: string[] = []

    for (const item of value) {
        if (typeof item !== 'string') continue
        const trimmed = item.trim()
        if (!allowed.has(trimmed) || seen.has(trimmed)) continue
        seen.add(trimmed)
        next.push(trimmed)
        if (next.length >= max) break
    }

    return next
}

function normalizeValueDecisionRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { value: '', decision1: '', decision2: '' }
                }
                const candidate = row as Partial<Record<'value' | ValueDecisionFieldKey, unknown>>
                return {
                    value: typeof candidate.value === 'string' ? candidate.value : '',
                    decision1: typeof candidate.decision1 === 'string' ? candidate.decision1 : '',
                    decision2: typeof candidate.decision2 === 'string' ? candidate.decision2 : ''
                }
            })
            .slice(0, VALUE_DECISION_ROWS)

        return [...rows, ...Array.from({ length: VALUE_DECISION_ROWS - rows.length }, () => ({ value: '', decision1: '', decision2: '' }))]
    }

    return defaultValueDecisionRows()
}

function normalizeNoNegotiableRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { value: '', behavior: '', implication: '' }
                }
                const candidate = row as Partial<Record<'value' | NoNegotiableFieldKey, unknown>>
                return {
                    value: typeof candidate.value === 'string' ? candidate.value : '',
                    behavior: typeof candidate.behavior === 'string' ? candidate.behavior : '',
                    implication: typeof candidate.implication === 'string' ? candidate.implication : ''
                }
            })
            .slice(0, NO_NEGOTIABLE_ROWS)

        return [
            ...rows,
            ...Array.from({ length: NO_NEGOTIABLE_ROWS - rows.length }, () => ({
                value: '',
                behavior: '',
                implication: ''
            }))
        ]
    }

    return defaultNoNegotiableRows()
}

function normalizeFoaList(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, FOA_BULLET_LIMIT)
        return [...list, ...Array.from({ length: FOA_BULLET_LIMIT - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, FOA_BULLET_LIMIT)
        return [...list, ...Array.from({ length: FOA_BULLET_LIMIT - list.length }, () => '')]
    }

    return emptyFoaList()
}

function normalizeEnergyPatternList(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, ENERGY_PATTERN_BULLETS)
        return [...list, ...Array.from({ length: ENERGY_PATTERN_BULLETS - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, ENERGY_PATTERN_BULLETS)
        return [...list, ...Array.from({ length: ENERGY_PATTERN_BULLETS - list.length }, () => '')]
    }

    return emptyEnergyPatternList()
}

function normalizeEnergyMapRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { activity: '', sign: '' as EnergySign, energy: '', reason: '', adjust: '' as EnergyAdjust }
                }
                const candidate = row as Partial<Record<EnergyMapFieldKey, unknown>>
                const sign: EnergySign = candidate.sign === '+' || candidate.sign === '-' ? candidate.sign : ''
                const energy =
                    typeof candidate.energy === 'string' && /^([0-9]|10)$/.test(candidate.energy)
                        ? candidate.energy
                        : ''
                const adjust: EnergyAdjust =
                    candidate.adjust === 'Más' || candidate.adjust === 'Menos' || candidate.adjust === 'Rediseñar'
                        ? candidate.adjust
                        : ''
                const normalizedRow: EnergyMapRow = {
                    activity: typeof candidate.activity === 'string' ? candidate.activity : '',
                    sign,
                    energy,
                    reason: typeof candidate.reason === 'string' ? candidate.reason : '',
                    adjust
                }
                return normalizedRow
            })
            .slice(0, ENERGY_MAP_ROWS)

        return [
            ...rows,
            ...Array.from({ length: ENERGY_MAP_ROWS - rows.length }, () => ({
                activity: '',
                sign: '' as EnergySign,
                energy: '',
                reason: '',
                adjust: '' as EnergyAdjust
            }))
        ]
    }

    return defaultEnergyMapRows()
}

function normalizeBeliefAbcRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { activator: '', belief: '', emotion: '', action: '' }
                }

                const candidate = row as Partial<Record<BeliefAbcFieldKey, unknown>>
                return {
                    activator: typeof candidate.activator === 'string' ? candidate.activator : '',
                    belief: typeof candidate.belief === 'string' ? candidate.belief : '',
                    emotion: typeof candidate.emotion === 'string' ? candidate.emotion : '',
                    action: typeof candidate.action === 'string' ? candidate.action : ''
                }
            })
            .slice(0, BELIEF_ABC_ROWS)

        return [...rows, ...Array.from({ length: BELIEF_ABC_ROWS - rows.length }, () => ({ activator: '', belief: '', emotion: '', action: '' }))]
    }

    return defaultBeliefAbcRows()
}

function normalizeBeliefEvidenceRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { limitingBelief: '', evidenceFor: '', evidenceAgainst: '', newMeaning: '' }
                }

                const candidate = row as Partial<Record<BeliefEvidenceFieldKey, unknown>>
                return {
                    limitingBelief: typeof candidate.limitingBelief === 'string' ? candidate.limitingBelief : '',
                    evidenceFor: typeof candidate.evidenceFor === 'string' ? candidate.evidenceFor : '',
                    evidenceAgainst: typeof candidate.evidenceAgainst === 'string' ? candidate.evidenceAgainst : '',
                    newMeaning: typeof candidate.newMeaning === 'string' ? candidate.newMeaning : ''
                }
            })
            .slice(0, BELIEF_EVIDENCE_ROWS)

        return [
            ...rows,
            ...Array.from({ length: BELIEF_EVIDENCE_ROWS - rows.length }, () => ({
                limitingBelief: '',
                evidenceFor: '',
                evidenceAgainst: '',
                newMeaning: ''
            }))
        ]
    }

    return defaultBeliefEvidenceRows()
}

function normalizeBeliefImpactBullets(value: unknown) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, BELIEF_IMPACT_BULLETS)
        return [...list, ...Array.from({ length: BELIEF_IMPACT_BULLETS - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, BELIEF_IMPACT_BULLETS)
        return [...list, ...Array.from({ length: BELIEF_IMPACT_BULLETS - list.length }, () => '')]
    }

    return emptyBeliefImpactBullets()
}

function normalizeBeliefImpactAffectedRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { person: '', impact: '' }
                }

                const candidate = row as Partial<Record<'person' | 'impact', unknown>>
                return {
                    person: typeof candidate.person === 'string' ? candidate.person : '',
                    impact: typeof candidate.impact === 'string' ? candidate.impact : ''
                }
            })
            .slice(0, BELIEF_IMPACT_AFFECTED_ROWS)

        return [...rows, ...Array.from({ length: BELIEF_IMPACT_AFFECTED_ROWS - rows.length }, () => ({ person: '', impact: '' }))]
    }

    return defaultBeliefImpactAffectedRows()
}

function normalizeEmpoweringBeliefRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { limitingBelief: '', idealBelief: '', bridgeBelief: '' }
                }

                const candidate = row as Partial<Record<EmpoweringBeliefFieldKey, unknown>>
                return {
                    limitingBelief: typeof candidate.limitingBelief === 'string' ? candidate.limitingBelief : '',
                    idealBelief: typeof candidate.idealBelief === 'string' ? candidate.idealBelief : '',
                    bridgeBelief: typeof candidate.bridgeBelief === 'string' ? candidate.bridgeBelief : ''
                }
            })
            .slice(0, EMPOWERING_BELIEF_ROWS)

        return [
            ...rows,
            ...Array.from({ length: EMPOWERING_BELIEF_ROWS - rows.length }, () => ({
                limitingBelief: '',
                idealBelief: '',
                bridgeBelief: ''
            }))
        ]
    }

    return defaultEmpoweringBeliefRows()
}

function normalizeBridgeExperimentRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { bridgeBelief: '', dailyBehavior: '', evidence: '', indicator: '' }
                }

                const candidate = row as Partial<Record<BridgeExperimentFieldKey, unknown>>
                return {
                    bridgeBelief: typeof candidate.bridgeBelief === 'string' ? candidate.bridgeBelief : '',
                    dailyBehavior: typeof candidate.dailyBehavior === 'string' ? candidate.dailyBehavior : '',
                    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
                    indicator: typeof candidate.indicator === 'string' ? candidate.indicator : ''
                }
            })
            .slice(0, BRIDGE_EXPERIMENT_ROWS)

        return [
            ...rows,
            ...Array.from({ length: BRIDGE_EXPERIMENT_ROWS - rows.length }, () => ({
                bridgeBelief: '',
                dailyBehavior: '',
                evidence: '',
                indicator: ''
            }))
        ]
    }

    return defaultBridgeExperimentRows()
}

function normalizeMantraRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { mantra: '', situation: '', behavior: '', signal: '' }
                }

                const candidate = row as Partial<Record<MantraCardFieldKey, unknown>>
                return {
                    mantra: typeof candidate.mantra === 'string' ? candidate.mantra : '',
                    situation: typeof candidate.situation === 'string' ? candidate.situation : '',
                    behavior: typeof candidate.behavior === 'string' ? candidate.behavior : '',
                    signal: typeof candidate.signal === 'string' ? candidate.signal : ''
                }
            })
            .slice(0, MANTRA_ROWS)

        return [
            ...rows,
            ...Array.from({ length: MANTRA_ROWS - rows.length }, () => ({
                mantra: '',
                situation: '',
                behavior: '',
                signal: ''
            }))
        ]
    }

    return defaultMantraRows()
}

function normalizeFutureSelfList(value: unknown, limit: number) {
    if (Array.isArray(value)) {
        const list = value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .slice(0, limit)
        return [...list, ...Array.from({ length: limit - list.length }, () => '')]
    }

    if (typeof value === 'string') {
        const list = value
            .split('\n')
            .map((line) => line.replace(/^[\s•-]+/, '').trim())
            .filter(Boolean)
            .slice(0, limit)
        return [...list, ...Array.from({ length: limit - list.length }, () => '')]
    }

    return emptyFutureSelfList(limit)
}

function normalizeFutureSelfRiskRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { risk: '', prevention: '' }
                }
                const candidate = row as Partial<Record<FutureSelfRiskFieldKey, unknown>>
                return {
                    risk: typeof candidate.risk === 'string' ? candidate.risk : '',
                    prevention: typeof candidate.prevention === 'string' ? candidate.prevention : ''
                }
            })
            .slice(0, FUTURE_SELF_RISK_ROWS)

        return [
            ...rows,
            ...Array.from({ length: FUTURE_SELF_RISK_ROWS - rows.length }, () => ({
                risk: '',
                prevention: ''
            }))
        ]
    }

    return defaultFutureSelfRiskRows()
}

function normalizeFutureSelfFields(value: unknown): FutureSelfFields {
    if (!value || typeof value !== 'object') {
        return defaultFutureSelfFields()
    }

    const candidate = value as Partial<Record<FutureSelfBlockKey, unknown>>
    const environmentSource =
        candidate.environment && typeof candidate.environment === 'object'
            ? (candidate.environment as Partial<Record<FutureSelfEnvironmentFieldKey, unknown>>)
            : {}
    const impactSource =
        candidate.impact && typeof candidate.impact === 'object'
            ? (candidate.impact as Partial<Record<FutureSelfImpactFieldKey, unknown>>)
            : {}

    return {
        identity: normalizeFutureSelfList(candidate.identity, FUTURE_SELF_IDENTITY_ROWS),
        values: normalizeFutureSelfList(candidate.values, FUTURE_SELF_VALUES_ROWS),
        habits: normalizeFutureSelfList(candidate.habits, FUTURE_SELF_HABITS_ROWS),
        decisions: normalizeFutureSelfList(candidate.decisions, FUTURE_SELF_DECISIONS_ROWS),
        skills: normalizeFutureSelfList(candidate.skills, FUTURE_SELF_SKILLS_ROWS),
        environment: {
            surround: typeof environmentSource.surround === 'string' ? environmentSource.surround : '',
            eliminate: typeof environmentSource.eliminate === 'string' ? environmentSource.eliminate : '',
            protect: typeof environmentSource.protect === 'string' ? environmentSource.protect : ''
        },
        impact: {
            serve: typeof impactSource.serve === 'string' ? impactSource.serve : '',
            transform: typeof impactSource.transform === 'string' ? impactSource.transform : '',
            result: typeof impactSource.result === 'string' ? impactSource.result : ''
        },
        metrics: normalizeFutureSelfList(candidate.metrics, FUTURE_SELF_METRICS_ROWS),
        risks: normalizeFutureSelfRiskRows(candidate.risks)
    }
}

function normalizeBackcastingRows(value: unknown) {
    if (Array.isArray(value)) {
        const rows = value
            .map((row) => {
                if (!row || typeof row !== 'object') {
                    return { achievement: '', habit: '', evidence: '' }
                }

                const candidate = row as Partial<Record<BackcastingFieldKey, unknown>>
                return {
                    achievement: typeof candidate.achievement === 'string' ? candidate.achievement : '',
                    habit: typeof candidate.habit === 'string' ? candidate.habit : '',
                    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : ''
                }
            })
            .slice(0, BACKCASTING_ROWS)

        return [
            ...rows,
            ...Array.from({ length: BACKCASTING_ROWS - rows.length }, () => ({
                achievement: '',
                habit: '',
                evidence: ''
            }))
        ]
    }

    return defaultBackcastingRows()
}

function normalizeMentorCriteriaRows(value: unknown) {
    const defaults = defaultMentorCriteriaRows()
    if (!Array.isArray(value)) return defaults

    return defaults.map((fallback, index) => {
        const row = value[index]
        if (!row || typeof row !== 'object') return fallback
        const candidate = row as Partial<Record<MentorCriterionFieldKey | 'criterion', unknown>>
        return {
            criterion: fallback.criterion,
            level:
                candidate.level === 'N1' || candidate.level === 'N2' || candidate.level === 'N3' || candidate.level === 'N4'
                    ? candidate.level
                    : '',
            evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
            decision:
                candidate.decision === 'Consolidado' ||
                candidate.decision === 'En desarrollo' ||
                candidate.decision === 'Prioritario'
                    ? candidate.decision
                    : ''
        } satisfies MentorCriterionRow
    })
}

function normalizeLeaderEvaluationRows(value: unknown) {
    const defaults = defaultLeaderEvaluationRows()
    if (!Array.isArray(value)) return defaults

    return defaults.map((fallback, index) => {
        const row = value[index]
        if (!row || typeof row !== 'object') return fallback
        const candidate = row as Partial<Record<LeaderEvaluationFieldKey | 'question', unknown>>
        return {
            question: fallback.question,
            response: typeof candidate.response === 'string' ? candidate.response : '',
            evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
            action: typeof candidate.action === 'string' ? candidate.action : ''
        } satisfies LeaderEvaluationRow
    })
}

function isMantraCardComplete(row: MantraCardRow) {
    return [row.mantra, row.situation, row.behavior, row.signal].every((value) => {
        const normalized = value.trim()
        return normalized.length > 0 && !/\bcompletar\b/i.test(normalized)
    })
}

function getMantraSuggestions(row: MantraCardRow) {
    const suggestions: string[] = []
    const mantraValue = row.mantra.trim()
    const situationValue = row.situation.trim()
    const behaviorValue = row.behavior.trim()

    if (mantraValue && !/^yo soy\b/i.test(mantraValue)) {
        suggestions.push('El mantra puede iniciar con “Yo soy…” para mantener la fórmula sugerida.')
    }

    if (
        behaviorValue &&
        (/^(ser|estar)\b/i.test(behaviorValue) ||
            /(ser mejor|ser más|mejor persona|mejor líder|tener actitud|dar lo mejor|ser excelente)/i.test(behaviorValue))
    ) {
        suggestions.push('En conducta visible, describe una acción observable (ej.: “hago 1 pregunta antes de responder”).')
    }

    const hasSpecificContext = /(reunión|feedback|crisis|cliente|equipo|comité|junta|llamada|presentación|dirección|sponsor|conflicto)/i.test(
        situationValue
    )
    if (
        situationValue &&
        (!hasSpecificContext ||
            /(cuando estoy estresad|cuando hay presión|en general|siempre|cuando me siento)/i.test(situationValue))
    ) {
        suggestions.push('En situación, especifica contexto concreto (reunión, feedback, crisis, cliente, etc.).')
    }

    return suggestions
}

function countFilledFutureSelfItems(items: string[]) {
    return items.filter((item) => item.trim().length > 0 && !/\bcompletar\b/i.test(item)).length
}

function isFutureSelfBlockComplete(key: FutureSelfBlockKey, fields: FutureSelfFields) {
    switch (key) {
        case 'identity':
            return countFilledFutureSelfItems(fields.identity) >= 1
        case 'values':
            return countFilledFutureSelfItems(fields.values) >= 3
        case 'habits':
            return countFilledFutureSelfItems(fields.habits) >= 5
        case 'decisions':
            return countFilledFutureSelfItems(fields.decisions) >= 3
        case 'skills':
            return countFilledFutureSelfItems(fields.skills) >= 3
        case 'environment':
            return fields.environment.surround.trim().length > 0 && fields.environment.eliminate.trim().length > 0
        case 'impact':
            return fields.impact.serve.trim().length > 0 && fields.impact.transform.trim().length > 0
        case 'metrics':
            return countFilledFutureSelfItems(fields.metrics) >= 2
        case 'risks':
            return fields.risks.filter((row) => row.risk.trim().length > 0 && row.prevention.trim().length > 0).length >= 2
        default:
            return false
    }
}

function futureSelfHasFutureTense(text: string) {
    return /(seré|estaré|haré|tendré|lograré|voy a|deberé)/i.test(text)
}

function getFutureSelfBlockSuggestions(key: FutureSelfBlockKey, fields: FutureSelfFields) {
    const suggestions: string[] = []

    if (key === 'identity' && countFilledFutureSelfItems(fields.identity) < 1) {
        suggestions.push('Completa al menos 1 bullet en Identidad.')
    }
    if (key === 'values' && countFilledFutureSelfItems(fields.values) < 3) {
        suggestions.push('Completa al menos 3 bullets en Valores no negociables.')
    }
    if (key === 'habits' && countFilledFutureSelfItems(fields.habits) < 5) {
        suggestions.push('Completa al menos 5 bullets en Hábitos diarios.')
    }
    if (key === 'decisions' && countFilledFutureSelfItems(fields.decisions) < 3) {
        suggestions.push('Completa al menos 3 bullets en Decisiones.')
    }
    if (key === 'skills' && countFilledFutureSelfItems(fields.skills) < 3) {
        suggestions.push('Completa al menos 3 bullets en Habilidades.')
    }
    if (key === 'environment' && !isFutureSelfBlockComplete('environment', fields)) {
        suggestions.push('Completa mínimo “Me rodeo de” y “Elimino”.')
    }
    if (key === 'impact' && !isFutureSelfBlockComplete('impact', fields)) {
        suggestions.push('Completa mínimo “Sirvo a” y “Transformo”.')
    }
    if (key === 'metrics' && countFilledFutureSelfItems(fields.metrics) < 2) {
        suggestions.push('Completa al menos 2 métricas personales.')
    }
    if (key === 'risks' && !isFutureSelfBlockComplete('risks', fields)) {
        suggestions.push('Completa al menos 2 pares de riesgo + prevención.')
    }

    const blockText =
        key === 'environment'
            ? [fields.environment.surround, fields.environment.eliminate, fields.environment.protect].join(' ')
            : key === 'impact'
              ? [fields.impact.serve, fields.impact.transform, fields.impact.result].join(' ')
              : key === 'risks'
                ? fields.risks.map((row) => `${row.risk} ${row.prevention}`).join(' ')
                : fields[key].join(' ')

    if (blockText.trim().length > 0 && futureSelfHasFutureTense(blockText)) {
        suggestions.push('Recuerda escribir en presente, como si ya fueras tu versión 10X.')
    }

    return suggestions
}

function isBackcastingRowComplete(row: BackcastingRow) {
    return row.achievement.trim().length > 0 && row.habit.trim().length > 0 && row.evidence.trim().length > 0
}

function countWords(text: string) {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
}

function detectFutureLetterChecklist(text: string): FutureLetterChecklist {
    const normalized = text.trim()
    const bulletMatches = normalized.match(/^\s*[•*-]\s+/gm)
    const bulletCount = bulletMatches ? bulletMatches.length : 0

    return {
        nonNegotiables: bulletCount >= 3,
        habit: /\bh[aá]bito\b/i.test(normalized),
        decision: /\bdecisi[oó]n\b/i.test(normalized),
        impact: /\bimpacto\b/i.test(normalized) || /\bsirv[oe]\b/i.test(normalized)
    }
}

function isFutureLetterComplete(checklist: FutureLetterChecklist, manuallyMarked: boolean) {
    return manuallyMarked || Object.values(checklist).every(Boolean)
}

function isMentorCriterionComplete(row: MentorCriterionRow) {
    return row.level !== '' && row.decision !== '' && row.evidence.trim().length > 0
}

function getMentorCriterionSuggestions(row: MentorCriterionRow) {
    const suggestions: string[] = []
    const evidence = row.evidence.trim()

    if (!evidence) {
        suggestions.push('Registra 1 hecho observable (qué pasó + cuándo).')
    }

    if ((row.level === 'N3' || row.level === 'N4') && evidence.length > 0 && evidence.length < 60) {
        suggestions.push('Para N3 o N4, agrega un ejemplo verificable con contexto y resultado.')
    }

    return suggestions
}

function isLeaderEvaluationRowComplete(row: LeaderEvaluationRow) {
    return row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0
}

function getLeaderEvaluationSuggestions(row: LeaderEvaluationRow) {
    const suggestions: string[] = []

    if (!row.evidence.trim()) {
        suggestions.push('Agrega 1 hecho observable en evidencia.')
    }

    if (!row.action.trim()) {
        suggestions.push('Define 1 acción semanal o diaria para los próximos 30 días.')
    }

    return suggestions
}

function trimFutureSelfFields(fields: FutureSelfFields): FutureSelfFields {
    return {
        identity: fields.identity.map((item) => item.trim()),
        values: fields.values.map((item) => item.trim()),
        habits: fields.habits.map((item) => item.trim()),
        decisions: fields.decisions.map((item) => item.trim()),
        skills: fields.skills.map((item) => item.trim()),
        environment: {
            surround: fields.environment.surround.trim(),
            eliminate: fields.environment.eliminate.trim(),
            protect: fields.environment.protect.trim()
        },
        impact: {
            serve: fields.impact.serve.trim(),
            transform: fields.impact.transform.trim(),
            result: fields.impact.result.trim()
        },
        metrics: fields.metrics.map((item) => item.trim()),
        risks: fields.risks.map((row) => ({
            risk: row.risk.trim(),
            prevention: row.prevention.trim()
        }))
    }
}

function toMonthLabel(value: string) {
    if (!value) return 'Sin fecha'
    const [year, month] = value.split('-')
    if (!year || !month) return value
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

function sortByApproxDate(a: StoryEvent, b: StoryEvent) {
    if (!a.approxDate && !b.approxDate) return 0
    if (!a.approxDate) return 1
    if (!b.approxDate) return -1
    return a.approxDate.localeCompare(b.approxDate)
}

export function WB1Step1Digital() {
    const [activePage, setActivePage] = useState(1)
    const [isLocked, setIsLocked] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showEventModal, setShowEventModal] = useState(false)
    const [showIdentityHelp, setShowIdentityHelp] = useState(false)
    const [showIdentityMatrixHelp, setShowIdentityMatrixHelp] = useState(false)
    const [showStakeholderHelp, setShowStakeholderHelp] = useState(false)
    const [showValueDecisionHelp, setShowValueDecisionHelp] = useState(false)
    const [showNoNegotiableHelp, setShowNoNegotiableHelp] = useState(false)
    const [showFoaHelp, setShowFoaHelp] = useState(false)
    const [showEnergyHelp, setShowEnergyHelp] = useState(false)
    const [showBeliefAbcHelp, setShowBeliefAbcHelp] = useState(false)
    const [showBeliefEvidenceHelp, setShowBeliefEvidenceHelp] = useState(false)
    const [showBeliefImpactHelp, setShowBeliefImpactHelp] = useState(false)
    const [showEmpoweringBeliefHelp, setShowEmpoweringBeliefHelp] = useState(false)
    const [showBridgeExperimentHelp, setShowBridgeExperimentHelp] = useState(false)
    const [showMantraHelp, setShowMantraHelp] = useState(false)
    const [showFutureSelfHelp, setShowFutureSelfHelp] = useState(false)
    const [showBackcastingHelp, setShowBackcastingHelp] = useState(false)
    const [showFutureLetterHelp, setShowFutureLetterHelp] = useState(false)
    const [identityWheelSizeIndex, setIdentityWheelSizeIndex] = useState(0)
    const [openActHelp, setOpenActHelp] = useState<Record<StoryActHelpKey, boolean>>({
        acto1: false,
        acto2: false,
        acto3: false
    })
    const [eventDraft, setEventDraft] = useState<StoryEventDraft>(defaultEventDraft())
    const [patternEditModes, setPatternEditModes] = useState<Record<PatternListKey, boolean>>({
        patternDecision: false,
        patternTrigger: false,
        patternResource: false
    })
    const [identityEditModes, setIdentityEditModes] = useState<Record<IdentitySegmentKey, boolean>>({
        roles: false,
        principios: false,
        presion: false,
        calma: false,
        aporte: false,
        evito: false,
        triggers: false,
        recursos: false
    })
    const [idFields, setIdFields] = useState<WB1IdentificationFields>({
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    })
    const [storyFields, setStoryFields] = useState<StoryPageFields>({
        timelineRange: '',
        actOrigin: '',
        actBreak: '',
        actRebuild: '',
        patternDecision: emptyPatternList(),
        patternTrigger: emptyPatternList(),
        patternResource: emptyPatternList()
    })
    const [storyEvents, setStoryEvents] = useState<StoryEvent[]>([])
    const [identityWheelFields, setIdentityWheelFields] = useState<Record<IdentitySegmentKey, string[]>>(defaultIdentityWheelFields())
    const [identityMatrixRows, setIdentityMatrixRows] = useState<IdentityMatrixRow[]>(defaultIdentityMatrixRows())
    const [stakeholderRows, setStakeholderRows] = useState<StakeholderRow[]>(defaultStakeholderRows())
    const [fundamentalValues, setFundamentalValues] = useState<FundamentalValuesFields>(defaultFundamentalValuesFields())
    const [valueDecisionRows, setValueDecisionRows] = useState<ValueDecisionRow[]>(defaultValueDecisionRows())
    const [noNegotiableRows, setNoNegotiableRows] = useState<NoNegotiableRow[]>(defaultNoNegotiableRows())
    const [noNegotiableEditModes, setNoNegotiableEditModes] = useState<boolean[]>(
        Array.from({ length: NO_NEGOTIABLE_ROWS }, () => false)
    )
    const [foaFields, setFoaFields] = useState<Record<FoaQuadrantKey, string[]>>(defaultFoaFields())
    const [foaEditModes, setFoaEditModes] = useState<Record<FoaQuadrantKey, boolean>>({
        strengths: false,
        opportunities: false,
        threats: false
    })
    const [energyMapRows, setEnergyMapRows] = useState<EnergyMapRow[]>(defaultEnergyMapRows())
    const [energyPatternBullets, setEnergyPatternBullets] = useState<string[]>(emptyEnergyPatternList())
    const [energyDoMore, setEnergyDoMore] = useState('')
    const [energyDoLess, setEnergyDoLess] = useState('')
    const [energyRedesign, setEnergyRedesign] = useState('')
    const [beliefAbcRows, setBeliefAbcRows] = useState<BeliefAbcRow[]>(defaultBeliefAbcRows())
    const [beliefAbcEditModes, setBeliefAbcEditModes] = useState<boolean[]>(Array.from({ length: BELIEF_ABC_ROWS }, () => false))
    const [beliefEvidenceRows, setBeliefEvidenceRows] = useState<BeliefEvidenceRow[]>(defaultBeliefEvidenceRows())
    const [beliefImpactSelected, setBeliefImpactSelected] = useState('')
    const [beliefImpactCosts, setBeliefImpactCosts] = useState<string[]>(emptyBeliefImpactBullets())
    const [beliefImpactLostOpportunities, setBeliefImpactLostOpportunities] = useState<string[]>(emptyBeliefImpactBullets())
    const [beliefImpactAffectedRows, setBeliefImpactAffectedRows] = useState<BeliefImpactAffectedRow[]>(defaultBeliefImpactAffectedRows())
    const [beliefImpactIsEditing, setBeliefImpactIsEditing] = useState(false)
    const [empoweringBeliefRows, setEmpoweringBeliefRows] = useState<EmpoweringBeliefRow[]>(defaultEmpoweringBeliefRows())
    const [empoweringBeliefEditModes, setEmpoweringBeliefEditModes] = useState<boolean[]>(Array.from({ length: EMPOWERING_BELIEF_ROWS }, () => false))
    const [bridgeExperimentRows, setBridgeExperimentRows] = useState<BridgeExperimentRow[]>(defaultBridgeExperimentRows())
    const [bridgeExperimentEditModes, setBridgeExperimentEditModes] = useState<boolean[]>(
        Array.from({ length: BRIDGE_EXPERIMENT_ROWS }, () => false)
    )
    const [mantraRows, setMantraRows] = useState<MantraCardRow[]>(defaultMantraRows())
    const [mantraEditModes, setMantraEditModes] = useState<boolean[]>(Array.from({ length: MANTRA_ROWS }, () => false))
    const [mantraSuggestions, setMantraSuggestions] = useState<string[][]>(Array.from({ length: MANTRA_ROWS }, () => []))
    const [futureSelfFields, setFutureSelfFields] = useState<FutureSelfFields>(defaultFutureSelfFields())
    const [futureSelfEditModes, setFutureSelfEditModes] = useState<Record<FutureSelfBlockKey, boolean>>({
        identity: false,
        values: false,
        habits: false,
        decisions: false,
        skills: false,
        environment: false,
        impact: false,
        metrics: false,
        risks: false
    })
    const [futureSelfSuggestions, setFutureSelfSuggestions] = useState<Record<FutureSelfBlockKey, string[]>>(defaultFutureSelfSuggestions())
    const [backcastingRows, setBackcastingRows] = useState<BackcastingRow[]>(defaultBackcastingRows())
    const [backcastingEditModes, setBackcastingEditModes] = useState<boolean[]>(Array.from({ length: BACKCASTING_ROWS }, () => false))
    const [futureLetterText, setFutureLetterText] = useState('')
    const [futureLetterIsEditing, setFutureLetterIsEditing] = useState(false)
    const [futureLetterManualComplete, setFutureLetterManualComplete] = useState(false)
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')
    const [openMentorIndicatorRow, setOpenMentorIndicatorRow] = useState<number | null>(null)
    const [openLeaderHelpRow, setOpenLeaderHelpRow] = useState<number | null>(null)
    const [mentorCriteriaRows, setMentorCriteriaRows] = useState<MentorCriterionRow[]>(defaultMentorCriteriaRows())
    const [mentorCriteriaEditModes, setMentorCriteriaEditModes] = useState<boolean[]>(Array.from({ length: MENTOR_CRITERIA_ROWS }, () => false))
    const [mentorCriteriaSuggestions, setMentorCriteriaSuggestions] = useState<string[][]>(
        Array.from({ length: MENTOR_CRITERIA_ROWS }, () => [])
    )
    const [mentorGeneralNotes, setMentorGeneralNotes] = useState('')
    const [mentorGlobalDecision, setMentorGlobalDecision] = useState<MentorCriterionDecision>('')
    const [mentorClosureIsEditing, setMentorClosureIsEditing] = useState(false)
    const [leaderEvaluationRows, setLeaderEvaluationRows] = useState<LeaderEvaluationRow[]>(defaultLeaderEvaluationRows())
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: LEADER_EVALUATION_ROWS }, () => false)
    )
    const [leaderEvaluationSuggestions, setLeaderEvaluationSuggestions] = useState<string[][]>(
        Array.from({ length: LEADER_EVALUATION_ROWS }, () => [])
    )
    const [synthesisText, setSynthesisText] = useState('')
    const [synthesisFocus30Days, setSynthesisFocus30Days] = useState('')
    const [synthesisWeeklyAction, setSynthesisWeeklyAction] = useState('')
    const [synthesisIndicator, setSynthesisIndicator] = useState('')
    const [synthesisIsEditing, setSynthesisIsEditing] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        document.documentElement.classList.remove('dark')
        window.localStorage.setItem('theme', 'light')
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(ID_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as WB1IdentificationFields
            setIdFields({
                leaderName: parsed.leaderName || '',
                role: parsed.role || '',
                cohort: parsed.cohort || '',
                startDate: parsed.startDate || ''
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(ID_STORAGE_KEY, JSON.stringify(idFields))
    }, [idFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STORY_FIELDS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<StoryPageFields> & Record<string, unknown>
            setStoryFields({
                timelineRange: parsed.timelineRange || '',
                actOrigin: parsed.actOrigin || '',
                actBreak: parsed.actBreak || '',
                actRebuild: parsed.actRebuild || '',
                patternDecision: normalizePatternList(parsed.patternDecision),
                patternTrigger: normalizePatternList(parsed.patternTrigger),
                patternResource: normalizePatternList(parsed.patternResource)
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORY_FIELDS_STORAGE_KEY, JSON.stringify(storyFields))
    }, [storyFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STORY_EVENTS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as StoryEvent[]
            setStoryEvents(Array.isArray(parsed) ? parsed : [])
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORY_EVENTS_STORAGE_KEY, JSON.stringify(storyEvents))
    }, [storyEvents])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(IDENTITY_WHEEL_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<Record<IdentitySegmentKey, unknown>>
            setIdentityWheelFields({
                roles: normalizeIdentityList(parsed.roles),
                principios: normalizeIdentityList(parsed.principios),
                presion: normalizeIdentityList(parsed.presion),
                calma: normalizeIdentityList(parsed.calma),
                aporte: normalizeIdentityList(parsed.aporte),
                evito: normalizeIdentityList(parsed.evito),
                triggers: normalizeIdentityList(parsed.triggers),
                recursos: normalizeIdentityList(parsed.recursos)
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(IDENTITY_WHEEL_STORAGE_KEY, JSON.stringify(identityWheelFields))
    }, [identityWheelFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(IDENTITY_MATRIX_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setIdentityMatrixRows(normalizeIdentityMatrixRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(IDENTITY_MATRIX_STORAGE_KEY, JSON.stringify(identityMatrixRows))
    }, [identityMatrixRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(STAKEHOLDER_MIRROR_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setStakeholderRows(normalizeStakeholderRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STAKEHOLDER_MIRROR_STORAGE_KEY, JSON.stringify(stakeholderRows))
    }, [stakeholderRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(FUNDAMENTAL_VALUES_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<FundamentalValuesFields> & Record<string, unknown>
            const selected10 = normalizeFundamentalValuesList(parsed.selected10, 10)
            const selected5 = normalizeFundamentalValuesList(parsed.selected5, 5).filter((value) => selected10.includes(value))
            const selected3 = normalizeFundamentalValuesList(parsed.selected3, 3).filter((value) => selected5.includes(value))
            setFundamentalValues({
                selected10,
                selected5,
                selected3
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(FUNDAMENTAL_VALUES_STORAGE_KEY, JSON.stringify(fundamentalValues))
    }, [fundamentalValues])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(VALUE_DECISIONS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setValueDecisionRows(normalizeValueDecisionRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        setValueDecisionRows((prev) => {
            const previousByValue = new Map(
                prev
                    .filter((row) => row.value.trim().length > 0)
                    .map((row) => [row.value, row] as const)
            )

            return Array.from({ length: VALUE_DECISION_ROWS }, (_, index) => {
                const value = fundamentalValues.selected5[index] || ''
                const previous = previousByValue.get(value)
                return {
                    value,
                    decision1: previous?.decision1 || '',
                    decision2: previous?.decision2 || ''
                }
            })
        })
    }, [fundamentalValues.selected5])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(VALUE_DECISIONS_STORAGE_KEY, JSON.stringify(valueDecisionRows))
    }, [valueDecisionRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(NO_NEGOTIABLE_PHRASES_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setNoNegotiableRows(normalizeNoNegotiableRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        setNoNegotiableRows((prev) => {
            const previousByValue = new Map(
                prev
                    .filter((row) => row.value.trim().length > 0)
                    .map((row) => [row.value, row] as const)
            )

            return Array.from({ length: NO_NEGOTIABLE_ROWS }, (_, index) => {
                const value = fundamentalValues.selected3[index] || ''
                const previous = previousByValue.get(value)
                return {
                    value,
                    behavior: previous?.behavior || '',
                    implication: previous?.implication || ''
                }
            })
        })
        setNoNegotiableEditModes(Array.from({ length: NO_NEGOTIABLE_ROWS }, () => false))
    }, [fundamentalValues.selected3])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(NO_NEGOTIABLE_PHRASES_STORAGE_KEY, JSON.stringify(noNegotiableRows))
    }, [noNegotiableRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(FOA_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as Partial<Record<FoaQuadrantKey, unknown>>
            setFoaFields({
                strengths: normalizeFoaList(parsed.strengths),
                opportunities: normalizeFoaList(parsed.opportunities),
                threats: normalizeFoaList(parsed.threats)
            })
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(FOA_STORAGE_KEY, JSON.stringify(foaFields))
    }, [foaFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(ENERGY_MAP_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as {
                rows?: unknown
                patternBullets?: unknown
                doMore?: unknown
                doLess?: unknown
                redesign?: unknown
            }
            setEnergyMapRows(normalizeEnergyMapRows(parsed.rows))
            setEnergyPatternBullets(normalizeEnergyPatternList(parsed.patternBullets))
            setEnergyDoMore(typeof parsed.doMore === 'string' ? parsed.doMore : '')
            setEnergyDoLess(typeof parsed.doLess === 'string' ? parsed.doLess : '')
            setEnergyRedesign(typeof parsed.redesign === 'string' ? parsed.redesign : '')
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            ENERGY_MAP_STORAGE_KEY,
            JSON.stringify({
                rows: energyMapRows,
                patternBullets: energyPatternBullets,
                doMore: energyDoMore,
                doLess: energyDoLess,
                redesign: energyRedesign
            })
        )
    }, [energyMapRows, energyPatternBullets, energyDoMore, energyDoLess, energyRedesign])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(BELIEF_ABC_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setBeliefAbcRows(normalizeBeliefAbcRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(BELIEF_ABC_STORAGE_KEY, JSON.stringify(beliefAbcRows))
    }, [beliefAbcRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(BELIEF_EVIDENCE_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setBeliefEvidenceRows(normalizeBeliefEvidenceRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(BELIEF_EVIDENCE_STORAGE_KEY, JSON.stringify(beliefEvidenceRows))
    }, [beliefEvidenceRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(BELIEF_IMPACT_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as {
                selectedBelief?: unknown
                costs?: unknown
                opportunities?: unknown
                affected?: unknown
            }
            setBeliefImpactSelected(typeof parsed.selectedBelief === 'string' ? parsed.selectedBelief : '')
            setBeliefImpactCosts(normalizeBeliefImpactBullets(parsed.costs))
            setBeliefImpactLostOpportunities(normalizeBeliefImpactBullets(parsed.opportunities))
            setBeliefImpactAffectedRows(normalizeBeliefImpactAffectedRows(parsed.affected))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            BELIEF_IMPACT_STORAGE_KEY,
            JSON.stringify({
                selectedBelief: beliefImpactSelected,
                costs: beliefImpactCosts,
                opportunities: beliefImpactLostOpportunities,
                affected: beliefImpactAffectedRows
            })
        )
    }, [beliefImpactSelected, beliefImpactCosts, beliefImpactLostOpportunities, beliefImpactAffectedRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(EMPOWERING_BELIEF_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setEmpoweringBeliefRows(normalizeEmpoweringBeliefRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(EMPOWERING_BELIEF_STORAGE_KEY, JSON.stringify(empoweringBeliefRows))
    }, [empoweringBeliefRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(BRIDGE_EXPERIMENT_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setBridgeExperimentRows(normalizeBridgeExperimentRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(BRIDGE_EXPERIMENT_STORAGE_KEY, JSON.stringify(bridgeExperimentRows))
    }, [bridgeExperimentRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(MANTRA_CARDS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setMantraRows(normalizeMantraRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(MANTRA_CARDS_STORAGE_KEY, JSON.stringify(mantraRows))
    }, [mantraRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(FUTURE_SELF_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setFutureSelfFields(normalizeFutureSelfFields(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(FUTURE_SELF_STORAGE_KEY, JSON.stringify(futureSelfFields))
    }, [futureSelfFields])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(BACKCASTING_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setBackcastingRows(normalizeBackcastingRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(BACKCASTING_STORAGE_KEY, JSON.stringify(backcastingRows))
    }, [backcastingRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(FUTURE_LETTER_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as { text?: unknown; manualComplete?: unknown }
            setFutureLetterText(typeof parsed.text === 'string' ? parsed.text : '')
            setFutureLetterManualComplete(parsed.manualComplete === true)
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            FUTURE_LETTER_STORAGE_KEY,
            JSON.stringify({
                text: futureLetterText,
                manualComplete: futureLetterManualComplete
            })
        )
    }, [futureLetterText, futureLetterManualComplete])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(EVALUATION_MENTOR_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as {
                criteriaRows?: unknown
                notes?: unknown
                globalDecision?: unknown
            }
            setMentorCriteriaRows(normalizeMentorCriteriaRows(parsed.criteriaRows))
            setMentorGeneralNotes(typeof parsed.notes === 'string' ? parsed.notes : '')
            setMentorGlobalDecision(
                parsed.globalDecision === 'Consolidado' ||
                    parsed.globalDecision === 'En desarrollo' ||
                    parsed.globalDecision === 'Prioritario'
                    ? parsed.globalDecision
                    : ''
            )
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            EVALUATION_MENTOR_STORAGE_KEY,
            JSON.stringify({
                criteriaRows: mentorCriteriaRows,
                notes: mentorGeneralNotes,
                globalDecision: mentorGlobalDecision
            })
        )
    }, [mentorCriteriaRows, mentorGeneralNotes, mentorGlobalDecision])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(EVALUATION_LEADER_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as unknown
            setLeaderEvaluationRows(normalizeLeaderEvaluationRows(parsed))
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(EVALUATION_LEADER_STORAGE_KEY, JSON.stringify(leaderEvaluationRows))
    }, [leaderEvaluationRows])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem(EVALUATION_SYNTHESIS_STORAGE_KEY)
        if (!stored) return

        try {
            const parsed = JSON.parse(stored) as {
                text?: unknown
                focus30Days?: unknown
                weeklyAction?: unknown
                indicator?: unknown
            }
            setSynthesisText(typeof parsed.text === 'string' ? parsed.text : '')
            setSynthesisFocus30Days(typeof parsed.focus30Days === 'string' ? parsed.focus30Days : '')
            setSynthesisWeeklyAction(typeof parsed.weeklyAction === 'string' ? parsed.weeklyAction : '')
            setSynthesisIndicator(typeof parsed.indicator === 'string' ? parsed.indicator : '')
        } catch {
            // Ignore corrupted local storage and keep defaults.
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(
            EVALUATION_SYNTHESIS_STORAGE_KEY,
            JSON.stringify({
                text: synthesisText,
                focus30Days: synthesisFocus30Days,
                weeklyAction: synthesisWeeklyAction,
                indicator: synthesisIndicator
            })
        )
    }, [synthesisText, synthesisFocus30Days, synthesisWeeklyAction, synthesisIndicator])

    const completion = useMemo(() => {
        const idValues = Object.values(idFields)
        const narrativeValues = [storyFields.timelineRange, storyFields.actOrigin, storyFields.actBreak, storyFields.actRebuild]
        const patternValues = [storyFields.patternDecision, storyFields.patternTrigger, storyFields.patternResource]
        const identityValues = Object.values(identityWheelFields)
        const total = idValues.length + narrativeValues.length + patternValues.length + identityValues.length + 25
        const filledId = idValues.filter((value) => value.trim().length > 0).length
        const filledNarrative = narrativeValues.filter((value) => value.trim().length > 0).length
        const filledPatterns = patternValues.filter((list) => list.some((item) => item.trim().length > 0)).length
        const filledIdentity = identityValues.filter((list) => list.some((item) => item.trim().length > 0)).length
        const filledMatrix = identityMatrixRows.some(
            (row) => row.say.trim().length > 0 || row.do.trim().length > 0 || row.impact.trim().length > 0
        )
            ? 1
            : 0
        const filledStakeholders = stakeholderRows.some(
            (row) => row.personRole.trim().length > 0 || row.strength.trim().length > 0 || row.blindspot.trim().length > 0
        )
            ? 1
            : 0
        const filledValues10 = fundamentalValues.selected10.length === 10 ? 1 : 0
        const filledValues5 = fundamentalValues.selected5.length === 5 ? 1 : 0
        const filledValues3 = fundamentalValues.selected3.length === 3 ? 1 : 0
        const filledValueDecisionMatrix = valueDecisionRows.every(
            (row) => row.value.trim().length > 0 && row.decision1.trim().length > 0 && row.decision2.trim().length > 0
        )
            ? 1
            : 0
        const filledNoNegotiablePhrases = noNegotiableRows.every(
            (row) => row.value.trim().length > 0 && row.behavior.trim().length > 0 && row.implication.trim().length > 0
        )
            ? 1
            : 0
        const filledFoa = Object.values(foaFields).filter((list) => list.some((item) => item.trim().length > 0)).length
        const filledEnergyRows =
            energyMapRows.filter((row) => row.activity.trim().length > 0).length >= 12 ? 1 : 0
        const filledEnergyClosure =
            energyPatternBullets.some((item) => item.trim().length > 0) &&
            energyDoMore.trim().length > 0 &&
            energyDoLess.trim().length > 0 &&
            energyRedesign.trim().length > 0
                ? 1
                : 0
        const filledBeliefAbc = beliefAbcRows.every(
            (row) =>
                row.activator.trim().length > 0 &&
                row.belief.trim().length > 0 &&
                row.emotion.trim().length > 0 &&
                row.action.trim().length > 0
        )
            ? 1
            : 0
        const filledBeliefEvidence =
            beliefEvidenceRows.filter(
                (row) =>
                    row.limitingBelief.trim().length > 0 &&
                    row.evidenceFor.trim().length > 0 &&
                    row.evidenceAgainst.trim().length > 0 &&
                    row.newMeaning.trim().length > 0
            ).length > 0
                ? 1
                : 0
        const filledBeliefImpact =
            beliefImpactSelected.trim().length > 0 &&
            beliefImpactCosts.filter((item) => item.trim().length > 0).length >= 3 &&
            beliefImpactLostOpportunities.filter((item) => item.trim().length > 0).length >= 3 &&
            beliefImpactAffectedRows.every((row) => row.person.trim().length > 0 && row.impact.trim().length > 0)
                ? 1
                : 0
        const filledEmpoweringBeliefs = empoweringBeliefRows.every(
            (row) =>
                row.limitingBelief.trim().length > 0 &&
                row.idealBelief.trim().length > 0 &&
                row.bridgeBelief.trim().length > 0
        )
            ? 1
            : 0
        const filledBridgeExperiment = bridgeExperimentRows.every(
            (row) =>
                row.bridgeBelief.trim().length > 0 &&
                row.dailyBehavior.trim().length > 0 &&
                row.evidence.trim().length > 0 &&
                row.indicator.trim().length > 0
        )
            ? 1
            : 0
        const filledMantras = mantraRows.every((row) => isMantraCardComplete(row)) ? 1 : 0
        const filledFutureSelf = FUTURE_SELF_BLOCK_ORDER.every((key) => isFutureSelfBlockComplete(key, futureSelfFields)) ? 1 : 0
        const filledBackcasting = backcastingRows.every((row) => isBackcastingRowComplete(row)) ? 1 : 0
        const futureLetterChecklist = detectFutureLetterChecklist(futureLetterText)
        const filledFutureLetter = isFutureLetterComplete(futureLetterChecklist, futureLetterManualComplete) ? 1 : 0
        const filledEvaluationMentor =
            mentorCriteriaRows.every((row) => isMentorCriterionComplete(row)) &&
            mentorGeneralNotes.trim().length > 0 &&
            mentorGlobalDecision !== ''
                ? 1
                : 0
        const filledEvaluationLeader = leaderEvaluationRows.every((row) => isLeaderEvaluationRowComplete(row)) ? 1 : 0
        const filledEvaluationSynthesis = synthesisText.trim().length > 0 ? 1 : 0
        const filled =
            filledId +
            filledNarrative +
            filledPatterns +
            filledIdentity +
            filledMatrix +
            filledStakeholders +
            filledValues10 +
            filledValues5 +
            filledValues3 +
            filledValueDecisionMatrix +
            filledNoNegotiablePhrases +
            filledFoa +
            filledEnergyRows +
            filledEnergyClosure +
            filledBeliefAbc +
            filledBeliefEvidence +
            filledBeliefImpact +
            filledEmpoweringBeliefs +
            filledBridgeExperiment +
            filledMantras +
            filledFutureSelf +
            filledBackcasting +
            filledFutureLetter +
            filledEvaluationMentor +
            filledEvaluationLeader +
            filledEvaluationSynthesis +
            (storyEvents.length > 0 ? 1 : 0)
        return Math.round((filled / total) * 100)
    }, [idFields, storyFields, identityWheelFields, identityMatrixRows, stakeholderRows, fundamentalValues, valueDecisionRows, noNegotiableRows, foaFields, energyMapRows, energyPatternBullets, energyDoMore, energyDoLess, energyRedesign, beliefAbcRows, beliefEvidenceRows, beliefImpactSelected, beliefImpactCosts, beliefImpactLostOpportunities, beliefImpactAffectedRows, empoweringBeliefRows, bridgeExperimentRows, mantraRows, futureSelfFields, backcastingRows, futureLetterText, futureLetterManualComplete, mentorCriteriaRows, mentorGeneralNotes, mentorGlobalDecision, leaderEvaluationRows, synthesisText, storyEvents.length])

    const orderedEvents = useMemo(() => {
        return [...storyEvents].sort(sortByApproxDate)
    }, [storyEvents])

    const limitingBeliefOptions = useMemo(() => {
        const seen = new Set<string>()
        const options: string[] = []

        beliefEvidenceRows.forEach((row) => {
            const value = row.limitingBelief.trim()
            if (!value || seen.has(value)) return
            seen.add(value)
            options.push(value)
        })

        return options
    }, [beliefEvidenceRows])

    const bridgeBeliefOptions = useMemo(() => {
        const seen = new Set<string>()
        const options: string[] = []

        empoweringBeliefRows.forEach((row) => {
            const value = row.bridgeBelief.trim()
            if (!value || seen.has(value)) return
            seen.add(value)
            options.push(value)
        })

        return options
    }, [empoweringBeliefRows])

    const futureLetterChecklist = useMemo(() => detectFutureLetterChecklist(futureLetterText), [futureLetterText])
    const futureLetterWordCount = useMemo(() => countWords(futureLetterText), [futureLetterText])
    const futureLetterCompleted = useMemo(
        () => isFutureLetterComplete(futureLetterChecklist, futureLetterManualComplete),
        [futureLetterChecklist, futureLetterManualComplete]
    )
    const mentorCompletedRows = useMemo(
        () => mentorCriteriaRows.filter((row) => isMentorCriterionComplete(row)).length,
        [mentorCriteriaRows]
    )
    const mentorSectionCompleted = useMemo(
        () => mentorCompletedRows === MENTOR_CRITERIA_ROWS && mentorGlobalDecision !== '' && mentorGeneralNotes.trim().length > 0,
        [mentorCompletedRows, mentorGlobalDecision, mentorGeneralNotes]
    )
    const leaderCompletedRows = useMemo(
        () => leaderEvaluationRows.filter((row) => isLeaderEvaluationRowComplete(row)).length,
        [leaderEvaluationRows]
    )
    const leaderSectionCompleted = useMemo(() => leaderCompletedRows === LEADER_EVALUATION_ROWS, [leaderCompletedRows])
    const synthesisSectionCompleted = useMemo(() => synthesisText.trim().length > 0, [synthesisText])
    const evaluationCompleted = useMemo(
        () => mentorSectionCompleted && leaderSectionCompleted && synthesisSectionCompleted,
        [mentorSectionCompleted, leaderSectionCompleted, synthesisSectionCompleted]
    )
    const extractedCommitments = useMemo(
        () =>
            leaderEvaluationRows
                .map((row) => row.action.trim())
                .filter((action) => action.length > 0)
                .slice(0, 3),
        [leaderEvaluationRows]
    )

    useEffect(() => {
        if (!beliefImpactSelected) return
        if (limitingBeliefOptions.includes(beliefImpactSelected)) return
        setBeliefImpactSelected('')
    }, [beliefImpactSelected, limitingBeliefOptions])

    useEffect(() => {
        setBridgeExperimentRows((prev) => {
            let changed = false
            const next = prev.map((row) => {
                const value = row.bridgeBelief.trim()
                if (!value || bridgeBeliefOptions.includes(value)) return row
                changed = true
                return { ...row, bridgeBelief: '' }
            })

            return changed ? next : prev
        })
    }, [bridgeBeliefOptions])

    const identityWheelSize = IDENTITY_WHEEL_SIZES[identityWheelSizeIndex]

    const currentPageIndex = PAGES.findIndex((page) => page.id === activePage)
    const hasPrevPage = currentPageIndex > 0
    const hasNextPage = currentPageIndex >= 0 && currentPageIndex < PAGES.length - 1
    const isPageVisible = (pageId: number) => isExportingAll || activePage === pageId

    const waitForRenderCycle = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

    const createHtmlSnapshotWithFormState = () => {
        const originalRoot = document.documentElement
        const clonedRoot = originalRoot.cloneNode(true) as HTMLElement

        const originalFields = Array.from(originalRoot.querySelectorAll('input, textarea, select'))
        const clonedFields = Array.from(clonedRoot.querySelectorAll('input, textarea, select'))

        clonedFields.forEach((field, index) => {
            const originalField = originalFields[index]
            if (!originalField) return

            if (field instanceof HTMLInputElement && originalField instanceof HTMLInputElement) {
                field.value = originalField.value
                if (originalField.type !== 'file') {
                    field.setAttribute('value', originalField.value)
                }

                if (originalField.type === 'checkbox' || originalField.type === 'radio') {
                    if (originalField.checked) {
                        field.setAttribute('checked', 'checked')
                    } else {
                        field.removeAttribute('checked')
                    }
                }
                return
            }

            if (field instanceof HTMLTextAreaElement && originalField instanceof HTMLTextAreaElement) {
                field.value = originalField.value
                field.textContent = originalField.value
                return
            }

            if (field instanceof HTMLSelectElement && originalField instanceof HTMLSelectElement) {
                field.value = originalField.value
                Array.from(field.options).forEach((option) => {
                    option.selected = option.value === originalField.value
                    if (option.selected) {
                        option.setAttribute('selected', 'selected')
                    } else {
                        option.removeAttribute('selected')
                    }
                })
            }
        })

        return '<!doctype html>\n' + clonedRoot.outerHTML
    }

    const exportPdf = async () => {
        if (isExporting) return
        setIsExporting(true)
        setIsExportingAll(true)

        try {
            await waitForRenderCycle()
            window.print()
        } finally {
            setIsExportingAll(false)
            setIsExporting(false)
        }
    }

    const exportHtml = async () => {
        if (isExporting) return
        setIsExporting(true)
        setIsExportingAll(true)

        try {
            await waitForRenderCycle()

            const origin = window.location.origin
            let htmlContent = createHtmlSnapshotWithFormState()
            htmlContent = htmlContent.replace(/\b(href|src)=\"\/(?!\/)/g, `$1="${origin}/`)

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'WB1-creencias-identidad-pilares-personales-completo.html'
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
        } finally {
            setIsExportingAll(false)
            setIsExporting(false)
        }
    }

    const setIdField = (key: keyof WB1IdentificationFields, value: string) => {
        if (isLocked) return
        setIdFields((prev) => ({ ...prev, [key]: value }))
    }

    const saveIdentificationFields = () => {
        if (isLocked) return
        setIdFields((prev) => ({
            leaderName: prev.leaderName.trim(),
            role: prev.role.trim(),
            cohort: prev.cohort.trim(),
            startDate: prev.startDate.trim()
        }))
    }

    const setStoryField = (key: StoryTextFieldKey, value: string) => {
        if (isLocked) return
        setStoryFields((prev) => ({ ...prev, [key]: value }))
    }

    const saveStoryStep1 = () => {
        if (isLocked) return
        setStoryFields((prev) => ({
            ...prev,
            timelineRange: prev.timelineRange.trim()
        }))
    }

    const saveStoryStep2 = () => {
        if (isLocked) return
        setStoryFields((prev) => ({
            ...prev,
            actOrigin: prev.actOrigin.trim(),
            actBreak: prev.actBreak.trim(),
            actRebuild: prev.actRebuild.trim()
        }))
    }

    const saveIdentityMatrix = () => {
        if (isLocked) return
        setIdentityMatrixRows((prev) =>
            prev.map((row) => ({
                say: row.say.trim(),
                do: row.do.trim(),
                impact: row.impact.trim()
            }))
        )
    }

    const saveStakeholderMirror = () => {
        if (isLocked) return
        setStakeholderRows((prev) =>
            prev.map((row) => ({
                personRole: row.personRole.trim(),
                strength: row.strength.trim(),
                blindspot: row.blindspot.trim()
            }))
        )
    }

    const saveFundamentalValueSelection = () => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            const selected10 = normalizeFundamentalValuesList(prev.selected10, 10)
            const selected5 = normalizeFundamentalValuesList(
                prev.selected5.filter((value) => selected10.includes(value)),
                5
            )
            const selected3 = normalizeFundamentalValuesList(
                prev.selected3.filter((value) => selected5.includes(value)),
                3
            )
            return { selected10, selected5, selected3 }
        })
    }

    const saveValueDecisionMatrix = () => {
        if (isLocked) return
        setValueDecisionRows((prev) =>
            prev.map((row) => ({
                value: row.value.trim(),
                decision1: row.decision1.trim(),
                decision2: row.decision2.trim()
            }))
        )
    }

    const saveEnergyMap = () => {
        if (isLocked) return
        setEnergyMapRows((prev) =>
            prev.map((row) => ({
                activity: row.activity.trim(),
                sign: row.sign,
                energy: row.energy,
                reason: row.reason.trim(),
                adjust: row.adjust
            }))
        )
    }

    const saveEnergyClosure = () => {
        if (isLocked) return
        setEnergyPatternBullets((prev) => prev.map((item) => item.trim()))
        setEnergyDoMore((prev) => prev.trim())
        setEnergyDoLess((prev) => prev.trim())
        setEnergyRedesign((prev) => prev.trim())
    }

    const saveEnergyInstrument = () => {
        if (isLocked) return
        saveEnergyMap()
        saveEnergyClosure()
    }

    const saveBeliefEvidenceMatrix = () => {
        if (isLocked) return
        setBeliefEvidenceRows((prev) =>
            prev.map((row) => ({
                limitingBelief: row.limitingBelief.trim(),
                evidenceFor: row.evidenceFor.trim(),
                evidenceAgainst: row.evidenceAgainst.trim(),
                newMeaning: row.newMeaning.trim()
            }))
        )
    }

    const editPatternList = (key: PatternListKey) => {
        if (isLocked) return
        setPatternEditModes((prev) => ({ ...prev, [key]: true }))
    }

    const savePatternList = (key: PatternListKey) => {
        setStoryFields((prev) => ({
            ...prev,
            [key]: prev[key].map((item) => item.trim())
        }))
        setPatternEditModes((prev) => ({ ...prev, [key]: false }))
    }

    const setPatternBullet = (key: PatternListKey, index: number, value: string) => {
        if (isLocked || !patternEditModes[key]) return
        setStoryFields((prev) => {
            const nextList = [...prev[key]]
            nextList[index] = value
            return {
                ...prev,
                [key]: nextList
            }
        })
    }

    const editIdentitySegment = (key: IdentitySegmentKey) => {
        if (isLocked) return
        setIdentityEditModes((prev) => ({ ...prev, [key]: true }))
    }

    const saveIdentitySegment = (key: IdentitySegmentKey) => {
        setIdentityWheelFields((prev) => ({
            ...prev,
            [key]: prev[key].map((item) => item.trim())
        }))
        setIdentityEditModes((prev) => ({ ...prev, [key]: false }))
    }

    const setIdentityBullet = (key: IdentitySegmentKey, index: number, value: string) => {
        if (isLocked || !identityEditModes[key]) return
        setIdentityWheelFields((prev) => {
            const nextList = [...prev[key]]
            nextList[index] = value
            return {
                ...prev,
                [key]: nextList
            }
        })
    }

    const setIdentityMatrixCell = (rowIndex: number, field: IdentityMatrixFieldKey, value: string) => {
        if (isLocked) return
        setIdentityMatrixRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const setStakeholderCell = (rowIndex: number, field: StakeholderFieldKey, value: string) => {
        if (isLocked) return
        setStakeholderRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const setValueDecisionCell = (rowIndex: number, field: ValueDecisionFieldKey, value: string) => {
        if (isLocked) return
        setValueDecisionRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target || target.value.trim().length === 0) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editNoNegotiableRow = (rowIndex: number) => {
        if (isLocked) return
        setNoNegotiableEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
    }

    const saveNoNegotiableRow = (rowIndex: number) => {
        setNoNegotiableRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = {
                ...target,
                behavior: target.behavior.trim(),
                implication: target.implication.trim()
            }
            return nextRows
        })
        setNoNegotiableEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setNoNegotiableCell = (rowIndex: number, field: NoNegotiableFieldKey, value: string) => {
        if (isLocked || !noNegotiableEditModes[rowIndex]) return
        setNoNegotiableRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target || target.value.trim().length === 0) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editFoaQuadrant = (key: FoaQuadrantKey) => {
        if (isLocked) return
        setFoaEditModes((prev) => ({ ...prev, [key]: true }))
    }

    const saveFoaQuadrant = (key: FoaQuadrantKey) => {
        setFoaFields((prev) => ({
            ...prev,
            [key]: prev[key].map((item) => item.trim())
        }))
        setFoaEditModes((prev) => ({ ...prev, [key]: false }))
    }

    const setFoaBullet = (key: FoaQuadrantKey, index: number, value: string) => {
        if (isLocked || !foaEditModes[key]) return
        setFoaFields((prev) => {
            const nextList = [...prev[key]]
            nextList[index] = value
            return {
                ...prev,
                [key]: nextList
            }
        })
    }

    const setEnergyMapCell = (rowIndex: number, field: EnergyMapFieldKey, value: string) => {
        if (isLocked) return
        setEnergyMapRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev

            if (field === 'sign') {
                nextRows[rowIndex] = { ...target, sign: value === '+' || value === '-' ? value : '' }
                return nextRows
            }

            if (field === 'energy') {
                nextRows[rowIndex] = { ...target, energy: /^([0-9]|10)$/.test(value) ? value : '' }
                return nextRows
            }

            if (field === 'adjust') {
                nextRows[rowIndex] = {
                    ...target,
                    adjust: value === 'Más' || value === 'Menos' || value === 'Rediseñar' ? value : ''
                }
                return nextRows
            }

            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const setEnergyPatternBullet = (index: number, value: string) => {
        if (isLocked) return
        setEnergyPatternBullets((prev) => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }

    const editBeliefAbcRow = (rowIndex: number) => {
        if (isLocked) return
        setBeliefAbcEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
    }

    const saveBeliefAbcRow = (rowIndex: number) => {
        setBeliefAbcRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = {
                activator: target.activator.trim(),
                belief: target.belief.trim(),
                emotion: target.emotion.trim(),
                action: target.action.trim()
            }
            return nextRows
        })
        setBeliefAbcEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setBeliefAbcCell = (rowIndex: number, field: BeliefAbcFieldKey, value: string) => {
        if (isLocked || !beliefAbcEditModes[rowIndex]) return
        setBeliefAbcRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const setBeliefEvidenceCell = (rowIndex: number, field: BeliefEvidenceFieldKey, value: string) => {
        if (isLocked) return
        setBeliefEvidenceRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const startBeliefImpactEdit = () => {
        if (isLocked) return
        setBeliefImpactIsEditing(true)
    }

    const saveBeliefImpact = () => {
        setBeliefImpactCosts((prev) => prev.map((item) => item.trim()))
        setBeliefImpactLostOpportunities((prev) => prev.map((item) => item.trim()))
        setBeliefImpactAffectedRows((prev) =>
            prev.map((row) => ({
                person: row.person.trim(),
                impact: row.impact.trim()
            }))
        )
        setBeliefImpactIsEditing(false)
    }

    const setBeliefImpactCost = (index: number, value: string) => {
        if (isLocked || !beliefImpactIsEditing) return
        setBeliefImpactCosts((prev) => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }

    const setBeliefImpactOpportunity = (index: number, value: string) => {
        if (isLocked || !beliefImpactIsEditing) return
        setBeliefImpactLostOpportunities((prev) => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }

    const setBeliefImpactAffectedCell = (rowIndex: number, field: keyof BeliefImpactAffectedRow, value: string) => {
        if (isLocked || !beliefImpactIsEditing) return
        setBeliefImpactAffectedRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editEmpoweringBeliefRow = (rowIndex: number) => {
        if (isLocked) return
        setEmpoweringBeliefEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
    }

    const saveEmpoweringBeliefRow = (rowIndex: number) => {
        setEmpoweringBeliefRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = {
                limitingBelief: target.limitingBelief.trim(),
                idealBelief: target.idealBelief.trim(),
                bridgeBelief: target.bridgeBelief.trim()
            }
            return nextRows
        })
        setEmpoweringBeliefEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setEmpoweringBeliefCell = (rowIndex: number, field: EmpoweringBeliefFieldKey, value: string) => {
        if (isLocked || !empoweringBeliefEditModes[rowIndex]) return
        setEmpoweringBeliefRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editBridgeExperimentRow = (rowIndex: number) => {
        if (isLocked) return
        setBridgeExperimentEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
    }

    const saveBridgeExperimentRow = (rowIndex: number) => {
        setBridgeExperimentRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = {
                bridgeBelief: target.bridgeBelief.trim(),
                dailyBehavior: target.dailyBehavior.trim(),
                evidence: target.evidence.trim(),
                indicator: target.indicator.trim()
            }
            return nextRows
        })
        setBridgeExperimentEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setBridgeExperimentCell = (rowIndex: number, field: BridgeExperimentFieldKey, value: string) => {
        if (isLocked || !bridgeExperimentEditModes[rowIndex]) return
        setBridgeExperimentRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editMantraRow = (rowIndex: number) => {
        if (isLocked) return
        setMantraEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
        setMantraSuggestions((prev) => prev.map((list, index) => (index === rowIndex ? [] : list)))
    }

    const saveMantraRow = (rowIndex: number) => {
        const targetRow = mantraRows[rowIndex]
        if (!targetRow) return

        const trimmedRow: MantraCardRow = {
            mantra: targetRow.mantra.trim(),
            situation: targetRow.situation.trim(),
            behavior: targetRow.behavior.trim(),
            signal: targetRow.signal.trim()
        }

        setMantraRows((prev) => {
            const nextRows = [...prev]
            if (!nextRows[rowIndex]) return prev
            nextRows[rowIndex] = trimmedRow
            return nextRows
        })

        setMantraSuggestions((prev) => prev.map((list, index) => (index === rowIndex ? getMantraSuggestions(trimmedRow) : list)))
        setMantraEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setMantraCell = (rowIndex: number, field: MantraCardFieldKey, value: string) => {
        if (isLocked || !mantraEditModes[rowIndex]) return
        setMantraRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editFutureSelfBlock = (key: FutureSelfBlockKey) => {
        if (isLocked) return
        setFutureSelfEditModes((prev) => ({ ...prev, [key]: true }))
        setFutureSelfSuggestions((prev) => ({ ...prev, [key]: [] }))
    }

    const saveFutureSelfBlock = (key: FutureSelfBlockKey) => {
        const trimmedFields = trimFutureSelfFields(futureSelfFields)
        setFutureSelfFields(trimmedFields)
        setFutureSelfSuggestions((prev) => ({ ...prev, [key]: getFutureSelfBlockSuggestions(key, trimmedFields) }))
        setFutureSelfEditModes((prev) => ({ ...prev, [key]: false }))
    }

    const setFutureSelfListItem = (key: FutureSelfListBlockKey, index: number, value: string) => {
        if (isLocked || !futureSelfEditModes[key]) return
        setFutureSelfFields((prev) => {
            const nextList = [...prev[key]]
            nextList[index] = value
            return { ...prev, [key]: nextList }
        })
    }

    const setFutureSelfEnvironmentField = (field: FutureSelfEnvironmentFieldKey, value: string) => {
        if (isLocked || !futureSelfEditModes.environment) return
        setFutureSelfFields((prev) => ({
            ...prev,
            environment: {
                ...prev.environment,
                [field]: value
            }
        }))
    }

    const setFutureSelfImpactField = (field: FutureSelfImpactFieldKey, value: string) => {
        if (isLocked || !futureSelfEditModes.impact) return
        setFutureSelfFields((prev) => ({
            ...prev,
            impact: {
                ...prev.impact,
                [field]: value
            }
        }))
    }

    const setFutureSelfRiskField = (rowIndex: number, field: FutureSelfRiskFieldKey, value: string) => {
        if (isLocked || !futureSelfEditModes.risks) return
        setFutureSelfFields((prev) => {
            const nextRows = [...prev.risks]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return {
                ...prev,
                risks: nextRows
            }
        })
    }

    const editBackcastingRow = (rowIndex: number) => {
        if (isLocked) return
        setBackcastingEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
    }

    const saveBackcastingRow = (rowIndex: number) => {
        setBackcastingRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = {
                achievement: target.achievement.trim(),
                habit: target.habit.trim(),
                evidence: target.evidence.trim()
            }
            return nextRows
        })
        setBackcastingEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setBackcastingCell = (rowIndex: number, field: BackcastingFieldKey, value: string) => {
        if (isLocked || !backcastingEditModes[rowIndex]) return
        setBackcastingRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editFutureLetter = () => {
        if (isLocked) return
        setFutureLetterIsEditing(true)
    }

    const saveFutureLetter = () => {
        if (isLocked) return
        setFutureLetterText((prev) => prev.trim())
        setFutureLetterIsEditing(false)
    }

    const toggleFutureLetterManualComplete = () => {
        if (isLocked) return
        setFutureLetterManualComplete((prev) => !prev)
    }

    const changeEvaluationStage = (stage: EvaluationStageKey) => {
        setEvaluationStage(stage)
    }

    const goPrevEvaluationStage = () => {
        const currentIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
        if (currentIndex <= 0) return
        setEvaluationStage(EVALUATION_STAGES[currentIndex - 1].key)
    }

    const goNextEvaluationStage = () => {
        const currentIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
        if (currentIndex < 0 || currentIndex >= EVALUATION_STAGES.length - 1) return
        setEvaluationStage(EVALUATION_STAGES[currentIndex + 1].key)
    }

    const toggleMentorIndicators = (rowIndex: number) => {
        setOpenMentorIndicatorRow((prev) => (prev === rowIndex ? null : rowIndex))
    }

    const editMentorCriterionRow = (rowIndex: number) => {
        if (isLocked) return
        setMentorCriteriaEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
        setMentorCriteriaSuggestions((prev) => prev.map((list, index) => (index === rowIndex ? [] : list)))
    }

    const saveMentorCriterionRow = (rowIndex: number) => {
        const targetRow = mentorCriteriaRows[rowIndex]
        if (!targetRow) return
        const trimmedRow: MentorCriterionRow = {
            criterion: targetRow.criterion,
            level: targetRow.level,
            evidence: targetRow.evidence.trim(),
            decision: targetRow.decision
        }

        setMentorCriteriaRows((prev) => {
            const nextRows = [...prev]
            if (!nextRows[rowIndex]) return prev
            nextRows[rowIndex] = trimmedRow
            return nextRows
        })
        setMentorCriteriaSuggestions((prev) => prev.map((list, index) => (index === rowIndex ? getMentorCriterionSuggestions(trimmedRow) : list)))
        setMentorCriteriaEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setMentorCriterionField = (rowIndex: number, field: MentorCriterionFieldKey, value: string) => {
        if (isLocked || !mentorCriteriaEditModes[rowIndex]) return
        setMentorCriteriaRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev

            if (field === 'level') {
                const level: MentorCriterionLevel =
                    value === 'N1' || value === 'N2' || value === 'N3' || value === 'N4' ? value : ''
                nextRows[rowIndex] = { ...target, level }
                return nextRows
            }

            if (field === 'decision') {
                const decision: MentorCriterionDecision =
                    value === 'Consolidado' || value === 'En desarrollo' || value === 'Prioritario' ? value : ''
                nextRows[rowIndex] = { ...target, decision }
                return nextRows
            }

            nextRows[rowIndex] = { ...target, evidence: value }
            return nextRows
        })
    }

    const editMentorClosure = () => {
        if (isLocked) return
        setMentorClosureIsEditing(true)
    }

    const saveMentorClosure = () => {
        if (isLocked) return
        setMentorGeneralNotes((prev) => prev.trim())
        setMentorClosureIsEditing(false)
    }

    const setMentorGlobalDecisionValue = (value: string) => {
        if (isLocked || !mentorClosureIsEditing) return
        const decision: MentorCriterionDecision =
            value === 'Consolidado' || value === 'En desarrollo' || value === 'Prioritario' ? value : ''
        setMentorGlobalDecision(decision)
    }

    const toggleLeaderHelp = (rowIndex: number) => {
        setOpenLeaderHelpRow((prev) => (prev === rowIndex ? null : rowIndex))
    }

    const editLeaderEvaluationRow = (rowIndex: number) => {
        if (isLocked) return
        setLeaderEvaluationEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? true : mode)))
        setLeaderEvaluationSuggestions((prev) => prev.map((list, index) => (index === rowIndex ? [] : list)))
    }

    const saveLeaderEvaluationRow = (rowIndex: number) => {
        const targetRow = leaderEvaluationRows[rowIndex]
        if (!targetRow) return
        const trimmedRow: LeaderEvaluationRow = {
            question: targetRow.question,
            response: targetRow.response.trim(),
            evidence: targetRow.evidence.trim(),
            action: targetRow.action.trim()
        }

        setLeaderEvaluationRows((prev) => {
            const nextRows = [...prev]
            if (!nextRows[rowIndex]) return prev
            nextRows[rowIndex] = trimmedRow
            return nextRows
        })
        setLeaderEvaluationSuggestions((prev) =>
            prev.map((list, index) => (index === rowIndex ? getLeaderEvaluationSuggestions(trimmedRow) : list))
        )
        setLeaderEvaluationEditModes((prev) => prev.map((mode, index) => (index === rowIndex ? false : mode)))
    }

    const setLeaderEvaluationField = (rowIndex: number, field: LeaderEvaluationFieldKey, value: string) => {
        if (isLocked || !leaderEvaluationEditModes[rowIndex]) return
        setLeaderEvaluationRows((prev) => {
            const nextRows = [...prev]
            const target = nextRows[rowIndex]
            if (!target) return prev
            nextRows[rowIndex] = { ...target, [field]: value }
            return nextRows
        })
    }

    const editSynthesisBlock = () => {
        if (isLocked) return
        setSynthesisIsEditing(true)
    }

    const saveSynthesisBlock = () => {
        if (isLocked) return
        setSynthesisText((prev) => prev.trim())
        setSynthesisFocus30Days((prev) => prev.trim())
        setSynthesisWeeklyAction((prev) => prev.trim())
        setSynthesisIndicator((prev) => prev.trim())
        setSynthesisIsEditing(false)
    }

    const toggleFundamentalValue10 = (value: string) => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            const isSelected = prev.selected10.includes(value)
            if (isSelected) {
                const selected10 = prev.selected10.filter((item) => item !== value)
                const selected5 = prev.selected5.filter((item) => selected10.includes(item))
                const selected3 = prev.selected3.filter((item) => selected5.includes(item))
                return { selected10, selected5, selected3 }
            }

            if (prev.selected10.length >= 10) return prev
            return { ...prev, selected10: [...prev.selected10, value] }
        })
    }

    const toggleFundamentalValue5 = (value: string) => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            if (!prev.selected10.includes(value)) return prev
            const isSelected = prev.selected5.includes(value)

            if (isSelected) {
                const selected5 = prev.selected5.filter((item) => item !== value)
                const selected3 = prev.selected3.filter((item) => selected5.includes(item))
                return { ...prev, selected5, selected3 }
            }

            if (prev.selected5.length >= 5) return prev
            return { ...prev, selected5: [...prev.selected5, value] }
        })
    }

    const toggleFundamentalValue3 = (value: string) => {
        if (isLocked) return
        setFundamentalValues((prev) => {
            if (!prev.selected5.includes(value)) return prev
            const isSelected = prev.selected3.includes(value)

            if (isSelected) {
                return { ...prev, selected3: prev.selected3.filter((item) => item !== value) }
            }

            if (prev.selected3.length >= 3) return prev
            return { ...prev, selected3: [...prev.selected3, value] }
        })
    }

    const zoomIdentityWheelIn = () => {
        setIdentityWheelSizeIndex((prev) => Math.min(prev + 1, IDENTITY_WHEEL_SIZES.length - 1))
    }

    const zoomIdentityWheelOut = () => {
        setIdentityWheelSizeIndex((prev) => Math.max(prev - 1, 0))
    }

    const jumpToPage = (page: number) => {
        setActivePage(page)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const goPrevPage = () => {
        if (!hasPrevPage) return
        jumpToPage(PAGES[currentPageIndex - 1].id)
    }

    const goNextPage = () => {
        if (!hasNextPage) return
        jumpToPage(PAGES[currentPageIndex + 1].id)
    }

    const openEventModal = () => {
        if (isLocked || storyEvents.length >= STORY_EVENT_LIMIT) return
        setEventDraft(defaultEventDraft())
        setShowEventModal(true)
    }

    const validateEventDraft = () => {
        return (
            eventDraft.approxDate.trim() &&
            eventDraft.happened.trim() &&
            eventDraft.interpreted.trim() &&
            eventDraft.learned.trim() &&
            eventDraft.belief.trim()
        )
    }

    const saveEvent = () => {
        if (isLocked || !validateEventDraft()) return
        if (storyEvents.length >= STORY_EVENT_LIMIT) return

        const nextEvent: StoryEvent = {
            id: crypto.randomUUID(),
            ...eventDraft
        }

        setStoryEvents((prev) => [...prev, nextEvent])
        setShowEventModal(false)
    }

    const removeEvent = (id: string) => {
        if (isLocked) return
        setStoryEvents((prev) => prev.filter((event) => event.id !== id))
    }

    const toggleActHelp = (key: StoryActHelpKey) => {
        setOpenActHelp((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const visiblePatternBullets = (key: PatternListKey) => storyFields[key].map((item) => item.trim()).filter(Boolean)
    const visibleIdentityBullets = (key: IdentitySegmentKey) => identityWheelFields[key].map((item) => item.trim()).filter(Boolean)
    const visibleFoaBullets = (key: FoaQuadrantKey) => foaFields[key].map((item) => item.trim()).filter(Boolean)
    const energyRowsWithActivity = energyMapRows.filter((row) => row.activity.trim().length > 0).length
    const completedBeliefAbcRows = beliefAbcRows.filter(
        (row) =>
            row.activator.trim().length > 0 &&
            row.belief.trim().length > 0 &&
            row.emotion.trim().length > 0 &&
            row.action.trim().length > 0
    ).length
    const completedBeliefEvidenceRows = beliefEvidenceRows.filter(
        (row) =>
            row.limitingBelief.trim().length > 0 &&
            row.evidenceFor.trim().length > 0 &&
            row.evidenceAgainst.trim().length > 0 &&
            row.newMeaning.trim().length > 0
    ).length
    const beliefImpactCostsCount = beliefImpactCosts.filter((item) => item.trim().length > 0).length
    const beliefImpactOpportunitiesCount = beliefImpactLostOpportunities.filter((item) => item.trim().length > 0).length
    const beliefImpactAffectedCount = beliefImpactAffectedRows.filter(
        (row) => row.person.trim().length > 0 && row.impact.trim().length > 0
    ).length
    const completedEmpoweringBeliefRows = empoweringBeliefRows.filter(
        (row) =>
            row.limitingBelief.trim().length > 0 &&
            row.idealBelief.trim().length > 0 &&
            row.bridgeBelief.trim().length > 0
    ).length
    const completedBridgeExperimentRows = bridgeExperimentRows.filter(
        (row) =>
            row.bridgeBelief.trim().length > 0 &&
            row.dailyBehavior.trim().length > 0 &&
            row.evidence.trim().length > 0 &&
            row.indicator.trim().length > 0
    ).length
    const completedMantraRows = mantraRows.filter((row) => isMantraCardComplete(row)).length
    const completedFutureSelfBlocks = FUTURE_SELF_BLOCK_ORDER.filter((key) => isFutureSelfBlockComplete(key, futureSelfFields)).length
    const completedBackcastingRows = backcastingRows.filter((row) => isBackcastingRowComplete(row)).length
    const completedFutureLetterChecks = Object.values(futureLetterChecklist).filter(Boolean).length
    const futureLetterWithinSuggestedRange =
        futureLetterWordCount >= FUTURE_LETTER_WORD_MIN && futureLetterWordCount <= FUTURE_LETTER_WORD_MAX
    const evaluationStageIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
    const hasPrevEvaluationStage = evaluationStageIndex > 0
    const hasNextEvaluationStage = evaluationStageIndex >= 0 && evaluationStageIndex < EVALUATION_STAGES.length - 1
    const evaluationStageCompletionMap: Record<EvaluationStageKey, boolean> = {
        mentor: mentorSectionCompleted,
        leader: leaderSectionCompleted,
        synthesis: synthesisSectionCompleted,
        final: evaluationCompleted
    }
    const canSelectTop5 = fundamentalValues.selected10.length === 10
    const canSelectTop3 = fundamentalValues.selected5.length === 5
    const canUseValueDecisionMatrix = fundamentalValues.selected5.length === 5
    const canUseNoNegotiablePhrases = fundamentalValues.selected3.length === 3

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb1-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link
                        href="/dashboard/aprendizaje"
                        className={WORKBOOK_V2_EDITORIAL.classes.backButton}
                    >
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="min-w-0 flex-1 sm:mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB1 - Creencias, identidad y pilares personales</p>
                    </div>

                    <span className={WORKBOOK_V2_EDITORIAL.classes.progressPill}>
                        Avance: {completion}%
                    </span>
                    <span className={WORKBOOK_V2_EDITORIAL.classes.savedPill}>
                        Guardado automático
                    </span>
                    {isExporting && (
                        <span className={WORKBOOK_V2_EDITORIAL.classes.exportingPill}>
                            {WORKBOOK_V2_EDITORIAL.labels.exportingAll}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsLocked((prev) => !prev)}
                        className={WORKBOOK_V2_EDITORIAL.classes.lockButton}
                    >
                        <Lock size={14} />
                        {isLocked ? WORKBOOK_V2_EDITORIAL.labels.fieldsLocked : WORKBOOK_V2_EDITORIAL.labels.fieldsEditable}
                    </button>
                    <button
                        type="button"
                        onClick={exportPdf}
                        disabled={isExporting}
                        className={WORKBOOK_V2_EDITORIAL.classes.pdfButton}
                    >
                        <Printer size={14} />
                        {isExporting ? WORKBOOK_V2_EDITORIAL.labels.pdfLoading : WORKBOOK_V2_EDITORIAL.labels.pdfDownload}
                    </button>
                    <button
                        type="button"
                        onClick={exportHtml}
                        disabled={isExporting}
                        className={WORKBOOK_V2_EDITORIAL.classes.htmlButton}
                    >
                        <FileText size={14} />
                        {isExporting ? WORKBOOK_V2_EDITORIAL.labels.htmlLoading : WORKBOOK_V2_EDITORIAL.labels.htmlDownload}
                    </button>
                </div>
            </header>

            <main className="wbv2-main max-w-[1280px] mx-auto px-2 sm:px-5 md:px-8 py-5 md:py-8 overflow-x-hidden">
                <div
                    className={`grid gap-6 items-start ${
                        isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-w-0'
                    }`}
                >
                    <aside className={`wb1-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5" aria-label="Navegación de páginas">
                            {PAGES.map((page) => (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => jumpToPage(page.id)}
                                    className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                        activePage === page.id
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                                    }`}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="space-y-6">
                        {isPageVisible(1) && (
                            <article
                                className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                                data-cover-page="true"
                                data-print-title="Portada"
                            >
                                <div className="relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <Image
                                                src="/workbooks-v2/diamond.svg"
                                                alt="4Shine diamond"
                                                width={90}
                                                height={90}
                                                className="w-16 h-16 md:w-20 md:h-20"
                                                priority
                                            />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Creencias, identidad y pilares personales
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 1</p>
                                        <p className="text-blue-600 text-sm">4Shine</p>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 md:p-8 border-t border-slate-200">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Datos de identificación</h2>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del líder</span>
                                            <input
                                                type="text"
                                                value={idFields.leaderName}
                                                onChange={(event) => setIdField('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Andrés Tabla"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Rol actual</span>
                                            <input
                                                type="text"
                                                value={idFields.role}
                                                onChange={(event) => setIdField('role', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Director / Líder"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cohorte / Equipo</span>
                                            <input
                                                type="text"
                                                value={idFields.cohort}
                                                onChange={(event) => setIdField('cohort', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Cohorte Ejecutiva 2026"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha de inicio</span>
                                            <input
                                                type="date"
                                                value={idFields.startDate}
                                                onChange={(event) => setIdField('startDate', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={saveIdentificationFields}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                saveIdentificationFields()
                                                goNextPage()
                                            }}
                                            className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                        >
                                            Empezar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Presentación del workbook
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="mt-2 text-sm md:text-base text-slate-700">Al finalizar, tendrás:</p>
                                    <ul className="mt-4 space-y-2.5">
                                        {OBJECTIVE_OUTCOMES.map((item) => (
                                            <li key={item} className="flex items-start gap-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            Componentes trabajados en este workbook
                                        </h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {WORKBOOK_COMPONENTS.map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            Competencias 4Shine que vas a activar
                                        </h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {FOURSHINE_COMPETENCIES.map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Conductas observables asociadas (que deberías ver en tu día a día)
                                    </h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {OBSERVABLE_BEHAVIORS.map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Storytelling personal
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Entender cómo tu historia ha moldeado tu identidad y tus creencias actuales.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 1. Línea de vida (Timeline)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <p className="text-sm text-slate-700">
                                        Define una temporalidad y, en este lapso, identifica:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {STEP1_IDENTIFICATION_POINTS.map((item) => (
                                            <li key={item} className="text-sm text-slate-700">
                                                • {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <label className="block space-y-1">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Temporalidad de trabajo</span>
                                        <input
                                            type="text"
                                            value={storyFields.timelineRange}
                                            onChange={(event) => setStoryField('timelineRange', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            placeholder="Ej: Enero 2020 - Diciembre 2025"
                                        />
                                    </label>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveStoryStep1}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar paso 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Registro de eventos</h3>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Usa la plantilla: tipo, fecha aproximada, qué ocurrió, qué decidí/interpreté, qué aprendí y qué creencia se instaló.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openEventModal}
                                            disabled={isLocked || storyEvents.length >= STORY_EVENT_LIMIT}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white px-3 py-2 text-xs font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={14} />
                                            Agregar evento
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Plantilla de registro (por evento)</p>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {EVENT_TEMPLATE_FIELDS.map((field) => (
                                                <p key={field} className="text-sm text-slate-700">
                                                    • {field}: ______
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">¿Qué es una creencia?</p>
                                        <p className="text-sm text-slate-700 mt-1">
                                            Convicción interna que guía el comportamiento y la toma de decisiones de un individuo.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-300 bg-blue-50 p-4 md:p-5 space-y-2">
                                        <p className="text-sm font-extrabold text-slate-900">Ejemplo (ilustración)</p>
                                        <p className="text-sm text-slate-700">• Tipo: logro/quiebre</p>
                                        <p className="text-sm text-slate-700">• Fecha aproximada: Agosto 2021</p>
                                        <p className="text-sm text-slate-700">• Qué ocurrió (hecho): {EXAMPLE_EVENT.happened}</p>
                                        <p className="text-sm text-slate-700">• Qué decidí / interpreté: {EXAMPLE_EVENT.interpreted}</p>
                                        <p className="text-sm text-slate-700">• Qué aprendí: {EXAMPLE_EVENT.learned}</p>
                                        <p className="text-sm text-slate-700">• Qué creencia se instaló: {EXAMPLE_EVENT.belief}</p>
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        Eventos registrados: {storyEvents.length} / {STORY_EVENT_LIMIT}
                                    </p>
                                    {storyEvents.length >= STORY_EVENT_LIMIT && (
                                        <p className="text-xs font-semibold text-amber-700">
                                            Alcanzaste el máximo de 5 eventos. Elimina uno para registrar otro.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Línea de tiempo cronológica</h3>
                                        <span className="text-xs font-semibold text-slate-500">Ordenada por fecha aproximada</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(EVENT_TYPE_STYLE).map(([key, style]) => (
                                            <span
                                                key={key}
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badgeClass}`}
                                            >
                                                {style.label}
                                            </span>
                                        ))}
                                    </div>

                                    {orderedEvents.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 text-sm">
                                            Aún no hay eventos. Agrega tu primer evento para visualizar la línea de tiempo.
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-300" />
                                            <ul className="space-y-6">
                                                {orderedEvents.map((event) => {
                                                    const style = EVENT_TYPE_STYLE[event.type]
                                                    return (
                                                        <li key={event.id} className="relative pl-16">
                                                            <span className={`absolute left-[18px] top-2 h-4 w-4 rounded-full border-2 ${style.nodeClass}`} />

                                                            <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="space-y-1">
                                                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.badgeClass}`}>
                                                                            {style.label}
                                                                        </span>
                                                                        <p className="text-sm font-bold text-slate-900">{toMonthLabel(event.approxDate)}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeEvent(event.id)}
                                                                        disabled={isLocked}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                        Eliminar
                                                                    </button>
                                                                </div>

                                                                <dl className="mt-3 grid grid-cols-1 gap-2">
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué ocurrió (hecho)</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.happened}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué decidí / interpreté</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.interpreted}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué aprendí</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.learned}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Qué creencia se instaló</dt>
                                                                        <dd className="text-sm text-slate-700 mt-0.5">{event.belief}</dd>
                                                                    </div>
                                                                </dl>
                                                            </article>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 2. Narrativa en 3 actos</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <p className="text-sm text-slate-700">
                                        Convierte tu historia en una narrativa útil para el liderazgo. Descúbrete en 3 actos:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {STEP2_DISCOVERY_ACTS.map((item) => (
                                            <li key={item} className="text-sm text-slate-700">
                                                • {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">Reglas de escritura</p>
                                        <ol className="mt-2 space-y-1.5 list-decimal pl-5">
                                            {STEP2_WRITING_RULES.map((rule) => (
                                                <li key={rule} className="text-sm text-slate-700 leading-relaxed">
                                                    {rule}
                                                </li>
                                            ))}
                                        </ol>
                                    </aside>

                                    <div className="space-y-5">
                                        {STEP2_ACT_GUIDES.map((guide) => (
                                            <article key={guide.helpKey} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">{guide.title}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActHelp(guide.helpKey)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                                    >
                                                        {openActHelp[guide.helpKey] ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                                    </button>
                                                </div>

                                                <ul className="space-y-1.5">
                                                    {guide.guidingQuestions.map((question) => (
                                                        <li key={question} className="text-sm text-slate-700 flex items-start gap-2">
                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                            <span>{question}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {openActHelp[guide.helpKey] && (
                                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                        <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Ejemplo de referencia</p>
                                                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{guide.example}</p>
                                                    </div>
                                                )}

                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Escribe tu narrativa</span>
                                                    <textarea
                                                        value={storyFields[guide.fieldKey]}
                                                        onChange={(event) => setStoryField(guide.fieldKey, event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full min-h-[130px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                        placeholder="Escribe entre 10 y 15 líneas en primera persona, incorporando contexto, escena clave y efecto en ti."
                                                    />
                                                </label>
                                            </article>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveStoryStep2}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar paso 2
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 3. Patrones</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <p className="text-sm text-slate-700">
                                        Extrae 3 conclusiones operativas: tu patrón, tu mayor detonante y tu recurso más confiable.
                                    </p>
                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">Cómo responder (regla)</p>
                                        <ul className="mt-2 space-y-1.5">
                                            {RESPONSE_RULES.map((rule) => (
                                                <li key={rule} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                    <span>{rule}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>

                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5">
                                        <p className="text-sm font-extrabold text-slate-900">Ejemplo (ilustración)</p>
                                        <ol className="mt-3 space-y-3">
                                            {STEP3_EXAMPLES.map((item) => (
                                                <li key={item.key} className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                                    <p className="text-sm text-slate-700">• {item.example}</p>
                                                </li>
                                            ))}
                                        </ol>
                                    </article>

                                    <div className="space-y-4">
                                        {STEP3_EXAMPLES.map((listConfig) => {
                                            const isEditingList = patternEditModes[listConfig.key]
                                            const savedBullets = visiblePatternBullets(listConfig.key)

                                            return (
                                                <article key={listConfig.key} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <h4 className="text-sm md:text-base font-bold text-slate-900">{listConfig.title}</h4>
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editPatternList(listConfig.key)}
                                                                disabled={isLocked || isEditingList}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => savePatternList(listConfig.key)}
                                                                disabled={isLocked || !isEditingList}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-500">
                                                        Bullets cargados: {savedBullets.length} / {PATTERN_LIST_LIMIT}
                                                    </p>

                                                    {isEditingList ? (
                                                        <div className="space-y-2">
                                                            {storyFields[listConfig.key].map((bullet, index) => (
                                                                <label key={`${listConfig.key}-${index}`} className="block">
                                                                    <span className="sr-only">Bullet {index + 1}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={bullet}
                                                                        onChange={(event) => setPatternBullet(listConfig.key, index, event.target.value)}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                                        placeholder={`Bullet ${index + 1}`}
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : savedBullets.length > 0 ? (
                                                        <ul className="space-y-1.5">
                                                            {savedBullets.map((bullet, index) => (
                                                                <li key={`${listConfig.key}-view-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                                    <span>{bullet}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">Sin registros en esta lista. Presiona "Editar" para comenzar.</p>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>

                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Definición de identidad actual
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Definir quién eres hoy en términos de conducta y reputación, no de intención.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 1 - Rueda de identidad (Identity Wheel)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700 max-w-3xl">
                                                Este instrumento te ayuda a identificar quién eres hoy como líder en 8 dimensiones que determinan tu
                                                comportamiento: lo que sostienes, lo que evitas, lo que te activa y lo que entregas.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowIdentityHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showIdentityHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-700">
                                        En cada segmento de la rueda, escribe máximo 3 bullets con frases cortas y concretas.
                                    </p>

                                    {showIdentityHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo de referencia</p>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">Estilo bajo presión (máx 3 bullets):</p>
                                                    <ul className="mt-1 space-y-1">
                                                        <li className="text-sm text-slate-700">• Cierro rápido decisiones</li>
                                                        <li className="text-sm text-slate-700">• Hablo más, escucho menos</li>
                                                        <li className="text-sm text-slate-700">• Reviso detalles que podría delegar</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">Principios (NO negociables):</p>
                                                    <ul className="mt-1 space-y-1">
                                                        <li className="text-sm text-slate-700">• No maquillo información</li>
                                                        <li className="text-sm text-slate-700">• No falto al respeto en público</li>
                                                        <li className="text-sm text-slate-700">• No prometo lo que no puedo sostener</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={zoomIdentityWheelOut}
                                                disabled={identityWheelSizeIndex === 0}
                                                className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 text-lg leading-none hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Reducir tamaño de la rueda"
                                            >
                                                -
                                            </button>
                                            <button
                                                type="button"
                                                onClick={zoomIdentityWheelIn}
                                                disabled={identityWheelSizeIndex === IDENTITY_WHEEL_SIZES.length - 1}
                                                className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 text-lg leading-none hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Ampliar tamaño de la rueda"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto pb-2">
                                            <div className="relative mx-auto aspect-square" style={{ width: `${identityWheelSize}px`, minWidth: `${identityWheelSize}px` }}>
                                                <div
                                                    className="absolute inset-0 rounded-full border border-slate-300 shadow-inner"
                                                    style={{
                                                        background: `conic-gradient(${IDENTITY_SEGMENTS.map(
                                                            (segment, index) => `${segment.color} ${index * 45}deg ${(index + 1) * 45}deg`
                                                        ).join(', ')})`
                                                    }}
                                                />
                                                <div className="absolute inset-[22%] rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center p-4">
                                                    <div className="text-center">
                                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Identity Wheel</p>
                                                        <p className="text-sm md:text-base font-extrabold text-slate-900 mt-1">Definición actual</p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Segmentos con contenido: {Object.values(identityWheelFields).filter((list) => list.some((item) => item.trim())).length} /{' '}
                                                            {IDENTITY_SEGMENTS.length}
                                                        </p>
                                                    </div>
                                                </div>
                                                {IDENTITY_SEGMENTS.map((segment, index) => {
                                                    const labelAngle = (index / IDENTITY_SEGMENTS.length) * Math.PI * 2 - Math.PI / 2
                                                    const labelX = 50 + Math.cos(labelAngle) * 42
                                                    const labelY = 50 + Math.sin(labelAngle) * 42
                                                    const contentAngle = ((index + 0.5) / IDENTITY_SEGMENTS.length) * Math.PI * 2 - Math.PI / 2
                                                    const contentX = 50 + Math.cos(contentAngle) * 31
                                                    const contentY = 50 + Math.sin(contentAngle) * 31
                                                    const bullets = visibleIdentityBullets(segment.key)

                                                    return (
                                                        <div key={`wheel-layer-${segment.key}`}>
                                                            <div
                                                                className="absolute -translate-x-1/2 -translate-y-1/2 w-28 text-center"
                                                                style={{ left: `${labelX}%`, top: `${labelY}%` }}
                                                            >
                                                                <span className="inline-block rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-[10px] leading-tight font-semibold text-slate-700 shadow-sm">
                                                                    {index + 1}. {segment.title}
                                                                </span>
                                                            </div>

                                                            {bullets.length > 0 && (
                                                                <div
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-36 rounded-lg border border-slate-300 bg-white/95 p-2 shadow-sm"
                                                                    style={{ left: `${contentX}%`, top: `${contentY}%` }}
                                                                >
                                                                    <ul className="space-y-1">
                                                                        {bullets.map((bullet, bulletIndex) => (
                                                                            <li key={`${segment.key}-wheel-bullet-${bulletIndex}`} className="text-[10px] leading-tight text-slate-700">
                                                                                • {bullet}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {IDENTITY_SEGMENTS.map((segment) => {
                                            const isEditing = identityEditModes[segment.key]
                                            const bullets = visibleIdentityBullets(segment.key)
                                            return (
                                                <article key={segment.key} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <h4 className="text-sm md:text-base font-bold text-slate-900">{segment.title}</h4>
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editIdentitySegment(segment.key)}
                                                                disabled={isLocked || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveIdentitySegment(segment.key)}
                                                                disabled={isLocked || !isEditing}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-500">
                                                        Bullets cargados: {bullets.length} / {IDENTITY_BULLET_LIMIT}
                                                    </p>

                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            {identityWheelFields[segment.key].map((bullet, index) => (
                                                                <label key={`${segment.key}-input-${index}`} className="block">
                                                                    <span className="sr-only">Bullet {index + 1}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={bullet}
                                                                        onChange={(event) => setIdentityBullet(segment.key, index, event.target.value)}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                                        placeholder={`Bullet ${index + 1}`}
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : bullets.length > 0 ? (
                                                        <ul className="space-y-1.5">
                                                            {bullets.map((bullet, index) => (
                                                                <li key={`${segment.key}-view-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                                    <span>{bullet}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">Sin registros en este segmento. Presiona "Editar" para comenzar.</p>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Matriz "Lo que digo / hago / impacto"
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">Completa 10 filas con evidencia reciente y observable.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowIdentityMatrixHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showIdentityMatrixHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {IDENTITY_MATRIX_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            Regla de calidad: "Lo que hago" debe poder comprobarse con un ejemplo concreto (reunión X, mensaje Y, decisión Z).
                                        </p>
                                    </aside>

                                    {showIdentityMatrixHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar la matriz</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[720px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Lo que digo</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Lo que hago (hechos)</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Impacto en otros</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">"Valoro la transparencia"</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                En la reunión del lunes compartí riesgos del proyecto y dije qué NO estaba resuelto, proponiendo opciones.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                El equipo aportó soluciones; aumentó confianza y se redujo rumor/ansiedad.
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas con contenido:{' '}
                                        {
                                            identityMatrixRows.filter(
                                                (row) => row.say.trim().length > 0 || row.do.trim().length > 0 || row.impact.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {IDENTITY_MATRIX_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1020px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[60px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">#</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Lo que digo (mensaje)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Lo que hago (hechos recientes)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Impacto en otros (observable)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {identityMatrixRows.map((row, rowIndex) => (
                                                    <tr key={`matrix-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 text-xs font-semibold text-slate-500 align-top border-b border-slate-200">
                                                            {rowIndex + 1}
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.say}
                                                                onChange={(event) => setIdentityMatrixCell(rowIndex, 'say', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Mensaje o frase que dices"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.do}
                                                                onChange={(event) => setIdentityMatrixCell(rowIndex, 'do', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Hecho concreto reciente"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.impact}
                                                                onChange={(event) => setIdentityMatrixCell(rowIndex, 'impact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Efecto observable en otros"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveIdentityMatrix}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar instrumento 2
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 3 - Mini espejo de stakeholders (360 rápido)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">Completa 3 filas con hipótesis concretas por rol.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowStakeholderHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showStakeholderHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {STAKEHOLDER_MIRROR_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <aside className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                                        <p className="text-sm text-slate-700">
                                            Nota: esto es una hipótesis. Luego podrás validarla preguntando directamente.
                                        </p>
                                    </aside>

                                    {showStakeholderHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[760px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Persona (rol)
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Fortaleza que crees que vería en ti
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Punto ciego que crees que vería en ti
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Jefe / sponsor</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                "Resuelve rápido y convierte problemas difusos en plan."
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                "A veces prioriza velocidad sobre alineación; cierra antes de escuchar."
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas con contenido:{' '}
                                        {
                                            stakeholderRows.filter(
                                                (row) =>
                                                    row.personRole.trim().length > 0 ||
                                                    row.strength.trim().length > 0 ||
                                                    row.blindspot.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {STAKEHOLDER_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1020px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[60px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">#</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Persona (rol)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Fortaleza que crees que vería en ti
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Punto ciego que crees que vería en ti
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stakeholderRows.map((row, rowIndex) => (
                                                    <tr key={`stakeholder-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 text-xs font-semibold text-slate-500 align-top border-b border-slate-200">
                                                            {rowIndex + 1}
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.personRole}
                                                                onChange={(event) => setStakeholderCell(rowIndex, 'personRole', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Ej: Jefe / sponsor"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.strength}
                                                                onChange={(event) => setStakeholderCell(rowIndex, 'strength', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder='Ej: "Resuelve rápido y convierte problemas difusos en plan."'
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.blindspot}
                                                                onChange={(event) => setStakeholderCell(rowIndex, 'blindspot', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[64px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder='Ej: "A veces prioriza velocidad sobre alineación; cierra antes de escuchar."'
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveStakeholderMirror}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar instrumento 3
                                        </button>
                                    </div>
                                </section>

                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Valores fundamentales
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Convertir "valores" en criterios de decisión.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Instrumento 1 - Selección y priorización (card sorting)
                                    </h3>
                                    <p className="text-sm text-slate-700">Instrucciones:</p>
                                    <ol className="space-y-1.5 list-decimal pl-5">
                                        <li className="text-sm text-slate-700">
                                            Revisa la lista de valores y marca 10 que realmente guían tu vida (no los deseables).
                                        </li>
                                        <li className="text-sm text-slate-700">Reduce a 5 (los más determinantes).</li>
                                        <li className="text-sm text-slate-700">
                                            Reduce a 3 no negociables (los que defenderías bajo presión).
                                        </li>
                                    </ol>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            1) 10 valores que guían mi vida
                                        </h3>
                                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {fundamentalValues.selected10.length} / 10
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">Haz clic para seleccionar o deseleccionar valores.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {FUNDAMENTAL_VALUES.map((value) => {
                                            const selected = fundamentalValues.selected10.includes(value)
                                            const disabled = isLocked || (!selected && fundamentalValues.selected10.length >= 10)

                                            return (
                                                <button
                                                    key={`value-10-${value}`}
                                                    type="button"
                                                    onClick={() => toggleFundamentalValue10(value)}
                                                    disabled={disabled}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        selected
                                                            ? 'bg-emerald-500 text-white border-emerald-600'
                                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {value}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            2) Los más determinantes (elige 5 de tus 10)
                                        </h3>
                                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {fundamentalValues.selected5.length} / 5
                                        </span>
                                    </div>

                                    {!canSelectTop5 && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Completa primero los 10 valores de la sección anterior para habilitar esta selección.
                                        </p>
                                    )}

                                    {fundamentalValues.selected10.length === 0 ? (
                                        <p className="text-sm text-slate-500">Aún no hay valores seleccionados en el paso 1.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {fundamentalValues.selected10.map((value) => {
                                                const selected = fundamentalValues.selected5.includes(value)
                                                const disabled = isLocked || !canSelectTop5 || (!selected && fundamentalValues.selected5.length >= 5)

                                                return (
                                                    <button
                                                        key={`value-5-${value}`}
                                                        type="button"
                                                        onClick={() => toggleFundamentalValue5(value)}
                                                        disabled={disabled}
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                            selected
                                                                ? 'bg-emerald-500 text-white border-emerald-600'
                                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">
                                            3) No negociables (elige 3 de tus 5)
                                        </h3>
                                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            Seleccionados: {fundamentalValues.selected3.length} / 3
                                        </span>
                                    </div>

                                    {!canSelectTop3 && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Completa primero los 5 valores determinantes para habilitar esta selección.
                                        </p>
                                    )}

                                    {fundamentalValues.selected5.length === 0 ? (
                                        <p className="text-sm text-slate-500">Aún no hay valores seleccionados en el paso 2.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {fundamentalValues.selected5.map((value) => {
                                                const selected = fundamentalValues.selected3.includes(value)
                                                const disabled = isLocked || !canSelectTop3 || (!selected && fundamentalValues.selected3.length >= 3)

                                                return (
                                                    <button
                                                        key={`value-3-${value}`}
                                                        type="button"
                                                        onClick={() => toggleFundamentalValue3(value)}
                                                        disabled={disabled}
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                            selected
                                                                ? 'bg-emerald-500 text-white border-emerald-600'
                                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveFundamentalValueSelection}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar instrumento 1
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Matriz valores-decisiones (evidencia)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Completa 5 filas con los valores determinantes y decisiones recientes observables.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowValueDecisionHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showValueDecisionHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {VALUE_DECISION_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {!canUseValueDecisionMatrix && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Para completar esta matriz, primero selecciona los 5 valores más determinantes en el Instrumento 1.
                                        </p>
                                    )}

                                    {showValueDecisionHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[860px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Valor</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Decisión 1 (fecha y contexto)
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Decisión 2 (fecha y contexto)
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Integridad</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                12 feb: rechacé ajustar un informe ocultando datos; propuse redactarlo con transparencia.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                28 feb: asumí públicamente un error de planificación y presenté corrección con fechas.
                                                            </td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Crecimiento</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                05 mar: pedí feedback directo al equipo sobre mi estilo en reuniones.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                18 mar: acepté liderar un reto nuevo y pedí apoyo técnico específico sin ocultarlo.
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas completas:{' '}
                                        {
                                            valueDecisionRows.filter(
                                                (row) =>
                                                    row.value.trim().length > 0 &&
                                                    row.decision1.trim().length > 0 &&
                                                    row.decision2.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {VALUE_DECISION_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[240px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Valor</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Decisión 1 (fecha y contexto)
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Decisión 2 (fecha y contexto)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueDecisionRows.map((row, rowIndex) => {
                                                    const rowDisabled = isLocked || row.value.trim().length === 0 || !canUseValueDecisionMatrix
                                                    return (
                                                        <tr key={`value-decision-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                            <td className="px-3 py-2 text-sm font-semibold text-slate-800 align-top border-b border-slate-200">
                                                                {row.value || `Valor determinante ${rowIndex + 1} (por seleccionar)`}
                                                            </td>
                                                            <td className="p-2 align-top border-b border-slate-200">
                                                                <textarea
                                                                    value={row.decision1}
                                                                    onChange={(event) => setValueDecisionCell(rowIndex, 'decision1', event.target.value)}
                                                                    disabled={rowDisabled}
                                                                    className="w-full min-h-[72px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="Ej: 12 feb - decisión observable con contexto"
                                                                />
                                                            </td>
                                                            <td className="p-2 align-top border-b border-slate-200">
                                                                <textarea
                                                                    value={row.decision2}
                                                                    onChange={(event) => setValueDecisionCell(rowIndex, 'decision2', event.target.value)}
                                                                    disabled={rowDisabled}
                                                                    className="w-full min-h-[72px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="Ej: 28 feb - decisión observable con contexto"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveValueDecisionMatrix}
                                            disabled={isLocked || !canUseValueDecisionMatrix}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar instrumento 2
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 3 - No negociables en formato operativo
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Completa una frase operativa por cada valor no negociable seleccionado.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowNoNegotiableHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showNoNegotiableHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {NO_NEGOTIABLE_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {!canUseNoNegotiablePhrases && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            Para completar este instrumento, primero define tus 3 valores no negociables en el Instrumento 1.
                                        </p>
                                    )}

                                    {showNoNegotiableHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplos</p>
                                            <p className="text-sm text-slate-700">
                                                • Bajo presión, yo NO manipulo datos aunque eso implique una conversación incómoda.
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                • Bajo presión, yo NO falto al respeto aunque eso implique perder la discusión.
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                • Bajo presión, yo NO acepto plazos imposibles aunque eso implique decir no a una autoridad.
                                            </p>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Frases completas:{' '}
                                        {
                                            noNegotiableRows.filter(
                                                (row) =>
                                                    row.value.trim().length > 0 &&
                                                    row.behavior.trim().length > 0 &&
                                                    row.implication.trim().length > 0
                                            ).length
                                        }{' '}
                                        / {NO_NEGOTIABLE_ROWS}
                                    </p>

                                    <div className="space-y-3">
                                        {noNegotiableRows.map((row, rowIndex) => {
                                            const rowDisabled = isLocked || row.value.trim().length === 0 || !canUseNoNegotiablePhrases
                                            const isEditing = noNegotiableEditModes[rowIndex]
                                            return (
                                                <article key={`no-negotiable-row-${rowIndex}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {row.value || `Valor no negociable ${rowIndex + 1} (por seleccionar)`}
                                                        </p>
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editNoNegotiableRow(rowIndex)}
                                                                disabled={rowDisabled || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveNoNegotiableRow(rowIndex)}
                                                                disabled={rowDisabled || !isEditing}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <label className="space-y-1">
                                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Bajo presión, yo NO...</span>
                                                                <input
                                                                    type="text"
                                                                    value={row.behavior}
                                                                    onChange={(event) => setNoNegotiableCell(rowIndex, 'behavior', event.target.value)}
                                                                    disabled={rowDisabled}
                                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="Comportamiento concreto"
                                                                />
                                                            </label>
                                                            <label className="space-y-1">
                                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Aunque eso implique...</span>
                                                                <input
                                                                    type="text"
                                                                    value={row.implication}
                                                                    onChange={(event) => setNoNegotiableCell(rowIndex, 'implication', event.target.value)}
                                                                    disabled={rowDisabled}
                                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="Costo o consecuencia asumida"
                                                                />
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                                            Bajo presión, yo NO {row.behavior || '______'} aunque eso implique {row.implication || '______'}.
                                                        </p>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>

                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Fortalezas y áreas de oportunidad
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Ver tu perfil con realismo: qué te potencia y qué te frena.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 1 - F.O.A. personal
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Fortalezas / Áreas de oportunidad / Amenazas
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowFoaHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showFoaHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {FOA_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showFoaHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Fortalezas:</p>
                                                <ul className="mt-1 space-y-1">
                                                    <li className="text-sm text-slate-700">
                                                        • Convierto problemas complejos en planes ejecutables (roadmaps claros).
                                                    </li>
                                                    <li className="text-sm text-slate-700">
                                                        • Alta disciplina de entrega (cumplí 3 hitos críticos en el último mes).
                                                    </li>
                                                </ul>
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Áreas de oportunidad:</p>
                                                <ul className="mt-1 space-y-1">
                                                    <li className="text-sm text-slate-700">
                                                        • Mayor demanda de liderazgo con IA y analítica en mi industria.
                                                    </li>
                                                    <li className="text-sm text-slate-700">
                                                        • Posibilidad de fortalecer red estratégica (alianzas / comunidades).
                                                    </li>
                                                </ul>
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Amenazas:</p>
                                                <ul className="mt-1 space-y-1">
                                                    <li className="text-sm text-slate-700">
                                                        • Sobrecarga que reduce enfoque estratégico y energía.
                                                    </li>
                                                    <li className="text-sm text-slate-700">
                                                        • Competencia creciente con perfiles híbridos (liderazgo + datos).
                                                    </li>
                                                </ul>
                                            </div>
                                        </article>
                                    )}
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {FOA_QUADRANTS.map((quadrant) => {
                                        const isEditing = foaEditModes[quadrant.key]
                                        const savedBullets = visibleFoaBullets(quadrant.key)

                                        return (
                                            <article key={quadrant.key} className={`rounded-xl border p-4 md:p-5 space-y-3 ${quadrant.containerClassName}`}>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">{quadrant.title}</h4>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => editFoaQuadrant(quadrant.key)}
                                                            disabled={isLocked || isEditing}
                                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveFoaQuadrant(quadrant.key)}
                                                            disabled={isLocked || !isEditing}
                                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-500">
                                                    Bullets cargados: {savedBullets.length} / {FOA_BULLET_LIMIT}
                                                </p>

                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        {foaFields[quadrant.key].map((bullet, index) => (
                                                            <label key={`${quadrant.key}-input-${index}`} className="block">
                                                                <span className="sr-only">Bullet {index + 1}</span>
                                                                <input
                                                                    type="text"
                                                                    value={bullet}
                                                                    onChange={(event) => setFoaBullet(quadrant.key, index, event.target.value)}
                                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                                    placeholder={`${index + 1}.`}
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : savedBullets.length > 0 ? (
                                                    <ol className="space-y-1.5">
                                                        {savedBullets.map((bullet, index) => (
                                                            <li key={`${quadrant.key}-view-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                                <span className="text-slate-500">{index + 1}.</span>
                                                                <span>{bullet}</span>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                ) : (
                                                    <p className="text-sm text-slate-500">Sin registros en este cuadrante. Presiona "Editar" para comenzar.</p>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Mapa de energía
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Identifica qué actividades te cargan y cuáles te drenan, para ajustar tu semana y sostener tu desempeño como líder.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowEnergyHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showEnergyHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {ENERGY_MAP_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showEnergyHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Actividad semanal</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">+ / -</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Energía</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">¿Por qué?</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Ajuste</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Diseñar estrategia / plan</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">+</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">8</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">siento claridad y control</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Más</td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Reuniones largas sin agenda</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">-</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">3</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">desgaste + poca decisión</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Menos</td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Conversación 1:1 con equipo</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">+</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">7</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">genera conexión y avance</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Más</td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Resolver urgencias para ayer</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">-</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">2</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">reactivo, sin foco</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Rediseñar</td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Escribir / documentar</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">+</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">7</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">ordena ideas y mejora calidad</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Más</td>
                                                        </tr>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Revisar detalles micro</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">-</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">4</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">me vuelve cuello de botella</td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">Menos</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Actividades registradas: {energyRowsWithActivity} / {ENERGY_MAP_ROWS} (mínimo recomendado: 12)
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1180px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[280px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Actividad semanal</th>
                                                    <th className="w-[90px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">+ / -</th>
                                                    <th className="w-[120px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Energía (0-10)</th>
                                                    <th className="w-[340px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">¿Por qué? (1 línea)</th>
                                                    <th className="w-[180px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Ajuste (Más / Menos / Rediseñar)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {energyMapRows.map((row, rowIndex) => (
                                                    <tr key={`energy-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <input
                                                                type="text"
                                                                value={row.activity}
                                                                onChange={(event) => setEnergyMapCell(rowIndex, 'activity', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder={`Actividad ${rowIndex + 1}`}
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <select
                                                                value={row.sign}
                                                                onChange={(event) => setEnergyMapCell(rowIndex, 'sign', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                <option value="+">+</option>
                                                                <option value="-">-</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <select
                                                                value={row.energy}
                                                                onChange={(event) => setEnergyMapCell(rowIndex, 'energy', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                {Array.from({ length: 11 }, (_, option) => (
                                                                    <option key={`energy-${option}`} value={String(option)}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <input
                                                                type="text"
                                                                value={row.reason}
                                                                onChange={(event) => setEnergyMapCell(rowIndex, 'reason', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Causa concreta"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <select
                                                                value={row.adjust}
                                                                onChange={(event) => setEnergyMapCell(rowIndex, 'adjust', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                {ENERGY_ADJUST_OPTIONS.filter(Boolean).map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-4">
                                        <h4 className="text-sm md:text-base font-bold text-slate-900">Cierre del instrumento</h4>

                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-900">Patrón que aparece (3 bullets)</p>
                                            {energyPatternBullets.map((bullet, index) => (
                                                <input
                                                    key={`energy-pattern-${index}`}
                                                    type="text"
                                                    value={bullet}
                                                    onChange={(event) => setEnergyPatternBullet(index, event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                    placeholder={`Bullet ${index + 1}`}
                                                />
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Qué harás más</span>
                                                <input
                                                    type="text"
                                                    value={energyDoMore}
                                                    onChange={(event) => !isLocked && setEnergyDoMore(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                    placeholder="1 acción"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Qué harás menos</span>
                                                <input
                                                    type="text"
                                                    value={energyDoLess}
                                                    onChange={(event) => !isLocked && setEnergyDoLess(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                    placeholder="1 acción"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Qué rediseñarás</span>
                                                <input
                                                    type="text"
                                                    value={energyRedesign}
                                                    onChange={(event) => !isLocked && setEnergyRedesign(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                    placeholder="1 acción"
                                                />
                                            </label>
                                        </div>
                                    </article>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveEnergyInstrument}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar instrumento 2
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Creencias limitantes (PNL)
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Identificar la creencia que gobierna tu conducta sin que lo notes.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 1 - Modelo ABC (Activador-Creencia-Consecuencia)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Completa el modelo para 3 situaciones reales recientes y registra activador, creencia y consecuencia observable.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowBeliefAbcHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showBeliefAbcHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {BELIEF_ABC_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showBeliefAbcHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">A:</span> En la reunión, un colega cuestionó mi propuesta frente al equipo.
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">B:</span> “Me está desautorizando; si no respondo fuerte, pierdo autoridad.”
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">C (emoción + 0-10):</span> Irritación 8/10
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">C (acción observable):</span> Subí el tono, interrumpí y cerré la decisión sin preguntas.
                                            </p>
                                        </article>
                                    )}
                                </section>

                                <p className="text-xs text-slate-500">
                                    Situaciones completas: {completedBeliefAbcRows} / {BELIEF_ABC_ROWS}
                                </p>

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {beliefAbcRows.map((row, rowIndex) => {
                                        const isEditing = beliefAbcEditModes[rowIndex]
                                        const rowDisabled = isLocked || !isEditing

                                        return (
                                            <article
                                                key={`belief-abc-${rowIndex}`}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">Situación {rowIndex + 1}</h4>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => editBeliefAbcRow(rowIndex)}
                                                            disabled={isLocked || isEditing}
                                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveBeliefAbcRow(rowIndex)}
                                                            disabled={isLocked || !isEditing}
                                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">A (Activador)</span>
                                                            <textarea
                                                                value={row.activator}
                                                                onChange={(event) => setBeliefAbcCell(rowIndex, 'activator', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Qué pasó (hecho observable, sin interpretación)"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">B (Belief / Creencia)</span>
                                                            <textarea
                                                                value={row.belief}
                                                                onChange={(event) => setBeliefAbcCell(rowIndex, 'belief', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder='Frase interna. Ejemplo: "..."'
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">C (emoción + 0-10)</span>
                                                            <input
                                                                type="text"
                                                                value={row.emotion}
                                                                onChange={(event) => setBeliefAbcCell(rowIndex, 'emotion', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Ejemplo: Irritación 8/10"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">C (acción observable)</span>
                                                            <textarea
                                                                value={row.action}
                                                                onChange={(event) => setBeliefAbcCell(rowIndex, 'action', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Describe tono, palabras, decisión, silencio o control"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">A:</span> {row.activator || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">B:</span>{' '}
                                                            {row.belief ? `“${row.belief}”` : '“______________________________”'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">C (emoción + 0-10):</span>{' '}
                                                            {row.emotion || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">C (acción observable):</span>{' '}
                                                            {row.action || '______________________________'}
                                                        </p>
                                                    </div>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Matriz de evidencia (clave para desarmar creencias)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Contrasta tu creencia con hechos observables a favor y en contra para construir un nuevo significado creíble.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowBeliefEvidenceHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showBeliefEvidenceHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {BELIEF_EVIDENCE_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showBeliefEvidenceHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Creencia limitante
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Evidencia a favor
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Evidencia en contra
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                                Nuevo significado posible
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                “Si pido ayuda pierdo autoridad”
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                Feb: evité preguntar en público y quedé callado; después hubo correcciones y me vi inseguro.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                Mar: pedí apoyo específico antes de presentar y la entrega salió mejor; el equipo valoró la claridad.
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                                                                “La autoridad crece cuando pido apoyo con claridad y responsabilidad; no es debilidad, es criterio.”
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </article>
                                    )}

                                    <p className="text-xs text-slate-500">
                                        Filas completas: {completedBeliefEvidenceRows} / {BELIEF_EVIDENCE_ROWS}
                                    </p>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1200px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="w-[250px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Creencia limitante
                                                    </th>
                                                    <th className="w-[300px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Evidencia a favor (hechos)
                                                    </th>
                                                    <th className="w-[300px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Evidencia en contra (hechos)
                                                    </th>
                                                    <th className="w-[320px] px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        Nuevo significado posible (creíble)
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {beliefEvidenceRows.map((row, rowIndex) => (
                                                    <tr key={`belief-evidence-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.limitingBelief}
                                                                onChange={(event) => setBeliefEvidenceCell(rowIndex, 'limitingBelief', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[90px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder={`Creencia ${rowIndex + 1}`}
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.evidenceFor}
                                                                onChange={(event) => setBeliefEvidenceCell(rowIndex, 'evidenceFor', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[90px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Hechos que parecen confirmar la creencia"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.evidenceAgainst}
                                                                onChange={(event) => setBeliefEvidenceCell(rowIndex, 'evidenceAgainst', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[90px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Hechos que contradicen la creencia"
                                                            />
                                                        </td>
                                                        <td className="p-2 align-top border-b border-slate-200">
                                                            <textarea
                                                                value={row.newMeaning}
                                                                onChange={(event) => setBeliefEvidenceCell(rowIndex, 'newMeaning', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full min-h-[90px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Reencuadre creíble"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveBeliefEvidenceMatrix}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar instrumento 2
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 3 - Costo oculto (impacto)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Elige una creencia limitante y describe costos, oportunidades perdidas y personas afectadas.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowBeliefImpactHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showBeliefImpactHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {BELIEF_IMPACT_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showBeliefImpactHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo para completar este ejercicio</p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Creencia limitante:</span> “Si pido ayuda, pierdo autoridad.”
                                            </p>
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-900">1) ¿Qué me cuesta sostener esta creencia?</p>
                                                <p className="text-sm text-slate-700">• Sobrecarga y cansancio (hago más trabajo del necesario).</p>
                                                <p className="text-sm text-slate-700">• Decisiones más lentas (evito preguntar y tardo en resolver).</p>
                                                <p className="text-sm text-slate-700">• Estrés y tensión interna antes de reuniones clave.</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-900">2) ¿Qué oportunidades pierdo por esta creencia?</p>
                                                <p className="text-sm text-slate-700">• Aprender más rápido con apoyo experto.</p>
                                                <p className="text-sm text-slate-700">• Delegar y desarrollar al equipo en tareas críticas.</p>
                                                <p className="text-sm text-slate-700">• Construir confianza real con pares y líderes (por apertura).</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-900">3) ¿A quién afecta?</p>
                                                <p className="text-sm text-slate-700">• A mi equipo: menos autonomía y crecimiento (yo centralizo).</p>
                                                <p className="text-sm text-slate-700">• A mis pares: baja colaboración (no pido ni ofrezco apoyo).</p>
                                                <p className="text-sm text-slate-700">• A mí: desgaste y menor claridad mental bajo presión.</p>
                                            </div>
                                        </article>
                                    )}

                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Creencia limitante</span>
                                                <select
                                                    value={beliefImpactSelected}
                                                    onChange={(event) => !isLocked && setBeliefImpactSelected(event.target.value)}
                                                    disabled={isLocked || limitingBeliefOptions.length === 0}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">
                                                        {limitingBeliefOptions.length > 0
                                                            ? 'Selecciona una creencia'
                                                            : 'Primero define creencias en el Instrumento 2'}
                                                    </option>
                                                    {limitingBeliefOptions.map((belief) => (
                                                        <option key={belief} value={belief}>
                                                            {belief}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={startBeliefImpactEdit}
                                                    disabled={isLocked || beliefImpactIsEditing || !beliefImpactSelected}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={saveBeliefImpact}
                                                    disabled={isLocked || !beliefImpactIsEditing}
                                                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>

                                        {beliefImpactSelected ? (
                                            <>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        1) ¿Qué me cuesta sostener esta creencia? (3-5 bullets)
                                                    </p>
                                                    <p className="text-xs text-slate-500">Bullets cargados: {beliefImpactCostsCount} / {BELIEF_IMPACT_BULLETS}</p>
                                                    <div className="space-y-2">
                                                        {beliefImpactCosts.map((item, index) => (
                                                            <label key={`impact-cost-${index}`} className="flex items-start gap-2">
                                                                <span className="mt-2 text-slate-500">•</span>
                                                                <input
                                                                    type="text"
                                                                    value={item}
                                                                    onChange={(event) => setBeliefImpactCost(index, event.target.value)}
                                                                    disabled={isLocked || !beliefImpactIsEditing}
                                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder={`Costo ${index + 1}`}
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        2) ¿Qué oportunidades pierdo por esta creencia? (3-5 bullets)
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Bullets cargados: {beliefImpactOpportunitiesCount} / {BELIEF_IMPACT_BULLETS}
                                                    </p>
                                                    <div className="space-y-2">
                                                        {beliefImpactLostOpportunities.map((item, index) => (
                                                            <label key={`impact-opportunity-${index}`} className="flex items-start gap-2">
                                                                <span className="mt-2 text-slate-500">•</span>
                                                                <input
                                                                    type="text"
                                                                    value={item}
                                                                    onChange={(event) => setBeliefImpactOpportunity(index, event.target.value)}
                                                                    disabled={isLocked || !beliefImpactIsEditing}
                                                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder={`Oportunidad ${index + 1}`}
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-slate-900">3) ¿A quién afecta? (personas/roles + cómo)</p>
                                                    <p className="text-xs text-slate-500">
                                                        Filas completas: {beliefImpactAffectedCount} / {BELIEF_IMPACT_AFFECTED_ROWS}
                                                    </p>
                                                    <div className="space-y-2">
                                                        {beliefImpactAffectedRows.map((row, rowIndex) => (
                                                            <div key={`impact-affected-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 items-center">
                                                                <label className="sr-only">Persona o rol {rowIndex + 1}</label>
                                                                <input
                                                                    type="text"
                                                                    value={row.person}
                                                                    onChange={(event) => setBeliefImpactAffectedCell(rowIndex, 'person', event.target.value)}
                                                                    disabled={isLocked || !beliefImpactIsEditing}
                                                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder={`A ${rowIndex + 1} (rol/persona)`}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={row.impact}
                                                                    onChange={(event) => setBeliefImpactAffectedCell(rowIndex, 'impact', event.target.value)}
                                                                    disabled={isLocked || !beliefImpactIsEditing}
                                                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                    placeholder="¿Cómo afecta?"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                Selecciona una creencia limitante del Instrumento 2 para habilitar este análisis.
                                            </p>
                                        )}
                                    </article>
                                </section>
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 8</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                        Nuevas creencias empoderadoras
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        No basta con pensar positivo: necesitas creencias que se prueben con conducta.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 1 - Reencuadre + Creencia puente (Bridge Belief)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Convierte cada creencia limitante en una creencia ideal y una creencia puente realista, creíble y accionable.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmpoweringBeliefHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showEmpoweringBeliefHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {EMPOWERING_BELIEF_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showEmpoweringBeliefHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo (conflicto)</p>
                                            <p className="text-sm text-slate-700">• Limitante: “Si confronto, dañará la relación.”</p>
                                            <p className="text-sm text-slate-700">• Ideal: “Puedo sostener conversaciones difíciles con respeto.”</p>
                                            <p className="text-sm text-slate-700">
                                                • Puente: “Puedo iniciar una conversación de límite usando hechos + pedido claro.”
                                            </p>
                                        </article>
                                    )}
                                </section>

                                <p className="text-xs text-slate-500">
                                    Tarjetas completas: {completedEmpoweringBeliefRows} / {EMPOWERING_BELIEF_ROWS}
                                </p>

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {empoweringBeliefRows.map((row, rowIndex) => {
                                        const isEditing = empoweringBeliefEditModes[rowIndex]
                                        const rowDisabled = isLocked || !isEditing
                                        const rowBeliefOptions = row.limitingBelief && !limitingBeliefOptions.includes(row.limitingBelief)
                                            ? [row.limitingBelief, ...limitingBeliefOptions]
                                            : limitingBeliefOptions

                                        return (
                                            <article
                                                key={`empowering-belief-${rowIndex}`}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">Creencia {rowIndex + 1}</h4>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => editEmpoweringBeliefRow(rowIndex)}
                                                            disabled={isLocked || isEditing}
                                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEmpoweringBeliefRow(rowIndex)}
                                                            disabled={isLocked || !isEditing}
                                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Creencia limitante</span>
                                                            <select
                                                                value={row.limitingBelief}
                                                                onChange={(event) => setEmpoweringBeliefCell(rowIndex, 'limitingBelief', event.target.value)}
                                                                disabled={rowDisabled || rowBeliefOptions.length === 0}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                            >
                                                                <option value="">
                                                                    {rowBeliefOptions.length > 0
                                                                        ? 'Selecciona una creencia'
                                                                        : 'Primero define creencias en el Instrumento 2'}
                                                                </option>
                                                                {rowBeliefOptions.map((belief) => (
                                                                    <option key={belief} value={belief}>
                                                                        {belief}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Creencia empoderadora ideal</span>
                                                            <textarea
                                                                value={row.idealBelief}
                                                                onChange={(event) => setEmpoweringBeliefCell(rowIndex, 'idealBelief', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Tu versión más alta"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Creencia puente (creíble hoy)</span>
                                                            <textarea
                                                                value={row.bridgeBelief}
                                                                onChange={(event) => setEmpoweringBeliefCell(rowIndex, 'bridgeBelief', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Reencuadre realista y accionable"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Creencia limitante:</span>{' '}
                                                            {row.limitingBelief ? `“${row.limitingBelief}”` : '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Creencia empoderadora ideal:</span>{' '}
                                                            {row.idealBelief ? `“${row.idealBelief}”` : '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Creencia puente:</span>{' '}
                                                            {row.bridgeBelief ? `“${row.bridgeBelief}”` : '______________________________'}
                                                        </p>
                                                    </div>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Plan de prueba (experimento de 7 días)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Diseña una práctica diaria para comprobar cada creencia puente con hechos observables y métricas concretas.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowBridgeExperimentHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showBridgeExperimentHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {BRIDGE_EXPERIMENT_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showBridgeExperimentHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo</p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Nueva creencia (puente):</span>{' '}
                                                “Puedo pedir ayuda específica sin perder autoridad.”
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Conducta mínima diaria (5-10 min):</span>{' '}
                                                Cada día pediré apoyo específico en 1 punto (pregunta concreta) a un par/equipo y registraré la respuesta.
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Evidencia que buscaré (hechos):</span>{' '}
                                                7 solicitudes realizadas (chat/correo/reunión) + 7 respuestas recibidas + 1 mejora aplicada en mi
                                                entrega.
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Indicador de progreso (medible):</span>{' '}
                                                Número de veces que pedí ayuda (meta: 7/7) y ansiedad antes de pedirla (0-10, meta: bajar al menos 2
                                                puntos al día 7).
                                            </p>
                                        </article>
                                    )}
                                </section>

                                <p className="text-xs text-slate-500">
                                    Tarjetas completas: {completedBridgeExperimentRows} / {BRIDGE_EXPERIMENT_ROWS}
                                </p>

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {bridgeExperimentRows.map((row, rowIndex) => {
                                        const isEditing = bridgeExperimentEditModes[rowIndex]
                                        const rowDisabled = isLocked || !isEditing
                                        const rowBridgeOptions =
                                            row.bridgeBelief && !bridgeBeliefOptions.includes(row.bridgeBelief)
                                                ? [row.bridgeBelief, ...bridgeBeliefOptions]
                                                : bridgeBeliefOptions

                                        return (
                                            <article
                                                key={`bridge-experiment-${rowIndex}`}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">Experimento {rowIndex + 1}</h4>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => editBridgeExperimentRow(rowIndex)}
                                                            disabled={isLocked || isEditing}
                                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveBridgeExperimentRow(rowIndex)}
                                                            disabled={isLocked || !isEditing}
                                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Nueva creencia (o puente)</span>
                                                            <select
                                                                value={row.bridgeBelief}
                                                                onChange={(event) => setBridgeExperimentCell(rowIndex, 'bridgeBelief', event.target.value)}
                                                                disabled={rowDisabled || rowBridgeOptions.length === 0}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                            >
                                                                <option value="">
                                                                    {rowBridgeOptions.length > 0
                                                                        ? 'Selecciona una creencia puente'
                                                                        : 'Primero define creencias puente en el Instrumento 1'}
                                                                </option>
                                                                {rowBridgeOptions.map((belief) => (
                                                                    <option key={belief} value={belief}>
                                                                        {belief}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                Conducta mínima diaria (5-10 min)
                                                            </span>
                                                            <textarea
                                                                value={row.dailyBehavior}
                                                                onChange={(event) => setBridgeExperimentCell(rowIndex, 'dailyBehavior', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[96px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="¿Qué harás cada día?"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                Evidencia que buscaré (hechos)
                                                            </span>
                                                            <textarea
                                                                value={row.evidence}
                                                                onChange={(event) => setBridgeExperimentCell(rowIndex, 'evidence', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[96px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="¿Qué señales observables confirmarían el avance?"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                Indicador de progreso (medible)
                                                            </span>
                                                            <textarea
                                                                value={row.indicator}
                                                                onChange={(event) => setBridgeExperimentCell(rowIndex, 'indicator', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[96px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Define meta y escala (conteo o 0-10)."
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Nueva creencia (o puente):</span>{' '}
                                                            {row.bridgeBelief ? `“${row.bridgeBelief}”` : '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Conducta mínima diaria (5-10 min):</span>{' '}
                                                            {row.dailyBehavior || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Evidencia que buscaré (hechos):</span>{' '}
                                                            {row.evidence || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Indicador de progreso (medible):</span>{' '}
                                                            {row.indicator || '______________________________'}
                                                        </p>
                                                    </div>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>
                            </article>
                        )}

                        {isPageVisible(9) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 9</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Mantras personales</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Crear frases cortas que activen tu identidad cuando el contexto te presiona.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Marco de trabajo</h3>
                                            <p className="mt-1 text-sm text-slate-700">Fórmula recomendada: “Yo soy + acción + valor + impacto”.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowMantraHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showMantraHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {MANTRA_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-2">
                                        <p className="text-sm font-bold text-slate-900">Ejemplos</p>
                                        {MANTRA_EXAMPLES.map((example) => (
                                            <p key={example} className="text-sm text-slate-700">
                                                • {example}
                                            </p>
                                        ))}
                                    </article>

                                    {showMantraHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo completo</p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Mantra:</span> “Yo soy un líder que escucha con respeto y
                                                decide con claridad.”
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Situación donde lo necesito:</span> “Cuando cuestionan mi
                                                propuesta en público o hay tensión en reunión.”
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Conducta visible que lo demuestra:</span> “Hago 1 pausa,
                                                formulo 1 pregunta antes de responder y resumo lo que entendí en 1 frase.”
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Recordatorio (señal):</span> “Sticky en el portátil:
                                                ‘PAUSA + 1 PREGUNTA’.”
                                            </p>
                                        </article>
                                    )}
                                </section>

                                <p className="text-xs text-slate-500">
                                    Tarjetas completadas: {completedMantraRows} / {MANTRA_ROWS}
                                </p>

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {mantraRows.map((row, rowIndex) => {
                                        const isEditing = mantraEditModes[rowIndex]
                                        const rowDisabled = isLocked || !isEditing
                                        const isComplete = isMantraCardComplete(row)
                                        const rowSuggestions = mantraSuggestions[rowIndex] || []

                                        return (
                                            <article
                                                key={`mantra-card-${rowIndex}`}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">Tarjeta {rowIndex + 1} (Mantra {rowIndex + 1})</h4>
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                            isComplete
                                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {isComplete ? 'Completado' : 'Pendiente'}
                                                    </span>
                                                </div>

                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => editMantraRow(rowIndex)}
                                                        disabled={isLocked || isEditing}
                                                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => saveMantraRow(rowIndex)}
                                                        disabled={isLocked || !isEditing}
                                                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Guardar cambios
                                                    </button>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mantra</span>
                                                            <textarea
                                                                value={row.mantra}
                                                                onChange={(event) => setMantraCell(rowIndex, 'mantra', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Escribe tu mantra"
                                                            />
                                                            <p className="text-[11px] text-slate-500">Formato sugerido: “Yo soy + acción + valor + impacto”.</p>
                                                        </label>

                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Situación donde lo necesito</span>
                                                            <textarea
                                                                value={row.situation}
                                                                onChange={(event) => setMantraCell(rowIndex, 'situation', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Ej.: Cuando hay tensión en reunión con cliente y equipo"
                                                            />
                                                        </label>

                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Conducta visible que lo demuestra</span>
                                                            <textarea
                                                                value={row.behavior}
                                                                onChange={(event) => setMantraCell(rowIndex, 'behavior', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Describe una conducta observable"
                                                            />
                                                        </label>

                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Recordatorio (señal)</span>
                                                            <textarea
                                                                value={row.signal}
                                                                onChange={(event) => setMantraCell(rowIndex, 'signal', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Define tu recordatorio"
                                                            />
                                                            <p className="text-[11px] text-slate-500">{MANTRA_SIGNAL_HINT}</p>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Mantra:</span>{' '}
                                                            {row.mantra ? `“${row.mantra}”` : '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Situación donde lo necesito:</span>{' '}
                                                            {row.situation || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Conducta visible que lo demuestra:</span>{' '}
                                                            {row.behavior || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Recordatorio (señal):</span>{' '}
                                                            {row.signal || '______________________________'}
                                                        </p>
                                                    </div>
                                                )}

                                                {rowSuggestions.length > 0 && (
                                                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                            Sugerencias (puedes ignorarlas)
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {rowSuggestions.map((suggestion) => (
                                                                <li key={`${rowIndex}-${suggestion}`} className="text-xs text-amber-800 flex items-start gap-2">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-700 shrink-0" />
                                                                    <span>{suggestion}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>
                            </article>
                        )}

                        {isPageVisible(10) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 10</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Identidad futura 10X</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-3xl">
                                        Diseñar quién serás, no solo lo que lograrás.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Instrumento 1 - Future Self Canvas 10X</h3>
                                            <p className="mt-1 text-sm text-slate-700">Regla: escribe en presente, como si ya fueras tu versión 10X.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowFutureSelfHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showFutureSelfHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {FUTURE_SELF_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showFutureSelfHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo breve</p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Identidad:</span> “Soy el tipo de líder que decide con calma
                                                bajo presión y sostiene conversaciones difíciles.”
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Valores:</span> Integridad / Respeto / Excelencia sostenible
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Hábitos:</span> Plan semanal / 2 bloques deep work / ejercicio
                                                / bitácora / pausa antes de responder
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Decisiones:</span> digo no a urgencias no críticas / delego
                                                ejecución / priorizo calidad mínima
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Métricas:</span> 10h deep work/semana / 4 conversaciones
                                                difíciles/mes / estrés baja 2 puntos
                                            </p>
                                        </article>
                                    )}
                                </section>

                                <p className="text-xs text-slate-500">
                                    Bloques completados: {completedFutureSelfBlocks} / {FUTURE_SELF_BLOCK_ORDER.length}
                                </p>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bloque 1 - Identidad</h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('identity', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('identity', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('identity')}
                                                disabled={isLocked || futureSelfEditModes.identity}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('identity')}
                                                disabled={isLocked || !futureSelfEditModes.identity}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.identity ? (
                                            <div className="space-y-2">
                                                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Soy el tipo de líder que...</p>
                                                {futureSelfFields.identity.map((item, index) => (
                                                    <label key={`future-identity-${index}`} className="flex items-start gap-2">
                                                        <span className="mt-2 text-slate-500">•</span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(event) => setFutureSelfListItem('identity', index, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Bullet ${index + 1}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.identity.map((item, index) => (
                                                    <p key={`future-identity-view-${index}`} className="text-sm text-slate-700">
                                                        • {item || '__________________________________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.identity.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.identity.map((suggestion) => (
                                                    <p key={`future-suggestion-identity-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bloque 2 - Valores no negociables (3)</h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('values', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('values', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('values')}
                                                disabled={isLocked || futureSelfEditModes.values}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('values')}
                                                disabled={isLocked || !futureSelfEditModes.values}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.values ? (
                                            <div className="space-y-2">
                                                {futureSelfFields.values.map((item, index) => (
                                                    <label key={`future-values-${index}`} className="flex items-start gap-2">
                                                        <span className="mt-2 text-slate-500">•</span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(event) => setFutureSelfListItem('values', index, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Valor ${index + 1}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.values.map((item, index) => (
                                                    <p key={`future-values-view-${index}`} className="text-sm text-slate-700">
                                                        • {item || '__________________________________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.values.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.values.map((suggestion) => (
                                                    <p key={`future-suggestion-values-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bloque 3 - Hábitos diarios (5)</h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('habits', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('habits', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('habits')}
                                                disabled={isLocked || futureSelfEditModes.habits}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('habits')}
                                                disabled={isLocked || !futureSelfEditModes.habits}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.habits ? (
                                            <div className="space-y-2">
                                                {futureSelfFields.habits.map((item, index) => (
                                                    <label key={`future-habits-${index}`} className="flex items-start gap-2">
                                                        <span className="mt-2 text-slate-500">•</span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(event) => setFutureSelfListItem('habits', index, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Hábito ${index + 1}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.habits.map((item, index) => (
                                                    <p key={`future-habits-view-${index}`} className="text-sm text-slate-700">
                                                        • {item || '__________________________________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.habits.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.habits.map((suggestion) => (
                                                    <p key={`future-suggestion-habits-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">
                                                Bloque 4 - Decisiones que tomaré distinto (3)
                                            </h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('decisions', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('decisions', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('decisions')}
                                                disabled={isLocked || futureSelfEditModes.decisions}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('decisions')}
                                                disabled={isLocked || !futureSelfEditModes.decisions}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.decisions ? (
                                            <div className="space-y-2">
                                                {futureSelfFields.decisions.map((item, index) => (
                                                    <label key={`future-decisions-${index}`} className="flex items-start gap-2">
                                                        <span className="mt-2 text-slate-500">•</span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(event) => setFutureSelfListItem('decisions', index, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Decisión ${index + 1}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.decisions.map((item, index) => (
                                                    <p key={`future-decisions-view-${index}`} className="text-sm text-slate-700">
                                                        • {item || '__________________________________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.decisions.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.decisions.map((suggestion) => (
                                                    <p key={`future-suggestion-decisions-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bloque 5 - Habilidades clave a desarrollar (3)</h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('skills', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('skills', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('skills')}
                                                disabled={isLocked || futureSelfEditModes.skills}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('skills')}
                                                disabled={isLocked || !futureSelfEditModes.skills}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.skills ? (
                                            <div className="space-y-2">
                                                {futureSelfFields.skills.map((item, index) => (
                                                    <label key={`future-skills-${index}`} className="flex items-start gap-2">
                                                        <span className="mt-2 text-slate-500">•</span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(event) => setFutureSelfListItem('skills', index, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Habilidad ${index + 1}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.skills.map((item, index) => (
                                                    <p key={`future-skills-view-${index}`} className="text-sm text-slate-700">
                                                        • {item || '__________________________________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.skills.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.skills.map((suggestion) => (
                                                    <p key={`future-suggestion-skills-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bloque 6 - Entorno (rodeos / elimino)</h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('environment', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('environment', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('environment')}
                                                disabled={isLocked || futureSelfEditModes.environment}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('environment')}
                                                disabled={isLocked || !futureSelfEditModes.environment}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.environment ? (
                                            <div className="space-y-2">
                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Me rodeo de</span>
                                                    <input
                                                        type="text"
                                                        value={futureSelfFields.environment.surround}
                                                        onChange={(event) => setFutureSelfEnvironmentField('surround', event.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Elimino</span>
                                                    <input
                                                        type="text"
                                                        value={futureSelfFields.environment.eliminate}
                                                        onChange={(event) => setFutureSelfEnvironmentField('eliminate', event.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Protejo (opcional)</span>
                                                    <input
                                                        type="text"
                                                        value={futureSelfFields.environment.protect}
                                                        onChange={(event) => setFutureSelfEnvironmentField('protect', event.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <p className="text-sm text-slate-700">• Me rodeo de: {futureSelfFields.environment.surround || '___________________'}</p>
                                                <p className="text-sm text-slate-700">• Elimino: {futureSelfFields.environment.eliminate || '___________________'}</p>
                                                <p className="text-sm text-slate-700">• Protejo: {futureSelfFields.environment.protect || '___________________'}</p>
                                            </div>
                                        )}
                                        {futureSelfSuggestions.environment.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.environment.map((suggestion) => (
                                                    <p key={`future-suggestion-environment-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bloque 7 - Impacto (sirvo / transformo)</h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('impact', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('impact', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('impact')}
                                                disabled={isLocked || futureSelfEditModes.impact}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('impact')}
                                                disabled={isLocked || !futureSelfEditModes.impact}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.impact ? (
                                            <div className="space-y-2">
                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Sirvo a</span>
                                                    <input
                                                        type="text"
                                                        value={futureSelfFields.impact.serve}
                                                        onChange={(event) => setFutureSelfImpactField('serve', event.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Transformo</span>
                                                    <input
                                                        type="text"
                                                        value={futureSelfFields.impact.transform}
                                                        onChange={(event) => setFutureSelfImpactField('transform', event.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="block space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Resultado que dejo (opcional)</span>
                                                    <input
                                                        type="text"
                                                        value={futureSelfFields.impact.result}
                                                        onChange={(event) => setFutureSelfImpactField('result', event.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <p className="text-sm text-slate-700">• Sirvo a: {futureSelfFields.impact.serve || '___________________'}</p>
                                                <p className="text-sm text-slate-700">• Transformo: {futureSelfFields.impact.transform || '___________________'}</p>
                                                <p className="text-sm text-slate-700">
                                                    • Resultado que dejo: {futureSelfFields.impact.result || '___________________'}
                                                </p>
                                            </div>
                                        )}
                                        {futureSelfSuggestions.impact.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.impact.map((suggestion) => (
                                                    <p key={`future-suggestion-impact-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">
                                                Bloque 8 - Métricas personales (cómo mediré avance)
                                            </h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('metrics', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('metrics', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('metrics')}
                                                disabled={isLocked || futureSelfEditModes.metrics}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('metrics')}
                                                disabled={isLocked || !futureSelfEditModes.metrics}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.metrics ? (
                                            <div className="space-y-2">
                                                {futureSelfFields.metrics.map((item, index) => (
                                                    <label key={`future-metrics-${index}`} className="flex items-start gap-2">
                                                        <span className="mt-2 text-slate-500">•</span>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(event) => setFutureSelfListItem('metrics', index, event.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Métrica ${index + 1}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.metrics.map((item, index) => (
                                                    <p key={`future-metrics-view-${index}`} className="text-sm text-slate-700">
                                                        • {item || '__________________________________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.metrics.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.metrics.map((suggestion) => (
                                                    <p key={`future-suggestion-metrics-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm xl:col-span-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">
                                                Bloque 9 - Riesgos (sabotaje + prevención)
                                            </h4>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                    isFutureSelfBlockComplete('risks', futureSelfFields)
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {isFutureSelfBlockComplete('risks', futureSelfFields) ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => editFutureSelfBlock('risks')}
                                                disabled={isLocked || futureSelfEditModes.risks}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveFutureSelfBlock('risks')}
                                                disabled={isLocked || !futureSelfEditModes.risks}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                        {futureSelfEditModes.risks ? (
                                            <div className="space-y-2">
                                                {futureSelfFields.risks.map((row, index) => (
                                                    <div key={`future-risks-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            value={row.risk}
                                                            onChange={(event) => setFutureSelfRiskField(index, 'risk', event.target.value)}
                                                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Riesgo ${index + 1}`}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={row.prevention}
                                                            onChange={(event) => setFutureSelfRiskField(index, 'prevention', event.target.value)}
                                                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                                                            placeholder={`Prevención ${index + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {futureSelfFields.risks.map((row, index) => (
                                                    <p key={`future-risks-view-${index}`} className="text-sm text-slate-700">
                                                        • Riesgo: {row.risk || '___________'} | Prevención: {row.prevention || '___________'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {futureSelfSuggestions.risks.length > 0 && (
                                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                    Sugerencias (puedes ignorarlas)
                                                </p>
                                                {futureSelfSuggestions.risks.map((suggestion) => (
                                                    <p key={`future-suggestion-risks-${suggestion}`} className="text-xs text-amber-800">
                                                        • {suggestion}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 2 - Backcasting (de futuro a presente)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Dibuja una línea hacia atrás: Año 10 → Año 3 → Año 1 → Próximos 30 días.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowBackcastingHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showBackcastingHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {BACKCASTING_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showBackcastingHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo breve</p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Año 1:</span> Logro “lidero 2 proyectos estratégicos”; Hábito
                                                “2 bloques deep work/día”; Evidencia “agenda + entregables + feedback”.
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">30 días:</span> Logro “delegué 1 tarea crítica”; Hábito
                                                “check-in semanal 20 min”; Evidencia “delegación documentada + resultado”.
                                            </p>
                                        </article>
                                    )}
                                </section>

                                <p className="text-xs text-slate-500">
                                    Tarjetas completadas: {completedBackcastingRows} / {BACKCASTING_ROWS}
                                </p>

                                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="text-sm md:text-base font-bold text-slate-900">Línea de tiempo Backcasting</h4>
                                        <span className="text-xs font-semibold text-slate-500">Se actualiza con cada guardado</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[860px] relative px-2 pb-2">
                                            <div className="absolute left-12 right-12 top-5 h-0.5 bg-slate-300" />
                                            <div className="grid grid-cols-4 gap-4 relative">
                                                {BACKCASTING_PERIODS.map((period, rowIndex) => {
                                                    const row = backcastingRows[rowIndex]
                                                    const isComplete = row ? isBackcastingRowComplete(row) : false

                                                    return (
                                                        <article key={`backcasting-timeline-${period.key}`} className="pt-1">
                                                            <div className="flex flex-col items-center text-center">
                                                                <span
                                                                    className={`h-4 w-4 rounded-full border-2 ${
                                                                        isComplete
                                                                            ? 'bg-emerald-500 border-emerald-600'
                                                                            : 'bg-slate-200 border-slate-400'
                                                                    }`}
                                                                />
                                                                <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                                                                    {period.shortLabel}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                                                                <p className="text-xs text-slate-700">
                                                                    <span className="font-semibold text-slate-900">Logro:</span>{' '}
                                                                    {(row && row.achievement) || 'Pendiente'}
                                                                </p>
                                                                <p className="text-xs text-slate-700">
                                                                    <span className="font-semibold text-slate-900">Hábito:</span>{' '}
                                                                    {(row && row.habit) || 'Pendiente'}
                                                                </p>
                                                                <p className="text-xs text-slate-700">
                                                                    <span className="font-semibold text-slate-900">Evidencia:</span>{' '}
                                                                    {(row && row.evidence) || 'Pendiente'}
                                                                </p>
                                                            </div>
                                                        </article>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {BACKCASTING_PERIODS.map((period, rowIndex) => {
                                        const row = backcastingRows[rowIndex]
                                        const isEditing = backcastingEditModes[rowIndex]
                                        const rowDisabled = isLocked || !isEditing
                                        const isComplete = row ? isBackcastingRowComplete(row) : false

                                        return (
                                            <article
                                                key={`backcasting-card-${period.key}`}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm md:text-base font-bold text-slate-900">{period.label}</h4>
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                            isComplete
                                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {isComplete ? 'Completado' : 'Pendiente'}
                                                    </span>
                                                </div>

                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => editBackcastingRow(rowIndex)}
                                                        disabled={isLocked || isEditing}
                                                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => saveBackcastingRow(rowIndex)}
                                                        disabled={isLocked || !isEditing}
                                                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Guardar cambios
                                                    </button>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Logro</span>
                                                            <textarea
                                                                value={row?.achievement || ''}
                                                                onChange={(event) => setBackcastingCell(rowIndex, 'achievement', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Qué se habrá conseguido"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Hábito</span>
                                                            <textarea
                                                                value={row?.habit || ''}
                                                                onChange={(event) => setBackcastingCell(rowIndex, 'habit', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Qué se habrá instalado"
                                                            />
                                                        </label>
                                                        <label className="block space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Evidencia concreta</span>
                                                            <textarea
                                                                value={row?.evidence || ''}
                                                                onChange={(event) => setBackcastingCell(rowIndex, 'evidence', event.target.value)}
                                                                disabled={rowDisabled}
                                                                className="w-full min-h-[84px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Qué verás por escrito/medible"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Logro:</span>{' '}
                                                            {row?.achievement || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Hábito:</span>{' '}
                                                            {row?.habit || '______________________________'}
                                                        </p>
                                                        <p className="text-sm text-slate-700">
                                                            <span className="font-semibold text-slate-900">Evidencia concreta:</span>{' '}
                                                            {row?.evidence || '______________________________'}
                                                        </p>
                                                    </div>
                                                )}
                                            </article>
                                        )
                                    })}
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">
                                                Instrumento 3 - Carta desde tu futuro (1 página)
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                Escribe una carta iniciando así: “Hoy te escribo desde mi identidad 10X... Esto fue lo que dejé de
                                                negociar...”.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowFutureLetterHelp((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            {showFutureLetterHelp ? 'Ocultar ayuda' : 'Ayuda / Ver ejemplo'}
                                        </button>
                                    </div>

                                    <ul className="space-y-1.5">
                                        {FUTURE_LETTER_INSTRUCTIONS.map((instruction) => (
                                            <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{instruction}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {showFutureLetterHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-2">
                                            <p className="text-sm font-extrabold text-slate-900">Ejemplo de carta</p>
                                            <div className="rounded-lg border border-blue-200 bg-white p-4">
                                                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{FUTURE_LETTER_EXAMPLE}</p>
                                            </div>
                                        </article>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                futureLetterCompleted
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {futureLetterCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                        <p
                                            className={`text-xs font-semibold ${
                                                futureLetterWithinSuggestedRange ? 'text-blue-700' : 'text-slate-500'
                                            }`}
                                        >
                                            Palabras: {futureLetterWordCount} (recomendado {FUTURE_LETTER_WORD_MIN}-{FUTURE_LETTER_WORD_MAX}, no
                                            bloqueante)
                                        </p>
                                    </div>

                                    <div className="inline-flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={editFutureLetter}
                                            disabled={isLocked || futureLetterIsEditing}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveFutureLetter}
                                            disabled={isLocked || !futureLetterIsEditing}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar cambios
                                        </button>
                                    </div>

                                    {futureLetterIsEditing ? (
                                        <textarea
                                            value={futureLetterText}
                                            onChange={(event) => setFutureLetterText(event.target.value)}
                                            disabled={isLocked || !futureLetterIsEditing}
                                            className="w-full min-h-[340px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                            placeholder="Escribe aquí tu carta desde la identidad 10X..."
                                        />
                                    ) : (
                                        <div className="min-h-[220px] rounded-xl border border-slate-200 bg-white p-4">
                                            {futureLetterText.trim().length > 0 ? (
                                                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{futureLetterText}</p>
                                            ) : (
                                                <p className="text-sm italic text-slate-500">
                                                    Presiona “Editar” para escribir tu carta de 1 página (500-700 palabras sugeridas).
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <label className="inline-flex items-start gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={futureLetterManualComplete}
                                            onChange={toggleFutureLetterManualComplete}
                                            disabled={isLocked}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-300 disabled:opacity-50"
                                        />
                                        <span>Marcar como completo (incluí no negociables + hábito + decisión + impacto).</span>
                                    </label>

                                    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
                                            Detección automática (puedes sobrescribirla con el check manual)
                                        </p>
                                        <ul className="space-y-1.5">
                                            {(Object.keys(FUTURE_LETTER_CHECK_LABELS) as FutureLetterChecklistKey[]).map((key) => {
                                                const ok = futureLetterChecklist[key]
                                                return (
                                                    <li key={key} className="flex items-start gap-2 text-sm">
                                                        <span
                                                            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                                                                ok ? 'bg-emerald-500' : 'bg-slate-300'
                                                            }`}
                                                        />
                                                        <span className={ok ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                                                            {FUTURE_LETTER_CHECK_LABELS[key]}
                                                        </span>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                        <p className="text-xs text-slate-500">Criterios detectados: {completedFutureLetterChecks} / 4</p>
                                    </article>
                                </section>
                            </article>
                        )}

                        {isPageVisible(11) && (
                            <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-sm">
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 11</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Evaluación</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Objetivo: permitir que mentor y líder evalúen con evidencia, definan decisiones por criterio y cierren con
                                        síntesis de acuerdos de 30 días.
                                    </p>
                                </header>

                                {!isExportingAll && (
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                            {EVALUATION_STAGES.map((stage) => {
                                                const isActive = evaluationStage === stage.key
                                                const isComplete = evaluationStageCompletionMap[stage.key]
                                                return (
                                                    <button
                                                        key={stage.key}
                                                        type="button"
                                                        onClick={() => changeEvaluationStage(stage.key)}
                                                        className={`rounded-xl border px-3 py-2 text-xs md:text-sm font-semibold text-left transition-colors ${
                                                            isActive
                                                                ? 'border-blue-300 bg-blue-50 text-blue-800'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <p>{stage.label}</p>
                                                        <p className={`mt-1 text-[11px] ${isComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                            {isComplete ? 'Completado' : 'Pendiente'}
                                                        </p>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={goPrevEvaluationStage}
                                                disabled={!hasPrevEvaluationStage}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                type="button"
                                                onClick={goNextEvaluationStage}
                                                disabled={!hasNextEvaluationStage}
                                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </section>
                                )}

                                {(evaluationStage === 'mentor' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">A) Modo iShine - Rúbricas</h3>
                                            <ul className="space-y-1.5">
                                                {MENTOR_EVALUATION_INSTRUCTIONS.map((instruction) => (
                                                    <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </article>

                                        <p className="text-xs text-slate-500">Criterios completados: {mentorCompletedRows} / {MENTOR_CRITERIA_ROWS}</p>

                                        <section className="space-y-4">
                                            {mentorCriteriaRows.map((row, rowIndex) => {
                                                const isEditing = mentorCriteriaEditModes[rowIndex]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isMentorCriterionComplete(row)
                                                const rowSuggestions = mentorCriteriaSuggestions[rowIndex] || []
                                                const showIndicators = openMentorIndicatorRow === rowIndex

                                                return (
                                                    <article
                                                        key={`mentor-criterion-${rowIndex}`}
                                                        className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4"
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="text-sm md:text-base font-bold text-slate-900">{row.criterion}</h4>
                                                                <p className="text-xs text-slate-500 mt-1">Criterio {rowIndex + 1} de {MENTOR_CRITERIA_ROWS}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleMentorIndicators(rowIndex)}
                                                                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                                >
                                                                    {showIndicators ? 'Ocultar indicadores' : 'Ver indicadores N1-N4'}
                                                                </button>
                                                                <span
                                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                                        isComplete
                                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                                    }`}
                                                                >
                                                                    {isComplete ? 'Completado' : 'Pendiente'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {showIndicators && (
                                                            <article className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-1">
                                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-800">{row.criterion}</p>
                                                                {MENTOR_LEVEL_INDICATORS.map((indicator) => (
                                                                    <p key={`${row.criterion}-${indicator}`} className="text-xs text-blue-900">
                                                                        • {indicator}
                                                                    </p>
                                                                ))}
                                                            </article>
                                                        )}

                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editMentorCriterionRow(rowIndex)}
                                                                disabled={isLocked || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveMentorCriterionRow(rowIndex)}
                                                                disabled={isLocked || !isEditing}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar fila
                                                            </button>
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="space-y-4">
                                                                <fieldset className="space-y-2">
                                                                    <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Nivel</legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_LEVEL_OPTIONS.map((level) => (
                                                                            <label
                                                                                key={`mentor-level-${rowIndex}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`mentor-level-${rowIndex}`}
                                                                                    value={level}
                                                                                    checked={row.level === level}
                                                                                    onChange={(event) =>
                                                                                        setMentorCriterionField(rowIndex, 'level', event.target.value)
                                                                                    }
                                                                                    disabled={rowDisabled}
                                                                                    className="h-3.5 w-3.5"
                                                                                />
                                                                                <span>{level}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </fieldset>

                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                        Comentario / evidencia observable
                                                                    </span>
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(event) => setMentorCriterionField(rowIndex, 'evidence', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[88px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                        placeholder='Describe hechos observables (si falta evidencia, escribe "Completar").'
                                                                    />
                                                                </label>

                                                                <fieldset className="space-y-2">
                                                                    <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                        Decisión del iShine
                                                                    </legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                            <label
                                                                                key={`mentor-decision-${rowIndex}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`mentor-decision-${rowIndex}`}
                                                                                    value={decision}
                                                                                    checked={row.decision === decision}
                                                                                    onChange={(event) =>
                                                                                        setMentorCriterionField(rowIndex, 'decision', event.target.value)
                                                                                    }
                                                                                    disabled={rowDisabled}
                                                                                    className="h-3.5 w-3.5"
                                                                                />
                                                                                <span>{decision}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </fieldset>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 text-sm text-slate-700">
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Nivel:</span> {row.level || 'Pendiente'}
                                                                </p>
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Comentario / evidencia:</span>{' '}
                                                                    {row.evidence || 'Pendiente'}
                                                                </p>
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Decisión:</span>{' '}
                                                                    {row.decision || 'Pendiente'}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {rowSuggestions.length > 0 && (
                                                            <article className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                                    Sugerencias (puedes guardar igual)
                                                                </p>
                                                                {rowSuggestions.map((suggestion) => (
                                                                    <p key={`mentor-suggestion-${rowIndex}-${suggestion}`} className="text-xs text-amber-800">
                                                                        • {suggestion}
                                                                    </p>
                                                                ))}
                                                            </article>
                                                        )}
                                                    </article>
                                                )
                                            })}
                                        </section>

                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <h4 className="text-base font-bold text-slate-900">Panel de cierre iShine</h4>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                        mentorSectionCompleted
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {mentorSectionCompleted ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={editMentorClosure}
                                                    disabled={isLocked || mentorClosureIsEditing}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={saveMentorClosure}
                                                    disabled={isLocked || !mentorClosureIsEditing}
                                                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Guardar panel
                                                </button>
                                            </div>

                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                    Observaciones generales del iShine
                                                </span>
                                                <textarea
                                                    value={mentorGeneralNotes}
                                                    onChange={(event) => {
                                                        if (!mentorClosureIsEditing || isLocked) return
                                                        setMentorGeneralNotes(event.target.value)
                                                    }}
                                                    disabled={isLocked || !mentorClosureIsEditing}
                                                    className="w-full min-h-[120px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                    placeholder='Registra observaciones globales (si falta evidencia, escribe "Completar").'
                                                />
                                            </label>

                                            <fieldset className="space-y-2">
                                                <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión global del WB</legend>
                                                <div className="flex flex-wrap gap-2">
                                                    {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                        <label
                                                            key={`mentor-global-${decision}`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="mentor-global-decision"
                                                                value={decision}
                                                                checked={mentorGlobalDecision === decision}
                                                                onChange={(event) => setMentorGlobalDecisionValue(event.target.value)}
                                                                disabled={isLocked || !mentorClosureIsEditing}
                                                                className="h-3.5 w-3.5"
                                                            />
                                                            <span>{decision}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </fieldset>
                                        </article>
                                    </section>
                                )}

                                {(evaluationStage === 'leader' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">B) Modo Líder - Autoevaluación</h3>
                                            <ul className="space-y-1.5">
                                                {LEADER_EVALUATION_INSTRUCTIONS.map((instruction) => (
                                                    <li key={instruction} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </article>

                                        <p className="text-xs text-slate-500">Preguntas completadas: {leaderCompletedRows} / {LEADER_EVALUATION_ROWS}</p>

                                        <section className="space-y-4">
                                            {leaderEvaluationRows.map((row, rowIndex) => {
                                                const isEditing = leaderEvaluationEditModes[rowIndex]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isLeaderEvaluationRowComplete(row)
                                                const rowSuggestions = leaderEvaluationSuggestions[rowIndex] || []
                                                const showHelp = openLeaderHelpRow === rowIndex
                                                const example = LEADER_HELP_EXAMPLES[rowIndex]

                                                return (
                                                    <article key={`leader-evaluation-${rowIndex}`} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="text-sm md:text-base font-bold text-slate-900">{row.question}</h4>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    Pregunta {rowIndex + 1} de {LEADER_EVALUATION_ROWS}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleLeaderHelp(rowIndex)}
                                                                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                                >
                                                                    {showHelp ? 'Ocultar ejemplo' : 'Ayuda / Ver ejemplo'}
                                                                </button>
                                                                <span
                                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                                        isComplete
                                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                                    }`}
                                                                >
                                                                    {isComplete ? 'Completado' : 'Pendiente'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {showHelp && (
                                                            <article className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-800">Ejemplo de referencia</p>
                                                                <p className="text-xs text-blue-900">
                                                                    <span className="font-semibold">Respuesta:</span> {example.response}
                                                                </p>
                                                                <p className="text-xs text-blue-900">
                                                                    <span className="font-semibold">Evidencia:</span> {example.evidence}
                                                                </p>
                                                                <p className="text-xs text-blue-900">
                                                                    <span className="font-semibold">Acción 30 días:</span> {example.action}
                                                                </p>
                                                            </article>
                                                        )}

                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => editLeaderEvaluationRow(rowIndex)}
                                                                disabled={isLocked || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveLeaderEvaluationRow(rowIndex)}
                                                                disabled={isLocked || !isEditing}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar fila
                                                            </button>
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="space-y-3">
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Respuesta del líder</span>
                                                                    <textarea
                                                                        value={row.response}
                                                                        onChange={(event) => setLeaderEvaluationField(rowIndex, 'response', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                        placeholder="Respuesta basada en hechos recientes."
                                                                    />
                                                                </label>
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                        Evidencia / Ejemplo
                                                                    </span>
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(event) => setLeaderEvaluationField(rowIndex, 'evidence', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[80px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                        placeholder="Hecho + contexto."
                                                                    />
                                                                </label>
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                        Acción o compromiso (30 días)
                                                                    </span>
                                                                    <textarea
                                                                        value={row.action}
                                                                        onChange={(event) => setLeaderEvaluationField(rowIndex, 'action', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[80px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                        placeholder="Acción específica y frecuencia."
                                                                    />
                                                                </label>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 text-sm text-slate-700">
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Respuesta:</span> {row.response || 'Pendiente'}
                                                                </p>
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Evidencia:</span> {row.evidence || 'Pendiente'}
                                                                </p>
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Acción 30 días:</span> {row.action || 'Pendiente'}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {rowSuggestions.length > 0 && (
                                                            <article className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
                                                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                                                                    Sugerencias (puedes guardar igual)
                                                                </p>
                                                                {rowSuggestions.map((suggestion) => (
                                                                    <p key={`leader-suggestion-${rowIndex}-${suggestion}`} className="text-xs text-amber-800">
                                                                        • {suggestion}
                                                                    </p>
                                                                ))}
                                                            </article>
                                                        )}
                                                    </article>
                                                )
                                            })}
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'synthesis' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">C) Síntesis de acuerdos iShine-Líder</h3>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                        synthesisSectionCompleted
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {synthesisSectionCompleted ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={editSynthesisBlock}
                                                    disabled={isLocked || synthesisIsEditing}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={saveSynthesisBlock}
                                                    disabled={isLocked || !synthesisIsEditing}
                                                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Guardar síntesis
                                                </button>
                                            </div>

                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Síntesis de acuerdos iShine-Líder</span>
                                                <textarea
                                                    value={synthesisText}
                                                    onChange={(event) => {
                                                        if (!synthesisIsEditing || isLocked) return
                                                        setSynthesisText(event.target.value)
                                                    }}
                                                    disabled={isLocked || !synthesisIsEditing}
                                                    className="w-full min-h-[150px] rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                    placeholder='Síntesis del acuerdo conjunto (si falta información, escribe "Completar").'
                                                />
                                            </label>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                        Foco de los próximos 30 días
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={synthesisFocus30Days}
                                                        onChange={(event) => {
                                                            if (!synthesisIsEditing || isLocked) return
                                                            setSynthesisFocus30Days(event.target.value)
                                                        }}
                                                        disabled={isLocked || !synthesisIsEditing}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                        placeholder="Foco 30 días"
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                        Hábito/acción semanal acordada
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={synthesisWeeklyAction}
                                                        onChange={(event) => {
                                                            if (!synthesisIsEditing || isLocked) return
                                                            setSynthesisWeeklyAction(event.target.value)
                                                        }}
                                                        disabled={isLocked || !synthesisIsEditing}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                        placeholder="Hábito semanal"
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                        Cómo se evidenciará (indicador)
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={synthesisIndicator}
                                                        onChange={(event) => {
                                                            if (!synthesisIsEditing || isLocked) return
                                                            setSynthesisIndicator(event.target.value)
                                                        }}
                                                        disabled={isLocked || !synthesisIsEditing}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                        placeholder="Indicador"
                                                    />
                                                </label>
                                            </div>
                                        </article>
                                    </section>
                                )}

                                {(evaluationStage === 'final' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article
                                            className={`rounded-2xl border p-5 md:p-6 ${
                                                evaluationCompleted
                                                    ? 'border-emerald-300 bg-emerald-50'
                                                    : 'border-amber-300 bg-amber-50'
                                            }`}
                                        >
                                            <h3 className={`text-lg md:text-xl font-extrabold ${evaluationCompleted ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                {evaluationCompleted ? 'WB1 Evaluación completada' : 'WB1 Evaluación en progreso'}
                                            </h3>
                                            <p className={`mt-2 text-sm ${evaluationCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {evaluationCompleted
                                                    ? 'iShine y líder cerraron rúbrica, autoevaluación y síntesis.'
                                                    : 'Completa los bloques pendientes para cerrar la evaluación.'}
                                            </p>
                                        </article>

                                        <article className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                            <h4 className="text-base md:text-lg font-bold text-slate-900">Resumen automático</h4>
                                            <div className="space-y-2">
                                                {mentorCriteriaRows.map((row, index) => (
                                                    <div
                                                        key={`evaluation-summary-criterion-${index}`}
                                                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                                                    >
                                                        <p className="font-semibold text-slate-900">{row.criterion}</p>
                                                        <p>
                                                            Nivel: <span className="font-medium text-slate-900">{row.level || 'Pendiente'}</span>
                                                        </p>
                                                        <p>
                                                            Decisión: <span className="font-medium text-slate-900">{row.decision || 'Pendiente'}</span>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">Decisión global:</span> {mentorGlobalDecision || 'Pendiente'}
                                            </p>
                                        </article>

                                        <article className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-3">
                                            <h4 className="text-base md:text-lg font-bold text-slate-900">Compromisos 30 días (extraídos)</h4>
                                            {extractedCommitments.length > 0 ? (
                                                <ul className="space-y-1.5">
                                                    {extractedCommitments.map((commitment, index) => (
                                                        <li key={`commitment-${index}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                            <span>{commitment}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-500">Aún no hay compromisos registrados en la autoevaluación.</p>
                                            )}
                                        </article>
                                    </section>
                                )}
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb1-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button
                                    type="button"
                                    onClick={goPrevPage}
                                    disabled={!hasPrevPage}
                                    className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}
                                >
                                    <ArrowLeft size={15} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {PAGES[currentPageIndex]?.shortLabel || 'Página'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={goNextPage}
                                    disabled={!hasNextPage}
                                    className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}
                                >
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={15} />
                                </button>
                            </nav>
                        )}
                    </section>
                </div>
            </main>

            {showEventModal && (
                <div className="wb1-modal fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowEventModal(false)} />
                    <div className="relative w-full max-w-2xl rounded-2xl border border-slate-300 bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <h3 className="text-base md:text-lg font-bold text-slate-900">Agregar evento de línea de vida</h3>
                            <button
                                type="button"
                                onClick={() => setShowEventModal(false)}
                                className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tipo</span>
                                <select
                                    value={eventDraft.type}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, type: event.target.value as StoryEventType }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="logro">Logro</option>
                                    <option value="logro-golpe">Logro / Golpe</option>
                                    <option value="golpe">Golpe / Crisis / Quiebre</option>
                                </select>
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha aproximada</span>
                                <input
                                    type="month"
                                    value={eventDraft.approxDate}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, approxDate: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué ocurrió (hecho)</span>
                                <textarea
                                    value={eventDraft.happened}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, happened: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué decidí / interpreté</span>
                                <textarea
                                    value={eventDraft.interpreted}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, interpreted: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué aprendí</span>
                                <textarea
                                    value={eventDraft.learned}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, learned: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué creencia se instaló</span>
                                <textarea
                                    value={eventDraft.belief}
                                    onChange={(event) => setEventDraft((prev) => ({ ...prev, belief: event.target.value }))}
                                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setShowEventModal(false)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveEvent}
                                disabled={!validateEventDraft()}
                                className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Guardar evento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    .wb1-toolbar,
                    .wb1-sidebar,
                    .wb1-page-nav,
                    .wb1-modal {
                        display: none !important;
                    }
                    button {
                        display: none !important;
                    }
                    body {
                        background: #fff !important;
                    }
                    main {
                        padding: 0 !important;
                    }
                    main > div {
                        display: block !important;
                        min-width: 0 !important;
                    }
                    main section {
                        min-width: 0 !important;
                    }
                    .overflow-x-auto {
                        overflow: visible !important;
                    }
                    table {
                        min-width: 0 !important;
                        width: 100% !important;
                    }
                    input,
                    textarea,
                    select {
                        border: 1px solid #cbd5e1 !important;
                        background: #fff !important;
                        color: #0f172a !important;
                        box-shadow: none !important;
                    }
                    main section > article.rounded-3xl {
                        break-after: page;
                        page-break-after: always;
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        margin-bottom: 10mm !important;
                    }
                    main section > article.rounded-3xl:last-of-type {
                        break-after: auto;
                        page-break-after: auto;
                    }
                }
            `}</style>
        </div>
    )
}
