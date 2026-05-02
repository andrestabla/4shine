"use client"
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-unused-vars */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

type PageDefinition = {
    id: WorkbookPageId
    label: string
    shortLabel: string
}

type IdentificationFields = {
    leaderName: string
    role: string
    cohort: string
    startDate: string
}

type PurposeExploration = {
    transformationFocus: string
    keyProblem: string
    meaningfulMoments: string
    serviceAudience: string
    nonNegotiables: string
}

type PurposeImpactActionMatrix = {
    contribution: string
    audience: string
    change: string
    currentAction: string
    betterAction: string
}

type PurposeFormula = {
    contribution: string
    context: string
    method: string
}

type CoherenceAnswer = '' | 'si' | 'no'
type AlignmentAnswer = '' | 'si' | 'parcial' | 'no'
type MentorLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'
type MentorDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'

type CoherenceCheckRow = {
    question: string
    answer: CoherenceAnswer
    adjustment: string
}

type PurposeDefinitionSection = {
    exploration: PurposeExploration
    matrix: PurposeImpactActionMatrix
    formula: PurposeFormula
    coherenceChecks: CoherenceCheckRow[]
}

type VmpSemaforoColor = '' | 'verde' | 'amarillo' | 'rojo'

type VmpSection = {
    matrix: {
        vocationMeaning: string
        vocationWhere: string
        missionMeaning: string
        missionWhere: string
        passionMeaning: string
        passionWhere: string
    }
    convergence: {
        conviction: string
        service: string
        enthusiasm: string
        intersection: string
    }
    semaphore: {
        vocation: { color: VmpSemaforoColor; adjustment: string }
        mission: { color: VmpSemaforoColor; adjustment: string }
        passion: { color: VmpSemaforoColor; adjustment: string }
    }
}

const LIFE_WHEEL_DIMENSIONS = [
    { key: 'purposeSense', label: 'Propósito y sentido', color: '#2563eb' },
    { key: 'physicalEnergy', label: 'Bienestar físico y energía', color: '#16a34a' },
    { key: 'emotionalBalance', label: 'Equilibrio emocional', color: '#f59e0b' },
    { key: 'relationships', label: 'Relaciones significativas', color: '#db2777' },
    { key: 'workContribution', label: 'Trabajo / contribución', color: '#0ea5e9' },
    { key: 'growthLearning', label: 'Crecimiento y aprendizaje', color: '#7c3aed' },
    { key: 'restEnjoyment', label: 'Descanso / disfrute', color: '#ef4444' },
    { key: 'futureProjection', label: 'Proyección y visión de futuro', color: '#0f766e' }
] as const

type LifeWheelDimensionKey = (typeof LIFE_WHEEL_DIMENSIONS)[number]['key']

type LifeWheelSection = {
    scores: Record<LifeWheelDimensionKey, { score: number | null; note: string }>
    reading: {
        lowestArea: string
        highestArea: string
        biggestImbalance: string
        cascadingArea: string
        leverageArea: string
    }
    prioritization: {
        criticalArea: string
        criticalReason: string
        leverageArea: string
        leverageReason: string
        firstAdjustment: string
    }
}

type SuccessDefinitionSection = {
    exploration: {
        successfulLife: string
        nonSacrifices: string
        driftSignal: string
        legacyStatement: string
    }
    matrix: Array<{
        authentic: string
        imposed: string
    }>
    statement: {
        is: string
        withoutSacrificing: string
        contributingTo: string
    }
    coherenceChecks: CoherenceCheckRow[]
}

type AlignmentSection = {
    matrix: Array<{
        element: string
        current: string
        alignment: AlignmentAnswer
        adjustment: string
    }>
    strategicChecks: Array<{
        question: string
        answer: AlignmentAnswer
        observation: string
    }>
    tensions: {
        purposeStrengthen: string
        visionBuild: string
        misalignedActions: string
        requiredRenunciation: string
    }
    declaration: {
        whenAligned: string
        expressedIn: string
    }
}

type VisionLongTermSection = {
    scenario: {
        futureLandscape: string
        futureBuild: string
        futureImpact: string
        futureLeadershipStyle: string
    }
    matrix: Array<{
        level: string
        formulation: string
    }>
    milestones: Array<{
        horizon: string
        expectedMilestone: string
        evidence: string
    }>
    viabilityChecks: Array<{
        question: string
        answer: AlignmentAnswer
        adjustment: string
    }>
    milestonesCommitted: boolean
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

type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'

type EvaluationSection = {
    mentorRows: MentorEvaluationRow[]
    mentorGeneralNotes: string
    mentorGlobalDecision: MentorDecision
    leaderRows: LeaderEvaluationRow[]
    agreementsSynthesis: string
}

type WB3State = {
    identification: IdentificationFields
    purposeDefinition: PurposeDefinitionSection
    vocationMissionPassion: VmpSection
    lifeWheel: LifeWheelSection
    successDefinition: SuccessDefinitionSection
    purposeVisionAlignment: AlignmentSection
    longTermVisionDesign: VisionLongTermSection
    evaluation: EvaluationSection
}

const PAGES: PageDefinition[] = [
    { id: 1, label: '1. Portada', shortLabel: 'Portada' },
    { id: 2, label: '2. Presentación del workbook', shortLabel: 'Presentación' },
    { id: 3, label: '3. Definición de propósito personal', shortLabel: 'Propósito' },
    { id: 4, label: '4. Vocación, misión y pasión', shortLabel: 'VMP' },
    { id: 5, label: '5. Rueda de la vida', shortLabel: 'Rueda de la vida' },
    { id: 6, label: '6. Declaración de éxito personal', shortLabel: 'Éxito personal' },
    { id: 7, label: '7. Alineación propósito–visión', shortLabel: 'Alineación' },
    { id: 8, label: '8. Diseño de visión a largo plazo', shortLabel: 'Visión' },
    { id: 9, label: '9. Evaluación', shortLabel: 'Evaluación' }
]

const STORAGE_KEY = 'workbooks-v2-wb3-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb3-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb3-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb3-presentation-seen'

const createDefaultCoherenceChecks = (): CoherenceCheckRow[] => [
    { question: '¿Me representa de verdad?', answer: '', adjustment: '' },
    { question: '¿Está conectada con mi práctica actual?', answer: '', adjustment: '' },
    { question: '¿Me exige crecer?', answer: '', adjustment: '' },
    { question: '¿Me sirve para decidir?', answer: '', adjustment: '' }
]

const createDefaultLifeWheelScores = (): Record<LifeWheelDimensionKey, { score: number | null; note: string }> => ({
    purposeSense: { score: null, note: '' },
    physicalEnergy: { score: null, note: '' },
    emotionalBalance: { score: null, note: '' },
    relationships: { score: null, note: '' },
    workContribution: { score: null, note: '' },
    growthLearning: { score: null, note: '' },
    restEnjoyment: { score: null, note: '' },
    futureProjection: { score: null, note: '' }
})

const createDefaultSuccessMatrixRows = () =>
    Array.from({ length: 4 }, () => ({
        authentic: '',
        imposed: ''
    }))

const createDefaultSuccessChecks = (): CoherenceCheckRow[] => [
    { question: '¿Está alineada con mis valores no negociables?', answer: '', adjustment: '' },
    { question: '¿Podría sostenerla bajo presión?', answer: '', adjustment: '' },
    { question: '¿Me representa de verdad?', answer: '', adjustment: '' },
    { question: '¿Me ayuda a decidir qué aceptar y qué rechazar?', answer: '', adjustment: '' }
]

const createDefaultAlignmentMatrixRows = () => [
    { element: 'Mi propósito', current: '', alignment: '', adjustment: '' },
    { element: 'Mi visión de futuro', current: '', alignment: '', adjustment: '' },
    { element: 'Mis prioridades actuales', current: '', alignment: '', adjustment: '' },
    { element: 'Mis decisiones recientes', current: '', alignment: '', adjustment: '' },
    { element: 'Mis hábitos actuales', current: '', alignment: '', adjustment: '' }
] as WB3State['purposeVisionAlignment']['matrix']

const createDefaultAlignmentStrategicChecks = () => [
    { question: '¿Mi visión expresa mi propósito?', answer: '', observation: '' },
    { question: '¿Mis decisiones recientes la respaldan?', answer: '', observation: '' },
    { question: '¿Mis hábitos actuales la sostienen?', answer: '', observation: '' },
    { question: '¿Mi visión me exige coherencia y no solo logros?', answer: '', observation: '' },
    { question: '¿Estoy sacrificando algo esencial por metas externas?', answer: '', observation: '' }
] as WB3State['purposeVisionAlignment']['strategicChecks']

const createDefaultVisionMatrixRows = () => [
    { level: 'Visión a largo plazo', formulation: '' },
    { level: 'Meta clave a 3 años', formulation: '' },
    { level: 'Meta clave a 12 meses', formulation: '' },
    { level: 'Acción prioritaria de este trimestre', formulation: '' },
    { level: 'Primer paso concreto de esta semana', formulation: '' }
] as WB3State['longTermVisionDesign']['matrix']

const createDefaultVisionMilestones = () => [
    { horizon: '12 meses', expectedMilestone: '', evidence: '' },
    { horizon: '24 meses', expectedMilestone: '', evidence: '' },
    { horizon: '36 meses', expectedMilestone: '', evidence: '' },
    { horizon: '5 años', expectedMilestone: '', evidence: '' }
] as WB3State['longTermVisionDesign']['milestones']

const createDefaultVisionChecks = () => [
    { question: '¿Es aspiracional pero creíble?', answer: '', adjustment: '' },
    { question: '¿Está alineada con mi propósito?', answer: '', adjustment: '' },
    { question: '¿Puedo traducirla en metas concretas?', answer: '', adjustment: '' },
    { question: '¿Estoy dispuesto a sostener lo que exige?', answer: '', adjustment: '' }
] as WB3State['longTermVisionDesign']['viabilityChecks']

const MENTOR_EVALUATION_CRITERIA = [
    'Claridad y consistencia del propósito declarado',
    'Alineación propósito–decisiones',
    'Coherencia entre visión y prioridades',
    'Capacidad de inspirar desde propósito',
    'Integración del propósito en el PDI'
] as const

const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']

const MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 - Declarativo',
        descriptor: 'Describe propósito abstracto sin conexión a decisiones reales.'
    },
    {
        level: 'Nivel 2 - Consciente',
        descriptor: 'Reconoce decisiones incoherentes; ajuste parcial.'
    },
    {
        level: 'Nivel 3 - Integrado',
        descriptor: 'Prioridades y decisiones reflejan propósito declarado.'
    },
    {
        level: 'Nivel 4 - Alineación Estratégica',
        descriptor: 'Propósito ordena estrategia y es referente para el equipo.'
    }
] as const

const LEADER_EVALUATION_QUESTIONS = [
    '¿Mi propósito guía mis decisiones o solo lo declaro?',
    '¿Qué decisiones recientes estuvieron claramente alineadas con mi propósito?',
    '¿Dónde estoy actuando sin dirección clara?',
    '¿Qué prioridad actual contradice mi propósito declarado?',
    '¿Cómo estoy comunicando mi propósito al equipo?'
] as const

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - Adviser' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const createDefaultEvaluationData = (): EvaluationSection => ({
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
})

const DEFAULT_STATE: WB3State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    purposeDefinition: {
        exploration: {
            transformationFocus: '',
            keyProblem: '',
            meaningfulMoments: '',
            serviceAudience: '',
            nonNegotiables: ''
        },
        matrix: {
            contribution: '',
            audience: '',
            change: '',
            currentAction: '',
            betterAction: ''
        },
        formula: {
            contribution: '',
            context: '',
            method: ''
        },
        coherenceChecks: createDefaultCoherenceChecks()
    },
    vocationMissionPassion: {
        matrix: {
            vocationMeaning: '',
            vocationWhere: '',
            missionMeaning: '',
            missionWhere: '',
            passionMeaning: '',
            passionWhere: ''
        },
        convergence: {
            conviction: '',
            service: '',
            enthusiasm: '',
            intersection: ''
        },
        semaphore: {
            vocation: { color: '', adjustment: '' },
            mission: { color: '', adjustment: '' },
            passion: { color: '', adjustment: '' }
        }
    },
    lifeWheel: {
        scores: createDefaultLifeWheelScores(),
        reading: {
            lowestArea: '',
            highestArea: '',
            biggestImbalance: '',
            cascadingArea: '',
            leverageArea: ''
        },
        prioritization: {
            criticalArea: '',
            criticalReason: '',
            leverageArea: '',
            leverageReason: '',
            firstAdjustment: ''
        }
    },
    successDefinition: {
        exploration: {
            successfulLife: '',
            nonSacrifices: '',
            driftSignal: '',
            legacyStatement: ''
        },
        matrix: createDefaultSuccessMatrixRows(),
        statement: {
            is: '',
            withoutSacrificing: '',
            contributingTo: ''
        },
        coherenceChecks: createDefaultSuccessChecks()
    },
    purposeVisionAlignment: {
        matrix: createDefaultAlignmentMatrixRows(),
        strategicChecks: createDefaultAlignmentStrategicChecks(),
        tensions: {
            purposeStrengthen: '',
            visionBuild: '',
            misalignedActions: '',
            requiredRenunciation: ''
        },
        declaration: {
            whenAligned: '',
            expressedIn: ''
        }
    },
    longTermVisionDesign: {
        scenario: {
            futureLandscape: '',
            futureBuild: '',
            futureImpact: '',
            futureLeadershipStyle: ''
        },
        matrix: createDefaultVisionMatrixRows(),
        milestones: createDefaultVisionMilestones(),
        viabilityChecks: createDefaultVisionChecks(),
        milestonesCommitted: false
    },
    evaluation: createDefaultEvaluationData()
}

