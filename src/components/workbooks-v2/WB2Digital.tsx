"use client"
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type LayerKey = 'realtime' | 'recovery' | 'maintenance'

type IdentificationFields = {
    leaderName: string
    role: string
    cohort: string
    startDate: string
}

type BitacoraEvent = {
    id: string
    date: string
    situation: string
    actor: string
    emotion: string
    bodySignal: string
    response: string
    impact: string
    trigger: TriggerId | ''
    triggerNote: string
}

type TriggerSummaryAnnotation = {
    responseTypical: string
    costTypical: string
}

type PriorityCard = {
    earlySignal: string
    typicalEmotion: string
    typicalResponse: string
    typicalCost: string
}

type NarrativeCase = {
    eventId: string
    context: string
    interpretation: string
    impulse: string
    realBehavior: string
    costRepeat: string
    learning: string
    alternativeResponse: string
    miniABC: string
}

type AnchorFields = {
    gesture: string
    gesturePreset: string
    keyword: string
    earlySignal: string
    earlySignalPreset: string
    useContext: string
    protectedBehavior: string
    rule1Seconds: string
    rule3Question: string
    beforeIntensity: string
    afterIntensity: string
    cycles: boolean[]
}

type RegulationLayerData = {
    techniques: string[]
    whenToUse: string
    signal: string
}

type IfThenRule = {
    signal: string
    technique: string
    duration: '' | '10s' | '30s' | '2min' | '5min'
}

type RepairScript = {
    fact: string
    impact: string
    repair: string
    request: string
}

type RegulationData = {
    layers: Record<LayerKey, RegulationLayerData>
    ifThenRules: IfThenRule[]
    repair: RepairScript
    referenceAlternative: string
}

type SkillRating = 0 | 1 | 2 | 3 | 4 | 5

type SkillsGapRow = {
    id: string
    skill: string
    current: SkillRating
    ideal: SkillRating
    evidence: string
}

type SkillsGapData = {
    roleIdeal: string
    rows: SkillsGapRow[]
    strongest: string
    weakest: string
    weeklyMinimum: string
}

type GapPriority = 'Alta' | 'Media' | 'Baja'

type SkillsPriorityRow = {
    id: string
    skill: string
    importance: SkillRating
    current: SkillRating
    selected: boolean
}

type SkillsPriorityData = {
    rows: SkillsPriorityRow[]
    priorityOne: string
    priorityTwo: string
    priorityThree: string
    skipForNow: string
}

type MicroHabitId = 'habit-a' | 'habit-b' | 'habit-c' | 'habit-d' | 'habit-e'
type MicroHabitDuration = '' | '30s' | '2min' | '5min' | '10min'

type MicroHabitDefinition = {
    habitId: MicroHabitId
    when: string
    duration: MicroHabitDuration
    evidenceFormat: string
}

type MicroHabitTrackerDay = {
    day: number
    checks: [boolean, boolean, boolean]
    evidence: string
}

type MicroHabitWeeklyReview = {
    week: 1 | 2 | 3 | 4
    consistency: string
    mainTrigger: string
    adjustment: string
}

type MicroHabitsData = {
    selectedHabitIds: MicroHabitId[]
    definitions: MicroHabitDefinition[]
    tracker: MicroHabitTrackerDay[]
    weeklyReviews: MicroHabitWeeklyReview[]
}

type PdiCompetency = '' | 'Autoconciencia' | 'Regulación' | 'Energía' | 'Somática'
type PdiActionFrequency = '' | 'Diario' | '3× sem' | 'Semanal' | 'Por evento'
type PdiActionDuration = '' | '10s' | '30s' | '2min' | '5min' | '10min'

type PdiIndicator = {
    id: string
    value: string
}

type PdiActionRow = {
    id: string
    action: string
    frequency: PdiActionFrequency
    duration: PdiActionDuration
    evidence: string
}

type PdiSupports = {
    supportPerson: string
    criticalContext: string
    likelyBarrier: string
    contingencyPlan: string
}

type PdiWeeklyReviewRow = {
    week: 1 | 2 | 3 | 4
    trigger: string
    technique: string
    adjustment: string
}

type PdiData = {
    objective: string
    primaryCompetency: PdiCompetency
    secondaryCompetency: string
    indicators: PdiIndicator[]
    actions: PdiActionRow[]
    supports: PdiSupports
    weeklyReviews: PdiWeeklyReviewRow[]
}

type MentorLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'
type MentorDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'

type MentorEvaluationRow = {
    criterion: string
    level: MentorLevel
    evidence: string
    decision: MentorDecision
}

type LeaderEvaluationRow = {
    question: string
    response: string
    evidence: string
    action: string
}

type EvaluationData = {
    mentorRows: MentorEvaluationRow[]
    mentorGeneralNotes: string
    mentorGlobalDecision: MentorDecision
    leaderRows: LeaderEvaluationRow[]
    agreementsSynthesis: string
}

type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'

type WB2State = {
    identification: IdentificationFields
    bitacora: BitacoraEvent[]
    triggerAnnotations: Record<TriggerId, TriggerSummaryAnnotation>
    priorityTrigger: TriggerId | ''
    priorityCard: PriorityCard
    narrative: NarrativeCase
    anchor: AnchorFields
    regulation: RegulationData
    skillsGap: SkillsGapData
    skillsPriority: SkillsPriorityData
    microHabits: MicroHabitsData
    pdi: PdiData
    evaluation: EvaluationData
}

const PAGES = [
    { id: 1, label: '1. Portada', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación', shortLabel: 'Presentación' },
    { id: 3, label: '3. Mapa de detonantes', shortLabel: 'Detonantes' },
    { id: 4, label: '4. Narrativa de desafío', shortLabel: 'Narrativa' },
    { id: 5, label: '5. Ancla de seguridad', shortLabel: 'Ancla' },
    { id: 6, label: '6. Kit de regulación', shortLabel: 'Regulación' },
    { id: 7, label: '7. Habilidades vs rol ideal', shortLabel: 'Habilidades' },
    { id: 8, label: '8. Gap de habilidades', shortLabel: 'Gap' },
    { id: 9, label: '9. Micro-hábitos', shortLabel: 'Micro-hábitos' },
    { id: 10, label: '10. PDI 30 días', shortLabel: 'PDI' },
    { id: 11, label: '11. Evaluación', shortLabel: 'Evaluación' }
] as const

const TRIGGER_OPTIONS = [
    { id: 'public-criticism', label: 'Crítica / cuestionamiento público' },
    { id: 'time-pressure', label: 'Urgencias y presión de tiempo' },
    { id: 'ambiguity', label: 'Ambigüedad / falta de claridad' },
    { id: 'uncertainty', label: 'Pérdida de control / incertidumbre' },
    { id: 'injustice', label: 'Injusticia / falta de reconocimiento' },
    { id: 'conflict', label: 'Conflicto interpersonal' },
    { id: 'low-commitment', label: 'Falta de compromiso del equipo' },
    { id: 'overload', label: 'Cansancio / sobrecarga' }
] as const

const GESTURE_OPTIONS = [
    { value: 'thumb-index', label: 'Pulgar + índice' },
    { value: 'touch-watch', label: 'Tocar reloj o pulsera' },
    { value: 'hand-on-chest', label: 'Mano en el pecho' },
    { value: 'firm-feet', label: 'Pies firmes al suelo' },
    { value: 'shoulders-down', label: 'Bajar hombros y alinear postura' },
    { value: 'soft-fist', label: 'Apretar suave el puño y soltar' },
    { value: 'touch-table', label: 'Apoyar palma en la mesa' },
    { value: 'hold-pen', label: 'Tomar bolígrafo y exhalar' },
    { value: 'other', label: 'Otro/a' }
] as const

const EARLY_SIGNAL_OPTIONS = [
    { value: 'jaw-tense', label: 'Mandíbula tensa' },
    { value: 'tight-chest', label: 'Pecho apretado' },
    { value: 'short-breath', label: 'Respiración corta' },
    { value: 'stomach-knot', label: 'Nudo en el estómago' },
    { value: 'shoulder-tension', label: 'Tensión en hombros/cuello' },
    { value: 'face-heat', label: 'Calor en el rostro' },
    { value: 'fast-voice', label: 'Voz acelerada' },
    { value: 'heart-race', label: 'Pulso acelerado' },
    { value: 'dry-mouth', label: 'Sequedad en la boca' },
    { value: 'cold-hands', label: 'Manos frías' },
    { value: 'other', label: 'Otro/a' }
] as const

type TriggerId = (typeof TRIGGER_OPTIONS)[number]['id']
type AnchorPresetOption = (typeof GESTURE_OPTIONS)[number]['value'] | (typeof EARLY_SIGNAL_OPTIONS)[number]['value']

const REGULATION_TECHNIQUES: Record<LayerKey, { id: string; label: string }[]> = {
    realtime: [
        { id: 'stop', label: 'STOP (micro-pausa)' },
        { id: 'labeling', label: 'Etiquetado emocional' },
        { id: 'anchor', label: 'Ancla de serenidad/seguridad' }
    ],
    recovery: [
        { id: 'walk', label: 'Caminata breve sin pantalla' },
        { id: 'box-breathing', label: 'Respiración 4-4-4-4' },
        { id: 'writing', label: 'Descarga escrita (8 líneas + 1 aprendizaje)' },
        { id: 'repair-talk', label: 'Conversación corta de reparación' }
    ],
    maintenance: [
        { id: 'sleep', label: 'Sueño/descanso intencional' },
        { id: 'exercise', label: 'Ejercicio 3× semana' },
        { id: 'journaling', label: 'Journaling 5 min (evento–emoción–aprendizaje)' },
        { id: 'pause-agenda', label: 'Agenda de pausas (2 al día)' }
    ]
}

const REGULATION_TECHNIQUE_GUIDES: Record<string, { duration: string; steps: string[]; example: string }> = {
    stop: {
        duration: '10–20s',
        steps: [
            'Stop 1s: no hables, no respondas, no escribas.',
            'Take a breath: 1 respiración (inhala suave, exhala lento).',
            'Observe: nombra 1 emoción + 1 señal corporal.',
            'Proceed: elige 1 conducta concreta.'
        ],
        example: '“Pecho apretado → ira 7/10 → hago 1 pregunta antes de decidir”.'
    },
    labeling: {
        duration: '5–10s',
        steps: [
            'Nombra la emoción exacta (frustración, miedo, ira, ansiedad).',
            'Añade intensidad 0–10 si puedes.',
            'Evita justificar o debatir la emoción.'
        ],
        example: '“Esto es vergüenza 6/10; no es ataque, es señal”.'
    },
    anchor: {
        duration: '10–20s',
        steps: [
            'Detecta señal corporal temprana.',
            'Activa gesto entrenado.',
            'Exhala 4–6s y repite palabra clave.',
            'Repite 2 veces si hace falta.'
        ],
        example: '“Mandíbula tensa → pulgar–índice + Pausa + exhalo 6s”.'
    },
    walk: {
        duration: '3–8 min',
        steps: [
            'Camina sin celular o con pantalla apagada.',
            'Respira normal y observa entorno.',
            'Cierra con una frase: “Qué haré diferente”.'
        ],
        example: '“Camino 5 min y cierro con 1 aprendizaje accionable”.'
    },
    'box-breathing': {
        duration: '2–5 min',
        steps: [
            'Inhala 4 segundos.',
            'Retén 4 segundos.',
            'Exhala 4 segundos.',
            'Retén 4 segundos; repite 4 ciclos.'
        ],
        example: '“Tras un conflicto hago 4 ciclos y baja la urgencia”.'
    },
    writing: {
        duration: '5–8 min',
        steps: [
            'Escribe 8 líneas sin filtro (hecho, emoción, diálogo interno).',
            'Cierra con 1 línea de aprendizaje.',
            'Evita convertir la descarga en excusa.'
        ],
        example: '“Aprendizaje: bajo crítica pública, pauso y pregunto”.'
    },
    'repair-talk': {
        duration: '3–7 min',
        steps: [
            'Hecho: “En la reunión pasó ___”.',
            'Impacto: “Creo que generó ___”.',
            'Reparación: “Quiero corregirlo así ___”.',
            'Pedido: “¿Acordamos ___?”.'
        ],
        example: '“Te interrumpí; quiero escucharte completo ahora; retomemos tu punto 2 minutos”.'
    },
    sleep: {
        duration: 'Semanal',
        steps: [
            'Define regla mínima de descanso (horas/pantallas off).',
            'Define 1 acción protectora de energía.',
            'Sostén la regla durante la semana.'
        ],
        example: '“Protejo 7h; sin eso, la urgencia me dispara el doble”.'
    },
    exercise: {
        duration: '3 sesiones/semana',
        steps: [
            'Agenda 3 bloques de 30 minutos.',
            'Elige formato sostenible (caminar, fuerza básica, bici).',
            'Registra cumplimiento 3/3.'
        ],
        example: '“3/3 sesiones completas esta semana”.'
    },
    journaling: {
        duration: '5 min al día',
        steps: [
            'Evento: qué pasó.',
            'Emoción: cuál y con qué intensidad.',
            'Aprendizaje: 1 línea accionable.'
        ],
        example: '“Evento: cuestionaron mi idea; emoción: irritación 7/10; aprendizaje: ancla + 1 pregunta”.'
    },
    'pause-agenda': {
        duration: '2 pausas diarias',
        steps: [
            'Programa 2 alarmas (mañana/tarde).',
            'Haz 60–90s de respiración y relajación de hombros/mandíbula.',
            'Retoma con tono y claridad.'
        ],
        example: '“Pausas 11:00 y 16:00 para prevenir reactividad”.'
    }
}

const SCALE_ANCHORS: Record<Exclude<SkillRating, 0>, string> = {
    1: 'Rara vez; casi nunca bajo presión.',
    2: 'A veces; depende del día/contexto.',
    3: 'Frecuente; en contexto normal sí, bajo presión falla.',
    4: 'Casi siempre; falla solo en alta presión.',
    5: 'Consistente incluso bajo presión.'
}

const SKILLS_GAP_DEFINITIONS = [
    {
        id: 'trigger-detection',
        skill: 'Identifico detonantes en tiempo real',
        meaning: 'Reconocer la señal temprana y nombrar el detonante antes de reaccionar.',
        examples: ['Noté mandíbula tensa en reunión y activé ancla antes de responder.', 'Me di cuenta del impulso de interrumpir y hice pausa 2s.']
    },
    {
        id: 'tone-regulation',
        skill: 'Regulo tono y corporalidad',
        meaning: 'Mantener tono, ritmo y postura para no escalar el conflicto.',
        examples: ['Bajé el volumen y hablé más lento cuando me cuestionaron.', 'No interrumpí; respiré y esperé mi turno.']
    },
    {
        id: 'calm-under-pressure',
        skill: 'Mantengo calma bajo presión',
        meaning: 'Sostener claridad y criterio en momentos de tensión.',
        examples: ['En crisis, prioricé 3 puntos y pedí claridad en vez de reaccionar.', 'Sostuve conversación tensa sin elevar tono.']
    },
    {
        id: 'post-conflict-recovery',
        skill: 'Me recupero rápido tras conflicto',
        meaning: 'Volver a línea base y retomar foco sin rumiación.',
        examples: ['Después del choque, hice caminata 5 min y envié reparación.', 'Volví a línea base y retomé el tema sin rumiación.']
    },
    {
        id: 'feedback-openness',
        skill: 'Pido feedback sin defensividad',
        meaning: 'Solicitar y recibir retroalimentación sin justificarte.',
        examples: ['Pedí feedback al equipo y respondí “gracias, lo ajusto” sin justificar.', 'Tomé 1 punto crítico y definí acción.']
    },
    {
        id: 'energy-sustainability',
        skill: 'Sostengo energía y descanso',
        meaning: 'Cuidar sueño/recuperación para no reaccionar por fatiga.',
        examples: ['Dormí 7h promedio; hice 2 pausas diarias.', 'Ejercicio 3× semana; sin pantalla 30 min antes de dormir.']
    }
] as const

const MICRO_HABIT_OPTIONS: Array<{
    id: MicroHabitId
    code: 'A' | 'B' | 'C' | 'D' | 'E'
    title: string
    detail: string
    category: 'Tiempo real' | 'Recuperación/Relación' | 'Mantenimiento'
}> = [
    {
        id: 'habit-a',
        code: 'A',
        title: 'Bitácora 3 líneas (cierre del día)',
        detail: 'Evento (qué pasó) + Emoción (0–10) + Aprendizaje (1 línea).',
        category: 'Mantenimiento'
    },
    {
        id: 'habit-b',
        code: 'B',
        title: 'Ancla (3 repeticiones al día)',
        detail: '3 activaciones del gesto + palabra + exhalación (aunque no estés estresado).',
        category: 'Tiempo real'
    },
    {
        id: 'habit-c',
        code: 'C',
        title: 'Pausa intencional (2 micro-pausas antes de reuniones)',
        detail: 'Antes de 2 reuniones: 10–20s de STOP o ancla.',
        category: 'Tiempo real'
    },
    {
        id: 'habit-d',
        code: 'D',
        title: 'Chequeo corporal (30 segundos)',
        detail: 'Mandíbula/hombros/respiración: nombra 1 señal y ajusta con exhalación.',
        category: 'Mantenimiento'
    },
    {
        id: 'habit-e',
        code: 'E',
        title: 'Reparación (si hubo tensión)',
        detail: '1 mensaje o conversación: hecho + impacto + reparación + pedido.',
        category: 'Recuperación/Relación'
    }
]

const MICRO_HABIT_DURATION_OPTIONS: MicroHabitDuration[] = ['', '30s', '2min', '5min', '10min']

const PDI_COMPETENCY_OPTIONS: Exclude<PdiCompetency, ''>[] = ['Autoconciencia', 'Regulación', 'Energía', 'Somática']
const PDI_ACTION_FREQUENCY_OPTIONS: PdiActionFrequency[] = ['', 'Diario', '3× sem', 'Semanal', 'Por evento']
const PDI_ACTION_DURATION_OPTIONS: PdiActionDuration[] = ['', '10s', '30s', '2min', '5min', '10min']

const MENTOR_EVALUATION_CRITERIA = [
    'Reconocimiento de detonantes emocionales',
    'Manejo de presión sin reactividad visible',
    'Regulación del tono y lenguaje corporal',
    'Recuperación después de conflictos',
    'Integración de prácticas de regulación'
] as const

const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']

const MENTOR_LEVEL_REFERENCE = [
    { level: 'Nivel 1 - Declarativo', descriptor: 'Niega o minimiza detonantes; reactividad frecuente.' },
    { level: 'Nivel 2 - Consciente', descriptor: 'Reconoce detonantes después del evento; control parcial.' },
    { level: 'Nivel 3 - Integrado', descriptor: 'Identifica detonantes en tiempo real; regula con consistencia.' },
    { level: 'Nivel 4 - Alineación Estratégica', descriptor: 'Anticipa detonantes y regula con serenidad incluso en crisis.' }
] as const

const LEADER_EVALUATION_QUESTIONS = [
    '¿Qué emoción domina mis momentos de presión?',
    '¿Cómo reaccioné ante el último conflicto relevante?',
    '¿Qué detonante emocional se repite con mayor frecuencia?',
    '¿Qué técnica concreta de regulación aplico en tiempo real?',
    '¿Cómo impacta mi estado emocional en la energía del equipo?'
] as const

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - iShine' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const JUDGEMENT_WORDS = ['injusto', 'irrespetuoso', 'terrible', 'fatal', 'horrible', 'culpa', 'siempre', 'nunca']
const DURATION_OPTIONS: Array<IfThenRule['duration']> = ['10s', '30s', '2min', '5min']

const STORAGE_KEY = 'workbooks-v2-wb2-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb2-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb2-visited'

function createDefaultBitacoraEvent(index: number): BitacoraEvent {
    return {
        id: `evento-${index + 1}`,
        date: '',
        situation: '',
        actor: '',
        emotion: '',
        bodySignal: '',
        response: '',
        impact: '',
        trigger: '',
        triggerNote: ''
    }
}

function createDefaultTriggerAnnotations(): Record<TriggerId, TriggerSummaryAnnotation> {
    return TRIGGER_OPTIONS.reduce((acc, option) => {
        acc[option.id] = { responseTypical: '', costTypical: '' }
        return acc
    }, {} as Record<TriggerId, TriggerSummaryAnnotation>)
}

function createDefaultSkillsGapData(): SkillsGapData {
    return {
        roleIdeal: '',
        rows: SKILLS_GAP_DEFINITIONS.map((definition) => ({
            id: definition.id,
            skill: definition.skill,
            current: 0,
            ideal: 0,
            evidence: ''
        })),
        strongest: '',
        weakest: '',
        weeklyMinimum: ''
    }
}

function createDefaultSkillsPriorityData(): SkillsPriorityData {
    return {
        rows: SKILLS_GAP_DEFINITIONS.map((definition) => ({
            id: definition.id,
            skill: definition.skill,
            importance: 0,
            current: 0,
            selected: false
        })),
        priorityOne: '',
        priorityTwo: '',
        priorityThree: '',
        skipForNow: ''
    }
}

function createDefaultMicroHabitsData(): MicroHabitsData {
    return {
        selectedHabitIds: [],
        definitions: MICRO_HABIT_OPTIONS.map((option) => ({
            habitId: option.id,
            when: '',
            duration: '',
            evidenceFormat: ''
        })),
        tracker: Array.from({ length: 30 }, (_, index) => ({
            day: index + 1,
            checks: [false, false, false],
            evidence: ''
        })),
        weeklyReviews: [
            { week: 1, consistency: '', mainTrigger: '', adjustment: '' },
            { week: 2, consistency: '', mainTrigger: '', adjustment: '' },
            { week: 3, consistency: '', mainTrigger: '', adjustment: '' },
            { week: 4, consistency: '', mainTrigger: '', adjustment: '' }
        ]
    }
}

function createDefaultPdiData(): PdiData {
    return {
        objective: '',
        primaryCompetency: '',
        secondaryCompetency: '',
        indicators: [
            { id: 'pdi-indicator-1', value: '' },
            { id: 'pdi-indicator-2', value: '' },
            { id: 'pdi-indicator-3', value: '' }
        ],
        actions: [
            { id: 'pdi-action-1', action: '', frequency: '', duration: '', evidence: '' },
            { id: 'pdi-action-2', action: '', frequency: '', duration: '', evidence: '' },
            { id: 'pdi-action-3', action: '', frequency: '', duration: '', evidence: '' }
        ],
        supports: {
            supportPerson: '',
            criticalContext: '',
            likelyBarrier: '',
            contingencyPlan: ''
        },
        weeklyReviews: [
            { week: 1, trigger: '', technique: '', adjustment: '' },
            { week: 2, trigger: '', technique: '', adjustment: '' },
            { week: 3, trigger: '', technique: '', adjustment: '' },
            { week: 4, trigger: '', technique: '', adjustment: '' }
        ]
    }
}

function createDefaultEvaluationData(): EvaluationData {
    return {
        mentorRows: MENTOR_EVALUATION_CRITERIA.map((criterion) => ({
            criterion,
            level: '',
            evidence: '',
            decision: ''
        })),
        mentorGeneralNotes: '',
        mentorGlobalDecision: '',
        leaderRows: LEADER_EVALUATION_QUESTIONS.map((question) => ({
            question,
            response: '',
            evidence: '',
            action: ''
        })),
        agreementsSynthesis: ''
    }
}

function createDefaultState(): WB2State {
    return {
        identification: {
            leaderName: '',
            role: '',
            cohort: '',
            startDate: ''
        },
        bitacora: Array.from({ length: 7 }, (_, index) => createDefaultBitacoraEvent(index)),
        triggerAnnotations: createDefaultTriggerAnnotations(),
        priorityTrigger: '',
        priorityCard: {
            earlySignal: '',
            typicalEmotion: '',
            typicalResponse: '',
            typicalCost: ''
        },
        narrative: {
            eventId: '',
            context: '',
            interpretation: '',
            impulse: '',
            realBehavior: '',
            costRepeat: '',
            learning: '',
            alternativeResponse: '',
            miniABC: ''
        },
        anchor: {
            gesture: '',
            gesturePreset: '',
            keyword: '',
            earlySignal: '',
            earlySignalPreset: '',
            useContext: '',
            protectedBehavior: '',
            rule1Seconds: '',
            rule3Question: '',
            beforeIntensity: '',
            afterIntensity: '',
            cycles: Array.from({ length: 5 }, () => false)
        },
        regulation: {
            layers: {
                realtime: { techniques: [], whenToUse: '', signal: '' },
                recovery: { techniques: [], whenToUse: '', signal: '' },
                maintenance: { techniques: [], whenToUse: '', signal: '' }
            },
            ifThenRules: Array.from({ length: 3 }, () => ({ signal: '', technique: '', duration: '' })),
            repair: { fact: '', impact: '', repair: '', request: '' },
            referenceAlternative: ''
        },
        skillsGap: createDefaultSkillsGapData(),
        skillsPriority: createDefaultSkillsPriorityData(),
        microHabits: createDefaultMicroHabitsData(),
        pdi: createDefaultPdiData(),
        evaluation: createDefaultEvaluationData()
    }
}

function clampPage(value: number) {
    return Math.max(1, Math.min(PAGES.length, value))
}

function toSkillRating(value: unknown): SkillRating {
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : 0
}

function calculateSkillGap(importance: SkillRating, current: SkillRating) {
    if (importance === 0 || current === 0) return 0
    return Math.max(0, importance - current)
}

function calculateGapPriority(importance: SkillRating, current: SkillRating): GapPriority {
    const gap = calculateSkillGap(importance, current)
    if (importance >= 4 && gap >= 2) return 'Alta'
    if (importance >= 3 && gap === 2) return 'Media'
    if (gap >= 3) return 'Media'
    return 'Baja'
}

function findOptionLabel(options: ReadonlyArray<{ value: string; label: string }>, value: string) {
    return options.find((option) => option.value === value)?.label || ''
}

function inferPresetFromText(
    text: string,
    options: ReadonlyArray<{ value: string; label: string }>
): AnchorPresetOption | '' {
    const normalizedText = text.trim().toLowerCase()
    if (!normalizedText) return ''

    const match = options.find((option) => option.value !== 'other' && option.label.toLowerCase() === normalizedText)
    return match ? (match.value as AnchorPresetOption) : 'other'
}

function normalizeState(candidate: unknown): WB2State {
    const fallback = createDefaultState()
    if (!candidate || typeof candidate !== 'object') return fallback

    const raw = candidate as Partial<WB2State>

    const normalizedBitacora = Array.from({ length: 7 }, (_, index) => {
        const defaultEvent = createDefaultBitacoraEvent(index)
        const current = Array.isArray(raw.bitacora) && raw.bitacora[index] ? raw.bitacora[index] : defaultEvent
        return {
            ...defaultEvent,
            ...current,
            trigger: TRIGGER_OPTIONS.some((option) => option.id === current.trigger) ? current.trigger : '',
            triggerNote: typeof current.triggerNote === 'string' ? current.triggerNote : ''
        }
    })

    const defaultAnnotations = createDefaultTriggerAnnotations()
    const normalizedAnnotations = TRIGGER_OPTIONS.reduce((acc, option) => {
        const current = raw.triggerAnnotations?.[option.id]
        acc[option.id] = {
            responseTypical: typeof current?.responseTypical === 'string' ? current.responseTypical : '',
            costTypical: typeof current?.costTypical === 'string' ? current.costTypical : ''
        }
        return acc
    }, defaultAnnotations)

    const defaultSkillsGap = createDefaultSkillsGapData()
    const normalizedSkillsRows = defaultSkillsGap.rows.map((defaultRow, index) => {
        const current = Array.isArray(raw.skillsGap?.rows) ? raw.skillsGap?.rows[index] : null

        return {
            ...defaultRow,
            current: toSkillRating(current?.current),
            ideal: toSkillRating(current?.ideal),
            evidence: typeof current?.evidence === 'string' ? current.evidence : ''
        }
    })

    const defaultSkillsPriority = createDefaultSkillsPriorityData()
    const normalizedPriorityRows = defaultSkillsPriority.rows.map((defaultRow, index) => {
        const current = Array.isArray(raw.skillsPriority?.rows) ? raw.skillsPriority?.rows[index] : null
        const normalizedCurrent = toSkillRating(current?.current)
        const linkedCurrent = normalizedSkillsRows[index]?.current ?? 0

        return {
            ...defaultRow,
            importance: toSkillRating(current?.importance),
            current: normalizedCurrent > 0 ? normalizedCurrent : linkedCurrent,
            selected: !!current?.selected
        }
    })

    const defaultMicroHabits = createDefaultMicroHabitsData()
    const normalizedSelectedHabits = Array.isArray(raw.microHabits?.selectedHabitIds)
        ? (raw.microHabits?.selectedHabitIds.filter((id): id is MicroHabitId => MICRO_HABIT_OPTIONS.some((option) => option.id === id)).slice(0, 3) || [])
        : []

    const normalizedDefinitions = defaultMicroHabits.definitions.map((defaultDefinition) => {
        const current = Array.isArray(raw.microHabits?.definitions)
            ? raw.microHabits?.definitions.find((item) => item?.habitId === defaultDefinition.habitId)
            : null

        const safeDuration = MICRO_HABIT_DURATION_OPTIONS.includes(current?.duration as MicroHabitDuration)
            ? (current?.duration as MicroHabitDuration)
            : ''

        return {
            ...defaultDefinition,
            when: typeof current?.when === 'string' ? current.when : '',
            duration: safeDuration,
            evidenceFormat: typeof current?.evidenceFormat === 'string' ? current.evidenceFormat : ''
        }
    })

    const normalizedTracker = defaultMicroHabits.tracker.map((defaultDay, index) => {
        const current = Array.isArray(raw.microHabits?.tracker) ? raw.microHabits?.tracker[index] : null
        const checks = Array.isArray(current?.checks)
            ? [
                !!current?.checks[0],
                !!current?.checks[1],
                !!current?.checks[2]
            ] as [boolean, boolean, boolean]
            : [false, false, false] as [boolean, boolean, boolean]

        return {
            ...defaultDay,
            checks,
            evidence: typeof current?.evidence === 'string' ? current.evidence : ''
        }
    })

    const normalizedWeeklyReviews = defaultMicroHabits.weeklyReviews.map((defaultWeek, index) => {
        const current = Array.isArray(raw.microHabits?.weeklyReviews) ? raw.microHabits?.weeklyReviews[index] : null
        return {
            ...defaultWeek,
            consistency: typeof current?.consistency === 'string' ? current.consistency : '',
            mainTrigger: typeof current?.mainTrigger === 'string' ? current.mainTrigger : '',
            adjustment: typeof current?.adjustment === 'string' ? current.adjustment : ''
        }
    })

    const defaultPdi = createDefaultPdiData()
    const normalizedPdiIndicators = defaultPdi.indicators.map((defaultIndicator, index) => {
        const current = Array.isArray(raw.pdi?.indicators) ? raw.pdi?.indicators[index] : null
        return {
            ...defaultIndicator,
            value: typeof current?.value === 'string' ? current.value : ''
        }
    })

    const sourcePdiActions = Array.isArray(raw.pdi?.actions) ? raw.pdi.actions.slice(0, 5) : []
    const normalizedPdiActions = (sourcePdiActions.length >= 3 ? sourcePdiActions : defaultPdi.actions).map((row, index) => {
        const fallback = defaultPdi.actions[index] || { id: `pdi-action-${index + 1}`, action: '', frequency: '', duration: '', evidence: '' }
        const safeFrequency = PDI_ACTION_FREQUENCY_OPTIONS.includes(row?.frequency as PdiActionFrequency)
            ? (row?.frequency as PdiActionFrequency)
            : ''
        const safeDuration = PDI_ACTION_DURATION_OPTIONS.includes(row?.duration as PdiActionDuration)
            ? (row?.duration as PdiActionDuration)
            : ''
        return {
            id: typeof row?.id === 'string' && row.id.trim().length > 0 ? row.id : fallback.id,
            action: typeof row?.action === 'string' ? row.action : '',
            frequency: safeFrequency,
            duration: safeDuration,
            evidence: typeof row?.evidence === 'string' ? row.evidence : ''
        }
    })

    const normalizedPdiWeeklyReviews = defaultPdi.weeklyReviews.map((defaultWeek, index) => {
        const current = Array.isArray(raw.pdi?.weeklyReviews) ? raw.pdi?.weeklyReviews[index] : null
        return {
            ...defaultWeek,
            trigger: typeof current?.trigger === 'string' ? current.trigger : '',
            technique: typeof current?.technique === 'string' ? current.technique : '',
            adjustment: typeof current?.adjustment === 'string' ? current.adjustment : ''
        }
    })

    const defaultEvaluation = createDefaultEvaluationData()
    const normalizedMentorRows: MentorEvaluationRow[] = defaultEvaluation.mentorRows.map((defaultRow, index) => {
        const current = Array.isArray(raw.evaluation?.mentorRows) ? raw.evaluation?.mentorRows[index] : null
        const safeLevel: MentorLevel =
            current?.level === 'N1' || current?.level === 'N2' || current?.level === 'N3' || current?.level === 'N4'
                ? current.level
                : ''
        const safeDecision: MentorDecision =
            current?.decision === 'Consolidado' || current?.decision === 'En desarrollo' || current?.decision === 'Prioritario'
                ? current.decision
                : ''
        return {
            criterion: defaultRow.criterion,
            level: safeLevel,
            evidence: typeof current?.evidence === 'string' ? current.evidence : '',
            decision: safeDecision
        }
    })

    const normalizedLeaderRows = defaultEvaluation.leaderRows.map((defaultRow, index) => {
        const current = Array.isArray(raw.evaluation?.leaderRows) ? raw.evaluation?.leaderRows[index] : null
        return {
            question: defaultRow.question,
            response: typeof current?.response === 'string' ? current.response : '',
            evidence: typeof current?.evidence === 'string' ? current.evidence : '',
            action: typeof current?.action === 'string' ? current.action : ''
        }
    })

    return {
        identification: {
            leaderName: raw.identification?.leaderName || '',
            role: raw.identification?.role || '',
            cohort: raw.identification?.cohort || '',
            startDate: raw.identification?.startDate || ''
        },
        bitacora: normalizedBitacora,
        triggerAnnotations: normalizedAnnotations,
        priorityTrigger: TRIGGER_OPTIONS.some((option) => option.id === raw.priorityTrigger) ? (raw.priorityTrigger as TriggerId) : '',
        priorityCard: {
            earlySignal: raw.priorityCard?.earlySignal || '',
            typicalEmotion: raw.priorityCard?.typicalEmotion || '',
            typicalResponse: raw.priorityCard?.typicalResponse || '',
            typicalCost: raw.priorityCard?.typicalCost || ''
        },
        narrative: {
            eventId: raw.narrative?.eventId || '',
            context: raw.narrative?.context || '',
            interpretation: raw.narrative?.interpretation || '',
            impulse: raw.narrative?.impulse || '',
            realBehavior: raw.narrative?.realBehavior || '',
            costRepeat: raw.narrative?.costRepeat || '',
            learning: raw.narrative?.learning || '',
            alternativeResponse: raw.narrative?.alternativeResponse || '',
            miniABC: raw.narrative?.miniABC || ''
        },
        anchor: {
            gesture: raw.anchor?.gesture || '',
            gesturePreset:
                typeof raw.anchor?.gesturePreset === 'string' && GESTURE_OPTIONS.some((option) => option.value === raw.anchor?.gesturePreset)
                    ? raw.anchor.gesturePreset
                    : inferPresetFromText(raw.anchor?.gesture || '', GESTURE_OPTIONS),
            keyword: raw.anchor?.keyword || '',
            earlySignal: raw.anchor?.earlySignal || '',
            earlySignalPreset:
                typeof raw.anchor?.earlySignalPreset === 'string' && EARLY_SIGNAL_OPTIONS.some((option) => option.value === raw.anchor?.earlySignalPreset)
                    ? raw.anchor.earlySignalPreset
                    : inferPresetFromText(raw.anchor?.earlySignal || '', EARLY_SIGNAL_OPTIONS),
            useContext: raw.anchor?.useContext || '',
            protectedBehavior: raw.anchor?.protectedBehavior || '',
            rule1Seconds: raw.anchor?.rule1Seconds || '',
            rule3Question: raw.anchor?.rule3Question || '',
            beforeIntensity: raw.anchor?.beforeIntensity || '',
            afterIntensity: raw.anchor?.afterIntensity || '',
            cycles: Array.from({ length: 5 }, (_, index) => (Array.isArray(raw.anchor?.cycles) ? !!raw.anchor?.cycles[index] : false))
        },
        regulation: {
            layers: {
                realtime: {
                    techniques: Array.isArray(raw.regulation?.layers?.realtime?.techniques) ? raw.regulation?.layers?.realtime?.techniques : [],
                    whenToUse: raw.regulation?.layers?.realtime?.whenToUse || '',
                    signal: raw.regulation?.layers?.realtime?.signal || ''
                },
                recovery: {
                    techniques: Array.isArray(raw.regulation?.layers?.recovery?.techniques) ? raw.regulation?.layers?.recovery?.techniques : [],
                    whenToUse: raw.regulation?.layers?.recovery?.whenToUse || '',
                    signal: raw.regulation?.layers?.recovery?.signal || ''
                },
                maintenance: {
                    techniques: Array.isArray(raw.regulation?.layers?.maintenance?.techniques) ? raw.regulation?.layers?.maintenance?.techniques : [],
                    whenToUse: raw.regulation?.layers?.maintenance?.whenToUse || '',
                    signal: raw.regulation?.layers?.maintenance?.signal || ''
                }
            },
            ifThenRules: Array.from({ length: 3 }, (_, index) => {
                const current = Array.isArray(raw.regulation?.ifThenRules) ? raw.regulation.ifThenRules[index] : null
                return {
                    signal: current?.signal || '',
                    technique: current?.technique || '',
                    duration: current?.duration === '10s' || current?.duration === '30s' || current?.duration === '2min' || current?.duration === '5min'
                        ? current.duration
                        : ''
                }
            }),
            repair: {
                fact: raw.regulation?.repair?.fact || '',
                impact: raw.regulation?.repair?.impact || '',
                repair: raw.regulation?.repair?.repair || '',
                request: raw.regulation?.repair?.request || ''
            },
            referenceAlternative: raw.regulation?.referenceAlternative || ''
        },
        skillsGap: {
            roleIdeal: raw.skillsGap?.roleIdeal || '',
            rows: normalizedSkillsRows,
            strongest: raw.skillsGap?.strongest || '',
            weakest: raw.skillsGap?.weakest || '',
            weeklyMinimum: raw.skillsGap?.weeklyMinimum || ''
        },
        skillsPriority: {
            rows: normalizedPriorityRows,
            priorityOne: raw.skillsPriority?.priorityOne || '',
            priorityTwo: raw.skillsPriority?.priorityTwo || '',
            priorityThree: raw.skillsPriority?.priorityThree || '',
            skipForNow: raw.skillsPriority?.skipForNow || ''
        },
        microHabits: {
            selectedHabitIds: normalizedSelectedHabits,
            definitions: normalizedDefinitions,
            tracker: normalizedTracker,
            weeklyReviews: normalizedWeeklyReviews
        },
        pdi: {
            objective: raw.pdi?.objective || '',
            primaryCompetency:
                raw.pdi?.primaryCompetency &&
                PDI_COMPETENCY_OPTIONS.includes(raw.pdi.primaryCompetency as Exclude<PdiCompetency, ''>)
                    ? (raw.pdi.primaryCompetency as Exclude<PdiCompetency, ''>)
                    : '',
            secondaryCompetency: raw.pdi?.secondaryCompetency || '',
            indicators: normalizedPdiIndicators,
            actions: normalizedPdiActions,
            supports: {
                supportPerson: raw.pdi?.supports?.supportPerson || '',
                criticalContext: raw.pdi?.supports?.criticalContext || '',
                likelyBarrier: raw.pdi?.supports?.likelyBarrier || '',
                contingencyPlan: raw.pdi?.supports?.contingencyPlan || ''
            },
            weeklyReviews: normalizedPdiWeeklyReviews
        },
        evaluation: {
            mentorRows: normalizedMentorRows,
            mentorGeneralNotes: raw.evaluation?.mentorGeneralNotes || '',
            mentorGlobalDecision:
                raw.evaluation?.mentorGlobalDecision === 'Consolidado' ||
                raw.evaluation?.mentorGlobalDecision === 'En desarrollo' ||
                raw.evaluation?.mentorGlobalDecision === 'Prioritario'
                    ? raw.evaluation.mentorGlobalDecision
                    : '',
            leaderRows: normalizedLeaderRows,
            agreementsSynthesis: raw.evaluation?.agreementsSynthesis || ''
        }
    }
}

function isBitacoraEventComplete(event: BitacoraEvent) {
    return (
        event.date.trim().length > 0 &&
        event.situation.trim().length > 0 &&
        event.actor.trim().length > 0 &&
        event.emotion.trim().length > 0 &&
        event.bodySignal.trim().length > 0 &&
        event.response.trim().length > 0 &&
        event.impact.trim().length > 0
    )
}

function hasJudgementWords(text: string) {
    const normalized = text.toLowerCase()
    return JUDGEMENT_WORDS.some((word) => normalized.includes(word))
}

function parseEmotionValue(raw: string) {
    const numeric = Number(raw)
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.min(10, numeric))
}

