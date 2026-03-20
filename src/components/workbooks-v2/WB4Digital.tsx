'use client'
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

type WorkbookPage = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

const PAGES: WorkbookPage[] = [
    { id: 1, label: '1. Portada', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Construcción de storytelling ejecutivo', shortLabel: 'Storytelling' },
    { id: 4, label: '4. Slogan personal', shortLabel: 'Slogan personal' },
    { id: 5, label: '5. Promesa de valor', shortLabel: 'Promesa de valor' },
    { id: 6, label: '6. Definición de audiencia principal', shortLabel: 'Audiencia principal' },
    { id: 7, label: '7. ¿Qué problema resuelve?', shortLabel: 'Problema que resuelve' },
    { id: 8, label: '8. Diferencial competitivo', shortLabel: 'Diferencial competitivo' },
    { id: 9, label: '9. Elevator pitch estructurado', shortLabel: 'Elevator pitch' },
    { id: 10, label: '10. Ejes de contenido estratégicos', shortLabel: 'Ejes estratégicos' },
    { id: 11, label: '11. Evaluación', shortLabel: 'Evaluación' }
]

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

const MENTOR_EVALUATION_CRITERIA = [
    'Claridad del mensaje',
    'Coherencia narrativa–identidad',
    'Seguridad y presencia al comunicar',
    'Diferenciación estratégica',
    'Adaptabilidad según audiencia'
] as const

const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']

const MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 - Declarativo',
        descriptor: 'Mensaje ambiguo o excesivamente técnico; sin conexión emocional.'
    },
    {
        level: 'Nivel 2 - Consciente',
        descriptor: 'Mayor claridad pero con inseguridad o sobreexplicación.'
    },
    {
        level: 'Nivel 3 - Integrado',
        descriptor: 'Mensaje claro, estructurado y alineado con identidad.'
    },
    {
        level: 'Nivel 4 - Alineación Estratégica',
        descriptor: 'Comunicación estratégica, breve, poderosa y adaptable.'
    }
] as const

const LEADER_EVALUATION_QUESTIONS = [
    '¿Mi narrativa refleja quién realmente soy como líder?',
    '¿Qué parte de mi discurso suena artificial o forzada?',
    '¿Dónde percibo inseguridad al comunicar mi propuesta de valor?',
    '¿Qué versión de mi pitch genera mayor impacto real?',
    '¿Cómo adapto mi mensaje sin perder coherencia identitaria?'
] as const

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - iShine' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const createDefaultEvaluationData = (): WB4State['evaluation'] => ({
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

const STORAGE_KEY = 'wb4_v2_state'
const PAGE_STORAGE_KEY = 'wb4_v2_page'
const VISITED_STORAGE_KEY = 'wb4_v2_visited'
const INTRO_SEEN_KEY = 'wb4_v2_intro_seen'