const parsePageId = (value: unknown): WorkbookPageId => {
    if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6 || value === 7 || value === 8 || value === 9) {
        return value
    }
    return 1
}

const mergeLoadedState = (rawState: Partial<WB3State> | null): WB3State => {
    const loaded = rawState ?? {}
    const loadedChecks = loaded.purposeDefinition?.coherenceChecks ?? []
    const defaultChecks = createDefaultCoherenceChecks()
    const defaultLifeWheelScores = createDefaultLifeWheelScores()
    const loadedSuccessChecks = loaded.successDefinition?.coherenceChecks ?? []
    const defaultSuccessChecks = createDefaultSuccessChecks()
    const loadedSuccessMatrix = loaded.successDefinition?.matrix ?? []
    const defaultSuccessMatrix = createDefaultSuccessMatrixRows()
    const loadedAlignmentMatrix = loaded.purposeVisionAlignment?.matrix ?? []
    const defaultAlignmentMatrix = createDefaultAlignmentMatrixRows()
    const loadedAlignmentChecks = loaded.purposeVisionAlignment?.strategicChecks ?? []
    const defaultAlignmentChecks = createDefaultAlignmentStrategicChecks()
    const loadedVisionMatrix = loaded.longTermVisionDesign?.matrix ?? []
    const defaultVisionMatrix = createDefaultVisionMatrixRows()
    const loadedVisionMilestones = loaded.longTermVisionDesign?.milestones ?? []
    const defaultVisionMilestones = createDefaultVisionMilestones()
    const loadedVisionChecks = loaded.longTermVisionDesign?.viabilityChecks ?? []
    const defaultVisionChecks = createDefaultVisionChecks()
    const defaultEvaluation = createDefaultEvaluationData()
    const loadedMentorRows = loaded.evaluation?.mentorRows ?? []
    const loadedLeaderRows = loaded.evaluation?.leaderRows ?? []

    return {
        identification: {
            leaderName: loaded.identification?.leaderName ?? '',
            role: loaded.identification?.role ?? '',
            cohort: loaded.identification?.cohort ?? '',
            startDate: loaded.identification?.startDate ?? ''
        },
        purposeDefinition: {
            exploration: {
                transformationFocus: loaded.purposeDefinition?.exploration?.transformationFocus ?? '',
                keyProblem: loaded.purposeDefinition?.exploration?.keyProblem ?? '',
                meaningfulMoments: loaded.purposeDefinition?.exploration?.meaningfulMoments ?? '',
                serviceAudience: loaded.purposeDefinition?.exploration?.serviceAudience ?? '',
                nonNegotiables: loaded.purposeDefinition?.exploration?.nonNegotiables ?? ''
            },
            matrix: {
                contribution: loaded.purposeDefinition?.matrix?.contribution ?? '',
                audience: loaded.purposeDefinition?.matrix?.audience ?? '',
                change: loaded.purposeDefinition?.matrix?.change ?? '',
                currentAction: loaded.purposeDefinition?.matrix?.currentAction ?? '',
                betterAction: loaded.purposeDefinition?.matrix?.betterAction ?? ''
            },
            formula: {
                contribution: loaded.purposeDefinition?.formula?.contribution ?? '',
                context: loaded.purposeDefinition?.formula?.context ?? '',
                method: loaded.purposeDefinition?.formula?.method ?? ''
            },
            coherenceChecks: defaultChecks.map((check, index) => ({
                question: check.question,
                answer: loadedChecks[index]?.answer ?? '',
                adjustment: loadedChecks[index]?.adjustment ?? ''
            }))
        },
        vocationMissionPassion: {
            matrix: {
                vocationMeaning: loaded.vocationMissionPassion?.matrix?.vocationMeaning ?? '',
                vocationWhere: loaded.vocationMissionPassion?.matrix?.vocationWhere ?? '',
                missionMeaning: loaded.vocationMissionPassion?.matrix?.missionMeaning ?? '',
                missionWhere: loaded.vocationMissionPassion?.matrix?.missionWhere ?? '',
                passionMeaning: loaded.vocationMissionPassion?.matrix?.passionMeaning ?? '',
                passionWhere: loaded.vocationMissionPassion?.matrix?.passionWhere ?? ''
            },
            convergence: {
                conviction: loaded.vocationMissionPassion?.convergence?.conviction ?? '',
                service: loaded.vocationMissionPassion?.convergence?.service ?? '',
                enthusiasm: loaded.vocationMissionPassion?.convergence?.enthusiasm ?? '',
                intersection: loaded.vocationMissionPassion?.convergence?.intersection ?? ''
            },
            semaphore: {
                vocation: {
                    color: loaded.vocationMissionPassion?.semaphore?.vocation?.color ?? '',
                    adjustment: loaded.vocationMissionPassion?.semaphore?.vocation?.adjustment ?? ''
                },
                mission: {
                    color: loaded.vocationMissionPassion?.semaphore?.mission?.color ?? '',
                    adjustment: loaded.vocationMissionPassion?.semaphore?.mission?.adjustment ?? ''
                },
                passion: {
                    color: loaded.vocationMissionPassion?.semaphore?.passion?.color ?? '',
                    adjustment: loaded.vocationMissionPassion?.semaphore?.passion?.adjustment ?? ''
                }
            }
        },
        lifeWheel: {
            scores: {
                purposeSense: {
                    score:
                        typeof loaded.lifeWheel?.scores?.purposeSense?.score === 'number'
                            ? loaded.lifeWheel.scores.purposeSense.score
                            : defaultLifeWheelScores.purposeSense.score,
                    note: loaded.lifeWheel?.scores?.purposeSense?.note ?? ''
                },
                physicalEnergy: {
                    score:
                        typeof loaded.lifeWheel?.scores?.physicalEnergy?.score === 'number'
                            ? loaded.lifeWheel.scores.physicalEnergy.score
                            : defaultLifeWheelScores.physicalEnergy.score,
                    note: loaded.lifeWheel?.scores?.physicalEnergy?.note ?? ''
                },
                emotionalBalance: {
                    score:
                        typeof loaded.lifeWheel?.scores?.emotionalBalance?.score === 'number'
                            ? loaded.lifeWheel.scores.emotionalBalance.score
                            : defaultLifeWheelScores.emotionalBalance.score,
                    note: loaded.lifeWheel?.scores?.emotionalBalance?.note ?? ''
                },
                relationships: {
                    score:
                        typeof loaded.lifeWheel?.scores?.relationships?.score === 'number'
                            ? loaded.lifeWheel.scores.relationships.score
                            : defaultLifeWheelScores.relationships.score,
                    note: loaded.lifeWheel?.scores?.relationships?.note ?? ''
                },
                workContribution: {
                    score:
                        typeof loaded.lifeWheel?.scores?.workContribution?.score === 'number'
                            ? loaded.lifeWheel.scores.workContribution.score
                            : defaultLifeWheelScores.workContribution.score,
                    note: loaded.lifeWheel?.scores?.workContribution?.note ?? ''
                },
                growthLearning: {
                    score:
                        typeof loaded.lifeWheel?.scores?.growthLearning?.score === 'number'
                            ? loaded.lifeWheel.scores.growthLearning.score
                            : defaultLifeWheelScores.growthLearning.score,
                    note: loaded.lifeWheel?.scores?.growthLearning?.note ?? ''
                },
                restEnjoyment: {
                    score:
                        typeof loaded.lifeWheel?.scores?.restEnjoyment?.score === 'number'
                            ? loaded.lifeWheel.scores.restEnjoyment.score
                            : defaultLifeWheelScores.restEnjoyment.score,
                    note: loaded.lifeWheel?.scores?.restEnjoyment?.note ?? ''
                },
                futureProjection: {
                    score:
                        typeof loaded.lifeWheel?.scores?.futureProjection?.score === 'number'
                            ? loaded.lifeWheel.scores.futureProjection.score
                            : defaultLifeWheelScores.futureProjection.score,
                    note: loaded.lifeWheel?.scores?.futureProjection?.note ?? ''
                }
            },
            reading: {
                lowestArea: loaded.lifeWheel?.reading?.lowestArea ?? '',
                highestArea: loaded.lifeWheel?.reading?.highestArea ?? '',
                biggestImbalance: loaded.lifeWheel?.reading?.biggestImbalance ?? '',
                cascadingArea: loaded.lifeWheel?.reading?.cascadingArea ?? '',
                leverageArea: loaded.lifeWheel?.reading?.leverageArea ?? ''
            },
            prioritization: {
                criticalArea: loaded.lifeWheel?.prioritization?.criticalArea ?? '',
                criticalReason: loaded.lifeWheel?.prioritization?.criticalReason ?? '',
                leverageArea: loaded.lifeWheel?.prioritization?.leverageArea ?? '',
                leverageReason: loaded.lifeWheel?.prioritization?.leverageReason ?? '',
                firstAdjustment: loaded.lifeWheel?.prioritization?.firstAdjustment ?? ''
            }
        },
        successDefinition: {
            exploration: {
                successfulLife: loaded.successDefinition?.exploration?.successfulLife ?? '',
                nonSacrifices: loaded.successDefinition?.exploration?.nonSacrifices ?? '',
                driftSignal: loaded.successDefinition?.exploration?.driftSignal ?? '',
                legacyStatement: loaded.successDefinition?.exploration?.legacyStatement ?? ''
            },
            matrix: defaultSuccessMatrix.map((row, index) => ({
                authentic: loadedSuccessMatrix[index]?.authentic ?? row.authentic,
                imposed: loadedSuccessMatrix[index]?.imposed ?? row.imposed
            })),
            statement: {
                is: loaded.successDefinition?.statement?.is ?? '',
                withoutSacrificing: loaded.successDefinition?.statement?.withoutSacrificing ?? '',
                contributingTo: loaded.successDefinition?.statement?.contributingTo ?? ''
            },
            coherenceChecks: defaultSuccessChecks.map((check, index) => ({
                question: check.question,
                answer: loadedSuccessChecks[index]?.answer ?? '',
                adjustment: loadedSuccessChecks[index]?.adjustment ?? ''
            }))
        },
        purposeVisionAlignment: {
            matrix: defaultAlignmentMatrix.map((row, index) => ({
                element: row.element,
                current: loadedAlignmentMatrix[index]?.current ?? row.current,
                alignment: loadedAlignmentMatrix[index]?.alignment ?? row.alignment,
                adjustment: loadedAlignmentMatrix[index]?.adjustment ?? row.adjustment
            })),
            strategicChecks: defaultAlignmentChecks.map((row, index) => ({
                question: row.question,
                answer: loadedAlignmentChecks[index]?.answer ?? row.answer,
                observation: loadedAlignmentChecks[index]?.observation ?? row.observation
            })),
            tensions: {
                purposeStrengthen: loaded.purposeVisionAlignment?.tensions?.purposeStrengthen ?? '',
                visionBuild: loaded.purposeVisionAlignment?.tensions?.visionBuild ?? '',
                misalignedActions: loaded.purposeVisionAlignment?.tensions?.misalignedActions ?? '',
                requiredRenunciation: loaded.purposeVisionAlignment?.tensions?.requiredRenunciation ?? ''
            },
            declaration: {
                whenAligned: loaded.purposeVisionAlignment?.declaration?.whenAligned ?? '',
                expressedIn: loaded.purposeVisionAlignment?.declaration?.expressedIn ?? ''
            }
        },
        longTermVisionDesign: {
            scenario: {
                futureLandscape: loaded.longTermVisionDesign?.scenario?.futureLandscape ?? '',
                futureBuild: loaded.longTermVisionDesign?.scenario?.futureBuild ?? '',
                futureImpact: loaded.longTermVisionDesign?.scenario?.futureImpact ?? '',
                futureLeadershipStyle: loaded.longTermVisionDesign?.scenario?.futureLeadershipStyle ?? ''
            },
            matrix: defaultVisionMatrix.map((row, index) => ({
                level: row.level,
                formulation: loadedVisionMatrix[index]?.formulation ?? row.formulation
            })),
            milestones: defaultVisionMilestones.map((row, index) => ({
                horizon: row.horizon,
                expectedMilestone: loadedVisionMilestones[index]?.expectedMilestone ?? row.expectedMilestone,
                evidence: loadedVisionMilestones[index]?.evidence ?? row.evidence
            })),
            viabilityChecks: defaultVisionChecks.map((row, index) => ({
                question: row.question,
                answer: loadedVisionChecks[index]?.answer ?? row.answer,
                adjustment: loadedVisionChecks[index]?.adjustment ?? row.adjustment
            })),
            milestonesCommitted: loaded.longTermVisionDesign?.milestonesCommitted === true
        },
        evaluation: {
            mentorRows: defaultEvaluation.mentorRows.map((row, index) => ({
                criterion: row.criterion,
                level: MENTOR_LEVEL_OPTIONS.includes((loadedMentorRows[index]?.level ?? '') as MentorLevel)
                    ? ((loadedMentorRows[index]?.level ?? '') as MentorLevel)
                    : '',
                evidence: loadedMentorRows[index]?.evidence ?? '',
                decision: MENTOR_DECISION_OPTIONS.includes((loadedMentorRows[index]?.decision ?? '') as MentorDecision)
                    ? ((loadedMentorRows[index]?.decision ?? '') as MentorDecision)
                    : ''
            })),
            mentorGeneralNotes: loaded.evaluation?.mentorGeneralNotes ?? '',
            mentorGlobalDecision: MENTOR_DECISION_OPTIONS.includes((loaded.evaluation?.mentorGlobalDecision ?? '') as MentorDecision)
                ? ((loaded.evaluation?.mentorGlobalDecision ?? '') as MentorDecision)
                : '',
            leaderRows: defaultEvaluation.leaderRows.map((row, index) => ({
                question: row.question,
                response: loadedLeaderRows[index]?.response ?? '',
                evidence: loadedLeaderRows[index]?.evidence ?? '',
                action: loadedLeaderRows[index]?.action ?? ''
            })),
            agreementsSynthesis: loaded.evaluation?.agreementsSynthesis ?? ''
        }
    }
}

