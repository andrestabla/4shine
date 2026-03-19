'use client'
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
type YesNoAnswer = '' | 'yes' | 'no'
type StakeholderLevel = '' | '1' | '2' | '3'
type StakeholderSymbol = '' | '★' | '▲' | '!' | '○'
type SponsorLevel = '' | 'bajo' | 'medio' | 'alto'
type CalibrationLevel = '' | 'bajo' | 'medio' | 'alto'
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

type WB7State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    stakeholderMappingSection: {
        actorInventory: string[]
        classificationRows: Array<{
            level: StakeholderLevel
            bondType: string
            contactFrequency: string
            ecosystemImpact: string
        }>
        valueMatrixRows: Array<{
            powerInfluence: '' | '1' | '2' | '3' | '4' | '5'
            currentCloseness: '' | '1' | '2' | '3' | '4' | '5'
            mutualValue: '' | '1' | '2' | '3' | '4' | '5'
        }>
        relationalGaps: Array<{
            relationalGap: string
            criticalReason: string
            minimumAction: string
        }>
        ecosystemMap: {
            centerRole: string
            actorSymbols: StakeholderSymbol[]
        }
        strategicReadTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    sponsorIdentificationSection: {
        possibleSponsors: string[]
        sponsorMatrixRows: Array<{
            influenceAccess: Score15
            currentCloseness: Score15
            valueExposure: Score15
            probableDisposition: Score15
        }>
        sponsorshipIndexRows: Array<{
            factor: string
            level: SponsorLevel
            evidence: string
        }>
        valueBeforeAskingRows: Array<{
            prioritySponsor: string
            currentPriority: string
            firstValue: string
            avoidAction: string
        }>
        activationRoute: {
            prioritySponsor: string
            accessPath: string
            realisticMove: string
            progressSignal: string
            mainRisk: string
            nextStep15Days: string
        }
        sponsorReadTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    highValueNetworkSection: {
        relationsInventory: string[]
        valueTrustAccessRows: Array<{
            strategicValue: Score15
            currentTrust: Score15
            accessAmplification: Score15
            dominantValueType: string
            currentState: string
        }>
        segmentationRows: Array<{
            mainSegment: string
            reason: string
            suggestedMove: string
        }>
        reciprocityRows: Array<{
            relationship: string
            valueReceived: string
            valueProvided: string
            currentBalance: string
            nextGesture: string
        }>
        actionMapRows: Array<{
            actionState: string
            justification: string
            action30Days: string
        }>
        qualityTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    consciousNetworkingSection: {
        intentionDeclaration: {
            strategicObjective: string
            neededRelationshipType: string
            strongWeakRelationshipType: string
            relationalErrorToAvoid: string
            guidingPrinciple: string
        }
        objectiveMatrixRows: Array<{
            relationalObjective: string
            audienceActor: string
            firstValueContribution: string
            realisticInitialMove: string
            expectedProgressSignal: string
        }>
        movementSegmentationRows: Array<{
            relationActor: string
            movementType: string
            concreteAction: string
            valueAtStake: string
        }>
        cadenceRows: Array<{
            relation: string
            suggestedCadence: string
            contactFormat: string
            contactObjective: string
        }>
        scorecardRows: Array<{
            dimension: string
            level: CalibrationLevel
            evidence: string
        }>
        plan30Days: {
            nourishRelationships: string
            reactivateRelationships: string
            exploreRelationships: string
            visibleReciprocityAction: string
            maintenanceHabit: string
            progressCriteria: string
        }
    }
    strategicVisibilitySection: {
        visibilityAudit: {
            currentVisibleSpaces: string
            currentVisibleAudiences: string
            currentPerceivedValue: string
            invisibleContributions: string
            unoccupiedKeySpaces: string
            probablePerception: string
        }
        visibilityMatrixRows: Array<{
            keyAudience: string
            valueToMakeVisible: string
            concreteEvidence: string
            visibilitySurface: string
            errorToAvoid: string
        }>
        signalArchitecture: {
            mainSignal: string
            visibleAttributes: string
            visibleProofs: string
            strongerContexts: string
            weakeningIncoherences: string
        }
        visibilityPortfolioRows: Array<{
            visibilitySurface: string
            whatToShow: string
            format: string
            minimumFrequency: string
        }>
        visibilityTimelineRows: Array<{
            horizon: '30 días' | '60 días' | '90 días'
            targetVisibleOutcome: string
            space: string
            progressIndicator: string
        }>
        visibilityTest: Array<{
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

type Score15 = '' | '1' | '2' | '3' | '4' | '5'

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Mapeo de stakeholders (niveles 1, 2 y 3)', shortLabel: 'Stakeholders' },
    { id: 4, label: '4. Identificación de sponsors', shortLabel: 'Sponsors' },
    { id: 5, label: '5. Red de alto valor', shortLabel: 'Red de valor' },
    { id: 6, label: '6. Estrategia de networking consciente', shortLabel: 'Networking' },
    { id: 7, label: '7. Plan de visibilidad estratégica', shortLabel: 'Visibilidad' },
    { id: 8, label: '8. Evaluación', shortLabel: 'Evaluación' }
]

const STORAGE_KEY = 'workbooks-v2-wb7-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb7-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb7-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb7-presentation-seen'

const INVENTORY_ROWS = 10
const SPONSOR_ROWS = 6
const HIGH_VALUE_RELATIONS_ROWS = 12
const HIGH_VALUE_RECIPROCITY_ROWS = 3
const NETWORK_OBJECTIVE_ROWS = 3
const NETWORK_MOVEMENT_ROWS = 6
const NETWORK_CADENCE_ROWS = 4
const VISIBILITY_MATRIX_ROWS = 3
const VISIBILITY_PORTFOLIO_ROWS = 4
const MAP_RING_SYMBOLS: StakeholderSymbol[] = ['', '★', '▲', '!', '○']
const BOND_TYPE_OPTIONS = [
    'Jerárquico / coordinación',
    'Colaboración transversal',
    'Visibilidad / decisión',
    'Reputación / acceso',
    'Cliente interno',
    'Cliente externo',
    'Partner / proveedor',
    'Mentoría / desarrollo',
    'Referencia externa',
    'Relación difícil / crítica',
    'Otro'
] as const
const CONTACT_FREQUENCY_OPTIONS = ['Alta', 'Media', 'Baja', 'Esporádica'] as const
const ECOSYSTEM_IMPACT_OPTIONS = ['Alto', 'Medio-alto', 'Medio', 'Bajo'] as const
const STRATEGIC_TEST_QUESTIONS = [
    '¿Diferencio actores operativos y estratégicos?',
    '¿Identifico bien quién decide, influye o amplifica?',
    '¿Mi red se ve estratégica y no solo circunstancial?',
    '¿Detecté vacíos relacionales relevantes?',
    '¿Identifiqué relaciones de alto valor y relaciones frágiles?',
    '¿El mapa me permite decidir próximos movimientos?'
] as const
const SPONSORSHIP_INDEX_FACTORS = [
    'Resultados visibles',
    'Reputación confiable',
    'Claridad de aporte',
    'Consistencia relacional',
    'Visibilidad estratégica',
    'Capacidad de reciprocidad'
] as const
const SPONSOR_TEST_QUESTIONS = [
    '¿Diferencio mentor y sponsor?',
    '¿Identifico sponsors prioritarios reales?',
    '¿Sé qué valor aportar primero?',
    '¿Distingo sponsor natural de sponsor aspiracional?',
    '¿Tengo una vía de acceso realista?',
    '¿Estoy evitando pedir patrocinio demasiado pronto?'
] as const
const SPONSOR_ACCESS_OPTIONS = ['Directa', 'Por puente', 'Por visibilidad gradual'] as const
const NETWORK_VALUE_TYPE_OPTIONS = [
    'Aprendizaje',
    'Acceso',
    'Reputación',
    'Patrocinio',
    'Colaboración',
    'Inteligencia política',
    'Visibilidad',
    'Amplificación'
] as const
const NETWORK_STATE_OPTIONS = ['Activa', 'Mantenida', 'Dormida', 'Frágil'] as const
const NETWORK_SEGMENT_OPTIONS = ['Núcleo', 'Puente', 'Multiplicadora', 'Aprendizaje', 'A reactivar', 'A profundizar'] as const
const NETWORK_ACTION_OPTIONS = ['Mantener', 'Reactivar', 'Expandir', 'Despriorizar'] as const
const NETWORK_QUALITY_TEST_QUESTIONS = [
    '¿Diferencio valor estratégico de simple cercanía?',
    '¿Sé qué tipo de valor aporta cada relación?',
    '¿Identifiqué relaciones dormidas de alto valor?',
    '¿Estoy aportando valor antes de pedir?',
    '¿Mi red cumple funciones diversas?',
    '¿Definí acciones concretas sobre la red?'
] as const
const CONSCIOUS_NETWORKING_MOVEMENT_TYPES = ['Activar', 'Nutrir', 'Profundizar', 'Expandir', 'Amplificar', 'Reciprocar'] as const
const CONSCIOUS_NETWORKING_CADENCE_OPTIONS = ['Mensual', 'Bimensual', 'Trimestral', 'Semestral', 'Según hito'] as const
const CONSCIOUS_NETWORKING_FORMAT_OPTIONS = [
    'Mensaje breve',
    'Café / llamada',
    'Actualización ejecutiva',
    'Reconocimiento',
    'Introducción útil',
    'Intercambio de valor'
] as const
const CONSCIOUS_NETWORKING_SCORECARD_DIMENSIONS = [
    'Intención clara',
    'Valor antes de pedir',
    'Diversidad de la red',
    'Consistencia de contacto',
    'Calidad de reciprocidad',
    'Expansión deliberada',
    'Coherencia con objetivos'
] as const
const VISIBILITY_VALUE_OPTIONS = [
    'Criterio estratégico',
    'Síntesis ejecutiva',
    'Capacidad de ordenar escenarios',
    'Pensamiento transversal',
    'Confiabilidad en ejecución',
    'Liderazgo colaborativo',
    'Especialidad técnica',
    'Influencia ética'
] as const
const VISIBILITY_SURFACE_OPTIONS = [
    'Reuniones uno a uno',
    'Reuniones de equipo',
    'Reuniones de alto nivel',
    'Reportes ejecutivos',
    'Presentaciones',
    'Correos de síntesis',
    'Espacios transversales',
    'Networking interno',
    'Networking externo',
    'Presencia digital / LinkedIn',
    'Visibilidad por terceros'
] as const
const VISIBILITY_PORTFOLIO_SURFACES = [
    'Reuniones de alto nivel',
    'Reporte ejecutivo',
    'Networking interno',
    'LinkedIn / red externa'
] as const
const VISIBILITY_SHOW_OPTIONS = [
    'Criterio y síntesis',
    'Claridad de avance y foco',
    'Capacidad de colaboración transversal',
    'Especialidad y lectura de contexto',
    'Resultados con impacto',
    'Recomendaciones bien sustentadas'
] as const
const VISIBILITY_FREQUENCY_OPTIONS = [
    'Semanal',
    'Quincenal',
    'Mensual',
    'Bimensual',
    'Trimestral',
    'Según hito'
] as const
const VISIBILITY_TEST_QUESTIONS = [
    '¿Tengo clara la señal que quiero instalar?',
    '¿He definido audiencias específicas?',
    '¿Cada señal tiene evidencia visible?',
    '¿Mi enfoque evita la autopromoción vacía?',
    '¿Tengo superficies claras de visibilidad?',
    '¿Mi plan 30-60-90 es ejecutable?'
] as const

const MENTOR_EVALUATION_CRITERIA = [
    'Identificación de sponsors estratégicos',
    'Calidad de relaciones clave',
    'Generación de valor antes de pedir',
    'Lectura de poder organizacional',
    'Expansión consciente del capital relacional'
] as const

const LEADER_EVALUATION_QUESTIONS = [
    '¿Mi red es estratégica o circunstancial?',
    '¿A qué sponsor clave debo acercarme y no lo estoy haciendo?',
    '¿Qué valor concreto aporto antes de solicitar apoyo?',
    '¿Qué conversación clave estoy postergando?',
    '¿Cómo estoy ampliando mi capital relacional este trimestre?'
] as const

const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']
const MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 – Declarativo',
        descriptor: 'Desconoce actores clave; relaciones superficiales.'
    },
    {
        level: 'Nivel 2 – Consciente',
        descriptor: 'Identifica actores pero sin estrategia clara.'
    },
    {
        level: 'Nivel 3 – Integrado',
        descriptor: 'Relaciones estratégicas activas con intercambio de valor.'
    },
    {
        level: 'Nivel 4 – Alineación Estratégica',
        descriptor: 'Red consolidada; influencia estable y sostenible.'
    }
] as const

const createDefaultEvaluationData = (): WB7State['evaluation'] => ({
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

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - Mentor' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const isMentorEvaluationRowComplete = (row: MentorEvaluationRow) =>
    row.level !== '' && row.evidence.trim().length > 0 && row.decision !== ''

const isLeaderEvaluationRowComplete = (row: LeaderEvaluationRow) =>
    row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')

const readYesNo = (value: unknown): YesNoAnswer => (value === 'yes' || value === 'no' ? value : '')

const readLevel = (value: unknown): StakeholderLevel => (value === '1' || value === '2' || value === '3' ? value : '')

const readScore = (value: unknown): Score15 => (value === '1' || value === '2' || value === '3' || value === '4' || value === '5' ? value : '')

const readSymbol = (value: unknown): StakeholderSymbol => (MAP_RING_SYMBOLS.includes(value as StakeholderSymbol) ? (value as StakeholderSymbol) : '')
const readSponsorLevel = (value: unknown): SponsorLevel => (value === 'bajo' || value === 'medio' || value === 'alto' ? value : '')
const readCalibrationLevel = (value: unknown): CalibrationLevel =>
    value === 'bajo' || value === 'medio' || value === 'alto' ? value : ''

const scoreToNumber = (value: Score15): number => (value ? Number(value) : 0)

const buildStrategicReading = (power: Score15, closeness: Score15, mutualValue: Score15): string => {
    const p = scoreToNumber(power)
    const c = scoreToNumber(closeness)
    const v = scoreToNumber(mutualValue)

    if (!p && !c && !v) return ''
    if (p >= 4 && c <= 2 && v <= 2) return 'Alta influencia, baja cercanía: relación a desarrollar'
    if (p >= 4 && c >= 4 && v >= 4) return 'Relación crítica y relativamente sólida'
    if (p >= 4 && c <= 2) return 'Relación estratégica subdesarrollada: activar vínculo'
    if (p <= 2 && c >= 4 && v >= 3) return 'Relación operativa cercana con impacto limitado'
    if (p >= 3 && v <= 2) return 'Existe acceso, falta fortalecer valor mutuo'
    return 'Relación en evolución: ajustar estrategia según contexto'
}

const buildSponsorType = (influence: Score15, closeness: Score15, exposure: Score15, disposition: Score15): string => {
    const i = scoreToNumber(influence)
    const c = scoreToNumber(closeness)
    const e = scoreToNumber(exposure)
    const d = scoreToNumber(disposition)

    if (!i && !c && !e && !d) return ''
    if (i >= 4 && c >= 4 && e >= 4 && d >= 4) return 'Sponsor natural'
    if (i >= 4 && (c <= 2 || e <= 2) && d >= 2) return 'Sponsor potencial lejano'
    if (i >= 4 && e >= 3 && d >= 3) return 'Sponsor potencial'
    if (i <= 2) return 'Sponsor improbable (baja influencia)'
    if (d <= 2) return 'Sponsor improbable (baja disposición)'
    return 'Sponsor en desarrollo'
}

const getConcentricPosition = (
    index: number,
    total: number,
    radiusPercent: number,
    startAngleDeg: number = -90
): { x: number; y: number } => {
    if (total <= 0) return { x: 50, y: 50 }
    const step = 360 / total
    const angle = ((startAngleDeg + index * step) * Math.PI) / 180
    const rawX = 50 + radiusPercent * Math.cos(angle)
    const rawY = 50 + radiusPercent * Math.sin(angle)
    const clamp = (value: number) => Math.min(86, Math.max(14, value))
    return {
        x: clamp(rawX),
        y: clamp(rawY)
    }
}

const DEFAULT_STATE: WB7State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    stakeholderMappingSection: {
        actorInventory: Array.from({ length: INVENTORY_ROWS }, () => ''),
        classificationRows: Array.from({ length: INVENTORY_ROWS }, () => ({
            level: '' as StakeholderLevel,
            bondType: '',
            contactFrequency: '',
            ecosystemImpact: ''
        })),
        valueMatrixRows: Array.from({ length: INVENTORY_ROWS }, () => ({
            powerInfluence: '' as '' | '1' | '2' | '3' | '4' | '5',
            currentCloseness: '' as '' | '1' | '2' | '3' | '4' | '5',
            mutualValue: '' as '' | '1' | '2' | '3' | '4' | '5'
        })),
        relationalGaps: Array.from({ length: 2 }, () => ({
            relationalGap: '',
            criticalReason: '',
            minimumAction: ''
        })),
        ecosystemMap: {
            centerRole: '',
            actorSymbols: Array.from({ length: INVENTORY_ROWS }, () => '' as StakeholderSymbol)
        },
        strategicReadTest: STRATEGIC_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    sponsorIdentificationSection: {
        possibleSponsors: Array.from({ length: SPONSOR_ROWS }, () => ''),
        sponsorMatrixRows: Array.from({ length: SPONSOR_ROWS }, () => ({
            influenceAccess: '' as Score15,
            currentCloseness: '' as Score15,
            valueExposure: '' as Score15,
            probableDisposition: '' as Score15
        })),
        sponsorshipIndexRows: SPONSORSHIP_INDEX_FACTORS.map((factor) => ({
            factor,
            level: '' as SponsorLevel,
            evidence: ''
        })),
        valueBeforeAskingRows: Array.from({ length: 3 }, () => ({
            prioritySponsor: '',
            currentPriority: '',
            firstValue: '',
            avoidAction: ''
        })),
        activationRoute: {
            prioritySponsor: '',
            accessPath: '',
            realisticMove: '',
            progressSignal: '',
            mainRisk: '',
            nextStep15Days: ''
        },
        sponsorReadTest: SPONSOR_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    highValueNetworkSection: {
        relationsInventory: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, () => ''),
        valueTrustAccessRows: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, () => ({
            strategicValue: '' as Score15,
            currentTrust: '' as Score15,
            accessAmplification: '' as Score15,
            dominantValueType: '',
            currentState: ''
        })),
        segmentationRows: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, () => ({
            mainSegment: '',
            reason: '',
            suggestedMove: ''
        })),
        reciprocityRows: Array.from({ length: HIGH_VALUE_RECIPROCITY_ROWS }, () => ({
            relationship: '',
            valueReceived: '',
            valueProvided: '',
            currentBalance: '',
            nextGesture: ''
        })),
        actionMapRows: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, () => ({
            actionState: '',
            justification: '',
            action30Days: ''
        })),
        qualityTest: NETWORK_QUALITY_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    consciousNetworkingSection: {
        intentionDeclaration: {
            strategicObjective: '',
            neededRelationshipType: '',
            strongWeakRelationshipType: '',
            relationalErrorToAvoid: '',
            guidingPrinciple: ''
        },
        objectiveMatrixRows: Array.from({ length: NETWORK_OBJECTIVE_ROWS }, () => ({
            relationalObjective: '',
            audienceActor: '',
            firstValueContribution: '',
            realisticInitialMove: '',
            expectedProgressSignal: ''
        })),
        movementSegmentationRows: Array.from({ length: NETWORK_MOVEMENT_ROWS }, () => ({
            relationActor: '',
            movementType: '',
            concreteAction: '',
            valueAtStake: ''
        })),
        cadenceRows: Array.from({ length: NETWORK_CADENCE_ROWS }, () => ({
            relation: '',
            suggestedCadence: '',
            contactFormat: '',
            contactObjective: ''
        })),
        scorecardRows: CONSCIOUS_NETWORKING_SCORECARD_DIMENSIONS.map((dimension) => ({
            dimension,
            level: '' as CalibrationLevel,
            evidence: ''
        })),
        plan30Days: {
            nourishRelationships: '',
            reactivateRelationships: '',
            exploreRelationships: '',
            visibleReciprocityAction: '',
            maintenanceHabit: '',
            progressCriteria: ''
        }
    },
    strategicVisibilitySection: {
        visibilityAudit: {
            currentVisibleSpaces: '',
            currentVisibleAudiences: '',
            currentPerceivedValue: '',
            invisibleContributions: '',
            unoccupiedKeySpaces: '',
            probablePerception: ''
        },
        visibilityMatrixRows: Array.from({ length: VISIBILITY_MATRIX_ROWS }, () => ({
            keyAudience: '',
            valueToMakeVisible: '',
            concreteEvidence: '',
            visibilitySurface: '',
            errorToAvoid: ''
        })),
        signalArchitecture: {
            mainSignal: '',
            visibleAttributes: '',
            visibleProofs: '',
            strongerContexts: '',
            weakeningIncoherences: ''
        },
        visibilityPortfolioRows: Array.from({ length: VISIBILITY_PORTFOLIO_ROWS }, (_, index) => ({
            visibilitySurface: VISIBILITY_PORTFOLIO_SURFACES[index],
            whatToShow: '',
            format: '',
            minimumFrequency: ''
        })),
        visibilityTimelineRows: [
            { horizon: '30 días' as const, targetVisibleOutcome: '', space: '', progressIndicator: '' },
            { horizon: '60 días' as const, targetVisibleOutcome: '', space: '', progressIndicator: '' },
            { horizon: '90 días' as const, targetVisibleOutcome: '', space: '', progressIndicator: '' }
        ],
        visibilityTest: VISIBILITY_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    evaluation: createDefaultEvaluationData()
}

const normalizeState = (raw: unknown): WB7State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const stakeholderSection = (parsed.stakeholderMappingSection ?? {}) as Record<string, unknown>

    const rawInventory = Array.isArray(stakeholderSection.actorInventory) ? stakeholderSection.actorInventory : []
    const rawClassificationRows = Array.isArray(stakeholderSection.classificationRows) ? stakeholderSection.classificationRows : []
    const rawValueMatrixRows = Array.isArray(stakeholderSection.valueMatrixRows) ? stakeholderSection.valueMatrixRows : []
    const rawRelationalGaps = Array.isArray(stakeholderSection.relationalGaps) ? stakeholderSection.relationalGaps : []
    const rawEcosystemMap = (stakeholderSection.ecosystemMap ?? {}) as Record<string, unknown>
    const rawActorSymbols = Array.isArray(rawEcosystemMap.actorSymbols) ? rawEcosystemMap.actorSymbols : []
    const rawStrategicReadTest = Array.isArray(stakeholderSection.strategicReadTest) ? stakeholderSection.strategicReadTest : []
    const sponsorSection = (parsed.sponsorIdentificationSection ?? {}) as Record<string, unknown>
    const rawPossibleSponsors = Array.isArray(sponsorSection.possibleSponsors) ? sponsorSection.possibleSponsors : []
    const rawSponsorMatrixRows = Array.isArray(sponsorSection.sponsorMatrixRows) ? sponsorSection.sponsorMatrixRows : []
    const rawSponsorshipIndexRows = Array.isArray(sponsorSection.sponsorshipIndexRows) ? sponsorSection.sponsorshipIndexRows : []
    const rawValueBeforeAskingRows = Array.isArray(sponsorSection.valueBeforeAskingRows) ? sponsorSection.valueBeforeAskingRows : []
    const rawActivationRoute = (sponsorSection.activationRoute ?? {}) as Record<string, unknown>
    const rawSponsorReadTest = Array.isArray(sponsorSection.sponsorReadTest) ? sponsorSection.sponsorReadTest : []
    const highValueSection = (parsed.highValueNetworkSection ?? {}) as Record<string, unknown>
    const rawRelationsInventory = Array.isArray(highValueSection.relationsInventory) ? highValueSection.relationsInventory : []
    const rawValueTrustAccessRows = Array.isArray(highValueSection.valueTrustAccessRows) ? highValueSection.valueTrustAccessRows : []
    const rawSegmentationRows = Array.isArray(highValueSection.segmentationRows) ? highValueSection.segmentationRows : []
    const rawReciprocityRows = Array.isArray(highValueSection.reciprocityRows) ? highValueSection.reciprocityRows : []
    const rawActionMapRows = Array.isArray(highValueSection.actionMapRows) ? highValueSection.actionMapRows : []
    const rawQualityTest = Array.isArray(highValueSection.qualityTest) ? highValueSection.qualityTest : []
    const consciousNetworkingSection = (parsed.consciousNetworkingSection ?? {}) as Record<string, unknown>
    const rawIntentionDeclaration = (consciousNetworkingSection.intentionDeclaration ?? {}) as Record<string, unknown>
    const rawObjectiveMatrixRows = Array.isArray(consciousNetworkingSection.objectiveMatrixRows)
        ? consciousNetworkingSection.objectiveMatrixRows
        : []
    const rawMovementSegmentationRows = Array.isArray(consciousNetworkingSection.movementSegmentationRows)
        ? consciousNetworkingSection.movementSegmentationRows
        : []
    const rawCadenceRows = Array.isArray(consciousNetworkingSection.cadenceRows) ? consciousNetworkingSection.cadenceRows : []
    const rawScorecardRows = Array.isArray(consciousNetworkingSection.scorecardRows) ? consciousNetworkingSection.scorecardRows : []
    const rawPlan30Days = (consciousNetworkingSection.plan30Days ?? {}) as Record<string, unknown>
    const strategicVisibilitySection = (parsed.strategicVisibilitySection ?? {}) as Record<string, unknown>
    const rawVisibilityAudit = (strategicVisibilitySection.visibilityAudit ?? {}) as Record<string, unknown>
    const rawVisibilityMatrixRows = Array.isArray(strategicVisibilitySection.visibilityMatrixRows)
        ? strategicVisibilitySection.visibilityMatrixRows
        : []
    const rawSignalArchitecture = (strategicVisibilitySection.signalArchitecture ?? {}) as Record<string, unknown>
    const rawVisibilityPortfolioRows = Array.isArray(strategicVisibilitySection.visibilityPortfolioRows)
        ? strategicVisibilitySection.visibilityPortfolioRows
        : []
    const rawVisibilityTimelineRows = Array.isArray(strategicVisibilitySection.visibilityTimelineRows)
        ? strategicVisibilitySection.visibilityTimelineRows
        : []
    const rawVisibilityTest = Array.isArray(strategicVisibilitySection.visibilityTest) ? strategicVisibilitySection.visibilityTest : []
    const rawEvaluation = (parsed.evaluation ?? {}) as Record<string, unknown>
    const rawMentorRows = Array.isArray(rawEvaluation.mentorRows) ? rawEvaluation.mentorRows : []
    const rawLeaderRows = Array.isArray(rawEvaluation.leaderRows) ? rawEvaluation.leaderRows : []

    return {
        identification: {
            leaderName: readString(identification.leaderName),
            role: readString(identification.role),
            cohort: readString(identification.cohort),
            startDate: readString(identification.startDate)
        },
        stakeholderMappingSection: {
            actorInventory: Array.from({ length: INVENTORY_ROWS }, (_, index) => readString(rawInventory[index])),
            classificationRows: Array.from({ length: INVENTORY_ROWS }, (_, index) => {
                const row = (rawClassificationRows[index] ?? {}) as Record<string, unknown>
                return {
                    level: readLevel(row.level),
                    bondType: readString(row.bondType),
                    contactFrequency: readString(row.contactFrequency),
                    ecosystemImpact: readString(row.ecosystemImpact)
                }
            }),
            valueMatrixRows: Array.from({ length: INVENTORY_ROWS }, (_, index) => {
                const row = (rawValueMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    powerInfluence: readScore(row.powerInfluence),
                    currentCloseness: readScore(row.currentCloseness),
                    mutualValue: readScore(row.mutualValue)
                }
            }),
            relationalGaps: Array.from({ length: 2 }, (_, index) => {
                const row = (rawRelationalGaps[index] ?? {}) as Record<string, unknown>
                return {
                    relationalGap: readString(row.relationalGap),
                    criticalReason: readString(row.criticalReason),
                    minimumAction: readString(row.minimumAction)
                }
            }),
            ecosystemMap: {
                centerRole: readString(rawEcosystemMap.centerRole),
                actorSymbols: Array.from({ length: INVENTORY_ROWS }, (_, index) => readSymbol(rawActorSymbols[index]))
            },
            strategicReadTest: STRATEGIC_TEST_QUESTIONS.map((question, index) => {
                const row = (rawStrategicReadTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        sponsorIdentificationSection: {
            possibleSponsors: Array.from({ length: SPONSOR_ROWS }, (_, index) => readString(rawPossibleSponsors[index])),
            sponsorMatrixRows: Array.from({ length: SPONSOR_ROWS }, (_, index) => {
                const row = (rawSponsorMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    influenceAccess: readScore(row.influenceAccess),
                    currentCloseness: readScore(row.currentCloseness),
                    valueExposure: readScore(row.valueExposure),
                    probableDisposition: readScore(row.probableDisposition)
                }
            }),
            sponsorshipIndexRows: SPONSORSHIP_INDEX_FACTORS.map((factor, index) => {
                const row = (rawSponsorshipIndexRows[index] ?? {}) as Record<string, unknown>
                return {
                    factor,
                    level: readSponsorLevel(row.level),
                    evidence: readString(row.evidence)
                }
            }),
            valueBeforeAskingRows: Array.from({ length: 3 }, (_, index) => {
                const row = (rawValueBeforeAskingRows[index] ?? {}) as Record<string, unknown>
                return {
                    prioritySponsor: readString(row.prioritySponsor),
                    currentPriority: readString(row.currentPriority),
                    firstValue: readString(row.firstValue),
                    avoidAction: readString(row.avoidAction)
                }
            }),
            activationRoute: {
                prioritySponsor: readString(rawActivationRoute.prioritySponsor),
                accessPath: readString(rawActivationRoute.accessPath),
                realisticMove: readString(rawActivationRoute.realisticMove),
                progressSignal: readString(rawActivationRoute.progressSignal),
                mainRisk: readString(rawActivationRoute.mainRisk),
                nextStep15Days: readString(rawActivationRoute.nextStep15Days)
            },
            sponsorReadTest: SPONSOR_TEST_QUESTIONS.map((question, index) => {
                const row = (rawSponsorReadTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        highValueNetworkSection: {
            relationsInventory: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, (_, index) =>
                readString(rawRelationsInventory[index])
            ),
            valueTrustAccessRows: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, (_, index) => {
                const row = (rawValueTrustAccessRows[index] ?? {}) as Record<string, unknown>
                return {
                    strategicValue: readScore(row.strategicValue),
                    currentTrust: readScore(row.currentTrust),
                    accessAmplification: readScore(row.accessAmplification),
                    dominantValueType: readString(row.dominantValueType),
                    currentState: readString(row.currentState)
                }
            }),
            segmentationRows: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, (_, index) => {
                const row = (rawSegmentationRows[index] ?? {}) as Record<string, unknown>
                return {
                    mainSegment: readString(row.mainSegment),
                    reason: readString(row.reason),
                    suggestedMove: readString(row.suggestedMove)
                }
            }),
            reciprocityRows: Array.from({ length: HIGH_VALUE_RECIPROCITY_ROWS }, (_, index) => {
                const row = (rawReciprocityRows[index] ?? {}) as Record<string, unknown>
                return {
                    relationship: readString(row.relationship),
                    valueReceived: readString(row.valueReceived),
                    valueProvided: readString(row.valueProvided),
                    currentBalance: readString(row.currentBalance),
                    nextGesture: readString(row.nextGesture)
                }
            }),
            actionMapRows: Array.from({ length: HIGH_VALUE_RELATIONS_ROWS }, (_, index) => {
                const row = (rawActionMapRows[index] ?? {}) as Record<string, unknown>
                return {
                    actionState: readString(row.actionState),
                    justification: readString(row.justification),
                    action30Days: readString(row.action30Days)
                }
            }),
            qualityTest: NETWORK_QUALITY_TEST_QUESTIONS.map((question, index) => {
                const row = (rawQualityTest[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: readYesNo(row.verdict),
                    adjustment: readString(row.adjustment)
                }
            })
        },
        consciousNetworkingSection: {
            intentionDeclaration: {
                strategicObjective: readString(rawIntentionDeclaration.strategicObjective),
                neededRelationshipType: readString(rawIntentionDeclaration.neededRelationshipType),
                strongWeakRelationshipType: readString(rawIntentionDeclaration.strongWeakRelationshipType),
                relationalErrorToAvoid: readString(rawIntentionDeclaration.relationalErrorToAvoid),
                guidingPrinciple: readString(rawIntentionDeclaration.guidingPrinciple)
            },
            objectiveMatrixRows: Array.from({ length: NETWORK_OBJECTIVE_ROWS }, (_, index) => {
                const row = (rawObjectiveMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    relationalObjective: readString(row.relationalObjective),
                    audienceActor: readString(row.audienceActor),
                    firstValueContribution: readString(row.firstValueContribution),
                    realisticInitialMove: readString(row.realisticInitialMove),
                    expectedProgressSignal: readString(row.expectedProgressSignal)
                }
            }),
            movementSegmentationRows: Array.from({ length: NETWORK_MOVEMENT_ROWS }, (_, index) => {
                const row = (rawMovementSegmentationRows[index] ?? {}) as Record<string, unknown>
                return {
                    relationActor: readString(row.relationActor),
                    movementType: readString(row.movementType),
                    concreteAction: readString(row.concreteAction),
                    valueAtStake: readString(row.valueAtStake)
                }
            }),
            cadenceRows: Array.from({ length: NETWORK_CADENCE_ROWS }, (_, index) => {
                const row = (rawCadenceRows[index] ?? {}) as Record<string, unknown>
                return {
                    relation: readString(row.relation),
                    suggestedCadence: readString(row.suggestedCadence),
                    contactFormat: readString(row.contactFormat),
                    contactObjective: readString(row.contactObjective)
                }
            }),
            scorecardRows: CONSCIOUS_NETWORKING_SCORECARD_DIMENSIONS.map((dimension, index) => {
                const row = (rawScorecardRows[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    level: readCalibrationLevel(row.level),
                    evidence: readString(row.evidence)
                }
            }),
            plan30Days: {
                nourishRelationships: readString(rawPlan30Days.nourishRelationships),
                reactivateRelationships: readString(rawPlan30Days.reactivateRelationships),
                exploreRelationships: readString(rawPlan30Days.exploreRelationships),
                visibleReciprocityAction: readString(rawPlan30Days.visibleReciprocityAction),
                maintenanceHabit: readString(rawPlan30Days.maintenanceHabit),
                progressCriteria: readString(rawPlan30Days.progressCriteria)
            }
        },
        strategicVisibilitySection: {
            visibilityAudit: {
                currentVisibleSpaces: readString(rawVisibilityAudit.currentVisibleSpaces),
                currentVisibleAudiences: readString(rawVisibilityAudit.currentVisibleAudiences),
                currentPerceivedValue: readString(rawVisibilityAudit.currentPerceivedValue),
                invisibleContributions: readString(rawVisibilityAudit.invisibleContributions),
                unoccupiedKeySpaces: readString(rawVisibilityAudit.unoccupiedKeySpaces),
                probablePerception: readString(rawVisibilityAudit.probablePerception)
            },
            visibilityMatrixRows: Array.from({ length: VISIBILITY_MATRIX_ROWS }, (_, index) => {
                const row = (rawVisibilityMatrixRows[index] ?? {}) as Record<string, unknown>
                return {
                    keyAudience: readString(row.keyAudience),
                    valueToMakeVisible: readString(row.valueToMakeVisible),
                    concreteEvidence: readString(row.concreteEvidence),
                    visibilitySurface: readString(row.visibilitySurface),
                    errorToAvoid: readString(row.errorToAvoid)
                }
            }),
            signalArchitecture: {
                mainSignal: readString(rawSignalArchitecture.mainSignal),
                visibleAttributes: readString(rawSignalArchitecture.visibleAttributes),
                visibleProofs: readString(rawSignalArchitecture.visibleProofs),
                strongerContexts: readString(rawSignalArchitecture.strongerContexts),
                weakeningIncoherences: readString(rawSignalArchitecture.weakeningIncoherences)
            },
            visibilityPortfolioRows: Array.from({ length: VISIBILITY_PORTFOLIO_ROWS }, (_, index) => {
                const row = (rawVisibilityPortfolioRows[index] ?? {}) as Record<string, unknown>
                return {
                    visibilitySurface: readString(row.visibilitySurface) || VISIBILITY_PORTFOLIO_SURFACES[index],
                    whatToShow: readString(row.whatToShow),
                    format: readString(row.format),
                    minimumFrequency: readString(row.minimumFrequency)
                }
            }),
            visibilityTimelineRows: ['30 días', '60 días', '90 días'].map((horizon, index) => {
                const row = (rawVisibilityTimelineRows[index] ?? {}) as Record<string, unknown>
                return {
                    horizon: horizon as '30 días' | '60 días' | '90 días',
                    targetVisibleOutcome: readString(row.targetVisibleOutcome),
                    space: readString(row.space),
                    progressIndicator: readString(row.progressIndicator)
                }
            }),
            visibilityTest: VISIBILITY_TEST_QUESTIONS.map((question, index) => {
                const row = (rawVisibilityTest[index] ?? {}) as Record<string, unknown>
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
                return {
                    criterion,
                    level:
                        row.level === 'N1' || row.level === 'N2' || row.level === 'N3' || row.level === 'N4'
                            ? (row.level as MentorLevel)
                            : ('' as MentorLevel),
                    evidence: readString(row.evidence),
                    decision:
                        row.decision === 'Consolidado' || row.decision === 'En desarrollo' || row.decision === 'Prioritario'
                            ? (row.decision as MentorDecision)
                            : ('' as MentorDecision)
                }
            }),
            mentorGeneralNotes: readString(rawEvaluation.mentorGeneralNotes),
            mentorGlobalDecision:
                rawEvaluation.mentorGlobalDecision === 'Consolidado' ||
                rawEvaluation.mentorGlobalDecision === 'En desarrollo' ||
                rawEvaluation.mentorGlobalDecision === 'Prioritario'
                    ? (rawEvaluation.mentorGlobalDecision as MentorDecision)
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

export function WB7Digital() {
    const [state, setState] = useState<WB7State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showStakeholderHelp, setShowStakeholderHelp] = useState(false)
    const [showSponsorHelp, setShowSponsorHelp] = useState(false)
    const [showHighValueHelp, setShowHighValueHelp] = useState(false)
    const [showConsciousNetworkingHelp, setShowConsciousNetworkingHelp] = useState(false)
    const [showVisibilityHelp, setShowVisibilityHelp] = useState(false)
    const [mentorEvaluationEditModes, setMentorEvaluationEditModes] = useState<boolean[]>(
        () => state.evaluation.mentorRows.map(() => false)
    )
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        () => state.evaluation.leaderRows.map(() => false)
    )
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')
    const [showEvaluationLevelReference, setShowEvaluationLevelReference] = useState(true)

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
        if (!isHydrated || hasSeenPresentationOnce || activePage !== 2) {
            return
        }

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

    const updateIdentification = (field: keyof WB7State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateActorInventory = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const actorInventory = [...prev.stakeholderMappingSection.actorInventory]
            actorInventory[index] = value
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    actorInventory
                }
            }
        })
    }

    const updateClassificationRow = (
        index: number,
        field: keyof WB7State['stakeholderMappingSection']['classificationRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const classificationRows = [...prev.stakeholderMappingSection.classificationRows]
            classificationRows[index] = {
                ...classificationRows[index],
                [field]: value
            }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    classificationRows
                }
            }
        })
    }

    const updateValueMatrixRow = (
        index: number,
        field: keyof WB7State['stakeholderMappingSection']['valueMatrixRows'][number],
        value: Score15
    ) => {
        if (isLocked) return
        setState((prev) => {
            const valueMatrixRows = [...prev.stakeholderMappingSection.valueMatrixRows]
            valueMatrixRows[index] = {
                ...valueMatrixRows[index],
                [field]: value
            }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    valueMatrixRows
                }
            }
        })
    }

    const updateRelationalGap = (
        index: number,
        field: keyof WB7State['stakeholderMappingSection']['relationalGaps'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const relationalGaps = [...prev.stakeholderMappingSection.relationalGaps]
            relationalGaps[index] = {
                ...relationalGaps[index],
                [field]: value
            }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    relationalGaps
                }
            }
        })
    }

    const updateEcosystemCenterRole = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            stakeholderMappingSection: {
                ...prev.stakeholderMappingSection,
                ecosystemMap: {
                    ...prev.stakeholderMappingSection.ecosystemMap,
                    centerRole: value
                }
            }
        }))
    }

    const cycleActorSymbol = (index: number) => {
        if (isLocked) return
        setState((prev) => {
            const actorSymbols = [...prev.stakeholderMappingSection.ecosystemMap.actorSymbols]
            const current = actorSymbols[index]
            const nextIndex = (MAP_RING_SYMBOLS.indexOf(current) + 1) % MAP_RING_SYMBOLS.length
            actorSymbols[index] = MAP_RING_SYMBOLS[nextIndex]
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    ecosystemMap: {
                        ...prev.stakeholderMappingSection.ecosystemMap,
                        actorSymbols
                    }
                }
            }
        })
    }

    const updateStrategicReadTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const strategicReadTest = [...prev.stakeholderMappingSection.strategicReadTest]
            strategicReadTest[index] =
                field === 'verdict'
                    ? { ...strategicReadTest[index], verdict: readYesNo(value) }
                    : { ...strategicReadTest[index], adjustment: value }
            return {
                ...prev,
                stakeholderMappingSection: {
                    ...prev.stakeholderMappingSection,
                    strategicReadTest
                }
            }
        })
    }

    const saveStakeholderBlock = (label: string) => {
        savePage(3)
        announceSave(`${label} guardado.`)
    }

    const updatePossibleSponsor = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const possibleSponsors = [...prev.sponsorIdentificationSection.possibleSponsors]
            possibleSponsors[index] = value
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    possibleSponsors
                }
            }
        })
    }

    const updateSponsorMatrixRow = (
        index: number,
        field: keyof WB7State['sponsorIdentificationSection']['sponsorMatrixRows'][number],
        value: Score15
    ) => {
        if (isLocked) return
        setState((prev) => {
            const sponsorMatrixRows = [...prev.sponsorIdentificationSection.sponsorMatrixRows]
            sponsorMatrixRows[index] = {
                ...sponsorMatrixRows[index],
                [field]: value
            }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    sponsorMatrixRows
                }
            }
        })
    }

    const updateSponsorshipIndexRow = (index: number, field: 'level' | 'evidence', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const sponsorshipIndexRows = [...prev.sponsorIdentificationSection.sponsorshipIndexRows]
            sponsorshipIndexRows[index] =
                field === 'level'
                    ? { ...sponsorshipIndexRows[index], level: readSponsorLevel(value) }
                    : { ...sponsorshipIndexRows[index], evidence: value }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    sponsorshipIndexRows
                }
            }
        })
    }

    const updateValueBeforeAskingRow = (
        index: number,
        field: keyof WB7State['sponsorIdentificationSection']['valueBeforeAskingRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const valueBeforeAskingRows = [...prev.sponsorIdentificationSection.valueBeforeAskingRows]
            valueBeforeAskingRows[index] = {
                ...valueBeforeAskingRows[index],
                [field]: value
            }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    valueBeforeAskingRows
                }
            }
        })
    }

    const updateActivationRoute = (
        field: keyof WB7State['sponsorIdentificationSection']['activationRoute'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            sponsorIdentificationSection: {
                ...prev.sponsorIdentificationSection,
                activationRoute: {
                    ...prev.sponsorIdentificationSection.activationRoute,
                    [field]: value
                }
            }
        }))
    }

    const updateSponsorReadTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const sponsorReadTest = [...prev.sponsorIdentificationSection.sponsorReadTest]
            sponsorReadTest[index] =
                field === 'verdict'
                    ? { ...sponsorReadTest[index], verdict: readYesNo(value) }
                    : { ...sponsorReadTest[index], adjustment: value }
            return {
                ...prev,
                sponsorIdentificationSection: {
                    ...prev.sponsorIdentificationSection,
                    sponsorReadTest
                }
            }
        })
    }

    const saveSponsorBlock = (label: string) => {
        savePage(4)
        announceSave(`${label} guardado.`)
    }

    const mergeNetworkInventory = (incoming: string[]) => {
        if (isLocked) return
        const normalizedIncoming = incoming.map((item) => item.trim()).filter((item) => item.length > 0)
        if (!normalizedIncoming.length) return
        setState((prev) => {
            const relationsInventory = [...prev.highValueNetworkSection.relationsInventory]
            const existing = new Set(relationsInventory.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0))
            const candidates = normalizedIncoming.filter((item) => !existing.has(item.toLowerCase()))
            if (!candidates.length) return prev

            let pointer = 0
            for (let index = 0; index < relationsInventory.length && pointer < candidates.length; index += 1) {
                if (relationsInventory[index].trim().length === 0) {
                    relationsInventory[index] = candidates[pointer]
                    pointer += 1
                }
            }

            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    relationsInventory
                }
            }
        })
    }

    const importStakeholdersIntoNetwork = () => {
        mergeNetworkInventory(state.stakeholderMappingSection.actorInventory)
        savePage(5)
        announceSave('Se importaron stakeholders al inventario de red de alto valor.')
    }

    const importSponsorsIntoNetwork = () => {
        mergeNetworkInventory(state.sponsorIdentificationSection.possibleSponsors)
        savePage(5)
        announceSave('Se importaron sponsors al inventario de red de alto valor.')
    }

    const updateHighValueRelation = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const relationsInventory = [...prev.highValueNetworkSection.relationsInventory]
            relationsInventory[index] = value
            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    relationsInventory
                }
            }
        })
    }

    const updateValueTrustAccessRow = (
        index: number,
        field: keyof WB7State['highValueNetworkSection']['valueTrustAccessRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const valueTrustAccessRows = [...prev.highValueNetworkSection.valueTrustAccessRows]
            valueTrustAccessRows[index] = {
                ...valueTrustAccessRows[index],
                [field]:
                    field === 'strategicValue' || field === 'currentTrust' || field === 'accessAmplification'
                        ? readScore(value)
                        : value
            }
            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    valueTrustAccessRows
                }
            }
        })
    }

    const updateSegmentationRow = (
        index: number,
        field: keyof WB7State['highValueNetworkSection']['segmentationRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const segmentationRows = [...prev.highValueNetworkSection.segmentationRows]
            segmentationRows[index] = {
                ...segmentationRows[index],
                [field]: value
            }
            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    segmentationRows
                }
            }
        })
    }

    const updateReciprocityRow = (
        index: number,
        field: keyof WB7State['highValueNetworkSection']['reciprocityRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const reciprocityRows = [...prev.highValueNetworkSection.reciprocityRows]
            reciprocityRows[index] = {
                ...reciprocityRows[index],
                [field]: value
            }
            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    reciprocityRows
                }
            }
        })
    }

    const updateActionMapRow = (
        index: number,
        field: keyof WB7State['highValueNetworkSection']['actionMapRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const actionMapRows = [...prev.highValueNetworkSection.actionMapRows]
            actionMapRows[index] = {
                ...actionMapRows[index],
                [field]: value
            }
            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    actionMapRows
                }
            }
        })
    }

    const updateNetworkQualityTest = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const qualityTest = [...prev.highValueNetworkSection.qualityTest]
            qualityTest[index] =
                field === 'verdict' ? { ...qualityTest[index], verdict: readYesNo(value) } : { ...qualityTest[index], adjustment: value }
            return {
                ...prev,
                highValueNetworkSection: {
                    ...prev.highValueNetworkSection,
                    qualityTest
                }
            }
        })
    }

    const saveHighValueBlock = (label: string) => {
        savePage(5)
        announceSave(`${label} guardado.`)
    }

    const updateNetworkingIntention = (
        field: keyof WB7State['consciousNetworkingSection']['intentionDeclaration'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            consciousNetworkingSection: {
                ...prev.consciousNetworkingSection,
                intentionDeclaration: {
                    ...prev.consciousNetworkingSection.intentionDeclaration,
                    [field]: value
                }
            }
        }))
    }

    const updateNetworkingObjectiveMatrixRow = (
        index: number,
        field: keyof WB7State['consciousNetworkingSection']['objectiveMatrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const objectiveMatrixRows = [...prev.consciousNetworkingSection.objectiveMatrixRows]
            objectiveMatrixRows[index] = {
                ...objectiveMatrixRows[index],
                [field]: value
            }
            return {
                ...prev,
                consciousNetworkingSection: {
                    ...prev.consciousNetworkingSection,
                    objectiveMatrixRows
                }
            }
        })
    }

    const updateNetworkingMovementRow = (
        index: number,
        field: keyof WB7State['consciousNetworkingSection']['movementSegmentationRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const movementSegmentationRows = [...prev.consciousNetworkingSection.movementSegmentationRows]
            movementSegmentationRows[index] = {
                ...movementSegmentationRows[index],
                [field]: value
            }
            return {
                ...prev,
                consciousNetworkingSection: {
                    ...prev.consciousNetworkingSection,
                    movementSegmentationRows
                }
            }
        })
    }

    const updateNetworkingCadenceRow = (
        index: number,
        field: keyof WB7State['consciousNetworkingSection']['cadenceRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const cadenceRows = [...prev.consciousNetworkingSection.cadenceRows]
            cadenceRows[index] = {
                ...cadenceRows[index],
                [field]: value
            }
            return {
                ...prev,
                consciousNetworkingSection: {
                    ...prev.consciousNetworkingSection,
                    cadenceRows
                }
            }
        })
    }

    const updateNetworkingScorecardRow = (index: number, field: 'level' | 'evidence', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const scorecardRows = [...prev.consciousNetworkingSection.scorecardRows]
            scorecardRows[index] =
                field === 'level'
                    ? { ...scorecardRows[index], level: readCalibrationLevel(value) }
                    : { ...scorecardRows[index], evidence: value }
            return {
                ...prev,
                consciousNetworkingSection: {
                    ...prev.consciousNetworkingSection,
                    scorecardRows
                }
            }
        })
    }

    const updateNetworkingPlan30Days = (
        field: keyof WB7State['consciousNetworkingSection']['plan30Days'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            consciousNetworkingSection: {
                ...prev.consciousNetworkingSection,
                plan30Days: {
                    ...prev.consciousNetworkingSection.plan30Days,
                    [field]: value
                }
            }
        }))
    }

    const saveConsciousNetworkingBlock = (label: string) => {
        savePage(6)
        announceSave(`${label} guardado.`)
    }

    const mergeVisibilityAudiences = (incoming: string[]) => {
        if (isLocked) return
        const normalizedIncoming = incoming.map((item) => item.trim()).filter((item) => item.length > 0)
        if (!normalizedIncoming.length) return
        setState((prev) => {
            const visibilityMatrixRows = [...prev.strategicVisibilitySection.visibilityMatrixRows]
            const existing = new Set(
                visibilityMatrixRows.map((row) => row.keyAudience.trim().toLowerCase()).filter((item) => item.length > 0)
            )
            const candidates = normalizedIncoming.filter((item) => !existing.has(item.toLowerCase()))
            if (!candidates.length) return prev

            let pointer = 0
            for (let index = 0; index < visibilityMatrixRows.length && pointer < candidates.length; index += 1) {
                if (visibilityMatrixRows[index].keyAudience.trim().length === 0) {
                    visibilityMatrixRows[index] = {
                        ...visibilityMatrixRows[index],
                        keyAudience: candidates[pointer]
                    }
                    pointer += 1
                }
            }

            return {
                ...prev,
                strategicVisibilitySection: {
                    ...prev.strategicVisibilitySection,
                    visibilityMatrixRows
                }
            }
        })
    }

    const importStakeholdersIntoVisibility = () => {
        mergeVisibilityAudiences(state.stakeholderMappingSection.actorInventory)
        savePage(7)
        announceSave('Se importaron stakeholders a audiencias clave de visibilidad.')
    }

    const importSponsorsIntoVisibility = () => {
        mergeVisibilityAudiences(state.sponsorIdentificationSection.possibleSponsors)
        savePage(7)
        announceSave('Se importaron sponsors a audiencias clave de visibilidad.')
    }

    const updateVisibilityAudit = (
        field: keyof WB7State['strategicVisibilitySection']['visibilityAudit'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicVisibilitySection: {
                ...prev.strategicVisibilitySection,
                visibilityAudit: {
                    ...prev.strategicVisibilitySection.visibilityAudit,
                    [field]: value
                }
            }
        }))
    }

    const updateVisibilityMatrixRow = (
        index: number,
        field: keyof WB7State['strategicVisibilitySection']['visibilityMatrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const visibilityMatrixRows = [...prev.strategicVisibilitySection.visibilityMatrixRows]
            visibilityMatrixRows[index] = {
                ...visibilityMatrixRows[index],
                [field]: value
            }
            return {
                ...prev,
                strategicVisibilitySection: {
                    ...prev.strategicVisibilitySection,
                    visibilityMatrixRows
                }
            }
        })
    }

    const updateVisibilitySignalArchitecture = (
        field: keyof WB7State['strategicVisibilitySection']['signalArchitecture'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicVisibilitySection: {
                ...prev.strategicVisibilitySection,
                signalArchitecture: {
                    ...prev.strategicVisibilitySection.signalArchitecture,
                    [field]: value
                }
            }
        }))
    }

    const updateVisibilityPortfolioRow = (
        index: number,
        field: keyof WB7State['strategicVisibilitySection']['visibilityPortfolioRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const visibilityPortfolioRows = [...prev.strategicVisibilitySection.visibilityPortfolioRows]
            visibilityPortfolioRows[index] = {
                ...visibilityPortfolioRows[index],
                [field]: value
            }
            return {
                ...prev,
                strategicVisibilitySection: {
                    ...prev.strategicVisibilitySection,
                    visibilityPortfolioRows
                }
            }
        })
    }

    const updateVisibilityTimelineRow = (
        index: number,
        field: keyof Omit<WB7State['strategicVisibilitySection']['visibilityTimelineRows'][number], 'horizon'>,
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const visibilityTimelineRows = [...prev.strategicVisibilitySection.visibilityTimelineRows]
            visibilityTimelineRows[index] = {
                ...visibilityTimelineRows[index],
                [field]: value
            }
            return {
                ...prev,
                strategicVisibilitySection: {
                    ...prev.strategicVisibilitySection,
                    visibilityTimelineRows
                }
            }
        })
    }

    const updateVisibilityTestRow = (index: number, field: 'verdict' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const visibilityTest = [...prev.strategicVisibilitySection.visibilityTest]
            visibilityTest[index] =
                field === 'verdict' ? { ...visibilityTest[index], verdict: readYesNo(value) } : { ...visibilityTest[index], adjustment: value }
            return {
                ...prev,
                strategicVisibilitySection: {
                    ...prev.strategicVisibilitySection,
                    visibilityTest
                }
            }
        })
    }

    const saveVisibilityBlock = (label: string) => {
        savePage(7)
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
        markVisited(8)
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
        markVisited(8)
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
        savePage(8)
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
            document.title = 'WB7 - Mapeo del ecosistema estratégico'
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
            link.download = 'WB7-mapeo-ecosistema-estrategico-completo.html'
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

    const stakeholderSection = state.stakeholderMappingSection
    const actorRows = stakeholderSection.actorInventory.map((actor, index) => ({
        index,
        actor: actor.trim(),
        row: stakeholderSection.classificationRows[index],
        matrix: stakeholderSection.valueMatrixRows[index],
        symbol: stakeholderSection.ecosystemMap.actorSymbols[index]
    }))
    const actorsWithName = actorRows.filter((item) => item.actor.length > 0)
    const activeClassificationRows = actorRows.filter((item) => item.actor.length > 0)
    const activeMatrixRows = actorRows.filter((item) => item.actor.length > 0 && item.row.level !== '')

    const inventoryCompleted = actorsWithName.length >= 3
    const classificationCompleted =
        activeClassificationRows.length > 0 &&
        activeClassificationRows.every(
            (item) =>
                item.row.level !== '' &&
                item.row.bondType.trim().length > 0 &&
                item.row.contactFrequency.trim().length > 0 &&
                item.row.ecosystemImpact.trim().length > 0
        )
    const valueMatrixCompleted =
        activeMatrixRows.length > 0 &&
        activeMatrixRows.every(
            (item) => item.matrix.powerInfluence !== '' && item.matrix.currentCloseness !== '' && item.matrix.mutualValue !== ''
        )
    const relationalGapsCompleted = stakeholderSection.relationalGaps.some(
        (gap) => gap.relationalGap.trim().length > 0 && gap.criticalReason.trim().length > 0 && gap.minimumAction.trim().length > 0
    )
    const ecosystemMapCompleted = stakeholderSection.ecosystemMap.centerRole.trim().length > 0 && activeClassificationRows.some((item) => item.row.level !== '')
    const strategicTestCompleted = stakeholderSection.strategicReadTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const section3Completed =
        inventoryCompleted &&
        classificationCompleted &&
        valueMatrixCompleted &&
        relationalGapsCompleted &&
        ecosystemMapCompleted &&
        strategicTestCompleted

    const allClassifiedRows = activeClassificationRows.filter((item) => item.row.level !== '')
    const allActorsLevel1 = allClassifiedRows.length >= 2 && allClassifiedRows.every((item) => item.row.level === '1')
    const hasHighInfluenceLowCloseness = actorRows.some(
        (item) => scoreToNumber(item.matrix.powerInfluence) >= 4 && scoreToNumber(item.matrix.currentCloseness) <= 2
    )
    const gapsMissing = stakeholderSection.relationalGaps.every(
        (gap) =>
            gap.relationalGap.trim().length === 0 && gap.criticalReason.trim().length === 0 && gap.minimumAction.trim().length === 0
    )
    const hasVagueStrategicReadings = actorRows.some((item) => {
        const reading = buildStrategicReading(item.matrix.powerInfluence, item.matrix.currentCloseness, item.matrix.mutualValue)
        return reading === 'Relación en evolución: ajustar estrategia según contexto'
    })

    const ring1Actors = actorRows.filter((item) => item.actor && item.row.level === '1')
    const ring2Actors = actorRows.filter((item) => item.actor && item.row.level === '2')
    const ring3Actors = actorRows.filter((item) => item.actor && item.row.level === '3')
    const ring1Positions = ring1Actors.map((_, index) => getConcentricPosition(index, ring1Actors.length, 18, -90))
    const ring2Positions = ring2Actors.map((_, index) => getConcentricPosition(index, ring2Actors.length, 30, -30))
    const ring3Positions = ring3Actors.map((_, index) => getConcentricPosition(index, ring3Actors.length, 42, 20))

    const sponsorSection = state.sponsorIdentificationSection
    const sponsorRows = sponsorSection.possibleSponsors.map((name, index) => ({
        index,
        name: name.trim(),
        row: sponsorSection.sponsorMatrixRows[index]
    }))
    const sponsorsDefined = sponsorRows.filter((item) => item.name.length > 0)
    const sponsorsInventoryCompleted = sponsorsDefined.length >= 1
    const sponsorMatrixCompleted =
        sponsorsDefined.length > 0 &&
        sponsorsDefined.every(
            (item) =>
                item.row.influenceAccess !== '' &&
                item.row.currentCloseness !== '' &&
                item.row.valueExposure !== '' &&
                item.row.probableDisposition !== ''
        )
    const sponsorshipIndexCompleted = sponsorSection.sponsorshipIndexRows.every(
        (row) => row.level !== '' && row.evidence.trim().length > 0
    )
    const valueBeforeAskingCompleted = sponsorSection.valueBeforeAskingRows.every(
        (row) =>
            row.prioritySponsor.trim().length > 0 &&
            row.currentPriority.trim().length > 0 &&
            row.firstValue.trim().length > 0 &&
            row.avoidAction.trim().length > 0
    )
    const activationRoute = sponsorSection.activationRoute
    const sponsorActivationCompleted =
        activationRoute.prioritySponsor.trim().length > 0 &&
        activationRoute.accessPath.trim().length > 0 &&
        activationRoute.realisticMove.trim().length > 0 &&
        activationRoute.progressSignal.trim().length > 0 &&
        activationRoute.mainRisk.trim().length > 0 &&
        activationRoute.nextStep15Days.trim().length > 0
    const sponsorTestCompleted = sponsorSection.sponsorReadTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const hasPrioritySponsor =
        activationRoute.prioritySponsor.trim().length > 0 ||
        sponsorSection.valueBeforeAskingRows.some((row) => row.prioritySponsor.trim().length > 0)
    const section4Completed =
        sponsorsInventoryCompleted &&
        sponsorMatrixCompleted &&
        sponsorshipIndexCompleted &&
        valueBeforeAskingCompleted &&
        sponsorActivationCompleted &&
        sponsorTestCompleted &&
        hasPrioritySponsor

    const allSponsorsDistant = sponsorsDefined.length > 0 && sponsorsDefined.every((item) => scoreToNumber(item.row.currentCloseness) <= 2)
    const noValueBeforeAsking = sponsorSection.valueBeforeAskingRows.every((row) => row.firstValue.trim().length === 0)
    const allHighInfluenceLowExposure =
        sponsorsDefined.length > 0 &&
        sponsorsDefined.every((item) => scoreToNumber(item.row.influenceAccess) >= 4 && scoreToNumber(item.row.valueExposure) <= 2)
    const activationRouteVague = !sponsorActivationCompleted

    const highValueSection = state.highValueNetworkSection
    const highValueRows = highValueSection.relationsInventory.map((name, index) => ({
        index,
        name: name.trim(),
        matrix: highValueSection.valueTrustAccessRows[index],
        segment: highValueSection.segmentationRows[index],
        action: highValueSection.actionMapRows[index]
    }))
    const highValueDefinedRows = highValueRows.filter((item) => item.name.length > 0)
    const highValueInventoryCompleted = highValueDefinedRows.length >= 8
    const highValueMatrixCompleted =
        highValueDefinedRows.length > 0 &&
        highValueDefinedRows.every(
            (item) =>
                item.matrix.strategicValue !== '' &&
                item.matrix.currentTrust !== '' &&
                item.matrix.accessAmplification !== '' &&
                item.matrix.dominantValueType.trim().length > 0 &&
                item.matrix.currentState.trim().length > 0
        )
    const highValueSegmentationCompleted =
        highValueDefinedRows.length > 0 &&
        highValueDefinedRows.every(
            (item) =>
                item.segment.mainSegment.trim().length > 0 &&
                item.segment.reason.trim().length > 0 &&
                item.segment.suggestedMove.trim().length > 0
        )
    const highValueReciprocityCompleted = highValueSection.reciprocityRows.every(
        (row) =>
            row.relationship.trim().length > 0 &&
            row.valueReceived.trim().length > 0 &&
            row.valueProvided.trim().length > 0 &&
            row.currentBalance.trim().length > 0 &&
            row.nextGesture.trim().length > 0
    )
    const highValueActionMapCompleted =
        highValueDefinedRows.length > 0 &&
        highValueDefinedRows.every(
            (item) =>
                item.action.actionState.trim().length > 0 &&
                item.action.justification.trim().length > 0 &&
                item.action.action30Days.trim().length > 0
        )
    const highValueTestCompleted = highValueSection.qualityTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const hasMaintenanceOrReactivationAction = highValueRows.some(
        (item) => item.name.length > 0 && (item.action.actionState === 'Mantener' || item.action.actionState === 'Reactivar')
    )
    const section5Completed =
        highValueInventoryCompleted &&
        highValueMatrixCompleted &&
        highValueSegmentationCompleted &&
        highValueReciprocityCompleted &&
        highValueActionMapCompleted &&
        highValueTestCompleted &&
        hasMaintenanceOrReactivationAction

    const level1ActorsSet = new Set(ring1Actors.map((item) => item.actor.toLowerCase()))
    const onlyCloseRelationships =
        highValueDefinedRows.length > 0 && highValueDefinedRows.every((item) => level1ActorsSet.has(item.name.toLowerCase()))
    const noDormantRelationship =
        highValueDefinedRows.length > 0 &&
        highValueDefinedRows.every((item) => item.matrix.currentState.trim().length > 0 && item.matrix.currentState !== 'Dormida')
    const reciprocityUnclear = highValueSection.reciprocityRows.some(
        (row) =>
            (row.relationship.trim().length > 0 || row.valueReceived.trim().length > 0 || row.valueProvided.trim().length > 0) &&
            (row.valueProvided.trim().length === 0 || row.currentBalance.trim().length === 0)
    )
    const noAction30Days = highValueDefinedRows.every((item) => item.action.action30Days.trim().length === 0)

    const highValueSpiderRows = highValueDefinedRows.slice(0, HIGH_VALUE_RELATIONS_ROWS)
    const highValueSpiderNodes = highValueSpiderRows.map((item, index) => {
        const trust = scoreToNumber(item.matrix.currentTrust)
        const radius = trust >= 5 ? 18 : trust === 4 ? 24 : trust === 3 ? 31 : trust === 2 ? 38 : trust === 1 ? 45 : 42
        const position = getConcentricPosition(index, highValueSpiderRows.length, radius, -90)
        return {
            ...item,
            position
        }
    })

    const segmentColorMap: Record<string, { node: string; border: string; text: string; line: string }> = {
        Núcleo: { node: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-700', line: '#2563eb' },
        Puente: { node: 'bg-emerald-600', border: 'border-emerald-600', text: 'text-emerald-700', line: '#059669' },
        Multiplicadora: { node: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-700', line: '#f59e0b' },
        Aprendizaje: { node: 'bg-cyan-600', border: 'border-cyan-600', text: 'text-cyan-700', line: '#0891b2' },
        'A reactivar': { node: 'bg-rose-600', border: 'border-rose-600', text: 'text-rose-700', line: '#e11d48' },
        'A profundizar': { node: 'bg-indigo-600', border: 'border-indigo-600', text: 'text-indigo-700', line: '#4f46e5' }
    }

    const highValueSegmentNodes = highValueSpiderRows.map((item, index) => {
        const position = getConcentricPosition(index, highValueSpiderRows.length, 40, -90)
        const colors = segmentColorMap[item.segment.mainSegment] ?? {
            node: 'bg-slate-500',
            border: 'border-slate-500',
            text: 'text-slate-700',
            line: '#64748b'
        }
        return {
            ...item,
            position,
            colors
        }
    })

    const consciousNetworkingSection = state.consciousNetworkingSection
    const intentionDeclaration = consciousNetworkingSection.intentionDeclaration
    const networkingIntentionCompleted =
        intentionDeclaration.strategicObjective.trim().length > 0 &&
        intentionDeclaration.neededRelationshipType.trim().length > 0 &&
        intentionDeclaration.strongWeakRelationshipType.trim().length > 0 &&
        intentionDeclaration.relationalErrorToAvoid.trim().length > 0 &&
        intentionDeclaration.guidingPrinciple.trim().length > 0
    const networkingObjectiveMatrixCompleted = consciousNetworkingSection.objectiveMatrixRows.every(
        (row) =>
            row.relationalObjective.trim().length > 0 &&
            row.audienceActor.trim().length > 0 &&
            row.firstValueContribution.trim().length > 0 &&
            row.realisticInitialMove.trim().length > 0 &&
            row.expectedProgressSignal.trim().length > 0
    )
    const networkingMovementCompleted = consciousNetworkingSection.movementSegmentationRows.every(
        (row) =>
            row.relationActor.trim().length > 0 &&
            row.movementType.trim().length > 0 &&
            row.concreteAction.trim().length > 0 &&
            row.valueAtStake.trim().length > 0
    )
    const networkingCadenceCompleted = consciousNetworkingSection.cadenceRows.every(
        (row) =>
            row.relation.trim().length > 0 &&
            row.suggestedCadence.trim().length > 0 &&
            row.contactFormat.trim().length > 0 &&
            row.contactObjective.trim().length > 0
    )
    const networkingScorecardCompleted = consciousNetworkingSection.scorecardRows.every(
        (row) => row.level !== '' && row.evidence.trim().length > 0
    )
    const plan30Days = consciousNetworkingSection.plan30Days
    const networkingPlanCompleted =
        plan30Days.nourishRelationships.trim().length > 0 &&
        plan30Days.reactivateRelationships.trim().length > 0 &&
        plan30Days.exploreRelationships.trim().length > 0 &&
        plan30Days.visibleReciprocityAction.trim().length > 0 &&
        plan30Days.maintenanceHabit.trim().length > 0 &&
        plan30Days.progressCriteria.trim().length > 0
    const section6Completed =
        networkingIntentionCompleted &&
        networkingObjectiveMatrixCompleted &&
        networkingMovementCompleted &&
        networkingCadenceCompleted &&
        networkingScorecardCompleted &&
        networkingPlanCompleted

    const noFirstValueBeforeAsking = consciousNetworkingSection.objectiveMatrixRows.some(
        (row) =>
            (row.relationalObjective.trim().length > 0 ||
                row.audienceActor.trim().length > 0 ||
                row.realisticInitialMove.trim().length > 0 ||
                row.expectedProgressSignal.trim().length > 0) &&
            row.firstValueContribution.trim().length === 0
    )
    const movementTypesUsed = new Set(
        consciousNetworkingSection.movementSegmentationRows
            .map((row) => row.movementType.trim())
            .filter((row) => row.length > 0)
    )
    const movementsOnlyActivation = movementTypesUsed.size > 0 && [...movementTypesUsed].every((type) => type === 'Activar')
    const cadenceMissing = consciousNetworkingSection.cadenceRows.every((row) => row.suggestedCadence.trim().length === 0)
    const planMissingReciprocity = plan30Days.visibleReciprocityAction.trim().length === 0

    const visibilitySection = state.strategicVisibilitySection
    const visibilityAudit = visibilitySection.visibilityAudit
    const visibilitySignal = visibilitySection.signalArchitecture
    const visibilityAuditCompleted =
        visibilityAudit.currentVisibleSpaces.trim().length > 0 &&
        visibilityAudit.currentVisibleAudiences.trim().length > 0 &&
        visibilityAudit.currentPerceivedValue.trim().length > 0 &&
        visibilityAudit.invisibleContributions.trim().length > 0 &&
        visibilityAudit.unoccupiedKeySpaces.trim().length > 0 &&
        visibilityAudit.probablePerception.trim().length > 0
    const visibilityMatrixCompleted = visibilitySection.visibilityMatrixRows.every(
        (row) =>
            row.keyAudience.trim().length > 0 &&
            row.valueToMakeVisible.trim().length > 0 &&
            row.concreteEvidence.trim().length > 0 &&
            row.visibilitySurface.trim().length > 0 &&
            row.errorToAvoid.trim().length > 0
    )
    const visibilitySignalCompleted =
        visibilitySignal.mainSignal.trim().length > 0 &&
        visibilitySignal.visibleAttributes.trim().length > 0 &&
        visibilitySignal.visibleProofs.trim().length > 0 &&
        visibilitySignal.strongerContexts.trim().length > 0 &&
        visibilitySignal.weakeningIncoherences.trim().length > 0
    const visibilityPortfolioCompleted = visibilitySection.visibilityPortfolioRows.every(
        (row) =>
            row.visibilitySurface.trim().length > 0 &&
            row.whatToShow.trim().length > 0 &&
            row.format.trim().length > 0 &&
            row.minimumFrequency.trim().length > 0
    )
    const visibilityTimelineCompleted = visibilitySection.visibilityTimelineRows.every(
        (row) =>
            row.targetVisibleOutcome.trim().length > 0 && row.space.trim().length > 0 && row.progressIndicator.trim().length > 0
    )
    const visibilityTestCompleted = visibilitySection.visibilityTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )
    const hasVisibilityAudiences = visibilitySection.visibilityMatrixRows.some((row) => row.keyAudience.trim().length > 0)
    const section7Completed =
        visibilityAuditCompleted &&
        visibilityMatrixCompleted &&
        visibilitySignalCompleted &&
        visibilityPortfolioCompleted &&
        visibilityTimelineCompleted &&
        visibilityTestCompleted

    const weakSignalVisibility =
        visibilitySignal.mainSignal.trim().toLowerCase() === 'quiero ser más visible' ||
        (visibilitySignal.mainSignal.trim().length > 0 &&
            visibilitySignal.mainSignal.trim().toLowerCase().includes('ser más visible') &&
            !visibilitySignal.mainSignal.trim().includes(','))
    const noVisibilityEvidence =
        visibilitySection.visibilityMatrixRows.every((row) => row.concreteEvidence.trim().length === 0) &&
        visibilitySignal.visibleProofs.trim().length === 0

    const internalSurfaces = new Set([
        'reuniones uno a uno',
        'reuniones de equipo',
        'reuniones de alto nivel',
        'reportes ejecutivos',
        'presentaciones',
        'correos de síntesis',
        'espacios transversales',
        'networking interno',
        'visibilidad por terceros',
        'reporte ejecutivo'
    ])
    const externalSurfaces = new Set(['networking externo', 'presencia digital / linkedin', 'linkedin / red externa'])

    const selectedSurfaces = [
        ...visibilitySection.visibilityMatrixRows.map((row) => row.visibilitySurface.trim().toLowerCase()),
        ...visibilitySection.visibilityPortfolioRows.map((row) => row.visibilitySurface.trim().toLowerCase())
    ].filter((surface) => surface.length > 0)

    const hasInternalSurface = selectedSurfaces.some((surface) => internalSurfaces.has(surface))
    const hasExternalSurface = selectedSurfaces.some((surface) => externalSurfaces.has(surface))
    const visibilitySurfaceOverconcentrated = selectedSurfaces.length > 0 && (hasInternalSurface ? !hasExternalSurface : hasExternalSurface)

    const noTimelineIndicators = visibilitySection.visibilityTimelineRows.some((row) => row.progressIndicator.trim().length === 0)
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
    const section8Completed = evaluationSectionComplete

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: section3Completed,
        4: section4Completed,
        5: section5Completed,
        6: section6Completed,
        7: section7Completed,
        8: section8Completed
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb7-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="min-w-0 flex-1 sm:mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB7 - Mapeo del ecosistema estratégico</p>
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
                        Guardar página {currentPageIndex >= 0 ? currentPageIndex + 1 : activePage}
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
                    <aside className={`wb7-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-1.5">
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
                                className="wb7-print-page wb7-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 8"
                                data-print-title="Portada"
                                data-cover-page="true"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb7-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Mapeo del ecosistema estratégico
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 7</p>
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

                                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => savePage(1)}
                                            disabled={isLocked}
                                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                savePage(1)
                                                jumpToPage(2)
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
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 8"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Presentación del workbook</h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <p className="mt-4 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                                        Mapear tu ecosistema estratégico para identificar actores clave, relaciones de alto valor, sponsors potenciales y
                                        oportunidades de visibilidad, de modo que tu red deje de ser circunstancial y se convierta en un sistema consciente de
                                        generación de valor mutuo.
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Al finalizar este workbook tendrás</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Un mapa de stakeholders organizado por niveles.',
                                            'Una primera identificación de sponsors estratégicos.',
                                            'Una lectura más clara de tu red de alto valor.',
                                            'Una estrategia de networking consciente basada en valor mutuo.',
                                            'Un plan de visibilidad estratégica conectado con tu contexto real.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-3">
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
                                            {['Networking estratégico.', 'Inteligencia política y contextual.'].map((item) => (
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
                                                'Conectividad interna y externa.',
                                                'Gestión de relaciones (relationship management).',
                                                'Visibilidad estratégica.',
                                                'Lectura de poder y patrocinio.'
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
                                    <p className="mt-3 text-sm text-slate-700">Usa estas conductas como referencia para escribir evidencia real (no intención):</p>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Conecta activamente a su equipo con otras áreas para derribar silos y fomentar la colaboración interdepartamental.',
                                            'Participa en eventos de la industria y mantiene vínculos con stakeholders externos (clientes, proveedores) para detectar tendencias.',
                                            'Actúa como un "tejedor" de relaciones, facilitando el acceso a recursos y conocimientos críticos para el equipo a través de su red de contactos.',
                                            'Utiliza su capital social para apoyar a su equipo y abrir puertas a nuevas oportunidades de negocio o desarrollo.',
                                            'Se posiciona no solo como experto técnico, sino como un referente que aporta valor en comités y espacios de decisión.',
                                            'Construye relaciones basadas en la reciprocidad y el valor mutuo, no solo en la necesidad inmediata (transaccional).',
                                            'Identifica y cultiva activamente sponsors que hablen de él/ella en mesas de decisión.',
                                            'Mapea las dinámicas de poder informales en la organización para destrabar proyectos.'
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
                                            'No confundas cercanía con valor estratégico.',
                                            'Antes de pedir acceso, influencia o apoyo, identifica qué valor puedes aportar.',
                                            'Tu red no se mide por cantidad de contactos, sino por calidad, confianza y reciprocidad.',
                                            'Si no mapeas poder, influencia y vacíos relacionales, tu networking seguirá siendo circunstancial.',
                                            'La visibilidad estratégica no es autopromoción; es hacer visible tu aporte en los espacios correctos.',
                                            'Si no tienes evidencia, escribe: “No tengo evidencia reciente.”'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:p-6">
                                    <p className="text-sm text-emerald-800 leading-relaxed">
                                        Esta sección es informativa. En el primer ingreso todos los usuarios la verán completa; desde el segundo ingreso retomarán
                                        automáticamente la última página guardada.
                                    </p>
                                </section>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => savePage(2)}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Guardar página 2
                                    </button>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 8"
                                data-print-title="Mapeo de stakeholders (niveles 1, 2 y 3)"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Mapeo de stakeholders (niveles 1, 2 y 3)
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Identifica y clasifica actores clave de tu ecosistema relacional para distinguir vínculos operativos, de influencia y de
                                        escalamiento con una lógica de red estratégica.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStakeholderHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Stakeholder: actor que influye o puede incidir en resultados, visibilidad, legitimidad o acceso a oportunidades.',
                                            'Niveles 1, 2 y 3: cercanía e impacto estratégico (no valor humano).',
                                            'Mapa relacional: lectura estructurada de influencia, cercanía, valor mutuo y riesgos de desconexión.',
                                            'Vacío relacional: ausencia de vínculo con un actor que debería estar conectado por estrategia.',
                                            'Red estratégica: relaciones diseñadas con criterio, valor mutuo y conexión deliberada con objetivos.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario inicial de actores</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                inventoryCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {inventoryCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Trabaja con tu contexto real de los últimos 30 a 60 días.',
                                                'No te limites a personas cercanas; incluye actores que influyen en resultados, visibilidad, legitimidad o acceso.',
                                                'Asegura mezcla interna y externa: jerárquicos, pares, aliados transversales, clientes, partners y referentes.'
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
                                                'Actor 1: Jefe directo',
                                                'Actor 2: Directora de unidad',
                                                'Actor 3: Par de operaciones',
                                                'Actor 4: Líder comercial',
                                                'Actor 5: Sponsor informal de otra gerencia',
                                                'Actor 6: Cliente interno clave',
                                                'Actor 7: Proveedor estratégico',
                                                'Actor 8: Referente externo del sector',
                                                'Actor 9: Exjefe con alta credibilidad',
                                                'Actor 10: Mentor con llegada a comité'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {state.stakeholderMappingSection.actorInventory.map((actor, index) => (
                                            <label key={`wb7-inventory-${index}`} className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Actor {index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={actor}
                                                    onChange={(event) => updateActorInventory(index, event.target.value)}
                                                    disabled={isLocked}
                                                    placeholder="Ej: Directora de unidad"
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStakeholderBlock('Paso 1 — Inventario inicial')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Clasificación por niveles 1, 2 y 3</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                classificationCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {classificationCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Nivel 1: relación directa, frecuente e impacto inmediato.',
                                                'Nivel 2: conexión al sistema cercano con influencia relevante, sin interacción diaria.',
                                                'Nivel 3: actor periférico con valor estratégico futuro o capacidad de abrir oportunidades.',
                                                'Completa además tipo de vínculo, frecuencia e impacto para evitar clasificaciones vagas.'
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
                                                'Jefe directo → Nivel 1 · Jerárquico/coordinación · Frecuencia alta · Impacto alto.',
                                                'Par de operaciones → Nivel 1 · Colaboración transversal · Frecuencia alta · Impacto medio-alto.',
                                                'Directora de unidad → Nivel 2 · Visibilidad/decisión · Frecuencia media · Impacto alto.',
                                                'Sponsor informal → Nivel 2 · Reputación/acceso · Frecuencia baja-media · Impacto alto.',
                                                'Referente externo → Nivel 3 · Posicionamiento/networking · Frecuencia baja · Impacto medio-alto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo de vínculo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Frecuencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {actorRows.map((item) => {
                                                    const disabledRow = isLocked || item.actor.length === 0
                                                    return (
                                                        <tr key={`wb7-classification-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.actor || `Actor ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.level}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'level', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    <option value="1">Nivel 1</option>
                                                                    <option value="2">Nivel 2</option>
                                                                    <option value="3">Nivel 3</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.bondType}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'bondType', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {BOND_TYPE_OPTIONS.map((option) => (
                                                                        <option key={`wb7-bond-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.contactFrequency}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'contactFrequency', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {CONTACT_FREQUENCY_OPTIONS.map((option) => (
                                                                        <option key={`wb7-frequency-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.row.ecosystemImpact}
                                                                    onChange={(event) => updateClassificationRow(item.index, 'ecosystemImpact', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {ECOSYSTEM_IMPACT_OPTIONS.map((option) => (
                                                                        <option key={`wb7-impact-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
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
                                            onClick={() => saveStakeholderBlock('Paso 2 — Clasificación por niveles')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Matriz poder, cercanía y valor mutuo</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                valueMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {valueMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Evalúa cada actor con escala 1–5 y usa la lectura automática para identificar relaciones críticas, frágiles o con potencial
                                        estratégico subdesarrollado.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Poder/influencia: cuánto puede mover decisiones, recursos, reputación o acceso.',
                                                'Cercanía actual: calidad y frecuencia real de la relación hoy.',
                                                'Valor mutuo: nivel de intercambio útil y recíproco, más allá de contacto superficial.',
                                                'Usa la lectura automática como base y ajusta tu estrategia de relación a partir de ese resultado.'
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
                                                'Directora de unidad: poder 5, cercanía 2, valor mutuo 2 → Alta influencia, baja cercanía: relación a desarrollar.',
                                                'Jefe directo: poder 4, cercanía 4, valor mutuo 4 → Relación crítica y relativamente sólida.',
                                                'Sponsor informal: poder 4, cercanía 2, valor mutuo 3 → Relación estratégica subdesarrollada.',
                                                'Referente externo: poder 3, cercanía 1, valor mutuo 2 → Existe acceso, falta fortalecer valor mutuo.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Poder / influencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cercanía actual</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor mutuo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lectura estratégica (automática)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {actorRows.map((item) => {
                                                    const disabledRow = isLocked || item.actor.length === 0
                                                    const strategicReading = buildStrategicReading(
                                                        item.matrix.powerInfluence,
                                                        item.matrix.currentCloseness,
                                                        item.matrix.mutualValue
                                                    )
                                                    return (
                                                        <tr key={`wb7-matrix-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.actor || `Actor ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.powerInfluence}
                                                                    onChange={(event) => updateValueMatrixRow(item.index, 'powerInfluence', readScore(event.target.value))}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-power-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.currentCloseness}
                                                                    onChange={(event) => updateValueMatrixRow(item.index, 'currentCloseness', readScore(event.target.value))}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-closeness-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.mutualValue}
                                                                    onChange={(event) => updateValueMatrixRow(item.index, 'mutualValue', readScore(event.target.value))}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-value-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
                                                                {strategicReading || 'Completa la escala para generar lectura.'}
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
                                            onClick={() => saveStakeholderBlock('Paso 3 — Matriz poder, cercanía y valor mutuo')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Detección de vacíos relacionales</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                relationalGapsCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {relationalGapsCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Identifica al menos un vacío relacional crítico y define una acción mínima para activarlo en el corto plazo.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Detecta qué actor debería estar en tu mapa y hoy no está suficientemente conectado.',
                                                'Evalúa dónde dependes de una sola persona para acceso o visibilidad.',
                                                'Especifica por qué el vacío es crítico y cuál es la acción mínima para activarlo en 15–30 días.'
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
                                                'Vacío 1: no tengo vínculo directo con la directora que valida iniciativas estratégicas.',
                                                'Por qué es crítico: dependo de visibilidad indirecta y eso limita posicionamiento.',
                                                'Acción mínima: activar conversación puente con apoyo del jefe directo.',
                                                'Vacío 2: red externa del sector débil.',
                                                'Por qué es crítico: reduce aprendizaje comparativo y visibilidad estratégica.',
                                                'Acción mínima: reactivar dos contactos externos y asistir a un evento clave este mes.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {state.stakeholderMappingSection.relationalGaps.map((gap, index) => (
                                            <article key={`wb7-gap-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Vacío relacional {index + 1}</p>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Vacío relacional</span>
                                                    <input
                                                        type="text"
                                                        value={gap.relationalGap}
                                                        onChange={(event) => updateRelationalGap(index, 'relationalGap', event.target.value)}
                                                        disabled={isLocked}
                                                        placeholder="Ej: Sin vínculo directo con directora estratégica"
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Por qué es crítico</span>
                                                    <textarea
                                                        value={gap.criticalReason}
                                                        onChange={(event) => updateRelationalGap(index, 'criticalReason', event.target.value)}
                                                        disabled={isLocked}
                                                        rows={3}
                                                        placeholder="Describe riesgo o costo"
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Acción mínima para activarlo</span>
                                                    <textarea
                                                        value={gap.minimumAction}
                                                        onChange={(event) => updateRelationalGap(index, 'minimumAction', event.target.value)}
                                                        disabled={isLocked}
                                                        rows={3}
                                                        placeholder="Define siguiente paso concreto"
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                                    />
                                                </label>
                                            </article>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStakeholderBlock('Paso 4 — Detección de vacíos relacionales')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Mapa visual del ecosistema</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                ecosystemMapCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {ecosystemMapCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Organiza los actores por anillos concéntricos y asigna símbolos para marcar sponsors potenciales, relaciones de alto valor,
                                        relaciones críticas/frágiles y vínculos a activar.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Centro: escribe tu rol actual para anclar el mapa en tu contexto real.',
                                                'Anillo 1: stakeholders nivel 1; anillo 2: nivel 2; anillo 3: nivel 3.',
                                                'Asigna símbolos por actor según lectura: ★ sponsor potencial, ▲ alto valor, ! relación crítica/frágil, ○ vínculo a activar.'
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
                                                'Centro: Yo / líder de área.',
                                                'Anillo 1: jefe directo, equipo, par de operaciones.',
                                                'Anillo 2: directora de unidad ★ !, sponsor informal ▲, líder comercial.',
                                                'Anillo 3: referente externo ○, exjefe ▲, mentor ★.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <label className="space-y-1 block">
                                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Centro: Yo / mi rol actual</span>
                                        <input
                                            type="text"
                                            value={state.stakeholderMappingSection.ecosystemMap.centerRole}
                                            onChange={(event) => updateEcosystemCenterRole(event.target.value)}
                                            disabled={isLocked}
                                            placeholder="Ej: Líder de área de operaciones"
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-5">
                                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4 items-start">
                                            <div className="relative mx-auto w-full max-w-[780px] h-[360px] sm:h-[460px] md:h-[560px] rounded-2xl border border-blue-200 bg-gradient-to-b from-[#f8fbff] to-[#edf4ff] overflow-hidden">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="relative w-[94%] h-[94%]">
                                                        <div className="absolute left-1/2 top-1/2 w-[92%] h-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200 bg-blue-50/20" />
                                                        <div className="absolute left-1/2 top-1/2 w-[68%] h-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300 bg-blue-50/25" />
                                                        <div className="absolute left-1/2 top-1/2 w-[44%] h-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400 bg-blue-50/35" />

                                                        {ring3Actors.map((item, index) => {
                                                            const pos = ring3Positions[index]
                                                            return (
                                                                <button
                                                                    key={`wb7-concentric-ring3-${item.index}`}
                                                                    type="button"
                                                                    onClick={() => cycleActorSymbol(item.index)}
                                                                    disabled={isLocked}
                                                                    title={`Anillo 3 · ${item.actor}`}
                                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-blue-300 bg-white px-2 py-1 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[112px] md:max-w-[170px] shadow-sm"
                                                                >
                                                                    {item.symbol ? <span className="shrink-0">{item.symbol}</span> : null}
                                                                    <span className="truncate">{item.actor}</span>
                                                                </button>
                                                            )
                                                        })}

                                                        {ring2Actors.map((item, index) => {
                                                            const pos = ring2Positions[index]
                                                            return (
                                                                <button
                                                                    key={`wb7-concentric-ring2-${item.index}`}
                                                                    type="button"
                                                                    onClick={() => cycleActorSymbol(item.index)}
                                                                    disabled={isLocked}
                                                                    title={`Anillo 2 · ${item.actor}`}
                                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-blue-400 bg-white px-2 py-1 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[112px] md:max-w-[170px] shadow-sm"
                                                                >
                                                                    {item.symbol ? <span className="shrink-0">{item.symbol}</span> : null}
                                                                    <span className="truncate">{item.actor}</span>
                                                                </button>
                                                            )
                                                        })}

                                                        {ring1Actors.map((item, index) => {
                                                            const pos = ring1Positions[index]
                                                            return (
                                                                <button
                                                                    key={`wb7-concentric-ring1-${item.index}`}
                                                                    type="button"
                                                                    onClick={() => cycleActorSymbol(item.index)}
                                                                    disabled={isLocked}
                                                                    title={`Anillo 1 · ${item.actor}`}
                                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                                    className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-blue-500 bg-white px-2 py-1 text-[11px] md:text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[112px] md:max-w-[170px] shadow-sm"
                                                                >
                                                                    {item.symbol ? <span className="shrink-0">{item.symbol}</span> : null}
                                                                    <span className="truncate">{item.actor}</span>
                                                                </button>
                                                            )
                                                        })}

                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] max-w-[250px] min-w-[150px] rounded-2xl border border-blue-500 bg-white px-3 py-2.5 text-center shadow-sm">
                                                            <p className="text-[10px] uppercase tracking-[0.14em] text-blue-700 font-semibold">Centro</p>
                                                            <p className="mt-1 text-sm md:text-base font-bold text-slate-900 leading-tight">
                                                                {state.stakeholderMappingSection.ecosystemMap.centerRole.trim() || 'Completa tu rol'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {ring1Actors.length === 0 && ring2Actors.length === 0 && ring3Actors.length === 0 && (
                                                    <div className="absolute inset-x-6 bottom-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                                                        <p className="text-xs text-amber-800">
                                                            Aún no hay stakeholders clasificados por niveles. Completa el Paso 2 para visualizar el mapa concéntrico.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <aside className="space-y-2.5">
                                                {[
                                                    { title: 'Anillo 1', subtitle: 'Stakeholders nivel 1', color: 'border-blue-500 text-blue-800', count: ring1Actors.length },
                                                    { title: 'Anillo 2', subtitle: 'Stakeholders nivel 2', color: 'border-blue-400 text-blue-700', count: ring2Actors.length },
                                                    { title: 'Anillo 3', subtitle: 'Stakeholders nivel 3', color: 'border-blue-300 text-blue-600', count: ring3Actors.length }
                                                ].map((ring) => (
                                                    <div key={`wb7-ring-guide-${ring.title}`} className={`rounded-xl border bg-white px-3 py-2 ${ring.color}`}>
                                                        <p className="text-xs uppercase tracking-[0.12em] font-semibold">{ring.title}</p>
                                                        <p className="text-xs mt-0.5">{ring.subtitle}</p>
                                                        <p className="text-xs mt-1 text-slate-500">{ring.count} actor{ring.count === 1 ? '' : 'es'}</p>
                                                    </div>
                                                ))}
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Haz clic sobre cualquier actor del mapa para alternar símbolo y marcar prioridad relacional.
                                                </p>
                                            </aside>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { label: 'Anillo 1', rows: ring1Actors },
                                                { label: 'Anillo 2', rows: ring2Actors },
                                                { label: 'Anillo 3', rows: ring3Actors }
                                            ].map((ring) => (
                                                <article key={`wb7-ring-summary-${ring.label}`} className="rounded-xl border border-blue-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">{ring.label}</p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {ring.rows.length > 0 ? ring.rows.map((item) => item.actor).join(', ') : 'Sin stakeholders en este anillo.'}
                                                    </p>
                                                </article>
                                            ))}
                                        </div>

                                        <div className="rounded-xl border border-blue-200 bg-white p-4">
                                            <p className="text-xs uppercase tracking-[0.12em] text-blue-600 font-semibold">Leyenda de símbolos</p>
                                            <p className="mt-2 text-sm text-slate-700">★ sponsor potencial · ▲ relación de alto valor · ! relación crítica/frágil · ○ vínculo a activar</p>
                                            <p className="mt-1 text-xs text-slate-500">Haz clic sobre cada actor para alternar símbolo.</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStakeholderBlock('Paso 5 — Mapa visual del ecosistema')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de lectura estratégica del ecosistema</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                strategicTestCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {strategicTestCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Verifica si tu red está diseñada con criterio estratégico y si el mapa ya orienta decisiones concretas de relacionamiento.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Marca Sí o No con honestidad para cada pregunta del test.',
                                                'Cuando marques No, registra un ajuste concreto para la próxima iteración.',
                                                'Usa este bloque para transformar el mapa en decisiones accionables de networking.'
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
                                                'Señal débil: mapa centrado solo en quienes ya te rodean cotidianamente.',
                                                'Señal mejorada: mapa que distingue influencia, cercanía, valor mutuo y vacíos críticos.'
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
                                                {state.stakeholderMappingSection.strategicReadTest.map((row, index) => (
                                                    <tr key={`wb7-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateStrategicReadTestRow(index, 'verdict', event.target.value)}
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
                                                                onChange={(event) => updateStrategicReadTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="¿Qué necesitas ajustar?"
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
                                            onClick={() => saveStakeholderBlock('Paso 6 — Test de lectura estratégica')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {allActorsLevel1 && (
                                        <p className="text-sm text-amber-800">Sugerencia: diferencia mejor cercanía actual e impacto estratégico.</p>
                                    )}
                                    {!hasHighInfluenceLowCloseness && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: revisa si hay relaciones estratégicas subdesarrolladas (alta influencia y baja cercanía).
                                        </p>
                                    )}
                                    {gapsMissing && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: todo ecosistema tiene relaciones por activar; revisa dónde dependes demasiado de pocos actores.
                                        </p>
                                    )}
                                    {hasVagueStrategicReadings && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: aclara si la relación es crítica, frágil, de alto valor o de potencial futuro.
                                        </p>
                                    )}
                                    {!allActorsLevel1 && hasHighInfluenceLowCloseness && !gapsMissing && !hasVagueStrategicReadings && (
                                        <p className="text-sm text-emerald-700">Sin alertas: tu estructura actual muestra una lectura estratégica más sólida.</p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section3Completed
                                                    ? 'Completado: inventario, clasificación, matriz, vacíos, mapa y test diligenciados.'
                                                    : 'Pendiente: completa clasificación de actores y al menos un vacío relacional, junto con los demás bloques.'}
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
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 8"
                                data-print-title="Identificación de sponsors"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Identificación de sponsors</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Identifica sponsors estratégicos reales y potenciales para activar visibilidad, acceso y legitimidad desde una aproximación
                                        basada en valor.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSponsorHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Sponsor estratégico: abre puertas, visibiliza y pone reputación en juego por tu valor.',
                                            'Mentor orienta; sponsor moviliza oportunidades activamente.',
                                            'Patrocinio activo: recomendar, incluir, visibilizar, defender o nominar.',
                                            'Antes de pedir respaldo: valor visible, relación suficiente y lectura política.',
                                            'Distingue sponsor natural, potencial, lejano e improbable.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario de sponsors posibles</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorsInventoryCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorsInventoryCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Lista actores con influencia real y acceso a decisiones.',
                                                'Incluye internos, externos y aliados de industria relevantes.',
                                                'Prioriza quienes ya amplifican talento o resultados.'
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
                                                'Sponsor posible 1: Directora de unidad',
                                                'Sponsor posible 2: Exjefe con alta reputación',
                                                'Sponsor posible 3: Sponsor informal de otra gerencia',
                                                'Sponsor posible 4: Mentor con llegada a comité',
                                                'Sponsor posible 5: Referente externo del sector',
                                                'Sponsor posible 6: Líder comercial con alta exposición ejecutiva'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {sponsorSection.possibleSponsors.map((sponsor, index) => (
                                            <label key={`wb7-sponsor-possible-${index}`} className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Sponsor posible {index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={sponsor}
                                                    onChange={(event) => updatePossibleSponsor(index, event.target.value)}
                                                    disabled={isLocked}
                                                    placeholder="Ej: Directora de unidad"
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveSponsorBlock('Paso 1 — Inventario de sponsors')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz sponsor: influencia, cercanía y disposición</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Califica cada sponsor posible de 1 a 5 y usa el tipo automático para distinguir natural, potencial, lejano o improbable.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Influencia/acceso: capacidad de abrir puertas o mover decisiones.',
                                                'Cercanía actual: nivel real de relación y confianza.',
                                                'Exposición a tu valor: cuánto conoce esa persona tus resultados.',
                                                'Disposición probable: viabilidad real de apoyo activo.'
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
                                                'Directora de unidad: 5 / 2 / 2 / 2 → Sponsor potencial lejano.',
                                                'Exjefe con reputación: 4 / 4 / 5 / 4 → Sponsor natural.',
                                                'Sponsor informal: 4 / 2 / 3 / 3 → Sponsor potencial.',
                                                'Mentor con llegada a comité: 3 / 4 / 4 / 4 → Sponsor natural.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Influencia / acceso</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cercanía</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Exposición a mi valor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Disposición probable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo (automático)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sponsorRows.map((item) => {
                                                    const disabledRow = isLocked || item.name.length === 0
                                                    const autoType = buildSponsorType(
                                                        item.row.influenceAccess,
                                                        item.row.currentCloseness,
                                                        item.row.valueExposure,
                                                        item.row.probableDisposition
                                                    )
                                                    return (
                                                        <tr key={`wb7-sponsor-matrix-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.name || `Sponsor ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            {(['influenceAccess', 'currentCloseness', 'valueExposure', 'probableDisposition'] as const).map((field) => (
                                                                <td key={`wb7-sponsor-matrix-${item.index}-${field}`} className="px-3 py-2 border-b border-slate-100">
                                                                    <select
                                                                        value={item.row[field]}
                                                                        onChange={(event) => updateSponsorMatrixRow(item.index, field, readScore(event.target.value))}
                                                                        disabled={disabledRow}
                                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {['1', '2', '3', '4', '5'].map((option) => (
                                                                            <option key={`wb7-sponsor-option-${item.index}-${field}-${option}`} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
                                                                {autoType || 'Completa los puntajes para clasificar.'}
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
                                            onClick={() => saveSponsorBlock('Paso 2 — Matriz de sponsors')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Índice de patrocinabilidad propia</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorshipIndexCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorshipIndexCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Evalúa tu preparación para recibir patrocinio real con evidencia observable, no solo intención.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona Bajo/Medio/Alto por cada factor de patrocinabilidad.',
                                                'Acompaña cada selección con evidencia concreta y reciente.',
                                                'Si no hay evidencia, registra explícitamente “No tengo evidencia reciente”.'
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
                                                'Resultados visibles: Medio (trabajo sólido, poca exposición ejecutiva).',
                                                'Reputación confiable: Alto (cumplimiento consistente).',
                                                'Claridad de aporte: Medio (valor entendido de forma desigual).',
                                                'Visibilidad estratégica: Bajo (dependencia de visibilidad indirecta).'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Factor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Evidencia / señal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sponsorSection.sponsorshipIndexRows.map((row, index) => (
                                                    <tr key={`wb7-sponsor-index-${row.factor}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.factor}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateSponsorshipIndexRow(index, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="bajo">Bajo</option>
                                                                <option value="medio">Medio</option>
                                                                <option value="alto">Alto</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.evidence}
                                                                onChange={(event) => updateSponsorshipIndexRow(index, 'evidence', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Evidencia concreta"
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
                                            onClick={() => saveSponsorBlock('Paso 3 — Índice de patrocinabilidad')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Mapa de valor antes de pedir</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                valueBeforeAskingCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {valueBeforeAskingCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Define qué valor aportar primero antes de solicitar respaldo para evitar un acercamiento oportunista.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona sponsors prioritarios sobre los que puedas construir relación real.',
                                                'Explicita qué les importa hoy y cómo puedes contribuir primero.',
                                                'Define con claridad qué comportamiento debes evitar para no sonar transaccional.'
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
                                                'Directora de unidad: le importa foco estratégico; aportar síntesis ejecutivas útiles; evitar pedir exposición sin evidencia.',
                                                'Exjefe con reputación: le importa talento confiable; compartir avances concretos; evitar aparecer solo al pedir recomendación.',
                                                'Sponsor informal: le importa impacto transversal; conectar trabajo con su agenda; evitar forzar cercanía.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sponsor prioritario</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué le importa</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué valor puedo aportar primero</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué no debo hacer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sponsorSection.valueBeforeAskingRows.map((row, index) => (
                                                    <tr key={`wb7-value-before-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.prioritySponsor}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'prioritySponsor', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona sponsor</option>
                                                                {sponsorsDefined.map((item) => (
                                                                    <option key={`wb7-sponsor-priority-${item.index}`} value={item.name}>
                                                                        {item.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.currentPriority}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'currentPriority', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Qué le importa"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.firstValue}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'firstValue', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Valor previo que pondrás"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.avoidAction}
                                                                onChange={(event) => updateValueBeforeAskingRow(index, 'avoidAction', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Error a evitar"
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
                                            onClick={() => saveSponsorBlock('Paso 4 — Mapa de valor antes de pedir')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Ruta de activación del sponsor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorActivationCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorActivationCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Elige un sponsor prioritario realista para los próximos 15 días.',
                                                'Define una vía de acceso viable: directa, por puente o por visibilidad gradual.',
                                                'Concreta movimiento inicial, señal de avance, riesgo principal y siguiente paso verificable.'
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
                                                'Sponsor prioritario: Directora de unidad.',
                                                'Vía de acceso: por puente con jefe directo.',
                                                'Movimiento inicial: presentar síntesis ejecutiva en espacio compartido.',
                                                'Señal de avance: reconocimiento explícito de criterio o invitación a iniciativa.',
                                                'Riesgo principal: parecer oportunista.',
                                                'Próximo paso (15 días): pedir al jefe un espacio breve de exposición con foco estratégico.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1 block md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Sponsor prioritario</span>
                                            <select
                                                value={activationRoute.prioritySponsor}
                                                onChange={(event) => updateActivationRoute('prioritySponsor', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona sponsor</option>
                                                {sponsorsDefined.map((item) => (
                                                    <option key={`wb7-route-sponsor-${item.index}`} value={item.name}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Vía de acceso</span>
                                            <select
                                                value={activationRoute.accessPath}
                                                onChange={(event) => updateActivationRoute('accessPath', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona</option>
                                                {SPONSOR_ACCESS_OPTIONS.map((option) => (
                                                    <option key={`wb7-access-path-${option}`} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal de avance</span>
                                            <input
                                                type="text"
                                                value={activationRoute.progressSignal}
                                                onChange={(event) => updateActivationRoute('progressSignal', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Qué señal buscarás"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1 block md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Movimiento inicial realista</span>
                                            <textarea
                                                value={activationRoute.realisticMove}
                                                onChange={(event) => updateActivationRoute('realisticMove', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                placeholder="Primer movimiento concreto"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                            />
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Riesgo principal</span>
                                            <textarea
                                                value={activationRoute.mainRisk}
                                                onChange={(event) => updateActivationRoute('mainRisk', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                placeholder="Riesgo si te acercas mal"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                            />
                                        </label>
                                        <label className="space-y-1 block">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Próximo paso (15 días)</span>
                                            <textarea
                                                value={activationRoute.nextStep15Days}
                                                onChange={(event) => updateActivationRoute('nextStep15Days', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                placeholder="Acción concreta en 15 días"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveSponsorBlock('Paso 5 — Ruta de activación')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de lectura de sponsors</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sponsorTestCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sponsorTestCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Responde Sí/No desde hechos observables y recientes.',
                                                'Registra ajustes concretos cuando identifiques brechas.',
                                                'Verifica especialmente si estás pidiendo patrocinio antes de construir valor visible.'
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
                                                'Señal débil: llamar sponsor a cualquier actor influyente que apenas te conoce.',
                                                'Señal mejorada: priorizar quien combina influencia, conoce tu valor y podría poner reputación en juego por ti.'
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
                                                {sponsorSection.sponsorReadTest.map((row, index) => (
                                                    <tr key={`wb7-sponsor-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateSponsorReadTestRow(index, 'verdict', event.target.value)}
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
                                                                onChange={(event) => updateSponsorReadTestRow(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="¿Qué necesitas ajustar?"
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
                                            onClick={() => saveSponsorBlock('Paso 6 — Test de sponsors')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {allSponsorsDistant && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: incluye también sponsors naturales o intermedios con acceso más realista.
                                        </p>
                                    )}
                                    {noValueBeforeAsking && (
                                        <p className="text-sm text-amber-800">Sugerencia: define primero qué puedes ofrecer o facilitar antes de pedir.</p>
                                    )}
                                    {allHighInfluenceLowExposure && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: si hay alta influencia pero baja exposición a tu valor, primero aumenta visibilidad y credibilidad.
                                        </p>
                                    )}
                                    {activationRouteVague && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: convierte la intención en un movimiento concreto de los próximos 15 días.
                                        </p>
                                    )}
                                    {!allSponsorsDistant && !noValueBeforeAsking && !allHighInfluenceLowExposure && !activationRouteVague && (
                                        <p className="text-sm text-emerald-700">Sin alertas: la estrategia de sponsors está bien calibrada para activación.</p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section4Completed
                                                    ? 'Completado: inventario, matriz, patrocinabilidad, valor previo, ruta y test diligenciados.'
                                                    : 'Pendiente: define al menos un sponsor prioritario y completa una ruta de activación, junto con los demás bloques.'}
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
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 8"
                                data-print-title="Red de alto valor"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Red de alto valor</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diferencia dentro de tu ecosistema qué relaciones realmente movilizan confianza, acceso, aprendizaje y oportunidades para
                                        convertir tu red en capital relacional activo.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowHighValueHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Red de alto valor: subconjunto de relaciones que sí movilizan acceso, aprendizaje, confianza, reputación o visibilidad.',
                                            'Valor relacional: utilidad estratégica más allá de simpatía o frecuencia de contacto.',
                                            'Reciprocidad estratégica: intercambio útil y sostenible en ambas direcciones.',
                                            'Capital relacional activo: vínculos movilizables con legitimidad por historia y confianza.',
                                            'Expansión consciente: crecimiento deliberado de la red con criterio y valor mutuo.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Inventario de relaciones de alto valor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                highValueInventoryCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {highValueInventoryCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona entre 8 y 12 relaciones estratégicamente relevantes hoy.',
                                                'No priorices solo cercanía; incluye relaciones que abren acceso, aprendizaje, reputación o amplificación.',
                                                'Usa los botones para traer stakeholders o sponsors ya definidos y luego ajusta el inventario.'
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
                                                'Relación 1: Jefe directo',
                                                'Relación 2: Directora de unidad',
                                                'Relación 3: Sponsor informal',
                                                'Relación 4: Exjefe con reputación',
                                                'Relación 5: Mentor ejecutivo',
                                                'Relación 6: Par de operaciones',
                                                'Relación 7: Líder comercial',
                                                'Relación 8: Cliente interno clave',
                                                'Relación 9: Referente externo del sector',
                                                'Relación 10: Partner estratégico'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={importStakeholdersIntoNetwork}
                                            disabled={isLocked}
                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Traer stakeholders
                                        </button>
                                        <button
                                            type="button"
                                            onClick={importSponsorsIntoNetwork}
                                            disabled={isLocked}
                                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Traer sponsors
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {highValueSection.relationsInventory.map((relation, index) => (
                                            <label key={`wb7-high-value-rel-${index}`} className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                    Relación {index + 1}
                                                    {index >= 10 ? ' (opcional)' : ''}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={relation}
                                                    onChange={(event) => updateHighValueRelation(index, event.target.value)}
                                                    disabled={isLocked}
                                                    placeholder="Ej: Directora de unidad"
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-slate-900">Visualización tipo networking (telaraña) por cercanía</h4>
                                            <p className="text-xs text-slate-600">Cercanía estimada desde matriz valor–confianza–acceso</p>
                                        </div>
                                        <div className="relative mx-auto w-full max-w-[860px] h-[320px] sm:h-[420px] rounded-2xl border border-blue-200 bg-gradient-to-b from-[#f8fbff] to-[#edf4ff] overflow-hidden">
                                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                                                <circle cx="50" cy="50" r="17" fill="none" stroke="#93c5fd" strokeDasharray="0" />
                                                <circle cx="50" cy="50" r="25" fill="none" stroke="#bfdbfe" strokeDasharray="1.2 1.6" />
                                                <circle cx="50" cy="50" r="33" fill="none" stroke="#dbeafe" strokeDasharray="1.2 1.8" />
                                                <circle cx="50" cy="50" r="41" fill="none" stroke="#e2e8f0" strokeDasharray="1.4 2" />
                                                {highValueSpiderNodes.map((node) => (
                                                    <line
                                                        key={`wb7-high-value-line-${node.index}`}
                                                        x1="50"
                                                        y1="50"
                                                        x2={node.position.x}
                                                        y2={node.position.y}
                                                        stroke="#94a3b8"
                                                        strokeWidth="0.35"
                                                        strokeOpacity="0.7"
                                                    />
                                                ))}
                                            </svg>
                                            <div className="absolute inset-0">
                                                {highValueSpiderNodes.map((node) => (
                                                    <div
                                                        key={`wb7-high-value-node-${node.index}`}
                                                        style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                                                        className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[170px] rounded-full border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 text-center shadow-sm"
                                                    >
                                                        <span className="block truncate">{node.name}</span>
                                                    </div>
                                                ))}
                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-blue-500 bg-white px-4 py-2 shadow-sm text-center">
                                                    <p className="text-[10px] uppercase tracking-[0.14em] text-blue-700 font-semibold">Centro</p>
                                                    <p className="text-sm font-bold text-slate-900">{state.identification.role.trim() || 'Tu rol actual'}</p>
                                                </div>
                                            </div>
                                            {highValueSpiderNodes.length === 0 && (
                                                <div className="absolute inset-x-6 bottom-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                                                    <p className="text-xs text-amber-800">
                                                        Completa relaciones y/o la matriz de confianza para visualizar la red tipo telaraña.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            Referencia visual: mayor confianza = nodo más cercano al centro. Menor confianza = nodo más periférico.
                                        </p>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveHighValueBlock('Paso 1 — Inventario de relaciones de alto valor')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz valor–confianza–acceso</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                highValueMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {highValueMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Valora cada relación de 1 a 5 en valor estratégico, confianza actual y acceso/amplificación.',
                                                'Define el tipo de valor dominante: aprendizaje, acceso, reputación, patrocinio, colaboración o inteligencia política.',
                                                'Marca el estado real de la relación: activa, mantenida, dormida o frágil.'
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
                                                'Directora de unidad: valor 5, confianza 2, acceso 5, tipo visibilidad/acceso, estado frágil.',
                                                'Exjefe con reputación: valor 4, confianza 4, acceso 4, tipo reputación/referencia, estado mantenida.',
                                                'Sponsor informal: valor 4, confianza 2, acceso 4, tipo patrocinio potencial, estado dormida.',
                                                'Mentor ejecutivo: valor 3, confianza 5, acceso 3, tipo criterio/aprendizaje, estado activa.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor estratégico (1–5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Confianza actual (1–5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Acceso / amplificación (1–5)</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo de valor dominante</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Estado actual</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {highValueRows.map((item) => {
                                                    const disabledRow = isLocked || item.name.length === 0
                                                    return (
                                                        <tr key={`wb7-high-value-matrix-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.name || `Relación ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.strategicValue}
                                                                    onChange={(event) => updateValueTrustAccessRow(item.index, 'strategicValue', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-hv-value-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.currentTrust}
                                                                    onChange={(event) => updateValueTrustAccessRow(item.index, 'currentTrust', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-hv-trust-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.accessAmplification}
                                                                    onChange={(event) =>
                                                                        updateValueTrustAccessRow(item.index, 'accessAmplification', event.target.value)
                                                                    }
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {['1', '2', '3', '4', '5'].map((option) => (
                                                                        <option key={`wb7-hv-access-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.dominantValueType}
                                                                    onChange={(event) => updateValueTrustAccessRow(item.index, 'dominantValueType', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {NETWORK_VALUE_TYPE_OPTIONS.map((option) => (
                                                                        <option key={`wb7-hv-dominant-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <select
                                                                    value={item.matrix.currentState}
                                                                    onChange={(event) => updateValueTrustAccessRow(item.index, 'currentState', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {NETWORK_STATE_OPTIONS.map((option) => (
                                                                        <option key={`wb7-hv-state-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
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
                                            onClick={() => saveHighValueBlock('Paso 2 — Matriz valor–confianza–acceso')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Segmentación de la red de alto valor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                highValueSegmentationCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {highValueSegmentationCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Asigna a cada relación un segmento principal: núcleo, puente, multiplicadora, aprendizaje, a reactivar o a profundizar.',
                                                'Explica por qué entra en ese segmento desde función estratégica real.',
                                                'Define un movimiento sugerido que convierta la lectura en acción concreta.'
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
                                                'Jefe directo → Núcleo: impacta legitimidad diaria. Movimiento: sostener alineación visible.',
                                                'Exjefe con reputación → Multiplicadora: amplifica referencia externa. Movimiento: reactivar con actualización de valor.',
                                                'Referente externo → Puente: conecta con industria. Movimiento: abrir conversación breve con aporte útil.',
                                                'Mentor ejecutivo → Aprendizaje: aporta criterio político. Movimiento: profundizar con una pregunta de alto nivel.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Segmento principal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Por qué entra aquí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Movimiento sugerido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {highValueRows.map((item) => {
                                                    const disabledRow = isLocked || item.name.length === 0
                                                    return (
                                                        <tr key={`wb7-high-value-segment-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.name || `Relación ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                                <select
                                                                    value={item.segment.mainSegment}
                                                                    onChange={(event) => updateSegmentationRow(item.index, 'mainSegment', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {NETWORK_SEGMENT_OPTIONS.map((option) => (
                                                                        <option key={`wb7-hv-segment-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={item.segment.reason}
                                                                    onChange={(event) => updateSegmentationRow(item.index, 'reason', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    placeholder="Justificación estratégica"
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={item.segment.suggestedMove}
                                                                    onChange={(event) => updateSegmentationRow(item.index, 'suggestedMove', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    placeholder="Movimiento concreto"
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-slate-900">Mapa segmentado (telaraña por función)</h4>
                                            <p className="text-xs text-slate-600">Colores por segmento estratégico</p>
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                                            <div className="relative mx-auto w-full max-w-[860px] h-[320px] sm:h-[420px] rounded-2xl border border-blue-200 bg-gradient-to-b from-[#f8fbff] to-[#edf4ff] overflow-hidden">
                                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                                                    <circle cx="50" cy="50" r="41" fill="none" stroke="#dbeafe" />
                                                    <circle cx="50" cy="50" r="28" fill="none" stroke="#bfdbfe" strokeDasharray="1.2 1.8" />
                                                    {highValueSegmentNodes.map((node) => (
                                                        <line
                                                            key={`wb7-high-value-segment-line-${node.index}`}
                                                            x1="50"
                                                            y1="50"
                                                            x2={node.position.x}
                                                            y2={node.position.y}
                                                            stroke={node.colors.line}
                                                            strokeWidth="0.5"
                                                            strokeOpacity="0.65"
                                                        />
                                                    ))}
                                                </svg>
                                                <div className="absolute inset-0">
                                                    {highValueSegmentNodes.map((node) => (
                                                        <div
                                                            key={`wb7-high-value-segment-node-${node.index}`}
                                                            style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                                                            className={`absolute -translate-x-1/2 -translate-y-1/2 max-w-[180px] rounded-full border px-2.5 py-1 text-xs font-semibold text-center shadow-sm bg-white ${node.colors.border}`}
                                                        >
                                                            <span className="block truncate text-slate-800">{node.name}</span>
                                                            <span className={`block text-[10px] uppercase tracking-[0.08em] ${node.colors.text}`}>
                                                                {node.segment.mainSegment || 'Sin segmento'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-blue-500 bg-white px-4 py-2 shadow-sm text-center">
                                                        <p className="text-[10px] uppercase tracking-[0.14em] text-blue-700 font-semibold">Centro</p>
                                                        <p className="text-sm font-bold text-slate-900">Red de alto valor</p>
                                                    </div>
                                                </div>
                                                {highValueSegmentNodes.length === 0 && (
                                                    <div className="absolute inset-x-6 bottom-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center">
                                                        <p className="text-xs text-amber-800">
                                                            Completa segmentación para visualizar etiquetas y colores por función.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Convenciones</p>
                                                <div className="mt-3 space-y-2.5">
                                                    {NETWORK_SEGMENT_OPTIONS.map((segment) => {
                                                        const colors = segmentColorMap[segment]
                                                        return (
                                                            <div key={`wb7-segment-legend-${segment}`} className="flex items-center gap-2 text-xs text-slate-700">
                                                                <span className={`inline-block h-3 w-3 rounded-full ${colors?.node ?? 'bg-slate-500'}`} />
                                                                <span>{segment}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </article>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveHighValueBlock('Paso 3 — Segmentación de la red')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Índice de reciprocidad estratégica</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                highValueReciprocityCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {highValueReciprocityCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Selecciona tres relaciones clave y define qué valor recibes y qué valor aportas.',
                                                'Declara el balance actual de la relación: equilibrado, desbalanceado a tu favor o desbalanceado a favor de la otra parte.',
                                                'Define un gesto concreto de reciprocidad en el corto plazo.'
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
                                                'Mentor ejecutivo: recibo criterio, aporto preparación seria, balance relativamente equilibrado, gesto: compartir avance aplicado.',
                                                'Exjefe con reputación: recibo legitimidad, aporto actualización parcial, balance a mi favor, gesto: ofrecer apoyo puntual.',
                                                'Sponsor informal: recibo acceso potencial, aporto poco valor visible, balance bajo, gesto: llevar lectura útil de iniciativa transversal.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1240px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor que recibo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor que aporto</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Balance actual</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Próximo gesto de reciprocidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {highValueSection.reciprocityRows.map((row, index) => (
                                                    <tr key={`wb7-high-value-reciprocity-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[230px]">
                                                            <select
                                                                value={row.relationship}
                                                                onChange={(event) => updateReciprocityRow(index, 'relationship', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona relación</option>
                                                                {highValueDefinedRows.map((item) => (
                                                                    <option key={`wb7-hv-relation-option-${item.index}`} value={item.name}>
                                                                        {item.name}
                                                                    </option>
                                                                ))}
                                                                {row.relationship &&
                                                                    !highValueDefinedRows.some((item) => item.name === row.relationship) && (
                                                                        <option value={row.relationship}>{row.relationship}</option>
                                                                    )}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.valueReceived}
                                                                onChange={(event) => updateReciprocityRow(index, 'valueReceived', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Qué recibo de esta relación"
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.valueProvided}
                                                                onChange={(event) => updateReciprocityRow(index, 'valueProvided', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Qué aporto yo"
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.currentBalance}
                                                                onChange={(event) => updateReciprocityRow(index, 'currentBalance', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ej: Equilibrado / A mi favor"
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.nextGesture}
                                                                onChange={(event) => updateReciprocityRow(index, 'nextGesture', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Gesto concreto en 30 días"
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
                                            onClick={() => saveHighValueBlock('Paso 4 — Índice de reciprocidad estratégica')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Mapa de mantenimiento, reactivación y expansión</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                highValueActionMapCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {highValueActionMapCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define por relación si debes mantener, reactivar, expandir o despriorizar.',
                                                'Justifica la decisión desde valor mutuo y contribución estratégica.',
                                                'Convierte cada decisión en una acción concreta para los próximos 30 días.'
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
                                                'Jefe directo → Mantener: relación núcleo. Acción: preparar síntesis ejecutivas semanales.',
                                                'Referente externo → Reactivar: alto valor y baja actividad. Acción: retomar contacto con aporte útil.',
                                                'Directora de unidad → Expandir: alta influencia y baja cercanía. Acción: buscar punto de valor visible.',
                                                'Vínculo superficial sin reciprocidad → Despriorizar: alto consumo y bajo retorno.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1200px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Mantener / Reactivar / Expandir / Despriorizar</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Justificación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Acción de 30 días</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {highValueRows.map((item) => {
                                                    const disabledRow = isLocked || item.name.length === 0
                                                    return (
                                                        <tr key={`wb7-high-value-action-${item.index}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {item.name || `Relación ${item.index + 1} (sin definir)`}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100 w-[320px]">
                                                                <select
                                                                    value={item.action.actionState}
                                                                    onChange={(event) => updateActionMapRow(item.index, 'actionState', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                >
                                                                    <option value="">Selecciona</option>
                                                                    {NETWORK_ACTION_OPTIONS.map((option) => (
                                                                        <option key={`wb7-hv-action-option-${item.index}-${option}`} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={item.action.justification}
                                                                    onChange={(event) => updateActionMapRow(item.index, 'justification', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    placeholder="Razón estratégica"
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={item.action.action30Days}
                                                                    onChange={(event) => updateActionMapRow(item.index, 'action30Days', event.target.value)}
                                                                    disabled={disabledRow}
                                                                    placeholder="Movimiento concreto en 30 días"
                                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
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
                                            onClick={() => saveHighValueBlock('Paso 5 — Mapa de mantenimiento, reactivación y expansión')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de calidad de la red de alto valor</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                highValueTestCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {highValueTestCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Responde Sí/No con base en evidencia real de tus relaciones actuales.',
                                                'Si marcas No, registra el ajuste necesario con precisión práctica.',
                                                'Asegura que la lectura termine en acciones de mantenimiento, reactivación o expansión.'
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
                                                'Señal débil: red compuesta solo por vínculos frecuentes, sin lectura de valor ni reciprocidad.',
                                                'Señal mejorada: red segmentada por función estratégica, con relaciones activas, dormidas y acciones concretas.'
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
                                                {highValueSection.qualityTest.map((row, index) => (
                                                    <tr key={`wb7-high-value-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateNetworkQualityTest(index, 'verdict', event.target.value)}
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
                                                                onChange={(event) => updateNetworkQualityTest(index, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="¿Qué necesitas ajustar?"
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
                                            onClick={() => saveHighValueBlock('Paso 6 — Test de calidad de la red')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {onlyCloseRelationships && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: incluye también relaciones puente, multiplicadoras o externas.
                                        </p>
                                    )}
                                    {noDormantRelationship && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: revisa si estás dejando fuera vínculos valiosos que hoy están inactivos.
                                        </p>
                                    )}
                                    {reciprocityUnclear && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: aclara qué valor aportas tú antes de pedir apoyo.
                                        </p>
                                    )}
                                    {noAction30Days && (
                                        <p className="text-sm text-amber-800">Sugerencia: convierte la lectura en movimientos concretos.</p>
                                    )}
                                    {!onlyCloseRelationships && !noDormantRelationship && !reciprocityUnclear && !noAction30Days && (
                                        <p className="text-sm text-emerald-700">
                                            Sin alertas: tu red muestra diversidad funcional y acciones tácticas de mantenimiento/expansión.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section5Completed
                                                    ? 'Completado: inventario, matriz, segmentación, reciprocidad, mapa de acciones y test diligenciados.'
                                                    : 'Pendiente: identifica relaciones de alto valor y define al menos una acción de mantenimiento o reactivación, junto con los demás bloques.'}
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
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 8"
                                data-print-title="Estrategia de networking consciente"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Estrategia de networking consciente
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diseña una estrategia relacional basada en intención, valor mutuo y lectura estratégica para construir conexiones sostenibles
                                        y evitar networking por inercia o urgencia.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowConsciousNetworkingHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Networking consciente: construir relaciones con intención, criterio y reciprocidad, no por urgencia.',
                                            'Intención relacional: claridad de para qué quieres activar, cuidar o expandir una relación.',
                                            'Tesis de valor relacional: qué valor puedes aportar tú antes de esperar retorno.',
                                            'Cadencia de contacto: frecuencia y formato para que la red no dependa de impulsos esporádicos.',
                                            'Reciprocidad sostenible: intercambio que fortalece confianza y legitimidad sin instrumentalizar.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Declaración de intención relacional</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                networkingIntentionCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {networkingIntentionCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define el objetivo estratégico que quieres apoyar con tu red en este momento.',
                                                'Aclara qué relaciones necesitas más, cuáles tienes fuertes y cuáles están subdesarrolladas.',
                                                'Declara el error relacional que quieres evitar y el principio que guiará tu networking.'
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
                                                'Objetivo: ganar visibilidad y acceso en iniciativas transversales.',
                                                'Relaciones que más necesito: sponsors potenciales, puentes interáreas y referentes externos.',
                                                'Relaciones fuerte/débil: fuerte en red operativa, débil en red de amplificación.',
                                                'Error a evitar: aparecer solo cuando necesito apoyo.',
                                                'Principio: aportar valor antes de pedir exposición o acceso.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Objetivo estratégico</span>
                                            <textarea
                                                value={consciousNetworkingSection.intentionDeclaration.strategicObjective}
                                                onChange={(event) => updateNetworkingIntention('strategicObjective', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                Tipo de relaciones que más necesito
                                            </span>
                                            <textarea
                                                value={consciousNetworkingSection.intentionDeclaration.neededRelationshipType}
                                                onChange={(event) => updateNetworkingIntention('neededRelationshipType', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                Relaciones fuerte / débil
                                            </span>
                                            <textarea
                                                value={consciousNetworkingSection.intentionDeclaration.strongWeakRelationshipType}
                                                onChange={(event) => updateNetworkingIntention('strongWeakRelationshipType', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Error relacional a evitar</span>
                                            <textarea
                                                value={consciousNetworkingSection.intentionDeclaration.relationalErrorToAvoid}
                                                onChange={(event) => updateNetworkingIntention('relationalErrorToAvoid', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Principio que ordena mi networking</span>
                                            <textarea
                                                value={consciousNetworkingSection.intentionDeclaration.guidingPrinciple}
                                                onChange={(event) => updateNetworkingIntention('guidingPrinciple', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveConsciousNetworkingBlock('Paso 1 — Declaración de intención relacional')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz objetivo–audiencia–valor–movimiento</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                networkingObjectiveMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {networkingObjectiveMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Traduce la intención en una lógica accionable: objetivo, actor, valor aportado primero, movimiento inicial y señal de avance.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Completa las 3 filas con focos relacionales concretos.',
                                                'Asegura que cada fila explicite valor aportado antes de pedir.',
                                                'Define una señal de avance observable para no quedarte en intención.'
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
                                                'Aumentar visibilidad interna | Directora de unidad | Síntesis ejecutivas útiles | Llevar lectura preparada | Que pida seguimiento.',
                                                'Reactivar sponsor potencial | Exjefe con reputación | Actualización clara | Enviar nota breve con pregunta puntual | Que responda con apertura.',
                                                'Expandir red externa | Referente sectorial | Insight útil | Solicitar conversación breve | Que recomiende otro contacto.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1320px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objetivo relacional</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Audiencia / actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor que puedo aportar primero</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Movimiento inicial realista</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal de avance esperada</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consciousNetworkingSection.objectiveMatrixRows.map((row, index) => (
                                                    <tr key={`wb7-network-objective-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.relationalObjective}
                                                                onChange={(event) => updateNetworkingObjectiveMatrixRow(index, 'relationalObjective', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.audienceActor}
                                                                onChange={(event) => updateNetworkingObjectiveMatrixRow(index, 'audienceActor', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.firstValueContribution}
                                                                onChange={(event) =>
                                                                    updateNetworkingObjectiveMatrixRow(index, 'firstValueContribution', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.realisticInitialMove}
                                                                onChange={(event) =>
                                                                    updateNetworkingObjectiveMatrixRow(index, 'realisticInitialMove', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.expectedProgressSignal}
                                                                onChange={(event) =>
                                                                    updateNetworkingObjectiveMatrixRow(index, 'expectedProgressSignal', event.target.value)
                                                                }
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
                                            onClick={() => saveConsciousNetworkingBlock('Paso 2 — Matriz objetivo-audiencia-valor-movimiento')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Segmentación de movimientos de networking</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                networkingMovementCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {networkingMovementCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Diseña al menos 6 movimientos distribuidos entre activar, nutrir, profundizar, expandir, amplificar y reciprocar.',
                                                'Para cada movimiento, define exactamente qué harás y qué valor está en juego.',
                                                'Evita una estrategia concentrada solo en activación sin mantenimiento relacional.'
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
                                                'Exjefe con reputación | Reactivar | Compartir actualización breve con logro visible | Reputación y referencia.',
                                                'Sponsor informal | Nutrir | Enviar lectura útil sobre iniciativa transversal | Patrocinio potencial.',
                                                'Referente externo | Expandir | Pedir conversación de 20 minutos con foco claro | Posicionamiento y puente.',
                                                'Mentor | Reciprocar | Compartir aplicación concreta de una recomendación | Confianza y aprendizaje.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relación / actor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo de movimiento</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué haré concretamente</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué valor está en juego</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consciousNetworkingSection.movementSegmentationRows.map((row, index) => (
                                                    <tr key={`wb7-network-movement-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.relationActor}
                                                                onChange={(event) => updateNetworkingMovementRow(index, 'relationActor', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.movementType}
                                                                onChange={(event) => updateNetworkingMovementRow(index, 'movementType', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {CONSCIOUS_NETWORKING_MOVEMENT_TYPES.map((option) => (
                                                                    <option key={`wb7-network-movement-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteAction}
                                                                onChange={(event) => updateNetworkingMovementRow(index, 'concreteAction', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.valueAtStake}
                                                                onChange={(event) => updateNetworkingMovementRow(index, 'valueAtStake', event.target.value)}
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
                                            onClick={() => saveConsciousNetworkingBlock('Paso 3 — Segmentación de movimientos')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Cadencia de contacto y mantenimiento consciente</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                networkingCadenceCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {networkingCadenceCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define una cadencia mínima por relación (mensual, bimensual, trimestral o por hito).',
                                                'Selecciona formato de contacto según contexto: mensaje, llamada, actualización ejecutiva, reconocimiento, introducción o intercambio.',
                                                'Deja explícito el objetivo de cada contacto.'
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
                                                'Jefe directo | Mensual | Síntesis ejecutiva + conversación | Mantener alineación y visibilidad.',
                                                'Exjefe con reputación | Trimestral | Actualización breve | Cuidar relación multiplicadora.',
                                                'Referente externo | Bimensual | Mensaje con insight | Expandir puente sectorial.',
                                                'Sponsor informal | Mensual | Aporte útil corto | Nutrir disposición y credibilidad.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Relación</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cadencia sugerida</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato de contacto</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objetivo del contacto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consciousNetworkingSection.cadenceRows.map((row, index) => (
                                                    <tr key={`wb7-network-cadence-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.relation}
                                                                onChange={(event) => updateNetworkingCadenceRow(index, 'relation', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.suggestedCadence}
                                                                onChange={(event) => updateNetworkingCadenceRow(index, 'suggestedCadence', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {CONSCIOUS_NETWORKING_CADENCE_OPTIONS.map((option) => (
                                                                    <option key={`wb7-network-cadence-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[260px]">
                                                            <select
                                                                value={row.contactFormat}
                                                                onChange={(event) => updateNetworkingCadenceRow(index, 'contactFormat', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {CONSCIOUS_NETWORKING_FORMAT_OPTIONS.map((option) => (
                                                                    <option key={`wb7-network-format-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.contactObjective}
                                                                onChange={(event) => updateNetworkingCadenceRow(index, 'contactObjective', event.target.value)}
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
                                            onClick={() => saveConsciousNetworkingBlock('Paso 4 — Cadencia de contacto')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Scorecard de networking consciente</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                networkingScorecardCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {networkingScorecardCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Califica cada dimensión en Bajo, Medio o Alto con evidencia concreta.',
                                                'Evita calificaciones sin señal observable.',
                                                'Usa el scorecard para orientar decisiones de 30 días.'
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
                                                'Intención clara: Medio — tengo focos definidos, falta traducirlos siempre en acción.',
                                                'Diversidad de red: Bajo — la red sigue centrada en lo interno.',
                                                'Consistencia de contacto: Medio — algunas relaciones se sostienen, otras dependen del impulso.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Bajo / Medio / Alto</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Evidencia / señal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consciousNetworkingSection.scorecardRows.map((row, index) => (
                                                    <tr key={`wb7-network-scorecard-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateNetworkingScorecardRow(index, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="bajo">Bajo</option>
                                                                <option value="medio">Medio</option>
                                                                <option value="alto">Alto</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.evidence}
                                                                onChange={(event) => updateNetworkingScorecardRow(index, 'evidence', event.target.value)}
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
                                            onClick={() => saveConsciousNetworkingBlock('Paso 5 — Scorecard de networking consciente')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Plan de networking consciente a 30 días</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                networkingPlanCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {networkingPlanCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define 3 relaciones a nutrir, 2 a reactivar y 2 nuevas a explorar.',
                                                'Incluye una acción visible de reciprocidad y un hábito mínimo de mantenimiento.',
                                                'Cierra con un criterio de evaluación en 30 días.'
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
                                                '3 a nutrir: jefe directo, sponsor informal, mentor.',
                                                '2 a reactivar: exjefe con reputación, referente externo.',
                                                '2 nuevas: directora de unidad, partner sectorial.',
                                                'Reciprocidad visible: hacer visible aporte de un aliado en reunión clave.',
                                                'Hábito: 20 minutos semanales de acciones relacionales conscientes.',
                                                'Criterio: ejecutar 6 movimientos con evidencia de respuesta o avance.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">3 relaciones a nutrir</span>
                                            <textarea
                                                value={consciousNetworkingSection.plan30Days.nourishRelationships}
                                                onChange={(event) => updateNetworkingPlan30Days('nourishRelationships', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">2 relaciones a reactivar</span>
                                            <textarea
                                                value={consciousNetworkingSection.plan30Days.reactivateRelationships}
                                                onChange={(event) => updateNetworkingPlan30Days('reactivateRelationships', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">2 relaciones nuevas a explorar</span>
                                            <textarea
                                                value={consciousNetworkingSection.plan30Days.exploreRelationships}
                                                onChange={(event) => updateNetworkingPlan30Days('exploreRelationships', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">1 acción de reciprocidad visible</span>
                                            <textarea
                                                value={consciousNetworkingSection.plan30Days.visibleReciprocityAction}
                                                onChange={(event) => updateNetworkingPlan30Days('visibleReciprocityAction', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">1 hábito de mantenimiento relacional</span>
                                            <textarea
                                                value={consciousNetworkingSection.plan30Days.maintenanceHabit}
                                                onChange={(event) => updateNetworkingPlan30Days('maintenanceHabit', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">1 criterio para evaluar avance en 30 días</span>
                                            <textarea
                                                value={consciousNetworkingSection.plan30Days.progressCriteria}
                                                onChange={(event) => updateNetworkingPlan30Days('progressCriteria', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveConsciousNetworkingBlock('Paso 6 — Plan de networking consciente a 30 días')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">Validaciones suaves</h3>
                                    {noFirstValueBeforeAsking && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara qué puedes ofrecer primero.</p>
                                    )}
                                    {movementsOnlyActivation && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: incluye también cuidado de relaciones ya valiosas.
                                        </p>
                                    )}
                                    {cadenceMissing && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: define una frecuencia mínima para sostener la red.
                                        </p>
                                    )}
                                    {planMissingReciprocity && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: agrega un gesto concreto de valor hacia otros.
                                        </p>
                                    )}
                                    {!noFirstValueBeforeAsking && !movementsOnlyActivation && !cadenceMissing && !planMissingReciprocity && (
                                        <p className="text-sm text-emerald-700">
                                            Sin alertas: la estrategia de networking muestra intención, reciprocidad y mantenimiento consciente.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section6Completed
                                                    ? 'Completado: intención, matriz, movimientos, cadencia, scorecard y plan de 30 días diligenciados.'
                                                    : 'Pendiente: define intención relacional y un plan mínimo a 30 días, junto con los demás bloques.'}
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
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 8"
                                data-print-title="Plan de visibilidad estratégica"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Plan de visibilidad estratégica
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diseña una arquitectura de visibilidad para hacer visible tu aporte en las audiencias correctas, con pruebas concretas y
                                        una secuencia 30-60-90 que fortalezca reputación, legitimidad y acceso.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVisibilityHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Visibilidad estratégica: hacer visible tu valor donde esa señal genera legitimidad, influencia o acceso.',
                                            'Huella ejecutiva visible: percepción consistente que dejas por resultados, criterio e intervenciones.',
                                            'Señal de valor: evidencia breve y comprensible de tu aporte (síntesis, resultado, recomendación).',
                                            'Visibilidad directa e indirecta: lo que muestras tú y lo que terceros amplifican de tu trabajo.',
                                            'Arquitectura de visibilidad: qué mostrar, dónde, ante quién, con qué prueba y con qué frecuencia.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Auditoría de visibilidad actual</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilityAuditCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilityAuditCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Haz una lectura real de tu visibilidad actual antes de diseñar el plan.',
                                                'Distingue qué valor ya se percibe y qué aportes siguen invisibles para audiencias clave.',
                                                'Identifica espacios que no estás ocupando y la percepción probable que estás dejando.'
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
                                                'Espacios visibles: reuniones operativas y conversaciones uno a uno.',
                                                'Audiencias que sí me ven: jefe directo y pares cercanos.',
                                                'Valor percibido: ejecución sólida y confiable.',
                                                'Aportes invisibles: pensamiento estratégico y capacidad de ordenar escenarios.',
                                                'Espacios no ocupados: comités ampliados y reportes ejecutivos.',
                                                'Percepción probable: buen ejecutor, aún no claramente referente.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Mi lectura actual</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    ['Espacios donde hoy soy visible', visibilityAudit.currentVisibleSpaces, 'currentVisibleSpaces'],
                                                    ['Audiencias que sí me ven', visibilityAudit.currentVisibleAudiences, 'currentVisibleAudiences'],
                                                    ['Valor que hoy se percibe de mí', visibilityAudit.currentPerceivedValue, 'currentPerceivedValue'],
                                                    ['Aportes que siguen invisibles', visibilityAudit.invisibleContributions, 'invisibleContributions'],
                                                    ['Espacios clave que no estoy ocupando', visibilityAudit.unoccupiedKeySpaces, 'unoccupiedKeySpaces'],
                                                    ['Percepción probable que estoy dejando', visibilityAudit.probablePerception, 'probablePerception']
                                                ].map(([label, value, key]) => (
                                                    <tr key={`wb7-visibility-audit-${key}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{label}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={value as string}
                                                                onChange={(event) =>
                                                                    updateVisibilityAudit(
                                                                        key as keyof WB7State['strategicVisibilitySection']['visibilityAudit'],
                                                                        event.target.value
                                                                    )
                                                                }
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
                                            onClick={() => saveVisibilityBlock('Paso 1 — Auditoría de visibilidad actual')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz visibilidad–audiencia–valor–prueba</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilityMatrixCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilityMatrixCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define para cada audiencia clave el valor visible que quieres instalar.',
                                                'Sostén ese valor con evidencia concreta y una superficie de visibilidad adecuada.',
                                                'Declara qué error debes evitar para no perder efectividad.'
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
                                                'Directora de unidad | Criterio estratégico | Síntesis con foco/riesgo/recomendación | Reunión ejecutiva | Evitar sobreexplicar.',
                                                'Sponsor potencial | Valor transversal | Caso de impacto visible | Conversación puente / correo ejecutivo | Evitar pedir apoyo antes de mostrar valor.',
                                                'Referente externo | Especialidad | Insight aplicable del sector | Evento / publicación breve | Evitar tono genérico.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={importStakeholdersIntoVisibility}
                                            disabled={isLocked}
                                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Traer stakeholders
                                        </button>
                                        <button
                                            type="button"
                                            onClick={importSponsorsIntoVisibility}
                                            disabled={isLocked}
                                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Traer sponsors
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1280px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Audiencia clave</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor que quiero hacer visible</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Prueba / evidencia concreta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Superficie de visibilidad</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Error a evitar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibilitySection.visibilityMatrixRows.map((row, index) => (
                                                    <tr key={`wb7-visibility-matrix-${index}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.keyAudience}
                                                                onChange={(event) => updateVisibilityMatrixRow(index, 'keyAudience', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[260px]">
                                                            <select
                                                                value={row.valueToMakeVisible}
                                                                onChange={(event) => updateVisibilityMatrixRow(index, 'valueToMakeVisible', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_VALUE_OPTIONS.map((option) => (
                                                                    <option key={`wb7-visibility-value-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteEvidence}
                                                                onChange={(event) => updateVisibilityMatrixRow(index, 'concreteEvidence', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[260px]">
                                                            <select
                                                                value={row.visibilitySurface}
                                                                onChange={(event) => updateVisibilityMatrixRow(index, 'visibilitySurface', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_SURFACE_OPTIONS.map((option) => (
                                                                    <option key={`wb7-visibility-surface-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.errorToAvoid}
                                                                onChange={(event) => updateVisibilityMatrixRow(index, 'errorToAvoid', event.target.value)}
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
                                            onClick={() => saveVisibilityBlock('Paso 2 — Matriz visibilidad-audiencia-valor-prueba')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Arquitectura de señal visible</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilitySignalCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilitySignalCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Define una señal principal clara que quieras instalar en tu reputación visible.',
                                                'Especifica atributos y pruebas observables que la vuelvan creíble.',
                                                'Aclara contextos de alta prioridad y posibles incoherencias que puedan debilitar la señal.'
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
                                                'Señal principal: aporto claridad estratégica y foco.',
                                                'Atributos: síntesis, criterio y capacidad de ordenar.',
                                                'Pruebas: reportes claros, intervenciones breves y recomendaciones sustentadas.',
                                                'Contextos: comités, reuniones transversales y espacios con dirección.',
                                                'Incoherencias: exceso de detalle, mensaje confuso o baja visibilidad de resultados.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Señal principal</span>
                                            <textarea
                                                value={visibilitySignal.mainSignal}
                                                onChange={(event) => updateVisibilitySignalArchitecture('mainSignal', event.target.value)}
                                                disabled={isLocked}
                                                rows={2}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Tres atributos visibles</span>
                                            <textarea
                                                value={visibilitySignal.visibleAttributes}
                                                onChange={(event) => updateVisibilitySignalArchitecture('visibleAttributes', event.target.value)}
                                                disabled={isLocked}
                                                rows={4}
                                                placeholder={'• atributo 1\n• atributo 2\n• atributo 3'}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Pruebas visibles</span>
                                            <textarea
                                                value={visibilitySignal.visibleProofs}
                                                onChange={(event) => updateVisibilitySignalArchitecture('visibleProofs', event.target.value)}
                                                disabled={isLocked}
                                                rows={4}
                                                placeholder={'• prueba 1\n• prueba 2\n• prueba 3'}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Contextos donde debe aparecer</span>
                                            <textarea
                                                value={visibilitySignal.strongerContexts}
                                                onChange={(event) => updateVisibilitySignalArchitecture('strongerContexts', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Incoherencias que podrían debilitarla</span>
                                            <textarea
                                                value={visibilitySignal.weakeningIncoherences}
                                                onChange={(event) => updateVisibilitySignalArchitecture('weakeningIncoherences', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm resize-y disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityBlock('Paso 3 — Arquitectura de señal visible')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Portafolio de superficies de visibilidad</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilityPortfolioCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilityPortfolioCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Trabaja las 4 superficies propuestas (ya cargadas) y define qué mostrarás en cada una.',
                                                'Selecciona formato y frecuencia mínima para sostener una presencia consistente.',
                                                'Evita concentrar toda la visibilidad en un solo tipo de espacio.'
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
                                                'Reunión ejecutiva | Criterio y síntesis | Intervención breve + recomendación | 2 veces al mes.',
                                                'Reporte ejecutivo | Claridad de avance y foco | Resumen de una página | Mensual.',
                                                'Networking interno | Colaboración transversal | Conversaciones de valor | 2 contactos al mes.',
                                                'LinkedIn / red externa | Especialidad y contexto | Publicación breve | 2 veces al mes.'
                                            ].map((item) => (
                                                <li key={item} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Superficie de visibilidad</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué quiero mostrar aquí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Frecuencia mínima</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibilitySection.visibilityPortfolioRows.map((row, index) => (
                                                    <tr key={`wb7-visibility-portfolio-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                            {row.visibilitySurface}
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[280px]">
                                                            <select
                                                                value={row.whatToShow}
                                                                onChange={(event) => updateVisibilityPortfolioRow(index, 'whatToShow', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_SHOW_OPTIONS.map((option) => (
                                                                    <option key={`wb7-visibility-show-option-${index}-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.format}
                                                                onChange={(event) => updateVisibilityPortfolioRow(index, 'format', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[220px]">
                                                            <select
                                                                value={row.minimumFrequency}
                                                                onChange={(event) => updateVisibilityPortfolioRow(index, 'minimumFrequency', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                {VISIBILITY_FREQUENCY_OPTIONS.map((option) => (
                                                                    <option key={`wb7-visibility-frequency-option-${index}-${option}`} value={option}>
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
                                            onClick={() => saveVisibilityBlock('Paso 4 — Portafolio de superficies de visibilidad')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Calendario 30-60-90 de visibilidad estratégica</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilityTimelineCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilityTimelineCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'En 30 días define una visibilidad mínima viable.',
                                                'En 60 días define consolidación de señal y en 90 días ampliación de reputación.',
                                                'Incluye un indicador observable por horizonte.'
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
                                                '30 días: hacer visible síntesis ejecutiva en reuniones/reportes | indicador: 3 entregables visibles.',
                                                '60 días: criterio estratégico en espacios transversales | indicador: ser consultado en decisión relevante.',
                                                '90 días: reputación de referente interno/externo | indicador: mayor reconocimiento e invitaciones.'
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
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Horizonte</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué quiero haber hecho visible</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">En qué espacio</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Indicador de avance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibilitySection.visibilityTimelineRows.map((row, index) => (
                                                    <tr key={`wb7-visibility-timeline-${row.horizon}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.horizon}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.targetVisibleOutcome}
                                                                onChange={(event) => updateVisibilityTimelineRow(index, 'targetVisibleOutcome', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.space}
                                                                onChange={(event) => updateVisibilityTimelineRow(index, 'space', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.progressIndicator}
                                                                onChange={(event) => updateVisibilityTimelineRow(index, 'progressIndicator', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5 space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900">Esquema visual 30-60-90</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {visibilitySection.visibilityTimelineRows.map((row) => (
                                                <div key={`wb7-timeline-card-${row.horizon}`} className="rounded-xl border border-blue-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">{row.horizon}</p>
                                                    <p className="mt-2 text-sm font-semibold text-slate-800">
                                                        {row.targetVisibleOutcome || 'Define qué harás visible'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-600">{row.space || 'Define espacio'}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{row.progressIndicator || 'Define indicador'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVisibilityBlock('Paso 5 — Calendario 30-60-90')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de visibilidad estratégica</h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                visibilityTestCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {visibilityTestCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700 leading-relaxed">Instrucciones del paso:</p>
                                        <ul className="space-y-1.5">
                                            {[
                                                'Responde Sí/No basado en evidencia de diseño real del plan.',
                                                'Completa ajuste necesario cuando detectes brechas.',
                                                'Verifica coherencia entre señal, audiencia, prueba y calendario.'
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
                                                'Señal débil: “quiero que me vean más”.',
                                                'Señal mejorada: “quiero que alta dirección perciba síntesis estratégica y claridad en decisiones complejas, con pruebas concretas”.'
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
                                                {visibilitySection.visibilityTest.map((row, index) => (
                                                    <tr key={`wb7-visibility-test-${index}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100 w-[180px]">
                                                            <select
                                                                value={row.verdict}
                                                                onChange={(event) => updateVisibilityTestRow(index, 'verdict', event.target.value)}
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
                                                                onChange={(event) => updateVisibilityTestRow(index, 'adjustment', event.target.value)}
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
                                            onClick={() => saveVisibilityBlock('Paso 6 — Test de visibilidad estratégica')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                    <h3 className="text-base font-bold text-slate-900">Cierre de la sección</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Al finalizar, deberías poder responder con mayor claridad:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {[
                                            'Qué valor quieres hacer visible.',
                                            'Ante qué audiencias debe volverse visible.',
                                            'Qué pruebas sostienen esa visibilidad.',
                                            'En qué superficies conviene amplificar tu reputación.',
                                            'Cómo convertir la visibilidad en una práctica estratégica y no accidental.'
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
                                    {weakSignalVisibility && (
                                        <p className="text-sm text-amber-800">Sugerencia: aclara qué aporte específico quieres hacer visible.</p>
                                    )}
                                    {noVisibilityEvidence && (
                                        <p className="text-sm text-amber-800">Sugerencia: define qué prueba concreta sostiene esa señal.</p>
                                    )}
                                    {visibilitySurfaceOverconcentrated && (
                                        <p className="text-sm text-amber-800">
                                            Sugerencia: revisa si tu portafolio de visibilidad está demasiado concentrado.
                                        </p>
                                    )}
                                    {noTimelineIndicators && (
                                        <p className="text-sm text-amber-800">Sugerencia: agrega cómo medirás el avance de tu visibilidad.</p>
                                    )}
                                    {!weakSignalVisibility && !noVisibilityEvidence && !visibilitySurfaceOverconcentrated && !noTimelineIndicators && (
                                        <p className="text-sm text-emerald-700">
                                            Sin alertas: tu plan de visibilidad está bien anclado en valor, prueba y secuencia temporal.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-600 font-semibold">Estado de la sección</p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {section7Completed
                                                    ? 'Completado: auditoría, matriz, arquitectura, portafolio, calendario 30-60-90 y test diligenciados.'
                                                    : 'Pendiente: define señal visible, audiencias y horizonte 30-60-90, junto con los demás bloques.'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                section7Completed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {section7Completed ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article
                                className="wb7-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 8 de 8"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 8</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Evaluación</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Objetivo: permitir que mentor y líder evalúen con evidencia, definan decisiones por criterio y cierren con síntesis de
                                        acuerdos.
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
                                                        key={`wb7-evaluation-stage-${stage.key}`}
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
                                                    'Evalúa cada criterio con base en evidencia observable (idealmente de los últimos 20 días).',
                                                    'Marca un solo nivel por criterio (N1, N2, N3 o N4).',
                                                    'Registra comentario u observación concreta por criterio (hechos, conversación o conducta observada).',
                                                    'Define decisión por criterio: Consolidado, En desarrollo o Prioritario.',
                                                    'Cierra el WB con observaciones generales y una decisión global de seguimiento.'
                                                ].map((instruction) => (
                                                    <li key={`wb7-mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                                    <tr key={`wb7-mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
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
                                                    <article key={`wb7-mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                                key={`wb7-mentor-level-${index}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb7-mentor-level-${index}`}
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
                                                                        onChange={(event) => setMentorEvaluationField(index, 'evidence', event.target.value)}
                                                                        disabled={rowDisabled}
                                                                        className="w-full min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                        placeholder='Hechos observables (si falta evidencia, escribe "Completar").'
                                                                    />
                                                                </label>

                                                                <fieldset className="space-y-2">
                                                                    <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">
                                                                        Decisión del mentor
                                                                    </legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                            <label
                                                                                key={`wb7-mentor-decision-${index}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb7-mentor-decision-${index}`}
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
                                                                    <span className="font-semibold text-slate-900">Evidencia:</span> {row.evidence || 'Pendiente'}
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

                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre del mentor</h3>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                        mentorStageComplete
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-300 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {mentorStageComplete ? 'Completado' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Observaciones generales del mentor</span>
                                                <textarea
                                                    value={evaluation.mentorGeneralNotes}
                                                    onChange={(event) => setMentorGeneralNotes(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[120px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder="Resume hallazgos del mentor con evidencia concreta."
                                                />
                                            </label>
                                            <fieldset className="space-y-2">
                                                <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión global del WB</legend>
                                                <div className="flex flex-wrap gap-2">
                                                    {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                        <label
                                                            key={`wb7-global-decision-${decision}`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="wb7-global-decision"
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
                                                    <li key={`wb7-leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                    <article key={`wb7-leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                {evaluationSectionComplete ? 'WB7 Evaluación completada' : 'WB7 Evaluación en progreso'}
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
                                                        key={`wb7-evaluation-summary-criterion-${index}`}
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
                                        Guardar página 8
                                    </button>
                                </div>
                            </article>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb7-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={16} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{PAGES[currentPageIndex]?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
                                    {WORKBOOK_V2_EDITORIAL.labels.next}
                                    <ArrowRight size={16} />
                                </button>
                            </nav>
                        )}

                        {showStakeholderHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Mapeo de stakeholders</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStakeholderHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Stakeholder no es solo quien está cerca; incluye quien influye o puede incidir en resultados, visibilidad o acceso.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Nivel 1, 2 y 3 describen cercanía e impacto estratégico, no “importancia humana”.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una red estratégica se diseña con criterio y valor mutuo; no solo por proximidad o rutina.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            El mapa debe ayudarte a detectar sponsors, vacíos relacionales y relaciones de alto valor.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showSponsorHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Identificación de sponsors</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSponsorHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Sponsor ≠ mentor: el sponsor abre puertas, visibiliza y pone capital reputacional en juego.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Antes de pedir patrocinio, necesitas valor visible, relación suficiente y lectura política.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Un buen sponsor no siempre es la persona más cercana, sino quien combina influencia, credibilidad y disposición real.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Diseña primero qué aportas; luego activa la conversación de patrocinio.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showHighValueHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Red de alto valor</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowHighValueHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una red de alto valor no es la más grande, sino la más estratégica.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            El valor relacional puede venir por acceso, confianza, aprendizaje, reputación o amplificación.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Networking estratégico implica valor mutuo, no extracción unilateral.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una red madura combina mantenimiento, reciprocidad, reactivación y expansión consciente.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showConsciousNetworkingHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Estrategia de networking consciente</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowConsciousNetworkingHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Networking consciente no es acumular contactos, sino construir relaciones con intención y valor mutuo.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            No toda relación necesita la misma cadencia ni el mismo movimiento.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Una estrategia madura combina nutrición, reciprocidad, reactivación y expansión.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Si tu red depende solo de urgencias, sigue siendo circunstancial.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showVisibilityHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
                                <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Ayuda — Plan de visibilidad estratégica</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVisibilityHelp(false)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Visibilidad estratégica no es exposición por exposición: primero define qué valor quieres hacer visible.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            La reputación se fortalece cuando cada señal tiene evidencia concreta y coherencia sostenida.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Diseña superficies de visibilidad internas y externas para evitar sobreconcentración.
                                        </li>
                                        <li className="text-sm text-slate-700 leading-relaxed">
                                            Si tu valor existe pero no es visible para las audiencias correctas, pierde impacto estratégico.
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
                    .wb7-toolbar,
                    .wb7-sidebar,
                    .wb7-page-nav {
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

                    .wb7-print-page {
                        break-after: page;
                        page-break-after: always;
                        position: relative;
                    }

                    .wb7-print-page:not(.wb7-cover-page)::before {
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

                    .wb7-print-page::after {
                        content: attr(data-print-meta);
                        position: absolute;
                        bottom: -10mm;
                        left: 0;
                        font-size: 9px;
                        letter-spacing: 0.04em;
                        color: #475569;
                    }

                    .wb7-cover-page {
                        min-height: calc(297mm - 36mm);
                    }

                    .wb7-cover-page::before {
                        content: none !important;
                    }

                    .wb7-cover-hero {
                        min-height: 54vh !important;
                    }
                }
            `}</style>
        </div>
    )
}
