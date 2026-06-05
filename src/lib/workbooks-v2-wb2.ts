// WB2 V3 - Serenidad Estratégica · Gestión emocional
// Estructura derivada de "WB2 — Gestión emocional v3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB2Config = WB1Config

export const WB2_V3_CONFIG: WB2Config = {
    code: 'WB2',
    version: 'V3',
    title: 'Serenidad estratégica · Gestión emocional',
    pillar: 'Shine Within (Esencia y autoliderazgo)',
    sourceLabel: 'WB2 — Gestión emocional V3 (2026)',
    storageKey: 'workbooks-v2-wb2-v3-state',
    downloadFileName: 'wb2-serenidad-estrategica.html',
    summary:
        'Workbook digital para reconocer detonantes emocionales, leer señales corporales tempranas, diseñar tu Ancla de Serenidad y comprometerte con una práctica de 7 días.',
    introduction:
        'La gestión emocional no es controlarse: es entender qué activa al líder, qué intenta proteger su reacción y cómo responder con mayor conciencia bajo presión. Las emociones se transmiten, así que la serenidad de un líder se convierte en estabilidad para su equipo. Después del Workbook 1 (creencias e identidad), este segundo workbook te invita a observar cómo esa historia aparece en tu cuerpo, tus emociones, tus reacciones y tu forma de liderar en momentos de tensión.',
    objective:
        'Reconocer cómo reaccionas emocionalmente bajo presión, qué situaciones te activan con mayor frecuencia y qué práctica concreta puedes usar para responder con más serenidad, claridad y presencia.',
    deliverables: [
        'Mayor claridad sobre tus detonantes emocionales.',
        'Una lectura de tu patrón emocional bajo presión.',
        'Identificación de tus señales corporales tempranas.',
        'Comprensión del impacto que tu reacción genera en otros.',
        'Una Ancla de Serenidad diseñada por ti.',
        'Una práctica breve de regulación emocional antes, durante y después de la presión.',
        'Un compromiso concreto para aplicar durante los próximos 7 días.'
    ],
    competencies: [
        'Autoconciencia emocional',
        'Regulación emocional',
        'Compostura bajo presión',
        'Presencia serena',
        'Gestión de energía',
        'Responsabilidad sobre el impacto emocional'
    ],
    observableBehaviours: [
        'Reconoces tus estados emocionales antes de reaccionar.',
        'Identificas qué situaciones, personas o conversaciones te activan.',
        'Detectas señales corporales tempranas de tensión.',
        'Haces una pausa antes de responder.',
        'Regulas tu tono, ritmo y postura en momentos de presión.',
        'Mantienes serenidad en situaciones retadoras.',
        'Reduces reacciones defensivas, impulsivas o evasivas.',
        'Tomas responsabilidad por el impacto emocional que generas en otros.'
    ],
    rules: [
        'Responde desde situaciones reales: observa qué pasó, qué sentiste, qué hiciste y qué efecto produjo.',
        'No busques justificar tu reacción. Busca comprenderla.',
        'Tu emoción no es el problema. El punto de trabajo es qué haces con ella.',
        'La serenidad no significa pasividad. Significa responder con mayor conciencia, presencia y dirección.'
    ],
    closing:
        'Tu reacción automática no define quién eres. Define qué aprendió tu sistema nervioso para protegerte. El objetivo no es eliminar emociones ni convertirte en alguien frío o rígido, sino desarrollar suficiente conciencia para reconocer cuándo reaccionas desde supervivencia y cuándo respondes desde presencia, criterio y liderazgo consciente. La madurez emocional no significa no activarse: significa recuperar capacidad de elección antes de que la reacción automática tome el control. Este workbook termina cuando puedes decir: "Esto me activa. Así suelo reaccionar. Esto intento proteger. Esta será mi Ancla de Serenidad. Esta semana practicaré una respuesta diferente."',
    sections: [
        {
            id: 'patron-presion',
            label: '1. Mi patrón emocional bajo presión',
            shortLabel: 'Patrón bajo presión',
            purpose:
                'Antes de identificar técnicas de regulación, reconoce cómo funciona tu sistema emocional cuando algo te activa. Un patrón emocional es una forma repetida de sentir, interpretar y reaccionar.',
            concepts: ['Detonantes emocionales', 'Patrón Fight/Flight/Freeze/Fawn', 'Señales corporales', 'Impacto en otros'],
            narrative: [
                {
                    title: 'Reacciones automáticas, no racionales',
                    body:
                        'Desde la neurociencia sabemos que el cerebro humano está diseñado para detectar amenazas constantemente. Esas amenazas no son sólo físicas: también lee como amenaza perder control, quedar expuesto, sentirse cuestionado, ser ignorado, equivocarse, decepcionar, perder reconocimiento o sentir incertidumbre. Cuando eso ocurre, el sistema nervioso entra en estado de activación y el cerebro prioriza protección antes que claridad. Por eso muchas veces reaccionamos antes de pensar.'
                },
                {
                    title: 'Cuatro respuestas adaptativas',
                    body:
                        'Algunas personas reaccionan luchando: controlan más, interrumpen, confrontan o se vuelven rígidas. Otras reaccionan evitando: se silencian, se desconectan emocionalmente o postergan conversaciones difíciles. Algunas aceleran mentalmente y sienten urgencia constante; otras intentan complacer para evitar conflicto o rechazo. Ninguna respuesta significa debilidad: son mecanismos adaptativos para protegernos. El problema aparece cuando esos patrones automáticos empiezan a dirigir el liderazgo.'
                },
                {
                    title: 'Serenidad = recuperar capacidad de elección',
                    body:
                        'La regulación emocional no consiste en "mantener la calma" artificialmente. Consiste en recuperar capacidad de elección antes de reaccionar automáticamente. Ahí empieza la verdadera serenidad estratégica.'
                }
            ],
            groups: [
                {
                    id: 'patron-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-1-1',
                            label: '¿Qué situaciones te activan emocionalmente con mayor frecuencia?',
                            helper:
                                'Piensa en momentos recientes de tensión, crítica, incertidumbre, presión, conflicto, desorden, exigencia o falta de control.',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb2v3-1-2',
                            label: '¿Qué tipo de personas o comportamientos suelen detonar emociones en ti?',
                            helper:
                                'Por ejemplo: personas que cuestionan, interrumpen, improvisan, no cumplen, presionan, evaden, critican, deciden sin consultar o cambian prioridades.',
                            rows: 4
                        },
                        {
                            id: 'wb2v3-1-3',
                            label: '¿Qué emoción aparece primero?',
                            helper:
                                'Puedes elegir una o varias: rabia, frustración, ansiedad, miedo, vergüenza, impotencia, tristeza, cansancio, irritación, inseguridad, urgencia, culpa.',
                            rows: 3
                        },
                        {
                            id: 'wb2v3-1-4',
                            label: '¿Cómo se nota esa emoción en tu cuerpo?',
                            helper:
                                'Observa señales físicas: mandíbula tensa, respiración corta, pecho apretado, calor, manos inquietas, tensión en hombros, nudo en el estómago, aceleración, agotamiento.',
                            rows: 3
                        },
                        {
                            id: 'wb2v3-1-5',
                            label: '¿Qué haces normalmente cuando esa emoción toma fuerza?',
                            helper:
                                'Por ejemplo: interrumpir, cerrar la conversación, controlar más, hablar fuerte, explicar demasiado, ceder, complacer, evitar, tomar distancia, decidir rápido, culpar, callar.',
                            rows: 4
                        },
                        {
                            id: 'wb2v3-1-6',
                            label: '¿Qué impacto suele producir tu reacción en otros?',
                            helper: 'Piensa en equipo, pares, jefe, familia, clientes o personas cercanas.',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'patron-sintesis',
                    title: 'Síntesis inicial',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb2v3-1-syn-1', label: 'Situaciones que más me activan', aiSuggested: true },
                        { id: 'wb2v3-1-syn-2', label: 'Personas o comportamientos que me detonan', aiSuggested: true },
                        { id: 'wb2v3-1-syn-3', label: 'Emoción que aparece primero', aiSuggested: true },
                        { id: 'wb2v3-1-syn-4', label: 'Señal corporal más frecuente', aiSuggested: true },
                        { id: 'wb2v3-1-syn-5', label: 'Reacción habitual', aiSuggested: true },
                        { id: 'wb2v3-1-syn-6', label: 'Impacto en otros', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'situaciones-recientes',
            label: '2. Reflexión sobre situaciones recientes',
            shortLabel: 'Situaciones reales',
            purpose:
                'Elige tres situaciones recientes en las que hayas sentido tensión emocional (reuniones, conversaciones difíciles, decisiones, conflictos, errores, críticas o momentos de presión). Descríbelas de forma breve y concreta.',
            prompts: [
                'Evita interpretaciones generales como "me sentí atacado".',
                'Primero escribe el hecho: "cuestionaron mi propuesta", "me cambiaron la prioridad", "mi colaborador no entregó".',
                'Después observa qué sentiste, qué hiciste y qué impacto generó.'
            ],
            groups: [
                {
                    id: 'situacion-1',
                    title: 'Situación 1',
                    kind: 'questions',
                    fields: [
                        { id: 'wb2v3-2-1-1', label: '¿Qué ocurrió?', rows: 3, kind: 'long' },
                        { id: 'wb2v3-2-1-2', label: '¿Qué me activó?', rows: 3 },
                        { id: 'wb2v3-2-1-3', label: '¿Qué sentí?', rows: 3 },
                        { id: 'wb2v3-2-1-4', label: '¿Cómo reaccioné?', rows: 3 },
                        { id: 'wb2v3-2-1-5', label: '¿Qué impacto generó?', rows: 3 },
                        { id: 'wb2v3-2-1-6', label: '¿Qué hubiera querido hacer distinto?', rows: 3 }
                    ]
                },
                {
                    id: 'situacion-2',
                    title: 'Situación 2',
                    kind: 'questions',
                    fields: [
                        { id: 'wb2v3-2-2-1', label: '¿Qué ocurrió?', rows: 3, kind: 'long' },
                        { id: 'wb2v3-2-2-2', label: '¿Qué me activó?', rows: 3 },
                        { id: 'wb2v3-2-2-3', label: '¿Qué sentí?', rows: 3 },
                        { id: 'wb2v3-2-2-4', label: '¿Cómo reaccioné?', rows: 3 },
                        { id: 'wb2v3-2-2-5', label: '¿Qué impacto generó?', rows: 3 },
                        { id: 'wb2v3-2-2-6', label: '¿Qué hubiera querido hacer distinto?', rows: 3 }
                    ]
                },
                {
                    id: 'situacion-3',
                    title: 'Situación 3',
                    kind: 'questions',
                    fields: [
                        { id: 'wb2v3-2-3-1', label: '¿Qué ocurrió?', rows: 3, kind: 'long' },
                        { id: 'wb2v3-2-3-2', label: '¿Qué me activó?', rows: 3 },
                        { id: 'wb2v3-2-3-3', label: '¿Qué sentí?', rows: 3 },
                        { id: 'wb2v3-2-3-4', label: '¿Cómo reaccioné?', rows: 3 },
                        { id: 'wb2v3-2-3-5', label: '¿Qué impacto generó?', rows: 3 },
                        { id: 'wb2v3-2-3-6', label: '¿Qué hubiera querido hacer distinto?', rows: 3 }
                    ]
                },
                {
                    id: 'patron-lectura',
                    title: 'Lectura de patrón',
                    description: 'La IA completa esta lectura a partir de las tres situaciones anteriores.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar lectura con IA',
                    columns: ['Pregunta', 'Mi respuesta'],
                    fields: [
                        { id: 'wb2v3-2-pat-1', label: '¿Qué se repite?', aiSuggested: true },
                        { id: 'wb2v3-2-pat-2', label: '¿Qué emoción aparece con más frecuencia?', aiSuggested: true },
                        { id: 'wb2v3-2-pat-3', label: '¿Qué reacción aparece de forma automática?', aiSuggested: true },
                        { id: 'wb2v3-2-pat-4', label: '¿Qué costo tiene para mí seguir reaccionando así?', aiSuggested: true },
                        { id: 'wb2v3-2-pat-5', label: '¿Qué costo tiene para otros?', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'reaccion-protege',
            label: '3. Lo que mi reacción intenta proteger',
            shortLabel: 'Qué intenta proteger',
            purpose:
                'Toda reacción emocional intenta proteger algo (autoridad, control, reconocimiento, pertenencia, seguridad, autonomía, justicia, imagen, eficiencia o afecto). Comprender qué protege tu reacción te ayuda a regularte sin invalidar lo que sientes.',
            groups: [
                {
                    id: 'proteger-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-3-1',
                            label: 'Cuando reacciono así, ¿qué intento proteger?',
                            helper:
                                'Marca las que más apliquen: control, autoridad, reconocimiento, seguridad, justicia, pertenencia, autonomía, imagen profesional, eficiencia, cuidado de otros, otro.',
                            rows: 3
                        },
                        {
                            id: 'wb2v3-3-2',
                            label: '¿Qué miedo o preocupación aparece detrás de mi reacción?',
                            helper:
                                'Por ejemplo: perder autoridad, quedar mal, decepcionar, fallar, perder control, no ser valorado, ser juzgado, generar conflicto, no cumplir.',
                            rows: 4
                        },
                        {
                            id: 'wb2v3-3-3',
                            label: '¿Qué necesidad legítima hay debajo de esa emoción?',
                            helper:
                                'Ejemplo: necesito claridad, respeto, orden, apoyo, reconocimiento, límites, seguridad, tiempo, foco o conversación directa.',
                            rows: 3
                        },
                        {
                            id: 'wb2v3-3-4',
                            label: '¿Cómo podría cuidar esa necesidad sin reaccionar de forma impulsiva?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'proteger-sintesis',
                    title: 'Síntesis',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb2v3-3-syn-1', label: 'Mi reacción intenta proteger', aiSuggested: true },
                        { id: 'wb2v3-3-syn-2', label: 'El miedo detrás de la reacción es', aiSuggested: true },
                        {
                            id: 'wb2v3-3-syn-3',
                            label: 'La necesidad legítima debajo de la emoción es',
                            aiSuggested: true
                        },
                        {
                            id: 'wb2v3-3-syn-4',
                            label: 'Una forma más consciente de cuidar esa necesidad sería',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        },
        {
            id: 'senales-corporales',
            label: '4. Señales corporales tempranas',
            shortLabel: 'Señales corporales',
            purpose:
                'Tu cuerpo suele avisar antes de que tu conducta se descontrole. Aprender a leer esas señales te permite intervenir antes de reaccionar. La regulación empieza al reconocer las primeras señales de activación.',
            groups: [
                {
                    id: 'escaneo',
                    title: 'Escaneo corporal',
                    description:
                        'Marca con texto las señales que aparecen con más frecuencia (mandíbula tensa, respiración corta, pecho apretado, hombros elevados, calor, manos inquietas, nudo, dolor de cabeza, voz fuerte/fría, aceleración, urgencia, ganas de interrumpir/salir, silencio rígido, otra).',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-4-1',
                            label: 'Las señales que noto con más frecuencia son…',
                            rows: 3,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'senal-principal',
                    title: 'Mi señal principal',
                    kind: 'questions',
                    fields: [
                        { id: 'wb2v3-4-2', label: '¿Cuál es la primera señal que suele aparecer en tu cuerpo?', rows: 3 },
                        { id: 'wb2v3-4-3', label: '¿Qué suele pasar si ignoras esa señal?', rows: 3 },
                        { id: 'wb2v3-4-4', label: '¿Qué podrías hacer apenas notes esa señal?', rows: 3 }
                    ]
                },
                {
                    id: 'senales-sintesis',
                    title: 'Síntesis corporal',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb2v3-4-syn-1', label: 'Mi primera señal corporal es', aiSuggested: true },
                        { id: 'wb2v3-4-syn-2', label: 'Cuando la ignoro, normalmente', aiSuggested: true },
                        { id: 'wb2v3-4-syn-3', label: 'Cuando la reconozca, voy a', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'ancla',
            label: '5. Mi Ancla de Serenidad',
            shortLabel: 'Ancla de Serenidad',
            purpose:
                'Tu Ancla de Serenidad es una práctica breve, concreta y fácil de recordar para volver a tu centro antes de responder. Combina cuatro elementos: señal corporal, pausa física, frase interna y conducta alternativa.',
            prompts: [
                'Debe poder aplicarse en una reunión, conversación, llamada o momento de presión.',
                'Mientras más simple, más sostenible.'
            ],
            groups: [
                {
                    id: 'ancla-pasos',
                    title: 'Pasos 1 a 4',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-5-1',
                            label: 'Paso 1 — Mi señal corporal será…',
                            helper: '¿Cuál será la señal que usarás como alarma temprana?',
                            rows: 2,
                            kind: 'completion'
                        },
                        {
                            id: 'wb2v3-5-2',
                            label: 'Paso 2 — Mi pausa física será…',
                            helper:
                                'Elige una: respirar profundo, apoyar los pies, bajar los hombros, tomar agua, pausa de tres segundos, escribir una palabra, pedir un momento, otra.',
                            rows: 2,
                            kind: 'completion'
                        },
                        {
                            id: 'wb2v3-5-3',
                            label: 'Paso 3 — Mi frase interna será…',
                            helper:
                                'Ejemplos: "Puedo responder sin defenderme.", "Primero escucho, después decido.", "No necesito controlar todo para liderar bien.", "La serenidad también comunica autoridad.", "Respondo desde criterio, no desde impulso."',
                            rows: 2,
                            kind: 'completion'
                        },
                        {
                            id: 'wb2v3-5-4',
                            label: 'Paso 4 — Mi conducta alternativa será…',
                            helper:
                                'Ejemplos: hacer una pregunta antes de responder, bajar el ritmo de mi voz, pedir claridad, nombrar lo que necesito sin atacar, tomar pausa antes de decidir, escuchar hasta el final.',
                            rows: 2,
                            kind: 'completion'
                        }
                    ]
                },
                {
                    id: 'ancla-frase',
                    title: 'Mi Ancla de Serenidad en una frase',
                    description: 'La IA puede armar la frase a partir de los 4 pasos anteriores.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar Ancla con IA',
                    columns: ['Elemento', 'Mi definición'],
                    fields: [
                        { id: 'wb2v3-5-syn-1', label: 'Señal corporal', aiSuggested: true },
                        { id: 'wb2v3-5-syn-2', label: 'Pausa física', aiSuggested: true },
                        { id: 'wb2v3-5-syn-3', label: 'Frase interna', aiSuggested: true },
                        { id: 'wb2v3-5-syn-4', label: 'Conducta alternativa', aiSuggested: true },
                        {
                            id: 'wb2v3-5-syn-5',
                            label:
                                'Cuando note ___, voy a ___, me diré ___ y responderé ___ (frase integrada)',
                            aiSuggested: true
                        }
                    ]
                },
                {
                    id: 'ancla-aplicacion',
                    title: 'Aplicación en una situación real',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-5-app',
                            label: '¿En qué situación específica voy a practicar mi Ancla los próximos 7 días?',
                            rows: 3
                        }
                    ]
                }
            ]
        },
        {
            id: 'regulacion-3-momentos',
            label: '6. Prácticas de regulación emocional',
            shortLabel: 'Antes / durante / después',
            purpose:
                'La regulación emocional se entrena en tres momentos: antes de la presión, durante la presión y después de la presión. No necesitas muchas prácticas; necesitas pocas prácticas que realmente puedas sostener.',
            narrative: [
                {
                    title: 'Las emociones son contagiosas',
                    body:
                        'La neurociencia social muestra que regulamos nuestros estados emocionales en relación con otros, especialmente con figuras de autoridad. Eso significa que el estado emocional de un líder impacta directamente la seguridad psicológica, la claridad de los equipos, la velocidad emocional de las reuniones, la calidad de las conversaciones y la capacidad colectiva para decidir. Un líder acelerado acelera al equipo. Un líder regulado transmite claridad incluso en momentos complejos.'
                }
            ],
            groups: [
                {
                    id: 'antes',
                    title: '6.1 Antes de la presión: preparación',
                    kind: 'questions',
                    fields: [
                        { id: 'wb2v3-6-1-1', label: '¿Qué situación de esta semana puede activarme emocionalmente?', rows: 3 },
                        {
                            id: 'wb2v3-6-1-2',
                            label: '¿Qué quiero cuidar en esa situación?',
                            helper: 'Por ejemplo: claridad, respeto, calma, escucha, firmeza, límites, confianza, foco.',
                            rows: 3
                        },
                        { id: 'wb2v3-6-1-3', label: '¿Cómo quiero llegar emocionalmente a esa situación?', rows: 3 },
                        {
                            id: 'wb2v3-6-1-4',
                            label: '¿Qué haré antes para prepararme?',
                            helper:
                                'Ejemplos: respirar, caminar, revisar mi intención, escribir tres puntos clave, dormir mejor, anticipar una respuesta, hablar con alguien, llegar con tiempo.',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'durante',
                    title: '6.2 Durante la presión: intervención',
                    kind: 'questions',
                    fields: [
                        { id: 'wb2v3-6-2-1', label: '¿Qué señal me indicará que debo usar mi Ancla de Serenidad?', rows: 3 },
                        {
                            id: 'wb2v3-6-2-2',
                            label: '¿Qué frase puedo usar para ganar tiempo sin evadir?',
                            helper:
                                'Ejemplos: "Dame un momento para ordenar la respuesta.", "Quiero entender bien antes de responder.", "Hagamos una pausa para clarificar.", "Volvamos al objetivo de esta conversación."',
                            rows: 3
                        },
                        {
                            id: 'wb2v3-6-2-3',
                            label: '¿Qué conducta observable quiero practicar durante la situación?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'despues',
                    title: '6.3 Después de la presión: recuperación y aprendizaje',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-6-3-1',
                            label: '¿Qué haré después para recuperar energía?',
                            helper:
                                'Ejemplos: caminar, respirar, escribir, tomar agua, hablar con alguien, cerrar el tema, ordenar aprendizajes, desconectarme unos minutos.',
                            rows: 3
                        },
                        {
                            id: 'wb2v3-6-3-2',
                            label: '¿Qué pregunta me haré para aprender?',
                            helper:
                                'Ejemplos: ¿qué me activó?, ¿qué hice distinto?, ¿qué impacto generé?, ¿qué necesito ajustar?, ¿qué evidencia tengo de avance?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'regulacion-sintesis',
                    title: 'Mi práctica de regulación en tres momentos',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Momento', 'Mi práctica'],
                    fields: [
                        { id: 'wb2v3-6-syn-1', label: 'Antes de la presión', aiSuggested: true },
                        { id: 'wb2v3-6-syn-2', label: 'Durante la presión', aiSuggested: true },
                        { id: 'wb2v3-6-syn-3', label: 'Después de la presión', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'mapa-reacciones',
            label: '7. Mapa de reacciones emocionales bajo presión',
            shortLabel: 'Mapa Fight/Flight/Freeze/Fawn',
            purpose:
                'Bajo presión solemos activar patrones emocionales automáticos que el sistema nervioso aprendió para protegernos. Identifica tu tendencia predominante para desarrollar mayor conciencia y capacidad de regulación. Nadie reacciona siempre igual, pero suele haber una respuesta predominante.',
            concepts: ['Fight (control y confrontación)', 'Flight (evasión y sobreocupación)', 'Freeze (bloqueo y desconexión)', 'Fawn (complacer y sobreadaptarse)'],
            narrative: [
                {
                    title: 'Tipo 1 — Fight (Control y confrontación)',
                    body:
                        'El sistema nervioso busca recuperar control rápidamente: aceleración, rigidez, confrontación, irritación, urgencia. Conductas frecuentes: interrumpir, hablar más fuerte/rápido, corregir, microgestionar, decisiones aceleradas, rigidez. Intenta proteger: control, autoridad, imagen, eficiencia, seguridad, competencia. Impacto: equipos tensos, personas que dejan de hablar honestamente, miedo a equivocarse, menor creatividad.'
                },
                {
                    title: 'Tipo 2 — Flight (Evasión y sobreocupación)',
                    body:
                        'El sistema nervioso intenta escapar de la tensión: evita conversaciones, posterga decisiones, se llena de trabajo, acelera mentalmente. Conductas frecuentes: evitar conversaciones incómodas, hiperproductividad, dificultad para desconectarse. Intenta proteger: seguridad emocional, evitar conflicto, rechazo, vulnerabilidad. Impacto: falta de claridad, conversaciones pendientes, distancia emocional, problemas que se acumulan.'
                },
                {
                    title: 'Tipo 3 — Freeze (Bloqueo y desconexión)',
                    body:
                        'El cerebro percibe tanta presión que reduce capacidad de respuesta para protegerse: silencio, dificultad para decidir, sensación de quedarse "congelado", sobreracionalizar sin actuar. Intenta proteger: seguridad emocional, evitar error, exposición, juicio. Impacto: falta de dirección, lentitud en decisiones, sensación de ausencia emocional.'
                },
                {
                    title: 'Tipo 4 — Fawn (Complacer y sobreadaptarse)',
                    body:
                        'La persona reduce tensión buscando aprobación, evitando incomodar, adaptándose excesivamente. Conductas frecuentes: decir sí cuando quiere decir no, dificultad para poner límites, suavizar mensajes, ceder rápidamente, buscar aprobación. Intenta proteger: pertenencia, aprobación, relación. Impacto: ambigüedad, decisiones poco firmes, sobrecarga emocional, equipos confundidos.'
                }
            ],
            groups: [
                {
                    id: 'identificacion',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-7-1',
                            label: '7.1 ¿Con cuál de los 4 tipos (Fight / Flight / Freeze / Fawn) te identificas más?',
                            helper: 'Puedes mencionar uno predominante y uno secundario.',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb2v3-7-2',
                            label: '7.2 ¿Qué respuesta nueva quieres practicar para no quedarte en ese patrón automático?',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'compromiso-7-dias',
            label: '8. Compromiso emocional de 7 días',
            shortLabel: 'Compromiso 7 días',
            purpose:
                'Este workbook cierra con un compromiso breve, concreto y observable. Durante los próximos 7 días vas a practicar una respuesta emocional diferente en una situación real.',
            groups: [
                {
                    id: 'compromiso-frase',
                    title: 'Mi compromiso',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-8-1',
                            label:
                                'Durante los próximos 7 días, cuando aparezca ___, voy a practicar ___ para generar ___.',
                            kind: 'long',
                            rows: 4,
                            placeholder: 'Completa los tres espacios en blanco.'
                        }
                    ]
                },
                {
                    id: 'registro',
                    title: 'Registro breve de práctica (días 1–3)',
                    description: 'Completa una frase corta después de cada intento.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb2v3-8-d1-situacion',
                            label: 'Día 1 — Situación y qué hice distinto',
                            rows: 3
                        },
                        { id: 'wb2v3-8-d1-aprendizaje', label: 'Día 1 — ¿Qué aprendí?', rows: 2 },
                        {
                            id: 'wb2v3-8-d2-situacion',
                            label: 'Día 2 — Situación y qué hice distinto',
                            rows: 3
                        },
                        { id: 'wb2v3-8-d2-aprendizaje', label: 'Día 2 — ¿Qué aprendí?', rows: 2 },
                        {
                            id: 'wb2v3-8-d3-situacion',
                            label: 'Día 3 — Situación y qué hice distinto',
                            rows: 3
                        },
                        { id: 'wb2v3-8-d3-aprendizaje', label: 'Día 3 — ¿Qué aprendí?', rows: 2 }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '9. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB2. Esta sección la completa la IA a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
            groups: [
                {
                    id: 'cierre-sintesis',
                    title: 'Síntesis final (IA)',
                    description: 'La IA puede generar la síntesis usando todas tus respuestas previas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar síntesis final con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb2v3-9-1', label: 'Mi detonante emocional prioritario es…', aiSuggested: true },
                        { id: 'wb2v3-9-2', label: 'Mi reacción habitual bajo presión es…', aiSuggested: true },
                        { id: 'wb2v3-9-3', label: 'La emoción que aparece primero es…', aiSuggested: true },
                        { id: 'wb2v3-9-4', label: 'Mi señal corporal temprana es…', aiSuggested: true },
                        { id: 'wb2v3-9-5', label: 'Lo que mi reacción intenta proteger es…', aiSuggested: true },
                        { id: 'wb2v3-9-6', label: 'El impacto que quiero reducir en otros es…', aiSuggested: true },
                        { id: 'wb2v3-9-7', label: 'Mi Ancla de Serenidad es…', aiSuggested: true },
                        {
                            id: 'wb2v3-9-8',
                            label: 'Cuando note ___, voy a ___, me diré ___ y responderé ___',
                            aiSuggested: true
                        },
                        { id: 'wb2v3-9-9', label: 'La conducta nueva que voy a practicar es…', aiSuggested: true },
                        {
                            id: 'wb2v3-9-10',
                            label: 'La situación concreta donde voy a practicarla es…',
                            aiSuggested: true
                        },
                        { id: 'wb2v3-9-11', label: 'La evidencia de avance será…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
