'use client'
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any */

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7
type YesNoAnswer = '' | 'yes' | 'no'
type MentorLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'
type MentorDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'
type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

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

type WB5State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    executiveMessageSection: {
        bluf: {
            bottomLine: string
            whyItMatters: string
            nowWhat: string
            supportOne: string
            supportTwo: string
            supportThree: string
        }
        pyramid: {
            motherIdea: string
            argumentOne: string
            proofOne: string
            argumentTwo: string
            proofTwo: string
            argumentThree: string
            proofThree: string
        }
        scqa: {
            situation: string
            complication: string
            question: string
            answer: string
        }
        clarityTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    languageEngineeringSection: {
        canvas: {
            requiredResult: string
            owner: string
            dateTime: string
            satisfactionCriteria: string
            contextMeaning: string
            expectedExplicitResponse: string
            followUpPoint: string
        }
        calibration: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
        activePromises: Array<{
            activePromise: string
            promisedTo: string
            agreedDate: string
            riskLevel: '' | 'Bajo' | 'Medio' | 'Alto'
            earlySignal: string
            preventiveAction: string
        }>
        renegotiationProtocol: {
            atRiskCommitment: string
            maxNotice: string
            objectiveChange: string
            alternativeProposal: string
            confirmationNeeded: string
        }
        traceabilityTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    influenceCommunicationSection: {
        matrix: {
            rational: string
            emotional: string
            decisional: string
        }
        levers: Array<{
            lever: string
            whatToSay: string
            weight: '' | 'Alta' | 'Media' | 'Baja'
        }>
        dualMessage: {
            contextOpening: string
            rationalCore: string
            emotionalCore: string
            decisionalClose: string
        }
        ethicalCheck: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    strategicConversationSection: {
        brief: {
            realTopic: string
            conversationalObjective: string
            minimumResult: string
            mainRisk: string
            trustToProtect: string
            explicitClosing: string
        }
        map: {
            myPosition: string
            myRealInterest: string
            counterpartLikelyPosition: string
            counterpartLikelyInterest: string
            centralRisk: string
            usefulMove: string
        }
        architecture: {
            opening: string
            context: string
            explorationQuestions: string
            mainApproach: string
            negotiationAdjustment: string
            closure: string
        }
        speechActs: Array<{
            speechAct: string
            whatIWillSayOrDo: string
        }>
        objections: Array<{
            likelyObjection: string
            whatToAcknowledge: string
            evidenceOrCriteria: string
            wayOutOrReframe: string
        }>
        closingRecord: {
            whatMustBeUnderstood: string
            explicitAgreement: string
            commitmentsByPart: string
            followUpMilestone: string
            ambiguityToAvoid: string
        }
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
    { id: 1, label: '1. Portada', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Estructura de mensaje ejecutivo', shortLabel: 'Mensaje ejecutivo' },
    { id: 4, label: '4. Ingeniería del lenguaje', shortLabel: 'Promesas y pedidos' },
    { id: 5, label: '5. Influencia racional y emocional', shortLabel: 'Influencia ética' },
    { id: 6, label: '6. Framework de conversación estratégica', shortLabel: 'Conversación estratégica' },
    { id: 7, label: '7. Evaluación', shortLabel: 'Evaluación' }
]

const STORAGE_KEY = 'workbooks-v2-wb5-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb5-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb5-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb5-presentation-seen'
const EXECUTIVE_TEST_QUESTIONS = [
    '¿La idea principal aparece rápido?',
    '¿La lógica del mensaje se sostiene?',
    '¿Queda claro qué debe pasar después?',
    '¿El mensaje es creíble y verificable?',
    '¿El nivel de detalle está bien calibrado?'
]
const LANGUAGE_CALIBRATION_QUESTIONS = [
    '¿El pedido define exactamente qué se necesita?',
    '¿La fecha es clara y realista?',
    '¿Las condiciones de satisfacción son verificables?',
    '¿La otra parte tiene capacidad real para asumirlo?',
    '¿Estoy dejando espacio para que acepte o renegocie?',
    '¿Podría rastrear este compromiso una semana después?'
]
const LANGUAGE_TRACEABILITY_QUESTIONS = [
    '¿Se entiende exactamente qué se pidió o prometió?',
    '¿Está claro quién es responsable?',
    '¿Está definida la fecha?',
    '¿Hay condiciones de satisfacción explícitas?',
    '¿Hubo confirmación o renegociación explícita?',
    '¿Quedó definido el seguimiento?'
]
const INFLUENCE_LEVERS = [
    'Evidencia / datos',
    'Riesgo / consecuencia',
    'Beneficio / oportunidad',
    'Valores compartidos',
    'Confianza / credibilidad',
    'Pertenencia / impacto en otros',
    'Sentido / propósito'
]
const INFLUENCE_ETHICS_QUESTIONS = [
    '¿Mi propuesta está respaldada con hechos o criterio?',
    '¿Estoy conectando con algo que realmente importa a la audiencia?',
    '¿Dejo espacio para escuchar y ajustar?',
    '¿Estoy influyendo sin imponer?',
    '¿Mi mensaje seguiría siendo sólido si me pidieran explicarlo mejor?'
]
const MENTOR_EVALUATION_CRITERIA = [
    'Claridad en pedidos y compromisos',
    'Capacidad de escucha activa',
    'Influencia ética sin imposición',
    'Manejo de conversaciones difíciles',
    'Generación de confianza conversacional'
] as const
const LEADER_EVALUATION_QUESTIONS = [
    '¿Escucho para entender o para responder?',
    '¿Qué conversación difícil estoy evitando actualmente?',
    '¿Qué error comunicacional repito con mayor frecuencia?',
    '¿Cómo reacciono cuando alguien desafía mi postura?',
    '¿Qué impacto tiene mi comunicación en la confianza del equipo?'
] as const
const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']
const MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 - Declarativo',
        descriptor: 'Pedidos ambiguos; evita conversaciones incómodas.'
    },
    {
        level: 'Nivel 2 - Consciente',
        descriptor: 'Reconoce fallas; mejora inconsistente.'
    },
    {
        level: 'Nivel 3 - Integrado',
        descriptor: 'Comunicación clara, escucha genuina y compromisos definidos.'
    },
    {
        level: 'Nivel 4 - Alineación Estratégica',
        descriptor: 'Ordena conversaciones complejas con firmeza y respeto.'
    }
] as const
const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - Mentor' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]
const STRATEGIC_SPEECH_ACT_ROWS = 7
const STRATEGIC_OBJECTION_ROWS = 3

const createDefaultEvaluationData = (): WB5State['evaluation'] => ({
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

const DEFAULT_STATE: WB5State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    executiveMessageSection: {
        bluf: {
            bottomLine: '',
            whyItMatters: '',
            nowWhat: '',
            supportOne: '',
            supportTwo: '',
            supportThree: ''
        },
        pyramid: {
            motherIdea: '',
            argumentOne: '',
            proofOne: '',
            argumentTwo: '',
            proofTwo: '',
            argumentThree: '',
            proofThree: ''
        },
        scqa: {
            situation: '',
            complication: '',
            question: '',
            answer: ''
        },
        clarityTest: EXECUTIVE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '',
            adjustment: ''
        }))
    },
    languageEngineeringSection: {
        canvas: {
            requiredResult: '',
            owner: '',
            dateTime: '',
            satisfactionCriteria: '',
            contextMeaning: '',
            expectedExplicitResponse: '',
            followUpPoint: ''
        },
        calibration: LANGUAGE_CALIBRATION_QUESTIONS.map((question) => ({
            question,
            verdict: '',
            adjustment: ''
        })),
        activePromises: [
            { activePromise: '', promisedTo: '', agreedDate: '', riskLevel: '', earlySignal: '', preventiveAction: '' },
            { activePromise: '', promisedTo: '', agreedDate: '', riskLevel: '', earlySignal: '', preventiveAction: '' },
            { activePromise: '', promisedTo: '', agreedDate: '', riskLevel: '', earlySignal: '', preventiveAction: '' }
        ],
        renegotiationProtocol: {
            atRiskCommitment: '',
            maxNotice: '',
            objectiveChange: '',
            alternativeProposal: '',
            confirmationNeeded: ''
        },
        traceabilityTest: LANGUAGE_TRACEABILITY_QUESTIONS.map((question) => ({
            question,
            verdict: '',
            adjustment: ''
        }))
    },
    influenceCommunicationSection: {
        matrix: {
            rational: '',
            emotional: '',
            decisional: ''
        },
        levers: INFLUENCE_LEVERS.map((lever) => ({
            lever,
            whatToSay: '',
            weight: ''
        })),
        dualMessage: {
            contextOpening: '',
            rationalCore: '',
            emotionalCore: '',
            decisionalClose: ''
        },
        ethicalCheck: INFLUENCE_ETHICS_QUESTIONS.map((question) => ({
            question,
            verdict: '',
            adjustment: ''
        }))
    },
    strategicConversationSection: {
        brief: {
            realTopic: '',
            conversationalObjective: '',
            minimumResult: '',
            mainRisk: '',
            trustToProtect: '',
            explicitClosing: ''
        },
        map: {
            myPosition: '',
            myRealInterest: '',
            counterpartLikelyPosition: '',
            counterpartLikelyInterest: '',
            centralRisk: '',
            usefulMove: ''
        },
        architecture: {
            opening: '',
            context: '',
            explorationQuestions: '',
            mainApproach: '',
            negotiationAdjustment: '',
            closure: ''
        },
        speechActs: Array.from({ length: STRATEGIC_SPEECH_ACT_ROWS }, () => ({
            speechAct: '',
            whatIWillSayOrDo: ''
        })),
        objections: Array.from({ length: STRATEGIC_OBJECTION_ROWS }, () => ({
            likelyObjection: '',
            whatToAcknowledge: '',
            evidenceOrCriteria: '',
            wayOutOrReframe: ''
        })),
        closingRecord: {
            whatMustBeUnderstood: '',
            explicitAgreement: '',
            commitmentsByPart: '',
            followUpMilestone: '',
            ambiguityToAvoid: ''
        }
    },
    evaluation: createDefaultEvaluationData()
}

