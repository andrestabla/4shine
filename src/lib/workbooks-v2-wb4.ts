// WB4 V3 - Narrativa profesional y Elevator Pitch
// Estructura derivada de "WB4 — Narrativa profesional y Elevator Pitch V3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB4Config = WB1Config

export const WB4_V3_CONFIG: WB4Config = {
    code: 'WB4',
    version: 'V3',
    title: 'Narrativa profesional y Elevator Pitch',
    pillar: 'Shine Out (Presencia estratégica)',
    sourceLabel: 'WB4 — Narrativa profesional y Elevator Pitch V3 (2026)',
    storageKey: 'workbooks-v2-wb4-v3-state',
    downloadFileName: 'wb4-narrativa-profesional-elevator-pitch.html',
    summary:
        'Workbook digital para construir tu narrativa profesional y un elevator pitch claro, propio y creíble: gancho emocional, valor, evidencia y cierre.',
    introduction:
        'Después de trabajar tu historia personal, gestión emocional y propósito, ahora vas a traducir quién eres, qué has vivido, qué sabes aportar y qué impacto quieres generar en un mensaje que otros puedan entender, recordar y conectar. Aquí construyes tu elevator pitch desde una estructura sencilla: abrir con un gancho emocional, mostrar desde dónde hablas, explicar qué problema o tensión atiendes, comunicar el valor que aportas y cerrar con una idea que deje huella. El objetivo no es sonar perfecto: es sonar claro, propio y creíble.',
    objective:
        'Construir una narrativa profesional clara, humana y estratégica, y producir un elevator pitch en versiones de 30 segundos y 60–90 segundos listo para usar en conversaciones reales.',
    deliverables: [
        'Una narrativa profesional breve.',
        'Una matriz simple de audiencia, tensión, valor y evidencia.',
        'Un gancho emocional.',
        'Un elevator pitch emocional-racional.',
        'Una versión corta de 30 segundos.',
        'Una versión conversacional de 60 a 90 segundos.',
        'Una frase síntesis opcional.',
        'Entre 1 y 3 micro-ejes de comunicación.',
        'Una práctica definida para probar tu pitch en una situación real.'
    ],
    competencies: [
        'Claridad e inspiración',
        'Comunicación de impacto',
        'Influencia ética y persuasión',
        'Adaptabilidad comunicativa',
        'Presencia estratégica',
        'Influencia asíncrona y virtual'
    ],
    observableBehaviours: [
        'Comunicas quién eres y qué aportas con claridad.',
        'Explicas tu valor profesional con ejemplos concretos.',
        'Adaptas tu mensaje según audiencia y contexto.',
        'Evitas acumular cargos, tareas o diplomas sin conexión con valor.',
        'Usas historias, metáforas o tensiones reales para generar conexión.',
        'Transmites credibilidad sin exagerar.',
        'Comunicas tu diferencial desde evidencia, experiencia y coherencia.',
        'Gestionas tu narrativa profesional de forma estratégica en conversaciones, entrevistas, reuniones o espacios digitales.'
    ],
    rules: [
        'Una buena narrativa profesional selecciona. No necesita contarlo todo.',
        'Tu pitch debe sonar como tú. Si suena impostado, pierde fuerza.',
        'Habla desde valor, no desde acumulación de cargos.',
        'La emoción abre conexión. La evidencia sostiene credibilidad.',
        'Tu mensaje debe dejar claro qué problema entiendes, qué transformación facilitas y por qué vale la pena seguir conversando contigo.',
        'Si una afirmación sobre tu valor no tiene ejemplo, experiencia o resultado que la respalde, escríbela en versión más sencilla.'
    ],
    closing:
        'Tu historia profesional gana fuerza cuando deja de ser una lista de cargos y se convierte en una narrativa de valor. Un buen pitch no busca impresionar: busca conectar, aclarar y abrir conversación. La emoción permite que otros se acerquen, la claridad permite que entiendan tu aporte, la evidencia permite que confíen y el cierre permite que te recuerden. Este workbook termina cuando puedes decir: "Sé a quién le hablo. Sé qué tensión nombro. Sé qué valor aporto y sé cómo contarlo con claridad, emoción y evidencia."',
    sections: [
        {
            id: 'historia-profesional',
            label: '1. Mi historia profesional en breve',
            shortLabel: 'Historia profesional',
            purpose:
                'Antes de construir tu pitch, reconoce qué partes de tu historia profesional explican tu forma actual de aportar. No es una biografía: son los elementos esenciales de tu trayectoria.',
            groups: [
                {
                    id: 'historia-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-1-1',
                            label: '¿De dónde vienes profesionalmente?',
                            helper:
                                'Campos, roles, experiencias, industrias, retos o contextos que han formado tu mirada.',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb4v3-1-2',
                            label: '¿Qué experiencia marcó tu manera de trabajar o liderar?',
                            helper:
                                'Un logro, una crisis, una transición, una decisión difícil, un fracaso, una responsabilidad temprana o un momento de aprendizaje.',
                            rows: 4
                        },
                        {
                            id: 'wb4v3-1-3',
                            label: '¿Qué aprendiste que hoy define tu forma de aportar?',
                            helper: 'Una convicción profesional que nació de tu experiencia.',
                            rows: 4
                        },
                        {
                            id: 'wb4v3-1-4',
                            label: '¿Hacia dónde estás construyendo tu siguiente etapa?',
                            helper: 'Impacto, rol, posicionamiento o contribución que quieres fortalecer.',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'historia-sintesis',
                    title: 'Síntesis breve',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb4v3-1-syn-1', label: 'Mi origen profesional se ha construido en…', aiSuggested: true },
                        { id: 'wb4v3-1-syn-2', label: 'Una experiencia que marcó mi enfoque fue…', aiSuggested: true },
                        { id: 'wb4v3-1-syn-3', label: 'Hoy sé que aporto especialmente cuando…', aiSuggested: true },
                        { id: 'wb4v3-1-syn-4', label: 'La dirección profesional que estoy construyendo es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'esencial-mensaje',
            label: '2. Lo esencial de mi mensaje',
            shortLabel: 'Audiencia · Tensión · Valor',
            purpose:
                'Tu pitch necesita cuatro piezas básicas: a quién le hablas, qué tensión vive esa audiencia, qué valor puedes aportar y qué te hace creíble.',
            groups: [
                {
                    id: 'audiencia',
                    title: '2.1 Mi audiencia principal',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-2-au-1',
                            label: '¿A quién quieres hablarle principalmente con este pitch?',
                            helper:
                                'Una empresa, un comité, un cliente, un sponsor, una comunidad, un equipo, una industria o una red profesional.',
                            rows: 3,
                            kind: 'long'
                        },
                        { id: 'wb4v3-2-au-2', label: '¿Qué necesita entender esa audiencia sobre ti?', rows: 3 }
                    ]
                },
                {
                    id: 'tension',
                    title: '2.2 La tensión o problema que atiendo',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-2-te-1',
                            label: '¿Qué tensión, problema o necesidad vive esa audiencia?',
                            helper:
                                'Ejemplos: crecimiento sin claridad; equipos con talento pero sin alineación; estrategias que no se traducen en ejecución; líderes con experiencia pero poca visibilidad; organizaciones con alta exigencia y baja conexión humana; personas en transición que necesitan ordenar su siguiente etapa.',
                            rows: 4
                        },
                        { id: 'wb4v3-2-te-2', label: '¿Por qué esa tensión importa?', rows: 3 }
                    ]
                },
                {
                    id: 'valor',
                    title: '2.3 El valor que aporto',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-2-va-1',
                            label: '¿Qué cambio ayudas a generar?',
                            helper:
                                'Usa verbos concretos: ordenar, transformar, activar, conectar, diseñar, escalar, clarificar, desarrollar, movilizar, fortalecer, simplificar, integrar.',
                            rows: 4
                        },
                        {
                            id: 'wb4v3-2-va-2',
                            label: '¿Qué queda distinto después de trabajar contigo o de escucharte?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'evidencia',
                    title: '2.4 Mi evidencia de credibilidad',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-2-ev-1',
                            label: '¿Qué experiencia, caso, resultado, trayectoria o aprendizaje respalda lo que dices?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'matriz-precision',
                    title: 'Matriz de precisión',
                    description: 'La IA puede completar esta matriz a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Pregunta', 'Mi respuesta'],
                    fields: [
                        { id: 'wb4v3-2-mat-1', label: '¿A quién le hablo?', aiSuggested: true },
                        { id: 'wb4v3-2-mat-2', label: '¿Qué tensión vive esa audiencia?', aiSuggested: true },
                        { id: 'wb4v3-2-mat-3', label: '¿Qué cambio puedo ayudar a generar?', aiSuggested: true },
                        { id: 'wb4v3-2-mat-4', label: '¿Qué me hace creíble para decir esto?', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'gancho-emocional',
            label: '3. Gancho emocional',
            shortLabel: 'Gancho emocional',
            purpose:
                'El gancho emocional abre conexión: es la primera idea que hace que la otra persona quiera seguir escuchando. Un buen gancho nombra una tensión humana, profesional o estratégica que tu audiencia reconoce.',
            prompts: [
                'Ejemplos: "Muchas veces los líderes crecen más rápido que su claridad interna."',
                '"Hay equipos con talento, pero pierden fuerza porque no logran alinearse."',
                '"En momentos de cambio, el problema no siempre es la estrategia; muchas veces es la falta de conversación real."',
                '"A veces una persona tiene mucho valor, pero todavía no sabe contarlo con claridad."'
            ],
            groups: [
                {
                    id: 'gancho-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-3-1',
                            label: '¿Qué tensión humana o profesional quieres nombrar al inicio?',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb4v3-3-2',
                            label: '¿Qué emoción quieres que aparezca al inicio?',
                            helper:
                                'Elige una: identificación, curiosidad, alivio, claridad, esperanza, urgencia, confianza, reconocimiento.',
                            rows: 2
                        },
                        {
                            id: 'wb4v3-3-3',
                            label: 'Escribe tu primer gancho emocional',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb4v3-3-4',
                            label: 'Opciones de apoyo — completa una frase',
                            helper:
                                'Muchas veces, _____ · He visto que _____ · Una de las tensiones más frecuentes en _____ es _____ · En mi experiencia, _____ · Algo que me importa profundamente es _____',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'pitch-completo',
            label: '4. Mi elevator pitch emocional-racional',
            shortLabel: 'Pitch completo',
            purpose:
                'Tu pitch integra emoción, claridad, valor y evidencia en cinco momentos: gancho emocional, desde dónde hablo, problema o tensión central, valor que aporto, evidencia y cierre.',
            groups: [
                {
                    id: 'pitch-momentos',
                    title: '4.1 Estructura del pitch — cinco momentos',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-4-m1',
                            label: 'Momento 1 — Gancho emocional (frase que conecte con una tensión real)',
                            rows: 3
                        },
                        {
                            id: 'wb4v3-4-m2',
                            label: 'Momento 2 — Desde dónde hablo (experiencia, trayectoria o enfoque)',
                            rows: 3
                        },
                        {
                            id: 'wb4v3-4-m3',
                            label: 'Momento 3 — Problema o tensión central que atiendo',
                            rows: 3
                        },
                        { id: 'wb4v3-4-m4', label: 'Momento 4 — Valor que aporto', rows: 3 },
                        {
                            id: 'wb4v3-4-m5-ev',
                            label: 'Momento 5 — Evidencia (experiencia, resultado o aprendizaje que respalde tu valor)',
                            rows: 3
                        },
                        {
                            id: 'wb4v3-4-m5-cierre',
                            label: 'Momento 5 — Cierre emocional (idea que deje sentido)',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'promesa-valor',
                    title: '4.2 Promesa de valor (frase síntesis)',
                    description:
                        'Idea corta que resume tu aporte. Puede funcionar como encabezado de perfil, inicio de presentación o idea guía.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-4-pv',
                            label: 'Mi frase síntesis (promesa de valor)',
                            helper:
                                'Ejemplos: "Transformo complejidad en dirección.", "Convierto experiencia en claridad estratégica.", "Ayudo a líderes a comunicar valor con presencia y coherencia.", "Desarrollo líderes que crecen con propósito y criterio."',
                            rows: 3,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'chequeo-promesa',
                    title: 'Chequeo de la promesa de valor',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-4-ch-1', label: '¿Es breve? (Sí / En ajuste)', rows: 2 },
                        { id: 'wb4v3-4-ch-2', label: '¿Suena propia?', rows: 2 },
                        { id: 'wb4v3-4-ch-3', label: '¿Tiene un verbo claro?', rows: 2 },
                        { id: 'wb4v3-4-ch-4', label: '¿Comunica valor?', rows: 2 },
                        { id: 'wb4v3-4-ch-5', label: '¿Evita sonar genérica?', rows: 2 }
                    ]
                },
                {
                    id: 'pitch-formula',
                    title: '4.3 Fórmula base del pitch',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-4-f-1', label: 'Muchas veces, ___', rows: 3, kind: 'completion' },
                        { id: 'wb4v3-4-f-2', label: 'Mi experiencia se ha construido en ___', rows: 3, kind: 'completion' },
                        { id: 'wb4v3-4-f-3', label: 'Por eso hoy ayudo a (promesa de valor) ___', rows: 3, kind: 'completion' },
                        { id: 'wb4v3-4-f-4', label: 'Me caracterizo por ___', rows: 3, kind: 'completion' },
                        { id: 'wb4v3-4-f-5', label: 'Lo que más me importa es ___', rows: 3, kind: 'completion' }
                    ]
                },
                {
                    id: 'pitch-completo-texto',
                    title: '4.4 Mi pitch completo (6 a 8 líneas)',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-4-completo',
                            label: 'Escribe la primera versión integrada de tu pitch',
                            rows: 8,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'pitch-ia',
                    title: 'Pitch integrado (IA)',
                    description:
                        'La IA puede armar una versión integrada de tu pitch a partir de los cinco momentos y la fórmula.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Integrar pitch con IA',
                    columns: ['Elemento', 'Mi versión'],
                    fields: [
                        { id: 'wb4v3-4-ia-1', label: 'Pitch integrado (6 a 8 líneas)', aiSuggested: true },
                        { id: 'wb4v3-4-ia-2', label: 'Promesa de valor depurada', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'version-30',
            label: '5. Versión corta de 30 segundos',
            shortLabel: 'Versión 30s',
            purpose:
                'Tu pitch debe poder adaptarse. A veces tendrás un minuto, a veces sólo 30 segundos. Esta versión conserva lo esencial: gancho, valor y cierre.',
            prompts: [
                'Fórmula breve: Ayudo a ___ a ___ para que ___. Lo hago desde ___.'
            ],
            groups: [
                {
                    id: 'version-30-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-5-1',
                            label: 'Mi versión de 30 segundos',
                            kind: 'long',
                            rows: 5
                        }
                    ]
                },
                {
                    id: 'chequeo-30',
                    title: 'Chequeo rápido',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-5-ch-1', label: '¿Se entiende a quién ayudo o impacto?', rows: 2 },
                        { id: 'wb4v3-5-ch-2', label: '¿Se entiende qué cambio genero?', rows: 2 },
                        { id: 'wb4v3-5-ch-3', label: '¿Suena natural al decirlo en voz alta?', rows: 2 },
                        { id: 'wb4v3-5-ch-4', label: '¿Tiene una idea emocional o humana?', rows: 2 },
                        { id: 'wb4v3-5-ch-5', label: '¿Podría decirlo sin leer?', rows: 2 }
                    ]
                },
                {
                    id: 'version-30-ia',
                    title: 'Versión de 30 segundos (IA)',
                    description: 'La IA puede generar una versión de 30 segundos a partir del pitch completo.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Versión'],
                    fields: [
                        { id: 'wb4v3-5-ia', label: 'Mi pitch de 30 segundos sugerido', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'version-90',
            label: '6. Versión conversacional de 60–90 segundos',
            shortLabel: 'Versión 60–90s',
            purpose:
                'Para entrevistas, reuniones, conversaciones con sponsors, networking o presentaciones breves. Necesitas explicar quién eres y qué aportas con más contexto.',
            prompts: [
                'Estructura sugerida: gancho emocional → trayectoria o contexto → tensión que entiendes → valor que aportas → evidencia breve → cierre emocional o invitación a conversar.'
            ],
            groups: [
                {
                    id: 'version-90-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-6-1',
                            label: 'Mi versión conversacional (60–90 segundos)',
                            kind: 'long',
                            rows: 8
                        }
                    ]
                },
                {
                    id: 'ajuste-90',
                    title: 'Preguntas de ajuste',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-6-a-1', label: '¿Qué parte suena más fuerte?', rows: 3 },
                        { id: 'wb4v3-6-a-2', label: '¿Qué parte suena demasiado larga o genérica?', rows: 3 },
                        { id: 'wb4v3-6-a-3', label: '¿Qué palabra o frase no suena como yo?', rows: 3 },
                        {
                            id: 'wb4v3-6-a-4',
                            label: '¿Qué quiero que la otra persona recuerde después de escucharme?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'version-90-ia',
                    title: 'Versión 60–90 segundos (IA)',
                    description: 'La IA puede generar una versión conversacional integrando los ajustes.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Versión'],
                    fields: [
                        { id: 'wb4v3-6-ia', label: 'Mi pitch conversacional sugerido', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'micro-ejes',
            label: '7. Micro-ejes de comunicación',
            shortLabel: 'Micro-ejes',
            purpose:
                'Tus micro-ejes son los temas que quieres repetir con intención para que otros comprendan tu mirada, tu valor y tu aporte. No necesitas muchos: empieza con uno, máximo tres. Cada eje responde: qué tema quiero comunicar, qué idea quiero repetir, qué percepción quiero construir.',
            groups: [
                {
                    id: 'eje-1',
                    title: 'Micro-eje 1',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-7-1-tema', label: 'Tema central', rows: 2 },
                        { id: 'wb4v3-7-1-idea', label: 'Idea que quiero repetir', rows: 2 },
                        { id: 'wb4v3-7-1-percepcion', label: 'Percepción que quiero construir', rows: 2 },
                        { id: 'wb4v3-7-1-ejemplo', label: 'Ejemplo de contenido o conversación', rows: 3 }
                    ]
                },
                {
                    id: 'eje-2',
                    title: 'Micro-eje 2 (opcional)',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-7-2-tema', label: 'Tema central', rows: 2 },
                        { id: 'wb4v3-7-2-idea', label: 'Idea que quiero repetir', rows: 2 },
                        { id: 'wb4v3-7-2-percepcion', label: 'Percepción que quiero construir', rows: 2 },
                        { id: 'wb4v3-7-2-ejemplo', label: 'Ejemplo de contenido o conversación', rows: 3 }
                    ]
                },
                {
                    id: 'eje-3',
                    title: 'Micro-eje 3 (opcional)',
                    kind: 'questions',
                    fields: [
                        { id: 'wb4v3-7-3-tema', label: 'Tema central', rows: 2 },
                        { id: 'wb4v3-7-3-idea', label: 'Idea que quiero repetir', rows: 2 },
                        { id: 'wb4v3-7-3-percepcion', label: 'Percepción que quiero construir', rows: 2 },
                        { id: 'wb4v3-7-3-ejemplo', label: 'Ejemplo de contenido o conversación', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'practica-pitch',
            label: '8. Práctica del pitch',
            shortLabel: 'Práctica',
            purpose:
                'Un pitch sólo se vuelve útil cuando puedes decirlo en voz alta. Prepara una primera práctica real durante los próximos 7 días.',
            groups: [
                {
                    id: 'practica-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb4v3-8-1',
                            label: '1. ¿Dónde podrías practicar este pitch durante los próximos 7 días?',
                            helper:
                                'Conversación con un colega, mentor, jefe, cliente, aliado, red profesional o grabación personal.',
                            rows: 3
                        },
                        {
                            id: 'wb4v3-8-2',
                            label: '2. ¿Qué versión vas a practicar? (30 segundos / 60–90 segundos / Ambas)',
                            rows: 2
                        },
                        {
                            id: 'wb4v3-8-3',
                            label: '3. ¿Qué quieres observar al practicarlo?',
                            helper:
                                'Ejemplos: claridad, naturalidad, emoción, duración, credibilidad, conexión, cierre.',
                            rows: 3
                        },
                        {
                            id: 'wb4v3-8-4',
                            label: '4. ¿Qué feedback quieres pedir?',
                            helper:
                                'Ejemplos: ¿qué entendiste de lo que hago?, ¿qué frase recuerdas?, ¿qué parte sonó más auténtica?, ¿qué parte sonó confusa?, ¿qué te dieron ganas de preguntarme?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'plan-practica',
                    title: 'Plan de práctica (IA)',
                    description: 'La IA puede armar tu plan a partir de las respuestas anteriores.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar plan con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb4v3-8-pl-1', label: 'Persona o contexto donde practicaré', aiSuggested: true },
                        { id: 'wb4v3-8-pl-2', label: 'Versión que practicaré', aiSuggested: true },
                        { id: 'wb4v3-8-pl-3', label: 'Lo que quiero observar', aiSuggested: true },
                        { id: 'wb4v3-8-pl-4', label: 'Feedback que voy a pedir', aiSuggested: true },
                        { id: 'wb4v3-8-pl-5', label: 'Ajuste que haré después', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '9. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB4. Esta sección la completa la IA a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
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
                        { id: 'wb4v3-9-1', label: 'Mi audiencia principal es…', aiSuggested: true },
                        { id: 'wb4v3-9-2', label: 'La tensión que quiero nombrar es…', aiSuggested: true },
                        { id: 'wb4v3-9-3', label: 'El valor que aporto es…', aiSuggested: true },
                        { id: 'wb4v3-9-4', label: 'Mi evidencia de credibilidad es…', aiSuggested: true },
                        { id: 'wb4v3-9-5', label: 'Mi gancho emocional es…', aiSuggested: true },
                        { id: 'wb4v3-9-6', label: 'Mi elevator pitch de 30 segundos es…', aiSuggested: true },
                        { id: 'wb4v3-9-7', label: 'Mi versión conversacional de 60–90 segundos es…', aiSuggested: true },
                        { id: 'wb4v3-9-8', label: 'Mi frase síntesis opcional es…', aiSuggested: true },
                        { id: 'wb4v3-9-9', label: 'Mis micro-ejes de comunicación son…', aiSuggested: true },
                        {
                            id: 'wb4v3-9-10',
                            label: 'La primera situación donde voy a practicar mi pitch es…',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        }
    ]
}
