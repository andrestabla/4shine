'use client'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7
type YesNoAnswer = '' | 'yes' | 'no'
type Score15 = '' | '1' | '2' | '3' | '4' | '5'
type LadderLevel = 'Entrada' | 'Núcleo' | 'Escalamiento'
type MentorLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'
type MentorDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'
type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'

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

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type WB8State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    valueLadderSection: {
        assetsInventory: string[]
        problemTransformationRows: Array<{
            solvableProblem: string
            facilitatedTransformation: string
            supportingAsset: string
            naturalFormat: string
        }>
        ladderRows: Array<{
            level: LadderLevel
            offerName: string
            solvedProblem: string
            mainOutcome: string
            deliveryFormat: string
            durationScope: string
        }>
        ladderCoherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
        focusDecisionRows: Array<{
            offer: string
            problemClarity: Score15
            deliveryCapability: Score15
            differentiation: Score15
            adoptionEase: Score15
            expectedReturn: Score15
        }>
        packagingTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    businessModelSection: {
        internalRoutes: string[]
        externalRoutes: string[]
        monetizationCanvas: Array<{
            dimension: string
            internalRoute: string
            externalRoute: string
        }>
        valueCaptureMatrixRows: Array<{
            valueUnit: string
            perceivedValue: Score15
            comprehensionEase: Score15
            deliveryEffort: Score15
            scalability: Score15
            valueCapture: Score15
            dependencyRisk: Score15
        }>
        portfolioRows: Array<{
            offerRoute: string
            activationEase: string
            capturableValue: string
            quadrant: string
            decision: string
        }>
        monetizationHypothesis: {
            mainHypothesis: string
            confirmingSignal: string
            weakeningSignal: string
            minimumViableTest: string
            validationWindow: string
            followUpDecision: string
        }
        modelCoherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    visibilityStrategySection: {
        thematicAuditRows: Array<{
            possibleTopic: string
            realExperience: Score15
            differential: Score15
            audienceRelevance: Score15
            offerConnection: Score15
        }>
        audienceMapRows: Array<{
            keyAudience: string
            mainTension: string
            strategicMessage: string
            mainChannel: string
            suggestedFormat: string
        }>
        editorialArchitecture: {
            contentPillars: string[]
            contentTypes: {
                attraction: string
                depth: string
                conversion: string
            }
            mainChannels: string[]
        }
        channelRoleMatrixRows: Array<{
            channel: string
            primaryRole: string
            minimumFrequency: string
            shownSignal: string
            primaryMetric: string
        }>
        backlogRows: Array<{
            topicPiece: string
            pillar: string
            objective: string
            channel: string
            format: string
            valueSignal: string
            priority: string
        }>
        executionBoard: {
            minimumCadence: string
            creationBlock: string
            distributionBlock: string
            reviewBlock: string
            monthlyLearningCriteria: string
        }
        visibilityCoherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    controlBoardSection: {
        dashboardGoal: {
            mainQuestion: string
            strategicResult: string
            primaryDimension: string
            priorityReturnType: string
        }
        funnelRows: Array<{
            stage: string
            meaningInContext: string
            possibleIndicator: string
        }>
        criticalKpiRows: Array<{
            category: string
            selectedKpi: string
            whyItMatters: string
            indicatorType: string
        }>
        kpiSheets: Array<{
            kpiName: string
            measuredVariable: string
            formula: string
            dataSource: string
            frequency: string
            owner: string
            greenThreshold: string
            yellowThreshold: string
            redThreshold: string
            associatedDecision: string
        }>
        baselineRows: Array<{
            kpi: string
            baselineCurrent: string
            goal30: string
            goal90: string
            alertThreshold: string
            correctiveAction: string
        }>
        executiveRows: Array<{
            kpi: string
            currentValue: string
            trend: string
            goal: string
            status: string
            quickRead: string
            decision: string
        }>
        reviewCadence: {
            weeklyReview: string
            monthlyReview: string
            decisionSignals: string
            associatedDecisions: string
        }
        dashboardIntelligenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    evaluation: {
        mentorRows: MentorEvaluationRow[]
        mentorGeneralNotes: string
        mentorGlobalDecision: MentorDecision
        leaderRows: LeaderEvaluationRow[]
        agreementsSynthesis: string
    }
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada e identificación', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Escalera de valor', shortLabel: 'Escalera de valor' },
    { id: 4, label: '4. Modelo de negocio', shortLabel: 'Modelo de negocio' },
    { id: 5, label: '5. Estrategia de visibilidad', shortLabel: 'Visibilidad' },
    { id: 6, label: '6. Tablero de control', shortLabel: 'KPIs y ROI' },
    { id: 7, label: '7. Evaluación', shortLabel: 'Evaluación' }
]

const STORAGE_KEY = 'workbooks-v2-wb8-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb8-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb8-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb8-presentation-seen'

const ASSETS_ROWS = 8
const MATRIX_ROWS = 3
const FOCUS_ROWS = 3
const INTERNAL_ROUTES_ROWS = 4
const EXTERNAL_ROUTES_ROWS = 4
const VALUE_CAPTURE_ROWS = 3
const PORTFOLIO_ROWS = 4
const THEMATIC_ROWS = 5
const AUDIENCE_MAP_ROWS = 3
const VISIBILITY_MATRIX_ROWS = 4
const BACKLOG_ROWS = 8
const FUNNEL_ROWS = 6
const KPI_SHEET_ROWS = 4
const BASELINE_ROWS = 4
const EXECUTIVE_ROWS = 4

const LADDER_LEVELS: LadderLevel[] = ['Entrada', 'Núcleo', 'Escalamiento']

const FORMAT_OPTIONS = [
    'Workshop',
    'Mentoría',
    'Sesión 1:1',
    'Taller',
    'Programa',
    'Consultoría',
    'Diagnóstico',
    'Contenido asíncrono',
    'Framework / plantilla'
] as const

const LADDER_COHERENCE_QUESTIONS = [
    '¿Cada nivel resuelve un problema claro?',
    '¿Hay progresión lógica entre niveles?',
    '¿La oferta de entrada abre camino a la núcleo?',
    '¿La oferta núcleo concentra mi mayor valor?',
    '¿La oferta premium escala profundidad real?',
    '¿Las ofertas son fáciles de entender?'
] as const

const PACKAGING_TEST_QUESTIONS = [
    '¿Identifiqué mis activos de conocimiento?',
    '¿Los conecté con problemas y transformación?',
    '¿Mi escalera de valor se entiende?',
    '¿Los niveles están bien diferenciados?',
    '¿Definí una oferta prioritaria?',
    '¿Mi talento ya está empaquetado con más claridad?'
] as const

const TRANSFERABLE_ASSET_SIGNALS = [
    'capacidad',
    'metod',
    'framework',
    'diagnóstico',
    'ruta',
    'síntesis',
    'facilitación',
    'modelo',
    'proceso',
    'herramienta'
] as const

const VAGUE_TRANSFORMATION_TERMS = ['mejorar', 'apoyar', 'ayudar', 'acompañar', 'optimizar', 'potenciar'] as const
const BUSINESS_MODEL_CANVAS_DIMENSIONS = [
    'Oferta / capacidad central',
    'Quién recibe el valor',
    'Problema que resuelve',
    'Resultado que produce',
    'Cómo capturo el valor',
    'Evidencia que la hace creíble'
] as const
const MODEL_COHERENCE_QUESTIONS = [
    '¿Diferencio monetización interna y externa?',
    '¿Tengo unidades de valor claras?',
    '¿Sé cómo capturo valor en cada ruta?',
    '¿He comparado valor, esfuerzo y escalabilidad?',
    '¿Definí una prioridad de foco?',
    '¿Tengo una hipótesis concreta a validar?'
] as const
const ACTIVATION_OPTIONS = ['Fácil', 'Media', 'Difícil'] as const
const CAPTURABLE_VALUE_OPTIONS = ['Bajo', 'Medio', 'Medio-alto', 'Alto'] as const
const PORTFOLIO_QUADRANT_OPTIONS = [
    'Foco inmediato',
    'Apostar con validación',
    'Táctico / de entrada',
    'No priorizar aún'
] as const
const PORTFOLIO_DECISION_OPTIONS = ['Priorizar', 'Pilotear', 'Mantener', 'Ajustar', 'Pausar', 'Descartar'] as const
const MONETIZABLE_UNIT_SIGNALS = [
    'diagnóstico',
    'mentoría',
    'taller',
    'programa',
    'consultoría',
    'sesión',
    'licencia',
    'producto',
    'servicio',
    'oferta',
    'framework'
] as const
const VISIBILITY_COHERENCE_QUESTIONS = [
    '¿Definí pilares temáticos claros?',
    '¿La visibilidad conecta con mis ofertas?',
    '¿Cada canal tiene un rol definido?',
    '¿Tengo backlog priorizado?',
    '¿La cadencia es sostenible?',
    '¿Podré medir visibilidad útil y no solo ruido?'
] as const
const CONTENT_TYPE_OPTIONS = [
    'Ideas breves / insights',
    'Hallazgos',
    'Frameworks',
    'Casos',
    'Análisis aplicable',
    'Invitaciones a conversación',
    'Invitaciones a diagnóstico',
    'Convocatorias a sesión',
    'Recomendaciones accionables'
] as const
const VISIBILITY_CHANNEL_OPTIONS = [
    'LinkedIn',
    'Reuniones',
    'Reuniones internas',
    'Correo ejecutivo',
    'Newsletter',
    'Eventos',
    'Comités',
    'Espacios internos',
    'Sesiones 1:1',
    'Webinars',
    'Podcast',
    'Blog',
    'YouTube',
    'Red interna'
] as const
const VISIBILITY_FORMAT_OPTIONS = [
    'Post',
    'Carrusel',
    'Artículo corto',
    'Insight breve',
    'Síntesis ejecutiva',
    'Reporte',
    'Conversación 1:1',
    'Mensaje directo',
    'Newsletter',
    'Presentación'
] as const
const VISIBILITY_FREQUENCY_OPTIONS = [
    '2 veces por semana',
    'Semanal',
    'Quincenal',
    'Mensual',
    '2-4 veces por mes',
    '4 por mes'
] as const
const VISIBILITY_METRIC_OPTIONS = [
    'Alcance',
    'Conversaciones iniciadas',
    'Invitaciones recibidas',
    'Solicitudes de reunión',
    'Respuestas',
    'Aperturas',
    'Leads',
    'Oportunidades abiertas'
] as const
const VISIBILITY_OBJECTIVE_OPTIONS = ['Atracción', 'Profundidad', 'Conversión'] as const
const VISIBILITY_PRIORITY_OPTIONS = ['Alta', 'Media-alta', 'Media', 'Baja'] as const
const GENERIC_TOPIC_TERMS = ['liderazgo', 'productividad', 'estrategia', 'marca', 'comunicación', 'negocio'] as const
const CONTROL_BOARD_QUESTIONS = [
    '¿El tablero responde una pregunta estratégica real?',
    '¿Distingue actividad, conversión y retorno?',
    '¿Evita métricas vanity como eje principal?',
    '¿Cada KPI tiene definición operativa?',
    '¿Sirve para tomar decisiones?',
    '¿Permite leer ROI interno y/o externo?'
] as const
const CONTROL_FOCUS_DIMENSIONS = [
    'Visibilidad',
    'Autoridad',
    'Conversaciones',
    'Monetización',
    'Posicionamiento interno',
    'Acceso / patrocinio'
] as const
const CONTROL_RETURN_TYPES = ['Interno', 'Externo', 'Mixto'] as const
const FUNNEL_STAGES = ['Alcance', 'Atención / interacción', 'Conversación', 'Oportunidad', 'Conversión', 'Retorno'] as const
const KPI_CATEGORIES = ['Alcance', 'Interacción', 'Conversación', 'Oportunidad', 'Conversión', 'Retorno'] as const
const KPI_TYPE_OPTIONS = ['Leading', 'Lagging'] as const
const TREND_OPTIONS = ['↑', '→', '↓'] as const
const KPI_STATUS_OPTIONS = ['Verde', 'Amarillo', 'Rojo'] as const
const KPI_DECISION_OPTIONS = ['Mantener', 'Ajustar', 'Escalar', 'Pausar', 'Rediseñar'] as const
const KPI_FREQUENCY_OPTIONS = ['Diaria', 'Semanal', 'Quincenal', 'Mensual'] as const
const KPI_OWNER_OPTIONS = ['Yo', 'Equipo', 'Mentor', 'Marketing', 'Comercial', 'Operaciones'] as const
const CONTROL_MAIN_QUESTION_OPTIONS = [
    '¿Mi visibilidad está generando conversaciones y oportunidades reales?',
    '¿Mis contenidos y canales están convirtiendo en oportunidades concretas?',
    '¿Qué tácticas están generando retorno y cuáles debo pausar?',
    '¿Estoy capturando ROI interno y externo con suficiente consistencia?'
] as const
const CONTROL_STRATEGIC_RESULT_OPTIONS = [
    'Aumento de autoridad y conversión a sesiones/proyectos',
    'Más oportunidades calificadas y mayor tasa de conversión',
    'Mayor acceso a espacios de decisión y patrocinio',
    'Incremento de retorno interno y externo medible'
] as const
const CONTROL_REVIEW_WEEKLY_OPTIONS = [
    'Revisar alcance, interacción y conversaciones abiertas',
    'Revisar desempeño por canal y CTA',
    'Revisar embudo de visibilidad y alertas tempranas'
] as const
const CONTROL_REVIEW_MONTHLY_OPTIONS = [
    'Revisar oportunidades, conversiones y retorno capturado',
    'Comparar resultados vs metas 30/90 días',
    'Decidir mantener, ajustar, escalar o pausar tácticas'
] as const
const CONTROL_DECISION_SIGNAL_OPTIONS = [
    'KPI en rojo dos semanas seguidas',
    'Alto alcance sin conversaciones cualificadas',
    'Caída sostenida de conversiones',
    'Sin retorno validado en 60 días'
] as const
const CONTROL_ASSOCIATED_DECISIONS_OPTIONS = [
    'Ajustar canal y mensaje',
    'Rediseñar CTA y secuencia de seguimiento',
    'Escalar táctica con mejor desempeño',
    'Pausar o reemplazar táctica improductiva'
] as const
const MENTOR_EVALUATION_CRITERIA = [
    'Análisis sistémico',
    'Decisión bajo incertidumbre',
    'Priorización de largo plazo',
    'Resolución de causa raíz',
    'Agilidad estratégica ante cambios'
] as const
const LEADER_EVALUATION_QUESTIONS = [
    '¿Estoy operando o pensando estratégicamente en mi rol actual?',
    '¿Qué decisión importante estoy postergando por miedo o incertidumbre?',
    '¿Qué patrón sistémico no estoy viendo claramente?',
    '¿Qué problema estoy tratando como síntoma en lugar de causa raíz?',
    '¿Qué riesgo estratégico debo asumir este trimestre?'
] as const
const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']
const MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 – Declarativo',
        descriptor: 'Análisis superficial; decisiones reactivas.'
    },
    {
        level: 'Nivel 2 – Consciente',
        descriptor: 'Identifica patrones pero duda en decisiones críticas.'
    },
    {
        level: 'Nivel 3 – Integrado',
        descriptor: 'Evalúa escenarios y decide con criterio consistente.'
    },
    {
        level: 'Nivel 4 – Alineación Estratégica',
        descriptor: 'Anticipa riesgos y oportunidades; impacta estrategia organizacional.'
    }
] as const
const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Mentor' },
    { key: 'leader', label: 'Líder' },
    { key: 'synthesis', label: 'Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const createDefaultEvaluationData = (): WB8State['evaluation'] => ({
    mentorRows: MENTOR_EVALUATION_CRITERIA.map((criterion) => ({
        criterion,
        level: '' as MentorLevel,
        evidence: '',
        decision: '' as MentorDecision
    })),
    mentorGeneralNotes: '',
    mentorGlobalDecision: '' as MentorDecision,
    leaderRows: LEADER_EVALUATION_QUESTIONS.map((question) => ({
        question,
        response: '',
        evidence: '',
        action: ''
    })),
    agreementsSynthesis: ''
})

const isMentorEvaluationRowComplete = (row: MentorEvaluationRow): boolean =>
    row.level !== '' && row.evidence.trim().length > 0 && row.decision !== ''

const isLeaderEvaluationRowComplete = (row: LeaderEvaluationRow): boolean =>
    row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')
const readYesNo = (value: unknown): YesNoAnswer => (value === 'yes' || value === 'no' ? value : '')
const readScore = (value: unknown): Score15 => (value === '1' || value === '2' || value === '3' || value === '4' || value === '5' ? value : '')

const buildFocusPriority = (row: WB8State['valueLadderSection']['focusDecisionRows'][number]): string => {
    const scores = [row.problemClarity, row.deliveryCapability, row.differentiation, row.adoptionEase, row.expectedReturn]
    if (scores.some((item) => item === '')) return ''
    const total = scores.reduce((sum, item) => sum + Number(item), 0)
    if (total >= 23) return 'Muy alta'
    if (total >= 19) return 'Alta'
    if (total >= 15) return 'Media'
    return 'Baja'
}

const buildThematicDecision = (row: WB8State['visibilityStrategySection']['thematicAuditRows'][number]): string => {
    const scores = [row.realExperience, row.differential, row.audienceRelevance, row.offerConnection]
    if (scores.some((item) => item === '')) return ''
    const total = scores.reduce((sum, item) => sum + Number(item), 0)
    if (total >= 18) return 'Pilar principal'
    if (total >= 15) return 'Pilar secundario'
    if (total >= 12) return 'Pilar de apoyo'
    return 'No priorizar'
}

const buildChannelPrimaryRole = (channel: string): string => {
    const normalized = channel.trim().toLowerCase()
    if (!normalized) return ''
    if (normalized.includes('linkedin') || normalized.includes('blog') || normalized.includes('youtube') || normalized.includes('podcast')) {
        return 'Visibilidad y autoridad'
    }
    if (
        normalized.includes('reuni') ||
        normalized.includes('comit') ||
        normalized.includes('intern')
    ) {
        return 'Influencia y reputación'
    }
    if (normalized.includes('newsletter') || normalized.includes('correo')) {
        return 'Profundidad y nurturing'
    }
    if (normalized.includes('1:1') || normalized.includes('sesion') || normalized.includes('sesión')) {
        return 'Conversión y relacionamiento'
    }
    if (normalized.includes('evento') || normalized.includes('webinar')) {
        return 'Relacionamiento y posicionamiento'
    }
    return 'Visibilidad estratégica'
}

const parseNumberOrNull = (value: string): number | null => {
    const normalized = value.replace(',', '.').trim()
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
}

const suggestGoal30 = (baseline: string): string => {
    const numeric = parseNumberOrNull(baseline)
    if (numeric === null) return ''
    if (numeric === 0) return '1'
    return String(Math.max(1, Math.round(numeric * 1.5)))
}

const suggestGoal90 = (baseline: string): string => {
    const numeric = parseNumberOrNull(baseline)
    if (numeric === null) return ''
    if (numeric === 0) return '3'
    return String(Math.max(1, Math.round(numeric * 3)))
}

const suggestAlertThreshold = (baseline: string): string => {
    const numeric = parseNumberOrNull(baseline)
    if (numeric === null) return ''
    return `Menos de ${Math.max(1, Math.floor(numeric * 0.8))}`
}

const suggestCorrectiveAction = (kpi: string): string => {
    const normalized = kpi.toLowerCase()
    if (normalized.includes('alcance')) return 'Revisar audiencia objetivo y formato del contenido'
    if (normalized.includes('interacci')) return 'Ajustar mensaje y llamado a la acción'
    if (normalized.includes('conversa')) return 'Reforzar CTA y seguimiento uno a uno'
    if (normalized.includes('oportun')) return 'Aumentar frecuencia de contacto estratégico'
    if (normalized.includes('conversi')) return 'Optimizar propuesta y proceso de cierre'
    if (normalized.includes('retorno') || normalized.includes('ingreso')) return 'Replantear oferta y canal de conversión'
    return 'Revisar canal, mensaje y secuencia de conversión'
}

const computeTokenSimilarity = (left: string, right: string): number => {
    const leftTokens = new Set(
        left
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 2)
    )
    const rightTokens = new Set(
        right
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 2)
    )

    if (leftTokens.size === 0 || rightTokens.size === 0) return 0
    const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length
    const union = new Set([...Array.from(leftTokens), ...Array.from(rightTokens)]).size
    return union === 0 ? 0 : intersection / union
}