type WB4State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    storytellingSection: {
        fiveBlocks: {
            professionalOrigin: string
            inflectionPoint: string
            currentFocus: string
            clearValue: string
            futureDirection: string
        }
        matrixRows: Array<{
            selfStatement: string
            communicatedValue: string
            evidence: string
        }>
        briefNarrative: string
    }
    sloganSection: {
        verbalCore: {
            coreIdea: string
            desiredEffect: string
            keyDifferentiator: string
            communicationFeeling: string
        }
        versions: {
            version1: string
            version2: string
            version3: string
        }
        qualityFilter: {
            clear: { v1: boolean; v2: boolean; v3: boolean }
            brief: { v1: boolean; v2: boolean; v3: boolean }
            representative: { v1: boolean; v2: boolean; v3: boolean }
            authentic: { v1: boolean; v2: boolean; v3: boolean }
            differentiated: { v1: boolean; v2: boolean; v3: boolean }
        }
        selectedSlogan: string
    }
    valuePromiseSection: {
        matrix: {
            contribution: string
            audience: string
            addressedNeed: string
            generatedResult: string
            credibilityBasis: string
        }
        formula: {
            short: {
                who: string
                achieve: string
                through: string
            }
            extended: {
                who: string
                solve: string
                achieve: string
                through: string
            }
        }
        credibility: {
            evidence: string
            experience: string
            canSustain: string
            needsStrengthening: string
        }
        briefPromise: string
    }
    primaryAudienceSection: {
        audienceMap: {
            audience1: string
            audience2: string
            audience3: string
            audience4: string
            audience5: string
        }
        matrixRows: Array<{
            audienceName: string
            whatMatters: string
            currentNeed: string
            languageStyle: string
            offeredValue: string
        }>
        selector: {
            mainAudience: string
            whyChosen: string
            needsToHear: string
            avoidWhenSpeaking: string
        }
        resonanceTest: {
            mainNeed: string
            mainConcern: string
            rejectedLanguage: string
            trustedLanguage: string
            first20Seconds: string
        }
    }
    problemResolutionSection: {
        problemsMap: {
            problem1: string
            problem2: string
            problem3: string
            problem4: string
            problem5: string
        }
        matrixRows: Array<{
            selectedProblem: string
            affectedAudience: string
            generatedCost: string
            expectedChange: string
        }>
        mainProblem: {
            statement: string
            reason: string
        }
        precisionCheck: Array<{
            question: string
            verdict: '' | 'yes' | 'no'
            adjustment: string
        }>
    }
    competitiveDifferentialSection: {
        matrixRows: Array<{
            distinctiveTrait: string
            generatedValue: string
            audienceRelevance: string
        }>
        comparatorRows: Array<{
            genericPhrase: string
            differentialRewrite: string
        }>
        differentialPhrase: {
            version1: string
            version2: string
            version3: string
            primary: string
        }
        precisionCheck: Array<{
            question: string
            verdict: '' | 'yes' | 'no'
            adjustment: string
        }>
    }
    elevatorPitchSection: {
        structure: {
            whoIAm: string
            whoIHelp: string
            solvedProblem: string
            generatedValue: string
            differentiator: string
            nextStep: string
        }
        matrixRows: Array<{
            pitchPart: string
            whatISay: string
            evidence: string
            expectedReaction: string
        }>
        versions: {
            shortVersion: string
            extendedVersion: string
        }
        impactCheck: Array<{
            question: string
            verdict: '' | 'yes' | 'no'
            adjustment: string
        }>
    }
    strategicContentSection: {
        topicsMap: {
            topic1: string
            topic2: string
            topic3: string
            topic4: string
            topic5: string
            dispersingTopics: string
        }
        matrixRows: Array<{
            contentAxis: string
            primaryAudience: string
            axisObjective: string
            suggestedFormat: string
        }>
        finalAxes: Array<{
            axisName: string
            coreIdea: string
            targetPerception: string
        }>
        coherenceCheck: Array<{
            question: string
            verdict: '' | 'yes' | 'no'
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

const DEFAULT_STATE: WB4State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    storytellingSection: {
        fiveBlocks: {
            professionalOrigin: '',
            inflectionPoint: '',
            currentFocus: '',
            clearValue: '',
            futureDirection: ''
        },
        matrixRows: Array.from({ length: 4 }, () => ({
            selfStatement: '',
            communicatedValue: '',
            evidence: ''
        })),
        briefNarrative: ''
    },
    sloganSection: {
        verbalCore: {
            coreIdea: '',
            desiredEffect: '',
            keyDifferentiator: '',
            communicationFeeling: ''
        },
        versions: {
            version1: '',
            version2: '',
            version3: ''
        },
        qualityFilter: {
            clear: { v1: false, v2: false, v3: false },
            brief: { v1: false, v2: false, v3: false },
            representative: { v1: false, v2: false, v3: false },
            authentic: { v1: false, v2: false, v3: false },
            differentiated: { v1: false, v2: false, v3: false }
        },
        selectedSlogan: ''
    },
    valuePromiseSection: {
        matrix: {
            contribution: '',
            audience: '',
            addressedNeed: '',
            generatedResult: '',
            credibilityBasis: ''
        },
        formula: {
            short: {
                who: '',
                achieve: '',
                through: ''
            },
            extended: {
                who: '',
                solve: '',
                achieve: '',
                through: ''
            }
        },
        credibility: {
            evidence: '',
            experience: '',
            canSustain: '',
            needsStrengthening: ''
        },
        briefPromise: ''
    },
    primaryAudienceSection: {
        audienceMap: {
            audience1: '',
            audience2: '',
            audience3: '',
            audience4: '',
            audience5: ''
        },
        matrixRows: Array.from({ length: 5 }, () => ({
            audienceName: '',
            whatMatters: '',
            currentNeed: '',
            languageStyle: '',
            offeredValue: ''
        })),
        selector: {
            mainAudience: '',
            whyChosen: '',
            needsToHear: '',
            avoidWhenSpeaking: ''
        },
        resonanceTest: {
            mainNeed: '',
            mainConcern: '',
            rejectedLanguage: '',
            trustedLanguage: '',
            first20Seconds: ''
        }
    },
    problemResolutionSection: {
        problemsMap: {
            problem1: '',
            problem2: '',
            problem3: '',
            problem4: '',
            problem5: ''
        },
        matrixRows: Array.from({ length: 3 }, () => ({
            selectedProblem: '',
            affectedAudience: '',
            generatedCost: '',
            expectedChange: ''
        })),
        mainProblem: {
            statement: '',
            reason: ''
        },
        precisionCheck: [
            {
                question: '¿Se entiende a quién afecta?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Se entiende cuál es la tensión o necesidad?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Se entiende el costo de no resolverlo?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Está formulado de manera específica?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Me ayuda a enfocar mejor mi narrativa?',
                verdict: '',
                adjustment: ''
            }
        ]
    },
    competitiveDifferentialSection: {
        matrixRows: Array.from({ length: 4 }, () => ({
            distinctiveTrait: '',
            generatedValue: '',
            audienceRelevance: ''
        })),
        comparatorRows: Array.from({ length: 3 }, () => ({
            genericPhrase: '',
            differentialRewrite: ''
        })),
        differentialPhrase: {
            version1: '',
            version2: '',
            version3: '',
            primary: ''
        },
        precisionCheck: [
            {
                question: '¿Es específica y no genérica?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Responde a una necesidad real?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Mi audiencia entendería su valor?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Puedo sostenerlo con evidencia?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Me diferencia de otras propuestas similares?',
                verdict: '',
                adjustment: ''
            }
        ]
    },
    elevatorPitchSection: {
        structure: {
            whoIAm: '',
            whoIHelp: '',
            solvedProblem: '',
            generatedValue: '',
            differentiator: '',
            nextStep: ''
        },
        matrixRows: Array.from({ length: 5 }, () => ({
            pitchPart: '',
            whatISay: '',
            evidence: '',
            expectedReaction: ''
        })),
        versions: {
            shortVersion: '',
            extendedVersion: ''
        },
        impactCheck: [
            {
                question: '¿Se entiende en menos de 100 segundos?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Queda claro el problema que resuelvo?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Se entiende el valor que aporto?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Mi audiencia principal lo encontraría relevante?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Puedo adaptarlo sin perder coherencia?',
                verdict: '',
                adjustment: ''
            }
        ]
    },
    strategicContentSection: {
        topicsMap: {
            topic1: '',
            topic2: '',
            topic3: '',
            topic4: '',
            topic5: '',
            dispersingTopics: ''
        },
        matrixRows: Array.from({ length: 5 }, () => ({
            contentAxis: '',
            primaryAudience: '',
            axisObjective: '',
            suggestedFormat: ''
        })),
        finalAxes: Array.from({ length: 5 }, () => ({
            axisName: '',
            coreIdea: '',
            targetPerception: ''
        })),
        coherenceCheck: [
            {
                question: '¿Refuerzan mi narrativa profesional?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Le hablan a mi audiencia principal?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Construyen reputación estratégica?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Puedo sostenerlos con constancia?',
                verdict: '',
                adjustment: ''
            },
            {
                question: '¿Son coherentes entre sí?',
                verdict: '',
                adjustment: ''
            }
        ]
    },
    evaluation: createDefaultEvaluationData()
}

export function WB4Digital() {
    const [state, setState] = useState<WB4State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showStorytellingHelp, setShowStorytellingHelp] = useState(false)
    const [showExampleStep1, setShowExampleStep1] = useState(false)
    const [showExampleStep2, setShowExampleStep2] = useState(false)
    const [showExampleStep3, setShowExampleStep3] = useState(false)
    const [showSloganHelp, setShowSloganHelp] = useState(false)
    const [showSloganExample, setShowSloganExample] = useState(false)
    const [showPromiseHelp, setShowPromiseHelp] = useState(false)
    const [showPromiseExampleStep1, setShowPromiseExampleStep1] = useState(false)
    const [showPromiseExampleStep2, setShowPromiseExampleStep2] = useState(false)
    const [showPromiseExampleStep3, setShowPromiseExampleStep3] = useState(false)
    const [showPromiseExampleStep4, setShowPromiseExampleStep4] = useState(false)
    const [showAudienceHelp, setShowAudienceHelp] = useState(false)
    const [showAudienceExampleStep1, setShowAudienceExampleStep1] = useState(false)
    const [showAudienceExampleStep2, setShowAudienceExampleStep2] = useState(false)
    const [showAudienceExampleStep3, setShowAudienceExampleStep3] = useState(false)
    const [showAudienceExampleStep4, setShowAudienceExampleStep4] = useState(false)
    const [showProblemHelp, setShowProblemHelp] = useState(false)
    const [showProblemExampleStep1, setShowProblemExampleStep1] = useState(false)
    const [showProblemExampleStep2, setShowProblemExampleStep2] = useState(false)
    const [showProblemExampleStep3, setShowProblemExampleStep3] = useState(false)
    const [showProblemExampleStep4, setShowProblemExampleStep4] = useState(false)
    const [showDifferentialHelp, setShowDifferentialHelp] = useState(false)
    const [showDifferentialExampleStep1, setShowDifferentialExampleStep1] = useState(false)
    const [showDifferentialExampleStep2, setShowDifferentialExampleStep2] = useState(false)
    const [showDifferentialExampleStep3, setShowDifferentialExampleStep3] = useState(false)
    const [showDifferentialExampleStep4, setShowDifferentialExampleStep4] = useState(false)
    const [showElevatorHelp, setShowElevatorHelp] = useState(false)
    const [showElevatorExampleStep1, setShowElevatorExampleStep1] = useState(false)
    const [showElevatorExampleStep2, setShowElevatorExampleStep2] = useState(false)
    const [showElevatorExampleStep3, setShowElevatorExampleStep3] = useState(false)
    const [showElevatorExampleStep4, setShowElevatorExampleStep4] = useState(false)
    const [showContentAxesHelp, setShowContentAxesHelp] = useState(false)
    const [showContentAxesExampleStep1, setShowContentAxesExampleStep1] = useState(false)
    const [showContentAxesExampleStep2, setShowContentAxesExampleStep2] = useState(false)
    const [showContentAxesExampleStep3, setShowContentAxesExampleStep3] = useState(false)
    const [showContentAxesExampleStep4, setShowContentAxesExampleStep4] = useState(false)
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
                setState({ ...DEFAULT_STATE, ...JSON.parse(rawState) })
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

    const updateIdentification = (field: keyof WB4State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateFiveBlocks = (field: keyof WB4State['storytellingSection']['fiveBlocks'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            storytellingSection: {
                ...prev.storytellingSection,
                fiveBlocks: {
                    ...prev.storytellingSection.fiveBlocks,
                    [field]: value
                }
            }
        }))
    }

    const updateMatrixRow = (
        rowIndex: number,
        field: keyof WB4State['storytellingSection']['matrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            storytellingSection: {
                ...prev.storytellingSection,
                matrixRows: prev.storytellingSection.matrixRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateBriefNarrative = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            storytellingSection: {
                ...prev.storytellingSection,
                briefNarrative: value
            }
        }))
    }

    const updateSloganCore = (field: keyof WB4State['sloganSection']['verbalCore'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            sloganSection: {
                ...prev.sloganSection,
                verbalCore: {
                    ...prev.sloganSection.verbalCore,
                    [field]: value
                }
            }
        }))
    }

    const updateSloganVersion = (field: keyof WB4State['sloganSection']['versions'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            sloganSection: {
                ...prev.sloganSection,
                versions: {
                    ...prev.sloganSection.versions,
                    [field]: value
                }
            }
        }))
    }

    const toggleSloganFilter = (
        criterion: keyof WB4State['sloganSection']['qualityFilter'],
        version: keyof WB4State['sloganSection']['qualityFilter']['clear']
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            sloganSection: {
                ...prev.sloganSection,
                qualityFilter: {
                    ...prev.sloganSection.qualityFilter,
                    [criterion]: {
                        ...prev.sloganSection.qualityFilter[criterion],
                        [version]: !prev.sloganSection.qualityFilter[criterion][version]
                    }
                }
            }
        }))
    }

    const updateSelectedSlogan = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            sloganSection: {
                ...prev.sloganSection,
                selectedSlogan: value
            }
        }))
    }

    const updateValuePromiseMatrix = (field: keyof WB4State['valuePromiseSection']['matrix'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            valuePromiseSection: {
                ...prev.valuePromiseSection,
                matrix: {
                    ...prev.valuePromiseSection.matrix,
                    [field]: value
                }
            }
        }))
    }

    const updateValuePromiseShortFormula = (field: keyof WB4State['valuePromiseSection']['formula']['short'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            valuePromiseSection: {
                ...prev.valuePromiseSection,
                formula: {
                    ...prev.valuePromiseSection.formula,
                    short: {
                        ...prev.valuePromiseSection.formula.short,
                        [field]: value
                    }
                }
            }
        }))
    }

    const updateValuePromiseExtendedFormula = (
        field: keyof WB4State['valuePromiseSection']['formula']['extended'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            valuePromiseSection: {
                ...prev.valuePromiseSection,
                formula: {
                    ...prev.valuePromiseSection.formula,
                    extended: {
                        ...prev.valuePromiseSection.formula.extended,
                        [field]: value
                    }
                }
            }
        }))
    }

    const updateValuePromiseCredibility = (field: keyof WB4State['valuePromiseSection']['credibility'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            valuePromiseSection: {
                ...prev.valuePromiseSection,
                credibility: {
                    ...prev.valuePromiseSection.credibility,
                    [field]: value
                }
            }
        }))
    }

    const updateValuePromiseBrief = (value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            valuePromiseSection: {
                ...prev.valuePromiseSection,
                briefPromise: value
            }
        }))
    }

    const updateAudienceMap = (field: keyof WB4State['primaryAudienceSection']['audienceMap'], value: string) => {
        if (isLocked) return
        const index = Number(field.replace('audience', '')) - 1
        setState((prev) => ({
            ...prev,
            primaryAudienceSection: {
                ...prev.primaryAudienceSection,
                audienceMap: {
                    ...prev.primaryAudienceSection.audienceMap,
                    [field]: value
                },
                matrixRows: prev.primaryAudienceSection.matrixRows.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, audienceName: value } : row
                )
            }
        }))
    }

    const updateAudienceMatrixRow = (
        rowIndex: number,
        field: keyof WB4State['primaryAudienceSection']['matrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            primaryAudienceSection: {
                ...prev.primaryAudienceSection,
                matrixRows: prev.primaryAudienceSection.matrixRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateAudienceSelector = (field: keyof WB4State['primaryAudienceSection']['selector'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            primaryAudienceSection: {
                ...prev.primaryAudienceSection,
                selector: {
                    ...prev.primaryAudienceSection.selector,
                    [field]: value
                }
            }
        }))
    }

    const updateAudienceResonance = (field: keyof WB4State['primaryAudienceSection']['resonanceTest'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            primaryAudienceSection: {
                ...prev.primaryAudienceSection,
                resonanceTest: {
                    ...prev.primaryAudienceSection.resonanceTest,
                    [field]: value
                }
            }
        }))
    }

    const updateProblemMap = (field: keyof WB4State['problemResolutionSection']['problemsMap'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            problemResolutionSection: {
                ...prev.problemResolutionSection,
                problemsMap: {
                    ...prev.problemResolutionSection.problemsMap,
                    [field]: value
                }
            }
        }))
    }

    const updateProblemMatrixRow = (
        rowIndex: number,
        field: keyof WB4State['problemResolutionSection']['matrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            problemResolutionSection: {
                ...prev.problemResolutionSection,
                matrixRows: prev.problemResolutionSection.matrixRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateMainProblem = (field: keyof WB4State['problemResolutionSection']['mainProblem'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            problemResolutionSection: {
                ...prev.problemResolutionSection,
                mainProblem: {
                    ...prev.problemResolutionSection.mainProblem,
                    [field]: value
                }
            }
        }))
    }

    const updateProblemPrecision = (
        rowIndex: number,
        field: keyof WB4State['problemResolutionSection']['precisionCheck'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            problemResolutionSection: {
                ...prev.problemResolutionSection,
                precisionCheck: prev.problemResolutionSection.precisionCheck.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as '' | 'yes' | 'no') : value }
                        : row
                )
            }
        }))
    }

    const updateDifferentialMatrixRow = (
        rowIndex: number,
        field: keyof WB4State['competitiveDifferentialSection']['matrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            competitiveDifferentialSection: {
                ...prev.competitiveDifferentialSection,
                matrixRows: prev.competitiveDifferentialSection.matrixRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateDifferentialComparatorRow = (
        rowIndex: number,
        field: keyof WB4State['competitiveDifferentialSection']['comparatorRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            competitiveDifferentialSection: {
                ...prev.competitiveDifferentialSection,
                comparatorRows: prev.competitiveDifferentialSection.comparatorRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateDifferentialPhrase = (
        field: keyof WB4State['competitiveDifferentialSection']['differentialPhrase'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            competitiveDifferentialSection: {
                ...prev.competitiveDifferentialSection,
                differentialPhrase: {
                    ...prev.competitiveDifferentialSection.differentialPhrase,
                    [field]: value
                }
            }
        }))
    }

    const updateDifferentialPrecision = (
        rowIndex: number,
        field: keyof WB4State['competitiveDifferentialSection']['precisionCheck'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            competitiveDifferentialSection: {
                ...prev.competitiveDifferentialSection,
                precisionCheck: prev.competitiveDifferentialSection.precisionCheck.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as '' | 'yes' | 'no') : value }
                        : row
                )
            }
        }))
    }

    const updateElevatorStructure = (field: keyof WB4State['elevatorPitchSection']['structure'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            elevatorPitchSection: {
                ...prev.elevatorPitchSection,
                structure: {
                    ...prev.elevatorPitchSection.structure,
                    [field]: value
                }
            }
        }))
    }

    const updateElevatorMatrixRow = (
        rowIndex: number,
        field: keyof WB4State['elevatorPitchSection']['matrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            elevatorPitchSection: {
                ...prev.elevatorPitchSection,
                matrixRows: prev.elevatorPitchSection.matrixRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateElevatorVersion = (field: keyof WB4State['elevatorPitchSection']['versions'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            elevatorPitchSection: {
                ...prev.elevatorPitchSection,
                versions: {
                    ...prev.elevatorPitchSection.versions,
                    [field]: value
                }
            }
        }))
    }

    const updateElevatorImpact = (
        rowIndex: number,
        field: keyof WB4State['elevatorPitchSection']['impactCheck'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            elevatorPitchSection: {
                ...prev.elevatorPitchSection,
                impactCheck: prev.elevatorPitchSection.impactCheck.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as '' | 'yes' | 'no') : value }
                        : row
                )
            }
        }))
    }

    const updateContentTopicsMap = (field: keyof WB4State['strategicContentSection']['topicsMap'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicContentSection: {
                ...prev.strategicContentSection,
                topicsMap: {
                    ...prev.strategicContentSection.topicsMap,
                    [field]: value
                }
            }
        }))
    }

    const updateContentMatrixRow = (
        rowIndex: number,
        field: keyof WB4State['strategicContentSection']['matrixRows'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicContentSection: {
                ...prev.strategicContentSection,
                matrixRows: prev.strategicContentSection.matrixRows.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateFinalAxisRow = (
        rowIndex: number,
        field: keyof WB4State['strategicContentSection']['finalAxes'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicContentSection: {
                ...prev.strategicContentSection,
                finalAxes: prev.strategicContentSection.finalAxes.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateContentCoherence = (
        rowIndex: number,
        field: keyof WB4State['strategicContentSection']['coherenceCheck'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            strategicContentSection: {
                ...prev.strategicContentSection,
                coherenceCheck: prev.strategicContentSection.coherenceCheck.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? (value as '' | 'yes' | 'no') : value }
                        : row
                )
            }
        }))
    }

    const saveStorytellingBlock = (blockLabel: string) => {
        markVisited(3)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveSloganBlock = (blockLabel: string) => {
        markVisited(4)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveValuePromiseBlock = (blockLabel: string) => {
        markVisited(5)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveAudienceBlock = (blockLabel: string) => {
        markVisited(6)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveProblemBlock = (blockLabel: string) => {
        markVisited(7)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveDifferentialBlock = (blockLabel: string) => {
        markVisited(8)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveElevatorBlock = (blockLabel: string) => {
        markVisited(9)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveContentAxesBlock = (blockLabel: string) => {
        markVisited(10)
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
        markVisited(11)
        announceSave('Cierre del iShine guardado.')
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
        markVisited(11)
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
        savePage(11)
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
            document.title = 'WB4 - Narrativa profesional y Elevator Pitch'
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
            link.download = 'WB4-narrativa-profesional-elevator-pitch-completo.html'
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

    const fiveBlocks = state.storytellingSection.fiveBlocks
    const fiveBlocksCompleted = Object.values(fiveBlocks).every((value) => value.trim().length > 0)
    const matrixCompleted = state.storytellingSection.matrixRows.every(
        (row) =>
            row.selfStatement.trim().length > 0 &&
            row.communicatedValue.trim().length > 0 &&
            row.evidence.trim().length > 0
    )
    const briefNarrative = state.storytellingSection.briefNarrative
    const briefWordCount = briefNarrative
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    const briefCompleted = briefNarrative.trim().length > 0
    const block1Completed = fiveBlocksCompleted
    const block2Completed = matrixCompleted
    const block3Completed = briefCompleted
    const storytellingSectionCompleted = fiveBlocksCompleted && matrixCompleted && briefCompleted
    const matrixHasMissingEvidence = state.storytellingSection.matrixRows.some(
        (row) => (row.selfStatement.trim().length > 0 || row.communicatedValue.trim().length > 0) && row.evidence.trim().length === 0
    )
    const sloganCore = state.sloganSection.verbalCore
    const sloganVersions = state.sloganSection.versions
    const sloganQualityFilter = state.sloganSection.qualityFilter
    const sloganSelected = state.sloganSection.selectedSlogan
    const sloganVersionWordCount = {
        version1: sloganVersions.version1.trim().split(/\s+/).filter(Boolean).length,
        version2: sloganVersions.version2.trim().split(/\s+/).filter(Boolean).length,
        version3: sloganVersions.version3.trim().split(/\s+/).filter(Boolean).length
    }
    const longSloganVersions = Object.entries(sloganVersionWordCount)
        .filter(([, count]) => count > 10)
        .map(([key]) => key.replace('version', 'Versión '))
    const sloganLooksGeneric =
        sloganSelected.trim().length > 0 &&
        [/liderazgo transformador/i, /apasionad[oa]\s+por\s+ayudar/i, /comprometid[oa]\s+con\s+la\s+excelencia/i].some((regex) =>
            regex.test(sloganSelected)
        )
    const sloganExplorationCompleted = Object.values(sloganCore).every((value) => value.trim().length > 0)
    const sloganVersionsCompleted = Object.values(sloganVersions).every((value) => value.trim().length > 0)
    const sloganFilterCompleted = Object.values(sloganQualityFilter).every((criterion) => criterion.v1 || criterion.v2 || criterion.v3)
    const sloganSelectedCompleted = sloganSelected.trim().length > 0
    const sloganSectionCompleted =
        sloganExplorationCompleted && sloganVersionsCompleted && sloganFilterCompleted && sloganSelectedCompleted
    const valuePromiseMatrix = state.valuePromiseSection.matrix
    const valuePromiseFormula = state.valuePromiseSection.formula
    const valuePromiseCredibility = state.valuePromiseSection.credibility
    const valuePromiseBrief = state.valuePromiseSection.briefPromise
    const valuePromiseMatrixCompleted = Object.values(valuePromiseMatrix).every((value) => value.trim().length > 0)
    const valuePromiseShortFormulaCompleted = Object.values(valuePromiseFormula.short).every((value) => value.trim().length > 0)
    const valuePromiseCredibilityCompleted = Object.values(valuePromiseCredibility).every((value) => value.trim().length > 0)
    const valuePromiseBriefCompleted = valuePromiseBrief.trim().length > 0
    const valuePromiseSectionCompleted =
        valuePromiseMatrixCompleted &&
        valuePromiseShortFormulaCompleted &&
        valuePromiseCredibilityCompleted &&
        valuePromiseBriefCompleted
    const valuePromiseMissingAudience =
        valuePromiseMatrix.audience.trim().length === 0 && valuePromiseFormula.short.who.trim().length === 0
    const valuePromiseMissingResult =
        valuePromiseMatrix.generatedResult.trim().length === 0 && valuePromiseFormula.short.achieve.trim().length === 0
    const valuePromiseCredibilityEmpty = Object.values(valuePromiseCredibility).every((value) => value.trim().length === 0)
    const audienceMap = state.primaryAudienceSection.audienceMap
    const audienceMatrixRows = state.primaryAudienceSection.matrixRows
    const audienceSelector = state.primaryAudienceSection.selector
    const audienceResonance = state.primaryAudienceSection.resonanceTest
    const audienceEntries = [
        audienceMap.audience1.trim(),
        audienceMap.audience2.trim(),
        audienceMap.audience3.trim(),
        audienceMap.audience4.trim(),
        audienceMap.audience5.trim()
    ]
    const definedAudienceRows = audienceMatrixRows.filter((row) => row.audienceName.trim().length > 0)
    const audienceMapCompleted =
        audienceMap.audience1.trim().length > 0 && audienceMap.audience2.trim().length > 0 && audienceMap.audience3.trim().length > 0
    const audienceMatrixCompleted =
        definedAudienceRows.length >= 3 &&
        definedAudienceRows.every(
            (row) =>
                row.whatMatters.trim().length > 0 &&
                row.currentNeed.trim().length > 0 &&
                row.languageStyle.trim().length > 0 &&
                row.offeredValue.trim().length > 0
        )
    const audienceSelectorCompleted =
        audienceSelector.mainAudience.trim().length > 0 &&
        audienceSelector.whyChosen.trim().length > 0 &&
        audienceSelector.needsToHear.trim().length > 0 &&
        audienceSelector.avoidWhenSpeaking.trim().length > 0
    const audienceResonanceCompleted = Object.values(audienceResonance).every((value) => value.trim().length > 0)
    const audienceSectionCompleted = audienceMapCompleted && audienceMatrixCompleted && audienceSelectorCompleted && audienceResonanceCompleted
    const broadAudiencePattern =
        /(todo el mundo|cualquier persona|todas las personas|todo mercado|mercado general|cualquier l[ií]der|todos los l[ií]deres|cualquiera)/i
    const genericLanguagePattern = /^(lenguaje\s)?(claro|simple|general|formal|profesional|normal|directo)$/i
    const audienceHasTooBroadDefinition =
        audienceEntries.some((item) => item.length > 0 && broadAudiencePattern.test(item)) ||
        broadAudiencePattern.test(audienceSelector.mainAudience.trim())
    const audienceNeedsToHearMissing = audienceSelector.needsToHear.trim().length === 0
    const audienceLanguageLooksGeneric =
        definedAudienceRows.some((row) => genericLanguagePattern.test(row.languageStyle.trim())) ||
        genericLanguagePattern.test(audienceResonance.trustedLanguage.trim()) ||
        genericLanguagePattern.test(audienceResonance.rejectedLanguage.trim())
    const audienceDropdownOptions = Array.from(new Set(audienceEntries.filter((value) => value.length > 0)))
    const problemsMap = state.problemResolutionSection.problemsMap
    const problemsMatrixRows = state.problemResolutionSection.matrixRows
    const mainProblem = state.problemResolutionSection.mainProblem
    const problemPrecision = state.problemResolutionSection.precisionCheck
    const definedProblems = [
        problemsMap.problem1.trim(),
        problemsMap.problem2.trim(),
        problemsMap.problem3.trim(),
        problemsMap.problem4.trim(),
        problemsMap.problem5.trim()
    ]
    const problemOptions = Array.from(new Set(definedProblems.filter((item) => item.length > 0)))
    const problemsMapCompleted =
        problemsMap.problem1.trim().length > 0 &&
        problemsMap.problem2.trim().length > 0 &&
        problemsMap.problem3.trim().length > 0
    const problemsMatrixCompleted = problemsMatrixRows.every(
        (row) =>
            row.selectedProblem.trim().length > 0 &&
            row.affectedAudience.trim().length > 0 &&
            row.generatedCost.trim().length > 0 &&
            row.expectedChange.trim().length > 0
    )
    const mainProblemCompleted = mainProblem.statement.trim().length > 0 && mainProblem.reason.trim().length > 0
    const problemPrecisionCompleted =
        problemPrecision.length > 0 &&
        problemPrecision.every((row) => row.verdict.length > 0 && row.adjustment.trim().length > 0)
    const problemSectionCompleted =
        problemsMapCompleted && problemsMatrixCompleted && mainProblemCompleted && problemPrecisionCompleted
    const broadProblemPattern =
        /(las empresas necesitan crecer|la gente quiere mejorar|los l[ií]deres tienen retos|todo problema|de todo|general|en general|cualquiera|todo el mundo)/i
    const audienceMentionPattern = /(l[ií]der|equipo|profesional|directivo|sponsor|ejecutiv|organizaci[oó]n|empresa|audiencia)/i
    const problemTooBroad =
        definedProblems.some((item) => item.length > 0 && broadProblemPattern.test(item)) ||
        (mainProblem.statement.trim().length > 0 && broadProblemPattern.test(mainProblem.statement))
    const matrixMissingCost = problemsMatrixRows.some(
        (row) => row.selectedProblem.trim().length > 0 && row.generatedCost.trim().length === 0
    )
    const mainProblemMissingAudience =
        mainProblem.statement.trim().length > 0 && !audienceMentionPattern.test(mainProblem.statement)
    const differentialMatrixRows = state.competitiveDifferentialSection.matrixRows
    const differentialComparatorRows = state.competitiveDifferentialSection.comparatorRows
    const differentialPhrase = state.competitiveDifferentialSection.differentialPhrase
    const differentialPrecision = state.competitiveDifferentialSection.precisionCheck
    const differentialMatrixCompleted = differentialMatrixRows.every(
        (row) =>
            row.distinctiveTrait.trim().length > 0 &&
            row.generatedValue.trim().length > 0 &&
            row.audienceRelevance.trim().length > 0
    )
    const differentialComparatorCompleted = differentialComparatorRows.every(
        (row) => row.genericPhrase.trim().length > 0 && row.differentialRewrite.trim().length > 0
    )
    const differentialPhraseCompleted = Object.values(differentialPhrase).every((value) => value.trim().length > 0)
    const differentialPrecisionCompleted =
        differentialPrecision.length > 0 &&
        differentialPrecision.every((row) => row.verdict.length > 0 && row.adjustment.trim().length > 0)
    const differentialSectionCompleted =
        differentialMatrixCompleted &&
        differentialComparatorCompleted &&
        differentialPhraseCompleted &&
        differentialPrecisionCompleted
    const differentialActionVerbPattern =
        /(convierto|diseñ[oa]|traduzco|estructur[oa]|oriento|resuelvo|acompaño|genero|permito|ayudo|conecto|transformo|clarifico|impulso|lidero|construyo|ejecuto|activo|facilito|ordeno|priorizo)/i
    const differentialAdjectivePattern =
        /(innovador|estrat[eé]gic|transformacional|proactiv|visionari|apasionad|integral|creativ|din[aá]mic|disruptiv|excelente|multidisciplinari)/i
    const differentialPrimaryLooksAdjectiveOnly =
        differentialPhrase.primary.trim().length > 0 &&
        differentialAdjectivePattern.test(differentialPhrase.primary) &&
        !differentialActionVerbPattern.test(differentialPhrase.primary)
    const differentialMissingAudienceOrRelevance =
        differentialPhrase.primary.trim().length > 0 &&
        !audienceMentionPattern.test(differentialPhrase.primary) &&
        differentialMatrixRows.every((row) => row.audienceRelevance.trim().length === 0)
    const noRecentEvidenceInPreviousSections =
        state.storytellingSection.matrixRows.every((row) => row.evidence.trim().length === 0) &&
        state.valuePromiseSection.credibility.evidence.trim().length === 0 &&
        state.valuePromiseSection.credibility.experience.trim().length === 0
    const elevatorStructure = state.elevatorPitchSection.structure
    const elevatorMatrixRows = state.elevatorPitchSection.matrixRows
    const elevatorVersions = state.elevatorPitchSection.versions
    const elevatorImpact = state.elevatorPitchSection.impactCheck
    const elevatorStructureCompleted = Object.values(elevatorStructure).every((value) => value.trim().length > 0)
    const elevatorMatrixCompleted = elevatorMatrixRows.every(
        (row) =>
            row.pitchPart.trim().length > 0 &&
            row.whatISay.trim().length > 0 &&
            row.evidence.trim().length > 0 &&
            row.expectedReaction.trim().length > 0
    )
    const elevatorVersionsCompleted =
        elevatorVersions.shortVersion.trim().length > 0 && elevatorVersions.extendedVersion.trim().length > 0
    const elevatorImpactCompleted =
        elevatorImpact.length > 0 && elevatorImpact.every((row) => row.verdict.length > 0 && row.adjustment.trim().length > 0)
    const elevatorSectionCompleted =
        elevatorStructureCompleted && elevatorMatrixCompleted && elevatorVersionsCompleted && elevatorImpactCompleted
    const elevatorPartOptions = Array.from(
        new Set(
            [
                elevatorStructure.whoIAm.trim(),
                elevatorStructure.solvedProblem.trim(),
                elevatorStructure.generatedValue.trim(),
                elevatorStructure.differentiator.trim(),
                elevatorStructure.nextStep.trim()
            ].filter((item) => item.length > 0)
        )
    )
    const elevatorPitchPartOptions =
        elevatorPartOptions.length > 0
            ? elevatorPartOptions
            : ['Identidad / enfoque', 'Problema que resuelvo', 'Valor que aporto', 'Diferencial', 'Apertura / siguiente paso']
    const elevatorShortWordCount = elevatorVersions.shortVersion.trim().split(/\s+/).filter(Boolean).length
    const elevatorExtendedWordCount = elevatorVersions.extendedVersion.trim().split(/\s+/).filter(Boolean).length
    const elevatorMatrixMissingEvidence = elevatorMatrixRows.some(
        (row) => (row.pitchPart.trim().length > 0 || row.whatISay.trim().length > 0) && row.evidence.trim().length === 0
    )
    const elevatorProblemMentionPattern = /(problema|tensi[oó]n|brecha|necesidad|reto|bloqueo|desaf[ií]o|fricci[oó]n|riesgo)/i
    const elevatorResultMentionPattern = /(valor|resultado|impacto|mejora|cambio|claridad|diferenciaci[oó]n|influencia|tracci[oó]n)/i
    const elevatorCombinedText = `${elevatorVersions.shortVersion} ${elevatorVersions.extendedVersion}`.trim()
    const elevatorMissingProblem =
        elevatorCombinedText.length > 0 &&
        !elevatorProblemMentionPattern.test(elevatorCombinedText) &&
        elevatorStructure.solvedProblem.trim().length === 0
    const elevatorMissingValueOrResult =
        elevatorCombinedText.length > 0 &&
        !elevatorResultMentionPattern.test(elevatorCombinedText) &&
        elevatorStructure.generatedValue.trim().length === 0
    const elevatorTooLong = elevatorShortWordCount > 95 || elevatorExtendedWordCount > 180
    const contentTopicsMap = state.strategicContentSection.topicsMap
    const contentMatrixRows = state.strategicContentSection.matrixRows
    const contentFinalAxes = state.strategicContentSection.finalAxes
    const contentCoherence = state.strategicContentSection.coherenceCheck
    const contentTopicOptions = Array.from(
        new Set(
            [
                contentTopicsMap.topic1.trim(),
                contentTopicsMap.topic2.trim(),
                contentTopicsMap.topic3.trim(),
                contentTopicsMap.topic4.trim(),
                contentTopicsMap.topic5.trim()
            ].filter((item) => item.length > 0)
        )
    )
    const contentTopicsCompleted =
        contentTopicsMap.topic1.trim().length > 0 &&
        contentTopicsMap.topic2.trim().length > 0 &&
        contentTopicsMap.topic3.trim().length > 0 &&
        contentTopicsMap.topic4.trim().length > 0 &&
        contentTopicsMap.topic5.trim().length > 0
    const contentMatrixCompleted = contentMatrixRows.every(
        (row) =>
            row.contentAxis.trim().length > 0 &&
            row.primaryAudience.trim().length > 0 &&
            row.axisObjective.trim().length > 0 &&
            row.suggestedFormat.trim().length > 0
    )
    const completedFinalAxes = contentFinalAxes.filter(
        (row) =>
            row.axisName.trim().length > 0 &&
            row.coreIdea.trim().length > 0 &&
            row.targetPerception.trim().length > 0
    ).length
    const contentFinalAxesCompleted = completedFinalAxes >= 3 && completedFinalAxes <= 5
    const contentCoherenceCompleted =
        contentCoherence.length > 0 && contentCoherence.every((row) => row.verdict.length > 0 && row.adjustment.trim().length > 0)
    const contentSectionCompleted = contentTopicsCompleted && contentMatrixCompleted && contentFinalAxesCompleted && contentCoherenceCompleted
    const contentAxesWithMissingAudienceOrPerception = contentFinalAxes.some((row) => {
        if (row.axisName.trim().length === 0) return false
        const matchingMatrixRows = contentMatrixRows.filter((matrixRow) => matrixRow.contentAxis.trim() === row.axisName.trim())
        const hasAudience = matchingMatrixRows.some((matrixRow) => matrixRow.primaryAudience.trim().length > 0)
        const hasPerception = row.targetPerception.trim().length > 0
        return !hasAudience || !hasPerception
    })
    const normalizedAxisNames = contentFinalAxes
        .map((row) => row.axisName.trim().toLowerCase())
        .filter((item) => item.length > 0)
    const distinctAxisNames = new Set(normalizedAxisNames)
    const allAxesTooSimilar = normalizedAxisNames.length >= 3 && distinctAxisNames.size <= 2
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
    const sloganFilterRows: Array<{ key: keyof WB4State['sloganSection']['qualityFilter']; label: string }> = [
        { key: 'clear', label: 'Es clara' },
        { key: 'brief', label: 'Es breve' },
        { key: 'representative', label: 'Me representa' },
        { key: 'authentic', label: 'Se siente auténtica' },
        { key: 'differentiated', label: 'Tiene diferenciación' }
    ]

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: storytellingSectionCompleted,
        4: sloganSectionCompleted,
        5: valuePromiseSectionCompleted,
        6: audienceSectionCompleted,
        7: problemSectionCompleted,
        8: differentialSectionCompleted,
        9: elevatorSectionCompleted,
        10: contentSectionCompleted,
        11: evaluationSectionComplete
    }
    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb4-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="min-w-0 flex-1 sm:mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB4 - Narrativa profesional y Elevator Pitch</p>
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
                    <aside className={`wb4-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                                className="wb4-print-page wb4-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 11"
                                data-print-title="Portada"
                                data-cover-page="true"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb4-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Narrativa profesional y Elevator Pitch
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 4</p>
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
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 11"
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
                                            'Un storytelling ejecutivo claro y utilizable.',
                                            'Un slogan personal breve, memorable y coherente contigo.',
                                            'Una promesa de valor más precisa.',
                                            'Mayor claridad sobre tu audiencia principal.',
                                            'Una formulación concreta del problema que resuelves.',
                                            'Un primer enunciado de tu diferencial competitivo.',
                                            'Un elevator pitch estructurado.',
                                            'Un marco inicial para definir ejes de contenido estratégicos.'
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
                                                'Presencia digital e híbrida.'
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
                                                'Claridad e inspiración.',
                                                'Influencia ética y persuasión.',
                                                'Influencia asíncrona y virtual.'
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
                                            'Expresa objetivos y visión de futuro de forma clara, evitando ambigüedad sobre qué se espera y por qué es importante.',
                                            'Utiliza un tono entusiasta, historias o metáforas para alinear a otros bajo un propósito común y motivador.',
                                            'Utiliza la persuasión racional (datos/hechos) y el ejemplo personal ("walk the talk") en lugar de la manipulación o la amenaza.',
                                            'Proyecta la misma "gravitas" y calidez en videoconferencias que en persona.',
                                            'Gestiona su reputación y narrativa en plataformas digitales (LinkedIn) de forma estratégica, no solo social.'
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
                                            'Este workbook no es para listar cargos, tareas o diplomas. Es para traducir tu trayectoria en una narrativa de valor.',
                                            'Una buena narrativa profesional selecciona, no acumula. Si quieres contar todo, perderás claridad.',
                                            'No basta con decir “hago consultoría”, “lidero equipos” o “doy formación”. Necesitas poder explicar qué problema resuelves, para quién y qué cambia gracias a ti.',
                                            'Frases como: “me apasiona ayudar”, “soy líder transformacional”, “tengo amplia experiencia” no diferencian. Tu tarea es encontrar una formulación más precisa, propia y demostrable.',
                                            'La percepción de valor no se construye con grandilocuencia, sino con claridad, enfoque, coherencia y evidencia.',
                                            'Si una afirmación sobre tu valor o diferencial no tiene ejemplo, caso o resultado que la sostenga, escribe: “No tengo evidencia reciente.” Eso también es un hallazgo útil.'
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
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 11"
                                data-print-title="Construcción de storytelling ejecutivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Construcción de storytelling ejecutivo</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Esta sección te ayudará a construir una narrativa profesional que responda con claridad quién eres, qué te ha formado,
                                        qué problema resuelves, qué valor aportas y por qué tu mensaje merece ser escuchado.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStorytellingHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Un storytelling ejecutivo es una narrativa profesional breve que selecciona lo esencial, conecta experiencia con valor y deja una idea clara sobre ti.',
                                            'No es una biografía completa, ni una lista de cargos, ni un discurso largo.',
                                            'Debe ayudarte a comunicar con claridad, coherencia, credibilidad, diferenciación y adaptación según audiencia.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Estructura de storytelling ejecutivo en 5 bloques</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block1Completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {block1Completed ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Mi origen profesional se ha construido en</span>
                                            <textarea
                                                rows={2}
                                                value={state.storytellingSection.fiveBlocks.professionalOrigin}
                                                onChange={(event) => updateFiveBlocks('professionalOrigin', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Un punto de inflexión que redefinió mi enfoque fue</span>
                                            <textarea
                                                rows={2}
                                                value={state.storytellingSection.fiveBlocks.inflectionPoint}
                                                onChange={(event) => updateFiveBlocks('inflectionPoint', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Hoy concentro mi trabajo en</span>
                                            <textarea
                                                rows={2}
                                                value={state.storytellingSection.fiveBlocks.currentFocus}
                                                onChange={(event) => updateFiveBlocks('currentFocus', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. El valor que aporto con mayor claridad es</span>
                                            <textarea
                                                rows={2}
                                                value={state.storytellingSection.fiveBlocks.clearValue}
                                                onChange={(event) => updateFiveBlocks('clearValue', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. La dirección que estoy construyendo es</span>
                                            <textarea
                                                rows={2}
                                                value={state.storytellingSection.fiveBlocks.futureDirection}
                                                onChange={(event) => updateFiveBlocks('futureDirection', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStorytellingBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Matriz Historia – Valor – Prueba</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block2Completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {block2Completed ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[820px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que digo de mí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Valor que comunica</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Prueba / evidencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.storytellingSection.matrixRows.map((row, rowIndex) => (
                                                    <tr key={`matrix-row-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.selfStatement}
                                                                onChange={(event) => updateMatrixRow(rowIndex, 'selfStatement', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.communicatedValue}
                                                                onChange={(event) => updateMatrixRow(rowIndex, 'communicatedValue', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.evidence}
                                                                onChange={(event) => updateMatrixRow(rowIndex, 'evidence', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {matrixHasMissingEvidence && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: agrega una prueba o escribe “Completar” en filas sin evidencia.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStorytellingBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Versión breve del storytelling (50–70 palabras)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block3Completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {block3Completed ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi narrativa ejecutiva breve (50–70 palabras)</span>
                                        <textarea
                                            rows={6}
                                            value={state.storytellingSection.briefNarrative}
                                            onChange={(event) => updateBriefNarrative(event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm text-slate-600">
                                            Conteo de palabras: <span className="font-bold text-slate-900">{briefWordCount}</span> (recomendado: 50–70)
                                        </p>
                                        {briefWordCount > 70 && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                                Sugerencia: intenta reducir para ganar claridad.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveStorytellingBlock('Paso 3')}
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
                                            '¿Qué parte de mi historia sí aporta a mi narrativa?',
                                            '¿Qué parte sobra o me dispersa?',
                                            '¿Qué evidencia sostiene lo que digo de mí?',
                                            '¿Qué idea quiero dejar instalada cuando me presento?'
                                        ].map((item) => (
                                            <li key={item} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${storytellingSectionCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                                            {storytellingSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
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
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 11"
                                data-print-title="Slogan personal"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Slogan personal</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Condensa tu identidad profesional en una frase breve, clara y recordable. Tu slogan personal no reemplaza tu storytelling
                                        ejecutivo; lo resume.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSloganHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Un slogan personal es una frase breve que sintetiza tu enfoque y tu valor de forma clara, auténtica y diferenciada.',
                                            'No es una frase decorativa, ni una etiqueta genérica, ni una versión abreviada de tu CV.',
                                            'Debe ayudarte a comunicar qué aportas, cómo quieres ser percibido y qué idea quieres dejar instalada.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Exploración del núcleo verbal</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowSloganExample(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    sloganExplorationCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {sloganExplorationCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                1. La palabra o idea que mejor resume lo que aporto es
                                            </span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.verbalCore.coreIdea}
                                                onChange={(event) => updateSloganCore('coreIdea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                2. El efecto que más quiero generar en otros es
                                            </span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.verbalCore.desiredEffect}
                                                onChange={(event) => updateSloganCore('desiredEffect', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                3. El rasgo que más me diferencia hoy es
                                            </span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.verbalCore.keyDifferentiator}
                                                onChange={(event) => updateSloganCore('keyDifferentiator', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                4. La sensación que quiero dejar cuando comunico es
                                            </span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.verbalCore.communicationFeeling}
                                                onChange={(event) => updateSloganCore('communicationFeeling', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveSloganBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Fórmulas de slogan</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sloganVersionsCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sloganVersionsCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Fórmulas sugeridas</p>
                                        <p>
                                            <span className="font-semibold">Fórmula A:</span> “________ con ________.”
                                        </p>
                                        <p>
                                            <span className="font-semibold">Fórmula B:</span> “Transformo ________ en ________.”
                                        </p>
                                        <p>
                                            <span className="font-semibold">Fórmula C:</span> “Diseño ________ para ________.”
                                        </p>
                                    </article>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión 1</span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.versions.version1}
                                                onChange={(event) => updateSloganVersion('version1', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión 2</span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.versions.version2}
                                                onChange={(event) => updateSloganVersion('version2', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>

                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión 3</span>
                                            <input
                                                type="text"
                                                value={state.sloganSection.versions.version3}
                                                onChange={(event) => updateSloganVersion('version3', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {longSloganVersions.length > 0 && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: intenta simplificar para ganar recordación ({longSloganVersions.join(', ')} supera 8–10 palabras).
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveSloganBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Filtro de calidad del slogan</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                sloganFilterCompleted && sloganSelectedCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {sloganFilterCompleted && sloganSelectedCompleted ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Criterio</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Versión 1</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Versión 2</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Versión 3</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sloganFilterRows.map((row) => (
                                                    <tr key={row.key}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.label}</td>
                                                        {(['v1', 'v2', 'v3'] as const).map((version) => (
                                                            <td key={`${row.key}-${version}`} className="px-4 py-3 border-b border-slate-100">
                                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={state.sloganSection.qualityFilter[row.key][version]}
                                                                        onChange={() => toggleSloganFilter(row.key, version)}
                                                                        disabled={isLocked}
                                                                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                    />
                                                                    Marcar
                                                                </label>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi slogan elegido es</span>
                                        <input
                                            type="text"
                                            value={state.sloganSection.selectedSlogan}
                                            onChange={(event) => updateSelectedSlogan(event.target.value)}
                                            disabled={isLocked}
                                            placeholder="Escribe tu slogan final"
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    {sloganLooksGeneric && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: hazla más específica. ¿Qué conviertes, diseñas, clarificas o resuelves?
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveSloganBlock('Paso 3')}
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
                                            '¿Qué idea central quiero que otros asocien conmigo?',
                                            '¿Qué frase resume mejor mi valor?',
                                            '¿Qué versión se siente más auténtica y creíble?',
                                            '¿Qué parte de mi mensaje todavía suena genérica?'
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
                                                sloganSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {sloganSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
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
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 11"
                                data-print-title="Promesa de valor"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Promesa de valor</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Responde una pregunta central: ¿qué valor concreto ofrezco y por qué alguien debería elegirme, escucharme o confiar en mí?
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos clave</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromiseHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'La promesa de valor es una formulación breve y precisa del valor que ofreces, el problema que atiendes y el resultado que ayudas a generar.',
                                            'No es una lista de servicios ni una frase aspiracional sin prueba.',
                                            'Debe permitir entender qué obtiene otra persona contigo, qué te hace confiable y qué diferencia produce tu trabajo.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Matriz Valor – Destinatario – Resultado</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPromiseExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    valuePromiseMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {valuePromiseMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo que aporto</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.matrix.contribution}
                                                onChange={(event) => updateValuePromiseMatrix('contribution', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">A quién lo aporto</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.matrix.audience}
                                                onChange={(event) => updateValuePromiseMatrix('audience', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué problema, necesidad o tensión atiendo</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.matrix.addressedNeed}
                                                onChange={(event) => updateValuePromiseMatrix('addressedNeed', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué cambio o resultado ayudo a generar</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.matrix.generatedResult}
                                                onChange={(event) => updateValuePromiseMatrix('generatedResult', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué hace creíble esta promesa</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.matrix.credibilityBasis}
                                                onChange={(event) => updateValuePromiseMatrix('credibilityBasis', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {(valuePromiseMissingAudience || valuePromiseMissingResult) && (
                                        <div className="space-y-2">
                                            {valuePromiseMissingAudience && (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                    Sugerencia: especifica para quién es tu valor.
                                                </p>
                                            )}
                                            {valuePromiseMissingResult && (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                    Sugerencia: aclara qué cambia o mejora gracias a ti.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValuePromiseBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Fórmula de promesa de valor</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPromiseExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    valuePromiseShortFormulaCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {valuePromiseShortFormulaCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Fórmulas sugeridas</p>
                                        <p className="mt-2">Versión corta: “Ayudo a ______ a lograr ______ mediante ______.”</p>
                                        <p className="mt-1">Versión ampliada: “Ayudo a ______ a resolver ______ y lograr ______ mediante ______.”</p>
                                    </article>

                                    <div className="grid grid-cols-1 gap-4">
                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Versión corta</p>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Ayudo a</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.short.who}
                                                onChange={(event) => updateValuePromiseShortFormula('who', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">a lograr</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.short.achieve}
                                                onChange={(event) => updateValuePromiseShortFormula('achieve', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">mediante</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.short.through}
                                                onChange={(event) => updateValuePromiseShortFormula('through', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Versión ampliada (opcional)</p>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Ayudo a</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.extended.who}
                                                onChange={(event) => updateValuePromiseExtendedFormula('who', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">a resolver</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.extended.solve}
                                                onChange={(event) => updateValuePromiseExtendedFormula('solve', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">y lograr</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.extended.achieve}
                                                onChange={(event) => updateValuePromiseExtendedFormula('achieve', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">mediante</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.formula.extended.through}
                                                onChange={(event) => updateValuePromiseExtendedFormula('through', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValuePromiseBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Prueba de credibilidad</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPromiseExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    valuePromiseCredibilityCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {valuePromiseCredibilityCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">¿Qué evidencia real respalda mi promesa?</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.credibility.evidence}
                                                onChange={(event) => updateValuePromiseCredibility('evidence', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">¿Qué experiencia me autoriza a decir esto?</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.credibility.experience}
                                                onChange={(event) => updateValuePromiseCredibility('experience', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">¿Qué parte hoy sí puedo sostener con seguridad?</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.credibility.canSustain}
                                                onChange={(event) => updateValuePromiseCredibility('canSustain', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">¿Qué parte todavía debo fortalecer o demostrar mejor?</span>
                                            <input
                                                type="text"
                                                value={state.valuePromiseSection.credibility.needsStrengthening}
                                                onChange={(event) => updateValuePromiseCredibility('needsStrengthening', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {valuePromiseCredibilityEmpty && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: agrega una evidencia o escribe “Completar”.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValuePromiseBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4. Versión breve de promesa de valor</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPromiseExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    valuePromiseBriefCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {valuePromiseBriefCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi promesa de valor breve (1–2 líneas)</span>
                                        <textarea
                                            rows={3}
                                            value={state.valuePromiseSection.briefPromise}
                                            onChange={(event) => updateValuePromiseBrief(event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveValuePromiseBlock('Paso 4')}
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
                                            '¿Qué valor concreto ofrezco?',
                                            '¿A quién se lo ofrezco?',
                                            '¿Qué resultado ayudo a generar?',
                                            '¿Qué evidencia sostiene esa promesa?'
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
                                                valuePromiseSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {valuePromiseSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
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
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 11"
                                data-print-title="Definición de audiencia principal"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Definición de audiencia principal
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Define con precisión a quién quieres hablarle primero y para quién quieres ser especialmente relevante.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAudienceHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Una audiencia principal es el grupo con el que más te interesa conectar por relevancia estratégica y necesidad real de tu valor.',
                                            'No es “todo el mercado” ni “cualquier líder”; una audiencia amplia debilita tu claridad.',
                                            'Una audiencia bien definida te ayuda a decidir qué decir, qué omitir, qué tono usar y qué problema enfatizar.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Mapa inicial de audiencias posibles</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAudienceExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
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
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Audiencia 1</span>
                                            <input
                                                type="text"
                                                value={state.primaryAudienceSection.audienceMap.audience1}
                                                onChange={(event) => updateAudienceMap('audience1', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Audiencia 2</span>
                                            <input
                                                type="text"
                                                value={state.primaryAudienceSection.audienceMap.audience2}
                                                onChange={(event) => updateAudienceMap('audience2', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Audiencia 3</span>
                                            <input
                                                type="text"
                                                value={state.primaryAudienceSection.audienceMap.audience3}
                                                onChange={(event) => updateAudienceMap('audience3', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Audiencia 4 (opcional)</span>
                                            <input
                                                type="text"
                                                value={state.primaryAudienceSection.audienceMap.audience4}
                                                onChange={(event) => updateAudienceMap('audience4', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Audiencia 5 (opcional)</span>
                                            <input
                                                type="text"
                                                value={state.primaryAudienceSection.audienceMap.audience5}
                                                onChange={(event) => updateAudienceMap('audience5', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {audienceHasTooBroadDefinition && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: haz la audiencia más específica (rol, contexto o momento).
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAudienceBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Matriz Audiencia – Necesidad – Lenguaje – Valor</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAudienceExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    audienceMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {audienceMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Audiencia</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué le importa</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué necesita / problema vive</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué lenguaje entiende mejor</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué valor puedo aportar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.primaryAudienceSection.matrixRows.map((row, rowIndex) => {
                                                    const label = row.audienceName.trim() || audienceEntries[rowIndex] || ''
                                                    const rowEnabled = label.length > 0
                                                    return (
                                                        <tr key={`audience-matrix-row-${rowIndex}`}>
                                                            <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                                                {label || (rowIndex < 3 ? `Audiencia ${rowIndex + 1}` : `Audiencia ${rowIndex + 1} (opcional)`)}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={row.whatMatters}
                                                                    onChange={(event) => updateAudienceMatrixRow(rowIndex, 'whatMatters', event.target.value)}
                                                                    disabled={isLocked || !rowEnabled}
                                                                    placeholder={rowEnabled ? '' : 'Define audiencia en Paso 1'}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={row.currentNeed}
                                                                    onChange={(event) => updateAudienceMatrixRow(rowIndex, 'currentNeed', event.target.value)}
                                                                    disabled={isLocked || !rowEnabled}
                                                                    placeholder={rowEnabled ? '' : 'Define audiencia en Paso 1'}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={row.languageStyle}
                                                                    onChange={(event) => updateAudienceMatrixRow(rowIndex, 'languageStyle', event.target.value)}
                                                                    disabled={isLocked || !rowEnabled}
                                                                    placeholder={rowEnabled ? '' : 'Define audiencia en Paso 1'}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-slate-100">
                                                                <input
                                                                    type="text"
                                                                    value={row.offeredValue}
                                                                    onChange={(event) => updateAudienceMatrixRow(rowIndex, 'offeredValue', event.target.value)}
                                                                    disabled={isLocked || !rowEnabled}
                                                                    placeholder={rowEnabled ? '' : 'Define audiencia en Paso 1'}
                                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {audienceLanguageLooksGeneric && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: especifica mejor el lenguaje (ejecutivo, técnico, simple, estratégico o conversacional aplicado a contexto).
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAudienceBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Selector de audiencia principal</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAudienceExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    audienceSelectorCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {audienceSelectorCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi audiencia principal hoy es</span>
                                            <select
                                                value={state.primaryAudienceSection.selector.mainAudience}
                                                onChange={(event) => updateAudienceSelector('mainAudience', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona una audiencia</option>
                                                {audienceDropdownOptions.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">La elijo porque</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.selector.whyChosen}
                                                onChange={(event) => updateAudienceSelector('whyChosen', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo que más necesita escuchar de mí es</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.selector.needsToHear}
                                                onChange={(event) => updateAudienceSelector('needsToHear', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo que debo evitar al hablarle es</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.selector.avoidWhenSpeaking}
                                                onChange={(event) => updateAudienceSelector('avoidWhenSpeaking', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {audienceNeedsToHearMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: aclara qué debería entender esa audiencia de ti rápidamente.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAudienceBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4. Prueba de sintonía del mensaje</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAudienceExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    audienceResonanceCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {audienceResonanceCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. ¿Qué problema o necesidad principal tiene esta audiencia?</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.resonanceTest.mainNeed}
                                                onChange={(event) => updateAudienceResonance('mainNeed', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. ¿Qué le preocupa más al escuchar una propuesta como la mía?</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.resonanceTest.mainConcern}
                                                onChange={(event) => updateAudienceResonance('mainConcern', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. ¿Qué tipo de lenguaje rechaza o desconecta?</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.resonanceTest.rejectedLanguage}
                                                onChange={(event) => updateAudienceResonance('rejectedLanguage', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. ¿Qué tipo de lenguaje le genera más confianza?</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.resonanceTest.trustedLanguage}
                                                onChange={(event) => updateAudienceResonance('trustedLanguage', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. ¿Qué debería entender en los primeros 20 segundos cuando me presento?</span>
                                            <textarea
                                                rows={2}
                                                value={state.primaryAudienceSection.resonanceTest.first20Seconds}
                                                onChange={(event) => updateAudienceResonance('first20Seconds', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveAudienceBlock('Paso 4')}
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
                                            '¿A quién quiero hablarle primero?',
                                            '¿Qué necesita esa audiencia?',
                                            '¿Qué espera escuchar de alguien como yo?',
                                            '¿Cómo debo ajustar mi mensaje para conectar mejor?',
                                            '¿Qué debo evitar para no perder sintonía?'
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
                                                audienceSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {audienceSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
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
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 11"
                                data-print-title="¿Qué problema resuelve?"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">¿Qué problema resuelve?</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Define con precisión qué tensión atiendes, a quién afecta, qué costo genera y qué cambio facilitas cuando se resuelve.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowProblemHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Problema en esta sección puede ser necesidad no resuelta, tensión recurrente, brecha de ejecución o falta de alineación.',
                                            'Evita formulaciones amplias como “las empresas necesitan crecer” o “los líderes tienen retos”.',
                                            'Nombra el problema con precisión: qué pasa, a quién le pasa, qué costo tiene y por qué importa resolverlo.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Mapa de problemas posibles</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowProblemExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    problemsMapCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {problemsMapCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Problema 1</span>
                                            <input
                                                type="text"
                                                value={state.problemResolutionSection.problemsMap.problem1}
                                                onChange={(event) => updateProblemMap('problem1', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Problema 2</span>
                                            <input
                                                type="text"
                                                value={state.problemResolutionSection.problemsMap.problem2}
                                                onChange={(event) => updateProblemMap('problem2', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Problema 3</span>
                                            <input
                                                type="text"
                                                value={state.problemResolutionSection.problemsMap.problem3}
                                                onChange={(event) => updateProblemMap('problem3', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Problema 4 (opcional)</span>
                                            <input
                                                type="text"
                                                value={state.problemResolutionSection.problemsMap.problem4}
                                                onChange={(event) => updateProblemMap('problem4', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Problema 5 (opcional)</span>
                                            <input
                                                type="text"
                                                value={state.problemResolutionSection.problemsMap.problem5}
                                                onChange={(event) => updateProblemMap('problem5', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {problemTooBroad && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: hazlo más específico. ¿A quién le pasa exactamente y qué costo tiene?
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveProblemBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Matriz Problema – Afectado – Costo – Cambio</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowProblemExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    problemsMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {problemsMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Problema / tensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿A quién afecta?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Qué costo genera?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Qué cambio se logra si se resuelve?</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.problemResolutionSection.matrixRows.map((row, rowIndex) => (
                                                    <tr key={`problem-matrix-row-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.selectedProblem}
                                                                onChange={(event) => updateProblemMatrixRow(rowIndex, 'selectedProblem', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona un problema</option>
                                                                {problemOptions.map((option) => (
                                                                    <option key={`${option}-${rowIndex}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.affectedAudience}
                                                                onChange={(event) => updateProblemMatrixRow(rowIndex, 'affectedAudience', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.generatedCost}
                                                                onChange={(event) => updateProblemMatrixRow(rowIndex, 'generatedCost', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.expectedChange}
                                                                onChange={(event) => updateProblemMatrixRow(rowIndex, 'expectedChange', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {matrixMissingCost && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: aclara qué pierde o qué riesgo enfrenta esa audiencia si no lo resuelve.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveProblemBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Problema principal en una frase</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowProblemExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    mainProblemCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {mainProblemCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi problema principal en una frase es</span>
                                            <textarea
                                                rows={3}
                                                value={state.problemResolutionSection.mainProblem.statement}
                                                onChange={(event) => updateMainProblem('statement', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo elijo porque</span>
                                            <textarea
                                                rows={2}
                                                value={state.problemResolutionSection.mainProblem.reason}
                                                onChange={(event) => updateMainProblem('reason', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {mainProblemMissingAudience && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: incluye a quién afecta para ganar precisión.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveProblemBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4. Prueba de precisión del problema</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowProblemExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    problemPrecisionCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {problemPrecisionCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[820px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.problemResolutionSection.precisionCheck.map((row, rowIndex) => (
                                                    <tr key={`problem-precision-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`precision-${rowIndex}`}
                                                                    checked={row.verdict === 'yes'}
                                                                    onChange={() => updateProblemPrecision(rowIndex, 'verdict', 'yes')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`precision-${rowIndex}`}
                                                                    checked={row.verdict === 'no'}
                                                                    onChange={() => updateProblemPrecision(rowIndex, 'verdict', 'no')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateProblemPrecision(rowIndex, 'adjustment', event.target.value)}
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
                                            onClick={() => saveProblemBlock('Paso 4')}
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
                                            '¿Qué problema ayudo a resolver?',
                                            '¿A quién le ocurre?',
                                            '¿Qué costo tiene no resolverlo?',
                                            '¿Qué cambio facilito?',
                                            '¿Cómo este problema organiza mejor mi narrativa y mi pitch?'
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
                                                problemSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {problemSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(7)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 7
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 8 de 11"
                                data-print-title="Diferencial competitivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 8</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Diferencial competitivo</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Responde qué te hace distinto, relevante y preferible frente a otras opciones o perfiles. Busca una diferencia
                                        estratégica, creíble y defendible.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDifferentialHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Un diferencial competitivo es la razón por la cual otra persona percibe valor específico, claridad y utilidad en tu propuesta.',
                                            'No es decir “soy mejor que otros”, ni usar adjetivos vacíos como innovador o transformacional sin evidencia.',
                                            'Debe conectar diferencia clara, utilidad concreta, ventaja creíble y relevancia para tu audiencia.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Matriz Rasgo – Valor – Relevancia</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDifferentialExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    differentialMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {differentialMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        Rasgo o fortaleza distintiva
                                                    </th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        Valor que genera
                                                    </th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        ¿Por qué es relevante para mi audiencia?
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {differentialMatrixRows.map((row, rowIndex) => (
                                                    <tr key={`differential-matrix-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.distinctiveTrait}
                                                                onChange={(event) =>
                                                                    updateDifferentialMatrixRow(rowIndex, 'distinctiveTrait', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.generatedValue}
                                                                onChange={(event) =>
                                                                    updateDifferentialMatrixRow(rowIndex, 'generatedValue', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.audienceRelevance}
                                                                onChange={(event) =>
                                                                    updateDifferentialMatrixRow(rowIndex, 'audienceRelevance', event.target.value)
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

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveDifferentialBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Comparador “Común vs Diferencial”</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDifferentialExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    differentialComparatorCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {differentialComparatorCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        Frase común / genérica
                                                    </th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">
                                                        Reformulación diferencial
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {differentialComparatorRows.map((row, rowIndex) => (
                                                    <tr key={`differential-comparator-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.genericPhrase}
                                                                onChange={(event) =>
                                                                    updateDifferentialComparatorRow(rowIndex, 'genericPhrase', event.target.value)
                                                                }
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.differentialRewrite}
                                                                onChange={(event) =>
                                                                    updateDifferentialComparatorRow(rowIndex, 'differentialRewrite', event.target.value)
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

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveDifferentialBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Diferencial competitivo en una frase</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDifferentialExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    differentialPhraseCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {differentialPhraseCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <article className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Fórmulas sugeridas</p>
                                        <p>
                                            <span className="font-semibold">Fórmula A:</span> “Me diferencio por ______, porque eso permite ______.”
                                        </p>
                                        <p>
                                            <span className="font-semibold">Fórmula B:</span> “A diferencia de propuestas más ______, yo aporto ______.”
                                        </p>
                                        <p>
                                            <span className="font-semibold">Fórmula C:</span> “Mi diferencial está en combinar ______ con ______ para generar ______.”
                                        </p>
                                    </article>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión 1</span>
                                            <input
                                                type="text"
                                                value={differentialPhrase.version1}
                                                onChange={(event) => updateDifferentialPhrase('version1', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión 2</span>
                                            <input
                                                type="text"
                                                value={differentialPhrase.version2}
                                                onChange={(event) => updateDifferentialPhrase('version2', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión 3</span>
                                            <input
                                                type="text"
                                                value={differentialPhrase.version3}
                                                onChange={(event) => updateDifferentialPhrase('version3', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mi diferencial competitivo principal es</span>
                                            <textarea
                                                rows={3}
                                                value={differentialPhrase.primary}
                                                onChange={(event) => updateDifferentialPhrase('primary', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    {differentialPrimaryLooksAdjectiveOnly && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: hazlo más concreto. ¿Qué haces distinto y qué produce eso?
                                        </p>
                                    )}
                                    {differentialMissingAudienceOrRelevance && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: aclara para quién importa esta diferencia y por qué es relevante.
                                        </p>
                                    )}
                                    {differentialPhrase.primary.trim().length > 0 && noRecentEvidenceInPreviousSections && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: agrega una prueba en instrumentos previos o escribe “Completar”.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveDifferentialBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4. Prueba de diferenciación estratégica</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDifferentialExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    differentialPrecisionCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {differentialPrecisionCompleted ? 'Completado' : 'Pendiente'}
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
                                                {differentialPrecision.map((row, rowIndex) => (
                                                    <tr key={`differential-precision-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`differential-precision-${rowIndex}`}
                                                                    checked={row.verdict === 'yes'}
                                                                    onChange={() => updateDifferentialPrecision(rowIndex, 'verdict', 'yes')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`differential-precision-${rowIndex}`}
                                                                    checked={row.verdict === 'no'}
                                                                    onChange={() => updateDifferentialPrecision(rowIndex, 'verdict', 'no')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) =>
                                                                    updateDifferentialPrecision(rowIndex, 'adjustment', event.target.value)
                                                                }
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
                                            onClick={() => saveDifferentialBlock('Paso 4')}
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
                                            '¿Qué me hace realmente diferente?',
                                            '¿Por qué esa diferencia importa?',
                                            '¿Qué parte de mi narrativa sí me distingue?',
                                            '¿Qué parte todavía suena genérica?',
                                            '¿Qué evidencia sostiene mi diferencial?'
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
                                                differentialSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {differentialSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(8)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 8
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(9) && (
                            <article
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 9 de 11"
                                data-print-title="Elevator pitch estructurado"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 9</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Elevator pitch estructurado</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Sintetiza quién eres, qué problema resuelves, qué valor aportas y por qué vale la pena seguir conversando contigo en 30 a
                                        90 segundos.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowElevatorHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Un elevator pitch es una formulación breve, estructurada y persuasiva de tu valor profesional.',
                                            'No es un mini-CV ni autopromoción vacía; debe enfocarse en problema, valor, diferencia y apertura.',
                                            'Debe ser claro, breve, creíble, adaptable y coherente contigo.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Estructura del elevator pitch en 6 bloques</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowElevatorExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    elevatorStructureCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {elevatorStructureCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Quién soy / mi enfoque profesional</span>
                                            <textarea
                                                rows={2}
                                                value={elevatorStructure.whoIAm}
                                                onChange={(event) => updateElevatorStructure('whoIAm', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. A quién ayudo o con quién trabajo</span>
                                            <textarea
                                                rows={2}
                                                value={elevatorStructure.whoIHelp}
                                                onChange={(event) => updateElevatorStructure('whoIHelp', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Qué problema resuelvo</span>
                                            <textarea
                                                rows={2}
                                                value={elevatorStructure.solvedProblem}
                                                onChange={(event) => updateElevatorStructure('solvedProblem', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Qué valor o resultado ayudo a generar</span>
                                            <textarea
                                                rows={2}
                                                value={elevatorStructure.generatedValue}
                                                onChange={(event) => updateElevatorStructure('generatedValue', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Qué me diferencia</span>
                                            <textarea
                                                rows={2}
                                                value={elevatorStructure.differentiator}
                                                onChange={(event) => updateElevatorStructure('differentiator', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">6. Qué siguiente paso abro o propongo</span>
                                            <textarea
                                                rows={2}
                                                value={elevatorStructure.nextStep}
                                                onChange={(event) => updateElevatorStructure('nextStep', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveElevatorBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Matriz Mensaje – Evidencia – Reacción</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowElevatorExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    elevatorMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {elevatorMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Parte del pitch</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué digo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué evidencia lo respalda</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Reacción esperada</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {elevatorMatrixRows.map((row, rowIndex) => (
                                                    <tr key={`elevator-matrix-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.pitchPart}
                                                                onChange={(event) => updateElevatorMatrixRow(rowIndex, 'pitchPart', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona una parte</option>
                                                                {elevatorPitchPartOptions.map((option) => (
                                                                    <option key={`${option}-${rowIndex}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatISay}
                                                                onChange={(event) => updateElevatorMatrixRow(rowIndex, 'whatISay', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.evidence}
                                                                onChange={(event) => updateElevatorMatrixRow(rowIndex, 'evidence', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.expectedReaction}
                                                                onChange={(event) =>
                                                                    updateElevatorMatrixRow(rowIndex, 'expectedReaction', event.target.value)
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

                                    {elevatorMatrixMissingEvidence && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                            Sugerencia: agrega una prueba o escribe “Completar”.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveElevatorBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Versión corta y versión extendida</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowElevatorExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    elevatorVersionsCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {elevatorVersionsCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión corta (30–45 segundos)</span>
                                        <textarea
                                            rows={4}
                                            value={elevatorVersions.shortVersion}
                                            onChange={(event) => updateElevatorVersion('shortVersion', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>
                                    <label className="space-y-2 block">
                                        <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Versión extendida (60–90 segundos)</span>
                                        <textarea
                                            rows={6}
                                            value={elevatorVersions.extendedVersion}
                                            onChange={(event) => updateElevatorVersion('extendedVersion', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </label>

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                                        <span>
                                            Corta: <span className="font-bold text-slate-900">{elevatorShortWordCount}</span> palabras
                                        </span>
                                        <span>
                                            Extendida: <span className="font-bold text-slate-900">{elevatorExtendedWordCount}</span> palabras
                                        </span>
                                    </div>

                                    {(elevatorTooLong || elevatorMissingProblem || elevatorMissingValueOrResult) && (
                                        <div className="space-y-2">
                                            {elevatorTooLong && (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                    Sugerencia: reduce para ganar claridad y recordación.
                                                </p>
                                            )}
                                            {elevatorMissingProblem && (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                    Sugerencia: aclara qué problema, necesidad o tensión resuelves.
                                                </p>
                                            )}
                                            {elevatorMissingValueOrResult && (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                    Sugerencia: explica qué cambio produces, no solo qué haces.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveElevatorBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4. Prueba de impacto y adaptabilidad</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowElevatorExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    elevatorImpactCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {elevatorImpactCompleted ? 'Completado' : 'Pendiente'}
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
                                                {elevatorImpact.map((row, rowIndex) => (
                                                    <tr key={`elevator-impact-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`elevator-impact-${rowIndex}`}
                                                                    checked={row.verdict === 'yes'}
                                                                    onChange={() => updateElevatorImpact(rowIndex, 'verdict', 'yes')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`elevator-impact-${rowIndex}`}
                                                                    checked={row.verdict === 'no'}
                                                                    onChange={() => updateElevatorImpact(rowIndex, 'verdict', 'no')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateElevatorImpact(rowIndex, 'adjustment', event.target.value)}
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
                                            onClick={() => saveElevatorBlock('Paso 4')}
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
                                            '¿Qué digo primero cuando me presento?',
                                            '¿Qué problema pongo en el centro?',
                                            '¿Cómo expreso mi valor de forma breve?',
                                            '¿Qué evidencia respalda mi pitch?',
                                            '¿Qué versión funciona mejor según la audiencia?'
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
                                                elevatorSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {elevatorSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(9)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 9
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(10) && (
                            <article
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 10 de 11"
                                data-print-title="Ejes de contenido estratégicos"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 10</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Ejes de contenido estratégicos
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Define qué temas comunicarás con constancia para fortalecer claridad, recordación y reputación en tu narrativa profesional.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentAxesHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Un eje estratégico no es un tema suelto: conecta narrativa, audiencia, valor y percepción.',
                                            'Sirve para sostener reputación con coherencia y evitar comunicación improvisada o dispersa.',
                                            'No busques hablar de todo; busca foco y consistencia en 3 a 5 ejes clave.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1. Mapa de temas actuales</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowContentAxesExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    contentTopicsCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {contentTopicsCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tema actual 1</span>
                                            <input
                                                type="text"
                                                value={contentTopicsMap.topic1}
                                                onChange={(event) => updateContentTopicsMap('topic1', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tema actual 2</span>
                                            <input
                                                type="text"
                                                value={contentTopicsMap.topic2}
                                                onChange={(event) => updateContentTopicsMap('topic2', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tema actual 3</span>
                                            <input
                                                type="text"
                                                value={contentTopicsMap.topic3}
                                                onChange={(event) => updateContentTopicsMap('topic3', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tema actual 4</span>
                                            <input
                                                type="text"
                                                value={contentTopicsMap.topic4}
                                                onChange={(event) => updateContentTopicsMap('topic4', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Tema actual 5</span>
                                            <input
                                                type="text"
                                                value={contentTopicsMap.topic5}
                                                onChange={(event) => updateContentTopicsMap('topic5', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Temas que hoy me dispersan</span>
                                            <textarea
                                                rows={2}
                                                value={contentTopicsMap.dispersingTopics}
                                                onChange={(event) => updateContentTopicsMap('dispersingTopics', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveContentAxesBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2. Matriz Eje – Audiencia – Objetivo – Formato</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowContentAxesExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    contentMatrixCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {contentMatrixCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[960px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Eje de contenido</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Audiencia principal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objetivo del eje</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Formato / canal sugerido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contentMatrixRows.map((row, rowIndex) => (
                                                    <tr key={`content-matrix-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.contentAxis}
                                                                onChange={(event) => updateContentMatrixRow(rowIndex, 'contentAxis', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona un eje</option>
                                                                {contentTopicOptions.map((option) => (
                                                                    <option key={`${option}-${rowIndex}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.primaryAudience}
                                                                onChange={(event) => updateContentMatrixRow(rowIndex, 'primaryAudience', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.axisObjective}
                                                                onChange={(event) => updateContentMatrixRow(rowIndex, 'axisObjective', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.suggestedFormat}
                                                                onChange={(event) => updateContentMatrixRow(rowIndex, 'suggestedFormat', event.target.value)}
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
                                            onClick={() => saveContentAxesBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3. Definición final de ejes estratégicos</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowContentAxesExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    contentFinalAxesCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {contentFinalAxesCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {contentFinalAxes.map((row, rowIndex) => (
                                            <article key={`final-axis-${rowIndex}`} className="rounded-xl border border-slate-200 p-4 space-y-3">
                                                <p className="text-sm font-bold text-slate-900">
                                                    Eje {rowIndex + 1}
                                                    {rowIndex >= 3 ? ' (opcional)' : ''}
                                                </p>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Nombre del eje</span>
                                                    <select
                                                        value={row.axisName}
                                                        onChange={(event) => updateFinalAxisRow(rowIndex, 'axisName', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    >
                                                        <option value="">Selecciona un eje</option>
                                                        {contentTopicOptions.map((option) => (
                                                            <option key={`${option}-final-${rowIndex}`} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Idea central</span>
                                                    <input
                                                        type="text"
                                                        value={row.coreIdea}
                                                        onChange={(event) => updateFinalAxisRow(rowIndex, 'coreIdea', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                                <label className="space-y-1 block">
                                                    <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Percepción que quiero construir</span>
                                                    <input
                                                        type="text"
                                                        value={row.targetPerception}
                                                        onChange={(event) => updateFinalAxisRow(rowIndex, 'targetPerception', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                    />
                                                </label>
                                            </article>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-700">
                                            Ejes completos: <span className="font-bold text-slate-900">{completedFinalAxes}</span> / 5 (objetivo: 3–5).
                                        </p>
                                        {contentAxesWithMissingAudienceOrPerception && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                Sugerencia: aclara para quién es este eje y qué percepción quieres construir.
                                            </p>
                                        )}
                                        {allAxesTooSimilar && (
                                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                                Sugerencia: diferencia mejor el rol de cada eje para evitar mensajes repetidos.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveContentAxesBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4. Prueba de coherencia estratégica</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowContentAxesExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    contentCoherenceCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {contentCoherenceCompleted ? 'Completado' : 'Pendiente'}
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
                                                {contentCoherence.map((row, rowIndex) => (
                                                    <tr key={`content-coherence-${rowIndex}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`content-coherence-${rowIndex}`}
                                                                    checked={row.verdict === 'yes'}
                                                                    onChange={() => updateContentCoherence(rowIndex, 'verdict', 'yes')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <label className="inline-flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name={`content-coherence-${rowIndex}`}
                                                                    checked={row.verdict === 'no'}
                                                                    onChange={() => updateContentCoherence(rowIndex, 'verdict', 'no')}
                                                                    disabled={isLocked}
                                                                    className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                                />
                                                            </label>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateContentCoherence(rowIndex, 'adjustment', event.target.value)}
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
                                            onClick={() => saveContentAxesBlock('Paso 4')}
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
                                            '¿Qué temas deben sostener mi narrativa profesional?',
                                            '¿Qué temas me posicionan y cuáles me dispersan?',
                                            '¿Qué percepción quiero construir con constancia?',
                                            '¿Qué ejes sí vale la pena convertir en contenido, conversación y presencia digital?'
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
                                                contentSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {contentSectionCompleted ? 'Sección completada' : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(10)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 10
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(11) && (
                            <article
                                className="wb4-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 11 de 11"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 11</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Evaluación</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-4xl">
                                        Objetivo: permitir que iShine y líder evalúen con evidencia, definan decisiones por criterio y cierren con síntesis de
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
                                                        key={`wb4-evaluation-stage-${stage.key}`}
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
                                                    'Evalúa cada criterio con base en evidencia observable (idealmente de los últimos 20 días).',
                                                    'Marca un solo nivel por criterio (N1, N2, N3 o N4).',
                                                    'Registra comentario u observación concreta por criterio (hechos, conversación o conducta observada).',
                                                    'Define decisión por criterio: Consolidado, En desarrollo o Prioritario.',
                                                    'Cierra el WB con observaciones generales y una decisión global de seguimiento.'
                                                ].map((instruction) => (
                                                    <li key={`wb4-mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                                    <tr key={`wb4-mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
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
                                                <h3 className="text-base md:text-lg font-bold text-slate-900">Formato de evaluación del iShine (marcar y comentar)</h3>
                                                <p className="text-xs text-slate-500">
                                                    Criterios completados: {mentorCompletedRows}/{state.evaluation.mentorRows.length}
                                                </p>
                                            </div>

                                            {state.evaluation.mentorRows.map((row, index) => {
                                                const isEditing = mentorEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isMentorEvaluationRowComplete(row)

                                                return (
                                                    <article key={`wb4-mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                                key={`wb4-mentor-level-${index}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb4-mentor-level-${index}`}
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
                                                                        Decisión del iShine
                                                                    </legend>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                            <label
                                                                                key={`wb4-mentor-decision-${index}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb4-mentor-decision-${index}`}
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

                                        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre del iShine</h3>
                                            <label className="block space-y-1">
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Observaciones generales del iShine</span>
                                                <textarea
                                                    value={state.evaluation.mentorGeneralNotes}
                                                    onChange={(event) => setMentorGeneralNotes(event.target.value)}
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
                                                            key={`wb4-mentor-global-${decision}`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="wb4-mentor-global-decision"
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
                                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">B) Modo Líder - Autoevaluación</h3>
                                            <ul className="space-y-1.5">
                                                {[
                                                    'Responde cada pregunta desde hechos concretos y recientes, no desde intención.',
                                                    'Incluye al menos un ejemplo o evidencia por respuesta.',
                                                    'Define una acción o compromiso de 30 días para cada respuesta clave.',
                                                    'Usa este bloque como insumo para acordar el plan de desarrollo con el iShine.'
                                                ].map((instruction) => (
                                                    <li key={`wb4-leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
                                                        <span>{instruction}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-slate-500">
                                                Preguntas completadas: {leaderCompletedRows}/{state.evaluation.leaderRows.length}
                                            </p>
                                        </section>

                                        <section className="space-y-4">
                                            {state.evaluation.leaderRows.map((row, index) => {
                                                const isEditing = leaderEvaluationEditModes[index]
                                                const rowDisabled = isLocked || !isEditing
                                                const isComplete = isLeaderEvaluationRowComplete(row)
                                                return (
                                                    <article key={`wb4-leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Síntesis de acuerdos iShine-Líder</span>
                                                <textarea
                                                    value={state.evaluation.agreementsSynthesis}
                                                    onChange={(event) => setEvaluationSynthesis(event.target.value)}
                                                    disabled={isLocked}
                                                    className="w-full min-h-[160px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
                                                {evaluationSectionComplete ? 'WB4 Evaluación completada' : 'WB4 Evaluación en progreso'}
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
                                                        key={`wb4-evaluation-summary-criterion-${index}`}
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
                                            : 'Evaluación pendiente (iShine + líder + síntesis)'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={saveEvaluationModule}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Guardar página 11
                                    </button>
                                </div>
                            </article>
                        )}

                        {showStorytellingHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Storytelling ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowStorytellingHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Storytelling ejecutivo no es hoja de vida ni lista de cargos.</p>
                                        <p>• Storytelling ejecutivo sí es trayectoria + valor + evidencia + dirección.</p>
                                        <p>• No cuentes todo: selecciona lo esencial que te diferencia.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>1. Mi origen profesional se ha construido entre formación, diseño estratégico y liderazgo de procesos.</li>
                                        <li>2. Un punto de inflexión fue entender que no bastaba con saber, sino con traducir ese saber en resultados y transformación.</li>
                                        <li>3. Hoy concentro mi trabajo en el desarrollo de líderes, equipos y herramientas de alto impacto.</li>
                                        <li>4. El valor que aporto con mayor claridad es convertir complejidad en dirección y acción.</li>
                                        <li>5. La dirección que estoy construyendo es una propuesta sólida de liderazgo, desarrollo y escalamiento con propósito.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Lo que digo de mí</th>
                                                    <th className="py-2 pr-3">Valor que comunica</th>
                                                    <th className="py-2 pr-3">Prueba / evidencia</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Convierto complejidad en claridad</td>
                                                    <td className="py-2 pr-3">Estructura y criterio</td>
                                                    <td className="py-2 pr-3">He diseñado modelos, rutas y herramientas aplicadas</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Trabajo con líderes y equipos</td>
                                                    <td className="py-2 pr-3">Impacto</td>
                                                    <td className="py-2 pr-3">He acompañado procesos reales de desarrollo</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Pienso estratégicamente</td>
                                                    <td className="py-2 pr-3">Dirección</td>
                                                    <td className="py-2 pr-3">Conecto visión, decisiones y escalamiento</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Soy un profesional orientado a convertir liderazgo, propósito y visión en herramientas concretas de desarrollo.
                                        Mi trabajo se ha construido entre formación, diseño estratégico y acompañamiento de líderes y equipos. Hoy aporto
                                        claridad, estructura y dirección para transformar ideas complejas en procesos, decisiones y resultados con sentido.
                                    </p>
                                </div>
                            </div>
                        )}

                        {showSloganHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Slogan personal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSloganHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Un slogan personal no es una frase decorativa; debe resumir tu valor real.</p>
                                        <p>• Debe ser breve, claro y auténtico; si necesitas explicarlo demasiado, aún no está listo.</p>
                                        <p>• Evita formulaciones genéricas como “liderazgo transformador”, “apasionado por ayudar” o “comprometido con la excelencia”.</p>
                                        <p>• Busca una idea central que puedas sostener con tu práctica y evidencia.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showSloganExample && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Slogan personal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSloganExample(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-4 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Exploración del núcleo verbal</p>
                                        <ul className="space-y-2">
                                            <li>1. La palabra o idea que mejor resume lo que aporto es: <span className="font-semibold">Claridad</span>.</li>
                                            <li>2. El efecto que más quiero generar en otros es: <span className="font-semibold">Dirección</span>.</li>
                                            <li>3. El rasgo que más me diferencia hoy es: <span className="font-semibold">Convertir complejidad en estructura</span>.</li>
                                            <li>4. La sensación que quiero dejar cuando comunico es: <span className="font-semibold">Solidez y foco</span>.</li>
                                        </ul>
                                        <p className="font-semibold text-slate-900">Versiones de slogan</p>
                                        <ul className="space-y-2">
                                            <li>• Versión 1: Liderazgo con claridad.</li>
                                            <li>• Versión 2: Transformo complejidad en dirección.</li>
                                            <li>• Versión 3: Diseño claridad para líderes en crecimiento.</li>
                                        </ul>
                                        <p>
                                            Slogan elegido: <span className="font-semibold">Transformo complejidad en dirección.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPromiseHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Promesa de valor</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromiseHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Promesa de valor no es lista de servicios; es valor + destinatario + resultado + credibilidad.</p>
                                        <p>• Evita frases amplias como “ayudo a transformar vidas”, “potencio el éxito” o “genero impacto” sin precisión.</p>
                                        <p>• Tu formulación debe dejar claro a quién ayudas, qué problema atiendes y qué evidencia sostiene lo que dices.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPromiseExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromiseExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>Lo que aporto: Claridad estratégica y estructura.</li>
                                        <li>A quién lo aporto: Líderes y equipos en crecimiento.</li>
                                        <li>Qué problema atiendo: Dispersión, mensajes difusos y baja diferenciación.</li>
                                        <li>Qué resultado ayudo a generar: Mayor dirección, coherencia y capacidad de comunicar valor.</li>
                                        <li>Qué hace creíble esta promesa: Experiencia diseñando herramientas, procesos y narrativas aplicadas.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showPromiseExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromiseExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700">
                                        Ayudo a líderes y equipos en crecimiento a comunicar con más claridad y diferenciación mediante herramientas,
                                        estructuras narrativas y procesos de desarrollo.
                                    </p>
                                </div>
                            </div>
                        )}

                        {showPromiseExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromiseExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>¿Qué evidencia respalda mi promesa? He diseñado y aplicado herramientas para claridad estratégica y comunicación.</li>
                                        <li>¿Qué experiencia me autoriza? Trabajo con líderes, equipos y procesos de desarrollo.</li>
                                        <li>¿Qué parte sostengo hoy? Claridad, estructura y acompañamiento.</li>
                                        <li>¿Qué parte debo fortalecer? Escalar casos con más evidencia cuantitativa.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showPromiseExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromiseExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700">
                                        Aporto claridad, estructura y dirección a líderes y equipos que necesitan traducir su potencial en mensajes, decisiones
                                        y resultados más sólidos.
                                    </p>
                                </div>
                            </div>
                        )}

                        {showAudienceHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Definición de audiencia principal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAudienceHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Audiencia principal no es “todo el mundo”. Debe ser un grupo concreto con necesidad real de tu valor.</p>
                                        <p>• Definir audiencia mejora claridad, adaptación del mensaje y confianza en quien te escucha.</p>
                                        <p>• Tu mensaje puede cambiar según audiencia sin perder identidad.</p>
                                        <p>• Si no sabes qué necesita escuchar, aún falta conocer mejor a tu audiencia.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showAudienceExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAudienceExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>• Líderes de área que necesitan fortalecer su narrativa profesional.</li>
                                        <li>• Directivos que quieren proyectar más claridad y presencia.</li>
                                        <li>• Equipos que necesitan ordenar su mensaje y su propuesta de valor.</li>
                                        <li>• Sponsors internos o decisores que evalúan potencial ejecutivo.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showAudienceExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAudienceExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Audiencia</th>
                                                    <th className="py-2 pr-3">Qué le importa</th>
                                                    <th className="py-2 pr-3">Qué necesita</th>
                                                    <th className="py-2 pr-3">Lenguaje</th>
                                                    <th className="py-2 pr-3">Valor aportado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Líderes en crecimiento</td>
                                                    <td className="py-2 pr-3">Claridad y posicionamiento</td>
                                                    <td className="py-2 pr-3">Traducir potencial en percepción externa</td>
                                                    <td className="py-2 pr-3">Ejecutivo, simple y concreto</td>
                                                    <td className="py-2 pr-3">Estructura narrativa y diferenciación</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Sponsors o decisores</td>
                                                    <td className="py-2 pr-3">Resultados y credibilidad</td>
                                                    <td className="py-2 pr-3">Identificar talento confiable</td>
                                                    <td className="py-2 pr-3">Breve, estratégico, orientado a valor</td>
                                                    <td className="py-2 pr-3">Mensaje sólido y confianza</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showAudienceExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAudienceExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>Mi audiencia principal hoy es líderes y decisores que evalúan potencial ejecutivo.</p>
                                        <p>La elijo porque mi siguiente nivel depende de traducir valor en percepción clara y confianza.</p>
                                        <p>Lo que más necesita escuchar de mí es que convierto complejidad en dirección, resultados y coherencia.</p>
                                        <p>Lo que debo evitar es sobreexplicar, usar jerga o sonar genérico.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showAudienceExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAudienceExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ol className="space-y-2.5 text-sm text-slate-700 list-decimal pl-5">
                                        <li>Necesita entender rápido si mi valor es útil y confiable.</li>
                                        <li>Le preocupa perder tiempo con mensajes vagos o sin evidencia.</li>
                                        <li>Rechaza tecnicismo innecesario y autoelogio.</li>
                                        <li>Confía más en lenguaje claro, breve y orientado a resultados.</li>
                                        <li>Debe entender que puedo ordenar, diferenciar y comunicar valor con claridad.</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {showProblemHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — ¿Qué problema resuelve?</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowProblemHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Problema no es servicio; problema es necesidad, tensión o brecha específica.</p>
                                        <p>• Evita frases amplias y genéricas; define a quién le pasa, qué costo tiene y por qué importa resolverlo.</p>
                                        <p>• Cuando el problema es claro, tu narrativa y tu pitch ganan relevancia y foco.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showProblemExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowProblemExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>• Líderes con alto potencial que no logran traducirlo en percepción externa clara.</li>
                                        <li>• Equipos con valor real pero con mensajes dispersos y poco diferenciados.</li>
                                        <li>• Profesionales sólidos que no saben comunicar con claridad qué problema resuelven.</li>
                                        <li>• Directivos con experiencia, pero sin narrativa que inspire confianza y dirección.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showProblemExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowProblemExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Problema</th>
                                                    <th className="py-2 pr-3">Afectado</th>
                                                    <th className="py-2 pr-3">Costo</th>
                                                    <th className="py-2 pr-3">Cambio</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Narrativa profesional vaga o dispersa</td>
                                                    <td className="py-2 pr-3">Líderes en crecimiento</td>
                                                    <td className="py-2 pr-3">Baja diferenciación y menor influencia</td>
                                                    <td className="py-2 pr-3">Mayor claridad, posicionamiento y confianza</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Valor existente que no se comunica bien</td>
                                                    <td className="py-2 pr-3">Equipos y directivos</td>
                                                    <td className="py-2 pr-3">Oportunidades perdidas y baja tracción</td>
                                                    <td className="py-2 pr-3">Mensaje sólido y más tracción</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showProblemExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowProblemExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Trabajo con líderes y profesionales en crecimiento que necesitan resolver la brecha entre su valor real y la forma en que
                                        lo comunican, porque esa brecha les genera menor claridad, menor diferenciación y menor influencia.
                                    </p>
                                </div>
                            </div>
                        )}

                        {showProblemExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowProblemExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p>Problema demasiado amplio: “Las empresas necesitan mejorar comunicación”.</p>
                                        <p>
                                            Problema mejor formulado: “Trabajo con líderes y equipos que tienen valor real, pero no logran traducirlo en mensajes
                                            claros, diferenciados y confiables”.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDifferentialHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Diferencial competitivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDifferentialHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Diferencial competitivo no es autoelogio; es una diferencia útil, creíble y relevante.</p>
                                        <p>• Evita adjetivos sin sustento como “innovador”, “estratégico” o “transformacional”.</p>
                                        <p>• Debe explicar qué haces distinto, para quién importa y qué resultado produce.</p>
                                        <p>• Si no tienes evidencia, escribe “Completar” y úsalo como hallazgo.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDifferentialExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDifferentialExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Rasgo</th>
                                                    <th className="py-2 pr-3">Valor</th>
                                                    <th className="py-2 pr-3">Relevancia</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Convierto complejidad en estructura</td>
                                                    <td className="py-2 pr-3">Claridad y foco</td>
                                                    <td className="py-2 pr-3">La audiencia necesita ordenar ideas y comunicar mejor</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Conecto visión con ejecución</td>
                                                    <td className="py-2 pr-3">Dirección práctica</td>
                                                    <td className="py-2 pr-3">Evita que el discurso quede abstracto</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Traduzco experiencia en herramientas</td>
                                                    <td className="py-2 pr-3">Aplicabilidad</td>
                                                    <td className="py-2 pr-3">Hace que el valor sea usable y visible</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDifferentialExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDifferentialExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Frase común / genérica</th>
                                                    <th className="py-2 pr-3">Reformulación diferencial</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Trabajo con líderes</td>
                                                    <td className="py-2 pr-3">
                                                        Diseño claridad y estructura para líderes que necesitan traducir valor en percepción
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Ayudo a crecer</td>
                                                    <td className="py-2 pr-3">Ayudo a cerrar la brecha entre potencial real y percepción externa</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Tengo visión estratégica</td>
                                                    <td className="py-2 pr-3">Conecto visión, narrativa y ejecución para que el valor no se disperse</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDifferentialExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDifferentialExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>Versión 1: Me diferencio por convertir complejidad en estructura, porque eso permite decisiones más claras.</p>
                                        <p>Versión 2: A diferencia de propuestas más genéricas, yo aporto foco, método y aplicabilidad.</p>
                                        <p>
                                            Versión 3: Mi diferencial está en combinar claridad estratégica con estructura narrativa para generar
                                            posicionamiento y acción.
                                        </p>
                                        <p className="font-semibold">
                                            Diferencial principal: Combino claridad estratégica, estructura narrativa y orientación a la acción para ayudar a
                                            líderes y equipos a traducir su valor en mensajes, decisiones y presencia más sólidas.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDifferentialExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowDifferentialExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p>Frase débil: “Soy un líder estratégico y transformacional”.</p>
                                        <p>
                                            Frase mejorada: “Me diferencio por convertir complejidad en claridad estratégica y acción concreta, especialmente
                                            cuando el valor existe pero no logra ser percibido con precisión”.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showElevatorHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Elevator pitch estructurado</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowElevatorHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Elevator pitch no es mini hoja de vida; debe incluir problema, valor, diferencia y apertura.</p>
                                        <p>• Debe ser breve, claro y adaptable a la audiencia sin perder identidad.</p>
                                        <p>• Evita autoelogio vacío y cierra con posibilidad de conversación.</p>
                                        <p>• Usa evidencia concreta para respaldar cada afirmación clave.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showElevatorExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowElevatorExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>1. Soy un profesional enfocado en traducir liderazgo, propósito y experiencia en narrativas claras y estratégicas.</li>
                                        <li>2. Trabajo con líderes y equipos que necesitan proyectar con más precisión su valor.</li>
                                        <li>3. Resuelvo la brecha entre capacidad real y percepción externa.</li>
                                        <li>4. Ayudo a generar claridad, diferenciación y mayor capacidad de influencia.</li>
                                        <li>5. Me diferencia que convierto complejidad en estructura narrativa accionable.</li>
                                        <li>6. Si tiene sentido para ti, puedo mostrarte cómo traducir eso en un pitch o narrativa más sólida.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showElevatorExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowElevatorExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Parte</th>
                                                    <th className="py-2 pr-3">Qué digo</th>
                                                    <th className="py-2 pr-3">Evidencia</th>
                                                    <th className="py-2 pr-3">Reacción esperada</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Identidad</td>
                                                    <td className="py-2 pr-3">Trabajo en narrativa y claridad estratégica</td>
                                                    <td className="py-2 pr-3">Diseñé herramientas y procesos aplicados</td>
                                                    <td className="py-2 pr-3">“Entiendo a qué se dedica”</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Problema</td>
                                                    <td className="py-2 pr-3">Cierro la brecha entre valor y percepción</td>
                                                    <td className="py-2 pr-3">Casos con líderes y equipos</td>
                                                    <td className="py-2 pr-3">“Eso es relevante”</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Valor</td>
                                                    <td className="py-2 pr-3">Aporto estructura, diferenciación y claridad</td>
                                                    <td className="py-2 pr-3">Modelos y acompañamiento real</td>
                                                    <td className="py-2 pr-3">“Eso puede ayudarme”</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Apertura</td>
                                                    <td className="py-2 pr-3">Puedo mostrarte una versión aplicada</td>
                                                    <td className="py-2 pr-3">Ejemplos de pitch y narrativa</td>
                                                    <td className="py-2 pr-3">“Quiero seguir conversando”</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showElevatorExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowElevatorExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-4 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Versión corta</p>
                                        <p>
                                            Trabajo con líderes y equipos que necesitan traducir su valor real en mensajes más claros, confiables y
                                            diferenciados. Aporto estructura y dirección para que su narrativa comunique mejor lo que realmente son capaces de
                                            generar.
                                        </p>
                                        <p className="font-semibold text-slate-900">Versión extendida</p>
                                        <p>
                                            Trabajo con líderes, equipos y profesionales que tienen valor real, pero no siempre logran comunicarlo con claridad.
                                            Mi enfoque está en cerrar esa brecha entre capacidad y percepción externa, ayudándoles a construir narrativas y
                                            pitches más sólidos. Me diferencia que convierto complejidad en estructura accionable y adaptable a la audiencia.
                                            Si te interesa, puedo mostrarte una versión aplicada.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showElevatorExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowElevatorExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p>Pitch débil: “Soy consultor con amplia experiencia en liderazgo y comunicación”.</p>
                                        <p>
                                            Pitch mejorado: “Trabajo con líderes y equipos que necesitan traducir su valor real en mensajes claros, creíbles y
                                            diferenciados, para reducir la brecha entre potencial y percepción externa”.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showContentAxesHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Ejes de contenido estratégicos</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentAxesHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Un eje estratégico no es tema suelto: conecta narrativa, audiencia, valor y percepción.</p>
                                        <p>• El objetivo es construir reputación clara y consistente, no publicar por publicar.</p>
                                        <p>• Limitarte a 3–5 ejes ayuda a sostener foco y recordación.</p>
                                        <p>• Gestiona tu narrativa en plataformas digitales de forma estratégica, no solo social.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showContentAxesExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentAxesExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5 text-sm text-slate-700">
                                        <li>Tema actual 1: liderazgo con propósito</li>
                                        <li>Tema actual 2: claridad estratégica</li>
                                        <li>Tema actual 3: storytelling ejecutivo</li>
                                        <li>Tema actual 4: desarrollo de equipos</li>
                                        <li>Tema actual 5: herramientas de crecimiento profesional</li>
                                        <li>Temas que dispersan: productividad general y frases motivacionales sin conexión con la propuesta.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {showContentAxesExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentAxesExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left">
                                            <thead>
                                                <tr className="text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">
                                                    <th className="py-2 pr-3">Eje</th>
                                                    <th className="py-2 pr-3">Audiencia</th>
                                                    <th className="py-2 pr-3">Objetivo</th>
                                                    <th className="py-2 pr-3">Formato/canal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm text-slate-700">
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Liderazgo con propósito</td>
                                                    <td className="py-2 pr-3">Líderes en crecimiento</td>
                                                    <td className="py-2 pr-3">Posicionarme desde profundidad y sentido</td>
                                                    <td className="py-2 pr-3">LinkedIn / charla / newsletter</td>
                                                </tr>
                                                <tr className="border-b border-slate-100">
                                                    <td className="py-2 pr-3">Storytelling ejecutivo</td>
                                                    <td className="py-2 pr-3">Ejecutivos y profesionales</td>
                                                    <td className="py-2 pr-3">Mostrar valor aplicado y diferenciación</td>
                                                    <td className="py-2 pr-3">LinkedIn / workshop / mentoría</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 pr-3">Claridad estratégica</td>
                                                    <td className="py-2 pr-3">Equipos y decisores</td>
                                                    <td className="py-2 pr-3">Asociarme con estructura y foco</td>
                                                    <td className="py-2 pr-3">Artículo / presentación / video corto</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showContentAxesExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentAxesExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            Eje 1: <span className="font-semibold">Liderazgo con propósito</span> · Idea central: identidad, claridad y
                                            coherencia · Percepción: profundidad, criterio y visión.
                                        </p>
                                        <p>
                                            Eje 2: <span className="font-semibold">Narrativa profesional</span> · Idea central: el valor necesita nombrarse con
                                            precisión · Percepción: claridad, diferenciación y presencia estratégica.
                                        </p>
                                        <p>
                                            Eje 3: <span className="font-semibold">Estructura y acción</span> · Idea central: convertir complejidad en procesos
                                            accionables · Percepción: dirección, orden y aplicabilidad.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showContentAxesExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowContentAxesExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p>Eje débil: “motivación”.</p>
                                        <p>Ajuste recomendado: “claridad para líderes en transición”.</p>
                                        <p>Esto mejora foco en audiencia, percepción y utilidad estratégica del eje.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb4-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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
                    .wb4-toolbar,
                    .wb4-sidebar,
                    .wb4-page-nav {
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
                    .wb4-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb4-print-page:not(.wb4-cover-page)::before {
                        content: "WB4 · Narrativa profesional y Elevator Pitch · " attr(data-print-title);
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
                    .wb4-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb4-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb4-cover-page::before {
                        content: none !important;
                    }
                    .wb4-cover-hero {
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
