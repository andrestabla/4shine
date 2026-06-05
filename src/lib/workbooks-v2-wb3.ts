// WB3 V3 - Propósito y valores no negociables
// Estructura derivada de "WB3 — Propósito y valores no negociablesV3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB3Config = WB1Config

export const WB3_V3_CONFIG: WB3Config = {
    code: 'WB3',
    version: 'V3',
    title: 'Propósito y valores no negociables',
    pillar: 'Shine Within (Esencia y autoliderazgo)',
    sourceLabel: 'WB3 — Propósito y valores no negociables V3 (2026)',
    storageKey: 'workbooks-v2-wb3-v3-state',
    downloadFileName: 'wb3-proposito-y-valores.html',
    summary:
        'Workbook digital para formular tu propósito personal, definir tus valores y no negociables, declarar tu propio éxito y mapear el legado que quieres construir.',
    introduction:
        'Este workbook te invita a formular con mayor claridad tu propósito personal y los valores que sostienen tu forma de vivir, decidir y liderar. Vas a explorar qué te mueve, qué tipo de contribución quieres hacer, a quién quieres servir, qué impacto deseas generar y qué principios quieres proteger cuando aumente la presión. El propósito es una dirección interna que te ayuda a decidir con más coherencia, ordenar prioridades y reconocer cuándo estás actuando desde sentido o desde presión externa.',
    objective:
        'Identificar qué vida, qué liderazgo y qué contribución se sienten verdaderamente coherentes contigo, y dejar formulado un propósito, valores y no negociables que funcionen como brújula para decidir.',
    deliverables: [
        'Una primera formulación de tu Propósito Personal.',
        'Mayor claridad sobre lo que te mueve y lo que quieres aportar.',
        'Una identificación de tus valores principales.',
        'Una definición de tus no negociables.',
        'Una declaración personal de éxito.',
        'Un primer ajuste de coherencia para llevar tu propósito a una decisión concreta.'
    ],
    competencies: [
        'Claridad de propósito',
        'Integridad y coherencia',
        'Autenticidad',
        'Práctica reflexiva',
        'Alineación de metas y decisiones'
    ],
    observableBehaviours: [
        'Articulas un "para qué" claro que conecta tu trabajo diario con un impacto mayor.',
        'Utilizas tu propósito como filtro para tomar decisiones difíciles.',
        'Actúas de forma congruente con los valores que declaras.',
        'Sostienes tus principios éticos bajo presión.',
        'Tomas decisiones alineadas con lo que consideras importante.',
        'Reconoces incoherencias entre lo que valoras y lo que haces.',
        'Revisas tu vida y tu liderazgo desde criterios propios, no solo desde expectativas externas.'
    ],
    rules: [
        'Responde desde tu vida real, no desde lo que debería sonar correcto.',
        'Escribe con honestidad. Una frase sencilla y verdadera vale más que una declaración inspiradora que no te representa.',
        'Usa ejemplos concretos. Si dices que un valor es importante, piensa en una decisión reciente donde ese valor se haya visto.',
        'Permite que aparezcan tensiones. Si descubres distancia entre lo que valoras y lo que haces, eso ya es información valiosa.',
        'Este workbook no busca adornar tu identidad. Busca ayudarte a decidir mejor.'
    ],
    closing:
        'Tu propósito empieza a tener fuerza cuando deja de ser una frase y empieza a funcionar como criterio. Úsalo para decidir, cuidar tus valores y reconocer a qué quieres decir sí y a qué quieres renunciar. Tu propósito no tiene que impresionar. Tiene que orientarte.',
    sections: [
        {
            id: 'detonadoras',
            label: '1. Preguntas detonadoras de propósito',
            shortLabel: 'Detonadoras',
            purpose:
                'Antes de escribir tu propósito, mira qué aparece una y otra vez en tu historia, tus decisiones, tus intereses, tus límites y tu forma natural de aportar. Estas preguntas abren reflexión; respóndelas con libertad sin intentar cerrar todavía una frase perfecta.',
            concepts: ['Propósito como patrón', 'Vida coherente', 'Contribución natural', 'Brújula interna'],
            narrative: [
                {
                    title: 'El éxito externo no siempre es coherencia interna',
                    body:
                        'Muchas personas pasan años persiguiendo objetivos que alguna vez creyeron importantes sin detenerse a preguntarse si todavía representan quiénes son realmente. Por eso no es extraño encontrar líderes exitosos que, aun teniendo resultados, reconocimiento o posiciones importantes, sienten cansancio, desconexión o sensación de estar viviendo lejos de sí mismos. Durante años muchas decisiones se toman desde expectativa, validación, miedo, comparación o presión social. Algunas generan crecimiento, pero también pueden alejarnos silenciosamente de lo que realmente valoramos.'
                },
                {
                    title: 'El propósito aparece como patrón',
                    body:
                        'El propósito no siempre aparece como una revelación. Muchas veces aparece como un patrón: está en aquello que constantemente te mueve, te importa, te duele, te inspira, te hace sentir útil o te conecta con energía y sentido. No tiene que ver con cambiar el mundo completo: a veces tiene que ver con la forma en que quieres impactar el mundo que te rodea. Tampoco elimina el miedo o los momentos difíciles. Lo que hace es darte una dirección más clara cuando aparecen.'
                },
                {
                    title: 'Brújula, no frase inspiradora',
                    body:
                        'El propósito es una brújula que te ayuda a decidir: qué construir, qué sostener, qué dejar ir, dónde poner energía, y qué ya no estás dispuesto a sacrificar. Este workbook no busca una frase perfecta: busca identificar qué vida, qué liderazgo y qué contribución se sienten verdaderamente coherentes contigo.'
                }
            ],
            groups: [
                {
                    id: 'detonadoras-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-1-1',
                            label:
                                '¿Qué conversación, problema o transformación seguirías persiguiendo incluso si desaparecieran el cargo, el reconocimiento o el dinero?',
                            helper: 'Aquello que harías incluso sin reconocimiento, dinero, cargo, aplauso o incentivo externo.',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb3v3-1-2',
                            label: '¿Qué conversación, problema o causa vuelve una y otra vez a tu vida?',
                            helper:
                                'Observa los temas que te importan de forma persistente: aquello que notas, defiendes, cuestionas o quieres transformar.',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-1-3',
                            label:
                                '¿Qué parte de ti ya no estás dispuesto a traicionar para sostener aprobación, éxito o expectativas externas?',
                            helper:
                                'Principios, límites o valores que quieres cuidar incluso cuando haya presión, ganancia, miedo o expectativa externa.',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-1-4',
                            label: '¿Qué harías si te quedara un año de vida?',
                            helper:
                                'Un año para enfocar tu energía, experiencia e influencia. ¿Qué elegirías construir, reparar, enseñar, transformar o dejar encaminado?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-1-5',
                            label: '¿A quién te importa servir o impactar?',
                            helper:
                                'Personas, equipos, comunidades, organizaciones, causas o sistemas donde tu contribución tiene sentido para ti.',
                            rows: 3
                        },
                        {
                            id: 'wb3v3-1-6',
                            label: '¿Qué cambio te gustaría provocar en otros después de haber trabajado o interactuado contigo?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-1-7',
                            label: '¿Qué suelen buscar otros en ti cuando necesitan apoyo, claridad, criterio o dirección?',
                            helper: 'A veces el propósito aparece en aquello que otros ya reciben de nosotros.',
                            rows: 3
                        },
                        {
                            id: 'wb3v3-1-8',
                            label: '¿Qué parte de tu historia explica la contribución que hoy quieres hacer?',
                            helper:
                                'Conecta con tu historia personal: ¿qué viviste, aprendiste, superaste o comprendiste que hoy influye en tu forma de aportar?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-1-9',
                            label:
                                '¿Qué tendría que ser verdad sobre tu vida y liderazgo para sentir que no solo fuiste exitoso, sino profundamente coherente contigo mismo?',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'mapa-hallazgos',
            label: '2. Mapa de hallazgos',
            shortLabel: 'Mapa de hallazgos',
            purpose:
                'Ordena lo que apareció en las preguntas anteriores. El objetivo es encontrar patrones, no construir todavía una frase final.',
            groups: [
                {
                    id: 'hallazgos-tabla',
                    title: 'Mapa de hallazgos',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Dimensión', 'Mi hallazgo'],
                    fields: [
                        { id: 'wb3v3-2-1', label: 'Lo que más me mueve', aiSuggested: true },
                        { id: 'wb3v3-2-2', label: 'Lo que sé aportar con más naturalidad', aiSuggested: true },
                        {
                            id: 'wb3v3-2-3',
                            label: 'El tipo de personas, equipos o causas que quiero impactar',
                            aiSuggested: true
                        },
                        { id: 'wb3v3-2-4', label: 'El problema que más me importa transformar', aiSuggested: true },
                        { id: 'wb3v3-2-5', label: 'El valor que más quiero proteger', aiSuggested: true },
                        { id: 'wb3v3-2-6', label: 'Lo que no estoy dispuesto a negociar', aiSuggested: true },
                        { id: 'wb3v3-2-7', label: 'La transformación que quiero facilitar', aiSuggested: true },
                        { id: 'wb3v3-2-8', label: 'La huella que quiero dejar', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'declaracion-proposito',
            label: '3. Mi declaración de Propósito Personal',
            shortLabel: 'Declaración',
            purpose:
                'Formula tu declaración de propósito personal. Debe ser sencilla, clara y útil para decidir. No necesita explicarlo todo: necesita expresar la dirección central de tu contribución.',
            prompts: [
                'Fórmula 4Shine: Estoy aquí para [acción] a/en [persona, equipo, comunidad u organización] para [impacto o transformación].',
                'Una frase honesta vale más que una elaborada para sonar bien.'
            ],
            groups: [
                {
                    id: 'pasos-formula',
                    title: 'Construcción paso a paso',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-3-paso1',
                            label: 'Paso 1 — Acción: estoy aquí para…',
                            helper:
                                '¿Qué vienes a hacer, activar, transformar, despertar, construir, sanar, ordenar, movilizar, facilitar o expandir?',
                            rows: 2,
                            kind: 'completion'
                        },
                        {
                            id: 'wb3v3-3-paso2',
                            label: 'Paso 2 — A/en (a quién o en qué contextos)…',
                            helper: '¿En quiénes o en qué contextos quieres generar esa contribución?',
                            rows: 2,
                            kind: 'completion'
                        },
                        {
                            id: 'wb3v3-3-paso3',
                            label: 'Paso 3 — Para qué (transformación deseada)…',
                            helper: '¿Qué transformación quieres que ocurra gracias a esa contribución?',
                            rows: 2,
                            kind: 'completion'
                        }
                    ]
                },
                {
                    id: 'version-integrada',
                    title: 'Paso 4 — Versión integrada (IA)',
                    description: 'La IA puede unir los pasos en una frase fluida que puedes editar.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Integrar declaración con IA',
                    columns: ['Elemento', 'Mi declaración'],
                    fields: [
                        { id: 'wb3v3-3-int-1', label: 'Mi frase integrada de propósito', aiSuggested: true }
                    ]
                },
                {
                    id: 'chequeo',
                    title: 'Chequeo de claridad',
                    description:
                        'Para cada criterio responde "Sí" o "En ajuste" y explica brevemente qué te falta.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-3-ch-1', label: '¿Tiene una acción clara? (Sí / En ajuste)', rows: 2 },
                        { id: 'wb3v3-3-ch-2', label: '¿Nombra a quién quieres servir o impactar?', rows: 2 },
                        { id: 'wb3v3-3-ch-3', label: '¿Expresa una transformación deseada?', rows: 2 },
                        { id: 'wb3v3-3-ch-4', label: '¿Suena a ti?', rows: 2 },
                        { id: 'wb3v3-3-ch-5', label: '¿Podrías usarla para tomar una decisión difícil?', rows: 2 },
                        { id: 'wb3v3-3-ch-6', label: '¿Te exige coherencia?', rows: 2 },
                        {
                            id: 'wb3v3-3-ajuste',
                            label: 'Ajuste que necesito hacer a mi declaración de propósito',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'ecosistema',
            label: '3.1 Mi Ecosistema de Propósito',
            shortLabel: 'Pasión · Vocación · Misión · Profesión',
            purpose:
                'Cuando Pasión, Vocación, Misión y Profesión se alinean aparece una sensación de coherencia, energía y dirección difícil de explicar. Cuando están desconectados, sentimos una brecha entre lo que hacemos y lo que realmente nos mueve.',
            concepts: [
                'Pasión — lo que te genera energía',
                'Vocación — lo que otros reconocen en ti',
                'Misión — la contribución que eliges realizar',
                'Profesión — el vehículo concreto'
            ],
            narrative: [
                {
                    title: 'Pasión, vocación, misión, profesión',
                    body:
                        'Pasión: aquello que disfrutas explorar incluso cuando nadie te lo pide; lo que despierta curiosidad y motivación de forma natural. Vocación: la contribución que otros reconocen en ti; la forma en que ayudas, inspiras, desarrollas, construyes o transformas a otros. Misión: la contribución que eliges realizar; el cambio que deseas ayudar a crear. Profesión: el vehículo práctico mediante el cual expresas tu talento, experiencia y conocimientos. La profesión puede cambiar; la misión y la vocación suelen ser más estables.'
                }
            ],
            groups: [
                {
                    id: 'pasion',
                    title: 'Explorando mi Pasión',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-31-pa-1', label: '¿Qué temas, conversaciones o problemas me generan energía de manera natural?', rows: 3 },
                        { id: 'wb3v3-31-pa-2', label: '¿Sobre qué podría hablar durante horas sin sentir agotamiento?', rows: 3 },
                        { id: 'wb3v3-31-pa-3', label: '¿Qué actividades disfruto incluso cuando no existe reconocimiento o recompensa?', rows: 3 },
                        { id: 'wb3v3-31-pa-4', label: '¿Qué me inspira, emociona o despierta mi curiosidad constantemente?', rows: 3 }
                    ]
                },
                {
                    id: 'vocacion',
                    title: 'Explorando mi Vocación',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-31-vo-1', label: '¿Qué suelen buscar las personas en mí cuando necesitan apoyo, claridad o dirección?', rows: 3 },
                        { id: 'wb3v3-31-vo-2', label: '¿Qué capacidades reconocen otros en mí de forma repetitiva?', rows: 3 },
                        { id: 'wb3v3-31-vo-3', label: '¿Qué tipo de transformación ayudo a generar naturalmente en otros?', rows: 3 },
                        { id: 'wb3v3-31-vo-4', label: '¿Qué siento que estoy llamado a aportar más allá de un cargo o una posición?', rows: 3 }
                    ]
                },
                {
                    id: 'mision',
                    title: 'Explorando mi Misión',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-31-mi-1', label: '¿Qué cambio me gustaría ayudar a construir en el mundo que me rodea?', rows: 3 },
                        { id: 'wb3v3-31-mi-2', label: '¿Qué problema o desafío siento que vale la pena dedicar parte de mi vida a transformar?', rows: 3 },
                        { id: 'wb3v3-31-mi-3', label: '¿Qué impacto quisiera que existiera gracias a mi trabajo y liderazgo?', rows: 3 },
                        { id: 'wb3v3-31-mi-4', label: '¿Qué me gustaría que continuara existiendo incluso cuando ya no esté presente?', rows: 3 }
                    ]
                },
                {
                    id: 'profesion',
                    title: 'Explorando mi Profesión',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-31-pr-1', label: '¿Cuál es hoy el principal vehículo a través del cual genero valor?', rows: 3 },
                        { id: 'wb3v3-31-pr-2', label: '¿Qué experiencia, conocimiento o expertise utilizo para contribuir?', rows: 3 },
                        { id: 'wb3v3-31-pr-3', label: '¿Qué rol o tipo de contribución me gustaría desempeñar en el futuro?', rows: 3 }
                    ]
                },
                {
                    id: 'integracion',
                    title: 'Integración de hallazgos (IA)',
                    description: 'La IA puede sintetizar cada dimensión a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar síntesis con IA',
                    columns: ['Dimensión', 'Síntesis'],
                    fields: [
                        { id: 'wb3v3-31-syn-pa', label: 'Pasión', aiSuggested: true },
                        { id: 'wb3v3-31-syn-vo', label: 'Vocación', aiSuggested: true },
                        { id: 'wb3v3-31-syn-mi', label: 'Misión', aiSuggested: true },
                        { id: 'wb3v3-31-syn-pr', label: 'Profesión', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'valores-no-negociables',
            label: '4. Valores y no negociables',
            shortLabel: 'Valores · No negociables',
            purpose:
                'Tu propósito necesita valores que lo sostengan. Los valores son criterios internos que orientan decisiones; los no negociables son límites que protegen esos valores cuando hay presión. Un valor se vuelve real cuando se nota en decisiones, conversaciones, renuncias y prioridades.',
            narrative: [
                {
                    title: 'La incoherencia consume energía silenciosamente',
                    body:
                        'Uno de los mayores desgastes emocionales del liderazgo ocurre cuando existe demasiada distancia entre lo que una persona dice valorar, lo que realmente prioriza y la manera como está viviendo. Cuando un líder vive desconectado de sus valores, el cuerpo lo siente: aparece agotamiento, irritabilidad, vacío o sensación de estar funcionando en automático. Por eso los valores no son conceptos decorativos: son tus criterios de vida.'
                }
            ],
            groups: [
                {
                    id: 'mis-valores',
                    title: 'Paso 1 — Mis valores principales (5 a 7)',
                    description: 'Para cada valor indica qué significa para ti y cómo se ve en tu conducta.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-4-v1', label: 'Valor 1 — Significado y cómo se ve en mi conducta', rows: 3 },
                        { id: 'wb3v3-4-v2', label: 'Valor 2 — Significado y cómo se ve en mi conducta', rows: 3 },
                        { id: 'wb3v3-4-v3', label: 'Valor 3 — Significado y cómo se ve en mi conducta', rows: 3 },
                        { id: 'wb3v3-4-v4', label: 'Valor 4 — Significado y cómo se ve en mi conducta', rows: 3 },
                        { id: 'wb3v3-4-v5', label: 'Valor 5 — Significado y cómo se ve en mi conducta', rows: 3 },
                        { id: 'wb3v3-4-v6', label: 'Valor 6 (opcional)', rows: 2 },
                        { id: 'wb3v3-4-v7', label: 'Valor 7 (opcional)', rows: 2 }
                    ]
                },
                {
                    id: 'no-negociables',
                    title: 'Paso 2 — Mis 3 no negociables',
                    description: 'Para cada uno completa: No negocio [valor], aunque eso implique ___.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-4-nn-1',
                            label: '1. No negocio ___, aunque eso implique ___',
                            kind: 'completion',
                            rows: 3,
                            placeholder: 'Ej. No negocio la honestidad, aunque eso implique tener una conversación incómoda.'
                        },
                        {
                            id: 'wb3v3-4-nn-2',
                            label: '2. No negocio ___, aunque eso implique ___',
                            kind: 'completion',
                            rows: 3
                        },
                        {
                            id: 'wb3v3-4-nn-3',
                            label: '3. No negocio ___, aunque eso implique ___',
                            kind: 'completion',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'aplicacion',
                    title: 'Paso 3 — Aplicación en mi entorno profesional',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-4-ap-1', label: '¿Qué decisiones estás tomando hoy únicamente por expectativa externa?', rows: 4 },
                        { id: 'wb3v3-4-ap-2', label: '¿Dónde estás sacrificando coherencia por reconocimiento?', rows: 4 },
                        {
                            id: 'wb3v3-4-ap-3',
                            label: '¿Qué éxito estás persiguiendo que ya no representa tu propósito personal?',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'rueda-coherencia',
            label: '5. Rueda breve y Brújula de coherencia vital',
            shortLabel: 'Rueda + brújula',
            purpose:
                'Tu propósito se sostiene en una vida concreta. La rueda te ayuda a observar si las áreas principales están dando soporte o generando tensión. La brújula identifica dónde hoy existe alineación y dónde tu vida está empezando a pedir ajustes. No busques equilibrio perfecto; observa tu realidad.',
            groups: [
                {
                    id: 'rueda',
                    title: 'Rueda breve · Puntaje 0–10 + explicación',
                    description: '0 = muy descuidado o desconectado · 10 = muy presente, cuidado y coherente.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-5-r-1', label: 'Propósito y sentido (puntaje 0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-2', label: 'Bienestar físico y energía (0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-3', label: 'Equilibrio emocional (0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-4', label: 'Relaciones significativas (0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-5', label: 'Trabajo / contribución (0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-6', label: 'Crecimiento y aprendizaje (0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-7', label: 'Descanso / disfrute (0–10 + explicación)', rows: 3 },
                        { id: 'wb3v3-5-r-8', label: 'Libertad financiera (0–10 + explicación)', rows: 3 }
                    ]
                },
                {
                    id: 'lectura-rueda',
                    title: 'Lectura de la rueda',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-5-lr-1', label: '¿Qué área necesita más atención hoy?', rows: 3 },
                        { id: 'wb3v3-5-lr-2', label: '¿Qué área está sosteniendo mejor tu propósito?', rows: 3 },
                        { id: 'wb3v3-5-lr-3', label: '¿Qué desbalance empieza a afectar tu forma de vivir o liderar?', rows: 3 },
                        { id: 'wb3v3-5-lr-4', label: '¿Qué área, si mejora, tendría un efecto positivo en las demás?', rows: 3 },
                        { id: 'wb3v3-5-lr-5', label: '¿Qué ajuste concreto puedes hacer esta semana?', rows: 3 }
                    ]
                },
                {
                    id: 'foco-coherencia',
                    title: 'Mi foco de coherencia esta semana (IA)',
                    description: 'La IA puede armar tu foco a partir de la lectura de la rueda.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Respuesta'],
                    fields: [
                        { id: 'wb3v3-5-fc-1', label: 'Área crítica', aiSuggested: true },
                        { id: 'wb3v3-5-fc-2', label: 'Razón (área crítica)', aiSuggested: true },
                        { id: 'wb3v3-5-fc-3', label: 'Área palanca', aiSuggested: true },
                        { id: 'wb3v3-5-fc-4', label: 'Razón (área palanca)', aiSuggested: true },
                        { id: 'wb3v3-5-fc-5', label: 'Primer ajuste concreto', aiSuggested: true }
                    ]
                },
                {
                    id: 'brujula',
                    title: '5.1 Brújula de coherencia · Puntaje 1–10 + reflexión',
                    description: '1 = completamente desconectado · 10 = profundamente alineado y coherente.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-51-b-1', label: 'Mi trabajo está alineado con lo que considero importante', rows: 3 },
                        { id: 'wb3v3-51-b-2', label: 'Mi forma de liderar refleja mis valores', rows: 3 },
                        { id: 'wb3v3-51-b-3', label: 'Estoy cuidando mi bienestar emocional y energético', rows: 3 },
                        { id: 'wb3v3-51-b-4', label: 'Mi ritmo de vida es sostenible', rows: 3 },
                        {
                            id: 'wb3v3-51-b-5',
                            label: 'Estoy tomando decisiones desde convicción y no solo desde presión externa',
                            rows: 3
                        },
                        { id: 'wb3v3-51-b-6', label: 'Mi éxito actual se siente coherente conmigo', rows: 3 },
                        { id: 'wb3v3-51-b-7', label: 'Estoy construyendo relaciones alineadas con quien quiero ser', rows: 3 },
                        { id: 'wb3v3-51-b-8', label: 'Siento sentido en la etapa profesional que estoy viviendo', rows: 3 },
                        { id: 'wb3v3-51-b-9', label: 'Mi liderazgo refleja autenticidad y no solo adaptación', rows: 3 },
                        { id: 'wb3v3-51-b-10', label: 'Estoy honrando los límites que necesito cuidar', rows: 3 }
                    ]
                },
                {
                    id: 'reflexion-brujula',
                    title: 'Preguntas de reflexión (brújula)',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-51-rf-1',
                            label: '¿Dónde siento hoy la mayor distancia entre lo que valoro y cómo estoy viviendo?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-51-rf-2',
                            label: '¿Qué estoy sosteniendo únicamente por miedo, costumbre o expectativa externa?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-51-rf-3',
                            label: '¿Qué ajuste tendría el mayor impacto positivo en mi coherencia personal?',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'declaracion-exito',
            label: '6. Declaración de éxito personal',
            shortLabel: 'Éxito personal',
            purpose:
                'Define qué significa éxito para ti. El éxito personal no es solo logro, cargo, reconocimiento o acumulación: en este workbook significa vivir y liderar de acuerdo con tus criterios, tu propósito y tus valores.',
            groups: [
                {
                    id: 'exito-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-6-1', label: 'Para mí, una vida exitosa incluye…', rows: 4 },
                        { id: 'wb3v3-6-2', label: 'Lo que no quiero sacrificar para tener éxito es…', rows: 4 },
                        { id: 'wb3v3-6-3', label: 'Una señal de que me estoy alejando de mi propio éxito sería…', rows: 4 },
                        {
                            id: 'wb3v3-6-4',
                            label: 'Lo que quiero poder decir de mi vida y mi liderazgo dentro de algunos años es…',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'autentico-vs-impuesto',
                    title: 'Éxito auténtico vs. éxito impuesto',
                    kind: 'questions',
                    fields: [
                        { id: 'wb3v3-6-au', label: 'Éxito auténtico para mí', rows: 4 },
                        { id: 'wb3v3-6-im', label: 'Éxito impuesto, heredado o aprendido de otros', rows: 4 }
                    ]
                },
                {
                    id: 'declaracion-exito-formula',
                    title: 'Mi declaración de éxito personal',
                    description: 'Fórmula: Para mí, el éxito es ___ sin sacrificar ___ y contribuyendo a ___.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-6-decl',
                            label: 'Mi declaración integrada',
                            kind: 'long',
                            rows: 5,
                            placeholder:
                                'Para mí, el éxito es _____ sin sacrificar _____ y contribuyendo a _____.'
                        }
                    ]
                }
            ]
        },
        {
            id: 'legado',
            label: '7. Mapa de Legado',
            shortLabel: 'Mapa de Legado',
            purpose:
                'El legado empieza mucho antes del final de la carrera: en la manera como haces sentir a otros, las conversaciones que generas, las oportunidades que abres y la cultura que ayudas a construir todos los días. Tu legado no se define solo por metas o cargos; también por la energía que transmites y la huella humana que dejas.',
            groups: [
                {
                    id: 'legado-q',
                    title: 'Construcción del mapa',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-7-1',
                            label: '1. ¿Qué quiero que las personas recuerden de mí?',
                            helper:
                                '¿Cómo quieres que te recuerden haberte sentido como líder, colega, mentor o ser humano?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-7-2',
                            label: '2. ¿Qué tipo de impacto quiero dejar en organizaciones o equipos?',
                            helper:
                                'Piensa más allá de resultados financieros. ¿Qué cultura, mentalidad o transformación quieres ayudar a construir?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-7-3',
                            label: '3. ¿Qué conversación o mensaje quiero dejar instalado en otros?',
                            helper: '¿Qué mensaje quisieras que otros continúen recordando incluso años después?',
                            rows: 4
                        },
                        {
                            id: 'wb3v3-7-4',
                            label: '4. ¿Qué parte de mí quiero transferir a otros?',
                            helper:
                                'Por ejemplo: valentía, serenidad, humanidad, visión, confianza, autenticidad, resiliencia, etc.',
                            rows: 3
                        },
                        { id: 'wb3v3-7-5', label: '5. ¿Qué me dolería profundamente no haber hecho o construido?', rows: 4 },
                        {
                            id: 'wb3v3-7-6',
                            label: '6. ¿Qué decisiones necesito empezar a tomar hoy para honrar ese legado futuro?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'legado-declaracion',
                    title: 'Mi declaración de legado',
                    description: 'Fórmula: Quiero ser recordado como una persona que ___ y que ayudó a otros a ___.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb3v3-7-decl',
                            label: 'Mi declaración de legado',
                            kind: 'long',
                            rows: 4,
                            placeholder:
                                'Quiero ser recordado como una persona que _____ y que ayudó a otros a _____.'
                        }
                    ]
                },
                {
                    id: 'legado-lectura',
                    title: 'Lectura final del mapa de legado (IA)',
                    description: 'La IA puede sintetizar las dimensiones a partir de lo que respondiste.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar lectura con IA',
                    columns: ['Dimensión', 'Lectura'],
                    fields: [
                        { id: 'wb3v3-7-l-1', label: 'La huella emocional que quiero dejar', aiSuggested: true },
                        { id: 'wb3v3-7-l-2', label: 'El impacto que quiero generar en otros', aiSuggested: true },
                        { id: 'wb3v3-7-l-3', label: 'El tipo de liderazgo que quiero representar', aiSuggested: true },
                        { id: 'wb3v3-7-l-4', label: 'El mensaje que quiero expandir', aiSuggested: true },
                        {
                            id: 'wb3v3-7-l-5',
                            label: 'Lo que no quiero arrepentirme de no haber construido',
                            aiSuggested: true
                        },
                        { id: 'wb3v3-7-l-6', label: 'La decisión que necesito empezar a tomar hoy', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '8. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB3. Esta sección la completa la IA a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
            groups: [
                {
                    id: 'cierre-sintesis',
                    title: 'Síntesis final (IA)',
                    description:
                        'La IA puede generar la síntesis usando todo lo que respondiste arriba.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar síntesis final con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        {
                            id: 'wb3v3-8-1',
                            label:
                                'Mi declaración de propósito (Estoy aquí para ___ a/en ___ para ___)',
                            aiSuggested: true
                        },
                        { id: 'wb3v3-8-2', label: 'Mis 3 valores centrales', aiSuggested: true },
                        {
                            id: 'wb3v3-8-3',
                            label: 'Mis 3 no negociables (No negocio ___ aunque eso implique ___)',
                            aiSuggested: true
                        },
                        {
                            id: 'wb3v3-8-4',
                            label:
                                'Mi declaración de éxito personal (Para mí, el éxito es ___ sin sacrificar ___ y contribuyendo a ___)',
                            aiSuggested: true
                        },
                        {
                            id: 'wb3v3-8-5',
                            label:
                                'Mi legado (Quiero ser recordado como una persona que ___ y que ayudó a otros a ___)',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        }
    ]
}