const DEFAULT_STATE: WB8State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    valueLadderSection: {
        assetsInventory: Array.from({ length: ASSETS_ROWS }, () => ''),
        problemTransformationRows: Array.from({ length: MATRIX_ROWS }, () => ({
            solvableProblem: '',
            facilitatedTransformation: '',
            supportingAsset: '',
            naturalFormat: ''
        })),
        ladderRows: LADDER_LEVELS.map((level) => ({
            level,
            offerName: '',
            solvedProblem: '',
            mainOutcome: '',
            deliveryFormat: '',
            durationScope: ''
        })),
        ladderCoherenceTest: LADDER_COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        })),
        focusDecisionRows: Array.from({ length: FOCUS_ROWS }, () => ({
            offer: '',
            problemClarity: '' as Score15,
            deliveryCapability: '' as Score15,
            differentiation: '' as Score15,
            adoptionEase: '' as Score15,
            expectedReturn: '' as Score15
        })),
        packagingTest: PACKAGING_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    businessModelSection: {
        internalRoutes: Array.from({ length: INTERNAL_ROUTES_ROWS }, () => ''),
        externalRoutes: Array.from({ length: EXTERNAL_ROUTES_ROWS }, () => ''),
        monetizationCanvas: BUSINESS_MODEL_CANVAS_DIMENSIONS.map((dimension) => ({
            dimension,
            internalRoute: '',
            externalRoute: ''
        })),
        valueCaptureMatrixRows: Array.from({ length: VALUE_CAPTURE_ROWS }, () => ({
            valueUnit: '',
            perceivedValue: '' as Score15,
            comprehensionEase: '' as Score15,
            deliveryEffort: '' as Score15,
            scalability: '' as Score15,
            valueCapture: '' as Score15,
            dependencyRisk: '' as Score15
        })),
        portfolioRows: Array.from({ length: PORTFOLIO_ROWS }, () => ({
            offerRoute: '',
            activationEase: '',
            capturableValue: '',
            quadrant: '',
            decision: ''
        })),
        monetizationHypothesis: {
            mainHypothesis: '',
            confirmingSignal: '',
            weakeningSignal: '',
            minimumViableTest: '',
            validationWindow: '',
            followUpDecision: ''
        },
        modelCoherenceTest: MODEL_COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    visibilityStrategySection: {
        thematicAuditRows: Array.from({ length: THEMATIC_ROWS }, () => ({
            possibleTopic: '',
            realExperience: '' as Score15,
            differential: '' as Score15,
            audienceRelevance: '' as Score15,
            offerConnection: '' as Score15
        })),
        audienceMapRows: Array.from({ length: AUDIENCE_MAP_ROWS }, () => ({
            keyAudience: '',
            mainTension: '',
            strategicMessage: '',
            mainChannel: '',
            suggestedFormat: ''
        })),
        editorialArchitecture: {
            contentPillars: Array.from({ length: 3 }, () => ''),
            contentTypes: {
                attraction: '',
                depth: '',
                conversion: ''
            },
            mainChannels: Array.from({ length: 3 }, () => '')
        },
        channelRoleMatrixRows: Array.from({ length: VISIBILITY_MATRIX_ROWS }, () => ({
            channel: '',
            primaryRole: '',
            minimumFrequency: '',
            shownSignal: '',
            primaryMetric: ''
        })),
        backlogRows: Array.from({ length: BACKLOG_ROWS }, () => ({
            topicPiece: '',
            pillar: '',
            objective: '',
            channel: '',
            format: '',
            valueSignal: '',
            priority: ''
        })),
        executionBoard: {
            minimumCadence: '',
            creationBlock: '',
            distributionBlock: '',
            reviewBlock: '',
            monthlyLearningCriteria: ''
        },
        visibilityCoherenceTest: VISIBILITY_COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    controlBoardSection: {
        dashboardGoal: {
            mainQuestion: '',
            strategicResult: '',
            primaryDimension: '',
            priorityReturnType: ''
        },
        funnelRows: FUNNEL_STAGES.map((stage) => ({
            stage,
            meaningInContext: '',
            possibleIndicator: ''
        })),
        criticalKpiRows: KPI_CATEGORIES.map((category) => ({
            category,
            selectedKpi: '',
            whyItMatters: '',
            indicatorType: ''
        })),
        kpiSheets: Array.from({ length: KPI_SHEET_ROWS }, () => ({
            kpiName: '',
            measuredVariable: '',
            formula: '',
            dataSource: '',
            frequency: '',
            owner: '',
            greenThreshold: '',
            yellowThreshold: '',
            redThreshold: '',
            associatedDecision: ''
        })),
        baselineRows: Array.from({ length: BASELINE_ROWS }, () => ({
            kpi: '',
            baselineCurrent: '',
            goal30: '',
            goal90: '',
            alertThreshold: '',
            correctiveAction: ''
        })),
        executiveRows: Array.from({ length: EXECUTIVE_ROWS }, () => ({
            kpi: '',
            currentValue: '',
            trend: '',
            goal: '',
            status: '',
            quickRead: '',
            decision: ''
        })),
        reviewCadence: {
            weeklyReview: '',
            monthlyReview: '',
            decisionSignals: '',
            associatedDecisions: ''
        },
        dashboardIntelligenceTest: CONTROL_BOARD_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    evaluation: createDefaultEvaluationData()
}

const normalizeState = (raw: unknown): WB8State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const valueLadderSection = (parsed.valueLadderSection ?? {}) as Record<string, unknown>
    const businessModelSection = (parsed.businessModelSection ?? {}) as Record<string, unknown>
    const visibilityStrategySection = (parsed.visibilityStrategySection ?? {}) as Record<string, unknown>
    const controlBoardSection = (parsed.controlBoardSection ?? {}) as Record<string, unknown>
    const rawEvaluation = (parsed.evaluation ?? {}) as Record<string, unknown>

    const rawAssetsInventory = Array.isArray(valueLadderSection.assetsInventory) ? valueLadderSection.assetsInventory : []
    const rawMatrixRows = Array.isArray(valueLadderSection.problemTransformationRows) ? valueLadderSection.problemTransformationRows : []
    const rawLadderRows = Array.isArray(valueLadderSection.ladderRows) ? valueLadderSection.ladderRows : []
    const rawLadderCoherenceTest = Array.isArray(valueLadderSection.ladderCoherenceTest) ? valueLadderSection.ladderCoherenceTest : []
    const rawFocusRows = Array.isArray(valueLadderSection.focusDecisionRows) ? valueLadderSection.focusDecisionRows : []
    const rawPackagingTest = Array.isArray(valueLadderSection.packagingTest) ? valueLadderSection.packagingTest : []
    const rawInternalRoutes = Array.isArray(businessModelSection.internalRoutes) ? businessModelSection.internalRoutes : []
    const rawExternalRoutes = Array.isArray(businessModelSection.externalRoutes) ? businessModelSection.externalRoutes : []
    const rawMonetizationCanvas = Array.isArray(businessModelSection.monetizationCanvas) ? businessModelSection.monetizationCanvas : []
    const rawValueCaptureMatrixRows = Array.isArray(businessModelSection.valueCaptureMatrixRows)
        ? businessModelSection.valueCaptureMatrixRows
        : []
    const rawPortfolioRows = Array.isArray(businessModelSection.portfolioRows) ? businessModelSection.portfolioRows : []
    const rawMonetizationHypothesis = (businessModelSection.monetizationHypothesis ?? {}) as Record<string, unknown>
    const rawModelCoherenceTest = Array.isArray(businessModelSection.modelCoherenceTest) ? businessModelSection.modelCoherenceTest : []
    const rawThematicAuditRows = Array.isArray(visibilityStrategySection.thematicAuditRows)
        ? visibilityStrategySection.thematicAuditRows
        : []
    const rawAudienceMapRows = Array.isArray(visibilityStrategySection.audienceMapRows) ? visibilityStrategySection.audienceMapRows : []
    const rawEditorialArchitecture = (visibilityStrategySection.editorialArchitecture ?? {}) as Record<string, unknown>
    const rawContentPillars = Array.isArray(rawEditorialArchitecture.contentPillars) ? rawEditorialArchitecture.contentPillars : []
    const rawContentTypes = (rawEditorialArchitecture.contentTypes ?? {}) as Record<string, unknown>
    const rawMainChannels = Array.isArray(rawEditorialArchitecture.mainChannels) ? rawEditorialArchitecture.mainChannels : []
    const rawChannelRoleMatrixRows = Array.isArray(visibilityStrategySection.channelRoleMatrixRows)
        ? visibilityStrategySection.channelRoleMatrixRows
        : []
    const rawBacklogRows = Array.isArray(visibilityStrategySection.backlogRows) ? visibilityStrategySection.backlogRows : []
    const rawExecutionBoard = (visibilityStrategySection.executionBoard ?? {}) as Record<string, unknown>
    const rawVisibilityCoherenceTest = Array.isArray(visibilityStrategySection.visibilityCoherenceTest)
        ? visibilityStrategySection.visibilityCoherenceTest
        : []
    const rawDashboardGoal = (controlBoardSection.dashboardGoal ?? {}) as Record<string, unknown>
    const rawFunnelRows = Array.isArray(controlBoardSection.funnelRows) ? controlBoardSection.funnelRows : []
    const rawCriticalKpiRows = Array.isArray(controlBoardSection.criticalKpiRows) ? controlBoardSection.criticalKpiRows : []
    const rawKpiSheets = Array.isArray(controlBoardSection.kpiSheets) ? controlBoardSection.kpiSheets : []
    const rawBaselineRows = Array.isArray(controlBoardSection.baselineRows) ? controlBoardSection.baselineRows : []
    const rawExecutiveRows = Array.isArray(controlBoardSection.executiveRows) ? controlBoardSection.executiveRows : []
    const rawReviewCadence = (controlBoardSection.reviewCadence ?? {}) as Record<string, unknown>
    const rawDashboardIntelligenceTest = Array.isArray(controlBoardSection.dashboardIntelligenceTest)
        ? controlBoardSection.dashboardIntelligenceTest
        : []
    const rawMentorRows = Array.isArray(rawEvaluation.mentorRows) ? rawEvaluation.mentorRows : []
    const rawLeaderRows = Array.isArray(rawEvaluation.leaderRows) ? rawEvaluation.leaderRows : []

    return {
        identification: {
            leaderName: readString(identification.leaderName),
            role: readString(identification.role),
            cohort: readString(identification.cohort),
            startDate: readString(identification.startDate)
        },
        valueLadderSection: {
            assetsInventory: Array.from({ length: ASSETS_ROWS }, (_, index) => readString(rawAssetsInventory[index])),
            problemTransformationRows: Array.from({ length: MATRIX_ROWS }, (_, index) => {
                const row = (rawMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    solvableProblem: readString(row.solvableProblem),
                    facilitatedTransformation: readString(row.facilitatedTransformation),
                    supportingAsset: readString(row.supportingAsset),
                    naturalFormat: readString(row.naturalFormat)
                }
            }),
            ladderRows: LADDER_LEVELS.map((level, index) => {
                const row = (rawLadderRows[index] ?? {}) as Record<string, unknown>
                return {
                    level,
                    offerName: readString(row.offerName),
                    solvedProblem: readString(row.solvedProblem),
                    mainOutcome: readString(row.mainOutcome),
                    deliveryFormat: readString(row.deliveryFormat),
                    durationScope: readString(row.durationScope)
                }
            }),
            ladderCoherenceTest: LADDER_COHERENCE_QUESTIONS.map((question, index) => {
                const row = (rawLadderCoherenceTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            }),
            focusDecisionRows: Array.from({ length: FOCUS_ROWS }, (_, index) => {
                const row = (rawFocusRows[index] ?? {}) as Record<string, unknown>
                return {
                    offer: readString(row.offer),
                    problemClarity: readScore(row.problemClarity),
                    deliveryCapability: readScore(row.deliveryCapability),
                    differentiation: readScore(row.differentiation),
                    adoptionEase: readScore(row.adoptionEase),
                    expectedReturn: readScore(row.expectedReturn)
                }
            }),
            packagingTest: PACKAGING_TEST_QUESTIONS.map((question, index) => {
                const row = (rawPackagingTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        businessModelSection: {
            internalRoutes: Array.from({ length: INTERNAL_ROUTES_ROWS }, (_, index) => readString(rawInternalRoutes[index])),
            externalRoutes: Array.from({ length: EXTERNAL_ROUTES_ROWS }, (_, index) => readString(rawExternalRoutes[index])),
            monetizationCanvas: BUSINESS_MODEL_CANVAS_DIMENSIONS.map((dimension, index) => {
                const row = (rawMonetizationCanvas[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    internalRoute: readString(row.internalRoute),
                    externalRoute: readString(row.externalRoute)
                }
            }),
            valueCaptureMatrixRows: Array.from({ length: VALUE_CAPTURE_ROWS }, (_, index) => {
                const row = (rawValueCaptureMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    valueUnit: readString(row.valueUnit),
                    perceivedValue: readScore(row.perceivedValue),
                    comprehensionEase: readScore(row.comprehensionEase),
                    deliveryEffort: readScore(row.deliveryEffort),
                    scalability: readScore(row.scalability),
                    valueCapture: readScore(row.valueCapture),
                    dependencyRisk: readScore(row.dependencyRisk)
                }
            }),
            portfolioRows: Array.from({ length: PORTFOLIO_ROWS }, (_, index) => {
                const row = (rawPortfolioRows[index] ?? {}) as Record<string, unknown>
                return {
                    offerRoute: readString(row.offerRoute),
                    activationEase: readString(row.activationEase),
                    capturableValue: readString(row.capturableValue),
                    quadrant: readString(row.quadrant),
                    decision: readString(row.decision)
                }
            }),
            monetizationHypothesis: {
                mainHypothesis: readString(rawMonetizationHypothesis.mainHypothesis),
                confirmingSignal: readString(rawMonetizationHypothesis.confirmingSignal),
                weakeningSignal: readString(rawMonetizationHypothesis.weakeningSignal),
                minimumViableTest: readString(rawMonetizationHypothesis.minimumViableTest),
                validationWindow: readString(rawMonetizationHypothesis.validationWindow),
                followUpDecision: readString(rawMonetizationHypothesis.followUpDecision)
            },
            modelCoherenceTest: MODEL_COHERENCE_QUESTIONS.map((question, index) => {
                const row = (rawModelCoherenceTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        visibilityStrategySection: {
            thematicAuditRows: Array.from({ length: THEMATIC_ROWS }, (_, index) => {
                const row = (rawThematicAuditRows[index] ?? {}) as Record<string, unknown>
                return {
                    possibleTopic: readString(row.possibleTopic),
                    realExperience: readScore(row.realExperience),
                    differential: readScore(row.differential),
                    audienceRelevance: readScore(row.audienceRelevance),
                    offerConnection: readScore(row.offerConnection)
                }
            }),
            audienceMapRows: Array.from({ length: AUDIENCE_MAP_ROWS }, (_, index) => {
                const row = (rawAudienceMapRows[index] ?? {}) as Record<string, unknown>
                return {
                    keyAudience: readString(row.keyAudience),
                    mainTension: readString(row.mainTension),
                    strategicMessage: readString(row.strategicMessage),
                    mainChannel: readString(row.mainChannel),
                    suggestedFormat: readString(row.suggestedFormat)
                }
            }),
            editorialArchitecture: {
                contentPillars: Array.from({ length: 3 }, (_, index) => readString(rawContentPillars[index])),
                contentTypes: {
                    attraction: readString(rawContentTypes.attraction),
                    depth: readString(rawContentTypes.depth),
                    conversion: readString(rawContentTypes.conversion)
                },
                mainChannels: Array.from({ length: 3 }, (_, index) => readString(rawMainChannels[index]))
            },
            channelRoleMatrixRows: Array.from({ length: VISIBILITY_MATRIX_ROWS }, (_, index) => {
                const row = (rawChannelRoleMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    channel: readString(row.channel),
                    primaryRole: readString(row.primaryRole),
                    minimumFrequency: readString(row.minimumFrequency),
                    shownSignal: readString(row.shownSignal),
                    primaryMetric: readString(row.primaryMetric)
                }
            }),
            backlogRows: Array.from({ length: BACKLOG_ROWS }, (_, index) => {
                const row = (rawBacklogRows[index] ?? {}) as Record<string, unknown>
                return {
                    topicPiece: readString(row.topicPiece),
                    pillar: readString(row.pillar),
                    objective: readString(row.objective),
                    channel: readString(row.channel),
                    format: readString(row.format),
                    valueSignal: readString(row.valueSignal),
                    priority: readString(row.priority)
                }
            }),
            executionBoard: {
                minimumCadence: readString(rawExecutionBoard.minimumCadence),
                creationBlock: readString(rawExecutionBoard.creationBlock),
                distributionBlock: readString(rawExecutionBoard.distributionBlock),
                reviewBlock: readString(rawExecutionBoard.reviewBlock),
                monthlyLearningCriteria: readString(rawExecutionBoard.monthlyLearningCriteria)
            },
            visibilityCoherenceTest: VISIBILITY_COHERENCE_QUESTIONS.map((question, index) => {
                const row = (rawVisibilityCoherenceTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        controlBoardSection: {
            dashboardGoal: {
                mainQuestion: readString(rawDashboardGoal.mainQuestion),
                strategicResult: readString(rawDashboardGoal.strategicResult),
                primaryDimension: readString(rawDashboardGoal.primaryDimension),
                priorityReturnType: readString(rawDashboardGoal.priorityReturnType)
            },
            funnelRows: FUNNEL_STAGES.map((stage, index) => {
                const row = (rawFunnelRows[index] ?? {}) as Record<string, unknown>
                return {
                    stage,
                    meaningInContext: readString(row.meaningInContext),
                    possibleIndicator: readString(row.possibleIndicator)
                }
            }),
            criticalKpiRows: KPI_CATEGORIES.map((category, index) => {
                const row = (rawCriticalKpiRows[index] ?? {}) as Record<string, unknown>
                return {
                    category,
                    selectedKpi: readString(row.selectedKpi),
                    whyItMatters: readString(row.whyItMatters),
                    indicatorType: readString(row.indicatorType)
                }
            }),
            kpiSheets: Array.from({ length: KPI_SHEET_ROWS }, (_, index) => {
                const row = (rawKpiSheets[index] ?? {}) as Record<string, unknown>
                return {
                    kpiName: readString(row.kpiName),
                    measuredVariable: readString(row.measuredVariable),
                    formula: readString(row.formula),
                    dataSource: readString(row.dataSource),
                    frequency: readString(row.frequency),
                    owner: readString(row.owner),
                    greenThreshold: readString(row.greenThreshold),
                    yellowThreshold: readString(row.yellowThreshold),
                    redThreshold: readString(row.redThreshold),
                    associatedDecision: readString(row.associatedDecision)
                }
            }),
            baselineRows: Array.from({ length: BASELINE_ROWS }, (_, index) => {
                const row = (rawBaselineRows[index] ?? {}) as Record<string, unknown>
                return {
                    kpi: readString(row.kpi),
                    baselineCurrent: readString(row.baselineCurrent),
                    goal30: readString(row.goal30),
                    goal90: readString(row.goal90),
                    alertThreshold: readString(row.alertThreshold),
                    correctiveAction: readString(row.correctiveAction)
                }
            }),
            executiveRows: Array.from({ length: EXECUTIVE_ROWS }, (_, index) => {
                const row = (rawExecutiveRows[index] ?? {}) as Record<string, unknown>
                return {
                    kpi: readString(row.kpi),
                    currentValue: readString(row.currentValue),
                    trend: readString(row.trend),
                    goal: readString(row.goal),
                    status: readString(row.status),
                    quickRead: readString(row.quickRead),
                    decision: readString(row.decision)
                }
            }),
            reviewCadence: {
                weeklyReview: readString(rawReviewCadence.weeklyReview),
                monthlyReview: readString(rawReviewCadence.monthlyReview),
                decisionSignals: readString(rawReviewCadence.decisionSignals),
                associatedDecisions: readString(rawReviewCadence.associatedDecisions)
            },
            dashboardIntelligenceTest: CONTROL_BOARD_QUESTIONS.map((question, index) => {
                const row = (rawDashboardIntelligenceTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        evaluation: {
            mentorRows: MENTOR_EVALUATION_CRITERIA.map((criterion, index) => {
                const row = (rawMentorRows[index] ?? {}) as Record<string, unknown>
                const level = readString(row.level)
                const decision = readString(row.decision)
                return {
                    criterion,
                    level: MENTOR_LEVEL_OPTIONS.includes(level as MentorLevel) ? (level as MentorLevel) : ('' as MentorLevel),
                    evidence: readString(row.evidence),
                    decision: MENTOR_DECISION_OPTIONS.includes(decision as MentorDecision)
                        ? (decision as MentorDecision)
                        : ('' as MentorDecision)
                }
            }),
            mentorGeneralNotes: readString(rawEvaluation.mentorGeneralNotes),
            mentorGlobalDecision: MENTOR_DECISION_OPTIONS.includes(readString(rawEvaluation.mentorGlobalDecision) as MentorDecision)
                ? (readString(rawEvaluation.mentorGlobalDecision) as MentorDecision)
                : ('' as MentorDecision),
            leaderRows: LEADER_EVALUATION_QUESTIONS.map((question, index) => {
                const row = (rawLeaderRows[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    response: readString(row.response),
                    evidence: readString(row.evidence),
                    action: readString(row.action)
                }
            }),
            agreementsSynthesis: readString(rawEvaluation.agreementsSynthesis)
        }
    }
}

export function WB8Digital() {
    const [state, setState] = useState<WB8State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showValueLadderHelp, setShowValueLadderHelp] = useState(false)
    const [showBusinessModelHelp, setShowBusinessModelHelp] = useState(false)
    const [showVisibilityStrategyHelp, setShowVisibilityStrategyHelp] = useState(false)
    const [showControlBoardHelp, setShowControlBoardHelp] = useState(false)
    const [mentorEvaluationEditModes, setMentorEvaluationEditModes] = useState<boolean[]>(
        () => state.evaluation.mentorRows.map(() => false)
    )
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        () => state.evaluation.leaderRows.map(() => false)
    )
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')
    const [showEvaluationLevelReference, setShowEvaluationLevelReference] = useState(false)

    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const rawState = window.localStorage.getItem(STORAGE_KEY)
            if (rawState) {
                setState(normalizeState(JSON.parse(rawState)))
            }

            const introSeen = window.localStorage.getItem(INTRO_SEEN_KEY) === '1'
            setHasSeenPresentationOnce(introSeen)

            const rawPage = window.localStorage.getItem(PAGE_STORAGE_KEY)
            if (rawPage) {
                const parsed = Number(rawPage)
                if (PAGES.some((page) => page.id === parsed)) {
                    setActivePage(parsed as WorkbookPageId)
                }
            }

            const rawVisited = window.localStorage.getItem(VISITED_STORAGE_KEY)
            if (rawVisited) {
                const parsedVisited = JSON.parse(rawVisited) as number[]
                const validVisited = parsedVisited.filter((page) => PAGES.some((candidate) => candidate.id === page))
                if (validVisited.length > 0) {
                    setVisitedPages(new Set(validVisited))
                }
            }
        } catch {
            setState(DEFAULT_STATE)
            setActivePage(1)
            setVisitedPages(new Set([1]))
        } finally {
            setIsHydrated(true)
        }
    }, [])

    useEffect(() => {
        if (!isHydrated || typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        window.localStorage.setItem(PAGE_STORAGE_KEY, String(activePage))
        window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(Array.from(visitedPages)))
        window.localStorage.setItem(INTRO_SEEN_KEY, hasSeenPresentationOnce ? '1' : '0')
    }, [activePage, hasSeenPresentationOnce, isHydrated, state, visitedPages])

    useEffect(() => {
        if (!isHydrated || hasSeenPresentationOnce || activePage !== 2) return

        setHasSeenPresentationOnce(true)
        setVisitedPages((prev) => {
            const next = new Set(prev)
            next.add(2)
            return next
        })
    }, [activePage, hasSeenPresentationOnce, isHydrated])

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current)
            }
        }
    }, [])

    const announceSave = (message: string) => {
        setSaveFeedback(message)
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current)
        }
        feedbackTimeoutRef.current = setTimeout(() => {
            setSaveFeedback('')
        }, 3200)
    }

    const markVisited = (pageId: WorkbookPageId) => {
        setVisitedPages((prev) => {
            const next = new Set(prev)
            next.add(pageId)
            return next
        })
    }

    const jumpToPage = (pageId: WorkbookPageId) => {
        setActivePage(pageId)
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const currentPageIndex = PAGES.findIndex((page) => page.id === activePage)
    const hasPrevPage = currentPageIndex > 0
    const hasNextPage = currentPageIndex >= 0 && currentPageIndex < PAGES.length - 1

    const goPrevPage = () => {
        if (!hasPrevPage) return
        jumpToPage(PAGES[currentPageIndex - 1].id)
    }

    const goNextPage = () => {
        if (!hasNextPage) return
        jumpToPage(PAGES[currentPageIndex + 1].id)
    }

    const savePage = (pageId: WorkbookPageId = activePage) => {
        markVisited(pageId)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            window.localStorage.setItem(PAGE_STORAGE_KEY, String(pageId))
        }
        const pageNumber = PAGES.findIndex((page) => page.id === pageId)
        announceSave(`Página ${pageNumber >= 0 ? pageNumber + 1 : pageId} guardada.`)
    }

    const updateIdentification = (field: keyof WB8State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateAssetInventory = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const assetsInventory = [...prev.valueLadderSection.assetsInventory]
            assetsInventory[index] = value
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    assetsInventory
                }
            }
        })
    }

    const updateProblemTransformationRow = (
        index: number,
        field: keyof WB8State['valueLadderSection']['problemTransformationRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const problemTransformationRows = [...prev.valueLadderSection.problemTransformationRows]
            problemTransformationRows[index] = {
                ...problemTransformationRows[index],
                [field]: value
            }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    problemTransformationRows
                }
            }
        })
    }

    const updateLadderRow = (
        index: number,
        field: keyof Omit<WB8State['valueLadderSection']['ladderRows'][number], 'level'>,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const ladderRows = [...prev.valueLadderSection.ladderRows]
            ladderRows[index] = {
                ...ladderRows[index],
                [field]: value
            }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    ladderRows
                }
            }
        })
    }

    const updateLadderCoherenceTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const ladderCoherenceTest = [...prev.valueLadderSection.ladderCoherenceTest]
            ladderCoherenceTest[index] =
                field === 'verdict'
                    ? { ...ladderCoherenceTest[index], verdict: readYesNo(value) }
                    : { ...ladderCoherenceTest[index], adjustment: value }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    ladderCoherenceTest
                }
            }
        })
    }

    const updateFocusDecisionRow = (
        index: number,
        field: keyof WB8State['valueLadderSection']['focusDecisionRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const focusDecisionRows = [...prev.valueLadderSection.focusDecisionRows]
            if (field === 'offer') {
                focusDecisionRows[index] = {
                    ...focusDecisionRows[index],
                    offer: value
                }
            } else {
                focusDecisionRows[index] = {
                    ...focusDecisionRows[index],
                    [field]: readScore(value)
                }
            }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    focusDecisionRows
                }
            }
        })
    }

    const updatePackagingTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const packagingTest = [...prev.valueLadderSection.packagingTest]
            packagingTest[index] =
                field === 'verdict'
                    ? { ...packagingTest[index], verdict: readYesNo(value) }
                    : { ...packagingTest[index], adjustment: value }
            return {
                ...prev,
                valueLadderSection: {
                    ...prev.valueLadderSection,
                    packagingTest
                }
            }
        })
    }

    const saveValueLadderBlock = (label: string) => {
        savePage(3)
        announceSave(`${label} guardado.`)
    }

    const updateInternalRoute = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const internalRoutes = [...prev.businessModelSection.internalRoutes]
            internalRoutes[index] = value
            return {
                ...prev,
                businessModelSection: {
                    ...prev.businessModelSection,
                    internalRoutes
                }
            }
        })
    }

    const updateExternalRoute = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const externalRoutes = [...prev.businessModelSection.externalRoutes]
            externalRoutes[index] = value
            return {
                ...prev,
                businessModelSection: {
                    ...prev.businessModelSection,
                    externalRoutes
                }
            }
        })
    }

    const updateMonetizationCanvasRow = (
        index: number,
        field: keyof Omit<WB8State['businessModelSection']['monetizationCanvas'][number], 'dimension'>,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const monetizationCanvas = [...prev.businessModelSection.monetizationCanvas]
            monetizationCanvas[index] = {
                ...monetizationCanvas[index],
                [field]: value
            }
            return {
                ...prev,
                businessModelSection: {
                    ...prev.businessModelSection,
                    monetizationCanvas
                }
            }
        })
    }

    const updateValueCaptureMatrixRow = (
        index: number,
        field: keyof WB8State['businessModelSection']['valueCaptureMatrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const valueCaptureMatrixRows = [...prev.businessModelSection.valueCaptureMatrixRows]
            if (field === 'valueUnit') {
                valueCaptureMatrixRows[index] = {
                    ...valueCaptureMatrixRows[index],
                    valueUnit: value
                }
            } else {
                valueCaptureMatrixRows[index] = {
                    ...valueCaptureMatrixRows[index],
                    [field]: readScore(value)
                }
            }

            return {
                ...prev,
                businessModelSection: {
                    ...prev.businessModelSection,
                    valueCaptureMatrixRows
                }
            }
        })
    }

    const updatePortfolioRow = (
        index: number,
        field: keyof WB8State['businessModelSection']['portfolioRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const portfolioRows = [...prev.businessModelSection.portfolioRows]
            portfolioRows[index] = {
                ...portfolioRows[index],
                [field]: value
            }
            return {
                ...prev,
                businessModelSection: {
                    ...prev.businessModelSection,
                    portfolioRows
                }
            }
        })
    }

    const updateMonetizationHypothesis = (
        field: keyof WB8State['businessModelSection']['monetizationHypothesis'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            businessModelSection: {
                ...prev.businessModelSection,
                monetizationHypothesis: {
                    ...prev.businessModelSection.monetizationHypothesis,
                    [field]: value
                }
            }
        }))
    }

    const updateModelCoherenceTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const modelCoherenceTest = [...prev.businessModelSection.modelCoherenceTest]
            modelCoherenceTest[index] =
                field === 'verdict'
                    ? { ...modelCoherenceTest[index], verdict: readYesNo(value) }
                    : { ...modelCoherenceTest[index], adjustment: value }
            return {
                ...prev,
                businessModelSection: {
                    ...prev.businessModelSection,
                    modelCoherenceTest
                }
            }
        })
    }

    const saveBusinessModelBlock = (label: string) => {
        savePage(4)
        announceSave(`${label} guardado.`)
    }

    const updateThematicAuditRow = (
        index: number,
        field: keyof WB8State['visibilityStrategySection']['thematicAuditRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const thematicAuditRows = [...prev.visibilityStrategySection.thematicAuditRows]
            thematicAuditRows[index] =
                field === 'possibleTopic'
                    ? { ...thematicAuditRows[index], possibleTopic: value }
                    : { ...thematicAuditRows[index], [field]: readScore(value) }
            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    thematicAuditRows
                }
            }
        })
    }

    const updateAudienceMapRow = (
        index: number,
        field: keyof WB8State['visibilityStrategySection']['audienceMapRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const audienceMapRows = [...prev.visibilityStrategySection.audienceMapRows]
            audienceMapRows[index] = {
                ...audienceMapRows[index],
                [field]: value
            }
            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    audienceMapRows
                }
            }
        })
    }

    const updateEditorialPillar = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const contentPillars = [...prev.visibilityStrategySection.editorialArchitecture.contentPillars]
            contentPillars[index] = value
            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    editorialArchitecture: {
                        ...prev.visibilityStrategySection.editorialArchitecture,
                        contentPillars
                    }
                }
            }
        })
    }

    const updateEditorialContentType = (
        field: keyof WB8State['visibilityStrategySection']['editorialArchitecture']['contentTypes'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            visibilityStrategySection: {
                ...prev.visibilityStrategySection,
                editorialArchitecture: {
                    ...prev.visibilityStrategySection.editorialArchitecture,
                    contentTypes: {
                        ...prev.visibilityStrategySection.editorialArchitecture.contentTypes,
                        [field]: value
                    }
                }
            }
        }))
    }

    const updateEditorialChannel = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const mainChannels = [...prev.visibilityStrategySection.editorialArchitecture.mainChannels]
            mainChannels[index] = value
            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    editorialArchitecture: {
                        ...prev.visibilityStrategySection.editorialArchitecture,
                        mainChannels
                    }
                }
            }
        })
    }

    const updateChannelRoleMatrixRow = (
        index: number,
        field: keyof WB8State['visibilityStrategySection']['channelRoleMatrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const channelRoleMatrixRows = [...prev.visibilityStrategySection.channelRoleMatrixRows]
            if (field === 'channel') {
                channelRoleMatrixRows[index] = {
                    ...channelRoleMatrixRows[index],
                    channel: value,
                    primaryRole: buildChannelPrimaryRole(value)
                }
            } else {
                channelRoleMatrixRows[index] = {
                    ...channelRoleMatrixRows[index],
                    [field]: value
                }
            }

            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    channelRoleMatrixRows
                }
            }
        })
    }

    const updateBacklogRow = (
        index: number,
        field: keyof WB8State['visibilityStrategySection']['backlogRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const backlogRows = [...prev.visibilityStrategySection.backlogRows]
            backlogRows[index] = {
                ...backlogRows[index],
                [field]: value
            }
            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    backlogRows
                }
            }
        })
    }

    const updateExecutionBoard = (
        field: keyof WB8State['visibilityStrategySection']['executionBoard'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            visibilityStrategySection: {
                ...prev.visibilityStrategySection,
                executionBoard: {
                    ...prev.visibilityStrategySection.executionBoard,
                    [field]: value
                }
            }
        }))
    }

    const updateVisibilityCoherenceTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const visibilityCoherenceTest = [...prev.visibilityStrategySection.visibilityCoherenceTest]
            visibilityCoherenceTest[index] =
                field === 'verdict'
                    ? { ...visibilityCoherenceTest[index], verdict: readYesNo(value) }
                    : { ...visibilityCoherenceTest[index], adjustment: value }
            return {
                ...prev,
                visibilityStrategySection: {
                    ...prev.visibilityStrategySection,
                    visibilityCoherenceTest
                }
            }
        })
    }

    const saveVisibilityStrategyBlock = (label: string) => {
        savePage(5)
        announceSave(`${label} guardado.`)
    }

    const updateDashboardGoal = (field: keyof WB8State['controlBoardSection']['dashboardGoal'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            controlBoardSection: {
                ...prev.controlBoardSection,
                dashboardGoal: {
                    ...prev.controlBoardSection.dashboardGoal,
                    [field]: value
                }
            }
        }))
    }

    const updateFunnelRow = (
        index: number,
        field: keyof Omit<WB8State['controlBoardSection']['funnelRows'][number], 'stage'>,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const funnelRows = [...prev.controlBoardSection.funnelRows]
            funnelRows[index] = {
                ...funnelRows[index],
                [field]: value
            }
            return {
                ...prev,
                controlBoardSection: {
                    ...prev.controlBoardSection,
                    funnelRows
                }
            }
        })
    }

    const updateCriticalKpiRow = (
        index: number,
        field: keyof Omit<WB8State['controlBoardSection']['criticalKpiRows'][number], 'category'>,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const criticalKpiRows = [...prev.controlBoardSection.criticalKpiRows]
            criticalKpiRows[index] = {
                ...criticalKpiRows[index],
                [field]: value
            }
            return {
                ...prev,
                controlBoardSection: {
                    ...prev.controlBoardSection,
                    criticalKpiRows
                }
            }
        })
    }

    const updateKpiSheetRow = (
        index: number,
        field: keyof WB8State['controlBoardSection']['kpiSheets'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const kpiSheets = [...prev.controlBoardSection.kpiSheets]
            kpiSheets[index] = {
                ...kpiSheets[index],
                [field]: value
            }
            return {
                ...prev,
                controlBoardSection: {
                    ...prev.controlBoardSection,
                    kpiSheets
                }
            }
        })
    }

    const updateBaselineRow = (
        index: number,
        field: keyof WB8State['controlBoardSection']['baselineRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const baselineRows = [...prev.controlBoardSection.baselineRows]
            const current = baselineRows[index]
            const nextRow = { ...current, [field]: value }

            if (field === 'baselineCurrent') {
                if (!nextRow.goal30.trim()) nextRow.goal30 = suggestGoal30(value)
                if (!nextRow.goal90.trim()) nextRow.goal90 = suggestGoal90(value)
                if (!nextRow.alertThreshold.trim()) nextRow.alertThreshold = suggestAlertThreshold(value)
            }
            if (field === 'kpi') {
                if (!nextRow.correctiveAction.trim()) nextRow.correctiveAction = suggestCorrectiveAction(value)
            }

            baselineRows[index] = nextRow
            return {
                ...prev,
                controlBoardSection: {
                    ...prev.controlBoardSection,
                    baselineRows
                }
            }
        })
    }

    const updateExecutiveRow = (
        index: number,
        field: keyof WB8State['controlBoardSection']['executiveRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const executiveRows = [...prev.controlBoardSection.executiveRows]
            executiveRows[index] = {
                ...executiveRows[index],
                [field]: value
            }
            return {
                ...prev,
                controlBoardSection: {
                    ...prev.controlBoardSection,
                    executiveRows
                }
            }
        })
    }

    const updateReviewCadence = (field: keyof WB8State['controlBoardSection']['reviewCadence'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            controlBoardSection: {
                ...prev.controlBoardSection,
                reviewCadence: {
                    ...prev.controlBoardSection.reviewCadence,
                    [field]: value
                }
            }
        }))
    }

    const updateDashboardIntelligenceTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const dashboardIntelligenceTest = [...prev.controlBoardSection.dashboardIntelligenceTest]
            dashboardIntelligenceTest[index] =
                field === 'verdict'
                    ? { ...dashboardIntelligenceTest[index], verdict: readYesNo(value) }
                    : { ...dashboardIntelligenceTest[index], adjustment: value }
            return {
                ...prev,
                controlBoardSection: {
                    ...prev.controlBoardSection,
                    dashboardIntelligenceTest
                }
            }
        })
    }

    const saveControlBoardBlock = (label: string) => {
        savePage(6)
        announceSave(`${label} guardado.`)
    }

    const editMentorEvaluationRow = (index: number) => {
        if (isLocked) return
        setMentorEvaluationEditModes((prev) => prev.map((item, rowIndex) => (rowIndex === index ? true : item)))
    }

    const saveMentorEvaluationRow = (index: number) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.evaluation.mentorRows]
            const row = nextRows[index]
            if (!row) return prev
            nextRows[index] = {
                ...row,
                evidence: row.evidence.trim()
            }
            return {
                ...prev,
                evaluation: {
                    ...prev.evaluation,
                    mentorRows: nextRows
                }
            }
        })
        setMentorEvaluationEditModes((prev) => prev.map((item, rowIndex) => (rowIndex === index ? false : item)))
        announceSave(`Fila mentor ${index + 1} guardada.`)
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
        markVisited(7)
        announceSave('Cierre del mentor guardado.')
    }

    const editLeaderEvaluationRow = (index: number) => {
        if (isLocked) return
        setLeaderEvaluationEditModes((prev) => prev.map((item, rowIndex) => (rowIndex === index ? true : item)))
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
        setLeaderEvaluationEditModes((prev) => prev.map((item, rowIndex) => (rowIndex === index ? false : item)))
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
        markVisited(7)
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
        savePage(7)
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

    const waitForRenderCycle = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

    const exportPdf = async () => {
        if (typeof window === 'undefined') return
        setIsExporting(true)
        setIsExportingAll(true)
        await waitForRenderCycle()
        try {
            const currentTitle = document.title
            document.title = 'WB8 - Pensamiento estratégico y toma de decisiones'
            window.print()
            document.title = currentTitle
            announceSave('PDF completo generado (usa "Guardar como PDF" en el diálogo).')
        } finally {
            setIsExportingAll(false)
            setIsExporting(false)
        }
    }

    const exportHtml = async () => {
        if (typeof window === 'undefined') return
        setIsExporting(true)
        setIsExportingAll(true)
        await waitForRenderCycle()
        try {
            const origin = window.location.origin
            let htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML
            htmlContent = htmlContent.replace(/\b(href|src)=\"\/(?!\/)/g, `$1=\"${origin}/`)

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'WB8-pensamiento-estrategico-completo.html'
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

    const valueLadderSection = state.valueLadderSection
    const businessModelSection = state.businessModelSection
    const assetsInventory = valueLadderSection.assetsInventory
    const nonEmptyAssets = assetsInventory.map((item) => item.trim()).filter((item) => item.length > 0)

    const assetsCompleted = assetsInventory.every((item) => item.trim().length > 0)
    const matrixCompleted = valueLadderSection.problemTransformationRows.every(
        (row) =>
            row.solvableProblem.trim().length > 0 &&
            row.facilitatedTransformation.trim().length > 0 &&
            row.supportingAsset.trim().length > 0 &&
            row.naturalFormat.trim().length > 0
    )
    const ladderCompleted = valueLadderSection.ladderRows.every(
        (row) =>
            row.offerName.trim().length > 0 &&
            row.solvedProblem.trim().length > 0 &&
            row.mainOutcome.trim().length > 0 &&
            row.deliveryFormat.trim().length > 0 &&
            row.durationScope.trim().length > 0
    )
    const coherenceCompleted = valueLadderSection.ladderCoherenceTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const focusCompleted = valueLadderSection.focusDecisionRows.every(
        (row) =>
            row.offer.trim().length > 0 &&
            row.problemClarity !== '' &&
            row.deliveryCapability !== '' &&
            row.differentiation !== '' &&
            row.adoptionEase !== '' &&
            row.expectedReturn !== ''
    )
    const packagingCompleted = valueLadderSection.packagingTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section3Completed = assetsCompleted && matrixCompleted && ladderCompleted && coherenceCompleted && focusCompleted && packagingCompleted

    const assetsOnlyThemes =
        nonEmptyAssets.length > 0 &&
        nonEmptyAssets.every((asset) => {
            const normalized = asset.toLowerCase()
            return !TRANSFERABLE_ASSET_SIGNALS.some((signal) => normalized.includes(signal))
        })

    const ladderSummaries = valueLadderSection.ladderRows.map((row) => `${row.offerName} ${row.solvedProblem} ${row.mainOutcome}`.trim())
    let similarOffers = false
    for (let index = 0; index < ladderSummaries.length; index += 1) {
        for (let comparison = index + 1; comparison < ladderSummaries.length; comparison += 1) {
            if (computeTokenSimilarity(ladderSummaries[index], ladderSummaries[comparison]) > 0.82) {
                similarOffers = true
            }
        }
    }

    const noPriorityOffer = valueLadderSection.focusDecisionRows.every((row) => buildFocusPriority(row).length === 0)

    const vagueTransformation = valueLadderSection.problemTransformationRows.some((row) => {
        const transformed = row.facilitatedTransformation.trim().toLowerCase()
        if (transformed.length === 0) return false
        return transformed.length < 24 || VAGUE_TRANSFORMATION_TERMS.some((term) => transformed.includes(term))
    })

    const ladderMinimumDesigned = valueLadderSection.ladderRows.every(
        (row) => row.offerName.trim().length > 0 && row.solvedProblem.trim().length > 0 && row.mainOutcome.trim().length > 0
    )

    const internalRoutes = businessModelSection.internalRoutes
    const externalRoutes = businessModelSection.externalRoutes
    const hypothesis = businessModelSection.monetizationHypothesis

    const monetizationInventoryCompleted =
        internalRoutes.every((route) => route.trim().length > 0) && externalRoutes.every((route) => route.trim().length > 0)
    const monetizationCanvasCompleted = businessModelSection.monetizationCanvas.every(
        (row) => row.internalRoute.trim().length > 0 && row.externalRoute.trim().length > 0
    )
    const monetizationMatrixCompleted = businessModelSection.valueCaptureMatrixRows.every(
        (row) =>
            row.valueUnit.trim().length > 0 &&
            row.perceivedValue !== '' &&
            row.comprehensionEase !== '' &&
            row.deliveryEffort !== '' &&
            row.scalability !== '' &&
            row.valueCapture !== '' &&
            row.dependencyRisk !== ''
    )
    const monetizationPortfolioCompleted = businessModelSection.portfolioRows.every(
        (row) =>
            row.offerRoute.trim().length > 0 &&
            row.activationEase.trim().length > 0 &&
            row.capturableValue.trim().length > 0 &&
            row.quadrant.trim().length > 0 &&
            row.decision.trim().length > 0
    )
    const monetizationHypothesisCompleted =
        hypothesis.mainHypothesis.trim().length > 0 &&
        hypothesis.confirmingSignal.trim().length > 0 &&
        hypothesis.weakeningSignal.trim().length > 0 &&
        hypothesis.minimumViableTest.trim().length > 0 &&
        hypothesis.validationWindow.trim().length > 0 &&
        hypothesis.followUpDecision.trim().length > 0
    const monetizationCoherenceCompleted = businessModelSection.modelCoherenceTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section4Completed =
        monetizationInventoryCompleted &&
        monetizationCanvasCompleted &&
        monetizationMatrixCompleted &&
        monetizationPortfolioCompleted &&
        monetizationHypothesisCompleted &&
        monetizationCoherenceCompleted

    const hasAtLeastOneInternalRoute = internalRoutes.some((route) => route.trim().length > 0)
    const hasAtLeastOneExternalRoute = externalRoutes.some((route) => route.trim().length > 0)
    const hasHypothesisBase = hypothesis.mainHypothesis.trim().length > 0
    const section4MinimumReady = hasAtLeastOneInternalRoute && hasAtLeastOneExternalRoute && hasHypothesisBase

    const portfolioOfferOptions = Array.from(
        new Set(
            [
                ...internalRoutes.map((item) => item.trim()),
                ...externalRoutes.map((item) => item.trim()),
                ...businessModelSection.valueCaptureMatrixRows.map((item) => item.valueUnit.trim())
            ].filter((item) => item.length > 0)
        )
    )

    const nonEmptyValueUnits = businessModelSection.valueCaptureMatrixRows.map((row) => row.valueUnit.trim()).filter((row) => row.length > 0)
    const unitsOnlyThemes =
        nonEmptyValueUnits.length > 0 &&
        nonEmptyValueUnits.every((unit) => {
            const normalized = unit.toLowerCase()
            return !MONETIZABLE_UNIT_SIGNALS.some((signal) => normalized.includes(signal))
        })

    const routesNotDifferentiated =
        !hasAtLeastOneInternalRoute ||
        !hasAtLeastOneExternalRoute ||
        internalRoutes.every((route, index) => route.trim().length > 0 && route.trim() === externalRoutes[index]?.trim())

    const filledMatrixRows = businessModelSection.valueCaptureMatrixRows.filter((row) => row.valueUnit.trim().length > 0)
    const highEffortLowClarity =
        filledMatrixRows.length > 0 &&
        filledMatrixRows.every((row) => Number(row.deliveryEffort) >= 4 && Number(row.comprehensionEase) <= 2)

    const missingHypothesisTest =
        hypothesis.mainHypothesis.trim().length === 0 ||
        hypothesis.minimumViableTest.trim().length === 0 ||
        hypothesis.validationWindow.trim().length === 0

    const visibilityStrategySection = state.visibilityStrategySection
    const thematicRows = visibilityStrategySection.thematicAuditRows
    const audienceMapRows = visibilityStrategySection.audienceMapRows
    const editorialArchitecture = visibilityStrategySection.editorialArchitecture
    const channelRoleMatrixRows = visibilityStrategySection.channelRoleMatrixRows
    const backlogRows = visibilityStrategySection.backlogRows
    const executionBoard = visibilityStrategySection.executionBoard

    const thematicAuditCompleted = thematicRows.every(
        (row) =>
            row.possibleTopic.trim().length > 0 &&
            row.realExperience !== '' &&
            row.differential !== '' &&
            row.audienceRelevance !== '' &&
            row.offerConnection !== ''
    )
    const audienceMapCompleted = audienceMapRows.every(
        (row) =>
            row.keyAudience.trim().length > 0 &&
            row.mainTension.trim().length > 0 &&
            row.strategicMessage.trim().length > 0 &&
            row.mainChannel.trim().length > 0 &&
            row.suggestedFormat.trim().length > 0
    )
    const editorialArchitectureCompleted =
        editorialArchitecture.contentPillars.every((item) => item.trim().length > 0) &&
        editorialArchitecture.contentTypes.attraction.trim().length > 0 &&
        editorialArchitecture.contentTypes.depth.trim().length > 0 &&
        editorialArchitecture.contentTypes.conversion.trim().length > 0 &&
        editorialArchitecture.mainChannels.every((item) => item.trim().length > 0)
    const channelRoleMatrixCompleted = channelRoleMatrixRows.every(
        (row) =>
            row.channel.trim().length > 0 &&
            row.primaryRole.trim().length > 0 &&
            row.minimumFrequency.trim().length > 0 &&
            row.shownSignal.trim().length > 0 &&
            row.primaryMetric.trim().length > 0
    )
    const backlogCompleted = backlogRows.every(
        (row) =>
            row.topicPiece.trim().length > 0 &&
            row.pillar.trim().length > 0 &&
            row.objective.trim().length > 0 &&
            row.channel.trim().length > 0 &&
            row.format.trim().length > 0 &&
            row.valueSignal.trim().length > 0 &&
            row.priority.trim().length > 0
    )
    const executionBoardCompleted =
        executionBoard.minimumCadence.trim().length > 0 &&
        executionBoard.creationBlock.trim().length > 0 &&
        executionBoard.distributionBlock.trim().length > 0 &&
        executionBoard.reviewBlock.trim().length > 0 &&
        executionBoard.monthlyLearningCriteria.trim().length > 0
    const visibilityCoherenceCompleted = visibilityStrategySection.visibilityCoherenceTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section5Completed =
        thematicAuditCompleted &&
        audienceMapCompleted &&
        editorialArchitectureCompleted &&
        channelRoleMatrixCompleted &&
        backlogCompleted &&
        executionBoardCompleted &&
        visibilityCoherenceCompleted

    const hasPillars = editorialArchitecture.contentPillars.some((item) => item.trim().length > 0)
    const hasChannels = editorialArchitecture.mainChannels.some((item) => item.trim().length > 0)
    const hasCadence = executionBoard.minimumCadence.trim().length > 0
    const section5MinimumReady = hasPillars && hasChannels && hasCadence

    const nonEmptyTopics = thematicRows.map((row) => row.possibleTopic.trim()).filter((item) => item.length > 0)
    const topicsTooGeneric =
        nonEmptyTopics.length > 0 &&
        nonEmptyTopics.every((topic) => {
            const normalized = topic.toLowerCase()
            return normalized.split(/\s+/).length <= 2 || GENERIC_TOPIC_TERMS.some((term) => normalized === term)
        })

    const noOfferOrMonetizationConnection =
        thematicRows.some((row) => row.possibleTopic.trim().length > 0) &&
        thematicRows
            .filter((row) => row.offerConnection !== '')
            .every((row) => Number(row.offerConnection) <= 2)

    const selectedChannelsWithRole = channelRoleMatrixRows
        .filter((row) => row.channel.trim().length > 0)
        .map((row) => row.primaryRole.trim())
        .filter((role) => role.length > 0)
    const sameRoleAcrossChannels =
        selectedChannelsWithRole.length >= 2 && new Set(selectedChannelsWithRole).size === 1

    const missingPrimaryMetric = channelRoleMatrixRows.some(
        (row) => row.channel.trim().length > 0 && row.primaryMetric.trim().length === 0
    )

    const cadenceTooAmbitious = /diari|todos los d[ií]as|7\s*piezas|5\s*piezas|4\s*piezas/i.test(executionBoard.minimumCadence)

    const controlBoardSection = state.controlBoardSection
    const dashboardGoal = controlBoardSection.dashboardGoal
    const funnelRows = controlBoardSection.funnelRows
    const criticalKpiRows = controlBoardSection.criticalKpiRows
    const kpiSheets = controlBoardSection.kpiSheets
    const baselineRows = controlBoardSection.baselineRows
    const executiveRows = controlBoardSection.executiveRows
    const reviewCadence = controlBoardSection.reviewCadence
    const dashboardIntelligenceTest = controlBoardSection.dashboardIntelligenceTest

    const dashboardGoalCompleted =
        dashboardGoal.mainQuestion.trim().length > 0 &&
        dashboardGoal.strategicResult.trim().length > 0 &&
        dashboardGoal.primaryDimension.trim().length > 0 &&
        dashboardGoal.priorityReturnType.trim().length > 0
    const funnelCompleted = funnelRows.every(
        (row) => row.meaningInContext.trim().length > 0 && row.possibleIndicator.trim().length > 0
    )
    const criticalKpiCompleted = criticalKpiRows.every(
        (row) => row.selectedKpi.trim().length > 0 && row.whyItMatters.trim().length > 0 && row.indicatorType.trim().length > 0
    )
    const kpiSheetsCompleted = kpiSheets.every(
        (row) =>
            row.kpiName.trim().length > 0 &&
            row.measuredVariable.trim().length > 0 &&
            row.formula.trim().length > 0 &&
            row.dataSource.trim().length > 0 &&
            row.frequency.trim().length > 0 &&
            row.owner.trim().length > 0 &&
            row.greenThreshold.trim().length > 0 &&
            row.yellowThreshold.trim().length > 0 &&
            row.redThreshold.trim().length > 0 &&
            row.associatedDecision.trim().length > 0
    )
    const baselineCompleted = baselineRows.every(
        (row) =>
            row.kpi.trim().length > 0 &&
            row.baselineCurrent.trim().length > 0 &&
            row.goal30.trim().length > 0 &&
            row.goal90.trim().length > 0 &&
            row.alertThreshold.trim().length > 0 &&
            row.correctiveAction.trim().length > 0
    )
    const executiveCompleted = executiveRows.every(
        (row) =>
            row.kpi.trim().length > 0 &&
            row.currentValue.trim().length > 0 &&
            row.trend.trim().length > 0 &&
            row.goal.trim().length > 0 &&
            row.status.trim().length > 0 &&
            row.quickRead.trim().length > 0 &&
            row.decision.trim().length > 0
    )
    const reviewCadenceCompleted =
        reviewCadence.weeklyReview.trim().length > 0 &&
        reviewCadence.monthlyReview.trim().length > 0 &&
        reviewCadence.decisionSignals.trim().length > 0 &&
        reviewCadence.associatedDecisions.trim().length > 0
    const dashboardIntelligenceCompleted = dashboardIntelligenceTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section6Completed =
        dashboardGoalCompleted &&
        funnelCompleted &&
        criticalKpiCompleted &&
        kpiSheetsCompleted &&
        baselineCompleted &&
        executiveCompleted &&
        reviewCadenceCompleted &&
        dashboardIntelligenceCompleted

    const hasFunnelBase = funnelRows.some(
        (row) => row.meaningInContext.trim().length > 0 && row.possibleIndicator.trim().length > 0
    )
    const hasCriticalKpiBase = criticalKpiRows.some(
        (row) => row.selectedKpi.trim().length > 0 && row.whyItMatters.trim().length > 0 && row.indicatorType.trim().length > 0
    )
    const hasAtLeastOneGoal = baselineRows.some((row) => row.goal30.trim().length > 0 || row.goal90.trim().length > 0)
    const section6MinimumReady = hasFunnelBase && hasCriticalKpiBase && hasAtLeastOneGoal

    const kpiCatalog = Array.from(
        new Set(
            [
                ...criticalKpiRows.map((row) => row.selectedKpi.trim()),
                ...kpiSheets.map((row) => row.kpiName.trim())
            ].filter((item) => item.length > 0)
        )
    )

    const tooManyKpis = kpiCatalog.length > 10

    const selectedCriticalRows = criticalKpiRows.filter((row) => row.selectedKpi.trim().length > 0)
    const onlyActivityKpis =
        selectedCriticalRows.length > 0 &&
        selectedCriticalRows.every(
            (row) => row.category.toLowerCase().includes('alcance') || row.category.toLowerCase().includes('interacción')
        )

    const missingFormulaOrSource = kpiSheets.some(
        (row) => row.kpiName.trim().length > 0 && (row.formula.trim().length === 0 || row.dataSource.trim().length === 0)
    )
    const missingThresholdsOrDecisions = kpiSheets.some(
        (row) =>
            row.kpiName.trim().length > 0 &&
            (row.greenThreshold.trim().length === 0 ||
                row.yellowThreshold.trim().length === 0 ||
                row.redThreshold.trim().length === 0 ||
                row.associatedDecision.trim().length === 0)
    )

    const roiSignals = `${funnelRows.map((row) => row.possibleIndicator).join(' ')} ${criticalKpiRows
        .map((row) => row.selectedKpi)
        .join(' ')}`.toLowerCase()
    const mentionsInternal = roiSignals.includes('intern') || dashboardGoal.priorityReturnType.toLowerCase().includes('intern')
    const mentionsExternal = roiSignals.includes('extern') || dashboardGoal.priorityReturnType.toLowerCase().includes('extern')
    const noRoiDistinction =
        dashboardGoal.priorityReturnType.trim().length === 0 ||
        (dashboardGoal.priorityReturnType.toLowerCase() === 'mixto' && !(mentionsInternal && mentionsExternal))

    const evaluation = state.evaluation
    const mentorCompletedRows = evaluation.mentorRows.filter((row) => isMentorEvaluationRowComplete(row)).length
    const leaderCompletedRows = evaluation.leaderRows.filter((row) => isLeaderEvaluationRowComplete(row)).length
    const mentorStageComplete =
        mentorCompletedRows === evaluation.mentorRows.length &&
        evaluation.mentorGeneralNotes.trim().length > 0 &&
        evaluation.mentorGlobalDecision !== ''
    const leaderStageComplete = leaderCompletedRows === evaluation.leaderRows.length
    const synthesisStageComplete = evaluation.agreementsSynthesis.trim().length > 0
    const evaluationSectionComplete = mentorStageComplete && leaderStageComplete && synthesisStageComplete
    const evaluationStageIndex = EVALUATION_STAGES.findIndex((stage) => stage.key === evaluationStage)
    const hasPrevEvaluationStage = evaluationStageIndex > 0
    const hasNextEvaluationStage = evaluationStageIndex >= 0 && evaluationStageIndex < EVALUATION_STAGES.length - 1
    const evaluationStageCompletionMap: Record<EvaluationStageKey, boolean> = {
        mentor: mentorStageComplete,
        leader: leaderStageComplete,
        synthesis: synthesisStageComplete,
        final: evaluationSectionComplete
    }
    const section7Completed = evaluationSectionComplete

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: section3Completed,
        4: section4Completed,
        5: section5Completed,
        6: section6Completed,
        7: section7Completed
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const currentPage = PAGES[currentPageIndex]
    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    if (!isHydrated) {
        return <div className="p-6 text-sm text-slate-500">Cargando workbook...</div>
    }

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb8-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB8 - Pensamiento estratégico y toma de decisiones</p>
                    </div>

                    <span className={WORKBOOK_V2_EDITORIAL.classes.progressPill}>Avance: {progressPercent}%</span>
                    {saveFeedback && <span className={WORKBOOK_V2_EDITORIAL.classes.savedPill}>{saveFeedback}</span>}
                    {isExporting && <span className={WORKBOOK_V2_EDITORIAL.classes.exportingPill}>{WORKBOOK_V2_EDITORIAL.labels.exportingAll}</span>}

                    <button type="button" onClick={() => setIsLocked((prev) => !prev)} className={WORKBOOK_V2_EDITORIAL.classes.lockButton}>
                        <Lock size={14} />
                        {isLocked ? WORKBOOK_V2_EDITORIAL.labels.fieldsLocked : WORKBOOK_V2_EDITORIAL.labels.fieldsEditable}
                    </button>

                    <button
                        type="button"
                        onClick={() => savePage(activePage)}
                        disabled={isLocked || isExporting}
                        className={WORKBOOK_V2_EDITORIAL.classes.saveButton}
                    >
                        Guardar página {currentPage ? currentPageIndex + 1 : activePage}
                    </button>

                    <button type="button" onClick={exportPdf} disabled={isExporting} className={WORKBOOK_V2_EDITORIAL.classes.pdfButton}>
                        <Printer size={14} />
                        {isExporting ? WORKBOOK_V2_EDITORIAL.labels.pdfLoading : WORKBOOK_V2_EDITORIAL.labels.pdfDownload}
                    </button>

                    <button type="button" onClick={exportHtml} disabled={isExporting} className={WORKBOOK_V2_EDITORIAL.classes.htmlButton}>
                        <FileText size={14} />
                        {isExporting ? WORKBOOK_V2_EDITORIAL.labels.htmlLoading : WORKBOOK_V2_EDITORIAL.labels.htmlDownload}
                    </button>
                </div>
            </header>

            <main className="wbv2-main max-w-[1280px] mx-auto px-2 sm:px-5 md:px-8 py-5 md:py-8 overflow-x-hidden">
                <div className={`grid gap-6 items-start ${isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-w-0'}`}>
                    <aside className={`wb8-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5">
                            {PAGES.map((page) => (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => jumpToPage(page.id)}
                                    disabled={page.id > 2 && !hasSeenPresentationOnce}
                                    className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                                        activePage === page.id
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                                    } disabled:opacity-55 disabled:cursor-not-allowed`}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="space-y-6">
                        {isPageVisible(1) && (
                            <article
                                className="wb8-print-page wb8-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 7"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb8-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Pensamiento estratégico y toma de decisiones
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 8</p>
                                        <p className="text-blue-600 text-sm">Sistema: 4Shine® · Pilar: Shine Up (Ecosistema relacional)</p>
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
                                                onChange={(event) => updateIdentification('leaderName', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Andrés Tabla"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Rol actual</span>
                                            <input
                                                type="text"
                                                value={state.identification.role}
                                                onChange={(event) => updateIdentification('role', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Director / Líder"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cohorte / Equipo</span>
                                            <input
                                                type="text"
                                                value={state.identification.cohort}
                                                onChange={(event) => updateIdentification('cohort', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Cohorte Ejecutiva 2026"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha de inicio</span>
                                            <input
                                                type="date"
                                                value={state.identification.startDate}
                                                onChange={(event) => updateIdentification('startDate', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </article>
                        )}

                        {isPageVisible(2) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-6 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 7"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Presentación del workbook
                                    </h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                        Diseñar una lógica estratégica para convertir conocimiento, experiencia y capacidades en propuestas de valor visibles,
                                        sostenibles y medibles, de modo que tu talento deje de estar disperso y pueda traducirse en oferta,
                                        posicionamiento y retorno.
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">Al finalizar este workbook tendrás:</p>
                                    <ul className="space-y-2">
                                        {[
                                            'Una escalera de valor para empaquetar tu conocimiento en ofertas.',
                                            'Un modelo de negocio personal/profesional para monetizar tu talento en escenarios internos y externos.',
                                            'Una estrategia de visibilidad conectada con contenidos y canales.',
                                            'Un tablero de control con KPIs de alcance, conversión y retorno.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Componentes trabajados</h3>
                                    <ul className="space-y-2">
                                        {[
                                            'Visión de futuro y estrategia',
                                            'Toma de decisiones y resolución de problemas',
                                            'Adaptabilidad e innovación',
                                            'Agilidad tecnológica (tech-savviness)'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Competencias 4Shine que vas a activar</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {[
                                            'Pensamiento estratégico',
                                            'Visión compartida (visioning)',
                                            'Gestión del error constructivo',
                                            'Decisión bajo incertidumbre',
                                            'Estimulación intelectual (innovación)',
                                            'Agilidad y adaptabilidad',
                                            'Resolución de causa raíz',
                                            'Liderazgo en la industria 5.0'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Conductas observables asociadas (qué se debería ver en tu día a día)</h3>
                                    <p className="text-sm text-slate-700">Usa estas conductas como referencia para escribir evidencia real (no intención):</p>
                                    <ul className="space-y-2">
                                        {[
                                            'Analiza tendencias macroeconómicas, tecnológicas y de la industria para anticipar impactos internos y externos.',
                                            'No se limita a apagar fuegos a corto plazo; dedica tiempo a planificación e iniciativas de largo alcance.',
                                            'Articula un escenario futuro aspiracional y moviliza visión compartida en el equipo.',
                                            'Comunica el por qué detrás de las metas para dar sentido y propósito al trabajo diario.',
                                            'Traduce la visión abstracta en objetivos SMART y planes de acción concretos.',
                                            'Asegura línea de vista entre tareas cotidianas, metas de corto plazo y estrategia general.',
                                            'Reúne datos y consulta expertos, pero decide a tiempo aun con información incompleta.',
                                            'Asume responsabilidad por las consecuencias de sus decisiones sin buscar culpables externos.',
                                            'Investiga causa raíz y evita quedarse en síntomas superficiales.',
                                            'Cuestiona suposiciones para reducir sesgos antes de decidir.',
                                            'Ajusta estrategia ante cambios tecnológicos o regulatorios, abandonando ideas que ya no funcionan.',
                                            'Fomenta una cultura donde el cambio se vive como oportunidad y no como amenaza.',
                                            'Desafía el statu quo y promueve nuevas formas de trabajo.',
                                            'Impulsa pilotos y pruebas de concepto antes de escalar soluciones.',
                                            'Respalda al equipo cuando un experimento falla y orienta el aprendizaje.',
                                            'Reduce el factor miedo y habilita riesgos calculados orientados a innovación.',
                                            'Promueve adopción de herramientas digitales cuidando el bienestar del equipo.',
                                            'Traduce conceptos tecnológicos complejos a decisiones estratégicas de negocio.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900">Reglas de oro</h3>
                                    <ul className="space-y-2">
                                        {[
                                            'No diseñes ofertas desde lo que “te gusta”; diséñalas desde valor real.',
                                            'No confundas visibilidad con ruido.',
                                            'No intentes monetizar todo al tiempo.',
                                            'Lo que no se empaqueta, no se entiende; lo que no se mide, no se mejora.',
                                            'Toda estrategia necesita una decisión de foco.',
                                            'Si no tienes evidencia, escribe: “No tengo evidencia reciente.”'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm text-blue-900 font-semibold">Instrucción de continuidad</p>
                                        <p className="text-sm text-slate-700 mt-1">
                                            Esta sección de presentación es informativa para el primer ingreso. Desde el segundo ingreso, el sistema retoma en la última página trabajada.
                                        </p>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 7"
                                data-print-title="Escalera de valor"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Escalera de valor: empaquetado de conocimiento en ofertas
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Convertir tu conocimiento, experiencia y capacidad de resolver problemas en una escalera de ofertas progresivas,
                                        para que tu valor deje de estar implícito y pueda ser entendido, probado y escalado.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowValueLadderHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Escalera de valor: arquitectura de ofertas organizada por niveles de profundidad, complejidad, transformación y precio/retorno.',
                                            'Oferta de entrada: propuesta de bajo umbral que permite mostrar valor rápido y generar primera confianza.',
                                            'Oferta núcleo: propuesta central donde se concentra tu mayor capacidad de resolver un problema relevante.',
                                            'Oferta premium o de escalamiento: propuesta de mayor profundidad, personalización, complejidad o impacto.',
                                            'Empaquetado de conocimiento: proceso de traducir saber, experiencia o criterio en un producto, servicio, formato o intervención legible.',
                                            'Problema pagable: problema por el que una persona, organización o sistema estaría dispuesto a invertir recursos, tiempo o atención.',
                                            'Activo de conocimiento: recurso reutilizable derivado de tu experiencia, como frameworks, metodologías, diagnósticos, rutas, plantillas, workshops, mentorías o contenidos.',
                                            'Transformación ofrecida: cambio concreto que una oferta promete facilitar.',
                                            'Gradiente de valor: progresión entre una oferta básica y una oferta avanzada, donde cada nivel aumenta claridad, profundidad o resultado.',
                                            'Fricción de compra o adopción: barrera que dificulta que una persona o sistema tome tu oferta, aunque el valor exista.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario de activos de conocimiento</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                assetsCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {assetsCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Lista activos reales: conocimientos, experiencias transferibles, metodologías, formatos y resultados que ya sabes producir.',
                                                'Evita listar temas genéricos; enfócate en capacidades y recursos transferibles.',
                                                'Usa evidencia de los últimos proyectos, conversaciones o entregables.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Activo 1: capacidad de traducir complejidad en estructura.',
                                                'Activo 2: diseño de herramientas de desarrollo.',
                                                'Activo 3: facilitación de procesos estratégicos.',
                                                'Activo 4: lectura de brechas de liderazgo.',
                                                'Activo 5: construcción de narrativas ejecutivas.',
                                                'Activo 6: diseño de rutas de aprendizaje.',
                                                'Activo 7: frameworks aplicados.',
                                                'Activo 8: capacidad de síntesis estratégica.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {valueLadderSection.assetsInventory.map((asset, index) => (
                                            <label key={`wb8-asset-${index}`} className="space-y-1 block">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Activo {index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={asset}
                                                    onChange={(event) => updateAssetInventory(index, event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 1 — Inventario de activos')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz problema–transformación–activo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                matrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {matrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Conecta cada problema que sabes resolver con una transformación concreta.',
                                                'Selecciona el activo que realmente sostiene esa transformación.',
                                                'Define el formato natural de entrega (sesión, taller, programa, consultoría, etc.).'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Falta de claridad estratégica | Ordenar foco y decisión | Síntesis + frameworks | Workshop / mentoría.',
                                                'Narrativa profesional difusa | Hacer visible valor con claridad | Storytelling ejecutivo | Sesión 1:1 / taller.',
                                                'Conocimiento disperso | Convertirlo en oferta legible | Ruta metodológica | Programa / consultoría.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1180px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Problema que sé resolver</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Transformación que puedo facilitar</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Activo que lo sostiene</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato natural</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.problemTransformationRows.map((row, index) => (
                                                    <tr key={`wb8-matrix-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.solvableProblem}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'solvableProblem', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.facilitatedTransformation}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'facilitatedTransformation', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[250px]">
                                                            <select
                                                                value={row.supportingAsset}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'supportingAsset', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona activo</option>
                                                                {nonEmptyAssets.map((asset, assetIndex) => (
                                                                    <option key={`wb8-asset-option-${assetIndex}-${asset}`} value={asset}>
                                                                        {asset}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[250px]">
                                                            <input
                                                                type="text"
                                                                value={row.naturalFormat}
                                                                onChange={(event) => updateProblemTransformationRow(index, 'naturalFormat', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveValueLadderBlock('Paso 2 — Matriz problema-transformación-activo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Diseño de escalera de valor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                ladderCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {ladderCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Diseña 3 niveles mínimos: Entrada, Núcleo y Escalamiento.',
                                                'Diferencia problema, resultado, formato y alcance para cada nivel.',
                                                'Asegura un gradiente real de valor entre niveles.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Entrada | Diagnóstico express | Falta de claridad inicial | Mapa rápido de foco | Sesión breve | 60 min.',
                                                'Núcleo | Ruta estratégica | Dispersión de talento/mensaje | Propuesta estructurada | Programa/consultoría | 4–6 semanas.',
                                                'Escalamiento | Acompañamiento premium | Implementación profunda | Transformación sostenida | Mentoría | 3 meses.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nombre de la oferta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Problema que resuelve</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Resultado principal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Duración / alcance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.ladderRows.map((row, index) => (
                                                    <tr key={`wb8-ladder-row-${row.level}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.level}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.offerName}
                                                                onChange={(event) => updateLadderRow(index, 'offerName', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.solvedProblem}
                                                                onChange={(event) => updateLadderRow(index, 'solvedProblem', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.mainOutcome}
                                                                onChange={(event) => updateLadderRow(index, 'mainOutcome', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.deliveryFormat}
                                                                onChange={(event) => updateLadderRow(index, 'deliveryFormat', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {FORMAT_OPTIONS.map((option) => (
                                                                    <option key={`wb8-ladder-format-${row.level}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.durationScope}
                                                                onChange={(event) => updateLadderRow(index, 'durationScope', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                        <h4 className="text-sm font-bold text-slate-900">Esquema visual de escalera</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {valueLadderSection.ladderRows.map((row, index) => (
                                                <div
                                                    key={`wb8-ladder-visual-${row.level}`}
                                                    className={`rounded-xl border bg-white p-3 ${
                                                        index === 1
                                                            ? 'border-blue-500 shadow-[0_6px_18px_rgba(59,130,246,0.18)]'
                                                            : 'border-blue-200'
                                                    }`}
                                                >
                                                    <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">{row.level}</p>
                                                    <p className="mt-2 text-sm font-bold text-slate-900">{row.offerName || 'Define nombre de oferta'}</p>
                                                    <p className="mt-1 text-xs text-slate-600">{row.mainOutcome || 'Define resultado principal'}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{row.durationScope || 'Define duración / alcance'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValueLadderBlock('Paso 3 — Diseño de escalera de valor')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Test de coherencia de la escalera</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                coherenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {coherenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Verifica si cada nivel resuelve un problema claro.',
                                                'Confirma que exista progresión lógica entre entrada, núcleo y escalamiento.',
                                                'Asegura que la oferta de entrada abra camino al nivel núcleo.',
                                                'Valida que la oferta núcleo concentre tu mayor valor y que la premium escale profundidad real.',
                                                'Comprueba que las ofertas se entiendan con facilidad.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: tres ofertas que parecen lo mismo con nombres distintos.',
                                                'Señal mejorada: tres niveles con distinta profundidad, distinto riesgo de entrada y una progresión clara.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.ladderCoherenceTest.map((row, index) => (
                                                    <tr key={`wb8-coherence-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateLadderCoherenceTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateLadderCoherenceTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveValueLadderBlock('Paso 4 — Test de coherencia')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Mapa de decisión de foco</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                focusCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {focusCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Evalúa cada oferta por claridad del problema, capacidad real de entrega, diferenciación, facilidad de adopción y retorno esperado.',
                                                'Usa la tabla para comparar opciones y evitar dispersión.',
                                                'El análisis automático de prioridad te ayuda a elegir foco inicial con criterio.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Diagnóstico express: Claridad 5, Capacidad 5, Diferenciación 3, Adopción 5, Retorno 3, Prioridad Alta.',
                                                'Ruta estratégica: Claridad 5, Capacidad 4, Diferenciación 5, Adopción 4, Retorno 5, Prioridad Muy alta.',
                                                'Acompañamiento premium: Claridad 4, Capacidad 3, Diferenciación 4, Adopción 2, Retorno 5, Prioridad Media.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Oferta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Claridad (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Capacidad (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Diferenciación (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Adopción (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Retorno (1-5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Prioridad (auto)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.focusDecisionRows.map((row, index) => {
                                                    const priority = buildFocusPriority(row)
                                                    return (
                                                        <tr key={`wb8-focus-row-${index}`}>
                                                            <td className="px-3 py-2 border-b border-slate-100 w-[230px]">
                                                                <select
                                                                    value={row.offer}
                                                                    onChange={(event) => updateFocusDecisionRow(index, 'offer', event.target.value)}
                                                                    disabled={isLocked}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona oferta</option>
                                                                    {valueLadderSection.ladderRows
                                                                        .map((item) => item.offerName.trim())
                                                                        .filter((name) => name.length > 0)
                                                                        .map((name) => (
                                                                            <option key={`wb8-focus-offer-${index}-${name}`} value={name}>
                                                                                {name}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            </td>
                                                            {(['problemClarity', 'deliveryCapability', 'differentiation', 'adoptionEase', 'expectedReturn'] as const).map(
                                                                (field) => (
                                                                    <td key={`wb8-focus-score-${index}-${field}`} className="px-3 py-2 border-b border-slate-100 w-[150px]">
                                                                        <select
                                                                            value={row[field]}
                                                                            onChange={(event) => updateFocusDecisionRow(index, field, event.target.value)}
                                                                            disabled={isLocked}
                                                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                        >
                                                                            <option value="">Selecciona</option>
                                                                            {['1', '2', '3', '4', '5'].map((option) => (
                                                                                <option key={`wb8-focus-score-option-${index}-${field}-${option}`} value={option}>
                                                                                    {option}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                )
                                                            )}
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {priority || 'Pendiente de datos'}
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
                                            onClick={() => saveValueLadderBlock('Paso 5 — Mapa de decisión de foco')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de empaquetado estratégico</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                packagingCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {packagingCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Confirma que identificaste activos reales y que los conectaste con problemas y transformaciones concretas.',
                                                'Verifica que la escalera se entienda y que los niveles estén claramente diferenciados.',
                                                'Asegura una oferta prioritaria para concentrar foco y ejecución.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: describir experiencia, pero no poder convertirla en oferta.',
                                                'Señal mejorada: traducir conocimiento en una escalera clara de soluciones con foco.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valueLadderSection.packagingTest.map((row, index) => (
                                                    <tr key={`wb8-packaging-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updatePackagingTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updatePackagingTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveValueLadderBlock('Paso 6 — Test de empaquetado estratégico')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                    <h3 className="text-base font-bold text-slate-900">Cierre de la sección</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">Cuando termines esta sección, deberías poder responder con más claridad:</p>
                                    <ul className="space-y-1.5">
                                        {[
                                            'Qué activos de conocimiento realmente tienes.',
                                            'Qué problemas sabes resolver.',
                                            'Cómo convertir ese valor en ofertas escalonadas.',
                                            'Cuál oferta debe ser tu foco inicial.',
                                            'Cómo dejar de presentar tu talento como algo difuso.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {assetsOnlyThemes && (
                                        <p className="text-sm text-amber-800">Sugerencia: convierte temas en capacidades o recursos transferibles.</p>
                                    )}
                                    {similarOffers && (
                                        <p className="text-sm text-amber-800">Sugerencia: diferencia mejor profundidad, formato y resultado.</p>
                                    )}
                                    {noPriorityOffer && (
                                        <p className="text-sm text-amber-800">Sugerencia: elige un foco inicial para evitar dispersión.</p>
                                    )}
                                    {vagueTransformation && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara qué cambio concreto produces.</p>
                                    )}
                                    {!assetsOnlyThemes && !similarOffers && !noPriorityOffer && !vagueTransformation && (
                                        <p className="text-sm text-emerald-700">
                                            Sin alertas: la escalera se ve diferenciada, con foco y transformación más concreta.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section3Completed
                                                    ? 'Completado: inventario + matriz + escalera + test + foco + test final diligenciados.'
                                                    : !ladderMinimumDesigned
                                                      ? 'Pendiente: diseña al menos una escalera mínima de 3 niveles (entrada, núcleo y escalamiento).'
                                                      : 'Pendiente: completa todos los bloques para cerrar la sección.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section3Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section3Completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 7"
                                data-print-title="Modelo de negocio"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Modelo de negocio: monetización del talento (Interno / Externo)
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diseñar un modelo de negocio personal/profesional que permita convertir tu talento en valor capturable,
                                        diferenciando rutas de monetización interna y externa, para tomar decisiones más estratégicas sobre foco,
                                        oferta, posicionamiento y retorno.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBusinessModelHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Modelo de negocio personal/profesional: arquitectura que explica cómo tu talento crea, entrega y captura valor de forma sostenible.',
                                            'Monetización interna: capacidad de traducir tu valor en crecimiento, influencia, presupuesto, visibilidad, responsabilidad ampliada, acceso a decisiones o compensación dentro de la organización.',
                                            'Monetización externa: capacidad de convertir tu talento en ingresos, contratos, alianzas, productos o servicios fuera de la estructura organizacional directa.',
                                            'Unidad de valor: pieza concreta por la que una audiencia estaría dispuesta a pagar, invertir, aprobar o respaldar.',
                                            'Captura de valor: forma en que el valor generado retorna hacia ti o hacia tu proyecto, ya sea en dinero, acceso, reputación, visibilidad, aprendizaje o poder de decisión.',
                                            'Motor de ingresos: mecanismo principal mediante el cual una oferta produce flujo económico o retorno tangible.',
                                            'Motor de influencia interna: mecanismo mediante el cual una oferta o capacidad genera promoción, visibilidad, expansión de rol, presupuesto o poder organizacional.',
                                            'Oferta monetizable: propuesta que resuelve un problema suficientemente relevante como para justificar inversión.',
                                            'Costo de entrega: recursos, tiempo, energía, reputación o estructura necesarios para producir y sostener una oferta.',
                                            'Escalabilidad razonable: capacidad de aumentar alcance o retorno sin que el costo de entrega crezca en la misma proporción.',
                                            'Margen estratégico: diferencia entre el valor capturado y el esfuerzo o costo requerido para sostener la oferta.',
                                            'Riesgo de dependencia: situación en la que toda la captura de valor depende de un solo cliente, un solo jefe, un solo canal o un solo formato.',
                                            'Portafolio de monetización: conjunto equilibrado de rutas, ofertas y fuentes de captura de valor.',
                                            'Hipótesis de negocio: suposición estratégica que debe ser validada antes de invertir demasiado tiempo o recursos.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario de rutas de monetización</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                monetizationInventoryCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {monetizationInventoryCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Primero mapea rutas posibles de captura de valor, no precios.',
                                                'Diferencia con claridad rutas internas (influencia, visibilidad, rol, presupuesto) y externas (servicios, productos, alianzas).',
                                                'Define rutas realistas para tu contexto actual.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-semibold text-slate-700">Rutas internas posibles</p>
                                                {[
                                                    'Liderar iniciativas estratégicas.',
                                                    'Convertirme en referente interno en narrativa y posicionamiento.',
                                                    'Ganar visibilidad en comités ampliados.',
                                                    'Traducir mi valor en mayor influencia y expansión de rol.'
                                                ].map((item) => (
                                                    <p key={item} className="text-sm text-slate-600">{item}</p>
                                                ))}
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-semibold text-slate-700">Rutas externas posibles</p>
                                                {[
                                                    'Mentoría ejecutiva.',
                                                    'Talleres de narrativa profesional.',
                                                    'Diagnóstico de posicionamiento o liderazgo.',
                                                    'Consultoría estratégica por proyectos.'
                                                ].map((item) => (
                                                    <p key={item} className="text-sm text-slate-600">{item}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900">Rutas internas posibles</h4>
                                            {businessModelSection.internalRoutes.map((route, index) => (
                                                <label key={`wb8-internal-route-${index}`} className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Ruta interna {index + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={route}
                                                        onChange={(event) => updateInternalRoute(index, event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                            ))}
                                        </article>
                                        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900">Rutas externas posibles</h4>
                                            {businessModelSection.externalRoutes.map((route, index) => (
                                                <label key={`wb8-external-route-${index}`} className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Ruta externa {index + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={route}
                                                        onChange={(event) => updateExternalRoute(index, event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                            ))}
                                        </article>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBusinessModelBlock('Paso 1 — Inventario de rutas')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Lienzo de monetización interno / externo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                monetizationCanvasCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {monetizationCanvasCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Completa el carril interno y externo con una lógica comparable de oferta, problema, resultado y captura.',
                                                'Evita respuestas genéricas: usa audiencias y resultados concretos.',
                                                'Incluye evidencia que haga creíble cada propuesta.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Oferta interna: capacidad de ordenar estrategia y foco | Oferta externa: mentoría en narrativa ejecutiva.',
                                                'Problema interno: dispersión y baja claridad | Problema externo: valor profesional poco visible.',
                                                'Captura interna: visibilidad y expansión de rol | Captura externa: honorarios por sesiones/programas.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ruta interna</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ruta externa</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {businessModelSection.monetizationCanvas.map((row, index) => (
                                                    <tr key={`wb8-canvas-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.internalRoute}
                                                                onChange={(event) => updateMonetizationCanvasRow(index, 'internalRoute', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.externalRoute}
                                                                onChange={(event) => updateMonetizationCanvasRow(index, 'externalRoute', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveBusinessModelBlock('Paso 2 — Lienzo interno/externo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Matriz unidad de valor–captura–esfuerzo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                monetizationMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {monetizationMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Evalúa cada unidad de valor con criterios comparables de 1 a 5.',
                                                'Incluye percepción de valor, comprensión, esfuerzo, escalabilidad, captura y riesgo de dependencia.',
                                                'Usa el resultado para decidir qué escalar primero.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Diagnóstico estratégico: valor 4, comprensión 5, esfuerzo 3, escalabilidad 4, captura 4, dependencia 2.',
                                                'Mentoría 1:1: valor 5, comprensión 4, esfuerzo 4, escalabilidad 2, captura 4, dependencia 3.',
                                                'Taller grupal: valor 4, comprensión 4, esfuerzo 3, escalabilidad 5, captura 5, dependencia 2.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Unidad de valor / oferta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor percibido</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Comprensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Esfuerzo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Escalabilidad</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Captura</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Riesgo dependencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {businessModelSection.valueCaptureMatrixRows.map((row, index) => (
                                                    <tr key={`wb8-value-capture-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.valueUnit}
                                                                onChange={(event) => updateValueCaptureMatrixRow(index, 'valueUnit', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        {(
                                                            ['perceivedValue', 'comprehensionEase', 'deliveryEffort', 'scalability', 'valueCapture', 'dependencyRisk'] as const
                                                        ).map((field) => (
                                                            <td key={`wb8-value-capture-score-${index}-${field}`} className="px-3 py-2 border-b border-slate-100 w-[140px]">
                                                                <select
                                                                    value={row[field]}
                                                                    onChange={(event) => updateValueCaptureMatrixRow(index, field, event.target.value)}
                                                                    disabled={isLocked}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb8-value-capture-score-option-${index}-${field}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBusinessModelBlock('Paso 3 — Matriz valor-captura-esfuerzo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Portafolio de monetización 2x2</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                monetizationPortfolioCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {monetizationPortfolioCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Ubica cada oferta/ruta según facilidad de activación y valor capturable.',
                                                'Asigna cuadrante y decisión para priorizar, pilotear, mantener o pausar.',
                                                'El objetivo es concentrar foco, no escalar todo al tiempo.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Diagnóstico express: fácil, alto valor, foco inmediato, decisión priorizar.',
                                                'Programa premium: difícil, alto valor, apostar con validación, decisión pilotear.',
                                                'Producto complejo no probado: difícil, bajo valor, no priorizar aún, decisión pausar.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Oferta / ruta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Activación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor capturable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cuadrante</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Decisión</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {businessModelSection.portfolioRows.map((row, index) => (
                                                    <tr key={`wb8-portfolio-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[280px]">
                                                            <select
                                                                value={row.offerRoute}
                                                                onChange={(event) => updatePortfolioRow(index, 'offerRoute', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona oferta/ruta</option>
                                                                {portfolioOfferOptions.map((option) => (
                                                                    <option key={`wb8-portfolio-offer-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.activationEase}
                                                                onChange={(event) => updatePortfolioRow(index, 'activationEase', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {ACTIVATION_OPTIONS.map((option) => (
                                                                    <option key={`wb8-portfolio-activation-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.capturableValue}
                                                                onChange={(event) => updatePortfolioRow(index, 'capturableValue', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {CAPTURABLE_VALUE_OPTIONS.map((option) => (
                                                                    <option key={`wb8-portfolio-value-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.quadrant}
                                                                onChange={(event) => updatePortfolioRow(index, 'quadrant', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {PORTFOLIO_QUADRANT_OPTIONS.map((option) => (
                                                                    <option key={`wb8-portfolio-quadrant-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.decision}
                                                                onChange={(event) => updatePortfolioRow(index, 'decision', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {PORTFOLIO_DECISION_OPTIONS.map((option) => (
                                                                    <option key={`wb8-portfolio-decision-option-${index}-${option}`} value={option}>
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

                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900">Esquema visual del portafolio 2x2</h4>
                                        <div className="relative h-[340px] rounded-xl border border-slate-300 bg-white overflow-hidden">
                                            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-300" />
                                            <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-300" />

                                            <div className="absolute top-3 left-3 text-xs font-semibold text-slate-600">Apostar con validación</div>
                                            <div className="absolute top-3 right-3 text-xs font-semibold text-slate-600">Foco inmediato</div>
                                            <div className="absolute bottom-3 left-3 text-xs font-semibold text-slate-600">No priorizar aún</div>
                                            <div className="absolute bottom-3 right-3 text-xs font-semibold text-slate-600">Táctico / de entrada</div>

                                            <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                                                Eje Y: potencial de captura de valor
                                            </div>
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                                                Eje X: facilidad de activación / adopción
                                            </div>

                                            {businessModelSection.portfolioRows.map((row, index) => {
                                                if (!row.offerRoute.trim()) return null
                                                const x =
                                                    row.activationEase === 'Fácil'
                                                        ? 78
                                                        : row.activationEase === 'Difícil'
                                                          ? 22
                                                          : 50
                                                const y =
                                                    row.capturableValue === 'Alto'
                                                        ? 18
                                                        : row.capturableValue === 'Medio-alto'
                                                          ? 32
                                                          : row.capturableValue === 'Bajo'
                                                            ? 78
                                                            : 50
                                                return (
                                                    <div
                                                        key={`wb8-portfolio-point-${index}-${row.offerRoute}`}
                                                        className="absolute -translate-x-1/2 -translate-y-1/2"
                                                        style={{ left: `${x}%`, top: `${y}%` }}
                                                    >
                                                        <div className="h-3 w-3 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.18)]" />
                                                        <p className="mt-1 text-[11px] font-semibold text-slate-700 whitespace-nowrap">{row.offerRoute}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBusinessModelBlock('Paso 4 — Portafolio 2x2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Hipótesis de monetización y validación</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                monetizationHypothesisCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {monetizationHypothesisCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Formula una hipótesis principal para tu ruta prioritaria.',
                                                'Define señales de confirmación y señales que debilitan la hipótesis.',
                                                'Diseña una prueba mínima viable con tiempo de validación y decisión posterior.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Hipótesis: existe demanda por mentoría breve para traducir experiencia en propuesta de valor clara.',
                                                'Confirmación: mínimo 3 conversaciones de interés real o una primera venta/piloto.',
                                                'Prueba: versión piloto en 30 días para decidir escalar, ajustar o descartar.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Hipótesis principal</span>
                                            <textarea
                                                value={businessModelSection.monetizationHypothesis.mainHypothesis}
                                                onChange={(event) => updateMonetizationHypothesis('mainHypothesis', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal que confirma</span>
                                            <textarea
                                                value={businessModelSection.monetizationHypothesis.confirmingSignal}
                                                onChange={(event) => updateMonetizationHypothesis('confirmingSignal', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal que debilita</span>
                                            <textarea
                                                value={businessModelSection.monetizationHypothesis.weakeningSignal}
                                                onChange={(event) => updateMonetizationHypothesis('weakeningSignal', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Prueba mínima viable</span>
                                            <textarea
                                                value={businessModelSection.monetizationHypothesis.minimumViableTest}
                                                onChange={(event) => updateMonetizationHypothesis('minimumViableTest', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Tiempo de validación</span>
                                            <input
                                                type="text"
                                                value={businessModelSection.monetizationHypothesis.validationWindow}
                                                onChange={(event) => updateMonetizationHypothesis('validationWindow', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión posterior</span>
                                            <input
                                                type="text"
                                                value={businessModelSection.monetizationHypothesis.followUpDecision}
                                                onChange={(event) => updateMonetizationHypothesis('followUpDecision', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBusinessModelBlock('Paso 5 — Hipótesis y validación')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de coherencia del modelo de negocio</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                monetizationCoherenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {monetizationCoherenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Verifica si ya diferencias monetización interna y externa.',
                                                'Confirma si tienes unidades de valor claras y captura definida por ruta.',
                                                'Evalúa si tu foco está priorizado y validado con hipótesis.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: varias ideas interesantes, pero sin lógica de captura de valor.',
                                                'Señal mejorada: rutas internas/externas diferenciadas, foco priorizado e hipótesis validable.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {businessModelSection.modelCoherenceTest.map((row, index) => (
                                                    <tr key={`wb8-model-coherence-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateModelCoherenceTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateModelCoherenceTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveBusinessModelBlock('Paso 6 — Test de coherencia del modelo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                    <h3 className="text-base font-bold text-slate-900">Cierre de la sección</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">Cuando termines esta sección, deberías poder responder con más claridad:</p>
                                    <ul className="space-y-1.5">
                                        {[
                                            'Cómo se monetiza tu talento dentro y fuera de una organización.',
                                            'Qué rutas tienen más sentido hoy.',
                                            'Qué ofertas tienen mejor balance entre valor, esfuerzo y captura.',
                                            'Cuál es tu foco inmediato.',
                                            'Qué hipótesis de negocio debes validar antes de escalar.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-slate-700">
                                        Este enfoque es coherente con el diagnóstico 4Shine en competencias como Pensamiento estratégico, Decisión bajo incertidumbre y Resolución de causa raíz, visibles en Shine Up.
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {unitsOnlyThemes && (
                                        <p className="text-sm text-amber-800">Sugerencia: convierte el talento en una oferta o capacidad más concreta.</p>
                                    )}
                                    {routesNotDifferentiated && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara cómo se captura valor dentro y fuera del sistema actual.</p>
                                    )}
                                    {highEffortLowClarity && (
                                        <p className="text-sm text-amber-800">Sugerencia: incluye una ruta de entrada más simple.</p>
                                    )}
                                    {missingHypothesisTest && (
                                        <p className="text-sm text-amber-800">Sugerencia: formula algo que puedas validar antes de invertir más.</p>
                                    )}
                                    {!unitsOnlyThemes && !routesNotDifferentiated && !highEffortLowClarity && !missingHypothesisTest && (
                                        <p className="text-sm text-emerald-700">
                                            Sin alertas: el modelo distingue rutas, foco y validación de hipótesis.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section4Completed
                                                    ? 'Completado: inventario + lienzo + matriz + 2x2 + hipótesis + test diligenciados.'
                                                    : !section4MinimumReady
                                                      ? 'Pendiente: define al menos una ruta interna, una externa y una hipótesis a validar.'
                                                      : 'Pendiente: completa todos los bloques para cerrar la sección.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section4Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section4Completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 7"
                                data-print-title="Estrategia de visibilidad"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Estrategia de visibilidad: plan de contenidos y canales
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diseñar una estrategia de visibilidad basada en contenidos y canales que traduzca tu pensamiento
                                        estratégico en presencia sostenida, legible y útil, para fortalecer posicionamiento, autoridad
                                        temática y generación de oportunidades.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVisibilityStrategyHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Estrategia de visibilidad: diseño deliberado de qué valor hacer visible, ante qué audiencias, por medio de qué contenidos, en qué canales y con qué frecuencia.',
                                            'Contenido estratégico: pieza de comunicación creada no solo para informar, sino para instalar una percepción, demostrar criterio, abrir conversación o activar una oportunidad.',
                                            'Pilar de contenido: eje temático estable que organiza tu visibilidad y evita dispersión.',
                                            'Canal: superficie o medio a través del cual distribuyes una señal de valor, por ejemplo reuniones, LinkedIn, correo ejecutivo, newsletter, eventos, comités o espacios internos.',
                                            'Rol del canal: función específica que cumple cada canal dentro de tu estrategia, como visibilidad, autoridad, relacionamiento, conversión o reputación.',
                                            'Señal de autoridad: evidencia visible de que dominas un campo, lees contextos, aportas criterio y produces valor confiable.',
                                            'Arquitectura editorial: estructura que conecta pilares temáticos, formatos, frecuencia, objetivos y audiencias en un sistema coherente.',
                                            'Cadencia de contenidos: ritmo mínimo y sostenible con el que haces visible tu valor sin depender de inspiración ocasional.',
                                            'Contenido de atracción: contenido que llama atención y amplía alcance.',
                                            'Contenido de profundidad: contenido que aumenta credibilidad y demuestra pensamiento propio.',
                                            'Contenido de conversión: contenido o pieza que abre una conversación, una solicitud, una reunión, una mentoría o una oportunidad.',
                                            'Sistema de distribución: lógica mediante la cual un mismo tema se traduce en distintos formatos y canales.',
                                            'ROI de visibilidad: retorno que la visibilidad genera en forma de oportunidades, conversaciones, reputación, leads, acceso o monetización.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Auditoría de autoridad temática</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                thematicAuditCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {thematicAuditCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Identifica temas donde tengas experiencia real, diferencial y conexión con tu oferta.',
                                                'Evalúa relevancia para la audiencia con escala de 1 a 5.',
                                                'No busques cubrir todo: decide foco temático y evita dispersión.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Narrativa ejecutiva: 5, 5, 5, 5, decisión Pilar principal.',
                                                'Claridad estratégica: 5, 4, 5, 5, decisión Pilar principal.',
                                                'Desarrollo de liderazgo: 4, 4, 4, 4, decisión Pilar secundario.',
                                                'Productividad general: 2, 2, 3, 1, decisión No priorizar.',
                                                'Marca profesional: 4, 4, 5, 4, decisión Pilar de apoyo.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tema posible</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Experiencia real</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Diferencial</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relevancia audiencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Conexión con oferta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Decisión (auto)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {thematicRows.map((row, index) => (
                                                    <tr key={`wb8-thematic-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.possibleTopic}
                                                                onChange={(event) => updateThematicAuditRow(index, 'possibleTopic', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        {(['realExperience', 'differential', 'audienceRelevance', 'offerConnection'] as const).map((field) => (
                                                            <td key={`wb8-thematic-score-${index}-${field}`} className="px-3 py-2 border-b border-slate-100 w-[160px]">
                                                                <select
                                                                    value={row[field]}
                                                                    onChange={(event) => updateThematicAuditRow(index, field, event.target.value)}
                                                                    disabled={isLocked}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb8-thematic-option-${index}-${field}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                            {buildThematicDecision(row) || 'Pendiente de datos'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityStrategyBlock('Paso 1 — Auditoría temática')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Mapa audiencia–problema–mensaje–canal</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                audienceMapCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {audienceMapCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define para cada audiencia su tensión principal y el mensaje estratégico a instalar.',
                                                'Selecciona un canal principal y formato sugerido de mayor ajuste.',
                                                'Conecta visibilidad con problema real de audiencia, no con intuición.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Líderes en transición | Tienen valor, pero no logran articularlo | Tu valor debe volverse legible y visible | LinkedIn / sesión 1:1 | post + carrusel + conversación.',
                                                'Sponsors internos | Ven ejecución, pero no siempre criterio estratégico | También aporto claridad y foco de decisión | reuniones / reportes | síntesis ejecutiva.',
                                                'Referentes externos | No me conocen lo suficiente | Tengo una lectura propia aplicable al liderazgo | LinkedIn / evento / newsletter | insight breve / artículo corto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Audiencia clave</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Problema/tensión principal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Mensaje estratégico</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Canal principal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato sugerido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {audienceMapRows.map((row, index) => (
                                                    <tr key={`wb8-audience-map-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.keyAudience}
                                                                onChange={(event) => updateAudienceMapRow(index, 'keyAudience', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.mainTension}
                                                                onChange={(event) => updateAudienceMapRow(index, 'mainTension', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.strategicMessage}
                                                                onChange={(event) => updateAudienceMapRow(index, 'strategicMessage', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.mainChannel}
                                                                onChange={(event) => updateAudienceMapRow(index, 'mainChannel', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_CHANNEL_OPTIONS.map((option) => (
                                                                    <option key={`wb8-audience-channel-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.suggestedFormat}
                                                                onChange={(event) => updateAudienceMapRow(index, 'suggestedFormat', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_FORMAT_OPTIONS.map((option) => (
                                                                    <option key={`wb8-audience-format-${index}-${option}`} value={option}>
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
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityStrategyBlock('Paso 2 — Mapa audiencia-problema-mensaje-canal')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Arquitectura editorial 3x3</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                editorialArchitectureCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {editorialArchitectureCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define 3 pilares de contenido para sostener reputación temática.',
                                                'Selecciona 3 tipos de contenido: atracción, profundidad y conversión.',
                                                'Elige 3 canales principales que realmente puedas sostener.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Pilares: Narrativa profesional, Claridad estratégica, Desarrollo de liderazgo.',
                                                'Tipos: Atracción (ideas breves e insights), Profundidad (frameworks/casos), Conversión (invitaciones a sesión o diagnóstico).',
                                                'Canales: LinkedIn, reuniones/espacios internos, newsletter o correo ejecutivo.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900">3 pilares de contenido</h4>
                                            {editorialArchitecture.contentPillars.map((pillar, index) => (
                                                <label key={`wb8-visibility-pillar-${index}`} className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Pilar {index + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={pillar}
                                                        onChange={(event) => updateEditorialPillar(index, event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                            ))}
                                        </article>
                                        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900">3 tipos de contenido</h4>
                                            <label className="space-y-1 block">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Atracción</span>
                                                <select
                                                    value={editorialArchitecture.contentTypes.attraction}
                                                    onChange={(event) => updateEditorialContentType('attraction', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                >
                                                    <option value="">Selecciona</option>
                                                    {CONTENT_TYPE_OPTIONS.map((option) => (
                                                        <option key={`wb8-content-type-attraction-${option}`} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="space-y-1 block">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Profundidad</span>
                                                <select
                                                    value={editorialArchitecture.contentTypes.depth}
                                                    onChange={(event) => updateEditorialContentType('depth', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                >
                                                    <option value="">Selecciona</option>
                                                    {CONTENT_TYPE_OPTIONS.map((option) => (
                                                        <option key={`wb8-content-type-depth-${option}`} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="space-y-1 block">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Conversión</span>
                                                <select
                                                    value={editorialArchitecture.contentTypes.conversion}
                                                    onChange={(event) => updateEditorialContentType('conversion', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                >
                                                    <option value="">Selecciona</option>
                                                    {CONTENT_TYPE_OPTIONS.map((option) => (
                                                        <option key={`wb8-content-type-conversion-${option}`} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </article>
                                        <article className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
                                            <h4 className="text-sm font-bold text-slate-900">3 canales principales</h4>
                                            {editorialArchitecture.mainChannels.map((channel, index) => (
                                                <label key={`wb8-visibility-channel-${index}`} className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Canal {index + 1}</span>
                                                    <select
                                                        value={channel}
                                                        onChange={(event) => updateEditorialChannel(index, event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    >
                                                        <option value="">Selecciona</option>
                                                        {VISIBILITY_CHANNEL_OPTIONS.map((option) => (
                                                            <option key={`wb8-editorial-channel-${index}-${option}`} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            ))}
                                        </article>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityStrategyBlock('Paso 3 — Arquitectura editorial 3x3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Matriz canal–rol–frecuencia–métrica</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                channelRoleMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {channelRoleMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Asigna a cada canal un rol principal (automático según canal seleccionado).',
                                                'Define frecuencia mínima sostenible, señal visible y métrica principal.',
                                                'No repitas canales sin función diferenciada.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'LinkedIn | Rol: Visibilidad y autoridad | Frecuencia: 2 veces por semana | Señal: lectura propia + claridad | Métrica: alcance y conversaciones iniciadas.',
                                                'Reuniones internas | Rol: Influencia y reputación | Frecuencia: 2–4 veces por mes | Señal: síntesis y criterio | Métrica: invitaciones a nuevas conversaciones.',
                                                'Newsletter | Rol: Profundidad y nurturing | Frecuencia: quincenal | Señal: análisis aplicable | Métrica: aperturas y respuestas.',
                                                '1:1 estratégicos | Rol: Conversión y relación | Frecuencia: 4 por mes | Señal: valor adaptado al interlocutor | Métrica: oportunidades abiertas.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Canal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Rol principal (auto)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Frecuencia mínima</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal que mostraré</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Métrica principal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {channelRoleMatrixRows.map((row, index) => (
                                                    <tr key={`wb8-channel-role-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.channel}
                                                                onChange={(event) => updateChannelRoleMatrixRow(index, 'channel', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_CHANNEL_OPTIONS.map((option) => (
                                                                    <option key={`wb8-channel-role-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <input
                                                                type="text"
                                                                value={row.primaryRole}
                                                                disabled
                                                                className="w-full rounded-xl border border-slate-300 bg-slate-100 text-slate-700 px-3 py-2 text-sm cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.minimumFrequency}
                                                                onChange={(event) => updateChannelRoleMatrixRow(index, 'minimumFrequency', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_FREQUENCY_OPTIONS.map((option) => (
                                                                    <option key={`wb8-frequency-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.shownSignal}
                                                                onChange={(event) => updateChannelRoleMatrixRow(index, 'shownSignal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.primaryMetric}
                                                                onChange={(event) => updateChannelRoleMatrixRow(index, 'primaryMetric', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_METRIC_OPTIONS.map((option) => (
                                                                    <option key={`wb8-metric-option-${index}-${option}`} value={option}>
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
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityStrategyBlock('Paso 4 — Matriz canal-rol-frecuencia-métrica')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Backlog estratégico de contenidos</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                backlogCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {backlogCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Construye mínimo 8 piezas con tema, pilar, objetivo, canal, formato, señal de valor y prioridad.',
                                                'Prioriza piezas que conecten con oferta y oportunidad.',
                                                'Convierte ideas sueltas en backlog ejecutable.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Errores comunes al narrar valor profesional | Pilar: Narrativa profesional | Objetivo: Atracción | Canal: LinkedIn | Formato: Carrusel | Señal: claridad aplicable | Prioridad: Alta.',
                                                'Cómo traducir complejidad en decisión | Pilar: Claridad estratégica | Objetivo: Profundidad | Canal: LinkedIn/Newsletter | Formato: Artículo breve | Señal: criterio estratégico | Prioridad: Alta.',
                                                'Invitación a diagnóstico express | Pilar: Narrativa profesional | Objetivo: Conversión | Canal: LinkedIn/1:1 | Formato: Post + mensaje | Señal: puerta de entrada | Prioridad: Alta.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1480px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tema / pieza</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pilar</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objetivo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Canal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal de valor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Prioridad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {backlogRows.map((row, index) => (
                                                    <tr key={`wb8-backlog-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.topicPiece}
                                                                onChange={(event) => updateBacklogRow(index, 'topicPiece', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.pillar}
                                                                onChange={(event) => updateBacklogRow(index, 'pillar', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {editorialArchitecture.contentPillars
                                                                    .map((item) => item.trim())
                                                                    .filter((item) => item.length > 0)
                                                                    .map((item) => (
                                                                        <option key={`wb8-backlog-pillar-${index}-${item}`} value={item}>
                                                                            {item}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.objective}
                                                                onChange={(event) => updateBacklogRow(index, 'objective', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_OBJECTIVE_OPTIONS.map((option) => (
                                                                    <option key={`wb8-backlog-objective-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[200px]">
                                                            <select
                                                                value={row.channel}
                                                                onChange={(event) => updateBacklogRow(index, 'channel', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_CHANNEL_OPTIONS.map((option) => (
                                                                    <option key={`wb8-backlog-channel-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.format}
                                                                onChange={(event) => updateBacklogRow(index, 'format', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_FORMAT_OPTIONS.map((option) => (
                                                                    <option key={`wb8-backlog-format-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.valueSignal}
                                                                onChange={(event) => updateBacklogRow(index, 'valueSignal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.priority}
                                                                onChange={(event) => updateBacklogRow(index, 'priority', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_PRIORITY_OPTIONS.map((option) => (
                                                                    <option key={`wb8-backlog-priority-${index}-${option}`} value={option}>
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
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityStrategyBlock('Paso 5 — Backlog estratégico')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Tablero mínimo de ejecución editorial</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executionBoardCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {executionBoardCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define cadencia mínima y bloques operativos de creación, distribución y revisión.',
                                                'Evita depender de inspiración ocasional: estructura un sistema repetible.',
                                                'Incluye criterio de aprendizaje mensual para iterar la estrategia.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Cadencia mínima: 2 piezas por semana + 2 intervenciones internas relevantes al mes.',
                                                'Bloque de creación: martes 7:00–8:00 a. m.',
                                                'Bloque de distribución: jueves al mediodía y seguimiento viernes.',
                                                'Bloque de revisión: último viernes del mes.',
                                                'Criterio de aprendizaje: identificar qué temas, canales y formatos abren más conversaciones valiosas.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Cadencia mínima</span>
                                            <input
                                                type="text"
                                                value={executionBoard.minimumCadence}
                                                onChange={(event) => updateExecutionBoard('minimumCadence', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Bloque de creación</span>
                                            <input
                                                type="text"
                                                value={executionBoard.creationBlock}
                                                onChange={(event) => updateExecutionBoard('creationBlock', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Bloque de distribución / amplificación</span>
                                            <input
                                                type="text"
                                                value={executionBoard.distributionBlock}
                                                onChange={(event) => updateExecutionBoard('distributionBlock', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Bloque de revisión de resultados</span>
                                            <input
                                                type="text"
                                                value={executionBoard.reviewBlock}
                                                onChange={(event) => updateExecutionBoard('reviewBlock', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Criterio de aprendizaje mensual</span>
                                            <textarea
                                                value={executionBoard.monthlyLearningCriteria}
                                                onChange={(event) => updateExecutionBoard('monthlyLearningCriteria', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityStrategyBlock('Paso 6 — Tablero de ejecución editorial')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 7 — Test de coherencia de la estrategia de visibilidad</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilityCoherenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilityCoherenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Verifica alineación entre pilares, oferta, canales, backlog y cadencia.',
                                                'Confirma que puedas medir visibilidad útil y no solo actividad.',
                                                'Declara ajustes concretos por cada respuesta No.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: publicar de forma esporádica sobre temas distintos sin conexión con oferta ni audiencia.',
                                                'Señal mejorada: sistema editorial con pilares, canales, formatos, frecuencia y criterios de medición.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibilityStrategySection.visibilityCoherenceTest.map((row, index) => (
                                                    <tr key={`wb8-visibility-coherence-row-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateVisibilityCoherenceTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateVisibilityCoherenceTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveVisibilityStrategyBlock('Paso 7 — Test de coherencia de visibilidad')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                    <h3 className="text-base font-bold text-slate-900">Cierre de la sección</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">Cuando termines esta sección, deberías poder responder con más claridad:</p>
                                    <ul className="space-y-1.5">
                                        {[
                                            'Sobre qué temas te conviene ser visible.',
                                            'Qué audiencias quieres impactar.',
                                            'Qué canales realmente debes sostener.',
                                            'Qué backlog de contenidos vas a ejecutar.',
                                            'Cómo transformar la visibilidad en un sistema, no en improvisación.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-slate-700">
                                        Esta sección se alinea con Visibilidad estratégica como capacidad de ser percibido como influyente y relevante
                                        mediante presencia y comunicación efectivas y con Pensamiento estratégico como competencia de lectura del entorno
                                        y priorización de largo plazo.
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {topicsTooGeneric && (
                                        <p className="text-sm text-amber-800">Sugerencia: convierte los temas en pilares más específicos y diferenciados.</p>
                                    )}
                                    {noOfferOrMonetizationConnection && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara cómo esta visibilidad apoya tu propuesta de valor.</p>
                                    )}
                                    {sameRoleAcrossChannels && (
                                        <p className="text-sm text-amber-800">Sugerencia: diferencia mejor para qué sirve cada canal.</p>
                                    )}
                                    {missingPrimaryMetric && (
                                        <p className="text-sm text-amber-800">Sugerencia: define cómo sabrás si ese canal está funcionando.</p>
                                    )}
                                    {cadenceTooAmbitious && (
                                        <p className="text-sm text-amber-800">Sugerencia: ajusta a un ritmo sostenible.</p>
                                    )}
                                    {!topicsTooGeneric &&
                                        !noOfferOrMonetizationConnection &&
                                        !sameRoleAcrossChannels &&
                                        !missingPrimaryMetric &&
                                        !cadenceTooAmbitious && (
                                            <p className="text-sm text-emerald-700">
                                                Sin alertas: la estrategia tiene foco temático, roles diferenciados y operación sostenible.
                                            </p>
                                        )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section5Completed
                                                    ? 'Completado: auditoría + mapa + arquitectura + matriz + backlog + tablero + test diligenciados.'
                                                    : !section5MinimumReady
                                                      ? 'Pendiente: define pilares temáticos, canales y cadencia mínima.'
                                                      : 'Pendiente: completa todos los bloques para cerrar la sección.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section5Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section5Completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 7"
                                data-print-title="Tablero de control de KPIs y ROI"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Tablero de control: KPIs de alcance y retorno (ROI)
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diseñar un tablero de control con KPIs de alcance, interacción, conversión y retorno, para medir si tu
                                        estrategia realmente está generando visibilidad útil, oportunidades y captura de valor, y no solo
                                        actividad aparente.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowControlBoardHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Tablero de control: sistema visual y operativo que organiza indicadores clave para seguir avance, detectar desvíos y tomar decisiones.',
                                            'KPI (Key Performance Indicator): indicador crítico que muestra si una dimensión estratégica está avanzando o no.',
                                            'Métrica de actividad: dato que muestra cuánto hiciste, por ejemplo número de publicaciones, reuniones o mensajes enviados.',
                                            'Métrica de resultado: dato que muestra qué produjo esa actividad, por ejemplo conversaciones abiertas, leads, ingresos, invitaciones o acceso.',
                                            'Métrica vanity: indicador que luce bien, pero aporta poca capacidad de decisión.',
                                            'Leading indicator: indicador adelantado que anticipa resultados futuros.',
                                            'Lagging indicator: indicador rezagado que refleja resultados ya ocurridos.',
                                            'Embudo de visibilidad a retorno: secuencia que conecta alcance, atención, interacción, conversación, oportunidad, conversión y retorno.',
                                            'Conversión estratégica: paso de una señal de visibilidad a una acción valiosa.',
                                            'ROI interno y ROI externo: retorno capturado dentro y fuera del sistema organizacional.',
                                            'Umbral de decisión: punto a partir del cual un indicador exige mantener, ajustar, escalar o detener una acción.',
                                            'Cadencia de revisión: ritmo con el que se leen y analizan indicadores para decidir.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Definición del objetivo que el tablero debe servir</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                dashboardGoalCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {dashboardGoalCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define qué decisión estratégica quieres habilitar con el tablero.',
                                                'Aclara resultado estratégico y dimensión prioritaria de medición.',
                                                'Selecciona el tipo de retorno prioritario: interno, externo o mixto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Pregunta principal: si mi visibilidad está generando conversaciones y oportunidades reales.',
                                                'Resultado estratégico: aumento de autoridad y conversión a sesiones/proyectos.',
                                                'Dimensión principal: visibilidad con capacidad de conversión.',
                                                'Tipo de retorno prioritario: mixto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Pregunta principal que el tablero debe responder</span>
                                            <input
                                                type="text"
                                                list="wb8-control-main-question-options"
                                                value={dashboardGoal.mainQuestion}
                                                onChange={(event) => updateDashboardGoal('mainQuestion', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Resultado estratégico a seguir</span>
                                            <input
                                                type="text"
                                                list="wb8-control-strategic-result-options"
                                                value={dashboardGoal.strategicResult}
                                                onChange={(event) => updateDashboardGoal('strategicResult', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Dimensión principal a medir</span>
                                            <select
                                                value={dashboardGoal.primaryDimension}
                                                onChange={(event) => updateDashboardGoal('primaryDimension', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona una dimensión</option>
                                                {CONTROL_FOCUS_DIMENSIONS.map((option) => (
                                                    <option key={`wb8-control-dimension-${option}`} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Tipo de retorno prioritario</span>
                                            <select
                                                value={dashboardGoal.priorityReturnType}
                                                onChange={(event) => updateDashboardGoal('priorityReturnType', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona</option>
                                                {CONTROL_RETURN_TYPES.map((option) => (
                                                    <option key={`wb8-control-return-${option}`} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveControlBoardBlock('Paso 1 — Objetivo del tablero')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Mapa del embudo de visibilidad a retorno</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                funnelCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {funnelCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define qué significa cada etapa del embudo en tu contexto real.',
                                                'Asigna un indicador posible para cada etapa.',
                                                'Usa el embudo para conectar visibilidad con retorno.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Alcance: personas expuestas a mis ideas o trabajo | Indicador: impresiones/vistas.',
                                                'Conversación: contactos que pasan a intercambio directo | Indicador: DMs, reuniones, correos.',
                                                'Conversión: acción valiosa realizada | Indicador: sesiones vendidas o inclusión en comité.',
                                                'Retorno: valor capturado | Indicador: ingresos, expansión de rol, patrocinio, presupuesto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Etapa</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué significa en mi caso</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Indicador posible</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {funnelRows.map((row, index) => (
                                                    <tr key={`wb8-funnel-row-${row.stage}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.stage}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.meaningInContext}
                                                                onChange={(event) => updateFunnelRow(index, 'meaningInContext', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.possibleIndicator}
                                                                onChange={(event) => updateFunnelRow(index, 'possibleIndicator', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Visual del embudo</p>
                                        <div className="space-y-2">
                                            {funnelRows.map((row, index) => {
                                                const widthPercent = Math.max(54, 100 - index * 8)
                                                return (
                                                    <div key={`wb8-funnel-visual-${row.stage}`} className="flex justify-center">
                                                        <div
                                                            className="rounded-xl border border-blue-200 bg-white px-4 py-2.5"
                                                            style={{ width: `${widthPercent}%` }}
                                                        >
                                                            <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">{row.stage}</p>
                                                            <p className="text-sm text-slate-700">
                                                                {row.possibleIndicator.trim().length > 0 ? row.possibleIndicator : 'Define indicador para esta etapa'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveControlBoardBlock('Paso 2 — Embudo de visibilidad a retorno')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Selección de KPIs críticos</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                criticalKpiCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {criticalKpiCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona entre 1 y 2 KPIs por categoría sin exceder un conjunto manejable.',
                                                'Declara por qué importa cada KPI para decidir.',
                                                'Clasifica cada KPI como leading o lagging.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Alcance: personas alcanzadas en canal principal | Leading.',
                                                'Conversación: conversaciones cualificadas | Leading.',
                                                'Conversión: propuestas aceptadas / sesiones vendidas | Lagging.',
                                                'Retorno: ingresos / acceso / expansión de rol | Lagging.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Categoría</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">KPI seleccionado</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Por qué importa</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Leading / Lagging</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {criticalKpiRows.map((row, index) => (
                                                    <tr key={`wb8-critical-kpi-row-${row.category}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.category}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.selectedKpi}
                                                                onChange={(event) => updateCriticalKpiRow(index, 'selectedKpi', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whyItMatters}
                                                                onChange={(event) => updateCriticalKpiRow(index, 'whyItMatters', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.indicatorType}
                                                                onChange={(event) => updateCriticalKpiRow(index, 'indicatorType', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {KPI_TYPE_OPTIONS.map((option) => (
                                                                    <option key={`wb8-critical-kpi-type-${row.category}-${option}`} value={option}>
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
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveControlBoardBlock('Paso 3 — Selección de KPIs críticos')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Ficha técnica de cada KPI</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                kpiSheetsCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {kpiSheetsCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define al menos 4 fichas de KPI con nombre, fórmula, fuente, umbrales y decisión asociada.',
                                                'Usa definiciones operativas para que cualquier persona del equipo pueda leer el indicador.',
                                                'Evita KPIs sin fuente o sin decisión gatillo.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <p className="mt-2 text-sm text-slate-600">
                                            KPI: Conversaciones cualificadas por mes | Fórmula: total mensual de conversaciones estratégicas | Fuente:
                                            agenda/CRM/registro manual | Umbral verde: 8 o más | Decisión asociada: si cae a rojo, revisar canal, mensaje o CTA.
                                        </p>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1700px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nombre</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué mide</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Fórmula</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Fuente</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Frecuencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Responsable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Umbral verde</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Umbral amarillo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Umbral rojo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Decisión asociada</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {kpiSheets.map((row, index) => (
                                                    <tr key={`wb8-kpi-sheet-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <input
                                                                type="text"
                                                                list="wb8-control-kpi-name-options"
                                                                value={row.kpiName}
                                                                onChange={(event) => updateKpiSheetRow(index, 'kpiName', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[280px]">
                                                            <input
                                                                type="text"
                                                                list="wb8-control-measure-options"
                                                                value={row.measuredVariable}
                                                                onChange={(event) => updateKpiSheetRow(index, 'measuredVariable', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[260px]">
                                                            <input
                                                                type="text"
                                                                list="wb8-control-formula-options"
                                                                value={row.formula}
                                                                onChange={(event) => updateKpiSheetRow(index, 'formula', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <input
                                                                type="text"
                                                                list="wb8-control-source-options"
                                                                value={row.dataSource}
                                                                onChange={(event) => updateKpiSheetRow(index, 'dataSource', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[170px]">
                                                            <select
                                                                value={row.frequency}
                                                                onChange={(event) => updateKpiSheetRow(index, 'frequency', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {KPI_FREQUENCY_OPTIONS.map((option) => (
                                                                    <option key={`wb8-kpi-sheet-frequency-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[170px]">
                                                            <select
                                                                value={row.owner}
                                                                onChange={(event) => updateKpiSheetRow(index, 'owner', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {KPI_OWNER_OPTIONS.map((option) => (
                                                                    <option key={`wb8-kpi-sheet-owner-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <input
                                                                type="text"
                                                                value={row.greenThreshold}
                                                                onChange={(event) => updateKpiSheetRow(index, 'greenThreshold', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <input
                                                                type="text"
                                                                value={row.yellowThreshold}
                                                                onChange={(event) => updateKpiSheetRow(index, 'yellowThreshold', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <input
                                                                type="text"
                                                                value={row.redThreshold}
                                                                onChange={(event) => updateKpiSheetRow(index, 'redThreshold', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.associatedDecision}
                                                                onChange={(event) => updateKpiSheetRow(index, 'associatedDecision', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {KPI_DECISION_OPTIONS.map((option) => (
                                                                    <option key={`wb8-kpi-sheet-decision-${index}-${option}`} value={option}>
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
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveControlBoardBlock('Paso 4 — Ficha técnica de KPI')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Línea base, meta y umbral de decisión</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                baselineCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {baselineCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Registra línea base actual y metas a 30 y 90 días por KPI.',
                                                'Define umbral de alerta y acción correctiva concreta.',
                                                'El sistema sugiere metas y alertas cuando registras línea base.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Conversaciones cualificadas: línea base 2, meta 30 días 5, meta 90 días 10, alerta menos de 3.',
                                                'Leads/oportunidades: línea base 1, meta 30 días 3, meta 90 días 6, alerta cero en 30 días.',
                                                'Retorno externo: línea base 0, meta 30 días 1 piloto, meta 90 días 3 cierres.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1450px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">KPI</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Línea base actual</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Meta 30 días</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Meta 90 días</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Umbral de alerta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Acción correctiva</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {baselineRows.map((row, index) => (
                                                    <tr key={`wb8-baseline-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[230px]">
                                                            <select
                                                                value={row.kpi}
                                                                onChange={(event) => updateBaselineRow(index, 'kpi', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona KPI</option>
                                                                {kpiCatalog.map((option) => (
                                                                    <option key={`wb8-baseline-kpi-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[170px]">
                                                            <input
                                                                type="text"
                                                                value={row.baselineCurrent}
                                                                onChange={(event) => updateBaselineRow(index, 'baselineCurrent', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[170px]">
                                                            <input
                                                                type="text"
                                                                value={row.goal30}
                                                                onChange={(event) => updateBaselineRow(index, 'goal30', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[170px]">
                                                            <input
                                                                type="text"
                                                                value={row.goal90}
                                                                onChange={(event) => updateBaselineRow(index, 'goal90', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <input
                                                                type="text"
                                                                value={row.alertThreshold}
                                                                onChange={(event) => updateBaselineRow(index, 'alertThreshold', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[330px]">
                                                            <input
                                                                type="text"
                                                                value={row.correctiveAction}
                                                                onChange={(event) => updateBaselineRow(index, 'correctiveAction', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveControlBoardBlock('Paso 5 — Línea base, metas y umbrales')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Tablero ejecutivo mínimo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {executiveCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Consolida una vista ejecutiva por KPI con valor actual, tendencia, meta, estado, lectura y decisión.',
                                                'Usa el semáforo para orientar decisiones de mantener, ajustar, escalar o pausar.',
                                                'Haz que la lectura rápida sea accionable y no descriptiva.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Alcance útil: 1200, tendencia ↑, meta 1500, estado Amarillo, decisión mantener y ajustar audiencia.',
                                                'Conversaciones cualificadas: 6, tendencia ↑, meta 8, estado Amarillo, decisión reforzar conversión.',
                                                'Retorno capturado: 1, tendencia ↑, meta 3, estado Amarillo, decisión escalar prueba.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1450px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">KPI</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor actual</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tendencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Meta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Estado</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lectura rápida</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Decisión</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {executiveRows.map((row, index) => (
                                                    <tr key={`wb8-executive-row-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.kpi}
                                                                onChange={(event) => updateExecutiveRow(index, 'kpi', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona KPI</option>
                                                                {kpiCatalog.map((option) => (
                                                                    <option key={`wb8-executive-kpi-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[150px]">
                                                            <input
                                                                type="text"
                                                                value={row.currentValue}
                                                                onChange={(event) => updateExecutiveRow(index, 'currentValue', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[120px]">
                                                            <select
                                                                value={row.trend}
                                                                onChange={(event) => updateExecutiveRow(index, 'trend', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">—</option>
                                                                {TREND_OPTIONS.map((option) => (
                                                                    <option key={`wb8-executive-trend-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[150px]">
                                                            <input
                                                                type="text"
                                                                value={row.goal}
                                                                onChange={(event) => updateExecutiveRow(index, 'goal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.status}
                                                                onChange={(event) => updateExecutiveRow(index, 'status', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {KPI_STATUS_OPTIONS.map((option) => (
                                                                    <option key={`wb8-executive-status-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[320px]">
                                                            <input
                                                                type="text"
                                                                value={row.quickRead}
                                                                onChange={(event) => updateExecutiveRow(index, 'quickRead', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[200px]">
                                                            <select
                                                                value={row.decision}
                                                                onChange={(event) => updateExecutiveRow(index, 'decision', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {KPI_DECISION_OPTIONS.map((option) => (
                                                                    <option key={`wb8-executive-decision-${index}-${option}`} value={option}>
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
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveControlBoardBlock('Paso 6 — Tablero ejecutivo mínimo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 7 — Cadencia de revisión y decisiones gatillo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                reviewCadenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {reviewCadenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define qué revisarás semanalmente y qué revisarás mensualmente.',
                                                'Especifica señales gatillo que obligan decisión.',
                                                'Conecta señales con decisiones posibles: mantener, ajustar, escalar, pausar o rediseñar.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Revisión semanal: alcance, interacción y conversaciones abiertas.',
                                                'Revisión mensual: oportunidades, conversiones y retorno.',
                                                'Señales gatillo: KPI en rojo dos semanas seguidas, alto alcance sin conversación.',
                                                'Decisiones asociadas: ajustar canal, rediseñar CTA, escalar contenido ganador, pausar táctica improductiva.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Revisión semanal</span>
                                            <input
                                                type="text"
                                                list="wb8-control-review-weekly-options"
                                                value={reviewCadence.weeklyReview}
                                                onChange={(event) => updateReviewCadence('weeklyReview', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Revisión mensual</span>
                                            <input
                                                type="text"
                                                list="wb8-control-review-monthly-options"
                                                value={reviewCadence.monthlyReview}
                                                onChange={(event) => updateReviewCadence('monthlyReview', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señales que gatillan decisiones</span>
                                            <textarea
                                                value={reviewCadence.decisionSignals}
                                                onChange={(event) => updateReviewCadence('decisionSignals', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder={CONTROL_DECISION_SIGNAL_OPTIONS.join(' · ')}
                                            />
                                        </label>
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisiones posibles asociadas</span>
                                            <textarea
                                                value={reviewCadence.associatedDecisions}
                                                onChange={(event) => updateReviewCadence('associatedDecisions', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                placeholder={CONTROL_ASSOCIATED_DECISIONS_OPTIONS.join(' · ')}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveControlBoardBlock('Paso 7 — Cadencia de revisión y decisiones')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 8 — Test de inteligencia del tablero</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                dashboardIntelligenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {dashboardIntelligenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Verifica que el tablero responda preguntas estratégicas y no solo describa actividad.',
                                                'Confirma que distingues actividad, conversación, conversión y retorno.',
                                                'Declara ajustes concretos para cada respuesta No.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Botón ejemplo</summary>
                                        <ul className="mt-2 space-y-1.5">
                                            {[
                                                'Señal débil: medir likes, vistas y publicaciones sin saber si eso abre oportunidades o retorno.',
                                                'Señal mejorada: tablero que conecta visibilidad, conversaciones, conversiones y valor capturado.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí / No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardIntelligenceTest.map((row, index) => (
                                                    <tr key={`wb8-control-test-row-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateDashboardIntelligenceTestRow(index, 'verdict', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="yes">Sí</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateDashboardIntelligenceTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveControlBoardBlock('Paso 8 — Test de inteligencia del tablero')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                    <h3 className="text-base font-bold text-slate-900">Cierre de la sección</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">Cuando termines esta sección, deberías poder responder con más claridad:</p>
                                    <ul className="space-y-1.5">
                                        {[
                                            'Qué KPIs importan realmente para tu estrategia.',
                                            'Cómo se conectan alcance, conversación, oportunidad y retorno.',
                                            'Qué métricas debes dejar de sobrevalorar.',
                                            'Qué umbrales gatillan decisiones.',
                                            'Cómo construir un tablero que sirva para decidir, no solo para mirar.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {tooManyKpis && (
                                        <p className="text-sm text-amber-800">Sugerencia: reduce a un conjunto más crítico y manejable.</p>
                                    )}
                                    {onlyActivityKpis && (
                                        <p className="text-sm text-amber-800">Sugerencia: incluye también conversación, conversión y retorno.</p>
                                    )}
                                    {missingFormulaOrSource && (
                                        <p className="text-sm text-amber-800">Sugerencia: haz operativa la medición de cada KPI.</p>
                                    )}
                                    {missingThresholdsOrDecisions && (
                                        <p className="text-sm text-amber-800">Sugerencia: define cuándo un KPI te obliga a actuar.</p>
                                    )}
                                    {noRoiDistinction && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara qué retorno quieres capturar y cómo lo leerás.</p>
                                    )}
                                    {!tooManyKpis &&
                                        !onlyActivityKpis &&
                                        !missingFormulaOrSource &&
                                        !missingThresholdsOrDecisions &&
                                        !noRoiDistinction && (
                                            <p className="text-sm text-emerald-700">
                                                Sin alertas: el tablero conecta embudo, KPIs críticos, umbrales y decisiones.
                                            </p>
                                        )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section6Completed
                                                    ? 'Completado: objetivo + embudo + KPIs + fichas + metas + tablero + cadencia + test diligenciados.'
                                                    : !section6MinimumReady
                                                      ? 'Pendiente: define embudo, KPIs críticos y al menos una meta.'
                                                      : 'Pendiente: completa todos los bloques para cerrar la sección.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section6Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section6Completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>

                                <datalist id="wb8-control-main-question-options">
                                    {CONTROL_MAIN_QUESTION_OPTIONS.map((option) => (
                                        <option key={`wb8-control-main-question-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-strategic-result-options">
                                    {CONTROL_STRATEGIC_RESULT_OPTIONS.map((option) => (
                                        <option key={`wb8-control-strategic-result-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-kpi-name-options">
                                    {Array.from(
                                        new Set([
                                            ...kpiCatalog,
                                            'Alcance útil',
                                            'Tasa de interacción útil',
                                            'Conversaciones cualificadas',
                                            'Oportunidades abiertas',
                                            'Conversión efectiva',
                                            'Retorno capturado'
                                        ])
                                    ).map((option) => (
                                        <option key={`wb8-control-kpi-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-measure-options">
                                    {[
                                        'Mide visibilidad base en audiencia objetivo',
                                        'Mide interés inicial y relevancia del mensaje',
                                        'Mide conversaciones estratégicas con potencial real',
                                        'Mide oportunidades abiertas de colaboración o negocio',
                                        'Mide conversión de oportunidad a acción',
                                        'Mide valor capturado interno y/o externo'
                                    ].map((option) => (
                                        <option key={`wb8-control-measure-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-formula-options">
                                    {[
                                        'Total mensual del indicador',
                                        '(Resultado/objetivo)*100',
                                        'Conversaciones cualificadas iniciadas por mes',
                                        'Oportunidades abiertas en el periodo',
                                        'Conversiones logradas / oportunidades totales',
                                        'Retorno capturado / inversión total'
                                    ].map((option) => (
                                        <option key={`wb8-control-formula-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-source-options">
                                    {['Agenda', 'CRM', 'Registro manual', 'Analytics de canal', 'Reporte interno', 'Dashboard comercial'].map((option) => (
                                        <option key={`wb8-control-source-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-review-weekly-options">
                                    {CONTROL_REVIEW_WEEKLY_OPTIONS.map((option) => (
                                        <option key={`wb8-control-review-weekly-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                                <datalist id="wb8-control-review-monthly-options">
                                    {CONTROL_REVIEW_MONTHLY_OPTIONS.map((option) => (
                                        <option key={`wb8-control-review-monthly-option-${option}`} value={option} />
                                    ))}
                                </datalist>
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb8-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 7"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Evaluación</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Objetivo: permitir que mentor y líder evalúen con evidencia, definan decisiones por criterio y cierren con
                                        síntesis de acuerdos.
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
                                                        key={`wb8-evaluation-stage-${stage.key}`}
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
                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">A) Instrucciones para el mentor (rúbricas)</h3>
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
                                                    <li key={`wb8-mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {showEvaluationLevelReference && (
                                                <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                    <p className="text-sm font-semibold text-slate-900 mb-2">Referencia de niveles (1-4)</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-[520px] w-full border border-blue-200 rounded-lg overflow-hidden bg-white">
                                                            <thead>
                                                                <tr className="bg-blue-100">
                                                                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 border-b border-blue-200">
                                                                        Nivel
                                                                    </th>
                                                                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 border-b border-blue-200">
                                                                        Descriptor
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {MENTOR_LEVEL_REFERENCE.map((item) => (
                                                                    <tr key={`wb8-mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
                                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-blue-100">
                                                                            {item.level}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-blue-100">
                                                                            {item.descriptor}
                                                                        </td>
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
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Formato de evaluación del mentor (marcar y comentar)</h3>
                                                <p className="text-xs text-slate-500">
                                                    Criterios completados: {mentorCompletedRows}/{evaluation.mentorRows.length}
                                                </p>
                                            </div>

                                            {evaluation.mentorRows.map((row, index) => {
                                                const isEditing = mentorEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isMentorEvaluationRowComplete(row)

                                                return (
                                                    <article key={`wb8-mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                                key={`wb8-mentor-level-${index}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb8-mentor-level-${index}`}
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
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Comentario / evidencia observable</span>
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(event) => setMentorEvaluationField(index, 'evidence', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    />
                                                                </label>

                                                                <fieldset className="space-y-2">
                                                                    <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión del mentor</legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                            <label
                                                                                key={`wb8-mentor-decision-${index}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb8-mentor-decision-${index}`}
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
                                                                    Nivel: <span className="font-semibold text-slate-900">{row.level || 'Pendiente'}</span>
                                                                </p>
                                                                <p>
                                                                    Evidencia: <span className="font-semibold text-slate-900">{row.evidence || 'Pendiente'}</span>
                                                                </p>
                                                                <p>
                                                                    Decisión: <span className="font-semibold text-slate-900">{row.decision || 'Pendiente'}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </article>
                                                )
                                            })}
                                        </section>

                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Observaciones generales del mentor</span>
                                                <textarea
                                                    value={evaluation.mentorGeneralNotes}
                                                    onChange={(event) => setMentorGeneralNotes(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[120px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </label>

                                            <fieldset className="space-y-2">
                                                <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión global del WB</legend>
                                                <div className="flex flex-wrap gap-2">
                                                    {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                        <label
                                                            key={`wb8-mentor-global-decision-${decision}`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="wb8-mentor-global-decision"
                                                                checked={evaluation.mentorGlobalDecision === decision}
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
                                                    Guardar cierre mentor
                                                </button>
                                            </div>
                                        </section>
                                    </section>
                                )}

                                {(evaluationStage === 'leader' || isExportingAll) && (
                                    <section className="space-y-5">
                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">B) Instrucciones para el líder (autoevaluación)</h3>
                                            <ul className="space-y-1.5">
                                                {[
                                                    'Responde cada pregunta desde hechos concretos y recientes, no desde intención.',
                                                    'Incluye al menos un ejemplo o evidencia por respuesta.',
                                                    'Define una acción o compromiso de 30 días para cada respuesta clave.',
                                                    'Usa este bloque como insumo para acordar el plan de desarrollo con el mentor.'
                                                ].map((instruction) => (
                                                    <li key={`wb8-leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-slate-500">Preguntas completadas: {leaderCompletedRows}/{evaluation.leaderRows.length}</p>
                                        </section>

                                        <section className="space-y-4">
                                            {evaluation.leaderRows.map((row, index) => {
                                                const isEditing = leaderEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isLeaderEvaluationRowComplete(row)

                                                return (
                                                    <article key={`wb8-leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                        onChange={(event) => setLeaderEvaluationField(index, 'response', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    />
                                                                </label>
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Evidencia / ejemplo</span>
                                                                    <textarea
                                                                        value={row.evidence}
                                                                        onChange={(event) => setLeaderEvaluationField(index, 'evidence', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[78px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    />
                                                                </label>
                                                                <label className="block space-y-1">
                                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                        Acción o compromiso (30 días)
                                                                    </span>
                                                                    <textarea
                                                                        value={row.action}
                                                                        onChange={(event) => setLeaderEvaluationField(index, 'action', event.target.value)}
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
                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">C) Síntesis de acuerdos Mentor-Líder</h3>
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
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Síntesis de acuerdos Mentor-Líder</span>
                                                <textarea
                                                    value={evaluation.agreementsSynthesis}
                                                    onChange={(event) => setEvaluationSynthesis(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[160px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder="Registra acuerdos concretos entre mentor y líder."
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
                                                {evaluationSectionComplete ? 'WB8 Evaluación completada' : 'WB8 Evaluación en progreso'}
                                            </h3>
                                            <p className={`mt-2 text-sm ${evaluationSectionComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {evaluationSectionComplete
                                                    ? 'Mentor y líder cerraron rúbrica, autoevaluación y síntesis.'
                                                    : 'Completa los bloques pendientes para cerrar la evaluación.'}
                                            </p>
                                        </article>

                                        <article className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                            <h4 className="text-base md:text-lg font-bold text-slate-900">Resumen de evaluación</h4>
                                            <div className="space-y-2">
                                                {evaluation.mentorRows.map((row, index) => (
                                                    <div
                                                        key={`wb8-evaluation-summary-criterion-${index}`}
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
                                                <span className="font-semibold text-slate-900">Decisión global:</span>{' '}
                                                {evaluation.mentorGlobalDecision || 'Pendiente'}
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
                                            : 'Evaluación pendiente (mentor + líder + síntesis)'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={saveEvaluationModule}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Guardar página 7
                                    </button>
                                </div>
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb8-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={16} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{currentPage?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={16} />
                                </button>
                            </nav>
                        )}

                        {showValueLadderHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Escalera de valor</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowValueLadderHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una escalera de valor organiza tu conocimiento en niveles legibles con entrada, núcleo y escalamiento.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            No toda experiencia se convierte automáticamente en oferta: primero define problema, transformación y formato.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            La oferta núcleo debe concentrar tu mayor valor y conectarse con una decisión de foco.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Si la escalera no diferencia profundidad y resultado, termina pareciendo ruido.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showBusinessModelHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Modelo de negocio</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBusinessModelHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Monetizar talento no es solo cobrar: también puede significar visibilidad, poder de decisión, promoción o acceso.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una unidad de valor clara facilita comprensión, adopción y decisión.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Un buen modelo compara valor, esfuerzo, captura y riesgo para decidir foco.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Antes de escalar, conviene validar hipótesis con pruebas pequeñas.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showVisibilityStrategyHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Estrategia de visibilidad</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVisibilityStrategyHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Visibilidad estratégica no es publicar más: es hacer visible un valor claro para audiencias concretas.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            El contenido debe conectarse con audiencias, oferta y oportunidad.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Cada canal debe cumplir un rol, no replicar exactamente lo mismo.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una estrategia madura convierte ideas en backlog, cadencia y métricas.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showControlBoardHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Tablero de control (KPIs y ROI)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowControlBoardHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Un buen tablero no mide todo; mide lo decisivo para orientar decisiones.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Alcance no es retorno y actividad no es conversión.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Toda métrica clave necesita definición operativa, fuente, meta y decisión asociada.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            El tablero debe ayudarte a mantener, ajustar, escalar o pausar con criterio.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    .wb8-toolbar,
                    .wb8-sidebar,
                    .wb8-page-nav {
                        display: none !important;
                    }

                    body {
                        background: white !important;
                        font-family: 'Inter', 'Segoe UI', sans-serif;
                    }

                    @page {
                        size: A4;
                        margin: 18mm 14mm;
                    }

                    .wb8-print-page {
                        break-after: page;
                        page-break-after: always;
                        position: relative;
                    }

                    .wb8-print-page:not(.wb8-cover-page)::before {
                        content: attr(data-print-page);
                        position: absolute;
                        top: -8mm;
                        right: 0;
                        font-size: 10px;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        color: #2563eb;
                        font-weight: 700;
                    }

                    .wb8-print-page::after {
                        content: attr(data-print-meta);
                        position: absolute;
                        bottom: -10mm;
                        left: 0;
                        font-size: 9px;
                        letter-spacing: 0.04em;
                        color: #475569;
                    }

                    .wb8-cover-page {
                        min-height: calc(297mm - 36mm);
                    }

                    .wb8-cover-page::before {
                        content: none !important;
                    }

                    .wb8-cover-hero {
                        min-height: 54vh !important;
                    }
                }
            `}</style>
        </div>
    )
}