function deriveSkillsClosure(rows: SkillsGapRow[]) {
    const candidates = rows
        .filter((row) => row.current > 0 && row.ideal > 0)
        .map((row) => ({ ...row, gap: Math.max(0, row.ideal - row.current) }))

    if (candidates.length === 0) {
        return { strongest: '', weakest: '' }
    }

    const strongestSorted = [...candidates].sort((a, b) => {
        if (b.current !== a.current) return b.current - a.current
        if (a.gap !== b.gap) return a.gap - b.gap
        return a.skill.localeCompare(b.skill, 'es')
    })

    const weakestSorted = [...candidates].sort((a, b) => {
        if (b.gap !== a.gap) return b.gap - a.gap
        if (a.current !== b.current) return a.current - b.current
        return a.skill.localeCompare(b.skill, 'es')
    })

    const strongest = strongestSorted[0]?.skill || ''
    let weakest = weakestSorted[0]?.skill || ''

    if (weakest === strongest && weakestSorted.length > 1) {
        const alternative = weakestSorted.find((item) => item.skill !== strongest)
        if (alternative) weakest = alternative.skill
    }

    return { strongest, weakest }
}

function getMicroHabitOption(habitId: MicroHabitId) {
    return MICRO_HABIT_OPTIONS.find((option) => option.id === habitId) || null
}

function getMicroHabitShortLabel(habitId: MicroHabitId) {
    const option = getMicroHabitOption(habitId)
    return option ? `${option.code}. ${option.title}` : habitId
}

function getTrackerWeekRange(week: number) {
    if (week === 1) return { start: 1, end: 7 }
    if (week === 2) return { start: 8, end: 14 }
    if (week === 3) return { start: 15, end: 21 }
    if (week === 4) return { start: 22, end: 28 }
    return { start: 29, end: 30 }
}

function inferPdiActionLayer(action: string) {
    const value = action.toLowerCase()
    const realtimeKeywords = ['stop', 'ancla', 'pausa', 'pregunta antes', 'respirar', 'tiempo real']
    const maintenanceKeywords = ['journaling', 'bitácora', 'sueño', 'descanso', 'ejercicio', 'pausas', 'mantenimiento']

    if (realtimeKeywords.some((keyword) => value.includes(keyword))) return 'realtime'
    if (maintenanceKeywords.some((keyword) => value.includes(keyword))) return 'maintenance'
    return ''
}

function isMentorEvaluationRowComplete(row: MentorEvaluationRow) {
    return row.level !== '' && row.decision !== '' && row.evidence.trim().length > 0
}

function isLeaderEvaluationRowComplete(row: LeaderEvaluationRow) {
    return row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0
}

function buildPdiActionFromGap(skill: string) {
    const normalized = skill.toLowerCase()
    if (normalized.includes('detonantes')) {
        return 'En reuniones sensibles, nombro mi señal corporal y el detonante antes de responder.'
    }
    if (normalized.includes('tono') || normalized.includes('corporalidad')) {
        return 'Cuando haya tensión, pauso 2 segundos, bajo el tono y hago 1 pregunta antes de decidir.'
    }
    if (normalized.includes('calma bajo presión')) {
        return 'En crisis, aplico STOP + priorizo 3 puntos antes de responder al equipo.'
    }
    if (normalized.includes('recupero rápido')) {
        return 'Después de un conflicto, hago recuperación de 5 minutos y registro 1 aprendizaje.'
    }
    if (normalized.includes('feedback')) {
        return 'Pido 1 feedback concreto por semana y respondo sin justificarme.'
    }
    if (normalized.includes('energía') || normalized.includes('descanso')) {
        return 'Sostengo higiene de descanso y 2 pausas diarias para prevenir reactividad.'
    }
    return `Practico esta habilidad en contexto real: ${skill}.`
}

function buildPdiActionFromMicroHabit(habitId: MicroHabitId) {
    if (habitId === 'habit-a') return 'Bitácora diaria 3 líneas (evento-emoción-aprendizaje) al cierre del día.'
    if (habitId === 'habit-b') return 'Activo ancla 3 veces al día (gesto + palabra + exhalación).'
    if (habitId === 'habit-c') return 'Antes de 2 reuniones diarias, hago pausa intencional de 10–20 segundos.'
    if (habitId === 'habit-d') return 'Hago chequeo corporal breve (mandíbula/hombros/respiración) y exhalo para regular.'
    return 'Si hubo tensión, realizo reparación breve en menos de 24 horas.'
}