function isMentorEvaluationRowComplete(row: MentorEvaluationRow) {
    return row.level !== '' && row.decision !== '' && row.evidence.trim().length > 0
}

function isLeaderEvaluationRowComplete(row: LeaderEvaluationRow) {
    return row.response.trim().length > 0 && row.evidence.trim().length > 0 && row.action.trim().length > 0
}

export function WB3Digital() {
    const [state, setState] = useState<WB3State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showPurposeHelp, setShowPurposeHelp] = useState(false)
    const [showExampleStep1, setShowExampleStep1] = useState(false)
    const [showExampleStep2, setShowExampleStep2] = useState(false)
    const [showExampleStep3, setShowExampleStep3] = useState(false)
    const [showVmpHelp, setShowVmpHelp] = useState(false)
    const [showVmpExample1, setShowVmpExample1] = useState(false)
    const [showVmpExample2, setShowVmpExample2] = useState(false)
    const [showVmpExample3, setShowVmpExample3] = useState(false)
    const [showWheelHelp, setShowWheelHelp] = useState(false)
    const [showWheelExample1, setShowWheelExample1] = useState(false)
    const [showSuccessHelp, setShowSuccessHelp] = useState(false)
    const [showSuccessExample2, setShowSuccessExample2] = useState(false)
    const [showSuccessExample3, setShowSuccessExample3] = useState(false)
    const [showAlignmentHelp, setShowAlignmentHelp] = useState(false)
    const [showAlignmentExample1, setShowAlignmentExample1] = useState(false)
    const [showVisionHelp, setShowVisionHelp] = useState(false)
    const [showVisionExample1, setShowVisionExample1] = useState(false)
    const [showVisionExample2, setShowVisionExample2] = useState(false)
    const [showVisionExample3, setShowVisionExample3] = useState(false)
    const [showEvaluationLevelReference, setShowEvaluationLevelReference] = useState(false)
    const [mentorEvaluationEditModes, setMentorEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: MENTOR_EVALUATION_CRITERIA.length }, () => false)
    )
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        Array.from({ length: LEADER_EVALUATION_QUESTIONS.length }, () => false)
    )
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const rawState = window.localStorage.getItem(STORAGE_KEY)
            if (rawState) {
                const parsedState = JSON.parse(rawState) as Partial<WB3State>
                setState(mergeLoadedState(parsedState))
            }

            const introSeen = window.localStorage.getItem(INTRO_SEEN_KEY) === '1'
            setHasSeenPresentationOnce(introSeen)

            const rawPage = window.localStorage.getItem(PAGE_STORAGE_KEY)
            if (rawPage) {
                const parsedPage = parsePageId(Number(rawPage))
                setActivePage(!introSeen && parsedPage > 2 ? 1 : parsedPage)
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
            setHasSeenPresentationOnce(false)
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
    }, [state, activePage, visitedPages, hasSeenPresentationOnce, isHydrated])

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

    const waitForRenderCycle = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

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

    const toggleLock = () => {
        setIsLocked((prev) => !prev)
    }

    const updateIdentification = (field: keyof IdentificationFields, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateExploration = (field: keyof PurposeExploration, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeDefinition: {
                ...prev.purposeDefinition,
                exploration: {
                    ...prev.purposeDefinition.exploration,
                    [field]: value
                }
            }
        }))
    }

    const updateMatrix = (field: keyof PurposeImpactActionMatrix, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeDefinition: {
                ...prev.purposeDefinition,
                matrix: {
                    ...prev.purposeDefinition.matrix,
                    [field]: value
                }
            }
        }))
    }

    const updateFormula = (field: keyof PurposeFormula, value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeDefinition: {
                ...prev.purposeDefinition,
                formula: {
                    ...prev.purposeDefinition.formula,
                    [field]: value
                }
            }
        }))
    }

    const updateCoherenceCheck = (index: number, field: 'answer' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextChecks = [...prev.purposeDefinition.coherenceChecks]
            const nextValue = field === 'answer' ? (value as CoherenceAnswer) : value
            nextChecks[index] = {
                ...nextChecks[index],
                [field]: nextValue
            }
            return {
                ...prev,
                purposeDefinition: {
                    ...prev.purposeDefinition,
                    coherenceChecks: nextChecks
                }
            }
        })
    }

    const savePurposeBlock = (blockLabel: string) => {
        savePage(3)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateVmpMatrix = (
        field: keyof WB3State['vocationMissionPassion']['matrix'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vocationMissionPassion: {
                ...prev.vocationMissionPassion,
                matrix: {
                    ...prev.vocationMissionPassion.matrix,
                    [field]: value
                }
            }
        }))
    }

    const updateVmpConvergence = (
        field: keyof WB3State['vocationMissionPassion']['convergence'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vocationMissionPassion: {
                ...prev.vocationMissionPassion,
                convergence: {
                    ...prev.vocationMissionPassion.convergence,
                    [field]: value
                }
            }
        }))
    }

    const updateVmpSemaphore = (
        dimension: keyof WB3State['vocationMissionPassion']['semaphore'],
        field: 'color' | 'adjustment',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            vocationMissionPassion: {
                ...prev.vocationMissionPassion,
                semaphore: {
                    ...prev.vocationMissionPassion.semaphore,
                    [dimension]: {
                        ...prev.vocationMissionPassion.semaphore[dimension],
                        [field]: value
                    }
                }
            }
        }))
    }

    const saveVmpBlock = (blockLabel: string) => {
        savePage(4)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateLifeWheelScore = (
        dimension: LifeWheelDimensionKey,
        field: 'score' | 'note',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            lifeWheel: {
                ...prev.lifeWheel,
                scores: {
                    ...prev.lifeWheel.scores,
                    [dimension]: {
                        ...prev.lifeWheel.scores[dimension],
                        [field]: field === 'score' ? (value === '' ? null : Number(value)) : value
                    }
                }
            }
        }))
    }

    const updateLifeWheelReading = (field: keyof WB3State['lifeWheel']['reading'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            lifeWheel: {
                ...prev.lifeWheel,
                reading: {
                    ...prev.lifeWheel.reading,
                    [field]: value
                }
            }
        }))
    }

    const updateLifeWheelPrioritization = (
        field: keyof WB3State['lifeWheel']['prioritization'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            lifeWheel: {
                ...prev.lifeWheel,
                prioritization: {
                    ...prev.lifeWheel.prioritization,
                    [field]: value
                }
            }
        }))
    }

    const saveLifeWheelBlock = (blockLabel: string) => {
        savePage(5)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateSuccessExploration = (
        field: keyof WB3State['successDefinition']['exploration'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            successDefinition: {
                ...prev.successDefinition,
                exploration: {
                    ...prev.successDefinition.exploration,
                    [field]: value
                }
            }
        }))
    }

    const updateSuccessMatrixRow = (index: number, field: 'authentic' | 'imposed', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.successDefinition.matrix]
            nextRows[index] = {
                ...nextRows[index],
                [field]: value
            }
            return {
                ...prev,
                successDefinition: {
                    ...prev.successDefinition,
                    matrix: nextRows
                }
            }
        })
    }

    const updateSuccessStatement = (
        field: keyof WB3State['successDefinition']['statement'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            successDefinition: {
                ...prev.successDefinition,
                statement: {
                    ...prev.successDefinition.statement,
                    [field]: value
                }
            }
        }))
    }

    const updateSuccessCoherenceCheck = (index: number, field: 'answer' | 'adjustment', value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextChecks = [...prev.successDefinition.coherenceChecks]
            const nextValue = field === 'answer' ? (value as CoherenceAnswer) : value
            nextChecks[index] = {
                ...nextChecks[index],
                [field]: nextValue
            }
            return {
                ...prev,
                successDefinition: {
                    ...prev.successDefinition,
                    coherenceChecks: nextChecks
                }
            }
        })
    }

    const saveSuccessBlock = (blockLabel: string) => {
        savePage(6)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateAlignmentMatrixRow = (
        index: number,
        field: 'current' | 'alignment' | 'adjustment',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.purposeVisionAlignment.matrix]
            if (field === 'alignment') {
                nextRows[index] = {
                    ...nextRows[index],
                    alignment: value as AlignmentAnswer
                }
            } else {
                nextRows[index] = {
                    ...nextRows[index],
                    [field]: value
                }
            }
            return {
                ...prev,
                purposeVisionAlignment: {
                    ...prev.purposeVisionAlignment,
                    matrix: nextRows
                }
            }
        })
    }

    const updateAlignmentStrategicCheck = (
        index: number,
        field: 'answer' | 'observation',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.purposeVisionAlignment.strategicChecks]
            nextRows[index] = {
                ...nextRows[index],
                [field]: field === 'answer' ? (value as AlignmentAnswer) : value
            }
            return {
                ...prev,
                purposeVisionAlignment: {
                    ...prev.purposeVisionAlignment,
                    strategicChecks: nextRows
                }
            }
        })
    }

    const updateAlignmentTension = (
        field: keyof WB3State['purposeVisionAlignment']['tensions'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeVisionAlignment: {
                ...prev.purposeVisionAlignment,
                tensions: {
                    ...prev.purposeVisionAlignment.tensions,
                    [field]: value
                }
            }
        }))
    }

    const updateAlignmentDeclaration = (
        field: keyof WB3State['purposeVisionAlignment']['declaration'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            purposeVisionAlignment: {
                ...prev.purposeVisionAlignment,
                declaration: {
                    ...prev.purposeVisionAlignment.declaration,
                    [field]: value
                }
            }
        }))
    }

    const saveAlignmentBlock = (blockLabel: string) => {
        savePage(7)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateVisionScenario = (
        field: keyof WB3State['longTermVisionDesign']['scenario'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            longTermVisionDesign: {
                ...prev.longTermVisionDesign,
                scenario: {
                    ...prev.longTermVisionDesign.scenario,
                    [field]: value
                }
            }
        }))
    }

    const updateVisionMatrixRow = (index: number, value: string) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.longTermVisionDesign.matrix]
            nextRows[index] = {
                ...nextRows[index],
                formulation: value
            }
            return {
                ...prev,
                longTermVisionDesign: {
                    ...prev.longTermVisionDesign,
                    matrix: nextRows
                }
            }
        })
    }

    const updateVisionMilestone = (
        index: number,
        field: 'expectedMilestone' | 'evidence',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.longTermVisionDesign.milestones]
            nextRows[index] = {
                ...nextRows[index],
                [field]: value
            }
            return {
                ...prev,
                longTermVisionDesign: {
                    ...prev.longTermVisionDesign,
                    milestones: nextRows,
                    milestonesCommitted: false
                }
            }
        })
    }

    const updateVisionCheck = (
        index: number,
        field: 'answer' | 'adjustment',
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => {
            const nextRows = [...prev.longTermVisionDesign.viabilityChecks]
            nextRows[index] = {
                ...nextRows[index],
                [field]: field === 'answer' ? (value as AlignmentAnswer) : value
            }
            return {
                ...prev,
                longTermVisionDesign: {
                    ...prev.longTermVisionDesign,
                    viabilityChecks: nextRows
                }
            }
        })
    }

    const saveVisionBlock = (blockLabel: string) => {
        savePage(8)
        announceSave(`${blockLabel} guardado.`)
    }

    const saveVisionMilestonesBlock = () => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            longTermVisionDesign: {
                ...prev.longTermVisionDesign,
                milestonesCommitted: true
            }
        }))
        savePage(8)
        announceSave('Bloque 3 (Hitos de largo plazo) guardado.')
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
        announceSave(`Fila Adviser ${index + 1} guardada.`)
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
        announceSave('Cierre del Adviser guardado.')
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
        savePage(9)
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

    const page1Complete = useMemo(
        () => state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        [state.identification.leaderName, state.identification.role]
    )

    const page2Complete = hasSeenPresentationOnce

    const block1Complete = useMemo(() => {
        const exploration = state.purposeDefinition.exploration
        return (
            exploration.transformationFocus.trim().length > 0 &&
            exploration.keyProblem.trim().length > 0 &&
            exploration.meaningfulMoments.trim().length > 0 &&
            exploration.serviceAudience.trim().length > 0 &&
            exploration.nonNegotiables.trim().length > 0
        )
    }, [state.purposeDefinition.exploration])

    const block2Complete = useMemo(() => {
        const matrix = state.purposeDefinition.matrix
        return (
            matrix.contribution.trim().length > 0 &&
            matrix.audience.trim().length > 0 &&
            matrix.change.trim().length > 0 &&
            matrix.currentAction.trim().length > 0 &&
            matrix.betterAction.trim().length > 0
        )
    }, [state.purposeDefinition.matrix])

    const block3Complete = useMemo(() => {
        const formula = state.purposeDefinition.formula
        return (
            formula.contribution.trim().length > 0 &&
            formula.context.trim().length > 0 &&
            formula.method.trim().length > 0
        )
    }, [state.purposeDefinition.formula])

    const block4Complete = useMemo(
        () =>
            state.purposeDefinition.coherenceChecks.every(
                (row) => row.answer !== '' && row.adjustment.trim().length > 0
            ),
        [state.purposeDefinition.coherenceChecks]
    )

    const page3Complete = useMemo(
        () => block1Complete && block3Complete && block4Complete,
        [block1Complete, block3Complete, block4Complete]
    )

    const vmpBlock1Complete = useMemo(() => {
        const matrix = state.vocationMissionPassion.matrix
        return (
            matrix.vocationMeaning.trim().length > 0 &&
            matrix.vocationWhere.trim().length > 0 &&
            matrix.missionMeaning.trim().length > 0 &&
            matrix.missionWhere.trim().length > 0 &&
            matrix.passionMeaning.trim().length > 0 &&
            matrix.passionWhere.trim().length > 0
        )
    }, [state.vocationMissionPassion.matrix])

    const vmpBlock2Complete = useMemo(() => {
        const convergence = state.vocationMissionPassion.convergence
        return (
            convergence.conviction.trim().length > 0 &&
            convergence.service.trim().length > 0 &&
            convergence.enthusiasm.trim().length > 0 &&
            convergence.intersection.trim().length > 0
        )
    }, [state.vocationMissionPassion.convergence])

    const vmpBlock3Complete = useMemo(
        () =>
            (['vocation', 'mission', 'passion'] as const).every((dimension) => {
                const row = state.vocationMissionPassion.semaphore[dimension]
                return row.color !== '' && row.adjustment.trim().length > 0
            }),
        [state.vocationMissionPassion.semaphore]
    )

    const page4Complete = useMemo(
        () => vmpBlock1Complete && vmpBlock2Complete && vmpBlock3Complete,
        [vmpBlock1Complete, vmpBlock2Complete, vmpBlock3Complete]
    )

    const wheelBlock1Complete = useMemo(
        () =>
            LIFE_WHEEL_DIMENSIONS.every((dimension) => {
                const row = state.lifeWheel.scores[dimension.key]
                return row.score !== null && row.note.trim().length > 0
            }),
        [state.lifeWheel.scores]
    )

    const wheelReadingComplete = useMemo(() => {
        const reading = state.lifeWheel.reading
        return (
            reading.lowestArea.trim().length > 0 &&
            reading.highestArea.trim().length > 0 &&
            reading.biggestImbalance.trim().length > 0 &&
            reading.cascadingArea.trim().length > 0 &&
            reading.leverageArea.trim().length > 0
        )
    }, [state.lifeWheel.reading])

    const wheelPrioritizationComplete = useMemo(() => {
        const prioritization = state.lifeWheel.prioritization
        return (
            prioritization.criticalArea.trim().length > 0 &&
            prioritization.criticalReason.trim().length > 0 &&
            prioritization.leverageArea.trim().length > 0 &&
            prioritization.leverageReason.trim().length > 0 &&
            prioritization.firstAdjustment.trim().length > 0
        )
    }, [state.lifeWheel.prioritization])

    const page5Complete = useMemo(
        () => wheelBlock1Complete && wheelReadingComplete && wheelPrioritizationComplete,
        [wheelBlock1Complete, wheelReadingComplete, wheelPrioritizationComplete]
    )

    const successBlock1Complete = useMemo(() => {
        const exploration = state.successDefinition.exploration
        return (
            exploration.successfulLife.trim().length > 0 &&
            exploration.nonSacrifices.trim().length > 0 &&
            exploration.driftSignal.trim().length > 0 &&
            exploration.legacyStatement.trim().length > 0
        )
    }, [state.successDefinition.exploration])

    const successBlock2Complete = useMemo(
        () =>
            state.successDefinition.matrix.every(
                (row) => row.authentic.trim().length > 0 && row.imposed.trim().length > 0
            ),
        [state.successDefinition.matrix]
    )

    const successBlock3Complete = useMemo(() => {
        const statement = state.successDefinition.statement
        return (
            statement.is.trim().length > 0 &&
            statement.withoutSacrificing.trim().length > 0 &&
            statement.contributingTo.trim().length > 0
        )
    }, [state.successDefinition.statement])

    const successBlock4Complete = useMemo(
        () =>
            state.successDefinition.coherenceChecks.every(
                (row) => row.answer !== '' && row.adjustment.trim().length > 0
            ),
        [state.successDefinition.coherenceChecks]
    )

    const page6Complete = useMemo(
        () => successBlock1Complete && successBlock2Complete && successBlock3Complete && successBlock4Complete,
        [successBlock1Complete, successBlock2Complete, successBlock3Complete, successBlock4Complete]
    )

    const alignmentBlock1Complete = useMemo(
        () =>
            state.purposeVisionAlignment.matrix.every(
                (row) =>
                    row.current.trim().length > 0 &&
                    row.alignment !== '' &&
                    row.adjustment.trim().length > 0
            ),
        [state.purposeVisionAlignment.matrix]
    )

    const alignmentBlock2Complete = useMemo(
        () =>
            state.purposeVisionAlignment.strategicChecks.every(
                (row) => row.answer !== '' && row.observation.trim().length > 0
            ),
        [state.purposeVisionAlignment.strategicChecks]
    )

    const alignmentBlock3Complete = useMemo(() => {
        const tensions = state.purposeVisionAlignment.tensions
        return (
            tensions.purposeStrengthen.trim().length > 0 &&
            tensions.visionBuild.trim().length > 0 &&
            tensions.misalignedActions.trim().length > 0 &&
            tensions.requiredRenunciation.trim().length > 0
        )
    }, [state.purposeVisionAlignment.tensions])

    const alignmentBlock4Complete = useMemo(() => {
        const declaration = state.purposeVisionAlignment.declaration
        return (
            declaration.whenAligned.trim().length > 0 &&
            declaration.expressedIn.trim().length > 0
        )
    }, [state.purposeVisionAlignment.declaration])

    const page7Complete = useMemo(
        () => alignmentBlock1Complete && alignmentBlock2Complete && alignmentBlock3Complete && alignmentBlock4Complete,
        [alignmentBlock1Complete, alignmentBlock2Complete, alignmentBlock3Complete, alignmentBlock4Complete]
    )

    const visionBlock1Complete = useMemo(() => {
        const scenario = state.longTermVisionDesign.scenario
        return (
            scenario.futureLandscape.trim().length > 0 &&
            scenario.futureBuild.trim().length > 0 &&
            scenario.futureImpact.trim().length > 0 &&
            scenario.futureLeadershipStyle.trim().length > 0
        )
    }, [state.longTermVisionDesign.scenario])

    const visionBlock2Complete = useMemo(
        () => state.longTermVisionDesign.matrix.every((row) => row.formulation.trim().length > 0),
        [state.longTermVisionDesign.matrix]
    )

    const visionBlock3Complete = useMemo(
        () =>
            state.longTermVisionDesign.milestones.every(
                (row) =>
                    row.expectedMilestone.trim().length > 0 &&
                    row.evidence.trim().length > 0
            ),
        [state.longTermVisionDesign.milestones]
    )

    const visionBlock4Complete = useMemo(
        () =>
            state.longTermVisionDesign.viabilityChecks.every(
                (row) => row.answer !== '' && row.adjustment.trim().length > 0
            ),
        [state.longTermVisionDesign.viabilityChecks]
    )

    const page8Complete = useMemo(
        () => visionBlock1Complete && visionBlock2Complete && visionBlock3Complete && visionBlock4Complete,
        [visionBlock1Complete, visionBlock2Complete, visionBlock3Complete, visionBlock4Complete]
    )

    const showVisionMilestonesTimeline = useMemo(
        () =>
            state.longTermVisionDesign.milestonesCommitted &&
            state.longTermVisionDesign.milestones.some(
                (row) => row.expectedMilestone.trim().length > 0 || row.evidence.trim().length > 0
            ),
        [state.longTermVisionDesign.milestonesCommitted, state.longTermVisionDesign.milestones]
    )

    const mentorCompletedRows = useMemo(
        () => state.evaluation.mentorRows.filter((row) => isMentorEvaluationRowComplete(row)).length,
        [state.evaluation.mentorRows]
    )

    const leaderCompletedRows = useMemo(
        () => state.evaluation.leaderRows.filter((row) => isLeaderEvaluationRowComplete(row)).length,
        [state.evaluation.leaderRows]
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

    const evaluationSectionComplete = useMemo(
        () => mentorStageComplete && leaderStageComplete && synthesisStageComplete,
        [mentorStageComplete, leaderStageComplete, synthesisStageComplete]
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

    const page9Complete = evaluationSectionComplete

    const lifeWheelChartGeometry = useMemo(() => {
        const size = 420
        const center = size / 2
        const radius = 150
        const levels = [2, 4, 6, 8, 10]
        const totalAxes = LIFE_WHEEL_DIMENSIONS.length

        const axes = LIFE_WHEEL_DIMENSIONS.map((dimension, index) => {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / totalAxes
            const outerX = center + radius * Math.cos(angle)
            const outerY = center + radius * Math.sin(angle)
            const score = state.lifeWheel.scores[dimension.key].score ?? 0
            const valueRadius = (score / 10) * radius
            const pointX = center + valueRadius * Math.cos(angle)
            const pointY = center + valueRadius * Math.sin(angle)
            const labelRadius = radius + 24
            const labelX = center + labelRadius * Math.cos(angle)
            const labelY = center + labelRadius * Math.sin(angle)

            return {
                ...dimension,
                angle,
                outerX,
                outerY,
                pointX,
                pointY,
                labelX,
                labelY,
                score
            }
        })

        const polygonPoints = axes.map((axis) => `${axis.pointX},${axis.pointY}`).join(' ')
        const maxScoredDimension = axes.reduce<{ label: string; score: number } | null>((best, axis) => {
            if (!best || axis.score > best.score) {
                return { label: axis.label, score: axis.score }
            }
            return best
        }, null)

        return { size, center, radius, levels, axes, polygonPoints, maxScoredDimension }
    }, [state.lifeWheel.scores])

    const lifeWheelAutoInsights = useMemo(() => {
        const scoredDimensions = LIFE_WHEEL_DIMENSIONS.reduce<Array<{ label: string; score: number }>>(
            (acc, dimension) => {
                const score = state.lifeWheel.scores[dimension.key].score
                if (typeof score === 'number') {
                    acc.push({ label: dimension.label, score })
                }
                return acc
            },
            []
        )

        if (scoredDimensions.length === 0) {
            return null
        }

        const lowest = scoredDimensions.reduce((min, row) => (row.score < min.score ? row : min), scoredDimensions[0])
        const highest = scoredDimensions.reduce((max, row) => (row.score > max.score ? row : max), scoredDimensions[0])

        return { lowest, highest }
    }, [state.lifeWheel.scores])

    const completionCount = [page1Complete, page2Complete, page3Complete, page4Complete, page5Complete, page6Complete, page7Complete, page8Complete, page9Complete].filter(Boolean).length
    const progressPercent = Math.round((completionCount / PAGES.length) * 100)

    const pageStatusMap: Record<WorkbookPageId, { complete: boolean }> = {
        1: { complete: page1Complete },
        2: { complete: page2Complete },
        3: { complete: page3Complete },
        4: { complete: page4Complete },
        5: { complete: page5Complete },
        6: { complete: page6Complete },
        7: { complete: page7Complete },
        8: { complete: page8Complete },
        9: { complete: page9Complete }
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

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

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

        clonedRoot.querySelector('.wb3-toolbar')?.remove()
        clonedRoot.querySelector('.wb3-sidebar')?.remove()
        clonedRoot.querySelector('.wb3-page-nav')?.remove()

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
                    .wb3-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb3-print-page:not(.wb3-cover-page)::before {
                        content: "WB3 · Propósito y valores no negociables · " attr(data-print-title);
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
                    .wb3-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb3-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb3-cover-page::before { content: none !important; }
                    .wb3-cover-hero {
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
                titleNode.textContent = 'WB3 - Propósito y valores no negociables (completo)'
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
            document.title = 'WB3 - Propósito y valores no negociables (completo)'
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
            link.download = 'WB3-proposito-valores-no-negociables-completo.html'
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

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb3-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
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
                            <p className="text-sm md:text-base font-extrabold text-slate-900">WB3 - Propósito y valores no negociables</p>
                        </div>

                        <div className={WORKBOOK_V2_EDITORIAL.classes.progressPill}>
                            Avance: {progressPercent}%
                        </div>

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
                            onClick={toggleLock}
                            className={WORKBOOK_V2_EDITORIAL.classes.lockButton}
                        >
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
                <div className={`grid gap-6 items-start ${isExportingAll ? 'grid-cols-1 min-w-0' : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-w-0'}`}>
                    <aside className={`wb3-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
                        <p className={WORKBOOK_V2_EDITORIAL.classes.sidebarTitle}>{WORKBOOK_V2_EDITORIAL.labels.index}</p>
                        <nav className="space-y-2">
                            {PAGES.map((page) => {
                                const isActive = activePage === page.id
                                const isDone = pageStatusMap[page.id].complete
                                const blockedByFlow = page.id > 2 && !hasSeenPresentationOnce
                                return (
                                    <button
                                        key={page.id}
                                        type="button"
                                        onClick={() => jumpToPage(page.id)}
                                        disabled={blockedByFlow}
                                        className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                                            isActive
                                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                        } disabled:opacity-55 disabled:cursor-not-allowed`}
                                    >
                                        <p className="text-sm font-bold">{page.label}</p>
                                        <p className={`text-xs font-semibold ${isDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {blockedByFlow ? 'Requiere revisar Presentación' : isDone ? 'Completada' : 'Pendiente'}
                                        </p>
                                    </button>
                                )
                            })}
                        </nav>
                    </aside>

                    <section className="space-y-6">
                        <article
                            className={`wb3-print-page wb3-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(1) ? '' : 'hidden'}`}
                            data-print-page="Página 1 de 9"
                            data-print-title="Portada"
                            data-cover-page="true"
                            data-print-meta={printMetaLabel}
                        >
                            <div className="wb3-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                <div className="relative text-center max-w-3xl">
                                    <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                        <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Propósito y valores no negociables
                                    </h1>
                                    <p className="mt-4 text-blue-800 font-semibold">Workbook 3</p>
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
                                            goNextPage()
                                        }}
                                        className="rounded-xl bg-blue-700 text-white px-6 py-3 text-sm font-bold hover:bg-blue-600 transition-colors"
                                    >
                                        Empezar
                                    </button>
                                </div>
                            </div>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(2) ? '' : 'hidden'}`}
                            data-print-page="Página 2 de 9"
                            data-print-title="Presentación del workbook"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 2</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Presentación del workbook</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Sección informativa: todos los usuarios deben revisarla en su primer ingreso para alinear lenguaje,
                                    foco y criterios de evidencia.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <h3 className="text-xl font-bold text-slate-900">Objetivo</h3>
                                <p className="text-slate-700">Al finalizar, tendrás:</p>
                                <ul className="text-sm text-slate-700 space-y-1">
                                    <li>• Una definición más clara de tu propósito personal.</li>
                                    <li>• Distinción entre vocación, misión y pasión, y la forma en que se relacionan en tu vida.</li>
                                    <li>• Una lectura más precisa de tu Rueda de la vida para identificar equilibrio, tensión y prioridades.</li>
                                    <li>• Una declaración de éxito personal construida desde tus criterios y no desde expectativas externas.</li>
                                    <li>• Un ejercicio de alineación propósito–visión para verificar si tu dirección actual tiene coherencia.</li>
                                    <li>• Un primer diseño de tu visión a largo plazo, con sentido, intención y dirección.</li>
                                </ul>
                            </section>

                            <section className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 p-5 space-y-2">
                                    <h4 className="font-bold text-slate-900">Componentes trabajados en este workbook</h4>
                                    <ul className="text-sm text-slate-700 space-y-1">
                                        <li>• Propósito y valores (integridad)</li>
                                        <li>• Aprendizaje y reflexión (self-awareness)</li>
                                        <li>• Visión de futuro y estrategia (Shine Up)</li>
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-5 space-y-2">
                                    <h4 className="font-bold text-slate-900">Competencias 4Shine que vas a activar</h4>
                                    <ul className="text-sm text-slate-700 space-y-1">
                                        <li>• Claridad de propósito (Ikigai)</li>
                                        <li>• Integridad y coherencia</li>
                                        <li>• Autenticidad</li>
                                        <li>• Práctica reflexiva</li>
                                        <li>• Pensamiento estratégico</li>
                                        <li>• Visión compartida (visioning)</li>
                                        <li>• Alineación de metas (execution)</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 p-5 md:p-6 space-y-3">
                                <h4 className="font-bold text-slate-900">Conductas observables asociadas (qué se debería ver en tu día a día)</h4>
                                <p className="text-sm text-slate-700">Usa estas conductas como referencia para escribir evidencia real (no intención):</p>
                                <ul className="text-sm text-slate-700 space-y-1">
                                    <li>• Define y articula un "para qué" claro que conecta su trabajo diario con un impacto mayor.</li>
                                    <li>• Utiliza su propósito como filtro para la toma de decisiones difíciles.</li>
                                    <li>• Hace lo que dice; sus acciones privadas y públicas son congruentes con los valores que predica.</li>
                                    <li>• Cumple sus promesas y compromisos, generando confianza y previsibilidad.</li>
                                    <li>• Defiende sus principios éticos incluso bajo presión.</li>
                                    <li>• Se muestra genuino, sin adoptar máscaras corporativas.</li>
                                    <li>• Es transparente sobre sus intenciones y valores.</li>
                                    <li>• Dedica tiempo agendado a la autoobservación y al análisis de su desempeño.</li>
                                    <li>• Se hace preguntas poderosas sobre su identidad y su futuro.</li>
                                    <li>• No se limita a apagar fuegos de corto plazo; dedica tiempo a pensar a largo plazo.</li>
                                    <li>• Analiza tendencias y contextos para anticipar escenarios futuros.</li>
                                    <li>• Articula un escenario futuro aspiracional de manera clara y vívida.</li>
                                    <li>• Comunica el por qué detrás de las metas, dando sentido al trabajo diario.</li>
                                    <li>• Traduce la visión abstracta en objetivos concretos y accionables.</li>
                                    <li>• Explica cómo las tareas cotidianas y metas de corto plazo contribuyen a la estrategia general.</li>
                                </ul>
                            </section>

                            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6 space-y-2">
                                <h4 className="font-bold text-slate-900">Reglas de oro (para ti)</h4>
                                <ul className="text-sm text-slate-700 space-y-1">
                                    <li>• Responde con hechos y decisiones concretas, no con frases aspiracionales.</li>
                                    <li>• No escribas el propósito que suena bien; escribe el que realmente te orienta.</li>
                                    <li>• Si detectas incoherencia entre lo que valoras y lo que haces, no la ocultes.</li>
                                    <li>• Usa este workbook para clarificar dirección, no para adornar identidad.</li>
                                </ul>
                            </section>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                Presentación revisada. Ya puedes avanzar a la sección 3.
                            </div>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(3) ? '' : 'hidden'}`}
                            data-print-page="Página 3 de 9"
                            data-print-title="Definición de propósito personal"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 3</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">1. Definición de propósito personal</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Formular con claridad para qué haces lo que haces, a quién quieres servir y qué tipo de contribución quieres encarnar.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Marco de la sección</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPurposeHelp(true)}
                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            Ayuda
                                        </button>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                page3Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            Estado sección: {page3Complete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Esta sección te ayudará a formular un propósito útil para tomar decisiones, ordenar prioridades,
                                    reconocer incoherencias y orientar tu visión.
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Qué es propósito personal</p>
                                        <p className="text-sm text-slate-700">Es la dirección de fondo que da sentido a tu acción. No es solo lo que haces; es para qué lo haces y qué impacto buscas generar.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Qué no es propósito</p>
                                        <p className="text-sm text-slate-700">No es un cargo, una meta de corto plazo, ni una descripción genérica como “quiero ayudar”.</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Cómo reconocer que estás cerca de tu propósito</p>
                                    <ul className="text-sm text-slate-700 space-y-1">
                                        <li>• Te representa de verdad.</li>
                                        <li>• Conecta con tu trabajo real.</li>
                                        <li>• Te sirve para elegir.</li>
                                        <li>• Te exige coherencia.</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 1 — Exploración guiada del propósito</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowExampleStep1((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showExampleStep1 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Responde de forma breve, concreta y honesta. No escribas lo que debería ser tu propósito; escribe lo que hoy reconoces como significativo.
                                </p>
                                <div className="space-y-3">
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">1. Lo que más me importa transformar en personas, equipos o contextos es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.exploration.transformationFocus}
                                            onChange={(event) => updateExploration('transformationFocus', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">2. El tipo de problema que más me importa resolver es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.exploration.keyProblem}
                                            onChange={(event) => updateExploration('keyProblem', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">3. Cuando siento que mi trabajo tiene sentido, normalmente estoy:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.exploration.meaningfulMoments}
                                            onChange={(event) => updateExploration('meaningfulMoments', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">4. Las personas, equipos o causas a las que más quiero servir son:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.exploration.serviceAudience}
                                            onChange={(event) => updateExploration('serviceAudience', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">5. Lo que no quiero negociar en ese camino es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.exploration.nonNegotiables}
                                            onChange={(event) => updateExploration('nonNegotiables', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                {showExampleStep1 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p>1. Transformar líderes técnicamente fuertes pero internamente desordenados.</p>
                                        <p>2. La incoherencia entre capacidad, dirección y forma de liderar.</p>
                                        <p>3. Diseñando herramientas, acompañando procesos y generando claridad.</p>
                                        <p>4. Líderes, equipos y organizaciones que quieren crecer con sentido.</p>
                                        <p>5. Integridad, profundidad y respeto.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block1Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {block1Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => savePurposeBlock('Bloque 1 (Exploración guiada)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 1
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz Propósito–Impacto–Acción</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowExampleStep2((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showExampleStep2 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Traduce tu propósito a algo concreto: qué quieres aportar, a quién, con qué efecto y cómo lo haces hoy.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[860px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Dimensión</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Tu respuesta</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Lo que quiero aportar</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.purposeDefinition.matrix.contribution}
                                                        onChange={(event) => updateMatrix('contribution', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">A quién quiero servir</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.purposeDefinition.matrix.audience}
                                                        onChange={(event) => updateMatrix('audience', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Qué cambio quiero provocar</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.purposeDefinition.matrix.change}
                                                        onChange={(event) => updateMatrix('change', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Cómo lo hago hoy</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.purposeDefinition.matrix.currentAction}
                                                        onChange={(event) => updateMatrix('currentAction', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Cómo quiero hacerlo mejor</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.purposeDefinition.matrix.betterAction}
                                                        onChange={(event) => updateMatrix('betterAction', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                {showExampleStep2 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">Lo que quiero aportar:</span> Claridad, consciencia y dirección.</p>
                                        <p><span className="font-semibold text-slate-900">A quién quiero servir:</span> Líderes y equipos en crecimiento.</p>
                                        <p><span className="font-semibold text-slate-900">Qué cambio quiero provocar:</span> Más coherencia y mejores decisiones.</p>
                                        <p><span className="font-semibold text-slate-900">Cómo lo hago hoy:</span> Formación, mentoría y diseño de herramientas.</p>
                                        <p><span className="font-semibold text-slate-900">Cómo quiero hacerlo mejor:</span> Con mayor sistematicidad e impacto medible.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block2Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {block2Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => savePurposeBlock('Bloque 2 (Matriz Propósito–Impacto–Acción)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 2
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 3 — Fórmula de propósito en una frase</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowExampleStep3((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showExampleStep3 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Usa esta fórmula como borrador útil: <span className="font-semibold text-slate-900">“Mi propósito es contribuir a ______ en ______ mediante ______.”</span>
                                </p>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Contribuir a</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.formula.contribution}
                                            onChange={(event) => updateFormula('contribution', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">En</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.formula.context}
                                            onChange={(event) => updateFormula('context', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Mediante</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeDefinition.formula.method}
                                            onChange={(event) => updateFormula('method', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Vista previa</p>
                                    <p className="text-sm text-slate-800">
                                        Mi propósito es contribuir a {state.purposeDefinition.formula.contribution || '______'} en{' '}
                                        {state.purposeDefinition.formula.context || '______'} mediante{' '}
                                        {state.purposeDefinition.formula.method || '______'}.
                                    </p>
                                </div>
                                {showExampleStep3 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p>Mi propósito es contribuir al desarrollo de líderes más conscientes</p>
                                        <p>en equipos y organizaciones</p>
                                        <p>mediante herramientas, conversaciones y procesos que generen claridad y transformación.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block3Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {block3Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => savePurposeBlock('Bloque 3 (Fórmula de propósito)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 3
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 4 — Chequeo de coherencia</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    Verifica si tu frase de propósito te representa y te sirve para decidir. Marca Sí/No y define ajuste necesario.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[900px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Pregunta</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Sí</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">No</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Ajuste necesario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.purposeDefinition.coherenceChecks.map((row, index) => (
                                                <tr key={`coherence-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.question}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`coherence-answer-${index}`}
                                                            checked={row.answer === 'si'}
                                                            onChange={() => updateCoherenceCheck(index, 'answer', 'si')}
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`coherence-answer-${index}`}
                                                            checked={row.answer === 'no'}
                                                            onChange={() => updateCoherenceCheck(index, 'answer', 'no')}
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.adjustment}
                                                            onChange={(event) => updateCoherenceCheck(index, 'adjustment', event.target.value)}
                                                            disabled={isLocked}
                                                            placeholder="Qué ajustar para que tu propósito sea útil"
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${block4Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {block4Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => savePurposeBlock('Bloque 4 (Chequeo de coherencia)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 4
                                    </button>
                                </div>
                            </section>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(4) ? '' : 'hidden'}`}
                            data-print-page="Página 4 de 9"
                            data-print-title="Vocación, misión y pasión"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 4</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Vocación, misión y pasión</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Distinguir tres dimensiones que suelen mezclarse para encontrar tu zona de convergencia.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Marco de la sección</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowVmpHelp(true)}
                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            Ayuda
                                        </button>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                page4Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            Estado sección: {page4Complete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700">
                                    El objetivo es que no confundas lo que te gusta, con lo que sabes hacer, con lo que realmente estás llamado a sostener.
                                </p>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Vocación</p>
                                        <p className="text-sm text-slate-700">Llamado profundo hacia cierto tipo de contribución.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Misión</p>
                                        <p className="text-sm text-slate-700">Forma concreta en que respondes a esa vocación en decisiones y servicio.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Pasión</p>
                                        <p className="text-sm text-slate-700">Energía sostenida que aparece cuando haces algo que te involucra profundamente.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 1 — Matriz Vocación–Misión–Pasión</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowVmpExample1((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showVmpExample1 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[920px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Dimensión</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">¿Qué significa hoy para mí?</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">¿Dónde aparece en mi vida/trabajo?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Vocación</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.vocationMissionPassion.matrix.vocationMeaning}
                                                        onChange={(event) => updateVmpMatrix('vocationMeaning', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.vocationMissionPassion.matrix.vocationWhere}
                                                        onChange={(event) => updateVmpMatrix('vocationWhere', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Misión</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.vocationMissionPassion.matrix.missionMeaning}
                                                        onChange={(event) => updateVmpMatrix('missionMeaning', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.vocationMissionPassion.matrix.missionWhere}
                                                        onChange={(event) => updateVmpMatrix('missionWhere', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="border-t border-slate-200">
                                                <td className="px-3 py-2 text-sm font-semibold text-slate-700">Pasión</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.vocationMissionPassion.matrix.passionMeaning}
                                                        onChange={(event) => updateVmpMatrix('passionMeaning', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={state.vocationMissionPassion.matrix.passionWhere}
                                                        onChange={(event) => updateVmpMatrix('passionWhere', event.target.value)}
                                                        disabled={isLocked}
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                {showVmpExample1 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">Vocación:</span> Acompañar procesos de transformación — Mentoría, escritura, diseño de metodologías.</p>
                                        <p><span className="font-semibold text-slate-900">Misión:</span> Formar líderes y equipos con más coherencia — Programas, consultoría, desarrollo de herramientas.</p>
                                        <p><span className="font-semibold text-slate-900">Pasión:</span> Diseñar, enseñar y estructurar ideas complejas — Workbooks, experiencias de aprendizaje, investigación.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${vmpBlock1Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {vmpBlock1Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveVmpBlock('Bloque 1 (Matriz VMP)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 1
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 2 — Zona de convergencia</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowVmpExample2((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showVmpExample2 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que hago por convicción profunda es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.vocationMissionPassion.convergence.conviction}
                                            onChange={(event) => updateVmpConvergence('conviction', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que hago como servicio concreto es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.vocationMissionPassion.convergence.service}
                                            onChange={(event) => updateVmpConvergence('service', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que hago con entusiasmo y energía sostenida es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.vocationMissionPassion.convergence.enthusiasm}
                                            onChange={(event) => updateVmpConvergence('enthusiasm', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">La zona donde las tres se encuentran es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.vocationMissionPassion.convergence.intersection}
                                            onChange={(event) => updateVmpConvergence('intersection', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                {showVmpExample2 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p>Lo que hago por convicción profunda es acompañar procesos de desarrollo.</p>
                                        <p>Lo que hago como servicio concreto es diseñar experiencias y herramientas formativas.</p>
                                        <p>Lo que hago con entusiasmo sostenido es estructurar ideas complejas y convertirlas en sistemas.</p>
                                        <p>La zona donde las tres se encuentran es el diseño de procesos para formar líderes más conscientes y efectivos.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${vmpBlock2Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {vmpBlock2Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveVmpBlock('Bloque 2 (Zona de convergencia)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 2
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 3 — Semáforo de coherencia personal</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowVmpExample3((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showVmpExample3 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Marca cada dimensión: Verde (clara y viva), Amarillo (presente pero confusa), Rojo (débil o ausente), y define un ajuste concreto.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[900px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Dimensión</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-emerald-700">Verde</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-amber-700">Amarillo</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-red-700">Rojo</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">¿Qué necesita ajuste?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {([
                                                { key: 'vocation', label: 'Vocación' },
                                                { key: 'mission', label: 'Misión' },
                                                { key: 'passion', label: 'Pasión' }
                                            ] as const).map((dimension) => {
                                                const row = state.vocationMissionPassion.semaphore[dimension.key]
                                                return (
                                                    <tr key={`vmp-semaphore-${dimension.key}`} className="border-t border-slate-200">
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-700">{dimension.label}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="radio"
                                                                name={`vmp-${dimension.key}`}
                                                                checked={row.color === 'verde'}
                                                                onChange={() => updateVmpSemaphore(dimension.key, 'color', 'verde')}
                                                                disabled={isLocked}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="radio"
                                                                name={`vmp-${dimension.key}`}
                                                                checked={row.color === 'amarillo'}
                                                                onChange={() => updateVmpSemaphore(dimension.key, 'color', 'amarillo')}
                                                                disabled={isLocked}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="radio"
                                                                name={`vmp-${dimension.key}`}
                                                                checked={row.color === 'rojo'}
                                                                onChange={() => updateVmpSemaphore(dimension.key, 'color', 'rojo')}
                                                                disabled={isLocked}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateVmpSemaphore(dimension.key, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {showVmpExample3 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">Vocación:</span> Amarillo — Clarificar mejor a quién quiero servir.</p>
                                        <p><span className="font-semibold text-slate-900">Misión:</span> Verde — Más foco.</p>
                                        <p><span className="font-semibold text-slate-900">Pasión:</span> Amarillo — Recuperar tiempo de creación y diseño.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${vmpBlock3Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {vmpBlock3Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveVmpBlock('Bloque 3 (Semáforo de coherencia personal)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 3
                                    </button>
                                </div>
                            </section>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(5) ? '' : 'hidden'}`}
                            data-print-page="Página 5 de 9"
                            data-print-title="Rueda de la vida"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 5</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Rueda de la vida</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Mirar tu vida como un sistema completo para detectar tensiones reales, áreas de soporte y prioridades de ajuste.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Marco de la sección</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowWheelHelp(true)}
                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            Ayuda
                                        </button>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                page5Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            Estado sección: {page5Complete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700">
                                    La Rueda de la vida te permite identificar dónde estás fuerte, dónde hay tensión y qué áreas
                                    podrían estar drenando o sosteniendo tu propósito, valores y visión.
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Para qué sirve</p>
                                        <ul className="text-sm text-slate-700 space-y-1">
                                            <li>• Tomar conciencia de tu estado actual.</li>
                                            <li>• Identificar desbalances y tensiones reales.</li>
                                            <li>• Priorizar ajustes con mayor inteligencia.</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Qué evitar</p>
                                        <ul className="text-sm text-slate-700 space-y-1">
                                            <li>• No la uses para juzgarte o compararte.</li>
                                            <li>• No puntúes desde el ideal, puntúa desde hoy.</li>
                                            <li>• No busques 10 en todo: busca claridad para actuar.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 1 — Rueda de la vida (0–10)</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowWheelExample1((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showWheelExample1 ? 'Ocultar ejemplo' : 'Botón de ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Asigna un puntaje de 0 a 10 por dimensión (0 = muy descuidado, 10 = muy sólido hoy) y añade una explicación breve, observable y concreta.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[920px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Dimensión</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Puntaje actual (0-10)</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Breve explicación (1 línea)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {LIFE_WHEEL_DIMENSIONS.map((dimension) => {
                                                const row = state.lifeWheel.scores[dimension.key]
                                                return (
                                                    <tr key={`wheel-${dimension.key}`} className="border-t border-slate-200">
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-700">{dimension.label}</td>
                                                        <td className="px-3 py-2">
                                                            <select
                                                                value={row.score === null ? '' : String(row.score)}
                                                                onChange={(event) => updateLifeWheelScore(dimension.key, 'score', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                            >
                                                                <option value="">Selecciona puntaje</option>
                                                                {Array.from({ length: 11 }, (_, index) => (
                                                                    <option key={`${dimension.key}-score-${index}`} value={index}>
                                                                        {index}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.note}
                                                                onChange={(event) => updateLifeWheelScore(dimension.key, 'note', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ej.: Fatiga acumulada en las tardes"
                                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {showWheelExample1 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo breve</p>
                                        <p><span className="font-semibold text-slate-900">Propósito y sentido (8):</span> Siento claridad en el para qué, aunque me falta traducirlo mejor a decisiones.</p>
                                        <p><span className="font-semibold text-slate-900">Bienestar físico y energía (5):</span> Estoy cumpliendo, pero con fatiga acumulada.</p>
                                        <p><span className="font-semibold text-slate-900">Equilibrio emocional (6):</span> Hay avances, pero todavía reacciono bajo presión.</p>
                                        <p><span className="font-semibold text-slate-900">Descanso / disfrute (3):</span> Lo he relegado; vivo muy orientado a tarea.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${wheelBlock1Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {wheelBlock1Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveLifeWheelBlock('Bloque 1 (Tabla de puntuación)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 1
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 2 — Visualización: Tu rueda actual</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    El gráfico radar se actualiza automáticamente con los 8 puntajes para mostrar la forma general de tu rueda y sus desbalances.
                                </p>
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 overflow-x-auto">
                                        <svg
                                            viewBox={`0 0 ${lifeWheelChartGeometry.size} ${lifeWheelChartGeometry.size}`}
                                            className="mx-auto h-auto w-full max-w-[420px]"
                                            role="img"
                                            aria-label="Gráfico radar de la rueda de la vida"
                                        >
                                            <defs>
                                                <linearGradient id="wheelFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                                                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.25" />
                                                </linearGradient>
                                            </defs>
                                            {lifeWheelChartGeometry.levels.map((level) => (
                                                <circle
                                                    key={`grid-level-${level}`}
                                                    cx={lifeWheelChartGeometry.center}
                                                    cy={lifeWheelChartGeometry.center}
                                                    r={(level / 10) * lifeWheelChartGeometry.radius}
                                                    fill="none"
                                                    stroke="#cbd5e1"
                                                    strokeDasharray={level === 10 ? '0' : '4 4'}
                                                    strokeWidth={level === 10 ? 1.4 : 1}
                                                />
                                            ))}
                                            {lifeWheelChartGeometry.axes.map((axis, index) => (
                                                <line
                                                    key={`wheel-axis-${axis.key}`}
                                                    x1={lifeWheelChartGeometry.center}
                                                    y1={lifeWheelChartGeometry.center}
                                                    x2={axis.outerX}
                                                    y2={axis.outerY}
                                                    stroke="#cbd5e1"
                                                    strokeWidth={1}
                                                />
                                            ))}
                                            <polygon
                                                points={lifeWheelChartGeometry.polygonPoints}
                                                fill="url(#wheelFillGradient)"
                                                stroke="#1d4ed8"
                                                strokeWidth={2.5}
                                            />
                                            {lifeWheelChartGeometry.axes.map((axis, index) => (
                                                <g key={`wheel-point-${axis.key}`}>
                                                    <circle cx={axis.pointX} cy={axis.pointY} r={5.5} fill={axis.color} stroke="#ffffff" strokeWidth={2} />
                                                    <text
                                                        x={axis.labelX}
                                                        y={axis.labelY}
                                                        textAnchor={axis.labelX < lifeWheelChartGeometry.center - 8 ? 'end' : axis.labelX > lifeWheelChartGeometry.center + 8 ? 'start' : 'middle'}
                                                        dominantBaseline="middle"
                                                        fill="#1e293b"
                                                        fontSize="11"
                                                        fontWeight="700"
                                                    >
                                                        {index + 1}
                                                    </text>
                                                </g>
                                            ))}
                                            <circle cx={lifeWheelChartGeometry.center} cy={lifeWheelChartGeometry.center} r={4} fill="#1d4ed8" />
                                        </svg>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                        <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-slate-500">Leyenda de dimensiones</h4>
                                        <div className="grid gap-2">
                                            {LIFE_WHEEL_DIMENSIONS.map((dimension, index) => {
                                                const score = state.lifeWheel.scores[dimension.key].score
                                                return (
                                                    <div key={`wheel-legend-${dimension.key}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                                                style={{ backgroundColor: dimension.color }}
                                                            >
                                                                {index + 1}
                                                            </span>
                                                            <span className="text-sm font-semibold text-slate-700">{dimension.label}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900">{score === null ? '—' : `${score}/10`}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {lifeWheelAutoInsights && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-slate-700 space-y-1">
                                                <p><span className="font-semibold text-slate-900">Lectura automática:</span></p>
                                                <p>• Área más baja: <span className="font-semibold text-slate-900">{lifeWheelAutoInsights.lowest.label}</span> ({lifeWheelAutoInsights.lowest.score}/10)</p>
                                                <p>• Área más alta: <span className="font-semibold text-slate-900">{lifeWheelAutoInsights.highest.label}</span> ({lifeWheelAutoInsights.highest.score}/10)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
                                <h3 className="text-lg font-bold text-slate-900">Paso 3 — Lectura de la rueda y priorización de foco</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    Responde con precisión: primero interpreta el patrón de la rueda y luego define una área crítica, una área palanca y un primer ajuste concreto para esta semana.
                                </p>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <h4 className="font-bold text-slate-900">Lectura de la rueda</h4>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">1. ¿Qué área tiene hoy el puntaje más bajo?</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.reading.lowestArea}
                                                onChange={(event) => updateLifeWheelReading('lowestArea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">2. ¿Qué área tiene el puntaje más alto?</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.reading.highestArea}
                                                onChange={(event) => updateLifeWheelReading('highestArea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">3. ¿Qué desbalance te preocupa más?</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.reading.biggestImbalance}
                                                onChange={(event) => updateLifeWheelReading('biggestImbalance', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">4. ¿Qué área está afectando negativamente a otras?</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.reading.cascadingArea}
                                                onChange={(event) => updateLifeWheelReading('cascadingArea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-sm font-semibold text-slate-800">5. ¿Qué área, si mejora, tendría efecto positivo en el resto?</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.reading.leverageArea}
                                                onChange={(event) => updateLifeWheelReading('leverageArea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <h4 className="font-bold text-slate-900">Priorización de foco</h4>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">Mi área crítica hoy es:</span>
                                            <select
                                                value={state.lifeWheel.prioritization.criticalArea}
                                                onChange={(event) => updateLifeWheelPrioritization('criticalArea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            >
                                                <option value="">Selecciona un área</option>
                                                {LIFE_WHEEL_DIMENSIONS.map((dimension) => (
                                                    <option key={`critical-${dimension.key}`} value={dimension.label}>
                                                        {dimension.label}
                                                    </option>
                                                ))}
                                                <option value="Otra combinación">Otra combinación</option>
                                            </select>
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">La razón es:</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.prioritization.criticalReason}
                                                onChange={(event) => updateLifeWheelPrioritization('criticalReason', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">Mi área palanca hoy es:</span>
                                            <select
                                                value={state.lifeWheel.prioritization.leverageArea}
                                                onChange={(event) => updateLifeWheelPrioritization('leverageArea', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            >
                                                <option value="">Selecciona un área</option>
                                                {LIFE_WHEEL_DIMENSIONS.map((dimension) => (
                                                    <option key={`lever-${dimension.key}`} value={dimension.label}>
                                                        {dimension.label}
                                                    </option>
                                                ))}
                                                <option value="Otra combinación">Otra combinación</option>
                                            </select>
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-sm font-semibold text-slate-800">La razón es:</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.prioritization.leverageReason}
                                                onChange={(event) => updateLifeWheelPrioritization('leverageReason', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                        <label className="space-y-1 md:col-span-2">
                                            <span className="text-sm font-semibold text-slate-800">Primer ajuste concreto (esta semana):</span>
                                            <input
                                                type="text"
                                                value={state.lifeWheel.prioritization.firstAdjustment}
                                                onChange={(event) => updateLifeWheelPrioritization('firstAdjustment', event.target.value)}
                                                disabled={isLocked}
                                                placeholder="Acción puntual que vas a ejecutar en los próximos 7 días"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            wheelReadingComplete && wheelPrioritizationComplete
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {wheelReadingComplete && wheelPrioritizationComplete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveLifeWheelBlock('Bloque 3 (Lectura y priorización)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 3
                                    </button>
                                </div>
                            </section>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(6) ? '' : 'hidden'}`}
                            data-print-page="Página 6 de 9"
                            data-print-title="Declaración de éxito personal"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 6</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Declaración de éxito personal</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Formular qué significa el éxito para ti, antes de que otros lo definan por ti.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Marco de la sección</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowSuccessHelp(true)}
                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            Ayuda
                                        </button>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                page6Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            Estado sección: {page6Complete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700">
                                    El éxito personal en este workbook es una declaración de criterios: qué cuenta para ti como
                                    vida y liderazgo bien vividos, y qué no estás dispuesto a confundir con éxito.
                                </p>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Qué es</p>
                                        <p className="text-sm text-slate-700">Un criterio de vida y liderazgo para decidir con coherencia.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Qué no es</p>
                                        <p className="text-sm text-slate-700">No es una meta puntual ni un texto redactado para impresionar.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Para qué sirve</p>
                                        <p className="text-sm text-slate-700">Para filtrar decisiones, oportunidades y presiones externas.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 1 — Exploración guiada del éxito personal</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    Responde con honestidad y desde tu realidad: no escribas lo que suena elevado, escribe lo que realmente valoras.
                                </p>
                                <div className="space-y-3">
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">1. Para mí, una vida exitosa incluye:</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.exploration.successfulLife}
                                            onChange={(event) => updateSuccessExploration('successfulLife', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">2. Lo que no quiero sacrificar para tener éxito es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.exploration.nonSacrifices}
                                            onChange={(event) => updateSuccessExploration('nonSacrifices', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">3. Una señal de que me estoy alejando de mi propio éxito sería:</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.exploration.driftSignal}
                                            onChange={(event) => updateSuccessExploration('driftSignal', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">4. Lo que quiero poder decir de mi vida y liderazgo en algunos años es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.exploration.legacyStatement}
                                            onChange={(event) => updateSuccessExploration('legacyStatement', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${successBlock1Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {successBlock1Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveSuccessBlock('Bloque 1 (Exploración guiada)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 1
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz Éxito auténtico vs éxito impuesto</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowSuccessExample2((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showSuccessExample2 ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[860px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Éxito auténtico (para mí)</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Éxito impuesto o heredado (de otros)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.successDefinition.matrix.map((row, index) => (
                                                <tr key={`success-matrix-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.authentic}
                                                            onChange={(event) => updateSuccessMatrixRow(index, 'authentic', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.imposed}
                                                            onChange={(event) => updateSuccessMatrixRow(index, 'imposed', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showSuccessExample2 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">Éxito auténtico:</span> Vivir con coherencia y sentido. <span className="font-semibold text-slate-900">| Éxito impuesto:</span> Tener una imagen impecable ante todos.</p>
                                        <p><span className="font-semibold text-slate-900">Éxito auténtico:</span> Construir impacto sostenible. <span className="font-semibold text-slate-900">| Éxito impuesto:</span> Demostrar siempre control absoluto.</p>
                                        <p><span className="font-semibold text-slate-900">Éxito auténtico:</span> Sostener relaciones valiosas. <span className="font-semibold text-slate-900">| Éxito impuesto:</span> Acumular logros para validación externa.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${successBlock2Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {successBlock2Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveSuccessBlock('Bloque 2 (Matriz Éxito auténtico vs impuesto)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 2
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 3 — Declaración de éxito personal en una frase</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowSuccessExample3((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showSuccessExample3 ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Usa esta fórmula como guía: <span className="font-semibold text-slate-900">“Para mí, el éxito es ______ sin sacrificar ______ y contribuyendo a ______.”</span>
                                </p>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Para mí, el éxito es</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.statement.is}
                                            onChange={(event) => updateSuccessStatement('is', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Sin sacrificar</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.statement.withoutSacrificing}
                                            onChange={(event) => updateSuccessStatement('withoutSacrificing', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Y contribuyendo a</span>
                                        <textarea
                                            rows={2}
                                            value={state.successDefinition.statement.contributingTo}
                                            onChange={(event) => updateSuccessStatement('contributingTo', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Vista previa</p>
                                    <p className="text-sm text-slate-800">
                                        Para mí, el éxito es {state.successDefinition.statement.is || '______'} sin sacrificar{' '}
                                        {state.successDefinition.statement.withoutSacrificing || '______'} y contribuyendo a{' '}
                                        {state.successDefinition.statement.contributingTo || '______'}.
                                    </p>
                                </div>
                                {showSuccessExample3 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900 mb-1">Ejemplo</p>
                                        <p>
                                            Para mí, el éxito es vivir y liderar con coherencia, sin sacrificar salud, integridad ni
                                            relaciones significativas, y contribuyendo al desarrollo de personas y equipos con más claridad y consciencia.
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${successBlock3Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {successBlock3Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveSuccessBlock('Bloque 3 (Declaración de éxito)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 3
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 4 — Chequeo de coherencia con valores</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    Lee tu declaración y valida si te representa, si puedes sostenerla bajo presión y si te ayuda a decidir.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[900px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Pregunta</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Sí</th>
                                                <th className="text-center px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">No</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Ajuste necesario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.successDefinition.coherenceChecks.map((row, index) => (
                                                <tr key={`success-coherence-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.question}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`success-coherence-answer-${index}`}
                                                            checked={row.answer === 'si'}
                                                            onChange={() => updateSuccessCoherenceCheck(index, 'answer', 'si')}
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`success-coherence-answer-${index}`}
                                                            checked={row.answer === 'no'}
                                                            onChange={() => updateSuccessCoherenceCheck(index, 'answer', 'no')}
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.adjustment}
                                                            onChange={(event) => updateSuccessCoherenceCheck(index, 'adjustment', event.target.value)}
                                                            disabled={isLocked}
                                                            placeholder="Qué ajustar para que esta declaración sea utilizable"
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${successBlock4Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {successBlock4Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveSuccessBlock('Bloque 4 (Chequeo de coherencia)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 4
                                    </button>
                                </div>
                            </section>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(7) ? '' : 'hidden'}`}
                            data-print-page="Página 7 de 9"
                            data-print-title="Alineación propósito–visión"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 7</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Alineación propósito–visión</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Verificar si la vida que estás construyendo se alinea con el propósito que dices tener.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Marco de la sección</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAlignmentHelp(true)}
                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            Ayuda
                                        </button>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                page7Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            Estado sección: {page7Complete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Esta sección contrasta lo que dices que te importa con la dirección que estás tomando y con las decisiones
                                    y hábitos que hoy sostienes.
                                </p>
                                <ul className="text-sm text-slate-700 space-y-1">
                                    <li>• Qué partes de tu visión sí nacen de tu propósito.</li>
                                    <li>• Qué partes requieren ajuste.</li>
                                    <li>• Qué contradicciones debes dejar de normalizar.</li>
                                </ul>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 1 — Matriz Propósito–Visión–Decisión</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAlignmentExample1((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showAlignmentExample1 ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Completa cada fila desde decisiones reales y marca el nivel de alineación: Sí, Parcial o No.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Elemento</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Tu formulación actual</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">¿Está alineado?</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Ajuste necesario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.purposeVisionAlignment.matrix.map((row, index) => (
                                                <tr key={`alignment-matrix-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.element}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.current}
                                                            onChange={(event) => updateAlignmentMatrixRow(index, 'current', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={row.alignment}
                                                            onChange={(event) => updateAlignmentMatrixRow(index, 'alignment', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        >
                                                            <option value="">Selecciona</option>
                                                            <option value="si">Sí</option>
                                                            <option value="parcial">Parcial</option>
                                                            <option value="no">No</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.adjustment}
                                                            onChange={(event) => updateAlignmentMatrixRow(index, 'adjustment', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showAlignmentExample1 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">Mi propósito:</span> Contribuir al desarrollo de líderes conscientes — <span className="font-semibold text-slate-900">Sí</span> — Mantener foco.</p>
                                        <p><span className="font-semibold text-slate-900">Mis prioridades actuales:</span> Entregar rápido y responder urgencias — <span className="font-semibold text-slate-900">Parcial</span> — Recuperar bloques de trabajo profundo.</p>
                                        <p><span className="font-semibold text-slate-900">Mis decisiones recientes:</span> Acepté proyectos sin conexión con el propósito — <span className="font-semibold text-slate-900">No</span> — Filtrar mejor.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alignmentBlock1Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {alignmentBlock1Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveAlignmentBlock('Bloque 1 (Matriz Propósito–Visión–Decisión)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 1
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 2 — Chequeo de coherencia estratégica</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Pregunta</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Sí / No / Parcial</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Observación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.purposeVisionAlignment.strategicChecks.map((row, index) => (
                                                <tr key={`alignment-check-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.question}</td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={row.answer}
                                                            onChange={(event) => updateAlignmentStrategicCheck(index, 'answer', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        >
                                                            <option value="">Selecciona</option>
                                                            <option value="si">Sí</option>
                                                            <option value="no">No</option>
                                                            <option value="parcial">Parcial</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.observation}
                                                            onChange={(event) => updateAlignmentStrategicCheck(index, 'observation', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alignmentBlock2Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {alignmentBlock2Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveAlignmentBlock('Bloque 2 (Chequeo de coherencia estratégica)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 2
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 3 — Mapa de tensiones y renuncias</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    Haz visibles las tensiones entre lo que quieres construir y lo que sigues sosteniendo aunque ya no alinee.
                                </p>
                                <div className="space-y-3">
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que mi propósito me pide fortalecer es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeVisionAlignment.tensions.purposeStrengthen}
                                            onChange={(event) => updateAlignmentTension('purposeStrengthen', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que mi visión me pide construir es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeVisionAlignment.tensions.visionBuild}
                                            onChange={(event) => updateAlignmentTension('visionBuild', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que todavía sigo haciendo y ya no alinea es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeVisionAlignment.tensions.misalignedActions}
                                            onChange={(event) => updateAlignmentTension('misalignedActions', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">La renuncia que necesito hacer para recuperar coherencia es:</span>
                                        <textarea
                                            rows={2}
                                            value={state.purposeVisionAlignment.tensions.requiredRenunciation}
                                            onChange={(event) => updateAlignmentTension('requiredRenunciation', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alignmentBlock3Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {alignmentBlock3Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveAlignmentBlock('Bloque 3 (Mapa de tensiones y renuncias)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 3
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 4 — Declaración de alineación</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <p className="text-sm text-slate-700">
                                    Redacta una frase breve que conecte explícitamente tu propósito con tu visión.
                                </p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Mi visión está alineada con mi propósito cuando</span>
                                        <textarea
                                            rows={3}
                                            value={state.purposeVisionAlignment.declaration.whenAligned}
                                            onChange={(event) => updateAlignmentDeclaration('whenAligned', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">Y se expresa en</span>
                                        <textarea
                                            rows={3}
                                            value={state.purposeVisionAlignment.declaration.expressedIn}
                                            onChange={(event) => updateAlignmentDeclaration('expressedIn', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-1">Vista previa</p>
                                    <p className="text-sm text-slate-800">
                                        Mi visión está alineada con mi propósito cuando {state.purposeVisionAlignment.declaration.whenAligned || '______'} y se expresa en{' '}
                                        {state.purposeVisionAlignment.declaration.expressedIn || '______'}.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alignmentBlock4Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {alignmentBlock4Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveAlignmentBlock('Bloque 4 (Declaración de alineación)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 4
                                    </button>
                                </div>
                            </section>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-7 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(8) ? '' : 'hidden'}`}
                            data-print-page="Página 8 de 9"
                            data-print-title="Diseño de visión a largo plazo"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 8</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Diseño de visión a largo plazo</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Diseñar una dirección estratégica de largo plazo con sentido, metas concretas y pasos ejecutables.
                                </p>
                            </header>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Marco de la sección</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowVisionHelp(true)}
                                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                                        >
                                            Ayuda
                                        </button>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                page8Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            Estado sección: {page8Complete ? 'Completado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700">
                                    Esta sección responde tres preguntas: qué quieres construir a largo plazo, cómo quieres que se vea
                                    esa vida/liderazgo y qué debes alinear desde ahora para acercarte a esa visión.
                                </p>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 1 — Escenario futuro aspiracional</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowVisionExample1((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showVisionExample1 ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">En 3–10 años, quiero que mi vida y liderazgo se vean así:</span>
                                        <textarea
                                            rows={2}
                                            value={state.longTermVisionDesign.scenario.futureLandscape}
                                            onChange={(event) => updateVisionScenario('futureLandscape', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">Lo que estaré construyendo será:</span>
                                        <textarea
                                            rows={2}
                                            value={state.longTermVisionDesign.scenario.futureBuild}
                                            onChange={(event) => updateVisionScenario('futureBuild', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">El impacto que quiero generar será:</span>
                                        <textarea
                                            rows={2}
                                            value={state.longTermVisionDesign.scenario.futureImpact}
                                            onChange={(event) => updateVisionScenario('futureImpact', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-semibold text-slate-800">La forma en que quiero vivir y liderar será:</span>
                                        <textarea
                                            rows={2}
                                            value={state.longTermVisionDesign.scenario.futureLeadershipStyle}
                                            onChange={(event) => updateVisionScenario('futureLeadershipStyle', event.target.value)}
                                            disabled={isLocked}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </label>
                                </div>
                                {showVisionExample1 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p>En 3–10 años, quiero liderar procesos de alto impacto con mayor escala y coherencia.</p>
                                        <p>Lo que estaré construyendo será una propuesta sólida que articule liderazgo, desarrollo y transformación.</p>
                                        <p>El impacto que quiero generar será formar personas y equipos más conscientes, claros y efectivos.</p>
                                        <p>La forma en que quiero vivir y liderar será con foco, integridad y sostenibilidad.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visionBlock1Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {visionBlock1Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveVisionBlock('Bloque 1 (Escenario futuro aspiracional)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 1
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz visión–metas–acciones</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowVisionExample2((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showVisionExample2 ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[860px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Nivel</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Tu formulación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.longTermVisionDesign.matrix.map((row, index) => (
                                                <tr key={`vision-matrix-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.level}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.formulation}
                                                            onChange={(event) => updateVisionMatrixRow(index, event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showVisionExample2 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">Visión a largo plazo:</span> Ser referente en desarrollo de liderazgo con enfoque integral.</p>
                                        <p><span className="font-semibold text-slate-900">Meta clave a 3 años:</span> Consolidar una oferta estructurada y escalable.</p>
                                        <p><span className="font-semibold text-slate-900">Meta clave a 12 meses:</span> Diseñar y validar la arquitectura completa de trabajo.</p>
                                        <p><span className="font-semibold text-slate-900">Acción prioritaria:</span> Desarrollar 3 workbooks estratégicos.</p>
                                        <p><span className="font-semibold text-slate-900">Primer paso:</span> Definir la estructura final del WB3.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visionBlock2Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {visionBlock2Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveVisionBlock('Bloque 2 (Matriz visión–metas–acciones)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 2
                                    </button>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">Paso 3 — Hitos de largo plazo</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowVisionExample3((prev) => !prev)}
                                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {showVisionExample3 ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[900px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Horizonte</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Hito esperado</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Evidencia de avance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.longTermVisionDesign.milestones.map((row, index) => (
                                                <tr key={`vision-milestone-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.horizon}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.expectedMilestone}
                                                            onChange={(event) => updateVisionMilestone(index, 'expectedMilestone', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.evidence}
                                                            onChange={(event) => updateVisionMilestone(index, 'evidence', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {showVisionExample3 && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 space-y-1">
                                        <p className="font-semibold text-slate-900">Ejemplo</p>
                                        <p><span className="font-semibold text-slate-900">12 meses:</span> Arquitectura metodológica validada — 3 workbooks terminados y aplicados.</p>
                                        <p><span className="font-semibold text-slate-900">24 meses:</span> Posicionamiento y propuesta consolidada — clientes/cohortes/resultados.</p>
                                        <p><span className="font-semibold text-slate-900">36 meses:</span> Escala e influencia — alianzas, productos, reputación.</p>
                                        <p><span className="font-semibold text-slate-900">5 años:</span> Referente reconocido — impacto sostenido y visible.</p>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visionBlock3Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {visionBlock3Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={saveVisionMilestonesBlock}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 3
                                    </button>
                                </div>

                                {!showVisionMilestonesTimeline && (
                                    <p className="text-xs text-slate-500">
                                        Guarda el bloque 3 para visualizar la línea de tiempo con tus hitos.
                                    </p>
                                )}

                                {showVisionMilestonesTimeline && (
                                    <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Línea de tiempo de hitos guardados</h4>
                                            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-blue-700">Visualización automática</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <div className="min-w-[860px] relative pt-6">
                                                <div className="absolute left-16 right-16 top-8 h-0.5 bg-blue-200" />
                                                <div className="grid grid-cols-4 gap-4">
                                                    {state.longTermVisionDesign.milestones.map((row, index) => (
                                                        <article key={`vision-timeline-${row.horizon}-${index}`} className="relative">
                                                            <div className="mb-4 flex items-center gap-2">
                                                                <span className="inline-flex h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0" />
                                                                <span className="text-xs uppercase tracking-[0.14em] font-semibold text-slate-700">{row.horizon}</span>
                                                            </div>
                                                            <div className="rounded-lg border border-blue-200 bg-white p-3 min-h-[170px] space-y-2">
                                                                <div>
                                                                    <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate-500">Hito esperado</p>
                                                                    <p className="text-sm text-slate-800">
                                                                        {row.expectedMilestone.trim().length > 0 ? row.expectedMilestone : 'Completar'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate-500">Evidencia</p>
                                                                    <p className="text-sm text-slate-700">
                                                                        {row.evidence.trim().length > 0 ? row.evidence : 'Completar'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Paso 4 — Chequeo de viabilidad y coherencia</h3>
                                    <p className="mt-2 w-full basis-full text-sm text-slate-700 leading-relaxed">Instrucciones del paso: completa este bloque con hechos observables, evita generalidades y registra evidencia concreta. Si no tienes evidencia, escribe "No tengo evidencia reciente".</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-[980px] w-full border border-slate-300 rounded-lg overflow-hidden bg-white">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Pregunta</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Sí / No / Parcial</th>
                                                <th className="text-left px-3 py-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">Ajuste necesario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.longTermVisionDesign.viabilityChecks.map((row, index) => (
                                                <tr key={`vision-check-${index}`} className="border-t border-slate-200">
                                                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.question}</td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={row.answer}
                                                            onChange={(event) => updateVisionCheck(index, 'answer', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        >
                                                            <option value="">Selecciona</option>
                                                            <option value="si">Sí</option>
                                                            <option value="no">No</option>
                                                            <option value="parcial">Parcial</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.adjustment}
                                                            onChange={(event) => updateVisionCheck(index, 'adjustment', event.target.value)}
                                                            disabled={isLocked}
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visionBlock4Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {visionBlock4Complete ? 'Completado' : 'Pendiente'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveVisionBlock('Bloque 4 (Chequeo de viabilidad y coherencia)')}
                                        disabled={isLocked}
                                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                    >
                                        Guardar bloque 4
                                    </button>
                                </div>
                            </section>
                        </article>

                        <article
                            className={`wb3-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)] ${isPageVisible(9) ? '' : 'hidden'}`}
                            data-print-page="Página 9 de 9"
                            data-print-title="Evaluación"
                            data-print-meta={printMetaLabel}
                        >
                            <header className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-600">Página 9</p>
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">Evaluación</h2>
                                <p className="text-slate-700 md:text-lg">
                                    Objetivo: permitir que Adviser y líder evalúen con evidencia, definan decisiones por criterio y cierren con síntesis de acuerdos.
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
                                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">A) Modo Adviser - Rúbricas</h3>
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
                                                'Evalúa cada criterio con base en evidencia observable (idealmente de los últimos 40 días).',
                                                'Marca un solo nivel por criterio (N1, N2, N3 o N4).',
                                                'Registra comentario u observación concreta por criterio (hechos, conversación o conducta observada).',
                                                'Define decisión por criterio: Consolidado, En desarrollo o Prioritario.',
                                                'Cierra el WB con observaciones generales y una decisión global de seguimiento.'
                                            ].map((instruction) => (
                                                <li key={`wb3-mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                                <tr key={`wb3-mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
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
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">Formato de evaluación del Adviser (marcar y comentar)</h3>
                                            <p className="text-xs text-slate-500">Criterios completados: {mentorCompletedRows}/{state.evaluation.mentorRows.length}</p>
                                        </div>

                                        {state.evaluation.mentorRows.map((row, index) => {
                                            const isEditing = mentorEvaluationEditModes[index]
                                            const rowDisabled = isLocked || !isEditing
                                            const isComplete = isMentorEvaluationRowComplete(row)

                                            return (
                                                <article key={`wb3-mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                            key={`wb3-mentor-level-${index}-${level}`}
                                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                name={`wb3-mentor-level-${index}`}
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
                                                                    className="w-full min-h-[84px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                                    placeholder='Hechos observables (si falta evidencia, escribe "Completar").'
                                                                />
                                                            </label>

                                                            <fieldset className="space-y-2">
                                                                <legend className="text-xs uppercase tracking-[0.12em] text-slate-500">Decisión del Adviser</legend>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {MENTOR_DECISION_OPTIONS.map((decision) => (
                                                                        <label
                                                                            key={`wb3-mentor-decision-${index}-${decision}`}
                                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                name={`wb3-mentor-decision-${index}`}
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

                                    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                        <h3 className="text-base md:text-lg font-bold text-slate-900">Cierre del Adviser</h3>
                                        <label className="block space-y-1">
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Observaciones generales del Adviser</span>
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
                                                        key={`wb3-mentor-global-${decision}`}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="wb3-mentor-global-decision"
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
                                                Guardar cierre Adviser
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
                                                'Define una acción o compromiso de 40 días para cada respuesta clave.',
                                                'Usa este bloque como insumo para acordar el plan de desarrollo con el Adviser.'
                                            ].map((instruction) => (
                                                <li key={`wb3-leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                <article key={`wb3-leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Acción o compromiso (40 días)</span>
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
                                                            <p><span className="font-semibold text-slate-900">Acción 40 días:</span> {row.action || 'Pendiente'}</p>
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
                                            <h3 className="text-base md:text-lg font-bold text-slate-900">C) Síntesis de acuerdos Adviser-Líder</h3>
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
                                            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Síntesis de acuerdos Adviser-Líder</span>
                                            <textarea
                                                value={state.evaluation.agreementsSynthesis}
                                                onChange={(event) => setEvaluationSynthesis(event.target.value)}
                                                disabled={isLocked}
                                                className="w-full min-h-[160px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="Registra acuerdos concretos entre Adviser y líder."
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
                                            {evaluationSectionComplete ? 'WB3 Evaluación completada' : 'WB3 Evaluación en progreso'}
                                        </h3>
                                        <p className={`mt-2 text-sm ${evaluationSectionComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {evaluationSectionComplete
                                                ? 'Adviser y líder cerraron rúbrica, autoevaluación y síntesis.'
                                                : 'Completa los bloques pendientes para cerrar la evaluación.'}
                                        </p>
                                    </article>

                                    <article className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
                                        <h4 className="text-base md:text-lg font-bold text-slate-900">Resumen de evaluación</h4>
                                        <div className="space-y-2">
                                            {state.evaluation.mentorRows.map((row, index) => (
                                                <div
                                                    key={`wb3-evaluation-summary-criterion-${index}`}
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
                                        : 'Evaluación pendiente (Adviser + líder + síntesis)'}
                                </span>
                                <button
                                    type="button"
                                    onClick={saveEvaluationModule}
                                    disabled={isLocked}
                                    className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
                                >
                                    Guardar página 9
                                </button>
                            </div>
                        </article>

                        {showPurposeHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Definición de propósito personal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPurposeHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p><span className="font-semibold text-slate-900">Propósito</span> no es cargo ni meta de corto plazo.</p>
                                        <p><span className="font-semibold text-slate-900">Propósito</span> sí es una contribución concreta + destinatario + medio para generar impacto.</p>
                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                            <p className="font-semibold text-slate-900 mb-1">Ejemplo útil</p>
                                            <p>“Mi propósito es contribuir al desarrollo de líderes más conscientes en equipos y organizaciones mediante herramientas, conversaciones y procesos que generen claridad y transformación.”</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVmpHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Vocación, misión y pasión</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVmpHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p><span className="font-semibold text-slate-900">Vocación</span> = llamado profundo.</p>
                                        <p><span className="font-semibold text-slate-900">Misión</span> = contribución concreta que asumes.</p>
                                        <p><span className="font-semibold text-slate-900">Pasión</span> = energía sostenida que te impulsa.</p>
                                        <p>La meta es identificar tu zona de convergencia: llamado + servicio + energía.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showWheelHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Rueda de la vida</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowWheelHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• No puntúes desde el ideal: puntúa desde tu realidad actual.</p>
                                        <p>• No busques equilibrio perfecto ni 10 en todo.</p>
                                        <p>• Usa la rueda para detectar tensiones reales y elegir un ajuste concreto.</p>
                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                            <p className="font-semibold text-slate-900 mb-1">Criterio práctico</p>
                                            <p>
                                                Si una área está baja y además impacta otras, conviene tratarla como área crítica.
                                                Si una área mejora varias al mismo tiempo, úsala como área palanca.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showSuccessHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Declaración de éxito personal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSuccessHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Éxito personal no es presión externa ni comparación.</p>
                                        <p>• Éxito personal sí es un criterio de vida y liderazgo para decidir.</p>
                                        <p>• No redactes para impresionar; redacta para tomar decisiones coherentes.</p>
                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                            <p className="font-semibold text-slate-900 mb-1">Fórmula guía</p>
                                            <p>“Para mí, el éxito es ______ sin sacrificar ______ y contribuyendo a ______.”</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showAlignmentHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Alineación propósito–visión</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAlignmentHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Visión no es lista de deseos; es dirección coherente con tu propósito.</p>
                                        <p>• Alineación significa coherencia entre propósito, decisiones y hábitos actuales.</p>
                                        <p>• Si aparece tensión, no es un error: es un hallazgo útil para ajustar.</p>
                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                            <p className="font-semibold text-slate-900 mb-1">Criterio práctico</p>
                                            <p>Revisa si tus decisiones recientes te acercan o te alejan de la visión que declaras.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVisionHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Diseño de visión a largo plazo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVisionHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Visión = dirección aspiracional con sentido.</p>
                                        <p>• Meta = resultado concreto en un horizonte definido.</p>
                                        <p>• Acción = paso ejecutable que puedes sostener desde hoy.</p>
                                        <p>• No redactes una fantasía; redacta una dirección que puedas sostener con decisiones y hábitos.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb3-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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
                                        {PAGES[currentPageIndex]?.shortLabel ?? 'Página'}
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

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 14mm;
                    }
                    .wb3-toolbar,
                    .wb3-sidebar,
                    .wb3-page-nav {
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
                    .wb3-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb3-print-page:not(.wb3-cover-page)::before {
                        content: "WB3 · Propósito y valores no negociables · " attr(data-print-title);
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
                    .wb3-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb3-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb3-cover-page::before {
                        content: none !important;
                    }
                    .wb3-cover-hero {
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
