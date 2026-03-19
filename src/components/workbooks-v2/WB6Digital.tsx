'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Lock, Printer } from 'lucide-react'
import { WORKBOOK_V2_EDITORIAL } from '@/lib/workbooks-v2-editorial'

type WorkbookPageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type YesNoAnswer = '' | 'yes' | 'no'
type PresenceImpact = '' | 'Suma' | 'Resta'
type LeakageLevel = '' | 'Verde' | 'Amarillo' | 'Rojo'
type VisibilityLevel = '' | 'Bajo' | 'Medio' | 'Alto'
type MentorLevel = '' | 'N1' | 'N2' | 'N3' | 'N4'
type MentorDecision = '' | 'Consolidado' | 'En desarrollo' | 'Prioritario'
type EvaluationStageKey = 'mentor' | 'leader' | 'synthesis' | 'final'
type ObjectionType =
    | ''
    | 'Contenido'
    | 'Proceso'
    | 'Confianza'
    | 'Identidad o estatus'
    | 'Confianza / estatus'
    | 'Otro'

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

type WB6State = {
    identification: {
        leaderName: string
        role: string
        cohort: string
        startDate: string
    }
    bodyLanguageSection: {
        baselineScan: Array<{
            dimension: string
            observation: string
            effect: string
        }>
        presenceMatrix: Array<{
            dimension: string
            observableBehavior: string
            presenceImpact: PresenceImpact
            concreteAdjustment: string
        }>
        leakageTraffic: Array<{
            signal: string
            level: LeakageLevel
            whenAppears: string
            generatedReading: string
        }>
        entryProtocol: {
            idealEntry: string
            positioning: string
            spaceCriteria: string
            first20Seconds: string
            signalToInstall: string
        }
        calmAuthorityPattern: {
            centeredBody: string
            listeningBody: string
            objectionBody: string
            returnToCenter: string
        }
        coherenceTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    objectionHandlingSection: {
        cartography: Array<{
            objection: string
            objectionType: ObjectionType
            whatActivatedMe: string
            response: string
            responseEffect: string
            betterResponse: string
        }>
        diagnosis: {
            literal: string
            emotionalIntensity: string
            whatItProtects: string
            firstLayerToRespond: string
        }
        protocol: {
            receive: string
            clarificationQuestion: string
            recognition: string
            focalResponse: string
            advanceVerification: string
        }
        bridgeBank: Array<{
            scenario: string
            bridgeResponse: string
        }>
        reframeLab: Array<{
            originalObjection: string
            usefulReframe: string
            proposalImprovement: string
        }>
        executiveTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    voiceToneSection: {
        baseline: Array<{
            dimension: string
            observation: string
            effect: string
        }>
        calibrationMatrix: Array<{
            dimension: string
            observablePattern: string
            impact: PresenceImpact
            concreteAdjustment: string
        }>
        messagePartiture: {
            baseMessage: string
            anchorWords: string
            functionalPauses: string
            firmClosures: string
            energyPoints: string
            vocalRisks: string
        }
        pressureProtocol: {
            earlySignal: string
            triggerContext: string
            regulationAction: string
            reanchoringPhrase: string
        }
        modulationLadder: Array<{
            context: string
            tone: string
            speed: string
            volume: string
            pauses: string
            emphasis: string
        }>
        executiveImpactTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    pressureCommunicationSection: {
        pressureSignatureMap: {
            trigger: string
            earlyInternalSignal: string
            visibleCommunicationShift: string
            automaticPattern: string
            effectOnOthers: string
            episodeCost: string
        }
        communicationDisorderMatrix: Array<{
            dimension: string
            underPressure: string
            generatedReading: string
            regulatoryAdjustment: string
        }>
        responseProtocol: {
            functionalPause: string
            internalOrderPhrase: string
            strategicReframe: string
            interventionFormula: string
        }
        shortMessageTemplate: {
            fact: string
            priority: string
            direction: string
            containment: string
        }
        pressureSimulator: {
            probableCriticalScenario: string
            entrySignal: string
            regulatedResponse: string
            recoveryAction: string
        }
        executivePressureTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    highLevelMeetingsSection: {
        roomReadingMap: {
            realDecisionMaker: string
            informalInfluencer: string
            blockerOrCooler: string
            mainTension: string
            dominantLanguage: string
            highestValueContributionPoint: string
        }
        positioningMatrix: {
            primaryRole: string
            visibilityLevel: VisibilityLevel
            expectedContributionType: string
            overtalkingRisk: string
            undertalkingRisk: string
            desiredPresenceSignal: string
        }
        interventionArchitecture: {
            briefOpening: string
            centralThesis: string
            criterionOrEvidence: string
            executiveImplication: string
            shortClosing: string
        }
        timingMap: Array<{
            momentOrSignal: string
            plannedAction: string
        }>
        executiveFootprintAudit: {
            entryQuality: string
            spaceSustainment: string
            realContribution: string
            likelyPerception: string
            nextAdjustment: string
        }
        highLevelMeetingTest: Array<{
            question: string
            verdict: YesNoAnswer
            adjustment: string
        }>
    }
    coherenceAlignmentSection: {
        congruenceMap: Array<{
            dimension: string
            intendedMessage: string
            perceivedSignal: string
        }>
        perceptiveContradictions: Array<{
            verbalStatement: string
            contradictorySignal: string
            likelyReading: string
            priorityAdjustment: string
        }>
        phraseSignalLab: Array<{
            keyPhrase: string
            installedIdea: string
            neededTone: string
            supportingPostureOrGesture: string
            whatToAvoid: string
        }>
        expressiveTrafficLight: Array<{
            signal: string
            level: LeakageLevel
            whenAppears: string
            requiredAdjustment: string
        }>
        incoherenceRepairProtocol: {
            alertSignal: string
            bodyCorrection: string
            vocalCorrection: string
            reorderingPhrase: string
            ideaToReinstall: string
        }
        coherenceTest: Array<{
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
    { id: 3, label: '3. Lenguaje corporal ejecutivo', shortLabel: 'Lenguaje corporal' },
    { id: 5, label: '4. Tono y ritmo de voz', shortLabel: 'Voz ejecutiva' },
    { id: 6, label: '5. Comunicación bajo presión', shortLabel: 'Bajo presión' },
    { id: 7, label: '6. Presencia en reuniones de alto nivel', shortLabel: 'Reuniones alto nivel' },
    { id: 8, label: '7. Coherencia verbal y no verbal', shortLabel: 'Coherencia verbal-no verbal' },
    { id: 4, label: '8. Manejo de objeciones', shortLabel: 'Objeciones' },
    { id: 9, label: '9. Evaluación', shortLabel: 'Evaluación' }
]

const STORAGE_KEY = 'workbooks-v2-wb6-state'
const PAGE_STORAGE_KEY = 'workbooks-v2-wb6-active-page'
const VISITED_STORAGE_KEY = 'workbooks-v2-wb6-visited'
const INTRO_SEEN_KEY = 'workbooks-v2-wb6-presentation-seen'

const BASELINE_DIMENSIONS = [
    'Base / apoyo',
    'Columna / hombros',
    'Mirada',
    'Manos / gestos',
    'Rostro / mandíbula',
    'Movimiento / quietud'
] as const

const PRESENCE_DIMENSIONS = [
    'Apertura',
    'Estabilidad',
    'Dirección',
    'Economía gestual',
    'Disponibilidad relacional'
] as const

const COHERENCE_QUESTIONS = [
    '¿Mi cuerpo transmitió lo mismo que mis palabras?',
    '¿Mi postura proyectó estabilidad?',
    '¿Mi mirada sostuvo presencia?',
    '¿Mis manos acompañaron sin dispersar?',
    '¿Mi cuerpo se mantuvo disponible al escuchar?',
    '¿Mi presencia corporal aumentó confianza?'
] as const

const EXAMPLE_BASELINE_SCAN = [
    {
        dimension: 'Base / apoyo',
        observation: 'Cambio mucho el peso entre pies.',
        effect: 'Inquietud o falta de aplomo.'
    },
    {
        dimension: 'Columna / hombros',
        observation: 'Me inclino hacia adelante cuando explico.',
        effect: 'Exceso de urgencia o presión.'
    },
    {
        dimension: 'Mirada',
        observation: 'Bajo la mirada cuando me cuestionan.',
        effect: 'Menor seguridad percibida.'
    },
    {
        dimension: 'Manos / gestos',
        observation: 'Muevo demasiado las manos.',
        effect: 'Dispersión del foco.'
    },
    {
        dimension: 'Rostro / mandíbula',
        observation: 'Tenso la mandíbula bajo presión.',
        effect: 'Rigidez o defensividad.'
    },
    {
        dimension: 'Movimiento / quietud',
        observation: 'Camino sin necesidad mientras hablo.',
        effect: 'Pérdida de centro y foco.'
    }
]

const EXAMPLE_PRESENCE_MATRIX = [
    {
        dimension: 'Apertura',
        observableBehavior: 'Cruzo brazos al escuchar objeciones.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Mantener brazos descruzados y manos visibles.'
    },
    {
        dimension: 'Estabilidad',
        observableBehavior: 'Balanceo el cuerpo al hablar.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Anclar ambos pies y reducir desplazamiento.'
    },
    {
        dimension: 'Dirección',
        observableBehavior: 'Mi cuerpo apunta a la pantalla, no a la audiencia.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Reorientar torso hacia interlocutor principal.'
    },
    {
        dimension: 'Economía gestual',
        observableBehavior: 'Gesticulo demasiado en ideas simples.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Reservar gestos amplios para ideas clave.'
    },
    {
        dimension: 'Disponibilidad relacional',
        observableBehavior: 'Asiento poco y casi no miro al otro al escuchar.',
        presenceImpact: 'Resta',
        concreteAdjustment: 'Aumentar mirada funcional y microseñales de escucha.'
    }
] as const

const EXAMPLE_LEAKAGE_TRAFFIC = [
    {
        signal: 'Mantengo pies firmes y hombros abiertos.',
        level: 'Verde',
        whenAppears: 'Al iniciar reunión.',
        generatedReading: 'Solidez y presencia.'
    },
    {
        signal: 'Toco mi reloj repetidamente.',
        level: 'Amarillo',
        whenAppears: 'Cuando se alarga una objeción.',
        generatedReading: 'Ansiedad o apuro.'
    },
    {
        signal: 'Bajo la mirada y cierro mandíbula.',
        level: 'Rojo',
        whenAppears: 'Cuando me contradicen en público.',
        generatedReading: 'Defensividad y tensión.'
    }
] as const

const EXAMPLE_ENTRY_PROTOCOL = {
    idealEntry: 'Entrar con paso estable, respiración baja y sin prisa visible.',
    positioning: 'Sentarme con ambos pies apoyados, torso orientado a la mesa y pantalla alineada.',
    spaceCriteria: 'Presencia firme, sin encogerme ni invadir.',
    first20Seconds: 'Manos visibles, mirada a la audiencia y celular fuera del campo de acción.',
    signalToInstall: 'Calma con autoridad.'
}

const EXAMPLE_AUTHORITY_PATTERN = {
    centeredBody: 'Pies firmes, hombros abiertos, torso estable y mirada directa.',
    listeningBody: 'Leve inclinación receptiva, rostro disponible, manos quietas.',
    objectionBody: 'No adelantarme, no cerrar brazos, sostener mirada y respirar antes de responder.',
    returnToCenter: 'Exhalo, suelto mandíbula, reanclo pies y bajo velocidad de movimiento.'
}

const OBJECTION_TYPES: ObjectionType[] = [
    'Contenido',
    'Proceso',
    'Confianza',
    'Identidad o estatus',
    'Confianza / estatus',
    'Otro'
]

const BRIDGE_SCENARIOS = [
    'Objeción agresiva',
    'Objeción confusa',
    'Objeción legítima pero mal formulada',
    'Objeción política o de estatus',
    'Objeción basada en desconfianza'
] as const

const OBJECTION_TEST_QUESTIONS = [
    '¿Escuché antes de responder?',
    '¿Diagnostiqué bien el tipo de objeción?',
    '¿Respondí a la capa correcta?',
    '¿Transmití seguridad tranquila?',
    '¿Ordené mejor la objeción?',
    '¿Verifiqué si hubo avance real?'
] as const

const EXAMPLE_OBJECTION_CARTOGRAPHY = [
    {
        objection: '“Eso no es viable en este trimestre”.',
        objectionType: 'Contenido',
        whatActivatedMe: 'Urgencia por defender mi idea.',
        response: 'Expliqué demasiado rápido.',
        responseEffect: 'Saturé y perdí foco.',
        betterResponse: 'Aclarar criterio de viabilidad antes de argumentar.'
    },
    {
        objection: '“No veo por qué cambiar lo que ya funciona”.',
        objectionType: 'Proceso',
        whatActivatedMe: 'Frustración.',
        response: 'Reaccioné comparando con el pasado.',
        responseEffect: 'Más resistencia.',
        betterResponse: 'Reconocer primero la lógica del otro y luego mostrar el nuevo riesgo.'
    },
    {
        objection: '“No estoy seguro de que tú debas liderar esto”.',
        objectionType: 'Confianza / estatus',
        whatActivatedMe: 'Defensividad.',
        response: 'Justifiqué mi trayectoria.',
        responseEffect: 'Soné inseguro.',
        betterResponse: 'Preguntar qué condición de confianza faltaba y responder con evidencia puntual.'
    }
] as const

const EXAMPLE_OBJECTION_DIAGNOSIS = {
    literal: '“No creo que este sea el momento para mover prioridades”.',
    emotionalIntensity: 'Tensión y molestia contenida.',
    whatItProtects: 'Control del plan y credibilidad frente al equipo.',
    firstLayerToRespond: 'La preocupación de control, no solo el argumento de timing.'
}

const EXAMPLE_OBJECTION_PROTOCOL = {
    receive: 'Haré una pausa, mantendré mirada y no entraré a justificarme de inmediato.',
    clarificationQuestion: '“¿Cuál es para ti el principal riesgo de hacerlo ahora?”.',
    recognition: '“Entiendo que tu preocupación principal es no abrir más dispersión.”',
    focalResponse: '“Justamente por eso propongo reducir focos y no ampliarlos.”',
    advanceVerification: '“¿Con eso responde tu objeción principal o hay otra condición que debamos mirar?”.'
}

const EXAMPLE_BRIDGE_BANK = [
    { scenario: 'Objeción agresiva', bridgeResponse: '“Voy a tomar tu punto y responderlo con precisión.”' },
    { scenario: 'Objeción confusa', bridgeResponse: '“Ayúdame a precisar qué parte te preocupa más.”' },
    {
        scenario: 'Objeción legítima pero mal formulada',
        bridgeResponse: '“Hay una preocupación válida ahí; déjame ordenarla para responder mejor.”'
    },
    {
        scenario: 'Objeción política o de estatus',
        bridgeResponse: '“Entiendo que aquí también hay una preocupación por cómo se verá esta decisión.”'
    },
    {
        scenario: 'Objeción basada en desconfianza',
        bridgeResponse: '“Quiero responder eso con hechos, no solo con opinión.”'
    }
] as const

const EXAMPLE_REFRAME_LAB = [
    {
        originalObjection: '“Eso no está suficientemente claro”.',
        usefulReframe: 'Necesito explicitar mejor el criterio central.',
        proposalImprovement: 'Mejora claridad.'
    },
    {
        originalObjection: '“No sé si este es el momento”.',
        usefulReframe: 'Debo mostrar mejor el costo de no actuar ahora.',
        proposalImprovement: 'Mejora sentido de oportunidad.'
    },
    {
        originalObjection: '“No veo quién respondería por esto”.',
        usefulReframe: 'Debo hacer visible la trazabilidad y responsables.',
        proposalImprovement: 'Mejora confianza operativa.'
    }
] as const

const VOICE_BASELINE_DIMENSIONS = [
    'Tono predominante',
    'Velocidad',
    'Volumen',
    'Articulación',
    'Pausas',
    'Énfasis',
    'Cierre de frase'
] as const

const VOICE_CALIBRATION_DIMENSIONS = [
    'Estabilidad tonal',
    'Velocidad de procesamiento',
    'Uso del silencio',
    'Claridad articulatoria',
    'Jerarquía sonora',
    'Sostén de cierre'
] as const

const VOICE_CONTEXTS = [
    'Uno a uno',
    'Alto nivel',
    'Videollamada',
    'Conversación difícil',
    'Respuesta a objeción'
] as const

const VOICE_TONE_OPTIONS = [
    'Cercano y estable',
    'Grave y limpio',
    'Firme no reactivo',
    'Más proyectado',
    'Bajo y estable',
    'Neutro'
] as const

const VOICE_SPEED_OPTIONS = ['Lenta', 'Media-baja', 'Media', 'Media-alta', 'Alta'] as const
const VOICE_VOLUME_OPTIONS = ['Bajo', 'Medio-bajo', 'Medio', 'Medio-alto', 'Alto'] as const
const VOICE_PAUSE_OPTIONS = ['Bajas', 'Moderadas', 'Claras', 'Altas', 'Estratégicas'] as const
const VOICE_EMPHASIS_OPTIONS = ['Bajo', 'Medio', 'Medio-alto', 'Alto en ideas clave'] as const

const VOICE_TEST_QUESTIONS = [
    '¿Mi voz proyectó claridad y no apuro?',
    '¿El ritmo facilitó comprensión?',
    '¿Usé pausas funcionales?',
    '¿El tono sostuvo seguridad sin rigidez?',
    '¿Las ideas clave tuvieron énfasis suficiente?',
    '¿Mi voz aumentó credibilidad?'
] as const

const EXAMPLE_VOICE_BASELINE = [
    {
        dimension: 'Tono predominante',
        observation: 'Mi voz sube cuando me cuestionan.',
        effect: 'Tensión o inseguridad.'
    },
    {
        dimension: 'Velocidad',
        observation: 'Acelero cuando explico ideas complejas.',
        effect: 'Saturación y pérdida de claridad.'
    },
    {
        dimension: 'Volumen',
        observation: 'Bajo el volumen al final de frases importantes.',
        effect: 'Menor autoridad percibida.'
    },
    {
        dimension: 'Articulación',
        observation: 'Me como cierres de palabras.',
        effect: 'Menor precisión.'
    },
    {
        dimension: 'Pausas',
        observation: 'Hablo seguido casi sin silencios.',
        effect: 'Sensación de apuro.'
    },
    {
        dimension: 'Énfasis',
        observation: 'Todo suena igual.',
        effect: 'Poca jerarquía de ideas.'
    },
    {
        dimension: 'Cierre de frase',
        observation: 'Termino en tono ascendente.',
        effect: 'Mensaje menos firme.'
    }
] as const

const EXAMPLE_VOICE_CALIBRATION = [
    {
        dimension: 'Estabilidad tonal',
        observablePattern: 'Mi tono sube al explicar cifras.',
        impact: 'Resta',
        concreteAdjustment: 'Mantener tono basal y bajar medio punto al cerrar idea.'
    },
    {
        dimension: 'Velocidad de procesamiento',
        observablePattern: 'Acelero cuando quiero sonar convincente.',
        impact: 'Resta',
        concreteAdjustment: 'Reducir velocidad en frases decisivas.'
    },
    {
        dimension: 'Uso del silencio',
        observablePattern: 'Casi no hago pausas.',
        impact: 'Resta',
        concreteAdjustment: 'Insertar pausas breves antes y después de ideas clave.'
    },
    {
        dimension: 'Claridad articulatoria',
        observablePattern: 'Recorto palabras al final.',
        impact: 'Resta',
        concreteAdjustment: 'Marcar consonantes finales y abrir vocales.'
    },
    {
        dimension: 'Jerarquía sonora',
        observablePattern: 'Todo suena plano.',
        impact: 'Resta',
        concreteAdjustment: 'Dar más énfasis a 3 palabras clave.'
    },
    {
        dimension: 'Sostén de cierre',
        observablePattern: 'Termino frases hacia arriba.',
        impact: 'Resta',
        concreteAdjustment: 'Cerrar con caída de tono y respiración completa.'
    }
] as const

const EXAMPLE_VOICE_PARTITURE = {
    baseMessage: 'Necesitamos reenfocar el trimestre en tres prioridades para proteger calidad, tiempos y capacidad de respuesta.',
    anchorWords: 'reenfocar, tres prioridades, calidad, tiempos, capacidad de respuesta',
    functionalPauses: 'Después de “trimestre”, después de “tres prioridades”.',
    firmClosures: '“tres prioridades”, “capacidad de respuesta”.',
    energyPoints: '“proteger calidad”.',
    vocalRisks: 'Acelerar al inicio y subir el tono en la segunda mitad.'
}

const EXAMPLE_VOICE_PRESSURE_PROTOCOL = {
    earlySignal: 'Subo el tono y acelero.',
    triggerContext: 'Cuando me interrumpen o me cuestionan en público.',
    regulationAction: 'Exhalar, hacer una pausa de un segundo y reiniciar con menor velocidad.',
    reanchoringPhrase: '“Voy a decirlo en una frase clara.”'
}

const EXAMPLE_VOICE_LADDER = [
    { context: 'Uno a uno', tone: 'Cercano y estable', speed: 'Media', volume: 'Medio', pauses: 'Moderadas', emphasis: 'Medio' },
    {
        context: 'Alto nivel',
        tone: 'Grave y limpio',
        speed: 'Media-baja',
        volume: 'Medio-alto',
        pauses: 'Claras',
        emphasis: 'Alto en ideas clave'
    },
    {
        context: 'Videollamada',
        tone: 'Más proyectado',
        speed: 'Media',
        volume: 'Medio-alto',
        pauses: 'Claras',
        emphasis: 'Medio-alto'
    },
    {
        context: 'Conversación difícil',
        tone: 'Bajo y estable',
        speed: 'Lenta',
        volume: 'Medio',
        pauses: 'Altas',
        emphasis: 'Bajo'
    },
    {
        context: 'Respuesta a objeción',
        tone: 'Firme no reactivo',
        speed: 'Media-baja',
        volume: 'Medio',
        pauses: 'Estratégicas',
        emphasis: 'Alto en ideas clave'
    }
] as const

const PRESSURE_DISORDER_DIMENSIONS = [
    'Síntesis',
    'Claridad',
    'Secuencia',
    'Tono',
    'Escucha',
    'Capacidad de decisión'
] as const

const PRESSURE_TEST_QUESTIONS = [
    '¿Mantuve claridad bajo presión?',
    '¿Transmití seguridad tranquila?',
    '¿Respondí en lugar de reaccionar?',
    '¿Escuché antes de contraargumentar?',
    '¿Ordené el contexto para otros?',
    '¿Recuperé centro después del episodio?'
] as const

const EXAMPLE_PRESSURE_SIGNATURE_MAP = {
    trigger: 'Me cuestionaron el enfoque frente al comité.',
    earlyInternalSignal: 'Pecho apretado y aceleración mental.',
    visibleCommunicationShift: 'Subí el tono y hablé más rápido.',
    automaticPattern: 'Empecé a justificar demasiado.',
    effectOnOthers: 'Más tensión y menos atención a la idea central.',
    episodeCost: 'Perdí síntesis y proyecté defensividad.'
}

const EXAMPLE_PRESSURE_DISORDER_MATRIX = [
    {
        dimension: 'Síntesis',
        underPressure: 'Doy demasiado contexto.',
        generatedReading: 'Falta de foco.',
        regulatoryAdjustment: 'Ir primero a la idea central.'
    },
    {
        dimension: 'Claridad',
        underPressure: 'Uso frases vagas.',
        generatedReading: 'Inseguridad o confusión.',
        regulatoryAdjustment: 'Nombrar problema, riesgo y acción.'
    },
    {
        dimension: 'Secuencia',
        underPressure: 'Mezclo hechos con reacción.',
        generatedReading: 'Desorden.',
        regulatoryAdjustment: 'Separar hecho, impacto y decisión.'
    },
    {
        dimension: 'Tono',
        underPressure: 'Subo intensidad.',
        generatedReading: 'Reactividad.',
        regulatoryAdjustment: 'Bajar volumen y velocidad.'
    },
    {
        dimension: 'Escucha',
        underPressure: 'Interrumpo o respondo antes.',
        generatedReading: 'Cierre frente al otro.',
        regulatoryAdjustment: 'Pausar y devolver una pregunta.'
    },
    {
        dimension: 'Capacidad de decisión',
        underPressure: 'Dudo o sobrerreacciono.',
        generatedReading: 'Falta de criterio.',
        regulatoryAdjustment: 'Definir un siguiente paso mínimo.'
    }
] as const

const EXAMPLE_PRESSURE_PROTOCOL = {
    functionalPause: 'Exhalar, bajar hombros y esperar un segundo antes de hablar.',
    internalOrderPhrase: '“Esto es presión, no amenaza total.”',
    strategicReframe: 'Responder para ordenar, no para defenderme.',
    interventionFormula: '“Voy a responder en tres puntos: qué pasa, qué implica y qué propongo.”'
}

const EXAMPLE_PRESSURE_MESSAGE_TEMPLATE = {
    fact: 'Tenemos una desviación relevante en el entregable.',
    priority: 'Lo más importante ahora es proteger calidad y no amplificar el error.',
    direction: 'Vamos a revisar causa, corregir alcance y reasignar foco en esta reunión.',
    containment: 'Esto requiere precisión, no pánico; lo vamos a ordenar paso a paso.'
}

const EXAMPLE_PRESSURE_SIMULATOR = {
    probableCriticalScenario: 'Que cuestionen públicamente una recomendación mía en comité.',
    entrySignal: 'Acelero la voz y dejo de escuchar completo.',
    regulatedResponse: 'Pausar, pedir precisión en la objeción y responder en una frase central.',
    recoveryAction: 'Registrar qué pasó, qué hice bien y qué debo ajustar antes de la siguiente reunión.'
}

const VISIBILITY_LEVELS: VisibilityLevel[] = ['Bajo', 'Medio', 'Alto']

const MEETING_TIMING_SIGNALS = [
    'Momento ideal para intervenir',
    'Momento que debo evitar',
    'Señal de que la reunión necesita orden',
    'Señal de que conviene preguntar',
    'Señal de que conviene sintetizar',
    'Señal de que conviene retirarme'
] as const

const MEETING_TEST_QUESTIONS = [
    '¿Leí bien la dinámica de la sala?',
    '¿Elegí bien el momento para intervenir?',
    '¿Mi intervención agregó valor ejecutivo?',
    '¿Transmití seguridad tranquila?',
    '¿Ocupé el espacio con legitimidad?',
    '¿Dejé una huella ejecutiva útil?'
] as const

const EXAMPLE_MEETING_READING_MAP = {
    realDecisionMaker: 'La directora del área.',
    informalInfluencer: 'El financiero y el sponsor político.',
    blockerOrCooler: 'El líder técnico si siente pérdida de control.',
    mainTension: 'Resultado rápido vs. capacidad real.',
    dominantLanguage: 'Ejecutivo y orientado a riesgo.',
    highestValueContributionPoint: 'Sintetizar escenario y ordenar criterios de decisión.'
}

const EXAMPLE_MEETING_POSITIONING = {
    primaryRole: 'Ordenar información y proponer foco.',
    visibilityLevel: 'Medio' as VisibilityLevel,
    expectedContributionType: 'Sintetizar, proponer y responder objeciones.',
    overtalkingRisk: 'Parecer ansioso o invadir espacios de decisión.',
    undertalkingRisk: 'Perder oportunidad de instalar criterio.',
    desiredPresenceSignal: 'Calma con claridad y buen juicio.'
}

const EXAMPLE_MEETING_ARCHITECTURE = {
    briefOpening: 'Quiero ordenar este punto en una idea central.',
    centralThesis: 'Hoy el problema no es ambición, sino dispersión de foco.',
    criterionOrEvidence: 'Ya estamos viendo saturación operativa y pérdida de calidad.',
    executiveImplication: 'Si no priorizamos ahora, la ejecución se va a degradar.',
    shortClosing: 'Mi recomendación es definir hoy tres frentes y dejar dos fuera del ciclo actual.'
}

const EXAMPLE_MEETING_TIMING_MAP = [
    {
        momentOrSignal: 'Momento ideal para intervenir',
        plannedAction: 'Cuando ya se expusieron posiciones, pero aún no se cierra decisión.'
    },
    {
        momentOrSignal: 'Momento que debo evitar',
        plannedAction: 'Interrumpir una definición jerárquica sin haber leído el clima.'
    },
    {
        momentOrSignal: 'Señal de que la reunión necesita orden',
        plannedAction: 'Hay repetición de puntos y pérdida de foco.'
    },
    {
        momentOrSignal: 'Señal de que conviene preguntar',
        plannedAction: 'Falta información crítica o los supuestos no están claros.'
    },
    {
        momentOrSignal: 'Señal de que conviene sintetizar',
        plannedAction: 'Hay demasiadas intervenciones y la decisión se está diluyendo.'
    },
    {
        momentOrSignal: 'Señal de que conviene retirarme',
        plannedAction: 'La insistencia ya no suma y empieza a sonar defensiva.'
    }
] as const

const EXAMPLE_MEETING_FOOTPRINT_AUDIT = {
    entryQuality: 'Entré algo acelerado y tardé en centrarme.',
    spaceSustainment: 'Mejoré cuando fui al punto y bajé velocidad.',
    realContribution: 'Ordené la decisión y reduje dispersión.',
    likelyPerception: 'Criterio útil, aunque al inicio algo ansioso.',
    nextAdjustment: 'Preparar mejor apertura y leer antes la dinámica de sala.'
}

const CONGRUENCE_DIMENSIONS = [
    'Mensaje central',
    'Postura corporal',
    'Tono y ritmo',
    'Rostro y mirada',
    'Energía general',
    'Nivel de coherencia percibida'
] as const

const COHERENCE_TEST_QUESTIONS = [
    '¿Mi forma reforzó mi mensaje?',
    '¿Evité contradicciones visibles?',
    '¿Tono, cuerpo y mirada fueron en la misma dirección?',
    '¿La lectura probable fue de coherencia y no de tensión?',
    '¿Identifico mis contradicciones más frecuentes?',
    '¿Sé corregirlas en tiempo real?'
] as const

const EXAMPLE_CONGRUENCE_MAP = [
    {
        dimension: 'Mensaje central',
        intendedMessage: 'Quería transmitir calma y control.',
        perceivedSignal: 'El mensaje era correcto, pero soné más tenso de lo que quería.'
    },
    {
        dimension: 'Postura corporal',
        intendedMessage: 'Quería verme estable.',
        perceivedSignal: 'Me incliné demasiado hacia adelante.'
    },
    {
        dimension: 'Tono y ritmo',
        intendedMessage: 'Quería sonar firme.',
        perceivedSignal: 'Aceleré varias frases.'
    },
    {
        dimension: 'Rostro y mirada',
        intendedMessage: 'Quería mostrar apertura.',
        perceivedSignal: 'Fruncí el ceño y bajé la mirada al ser cuestionado.'
    },
    {
        dimension: 'Energía general',
        intendedMessage: 'Quería ordenar la conversación.',
        perceivedSignal: 'Se percibió urgencia defensiva.'
    },
    {
        dimension: 'Nivel de coherencia percibida',
        intendedMessage: 'Medio-alto.',
        perceivedSignal: 'Medio-bajo.'
    }
] as const

const EXAMPLE_PERCEPTIVE_CONTRADICTIONS = [
    {
        verbalStatement: '“Estoy abierto a escucharlos”.',
        contradictorySignal: 'Brazos cerrados y torso rígido.',
        likelyReading: 'Defensividad.',
        priorityAdjustment: 'Abrir brazos y bajar tensión visible.'
    },
    {
        verbalStatement: '“No hay urgencia innecesaria”.',
        contradictorySignal: 'Hablo muy rápido.',
        likelyReading: 'Apuro o ansiedad.',
        priorityAdjustment: 'Reducir velocidad y marcar pausas.'
    },
    {
        verbalStatement: '“Lo tenemos bajo control”.',
        contradictorySignal: 'Mirada evasiva y mandíbula tensa.',
        likelyReading: 'Inseguridad.',
        priorityAdjustment: 'Sostener mirada y soltar mandíbula.'
    },
    {
        verbalStatement: '“Es una decisión pensada”.',
        contradictorySignal: 'Cierre de frase débil.',
        likelyReading: 'Duda.',
        priorityAdjustment: 'Cerrar con tono más firme.'
    }
] as const

const EXAMPLE_PHRASE_SIGNAL_LAB = [
    {
        keyPhrase: '“Voy a ordenar esto en tres puntos”.',
        installedIdea: 'Control y estructura.',
        neededTone: 'Firme y calmado.',
        supportingPostureOrGesture: 'Torso estable, mirada al frente, manos visibles.',
        whatToAvoid: 'Acelerar.'
    },
    {
        keyPhrase: '“Entiendo la preocupación”.',
        installedIdea: 'Reconocimiento y escucha.',
        neededTone: 'Bajo, limpio, sin dureza.',
        supportingPostureOrGesture: 'Leve inclinación receptiva y rostro abierto.',
        whatToAvoid: 'Sonar irónico.'
    },
    {
        keyPhrase: '“Mi recomendación es esta”.',
        installedIdea: 'Criterio y decisión.',
        neededTone: 'Claro, directo, con cierre firme.',
        supportingPostureOrGesture: 'Postura vertical y gesto breve de marcación.',
        whatToAvoid: 'Bajar volumen al final.'
    }
] as const

const EXAMPLE_EXPRESSIVE_TRAFFIC = [
    {
        signal: 'Mantengo mirada y torso estables.',
        level: 'Verde',
        whenAppears: 'Al presentar ideas preparadas.',
        requiredAdjustment: 'Consolidar.'
    },
    {
        signal: 'Sonrío por nervio al dar feedback difícil.',
        level: 'Amarillo',
        whenAppears: 'En conversaciones tensas.',
        requiredAdjustment: 'Bajar sonrisa automática y sostener seriedad amable.'
    },
    {
        signal: 'Digo “estoy tranquilo” con voz acelerada.',
        level: 'Rojo',
        whenAppears: 'Bajo cuestionamiento.',
        requiredAdjustment: 'Hacer pausa y reiniciar con menor velocidad.'
    }
] as const

const EXAMPLE_INCOHERENCE_REPAIR_PROTOCOL = {
    alertSignal: 'Empiezo a mover las manos sin control y acelero la voz.',
    bodyCorrection: 'Reanclar pies, bajar hombros y detener el gesto.',
    vocalCorrection: 'Exhalar y bajar medio punto la velocidad.',
    reorderingPhrase: '“Déjame decirlo con claridad en una frase.”',
    ideaToReinstall: 'Que tengo criterio y control del tema.'
}

const MENTOR_EVALUATION_CRITERIA = [
    'Coherencia verbal-no verbal',
    'Control del tono y ritmo',
    'Proyección de seguridad tranquila',
    'Manejo del espacio físico/digital',
    'Capacidad de ordenar contextos'
] as const

const LEADER_EVALUATION_QUESTIONS = [
    '¿Qué proyecta mi lenguaje corporal en reuniones clave?',
    '¿Transmito tensión o serenidad cuando estoy bajo presión?',
    '¿Mi presencia acelera o frena decisiones del equipo?',
    '¿Dónde pierdo autoridad o seguridad?',
    '¿Cómo gestiono el espacio en contextos virtuales?'
] as const

const MENTOR_LEVEL_OPTIONS: MentorLevel[] = ['N1', 'N2', 'N3', 'N4']
const MENTOR_DECISION_OPTIONS: MentorDecision[] = ['Consolidado', 'En desarrollo', 'Prioritario']
const MENTOR_LEVEL_REFERENCE = [
    {
        level: 'Nivel 1 - Declarativo',
        descriptor: 'Incoherencia entre mensaje y postura; transmite nerviosismo.'
    },
    {
        level: 'Nivel 2 - Consciente',
        descriptor: 'Mayor conciencia corporal; inconsistencias bajo presión.'
    },
    {
        level: 'Nivel 3 - Integrado',
        descriptor: 'Lenguaje verbal y no verbal alineados; estabilidad visible.'
    },
    {
        level: 'Nivel 4 - Alineación Estratégica',
        descriptor: 'Presencia sólida incluso en escenarios críticos; referencia para otros.'
    }
] as const

const EVALUATION_STAGES: Array<{ key: EvaluationStageKey; label: string }> = [
    { key: 'mentor', label: 'Pantalla 1 - Mentor' },
    { key: 'leader', label: 'Pantalla 2 - Líder' },
    { key: 'synthesis', label: 'Pantalla 3 - Síntesis' },
    { key: 'final', label: 'Cierre' }
]

const createDefaultEvaluationData = (): WB6State['evaluation'] => ({
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

const DEFAULT_STATE: WB6State = {
    identification: {
        leaderName: '',
        role: '',
        cohort: '',
        startDate: ''
    },
    bodyLanguageSection: {
        baselineScan: BASELINE_DIMENSIONS.map((dimension) => ({
            dimension,
            observation: '',
            effect: ''
        })),
        presenceMatrix: PRESENCE_DIMENSIONS.map((dimension) => ({
            dimension,
            observableBehavior: '',
            presenceImpact: '' as PresenceImpact,
            concreteAdjustment: ''
        })),
        leakageTraffic: Array.from({ length: 4 }, () => ({
            signal: '',
            level: '' as LeakageLevel,
            whenAppears: '',
            generatedReading: ''
        })),
        entryProtocol: {
            idealEntry: '',
            positioning: '',
            spaceCriteria: '',
            first20Seconds: '',
            signalToInstall: ''
        },
        calmAuthorityPattern: {
            centeredBody: '',
            listeningBody: '',
            objectionBody: '',
            returnToCenter: ''
        },
        coherenceTest: COHERENCE_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    objectionHandlingSection: {
        cartography: Array.from({ length: 3 }, () => ({
            objection: '',
            objectionType: '' as ObjectionType,
            whatActivatedMe: '',
            response: '',
            responseEffect: '',
            betterResponse: ''
        })),
        diagnosis: {
            literal: '',
            emotionalIntensity: '',
            whatItProtects: '',
            firstLayerToRespond: ''
        },
        protocol: {
            receive: '',
            clarificationQuestion: '',
            recognition: '',
            focalResponse: '',
            advanceVerification: ''
        },
        bridgeBank: BRIDGE_SCENARIOS.map((scenario) => ({
            scenario,
            bridgeResponse: ''
        })),
        reframeLab: Array.from({ length: 3 }, () => ({
            originalObjection: '',
            usefulReframe: '',
            proposalImprovement: ''
        })),
        executiveTest: OBJECTION_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    voiceToneSection: {
        baseline: VOICE_BASELINE_DIMENSIONS.map((dimension) => ({
            dimension,
            observation: '',
            effect: ''
        })),
        calibrationMatrix: VOICE_CALIBRATION_DIMENSIONS.map((dimension) => ({
            dimension,
            observablePattern: '',
            impact: '' as PresenceImpact,
            concreteAdjustment: ''
        })),
        messagePartiture: {
            baseMessage: '',
            anchorWords: '',
            functionalPauses: '',
            firmClosures: '',
            energyPoints: '',
            vocalRisks: ''
        },
        pressureProtocol: {
            earlySignal: '',
            triggerContext: '',
            regulationAction: '',
            reanchoringPhrase: ''
        },
        modulationLadder: VOICE_CONTEXTS.map((context) => ({
            context,
            tone: '',
            speed: '',
            volume: '',
            pauses: '',
            emphasis: ''
        })),
        executiveImpactTest: VOICE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    pressureCommunicationSection: {
        pressureSignatureMap: {
            trigger: '',
            earlyInternalSignal: '',
            visibleCommunicationShift: '',
            automaticPattern: '',
            effectOnOthers: '',
            episodeCost: ''
        },
        communicationDisorderMatrix: PRESSURE_DISORDER_DIMENSIONS.map((dimension) => ({
            dimension,
            underPressure: '',
            generatedReading: '',
            regulatoryAdjustment: ''
        })),
        responseProtocol: {
            functionalPause: '',
            internalOrderPhrase: '',
            strategicReframe: '',
            interventionFormula: ''
        },
        shortMessageTemplate: {
            fact: '',
            priority: '',
            direction: '',
            containment: ''
        },
        pressureSimulator: {
            probableCriticalScenario: '',
            entrySignal: '',
            regulatedResponse: '',
            recoveryAction: ''
        },
        executivePressureTest: PRESSURE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    highLevelMeetingsSection: {
        roomReadingMap: {
            realDecisionMaker: '',
            informalInfluencer: '',
            blockerOrCooler: '',
            mainTension: '',
            dominantLanguage: '',
            highestValueContributionPoint: ''
        },
        positioningMatrix: {
            primaryRole: '',
            visibilityLevel: '' as VisibilityLevel,
            expectedContributionType: '',
            overtalkingRisk: '',
            undertalkingRisk: '',
            desiredPresenceSignal: ''
        },
        interventionArchitecture: {
            briefOpening: '',
            centralThesis: '',
            criterionOrEvidence: '',
            executiveImplication: '',
            shortClosing: ''
        },
        timingMap: MEETING_TIMING_SIGNALS.map((momentOrSignal) => ({
            momentOrSignal,
            plannedAction: ''
        })),
        executiveFootprintAudit: {
            entryQuality: '',
            spaceSustainment: '',
            realContribution: '',
            likelyPerception: '',
            nextAdjustment: ''
        },
        highLevelMeetingTest: MEETING_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    coherenceAlignmentSection: {
        congruenceMap: CONGRUENCE_DIMENSIONS.map((dimension) => ({
            dimension,
            intendedMessage: '',
            perceivedSignal: ''
        })),
        perceptiveContradictions: Array.from({ length: 4 }, () => ({
            verbalStatement: '',
            contradictorySignal: '',
            likelyReading: '',
            priorityAdjustment: ''
        })),
        phraseSignalLab: Array.from({ length: 3 }, () => ({
            keyPhrase: '',
            installedIdea: '',
            neededTone: '',
            supportingPostureOrGesture: '',
            whatToAvoid: ''
        })),
        expressiveTrafficLight: Array.from({ length: 4 }, () => ({
            signal: '',
            level: '' as LeakageLevel,
            whenAppears: '',
            requiredAdjustment: ''
        })),
        incoherenceRepairProtocol: {
            alertSignal: '',
            bodyCorrection: '',
            vocalCorrection: '',
            reorderingPhrase: '',
            ideaToReinstall: ''
        },
        coherenceTest: COHERENCE_TEST_QUESTIONS.map((question) => ({
            question,
            verdict: '' as YesNoAnswer,
            adjustment: ''
        }))
    },
    evaluation: createDefaultEvaluationData()
}

const normalizeState = (raw: unknown): WB6State => {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATE
    const parsed = raw as Record<string, unknown>
    const identification = (parsed.identification ?? {}) as Record<string, unknown>
    const bodyRaw = (parsed.bodyLanguageSection ?? {}) as Record<string, unknown>
    const baselineRaw = Array.isArray(bodyRaw.baselineScan) ? bodyRaw.baselineScan : []
    const presenceRaw = Array.isArray(bodyRaw.presenceMatrix) ? bodyRaw.presenceMatrix : []
    const leakageRaw = Array.isArray(bodyRaw.leakageTraffic) ? bodyRaw.leakageTraffic : []
    const coherenceRaw = Array.isArray(bodyRaw.coherenceTest) ? bodyRaw.coherenceTest : []
    const objectionRaw = (parsed.objectionHandlingSection ?? {}) as Record<string, unknown>
    const objectionCartographyRaw = Array.isArray(objectionRaw.cartography) ? objectionRaw.cartography : []
    const objectionBridgeRaw = Array.isArray(objectionRaw.bridgeBank) ? objectionRaw.bridgeBank : []
    const objectionReframeRaw = Array.isArray(objectionRaw.reframeLab) ? objectionRaw.reframeLab : []
    const objectionTestRaw = Array.isArray(objectionRaw.executiveTest) ? objectionRaw.executiveTest : []
    const voiceRaw = (parsed.voiceToneSection ?? {}) as Record<string, unknown>
    const voiceBaselineRaw = Array.isArray(voiceRaw.baseline) ? voiceRaw.baseline : []
    const voiceCalibrationRaw = Array.isArray(voiceRaw.calibrationMatrix) ? voiceRaw.calibrationMatrix : []
    const voiceLadderRaw = Array.isArray(voiceRaw.modulationLadder) ? voiceRaw.modulationLadder : []
    const voiceTestRaw = Array.isArray(voiceRaw.executiveImpactTest) ? voiceRaw.executiveImpactTest : []
    const pressureRaw = (parsed.pressureCommunicationSection ?? {}) as Record<string, unknown>
    const pressureDisorderRaw = Array.isArray(pressureRaw.communicationDisorderMatrix) ? pressureRaw.communicationDisorderMatrix : []
    const pressureTestRaw = Array.isArray(pressureRaw.executivePressureTest) ? pressureRaw.executivePressureTest : []
    const meetingsRaw = (parsed.highLevelMeetingsSection ?? {}) as Record<string, unknown>
    const meetingsTimingRaw = Array.isArray(meetingsRaw.timingMap) ? meetingsRaw.timingMap : []
    const meetingsTestRaw = Array.isArray(meetingsRaw.highLevelMeetingTest) ? meetingsRaw.highLevelMeetingTest : []
    const coherenceAlignmentRaw = (parsed.coherenceAlignmentSection ?? {}) as Record<string, unknown>
    const congruenceMapRaw = Array.isArray(coherenceAlignmentRaw.congruenceMap) ? coherenceAlignmentRaw.congruenceMap : []
    const perceptiveContradictionsRaw = Array.isArray(coherenceAlignmentRaw.perceptiveContradictions)
        ? coherenceAlignmentRaw.perceptiveContradictions
        : []
    const phraseSignalLabRaw = Array.isArray(coherenceAlignmentRaw.phraseSignalLab) ? coherenceAlignmentRaw.phraseSignalLab : []
    const expressiveTrafficLightRaw = Array.isArray(coherenceAlignmentRaw.expressiveTrafficLight)
        ? coherenceAlignmentRaw.expressiveTrafficLight
        : []
    const coherenceSectionTestRaw = Array.isArray(coherenceAlignmentRaw.coherenceTest) ? coherenceAlignmentRaw.coherenceTest : []
    const evaluationRaw = (parsed.evaluation ?? {}) as Record<string, unknown>
    const mentorRowsRaw = Array.isArray(evaluationRaw.mentorRows) ? evaluationRaw.mentorRows : []
    const leaderRowsRaw = Array.isArray(evaluationRaw.leaderRows) ? evaluationRaw.leaderRows : []

    const normalizeVerdict = (value: unknown): YesNoAnswer => {
        if (value === 'yes' || value === 'no') return value
        return ''
    }

    const normalizePresenceImpact = (value: unknown): PresenceImpact => {
        if (value === 'Suma' || value === 'Resta') return value
        return ''
    }

    const normalizeLeakageLevel = (value: unknown): LeakageLevel => {
        if (value === 'Verde' || value === 'Amarillo' || value === 'Rojo') return value
        return ''
    }

    const normalizeVisibilityLevel = (value: unknown): VisibilityLevel => {
        if (value === 'Bajo' || value === 'Medio' || value === 'Alto') return value
        return ''
    }

    const normalizeMentorLevel = (value: unknown): MentorLevel => {
        if (value === 'N1' || value === 'N2' || value === 'N3' || value === 'N4') return value
        return ''
    }

    const normalizeMentorDecision = (value: unknown): MentorDecision => {
        if (value === 'Consolidado' || value === 'En desarrollo' || value === 'Prioritario') return value
        return ''
    }

    const normalizeObjectionType = (value: unknown): ObjectionType => {
        if (
            value === 'Contenido' ||
            value === 'Proceso' ||
            value === 'Confianza' ||
            value === 'Identidad o estatus' ||
            value === 'Confianza / estatus' ||
            value === 'Otro'
        ) {
            return value
        }
        return ''
    }

    return {
        identification: {
            leaderName: typeof identification.leaderName === 'string' ? identification.leaderName : '',
            role: typeof identification.role === 'string' ? identification.role : '',
            cohort: typeof identification.cohort === 'string' ? identification.cohort : '',
            startDate: typeof identification.startDate === 'string' ? identification.startDate : ''
        },
        bodyLanguageSection: {
            baselineScan: BASELINE_DIMENSIONS.map((dimension, index) => {
                const candidate = (baselineRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observation: typeof candidate.observation === 'string' ? candidate.observation : '',
                    effect: typeof candidate.effect === 'string' ? candidate.effect : ''
                }
            }),
            presenceMatrix: PRESENCE_DIMENSIONS.map((dimension, index) => {
                const candidate = (presenceRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observableBehavior: typeof candidate.observableBehavior === 'string' ? candidate.observableBehavior : '',
                    presenceImpact: normalizePresenceImpact(candidate.presenceImpact),
                    concreteAdjustment: typeof candidate.concreteAdjustment === 'string' ? candidate.concreteAdjustment : ''
                }
            }),
            leakageTraffic: Array.from({ length: 4 }, (_, index) => {
                const candidate = (leakageRaw[index] ?? {}) as Record<string, unknown>
                return {
                    signal: typeof candidate.signal === 'string' ? candidate.signal : '',
                    level: normalizeLeakageLevel(candidate.level),
                    whenAppears: typeof candidate.whenAppears === 'string' ? candidate.whenAppears : '',
                    generatedReading: typeof candidate.generatedReading === 'string' ? candidate.generatedReading : ''
                }
            }),
            entryProtocol: {
                idealEntry:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.idealEntry === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).idealEntry as string)
                        : '',
                positioning:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.positioning === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).positioning as string)
                        : '',
                spaceCriteria:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.spaceCriteria === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).spaceCriteria as string)
                        : '',
                first20Seconds:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.first20Seconds === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).first20Seconds as string)
                        : '',
                signalToInstall:
                    typeof (bodyRaw.entryProtocol as Record<string, unknown> | undefined)?.signalToInstall === 'string'
                        ? ((bodyRaw.entryProtocol as Record<string, unknown>).signalToInstall as string)
                        : ''
            },
            calmAuthorityPattern: {
                centeredBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.centeredBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).centeredBody as string)
                        : '',
                listeningBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.listeningBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).listeningBody as string)
                        : '',
                objectionBody:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.objectionBody === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).objectionBody as string)
                        : '',
                returnToCenter:
                    typeof (bodyRaw.calmAuthorityPattern as Record<string, unknown> | undefined)?.returnToCenter === 'string'
                        ? ((bodyRaw.calmAuthorityPattern as Record<string, unknown>).returnToCenter as string)
                        : ''
            },
            coherenceTest: COHERENCE_QUESTIONS.map((question, index) => {
                const candidate = (coherenceRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        objectionHandlingSection: {
            cartography: Array.from({ length: 3 }, (_, index) => {
                const candidate = (objectionCartographyRaw[index] ?? {}) as Record<string, unknown>
                return {
                    objection: typeof candidate.objection === 'string' ? candidate.objection : '',
                    objectionType: normalizeObjectionType(candidate.objectionType),
                    whatActivatedMe: typeof candidate.whatActivatedMe === 'string' ? candidate.whatActivatedMe : '',
                    response: typeof candidate.response === 'string' ? candidate.response : '',
                    responseEffect: typeof candidate.responseEffect === 'string' ? candidate.responseEffect : '',
                    betterResponse: typeof candidate.betterResponse === 'string' ? candidate.betterResponse : ''
                }
            }),
            diagnosis: {
                literal:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.literal === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).literal as string)
                        : '',
                emotionalIntensity:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.emotionalIntensity === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).emotionalIntensity as string)
                        : '',
                whatItProtects:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.whatItProtects === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).whatItProtects as string)
                        : '',
                firstLayerToRespond:
                    typeof (objectionRaw.diagnosis as Record<string, unknown> | undefined)?.firstLayerToRespond === 'string'
                        ? ((objectionRaw.diagnosis as Record<string, unknown>).firstLayerToRespond as string)
                        : ''
            },
            protocol: {
                receive:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.receive === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).receive as string)
                        : '',
                clarificationQuestion:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.clarificationQuestion === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).clarificationQuestion as string)
                        : '',
                recognition:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.recognition === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).recognition as string)
                        : '',
                focalResponse:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.focalResponse === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).focalResponse as string)
                        : '',
                advanceVerification:
                    typeof (objectionRaw.protocol as Record<string, unknown> | undefined)?.advanceVerification === 'string'
                        ? ((objectionRaw.protocol as Record<string, unknown>).advanceVerification as string)
                        : ''
            },
            bridgeBank: BRIDGE_SCENARIOS.map((scenario, index) => {
                const candidate = (objectionBridgeRaw[index] ?? {}) as Record<string, unknown>
                return {
                    scenario,
                    bridgeResponse: typeof candidate.bridgeResponse === 'string' ? candidate.bridgeResponse : ''
                }
            }),
            reframeLab: Array.from({ length: 3 }, (_, index) => {
                const candidate = (objectionReframeRaw[index] ?? {}) as Record<string, unknown>
                return {
                    originalObjection:
                        typeof candidate.originalObjection === 'string' ? candidate.originalObjection : '',
                    usefulReframe: typeof candidate.usefulReframe === 'string' ? candidate.usefulReframe : '',
                    proposalImprovement:
                        typeof candidate.proposalImprovement === 'string' ? candidate.proposalImprovement : ''
                }
            }),
            executiveTest: OBJECTION_TEST_QUESTIONS.map((question, index) => {
                const candidate = (objectionTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        voiceToneSection: {
            baseline: VOICE_BASELINE_DIMENSIONS.map((dimension, index) => {
                const candidate = (voiceBaselineRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observation: typeof candidate.observation === 'string' ? candidate.observation : '',
                    effect: typeof candidate.effect === 'string' ? candidate.effect : ''
                }
            }),
            calibrationMatrix: VOICE_CALIBRATION_DIMENSIONS.map((dimension, index) => {
                const candidate = (voiceCalibrationRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    observablePattern: typeof candidate.observablePattern === 'string' ? candidate.observablePattern : '',
                    impact: normalizePresenceImpact(candidate.impact),
                    concreteAdjustment: typeof candidate.concreteAdjustment === 'string' ? candidate.concreteAdjustment : ''
                }
            }),
            messagePartiture: {
                baseMessage:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.baseMessage === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).baseMessage as string)
                        : '',
                anchorWords:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.anchorWords === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).anchorWords as string)
                        : '',
                functionalPauses:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.functionalPauses === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).functionalPauses as string)
                        : '',
                firmClosures:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.firmClosures === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).firmClosures as string)
                        : '',
                energyPoints:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.energyPoints === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).energyPoints as string)
                        : '',
                vocalRisks:
                    typeof (voiceRaw.messagePartiture as Record<string, unknown> | undefined)?.vocalRisks === 'string'
                        ? ((voiceRaw.messagePartiture as Record<string, unknown>).vocalRisks as string)
                        : ''
            },
            pressureProtocol: {
                earlySignal:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.earlySignal === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).earlySignal as string)
                        : '',
                triggerContext:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.triggerContext === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).triggerContext as string)
                        : '',
                regulationAction:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.regulationAction === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).regulationAction as string)
                        : '',
                reanchoringPhrase:
                    typeof (voiceRaw.pressureProtocol as Record<string, unknown> | undefined)?.reanchoringPhrase === 'string'
                        ? ((voiceRaw.pressureProtocol as Record<string, unknown>).reanchoringPhrase as string)
                        : ''
            },
            modulationLadder: VOICE_CONTEXTS.map((context, index) => {
                const candidate = (voiceLadderRaw[index] ?? {}) as Record<string, unknown>
                return {
                    context,
                    tone: typeof candidate.tone === 'string' ? candidate.tone : '',
                    speed: typeof candidate.speed === 'string' ? candidate.speed : '',
                    volume: typeof candidate.volume === 'string' ? candidate.volume : '',
                    pauses: typeof candidate.pauses === 'string' ? candidate.pauses : '',
                    emphasis: typeof candidate.emphasis === 'string' ? candidate.emphasis : ''
                }
            }),
            executiveImpactTest: VOICE_TEST_QUESTIONS.map((question, index) => {
                const candidate = (voiceTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        pressureCommunicationSection: {
            pressureSignatureMap: {
                trigger:
                    typeof (pressureRaw.pressureSignatureMap as Record<string, unknown> | undefined)?.trigger === 'string'
                        ? ((pressureRaw.pressureSignatureMap as Record<string, unknown>).trigger as string)
                        : '',
                earlyInternalSignal:
                    typeof (pressureRaw.pressureSignatureMap as Record<string, unknown> | undefined)?.earlyInternalSignal === 'string'
                        ? ((pressureRaw.pressureSignatureMap as Record<string, unknown>).earlyInternalSignal as string)
                        : '',
                visibleCommunicationShift:
                    typeof (pressureRaw.pressureSignatureMap as Record<string, unknown> | undefined)?.visibleCommunicationShift === 'string'
                        ? ((pressureRaw.pressureSignatureMap as Record<string, unknown>).visibleCommunicationShift as string)
                        : '',
                automaticPattern:
                    typeof (pressureRaw.pressureSignatureMap as Record<string, unknown> | undefined)?.automaticPattern === 'string'
                        ? ((pressureRaw.pressureSignatureMap as Record<string, unknown>).automaticPattern as string)
                        : '',
                effectOnOthers:
                    typeof (pressureRaw.pressureSignatureMap as Record<string, unknown> | undefined)?.effectOnOthers === 'string'
                        ? ((pressureRaw.pressureSignatureMap as Record<string, unknown>).effectOnOthers as string)
                        : '',
                episodeCost:
                    typeof (pressureRaw.pressureSignatureMap as Record<string, unknown> | undefined)?.episodeCost === 'string'
                        ? ((pressureRaw.pressureSignatureMap as Record<string, unknown>).episodeCost as string)
                        : ''
            },
            communicationDisorderMatrix: PRESSURE_DISORDER_DIMENSIONS.map((dimension, index) => {
                const candidate = (pressureDisorderRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    underPressure: typeof candidate.underPressure === 'string' ? candidate.underPressure : '',
                    generatedReading: typeof candidate.generatedReading === 'string' ? candidate.generatedReading : '',
                    regulatoryAdjustment: typeof candidate.regulatoryAdjustment === 'string' ? candidate.regulatoryAdjustment : ''
                }
            }),
            responseProtocol: {
                functionalPause:
                    typeof (pressureRaw.responseProtocol as Record<string, unknown> | undefined)?.functionalPause === 'string'
                        ? ((pressureRaw.responseProtocol as Record<string, unknown>).functionalPause as string)
                        : '',
                internalOrderPhrase:
                    typeof (pressureRaw.responseProtocol as Record<string, unknown> | undefined)?.internalOrderPhrase === 'string'
                        ? ((pressureRaw.responseProtocol as Record<string, unknown>).internalOrderPhrase as string)
                        : '',
                strategicReframe:
                    typeof (pressureRaw.responseProtocol as Record<string, unknown> | undefined)?.strategicReframe === 'string'
                        ? ((pressureRaw.responseProtocol as Record<string, unknown>).strategicReframe as string)
                        : '',
                interventionFormula:
                    typeof (pressureRaw.responseProtocol as Record<string, unknown> | undefined)?.interventionFormula === 'string'
                        ? ((pressureRaw.responseProtocol as Record<string, unknown>).interventionFormula as string)
                        : ''
            },
            shortMessageTemplate: {
                fact:
                    typeof (pressureRaw.shortMessageTemplate as Record<string, unknown> | undefined)?.fact === 'string'
                        ? ((pressureRaw.shortMessageTemplate as Record<string, unknown>).fact as string)
                        : '',
                priority:
                    typeof (pressureRaw.shortMessageTemplate as Record<string, unknown> | undefined)?.priority === 'string'
                        ? ((pressureRaw.shortMessageTemplate as Record<string, unknown>).priority as string)
                        : '',
                direction:
                    typeof (pressureRaw.shortMessageTemplate as Record<string, unknown> | undefined)?.direction === 'string'
                        ? ((pressureRaw.shortMessageTemplate as Record<string, unknown>).direction as string)
                        : '',
                containment:
                    typeof (pressureRaw.shortMessageTemplate as Record<string, unknown> | undefined)?.containment === 'string'
                        ? ((pressureRaw.shortMessageTemplate as Record<string, unknown>).containment as string)
                        : ''
            },
            pressureSimulator: {
                probableCriticalScenario:
                    typeof (pressureRaw.pressureSimulator as Record<string, unknown> | undefined)?.probableCriticalScenario === 'string'
                        ? ((pressureRaw.pressureSimulator as Record<string, unknown>).probableCriticalScenario as string)
                        : '',
                entrySignal:
                    typeof (pressureRaw.pressureSimulator as Record<string, unknown> | undefined)?.entrySignal === 'string'
                        ? ((pressureRaw.pressureSimulator as Record<string, unknown>).entrySignal as string)
                        : '',
                regulatedResponse:
                    typeof (pressureRaw.pressureSimulator as Record<string, unknown> | undefined)?.regulatedResponse === 'string'
                        ? ((pressureRaw.pressureSimulator as Record<string, unknown>).regulatedResponse as string)
                        : '',
                recoveryAction:
                    typeof (pressureRaw.pressureSimulator as Record<string, unknown> | undefined)?.recoveryAction === 'string'
                        ? ((pressureRaw.pressureSimulator as Record<string, unknown>).recoveryAction as string)
                        : ''
            },
            executivePressureTest: PRESSURE_TEST_QUESTIONS.map((question, index) => {
                const candidate = (pressureTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        highLevelMeetingsSection: {
            roomReadingMap: {
                realDecisionMaker:
                    typeof (meetingsRaw.roomReadingMap as Record<string, unknown> | undefined)?.realDecisionMaker === 'string'
                        ? ((meetingsRaw.roomReadingMap as Record<string, unknown>).realDecisionMaker as string)
                        : '',
                informalInfluencer:
                    typeof (meetingsRaw.roomReadingMap as Record<string, unknown> | undefined)?.informalInfluencer === 'string'
                        ? ((meetingsRaw.roomReadingMap as Record<string, unknown>).informalInfluencer as string)
                        : '',
                blockerOrCooler:
                    typeof (meetingsRaw.roomReadingMap as Record<string, unknown> | undefined)?.blockerOrCooler === 'string'
                        ? ((meetingsRaw.roomReadingMap as Record<string, unknown>).blockerOrCooler as string)
                        : '',
                mainTension:
                    typeof (meetingsRaw.roomReadingMap as Record<string, unknown> | undefined)?.mainTension === 'string'
                        ? ((meetingsRaw.roomReadingMap as Record<string, unknown>).mainTension as string)
                        : '',
                dominantLanguage:
                    typeof (meetingsRaw.roomReadingMap as Record<string, unknown> | undefined)?.dominantLanguage === 'string'
                        ? ((meetingsRaw.roomReadingMap as Record<string, unknown>).dominantLanguage as string)
                        : '',
                highestValueContributionPoint:
                    typeof (meetingsRaw.roomReadingMap as Record<string, unknown> | undefined)?.highestValueContributionPoint === 'string'
                        ? ((meetingsRaw.roomReadingMap as Record<string, unknown>).highestValueContributionPoint as string)
                        : ''
            },
            positioningMatrix: {
                primaryRole:
                    typeof (meetingsRaw.positioningMatrix as Record<string, unknown> | undefined)?.primaryRole === 'string'
                        ? ((meetingsRaw.positioningMatrix as Record<string, unknown>).primaryRole as string)
                        : '',
                visibilityLevel: normalizeVisibilityLevel(
                    (meetingsRaw.positioningMatrix as Record<string, unknown> | undefined)?.visibilityLevel
                ),
                expectedContributionType:
                    typeof (meetingsRaw.positioningMatrix as Record<string, unknown> | undefined)?.expectedContributionType === 'string'
                        ? ((meetingsRaw.positioningMatrix as Record<string, unknown>).expectedContributionType as string)
                        : '',
                overtalkingRisk:
                    typeof (meetingsRaw.positioningMatrix as Record<string, unknown> | undefined)?.overtalkingRisk === 'string'
                        ? ((meetingsRaw.positioningMatrix as Record<string, unknown>).overtalkingRisk as string)
                        : '',
                undertalkingRisk:
                    typeof (meetingsRaw.positioningMatrix as Record<string, unknown> | undefined)?.undertalkingRisk === 'string'
                        ? ((meetingsRaw.positioningMatrix as Record<string, unknown>).undertalkingRisk as string)
                        : '',
                desiredPresenceSignal:
                    typeof (meetingsRaw.positioningMatrix as Record<string, unknown> | undefined)?.desiredPresenceSignal === 'string'
                        ? ((meetingsRaw.positioningMatrix as Record<string, unknown>).desiredPresenceSignal as string)
                        : ''
            },
            interventionArchitecture: {
                briefOpening:
                    typeof (meetingsRaw.interventionArchitecture as Record<string, unknown> | undefined)?.briefOpening === 'string'
                        ? ((meetingsRaw.interventionArchitecture as Record<string, unknown>).briefOpening as string)
                        : '',
                centralThesis:
                    typeof (meetingsRaw.interventionArchitecture as Record<string, unknown> | undefined)?.centralThesis === 'string'
                        ? ((meetingsRaw.interventionArchitecture as Record<string, unknown>).centralThesis as string)
                        : '',
                criterionOrEvidence:
                    typeof (meetingsRaw.interventionArchitecture as Record<string, unknown> | undefined)?.criterionOrEvidence === 'string'
                        ? ((meetingsRaw.interventionArchitecture as Record<string, unknown>).criterionOrEvidence as string)
                        : '',
                executiveImplication:
                    typeof (meetingsRaw.interventionArchitecture as Record<string, unknown> | undefined)?.executiveImplication === 'string'
                        ? ((meetingsRaw.interventionArchitecture as Record<string, unknown>).executiveImplication as string)
                        : '',
                shortClosing:
                    typeof (meetingsRaw.interventionArchitecture as Record<string, unknown> | undefined)?.shortClosing === 'string'
                        ? ((meetingsRaw.interventionArchitecture as Record<string, unknown>).shortClosing as string)
                        : ''
            },
            timingMap: MEETING_TIMING_SIGNALS.map((momentOrSignal, index) => {
                const candidate = (meetingsTimingRaw[index] ?? {}) as Record<string, unknown>
                return {
                    momentOrSignal,
                    plannedAction: typeof candidate.plannedAction === 'string' ? candidate.plannedAction : ''
                }
            }),
            executiveFootprintAudit: {
                entryQuality:
                    typeof (meetingsRaw.executiveFootprintAudit as Record<string, unknown> | undefined)?.entryQuality === 'string'
                        ? ((meetingsRaw.executiveFootprintAudit as Record<string, unknown>).entryQuality as string)
                        : '',
                spaceSustainment:
                    typeof (meetingsRaw.executiveFootprintAudit as Record<string, unknown> | undefined)?.spaceSustainment === 'string'
                        ? ((meetingsRaw.executiveFootprintAudit as Record<string, unknown>).spaceSustainment as string)
                        : '',
                realContribution:
                    typeof (meetingsRaw.executiveFootprintAudit as Record<string, unknown> | undefined)?.realContribution === 'string'
                        ? ((meetingsRaw.executiveFootprintAudit as Record<string, unknown>).realContribution as string)
                        : '',
                likelyPerception:
                    typeof (meetingsRaw.executiveFootprintAudit as Record<string, unknown> | undefined)?.likelyPerception === 'string'
                        ? ((meetingsRaw.executiveFootprintAudit as Record<string, unknown>).likelyPerception as string)
                        : '',
                nextAdjustment:
                    typeof (meetingsRaw.executiveFootprintAudit as Record<string, unknown> | undefined)?.nextAdjustment === 'string'
                        ? ((meetingsRaw.executiveFootprintAudit as Record<string, unknown>).nextAdjustment as string)
                        : ''
            },
            highLevelMeetingTest: MEETING_TEST_QUESTIONS.map((question, index) => {
                const candidate = (meetingsTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        coherenceAlignmentSection: {
            congruenceMap: CONGRUENCE_DIMENSIONS.map((dimension, index) => {
                const candidate = (congruenceMapRaw[index] ?? {}) as Record<string, unknown>
                return {
                    dimension,
                    intendedMessage: typeof candidate.intendedMessage === 'string' ? candidate.intendedMessage : '',
                    perceivedSignal: typeof candidate.perceivedSignal === 'string' ? candidate.perceivedSignal : ''
                }
            }),
            perceptiveContradictions: Array.from({ length: 4 }, (_, index) => {
                const candidate = (perceptiveContradictionsRaw[index] ?? {}) as Record<string, unknown>
                return {
                    verbalStatement: typeof candidate.verbalStatement === 'string' ? candidate.verbalStatement : '',
                    contradictorySignal: typeof candidate.contradictorySignal === 'string' ? candidate.contradictorySignal : '',
                    likelyReading: typeof candidate.likelyReading === 'string' ? candidate.likelyReading : '',
                    priorityAdjustment: typeof candidate.priorityAdjustment === 'string' ? candidate.priorityAdjustment : ''
                }
            }),
            phraseSignalLab: Array.from({ length: 3 }, (_, index) => {
                const candidate = (phraseSignalLabRaw[index] ?? {}) as Record<string, unknown>
                return {
                    keyPhrase: typeof candidate.keyPhrase === 'string' ? candidate.keyPhrase : '',
                    installedIdea: typeof candidate.installedIdea === 'string' ? candidate.installedIdea : '',
                    neededTone: typeof candidate.neededTone === 'string' ? candidate.neededTone : '',
                    supportingPostureOrGesture:
                        typeof candidate.supportingPostureOrGesture === 'string' ? candidate.supportingPostureOrGesture : '',
                    whatToAvoid: typeof candidate.whatToAvoid === 'string' ? candidate.whatToAvoid : ''
                }
            }),
            expressiveTrafficLight: Array.from({ length: 4 }, (_, index) => {
                const candidate = (expressiveTrafficLightRaw[index] ?? {}) as Record<string, unknown>
                return {
                    signal: typeof candidate.signal === 'string' ? candidate.signal : '',
                    level: normalizeLeakageLevel(candidate.level),
                    whenAppears: typeof candidate.whenAppears === 'string' ? candidate.whenAppears : '',
                    requiredAdjustment: typeof candidate.requiredAdjustment === 'string' ? candidate.requiredAdjustment : ''
                }
            }),
            incoherenceRepairProtocol: {
                alertSignal:
                    typeof (coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown> | undefined)?.alertSignal === 'string'
                        ? ((coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown>).alertSignal as string)
                        : '',
                bodyCorrection:
                    typeof (coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown> | undefined)?.bodyCorrection === 'string'
                        ? ((coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown>).bodyCorrection as string)
                        : '',
                vocalCorrection:
                    typeof (coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown> | undefined)?.vocalCorrection === 'string'
                        ? ((coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown>).vocalCorrection as string)
                        : '',
                reorderingPhrase:
                    typeof (coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown> | undefined)?.reorderingPhrase === 'string'
                        ? ((coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown>).reorderingPhrase as string)
                        : '',
                ideaToReinstall:
                    typeof (coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown> | undefined)?.ideaToReinstall === 'string'
                        ? ((coherenceAlignmentRaw.incoherenceRepairProtocol as Record<string, unknown>).ideaToReinstall as string)
                        : ''
            },
            coherenceTest: COHERENCE_TEST_QUESTIONS.map((question, index) => {
                const candidate = (coherenceSectionTestRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    verdict: normalizeVerdict(candidate.verdict),
                    adjustment: typeof candidate.adjustment === 'string' ? candidate.adjustment : ''
                }
            })
        },
        evaluation: {
            mentorRows: MENTOR_EVALUATION_CRITERIA.map((criterion, index) => {
                const candidate = (mentorRowsRaw[index] ?? {}) as Record<string, unknown>
                return {
                    criterion,
                    level: normalizeMentorLevel(candidate.level),
                    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
                    decision: normalizeMentorDecision(candidate.decision)
                }
            }),
            mentorGeneralNotes: typeof evaluationRaw.mentorGeneralNotes === 'string' ? evaluationRaw.mentorGeneralNotes : '',
            mentorGlobalDecision: normalizeMentorDecision(evaluationRaw.mentorGlobalDecision),
            leaderRows: LEADER_EVALUATION_QUESTIONS.map((question, index) => {
                const candidate = (leaderRowsRaw[index] ?? {}) as Record<string, unknown>
                return {
                    question,
                    response: typeof candidate.response === 'string' ? candidate.response : '',
                    evidence: typeof candidate.evidence === 'string' ? candidate.evidence : '',
                    action: typeof candidate.action === 'string' ? candidate.action : ''
                }
            }),
            agreementsSynthesis: typeof evaluationRaw.agreementsSynthesis === 'string' ? evaluationRaw.agreementsSynthesis : ''
        }
    }
}

export function WB6Digital() {
    const [state, setState] = useState<WB6State>(DEFAULT_STATE)
    const [activePage, setActivePage] = useState<WorkbookPageId>(1)
    const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]))
    const [hasSeenPresentationOnce, setHasSeenPresentationOnce] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [saveFeedback, setSaveFeedback] = useState('')
    const [isHydrated, setIsHydrated] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const [showBodyHelp, setShowBodyHelp] = useState(false)
    const [showBodyExampleStep1, setShowBodyExampleStep1] = useState(false)
    const [showBodyExampleStep2, setShowBodyExampleStep2] = useState(false)
    const [showBodyExampleStep3, setShowBodyExampleStep3] = useState(false)
    const [showBodyExampleStep4, setShowBodyExampleStep4] = useState(false)
    const [showBodyExampleStep5, setShowBodyExampleStep5] = useState(false)
    const [showBodyExampleStep6, setShowBodyExampleStep6] = useState(false)
    const [showBodySketch, setShowBodySketch] = useState(false)
    const [showObjectionHelp, setShowObjectionHelp] = useState(false)
    const [showObjectionExampleStep1, setShowObjectionExampleStep1] = useState(false)
    const [showObjectionExampleStep2, setShowObjectionExampleStep2] = useState(false)
    const [showObjectionExampleStep3, setShowObjectionExampleStep3] = useState(false)
    const [showObjectionExampleStep4, setShowObjectionExampleStep4] = useState(false)
    const [showObjectionExampleStep5, setShowObjectionExampleStep5] = useState(false)
    const [showObjectionExampleStep6, setShowObjectionExampleStep6] = useState(false)
    const [showVoiceHelp, setShowVoiceHelp] = useState(false)
    const [showVoiceExampleStep1, setShowVoiceExampleStep1] = useState(false)
    const [showVoiceExampleStep2, setShowVoiceExampleStep2] = useState(false)
    const [showVoiceExampleStep3, setShowVoiceExampleStep3] = useState(false)
    const [showVoiceExampleStep4, setShowVoiceExampleStep4] = useState(false)
    const [showVoiceExampleStep5, setShowVoiceExampleStep5] = useState(false)
    const [showVoiceExampleStep6, setShowVoiceExampleStep6] = useState(false)
    const [showPressureHelp, setShowPressureHelp] = useState(false)
    const [showPressureExampleStep1, setShowPressureExampleStep1] = useState(false)
    const [showPressureExampleStep2, setShowPressureExampleStep2] = useState(false)
    const [showPressureExampleStep3, setShowPressureExampleStep3] = useState(false)
    const [showPressureExampleStep4, setShowPressureExampleStep4] = useState(false)
    const [showPressureExampleStep5, setShowPressureExampleStep5] = useState(false)
    const [showPressureExampleStep6, setShowPressureExampleStep6] = useState(false)
    const [showMeetingHelp, setShowMeetingHelp] = useState(false)
    const [showMeetingExampleStep1, setShowMeetingExampleStep1] = useState(false)
    const [showMeetingExampleStep2, setShowMeetingExampleStep2] = useState(false)
    const [showMeetingExampleStep3, setShowMeetingExampleStep3] = useState(false)
    const [showMeetingExampleStep4, setShowMeetingExampleStep4] = useState(false)
    const [showMeetingExampleStep5, setShowMeetingExampleStep5] = useState(false)
    const [showMeetingExampleStep6, setShowMeetingExampleStep6] = useState(false)
    const [showCoherenceHelp, setShowCoherenceHelp] = useState(false)
    const [showCoherenceExampleStep1, setShowCoherenceExampleStep1] = useState(false)
    const [showCoherenceExampleStep2, setShowCoherenceExampleStep2] = useState(false)
    const [showCoherenceExampleStep3, setShowCoherenceExampleStep3] = useState(false)
    const [showCoherenceExampleStep4, setShowCoherenceExampleStep4] = useState(false)
    const [showCoherenceExampleStep5, setShowCoherenceExampleStep5] = useState(false)
    const [showCoherenceExampleStep6, setShowCoherenceExampleStep6] = useState(false)
    const [showEvaluationLevelReference, setShowEvaluationLevelReference] = useState(false)
    const [mentorEvaluationEditModes, setMentorEvaluationEditModes] = useState<boolean[]>(
        () => DEFAULT_STATE.evaluation.mentorRows.map(() => false)
    )
    const [leaderEvaluationEditModes, setLeaderEvaluationEditModes] = useState<boolean[]>(
        () => DEFAULT_STATE.evaluation.leaderRows.map(() => false)
    )
    const [evaluationStage, setEvaluationStage] = useState<EvaluationStageKey>('mentor')

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

    const updateIdentification = (field: keyof WB6State['identification'], value: string) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            identification: {
                ...prev.identification,
                [field]: value
            }
        }))
    }

    const updateBaselineScanRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['baselineScan'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                baselineScan: prev.bodyLanguageSection.baselineScan.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updatePresenceMatrixRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['presenceMatrix'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                presenceMatrix: prev.bodyLanguageSection.presenceMatrix.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'presenceImpact'
                                      ? value === 'Suma' || value === 'Resta'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateLeakageTrafficRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['leakageTraffic'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                leakageTraffic: prev.bodyLanguageSection.leakageTraffic.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'level'
                                      ? value === 'Verde' || value === 'Amarillo' || value === 'Rojo'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateEntryProtocol = (
        field: keyof WB6State['bodyLanguageSection']['entryProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                entryProtocol: {
                    ...prev.bodyLanguageSection.entryProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateCalmAuthorityPattern = (
        field: keyof WB6State['bodyLanguageSection']['calmAuthorityPattern'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                calmAuthorityPattern: {
                    ...prev.bodyLanguageSection.calmAuthorityPattern,
                    [field]: value
                }
            }
        }))
    }

    const updateBodyLanguageCoherenceTestRow = (
        rowIndex: number,
        field: keyof WB6State['bodyLanguageSection']['coherenceTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            bodyLanguageSection: {
                ...prev.bodyLanguageSection,
                coherenceTest: prev.bodyLanguageSection.coherenceTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveBodyLanguageBlock = (blockLabel: string) => {
        markVisited(3)
        if (blockLabel === 'Paso 1') {
            setShowBodySketch(true)
        }
        announceSave(`${blockLabel} guardado.`)
    }

    const updateObjectionCartographyRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['cartography'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                cartography: prev.objectionHandlingSection.cartography.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'objectionType'
                                      ? OBJECTION_TYPES.includes(value as ObjectionType)
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateObjectionDiagnosis = (
        field: keyof WB6State['objectionHandlingSection']['diagnosis'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                diagnosis: {
                    ...prev.objectionHandlingSection.diagnosis,
                    [field]: value
                }
            }
        }))
    }

    const updateObjectionProtocol = (
        field: keyof WB6State['objectionHandlingSection']['protocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                protocol: {
                    ...prev.objectionHandlingSection.protocol,
                    [field]: value
                }
            }
        }))
    }

    const updateObjectionBridgeRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['bridgeBank'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                bridgeBank: prev.objectionHandlingSection.bridgeBank.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateObjectionReframeRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['reframeLab'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                reframeLab: prev.objectionHandlingSection.reframeLab.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateObjectionExecutiveTestRow = (
        rowIndex: number,
        field: keyof WB6State['objectionHandlingSection']['executiveTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            objectionHandlingSection: {
                ...prev.objectionHandlingSection,
                executiveTest: prev.objectionHandlingSection.executiveTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveObjectionBlock = (blockLabel: string) => {
        markVisited(4)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateVoiceBaselineRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['baseline'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                baseline: prev.voiceToneSection.baseline.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateVoiceCalibrationRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['calibrationMatrix'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                calibrationMatrix: prev.voiceToneSection.calibrationMatrix.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'impact'
                                      ? value === 'Suma' || value === 'Resta'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateVoicePartiture = (
        field: keyof WB6State['voiceToneSection']['messagePartiture'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                messagePartiture: {
                    ...prev.voiceToneSection.messagePartiture,
                    [field]: value
                }
            }
        }))
    }

    const updateVoicePressureProtocol = (
        field: keyof WB6State['voiceToneSection']['pressureProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                pressureProtocol: {
                    ...prev.voiceToneSection.pressureProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateVoiceLadderRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['modulationLadder'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                modulationLadder: prev.voiceToneSection.modulationLadder.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateVoiceExecutiveTestRow = (
        rowIndex: number,
        field: keyof WB6State['voiceToneSection']['executiveImpactTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            voiceToneSection: {
                ...prev.voiceToneSection,
                executiveImpactTest: prev.voiceToneSection.executiveImpactTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveVoiceBlock = (blockLabel: string) => {
        markVisited(5)
        announceSave(`${blockLabel} guardado.`)
    }

    const updatePressureSignatureMap = (
        field: keyof WB6State['pressureCommunicationSection']['pressureSignatureMap'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pressureCommunicationSection: {
                ...prev.pressureCommunicationSection,
                pressureSignatureMap: {
                    ...prev.pressureCommunicationSection.pressureSignatureMap,
                    [field]: value
                }
            }
        }))
    }

    const updatePressureDisorderRow = (
        rowIndex: number,
        field: keyof WB6State['pressureCommunicationSection']['communicationDisorderMatrix'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pressureCommunicationSection: {
                ...prev.pressureCommunicationSection,
                communicationDisorderMatrix: prev.pressureCommunicationSection.communicationDisorderMatrix.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updatePressureResponseProtocol = (
        field: keyof WB6State['pressureCommunicationSection']['responseProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pressureCommunicationSection: {
                ...prev.pressureCommunicationSection,
                responseProtocol: {
                    ...prev.pressureCommunicationSection.responseProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updatePressureShortMessage = (
        field: keyof WB6State['pressureCommunicationSection']['shortMessageTemplate'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pressureCommunicationSection: {
                ...prev.pressureCommunicationSection,
                shortMessageTemplate: {
                    ...prev.pressureCommunicationSection.shortMessageTemplate,
                    [field]: value
                }
            }
        }))
    }

    const updatePressureSimulator = (
        field: keyof WB6State['pressureCommunicationSection']['pressureSimulator'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pressureCommunicationSection: {
                ...prev.pressureCommunicationSection,
                pressureSimulator: {
                    ...prev.pressureCommunicationSection.pressureSimulator,
                    [field]: value
                }
            }
        }))
    }

    const updatePressureExecutiveTestRow = (
        rowIndex: number,
        field: keyof WB6State['pressureCommunicationSection']['executivePressureTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            pressureCommunicationSection: {
                ...prev.pressureCommunicationSection,
                executivePressureTest: prev.pressureCommunicationSection.executivePressureTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const savePressureBlock = (blockLabel: string) => {
        markVisited(6)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateMeetingRoomReading = (
        field: keyof WB6State['highLevelMeetingsSection']['roomReadingMap'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            highLevelMeetingsSection: {
                ...prev.highLevelMeetingsSection,
                roomReadingMap: {
                    ...prev.highLevelMeetingsSection.roomReadingMap,
                    [field]: value
                }
            }
        }))
    }

    const updateMeetingPositioning = (
        field: keyof WB6State['highLevelMeetingsSection']['positioningMatrix'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            highLevelMeetingsSection: {
                ...prev.highLevelMeetingsSection,
                positioningMatrix: {
                    ...prev.highLevelMeetingsSection.positioningMatrix,
                    [field]:
                        field === 'visibilityLevel'
                            ? value === 'Bajo' || value === 'Medio' || value === 'Alto'
                                ? value
                                : ''
                            : value
                }
            }
        }))
    }

    const updateMeetingArchitecture = (
        field: keyof WB6State['highLevelMeetingsSection']['interventionArchitecture'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            highLevelMeetingsSection: {
                ...prev.highLevelMeetingsSection,
                interventionArchitecture: {
                    ...prev.highLevelMeetingsSection.interventionArchitecture,
                    [field]: value
                }
            }
        }))
    }

    const updateMeetingTimingRow = (
        rowIndex: number,
        field: keyof WB6State['highLevelMeetingsSection']['timingMap'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            highLevelMeetingsSection: {
                ...prev.highLevelMeetingsSection,
                timingMap: prev.highLevelMeetingsSection.timingMap.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateMeetingAudit = (
        field: keyof WB6State['highLevelMeetingsSection']['executiveFootprintAudit'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            highLevelMeetingsSection: {
                ...prev.highLevelMeetingsSection,
                executiveFootprintAudit: {
                    ...prev.highLevelMeetingsSection.executiveFootprintAudit,
                    [field]: value
                }
            }
        }))
    }

    const updateMeetingTestRow = (
        rowIndex: number,
        field: keyof WB6State['highLevelMeetingsSection']['highLevelMeetingTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            highLevelMeetingsSection: {
                ...prev.highLevelMeetingsSection,
                highLevelMeetingTest: prev.highLevelMeetingsSection.highLevelMeetingTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveMeetingBlock = (blockLabel: string) => {
        markVisited(7)
        announceSave(`${blockLabel} guardado.`)
    }

    const updateCongruenceMapRow = (
        rowIndex: number,
        field: keyof WB6State['coherenceAlignmentSection']['congruenceMap'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            coherenceAlignmentSection: {
                ...prev.coherenceAlignmentSection,
                congruenceMap: prev.coherenceAlignmentSection.congruenceMap.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updatePerceptiveContradictionRow = (
        rowIndex: number,
        field: keyof WB6State['coherenceAlignmentSection']['perceptiveContradictions'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            coherenceAlignmentSection: {
                ...prev.coherenceAlignmentSection,
                perceptiveContradictions: prev.coherenceAlignmentSection.perceptiveContradictions.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updatePhraseSignalLabRow = (
        rowIndex: number,
        field: keyof WB6State['coherenceAlignmentSection']['phraseSignalLab'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            coherenceAlignmentSection: {
                ...prev.coherenceAlignmentSection,
                phraseSignalLab: prev.coherenceAlignmentSection.phraseSignalLab.map((row, index) =>
                    index === rowIndex ? { ...row, [field]: value } : row
                )
            }
        }))
    }

    const updateExpressiveTrafficLightRow = (
        rowIndex: number,
        field: keyof WB6State['coherenceAlignmentSection']['expressiveTrafficLight'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            coherenceAlignmentSection: {
                ...prev.coherenceAlignmentSection,
                expressiveTrafficLight: prev.coherenceAlignmentSection.expressiveTrafficLight.map((row, index) =>
                    index === rowIndex
                        ? {
                              ...row,
                              [field]:
                                  field === 'level'
                                      ? value === 'Verde' || value === 'Amarillo' || value === 'Rojo'
                                          ? value
                                          : ''
                                      : value
                          }
                        : row
                )
            }
        }))
    }

    const updateIncoherenceRepairProtocol = (
        field: keyof WB6State['coherenceAlignmentSection']['incoherenceRepairProtocol'],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            coherenceAlignmentSection: {
                ...prev.coherenceAlignmentSection,
                incoherenceRepairProtocol: {
                    ...prev.coherenceAlignmentSection.incoherenceRepairProtocol,
                    [field]: value
                }
            }
        }))
    }

    const updateCoherenceTestRow = (
        rowIndex: number,
        field: keyof WB6State['coherenceAlignmentSection']['coherenceTest'][number],
        value: string
    ) => {
        if (isLocked) return
        setState((prev) => ({
            ...prev,
            coherenceAlignmentSection: {
                ...prev.coherenceAlignmentSection,
                coherenceTest: prev.coherenceAlignmentSection.coherenceTest.map((row, index) =>
                    index === rowIndex
                        ? { ...row, [field]: field === 'verdict' ? ((value === 'yes' || value === 'no' ? value : '') as YesNoAnswer) : value }
                        : row
                )
            }
        }))
    }

    const saveCoherenceBlock = (blockLabel: string) => {
        markVisited(8)
        announceSave(`${blockLabel} guardado.`)
    }

    const isMentorEvaluationRowComplete = (row: MentorEvaluationRow) =>
        row.level !== '' && row.decision !== '' && row.evidence.trim().length > 0

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
        markVisited(9)
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
        markVisited(9)
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
            document.title = 'WB6 - Lenguaje verbal y no verbal de impacto'
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
            link.download = 'WB6-lenguaje-verbal-no-verbal-impacto-completo.html'
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

    const baselineScan = state.bodyLanguageSection.baselineScan
    const presenceMatrix = state.bodyLanguageSection.presenceMatrix
    const leakageTraffic = state.bodyLanguageSection.leakageTraffic
    const entryProtocol = state.bodyLanguageSection.entryProtocol
    const calmAuthorityPattern = state.bodyLanguageSection.calmAuthorityPattern
    const coherenceTest = state.bodyLanguageSection.coherenceTest
    const objectionCartography = state.objectionHandlingSection.cartography
    const objectionDiagnosis = state.objectionHandlingSection.diagnosis
    const objectionProtocol = state.objectionHandlingSection.protocol
    const objectionBridgeBank = state.objectionHandlingSection.bridgeBank
    const objectionReframeLab = state.objectionHandlingSection.reframeLab
    const objectionExecutiveTest = state.objectionHandlingSection.executiveTest
    const voiceBaseline = state.voiceToneSection.baseline
    const voiceCalibration = state.voiceToneSection.calibrationMatrix
    const voicePartiture = state.voiceToneSection.messagePartiture
    const voicePressureProtocol = state.voiceToneSection.pressureProtocol
    const voiceLadder = state.voiceToneSection.modulationLadder
    const voiceExecutiveTest = state.voiceToneSection.executiveImpactTest
    const pressureSignatureMap = state.pressureCommunicationSection.pressureSignatureMap
    const pressureDisorderMatrix = state.pressureCommunicationSection.communicationDisorderMatrix
    const pressureResponseProtocol = state.pressureCommunicationSection.responseProtocol
    const pressureShortMessageTemplate = state.pressureCommunicationSection.shortMessageTemplate
    const pressureSimulator = state.pressureCommunicationSection.pressureSimulator
    const pressureExecutiveTest = state.pressureCommunicationSection.executivePressureTest
    const meetingRoomReadingMap = state.highLevelMeetingsSection.roomReadingMap
    const meetingPositioningMatrix = state.highLevelMeetingsSection.positioningMatrix
    const meetingInterventionArchitecture = state.highLevelMeetingsSection.interventionArchitecture
    const meetingTimingMap = state.highLevelMeetingsSection.timingMap
    const meetingExecutiveFootprintAudit = state.highLevelMeetingsSection.executiveFootprintAudit
    const meetingHighLevelTest = state.highLevelMeetingsSection.highLevelMeetingTest
    const congruenceMap = state.coherenceAlignmentSection.congruenceMap
    const perceptiveContradictions = state.coherenceAlignmentSection.perceptiveContradictions
    const phraseSignalLab = state.coherenceAlignmentSection.phraseSignalLab
    const expressiveTrafficLight = state.coherenceAlignmentSection.expressiveTrafficLight
    const incoherenceRepairProtocol = state.coherenceAlignmentSection.incoherenceRepairProtocol
    const coherenceSectionTest = state.coherenceAlignmentSection.coherenceTest
    const evaluation = state.evaluation

    const baselineCompleted = baselineScan.every(
        (row) => row.observation.trim().length > 0 && row.effect.trim().length > 0
    )
    const presenceCompleted = presenceMatrix.every(
        (row) =>
            row.observableBehavior.trim().length > 0 &&
            row.presenceImpact !== '' &&
            row.concreteAdjustment.trim().length > 0
    )
    const leakageCompleted = leakageTraffic.every(
        (row) =>
            row.signal.trim().length > 0 &&
            row.level !== '' &&
            row.whenAppears.trim().length > 0 &&
            row.generatedReading.trim().length > 0
    )
    const entryCompleted = Object.values(entryProtocol).every((value) => value.trim().length > 0)
    const authorityPatternCompleted = Object.values(calmAuthorityPattern).every((value) => value.trim().length > 0)
    const coherenceCompleted = coherenceTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)

    const atLeastOneConcreteAdjustment = presenceMatrix.some((row) => row.concreteAdjustment.trim().length > 0)
    const bodySectionMinimal = baselineCompleted && atLeastOneConcreteAdjustment
    const bodySectionCompleted =
        baselineCompleted &&
        presenceCompleted &&
        leakageCompleted &&
        entryCompleted &&
        authorityPatternCompleted &&
        coherenceCompleted

    const observableBodyKeywords = [
        'mirada',
        'hombro',
        'postura',
        'pies',
        'manos',
        'mandíbula',
        'respiración',
        'cuerpo',
        'gesto',
        'torso',
        'cuello',
        'movimiento',
        'base'
    ]
    const emotionalOnlyWords = ['ansiedad', 'miedo', 'nervios', 'frustración', 'inseguridad', 'estrés', 'me siento']
    const baselineLooksAbstract = baselineScan.some((row) => {
        const text = row.observation.trim().toLowerCase()
        if (text.length === 0) return false
        const hasObservable = observableBodyKeywords.some((keyword) => text.includes(keyword))
        const hasEmotional = emotionalOnlyWords.some((keyword) => text.includes(keyword))
        return !hasObservable || hasEmotional
    })

    const concreteAdjustmentKeywords = ['pies', 'hombros', 'torso', 'mirada', 'manos', 'mandíbula', 'respira', 'postura', 'cuerpo']
    const adjustmentsTooAbstract = presenceMatrix
        .filter((row) => row.concreteAdjustment.trim().length > 0)
        .some((row) => !concreteAdjustmentKeywords.some((keyword) => row.concreteAdjustment.toLowerCase().includes(keyword)))

    const entryProtocolMissing = Object.values(entryProtocol).every((value) => value.trim().length === 0)
    const missingListeningInPattern = calmAuthorityPattern.listeningBody.trim().length === 0

    const baselineMapByDimension = baselineScan.reduce<Record<string, { observation: string; effect: string }>>((acc, row) => {
        acc[row.dimension] = { observation: row.observation.trim(), effect: row.effect.trim() }
        return acc
    }, {})

    const isObjectionCartographyRowComplete = (row: WB6State['objectionHandlingSection']['cartography'][number]) =>
        row.objection.trim().length > 0 &&
        row.objectionType !== '' &&
        row.whatActivatedMe.trim().length > 0 &&
        row.response.trim().length > 0 &&
        row.responseEffect.trim().length > 0 &&
        row.betterResponse.trim().length > 0

    const objectionCartographyCompleted = objectionCartography.every((row) => isObjectionCartographyRowComplete(row))
    const objectionDiagnosisCompleted = Object.values(objectionDiagnosis).every((value) => value.trim().length > 0)
    const objectionProtocolCompleted = Object.values(objectionProtocol).every((value) => value.trim().length > 0)
    const objectionBridgeCompleted = objectionBridgeBank.every((row) => row.bridgeResponse.trim().length > 0)
    const objectionReframeCompleted = objectionReframeLab.every(
        (row) =>
            row.originalObjection.trim().length > 0 &&
            row.usefulReframe.trim().length > 0 &&
            row.proposalImprovement.trim().length > 0
    )
    const objectionExecutiveTestCompleted = objectionExecutiveTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const oneCartographyComplete = objectionCartography.some((row) => isObjectionCartographyRowComplete(row))
    const objectionSectionMinimal = oneCartographyComplete && objectionProtocolCompleted
    const objectionSectionCompleted =
        objectionCartographyCompleted &&
        objectionDiagnosisCompleted &&
        objectionProtocolCompleted &&
        objectionBridgeCompleted &&
        objectionReframeCompleted &&
        objectionExecutiveTestCompleted

    const objectionMissingTypeBeforeResponse = objectionCartography.some(
        (row) => row.objection.trim().length > 0 && row.response.trim().length > 0 && row.objectionType === ''
    )

    const focalResponseWordCount = objectionProtocol.focalResponse.trim().split(/\s+/).filter(Boolean).length
    const focalResponseTooLong = focalResponseWordCount > 32
    const objectionProtocolHasContent = Object.values(objectionProtocol).some((value) => value.trim().length > 0)
    const objectionMissingAdvanceVerification =
        objectionProtocolHasContent && objectionProtocol.advanceVerification.trim().length === 0
    const objectionReframeWithoutImprovement = objectionReframeLab.some(
        (row) =>
            row.originalObjection.trim().length > 0 &&
            row.usefulReframe.trim().length > 0 &&
            row.proposalImprovement.trim().length === 0
    )

    const voiceBaselineCompleted = voiceBaseline.every(
        (row) => row.observation.trim().length > 0 && row.effect.trim().length > 0
    )
    const voiceCalibrationCompleted = voiceCalibration.every(
        (row) =>
            row.observablePattern.trim().length > 0 &&
            row.impact !== '' &&
            row.concreteAdjustment.trim().length > 0
    )
    const voicePartitureCompleted = Object.values(voicePartiture).every((value) => value.trim().length > 0)
    const voicePressureCompleted = Object.values(voicePressureProtocol).every((value) => value.trim().length > 0)
    const voiceLadderCompleted = voiceLadder.every(
        (row) =>
            row.tone.trim().length > 0 &&
            row.speed.trim().length > 0 &&
            row.volume.trim().length > 0 &&
            row.pauses.trim().length > 0 &&
            row.emphasis.trim().length > 0
    )
    const voiceExecutiveTestCompleted = voiceExecutiveTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const voiceAtLeastOneAdjustment = voiceCalibration.some((row) => row.concreteAdjustment.trim().length > 0)
    const voiceSectionMinimal = voiceBaselineCompleted && voiceAtLeastOneAdjustment
    const voiceSectionCompleted =
        voiceBaselineCompleted &&
        voiceCalibrationCompleted &&
        voicePartitureCompleted &&
        voicePressureCompleted &&
        voiceLadderCompleted &&
        voiceExecutiveTestCompleted

    const vocalObservableKeywords = [
        'tono',
        'velocidad',
        'ritmo',
        'volumen',
        'pausa',
        'articul',
        'énfasis',
        'cadencia',
        'cierre',
        'frase',
        'respir',
        'voz'
    ]
    const voiceEmotionWords = ['ansiedad', 'miedo', 'nervios', 'frustración', 'inseguridad', 'estrés', 'me siento']
    const voiceBaselineLooksAbstract = voiceBaseline.some((row) => {
        const text = row.observation.trim().toLowerCase()
        if (text.length === 0) return false
        const hasObservable = vocalObservableKeywords.some((keyword) => text.includes(keyword))
        const hasEmotional = voiceEmotionWords.some((keyword) => text.includes(keyword))
        return !hasObservable || hasEmotional
    })

    const voiceAnchorWordsMissing = voicePartiture.baseMessage.trim().length > 0 && voicePartiture.anchorWords.trim().length === 0
    const voiceActionKeywords = ['pausa', 'tono', 'respira', 'respiración', 'velocidad', 'volumen', 'exhala', 'cadencia']
    const voiceProtocolActionTooAbstract =
        voicePressureProtocol.regulationAction.trim().length > 0 &&
        !voiceActionKeywords.some((keyword) => voicePressureProtocol.regulationAction.toLowerCase().includes(keyword))

    const voiceLadderSignatures = voiceLadder
        .filter((row) => [row.tone, row.speed, row.volume, row.pauses, row.emphasis].some((value) => value.trim().length > 0))
        .map((row) => `${row.tone}::${row.speed}::${row.volume}::${row.pauses}::${row.emphasis}`)
    const voiceLadderSameAcrossContexts =
        voiceLadderSignatures.length >= 2 && new Set(voiceLadderSignatures).size === 1

    const pressureSignatureCompleted = Object.values(pressureSignatureMap).every((value) => value.trim().length > 0)
    const pressureDisorderCompleted = pressureDisorderMatrix.every(
        (row) =>
            row.underPressure.trim().length > 0 &&
            row.generatedReading.trim().length > 0 &&
            row.regulatoryAdjustment.trim().length > 0
    )
    const pressureResponseCompleted = Object.values(pressureResponseProtocol).every((value) => value.trim().length > 0)
    const pressureShortMessageCompleted = Object.values(pressureShortMessageTemplate).every((value) => value.trim().length > 0)
    const pressureSimulatorCompleted = Object.values(pressureSimulator).every((value) => value.trim().length > 0)
    const pressureExecutiveTestCompleted = pressureExecutiveTest.every(
        (row) => row.verdict !== '' && row.adjustment.trim().length > 0
    )

    const pressureSectionMinimal = pressureSignatureCompleted && pressureResponseCompleted
    const pressureSectionCompleted =
        pressureSignatureCompleted &&
        pressureDisorderCompleted &&
        pressureResponseCompleted &&
        pressureShortMessageCompleted &&
        pressureSimulatorCompleted &&
        pressureExecutiveTestCompleted

    const pressureObservableKeywords = ['voz', 'tono', 'ritmo', 'velocidad', 'pausa', 'escucha', 'secuencia', 'síntesis', 'mensaje', 'cuerpo']
    const pressureEmotionWords = ['ansiedad', 'miedo', 'frustración', 'estrés', 'nervios', 'inseguridad', 'me sentí']
    const pressureSignatureLooksAbstract = [
        pressureSignatureMap.visibleCommunicationShift,
        pressureSignatureMap.automaticPattern
    ].some((value) => {
        const text = value.trim().toLowerCase()
        if (text.length === 0) return false
        const hasObservable = pressureObservableKeywords.some((keyword) => text.includes(keyword))
        const hasEmotion = pressureEmotionWords.some((keyword) => text.includes(keyword))
        return !hasObservable || hasEmotion
    })

    const pressurePauseKeywords = ['pausa', 'exhala', 'respira', 'silencio', 'segundo']
    const pressureProtocolMissingPause =
        pressureResponseProtocol.functionalPause.trim().length > 0 &&
        !pressurePauseKeywords.some((keyword) => pressureResponseProtocol.functionalPause.toLowerCase().includes(keyword))

    const pressureMessageMissingDirection =
        pressureShortMessageTemplate.direction.trim().length > 0 &&
        !['decidir', 'hacer', 'siguiente', 'accion', 'acción', 'priorizar', 'revisar', 'definir'].some((keyword) =>
            pressureShortMessageTemplate.direction.toLowerCase().includes(keyword)
        )

    const pressureSimulatorMissingRecovery =
        pressureSimulator.probableCriticalScenario.trim().length > 0 &&
        pressureSimulator.recoveryAction.trim().length === 0

    const meetingReadingCompleted = Object.values(meetingRoomReadingMap).every((value) => value.trim().length > 0)
    const meetingPositioningCompleted =
        meetingPositioningMatrix.primaryRole.trim().length > 0 &&
        meetingPositioningMatrix.visibilityLevel !== '' &&
        meetingPositioningMatrix.expectedContributionType.trim().length > 0 &&
        meetingPositioningMatrix.overtalkingRisk.trim().length > 0 &&
        meetingPositioningMatrix.undertalkingRisk.trim().length > 0 &&
        meetingPositioningMatrix.desiredPresenceSignal.trim().length > 0
    const meetingArchitectureCompleted = Object.values(meetingInterventionArchitecture).every((value) => value.trim().length > 0)
    const meetingTimingCompleted = meetingTimingMap.every((row) => row.plannedAction.trim().length > 0)
    const meetingAuditCompleted = Object.values(meetingExecutiveFootprintAudit).every((value) => value.trim().length > 0)
    const meetingTestCompleted = meetingHighLevelTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)

    const meetingSectionMinimal = meetingReadingCompleted && meetingArchitectureCompleted
    const meetingSectionCompleted =
        meetingReadingCompleted &&
        meetingPositioningCompleted &&
        meetingArchitectureCompleted &&
        meetingTimingCompleted &&
        meetingAuditCompleted &&
        meetingTestCompleted

    const meetingDefinedAudienceWithoutDecision =
        (meetingRoomReadingMap.dominantLanguage.trim().length > 0 ||
            meetingRoomReadingMap.mainTension.trim().length > 0 ||
            meetingRoomReadingMap.highestValueContributionPoint.trim().length > 0) &&
        meetingRoomReadingMap.realDecisionMaker.trim().length === 0
    const meetingArchitectureMissingThesis =
        meetingInterventionArchitecture.briefOpening.trim().length > 0 &&
        meetingInterventionArchitecture.centralThesis.trim().length === 0
    const meetingTimingNotDifferentiated =
        meetingTimingMap[0]?.plannedAction.trim().length > 0 &&
        meetingTimingMap[1]?.plannedAction.trim().length > 0 &&
        meetingTimingMap[0].plannedAction.trim().toLowerCase() === meetingTimingMap[1].plannedAction.trim().toLowerCase()
    const meetingAuditMissingPerception =
        (meetingExecutiveFootprintAudit.entryQuality.trim().length > 0 ||
            meetingExecutiveFootprintAudit.spaceSustainment.trim().length > 0 ||
            meetingExecutiveFootprintAudit.realContribution.trim().length > 0) &&
        meetingExecutiveFootprintAudit.likelyPerception.trim().length === 0

    const congruenceMapCompleted = congruenceMap.every(
        (row) => row.intendedMessage.trim().length > 0 && row.perceivedSignal.trim().length > 0
    )
    const perceptiveContradictionsCompleted = perceptiveContradictions.every(
        (row) =>
            row.verbalStatement.trim().length > 0 &&
            row.contradictorySignal.trim().length > 0 &&
            row.likelyReading.trim().length > 0 &&
            row.priorityAdjustment.trim().length > 0
    )
    const phraseSignalLabCompleted = phraseSignalLab.every(
        (row) =>
            row.keyPhrase.trim().length > 0 &&
            row.installedIdea.trim().length > 0 &&
            row.neededTone.trim().length > 0 &&
            row.supportingPostureOrGesture.trim().length > 0 &&
            row.whatToAvoid.trim().length > 0
    )
    const expressiveTrafficCompleted = expressiveTrafficLight.every(
        (row) =>
            row.signal.trim().length > 0 &&
            row.level !== '' &&
            row.whenAppears.trim().length > 0 &&
            row.requiredAdjustment.trim().length > 0
    )
    const incoherenceRepairCompleted = Object.values(incoherenceRepairProtocol).every((value) => value.trim().length > 0)
    const coherenceTestCompleted = coherenceSectionTest.every((row) => row.verdict !== '' && row.adjustment.trim().length > 0)

    const hasAtLeastOneContradictionWithAdjustment = perceptiveContradictions.some(
        (row) => row.verbalStatement.trim().length > 0 && row.priorityAdjustment.trim().length > 0
    )
    const coherenceSectionMinimal =
        hasAtLeastOneContradictionWithAdjustment &&
        (incoherenceRepairProtocol.bodyCorrection.trim().length > 0 || incoherenceRepairProtocol.vocalCorrection.trim().length > 0)
    const coherenceSectionCompleted =
        congruenceMapCompleted &&
        perceptiveContradictionsCompleted &&
        phraseSignalLabCompleted &&
        expressiveTrafficCompleted &&
        incoherenceRepairCompleted &&
        coherenceTestCompleted

    const coherenceObservableKeywords = [
        'postura',
        'mirada',
        'tono',
        'ritmo',
        'voz',
        'gesto',
        'cuerpo',
        'rostro',
        'energía',
        'mandíbula',
        'hombros',
        'volumen'
    ]
    const coherenceMapMissingObservables = congruenceMap.some((row) => {
        const text = row.perceivedSignal.trim().toLowerCase()
        if (text.length === 0) return false
        return !coherenceObservableKeywords.some((keyword) => text.includes(keyword))
    })
    const abstractContradictions = perceptiveContradictions.some((row) => {
        const text = row.contradictorySignal.trim().toLowerCase()
        if (text.length === 0) return false
        return !coherenceObservableKeywords.some((keyword) => text.includes(keyword))
    })
    const repairMissingBodyOrVoice =
        Object.values(incoherenceRepairProtocol).some((value) => value.trim().length > 0) &&
        (incoherenceRepairProtocol.bodyCorrection.trim().length === 0 || incoherenceRepairProtocol.vocalCorrection.trim().length === 0)
    const coherenceLowWithoutPriorityAdjustment =
        coherenceSectionTest.some((row) => row.verdict === 'no') &&
        perceptiveContradictions.every((row) => row.priorityAdjustment.trim().length === 0)

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

    const pageCompletionMap: Record<WorkbookPageId, boolean> = {
        1: state.identification.leaderName.trim().length > 0 && state.identification.role.trim().length > 0,
        2: true,
        3: bodySectionCompleted,
        4: objectionSectionCompleted,
        5: voiceSectionCompleted,
        6: pressureSectionCompleted,
        7: meetingSectionCompleted,
        8: coherenceSectionCompleted,
        9: evaluationSectionComplete
    }

    const completedPages = PAGES.filter((page) => pageCompletionMap[page.id]).length
    const progressPercent = Math.round((completedPages / PAGES.length) * 100)
    const printMetaLabel = `Líder: ${state.identification.leaderName || 'Sin nombre'} · Rol: ${state.identification.role || 'Sin rol'}`

    const isPageVisible = (pageId: WorkbookPageId) => isExportingAll || activePage === pageId

    return (
        <div className={WORKBOOK_V2_EDITORIAL.classes.shell}>
            <header className={`wb6-toolbar ${WORKBOOK_V2_EDITORIAL.classes.toolbar}`}>
                <div className={WORKBOOK_V2_EDITORIAL.classes.toolbarInner}>
                    <Link href="/dashboard/aprendizaje/workbooks-v2" className={WORKBOOK_V2_EDITORIAL.classes.backButton}>
                        <ArrowLeft size={14} />
                        Volver
                    </Link>

                    <div className="mr-auto">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-500">{WORKBOOK_V2_EDITORIAL.labels.workbookTag}</p>
                        <p className="text-sm md:text-base font-extrabold text-slate-900">WB6 - Lenguaje verbal y no verbal de impacto</p>
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
                    <aside className={`wb6-sidebar ${WORKBOOK_V2_EDITORIAL.classes.sidebar} ${isExportingAll ? 'hidden' : ''}`}>
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
                                className="wb6-print-page wb6-cover-page rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 1 de 9"
                                data-print-title="Portada e identificación"
                                data-print-meta={printMetaLabel}
                            >
                                <div className="wb6-cover-hero relative min-h-[56vh] md:min-h-[62vh] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#f8fbff] to-[#eaf1fb]">
                                    <div className="absolute inset-x-0 top-[58%] h-px bg-blue-200" />
                                    <div className="relative text-center max-w-3xl">
                                        <div className="mx-auto mb-7 w-24 h-24 md:w-28 md:h-28 bg-white rounded-sm border border-slate-200 flex items-center justify-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                            <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-16 w-16 md:h-20 md:w-20" />
                                        </div>
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                            Lenguaje verbal y no verbal de impacto
                                        </h1>
                                        <p className="mt-4 text-blue-800 font-semibold">Workbook 6</p>
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
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 2 de 9"
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
                                        Fortalecer la presencia ejecutiva del líder en entornos presenciales, virtuales e híbridos, desarrollando mayor coherencia entre lenguaje verbal y no verbal, control del tono y ritmo, capacidad de comunicar bajo presión y manejo de objeciones con claridad y aplomo.
                                    </p>
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
                                                'Escucha Activa y Empática.',
                                                'Adaptabilidad Comunicativa.',
                                                'Construcción de confianza (Trust).',
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
                                            'Lee a su audiencia y ajusta su estilo y lenguaje (ej. técnico vs. estratégico) según el interlocutor.',
                                            'Identifica señales no verbales en los demás y modifica el ritmo o enfoque de su mensaje para mantener la sintonía y asegurar que el mensaje sea aceptado.',
                                            'Apela a valores e ideales compartidos para generar una voluntad genuina de colaboración en el equipo.',
                                            'Proyecta la misma gravitas y calidez en videoconferencias que en persona.',
                                            'Gestiona su reputación y narrativa en plataformas digitales de forma estratégica.',
                                            'Utiliza persuasión racional basada en datos, hechos y criterio, no en amenaza o imposición.',
                                            'Trata a los demás con respeto y genera una atmósfera de seguridad conversacional.',
                                            'Comunica de manera oportuna y honesta, incluso cuando hay tensión o malas noticias.',
                                            'Deja que otros se expresen sin interrumpir y demuestra con gestos y preguntas que escucha atentamente.',
                                            'Reconoce la perspectiva del otro, incluso cuando no coincide con la suya.'
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
                                            'Tu cuerpo, tu voz y tus palabras deben decir lo mismo.',
                                            'Bajo presión, primero regula presencia; después responde.',
                                            'No confundas autoridad con rigidez ni calma con pasividad.',
                                            'En espacios de alto nivel, menos dispersión y más intención.',
                                            'Si tu forma contradice tu mensaje, la audiencia creerá a la forma.',
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
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 3 de 9"
                                data-print-title="Lenguaje corporal ejecutivo"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 3</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Lenguaje corporal ejecutivo
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Desarrolla una presencia corporal ejecutiva clara, estable y congruente para proyectar seguridad tranquila, autoridad sin
                                        rigidez y mayor capacidad de sostener atención, confianza y credibilidad.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Lenguaje corporal ejecutivo: señales posturales, gestuales, espaciales y visuales que impactan percepción de seguridad, claridad y autoridad.',
                                            'Alineación corporal: coherencia entre postura, mirada, manos, rostro, respiración y dirección del cuerpo.',
                                            'Anclaje postural: base estable desde pies, pelvis, columna y hombros.',
                                            'Apertura corporal: disposición visible que comunica receptividad y confianza.',
                                            'Microconductas no verbales: señales pequeñas de alto impacto (tocarse la cara, cerrar hombros, mover pies, tensión mandibular).',
                                            'Proxémica ejecutiva: uso de espacio, distancia y orientación corporal.',
                                            'Mirada funcional: contacto visual intencional para sostener presencia y marcar ideas.',
                                            'Regulación somática visible: estabilidad observable bajo tensión.',
                                            'Gravitas corporal: solidez y aplomo sin dureza excesiva.',
                                            'Fuga corporal: señales involuntarias que restan credibilidad.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Escaneo de línea base corporal</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
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
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Trabaja con una situación real (reunión, presentación o conversación clave). Observa primero cómo llega tu cuerpo antes de
                                            intentar corregirlo.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Registra hechos visibles: base, hombros, mirada, manos, rostro y movimiento, junto con su efecto probable en otros.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión corporal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que observo en mí hoy</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto probable en otros</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {baselineScan.map((row, rowIndex) => (
                                                    <tr key={`wb6-baseline-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observation}
                                                                onChange={(event) => updateBaselineScanRow(rowIndex, 'observation', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Conducta observable"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.effect}
                                                                onChange={(event) => updateBaselineScanRow(rowIndex, 'effect', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Lectura probable en otros"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {baselineLooksAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe conductas visibles (mirada, hombros, manos, postura, movimiento), no solo emociones.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>

                                    {(showBodySketch || isExportingAll) && (
                                        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                                            <h4 className="text-sm md:text-base font-bold text-slate-900">Croquis de señales corporales registradas</h4>
                                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
                                                <div className="rounded-xl border border-blue-200 bg-white p-4">
                                                    <svg viewBox="0 0 240 360" className="w-full h-auto" aria-label="Croquis corporal">
                                                        <circle cx="120" cy="46" r="24" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="2" />
                                                        <line x1="120" y1="70" x2="120" y2="210" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="70" y1="110" x2="170" y2="110" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="120" y1="210" x2="88" y2="300" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="120" y1="210" x2="152" y2="300" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="88" y1="300" x2="74" y2="335" stroke="#1d4ed8" strokeWidth="3" />
                                                        <line x1="152" y1="300" x2="166" y2="335" stroke="#1d4ed8" strokeWidth="3" />
                                                        <circle cx="120" cy="82" r="5" fill="#1d4ed8" />
                                                        <circle cx="120" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="120" cy="145" r="5" fill="#1d4ed8" />
                                                        <circle cx="82" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="158" cy="110" r="5" fill="#1d4ed8" />
                                                        <circle cx="86" cy="306" r="5" fill="#1d4ed8" />
                                                        <circle cx="154" cy="306" r="5" fill="#1d4ed8" />
                                                    </svg>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {BASELINE_DIMENSIONS.map((dimension) => {
                                                        const mapped = baselineMapByDimension[dimension]
                                                        return (
                                                            <div key={`wb6-body-sketch-${dimension}`} className="rounded-xl border border-blue-200 bg-white p-3">
                                                                <p className="text-xs uppercase tracking-[0.12em] text-blue-700 font-semibold">{dimension}</p>
                                                                <p className="mt-1 text-sm text-slate-700">{mapped?.observation || 'Sin observación.'}</p>
                                                                <p className="mt-1 text-xs text-slate-500">{mapped?.effect || 'Sin efecto registrado.'}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </article>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de presencia corporal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    presenceCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {presenceCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Convierte observación en criterio: identifica conducta observable, evalúa si suma o resta presencia y define un ajuste
                                            corporal concreto.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1060px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Conducta actual observable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Suma o resta presencia?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste corporal concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {presenceMatrix.map((row, rowIndex) => (
                                                    <tr key={`wb6-presence-row-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observableBehavior}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'observableBehavior', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Conducta visible"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.presenceImpact}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'presenceImpact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Suma">Suma</option>
                                                                <option value="Resta">Resta</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteAdjustment}
                                                                onChange={(event) => updatePresenceMatrixRow(rowIndex, 'concreteAdjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste corporal específico"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {adjustmentsTooAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: haz el ajuste más corporal y concreto (pies, hombros, mirada, manos, postura, respiración).
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Semáforo de fugas corporales</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    leakageCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {leakageCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Clasifica señales corporales en verde, amarillo o rojo según su impacto bajo presión para anticipar correcciones antes de que
                                            resten credibilidad.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal corporal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cuándo aparece</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué lectura puede generar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leakageTraffic.map((row, rowIndex) => (
                                                    <tr key={`wb6-leakage-row-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.signal}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'signal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Verde">Verde</option>
                                                                <option value="Amarillo">Amarillo</option>
                                                                <option value="Rojo">Rojo</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whenAppears}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'whenAppears', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.generatedReading}
                                                                onChange={(event) => updateLeakageTrafficRow(rowIndex, 'generatedReading', event.target.value)}
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
                                            onClick={() => saveBodyLanguageBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Protocolo de entrada corporal a espacios ejecutivos</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    entryCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {entryCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Diseña tu entrada corporal antes de hablar: cómo entras, cómo te ubicas, cómo tomas el espacio y qué señal de presencia dejas
                                            instalada.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Mi entrada corporal ideal es</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.idealEntry}
                                                onChange={(event) => updateEntryProtocol('idealEntry', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Mi forma de ubicarme en el espacio será</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.positioning}
                                                onChange={(event) => updateEntryProtocol('positioning', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Mi criterio para ocupar el espacio será</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.spaceCriteria}
                                                onChange={(event) => updateEntryProtocol('spaceCriteria', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Manos, mirada y dispositivos en los primeros 20 segundos</span>
                                            <textarea
                                                rows={2}
                                                value={entryProtocol.first20Seconds}
                                                onChange={(event) => updateEntryProtocol('first20Seconds', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. La señal corporal que quiero dejar instalada es</span>
                                            <input
                                                type="text"
                                                value={entryProtocol.signalToInstall}
                                                onChange={(event) => updateEntryProtocol('signalToInstall', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {entryProtocolMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define cómo entrarás y tomarás el espacio antes de hablar.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Patrón corporal de autoridad tranquila</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    authorityPatternCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {authorityPatternCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define tu patrón corporal estándar para cuatro momentos: cuando estás centrado, cuando escuchas, cuando aparece objeción y
                                            cuando necesitas volver al centro.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Cuando estoy centrado, mi cuerpo se ve así</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.centeredBody}
                                                onChange={(event) => updateCalmAuthorityPattern('centeredBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Cuando escucho, mi cuerpo se ve así</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.listeningBody}
                                                onChange={(event) => updateCalmAuthorityPattern('listeningBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Cuando aparece una objeción, mi cuerpo debe hacer esto</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.objectionBody}
                                                onChange={(event) => updateCalmAuthorityPattern('objectionBody', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Si detecto una fuga corporal, vuelvo al centro haciendo esto</span>
                                            <textarea
                                                rows={2}
                                                value={calmAuthorityPattern.returnToCenter}
                                                onChange={(event) => updateCalmAuthorityPattern('returnToCenter', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {missingListeningInPattern && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: incluye explícitamente cómo se ve tu cuerpo cuando escuchas, no solo cuando hablas.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveBodyLanguageBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de coherencia corporal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowBodyExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
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
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa una reunión reciente o simulación. Marca desde evidencia si tu cuerpo reforzó el mensaje o lo contradijo en momentos
                                            críticos.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coherenceTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-row-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateBodyLanguageCoherenceTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateBodyLanguageCoherenceTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateBodyLanguageCoherenceTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
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
                                            onClick={() => saveBodyLanguageBlock('Paso 6')}
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
                                            'Qué señales corporales hoy fortalecen mi presencia.',
                                            'Qué fugas no verbales debilitan mi autoridad.',
                                            'Cómo entro y tomo el espacio en contextos ejecutivos.',
                                            'Qué patrón corporal quiero instalar como estándar.',
                                            'Cómo hacer que mi cuerpo acompañe y no contradiga mi mensaje.'
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
                                                bodySectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : bodySectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {bodySectionCompleted
                                                ? 'Sección completada'
                                                : bodySectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
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
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 8 de 9"
                                data-print-title="Manejo de objeciones"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 8</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Manejo de objeciones</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Responde objeciones con claridad, estabilidad y criterio para sostener presencia ejecutiva, proteger la confianza
                                        conversacional y convertir fricción en precisión y avance.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Objeción: duda, resistencia, desacuerdo, riesgo percibido o falta de claridad frente a una propuesta.',
                                            'Manejo de objeciones: recibir, leer, ordenar y responder sin defensividad.',
                                            'Tipos de objeción: contenido, proceso, confianza e identidad/estatus.',
                                            'Carga emocional: nivel de tensión afectiva que acompaña el cuestionamiento.',
                                            'Escucha desagregada: separar lo factual, lo emocional y lo político.',
                                            'Respuesta puente: intervención breve para estabilizar antes de argumentar.',
                                            'Reencuadre: convertir objeción en criterio útil o condición de calidad.',
                                            'Verificación de avance: confirmar si la objeción quedó atendida o cambió de forma.'
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
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Cartografía de objeciones recurrentes</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowObjectionExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    objectionCartographyCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {objectionCartographyCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Trabaja con situaciones reales de los últimos 20 días (reuniones de alto nivel, presentaciones, conversaciones con sponsor
                                            o momentos en los que una objeción te desordenó).
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Antes de responder, registra la objeción y su impacto con hechos observables:
                                        </p>
                                        <ul className="space-y-2">
                                            {[
                                                'Objeción concreta recibida.',
                                                'Tipo de objeción (contenido, proceso, confianza o estatus).',
                                                'Qué activó en ti y cómo respondiste.',
                                                'Qué efecto produjo tu respuesta.',
                                                'Qué habría sido más efectivo.'
                                            ].map((item) => (
                                                <li key={`wb6-obj-step1-instruction-${item}`} className="text-sm text-slate-700 flex items-start gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1320px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objeción concreta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tipo de objeción</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué activó en mí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cómo respondí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto de mi respuesta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué habría sido más efectivo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionCartography.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-cartography-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.objection}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'objection', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.objectionType}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'objectionType', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona tipo</option>
                                                                {OBJECTION_TYPES.map((option) => (
                                                                    <option key={`wb6-objection-type-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatActivatedMe}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'whatActivatedMe', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.response}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'response', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.responseEffect}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'responseEffect', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.betterResponse}
                                                                onChange={(event) => updateObjectionCartographyRow(rowIndex, 'betterResponse', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {objectionMissingTypeBeforeResponse && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: clasifica primero la objeción (contenido, proceso, confianza o estatus) antes de responder.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Diagnóstico de la objeción</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep2(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Escucha la objeción en tres capas para no responder en automático: capa explícita (lo que dijo), capa emocional (cómo lo dijo)
                                            y capa de fondo (qué riesgo/interés protege).
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define también cuál capa responderás primero para ganar avance conversacional.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Lo que dijo literalmente</span>
                                            <textarea
                                                rows={2}
                                                value={objectionDiagnosis.literal}
                                                onChange={(event) => updateObjectionDiagnosis('literal', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué emoción o intensidad acompañaba la objeción</span>
                                            <textarea
                                                rows={2}
                                                value={objectionDiagnosis.emotionalIntensity}
                                                onChange={(event) => updateObjectionDiagnosis('emotionalIntensity', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Qué podría estar protegiendo realmente</span>
                                            <textarea
                                                rows={2}
                                                value={objectionDiagnosis.whatItProtects}
                                                onChange={(event) => updateObjectionDiagnosis('whatItProtects', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Capa que debo responder primero</span>
                                            <input
                                                type="text"
                                                value={objectionDiagnosis.firstLayerToRespond}
                                                onChange={(event) => updateObjectionDiagnosis('firstLayerToRespond', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Protocolo ejecutivo de respuesta</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep3(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Usa esta secuencia para responder con estabilidad: recibir, aclarar, reconocer, responder y verificar avance.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            El foco es no sobrerreaccionar: primero ordenas la conversación y luego argumentas.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">1. Recibiré la objeción así</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.receive}
                                                onChange={(event) => updateObjectionProtocol('receive', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">2. Mi pregunta de aclaración será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.clarificationQuestion}
                                                onChange={(event) => updateObjectionProtocol('clarificationQuestion', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">3. Mi reconocimiento será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.recognition}
                                                onChange={(event) => updateObjectionProtocol('recognition', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">4. Mi respuesta focal será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.focalResponse}
                                                onChange={(event) => updateObjectionProtocol('focalResponse', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">5. Mi verificación de avance será</span>
                                            <textarea
                                                rows={2}
                                                value={objectionProtocol.advanceVerification}
                                                onChange={(event) => updateObjectionProtocol('advanceVerification', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {focalResponseTooLong && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: reduce la respuesta focal a una idea central y un criterio claro.
                                        </p>
                                    )}
                                    {objectionMissingAdvanceVerification && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: incluye cómo comprobarás si la objeción quedó atendida.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Banco de respuestas puente</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep4(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Diseña respuestas puente para estabilizar la interacción antes de ir al fondo técnico.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Una buena respuesta puente baja fricción, aumenta precisión y evita responder desde defensividad.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Escenario</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Mi respuesta puente</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionBridgeBank.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-bridge-${row.scenario}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.scenario}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.bridgeResponse}
                                                                onChange={(event) => updateObjectionBridgeRow(rowIndex, 'bridgeResponse', event.target.value)}
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
                                            onClick={() => saveObjectionBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Laboratorio de reencuadre</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep5(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Convierte objeciones en información útil: criterio, condición de calidad, pregunta clave o mejora del planteamiento.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Si el reencuadre no mejora tu propuesta, todavía no capturaste el valor de la objeción.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Objeción original</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Reencuadre útil</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué mejora en mi propuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionReframeLab.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-reframe-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.originalObjection}
                                                                onChange={(event) => updateObjectionReframeRow(rowIndex, 'originalObjection', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.usefulReframe}
                                                                onChange={(event) => updateObjectionReframeRow(rowIndex, 'usefulReframe', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.proposalImprovement}
                                                                onChange={(event) => updateObjectionReframeRow(rowIndex, 'proposalImprovement', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {objectionReframeWithoutImprovement && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: aclara qué criterio útil o mejora concreta te deja esa objeción.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveObjectionBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de manejo ejecutivo de objeciones</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep6(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Aplica este test sobre una conversación reciente o una simulación para evaluar claridad, estabilidad y avance real.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            No marques desde intención: marca desde evidencia observable de cómo respondiste.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {objectionExecutiveTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-objection-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateObjectionExecutiveTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-objection-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateObjectionExecutiveTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateObjectionExecutiveTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
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
                                            onClick={() => saveObjectionBlock('Paso 6')}
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
                                            'Qué tipos de objeciones enfrento con más frecuencia.',
                                            'Qué capa de la objeción debo leer antes de responder.',
                                            'Cómo usar una secuencia más ejecutiva y menos reactiva.',
                                            'Cómo transformar objeciones en criterios útiles.',
                                            'Cómo sostener autoridad sin perder escucha ni confianza.'
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
                                                objectionSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : objectionSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {objectionSectionCompleted
                                                ? 'Sección completada'
                                                : objectionSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(4)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 8
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(5) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 4 de 9"
                                data-print-title="Tono y ritmo de voz"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 4</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Tono y ritmo de voz</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Fortalece el uso estratégico de la voz para proyectar claridad, calma, autoridad y control conversacional, regulando tono,
                                        ritmo, pausas y énfasis en contextos ejecutivos.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Tono basal: frecuencia vocal predominante que influye en percepción de seguridad o tensión.',
                                            'Rango tonal: amplitud de variación para evitar monotonía o dramatización.',
                                            'Ritmo ejecutivo y cadencia: velocidad y continuidad que facilitan comprensión.',
                                            'Pausa funcional: silencio intencional para enfatizar, ordenar y respirar.',
                                            'Énfasis vocal: acentuación de palabras clave para jerarquizar ideas.',
                                            'Volumen operativo y articulación: presencia suficiente y pronunciación clara.',
                                            'Prosodia ejecutiva: integración de tono, ritmo, pausas y acentos con dirección.',
                                            'Congruencia paraverbal: coherencia entre contenido y forma de la voz.',
                                            'Compresión vocal por presión: aceleración, rigidez o subida de tono bajo estrés.',
                                            'Gravitas vocal: peso, calma y autoridad sin apuro.'
                                        ].map((item) => (
                                            <li key={`wb6-voice-concept-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Línea base vocal ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowVoiceExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    voiceBaselineCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {voiceBaselineCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Usa una situación real (reunión, presentación, videollamada o respuesta a objeción). Primero observa cómo suena tu voz hoy,
                                            sin corregir todavía.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa tono predominante, velocidad, volumen, articulación, pausas, énfasis y cierre de frase.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión vocal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que observo en mí hoy</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Efecto probable en otros</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceBaseline.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-baseline-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observation}
                                                                onChange={(event) => updateVoiceBaselineRow(rowIndex, 'observation', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.effect}
                                                                onChange={(event) => updateVoiceBaselineRow(rowIndex, 'effect', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {voiceBaselineLooksAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe conductas vocales observables (tono, velocidad, volumen, pausas, articulación), no solo emociones.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de calibración vocal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep2(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Convierte observación en criterio técnico: identifica la conducta vocal actual, evalúa si suma/resta impacto y define un
                                            ajuste concreto.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Conducta vocal observable</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">¿Suma o resta?</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste vocal concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceCalibration.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-calibration-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.observablePattern}
                                                                onChange={(event) => updateVoiceCalibrationRow(rowIndex, 'observablePattern', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.impact}
                                                                onChange={(event) => updateVoiceCalibrationRow(rowIndex, 'impact', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Suma">Suma</option>
                                                                <option value="Resta">Resta</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.concreteAdjustment}
                                                                onChange={(event) => updateVoiceCalibrationRow(rowIndex, 'concreteAdjustment', event.target.value)}
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
                                            onClick={() => saveVoiceBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Partitura vocal del mensaje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep3(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Toma un mensaje de 30–60 segundos y marca cómo debe sonar: palabras ancla, pausas funcionales, cierres firmes, puntos de
                                            energía y riesgos vocales.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Mensaje base</span>
                                            <textarea
                                                rows={2}
                                                value={voicePartiture.baseMessage}
                                                onChange={(event) => updateVoicePartiture('baseMessage', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Palabras ancla (máximo 5)</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.anchorWords}
                                                onChange={(event) => updateVoicePartiture('anchorWords', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Pausas funcionales (dónde irían)</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.functionalPauses}
                                                onChange={(event) => updateVoicePartiture('functionalPauses', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Cierres con tono firme</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.firmClosures}
                                                onChange={(event) => updateVoicePartiture('firmClosures', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Puntos donde debo elevar energía sin acelerar</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.energyPoints}
                                                onChange={(event) => updateVoicePartiture('energyPoints', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Riesgos vocales a vigilar</span>
                                            <input
                                                type="text"
                                                value={voicePartiture.vocalRisks}
                                                onChange={(event) => updateVoicePartiture('vocalRisks', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {voiceAnchorWordsMissing && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: marca qué palabras deben sonar con más peso para organizar la atención.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Protocolo de voz bajo presión</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep4(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define cómo te regularás cuando aparezca tensión: señal temprana, disparador, acción vocal inmediata y frase de reanclaje.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Señal vocal temprana</span>
                                            <input
                                                type="text"
                                                value={voicePressureProtocol.earlySignal}
                                                onChange={(event) => updateVoicePressureProtocol('earlySignal', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Contexto donde aparece</span>
                                            <input
                                                type="text"
                                                value={voicePressureProtocol.triggerContext}
                                                onChange={(event) => updateVoicePressureProtocol('triggerContext', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Acción reguladora inmediata</span>
                                            <textarea
                                                rows={2}
                                                value={voicePressureProtocol.regulationAction}
                                                onChange={(event) => updateVoicePressureProtocol('regulationAction', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Frase de reanclaje vocal</span>
                                            <input
                                                type="text"
                                                value={voicePressureProtocol.reanchoringPhrase}
                                                onChange={(event) => updateVoicePressureProtocol('reanchoringPhrase', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {voiceProtocolActionTooAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define qué harás con pausa, tono, respiración, velocidad o volumen.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Escalera de modulación por contexto</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep5(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Modula tu voz por contexto sin perder identidad. Ajusta tono, velocidad, volumen, pausas y énfasis para cada escenario.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1100px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Contexto</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tono</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Velocidad</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Volumen</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pausas</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Énfasis</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceLadder.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-ladder-${row.context}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.context}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.tone}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'tone', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona tono</option>
                                                                {VOICE_TONE_OPTIONS.map((option) => (
                                                                    <option key={`wb6-tone-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.speed}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'speed', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona velocidad</option>
                                                                {VOICE_SPEED_OPTIONS.map((option) => (
                                                                    <option key={`wb6-speed-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.volume}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'volume', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona volumen</option>
                                                                {VOICE_VOLUME_OPTIONS.map((option) => (
                                                                    <option key={`wb6-volume-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.pauses}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'pauses', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona pausas</option>
                                                                {VOICE_PAUSE_OPTIONS.map((option) => (
                                                                    <option key={`wb6-pause-option-${option}`} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.emphasis}
                                                                onChange={(event) => updateVoiceLadderRow(rowIndex, 'emphasis', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona énfasis</option>
                                                                {VOICE_EMPHASIS_OPTIONS.map((option) => (
                                                                    <option key={`wb6-emphasis-option-${option}`} value={option}>
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
                                    {voiceLadderSameAcrossContexts && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: ajusta la modulación según espacio y audiencia; evitar el mismo patrón en todos los contextos mejora impacto.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveVoiceBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de impacto vocal ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep6(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ver ejemplo
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa una intervención real o simulada. Marca desde evidencia: cómo sonó tu voz y qué efecto produjo.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voiceExecutiveTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-voice-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-voice-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateVoiceExecutiveTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-voice-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateVoiceExecutiveTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateVoiceExecutiveTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
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
                                            onClick={() => saveVoiceBlock('Paso 6')}
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
                                            'Cómo suena hoy tu voz en contextos ejecutivos.',
                                            'Qué patrones vocales fortalecen o debilitan tu presencia.',
                                            'Cómo diseñar una partitura vocal para mensajes importantes.',
                                            'Cómo regular tu voz cuando aparece presión.',
                                            'Cómo modular tono y ritmo según contexto sin perder autenticidad.'
                                        ].map((item) => (
                                            <li key={`wb6-voice-close-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                voiceSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : voiceSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {voiceSectionCompleted
                                                ? 'Sección completada'
                                                : voiceSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(5)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 4
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(6) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 5 de 9"
                                data-print-title="Comunicación bajo presión"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 5</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Comunicación bajo presión</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Desarrolla la capacidad de comunicar con claridad, control y criterio en situaciones de alta exigencia, sosteniendo presencia
                                        ejecutiva y confianza aun en contextos críticos.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Comunicación bajo presión: sostener claridad, presencia y dirección cuando sube urgencia, conflicto o exposición.',
                                            'Gravitas en crisis: calma, dominio y credibilidad visible en momentos tensos.',
                                            'Compresión del mensaje: bajo presión el mensaje puede volverse corto pero ambiguo si no se regula.',
                                            'Firma de presión: patrón personal repetitivo con el que reaccionas ante amenaza o urgencia.',
                                            'Seguridad tranquila: firmeza sin dureza, capaz de ordenar sin contagiar pánico.',
                                            'Respuesta reactiva vs. respuesta regulada: impulso defensivo frente a intervención con foco y secuencia.',
                                            'Ordenamiento de contexto: ayudar a otros a entender qué pasa, qué importa y qué sigue.',
                                            'Ventana de regulación: microespacio entre estímulo y respuesta para elegir intervención.',
                                            'Recuperación post-presión: volver al centro después del episodio para sostener consistencia.'
                                        ].map((item) => (
                                            <li key={`wb6-pressure-concept-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Mapa de firma de presión</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPressureExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pressureSignatureCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pressureSignatureCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Usa una situación real de los últimos 20 días (reunión tensa, objeción inesperada, contradicción pública, crisis operativa o
                                            conversación difícil).
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Registra el disparador, señal interna temprana, cambio visible en tu comunicación, patrón automático, efecto en otros y costo
                                            del episodio.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Elemento</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tu respuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {([
                                                    { label: 'Disparador', field: 'trigger', placeholder: 'Qué activó la presión' },
                                                    { label: 'Señal interna temprana', field: 'earlyInternalSignal', placeholder: 'Qué notaste primero en ti' },
                                                    {
                                                        label: 'Cambio visible en mi comunicación',
                                                        field: 'visibleCommunicationShift',
                                                        placeholder: 'Qué se alteró en voz, cuerpo o mensaje'
                                                    },
                                                    { label: 'Patrón automático de respuesta', field: 'automaticPattern', placeholder: 'Qué hiciste automáticamente' },
                                                    { label: 'Efecto en otros', field: 'effectOnOthers', placeholder: 'Qué generó tu forma de responder' },
                                                    { label: 'Costo del episodio', field: 'episodeCost', placeholder: 'Qué se debilitó o se perdió' }
                                                ] as const).map((row) => (
                                                    <tr key={`wb6-pressure-signature-${row.field}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.label}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={pressureSignatureMap[row.field]}
                                                                onChange={(event) => updatePressureSignatureMap(row.field, event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder={row.placeholder}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {pressureSignatureLooksAbstract && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe conductas observables (voz, tono, secuencia, escucha, cuerpo) en lugar de solo emociones generales.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePressureBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de desorden comunicacional bajo presión</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPressureExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pressureDisorderCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pressureDisorderCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Identifica dónde se rompe primero tu comunicación bajo presión: síntesis, claridad, secuencia, tono, escucha o decisión.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Para cada dimensión, registra qué te pasa, qué lectura produce en otros y qué ajuste regulador aplicarás.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1080px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué me pasa bajo presión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué lectura puede generar</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste regulador necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pressureDisorderMatrix.map((row, rowIndex) => (
                                                    <tr key={`wb6-pressure-disorder-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.underPressure}
                                                                onChange={(event) => updatePressureDisorderRow(rowIndex, 'underPressure', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Qué me pasa bajo presión"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.generatedReading}
                                                                onChange={(event) => updatePressureDisorderRow(rowIndex, 'generatedReading', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Qué lectura puede generar"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.regulatoryAdjustment}
                                                                onChange={(event) => updatePressureDisorderRow(rowIndex, 'regulatoryAdjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste regulador necesario"
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
                                            onClick={() => savePressureBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Protocolo de respuesta en 4 tiempos</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPressureExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pressureResponseCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pressureResponseCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Diseña una respuesta regulada en cuatro tiempos: pausa, orden interno, reencuadre y fórmula breve de intervención.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            El objetivo es intervenir para ordenar el contexto, no para defenderte impulsivamente.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi pausa funcional será:</span>
                                            <textarea
                                                value={pressureResponseProtocol.functionalPause}
                                                onChange={(event) => updatePressureResponseProtocol('functionalPause', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi frase interna de orden será:</span>
                                            <textarea
                                                value={pressureResponseProtocol.internalOrderPhrase}
                                                onChange={(event) => updatePressureResponseProtocol('internalOrderPhrase', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi reencuadre estratégico será:</span>
                                            <textarea
                                                value={pressureResponseProtocol.strategicReframe}
                                                onChange={(event) => updatePressureResponseProtocol('strategicReframe', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi fórmula breve de intervención será:</span>
                                            <textarea
                                                value={pressureResponseProtocol.interventionFormula}
                                                onChange={(event) => updatePressureResponseProtocol('interventionFormula', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {pressureProtocolMissingPause && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define una acción concreta de pausa (respirar, exhalar, silencio de 1 segundo) para abrir ventana de regulación.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePressureBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Plantilla de mensaje breve para alta presión</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPressureExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pressureShortMessageCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pressureShortMessageCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Estructura un mensaje mínimo para escenarios críticos: hecho, prioridad, dirección y contención.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Esta plantilla te ayuda a ordenar rápido sin perder autoridad ni claridad cuando no hay tiempo para explicar de más.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Hecho:</span>
                                            <textarea
                                                value={pressureShortMessageTemplate.fact}
                                                onChange={(event) => updatePressureShortMessage('fact', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Prioridad:</span>
                                            <textarea
                                                value={pressureShortMessageTemplate.priority}
                                                onChange={(event) => updatePressureShortMessage('priority', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Dirección:</span>
                                            <textarea
                                                value={pressureShortMessageTemplate.direction}
                                                onChange={(event) => updatePressureShortMessage('direction', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Contención / mensaje regulador:</span>
                                            <textarea
                                                value={pressureShortMessageTemplate.containment}
                                                onChange={(event) => updatePressureShortMessage('containment', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {pressureMessageMissingDirection && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: aclara qué debe hacerse o decidirse ahora para que la dirección sea accionable.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePressureBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Simulador de presión y recuperación</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPressureExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pressureSimulatorCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pressureSimulatorCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define tu escenario crítico más probable, la señal de entrada en presión, la respuesta regulada que deseas instalar y la
                                            recuperación posterior.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            El objetivo es entrenar tanto la intervención en crisis como el retorno al centro después del episodio.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Escenario crítico más probable:</span>
                                            <textarea
                                                value={pressureSimulator.probableCriticalScenario}
                                                onChange={(event) => updatePressureSimulator('probableCriticalScenario', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Señal que me indica entrada en presión:</span>
                                            <textarea
                                                value={pressureSimulator.entrySignal}
                                                onChange={(event) => updatePressureSimulator('entrySignal', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Respuesta regulada que quiero instalar:</span>
                                            <textarea
                                                value={pressureSimulator.regulatedResponse}
                                                onChange={(event) => updatePressureSimulator('regulatedResponse', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Acción de recuperación después del evento:</span>
                                            <textarea
                                                value={pressureSimulator.recoveryAction}
                                                onChange={(event) => updatePressureSimulator('recoveryAction', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {pressureSimulatorMissingRecovery && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define una acción concreta de recuperación para volver al centro después del episodio.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => savePressureBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de comunicación bajo presión</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPressureExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    pressureExecutiveTestCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {pressureExecutiveTestCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Aplica este test sobre una situación real o simulada y evalúa si mantuviste claridad, seguridad tranquila, escucha y
                                            ordenamiento del contexto.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Marca cada criterio desde evidencia observable e incluye un ajuste específico por pregunta.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pressureExecutiveTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-pressure-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-pressure-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updatePressureExecutiveTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-pressure-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updatePressureExecutiveTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updatePressureExecutiveTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
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
                                            onClick={() => savePressureBlock('Paso 6')}
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
                                            'Cuál es tu firma de presión y cuándo se activa.',
                                            'Dónde se rompe primero tu comunicación cuando sube la exigencia.',
                                            'Qué protocolo usarás para no responder desde impulso.',
                                            'Cómo ordenar mensajes breves en escenarios críticos.',
                                            'Cómo recuperar centro después de una situación tensa.'
                                        ].map((item) => (
                                            <li key={`wb6-pressure-close-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                pressureSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : pressureSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {pressureSectionCompleted
                                                ? 'Sección completada'
                                                : pressureSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(6)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 5
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(7) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 6 de 9"
                                data-print-title="Presencia en reuniones de alto nivel"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 6</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
                                        Presencia en reuniones de alto nivel
                                    </h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Proyecta una presencia ejecutiva sólida para intervenir con criterio, leer la dinámica de la sala y contribuir con claridad,
                                        peso y oportunidad sin sobreactuar ni diluirte.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Presencia en reuniones de alto nivel: participar con claridad, oportunidad y lectura política sin desaparecer ni sobreactuar.',
                                            'Presencia ejecutiva e híbrida: proyectar claridad, inspiración y autoridad en sala física y entorno virtual.',
                                            'Gravitas situacional: peso ejecutivo visible en contextos complejos desde calma, firmeza y criterio.',
                                            'Lectura de sala: identificar jerarquías, alianzas, tensiones, ritmos y focos de decisión.',
                                            'Economía de intervención: entrar con precisión sin sobreparticipar ni diluirte.',
                                            'Anclaje de estatus: ocupar el espacio con legitimidad, sin ansiedad por validación.',
                                            'Participación estratégica: elegir cuándo escuchar, preguntar, sintetizar, desafiar o cerrar.'
                                        ].map((item) => (
                                            <li key={`wb6-meeting-concept-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Mapa de lectura de sala</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMeetingExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    meetingReadingCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {meetingReadingCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Trabaja con una reunión real de alto nivel (comité, sponsor review, junta o reunión con dirección). Antes de hablar,
                                            registra lectura estratégica del entorno.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Identifica quién decide, quién influye, quién podría bloquear, la tensión principal, el lenguaje dominante y dónde tu aporte
                                            puede ordenar la conversación.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Elemento de lectura</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Tu respuesta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {([
                                                    { label: 'Quién decide realmente', field: 'realDecisionMaker' },
                                                    { label: 'Quién influye sin decidir formalmente', field: 'informalInfluencer' },
                                                    { label: 'Quién puede bloquear o enfriar', field: 'blockerOrCooler' },
                                                    { label: 'Tensión principal en la reunión', field: 'mainTension' },
                                                    { label: 'Lenguaje que domina el espacio', field: 'dominantLanguage' },
                                                    { label: 'Punto donde mi aporte puede ser más útil', field: 'highestValueContributionPoint' }
                                                ] as const).map((row) => (
                                                    <tr key={`wb6-meeting-reading-${row.field}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.label}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={meetingRoomReadingMap[row.field]}
                                                                onChange={(event) => updateMeetingRoomReading(row.field, event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {meetingDefinedAudienceWithoutDecision && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: aclara quién toma realmente la decisión en esta reunión para ajustar mejor tu intervención.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveMeetingBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de posicionamiento en reunión</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMeetingExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    meetingPositioningCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {meetingPositioningCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define cómo vas a estar en la reunión: rol principal, nivel de visibilidad y tipo de contribución esperada.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Especifica el riesgo de hablar de más, el riesgo de hablar poco y la señal de presencia que quieres dejar instalada.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi rol principal en esta reunión:</span>
                                            <input
                                                type="text"
                                                value={meetingPositioningMatrix.primaryRole}
                                                onChange={(event) => updateMeetingPositioning('primaryRole', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Nivel de visibilidad requerido:</span>
                                            <select
                                                value={meetingPositioningMatrix.visibilityLevel}
                                                onChange={(event) => updateMeetingPositioning('visibilityLevel', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                <option value="">Selecciona nivel</option>
                                                {VISIBILITY_LEVELS.map((level) => (
                                                    <option key={`wb6-meeting-visibility-${level}`} value={level}>
                                                        {level}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Tipo de contribución esperada:</span>
                                            <input
                                                type="text"
                                                value={meetingPositioningMatrix.expectedContributionType}
                                                onChange={(event) => updateMeetingPositioning('expectedContributionType', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Riesgo si hablo demasiado:</span>
                                            <input
                                                type="text"
                                                value={meetingPositioningMatrix.overtalkingRisk}
                                                onChange={(event) => updateMeetingPositioning('overtalkingRisk', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Riesgo si hablo demasiado poco:</span>
                                            <input
                                                type="text"
                                                value={meetingPositioningMatrix.undertalkingRisk}
                                                onChange={(event) => updateMeetingPositioning('undertalkingRisk', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Señal de presencia que quiero dejar:</span>
                                            <input
                                                type="text"
                                                value={meetingPositioningMatrix.desiredPresenceSignal}
                                                onChange={(event) => updateMeetingPositioning('desiredPresenceSignal', event.target.value)}
                                                disabled={isLocked}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveMeetingBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Arquitectura de intervención de alto nivel</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMeetingExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    meetingArchitectureCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {meetingArchitectureCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Prepara tu intervención en cinco partes: apertura breve, tesis central, criterio/evidencia, implicación ejecutiva y cierre
                                            corto.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            La estructura debe ayudarte a entrar con precisión, aportar valor y dejar claro por qué tu punto importa para la decisión.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Apertura breve:</span>
                                            <textarea
                                                value={meetingInterventionArchitecture.briefOpening}
                                                onChange={(event) => updateMeetingArchitecture('briefOpening', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Tesis central:</span>
                                            <textarea
                                                value={meetingInterventionArchitecture.centralThesis}
                                                onChange={(event) => updateMeetingArchitecture('centralThesis', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Criterio o evidencia:</span>
                                            <textarea
                                                value={meetingInterventionArchitecture.criterionOrEvidence}
                                                onChange={(event) => updateMeetingArchitecture('criterionOrEvidence', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Implicación ejecutiva:</span>
                                            <textarea
                                                value={meetingInterventionArchitecture.executiveImplication}
                                                onChange={(event) => updateMeetingArchitecture('executiveImplication', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2 md:col-span-2">
                                            <span className="text-sm font-semibold text-slate-700">Cierre corto:</span>
                                            <textarea
                                                value={meetingInterventionArchitecture.shortClosing}
                                                onChange={(event) => updateMeetingArchitecture('shortClosing', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {meetingArchitectureMissingThesis && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: define en una frase qué vas a instalar (tesis central) para ganar foco ejecutivo.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveMeetingBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Mapa de timing e intervención</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMeetingExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    meetingTimingCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {meetingTimingCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define qué harás según señal/momento: cuándo entrar, cuándo evitar intervenir, cuándo preguntar, sintetizar u ordenar.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            El timing correcto aumenta valor; intervenir fuera de momento puede diluir tu aporte aunque el contenido sea bueno.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Momento / señal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué haré</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {meetingTimingMap.map((row, rowIndex) => (
                                                    <tr key={`wb6-meeting-timing-${row.momentOrSignal}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.momentOrSignal}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.plannedAction}
                                                                onChange={(event) => updateMeetingTimingRow(rowIndex, 'plannedAction', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {meetingTimingNotDifferentiated && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: diferencia mejor el momento ideal frente al momento a evitar para que tu timing sea más estratégico.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveMeetingBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Auditoría de huella ejecutiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMeetingExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    meetingAuditCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {meetingAuditCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa tu reunión más reciente para identificar cómo entraste, cómo sostuviste el espacio, qué aportaste y qué impresión
                                            probable dejaste.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Cierra con un ajuste concreto para la siguiente reunión de alto nivel.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Mi lectura posterior</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {([
                                                    { label: 'Cómo entré a la reunión', field: 'entryQuality' },
                                                    { label: 'Cómo sostuve el espacio', field: 'spaceSustainment' },
                                                    { label: 'Qué aporté realmente', field: 'realContribution' },
                                                    { label: 'Qué percepción probable dejé', field: 'likelyPerception' },
                                                    { label: 'Qué haría distinto la próxima vez', field: 'nextAdjustment' }
                                                ] as const).map((row) => (
                                                    <tr key={`wb6-meeting-audit-${row.field}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.label}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={meetingExecutiveFootprintAudit[row.field]}
                                                                onChange={(event) => updateMeetingAudit(row.field, event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {meetingAuditMissingPerception && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: formula qué lectura ejecutiva pudo dejar tu presencia para cerrar el aprendizaje con más precisión.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveMeetingBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de presencia en reuniones de alto nivel</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowMeetingExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    meetingTestCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {meetingTestCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Aplica el test a una reunión real o simulada y evalúa lectura de sala, timing, valor de intervención, seguridad tranquila y
                                            huella ejecutiva.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Marca Sí/No con honestidad y deja un ajuste puntual por criterio.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {meetingHighLevelTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-meeting-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-meeting-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateMeetingTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-meeting-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateMeetingTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateMeetingTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
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
                                            onClick={() => saveMeetingBlock('Paso 6')}
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
                                            'Cómo leer una reunión antes de intervenir.',
                                            'Qué rol te conviene asumir según el contexto.',
                                            'Cómo estructurar intervenciones breves de alto valor.',
                                            'Cómo elegir mejor el momento para entrar o retirarte.',
                                            'Qué huella ejecutiva dejas en espacios de alto nivel.'
                                        ].map((item) => (
                                            <li key={`wb6-meeting-close-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                meetingSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : meetingSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {meetingSectionCompleted
                                                ? 'Sección completada'
                                                : meetingSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(7)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 6
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(8) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 7 de 9"
                                data-print-title="Coherencia verbal y no verbal"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 7</p>
                                    <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900">Coherencia verbal y no verbal</h2>
                                    <p className="text-sm md:text-base text-slate-700 max-w-5xl">
                                        Alinea contenido, voz y corporalidad para reducir contradicciones perceptibles, aumentar credibilidad y proyectar una presencia
                                        ejecutiva más congruente.
                                    </p>
                                </header>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Conceptos eje</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceHelp(true)}
                                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Ayuda / Ver ejemplo
                                        </button>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {[
                                            'Coherencia verbal y no verbal: alineación observable entre lo que dices y lo que proyectan cuerpo, rostro, mirada y voz.',
                                            'Congruencia ejecutiva: consistencia entre mensaje, postura, tono, ritmo e intención.',
                                            'Contradicción perceptiva y microincongruencias: cuando la forma debilita lo declarado.',
                                            'Unidad expresiva: mensaje, respiración, mirada y voz operando en una misma dirección.',
                                            'Reparación de incoherencia: detectar y corregir la ruptura antes de erosionar credibilidad.',
                                            'Mensaje encarnado: la idea no solo se dice, también se sostiene físicamente y vocalmente.'
                                        ].map((item) => (
                                            <li key={`wb6-coherence-concept-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 1 — Mapa de congruencia actual</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCoherenceExampleStep1(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    congruenceMapCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {congruenceMapCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Usa una situación real reciente (reunión clave, comité, conversación difícil, presentación o respuesta a objeción).
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Compara intención vs percepción: qué querías transmitir y qué se vio/oyó realmente en postura, tono, mirada y energía.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1040px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Intención / lo que quería transmitir</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que probablemente se vio o se oyó</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {congruenceMap.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-map-${row.dimension}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.dimension}</td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.intendedMessage}
                                                                onChange={(event) => updateCongruenceMapRow(rowIndex, 'intendedMessage', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.perceivedSignal}
                                                                onChange={(event) => updateCongruenceMapRow(rowIndex, 'perceivedSignal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {coherenceMapMissingObservables && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: describe señales observables (postura, tono, mirada, gesto, ritmo) y no solo lo que sentiste.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveCoherenceBlock('Paso 1')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 2 — Matriz de contradicciones perceptivas</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCoherenceExampleStep2(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    perceptiveContradictionsCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {perceptiveContradictionsCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Identifica al menos cuatro contradicciones entre lo que dices y la señal no verbal/vocal que puede estar restando credibilidad.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define lectura probable en otros y un ajuste prioritario concreto por cada caso.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1120px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lo que digo</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal no verbal o vocal que lo contradice</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Lectura probable en otros</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste prioritario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {perceptiveContradictions.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-contradiction-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.verbalStatement}
                                                                onChange={(event) => updatePerceptiveContradictionRow(rowIndex, 'verbalStatement', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.contradictorySignal}
                                                                onChange={(event) => updatePerceptiveContradictionRow(rowIndex, 'contradictorySignal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.likelyReading}
                                                                onChange={(event) => updatePerceptiveContradictionRow(rowIndex, 'likelyReading', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.priorityAdjustment}
                                                                onChange={(event) => updatePerceptiveContradictionRow(rowIndex, 'priorityAdjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {abstractContradictions && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: vuelve la contradicción visible. ¿Qué vieron o escucharon otros exactamente?
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveCoherenceBlock('Paso 2')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 3 — Laboratorio frase–señal</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCoherenceExampleStep3(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    phraseSignalLabCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {phraseSignalLabCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Elige tres frases ejecutivas que usas con frecuencia y diseña cómo deben sonar y verse para sostener coherencia.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Define idea que instala, tono requerido, postura/gesto que la respalda y el error de forma a evitar.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1200px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Frase clave</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué idea instala</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué tono necesita</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué postura / gesto la sostiene</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué debo evitar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {phraseSignalLab.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-lab-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.keyPhrase}
                                                                onChange={(event) => updatePhraseSignalLabRow(rowIndex, 'keyPhrase', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.installedIdea}
                                                                onChange={(event) => updatePhraseSignalLabRow(rowIndex, 'installedIdea', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.neededTone}
                                                                onChange={(event) => updatePhraseSignalLabRow(rowIndex, 'neededTone', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.supportingPostureOrGesture}
                                                                onChange={(event) => updatePhraseSignalLabRow(rowIndex, 'supportingPostureOrGesture', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whatToAvoid}
                                                                onChange={(event) => updatePhraseSignalLabRow(rowIndex, 'whatToAvoid', event.target.value)}
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
                                            onClick={() => saveCoherenceBlock('Paso 3')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 4 — Semáforo de alineación expresiva</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCoherenceExampleStep4(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    expressiveTrafficCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {expressiveTrafficCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Clasifica señales en Verde, Amarillo o Rojo según cuánto refuerzan o contradicen tu mensaje en momentos exigentes.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Incluye cuándo aparece cada señal y qué ajuste requiere para elevar congruencia ejecutiva.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1040px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Señal</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Cuándo aparece</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Qué ajuste requiere</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expressiveTrafficLight.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-traffic-${rowIndex}`}>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.signal}
                                                                onChange={(event) => updateExpressiveTrafficLightRow(rowIndex, 'signal', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <select
                                                                value={row.level}
                                                                onChange={(event) => updateExpressiveTrafficLightRow(rowIndex, 'level', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            >
                                                                <option value="">Selecciona</option>
                                                                <option value="Verde">Verde</option>
                                                                <option value="Amarillo">Amarillo</option>
                                                                <option value="Rojo">Rojo</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.whenAppears}
                                                                onChange={(event) => updateExpressiveTrafficLightRow(rowIndex, 'whenAppears', event.target.value)}
                                                                disabled={isLocked}
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.requiredAdjustment}
                                                                onChange={(event) => updateExpressiveTrafficLightRow(rowIndex, 'requiredAdjustment', event.target.value)}
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
                                            onClick={() => saveCoherenceBlock('Paso 4')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 5 — Protocolo de reparación de incoherencia</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCoherenceExampleStep5(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    incoherenceRepairCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {incoherenceRepairCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Diseña tu secuencia de reparación cuando detectes incoherencia: señal de alerta, corrección corporal, corrección vocal,
                                            frase de reordenamiento e idea a reinstalar.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            La meta es corregir en tiempo real sin perder presencia ni legitimidad.
                                        </p>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi señal de alerta es:</span>
                                            <textarea
                                                value={incoherenceRepairProtocol.alertSignal}
                                                onChange={(event) => updateIncoherenceRepairProtocol('alertSignal', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi corrección corporal inmediata será:</span>
                                            <textarea
                                                value={incoherenceRepairProtocol.bodyCorrection}
                                                onChange={(event) => updateIncoherenceRepairProtocol('bodyCorrection', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi corrección vocal inmediata será:</span>
                                            <textarea
                                                value={incoherenceRepairProtocol.vocalCorrection}
                                                onChange={(event) => updateIncoherenceRepairProtocol('vocalCorrection', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-semibold text-slate-700">Mi frase de reordenamiento será:</span>
                                            <textarea
                                                value={incoherenceRepairProtocol.reorderingPhrase}
                                                onChange={(event) => updateIncoherenceRepairProtocol('reorderingPhrase', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                        <label className="space-y-2 md:col-span-2">
                                            <span className="text-sm font-semibold text-slate-700">La idea que necesito reinstalar es:</span>
                                            <textarea
                                                value={incoherenceRepairProtocol.ideaToReinstall}
                                                onChange={(event) => updateIncoherenceRepairProtocol('ideaToReinstall', event.target.value)}
                                                disabled={isLocked}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                        </label>
                                    </div>
                                    {repairMissingBodyOrVoice && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: incluye corrección corporal y vocal explícitas para volver a alinear forma y contenido.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveCoherenceBlock('Paso 5')}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar bloque
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5 md:p-7 space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">Paso 6 — Test de coherencia verbal y no verbal</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCoherenceExampleStep6(true)}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Ver ejemplo
                                            </button>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    coherenceTestCompleted
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {coherenceTestCompleted ? 'Completado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Instrucciones del paso</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Evalúa una reunión reciente, una grabación o una simulación para verificar si forma y contenido estuvieron alineados.
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Si marcas “No”, registra un ajuste concreto para la siguiente intervención.
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Pregunta</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Sí</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">No</th>
                                                    <th className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200">Ajuste necesario</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coherenceSectionTest.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-test-${row.question}`}>
                                                        <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">{row.question}</td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-test-${rowIndex}`}
                                                                checked={row.verdict === 'yes'}
                                                                onChange={() => updateCoherenceTestRow(rowIndex, 'verdict', 'yes')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 border-b border-slate-100">
                                                            <input
                                                                type="radio"
                                                                name={`wb6-coherence-test-${rowIndex}`}
                                                                checked={row.verdict === 'no'}
                                                                onChange={() => updateCoherenceTestRow(rowIndex, 'verdict', 'no')}
                                                                disabled={isLocked}
                                                                className="h-4 w-4 text-blue-700 border-slate-300 focus:ring-blue-400 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 border-b border-slate-100">
                                                            <input
                                                                type="text"
                                                                value={row.adjustment}
                                                                onChange={(event) => updateCoherenceTestRow(rowIndex, 'adjustment', event.target.value)}
                                                                disabled={isLocked}
                                                                placeholder="Ajuste necesario"
                                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-300"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {coherenceLowWithoutPriorityAdjustment && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            Sugerencia: si el test marcó coherencia baja, define al menos un ajuste prioritario para la próxima situación.
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => saveCoherenceBlock('Paso 6')}
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
                                            'Qué contradicciones perceptivas restan credibilidad a tu mensaje.',
                                            'Qué frases requieren soporte corporal y vocal más preciso.',
                                            'Qué señales refuerzan o debilitan tu coherencia.',
                                            'Cómo detectar microincongruencias antes de que escalen.',
                                            'Cómo reparar rápidamente una ruptura entre forma y contenido.'
                                        ].map((item) => (
                                            <li key={`wb6-coherence-close-${item}`} className="text-sm md:text-[15px] text-slate-700 leading-relaxed flex items-start gap-3">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                coherenceSectionCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                    : coherenceSectionMinimal
                                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                                            }`}
                                        >
                                            {coherenceSectionCompleted
                                                ? 'Sección completada'
                                                : coherenceSectionMinimal
                                                  ? 'Pendiente (falta completar bloques)'
                                                  : 'Sección pendiente'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => savePage(8)}
                                            disabled={isLocked}
                                            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Guardar página 7
                                        </button>
                                    </div>
                                </section>
                            </article>
                        )}

                        {isPageVisible(9) && (
                            <article
                                className="wb6-print-page rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 space-y-8 shadow-[0_14px_36px_rgba(15,23,42,0.07)]"
                                data-print-page="Página 9 de 9"
                                data-print-title="Evaluación"
                                data-print-meta={printMetaLabel}
                            >
                                <header className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-600 font-semibold">Página 9</p>
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
                                                        key={`wb6-evaluation-stage-${stage.key}`}
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
                                                    <li key={`wb6-mentor-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                                    <tr key={`wb6-mentor-level-reference-${item.level}`} className="odd:bg-white even:bg-blue-50/40">
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
                                                    <article key={`wb6-mentor-row-${row.criterion}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                                                key={`wb6-mentor-level-${index}-${level}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb6-mentor-level-${index}`}
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
                                                                                key={`wb6-mentor-decision-${index}-${decision}`}
                                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`wb6-mentor-decision-${index}`}
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
                                                    value={evaluation.mentorGeneralNotes}
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
                                                            key={`wb6-mentor-global-decision-${decision}`}
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="wb6-mentor-global-decision"
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
                                                    <li key={`wb6-leader-instruction-${instruction}`} className="text-sm text-slate-700 flex items-start gap-2">
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
                                                    <article key={`wb6-leader-row-${row.question}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                                                {evaluationSectionComplete ? 'WB6 Evaluación completada' : 'WB6 Evaluación en progreso'}
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
                                                        key={`wb6-evaluation-summary-criterion-${index}`}
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
                                        Guardar página 9
                                    </button>
                                </div>
                            </article>
                        )}

                        {showBodyHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Lenguaje corporal ejecutivo</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Lenguaje corporal ejecutivo no es actuar: es ordenar postura, mirada, gesto y espacio.</p>
                                        <p>• La autoridad tranquila se transmite por estabilidad y coherencia, no por rigidez.</p>
                                        <p>• Tu cuerpo debe reforzar el mensaje, no competir con él.</p>
                                        <p>• Detectar fugas corporales temprano evita pérdida de credibilidad en espacios de alto nivel.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Escaneo de línea base)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[820px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Lo que observo hoy</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto probable</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_BASELINE_SCAN.map((row) => (
                                                    <tr key={`wb6-modal-step1-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observation}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.effect}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Matriz de presencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Conducta observable</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste concreto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_PRESENCE_MATRIX.map((row) => (
                                                    <tr key={`wb6-modal-step2-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observableBehavior}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.presenceImpact}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.concreteAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Semáforo de fugas)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        {EXAMPLE_LEAKAGE_TRAFFIC.map((row, index) => (
                                            <p key={`wb6-modal-step3-${index}`}>
                                                <span className="font-semibold">{row.signal}</span> · {row.level} · {row.whenAppears} · {row.generatedReading}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Protocolo de entrada)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Entrada ideal:</span> {EXAMPLE_ENTRY_PROTOCOL.idealEntry}</p>
                                        <p><span className="font-semibold">Ubicación:</span> {EXAMPLE_ENTRY_PROTOCOL.positioning}</p>
                                        <p><span className="font-semibold">Criterio de espacio:</span> {EXAMPLE_ENTRY_PROTOCOL.spaceCriteria}</p>
                                        <p><span className="font-semibold">Primeros 20 segundos:</span> {EXAMPLE_ENTRY_PROTOCOL.first20Seconds}</p>
                                        <p><span className="font-semibold">Señal inicial:</span> {EXAMPLE_ENTRY_PROTOCOL.signalToInstall}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Patrón corporal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Centrado:</span> {EXAMPLE_AUTHORITY_PATTERN.centeredBody}</p>
                                        <p><span className="font-semibold">Escucha:</span> {EXAMPLE_AUTHORITY_PATTERN.listeningBody}</p>
                                        <p><span className="font-semibold">Objeción:</span> {EXAMPLE_AUTHORITY_PATTERN.objectionBody}</p>
                                        <p><span className="font-semibold">Vuelta al centro:</span> {EXAMPLE_AUTHORITY_PATTERN.returnToCenter}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showBodyExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de coherencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowBodyExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p><span className="font-semibold">Señal débil:</span> explicar calma mientras el cuerpo se mueve sin parar.</p>
                                        <p><span className="font-semibold">Señal mejorada:</span> sostener idea con torso estable, manos visibles y respiración regulada.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Manejo de objeciones</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Una objeción no siempre es ataque: muchas veces contiene riesgo, confianza o necesidad de precisión.</p>
                                        <p>• No todas las objeciones se responden igual: primero diagnostica tipo y capa, luego responde.</p>
                                        <p>• Usa secuencia ejecutiva: recibir, aclarar, reconocer, responder y verificar avance.</p>
                                        <p>• La calidad de la respuesta combina escucha, foco, criterio y verificación final.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Cartografía de objeciones)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1240px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Objeción</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Tipo</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué activó en mí</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Cómo respondí</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Más efectivo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_OBJECTION_CARTOGRAPHY.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-modal-step1-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.objection}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.objectionType}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.whatActivatedMe}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.response}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.responseEffect}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.betterResponse}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Diagnóstico de la objeción)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Lo que dijo literalmente:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.literal}</p>
                                        <p><span className="font-semibold">Emoción / intensidad:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.emotionalIntensity}</p>
                                        <p><span className="font-semibold">Qué podría estar protegiendo:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.whatItProtects}</p>
                                        <p><span className="font-semibold">Capa a responder primero:</span> {EXAMPLE_OBJECTION_DIAGNOSIS.firstLayerToRespond}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Protocolo ejecutivo)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Recibir:</span> {EXAMPLE_OBJECTION_PROTOCOL.receive}</p>
                                        <p><span className="font-semibold">Aclarar:</span> {EXAMPLE_OBJECTION_PROTOCOL.clarificationQuestion}</p>
                                        <p><span className="font-semibold">Reconocer:</span> {EXAMPLE_OBJECTION_PROTOCOL.recognition}</p>
                                        <p><span className="font-semibold">Responder:</span> {EXAMPLE_OBJECTION_PROTOCOL.focalResponse}</p>
                                        <p><span className="font-semibold">Verificar avance:</span> {EXAMPLE_OBJECTION_PROTOCOL.advanceVerification}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Banco de respuestas puente)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Escenario</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Respuesta puente</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_BRIDGE_BANK.map((row) => (
                                                    <tr key={`wb6-objection-modal-step4-${row.scenario}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.scenario}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.bridgeResponse}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Laboratorio de reencuadre)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Objeción original</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Reencuadre útil</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué mejora</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_REFRAME_LAB.map((row, rowIndex) => (
                                                    <tr key={`wb6-objection-modal-step5-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.originalObjection}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.usefulReframe}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.proposalImprovement}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showObjectionExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test ejecutivo)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowObjectionExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> recibir una objeción como ataque y responder desde
                                            justificación acelerada.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> aclarar primero, reconocer la preocupación central
                                            y responder con foco y verificación final.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Tono y ritmo de voz</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• La voz ejecutiva no es sonar grave: es sonar clara, estable y bien dosificada.</p>
                                        <p>• El ritmo útil no siempre es más lento; es más procesable para tu audiencia.</p>
                                        <p>• La pausa funcional es herramienta de autoridad, no vacío.</p>
                                        <p>• Una buena modulación vocal organiza la atención y aumenta credibilidad.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Línea base vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Observación</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Efecto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_VOICE_BASELINE.map((row) => (
                                                    <tr key={`wb6-voice-modal-step1-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observation}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.effect}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Calibración vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Conducta</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Impacto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_VOICE_CALIBRATION.map((row) => (
                                                    <tr key={`wb6-voice-modal-step2-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.observablePattern}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.impact}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.concreteAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Partitura vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Mensaje base:</span> {EXAMPLE_VOICE_PARTITURE.baseMessage}</p>
                                        <p><span className="font-semibold">Palabras ancla:</span> {EXAMPLE_VOICE_PARTITURE.anchorWords}</p>
                                        <p><span className="font-semibold">Pausas funcionales:</span> {EXAMPLE_VOICE_PARTITURE.functionalPauses}</p>
                                        <p><span className="font-semibold">Cierres firmes:</span> {EXAMPLE_VOICE_PARTITURE.firmClosures}</p>
                                        <p><span className="font-semibold">Puntos de energía:</span> {EXAMPLE_VOICE_PARTITURE.energyPoints}</p>
                                        <p><span className="font-semibold">Riesgos vocales:</span> {EXAMPLE_VOICE_PARTITURE.vocalRisks}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Voz bajo presión)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Señal temprana:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.earlySignal}</p>
                                        <p><span className="font-semibold">Contexto:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.triggerContext}</p>
                                        <p><span className="font-semibold">Acción reguladora:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.regulationAction}</p>
                                        <p><span className="font-semibold">Frase de reanclaje:</span> {EXAMPLE_VOICE_PRESSURE_PROTOCOL.reanchoringPhrase}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Escalera de modulación)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Contexto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Tono</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Velocidad</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Volumen</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Pausas</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Énfasis</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_VOICE_LADDER.map((row) => (
                                                    <tr key={`wb6-voice-modal-step5-${row.context}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.context}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.tone}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.speed}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.volume}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.pauses}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.emphasis}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showVoiceExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de impacto vocal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> decir una recomendación importante con la voz acelerada y sin pausas.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> bajar medio punto la velocidad, marcar dos pausas y cerrar la
                                            frase con tono firme.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Comunicación bajo presión</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Comunicar bajo presión no es hablar más fuerte ni más rápido; es ordenar el contexto con claridad.</p>
                                        <p>• La meta no es defenderte automáticamente, sino intervenir con pausa, secuencia y dirección.</p>
                                        <p>• Una respuesta regulada combina síntesis, escucha y decisión accionable.</p>
                                        <p>• En presencia ejecutiva, la calma visible bajo presión es parte de la gravitas.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Mapa de firma de presión)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Elemento</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ejemplo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {([
                                                    { label: 'Disparador', value: EXAMPLE_PRESSURE_SIGNATURE_MAP.trigger },
                                                    { label: 'Señal interna temprana', value: EXAMPLE_PRESSURE_SIGNATURE_MAP.earlyInternalSignal },
                                                    { label: 'Cambio visible en mi comunicación', value: EXAMPLE_PRESSURE_SIGNATURE_MAP.visibleCommunicationShift },
                                                    { label: 'Patrón automático de respuesta', value: EXAMPLE_PRESSURE_SIGNATURE_MAP.automaticPattern },
                                                    { label: 'Efecto en otros', value: EXAMPLE_PRESSURE_SIGNATURE_MAP.effectOnOthers },
                                                    { label: 'Costo del episodio', value: EXAMPLE_PRESSURE_SIGNATURE_MAP.episodeCost }
                                                ] as const).map((row) => (
                                                    <tr key={`wb6-pressure-modal-step1-${row.label}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.label}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Desorden comunicacional)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1020px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué me pasa bajo presión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué lectura puede generar</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste regulador</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_PRESSURE_DISORDER_MATRIX.map((row) => (
                                                    <tr key={`wb6-pressure-modal-step2-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.underPressure}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.generatedReading}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.regulatoryAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Protocolo en 4 tiempos)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Pausa funcional:</span> {EXAMPLE_PRESSURE_PROTOCOL.functionalPause}</p>
                                        <p><span className="font-semibold">Frase interna de orden:</span> {EXAMPLE_PRESSURE_PROTOCOL.internalOrderPhrase}</p>
                                        <p><span className="font-semibold">Reencuadre estratégico:</span> {EXAMPLE_PRESSURE_PROTOCOL.strategicReframe}</p>
                                        <p><span className="font-semibold">Fórmula breve:</span> {EXAMPLE_PRESSURE_PROTOCOL.interventionFormula}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Mensaje breve de alta presión)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Hecho:</span> {EXAMPLE_PRESSURE_MESSAGE_TEMPLATE.fact}</p>
                                        <p><span className="font-semibold">Prioridad:</span> {EXAMPLE_PRESSURE_MESSAGE_TEMPLATE.priority}</p>
                                        <p><span className="font-semibold">Dirección:</span> {EXAMPLE_PRESSURE_MESSAGE_TEMPLATE.direction}</p>
                                        <p><span className="font-semibold">Contención:</span> {EXAMPLE_PRESSURE_MESSAGE_TEMPLATE.containment}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Simulador y recuperación)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Escenario crítico:</span> {EXAMPLE_PRESSURE_SIMULATOR.probableCriticalScenario}</p>
                                        <p><span className="font-semibold">Señal de entrada:</span> {EXAMPLE_PRESSURE_SIMULATOR.entrySignal}</p>
                                        <p><span className="font-semibold">Respuesta regulada:</span> {EXAMPLE_PRESSURE_SIMULATOR.regulatedResponse}</p>
                                        <p><span className="font-semibold">Recuperación:</span> {EXAMPLE_PRESSURE_SIMULATOR.recoveryAction}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showPressureExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test bajo presión)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPressureExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> responder rápido, justificar demasiado y subir el tono.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> pausar, nombrar el punto crítico y responder con secuencia breve y firme.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Presencia en reuniones de alto nivel</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• En reuniones de alto nivel no solo importa hablar bien; importa leer la sala y elegir el momento.</p>
                                        <p>• Presencia ejecutiva = claridad + autoridad + oportunidad.</p>
                                        <p>• Presencia híbrida exige la misma calidad de intervención en sala física y entorno virtual.</p>
                                        <p>• Tu objetivo no es dominar la conversación; es agregar criterio y orden cuando más se necesita.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Lectura de sala)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Elemento</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ejemplo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {([
                                                    { label: 'Quién decide realmente', value: EXAMPLE_MEETING_READING_MAP.realDecisionMaker },
                                                    { label: 'Quién influye sin decidir', value: EXAMPLE_MEETING_READING_MAP.informalInfluencer },
                                                    { label: 'Quién puede bloquear o enfriar', value: EXAMPLE_MEETING_READING_MAP.blockerOrCooler },
                                                    { label: 'Tensión principal', value: EXAMPLE_MEETING_READING_MAP.mainTension },
                                                    { label: 'Lenguaje dominante', value: EXAMPLE_MEETING_READING_MAP.dominantLanguage },
                                                    { label: 'Punto de aporte útil', value: EXAMPLE_MEETING_READING_MAP.highestValueContributionPoint }
                                                ] as const).map((row) => (
                                                    <tr key={`wb6-meeting-modal-step1-${row.label}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.label}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Posicionamiento)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Rol principal:</span> {EXAMPLE_MEETING_POSITIONING.primaryRole}</p>
                                        <p><span className="font-semibold">Nivel de visibilidad:</span> {EXAMPLE_MEETING_POSITIONING.visibilityLevel}</p>
                                        <p><span className="font-semibold">Contribución esperada:</span> {EXAMPLE_MEETING_POSITIONING.expectedContributionType}</p>
                                        <p><span className="font-semibold">Riesgo si hablo demasiado:</span> {EXAMPLE_MEETING_POSITIONING.overtalkingRisk}</p>
                                        <p><span className="font-semibold">Riesgo si hablo poco:</span> {EXAMPLE_MEETING_POSITIONING.undertalkingRisk}</p>
                                        <p><span className="font-semibold">Señal de presencia:</span> {EXAMPLE_MEETING_POSITIONING.desiredPresenceSignal}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Arquitectura de intervención)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Apertura:</span> {EXAMPLE_MEETING_ARCHITECTURE.briefOpening}</p>
                                        <p><span className="font-semibold">Tesis central:</span> {EXAMPLE_MEETING_ARCHITECTURE.centralThesis}</p>
                                        <p><span className="font-semibold">Criterio / evidencia:</span> {EXAMPLE_MEETING_ARCHITECTURE.criterionOrEvidence}</p>
                                        <p><span className="font-semibold">Implicación ejecutiva:</span> {EXAMPLE_MEETING_ARCHITECTURE.executiveImplication}</p>
                                        <p><span className="font-semibold">Cierre corto:</span> {EXAMPLE_MEETING_ARCHITECTURE.shortClosing}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Timing e intervención)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Momento / señal</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Qué haré</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_MEETING_TIMING_MAP.map((row) => (
                                                    <tr key={`wb6-meeting-modal-step4-${row.momentOrSignal}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.momentOrSignal}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.plannedAction}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Auditoría de huella)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[860px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ejemplo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {([
                                                    { label: 'Cómo entré', value: EXAMPLE_MEETING_FOOTPRINT_AUDIT.entryQuality },
                                                    { label: 'Cómo sostuve el espacio', value: EXAMPLE_MEETING_FOOTPRINT_AUDIT.spaceSustainment },
                                                    { label: 'Qué aporté', value: EXAMPLE_MEETING_FOOTPRINT_AUDIT.realContribution },
                                                    { label: 'Percepción probable', value: EXAMPLE_MEETING_FOOTPRINT_AUDIT.likelyPerception },
                                                    { label: 'Qué haría distinto', value: EXAMPLE_MEETING_FOOTPRINT_AUDIT.nextAdjustment }
                                                ] as const).map((row) => (
                                                    <tr key={`wb6-meeting-modal-step5-${row.label}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.label}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showMeetingExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de presencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowMeetingExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> hablar por nervio, repetir puntos ya dichos o entrar fuera de timing.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> intervenir en el momento justo, sintetizar con criterio y cerrar con una recomendación breve.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceHelp && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ayuda — Coherencia verbal y no verbal</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceHelp(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>• Cuando hay contradicción, la audiencia suele confiar más en la forma que en la declaración verbal.</p>
                                        <p>• Coherencia no es rigidez: es alineación entre lo que dices y cómo lo sostienes.</p>
                                        <p>• Una presencia ejecutiva sólida exige que cuerpo, voz y mensaje vayan en la misma dirección.</p>
                                        <p>• Detectar y reparar microincongruencias es parte central de la presencia estratégica.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceExampleStep1 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 1 (Mapa de congruencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceExampleStep1(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1000px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Dimensión</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Intención</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Lo percibido</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_CONGRUENCE_MAP.map((row) => (
                                                    <tr key={`wb6-coherence-modal-step1-${row.dimension}`}>
                                                        <td className="px-3 py-2 text-sm font-semibold text-slate-900 border-b border-slate-100">{row.dimension}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.intendedMessage}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.perceivedSignal}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceExampleStep2 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 2 (Contradicciones perceptivas)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceExampleStep2(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1100px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Lo que digo</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Señal contradictoria</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Lectura probable</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_PERCEPTIVE_CONTRADICTIONS.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-modal-step2-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.verbalStatement}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.contradictorySignal}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.likelyReading}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.priorityAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceExampleStep3 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 3 (Laboratorio frase–señal)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceExampleStep3(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1200px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Frase</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Idea</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Tono</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Postura / gesto</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Evitar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_PHRASE_SIGNAL_LAB.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-modal-step3-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.keyPhrase}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.installedIdea}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.neededTone}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.supportingPostureOrGesture}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.whatToAvoid}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceExampleStep4 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 4 (Semáforo de alineación)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceExampleStep4(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[940px] text-left border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Señal</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Nivel</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Cuándo aparece</th>
                                                    <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500 border-b border-slate-200">Ajuste</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {EXAMPLE_EXPRESSIVE_TRAFFIC.map((row, rowIndex) => (
                                                    <tr key={`wb6-coherence-modal-step4-${rowIndex}`}>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.signal}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.level}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.whenAppears}</td>
                                                        <td className="px-3 py-2 text-sm text-slate-700 border-b border-slate-100">{row.requiredAdjustment}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceExampleStep5 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 5 (Protocolo de reparación)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceExampleStep5(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-2.5 text-sm text-slate-700">
                                        <p><span className="font-semibold">Señal de alerta:</span> {EXAMPLE_INCOHERENCE_REPAIR_PROTOCOL.alertSignal}</p>
                                        <p><span className="font-semibold">Corrección corporal:</span> {EXAMPLE_INCOHERENCE_REPAIR_PROTOCOL.bodyCorrection}</p>
                                        <p><span className="font-semibold">Corrección vocal:</span> {EXAMPLE_INCOHERENCE_REPAIR_PROTOCOL.vocalCorrection}</p>
                                        <p><span className="font-semibold">Frase de reordenamiento:</span> {EXAMPLE_INCOHERENCE_REPAIR_PROTOCOL.reorderingPhrase}</p>
                                        <p><span className="font-semibold">Idea a reinstalar:</span> {EXAMPLE_INCOHERENCE_REPAIR_PROTOCOL.ideaToReinstall}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCoherenceExampleStep6 && !isExportingAll && (
                            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm px-4 py-8">
                                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">Ejemplo — Paso 6 (Test de coherencia)</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoherenceExampleStep6(false)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Señal débil:</span> decir “confío en el equipo” mientras el cuerpo se tensa y el tono suena controlador.
                                        </p>
                                        <p>
                                            <span className="font-semibold">Señal mejorada:</span> sostener la frase con torso abierto, tono estable y gesto de apertura moderado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isExportingAll && (
                            <nav className={`wb6-page-nav ${WORKBOOK_V2_EDITORIAL.classes.bottomNav}`}>
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
                    .wb6-toolbar,
                    .wb6-sidebar,
                    .wb6-page-nav {
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
                    .wb6-print-page {
                        position: relative !important;
                        padding-top: 14mm !important;
                        border-top: 3px solid #1d4ed8 !important;
                    }
                    .wb6-print-page:not(.wb6-cover-page)::before {
                        content: "WB6 · Lenguaje verbal y no verbal de impacto · " attr(data-print-title);
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
                    .wb6-print-page::after {
                        content: attr(data-print-page) " · " attr(data-print-meta);
                        position: absolute;
                        left: 2mm;
                        right: 2mm;
                        bottom: 2mm;
                        font-size: 10px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .wb6-cover-page {
                        padding-top: 0 !important;
                        border-top: 4px solid #0f172a !important;
                    }
                    .wb6-cover-page::before {
                        content: none !important;
                    }
                    .wb6-cover-hero {
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
