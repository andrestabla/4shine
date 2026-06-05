// WB8 V3 - Pensamiento estratégico y toma de decisiones
// Estructura derivada de "WB8 — Pensamiento estratégico y toma de decisiones V3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB8Config = WB1Config

export const WB8_V3_CONFIG: WB8Config = {
    code: 'WB8',
    version: 'V3',
    title: 'Pensamiento estratégico y toma de decisiones',
    pillar: 'Shine Up (Ecosistema relacional)',
    sourceLabel: 'WB8 — Pensamiento estratégico y toma de decisiones V3 (2026)',
    storageKey: 'workbooks-v2-wb8-v3-state',
    downloadFileName: 'wb8-pensamiento-estrategico-decisiones.html',
    summary:
        'Workbook digital para desarrollar pensamiento estratégico: leer contexto, priorizar con criterio, anticipar escenarios, tomar decisiones bajo incertidumbre y construir tu sistema personal de pensamiento estratégico.',
    introduction:
        'A medida que avanzas en tu carrera, las organizaciones esperan que interpretes, priorices, tomes decisiones y veas oportunidades y riesgos antes que los demás. El pensamiento estratégico no consiste en tener todas las respuestas: consiste en observar el contexto con mayor amplitud, identificar lo que realmente importa y decidir conscientemente incluso con información incompleta. La estrategia no consiste en hacer más cosas: consiste en elegir mejor.',
    objective:
        'Desarrollar tu sistema personal de pensamiento estratégico: leer el contexto, priorizar con foco, anticipar escenarios, decidir con criterio y construir tu brújula estratégica para los próximos 12 meses.',
    deliverables: [
        'Una lectura más amplia de tu contexto estratégico actual.',
        'Claridad sobre los desafíos y oportunidades que realmente merecen tu atención.',
        'Un sistema para priorizar iniciativas con mayor criterio.',
        'Una comprensión más profunda de tu estilo de toma de decisiones.',
        'Una decisión estratégica prioritaria para avanzar.',
        'Un plan de validación práctica.',
        'Indicadores claros para medir avance y aprendizaje.'
    ],
    competencies: [
        'Pensamiento estratégico',
        'Toma de decisiones',
        'Decisión bajo incertidumbre',
        'Resolución de problemas',
        'Adaptabilidad e innovación',
        'Gestión del error constructivo',
        'Visión de futuro',
        'Alineación entre acción, valor y resultado'
    ],
    observableBehaviours: [
        'Observas el contexto antes de actuar.',
        'Diferencias lo urgente de lo importante.',
        'Tomas decisiones oportunas sin esperar información perfecta.',
        'Evalúas oportunidades utilizando criterios claros.',
        'Piensas en escenarios antes de actuar.',
        'Identificas riesgos y oportunidades con anticipación.',
        'Mantienes foco en aquello que genera mayor impacto.',
        'Ajustas tu estrategia cuando la evidencia lo requiere.'
    ],
    rules: [
        'No diseñes estrategia desde lo que te gusta hacer, sino desde el valor que puedes generar.',
        'No intentes avanzar en todo al tiempo.',
        'Una estrategia necesita renuncias. Decidir también implica dejar algo por fuera.',
        'Un experimento pequeño bien medido vale más que una idea grande sin prueba.',
        'El foco estratégico debe poder verse en tu agenda, tus conversaciones y tus decisiones.'
    ],
    closing:
        'Las personas operativas se preguntan "¿Qué tengo que hacer?". Los líderes estratégicos se preguntan "¿Qué es lo más importante que debería hacer?". Esa diferencia separa la ejecución de la dirección, la actividad del impacto y el trabajo duro del liderazgo estratégico. Las respuestas cambian con el tiempo; las buenas preguntas permanecen y guiarán las decisiones más importantes de tu carrera. Este workbook termina cuando puedes decir: "Comprendo mejor el contexto. Sé dónde enfocar mi energía. Sé qué decisiones tomar y qué dejar atrás. Tengo criterios claros para priorizar. He construido mi propio sistema para pensar estratégicamente y liderar con mayor intención."',
    sections: [
        {
            id: 'contexto',
            label: '1. Mi Contexto Estratégico Actual',
            shortLabel: 'Contexto',
            purpose:
                'Los líderes estratégicos primero observan el contexto. Entienden qué está cambiando, qué desafíos emergen, dónde hay oportunidades y qué fuerzas pueden influir en sus resultados. Antes de decidir qué hacer, necesitas comprender qué está ocurriendo.',
            concepts: ['Negocio', 'Mercado y entorno', 'Organización y liderazgo', 'Carrera y crecimiento'],
            groups: [
                {
                    id: 'cuatro-dimensiones',
                    title: 'Cuatro dimensiones de tu contexto',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-1-ne',
                            label:
                                '1. Negocio — ¿Qué cambios importantes están ocurriendo en tu organización o área? ¿Qué desafíos y oportunidades emergen?',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb8v3-1-me',
                            label:
                                '2. Mercado y entorno — ¿Qué tendencias observas en tu industria? ¿Qué cambios tecnológicos, económicos, regulatorios o sociales podrían afectar tu trabajo?',
                            rows: 4
                        },
                        {
                            id: 'wb8v3-1-or',
                            label:
                                '3. Organización y liderazgo — ¿Qué necesita hoy tu organización que no necesitaba hace dos años? ¿Qué capacidades serán más valiosas?',
                            rows: 4
                        },
                        {
                            id: 'wb8v3-1-ca',
                            label:
                                '4. Carrera y crecimiento — ¿Qué necesitas desarrollar para acercarte a tu siguiente nivel? ¿Qué brechas observas?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'lectura-estrategica',
                    title: 'Mi lectura estratégica',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-1-le-1', label: '¿Cuál es el desafío más importante que observo hoy?', rows: 3 },
                        { id: 'wb8v3-1-le-2', label: '¿Cuál es la oportunidad más relevante para mi crecimiento?', rows: 3 },
                        { id: 'wb8v3-1-le-3', label: '¿Qué cambio estoy viendo antes que otros?', rows: 3 },
                        {
                            id: 'wb8v3-1-le-4',
                            label: '¿Qué tema merece más atención estratégica durante los próximos meses?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'sintesis-contexto',
                    title: 'Síntesis de contexto estratégico (IA)',
                    description: 'La IA puede sintetizar tu lectura del contexto.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb8v3-1-s-1', label: 'Principal desafío identificado', aiSuggested: true },
                        { id: 'wb8v3-1-s-2', label: 'Principal oportunidad identificada', aiSuggested: true },
                        { id: 'wb8v3-1-s-3', label: 'Tendencia relevante observada', aiSuggested: true },
                        { id: 'wb8v3-1-s-4', label: 'Capacidad que necesito desarrollar', aiSuggested: true },
                        { id: 'wb8v3-1-s-5', label: 'Tema prioritario para los próximos meses', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'priorizacion',
            label: '2. Priorización Estratégica',
            shortLabel: 'Priorización',
            purpose:
                'El recurso más escaso no es el conocimiento, dinero o talento: es tu atención. Los líderes estratégicos distinguen entre lo urgente y lo importante, entre lo atractivo y lo estratégico, entre lo que genera actividad y lo que genera impacto. La actividad genera movimiento; la estrategia genera progreso.',
            narrative: [
                {
                    title: 'Cuatro categorías: Acelerar · Optimizar · Delegar · Eliminar',
                    body:
                        'Acelerar: alto impacto + esfuerzo razonable. Las mejores oportunidades para generar resultados. Optimizar: importantes pero consumen demasiada energía; simplifica, delega o replantea. Delegar: necesarias pero no requieren tu participación directa. Eliminar: consumen tiempo y generan poco valor estratégico; muchas permanecen por costumbre.'
                }
            ],
            groups: [
                {
                    id: 'actividad-vs-impacto',
                    title: 'Diferencia entre actividad e impacto',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-2-act',
                            label:
                                '¿Cuántas de las actividades que ocupan tu agenda contribuyen directamente a tus objetivos más importantes?',
                            rows: 3,
                            kind: 'long'
                        },
                        {
                            id: 'wb8v3-2-inv',
                            label: 'Mis principales frentes de atención son… (lista los principales proyectos / iniciativas)',
                            rows: 5,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'evaluacion-prioridades',
                    title: 'Evaluación estratégica — 5 iniciativas con Impacto/Esfuerzo (1–5)',
                    description: 'Para cada iniciativa indica Impacto 1–5 y Esfuerzo 1–5.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-2-i1', label: 'Iniciativa 1 — Impacto:_ Esfuerzo:_', rows: 2 },
                        { id: 'wb8v3-2-i2', label: 'Iniciativa 2 — Impacto:_ Esfuerzo:_', rows: 2 },
                        { id: 'wb8v3-2-i3', label: 'Iniciativa 3 — Impacto:_ Esfuerzo:_', rows: 2 },
                        { id: 'wb8v3-2-i4', label: 'Iniciativa 4 — Impacto:_ Esfuerzo:_', rows: 2 },
                        { id: 'wb8v3-2-i5', label: 'Iniciativa 5 — Impacto:_ Esfuerzo:_', rows: 2 }
                    ]
                },
                {
                    id: 'cuatro-categorias',
                    title: 'Interpretación: cuatro categorías',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-2-ac', label: '¿Qué iniciativas debo Acelerar? (alto impacto + esfuerzo razonable)', rows: 3 },
                        { id: 'wb8v3-2-op', label: '¿Qué iniciativas debo Optimizar? (importantes pero consumen mucho)', rows: 3 },
                        { id: 'wb8v3-2-de', label: '¿Qué iniciativas podría Delegar o compartir?', rows: 3 },
                        { id: 'wb8v3-2-el', label: '¿Qué iniciativas debería Eliminar o dejar en pausa?', rows: 3 }
                    ]
                },
                {
                    id: 'renuncias',
                    title: 'Las renuncias estratégicas',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-2-r-1',
                            label: '¿Qué estoy sosteniendo hoy que ya no contribuye a mis objetivos futuros?',
                            rows: 3
                        },
                        { id: 'wb8v3-2-r-2', label: '¿Qué conversación necesito tener para liberar espacio y energía?', rows: 3 },
                        { id: 'wb8v3-2-r-3', label: '¿Qué actividad debería dejar de hacer para generar mayor impacto?', rows: 3 }
                    ]
                },
                {
                    id: 'prioridad-principal',
                    title: 'Mi prioridad estratégica principal',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-2-pp-1',
                            label:
                                'Si durante los próximos tres meses sólo pudieras avanzar significativamente en una sola iniciativa, ¿cuál elegirías y por qué?',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb8v3-2-pp-2',
                            label:
                                'Durante los próximos 90 días quiero concentrar mi energía principalmente en… y me comprometo a reducir o eliminar…',
                            rows: 4,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'priorizacion-sintesis',
                    title: 'Síntesis de priorización (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb8v3-2-syn-1', label: 'Mi prioridad estratégica principal es…', aiSuggested: true },
                        { id: 'wb8v3-2-syn-2', label: 'Mis tres renuncias clave son…', aiSuggested: true },
                        { id: 'wb8v3-2-syn-3', label: 'Mi compromiso de enfoque a 90 días es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'escenarios',
            label: '3. Pensamiento de escenarios',
            shortLabel: 'Escenarios',
            purpose:
                'El futuro no puede predecirse con exactitud, pero puedes prepararte mejor para diferentes posibilidades. Muchas decisiones fracasan porque fueron diseñadas para un único escenario. Los líderes estratégicos visualizan distintos caminos posibles, identifican riesgos con anticipación y preparan respuestas antes de que aparezcan los problemas.',
            narrative: [
                {
                    title: 'La estrategia no elimina la incertidumbre',
                    body:
                        'A medida que aumentan las responsabilidades, también aumenta la incertidumbre. Los líderes más efectivos no esperan que desaparezca: aprenden a decidir a pesar de ella. La estrategia no consiste en predecir lo que ocurrirá: consiste en estar preparado para responder cuando ocurra.'
                }
            ],
            groups: [
                {
                    id: 'ilusion-certeza',
                    title: 'La decisión que enfrentas',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-3-d-1', label: '¿Qué decisión importante estoy enfrentando actualmente?', rows: 3 },
                        { id: 'wb8v3-3-d-2', label: '¿Qué elementos de esta decisión generan mayor incertidumbre?', rows: 3 },
                        {
                            id: 'wb8v3-3-d-3',
                            label: '¿Qué información me gustaría tener pero probablemente nunca tendré por completo?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'escenario-1',
                    title: 'Escenario 1 — El mejor resultado posible',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-3-e1-1', label: '¿Qué tendría que ocurrir para que este escenario se materialice?', rows: 3 },
                        { id: 'wb8v3-3-e1-2', label: '¿Qué oportunidades se abrirían para mí?', rows: 3 },
                        { id: 'wb8v3-3-e1-3', label: '¿Cómo aprovecharía este escenario al máximo?', rows: 3 }
                    ]
                },
                {
                    id: 'escenario-2',
                    title: 'Escenario 2 — El más probable',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-3-e2-1', label: '¿Qué crees que ocurrirá?', rows: 3 },
                        { id: 'wb8v3-3-e2-2', label: '¿Qué factores apoyan este escenario?', rows: 3 },
                        {
                            id: 'wb8v3-3-e2-3',
                            label: '¿Qué acciones puedo tomar desde ahora para aumentar la probabilidad de éxito?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'escenario-3',
                    title: 'Escenario 3 — El más desafiante',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-3-e3-1', label: '¿Qué podría salir mal?', rows: 3 },
                        { id: 'wb8v3-3-e3-2', label: '¿Qué riesgos observo?', rows: 3 },
                        {
                            id: 'wb8v3-3-e3-3',
                            label: '¿Qué señales tempranas me indicarían que este escenario está comenzando a ocurrir?',
                            rows: 3
                        },
                        { id: 'wb8v3-3-e3-4', label: '¿Cómo respondería si esto sucediera?', rows: 3 }
                    ]
                },
                {
                    id: 'mapa-riesgos',
                    title: 'Mi mapa de riesgos y oportunidades',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-3-mr-1',
                            label: 'Las tres oportunidades más relevantes que identifico son…',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb8v3-3-mr-2',
                            label: 'Los tres riesgos más importantes que debo monitorear son…',
                            rows: 4,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'preparacion',
                    title: 'Mi estrategia de preparación',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-3-pr-1',
                            label: '¿Qué puedo hacer hoy para aumentar mis posibilidades de éxito sin importar cuál escenario ocurra?',
                            rows: 3
                        },
                        { id: 'wb8v3-3-pr-2', label: '¿Qué capacidades necesito fortalecer para responder mejor a la incertidumbre?', rows: 3 },
                        { id: 'wb8v3-3-pr-3', label: '¿Qué conversaciones debería iniciar ahora?', rows: 3 }
                    ]
                },
                {
                    id: 'escenarios-sintesis',
                    title: 'Síntesis de escenarios (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb8v3-3-syn-1', label: 'La acción robusta para los tres escenarios es…', aiSuggested: true },
                        { id: 'wb8v3-3-syn-2', label: 'Señales tempranas que debo monitorear son…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'decisiones',
            label: '4. Toma de decisiones con criterio',
            shortLabel: 'Decisiones',
            purpose:
                'La calidad de una decisión no depende sólo del resultado: depende de la calidad del proceso. Identifica cómo decides, qué patrones te ayudan, cuáles te limitan y cómo fortalecer tu criterio para actuar con mayor confianza.',
            concepts: [
                'Trampas: información perfecta, consenso absoluto, miedo, status quo, sobre-análisis, delegar lo importante'
            ],
            groups: [
                {
                    id: 'relacion-decisiones',
                    title: 'Mi relación con las decisiones',
                    description:
                        'Marca lo que más aplique: actúo rápido / analizo demasiado / busco consenso / confío en intuición / necesito mucha información / pospongo / consulto a varias personas / evalúo riesgos / priorizo velocidad / priorizo seguridad.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-4-rd-1',
                            label: 'Cuando debo tomar una decisión importante normalmente…',
                            rows: 4,
                            kind: 'long'
                        },
                        { id: 'wb8v3-4-rd-2', label: 'Lo que más me ayuda a tomar buenas decisiones es…', rows: 3 },
                        { id: 'wb8v3-4-rd-3', label: 'Lo que más dificulta mis decisiones es…', rows: 3 }
                    ]
                },
                {
                    id: 'trampas',
                    title: 'Las trampas más comunes al decidir',
                    description: 'Indica para cada una: Frecuente / Ocasional / Rara vez.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-4-t-1', label: 'Esperar información perfecta', rows: 2 },
                        { id: 'wb8v3-4-t-2', label: 'Buscar consenso absoluto', rows: 2 },
                        { id: 'wb8v3-4-t-3', label: 'Decidir desde el miedo', rows: 2 },
                        { id: 'wb8v3-4-t-4', label: 'Mantener el status quo', rows: 2 },
                        { id: 'wb8v3-4-t-5', label: 'Analizar excesivamente', rows: 2 },
                        { id: 'wb8v3-4-t-6', label: 'Delegar decisiones importantes', rows: 2 },
                        { id: 'wb8v3-4-t-7', label: 'Mi principal patrón / trampa de decisión es…', rows: 3 }
                    ]
                },
                {
                    id: 'sistema-personal',
                    title: 'Mi sistema personal de decisiones',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-4-sp-1', label: 'Cuando tomo buenas decisiones suelo…', rows: 3 },
                        { id: 'wb8v3-4-sp-2', label: 'Cuando tomo malas decisiones suelo…', rows: 3 },
                        { id: 'wb8v3-4-sp-3', label: 'Mi principal sesgo es…', rows: 3 },
                        { id: 'wb8v3-4-sp-4', label: 'La evidencia que necesito para actuar suele ser…', rows: 3 },
                        { id: 'wb8v3-4-sp-5', label: 'Lo que nunca debería ignorar al decidir es…', rows: 3 }
                    ]
                },
                {
                    id: 'marco-criterio',
                    title: 'Mi marco personal de criterio',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-4-mc-1',
                            label:
                                'Los tres criterios que más quiero utilizar para tomar decisiones son… (Impacto / Integridad / Propósito / Crecimiento / Aprendizaje / Sostenibilidad / Resultados / Personas / Innovación / Visión largo plazo / otros)',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb8v3-4-mc-2',
                            label:
                                'A partir de hoy quiero tomar decisiones con más… (Claridad / Velocidad / Coraje / Criterio / Confianza / Visión / Disciplina / Serenidad)',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'decisiones-sintesis',
                    title: 'Síntesis de decisiones (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb8v3-4-syn-1', label: 'Mi principal trampa de decisión es…', aiSuggested: true },
                        { id: 'wb8v3-4-syn-2', label: 'Mis tres criterios para decidir son…', aiSuggested: true },
                        { id: 'wb8v3-4-syn-3', label: 'Mi compromiso al decidir es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'sistema',
            label: '5. Mi sistema de pensamiento estratégico',
            shortLabel: 'Mi sistema',
            purpose:
                'Los líderes estratégicos no tienen respuestas para todo: han aprendido a hacerse preguntas diferentes. Construye tu propio sistema: principios, preguntas y criterios que te permitirán tomar mejores decisiones y generar mayor impacto.',
            groups: [
                {
                    id: 'descubrimientos',
                    title: 'Lo que he descubierto sobre mí',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-5-d-1', label: 'Mi principal fortaleza estratégica es…', rows: 3 },
                        { id: 'wb8v3-5-d-2', label: 'El hábito que más limita mi capacidad de pensar estratégicamente es…', rows: 3 },
                        { id: 'wb8v3-5-d-3', label: 'La habilidad estratégica que más necesito desarrollar es…', rows: 3 },
                        { id: 'wb8v3-5-d-4', label: 'El aprendizaje más importante que me llevo es…', rows: 3 }
                    ]
                },
                {
                    id: 'preguntas-poderosas',
                    title: 'Preguntas que quiero hacerme más seguido',
                    description: 'Elige tu pregunta favorita en cada categoría.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb8v3-5-q-1',
                            label:
                                'Para ampliar perspectiva (¿qué no estoy viendo?, ¿qué información me falta?, ¿qué oportunidad podría esconderse detrás de este desafío?)',
                            rows: 3
                        },
                        {
                            id: 'wb8v3-5-q-2',
                            label:
                                'Para priorizar (¿esto es importante o sólo urgente?, ¿qué generará el mayor impacto?, ¿qué debería dejar de hacer?)',
                            rows: 3
                        },
                        {
                            id: 'wb8v3-5-q-3',
                            label:
                                'Para decidir (¿qué decisión estoy evitando?, ¿qué haría si no tuviera miedo?, ¿cuál es el costo de no actuar?)',
                            rows: 3
                        },
                        {
                            id: 'wb8v3-5-q-4',
                            label:
                                'Para crecer como líder (¿qué capacidad necesito desarrollar?, ¿qué conversación estoy postergando?, ¿dónde estoy jugando pequeño?)',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'principios',
                    title: 'Mis principios de pensamiento estratégico',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-5-pr-1', label: 'Quiero ser un líder que…', rows: 3, kind: 'completion' },
                        { id: 'wb8v3-5-pr-2', label: 'Al tomar decisiones importantes priorizaré…', rows: 3, kind: 'completion' },
                        { id: 'wb8v3-5-pr-3', label: 'Nunca quiero sacrificar…', rows: 3, kind: 'completion' },
                        {
                            id: 'wb8v3-5-pr-4',
                            label: 'Mi criterio principal para evaluar oportunidades será…',
                            rows: 3,
                            kind: 'completion'
                        }
                    ]
                },
                {
                    id: 'brujula',
                    title: 'Mi brújula estratégica',
                    kind: 'questions',
                    fields: [
                        { id: 'wb8v3-5-b-1', label: 'Mi prioridad más importante para los próximos 12 meses es…', rows: 3 },
                        { id: 'wb8v3-5-b-2', label: 'La oportunidad que no quiero dejar pasar es…', rows: 3 },
                        { id: 'wb8v3-5-b-3', label: 'La decisión que necesito tomar ahora es…', rows: 3 },
                        { id: 'wb8v3-5-b-4', label: 'Lo que debo dejar atrás para avanzar es…', rows: 3 },
                        { id: 'wb8v3-5-b-5', label: 'El impacto que quiero generar es…', rows: 3 }
                    ]
                },
                {
                    id: 'declaracion',
                    title: 'Mi declaración de pensamiento estratégico (IA)',
                    description: 'La IA puede armar una declaración personal a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar declaración con IA',
                    columns: ['Elemento', 'Mi declaración'],
                    fields: [
                        { id: 'wb8v3-5-dec-1', label: 'Mi declaración de pensamiento estratégico', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '6. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB8. La IA completa esta sección a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
            groups: [
                {
                    id: 'cierre-sintesis',
                    title: 'Síntesis final (IA)',
                    description: 'La IA puede generar la síntesis usando todo lo que respondiste.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar síntesis final con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        {
                            id: 'wb8v3-6-1',
                            label: 'Mi lectura del contexto estratégico actual es…',
                            aiSuggested: true
                        },
                        { id: 'wb8v3-6-2', label: 'Mi prioridad estratégica principal es…', aiSuggested: true },
                        {
                            id: 'wb8v3-6-3',
                            label: 'Los tres escenarios que estoy contemplando son…',
                            aiSuggested: true
                        },
                        { id: 'wb8v3-6-4', label: 'Mi principal trampa de decisión es…', aiSuggested: true },
                        { id: 'wb8v3-6-5', label: 'Mis tres criterios para decidir son…', aiSuggested: true },
                        {
                            id: 'wb8v3-6-6',
                            label: 'Las preguntas estratégicas que quiero hacerme más seguido son…',
                            aiSuggested: true
                        },
                        { id: 'wb8v3-6-7', label: 'Mi brújula estratégica para los próximos 12 meses es…', aiSuggested: true },
                        { id: 'wb8v3-6-8', label: 'Mi declaración de pensamiento estratégico es…', aiSuggested: true },
                        { id: 'wb8v3-6-9', label: 'La decisión que voy a tomar primero es…', aiSuggested: true },
                        { id: 'wb8v3-6-10', label: 'La evidencia de avance será…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