const normalizeState = (raw: unknown): WB5State => {
    const parsed = typeof raw === 'object' && raw !== null ? (raw as Record<string, any>) : {}
    const executiveRaw = parsed.executiveMessageSection ?? {}
    const clarityRaw = Array.isArray(executiveRaw.clarityTest) ? executiveRaw.clarityTest : []
    const languageRaw = parsed.languageEngineeringSection ?? {}
    const calibrationRaw = Array.isArray(languageRaw.calibration) ? languageRaw.calibration : []
    const promisesRaw = Array.isArray(languageRaw.activePromises) ? languageRaw.activePromises : []
    const traceabilityRaw = Array.isArray(languageRaw.traceabilityTest) ? languageRaw.traceabilityTest : []
    const influenceRaw = parsed.influenceCommunicationSection ?? {}
    const leversRaw = Array.isArray(influenceRaw.levers) ? influenceRaw.levers : []
    const ethicalRaw = Array.isArray(influenceRaw.ethicalCheck) ? influenceRaw.ethicalCheck : []
    const strategicRaw = parsed.strategicConversationSection ?? {}
    const strategicSpeechRaw = Array.isArray(strategicRaw.speechActs) ? strategicRaw.speechActs : []
    const strategicObjectionsRaw = Array.isArray(strategicRaw.objections) ? strategicRaw.objections : []
    const evaluationRaw = parsed.evaluation ?? {}
    const mentorRowsRaw = Array.isArray(evaluationRaw.mentorRows) ? evaluationRaw.mentorRows : []
    const leaderRowsRaw = Array.isArray(evaluationRaw.leaderRows) ? evaluationRaw.leaderRows : []
    const normalizedRiskLevel = (value: unknown): '' | 'Bajo' | 'Medio' | 'Alto' => {
        if (value === 'Bajo' || value === 'Medio' || value === 'Alto') return value
        return ''
    }
    const normalizedLeverWeight = (value: unknown): '' | 'Alta' | 'Media' | 'Baja' => {
        if (value === 'Alta' || value === 'Media' || value === 'Baja') return value
        return ''
    }

    return {
        identification: {
            ...DEFAULT_STATE.identification,
            ...(parsed.identification ?? {})
        },
        executiveMessageSection: {
            bluf: {
                ...DEFAULT_STATE.executiveMessageSection.bluf,
                ...(executiveRaw.bluf ?? {})
            },
            pyramid: {
                ...DEFAULT_STATE.executiveMessageSection.pyramid,
                ...(executiveRaw.pyramid ?? {})
            },
            scqa: {
                ...DEFAULT_STATE.executiveMessageSection.scqa,
                ...(executiveRaw.scqa ?? {})
            },
            clarityTest: EXECUTIVE_TEST_QUESTIONS.map((question, index) => {
                const candidate = clarityRaw[index]
                return {
                    question,
                    verdict: candidate?.verdict === 'yes' || candidate?.verdict === 'no' ? candidate.verdict : '',
                    adjustment: typeof candidate?.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        languageEngineeringSection: {
            canvas: {
                ...DEFAULT_STATE.languageEngineeringSection.canvas,
                ...(languageRaw.canvas ?? {})
            },
            calibration: LANGUAGE_CALIBRATION_QUESTIONS.map((question, index) => {
                const candidate = calibrationRaw[index]
                return {
                    question,
                    verdict: candidate?.verdict === 'yes' || candidate?.verdict === 'no' ? candidate.verdict : '',
                    adjustment: typeof candidate?.adjustment === 'string' ? candidate.adjustment : ''
                }
            }),
            activePromises: DEFAULT_STATE.languageEngineeringSection.activePromises.map((row, index) => {
                const candidate = promisesRaw[index] ?? {}
                return {
                    activePromise: typeof candidate.activePromise === 'string' ? candidate.activePromise : row.activePromise,
                    promisedTo: typeof candidate.promisedTo === 'string' ? candidate.promisedTo : row.promisedTo,
                    agreedDate: typeof candidate.agreedDate === 'string' ? candidate.agreedDate : row.agreedDate,
                    riskLevel: normalizedRiskLevel(candidate.riskLevel),
                    earlySignal: typeof candidate.earlySignal === 'string' ? candidate.earlySignal : row.earlySignal,
                    preventiveAction: typeof candidate.preventiveAction === 'string' ? candidate.preventiveAction : row.preventiveAction
                }
            }),
            renegotiationProtocol: {
                ...DEFAULT_STATE.languageEngineeringSection.renegotiationProtocol,
                ...(languageRaw.renegotiationProtocol ?? {})
            },
            traceabilityTest: LANGUAGE_TRACEABILITY_QUESTIONS.map((question, index) => {
                const candidate = traceabilityRaw[index]
                return {
                    question,
                    verdict: candidate?.verdict === 'yes' || candidate?.verdict === 'no' ? candidate.verdict : '',
                    adjustment: typeof candidate?.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        influenceCommunicationSection: {
            matrix: {
                ...DEFAULT_STATE.influenceCommunicationSection.matrix,
                ...(influenceRaw.matrix ?? {})
            },
            levers: INFLUENCE_LEVERS.map((lever, index) => {
                const candidate = leversRaw[index] ?? {}
                return {
                    lever,
                    whatToSay: typeof candidate.whatToSay === 'string' ? candidate.whatToSay : '',
                    weight: normalizedLeverWeight(candidate.weight)
                }
            }),
            dualMessage: {
                ...DEFAULT_STATE.influenceCommunicationSection.dualMessage,
                ...(influenceRaw.dualMessage ?? {})
            },
            ethicalCheck: INFLUENCE_ETHICS_QUESTIONS.map((question, index) => {
                const candidate = ethicalRaw[index]
                return {
                    question,
                    verdict: candidate?.verdict === 'yes' || candidate?.verdict === 'no' ? candidate.verdict : '',
                    adjustment: typeof candidate?.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        strategicConversationSection: {
            brief: {
                ...DEFAULT_STATE.strategicConversationSection.brief,
                ...(strategicRaw.brief ?? {})
            },
            map: {
                ...DEFAULT_STATE.strategicConversationSection.map,
                ...(strategicRaw.map ?? {})
            },
            architecture: {
                ...DEFAULT_STATE.strategicConversationSection.architecture,
                ...(strategicRaw.architecture ?? {})
            },
            speechActs: DEFAULT_STATE.strategicConversationSection.speechActs.map((row, index) => {
                const candidate = strategicSpeechRaw[index] ?? {}
                return {
                    speechAct: typeof candidate.speechAct === 'string' ? candidate.speechAct : row.speechAct,
                    whatIWillSayOrDo:
                        typeof candidate.whatIWillSayOrDo === 'string'
                            ? candidate.whatIWillSayOrDo
                            : row.whatIWillSayOrDo
                }
            }),
            objections: DEFAULT_STATE.strategicConversationSection.objections.map((row, index) => {
                const candidate = strategicObjectionsRaw[index] ?? {}
                return {
                    likelyObjection: typeof candidate.likelyObjection === 'string' ? candidate.likelyObjection : row.likelyObjection,
                    whatToAcknowledge:
                        typeof candidate.whatToAcknowledge === 'string'
                            ? candidate.whatToAcknowledge
                            : row.whatToAcknowledge,
                    evidenceOrCriteria:
                        typeof candidate.evidenceOrCriteria === 'string'
                            ? candidate.evidenceOrCriteria
                            : row.evidenceOrCriteria,
                    wayOutOrReframe:
                        typeof candidate.wayOutOrReframe === 'string'
                            ? candidate.wayOutOrReframe
                            : row.wayOutOrReframe
                }
            }),
            closingRecord: {
                ...DEFAULT_STATE.strategicConversationSection.closingRecord,
                ...(strategicRaw.closingRecord ?? {})
            }
        },
        evaluation: {
            mentorRows: MENTOR_EVALUATION_CRITERIA.map((criterion, index) => {
                const candidate = mentorRowsRaw[index] ?? {}
                const safeLevel = MENTOR_LEVEL_OPTIONS.includes(candidate.level as MentorLevel)
                    ? (candidate.level as MentorLevel)
                    : ''
                const safeDecision = MENTOR_DECISION_OPTIONS.includes(candidate.decision as MentorDecision)
                    ? (candidate.decision as MentorDecision)
                    : ''
                return {
                    criterion,
                    level: safeLevel,
                    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
                    decision: safeDecision
                }
            }),
            mentorGeneralNotes:
                typeof evaluationRaw.mentorGeneralNotes === 'string' ? evaluationRaw.mentorGeneralNotes : '',
            mentorGlobalDecision: MENTOR_DECISION_OPTIONS.includes(evaluationRaw.mentorGlobalDecision as MentorDecision)
                ? (evaluationRaw.mentorGlobalDecision as MentorDecision)
                : '',
            leaderRows: LEADER_EVALUATION_QUESTIONS.map((question, index) => {
                const candidate = leaderRowsRaw[index] ?? {}
                return {
                    question,
                    response: typeof candidate.response === 'string' ? candidate.response : '',
                    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
                    action: typeof candidate.action === 'string' ? candidate.action : ''
                }
            }),
            agreementsSynthesis:
                typeof evaluationRaw.agreementsSynthesis === 'string' ? evaluationRaw.agreementsSynthesis : ''
        }
    }
}

export function WB5Digital() {
    const [state, setState] = useState<WB5State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showExecutiveHelp, setShowExecutiveHelp] = useState(false)
    const [showExecutiveExampleStep1, setShowExecutiveExampleStep1] = useState(false)
    const [showExecutiveExampleStep2, setShowExecutiveExampleStep2] = useState(false)
    const [showExecutiveExampleStep3, setShowExecutiveExampleStep3] = useState(false)
    const [showExecutiveExampleStep4, setShowExecutiveExampleStep4] = useState(false)
    const [showLanguageHelp, setShowLanguageHelp] = useState(false)
    const [showLanguageExampleStep1, setShowLanguageExampleStep1] = useState(false)
    const [showLanguageExampleStep2, setShowLanguageExampleStep2] = useState(false)
    const [showLanguageExampleStep3, setShowLanguageExampleStep3] = useState(false)
    const [showLanguageExampleStep4, setShowLanguageExampleStep4] = useState(false)
    const [showLanguageExampleStep5, setShowLanguageExampleStep5] = useState(false)
    const [showLanguageCanvasPreview, setShowLanguageCanvasPreview] = useState(false)
    const [showInfluenceHelp, setShowInfluenceHelp] = useState(false)
    const [showInfluenceExampleStep1, setShowInfluenceExampleStep1] = useState(false)
    const [showInfluenceExampleStep2, setShowInfluenceExampleStep2] = useState(false)
    const [showInfluenceExampleStep3, setShowInfluenceExampleStep3] = useState(false)
    const [showInfluenceExampleStep4, setShowInfluenceExampleStep4] = useState(false)
    const [showStrategicHelp, setShowStrategicHelp] = useState(false)
    const [showStrategicExampleStep1, setShowStrategicExampleStep1] = useState(false)
    const [showStrategicExampleStep2, setShowStrategicExampleStep2] = useState(false)
    const [showStrategicExampleStep3, setShowStrategicExampleStep3] = useState(false)
    const [showStrategicExampleStep4, setShowStrategicExampleStep4] = useState(false)
    const [showStrategicExampleStep5, setShowStrategicExampleStep5] = useState(false)
    const [showStrategicExampleStep6, setShowStrategicExampleStep6] = useState(false)
    const [showStrategicMapPreview, setShowStrategicMapPreview] = useState(false)
    const [showStrategicTimelinePreview, setShowStrategicTimelinePreview] = useState(false)
    const [mentorEvaluationEditModes, setMentorEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: MENTOR_EVALUATION_CRITERIA.length }, () => false)
    )
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: LEADER_EVALUATION_QUESTIONS.length }, () => false)
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
                    setActivePage(!introSeen && parsed > 2 ? 1 : (parsed as WorkbookPageId))
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
        if (!hasSeenPresentationOnce && pageId > 2) {
            setActivePage(2)
            markVisited(2)
            announceSave('Revisa primero la Presentación del workbook.')
            return
        }

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
        announceSave(`Página ${pageId} guardada.`)
    }

    const updateIdentification = (field: keyof WB5State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateBluf = (
        field: keyof WB5State['executiveMessageSection']['bluf'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                bluf: {
                    ...prev.executiveMessageSection.bluf,
                    [field]: value
                }
            }
        }))
    }

    const updatePyramid = (
        field: keyof WB5State['executiveMessageSection']['pyramid'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                pyramid: {
                    ...prev.executiveMessageSection.pyramid,
                    [field]: value
                }
            }
        }))
    }

    const updateScqa = (
        field: keyof WB5State['executiveMessageSection']['scqa'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                scqa: {
                    ...prev.executiveMessageSection.scqa,
                    [field]: value
                }
            }
        }))
    }

    const updateExecutiveTest = (
        rowIndex: number,
        field: keyof WB5State['executiveMessageSection']['clarityTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            executiveMessageSection: {
                ...prev.executiveMessageSection,
                clarityTest: prev.executiveMessageSection.clarityTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveExecutiveBlock = (blockLabel: string) => {
        markVisited(3)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateLanguageCanvas = (
        field: keyof WB5State['languageEngineeringSection']['canvas'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            languageEngineeringSection: {
                ...prev.languageEngineeringSection,
                canvas: {
                    ...prev.languageEngineeringSection.canvas,
                    [field]: value
                }
            }
        }))
    }

    const updateLanguageCalibration = (
        rowIndex: number,
        field: keyof WB5State['languageEngineeringSection']['calibration'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            languageEngineeringSection: {
                ...prev.languageEngineeringSection,
                calibration: prev.languageEngineeringSection.calibration.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const updateLanguagePromiseRow = (
        rowIndex: number,
        field: keyof WB5State['languageEngineeringSection']['activePromises'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            languageEngineeringSection: {
                ...prev.languageEngineeringSection,
                activePromises: prev.languageEngineeringSection.activePromises.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'riskLevel'
                                      ? value === 'Bajo' || value === 'Medio' || value === 'Alto'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateLanguageRenegotiation = (
        field: keyof WB5State['languageEngineeringSection']['renegotiationProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            languageEngineeringSection: {
                ...prev.languageEngineeringSection,
                renegotiationProtocol: {
                    ...prev.languageEngineeringSection.renegotiationProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateLanguageTraceability = (
        rowIndex: number,
        field: keyof WB5State['languageEngineeringSection']['traceabilityTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            languageEngineeringSection: {
                ...prev.languageEngineeringSection,
                traceabilityTest: prev.languageEngineeringSection.traceabilityTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveLanguageBlock = (blockLabel: string) => {
        markVisited(4)
        if (blockLabel === 'Paso 1') {
            setShowLanguageCanvasPreview(true)
        }
        announceSave(`${blockLabel} guardado.`)
    }

    const updateInfluenceMatrix = (
        field: keyof WB5State['influenceCommunicationSection']['matrix'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            influenceCommunicationSection: {
                ...prev.influenceCommunicationSection,
                matrix: {
                    ...prev.influenceCommunicationSection.matrix,
                    [field]: value
                }
            }
        }))
    }

    const updateInfluenceLever = (
        rowIndex: number,
        field: keyof WB5State['influenceCommunicationSection']['levers'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            influenceCommunicationSection: {
                ...prev.influenceCommunicationSection,
                levers: prev.influenceCommunicationSection.levers.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'weight'
                                      ? value === 'Alta' || value === 'Media' || value === 'Baja'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateInfluenceDual = (
        field: keyof WB5State['influenceCommunicationSection']['dualMessage'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            influenceCommunicationSection: {
                ...prev.influenceCommunicationSection,
                dualMessage: {
                    ...prev.influenceCommunicationSection.dualMessage,
                    [field]: value
                }
            }
        }))
    }

    const updateInfluenceEthics = (
        rowIndex: number,
        field: keyof WB5State['influenceCommunicationSection']['ethicalCheck'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            influenceCommunicationSection: {
                ...prev.influenceCommunicationSection,
                ethicalCheck: prev.influenceCommunicationSection.ethicalCheck.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveInfluenceBlock = (blockLabel: string) => {
        markVisited(5)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateStrategicBrief = (
        field: keyof WB5State['strategicConversationSection']['brief'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicConversationSection: {
                ...prev.strategicConversationSection,
                brief: {
                    ...prev.strategicConversationSection.brief,
                    [field]: value
                }
            }
        }))
    }

    const updateStrategicMap = (
        field: keyof WB5State['strategicConversationSection']['map'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicConversationSection: {
                ...prev.strategicConversationSection,
                map: {
                    ...prev.strategicConversationSection.map,
                    [field]: value
                }
            }
        }))
    }

    const updateStrategicArchitecture = (
        field: keyof WB5State['strategicConversationSection']['architecture'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicConversationSection: {
                ...prev.strategicConversationSection,
                architecture: {
                    ...prev.strategicConversationSection.architecture,
                    [field]: value
                }
            }
        }))
    }

    const updateStrategicSpeechAct = (
        rowIndex: number,
        field: keyof WB5State['strategicConversationSection']['speechActs'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicConversationSection: {
                ...prev.strategicConversationSection,
                speechActs: prev.strategicConversationSection.speechActs.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateStrategicObjection = (
        rowIndex: number,
        field: keyof WB5State['strategicConversationSection']['objections'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicConversationSection: {
                ...prev.strategicConversationSection,
                objections: prev.strategicConversationSection.objections.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateStrategicClosing = (
        field: keyof WB5State['strategicConversationSection']['closingRecord'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicConversationSection: {
                ...prev.strategicConversationSection,
                closingRecord: {
                    ...prev.strategicConversationSection.closingRecord,
                    [field]: value
                }
            }
        }))
    }

    const saveStrategicBlock = (blockLabel: string) => {
        markVisited(6)
        if (blockLabel === 'Paso 2') {
            setShowStrategicMapPreview(true)
        }
        if (blockLabel === 'Paso 3') {
            setShowStrategicTimelinePreview(true)
        }
        announceSave(`${blockLabel} guardado.`)
    }

    const isMentorEvaluationRowComplete = (row: MentorEvaluationRow) =>
        row.level !== '' && row.evidence.trim().length > 0 && row.decision !== ''

    const isLeaderEvaluationRowComplete = (row: LeaderEvaluationRow) =>
        row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0

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
            nextRows[index] = { ...row, evidence: row.evidence.trim() }
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
            document.title = 'WB5 - Comunicación ejecutiva y estratégica'
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
            link.download = 'WB5-comunicacion-ejecutiva-estrategica-completo.html'
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

    const computeTokenSimilarity = (left: string, right: string) => {
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

    const executiveBluf = state.executiveMessageSection.bluf
    const executivePyramid = state.executiveMessageSection.pyramid
    const executiveScqa = state.executiveMessageSection.scqa
    const executiveClarityTest = state.executiveMessageSection.clarityTest
    const languageCanvas = state.languageEngineeringSection.canvas
    const languageCalibration = state.languageEngineeringSection.calibration
    const languagePromises = state.languageEngineeringSection.activePromises
    const languageRenegotiation = state.languageEngineeringSection.renegotiationProtocol
    const languageTraceability = state.languageEngineeringSection.traceabilityTest
    const influenceMatrix = state.influenceCommunicationSection.matrix
    const influenceLevers = state.influenceCommunicationSection.levers
    const influenceDual = state.influenceCommunicationSection.dualMessage
    const influenceEthics = state.influenceCommunicationSection.ethicalCheck
    const strategicBrief = state.strategicConversationSection.brief
    const strategicMap = state.strategicConversationSection.map
    const strategicArchitecture = state.strategicConversationSection.architecture
    const strategicSpeechActs = state.strategicConversationSection.speechActs
    const strategicObjections = state.strategicConversationSection.objections
    const strategicClosing = state.strategicConversationSection.closingRecord

    const blufCompleted = Object.values(executiveBluf).every((value) => value.trim().length > 0)
    const pyramidCompleted = Object.values(executivePyramid).every((value) => value.trim().length > 0)
    const scqaCompleted = Object.values(executiveScqa).every((value) => value.trim().length > 0)
    const executiveTestCompleted = executiveClarityTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const executiveSectionCompleted = blufCompleted && pyramidCompleted && scqaCompleted && executiveTestCompleted
    const languageCanvasCompleted = Object.values(languageCanvas).every((value) => value.trim().length > 0)
    const languageCalibrationCompleted = languageCalibration.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const languagePromisesCompleted = languagePromises.every((row) =>
        Object.values(row).every((value) => value.toString().trim().length > 0)
    )
    const languageRenegotiationCompleted = Object.values(languageRenegotiation).every((value) => value.trim().length > 0)
    const languageTraceabilityCompleted = languageTraceability.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const languageSectionCompleted =
        languageCanvasCompleted &&
        languageCalibrationCompleted &&
        languagePromisesCompleted &&
        languageRenegotiationCompleted &&
        languageTraceabilityCompleted
    const influenceMatrixCompleted = Object.values(influenceMatrix).every((value) => value.trim().length > 0)
    const influenceLeversCompleted = influenceLevers.every(
        (row) => row.whatToSay.trim().length > 0 && row.weight !== ''
    )
    const influenceDualCompleted = Object.values(influenceDual).every((value) => value.trim().length > 0)
    const influenceEthicsCompleted = influenceEthics.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)
    const influenceSectionCompleted =
        influenceMatrixCompleted && influenceLeversCompleted && influenceDualCompleted && influenceEthicsCompleted
    const strategicBriefCompleted = Object.values(strategicBrief).every((value) => value.trim().length > 0)
    const strategicMapCompleted = Object.values(strategicMap).every((value) => value.trim().length > 0)
    const strategicArchitectureCompleted = Object.values(strategicArchitecture).every((value) => value.trim().length > 0)
    const strategicSpeechActsCompleted = strategicSpeechActs.every(
        (row) => row.speechAct.trim().length > 0 && row.whatIWillSayOrDo.trim().length > 0
    )
    const strategicObjectionsCompleted = strategicObjections.every((row) =>
        Object.values(row).every((value) => value.trim().length > 0)
    )
    const strategicClosingCompleted = Object.values(strategicClosing).every((value) => value.trim().length > 0)
    const strategicSectionCompleted =
        strategicBriefCompleted &&
        strategicMapCompleted &&
        strategicArchitectureCompleted &&
        strategicSpeechActsCompleted &&
        strategicObjectionsCompleted &&
        strategicClosingCompleted

    const bottomLineWordCount = executiveBluf.bottomLine.trim().split(/\s+/).filter(Boolean).length
    const bottomLineTooLong = bottomLineWordCount > 18

    const argumentTexts = [
        executivePyramid.argumentOne,
        executivePyramid.argumentTwo,
        executivePyramid.argumentThree
    ]
        .map((argument) => argument.trim())
        .filter(Boolean)
    const repeatedArgumentByText = argumentTexts.some((argument, index) => argumentTexts.indexOf(argument) !== index)
    let repeatedArgumentBySimilarity = false
    for (let index = 0; index < argumentTexts.length; index += 1) {
        for (let comparison = index + 1; comparison < argumentTexts.length; comparison += 1) {
            if (computeTokenSimilarity(argumentTexts[index], argumentTexts[comparison]) > 0.86) {
                repeatedArgumentBySimilarity = true
            }
        }
    }
    const pyramidArgumentsRepetitive = repeatedArgumentByText || repeatedArgumentBySimilarity

    const scqaMisaligned =
        executiveScqa.question.trim().length > 0 &&
        executiveScqa.answer.trim().length > 0 &&
        computeTokenSimilarity(executiveScqa.question, executiveScqa.answer) < 0.08

    const actionClarityNeedsAdjustment = executiveClarityTest[2]?.verdict === 'no'
    const languageCanvasHasContent = Object.values(languageCanvas).some((value) => value.trim().length > 0)
    const missingLanguageDate = languageCanvasHasContent && languageCanvas.dateTime.trim().length === 0
    const missingLanguageSatisfaction = languageCanvasHasContent && languageCanvas.satisfactionCriteria.trim().length === 0
    const missingLanguageConfirmation = languageCanvasHasContent && languageCanvas.expectedExplicitResponse.trim().length === 0
    const highRiskWithoutPreventiveAction = languagePromises.some(
        (row) => row.riskLevel === 'Alto' && row.preventiveAction.trim().length === 0
    )
    const hasHighRiskPromise = languagePromises.some((row) => row.riskLevel === 'Alto')
    const hasRenegotiationPlan =
        languageRenegotiation.atRiskCommitment.trim().length > 0 &&
        languageRenegotiation.maxNotice.trim().length > 0 &&
        languageRenegotiation.alternativeProposal.trim().length > 0 &&
        languageRenegotiation.confirmationNeeded.trim().length > 0
    const highRiskWithoutRenegotiation = hasHighRiskPromise && !hasRenegotiationPlan
    const rationalSignals = ['dato', 'datos', 'criterio', 'riesgo', 'consecuencia', 'impacto', 'evidencia', 'si ', 'porque']
    const hasRationalSignal = rationalSignals.some((signal) => influenceMatrix.rational.toLowerCase().includes(signal))
    const rationalNeedsSupport = influenceMatrix.rational.trim().length > 0 && !hasRationalSignal
    const emotionalSignals = [
        'valor',
        'confianza',
        'equipo',
        'importa',
        'preocup',
        'aspira',
        'sentido',
        'riesgo',
        'beneficio'
    ]
    const hasEmotionalSignal = emotionalSignals.some((signal) => influenceMatrix.emotional.toLowerCase().includes(signal))
    const emotionalNeedsSupport = influenceMatrix.emotional.trim().length > 0 && !hasEmotionalSignal
    const decisionalSignals = ['decidir', 'acordar', 'definir', 'hacer', 'confirmar', 'aprobar', 'priorizar', 'siguiente']
    const hasDecisionalSignal = decisionalSignals.some((signal) =>
        influenceDual.decisionalClose.toLowerCase().includes(signal)
    )
    const decisionalNeedsSupport = influenceDual.decisionalClose.trim().length > 0 && !hasDecisionalSignal
    const strategicObjectiveSignals = ['definir', 'acord', 'decid', 'renegoci', 'aline', 'movil', 'cerrar', 'destrabar']
    const hasStrategicObjectiveSignal = strategicObjectiveSignals.some((signal) =>
        strategicBrief.conversationalObjective.toLowerCase().includes(signal)
    )
    const strategicObjectiveNeedsAdjustment =
        strategicBrief.conversationalObjective.trim().length > 0 && !hasStrategicObjectiveSignal
    const strategicExplorationMissing =
        strategicArchitecture.explorationQuestions.trim().length === 0 &&
        Object.values(strategicArchitecture).some((value) => value.trim().length > 0)
    const strategicClosingMissing =
        strategicClosing.explicitAgreement.trim().length === 0 ||
        strategicClosing.followUpMilestone.trim().length === 0
    const strategicObjectionsWithoutEvidence = strategicObjections.some(
        (row) =>
            (row.likelyObjection.trim().length > 0 ||
                row.whatToAcknowledge.trim().length > 0 ||
                row.wayOutOrReframe.trim().length > 0) &&
            row.evidenceOrCriteria.trim().length === 0
    )
    const mentorCompletedRows = state.evaluation.mentorRows.filter((row) => isMentorEvaluationRowComplete(row)).length
    const leaderCompletedRows = state.evaluation.leaderRows.filter((row) => isLeaderEvaluationRowComplete(row)).length
    const mentorStageComplete =
        mentorCompletedRows === state.evaluation.mentorRows.length &&
        state.evaluation.mentorGeneralNotes.trim().length > 0 &&
        state.evaluation.mentorGlobalDecision !== ''
    const leaderStageComplete = leaderCompletedRows === state.evaluation.leaderRows.length
    const synthesisStageComplete = state.evaluation.agreementsSynthesis.trim().length > 0
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

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: executiveSectionCompleted,
        4: languageSectionCompleted,
        5: influenceSectionCompleted,
        6: strategicSectionCompleted,
        7: evaluationSectionComplete
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb5-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="min-w-0 flex-1 sm:mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB5 - Comunicación ejecutiva y estratégica</p>
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
                        Guardar página {activePage}
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
                    <aside className={`wb5-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                                className="wb5-print-page wb5-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 7"
                                data-print-title="Portada"
                                data-cover-page="true"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb5-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Comunicación ejecutiva y estratégica
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 5</p>
                                        <p className="text-blue-600 text-sm">Sistema: 4Shine® · Pilar: Shine Out (Presencia estratégica)</p>
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
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 7"
                                data-print-title="Presentación del workbook"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 2</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Presentación del workbook</h2>
                                </header>

                                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-5 md:p-7">
                                    <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Una estructura más precisa para la comunicación de impacto.',
                                            'Un método para construir mensajes ejecutivos claros y útiles.',
                                            'Herramientas para formular pedidos y promesas con mayor precisión.',
                                            'Una comprensión más estratégica de la influencia racional y emocional.',
                                            'Un framework de conversación estratégica aplicable a conversaciones clave.'
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
                                                'Comunicación de impacto.',
                                                'Influencia positiva.',
                                                'Competencia conversacional (ontológica).'
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
                                                'Escucha Activa y Empática.',
                                                'Adaptabilidad Comunicativa.',
                                                'Construcción de confianza (Trust).',
                                                'Influencia ética y persuasión.',
                                                'Reconocimiento y Feedback.',
                                                'Ingeniería del lenguaje (promesas y pedidos).'
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
                                            'Presta atención plena (mindfulness) cuando un colaborador habla, parafraseando para confirmar entendimiento y validando los aportes.',
                                            'Se "pone en los zapatos" de sus colegas para construir relaciones de confianza y seguridad psicológica.',
                                            'Lee a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.',
                                            'Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado.',
                                            'Comparte información relevante de manera oportuna y honesta (transparencia), incluso las malas noticias.',
                                            'Admite abiertamente cuando "no sabe" algo y trata a todos con respeto, eliminando el miedo a represalias por reportar problemas.',
                                            'Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo.',
                                            'Reconoce públicamente los logros y da crédito explícito a los colaboradores por sus contribuciones, fomentando el orgullo colectivo.',
                                            'Brinda feedback privado, específico y centrado en la conducta (no en la persona) para corregir el rumbo y desarrollar talento.',
                                            'Hace pedidos impecables (con condiciones de satisfacción y tiempos claros) para evitar retrabajos.',
                                            'Gestiona sus promesas: si no puede cumplir, revoca o renegocia a tiempo, manteniendo la confianza.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Reglas de oro (para ti)</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'No respondas desde intención; responde desde conversaciones reales y recientes.',
                                            'No evalúes solo lo que dices; observa también qué efecto produce tu comunicación.',
                                            'No confundas hablar mucho con comunicar bien.',
                                            'No des por hecho que el otro entendió; verifica.',
                                            'No formules pedidos ambiguos esperando que otros “entiendan solos”.',
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
                                        className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                    >
                                        Guardar página 2
                                    </button>
                                </div>
                            </article>
                        )}

                        {isPageVisible(3) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 7"
                                data-print-title="Estructura de mensaje ejecutivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Estructura de mensaje ejecutivo
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Estructura mensajes ejecutivos con claridad, jerarquía y capacidad de acción para reducir ambigüedad y dejar claro qué debe decidirse, hacerse o acordarse.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Mensaje ejecutivo: comunicación breve, jerarquizada y orientada a decisión.',
                                            'BLUF: pone la conclusión al inicio para acelerar comprensión.',
                                            'Pirámide ejecutiva: idea central superior con argumentos y evidencias de soporte.',
                                            'SCQA ejecutivo: situación, complicación, pregunta y respuesta.',
                                            'Accionabilidad: deja claro qué debe decidirse, hacerse o confirmarse.',
                                            'Condición de satisfacción: define cómo se ve un resultado bien hecho.',
                                            'Confianza conversacional: mensaje claro, honesto y consistente que evita retrabajo.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — BLUF ejecutivo (Bottom Line Up Front)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    blufCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {blufCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700">
                                        Empieza por lo esencial: conclusión, relevancia, acción esperada y soporte mínimo.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Bottom line (idea principal)</span>
                                            <textarea
                                                rows={2}
                                                value={executiveBluf.bottomLine}
                                                onChange={(event) => updateBluf('bottomLine', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Por qué importa (so what)</span>
                                            <textarea
                                                rows={2}
                                                value={executiveBluf.whyItMatters}
                                                onChange={(event) => updateBluf('whyItMatters', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Qué debe pasar ahora (now what)</span>
                                            <textarea
                                                rows={2}
                                                value={executiveBluf.nowWhat}
                                                onChange={(event) => updateBluf('nowWhat', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Soporte mínimo 1</span>
                                            <input
                                                type="text"
                                                value={executiveBluf.supportOne}
                                                onChange={(event) => updateBluf('supportOne', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Soporte mínimo 2</span>
                                            <input
                                                type="text"
                                                value={executiveBluf.supportTwo}
                                                onChange={(event) => updateBluf('supportTwo', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Soporte mínimo 3</span>
                                            <input
                                                type="text"
                                                value={executiveBluf.supportThree}
                                                onChange={(event) => updateBluf('supportThree', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {bottomLineTooLong && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: reduce la idea principal a una frase más nítida.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Pirámide ejecutiva 1–3–3</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pyramidCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pyramidCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 1 — Idea madre</span>
                                        <textarea
                                            rows={2}
                                            value={executivePyramid.motherIdea}
                                            onChange={(event) => updatePyramid('motherIdea', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 2 — Argumento 1</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.argumentOne}
                                                    onChange={(event) => updatePyramid('argumentOne', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 3 — Prueba / implicación 1</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.proofOne}
                                                    onChange={(event) => updatePyramid('proofOne', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        </div>
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 2 — Argumento 2</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.argumentTwo}
                                                    onChange={(event) => updatePyramid('argumentTwo', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 3 — Prueba / implicación 2</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.proofTwo}
                                                    onChange={(event) => updatePyramid('proofTwo', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        </div>
                                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 2 — Argumento 3</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.argumentThree}
                                                    onChange={(event) => updatePyramid('argumentThree', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                            <label className="space-y-1">
                                                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nivel 3 — Prueba / implicación 3</span>
                                                <textarea
                                                    rows={3}
                                                    value={executivePyramid.proofThree}
                                                    onChange={(event) => updatePyramid('proofThree', event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 md:p-5">
                                        <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Esquema visual de la pirámide 1–3–3</p>
                                        <div className="mt-3 space-y-4">
                                            <div className="mx-auto max-w-2xl rounded-xl border border-blue-200 bg-white p-4 text-center shadow-sm">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Idea madre</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    {executivePyramid.motherIdea.trim() || 'Completa la idea madre para visualizarla aquí'}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    { title: 'Argumento 1', argument: executivePyramid.argumentOne, proof: executivePyramid.proofOne },
                                                    { title: 'Argumento 2', argument: executivePyramid.argumentTwo, proof: executivePyramid.proofTwo },
                                                    { title: 'Argumento 3', argument: executivePyramid.argumentThree, proof: executivePyramid.proofThree }
                                                ].map((item) => (
                                                    <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.title}</p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-800">{item.argument.trim() || 'Sin argumento'}</p>
                                                        <div className="mt-2 h-px bg-slate-200" />
                                                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Prueba / implicación</p>
                                                        <p className="mt-1 text-sm text-slate-700">{item.proof.trim() || 'Sin prueba'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {pyramidArgumentsRepetitive && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: diferencia mejor cada argumento para evitar repeticiones.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — SCQA ejecutivo</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    scqaCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {scqaCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Situación</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.situation}
                                                onChange={(event) => updateScqa('situation', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Complicación</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.complication}
                                                onChange={(event) => updateScqa('complication', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Pregunta / decisión que se abre</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.question}
                                                onChange={(event) => updateScqa('question', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Respuesta / propuesta</span>
                                            <textarea
                                                rows={2}
                                                value={executiveScqa.answer}
                                                onChange={(event) => updateScqa('answer', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {scqaMisaligned && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: alinea mejor la propuesta con la tensión planteada en la pregunta.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Test de claridad, lógica y accionabilidad</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExecutiveExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    executiveTestCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {executiveTestCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        Ajuste necesario
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {executiveClarityTest.map((row, rowIndex) => (
                                                    <tr key={`executive-check-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`executive-check-${rowIndex}`}
                                                                    checked={row.verdict === 'yes'}
                                                                    onChange={() => updateExecutiveTest(rowIndex, 'verdict', 'yes')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`executive-check-${rowIndex}`}
                                                                    checked={row.verdict === 'no'}
                                                                    onChange={() => updateExecutiveTest(rowIndex, 'verdict', 'no')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateExecutiveTest(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Escribe ajuste o Completar"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {actionClarityNeedsAdjustment && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define explícitamente qué debe decidirse, hacerse o confirmarse.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveExecutiveBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            '¿Cuál es la idea central que debe ir primero?',
                                            '¿Cómo organizar un mensaje con jerarquía y soporte?',
                                            '¿Cuándo usar BLUF y cuándo usar SCQA?',
                                            '¿Cómo traducir una idea en una estructura accionable?',
                                            '¿Cómo saber si tu mensaje está listo para una audiencia ejecutiva?'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                executiveSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {executiveSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(3)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 3
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(4) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 7"
                                data-print-title="Ingeniería del lenguaje (promesas y pedidos)"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Ingeniería del lenguaje (promesas y pedidos)
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Domina pedidos y promesas con precisión conversacional para reducir ambigüedad, evitar retrabajos y fortalecer la confianza en las relaciones de trabajo.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Pedido impecable: define qué se requiere, quién lo hace, para cuándo, cómo se evalúa y qué compromiso explícito hubo.',
                                            'Promesa confiable: se cumple o se renegocia a tiempo antes del vencimiento.',
                                            'Condiciones de satisfacción: criterios verificables de contenido, calidad, formato y alcance.',
                                            'Confirmación explícita: sí, no, condición o contrapropuesta; nunca suposición.',
                                            'Renegociación: ajuste de alcance, fecha o formato antes del incumplimiento.',
                                            'Quiebre conversacional: brecha entre lo esperado y lo posible que exige aclarar o renegociar.',
                                            'Trazabilidad: reconstruir con claridad qué se pidió, quién aceptó, fecha y seguimiento.',
                                            'Ambigüedad operativa: zona gris donde no queda claro quién hace qué, para cuándo y con qué estándar.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Canvas del pedido impecable</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowLanguageExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    languageCanvasCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {languageCanvasCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Resultado requerido</span>
                                            <textarea
                                                rows={2}
                                                value={languageCanvas.requiredResult}
                                                onChange={(event) => updateLanguageCanvas('requiredResult', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Responsable</span>
                                            <input
                                                type="text"
                                                value={languageCanvas.owner}
                                                onChange={(event) => updateLanguageCanvas('owner', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Fecha y hora</span>
                                            <input
                                                type="text"
                                                value={languageCanvas.dateTime}
                                                onChange={(event) => updateLanguageCanvas('dateTime', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Ej: Miércoles 4:00 p. m."
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Condiciones de satisfacción</span>
                                            <textarea
                                                rows={2}
                                                value={languageCanvas.satisfactionCriteria}
                                                onChange={(event) => updateLanguageCanvas('satisfactionCriteria', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Contexto y sentido</span>
                                            <textarea
                                                rows={2}
                                                value={languageCanvas.contextMeaning}
                                                onChange={(event) => updateLanguageCanvas('contextMeaning', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">6. Respuesta explícita esperada</span>
                                            <textarea
                                                rows={2}
                                                value={languageCanvas.expectedExplicitResponse}
                                                onChange={(event) => updateLanguageCanvas('expectedExplicitResponse', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Sí / No / Propuesta alternativa"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">7. Punto de seguimiento</span>
                                            <input
                                                type="text"
                                                value={languageCanvas.followUpPoint}
                                                onChange={(event) => updateLanguageCanvas('followUpPoint', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        {missingLanguageDate && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                                Sugerencia: aclara para cuándo lo necesitas.
                                            </p>
                                        )}
                                        {missingLanguageSatisfaction && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                                Sugerencia: define cómo se verá que está bien hecho.
                                            </p>
                                        )}
                                        {missingLanguageConfirmation && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                                Sugerencia: verifica si hubo compromiso real o solo suposición.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveLanguageBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>

                                    {(showLanguageCanvasPreview || languageCanvasCompleted) && (
                                        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 md:p-5 space-y-3">
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Canvas visual del pedido</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {[
                                                    { label: 'Resultado requerido', value: languageCanvas.requiredResult },
                                                    { label: 'Responsable', value: languageCanvas.owner },
                                                    { label: 'Fecha y hora', value: languageCanvas.dateTime },
                                                    { label: 'Condiciones de satisfacción', value: languageCanvas.satisfactionCriteria },
                                                    { label: 'Contexto y sentido', value: languageCanvas.contextMeaning },
                                                    { label: 'Respuesta explícita esperada', value: languageCanvas.expectedExplicitResponse },
                                                    { label: 'Punto de seguimiento', value: languageCanvas.followUpPoint }
                                                ].map((item) => (
                                                    <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                                                        <p className="mt-1 text-sm text-slate-800">{item.value.trim() || 'Completar'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de calibración del pedido</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowLanguageExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    languageCalibrationCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {languageCalibrationCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Criterio</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué debo ajustar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {languageCalibration.map((row, rowIndex) => (
                                                    <tr key={`language-calibration-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`language-calibration-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateLanguageCalibration(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`language-calibration-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateLanguageCalibration(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateLanguageCalibration(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Escribe ajuste o Completar"
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
                                            onClick={() => saveLanguageBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Tablero de promesas y riesgos</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowLanguageExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    languagePromisesCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {languagePromisesCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1180px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Promesa activa</th>
                                                    <th className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">A quién le prometí</th>
                                                    <th className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Fecha acordada</th>
                                                    <th className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Riesgo actual</th>
                                                    <th className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal temprana</th>
                                                    <th className="px-3 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Acción preventiva inmediata</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {languagePromises.map((row, rowIndex) => (
                                                    <tr key={`language-promises-${rowIndex}`}>
                                                        <td className="px-2 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.activePromise}
                                                                onChange={(event) => updateLanguagePromiseRow(rowIndex, 'activePromise', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.promisedTo}
                                                                onChange={(event) => updateLanguagePromiseRow(rowIndex, 'promisedTo', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.agreedDate}
                                                                onChange={(event) => updateLanguagePromiseRow(rowIndex, 'agreedDate', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.riskLevel}
                                                                onChange={(event) => updateLanguagePromiseRow(rowIndex, 'riskLevel', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                <option value="Bajo">Bajo</option>
                                                                <option value="Medio">Medio</option>
                                                                <option value="Alto">Alto</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-2 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.earlySignal}
                                                                onChange={(event) => updateLanguagePromiseRow(rowIndex, 'earlySignal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.preventiveAction}
                                                                onChange={(event) => updateLanguagePromiseRow(rowIndex, 'preventiveAction', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {highRiskWithoutPreventiveAction && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: si una promesa tiene riesgo alto, agrega acción preventiva inmediata.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveLanguageBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Protocolo de renegociación anticipada</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowLanguageExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    languageRenegotiationCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {languageRenegotiationCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Compromiso en riesgo</span>
                                            <input
                                                type="text"
                                                value={languageRenegotiation.atRiskCommitment}
                                                onChange={(event) => updateLanguageRenegotiation('atRiskCommitment', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Cuándo debo avisar como máximo</span>
                                            <input
                                                type="text"
                                                value={languageRenegotiation.maxNotice}
                                                onChange={(event) => updateLanguageRenegotiation('maxNotice', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Qué cambió objetivamente</span>
                                            <textarea
                                                rows={2}
                                                value={languageRenegotiation.objectiveChange}
                                                onChange={(event) => updateLanguageRenegotiation('objectiveChange', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Qué alternativa voy a proponer</span>
                                            <textarea
                                                rows={2}
                                                value={languageRenegotiation.alternativeProposal}
                                                onChange={(event) => updateLanguageRenegotiation('alternativeProposal', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Qué confirmación necesito recibir</span>
                                            <textarea
                                                rows={2}
                                                value={languageRenegotiation.confirmationNeeded}
                                                onChange={(event) => updateLanguageRenegotiation('confirmationNeeded', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {highRiskWithoutRenegotiation && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: diseña una renegociación antes del vencimiento para proteger la confianza.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveLanguageBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Test de trazabilidad conversacional</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowLanguageExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    languageTraceabilityCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {languageTraceabilityCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {languageTraceability.map((row, rowIndex) => (
                                                    <tr key={`language-traceability-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`language-traceability-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateLanguageTraceability(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`language-traceability-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateLanguageTraceability(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateLanguageTraceability(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Escribe ajuste o Completar"
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
                                            onClick={() => saveLanguageBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Cómo diseñar un pedido que no dependa de interpretación.',
                                            'Cómo evaluar si una promesa está en riesgo antes de incumplir.',
                                            'Cómo renegociar sin perder confianza.',
                                            'Cómo dejar trazabilidad real en conversaciones de coordinación.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-4 text-sm text-slate-700">
                                        En la rúbrica de WB5, esta competencia progresa desde pedidos ambiguos hacia comunicación clara, escucha genuina y compromisos definidos.
                                    </p>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                languageSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {languageSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(4)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 4
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 7"
                                data-print-title="Comunicación de influencia racional y emocional"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Comunicación de influencia racional y emocional
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Desarrolla una influencia ética combinando argumentos racionales con conexión emocional para movilizar comprensión, decisión y compromiso sin imposición.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowInfluenceHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Influencia racional: datos, hechos, criterios y consecuencias que sostienen una propuesta.',
                                            'Influencia emocional: conexión con valores, preocupaciones y aspiraciones relevantes para la audiencia.',
                                            'Influencia ética: movilizar sin manipulación ni abuso de autoridad.',
                                            'Construcción de confianza: consistencia, respeto, transparencia y cumplimiento.',
                                            'Escucha activa y empática: comprender al otro y ajustar el mensaje desde esa comprensión.',
                                            'Palancas de influencia: evidencia, riesgo, beneficio, valores, confianza, pertenencia y sentido.',
                                            'Mensaje dual: línea racional sólida + línea emocional relevante.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Matriz Racional – Emocional – Decisional</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInfluenceExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    influenceMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {influenceMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo racional</span>
                                            <textarea
                                                rows={2}
                                                value={influenceMatrix.rational}
                                                onChange={(event) => updateInfluenceMatrix('rational', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Hechos, datos, criterio o consecuencias"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo emocional</span>
                                            <textarea
                                                rows={2}
                                                value={influenceMatrix.emotional}
                                                onChange={(event) => updateInfluenceMatrix('emotional', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Qué le importa o qué puede movilizar al otro"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo decisional</span>
                                            <textarea
                                                rows={2}
                                                value={influenceMatrix.decisional}
                                                onChange={(event) => updateInfluenceMatrix('decisional', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Qué debe ocurrir después de la conversación"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        {rationalNeedsSupport && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                                Sugerencia: fortalece la base racional con dato, lógica o criterio.
                                            </p>
                                        )}
                                        {emotionalNeedsSupport && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                                Sugerencia: aclara qué valor, riesgo o aspiración compartida está en juego.
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveInfluenceBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Mapa de palancas de influencia</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInfluenceExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    influenceLeversCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {influenceLeversCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Palanca</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué podría decir aquí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Peso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {influenceLevers.map((row, rowIndex) => (
                                                    <tr key={`influence-lever-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.lever}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatToSay}
                                                                onChange={(event) => updateInfluenceLever(rowIndex, 'whatToSay', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.weight}
                                                                onChange={(event) => updateInfluenceLever(rowIndex, 'weight', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                <option value="Alta">Alta</option>
                                                                <option value="Media">Media</option>
                                                                <option value="Baja">Baja</option>
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
                                            onClick={() => saveInfluenceBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Diseño de mensaje dual (cabeza + corazón)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInfluenceExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    influenceDualCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {influenceDualCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Apertura de contexto</span>
                                            <textarea
                                                rows={2}
                                                value={influenceDual.contextOpening}
                                                onChange={(event) => updateInfluenceDual('contextOpening', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Núcleo racional</span>
                                            <textarea
                                                rows={2}
                                                value={influenceDual.rationalCore}
                                                onChange={(event) => updateInfluenceDual('rationalCore', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Núcleo emocional / movilizador</span>
                                            <textarea
                                                rows={2}
                                                value={influenceDual.emotionalCore}
                                                onChange={(event) => updateInfluenceDual('emotionalCore', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Cierre decisional</span>
                                            <textarea
                                                rows={2}
                                                value={influenceDual.decisionalClose}
                                                onChange={(event) => updateInfluenceDual('decisionalClose', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {decisionalNeedsSupport && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define qué necesitas que ocurra después (decisión o acción concreta).
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveInfluenceBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Chequeo de influencia ética</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInfluenceExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    influenceEthicsCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {influenceEthicsCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {influenceEthics.map((row, rowIndex) => (
                                                    <tr key={`influence-ethics-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`influence-ethics-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateInfluenceEthics(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`influence-ethics-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateInfluenceEthics(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateInfluenceEthics(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Escribe ajuste o Completar"
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
                                            onClick={() => saveInfluenceBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Qué parte racional sostiene mi influencia.',
                                            'Qué parte emocional moviliza a la audiencia.',
                                            'Cómo combinar ambas sin manipular.',
                                            'Qué palancas pesan más según la conversación.',
                                            'Cómo influir con ética, claridad y confianza.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                influenceSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {influenceSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(5)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 5
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 7"
                                data-print-title="Framework de conversación estratégica"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Framework de conversación estratégica
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Diseña conversaciones estratégicas con intención, estructura y criterio conversacional para abrir, conducir, tensionar, negociar y cerrar con claridad, escucha e influencia ética.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Conversación estratégica: interacción de alto valor con resultado específico (alinear, decidir, destrabar, renegociar o reparar).',
                                            'Objetivo conversacional: efecto concreto buscado al final, no solo el tema.',
                                            'Posición e interés: lo que cada parte dice querer y lo que realmente está cuidando.',
                                            'Actos del habla: pedir, ofrecer, prometer, declarar, preguntar, reconocer, cuestionar, rechazar o renegociar.',
                                            'Secuencia conversacional: apertura, exploración, planteamiento, tensión, negociación y cierre.',
                                            'Tensión productiva: diferencia legítima que puede mejorar la decisión si se gestiona bien.',
                                            'Objeción estratégica: resistencia relevante que debe trabajarse, no neutralizarse.',
                                            'Cierre conversacional: dejar explícito qué se entendió, qué se acordó y qué sigue.',
                                            'Minuta de compromisos: responsables, fechas, condiciones de satisfacción y seguimiento.',
                                            'Confianza conversacional: claridad, honestidad, responsabilidad y consistencia.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Brief de conversación estratégica</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowStrategicExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    strategicBriefCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {strategicBriefCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Tema real</span>
                                            <textarea
                                                rows={2}
                                                value={strategicBrief.realTopic}
                                                onChange={(event) => updateStrategicBrief('realTopic', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Objetivo conversacional</span>
                                            <textarea
                                                rows={2}
                                                value={strategicBrief.conversationalObjective}
                                                onChange={(event) => updateStrategicBrief('conversationalObjective', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Qué resultado tiene que quedar producido al final"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Resultado mínimo aceptable</span>
                                            <input
                                                type="text"
                                                value={strategicBrief.minimumResult}
                                                onChange={(event) => updateStrategicBrief('minimumResult', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Riesgo principal si no se gestiona bien</span>
                                            <input
                                                type="text"
                                                value={strategicBrief.mainRisk}
                                                onChange={(event) => updateStrategicBrief('mainRisk', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Relación o confianza que necesito cuidar</span>
                                            <input
                                                type="text"
                                                value={strategicBrief.trustToProtect}
                                                onChange={(event) => updateStrategicBrief('trustToProtect', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">6. Qué debe quedar explícito al cierre</span>
                                            <textarea
                                                rows={2}
                                                value={strategicBrief.explicitClosing}
                                                onChange={(event) => updateStrategicBrief('explicitClosing', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {strategicObjectiveNeedsAdjustment && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: redacta el objetivo como resultado a lograr, no solo como tema.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStrategicBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Mapa posición–interés–riesgo–movimiento</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowStrategicExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    strategicMapCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {strategicMapCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[840px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Elemento</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tu respuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { key: 'myPosition', label: 'Mi posición' },
                                                    { key: 'myRealInterest', label: 'Mi interés real' },
                                                    { key: 'counterpartLikelyPosition', label: 'Posición probable de la otra parte' },
                                                    { key: 'counterpartLikelyInterest', label: 'Interés probable de la otra parte' },
                                                    { key: 'centralRisk', label: 'Riesgo central de la conversación' },
                                                    { key: 'usefulMove', label: 'Movimiento útil para abrir avance' }
                                                ].map((row) => (
                                                    <tr key={row.key}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.label}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={strategicMap[row.key as keyof typeof strategicMap]}
                                                                onChange={(event) =>
                                                                    updateStrategicMap(
                                                                        row.key as keyof WB5State['strategicConversationSection']['map'],
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {showStrategicMapPreview && (
                                        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 md:p-5">
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Mapa esquematizado</p>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi posición</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-800">{strategicMap.myPosition || 'Sin definir'}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Posición de la otra parte</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-800">{strategicMap.counterpartLikelyPosition || 'Sin definir'}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi interés real</p>
                                                    <p className="mt-1 text-sm text-slate-700">{strategicMap.myRealInterest || 'Sin definir'}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Interés de la otra parte</p>
                                                    <p className="mt-1 text-sm text-slate-700">{strategicMap.counterpartLikelyInterest || 'Sin definir'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                                <p className="text-xs uppercase tracking-[0.14em] text-amber-700 font-semibold">Riesgo central</p>
                                                <p className="mt-1 text-sm text-amber-900">{strategicMap.centralRisk || 'Sin definir'}</p>
                                            </div>
                                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                                <p className="text-xs uppercase tracking-[0.14em] text-emerald-700 font-semibold">Movimiento útil para abrir avance</p>
                                                <p className="mt-1 text-sm text-emerald-900">{strategicMap.usefulMove || 'Sin definir'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStrategicBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Arquitectura conversacional</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowStrategicExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    strategicArchitectureCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {strategicArchitectureCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Apertura</span>
                                            <textarea
                                                rows={2}
                                                value={strategicArchitecture.opening}
                                                onChange={(event) => updateStrategicArchitecture('opening', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Contexto</span>
                                            <textarea
                                                rows={2}
                                                value={strategicArchitecture.context}
                                                onChange={(event) => updateStrategicArchitecture('context', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Exploración (preguntas clave)</span>
                                            <textarea
                                                rows={2}
                                                value={strategicArchitecture.explorationQuestions}
                                                onChange={(event) => updateStrategicArchitecture('explorationQuestions', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Incluye preguntas antes de empujar tu posición"
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Planteamiento principal</span>
                                            <textarea
                                                rows={2}
                                                value={strategicArchitecture.mainApproach}
                                                onChange={(event) => updateStrategicArchitecture('mainApproach', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Negociación / ajuste</span>
                                            <textarea
                                                rows={2}
                                                value={strategicArchitecture.negotiationAdjustment}
                                                onChange={(event) => updateStrategicArchitecture('negotiationAdjustment', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">6. Cierre</span>
                                            <textarea
                                                rows={2}
                                                value={strategicArchitecture.closure}
                                                onChange={(event) => updateStrategicArchitecture('closure', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {strategicExplorationMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: agrega preguntas de exploración para comprender antes de empujar tu propuesta.
                                        </p>
                                    )}

                                    {showStrategicTimelinePreview && (
                                        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 md:p-5">
                                            <p className="text-xs uppercase tracking-[0.14em] text-blue-700 font-semibold">Arquitectura conversacional (timeline)</p>
                                            <div className="mt-3 overflow-x-auto">
                                                <div className="min-w-[980px] flex items-start gap-2">
                                                    {[
                                                        { label: 'Apertura', value: strategicArchitecture.opening },
                                                        { label: 'Contexto', value: strategicArchitecture.context },
                                                        { label: 'Exploración', value: strategicArchitecture.explorationQuestions },
                                                        { label: 'Planteamiento', value: strategicArchitecture.mainApproach },
                                                        { label: 'Negociación', value: strategicArchitecture.negotiationAdjustment },
                                                        { label: 'Cierre', value: strategicArchitecture.closure }
                                                    ].map((step, index, array) => (
                                                        <React.Fragment key={step.label}>
                                                            <div className="w-[155px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                                    {index + 1}. {step.label}
                                                                </p>
                                                                <p className="mt-1 text-sm text-slate-700">{step.value || 'Sin definir'}</p>
                                                            </div>
                                                            {index < array.length - 1 && (
                                                                <div className="pt-9 text-blue-600 font-bold">→</div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStrategicBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Secuencia de actos del habla</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowStrategicExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    strategicSpeechActsCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {strategicSpeechActsCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Orden</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Acto del habla</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué diré o haré</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {strategicSpeechActs.map((row, rowIndex) => (
                                                    <tr key={`strategic-speech-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{rowIndex + 1}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.speechAct}
                                                                onChange={(event) => updateStrategicSpeechAct(rowIndex, 'speechAct', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ej: Reconocer, Preguntar, Declarar..."
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatIWillSayOrDo}
                                                                onChange={(event) => updateStrategicSpeechAct(rowIndex, 'whatIWillSayOrDo', event.target.value)}
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
                                            onClick={() => saveStrategicBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Matriz de objeciones y respuestas</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowStrategicExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    strategicObjectionsCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {strategicObjectionsCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1060px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objeción probable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué voy a reconocer</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Evidencia o criterio</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Salida o reformulación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {strategicObjections.map((row, rowIndex) => (
                                                    <tr key={`strategic-objection-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.likelyObjection}
                                                                onChange={(event) => updateStrategicObjection(rowIndex, 'likelyObjection', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatToAcknowledge}
                                                                onChange={(event) => updateStrategicObjection(rowIndex, 'whatToAcknowledge', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.evidenceOrCriteria}
                                                                onChange={(event) => updateStrategicObjection(rowIndex, 'evidenceOrCriteria', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.wayOutOrReframe}
                                                                onChange={(event) => updateStrategicObjection(rowIndex, 'wayOutOrReframe', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {strategicObjectionsWithoutEvidence && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: agrega base racional (evidencia o criterio) para sostener tu respuesta a objeciones.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStrategicBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Acta de cierre y compromisos</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowStrategicExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    strategicClosingCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {strategicClosingCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Qué debe quedar entendido</span>
                                            <textarea
                                                rows={2}
                                                value={strategicClosing.whatMustBeUnderstood}
                                                onChange={(event) => updateStrategicClosing('whatMustBeUnderstood', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Acuerdo o decisión explícita</span>
                                            <textarea
                                                rows={2}
                                                value={strategicClosing.explicitAgreement}
                                                onChange={(event) => updateStrategicClosing('explicitAgreement', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Compromiso de cada parte</span>
                                            <textarea
                                                rows={2}
                                                value={strategicClosing.commitmentsByPart}
                                                onChange={(event) => updateStrategicClosing('commitmentsByPart', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Fecha / hito de seguimiento</span>
                                            <input
                                                type="text"
                                                value={strategicClosing.followUpMilestone}
                                                onChange={(event) => updateStrategicClosing('followUpMilestone', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Ambigüedad a evitar</span>
                                            <textarea
                                                rows={2}
                                                value={strategicClosing.ambiguityToAvoid}
                                                onChange={(event) => updateStrategicClosing('ambiguityToAvoid', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {strategicClosingMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: aclara acuerdo explícito y fecha/hito de seguimiento para cerrar sin ambigüedad.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStrategicBlock('Paso 6')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-7">
                                    <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre de la sección</h3>
                                    <ul className="mt-4 space-y-2.5">
                                        {[
                                            'Qué resultado quiero producir realmente en una conversación importante.',
                                            'Qué tensión central debo gestionar.',
                                            'Cómo ordenar la secuencia de la conversación.',
                                            'Qué objeciones debo anticipar.',
                                            'Cómo cerrar con claridad, seguimiento y compromiso.'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                strategicSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {strategicSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(6)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 6
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb5-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 7"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
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
                                                        key={`wb5-evaluation-stage-${stage.key}`}
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
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">A) Modo Mentor - Rúbricas</h3>
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
                                                    <li key={`wb5-mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                                    <tr key={`wb5-mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
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
                                                    Criterios completados: {mentorCompletedRows}/{state.evaluation.mentorRows.length}
                                                </p>
                                            </div>

                                            {state.evaluation.mentorRows.map((row, index) => {
                                                const isEditing = mentorEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isMentorEvaluationRowComplete(row)

                                                return (
                                                    <article key={`wb5-mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                                key={`wb5-mentor-level-${index}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb5-mentor-level-${index}`}
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
                                                                                key={`wb5-mentor-decision-${index}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb5-mentor-decision-${index}`}
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
                                                                    <span className="font-semibold text-slate-900">Comentario / evidencia:</span>{' '}
                                                                    {row.evidence || 'Pendiente'}
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
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Panel de cierre mentor</h3>
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Observaciones generales del mentor</span>
                                                <textarea
                                                    value={state.evaluation.mentorGeneralNotes}
                                                    onChange={(event) => setMentorGeneralNotes(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[130px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                    placeholder='Observaciones generales (si falta, escribe "Completar").'
                                                />
                                            </label>

                                            <fieldset className="space-y-2">
                                                <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión global del WB</legend>
                                                <div className="flex flex-wrap gap-2">
                                                    {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                        <label
                                                            key={`wb5-mentor-global-decision-${decision}`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="wb5-mentor-global-decision"
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
                                                    <li key={`wb5-leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                    <article key={`wb5-leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                    value={state.evaluation.agreementsSynthesis}
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
                                                {evaluationSectionComplete ? 'WB5 Evaluación completada' : 'WB5 Evaluación en progreso'}
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
                                                {state.evaluation.mentorRows.map((row, index) => (
                                                    <div
                                                        key={`wb5-evaluation-summary-criterion-${index}`}
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
                                                {state.evaluation.mentorGlobalDecision || 'Pendiente'}
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

                        {showExecutiveHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Estructura de mensaje ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• BLUF: empieza por la conclusión para reducir carga cognitiva.</p>
                                        <p>• Pirámide ejecutiva: idea madre + argumentos + pruebas.</p>
                                        <p>• SCQA: contexto estructurado sin perder foco ni accionabilidad.</p>
                                        <p>• Un buen mensaje ejecutivo reduce ambigüedad y facilita decisiones.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (BLUF)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Bottom line:</span> Necesitamos redefinir prioridades del trimestre y concentrarnos en tres frentes.</p>
                                        <p><span className="font-semibold">Por qué importa:</span> Si seguimos con cinco prioridades activas, bajará la calidad y aumentará el retrabajo.</p>
                                        <p><span className="font-semibold">Qué debe pasar ahora:</span> Hoy debemos decidir qué tres frentes quedan y cuáles salen del foco.</p>
                                        <p><span className="font-semibold">Soporte mínimo:</span> El equipo reporta saturación; hubo correcciones evitables; la capacidad no alcanza para cinco frentes.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Pirámide 1–3–3)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Idea madre:</span> Necesitamos simplificar el mensaje ejecutivo del proyecto.</li>
                                        <li><span className="font-semibold">Argumento 1:</span> La propuesta es extensa para la audiencia decisora.</li>
                                        <li><span className="font-semibold">Prueba 1:</span> El sponsor pidió “ir al punto” tres veces.</li>
                                        <li><span className="font-semibold">Argumento 2:</span> La idea principal queda diluida entre contexto.</li>
                                        <li><span className="font-semibold">Prueba 2:</span> El equipo no pudo repetir la recomendación final.</li>
                                        <li><span className="font-semibold">Argumento 3:</span> No está clara la decisión esperada.</li>
                                        <li><span className="font-semibold">Prueba 3:</span> La reunión cerró sin responsables ni siguiente paso.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (SCQA)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Situación:</span> El equipo inició el trimestre con cuatro frentes estratégicos definidos.</li>
                                        <li><span className="font-semibold">Complicación:</span> Entraron dos demandas nuevas que alteraron la capacidad real.</li>
                                        <li><span className="font-semibold">Pregunta:</span> ¿Qué debemos priorizar para no sacrificar calidad ni tiempos?</li>
                                        <li><span className="font-semibold">Respuesta:</span> Reenfocar en tres frentes, redefinir responsables y sacar del alcance lo que no cabe.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showExecutiveExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Test)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExecutiveExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Mensaje débil:</span> “Tenemos que revisar varias cosas para mejorar cómo vamos.”</p>
                                        <p>
                                            <span className="font-semibold">Mensaje mejorado:</span> “Necesitamos redefinir prioridades hoy porque la carga actual supera la capacidad del equipo y ya está afectando calidad. Quiero cerrar esta reunión con tres focos, responsables y límites claros.”
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLanguageHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Ingeniería del lenguaje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Pedido impecable = qué + quién + para cuándo + cómo se verá bien hecho + confirmación explícita.</p>
                                        <p>• Promesa confiable = compromiso explícito + cumplimiento o renegociación anticipada.</p>
                                        <p>• La ambigüedad conversacional genera retrabajo, frustración y erosión de confianza.</p>
                                        <p>• En 4Shine, la competencia se observa cuando el líder deja de asumir compromiso y empieza a verificarlo explícitamente.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLanguageExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Canvas del pedido)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Resultado requerido:</span> Borrador ejecutivo de una página con foco, riesgos y decisiones.</li>
                                        <li><span className="font-semibold">Responsable:</span> Laura.</li>
                                        <li><span className="font-semibold">Fecha y hora:</span> Mañana, 4:00 p. m.</li>
                                        <li><span className="font-semibold">Condiciones de satisfacción:</span> Máximo una página, tres prioridades, dos riesgos y recomendación final.</li>
                                        <li><span className="font-semibold">Contexto:</span> Preparar reunión con dirección del jueves.</li>
                                        <li><span className="font-semibold">Respuesta esperada:</span> “Sí, lo entrego mañana antes de las 4; si no llego, te aviso a las 2.”</li>
                                        <li><span className="font-semibold">Seguimiento:</span> Revisión rápida mañana a la 1:00 p. m.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showLanguageExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Calibración)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Pedido débil:</span> “Revísalo y me dices.”</p>
                                        <p><span className="font-semibold">Pedido calibrado:</span> “Necesito que revises estas 5 slides y me envíes comentarios antes de hoy a las 6:00 p. m., enfocándote en claridad del mensaje, orden lógico y nivel ejecutivo.”</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLanguageExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Promesas y riesgo)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Enviar versión final del pitch</span> · Mentor · Jueves 6:00 p. m. · Riesgo alto · Señal: no cierro versión breve · Acción: avisar hoy y proponer hito parcial.</li>
                                        <li><span className="font-semibold">Compartir feedback al equipo</span> · Equipo · Miércoles · Riesgo medio · Señal: postergación diaria · Acción: bloquear 30 min en agenda.</li>
                                        <li><span className="font-semibold">Entregar resumen al sponsor</span> · Sponsor · Viernes 10:00 a. m. · Riesgo bajo · Señal: depende de validación externa · Acción: pedir validación hoy.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showLanguageExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Renegociación)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Compromiso en riesgo:</span> Entregar versión final del documento el jueves.</li>
                                        <li><span className="font-semibold">Aviso máximo:</span> Miércoles 3:00 p. m.</li>
                                        <li><span className="font-semibold">Cambio objetivo:</span> Entró validación adicional que afecta calidad final.</li>
                                        <li><span className="font-semibold">Alternativa:</span> Entregar versión parcial jueves y final viernes 11:00 a. m.</li>
                                        <li><span className="font-semibold">Confirmación:</span> Aceptación explícita del nuevo plan y fecha revisada.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showLanguageExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Trazabilidad)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLanguageExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Compromiso débil:</span> “Sí, yo miro eso.”</p>
                                        <p><span className="font-semibold">Compromiso trazable:</span> “Sí, reviso las cinco slides y te mando comentarios antes de hoy a las 6:00 p. m., enfocándome en claridad del mensaje y orden de ideas.”</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showInfluenceHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Influencia racional y emocional</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowInfluenceHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Influencia racional = hechos, criterio y lógica.</p>
                                        <p>• Influencia emocional = valores, preocupaciones y sentido compartido.</p>
                                        <p>• Influencia ética combina ambas sin manipulación.</p>
                                        <p>• El cierre debe explicitar la decisión o acción esperada.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showInfluenceExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Matriz)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowInfluenceExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Lo racional:</span> Si mantenemos cinco prioridades simultáneas, bajará la calidad y aumentará el retrabajo.</li>
                                        <li><span className="font-semibold">Lo emocional:</span> El equipo necesita foco y seguridad, no sensación de caos.</li>
                                        <li><span className="font-semibold">Lo decisional:</span> Necesito acordar tres prioridades y descartar dos hoy.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showInfluenceExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Palancas)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowInfluenceExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Evidencia:</span> Ya vemos retrasos por dispersión (Alta).</li>
                                        <li><span className="font-semibold">Riesgo:</span> Sin foco perderemos calidad y credibilidad (Alta).</li>
                                        <li><span className="font-semibold">Valores compartidos:</span> Queremos un equipo confiable y sostenible (Media).</li>
                                        <li><span className="font-semibold">Sentido:</span> Este ajuste protege el trabajo bien hecho (Media).</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showInfluenceExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Mensaje dual)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowInfluenceExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Apertura:</span> Aumentó el volumen de frentes y el equipo perdió foco.</li>
                                        <li><span className="font-semibold">Núcleo racional:</span> La carga supera capacidad real y afecta tiempos y calidad.</li>
                                        <li><span className="font-semibold">Núcleo emocional:</span> Si seguimos así, bajan resultados y confianza del equipo.</li>
                                        <li><span className="font-semibold">Cierre:</span> Definir tres prioridades, responsables y lo que sale del foco hoy.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showInfluenceExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Chequeo ético)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowInfluenceExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Mensaje débil:</span> “Necesitamos hacer esto porque yo sé que es lo correcto.”</p>
                                        <p><span className="font-semibold">Mensaje mejorado:</span> “Necesitamos ajustar porque los datos muestran dispersión y proteger foco y calidad es coherente con el equipo que queremos ser.”</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showStrategicHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Framework de conversación estratégica</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Una conversación estratégica no se improvisa: requiere objetivo, lectura de intereses y secuencia.</p>
                                        <p>• Una buena conversación no termina cuando “ya hablé”; termina cuando queda claro qué sigue.</p>
                                        <p>• Anticipar objeciones mejora calidad y reduce reactividad.</p>
                                        <p>• El estándar alto en WB5 es ordenar conversaciones complejas con firmeza y respeto.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showStrategicExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Brief)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Tema real:</span> Renegociar alcance de un entregable sin deteriorar confianza.</li>
                                        <li><span className="font-semibold">Objetivo:</span> Redefinir alcance, fecha y criterio de calidad.</li>
                                        <li><span className="font-semibold">Resultado mínimo:</span> Aceptación de revisar alcance y nueva fecha.</li>
                                        <li><span className="font-semibold">Riesgo:</span> Que se interprete como falta de compromiso.</li>
                                        <li><span className="font-semibold">Relación a cuidar:</span> Confianza con sponsor directo.</li>
                                        <li><span className="font-semibold">Cierre explícito:</span> Nuevo alcance, fecha y responsables.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showStrategicExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Mapa)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Mi posición:</span> Necesitamos redefinir el alcance.</li>
                                        <li><span className="font-semibold">Mi interés real:</span> Proteger calidad y evitar incumplir.</li>
                                        <li><span className="font-semibold">Posición probable de la otra parte:</span> Debe salir como se acordó.</li>
                                        <li><span className="font-semibold">Interés probable de la otra parte:</span> Cuidar credibilidad frente a dirección.</li>
                                        <li><span className="font-semibold">Riesgo central:</span> Que vea el ajuste como desorden.</li>
                                        <li><span className="font-semibold">Movimiento útil:</span> Reconocer su preocupación y mostrar evidencia de capacidad real.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showStrategicExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Arquitectura)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Apertura:</span> Ordenar alcance y proteger calidad.</li>
                                        <li><span className="font-semibold">Contexto:</span> Entraron requerimientos no previstos.</li>
                                        <li><span className="font-semibold">Exploración:</span> “¿Qué no podríamos comprometer?”</li>
                                        <li><span className="font-semibold">Planteamiento:</span> Redefinir alcance o mover fecha.</li>
                                        <li><span className="font-semibold">Negociación:</span> Si no se mueve fecha, ajustar alcance.</li>
                                        <li><span className="font-semibold">Cierre:</span> Nuevo alcance, revisión mañana y validación final jueves.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showStrategicExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Actos del habla)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ol className="space-y-2.5 text-sm text-slate-700 list-decimal list-inside">
                                        <li>Reconocer: “Sé que cuidas tiempos y exposición con dirección”.</li>
                                        <li>Preguntar: “¿Qué es lo más crítico para ti en este entregable?”.</li>
                                        <li>Declarar: “Hoy el alcance supera la capacidad real del equipo”.</li>
                                        <li>Pedir: “Necesito revisar contigo el alcance prioritario”.</li>
                                        <li>Ofrecer: “Sostengo calidad si ajustamos dos bloques y mantenemos foco”.</li>
                                        <li>Renegociar: “Si no movemos fecha, necesitamos mover alcance”.</li>
                                        <li>Cerrar: “Definamos alcance, responsables y fecha de validación”.</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {showStrategicExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Objeciones)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Objeción:</span> “Eso retrasa todo”. <span className="font-semibold">Criterio:</span> alcance actual supera capacidad. <span className="font-semibold">Salida:</span> redefinir alcance o mover fecha.</li>
                                        <li><span className="font-semibold">Objeción:</span> “Ya habíamos acordado esto”. <span className="font-semibold">Criterio:</span> cambiaron condiciones clave. <span className="font-semibold">Salida:</span> renegociar ahora para proteger resultado.</li>
                                        <li><span className="font-semibold">Objeción:</span> “No podemos abrir este tema ahora”. <span className="font-semibold">Criterio:</span> el riesgo crece si se posterga. <span className="font-semibold">Salida:</span> definir espacio corto hoy o mañana.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showStrategicExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Acta de cierre)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStrategicExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li><span className="font-semibold">Entendido:</span> el ajuste protege resultado y no evade responsabilidad.</li>
                                        <li><span className="font-semibold">Acuerdo:</span> nuevo alcance y nueva fecha.</li>
                                        <li><span className="font-semibold">Compromisos:</span> yo envío versión; la otra parte valida antes de las 10:00 a. m.</li>
                                        <li><span className="font-semibold">Hito:</span> revisión mañana 10:00 a. m.</li>
                                        <li><span className="font-semibold">Ambigüedad a evitar:</span> cerrar con “vemos después”.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb5-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
                                <button type="button" onClick={goPrevPage} disabled={!hasPrevPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavPrev}>
                                    <ArrowLeft size={15} />
                                    {WORKBOOK_V2_EDITORIAL.labels.back}
                                </button>

                                <div className="text-center">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.navigation}</p>
                                    <p className="text-sm font-bold text-slate-900">{PAGES[currentPageIndex]?.shortLabel ?? 'Página'}</p>
                                </div>

                                <button type="button" onClick={goNextPage} disabled={!hasNextPage} className={WORKBOOK_V2_EDITORIAL.classes.bottomNavNext}>
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
                    .wb5-toolbar,
                    .wb5-sidebar,
                    .wb5-page-nav {
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
                    .wb5-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb5-print-page:not(.wb5-cover-page)::before {
                        content: "WB5 · Comunicación ejecutiva y estratégica · " attr(data-print-title);
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
                    .wb5-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb5-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb5-cover-page::before {
                        content: none !important;
                    }
                    .wb5-cover-hero {
                        min-height: 240mm !important;
                        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
                    }
                    input,
                    textarea,
                    select {
                        border: 1px solid #cbd5e1 !important;
                        background: #fff !important;
                        color: #0f172a !important;
                    }
                    article.rounded-3xl {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    )
}