export function WB2Digital() {
    const [activePage, setActivePage] = useState(1)
    const [isLocked, setIsLocked] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [state, setState] = useState<WB2State>(createDefaultState)
    const [bitacoraEditModes, setBitacoraEditModes] = useState<boolean[]>(Array.from({ length: 7 }, () => false))
    const [showBitacoraExample, setShowBitacoraExample] = useState(false)
    const [showMatrixExample, setShowMatrixExample] = useState(false)
    const [showNarrativeExample, setShowNarrativeExample] = useState(false)
    const [showAnchorTestExample, setShowAnchorTestExample] = useState(false)
    const [showAnchorRulesExample, setShowAnchorRulesExample] = useState(false)
    const [regulationWarning, setRegulationWarning] = useState('')
    const [showRoleIdealHelp, setShowRoleIdealHelp] = useState(false)
    const [showSkillsClosureHelp, setShowSkillsClosureHelp] = useState(false)
    const [showGapImportanceHelp, setShowGapImportanceHelp] = useState(false)
    const [skillsPriorityWarning, setSkillsPriorityWarning] = useState('')
    const [showMicroHabitsStep2Help, setShowMicroHabitsStep2Help] = useState(false)
    const [showMicroHabitsStep3Help, setShowMicroHabitsStep3Help] = useState(false)
    const [showMicroHabitsStep4Help, setShowMicroHabitsStep4Help] = useState(false)
    const [microHabitsSelectionWarning, setMicroHabitsSelectionWarning] = useState('')
    const [trackerWeekToSave, setTrackerWeekToSave] = useState<1 | 2 | 3 | 4 | 5>(1)
    const [pdiStep, setPdiStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
    const [showPdiObjectiveHelp, setShowPdiObjectiveHelp] = useState(false)
    const [showPdiIndicatorsHelp, setShowPdiIndicatorsHelp] = useState(false)
    const [showPdiActionsHelp, setShowPdiActionsHelp] = useState(false)
    const [showPdiSupportsHelp, setShowPdiSupportsHelp] = useState(false)
    const [showPdiWeeklyHelp, setShowPdiWeeklyHelp] = useState(false)
    const [pdiWarning, setPdiWarning] = useState('')
    const [showEvaluationLevelReference, setShowEvaluationLevelReference] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [mentorEvaluationEditModes, setMentorEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: MENTOR_EVALUATION_CRITERIA.length }, () => false)
    )
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: LEADER_EVALUATION_QUESTIONS.length }, () => false)
    )
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')
    const saveFeedbackTimeoutRef = useRef<number | null>(null)

    const announceSave = (message: string) => {
        setSaveFeedback(message)
        if (typeof window === 'undefined') return
        if (saveFeedbackTimeoutRef.current) {
            window.clearTimeout(saveFeedbackTimeoutRef.current)
        }
        saveFeedbackTimeoutRef.current = window.setTimeout(() => {
            setSaveFeedback('')
            saveFeedbackTimeoutRef.current = null
        }, 2600)
    }

    useEffect(() => {
        if (typeof window === 'undefined') return

        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                setState(normalizeState(JSON.parse(stored)))
            } catch {
                setState(createDefaultState())
            }
        }

        const hasVisited = window.localStorage.getItem(VISITED_STORAGE_KEY) === '1'
        if (hasVisited) {
            const storedPage = Number(window.localStorage.getItem(PAGE_STORAGE_KEY) || '1')
            setActivePage(clampPage(storedPage))
        }
        window.localStorage.setItem(VISITED_STORAGE_KEY, '1')
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, [state])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(PAGE_STORAGE_KEY, String(activePage))
    }, [activePage])

    useEffect(() => {
        if (typeof window === 'undefined') return
        document.documentElement.classList.remove('dark')
        window.localStorage.setItem('theme', 'light')
    }, [])

    useEffect(() => {
        return () => {
            if (saveFeedbackTimeoutRef.current && typeof window !== 'undefined') {
                window.clearTimeout(saveFeedbackTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        setState((prev) => {
            let changed = false
            const nextRows = prev.skillsPriority.rows.map((row, index) => {
                const linkedCurrent = prev.skillsGap.rows[index]?.current ?? 0
                if (linkedCurrent > 0 && row.current !== linkedCurrent) {
                    changed = true
                    return { ...row, current: linkedCurrent }
                }
                return row
            })

            if (!changed) return prev
            return {
                ...prev,
                skillsPriority: {
                    ...prev.skillsPriority,
                    rows: nextRows
                }
            }
        })
    }, [state.skillsGap.rows])

    const completion = useMemo(() => {
        const idComplete = Object.values(state.identification).every((value) => value.trim().length > 0)
        const bitacoraComplete = state.bitacora.filter((event) => isBitacoraEventComplete(event)).length >= 7
        const classificationComplete = state.bitacora.filter((event) => event.trigger !== '').length >= 7
        const priorityComplete =
            state.priorityTrigger !== '' &&
            state.priorityCard.earlySignal.trim().length > 0 &&
            state.priorityCard.typicalEmotion.trim().length > 0 &&
            state.priorityCard.typicalResponse.trim().length > 0 &&
            state.priorityCard.typicalCost.trim().length > 0

        const narrativeComplete =
            state.narrative.eventId.trim().length > 0 &&
            state.narrative.interpretation.trim().length > 0 &&
            state.narrative.alternativeResponse.trim().length > 0

        const anchorComplete =
            state.anchor.gesture.trim().length > 0 &&
            state.anchor.keyword.trim().length > 0 &&
            state.anchor.earlySignal.trim().length > 0 &&
            state.anchor.useContext.trim().length > 0 &&
            state.anchor.protectedBehavior.trim().length > 0 &&
            state.anchor.rule1Seconds.trim().length > 0 &&
            state.anchor.rule3Question.trim().length > 0

        const layersComplete = (Object.keys(state.regulation.layers) as LayerKey[]).every((layerKey) => {
            const layer = state.regulation.layers[layerKey]
            return layer.techniques.length === 2 && layer.whenToUse.trim().length > 0 && layer.signal.trim().length > 0
        })

        const ifThenComplete = state.regulation.ifThenRules.some(
            (rule) => rule.signal.trim().length > 0 && rule.technique.trim().length > 0 && rule.duration !== ''
        )

        const regulationComplete = layersComplete && ifThenComplete

        const skillsRowsCompletedForProgress = state.skillsGap.rows.filter(
            (row) => row.current > 0 && row.ideal > 0 && row.evidence.trim().length > 0
        ).length
        const skillsSectionCompleteForProgress = state.skillsGap.roleIdeal.trim().length > 0 && skillsRowsCompletedForProgress >= 4

        const skillsPriorityCompleteForProgress =
            state.skillsPriority.rows.every((row) => row.importance > 0) &&
            state.skillsPriority.rows.filter((row) => row.selected).length === 3

        const microHabitsSelectionCompleteForProgress = state.microHabits.selectedHabitIds.length === 3
        const microHabitsDefinitionsCompleteForProgress =
            microHabitsSelectionCompleteForProgress &&
            state.microHabits.selectedHabitIds.every((habitId) => {
                const definition = state.microHabits.definitions.find((item) => item.habitId === habitId)
                return !!definition && definition.when.trim().length > 0 && definition.duration !== '' && definition.evidenceFormat.trim().length > 0
            })
        const microHabitsTrackedDaysForProgress = state.microHabits.tracker.filter((day) => day.evidence.trim().length > 0).length
        const microHabitsCompleteForProgress =
            microHabitsSelectionCompleteForProgress &&
            microHabitsDefinitionsCompleteForProgress &&
            microHabitsTrackedDaysForProgress >= 7

        const pdiIndicatorsCompleteForProgress = state.pdi.indicators.every((indicator) => indicator.value.trim().length > 0)
        const pdiActionsCompleteForProgress =
            state.pdi.actions.length >= 3 &&
            state.pdi.actions.every(
                (action) =>
                    action.action.trim().length > 0 &&
                    action.frequency !== '' &&
                    action.duration !== '' &&
                    action.evidence.trim().length > 0
            )
        const pdiWeek1 = state.pdi.weeklyReviews.find((week) => week.week === 1)
        const pdiWeeklyCompleteForProgress =
            !!pdiWeek1 &&
            pdiWeek1.trigger.trim().length > 0 &&
            pdiWeek1.technique.trim().length > 0 &&
            pdiWeek1.adjustment.trim().length > 0
        const pdiCompleteForProgress =
            state.pdi.objective.trim().length > 0 &&
            pdiIndicatorsCompleteForProgress &&
            pdiActionsCompleteForProgress &&
            pdiWeeklyCompleteForProgress

        const mentorRowsCompleteForProgress = state.evaluation.mentorRows.every((row) => isMentorEvaluationRowComplete(row))
        const leaderRowsCompleteForProgress = state.evaluation.leaderRows.every((row) => isLeaderEvaluationRowComplete(row))
        const evaluationCompleteForProgress =
            mentorRowsCompleteForProgress &&
            state.evaluation.mentorGeneralNotes.trim().length > 0 &&
            state.evaluation.mentorGlobalDecision !== '' &&
            leaderRowsCompleteForProgress &&
            state.evaluation.agreementsSynthesis.trim().length > 0

        const checks = [
            idComplete,
            bitacoraComplete,
            classificationComplete,
            priorityComplete,
            narrativeComplete,
            anchorComplete,
            regulationComplete,
            skillsSectionCompleteForProgress,
            skillsPriorityCompleteForProgress,
            microHabitsCompleteForProgress,
            pdiCompleteForProgress,
            evaluationCompleteForProgress
        ]

        const filled = checks.filter(Boolean).length
        return Math.round((filled / checks.length) * 100)
    }, [state])

    const triggerSummaries = useMemo(() => {
        return TRIGGER_OPTIONS.map((option) => {
            const rows = state.bitacora.filter((event) => event.trigger === option.id)
            const frequency = rows.length
            const intensityAverage =
                frequency > 0 ? rows.reduce((sum, event) => sum + parseEmotionValue(event.emotion), 0) / frequency : 0
            return {
                ...option,
                frequency,
                intensityAverage,
                responseTypical: state.triggerAnnotations[option.id]?.responseTypical || '',
                costTypical: state.triggerAnnotations[option.id]?.costTypical || ''
            }
        })
    }, [state.bitacora, state.triggerAnnotations])

    const maxFrequency = useMemo(
        () => Math.max(1, ...triggerSummaries.map((summary) => summary.frequency)),
        [triggerSummaries]
    )

    const selectedNarrativeEvent = useMemo(
        () => state.bitacora.find((event) => event.id === state.narrative.eventId) || null,
        [state.bitacora, state.narrative.eventId]
    )

    const selectedTechniquesForRules = useMemo(() => {
        const techniqueMap = new Map<string, string>()
        ;(Object.keys(REGULATION_TECHNIQUES) as LayerKey[]).forEach((layerKey) => {
            REGULATION_TECHNIQUES[layerKey].forEach((technique) => {
                techniqueMap.set(technique.id, technique.label)
            })
        })

        const ids = new Set<string>()
        ;(Object.keys(state.regulation.layers) as LayerKey[]).forEach((layerKey) => {
            state.regulation.layers[layerKey].techniques.forEach((techniqueId) => ids.add(techniqueId))
        })

        return Array.from(ids).map((id) => ({ id, label: techniqueMap.get(id) || id }))
    }, [state.regulation.layers])

    const anchorDelta = useMemo(() => {
        const before = parseEmotionValue(state.anchor.beforeIntensity)
        const after = parseEmotionValue(state.anchor.afterIntensity)
        if (!state.anchor.beforeIntensity || !state.anchor.afterIntensity) return null
        return before - after
    }, [state.anchor.beforeIntensity, state.anchor.afterIntensity])

    const anchorReadyForRealtimeTechnique = useMemo(
        () =>
            state.anchor.gesture.trim().length > 0 &&
            state.anchor.keyword.trim().length > 0 &&
            state.anchor.earlySignal.trim().length > 0 &&
            state.anchor.beforeIntensity.trim().length > 0 &&
            state.anchor.afterIntensity.trim().length > 0,
        [state.anchor]
    )

    const skillsRowsCompleted = useMemo(
        () =>
            state.skillsGap.rows.filter(
                (row) => row.current > 0 && row.ideal > 0 && row.evidence.trim().length > 0
            ).length,
        [state.skillsGap.rows]
    )

    const skillsSectionComplete = useMemo(
        () => state.skillsGap.roleIdeal.trim().length > 0 && skillsRowsCompleted >= 4,
        [state.skillsGap.roleIdeal, skillsRowsCompleted]
    )

    const skillsAllLevelsEqual = useMemo(() => {
        const selectableRows = state.skillsGap.rows.filter((row) => row.current > 0 && row.ideal > 0)
        if (selectableRows.length !== state.skillsGap.rows.length) return false
        return selectableRows.every((row) => row.current === row.ideal)
    }, [state.skillsGap.rows])

    const skillsClosureSuggestion = useMemo(
        () => deriveSkillsClosure(state.skillsGap.rows),
        [state.skillsGap.rows]
    )

    const skillsPriorityRowsView = useMemo(
        () =>
            state.skillsPriority.rows.map((row) => {
                const gap = calculateSkillGap(row.importance, row.current)
                const priority = calculateGapPriority(row.importance, row.current)
                const complete = row.importance > 0 && row.current > 0
                return { ...row, gap, priority, complete }
            }),
        [state.skillsPriority.rows]
    )

    const skillsPrioritySelectedCount = useMemo(
        () => state.skillsPriority.rows.filter((row) => row.selected).length,
        [state.skillsPriority.rows]
    )

    const skillsPriorityAllImportanceSet = useMemo(
        () => state.skillsPriority.rows.every((row) => row.importance > 0),
        [state.skillsPriority.rows]
    )

    const skillsPriorityAllImportanceFive = useMemo(
        () => state.skillsPriority.rows.every((row) => row.importance === 5),
        [state.skillsPriority.rows]
    )

    const skillsPrioritySectionComplete = useMemo(
        () => skillsPriorityAllImportanceSet && skillsPrioritySelectedCount === 3,
        [skillsPriorityAllImportanceSet, skillsPrioritySelectedCount]
    )

    const hasCurrentSkillsFromSectionFive = useMemo(
        () => state.skillsGap.rows.every((row) => row.current > 0),
        [state.skillsGap.rows]
    )

    const selectedMicroHabitOptions = useMemo(
        () =>
            state.microHabits.selectedHabitIds
                .map((habitId) => getMicroHabitOption(habitId))
                .filter((option): option is NonNullable<ReturnType<typeof getMicroHabitOption>> => !!option),
        [state.microHabits.selectedHabitIds]
    )

    const microHabitSlots = useMemo(
        () => Array.from({ length: 3 }, (_, index) => selectedMicroHabitOptions[index] || null),
        [selectedMicroHabitOptions]
    )

    const microHabitDefinitionsForSelected = useMemo(
        () =>
            selectedMicroHabitOptions
                .map((option) => ({
                    option,
                    definition: state.microHabits.definitions.find((item) => item.habitId === option.id) || null
                })),
        [selectedMicroHabitOptions, state.microHabits.definitions]
    )

    const microHabitsDefinitionsComplete = useMemo(
        () =>
            state.microHabits.selectedHabitIds.length === 3 &&
            state.microHabits.selectedHabitIds.every((habitId) => {
                const definition = state.microHabits.definitions.find((item) => item.habitId === habitId)
                return !!definition && definition.when.trim().length > 0 && definition.duration !== '' && definition.evidenceFormat.trim().length > 0
            }),
        [state.microHabits.selectedHabitIds, state.microHabits.definitions]
    )

    const microHabitsTrackedDays = useMemo(
        () => state.microHabits.tracker.filter((day) => day.evidence.trim().length > 0).length,
        [state.microHabits.tracker]
    )

    const microHabitsConsistencyDays = useMemo(
        () => state.microHabits.tracker.filter((day) => day.checks.filter(Boolean).length >= 2).length,
        [state.microHabits.tracker]
    )

    const microHabitsConsistencyPercent = useMemo(
        () => Math.round((microHabitsConsistencyDays / 30) * 100),
        [microHabitsConsistencyDays]
    )

    const microHabitsSectionComplete = useMemo(
        () => state.microHabits.selectedHabitIds.length === 3 && microHabitsDefinitionsComplete && microHabitsTrackedDays >= 7,
        [state.microHabits.selectedHabitIds.length, microHabitsDefinitionsComplete, microHabitsTrackedDays]
    )

    const pdiIndicatorsComplete = useMemo(
        () => state.pdi.indicators.every((indicator) => indicator.value.trim().length > 0),
        [state.pdi.indicators]
    )

    const pdiActionsComplete = useMemo(
        () =>
            state.pdi.actions.length >= 3 &&
            state.pdi.actions.every(
                (action) =>
                    action.action.trim().length > 0 &&
                    action.frequency !== '' &&
                    action.duration !== '' &&
                    action.evidence.trim().length > 0
            ),
        [state.pdi.actions]
    )

    const pdiWeek1Complete = useMemo(() => {
        const weekOne = state.pdi.weeklyReviews.find((week) => week.week === 1)
        return !!weekOne && weekOne.trigger.trim().length > 0 && weekOne.technique.trim().length > 0 && weekOne.adjustment.trim().length > 0
    }, [state.pdi.weeklyReviews])

    const pdiSectionComplete = useMemo(
        () => state.pdi.objective.trim().length > 0 && pdiIndicatorsComplete && pdiActionsComplete && pdiWeek1Complete,
        [state.pdi.objective, pdiIndicatorsComplete, pdiActionsComplete, pdiWeek1Complete]
    )

    const pdiPriorityTriggerSuggestion = useMemo(
        () => TRIGGER_OPTIONS.find((option) => option.id === state.priorityTrigger)?.label || '',
        [state.priorityTrigger]
    )

    const pdiRealtimeTechniqueSuggestion = useMemo(() => {
        const techniqueId = state.regulation.layers.realtime.techniques[0]
        if (!techniqueId) return ''
        return REGULATION_TECHNIQUES.realtime.find((technique) => technique.id === techniqueId)?.label || techniqueId
    }, [state.regulation.layers.realtime.techniques])

    const pdiTopGapSuggestions = useMemo(
        () => state.skillsPriority.rows.filter((row) => row.selected).map((row) => row.skill),
        [state.skillsPriority.rows]
    )

    const pdiMicroHabitSuggestions = useMemo(
        () => state.microHabits.selectedHabitIds.map((habitId) => getMicroHabitShortLabel(habitId)),
        [state.microHabits.selectedHabitIds]
    )

    const pdiActionLayerHint = useMemo(() => {
        const usedLayers = state.pdi.actions.reduce(
            (acc, action) => {
                const layer = inferPdiActionLayer(action.action)
                if (layer === 'realtime') acc.realtime = true
                if (layer === 'maintenance') acc.maintenance = true
                return acc
            },
            { realtime: false, maintenance: false }
        )
        return usedLayers
    }, [state.pdi.actions])

    const pdiObjectiveSuggestion = useMemo(() => {
        if (pdiPriorityTriggerSuggestion) {
            return `Pausar y hacer 1 pregunta antes de responder cuando aparezca ${pdiPriorityTriggerSuggestion.toLowerCase()}.`
        }
        if (pdiTopGapSuggestions.length > 0) {
            return `Sostener conducta ejecutiva bajo presión fortaleciendo: ${pdiTopGapSuggestions[0]}.`
        }
        return 'Regular mi respuesta bajo presión con una conducta observable y medible.'
    }, [pdiPriorityTriggerSuggestion, pdiTopGapSuggestions])

    const mentorCompletedRows = useMemo(
        () => state.evaluation.mentorRows.filter((row) => isMentorEvaluationRowComplete(row)).length,
        [state.evaluation.mentorRows]
    )

    const leaderCompletedRows = useMemo(
        () => state.evaluation.leaderRows.filter((row) => isLeaderEvaluationRowComplete(row)).length,
        [state.evaluation.leaderRows]
    )

    const evaluationSectionComplete = useMemo(
        () =>
            mentorCompletedRows === state.evaluation.mentorRows.length &&
            state.evaluation.mentorGeneralNotes.trim().length > 0 &&
            state.evaluation.mentorGlobalDecision !== '' &&
            leaderCompletedRows === state.evaluation.leaderRows.length &&
            state.evaluation.agreementsSynthesis.trim().length > 0,
        [
            mentorCompletedRows,
            leaderCompletedRows,
            state.evaluation.mentorRows.length,
            state.evaluation.leaderRows.length,
            state.evaluation.mentorGeneralNotes,
            state.evaluation.mentorGlobalDecision,
            state.evaluation.agreementsSynthesis
        ]
    )

    const mentorStageComplete = useMemo(
        () =>
            mentorCompletedRows === state.evaluation.mentorRows.length &&
            state.evaluation.mentorGeneralNotes.trim().length > 0 &&
            state.evaluation.mentorGlobalDecision !== '',
        [mentorCompletedRows, state.evaluation.mentorRows.length, state.evaluation.mentorGeneralNotes, state.evaluation.mentorGlobalDecision]
    )

    const leaderStageComplete = useMemo(
        () => leaderCompletedRows === state.evaluation.leaderRows.length,
        [leaderCompletedRows, state.evaluation.leaderRows.length]
    )

    const synthesisStageComplete = useMemo(
        () => state.evaluation.agreementsSynthesis.trim().length > 0,
        [state.evaluation.agreementsSynthesis]
    )

    const evaluationStageIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
    const hasPrevEvaluationStage = evaluationStageIndex > 0
    const hasNextEvaluationStage = evaluationStageIndex >= 0 && evaluationStageIndex < EVALUATION_STAGES.length - 1
    const evaluationStageCompletionMap: Record<EvaluationStageKey, boolean> = {
        mentor: mentorStageComplete,
        leader: leaderStageComplete,
        synthesis: synthesisStageComplete,
        final: evaluationSectionComplete
    }

    const printDateLabel = useMemo(() => {
        try {
            return new Intl.DateTimeFormat('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).format(new Date())
        } catch {
            return new Date().toISOString().slice(0, 10)
        }
    }, [])
    const printLeaderLabel = state.identification.leaderName.trim().length > 0 ? state.identification.leaderName.trim() : 'Sin nombre'
    const printMetaLabel = `Líder: ${printLeaderLabel} · Exportado: ${printDateLabel}`

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

        clonedRoot.querySelector('.wb2-toolbar')?.remove()
        clonedRoot.querySelector('.wb2-sidebar')?.remove()
        clonedRoot.querySelector('.wb2-page-nav')?.remove()

        const head = clonedRoot.querySelector('head')
        if (head) {
            const exportStyle = document.createElement('style')
            exportStyle.textContent = `
                body { background: #f8fafc !important; }
                main { max-width: 1120px !important; margin: 0 auto !important; padding: 24px !important; }
                @media print {
                    @page { size: A4; margin: 14mm; }
                    body { background: #fff !important; }
                    main { max-width: 100% !important; padding: 0 !important; }
                    .wb2-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb2-print-page:not(.wb2-cover-page)::before {
                        content: "WB2 · Gestión emocional y PDI estratégico · " attr(data-print-title);
                        position: absolute;
                        top: 2mm;
                        left: 0;
                        right: 0;
                        padding-bottom: 2mm;
                        border-bottom: 1px solid #cbd5e1;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        font-weight: 700;
                        color: #1e3a8a;
                    }
                    .wb2-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb2-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb2-cover-page::before { content: none !important; }
                    .wb2-cover-hero {
                        min-height: 240mm !important;
                        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
                    }
                    article.rounded-3xl {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                    }
                    table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }
                }
            `
            head.appendChild(exportStyle)

            const titleNode = head.querySelector('title')
            if (titleNode) {
                titleNode.textContent = 'WB2 - Gestión emocional y PDI estratégico (completo)'
            }
        }

        return '<!doctype html>\n' + clonedRoot.outerHTML
    }

    const exportPdf = async () => {
        if (isExporting) return
        setIsExporting(true)
        setIsExportingAll(true)
        const previousTitle = document.title
        try {
            await waitForRenderCycle()
            document.title = 'WB2 - Gestión emocional y PDI estratégico (completo)'
            window.print()
            announceSave('PDF completo generado (usa "Guardar como PDF" en el diálogo).')
        } finally {
            document.title = previousTitle
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
            htmlContent = htmlContent.replace(/\b(href|src)=\"\/(?!\/)/g, `$1=\"${origin}/`)

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'WB2-gestion-emocional-pdi-estrategico-completo.html'
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
            announceSave('HTML completo exportado con todos los datos.')
        } finally {
            setIsExportingAll(false)
            setIsExporting(false)
        }
    }

    const jumpToPage = (pageId: number) => {
        setActivePage(pageId)
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

    const setIdentificationField = (field: keyof IdentificationFields, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const saveIdentification = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                leaderName: prev.identification.leaderName.trim(),
                role: prev.identification.role.trim(),
                cohort: prev.identification.cohort.trim(),
                startDate: prev.identification.startDate.trim()
            }
        }))
        announceSave('Datos de identificación guardados.')
    }

    const editBitacoraEvent = (index: number) => {
        if (isLocked) return
        setBitacoraEditModes((prev) => prev.map((value, currentIndex) => (currentIndex === index ? true : value)))
    }

    const saveBitacoraEvent = (index: number) => {
        setState((prev) => {
            const next = [...prev.bitacora]
            const current = next[index]
            if (!current) return prev
            next[index] = {
                ...current,
                date: current.date.trim(),
                situation: current.situation.trim(),
                actor: current.actor.trim(),
                emotion: current.emotion.trim(),
                bodySignal: current.bodySignal.trim(),
                response: current.response.trim(),
                impact: current.impact.trim(),
                triggerNote: current.triggerNote.trim()
            }
            return {
                ...prev,
                bitacora: next
            }
        })
        setBitacoraEditModes((prev) => prev.map((value, currentIndex) => (currentIndex === index ? false : value)))
        announceSave(`Evento ${index + 1} guardado.`)
    }

    const saveBitacoraModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bitacora: prev.bitacora.map((event) => ({
                ...event,
                date: event.date.trim(),
                situation: event.situation.trim(),
                actor: event.actor.trim(),
                emotion: event.emotion.trim(),
                bodySignal: event.bodySignal.trim(),
                response: event.response.trim(),
                impact: event.impact.trim(),
                triggerNote: event.triggerNote.trim()
            }))
        }))
        setBitacoraEditModes(Array.from({ length: 7 }, () => false))
        announceSave('Bitácora guardada.')
    }

    const setBitacoraEventField = (index: number, field: keyof BitacoraEvent, value: string) => {
        if (isLocked || !bitacoraEditModes[index]) return
        setState((prev) => {
            const next = [...prev.bitacora]
            const current = next[index]
            if (!current) return prev

            if (field === 'trigger') {
                const safeTrigger = TRIGGER_OPTIONS.some((option) => option.id === value) ? (value as TriggerId) : ''
                next[index] = { ...current, trigger: safeTrigger }
            } else if (field === 'emotion') {
                const safe = value === '' ? '' : String(Math.max(0, Math.min(10, Number(value) || 0)))
                next[index] = { ...current, emotion: safe }
            } else {
                next[index] = { ...current, [field]: value }
            }

            return {
                ...prev,
                bitacora: next
            }
        })
    }

    const setTriggerAnnotationField = (triggerId: TriggerId, field: keyof TriggerSummaryAnnotation, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            triggerAnnotations: {
                ...prev.triggerAnnotations,
                [triggerId]: {
                    ...prev.triggerAnnotations[triggerId],
                    [field]: value
                }
            }
        }))
    }

    const saveTriggerMapModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            triggerAnnotations: TRIGGER_OPTIONS.reduce((acc, option) => {
                acc[option.id] = {
                    responseTypical: prev.triggerAnnotations[option.id].responseTypical.trim(),
                    costTypical: prev.triggerAnnotations[option.id].costTypical.trim()
                }
                return acc
            }, createDefaultTriggerAnnotations()),
            priorityCard: {
                earlySignal: prev.priorityCard.earlySignal.trim(),
                typicalEmotion: prev.priorityCard.typicalEmotion.trim(),
                typicalResponse: prev.priorityCard.typicalResponse.trim(),
                typicalCost: prev.priorityCard.typicalCost.trim()
            }
        }))
        announceSave('Mapa de detonantes guardado.')
    }

    const setPriorityTrigger = (value: string) => {
        if (isLocked) return
        if (!TRIGGER_OPTIONS.some((option) => option.id === value)) return
        setState((prev) => ({ ...prev, priorityTrigger: value as TriggerId }))
    }

    const setPriorityCardField = (field: keyof PriorityCard, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            priorityCard: {
                ...prev.priorityCard,
                [field]: value
            }
        }))
    }

    const setNarrativeField = (field: keyof NarrativeCase, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            narrative: {
                ...prev.narrative,
                [field]: value
            }
        }))
    }

    const saveNarrativeModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            narrative: {
                ...prev.narrative,
                context: prev.narrative.context.trim(),
                interpretation: prev.narrative.interpretation.trim(),
                impulse: prev.narrative.impulse.trim(),
                realBehavior: prev.narrative.realBehavior.trim(),
                costRepeat: prev.narrative.costRepeat.trim(),
                learning: prev.narrative.learning.trim(),
                alternativeResponse: prev.narrative.alternativeResponse.trim(),
                miniABC: prev.narrative.miniABC.trim()
            }
        }))
        announceSave('Narrativa de desafío guardada.')
    }

    const copyAlternativeToNextModules = () => {
        if (isLocked) return
        const alternative = state.narrative.alternativeResponse.trim()
        if (!alternative) return

        setState((prev) => ({
            ...prev,
            anchor: {
                ...prev.anchor,
                protectedBehavior: prev.anchor.protectedBehavior.trim().length > 0 ? prev.anchor.protectedBehavior : alternative
            },
            regulation: {
                ...prev.regulation,
                referenceAlternative: alternative
            }
        }))
    }

    const setAnchorField = (field: keyof AnchorFields, value: string | boolean, index?: number) => {
        if (isLocked) return
        if (field === 'cycles' && typeof index === 'number' && typeof value === 'boolean') {
            setState((prev) => {
                const nextCycles = [...prev.anchor.cycles]
                nextCycles[index] = value
                return {
                    ...prev,
                    anchor: {
                        ...prev.anchor,
                        cycles: nextCycles
                    }
                }
            })
            return
        }

        if (typeof value !== 'string') return
        setState((prev) => ({
            ...prev,
            anchor: {
                ...prev.anchor,
                [field]: value
            }
        }))
    }

    const setGesturePreset = (presetValue: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextGesture =
                presetValue === ''
                    ? ''
                    : presetValue === 'other'
                        ? prev.anchor.gesturePreset === 'other'
                            ? prev.anchor.gesture
                            : ''
                        : findOptionLabel(GESTURE_OPTIONS, presetValue)

            return {
                ...prev,
                anchor: {
                    ...prev.anchor,
                    gesturePreset: presetValue,
                    gesture: nextGesture
                }
            }
        })
    }

    const setEarlySignalPreset = (presetValue: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextSignal =
                presetValue === ''
                    ? ''
                    : presetValue === 'other'
                        ? prev.anchor.earlySignalPreset === 'other'
                            ? prev.anchor.earlySignal
                            : ''
                        : findOptionLabel(EARLY_SIGNAL_OPTIONS, presetValue)

            return {
                ...prev,
                anchor: {
                    ...prev.anchor,
                    earlySignalPreset: presetValue,
                    earlySignal: nextSignal
                }
            }
        })
    }

    const saveAnchorModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            anchor: {
                ...prev.anchor,
                gesture: prev.anchor.gesture.trim(),
                keyword: prev.anchor.keyword.trim(),
                earlySignal: prev.anchor.earlySignal.trim(),
                useContext: prev.anchor.useContext.trim(),
                protectedBehavior: prev.anchor.protectedBehavior.trim(),
                rule1Seconds: prev.anchor.rule1Seconds.trim(),
                rule3Question: prev.anchor.rule3Question.trim(),
                beforeIntensity: prev.anchor.beforeIntensity.trim(),
                afterIntensity: prev.anchor.afterIntensity.trim()
            }
        }))
        announceSave('Ancla de seguridad guardada.')
    }

    const toggleLayerTechnique = (layerKey: LayerKey, techniqueId: string) => {
        if (isLocked) return
        if (layerKey === 'realtime' && techniqueId === 'anchor' && !anchorReadyForRealtimeTechnique) {
            setRegulationWarning('Completa tu Ancla primero o elige otra técnica.')
            return
        }
        setRegulationWarning('')
        setState((prev) => {
            const current = prev.regulation.layers[layerKey]
            const isSelected = current.techniques.includes(techniqueId)
            const nextTechniques = isSelected
                ? current.techniques.filter((id) => id !== techniqueId)
                : current.techniques.length >= 2
                    ? current.techniques
                    : [...current.techniques, techniqueId]

            return {
                ...prev,
                regulation: {
                    ...prev.regulation,
                    layers: {
                        ...prev.regulation.layers,
                        [layerKey]: {
                            ...current,
                            techniques: nextTechniques
                        }
                    }
                }
            }
        })
    }

    const setLayerField = (layerKey: LayerKey, field: keyof RegulationLayerData, value: string) => {
        if (isLocked || field === 'techniques') return
        setRegulationWarning('')
        setState((prev) => ({
            ...prev,
            regulation: {
                ...prev.regulation,
                layers: {
                    ...prev.regulation.layers,
                    [layerKey]: {
                        ...prev.regulation.layers[layerKey],
                        [field]: value
                    }
                }
            }
        }))
    }

    const setIfThenRuleField = (index: number, field: keyof IfThenRule, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextRules = [...prev.regulation.ifThenRules]
            const current = nextRules[index]
            if (!current) return prev
            if (field === 'duration') {
                const safeDuration = DURATION_OPTIONS.includes(value as IfThenRule['duration']) ? (value as IfThenRule['duration']) : ''
                nextRules[index] = { ...current, duration: safeDuration }
            } else {
                nextRules[index] = { ...current, [field]: value }
            }
            return {
                ...prev,
                regulation: {
                    ...prev.regulation,
                    ifThenRules: nextRules
                }
            }
        })
    }

    const setRepairField = (field: keyof RepairScript, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            regulation: {
                ...prev.regulation,
                repair: {
                    ...prev.regulation.repair,
                    [field]: value
                }
            }
        }))
    }

    const saveRegulationModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            regulation: {
                ...prev.regulation,
                layers: {
                    realtime: {
                        ...prev.regulation.layers.realtime,
                        whenToUse: prev.regulation.layers.realtime.whenToUse.trim(),
                        signal: prev.regulation.layers.realtime.signal.trim()
                    },
                    recovery: {
                        ...prev.regulation.layers.recovery,
                        whenToUse: prev.regulation.layers.recovery.whenToUse.trim(),
                        signal: prev.regulation.layers.recovery.signal.trim()
                    },
                    maintenance: {
                        ...prev.regulation.layers.maintenance,
                        whenToUse: prev.regulation.layers.maintenance.whenToUse.trim(),
                        signal: prev.regulation.layers.maintenance.signal.trim()
                    }
                },
                ifThenRules: prev.regulation.ifThenRules.map((rule) => ({
                    ...rule,
                    signal: rule.signal.trim(),
                    technique: rule.technique.trim()
                })),
                repair: {
                    fact: prev.regulation.repair.fact.trim(),
                    impact: prev.regulation.repair.impact.trim(),
                    repair: prev.regulation.repair.repair.trim(),
                    request: prev.regulation.repair.request.trim()
                },
                referenceAlternative: prev.regulation.referenceAlternative.trim()
            }
        }))
        announceSave('Kit de regulación guardado.')
    }

    const setSkillsRoleIdeal = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            skillsGap: {
                ...prev.skillsGap,
                roleIdeal: value
            }
        }))
    }

    const setSkillsRowLevel = (index: number, field: 'current' | 'ideal', level: SkillRating) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.skillsGap.rows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, [field]: level }
            return {
                ...prev,
                skillsGap: {
                    ...prev.skillsGap,
                    rows: nextRows
                }
            }
        })
    }

    const setSkillsRowEvidence = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.skillsGap.rows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, evidence: value }
            return {
                ...prev,
                skillsGap: {
                    ...prev.skillsGap,
                    rows: nextRows
                }
            }
        })
    }

    const setSkillsClosureField = (field: 'strongest' | 'weakest' | 'weeklyMinimum', value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            skillsGap: {
                ...prev.skillsGap,
                [field]: value
            }
        }))
    }

    const saveSkillsGapModule = () => {
        if (isLocked) return
        setState((prev) => {
            const suggested = deriveSkillsClosure(prev.skillsGap.rows)
            return {
                ...prev,
                skillsGap: {
                    ...prev.skillsGap,
                    roleIdeal: prev.skillsGap.roleIdeal.trim(),
                    rows: prev.skillsGap.rows.map((row) => ({
                        ...row,
                        evidence: row.evidence.trim()
                    })),
                    strongest: prev.skillsGap.strongest.trim().length > 0 ? prev.skillsGap.strongest.trim() : suggested.strongest,
                    weakest: prev.skillsGap.weakest.trim().length > 0 ? prev.skillsGap.weakest.trim() : suggested.weakest,
                    weeklyMinimum: prev.skillsGap.weeklyMinimum.trim()
                }
            }
        })
        announceSave('Habilidades actuales vs rol ideal guardado.')
    }

    const autofillSkillsClosureFromMatrix = () => {
        if (isLocked) return
        setState((prev) => {
            const suggested = deriveSkillsClosure(prev.skillsGap.rows)
            return {
                ...prev,
                skillsGap: {
                    ...prev.skillsGap,
                    strongest: suggested.strongest,
                    weakest: suggested.weakest
                }
            }
        })
    }

    const syncPriorityCurrentFromSkills = () => {
        if (isLocked) return
        setState((prev) => {
            let changed = false
            const nextRows = prev.skillsPriority.rows.map((row, index) => {
                const linkedCurrent = prev.skillsGap.rows[index]?.current ?? 0
                if (linkedCurrent > 0 && row.current !== linkedCurrent) {
                    changed = true
                    return { ...row, current: linkedCurrent }
                }
                return row
            })

            if (!changed) return prev
            return {
                ...prev,
                skillsPriority: {
                    ...prev.skillsPriority,
                    rows: nextRows
                }
            }
        })
    }

    const setSkillPriorityImportance = (index: number, value: SkillRating) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.skillsPriority.rows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, importance: value }
            return {
                ...prev,
                skillsPriority: {
                    ...prev.skillsPriority,
                    rows: nextRows
                }
            }
        })
    }

    const setSkillPriorityCurrent = (index: number, value: SkillRating) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.skillsPriority.rows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, current: value }
            return {
                ...prev,
                skillsPriority: {
                    ...prev.skillsPriority,
                    rows: nextRows
                }
            }
        })
    }

    const toggleSkillPrioritySelection = (index: number) => {
        if (isLocked) return
        const currentRow = state.skillsPriority.rows[index]
        if (!currentRow) return
        const selectedCount = state.skillsPriority.rows.filter((item) => item.selected).length
        if (!currentRow.selected && selectedCount >= 3) {
            setSkillsPriorityWarning('Máximo 3 habilidades pueden marcarse como prioridad.')
            return
        }

        setSkillsPriorityWarning('')
        setState((prev) => {
            const nextRows = [...prev.skillsPriority.rows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, selected: !row.selected }
            return {
                ...prev,
                skillsPriority: {
                    ...prev.skillsPriority,
                    rows: nextRows
                }
            }
        })
    }

    const setSkillsPrioritySummaryField = (
        field: 'priorityOne' | 'priorityTwo' | 'priorityThree' | 'skipForNow',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            skillsPriority: {
                ...prev.skillsPriority,
                [field]: value
            }
        }))
    }

    const saveSkillsPriorityModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            skillsPriority: {
                ...prev.skillsPriority,
                priorityOne: prev.skillsPriority.priorityOne.trim(),
                priorityTwo: prev.skillsPriority.priorityTwo.trim(),
                priorityThree: prev.skillsPriority.priorityThree.trim(),
                skipForNow: prev.skillsPriority.skipForNow.trim()
            }
        }))
        announceSave('Gap de habilidades guardado.')
    }

    const toggleMicroHabitSelection = (habitId: MicroHabitId) => {
        if (isLocked) return
        setState((prev) => {
            const isSelected = prev.microHabits.selectedHabitIds.includes(habitId)
            if (isSelected) {
                const nextSelection = prev.microHabits.selectedHabitIds.filter((item) => item !== habitId)
                return {
                    ...prev,
                    microHabits: {
                        ...prev.microHabits,
                        selectedHabitIds: nextSelection
                    }
                }
            }

            if (prev.microHabits.selectedHabitIds.length >= 3) {
                setMicroHabitsSelectionWarning('Elige solo 3 micro-hábitos.')
                return prev
            }

            setMicroHabitsSelectionWarning('')
            return {
                ...prev,
                microHabits: {
                    ...prev.microHabits,
                    selectedHabitIds: [...prev.microHabits.selectedHabitIds, habitId]
                }
            }
        })
    }

    const saveMicroHabitsSelection = () => {
        if (isLocked) return
        if (state.microHabits.selectedHabitIds.length !== 3) {
            setMicroHabitsSelectionWarning('Debes seleccionar exactamente 3 micro-hábitos.')
            return
        }
        setMicroHabitsSelectionWarning('')
        announceSave('Selección de micro-hábitos guardada.')
    }

    const setMicroHabitDefinitionField = (
        habitId: MicroHabitId,
        field: 'when' | 'duration' | 'evidenceFormat',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const nextDefinitions = prev.microHabits.definitions.map((definition) => {
                if (definition.habitId !== habitId) return definition
                if (field === 'duration') {
                    const safeDuration = MICRO_HABIT_DURATION_OPTIONS.includes(value as MicroHabitDuration)
                        ? (value as MicroHabitDuration)
                        : ''
                    return { ...definition, duration: safeDuration }
                }
                return { ...definition, [field]: value }
            })

            return {
                ...prev,
                microHabits: {
                    ...prev.microHabits,
                    definitions: nextDefinitions
                }
            }
        })
    }

    const saveMicroHabitsDefinitions = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            microHabits: {
                ...prev.microHabits,
                definitions: prev.microHabits.definitions.map((definition) => ({
                    ...definition,
                    when: definition.when.trim(),
                    evidenceFormat: definition.evidenceFormat.trim()
                }))
            }
        }))
        announceSave('Definición de micro-hábitos guardada.')
    }

    const setMicroHabitTrackerCheck = (dayIndex: number, checkIndex: 0 | 1 | 2, value: boolean) => {
        if (isLocked) return
        setState((prev) => {
            const nextTracker = [...prev.microHabits.tracker]
            const row = nextTracker[dayIndex]
            if (!row) return prev
            const nextChecks = [...row.checks] as [boolean, boolean, boolean]
            nextChecks[checkIndex] = value
            nextTracker[dayIndex] = { ...row, checks: nextChecks }
            return {
                ...prev,
                microHabits: {
                    ...prev.microHabits,
                    tracker: nextTracker
                }
            }
        })
    }

    const setMicroHabitTrackerEvidence = (dayIndex: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextTracker = [...prev.microHabits.tracker]
            const row = nextTracker[dayIndex]
            if (!row) return prev
            nextTracker[dayIndex] = { ...row, evidence: value }
            return {
                ...prev,
                microHabits: {
                    ...prev.microHabits,
                    tracker: nextTracker
                }
            }
        })
    }

    const saveMicroHabitDay = (dayIndex: number) => {
        if (isLocked) return
        setState((prev) => {
            const nextTracker = [...prev.microHabits.tracker]
            const row = nextTracker[dayIndex]
            if (!row) return prev
            nextTracker[dayIndex] = { ...row, evidence: row.evidence.trim() }
            return {
                ...prev,
                microHabits: {
                    ...prev.microHabits,
                    tracker: nextTracker
                }
            }
        })
        announceSave(`Día ${dayIndex + 1} del tracker guardado.`)
    }

    const saveMicroHabitsTrackerWeek = () => {
        if (isLocked) return
        const range = getTrackerWeekRange(trackerWeekToSave)
        setState((prev) => ({
            ...prev,
            microHabits: {
                ...prev.microHabits,
                tracker: prev.microHabits.tracker.map((row) =>
                    row.day >= range.start && row.day <= range.end
                        ? { ...row, evidence: row.evidence.trim() }
                        : row
                )
            }
        }))
        announceSave(`Semana ${trackerWeekToSave} del tracker guardada.`)
    }

    const saveMicroHabitsTrackerAll = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            microHabits: {
                ...prev.microHabits,
                tracker: prev.microHabits.tracker.map((row) => ({
                    ...row,
                    evidence: row.evidence.trim()
                }))
            }
        }))
        announceSave('Tracker de 30 días guardado.')
    }

    const setMicroHabitWeeklyField = (
        weekIndex: number,
        field: 'consistency' | 'mainTrigger' | 'adjustment',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const nextWeekly = [...prev.microHabits.weeklyReviews]
            const row = nextWeekly[weekIndex]
            if (!row) return prev
            nextWeekly[weekIndex] = { ...row, [field]: value }
            return {
                ...prev,
                microHabits: {
                    ...prev.microHabits,
                    weeklyReviews: nextWeekly
                }
            }
        })
    }

    const saveMicroHabitsWeeklyReviews = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            microHabits: {
                ...prev.microHabits,
                weeklyReviews: prev.microHabits.weeklyReviews.map((row) => ({
                    ...row,
                    consistency: row.consistency.trim(),
                    mainTrigger: row.mainTrigger.trim(),
                    adjustment: row.adjustment.trim()
                }))
            }
        }))
        announceSave('Cierre semanal de micro-hábitos guardado.')
    }

    const saveMicroHabitsModule = () => {
        if (isLocked) return
        if (state.microHabits.selectedHabitIds.length !== 3) {
            setMicroHabitsSelectionWarning('Debes seleccionar exactamente 3 micro-hábitos.')
        } else {
            setMicroHabitsSelectionWarning('')
        }

        setState((prev) => ({
            ...prev,
            microHabits: {
                ...prev.microHabits,
                definitions: prev.microHabits.definitions.map((definition) => ({
                    ...definition,
                    when: definition.when.trim(),
                    evidenceFormat: definition.evidenceFormat.trim()
                })),
                tracker: prev.microHabits.tracker.map((row) => ({
                    ...row,
                    evidence: row.evidence.trim()
                })),
                weeklyReviews: prev.microHabits.weeklyReviews.map((row) => ({
                    ...row,
                    consistency: row.consistency.trim(),
                    mainTrigger: row.mainTrigger.trim(),
                    adjustment: row.adjustment.trim()
                }))
            }
        }))
        announceSave('Página de micro-hábitos guardada.')
    }

    const setPdiObjective = (value: string) => {
        if (isLocked) return
        setPdiWarning('')
        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                objective: value
            }
        }))
    }

    const setPdiPrimaryCompetency = (value: string) => {
        if (isLocked) return
        const safeValue = PDI_COMPETENCY_OPTIONS.includes(value as Exclude<PdiCompetency, ''>)
            ? (value as Exclude<PdiCompetency, ''>)
            : ''
        setPdiWarning('')
        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                primaryCompetency: safeValue
            }
        }))
    }

    const setPdiSecondaryCompetency = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                secondaryCompetency: value
            }
        }))
    }

    const setPdiIndicator = (index: number, value: string) => {
        if (isLocked) return
        setPdiWarning('')
        setState((prev) => {
            const nextIndicators = [...prev.pdi.indicators]
            const row = nextIndicators[index]
            if (!row) return prev
            nextIndicators[index] = { ...row, value }
            return {
                ...prev,
                pdi: {
                    ...prev.pdi,
                    indicators: nextIndicators
                }
            }
        })
    }

    const addPdiActionRow = () => {
        if (isLocked) return
        if (state.pdi.actions.length >= 5) {
            setPdiWarning('Máximo 5 acciones en el PDI.')
            return
        }
        setPdiWarning('')
        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                actions: [
                    ...prev.pdi.actions,
                    {
                        id: `pdi-action-${Date.now()}-${prev.pdi.actions.length + 1}`,
                        action: '',
                        frequency: '',
                        duration: '',
                        evidence: ''
                    }
                ]
            }
        }))
    }

    const removePdiActionRow = (index: number) => {
        if (isLocked) return
        if (state.pdi.actions.length <= 3) {
            setPdiWarning('Debes mantener al menos 3 acciones.')
            return
        }
        setPdiWarning('')
        setState((prev) => {
            const nextActions = prev.pdi.actions.filter((_, actionIndex) => actionIndex !== index)
            return {
                ...prev,
                pdi: {
                    ...prev.pdi,
                    actions: nextActions
                }
            }
        })
    }

    const setPdiActionField = (
        index: number,
        field: keyof Pick<PdiActionRow, 'action' | 'frequency' | 'duration' | 'evidence'>,
        value: string
    ) => {
        if (isLocked) return
        setPdiWarning('')
        setState((prev) => {
            const nextActions = [...prev.pdi.actions]
            const row = nextActions[index]
            if (!row) return prev

            if (field === 'frequency') {
                const safeFrequency = PDI_ACTION_FREQUENCY_OPTIONS.includes(value as PdiActionFrequency)
                    ? (value as PdiActionFrequency)
                    : ''
                nextActions[index] = { ...row, frequency: safeFrequency }
            } else if (field === 'duration') {
                const safeDuration = PDI_ACTION_DURATION_OPTIONS.includes(value as PdiActionDuration)
                    ? (value as PdiActionDuration)
                    : ''
                nextActions[index] = { ...row, duration: safeDuration }
            } else {
                nextActions[index] = { ...row, [field]: value }
            }

            return {
                ...prev,
                pdi: {
                    ...prev.pdi,
                    actions: nextActions
                }
            }
        })
    }

    const setPdiSupportField = (field: keyof PdiSupports, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                supports: {
                    ...prev.pdi.supports,
                    [field]: value
                }
            }
        }))
    }

    const setPdiWeeklyField = (index: number, field: keyof Omit<PdiWeeklyReviewRow, 'week'>, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextWeekly = [...prev.pdi.weeklyReviews]
            const row = nextWeekly[index]
            if (!row) return prev
            nextWeekly[index] = { ...row, [field]: value }
            return {
                ...prev,
                pdi: {
                    ...prev.pdi,
                    weeklyReviews: nextWeekly
                }
            }
        })
    }

    const copyRealtimeTechniqueToPdiWeeks = () => {
        if (isLocked) return
        const suggestion = pdiRealtimeTechniqueSuggestion.trim()
        if (!suggestion) {
            setPdiWarning('Primero define una técnica de tiempo real en el Kit de regulación.')
            return
        }
        setPdiWarning('')
        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                weeklyReviews: prev.pdi.weeklyReviews.map((week) => ({
                    ...week,
                    technique: week.technique.trim().length > 0 ? week.technique : suggestion
                }))
            }
        }))
    }

    const applyPdiSmartSuggestions = () => {
        if (isLocked) return
        setPdiWarning('')
        setState((prev) => {
            const targetActions = [...prev.pdi.actions]
            const actionSuggestions = [
                ...prev.skillsPriority.rows.filter((row) => row.selected).map((row) => buildPdiActionFromGap(row.skill)),
                ...prev.microHabits.selectedHabitIds.map((habitId) => buildPdiActionFromMicroHabit(habitId))
            ]

            actionSuggestions.forEach((suggestion) => {
                const alreadyExists = targetActions.some(
                    (actionRow) => actionRow.action.trim().toLowerCase() === suggestion.trim().toLowerCase()
                )
                if (alreadyExists) return
                const emptyIndex = targetActions.findIndex((row) => row.action.trim().length === 0)
                if (emptyIndex >= 0) {
                    targetActions[emptyIndex] = { ...targetActions[emptyIndex], action: suggestion }
                    return
                }
                if (targetActions.length < 5) {
                    targetActions.push({
                        id: `pdi-action-${Date.now()}-${targetActions.length + 1}`,
                        action: suggestion,
                        frequency: '',
                        duration: '',
                        evidence: ''
                    })
                }
            })

            const inferredPrimary = prev.pdi.primaryCompetency
                ? prev.pdi.primaryCompetency
                : prev.priorityTrigger
                    ? 'Regulación'
                    : ''

            const priorityLabel = TRIGGER_OPTIONS.find((option) => option.id === prev.priorityTrigger)?.label || ''
            const realtimeLabel = REGULATION_TECHNIQUES.realtime.find(
                (technique) => technique.id === prev.regulation.layers.realtime.techniques[0]
            )?.label || ''

            return {
                ...prev,
                pdi: {
                    ...prev.pdi,
                    primaryCompetency: inferredPrimary,
                    actions: targetActions,
                    weeklyReviews: prev.pdi.weeklyReviews.map((week, index) => ({
                        ...week,
                        trigger: index === 0 && week.trigger.trim().length === 0 ? priorityLabel : week.trigger,
                        technique: week.technique.trim().length === 0 ? realtimeLabel : week.technique
                    }))
                }
            }
        })
    }

    const savePdiModule = () => {
        if (isLocked) return
        const weekOne = state.pdi.weeklyReviews.find((week) => week.week === 1)
        const hasCoreRequired =
            state.pdi.objective.trim().length > 0 &&
            state.pdi.indicators.every((indicator) => indicator.value.trim().length > 0) &&
            state.pdi.actions.length >= 3 &&
            !!weekOne &&
            weekOne.trigger.trim().length > 0 &&
            weekOne.technique.trim().length > 0 &&
            weekOne.adjustment.trim().length > 0

        if (!hasCoreRequired) {
            setPdiWarning('Guardado parcial: para estado completado faltan objetivo, 3 indicadores, ≥3 acciones y semana 1.')
        } else {
            setPdiWarning('')
        }

        setState((prev) => ({
            ...prev,
            pdi: {
                ...prev.pdi,
                objective: prev.pdi.objective.trim(),
                secondaryCompetency: prev.pdi.secondaryCompetency.trim(),
                indicators: prev.pdi.indicators.map((indicator) => ({
                    ...indicator,
                    value: indicator.value.trim()
                })),
                actions: prev.pdi.actions.map((action) => ({
                    ...action,
                    action: action.action.trim(),
                    evidence: action.evidence.trim()
                })),
                supports: {
                    supportPerson: prev.pdi.supports.supportPerson.trim(),
                    criticalContext: prev.pdi.supports.criticalContext.trim(),
                    likelyBarrier: prev.pdi.supports.likelyBarrier.trim(),
                    contingencyPlan: prev.pdi.supports.contingencyPlan.trim()
                },
                weeklyReviews: prev.pdi.weeklyReviews.map((week) => ({
                    ...week,
                    trigger: week.trigger.trim(),
                    technique: week.technique.trim(),
                    adjustment: week.adjustment.trim()
                }))
            }
        }))
        announceSave(hasCoreRequired ? 'PDI guardado (estado completo).' : 'PDI guardado de forma parcial.')
    }

    const editMentorEvaluationRow = (index: number) => {
        if (isLocked) return
        setMentorEvaluationEditModes((prev) => prev.map((value, currentIndex) => (currentIndex === index ? true : value)))
    }

    const saveMentorEvaluationRow = (index: number) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.evaluation.mentorRows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, evidence: row.evidence.trim() }
            return {
                ...prev,
                evaluation: {
                    ...prev.evaluation,
                    mentorRows: nextRows
                }
            }
        })
        setMentorEvaluationEditModes((prev) => prev.map((value, currentIndex) => (currentIndex === index ? false : value)))
        announceSave(`Fila iShine ${index + 1} guardada.`)
    }

    const setMentorEvaluationField = (index: number, field: 'level' | 'evidence' | 'decision', value: string) => {
        if (isLocked || !mentorEvaluationEditModes[index]) return
        setState((prev) => {
            const nextRows = [...prev.evaluation.mentorRows]
            const row = nextRows[index]
            if (!row) return prev

            if (field === 'level') {
                const safeLevel = MENTOR_LEVEL_OPTIONS.includes(value as MentorLevel) ? (value as MentorLevel) : ''
                nextRows[index] = { ...row, level: safeLevel }
            } else if (field === 'decision') {
                const safeDecision = MENTOR_DECISION_OPTIONS.includes(value as MentorDecision)
                    ? (value as MentorDecision)
                    : ''
                nextRows[index] = { ...row, decision: safeDecision }
            } else {
                nextRows[index] = { ...row, evidence: value }
            }

            return {
                ...prev,
                evaluation: {
                    ...prev.evaluation,
                    mentorRows: nextRows
                }
            }
        })
    }

    const setMentorGeneralNotes = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorGeneralNotes: value
            }
        }))
    }

    const setMentorGlobalDecision = (value: string) => {
        if (isLocked) return
        const safeDecision = MENTOR_DECISION_OPTIONS.includes(value as MentorDecision) ? (value as MentorDecision) : ''
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorGlobalDecision: safeDecision
            }
        }))
    }

    const saveMentorClosing = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorGeneralNotes: prev.evaluation.mentorGeneralNotes.trim()
            }
        }))
        announceSave('Cierre del iShine guardado.')
    }

    const editLeaderEvaluationRow = (index: number) => {
        if (isLocked) return
        setLeaderEvaluationEditModes((prev) => prev.map((value, currentIndex) => (currentIndex === index ? true : value)))
    }

    const saveLeaderEvaluationRow = (index: number) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.evaluation.leaderRows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = {
                ...row,
                response: row.response.trim(),
                evidence: row.evidence.trim(),
                action: row.action.trim()
            }
            return {
                ...prev,
                evaluation: {
                    ...prev.evaluation,
                    leaderRows: nextRows
                }
            }
        })
        setLeaderEvaluationEditModes((prev) => prev.map((value, currentIndex) => (currentIndex === index ? false : value)))
        announceSave(`Fila líder ${index + 1} guardada.`)
    }

    const setLeaderEvaluationField = (index: number, field: 'response' | 'evidence' | 'action', value: string) => {
        if (isLocked || !leaderEvaluationEditModes[index]) return
        setState((prev) => {
            const nextRows = [...prev.evaluation.leaderRows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = { ...row, [field]: value }
            return {
                ...prev,
                evaluation: {
                    ...prev.evaluation,
                    leaderRows: nextRows
                }
            }
        })
    }

    const setEvaluationSynthesis = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                agreementsSynthesis: value
            }
        }))
    }

    const saveEvaluationSynthesis = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                agreementsSynthesis: prev.evaluation.agreementsSynthesis.trim()
            }
        }))
        announceSave('Síntesis de acuerdos guardada.')
    }

    const saveEvaluationModule = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                mentorRows: prev.evaluation.mentorRows.map((row) => ({
                    ...row,
                    evidence: row.evidence.trim()
                })),
                mentorGeneralNotes: prev.evaluation.mentorGeneralNotes.trim(),
                leaderRows: prev.evaluation.leaderRows.map((row) => ({
                    ...row,
                    response: row.response.trim(),
                    evidence: row.evidence.trim(),
                    action: row.action.trim()
                })),
                agreementsSynthesis: prev.evaluation.agreementsSynthesis.trim()
            }
        }))
        announceSave('Evaluación guardada.')
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

    const saveCurrentPage = () => {
        if (isLocked || isExporting) return

        if (activePage === 1) {
            saveIdentification()
            return
        }
        if (activePage === 2) {
            announceSave('Página 2 es informativa. No requiere guardado manual.')
            return
        }
        if (activePage === 3) {
            saveBitacoraModule()
            saveTriggerMapModule()
            return
        }
        if (activePage === 4) {
            saveNarrativeModule()
            return
        }
        if (activePage === 5) {
            saveAnchorModule()
            return
        }
        if (activePage === 6) {
            saveRegulationModule()
            return
        }
        if (activePage === 7) {
            saveSkillsGapModule()
            return
        }
        if (activePage === 8) {
            saveSkillsPriorityModule()
            return
        }
        if (activePage === 9) {
            saveMicroHabitsModule()
            return
        }
        if (activePage === 10) {
            savePdiModule()
            return
        }
        if (activePage === 11) {
            if (evaluationStage === 'synthesis') {
                saveEvaluationSynthesis()
            } else {
                saveEvaluationModule()
            }
        }
    }

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb2-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
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
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB2 - Gestión emocional y PDI estratégico</p>
                    </div>

                    <span className={WORKBOOK_V2_EDITORIAL.classes.progressPill}>
                        Avance: {completion}%
                    </span>
                    {saveFeedback && (
                        <span className={WORKBOOK_V2_EDITORIAL.classes.savedPill}>
                            {saveFeedback}
                        </span>
                    )}
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
                        onClick={saveCurrentPage}
                        disabled={isLocked || isExporting}
                        className={WORKBOOK_V2_EDITORIAL.classes.saveButton}
                    >
                        Guardar página {activePage}
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
                    <aside className={`wb2-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                                className="wb2-print-page wb2-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 11"
                                data-print-title="Portada"
                                data-cover-page="true"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb2-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Gestión emocional y PDI estratégico
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 2</p>
                                        <p className="text-blue-600 text-sm">Sistema: 4Shine® · Pilar: Shine Within (Esencia y autoliderazgo)</p>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 md:p-8 border-t border-slate-200">
                                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Datos de identificación</h2>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del líder</span>
                                            <input
                                                type="text"
                                                value={state.identification.leaderName}
                                                onChange={(event) => setIdentificationField('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Andrés Tabla"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Rol actual</span>
                                            <input
                                                type="text"
                                                value={state.identification.role}
                                                onChange={(event) => setIdentificationField('role', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Director / Líder"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cohorte / Equipo</span>
                                            <input
                                                type="text"
                                                value={state.identification.cohort}
                                                onChange={(event) => setIdentificationField('cohort', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder="Ej: Cohorte Ejecutiva 2026"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha de inicio</span>
                                            <input
                                                type="date"
                                                value={state.identification.startDate}
                                                onChange={(event) => setIdentificationField('startDate', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={saveIdentification}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                saveIdentification()
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
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 11"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Presentación del workbook</h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Un mapa claro de tus detonantes emocionales (qué te activa, en qué contextos y con quién).',
                                            'Una narrativa estructurada de tu principal desafío emocional (patrón repetitivo + costo + aprendizaje).',
                                            'Una Ancla de Serenidad para usar bajo presión (técnica breve, repetible).',
                                            'Un conjunto de prácticas de regulación emocional en 3 capas: tiempo real, recuperación y mantenimiento.',
                                            'Un diagnóstico práctico de habilidades actuales vs rol ideal y tu gap de habilidades.',
                                            'Un sistema de acciones diarias (micro-hábitos) para cerrar brechas.',
                                            'Tu PDI (Plan de Desarrollo Individual) listo para 30 días.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Componentes trabajados en este workbook</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Inteligencia emocional y regulación (self-regulation).',
                                                'Toma de decisiones y resolución de problemas.',
                                                'Gestión de energía y bienestar (biohacking).'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                        <ul className="mt-4 space-y-2.5">
                                            {[
                                                'Autoconciencia emocional.',
                                                'Regulación emocional.',
                                                'Compostura y presencia bajo presión.',
                                                'Gestión de energía.',
                                                'Regulación somática y fisiológica.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </section>

                                <article className="rounded-2xl border border-slate-200 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">
                                        Conductas observables asociadas (qué se debería ver en tu día a día)
                                    </h3>
                                    <p className="mt-3 text-sm text-slate-700">
                                        Usa estas conductas como referencia para escribir evidencia real (no intención):
                                    </p>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Monitorea sus estados de ánimo en tiempo real y reconoce cómo estos afectan su toma de decisiones y a las personas a su alrededor.',
                                            'Identifica sus detonantes emocionales (ej. sentirse cuestionado) antes de que provoquen una reacción impulsiva.',
                                            'Aplica la pausa estratégica (Método STOP: Parar, Pensar, Observar, Proceder) antes de reaccionar ante una crisis.',
                                            'Utiliza anclas de serenidad (respiración consciente, objetos físicos o mantras) para volver a su centro en momentos de estrés.',
                                            'Gestiona la frustración manteniendo la calma, proyectando estabilidad al equipo.',
                                            'Prioriza su descanso y desconexión para mantener la claridad mental, entendiendo que el agotamiento afecta la calidad de sus decisiones.',
                                            'Incorpora rutinas de bienestar físico y mental para recargar su batería de liderazgo.',
                                            'Mantiene la serenidad en situaciones de crisis, proyectando confianza y evitando que el pánico paralice al equipo.',
                                            'Controla los impulsos y evita reacciones defensivas, permitiendo que otros piensen con claridad y ejecuten tareas críticas.',
                                            'Gestiona sus ritmos circadianos y descanso para asegurar un rendimiento cognitivo óptimo.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Reglas de oro</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Responde con hechos: “el martes en reunión X hice Y”, no “soy una persona que…”.',
                                            'Si no tienes evidencia, escribe: “No tengo evidencia reciente” y eso ya es un hallazgo.',
                                            'No busques quedar bien: este workbook es para desarrollarte, no para evaluarte socialmente.'
                                        ].map((item) => (
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
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 11"
                                data-print-title="Mapa de detonantes emocionales"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Mapa de detonantes emocionales</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Detectar qué te activa, cómo lo sientes en el cuerpo, qué haces y qué impacto genera, para intervenir antes de reaccionar.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Conceptos eje</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Detonante: evento o estímulo que activa una respuesta significativa en el contexto del liderazgo y desarrollo personal.',
                                            'Reactividad: respuesta impulsiva observable (tono, interrupción, cierre, control excesivo, ironía, evasión).',
                                            'Regulación emocional: capacidad de gestionar y modificar las propias emociones para responder de manera reflexiva en lugar de impulsiva, especialmente en situaciones de crisis.',
                                            'Señal corporal temprana: el primer síntoma físico que aparece antes de reaccionar (mandíbula tensa, pecho apretado, respiración corta).'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 1. Bitácora (mínimo 7 eventos)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700">Registra eventos reales de los últimos 30 días con hechos observables:</p>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                                <p className="text-xs uppercase tracking-[0.12em] text-emerald-700 font-semibold">Ejemplos de hecho (bien)</p>
                                                <ul className="mt-2 space-y-1.5 text-sm text-emerald-900">
                                                    <li>• “Me interrumpieron 3 veces en la reunión.”</li>
                                                    <li>• “Me cambiaron la prioridad a última hora sin explicación.”</li>
                                                    <li>• “Cuestionaron mi propuesta frente al equipo.”</li>
                                                </ul>
                                            </article>
                                            <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                                <p className="text-xs uppercase tracking-[0.12em] text-rose-700 font-semibold">Ejemplos de opinión (evitar)</p>
                                                <ul className="mt-2 space-y-1.5 text-sm text-rose-900">
                                                    <li>• “Me faltaron al respeto.”</li>
                                                    <li>• “Fue injusto.”</li>
                                                    <li>• “No les importó.”</li>
                                                </ul>
                                            </article>
                                        </div>
                                        <p className="text-sm text-slate-700">
                                            Luego, clasifica cada evento anterior con <span className="font-semibold text-slate-900">1 detonante principal</span> (el más fuerte):
                                        </p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-700">
                                            {[
                                                'Crítica / cuestionamiento público',
                                                'Urgencias y presión de tiempo',
                                                'Ambigüedad / falta de claridad',
                                                'Pérdida de control / incertidumbre',
                                                'Injusticia / falta de reconocimiento',
                                                'Conflicto interpersonal',
                                                'Falta de compromiso del equipo',
                                                'Cansancio / sobrecarga'
                                            ].map((item) => (
                                                <li key={`step1-trigger-${item}`}>• {item}</li>
                                            ))}
                                        </ul>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowBitacoraExample((current) => !current)}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                {showBitacoraExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                            </button>
                                        </div>
                                        {showBitacoraExample && (
                                            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">
                                                <p><span className="font-semibold text-slate-900">Fecha:</span> 12 mar</p>
                                                <p><span className="font-semibold text-slate-900">Hecho:</span> “Cuestionaron mi propuesta en público y me interrumpieron.”</p>
                                                <p><span className="font-semibold text-slate-900">Emoción:</span> irritación 8/10</p>
                                                <p><span className="font-semibold text-slate-900">Señal:</span> mandíbula tensa + calor en el pecho</p>
                                                <p><span className="font-semibold text-slate-900">Respuesta:</span> subí el tono, interrumpí y cerré la decisión</p>
                                                <p><span className="font-semibold text-slate-900">Impacto:</span> el equipo dejó de opinar; quedó tensión</p>
                                                <p className="mt-1"><span className="font-semibold text-slate-900">Detonante:</span> Crítica / cuestionamiento público</p>
                                            </article>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {state.bitacora.map((event, index) => {
                                            const isEditing = bitacoraEditModes[index]
                                            const isComplete = isBitacoraEventComplete(event)
                                            const showSuggestion = hasJudgementWords(event.situation)

                                            return (
                                                <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-sm md:text-base font-bold text-slate-900">Evento {index + 1}</h4>
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
                                                            onClick={() => editBitacoraEvent(index)}
                                                            disabled={isLocked || isEditing}
                                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveBitacoraEvent(index)}
                                                            disabled={isLocked || !isEditing}
                                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Guardar cambios
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <label className="space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Fecha</span>
                                                            <input
                                                                type="date"
                                                                value={event.date}
                                                                onChange={(e) => setBitacoraEventField(index, 'date', e.target.value)}
                                                                disabled={isLocked || !isEditing}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            />
                                                        </label>
                                                        <label className="space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Persona/actor</span>
                                                            <input
                                                                type="text"
                                                                value={event.actor}
                                                                onChange={(e) => setBitacoraEventField(index, 'actor', e.target.value)}
                                                                disabled={isLocked || !isEditing}
                                                                placeholder="Quién estuvo involucrado"
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            />
                                                        </label>
                                                    </div>

                                                    <label className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Situación (hecho)</span>
                                                        <textarea
                                                            value={event.situation}
                                                            onChange={(e) => setBitacoraEventField(index, 'situation', e.target.value)}
                                                            disabled={isLocked || !isEditing}
                                                            className="w-full min-h-[78px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            placeholder="Describe qué pasó sin interpretación"
                                                        />
                                                    </label>

                                                    {showSuggestion && (
                                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                                            Sugerencia: reescribe como hecho observable, evitando juicios (ej. “injusto”, “irrespetuoso”).
                                                        </p>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <label className="space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Emoción (0-10)</span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={10}
                                                                value={event.emotion}
                                                                onChange={(e) => setBitacoraEventField(index, 'emotion', e.target.value)}
                                                                disabled={isLocked || !isEditing}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            />
                                                        </label>
                                                        <label className="space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal corporal</span>
                                                            <input
                                                                type="text"
                                                                value={event.bodySignal}
                                                                onChange={(e) => setBitacoraEventField(index, 'bodySignal', e.target.value)}
                                                                disabled={isLocked || !isEditing}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                                placeholder="Ej: mandíbula tensa"
                                                            />
                                                        </label>
                                                    </div>

                                                    <label className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Respuesta (conducta)</span>
                                                        <input
                                                            type="text"
                                                            value={event.response}
                                                            onChange={(e) => setBitacoraEventField(index, 'response', e.target.value)}
                                                            disabled={isLocked || !isEditing}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            placeholder="Qué hiciste o dijiste"
                                                        />
                                                    </label>

                                                    <label className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Impacto</span>
                                                        <input
                                                            type="text"
                                                            value={event.impact}
                                                            onChange={(e) => setBitacoraEventField(index, 'impact', e.target.value)}
                                                            disabled={isLocked || !isEditing}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            placeholder="Efecto en otros / en ti"
                                                        />
                                                    </label>

                                                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-3">
                                                        <label className="space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Detonante principal</span>
                                                            <select
                                                                value={event.trigger}
                                                                onChange={(e) => setBitacoraEventField(index, 'trigger', e.target.value)}
                                                                disabled={isLocked || !isEditing}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                            >
                                                                <option value="">Selecciona un detonante</option>
                                                                {TRIGGER_OPTIONS.map((option) => (
                                                                    <option key={`${event.id}-${option.id}`} value={option.id}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label className="space-y-1">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Nota</span>
                                                            <input
                                                                type="text"
                                                                value={event.triggerNote}
                                                                onChange={(e) => setBitacoraEventField(index, 'triggerNote', e.target.value)}
                                                                disabled={isLocked || !isEditing}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                                placeholder="Opcional"
                                                            />
                                                        </label>
                                                    </div>
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 2. Matriz Frecuencia × Intensidad</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <div className="space-y-2 text-sm text-slate-700">
                                        <p><span className="font-semibold text-slate-900">Cuenta:</span></p>
                                        <p>• Frecuencia: cuántas veces aparece cada detonante.</p>
                                        <p>• Intensidad promedio: promedio de emoción 0–10.</p>
                                        <p className="pt-1"><span className="font-semibold text-slate-900">Completa:</span></p>
                                        <p>• Respuesta típica: lo que sueles hacer cuando aparece ese detonante. Debe ser conducta observable, en 1 línea.</p>
                                        <p>• Costo típico: lo que pierdes cuando repites esa respuesta. Debe ser impacto (en resultados, relaciones, equipo o energía) en 1 línea.</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowMatrixExample((current) => !current)}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            {showMatrixExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                        </button>
                                    </div>
                                    {showMatrixExample && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3 text-sm text-slate-800">
                                            <div>
                                                <p className="font-semibold text-slate-900">Detonante: Crítica / cuestionamiento público</p>
                                                <p className="mt-1"><span className="font-semibold text-slate-900">Respuesta típica (1 línea):</span> “Me defiendo, subo el tono y cierro la conversación sin hacer preguntas.”</p>
                                                <p className="mt-1"><span className="font-semibold text-slate-900">Costo típico (1 línea):</span> “Baja la confianza y la participación; el equipo evita debatir y la decisión pierde calidad.”</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">Detonante: Ambigüedad / falta de claridad</p>
                                                <p className="mt-1"><span className="font-semibold text-slate-900">Respuesta típica:</span> “Entro en control: pido más detalles, retraso la decisión y asumo tareas yo.”</p>
                                                <p className="mt-1"><span className="font-semibold text-slate-900">Costo típico:</span> “Pierdo foco y tiempo; crece la sobrecarga y el equipo queda dependiente.”</p>
                                            </div>
                                        </article>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Detonante</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300"># veces (30 días)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Intensidad promedio (0-10)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Respuesta típica</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Costo típico</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {triggerSummaries.map((summary) => (
                                                    <tr key={`summary-${summary.id}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-200">{summary.label}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">{summary.frequency}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">{summary.intensityAverage.toFixed(1)}</td>
                                                        <td className="p-2 border-b border-slate-200">
                                                            <input
                                                                type="text"
                                                                value={summary.responseTypical}
                                                                onChange={(e) => setTriggerAnnotationField(summary.id, 'responseTypical', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                                placeholder="1 línea"
                                                            />
                                                        </td>
                                                        <td className="p-2 border-b border-slate-200">
                                                            <input
                                                                type="text"
                                                                value={summary.costTypical}
                                                                onChange={(e) => setTriggerAnnotationField(summary.id, 'costTypical', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-100"
                                                                placeholder="1 línea"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 3. Heatmap 2×2 + detonante prioritario</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <div className="space-y-1.5 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Ubica tus detonantes en el mapa:</p>
                                        <p>• Eje X: Frecuencia (baja → alta).</p>
                                        <p>• Eje Y: Intensidad (baja → alta).</p>
                                        <p>
                                            Tu detonante prioritario es el que quede en
                                            <span className="font-semibold text-slate-900"> alta frecuencia + alta intensidad</span> (cuadrante superior derecho).
                                        </p>
                                        <p>Selecciónalo en “Detonante prioritario” y completa estos campos (1 línea cada uno):</p>
                                        <p>• Señal corporal temprana: primer aviso físico (ej.: mandíbula tensa).</p>
                                        <p>• Emoción típica + intensidad: emoción + 0–10 (ej.: irritación 8/10).</p>
                                        <p>• Respuesta típica: lo que sueles hacer (conducta observable).</p>
                                        <p>• Costo típico: lo que pierdes (impacto en equipo/resultado/energía).</p>
                                        <p className="font-semibold text-slate-900">Haz clic en Guardar página 3.</p>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
                                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="relative mx-auto h-64 w-64 border border-slate-300 bg-white">
                                                <div className="absolute left-2 top-2 text-[10px] font-semibold text-slate-500">Y: Intensidad ↑</div>
                                                <div className="absolute right-2 bottom-2 text-[10px] font-semibold text-slate-500">X: Frecuencia →</div>
                                                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-300" />
                                                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-300" />
                                                {triggerSummaries
                                                    .filter((summary) => summary.frequency > 0)
                                                    .map((summary) => {
                                                        const left = Math.max(12, Math.min(88, 12 + (summary.frequency / maxFrequency) * 76))
                                                        const bottom = Math.max(12, Math.min(88, 12 + (summary.intensityAverage / 10) * 76))
                                                        const alignRight = left >= 66
                                                        const alignBelow = bottom >= 74
                                                        return (
                                                            <div
                                                                key={`heat-${summary.id}`}
                                                                className="absolute"
                                                                style={{ left: `${left}%`, bottom: `${bottom}%`, transform: 'translate(-50%, 50%)' }}
                                                            >
                                                                <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-white shadow" />
                                                                <p
                                                                    className={`absolute max-w-[110px] text-[10px] font-semibold text-slate-700 leading-tight ${
                                                                        alignRight ? 'right-0 text-right' : 'left-0 text-left'
                                                                    } ${alignBelow ? 'top-3' : 'bottom-3'}`}
                                                                >
                                                                    {summary.label}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                            <div className="mt-3 flex justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                                                <span>Frecuencia baja → alta</span>
                                                <span>Intensidad baja → alta</span>
                                            </div>
                                        </article>

                                        <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Detonante prioritario</span>
                                                <div className="space-y-2">
                                                    {triggerSummaries.filter((summary) => summary.frequency > 0).map((summary) => (
                                                        <label key={`priority-${summary.id}`} className="flex items-center gap-2 text-sm text-slate-700">
                                                            <input
                                                                type="radio"
                                                                name="wb2-priority-trigger"
                                                                checked={state.priorityTrigger === summary.id}
                                                                onChange={() => setPriorityTrigger(summary.id)}
                                                                disabled={isLocked}
                                                            />
                                                            <span>{summary.label}</span>
                                                        </label>
                                                    ))}
                                                    {triggerSummaries.every((summary) => summary.frequency === 0) && (
                                                        <p className="text-sm text-slate-500">Completa la bitácora para habilitar esta selección.</p>
                                                    )}
                                                </div>
                                            </label>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal corporal temprana</span>
                                                    <input
                                                        type="text"
                                                        value={state.priorityCard.earlySignal}
                                                        onChange={(e) => setPriorityCardField('earlySignal', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Emoción típica + intensidad</span>
                                                    <input
                                                        type="text"
                                                        value={state.priorityCard.typicalEmotion}
                                                        onChange={(e) => setPriorityCardField('typicalEmotion', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Respuesta típica</span>
                                                    <input
                                                        type="text"
                                                        value={state.priorityCard.typicalResponse}
                                                        onChange={(e) => setPriorityCardField('typicalResponse', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Costo típico</span>
                                                    <input
                                                        type="text"
                                                        value={state.priorityCard.typicalCost}
                                                        onChange={(e) => setPriorityCardField('typicalCost', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                            </div>
                                        </article>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveTriggerMapModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 3
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 11"
                                data-print-title="Narrativa de desafío emocional"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Narrativa de desafío emocional</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Convertir tu detonante prioritario en un caso de liderazgo para rediseñar tu conducta.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                                        <p className="font-semibold text-slate-900">1. Elige un evento de tu bitácora que:</p>
                                        <p>• pertenezca al detonante prioritario, y</p>
                                        <p>• haya tenido alto costo (relación, clima, resultado o energía).</p>
                                        <p className="pt-1 font-semibold text-slate-900">2. Luego, completa el caso.</p>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowNarrativeExample((current) => !current)}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            {showNarrativeExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                        </button>
                                    </div>

                                    {showNarrativeExample && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800 space-y-2">
                                            <p><span className="font-semibold text-slate-900">Detonante prioritario:</span> Crítica / cuestionamiento público</p>
                                            <p className="font-semibold text-slate-900 pt-1">Evento elegido (de la bitácora):</p>
                                            <p><span className="font-semibold text-slate-900">Fecha:</span> 12 mar</p>
                                            <p><span className="font-semibold text-slate-900">Hecho:</span> “En reunión semanal, un colega cuestionó mi propuesta frente al equipo y me interrumpió dos veces.”</p>
                                            <p><span className="font-semibold text-slate-900">Por qué es representativo:</span> Pertenece al detonante prioritario (crítica pública). Tuvo alto costo: el equipo se silenció, quedó tensión y la decisión perdió calidad.</p>
                                            <p><span className="font-semibold text-slate-900">Contexto (dónde, con quién, objetivo):</span> Reunión semanal de seguimiento (virtual) con 7 personas del equipo. Objetivo: definir el plan y responsables de la semana.</p>
                                            <p><span className="font-semibold text-slate-900">Hecho detonante (observable):</span> Un colega dijo “esa propuesta no es realista” y me interrumpió mientras explicaba el plan.</p>
                                            <p><span className="font-semibold text-slate-900">Interpretación automática (“qué me dije”):</span> “Me está desautorizando delante del equipo; si no respondo fuerte, pierdo autoridad.”</p>
                                            <p><span className="font-semibold text-slate-900">Emoción dominante + intensidad (0–10):</span> Irritación 8/10.</p>
                                            <p><span className="font-semibold text-slate-900">Impulso (qué quería hacer):</span> Imponer mi punto y cortar el cuestionamiento de inmediato.</p>
                                            <p><span className="font-semibold text-slate-900">Conducta real (tono/cuerpo/palabras):</span> Subí el tono, interrumpí de vuelta y cerré la decisión sin hacer preguntas (“Ya está definido, sigamos”).</p>
                                            <p><span className="font-semibold text-slate-900">Impacto (en otros y resultado):</span> El equipo dejó de participar; dos personas no volvieron a opinar. La decisión se tomó rápido, pero luego hubo retrabajo porque no se consideraron riesgos.</p>
                                            <p><span className="font-semibold text-slate-900">Costo (si lo repito):</span> Se deteriora la confianza y el equipo evita debatir; baja calidad de decisiones y aumenta el retrabajo.</p>
                                            <p><span className="font-semibold text-slate-900">Aprendizaje (qué reveló de mí):</span> Cuando siento crítica pública, confundo cuestionamiento con ataque y respondo desde control, no desde liderazgo.</p>
                                            <p><span className="font-semibold text-slate-900">Respuesta alternativa ideal (observable):</span> Pausa 2 segundos + activo ancla + hago 1 pregunta (“¿Qué parte específica ves inviable y con qué dato?”) + resumo (“Entiendo que te preocupa X”) + decido con criterio (“Si X ocurre, hacemos Y; si no, seguimos con Z”).</p>
                                            <p className="pt-1"><span className="font-semibold text-slate-900">Mini-ABC (1 línea):</span> A: “Cuestionaron mi propuesta en público” | B: “Me desautorizan; debo imponerme” | C: irritación 8/10 + “subí tono y cerré sin preguntas”.</p>
                                        </article>
                                    )}

                                    <label className="block space-y-1">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Evento representativo de bitácora</span>
                                        <select
                                            value={state.narrative.eventId}
                                            onChange={(e) => setNarrativeField('eventId', e.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                        >
                                            <option value="">Selecciona un evento</option>
                                            {state.bitacora
                                                .filter((event) => event.trigger === state.priorityTrigger || state.priorityTrigger === '')
                                                .map((event, index) => (
                                                    <option key={`narrative-event-${event.id}`} value={event.id}>
                                                        Evento {index + 1} · {event.date || 'Sin fecha'} · {event.trigger ? TRIGGER_OPTIONS.find((option) => option.id === event.trigger)?.label : 'Sin detonante'}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>

                                    {selectedNarrativeEvent && (
                                        <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Hecho detonante (observable):</span> {selectedNarrativeEvent.situation}</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Emoción dominante + intensidad (0–10):</span> {selectedNarrativeEvent.emotion || '0'}/10</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Señal corporal:</span> {selectedNarrativeEvent.bodySignal || 'Sin registro'}</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Conducta real:</span> {selectedNarrativeEvent.response || 'Sin registro'}</p>
                                            <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Impacto (en otros y resultado):</span> {selectedNarrativeEvent.impact || 'Sin registro'}</p>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Contexto (dónde, con quién, objetivo)</span>
                                            <textarea
                                                value={state.narrative.context}
                                                onChange={(e) => setNarrativeField('context', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="Dónde, con quién y objetivo"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Interpretación automática (“qué me dije”)</span>
                                            <textarea
                                                value={state.narrative.interpretation}
                                                onChange={(e) => setNarrativeField('interpretation', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="Qué te dijiste en ese momento"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Impulso (qué quería hacer)</span>
                                            <textarea
                                                value={state.narrative.impulse}
                                                onChange={(e) => setNarrativeField('impulse', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="Qué querías hacer"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Conducta real (tono/cuerpo/palabras)</span>
                                            <textarea
                                                value={state.narrative.realBehavior}
                                                onChange={(e) => setNarrativeField('realBehavior', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="Tono, cuerpo, palabras"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Costo (si lo repito)</span>
                                            <textarea
                                                value={state.narrative.costRepeat}
                                                onChange={(e) => setNarrativeField('costRepeat', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Aprendizaje (qué reveló de mí)</span>
                                            <textarea
                                                value={state.narrative.learning}
                                                onChange={(e) => setNarrativeField('learning', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                    </div>

                                    <label className="space-y-1 block">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Respuesta alternativa ideal (observable)</span>
                                        <textarea
                                            value={state.narrative.alternativeResponse}
                                            onChange={(e) => setNarrativeField('alternativeResponse', e.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[110px] rounded-xl border-2 border-blue-300 bg-blue-50/40 px-3 py-2 text-sm text-slate-900"
                                            placeholder="Describe la alternativa concreta: pausa, pregunta, resumen y decisión"
                                        />
                                    </label>

                                    <label className="space-y-1 block">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mini-ABC (1 línea)</span>
                                        <input
                                            type="text"
                                            value={state.narrative.miniABC}
                                            onChange={(e) => setNarrativeField('miniABC', e.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            placeholder='A: ____ | B: "____" | C: emoción __/10 + acción ____'
                                        />
                                    </label>

                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={copyAlternativeToNextModules}
                                            disabled={isLocked || state.narrative.alternativeResponse.trim().length === 0}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Copiar alternativa a Ancla y Kit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveNarrativeModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 4
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 11"
                                data-print-title="Ancla de seguridad"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Ancla de seguridad</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Crear una señal que active calma bajo presión: estado + disparador físico + palabra + exhalación.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Conceptos eje</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Ancla de serenidad: práctica que te ayuda a mantener calma y enfoque en estrés o incertidumbre. Es un vínculo intencional entre un estado (serenidad) y un disparador físico (gesto + respiración + palabra clave).',
                                            'Estado: tu condición interna (calma, tensión, irritación).',
                                            'Disparador físico: un gesto pequeño (pulgar–índice, tocar reloj, pies firmes).',
                                            'Señal temprana corporal: tu primer aviso físico de activación (mandíbula tensa, pecho apretado).',
                                            'Palabra clave: 1–2 palabras que refuerzan el estado (“Pausa”, “Calma firme”, “Serenidad”).',
                                            'Criterio de utilidad: el ancla sirve si te ayuda a bajar intensidad y mantener conducta ejecutiva (no perder presencia).'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Diseño del ancla</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Gesto elegido</span>
                                            <select
                                                value={state.anchor.gesturePreset}
                                                onChange={(e) => setGesturePreset(e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                {GESTURE_OPTIONS.map((option) => (
                                                    <option key={`gesture-${option.value}`} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {state.anchor.gesturePreset === 'other' && (
                                                <input
                                                    type="text"
                                                    value={state.anchor.gesture}
                                                    onChange={(e) => setAnchorField('gesture', e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder="Especifica tu gesto"
                                                />
                                            )}
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Palabra clave (1-2 palabras)</span>
                                            <input
                                                type="text"
                                                value={state.anchor.keyword}
                                                onChange={(e) => setAnchorField('keyword', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal corporal temprana</span>
                                            <select
                                                value={state.anchor.earlySignalPreset}
                                                onChange={(e) => setEarlySignalPreset(e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                {EARLY_SIGNAL_OPTIONS.map((option) => (
                                                    <option key={`signal-${option.value}`} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {state.anchor.earlySignalPreset === 'other' && (
                                                <input
                                                    type="text"
                                                    value={state.anchor.earlySignal}
                                                    onChange={(e) => setAnchorField('earlySignal', e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder="Especifica tu señal corporal"
                                                />
                                            )}
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Situación concreta para usarla</span>
                                            <input
                                                type="text"
                                                value={state.anchor.useContext}
                                                onChange={(e) => setAnchorField('useContext', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                    </div>

                                    <label className="space-y-1 block">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Conducta que quiero proteger</span>
                                        <textarea
                                            value={state.anchor.protectedBehavior}
                                            onChange={(e) => setAnchorField('protectedBehavior', e.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            placeholder="Ej: tono estable, escuchar antes de responder"
                                        />
                                    </label>
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Emparejamiento + prueba (checklist)</h3>
                                    <p className="text-sm text-slate-700">
                                        <span className="font-semibold text-slate-900">Objetivo:</span> entrenar el vínculo “calma → gesto → palabra” y verificar que funciona.
                                    </p>

                                    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                        <p className="text-sm font-semibold text-slate-900">Emparejamiento (5 ciclos)</p>
                                        <p className="text-sm text-slate-700">Repite 5 veces el mismo mini-proceso:</p>
                                        <ul className="space-y-1.5 text-sm text-slate-700">
                                            <li>• Inhala suave.</li>
                                            <li>• Exhala lento 4–6 segundos.</li>
                                            <li>• Haz el gesto.</li>
                                            <li>• Di mentalmente la palabra clave.</li>
                                        </ul>
                                        <p className="text-sm text-slate-700">Marca: ☐1 ☐2 ☐3 ☐4 ☐5</p>
                                        <div className="flex flex-wrap gap-3">
                                            {state.anchor.cycles.map((checked, index) => (
                                                <label key={`anchor-cycle-${index}`} className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => setAnchorField('cycles', e.target.checked, index)}
                                                        disabled={isLocked}
                                                    />
                                                    <span>Ciclo {index + 1}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-sm font-semibold text-emerald-700">✅ Señal de que va bien:</p>
                                        <ul className="space-y-1.5 text-sm text-emerald-800">
                                            <li>• El cuerpo afloja un poco.</li>
                                            <li>• La respiración se alarga.</li>
                                            <li>• Baja la urgencia de “responder ya”.</li>
                                        </ul>
                                    </article>

                                    <article className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-sm font-semibold text-slate-900 mb-2">Prueba con detonante leve (test)</p>
                                        <ul className="mb-3 space-y-1.5 text-sm text-slate-700">
                                            <li>• Piensa 5 segundos en un detonante leve (no el más fuerte).</li>
                                            <li>• Puntúa tu intensidad antes (0–10).</li>
                                            <li>• Activa el ancla (gesto + palabra + exhalación) 2 veces.</li>
                                            <li>• Puntúa tu intensidad después (0–10).</li>
                                        </ul>
                                        <p className="text-sm font-semibold text-emerald-700 mb-3">✅ Debe bajar al menos 2 puntos (ej.: antes 7/10 → después 5/10).</p>
                                        <div className="flex justify-end mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowAnchorTestExample((current) => !current)}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                {showAnchorTestExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                            </button>
                                        </div>
                                        {showAnchorTestExample && (
                                            <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-3 text-sm text-slate-800">
                                                <p><span className="font-semibold text-slate-900">Emparejamiento:</span> ☑1 ☑2 ☑3 ☑4 ☑5</p>
                                                <p><span className="font-semibold text-slate-900">Prueba:</span> Antes 6/10 · Después 4/10 · ¿Bajó ≥2?: ☑ Sí</p>
                                            </article>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Intensidad antes (0-10)</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={10}
                                                    value={state.anchor.beforeIntensity}
                                                    onChange={(e) => setAnchorField('beforeIntensity', e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Intensidad después (0-10)</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={10}
                                                    value={state.anchor.afterIntensity}
                                                    onChange={(e) => setAnchorField('afterIntensity', e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </label>
                                        </div>
                                        {anchorDelta !== null && (
                                            <p className={`mt-3 text-sm font-semibold ${anchorDelta >= 2 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                Cambio de intensidad: {anchorDelta >= 0 ? `-${anchorDelta}` : `+${Math.abs(anchorDelta)}`} puntos.
                                                {anchorDelta >= 2 ? ' Cumple criterio mínimo (baja ≥ 2).' : ' Repite 5 ciclos y vuelve a probar.'}
                                            </p>
                                        )}
                                        <p className="mt-3 text-sm text-slate-700">
                                            Importante: si eliges un detonante demasiado fuerte, puede no bajar 2 puntos al inicio. Por eso empezamos con uno leve.
                                        </p>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Plan de uso real (“Si–Entonces”)</h3>
                                    <p className="text-sm text-slate-700">
                                        <span className="font-semibold text-slate-900">Objetivo:</span> convertir tu ancla en una acción automática.
                                        Las reglas “Si–Entonces” son clave para usar el ancla en el mundo real.
                                    </p>

                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                        <p className="text-sm font-semibold text-slate-900">Regla 1 (señal corporal)</p>
                                        <p className="text-sm text-slate-700">Si siento ______ (alarma), entonces activo mi ancla durante ____ segundos.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal corporal (alarma)</span>
                                                <select
                                                    value={state.anchor.earlySignalPreset}
                                                    onChange={(e) => setEarlySignalPreset(e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                >
                                                    <option value="">Selecciona una opción</option>
                                                    {EARLY_SIGNAL_OPTIONS.map((option) => (
                                                        <option key={`rule1-signal-${option.value}`} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {state.anchor.earlySignalPreset === 'other' && (
                                                    <input
                                                        type="text"
                                                        value={state.anchor.earlySignal}
                                                        onChange={(e) => setAnchorField('earlySignal', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        placeholder="Especifica la señal corporal"
                                                    />
                                                )}
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Duración (segundos)</span>
                                                <input
                                                    type="text"
                                                    value={state.anchor.rule1Seconds}
                                                    onChange={(e) => setAnchorField('rule1Seconds', e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder="Ej: 10"
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-600">Ejemplo: Si siento mandíbula tensa, entonces activo mi ancla durante 10 segundos.</p>
                                    </article>

                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                        <p className="text-sm font-semibold text-slate-900">Regla 2 (contexto)</p>
                                        <p className="text-sm text-slate-700">Si entro a ______ (contexto), entonces activo mi ancla antes de hablar.</p>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Contexto</span>
                                            <input
                                                type="text"
                                                value={state.anchor.useContext}
                                                onChange={(e) => setAnchorField('useContext', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="Ej: reunión con dirección"
                                            />
                                        </label>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowAnchorRulesExample((current) => !current)}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                {showAnchorRulesExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                            </button>
                                        </div>
                                        {showAnchorRulesExample && (
                                            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800">
                                                Ejemplo: Si entro a reunión con dirección, entonces activo mi ancla antes de hablar.
                                            </p>
                                        )}
                                    </article>

                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                        <p className="text-sm font-semibold text-slate-900">Regla 3 (evento social típico)</p>
                                        <p className="text-sm text-slate-700">Si me cuestionan en público, entonces ancla + 1 pregunta antes de responder.</p>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Pregunta que usarás</span>
                                            <input
                                                type="text"
                                                value={state.anchor.rule3Question}
                                                onChange={(e) => setAnchorField('rule3Question', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder='Ej: ¿Qué parte específica te preocupa?'
                                            />
                                        </label>
                                        <p className="text-xs text-emerald-700 font-semibold">✅ Clave: esta regla protege tu conducta de líder (no reaccionar).</p>
                                    </article>

                                    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                                        <p className="text-sm font-semibold text-slate-900">Ejemplo de Plantilla C (ilustración)</p>
                                        <p className="text-sm text-slate-700">• Si siento pecho apretado, entonces activo mi ancla durante 10 segundos.</p>
                                        <p className="text-sm text-slate-700">• Si entro a una reunión tensa, entonces activo mi ancla antes de hablar.</p>
                                        <p className="text-sm text-slate-700">• Si me cuestionan en público, entonces ancla + 1 pregunta antes de responder.</p>
                                    </article>

                                    <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                                        <p className="text-sm font-semibold text-emerald-800">¿Cómo sabes que lo hiciste bien?</p>
                                        <p className="text-sm text-emerald-900">Tu ancla está bien diseñada si:</p>
                                        <p className="text-sm text-emerald-900">• puedes ejecutarla sin que se note;</p>
                                        <p className="text-sm text-emerald-900">• recuerdas gesto + palabra sin esfuerzo;</p>
                                        <p className="text-sm text-emerald-900">• en la prueba, bajas ≥2 puntos;</p>
                                        <p className="text-sm text-emerald-900">• tienes 3 reglas “Si–Entonces” listas para usar.</p>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveAnchorModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 5
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 11"
                                data-print-title="Kit de regulación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Kit de regulación</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Construir tu sistema en 3 capas: tiempo real, recuperación y mantenimiento.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-3">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">¿Cómo funciona?</h3>
                                    <p className="text-sm text-slate-700">1. Tiempo real (10–30s): evitas que la emoción se convierta en reacción.</p>
                                    <p className="text-sm text-slate-700">2. Recuperación (3–10 min): vuelves a tu línea base después del evento.</p>
                                    <p className="text-sm text-slate-700">3. Mantenimiento (diario/semanal): subes tu umbral para activarte menos.</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Tu kit funciona si: detectas señal → aplicas técnica → sostienes conducta ejecutiva (tono, escucha, claridad).
                                    </p>
                                </section>

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    <article className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-4 space-y-2">
                                        <h4 className="text-sm font-bold text-slate-900">CAPA 1 — TIEMPO REAL (10–30 segundos)</h4>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Objetivo:</span> cortar la reactividad antes de escalar.</p>
                                        <p className="text-sm text-slate-700">Técnicas: STOP (micro-pausa), etiquetado emocional y ancla de serenidad/seguridad.</p>
                                        <p className="text-xs text-slate-600">Errores comunes: aplicar tarde, etiquetar sin elegir conducta, activar el ancla después de explotar.</p>
                                    </article>
                                    <article className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-4 space-y-2">
                                        <h4 className="text-sm font-bold text-slate-900">CAPA 2 — RECUPERACIÓN (3–10 minutos)</h4>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Objetivo:</span> volver a línea base y no quedarte “pegado”.</p>
                                        <p className="text-sm text-slate-700">Técnicas: caminata sin pantalla, respiración 4-4-4-4, descarga escrita y conversación de reparación.</p>
                                        <p className="text-xs text-slate-600">Errores comunes: caminar con celular, hacer solo un ciclo, usar excusas o justificar.</p>
                                    </article>
                                    <article className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-4 space-y-2">
                                        <h4 className="text-sm font-bold text-slate-900">CAPA 3 — MANTENIMIENTO (diario/semanal)</h4>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Objetivo:</span> subir el umbral para activarte menos y recuperarte más rápido.</p>
                                        <p className="text-sm text-slate-700">Técnicas: sueño intencional, ejercicio 3× semana, journaling 5 min y agenda de pausas.</p>
                                        <p className="text-xs text-slate-600">Evidencia sugerida: conteos semanales, registros diarios y consistencia de hábitos.</p>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7 space-y-2">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cómo elegir tus 2 técnicas por capa (criterio contundente)</h3>
                                    <p className="text-sm text-slate-700">• Tiempo real: elige 2 que puedas aplicar sin que nadie lo note.</p>
                                    <p className="text-sm text-slate-700">• Recuperación: elige 2 que puedas hacer incluso cuando estés ocupado.</p>
                                    <p className="text-sm text-slate-700">• Mantenimiento: elige 2 que realmente puedas sostener toda la semana.</p>
                                </section>

                                {state.regulation.referenceAlternative.trim().length > 0 && (
                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">Referencia copiada desde Narrativa</p>
                                        <p className="text-sm text-slate-700 mt-1">{state.regulation.referenceAlternative}</p>
                                    </article>
                                )}

                                {regulationWarning && (
                                    <article className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                                        <p className="text-sm font-semibold text-amber-800">{regulationWarning}</p>
                                    </article>
                                )}

                                <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {(Object.keys(REGULATION_TECHNIQUES) as LayerKey[]).map((layerKey) => {
                                        const layer = state.regulation.layers[layerKey]
                                        const label =
                                            layerKey === 'realtime'
                                                ? 'Tiempo real (10-30s)'
                                                : layerKey === 'recovery'
                                                    ? 'Recuperación (3-10 min)'
                                                    : 'Mantenimiento (diario/semanal)'
                                        const isLayerComplete = layer.techniques.length === 2 && layer.whenToUse.trim().length > 0 && layer.signal.trim().length > 0

                                        return (
                                            <article key={layerKey} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-sm md:text-base font-bold text-slate-900">{label}</h3>
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                            isLayerComplete
                                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {isLayerComplete ? 'Completado' : 'Pendiente'}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-500">Elige máximo 2 técnicas.</p>
                                                <div className="space-y-2">
                                                    {REGULATION_TECHNIQUES[layerKey].map((technique) => {
                                                        const checked = layer.techniques.includes(technique.id)
                                                        const disabled = isLocked || (!checked && layer.techniques.length >= 2)
                                                        const guide = REGULATION_TECHNIQUE_GUIDES[technique.id]
                                                        const needsAnchorWarning =
                                                            layerKey === 'realtime' && technique.id === 'anchor' && !anchorReadyForRealtimeTechnique
                                                        return (
                                                            <div key={`${layerKey}-${technique.id}`} className="rounded-lg border border-slate-200 bg-white p-2">
                                                                <label className="flex items-start gap-2 text-sm text-slate-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        disabled={disabled}
                                                                        onChange={() => toggleLayerTechnique(layerKey, technique.id)}
                                                                    />
                                                                    <span>{technique.label}</span>
                                                                </label>
                                                                {needsAnchorWarning && (
                                                                    <p className="mt-1 text-xs text-amber-700">Completa tu Ancla primero o elige otra técnica.</p>
                                                                )}
                                                                {guide && (
                                                                    <details className="mt-2 text-xs text-slate-600">
                                                                        <summary className="cursor-pointer font-semibold text-blue-700">¿Cómo se hace?</summary>
                                                                        <div className="mt-2 space-y-1.5">
                                                                            <p><span className="font-semibold text-slate-800">Duración:</span> {guide.duration}</p>
                                                                            <p className="font-semibold text-slate-800">Pasos:</p>
                                                                            <ol className="list-decimal pl-4 space-y-1">
                                                                                {guide.steps.map((step) => (
                                                                                    <li key={`${layerKey}-${technique.id}-${step}`}>{step}</li>
                                                                                ))}
                                                                            </ol>
                                                                            <p><span className="font-semibold text-slate-800">Ejemplo:</span> {guide.example}</p>
                                                                        </div>
                                                                    </details>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Cuándo la usaré</span>
                                                    <input
                                                        type="text"
                                                        value={layer.whenToUse}
                                                        onChange={(e) => setLayerField(layerKey, 'whenToUse', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal de activación</span>
                                                    <input
                                                        type="text"
                                                        value={layer.signal}
                                                        onChange={(e) => setLayerField(layerKey, 'signal', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                            </article>
                                        )
                                    })}
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Reglas SI-ENTONCES (3)</h3>
                                    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                                        <p className="text-sm font-semibold text-slate-900">Instrucciones</p>
                                        <p className="text-sm text-slate-700">
                                            Define 3 reglas operativas para usar tus técnicas en el mundo real.
                                            Cada regla debe escribirse así: <span className="font-semibold text-slate-900">Si [señal/contexto], entonces [técnica] durante [duración]</span>.
                                        </p>
                                        <ul className="space-y-1.5 text-sm text-slate-700">
                                            <li>• Regla 1: señal corporal temprana (alarma interna).</li>
                                            <li>• Regla 2: contexto predecible (antes de reunión, feedback, crisis).</li>
                                            <li>• Regla 3: evento social típico (cuestionamiento, tensión, urgencia).</li>
                                        </ul>
                                    </article>
                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                        <p className="text-sm font-semibold text-slate-900">Ejemplo</p>
                                        <p className="text-sm text-slate-800">• Si detecto mandíbula tensa, entonces aplico STOP durante 10s.</p>
                                        <p className="text-sm text-slate-800">• Si termino una reunión tensa, entonces hago caminata sin pantalla durante 5 min.</p>
                                        <p className="text-sm text-slate-800">• Si me cuestionan en público, entonces activo ancla + 1 pregunta durante 30s.</p>
                                    </article>
                                    <div className="space-y-3">
                                        {state.regulation.ifThenRules.map((rule, index) => (
                                            <div key={`if-then-${index}`} className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_130px] gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal</span>
                                                    <input
                                                        type="text"
                                                        value={rule.signal}
                                                        onChange={(e) => setIfThenRuleField(index, 'signal', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        placeholder="Si detecto..."
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Técnica</span>
                                                    <select
                                                        value={rule.technique}
                                                        onChange={(e) => setIfThenRuleField(index, 'technique', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    >
                                                        <option value="">Selecciona técnica</option>
                                                        {selectedTechniquesForRules.map((technique) => (
                                                            <option key={`rule-${index}-${technique.id}`} value={technique.id}>{technique.label}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="space-y-1">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Duración</span>
                                                    <select
                                                        value={rule.duration}
                                                        onChange={(e) => setIfThenRuleField(index, 'duration', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    >
                                                        <option value="">Selecciona</option>
                                                        {DURATION_OPTIONS.map((duration) => (
                                                            <option key={`rule-duration-${duration}`} value={duration}>{duration}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Guion de reparación (si hubo tensión)</h3>
                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                        <p className="text-sm font-semibold text-slate-900">Instrucciones</p>
                                        <p className="text-sm text-slate-700">
                                            Usa este guion cuando tu reacción haya afectado relación, clima o colaboración.
                                            Mantén el mensaje breve, concreto y sin drama.
                                        </p>
                                        <ul className="space-y-1.5 text-sm text-slate-700">
                                            <li>• Hecho: describe qué pasó (observable, sin justificar).</li>
                                            <li>• Impacto: nombra el efecto en la otra persona/equipo.</li>
                                            <li>• Reparación: define cómo corregirás la conducta.</li>
                                            <li>• Pedido: acuerda el siguiente paso concreto.</li>
                                        </ul>
                                        <p className="text-xs text-slate-600">
                                            Evita: “pero tú también…”, explicaciones largas o disculpas vacías sin cambio conductual.
                                        </p>
                                    </article>
                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                        <p className="text-sm font-semibold text-slate-900">Ejemplo</p>
                                        <p className="text-sm text-slate-800"><span className="font-semibold text-slate-900">Hecho:</span> “En la reunión te interrumpí dos veces.”</p>
                                        <p className="text-sm text-slate-800"><span className="font-semibold text-slate-900">Impacto:</span> “Corté tu aporte y el equipo perdió información útil.”</p>
                                        <p className="text-sm text-slate-800"><span className="font-semibold text-slate-900">Reparación:</span> “Quiero retomar tu punto completo ahora y resumirlo para el equipo.”</p>
                                        <p className="text-sm text-slate-800"><span className="font-semibold text-slate-900">Pedido:</span> “¿Te parece si tomamos 2 minutos para cerrarlo con claridad?”</p>
                                    </article>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Hecho</span>
                                            <textarea
                                                value={state.regulation.repair.fact}
                                                onChange={(e) => setRepairField('fact', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Impacto</span>
                                            <textarea
                                                value={state.regulation.repair.impact}
                                                onChange={(e) => setRepairField('impact', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Reparación</span>
                                            <textarea
                                                value={state.regulation.repair.repair}
                                                onChange={(e) => setRepairField('repair', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Pedido</span>
                                            <textarea
                                                value={state.regulation.repair.request}
                                                onChange={(e) => setRepairField('request', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveRegulationModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 6
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 11"
                                data-print-title="Habilidades actuales vs rol ideal"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Habilidades actuales vs rol ideal</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Comparar cómo reaccionas y te regulas hoy vs cómo exige tu rol que te comportes, para identificar brechas reales y no trabajar a ciegas.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">¿Qué vas a evaluar?</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            'Tono de voz, interrupciones y pausas.',
                                            'Capacidad de preguntar antes de responder.',
                                            'Recuperación después de conflicto.',
                                            'Pedir feedback sin defensividad.',
                                            'Sostener energía (sueño/recuperación) para no reaccionar por fatiga.'
                                        ].map((item) => (
                                            <p key={item} className="text-sm text-slate-700">• {item}</p>
                                        ))}
                                    </div>
                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                        <h4 className="text-sm font-bold text-slate-900">Conceptos eje</h4>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Rol ideal:</span> versión conductual del rol, no un título.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Habilidad:</span> capacidad observable y repetible (conducta).</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Actual (1–5):</span> cómo te comportas hoy bajo presión.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Ideal (1–5):</span> nivel que tu rol demanda.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Evidencia:</span> hecho reciente (últimos 30 días).</p>
                                    </article>
                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                        <h4 className="text-sm font-bold text-slate-900">Escala 1–5 (anclas)</h4>
                                        {([1, 2, 3, 4, 5] as const).map((key) => (
                                            <p key={`scale-${key}`} className="text-sm text-slate-700">
                                                <span className="font-semibold text-slate-900">{key}:</span> {SCALE_ANCHORS[key]}
                                            </p>
                                        ))}
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 1 — Define tu rol ideal</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                state.skillsGap.roleIdeal.trim().length > 0
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {state.skillsGap.roleIdeal.trim().length > 0 ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700">Responde en 1 frase: ¿Qué debe ser innegociable en mi presencia emocional como líder?</p>
                                    <label className="space-y-1 block">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi rol ideal (conducta innegociable) es:</span>
                                        <textarea
                                            value={state.skillsGap.roleIdeal}
                                            onChange={(e) => setSkillsRoleIdeal(e.target.value)}
                                            disabled={isLocked}
                                            className="w-full min-h-[96px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            placeholder="Ej.: Mantengo tono estable, pauso antes de responder y pregunto antes de decidir cuando hay tensión."
                                        />
                                    </label>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowRoleIdealHelp((current) => !current)}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            {showRoleIdealHelp ? 'Ocultar ayuda' : 'Ayuda'}
                                        </button>
                                    </div>
                                    {showRoleIdealHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                            <p className="text-sm font-semibold text-slate-900">Ejemplos buenos (conductuales)</p>
                                            <p className="text-sm text-slate-800">• “Mantengo tono estable, pauso antes de responder y pregunto antes de decidir cuando hay tensión.”</p>
                                            <p className="text-sm text-slate-800">• “Sostengo conversaciones difíciles sin subir el tono y hago reparación si hay impacto.”</p>
                                            <p className="text-sm text-slate-800">• “Bajo presión no cierro por control; escucho, clarifico y decido con criterios.”</p>
                                            <p className="text-sm font-semibold text-slate-900 pt-1">Ejemplos vagos (evitar)</p>
                                            <p className="text-sm text-slate-800">• “Ser mejor líder.”</p>
                                            <p className="text-sm text-slate-800">• “Ser calmado.”</p>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 2 — Completa la matriz (Actual vs Ideal + evidencia)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <p className="text-sm text-slate-700">
                                        Para cada habilidad marca tu nivel Actual (1–5), tu nivel Ideal (1–5) y escribe 1 evidencia reciente.
                                        Si no tienes evidencia, escribe <span className="font-semibold text-slate-900">“Completar”</span>.
                                    </p>
                                    {skillsAllLevelsEqual && (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            Sugerencia: actual e ideal son iguales en todas las filas. ¿Tu rol realmente exige lo mismo que haces hoy?
                                        </p>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1100px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Habilidad (en conducta)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Actual (1–5)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Ideal (1–5)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Evidencia reciente (hecho, 1 línea)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.skillsGap.rows.map((row, index) => {
                                                    const rowGuide = SKILLS_GAP_DEFINITIONS[index]
                                                    const rowCompleted = row.current > 0 && row.ideal > 0 && row.evidence.trim().length > 0
                                                    const shouldSuggestEvidence = (row.current > 0 || row.ideal > 0) && row.evidence.trim().length === 0
                                                    return (
                                                        <tr key={`skills-row-${row.id}`} className="odd:bg-white even:bg-slate-50">
                                                            <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                <p className="text-sm font-semibold text-slate-900">{row.skill}</p>
                                                                {rowGuide && (
                                                                    <details className="mt-1 text-xs text-slate-600">
                                                                        <summary className="cursor-pointer font-semibold text-blue-700">Ver ayuda</summary>
                                                                        <div className="mt-2 space-y-1.5">
                                                                            <p><span className="font-semibold text-slate-800">Qué significa:</span> {rowGuide.meaning}</p>
                                                                            <p><span className="font-semibold text-slate-800">Ejemplo 1:</span> {rowGuide.examples[0]}</p>
                                                                            <p><span className="font-semibold text-slate-800">Ejemplo 2:</span> {rowGuide.examples[1]}</p>
                                                                        </div>
                                                                    </details>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {[1, 2, 3, 4, 5].map((level) => (
                                                                        <button
                                                                            key={`current-${row.id}-${level}`}
                                                                            type="button"
                                                                            title={SCALE_ANCHORS[level as Exclude<SkillRating, 0>]}
                                                                            onClick={() => setSkillsRowLevel(index, 'current', level as SkillRating)}
                                                                            disabled={isLocked}
                                                                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                                                                row.current === level
                                                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                        >
                                                                            {level}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {[1, 2, 3, 4, 5].map((level) => (
                                                                        <button
                                                                            key={`ideal-${row.id}-${level}`}
                                                                            type="button"
                                                                            title={SCALE_ANCHORS[level as Exclude<SkillRating, 0>]}
                                                                            onClick={() => setSkillsRowLevel(index, 'ideal', level as SkillRating)}
                                                                            disabled={isLocked}
                                                                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                                                                row.ideal === level
                                                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                        >
                                                                            {level}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                <input
                                                                    type="text"
                                                                    value={row.evidence}
                                                                    onChange={(e) => setSkillsRowEvidence(index, e.target.value)}
                                                                    disabled={isLocked}
                                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    placeholder="Ej.: 12 mar, reunión X: hice pausa y pregunté antes de decidir."
                                                                />
                                                                {shouldSuggestEvidence && (
                                                                    <p className="mt-1 text-xs text-amber-700">Sugerencia: escribe un hecho observable o “Completar”.</p>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                <span
                                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                                        rowCompleted
                                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                                    }`}
                                                                >
                                                                    {rowCompleted ? 'Completada' : 'Pendiente'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre rápido (1 minuto)</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={autofillSkillsClosureFromMatrix}
                                                disabled={isLocked}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Autocompletar 2 campos
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowSkillsClosureHelp((current) => !current)}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                {showSkillsClosureHelp ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                            </button>
                                        </div>
                                    </div>

                                    {showSkillsClosureHelp && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                            <p className="text-sm font-semibold text-slate-900">Cómo se autocompleta</p>
                                            <p className="text-sm text-slate-700">Fuerte: habilidad con mayor “Actual” y menor brecha (Ideal−Actual).</p>
                                            <p className="text-sm text-slate-700">Débil: habilidad con mayor brecha y menor “Actual”.</p>
                                            <p className="text-sm font-semibold text-slate-900 pt-1">Ejemplo</p>
                                            <p className="text-sm text-slate-700">Si “Regulo tono y corporalidad” tiene Actual 4 e Ideal 5, puede quedar como fuerte.</p>
                                            <p className="text-sm text-slate-700">Si “Sostengo energía y descanso” tiene Actual 2 e Ideal 5, puede quedar como débil.</p>
                                        </article>
                                    )}

                                    {(skillsClosureSuggestion.strongest || skillsClosureSuggestion.weakest) && (
                                        <p className="text-xs text-slate-600">
                                            Sugerencia desde Paso 2:
                                            {skillsClosureSuggestion.strongest ? ` fuerte: ${skillsClosureSuggestion.strongest};` : ''}
                                            {skillsClosureSuggestion.weakest ? ` débil: ${skillsClosureSuggestion.weakest}.` : ''}
                                        </p>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi habilidad más fuerte hoy</span>
                                            <input
                                                type="text"
                                                value={state.skillsGap.strongest}
                                                onChange={(e) => setSkillsClosureField('strongest', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder={skillsClosureSuggestion.strongest || 'Se puede autocompletar desde Paso 2'}
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi habilidad más débil (más costosa)</span>
                                            <input
                                                type="text"
                                                value={state.skillsGap.weakest}
                                                onChange={(e) => setSkillsClosureField('weakest', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder={skillsClosureSuggestion.weakest || 'Se puede autocompletar desde Paso 2'}
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Lo mínimo que debo sostener esta semana</span>
                                            <input
                                                type="text"
                                                value={state.skillsGap.weeklyMinimum}
                                                onChange={(e) => setSkillsClosureField('weeklyMinimum', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                skillsSectionComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {skillsSectionComplete
                                                ? `Sección completada (${skillsRowsCompleted}/6 filas completas)`
                                                : `Pendiente (${skillsRowsCompleted}/6 filas completas; mínimo 4)`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={saveSkillsGapModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 7
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 8 de 11"
                                data-print-title="Gap de habilidades"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 8</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Gap de habilidades</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Elegir con claridad qué 3 habilidades trabajar primero. No vas a mejorar todo a la vez: vas a priorizar
                                        lo que más impacta tu rol y donde tu brecha es mayor.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Conceptos eje</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Importancia (1–5):</span> qué tan crítica es esta habilidad para tu rol hoy.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Dominio actual (1–5):</span> tu nivel real (traído de la sección 5).</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">GAP:</span> diferencia entre lo que el rol exige y lo que hoy puedes sostener.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Fórmula:</span> GAP = Importancia − Dominio actual.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Interpretación:</span> 0–1 brecha baja, 2 brecha media, 3–4 brecha alta.</p>
                                        <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Prioridad:</span> combina Importancia alta (4–5) + GAP alto (≥2).</p>
                                    </div>
                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-slate-900">Anclas para Importancia</h4>
                                            <button
                                                type="button"
                                                onClick={() => setShowGapImportanceHelp((current) => !current)}
                                                className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                            >
                                                {showGapImportanceHelp ? 'Ocultar ayuda' : '¿Cómo puntuar la importancia?'}
                                            </button>
                                        </div>
                                        {showGapImportanceHelp && (
                                            <div className="space-y-1.5">
                                                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">5:</span> si falla, el liderazgo se rompe (alto costo en equipo/resultado).</p>
                                                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">4:</span> muy importante, afecta confianza y decisiones.</p>
                                                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">3:</span> importante, pero no crítico.</p>
                                                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">2:</span> útil, pero no decisivo.</p>
                                                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">1:</span> marginal.</p>
                                                <p className="text-sm text-slate-700 pt-1"><span className="font-semibold text-slate-900">Ejemplo:</span> si “Regulo tono y corporalidad” cae en tensión y eso silencia al equipo, suele ser 4–5.</p>
                                            </div>
                                        )}
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Matriz GAP (Importancia vs Dominio actual)</h3>
                                        <button
                                            type="button"
                                            onClick={syncPriorityCurrentFromSkills}
                                            disabled={isLocked}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Traer dominio actual desde sección 5
                                        </button>
                                    </div>

                                    {!hasCurrentSkillsFromSectionFive && (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            Completa “Habilidades actuales” para traer Dominio actual automáticamente.
                                        </p>
                                    )}

                                    {skillsPriorityAllImportanceFive && (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            Sugerencia: todas las importancias están en 5. Diferencia qué es realmente crítico vs importante.
                                        </p>
                                    )}

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1120px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Habilidad</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Importancia (1–5)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Dominio actual (1–5)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">GAP (Imp−Dom)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Prioridad</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Top 3</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {skillsPriorityRowsView.map((row, index) => (
                                                    <tr key={`skills-priority-row-${row.id}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <p className="text-sm font-semibold text-slate-900">{row.skill}</p>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {[1, 2, 3, 4, 5].map((level) => (
                                                                    <button
                                                                        key={`priority-importance-${row.id}-${level}`}
                                                                        type="button"
                                                                        onClick={() => setSkillPriorityImportance(index, level as SkillRating)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                                                            row.importance === level
                                                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {level}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {[1, 2, 3, 4, 5].map((level) => (
                                                                    <button
                                                                        key={`priority-current-${row.id}-${level}`}
                                                                        type="button"
                                                                        onClick={() => setSkillPriorityCurrent(index, level as SkillRating)}
                                                                        disabled={isLocked}
                                                                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                                                            row.current === level
                                                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {level}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <span className="text-sm font-semibold text-slate-900">{row.importance > 0 && row.current > 0 ? row.gap : '—'}</span>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            {row.importance > 0 && row.current > 0 ? (
                                                                <span
                                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                                        row.priority === 'Alta'
                                                                            ? 'border-rose-300 bg-rose-50 text-rose-700'
                                                                            : row.priority === 'Media'
                                                                                ? 'border-amber-300 bg-amber-50 text-amber-700'
                                                                                : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                                    }`}
                                                                >
                                                                    {row.priority}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-slate-500">Pendiente</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={row.selected}
                                                                    onChange={() => toggleSkillPrioritySelection(index)}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                                                />
                                                                Marcar
                                                            </label>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {skillsPriorityWarning && (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{skillsPriorityWarning}</p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Selección final (Top 3) y cierre rápido</h3>
                                    <p className="text-sm text-slate-700">
                                        Regla: elige 3 con Importancia 4–5 y GAP más grande.
                                        Actualmente seleccionadas: <span className="font-semibold text-slate-900">{skillsPrioritySelectedCount}/3</span>.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi prioridad #1 (más urgente)</span>
                                            <input
                                                type="text"
                                                value={state.skillsPriority.priorityOne}
                                                onChange={(e) => setSkillsPrioritySummaryField('priorityOne', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi prioridad #2</span>
                                            <input
                                                type="text"
                                                value={state.skillsPriority.priorityTwo}
                                                onChange={(e) => setSkillsPrioritySummaryField('priorityTwo', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi prioridad #3</span>
                                            <input
                                                type="text"
                                                value={state.skillsPriority.priorityThree}
                                                onChange={(e) => setSkillsPrioritySummaryField('priorityThree', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">La habilidad que NO trabajaré ahora</span>
                                            <input
                                                type="text"
                                                value={state.skillsPriority.skipForNow}
                                                onChange={(e) => setSkillsPrioritySummaryField('skipForNow', e.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                skillsPrioritySectionComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {skillsPrioritySectionComplete
                                                ? 'Sección completada'
                                                : `Pendiente (Importancia en 6/6 + Top 3 = ${skillsPrioritySelectedCount}/3)`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={saveSkillsPriorityModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 8
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(9) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 9 de 11"
                                data-print-title="Micro-hábitos"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 9</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Micro-hábitos</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Convertir tu regulación emocional en rutina diaria. La mejora no ocurre por entender; ocurre por repetir conductas pequeñas
                                        hasta volverlas automáticas.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Objetivo y reglas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <p className="text-sm text-slate-700">• Al finalizar tendrás 3 micro-hábitos, tracker de 30 días y revisión semanal.</p>
                                        <p className="text-sm text-slate-700">• Micro-hábito: acción mínima diaria y medible (5–10 min).</p>
                                        <p className="text-sm text-slate-700">• Evidencia: prueba breve (qué + dónde) en 1 línea.</p>
                                        <p className="text-sm text-slate-700">• Constancia {'>'} perfección: continuidad real.</p>
                                    </div>
                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1.5">
                                        <p className="text-sm font-semibold text-slate-900">Reglas</p>
                                        <p className="text-sm text-slate-700">1. Elige exactamente 3 micro-hábitos.</p>
                                        <p className="text-sm text-slate-700">2. Registra evidencia diaria (1 línea).</p>
                                        <p className="text-sm text-slate-700">3. Si fallas un día, vuelve al mínimo al siguiente.</p>
                                    </article>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 1 — Elige tus 3 micro-hábitos</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                            state.microHabits.selectedHabitIds.length === 3
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                        }`}>
                                            Seleccionados: {state.microHabits.selectedHabitIds.length}/3
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {MICRO_HABIT_OPTIONS.map((option) => {
                                            const selected = state.microHabits.selectedHabitIds.includes(option.id)
                                            const disableCheck = isLocked || (!selected && state.microHabits.selectedHabitIds.length >= 3)
                                            return (
                                                <label
                                                    key={option.id}
                                                    className={`rounded-xl border p-3 space-y-1 cursor-pointer transition-colors ${
                                                        selected
                                                            ? 'border-emerald-300 bg-emerald-50'
                                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                                    } ${disableCheck ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => toggleMicroHabitSelection(option.id)}
                                                            disabled={disableCheck}
                                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                                                        />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-slate-900">{option.code}. {option.title}</p>
                                                            <p className="text-sm text-slate-700">{option.detail}</p>
                                                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                                                {option.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>

                                    <p className="text-sm text-slate-700">
                                        Sugerencia práctica: combina 1 hábito de Tiempo real + 1 de Mantenimiento + 1 de Recuperación/Relación (ej.: B + C + A).
                                    </p>

                                    {microHabitsSelectionWarning && (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            {microHabitsSelectionWarning}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs text-slate-600">
                                            Tu selección:
                                            {state.microHabits.selectedHabitIds.length > 0
                                                ? ` ${state.microHabits.selectedHabitIds.map((habitId) => getMicroHabitShortLabel(habitId)).join(' | ')}`
                                                : ' pendiente'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={saveMicroHabitsSelection}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar selección
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 2 — Define cómo se ve cada micro-hábito</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowMicroHabitsStep2Help((current) => !current)}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            {showMicroHabitsStep2Help ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                        </button>
                                    </div>
                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                                        <p className="text-sm text-slate-700">1. Define un momento exacto del día para cada hábito (no “cuando pueda”).</p>
                                        <p className="text-sm text-slate-700">2. Usa duración máxima de 10 minutos para que sea sostenible.</p>
                                        <p className="text-sm text-slate-700">3. La evidencia debe describir acción + contexto, en una línea.</p>
                                        <p className="text-sm text-slate-700">4. Si no puedes medirlo, el hábito está mal definido.</p>
                                    </article>

                                    {showMicroHabitsStep2Help && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                            <p className="text-sm font-semibold text-slate-900">Ejemplo de definición operativa</p>
                                            <p className="text-sm text-slate-700">Micro-hábito 1 (B. Ancla)</p>
                                            <p className="text-sm text-slate-700">Cuándo: 08:30, antes de reunión de seguimiento y 16:30.</p>
                                            <p className="text-sm text-slate-700">Duración: 30s.</p>
                                            <p className="text-sm text-slate-700">Evidencia: “Ancla 3/3 antes de reuniones clave”.</p>
                                            <p className="text-sm text-slate-700 pt-1">Micro-hábito 2 (A. Bitácora 3 líneas)</p>
                                            <p className="text-sm text-slate-700">Cuándo: 18:30, cierre del día.</p>
                                            <p className="text-sm text-slate-700">Duración: 5min.</p>
                                            <p className="text-sm text-slate-700">Evidencia: “Bitácora: evento + emoción 6/10 + aprendizaje”.</p>
                                        </article>
                                    )}
                                    {selectedMicroHabitOptions.length === 0 ? (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            Selecciona 3 micro-hábitos para habilitar esta sección.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {microHabitDefinitionsForSelected.map(({ option, definition }) => (
                                                <article key={`definition-${option.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                                    <p className="text-sm font-semibold text-slate-900">{option.code}. {option.title}</p>
                                                    <label className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Cuándo lo haré</span>
                                                        <input
                                                            type="text"
                                                            value={definition?.when || ''}
                                                            onChange={(e) => setMicroHabitDefinitionField(option.id, 'when', e.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                            placeholder="Ej.: 18:30 al cerrar el día"
                                                        />
                                                    </label>
                                                    <label className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Duración</span>
                                                        <select
                                                            value={definition?.duration || ''}
                                                            onChange={(e) => setMicroHabitDefinitionField(option.id, 'duration', e.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        >
                                                            <option value="">Selecciona duración</option>
                                                            <option value="30s">30s</option>
                                                            <option value="2min">2min</option>
                                                            <option value="5min">5min</option>
                                                            <option value="10min">10min</option>
                                                        </select>
                                                    </label>
                                                    <label className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Evidencia (1 línea)</span>
                                                        <input
                                                            type="text"
                                                            value={definition?.evidenceFormat || ''}
                                                            onChange={(e) => setMicroHabitDefinitionField(option.id, 'evidenceFormat', e.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                            placeholder="acción + contexto"
                                                        />
                                                    </label>
                                                </article>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveMicroHabitsDefinitions}
                                            disabled={isLocked}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar definición
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 3 — Tracker 30 días (checks + evidencia)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowMicroHabitsStep3Help((current) => !current)}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            {showMicroHabitsStep3Help ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                        </button>
                                    </div>
                                    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                                        <p className="text-sm text-slate-700">Qué hacer cada día (60 segundos):</p>
                                        <p className="text-sm text-slate-700">1. Marca los 3 checks del día según lo realizado.</p>
                                        <p className="text-sm text-slate-700">2. Escribe una evidencia breve (1 línea) con acción + contexto.</p>
                                        <p className="text-sm text-slate-700">3. Guarda el día o la semana según tu ritmo.</p>
                                        <p className="text-sm text-slate-700">Regla: si fallas un día, retoma al día siguiente sin compensar.</p>
                                    </article>

                                    {showMicroHabitsStep3Help && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                            <p className="text-sm font-semibold text-slate-900">Ejemplos correctos</p>
                                            <p className="text-sm text-slate-700">• “Usé STOP antes de responder en reunión con X”.</p>
                                            <p className="text-sm text-slate-700">• “Ancla 3/3 (mañana, antes de reunión, tarde)”.</p>
                                            <p className="text-sm text-slate-700">• “Bitácora: evento–emoción 7/10–aprendizaje: 1 pregunta”.</p>
                                            <p className="text-sm text-slate-700">• “Reparé: reconocí interrupción y acordamos retomar punto”.</p>
                                            <p className="text-sm font-semibold text-slate-900 pt-1">Ejemplos incorrectos</p>
                                            <p className="text-sm text-slate-700">• “Me porté bien”.</p>
                                            <p className="text-sm text-slate-700">• “Hice muchas cosas”.</p>
                                            <p className="text-sm font-semibold text-slate-900 pt-1">Ejemplo diario completo</p>
                                            <p className="text-sm text-slate-700">Día 6: checks 2/3 + evidencia: “Pausa intencional antes de reunión con dirección; bajé tono y pedí 1 dato antes de decidir”.</p>
                                        </article>
                                    )}

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                        <p className="text-sm text-slate-700">
                                            Días con 2/3 o 3/3 hábitos: <span className="font-semibold text-slate-900">{microHabitsConsistencyDays}/30</span>
                                        </p>
                                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-blue-600 transition-all"
                                                style={{ width: `${microHabitsConsistencyPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-600">Consistencia: {microHabitsConsistencyPercent}%</p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1080px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Día</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        {microHabitSlots[0] ? `${microHabitSlots[0].code}` : 'Micro-hábito 1'}
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        {microHabitSlots[1] ? `${microHabitSlots[1].code}` : 'Micro-hábito 2'}
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                                                        {microHabitSlots[2] ? `${microHabitSlots[2].code}` : 'Micro-hábito 3'}
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Evidencia (1 línea)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.microHabits.tracker.map((row, index) => (
                                                    <tr key={`tracker-day-${row.day}`} className="odd:bg-white even:bg-slate-50">
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top text-sm font-semibold text-slate-900">{row.day}</td>
                                                        {[0, 1, 2].map((slotIndex) => (
                                                            <td key={`tracker-${row.day}-${slotIndex}`} className="px-3 py-2 border-b border-slate-200 align-top">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={row.checks[slotIndex as 0 | 1 | 2]}
                                                                    onChange={(e) => setMicroHabitTrackerCheck(index, slotIndex as 0 | 1 | 2, e.target.checked)}
                                                                    disabled={isLocked || !microHabitSlots[slotIndex]}
                                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <input
                                                                type="text"
                                                                value={row.evidence}
                                                                onChange={(e) => setMicroHabitTrackerEvidence(index, e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                placeholder="acción + contexto"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveMicroHabitDay(index)}
                                                                disabled={isLocked}
                                                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar día
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <select
                                            value={trackerWeekToSave}
                                            onChange={(e) => setTrackerWeekToSave(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                                            disabled={isLocked}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                        >
                                            <option value={1}>Semana 1 (día 1–7)</option>
                                            <option value={2}>Semana 2 (día 8–14)</option>
                                            <option value={3}>Semana 3 (día 15–21)</option>
                                            <option value={4}>Semana 4 (día 22–28)</option>
                                            <option value={5}>Semana 5 (día 29–30)</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={saveMicroHabitsTrackerWeek}
                                            disabled={isLocked}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar semana
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveMicroHabitsTrackerAll}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar todo
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 4 — Cierre semanal (rápido, 5 minutos)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowMicroHabitsStep4Help((current) => !current)}
                                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            {showMicroHabitsStep4Help ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                        </button>
                                    </div>
                                    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                                        <p className="text-sm text-slate-700">1. Revisa semana por semana: días con cumplimiento 2/3 o más.</p>
                                        <p className="text-sm text-slate-700">2. Identifica el detonante más repetido.</p>
                                        <p className="text-sm text-slate-700">3. Define un solo ajuste concreto para la semana siguiente.</p>
                                        <p className="text-sm text-slate-700">Si estás fallando, no agregues hábitos: simplifica.</p>
                                    </article>

                                    {showMicroHabitsStep4Help && (
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
                                            <p className="text-sm font-semibold text-slate-900">Ejemplo de cierre semanal</p>
                                            <p className="text-sm text-slate-700">Semana 1: 5/7 días con 2/3 hábitos o más.</p>
                                            <p className="text-sm text-slate-700">Detonante principal: urgencias y presión de tiempo.</p>
                                            <p className="text-sm text-slate-700">Ajuste: mover el hábito de bitácora a las 17:30 y dejar recordatorio fijo.</p>
                                            <p className="text-sm text-slate-700 pt-1">Semana 2: 6/7 días.</p>
                                            <p className="text-sm text-slate-700">Detonante principal: crítica pública.</p>
                                            <p className="text-sm text-slate-700">Ajuste: activar ancla antes de reuniones sensibles.</p>
                                        </article>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {state.microHabits.weeklyReviews.map((weekRow, index) => (
                                            <article key={`weekly-${weekRow.week}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Semana {weekRow.week} (día {weekRow.week * 7 - 6}–{weekRow.week * 7})
                                                </p>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">¿Cuántos días cumplí 2/3 o más?</span>
                                                    <select
                                                        value={weekRow.consistency}
                                                        onChange={(e) => setMicroHabitWeeklyField(index, 'consistency', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    >
                                                        <option value="">Selecciona (0–7)</option>
                                                        {Array.from({ length: 8 }, (_, dayCount) => (
                                                            <option key={`consistency-${weekRow.week}-${dayCount}`} value={`${dayCount}/7`}>
                                                                {dayCount}/7
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Detonante que apareció más</span>
                                                    <input
                                                        type="text"
                                                        value={weekRow.mainTrigger}
                                                        onChange={(e) => setMicroHabitWeeklyField(index, 'mainTrigger', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Ajuste para la próxima semana</span>
                                                    <input
                                                        type="text"
                                                        value={weekRow.adjustment}
                                                        onChange={(e) => setMicroHabitWeeklyField(index, 'adjustment', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                            </article>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                microHabitsSectionComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {microHabitsSectionComplete
                                                ? `Sección completada (días registrados: ${microHabitsTrackedDays}/30)`
                                                : `Pendiente (selección 3/3 + definición + mínimo 7 días; hoy: ${microHabitsTrackedDays}/30)`}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={saveMicroHabitsWeeklyReviews}
                                                disabled={isLocked}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar cierre semanal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={saveMicroHabitsModule}
                                                disabled={isLocked}
                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Guardar página 9
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(10) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 10 de 11"
                                data-print-title="PDI 30 días"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 10</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Plan de Desarrollo Individual (PDI) — 30 días
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Diseñar un plan simple, ejecutable y medible para 30 días. Un PDI no es intención:
                                        es un contrato contigo mismo con acciones, evidencia y revisión semanal.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-6 space-y-4">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        <article className="rounded-xl border border-slate-200 bg-white p-4">
                                            <p className="text-sm font-semibold text-slate-900">Al terminar, tendrás:</p>
                                            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                                                <li>• 1 objetivo claro (1 frase).</li>
                                                <li>• 1–2 competencias foco.</li>
                                                <li>• 3 indicadores de éxito.</li>
                                                <li>• 3–5 acciones con evidencia.</li>
                                                <li>• Soportes + 4 revisiones semanales.</li>
                                            </ul>
                                        </article>
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                            <p className="text-sm font-semibold text-slate-900">Conexión obligatoria del PDI</p>
                                            <p className="mt-2 text-sm text-slate-700">
                                                Debe conectar con Top 3 gaps (sección 8), detonante prioritario (sección 3) y
                                                micro-hábitos (sección 9).
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                    Detonante: {pdiPriorityTriggerSuggestion || 'Completar sección 3'}
                                                </span>
                                                <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                    Técnica tiempo real: {pdiRealtimeTechniqueSuggestion || 'Completar sección 6'}
                                                </span>
                                                <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                    Top gaps: {pdiTopGapSuggestions.length > 0 ? pdiTopGapSuggestions.join(' | ') : 'Completar sección 8'}
                                                </span>
                                                <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                    Micro-hábitos: {pdiMicroHabitSuggestions.length > 0 ? pdiMicroHabitSuggestions.join(' | ') : 'Completar sección 9'}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={applyPdiSmartSuggestions}
                                                    disabled={isLocked}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Autocompletar sugerencias inteligentes
                                                </button>
                                            </div>
                                        </article>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { step: 1, label: 'A. Objetivo' },
                                                { step: 2, label: 'B. Competencia foco' },
                                                { step: 3, label: 'C. Indicadores' },
                                                { step: 4, label: 'D. Acciones' },
                                                { step: 5, label: 'E. Soportes' },
                                                { step: 6, label: 'F. Revisión semanal' }
                                            ].map((item) => (
                                                <button
                                                    key={`pdi-step-${item.step}`}
                                                    type="button"
                                                    onClick={() => setPdiStep(item.step as 1 | 2 | 3 | 4 | 5 | 6)}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                        pdiStep === item.step
                                                            ? 'border-blue-600 bg-blue-600 text-white'
                                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                        {!isExportingAll && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setPdiStep((prev) => (prev === 1 ? prev : ((prev - 1) as 1 | 2 | 3 | 4 | 5 | 6)))}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                >
                                                    Paso anterior
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPdiStep((prev) => (prev === 6 ? prev : ((prev + 1) as 1 | 2 | 3 | 4 | 5 | 6)))}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                >
                                                    Paso siguiente
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {(isExportingAll || pdiStep === 1) && (
                                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 1 — Objetivo de desarrollo (1 frase)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPdiObjectiveHelp((current) => !current)}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    {showPdiObjectiveHelp ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-700">
                                                Incluye conducta + contexto + criterio. Evita frases vagas como “ser mejor líder”.
                                            </p>
                                            {showPdiObjectiveHelp && (
                                                <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                                                    <p className="text-sm font-semibold text-slate-900">Ejemplos correctos</p>
                                                    <p className="text-sm text-slate-700">• “Regular mi tono y hacer 1 pregunta antes de responder en reuniones tensas”.</p>
                                                    <p className="text-sm text-slate-700">• “Detectar señal corporal temprana y activar ancla antes de decidir bajo presión”.</p>
                                                    <p className="text-sm text-slate-700">• “Recuperar calma tras conflicto y reparar en menos de 24 horas”.</p>
                                                    <p className="text-sm font-semibold text-slate-900 pt-1">Ejemplos vagos (evitar)</p>
                                                    <p className="text-sm text-slate-700">• “Ser más calmado”. • “Manejar mejor mis emociones”. • “Mejorar liderazgo”.</p>
                                                </article>
                                            )}
                                            <label className="space-y-1 block">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Mi objetivo (30 días)</span>
                                                <textarea
                                                    value={state.pdi.objective}
                                                    onChange={(e) => setPdiObjective(e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[86px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                                    placeholder="Ej: Pausar y hacer 1 pregunta antes de responder cuando me cuestionen en público."
                                                />
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setPdiObjective(pdiObjectiveSuggestion)}
                                                    disabled={isLocked}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Usar sugerencia automática
                                                </button>
                                                <span className="text-xs text-slate-500 self-center">
                                                    Sugerencia: {pdiObjectiveSuggestion}
                                                </span>
                                            </div>
                                        </section>
                                    )}

                                    {(isExportingAll || pdiStep === 2) && (
                                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 2 — Competencia foco (1 principal + 1 secundaria)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                            <p className="text-sm text-slate-700">
                                                Si el detonante prioritario es crítica pública y el patrón es subir tono, suele ser Regulación + Somática.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <article className="rounded-lg border border-slate-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Principal (obligatorio)</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {PDI_COMPETENCY_OPTIONS.map((option) => (
                                                            <label key={`pdi-primary-${option}`} className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                                <input
                                                                    type="radio"
                                                                    name="pdi-primary-competency"
                                                                    checked={state.pdi.primaryCompetency === option}
                                                                    onChange={() => setPdiPrimaryCompetency(option)}
                                                                    disabled={isLocked}
                                                                />
                                                                <span>{option}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </article>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Secundaria (opcional)</span>
                                                    <input
                                                        type="text"
                                                        value={state.pdi.secondaryCompetency}
                                                        onChange={(e) => setPdiSecondaryCompetency(e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        placeholder="Ej: Somática"
                                                    />
                                                </label>
                                            </div>
                                        </section>
                                    )}

                                    {(isExportingAll || pdiStep === 3) && (
                                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 3 — Evidencia de éxito (3 indicadores medibles)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPdiIndicatorsHelp((current) => !current)}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    {showPdiIndicatorsHelp ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                                </button>
                                            </div>
                                            {showPdiIndicatorsHelp && (
                                                <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                                                    <p className="text-sm text-slate-700">• Conducta (conteo): “# veces que haré X”.</p>
                                                    <p className="text-sm text-slate-700">• Estado (escala): “intensidad promedio 0–10”.</p>
                                                    <p className="text-sm text-slate-700">• Resultado relacional: “feedback/reparación por semana”.</p>
                                                    <p className="text-sm text-slate-700">Ej.: “8 pausas conscientes”, “8/10 a 6/10”, “2 reparaciones en el mes”.</p>
                                                </article>
                                            )}
                                            <div className="grid grid-cols-1 gap-3">
                                                {state.pdi.indicators.map((indicator, index) => (
                                                    <label key={indicator.id} className="space-y-1 block">
                                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Indicador {index + 1}</span>
                                                        <input
                                                            type="text"
                                                            value={indicator.value}
                                                            onChange={(e) => setPdiIndicator(index, e.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                            placeholder={
                                                                index === 0
                                                                    ? '# veces que haré X'
                                                                    : index === 1
                                                                        ? 'escala 0–10'
                                                                        : 'días/semana o feedback'
                                                            }
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {(isExportingAll || pdiStep === 4) && (
                                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 4 — Acciones (3–5) con frecuencia, duración y evidencia</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPdiActionsHelp((current) => !current)}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    {showPdiActionsHelp ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                                </button>
                                            </div>
                                            {showPdiActionsHelp && (
                                                <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                                                    <p className="text-sm text-slate-700">• Acción: “Antes de 2 reuniones al día hago STOP + ancla (20s)”.</p>
                                                    <p className="text-sm text-slate-700">• Frecuencia: diario / 3×sem / semanal / por evento.</p>
                                                    <p className="text-sm text-slate-700">• Evidencia: “check + 1 línea con contexto”.</p>
                                                    <p className="text-sm text-slate-700">Regla: al menos 1 acción tiempo real y 1 acción mantenimiento.</p>
                                                </article>
                                            )}
                                            {!pdiActionLayerHint.realtime && (
                                                <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                    Sugerencia: agrega al menos 1 acción de tiempo real (STOP/ancla/pausa/pregunta antes).
                                                </p>
                                            )}
                                            {!pdiActionLayerHint.maintenance && (
                                                <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                    Sugerencia: agrega al menos 1 acción de mantenimiento (sueño/journaling/ejercicio/pausas).
                                                </p>
                                            )}
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                                    <thead>
                                                        <tr className="bg-slate-100">
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Acción</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Frecuencia</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Duración</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Evidencia</th>
                                                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">Acción fila</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {state.pdi.actions.map((row, index) => (
                                                            <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                                                                <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                    <input
                                                                        type="text"
                                                                        value={row.action}
                                                                        onChange={(e) => setPdiActionField(index, 'action', e.target.value)}
                                                                        disabled={isLocked}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                        placeholder="Comportamiento repetible"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                    <select
                                                                        value={row.frequency}
                                                                        onChange={(e) => setPdiActionField(index, 'frequency', e.target.value)}
                                                                        disabled={isLocked}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {PDI_ACTION_FREQUENCY_OPTIONS.filter((option) => option !== '').map((option) => (
                                                                            <option key={`pdi-frequency-${row.id}-${option}`} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                    <select
                                                                        value={row.duration}
                                                                        onChange={(e) => setPdiActionField(index, 'duration', e.target.value)}
                                                                        disabled={isLocked}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {PDI_ACTION_DURATION_OPTIONS.filter((option) => option !== '').map((option) => (
                                                                            <option key={`pdi-duration-${row.id}-${option}`} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                    <input
                                                                        type="text"
                                                                        value={row.evidence}
                                                                        onChange={(e) => setPdiActionField(index, 'evidence', e.target.value)}
                                                                        disabled={isLocked}
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                        placeholder="Qué registraré (acción + contexto)"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2 border-b border-slate-200 align-top">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removePdiActionRow(index)}
                                                                        disabled={isLocked || state.pdi.actions.length <= 3}
                                                                        className="rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex flex-wrap justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={addPdiActionRow}
                                                    disabled={isLocked || state.pdi.actions.length >= 5}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Agregar acción
                                                </button>
                                                <p className="text-xs text-slate-500 self-center">
                                                    Acciones configuradas: {state.pdi.actions.length}/5
                                                </p>
                                            </div>
                                        </section>
                                    )}

                                    {(isExportingAll || pdiStep === 5) && (
                                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 5 — Soportes para sostener el plan</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPdiSupportsHelp((current) => !current)}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    {showPdiSupportsHelp ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                                </button>
                                            </div>
                                            {showPdiSupportsHelp && (
                                                <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                                                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Barrera:</span> “cuando estoy cansado salto a controlar”.</p>
                                                    <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Contingencia:</span> “si dormí mal, reduzco agenda + 2 pausas extra + no cierro decisiones en caliente”.</p>
                                                </article>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Persona de apoyo</span>
                                                    <input
                                                        type="text"
                                                        value={state.pdi.supports.supportPerson}
                                                        onChange={(e) => setPdiSupportField('supportPerson', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                        placeholder="iShine / peer / sponsor"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Contexto crítico donde practicaré</span>
                                                    <input
                                                        type="text"
                                                        value={state.pdi.supports.criticalContext}
                                                        onChange={(e) => setPdiSupportField('criticalContext', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Barrera probable</span>
                                                    <input
                                                        type="text"
                                                        value={state.pdi.supports.likelyBarrier}
                                                        onChange={(e) => setPdiSupportField('likelyBarrier', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Plan de contingencia</span>
                                                    <input
                                                        type="text"
                                                        value={state.pdi.supports.contingencyPlan}
                                                        onChange={(e) => setPdiSupportField('contingencyPlan', e.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    />
                                                </label>
                                            </div>
                                        </section>
                                    )}

                                    {(isExportingAll || pdiStep === 6) && (
                                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Paso 6 — Revisión semanal (15 min)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPdiWeeklyHelp((current) => !current)}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    {showPdiWeeklyHelp ? 'Ocultar ayuda' : 'Ayuda / ejemplo'}
                                                </button>
                                            </div>
                                            {showPdiWeeklyHelp && (
                                                <article className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1.5">
                                                    <p className="text-sm text-slate-700">Año 1 de hábito operativo: revisar cada semana detonante dominante, técnica en tiempo real y ajuste único.</p>
                                                    <p className="text-sm text-slate-700">Ejemplo semana 1: detonante “crítica pública” / técnica “STOP + ancla” / ajuste “pregunta antes de decidir”.</p>
                                                </article>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={copyRealtimeTechniqueToPdiWeeks}
                                                    disabled={isLocked}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Copiar técnica tiempo real
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applyPdiSmartSuggestions}
                                                    disabled={isLocked}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Sugerir semana 1 desde contexto
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {state.pdi.weeklyReviews.map((week, index) => (
                                                    <article key={`pdi-week-${week.week}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                                        <p className="text-sm font-semibold text-slate-900">Semana {week.week}</p>
                                                        <label className="space-y-1 block">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Detonante</span>
                                                            <input
                                                                type="text"
                                                                value={week.trigger}
                                                                onChange={(e) => setPdiWeeklyField(index, 'trigger', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                            />
                                                        </label>
                                                        <label className="space-y-1 block">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Técnica</span>
                                                            <input
                                                                type="text"
                                                                value={week.technique}
                                                                onChange={(e) => setPdiWeeklyField(index, 'technique', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                            />
                                                        </label>
                                                        <label className="space-y-1 block">
                                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Ajuste</span>
                                                            <input
                                                                type="text"
                                                                value={week.adjustment}
                                                                onChange={(e) => setPdiWeeklyField(index, 'adjustment', e.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                            />
                                                        </label>
                                                    </article>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {pdiWarning && (
                                        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                            {pdiWarning}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                                pdiSectionComplete
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-300 bg-amber-50 text-amber-700'
                                            }`}
                                        >
                                            {pdiSectionComplete
                                                ? 'PDI completado (objetivo + indicadores + acciones + semana 1)'
                                                : 'PDI pendiente (falta completar campos mínimos para estado final)'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={savePdiModule}
                                            disabled={isLocked}
                                            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 10
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(11) && (
                            <article
                                className="wb2-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 11 de 11"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 11</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Evaluación</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Objetivo: permitir que iShine y líder evalúen con evidencia, definan decisiones por criterio y cierren con síntesis de acuerdos de 30 días.
                                    </p>
                                </header>

                                {!isExportingAll && (
                                    <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-4 md:p-5 space-y-4">
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
                                        <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">A) Modo iShine - Rúbricas</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEvaluationLevelReference((current) => !current)}
                                                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    {showEvaluationLevelReference ? 'Ocultar referencia' : 'Ver referencia de niveles'}
                                                </button>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {[
                                                    'Evalúa cada criterio con base en evidencia observable (idealmente de los últimos 30 días).',
                                                    'Marca un solo nivel por criterio (N1, N2, N3 o N4).',
                                                    'Registra comentario u observación concreta por criterio (hechos, conversación o conducta observada).',
                                                    'Define decisión por criterio: Consolidado, En desarrollo o Prioritario.',
                                                    'Cierra el WB con observaciones generales y una decisión global de seguimiento.'
                                                ].map((instruction) => (
                                                    <li key={`mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {showEvaluationLevelReference && (
                                                <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                    <p className="text-sm font-semibold text-slate-900 mb-2">Referencia de niveles (1–4)</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-[520px] w-full border border-blue-200 rounded-lg overflow-hidden bg-white">
                                                            <thead>
                                                                <tr className="bg-blue-100">
                                                                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 border-b border-blue-200">Nivel</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 border-b border-blue-200">Descriptor</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {MENTOR_LEVEL_REFERENCE.map((item) => (
                                                                    <tr key={`mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
                                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-blue-100">{item.level}</td>
                                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-blue-100">{item.descriptor}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </article>
                                            )}
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Formato de evaluación del iShine (marcar y comentar)</h3>
                                                <p className="text-xs text-slate-500">Criterios completados: {mentorCompletedRows}/{state.evaluation.mentorRows.length}</p>
                                            </div>

                                            {state.evaluation.mentorRows.map((row, index) => {
                                                const isEditing = mentorEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isMentorEvaluationRowComplete(row)

                                                return (
                                                    <article key={`mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <h4 className="text-sm md:text-base font-bold text-slate-900">{row.criterion}</h4>
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
                                                                onClick={() => editMentorEvaluationRow(index)}
                                                                disabled={isLocked || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveMentorEvaluationRow(index)}
                                                                disabled={isLocked || !isEditing}
                                                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Guardar fila
                                                            </button>
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="space-y-3">
                                                                <fieldset className="space-y-2">
                                                                    <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Nivel</legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_LEVEL_OPTIONS.map((level) => (
                                                                            <label
                                                                                key={`mentor-level-${index}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`mentor-level-${index}`}
                                                                                    checked={row.level === level}
                                                                                    onChange={() => setMentorEvaluationField(index, 'level', level)}
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
                                                                        onChange={(e) => setMentorEvaluationField(index, 'evidence', e.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                        placeholder='Hechos observables (si falta evidencia, escribe "Completar").'
                                                                    />
                                                                </label>

                                                                <fieldset className="space-y-2">
                                                                    <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión del iShine</legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                            <label
                                                                                key={`mentor-decision-${index}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`mentor-decision-${index}`}
                                                                                    checked={row.decision === decision}
                                                                                    onChange={() => setMentorEvaluationField(index, 'decision', decision)}
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
                                                            <div className="space-y-1.5 text-sm text-slate-700">
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Nivel:</span> {row.level || 'Pendiente'}
                                                                </p>
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Comentario / evidencia:</span> {row.evidence || 'Pendiente'}
                                                                </p>
                                                                <p>
                                                                    <span className="font-semibold text-slate-900">Decisión:</span> {row.decision || 'Pendiente'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </article>
                                                )
                                            })}
                                        </section>

                                        <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-6 space-y-4">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre del iShine</h3>
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Observaciones generales del iShine</span>
                                                <textarea
                                                    value={state.evaluation.mentorGeneralNotes}
                                                    onChange={(e) => setMentorGeneralNotes(e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[100px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder='Escribe observaciones generales (si falta información, escribe "Completar").'
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
                                                                checked={state.evaluation.mentorGlobalDecision === decision}
                                                                onChange={() => setMentorGlobalDecision(decision)}
                                                                disabled={isLocked}
                                                                className="h-3.5 w-3.5"
                                                            />
                                                            <span>{decision}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </fieldset>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={saveMentorClosing}
                                                    disabled={isLocked}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Guardar cierre iShine
                                                </button>
                                            </div>
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'leader' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-6 space-y-4">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">B) Modo Líder - Autoevaluación</h3>
                                            <ul className="space-y-1.5">
                                                {[
                                                    'Responde cada pregunta desde hechos concretos y recientes, no desde intención.',
                                                    'Incluye al menos un ejemplo o evidencia por respuesta.',
                                                    'Define una acción o compromiso de 30 días para cada respuesta clave.',
                                                    'Usa este bloque como insumo para acordar el plan de desarrollo con el iShine.'
                                                ].map((instruction) => (
                                                    <li key={`leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-slate-500">Preguntas completadas: {leaderCompletedRows}/{state.evaluation.leaderRows.length}</p>
                                        </section>

                                        <section className="space-y-4">
                                            {state.evaluation.leaderRows.map((row, index) => {
                                                const isEditing = leaderEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isLeaderEvaluationRowComplete(row)
                                                return (
                                                    <article key={`leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <h4 className="text-sm md:text-base font-bold text-slate-900">{row.question}</h4>
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
                                                                onClick={() => editLeaderEvaluationRow(index)}
                                                                disabled={isLocked || isEditing}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveLeaderEvaluationRow(index)}
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
                                                                        onChange={(e) => setLeaderEvaluationField(index, 'response', e.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    />
                                                                </label>
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Evidencia / ejemplo</span>
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(e) => setLeaderEvaluationField(index, 'evidence', e.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[78px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    />
                                                                </label>
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Acción o compromiso (30 días)</span>
                                                                    <textarea
                                                                        value={row.action}
                                                                        onChange={(e) => setLeaderEvaluationField(index, 'action', e.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[78px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    />
                                                                </label>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5 text-sm text-slate-700">
                                                                <p><span className="font-semibold text-slate-900">Respuesta:</span> {row.response || 'Pendiente'}</p>
                                                                <p><span className="font-semibold text-slate-900">Evidencia:</span> {row.evidence || 'Pendiente'}</p>
                                                                <p><span className="font-semibold text-slate-900">Acción 30 días:</span> {row.action || 'Pendiente'}</p>
                                                            </div>
                                                        )}
                                                    </article>
                                                )
                                            })}
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'synthesis' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <section className="rounded-2xl border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">C) Síntesis de acuerdos iShine-Líder</h3>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                        synthesisStageComplete
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {synthesisStageComplete ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Síntesis de acuerdos</span>
                                                <textarea
                                                    value={state.evaluation.agreementsSynthesis}
                                                    onChange={(e) => setEvaluationSynthesis(e.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[130px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder="Registra acuerdos concretos entre iShine y líder."
                                                />
                                            </label>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={saveEvaluationSynthesis}
                                                    disabled={isLocked}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Guardar síntesis
                                                </button>
                                            </div>
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'final' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <article
                                            className={`rounded-2xl border p-5 md:p-6 ${
                                                evaluationSectionComplete
                                                    ? 'border-emerald-300 bg-emerald-50'
                                                    : 'border-amber-300 bg-amber-50'
                                            }`}
                                        >
                                            <h3 className={`text-lg md:text-xl font-extrabold ${evaluationSectionComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                {evaluationSectionComplete ? 'WB2 Evaluación completada' : 'WB2 Evaluación en progreso'}
                                            </h3>
                                            <p className={`mt-2 text-sm ${evaluationSectionComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {evaluationSectionComplete
                                                    ? 'iShine y líder cerraron rúbrica, autoevaluación y síntesis.'
                                                    : 'Completa los bloques pendientes para cerrar la evaluación.'}
                                            </p>
                                        </article>

                                        <article className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                            <h4 className="text-base md:text-lg font-bold text-slate-900">Resumen de evaluación</h4>
                                            <div className="space-y-2">
                                                {state.evaluation.mentorRows.map((row, index) => (
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
                                                <span className="font-semibold text-slate-900">Decisión global:</span> {state.evaluation.mentorGlobalDecision || 'Pendiente'}
                                            </p>
                                        </article>
                                    </section>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span
                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                            evaluationSectionComplete
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {evaluationSectionComplete
                                            ? 'Evaluación completada'
                                            : 'Evaluación pendiente (iShine + líder + síntesis)'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={saveEvaluationModule}
                                        disabled={isLocked}
                                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Guardar página 11
                                    </button>
                                </div>
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb2-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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
                                    <p className="text-sm font-bold text-slate-900">{PAGES[currentPageIndex]?.shortLabel || 'Página'}</p>
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

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 14mm;
                    }
                    .wb2-toolbar,
                    .wb2-sidebar,
                    .wb2-page-nav {
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
                    .wb2-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb2-print-page:not(.wb2-cover-page)::before {
                        content: "WB2 · Gestión emocional y PDI estratégico · " attr(data-print-title);
                        position: absolute;
                        top: 2mm;
                        left: 0;
                        right: 0;
                        padding-bottom: 2mm;
                        border-bottom: 1px solid #cbd5e1;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        font-weight: 700;
                        color: #1e3a8a;
                    }
                    .wb2-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb2-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb2-cover-page::before {
                        content: none !important;
                    }
                    .wb2-cover-hero {
                        min-height: 240mm !important;
                        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
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
                        border-radius: 8px !important;
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
