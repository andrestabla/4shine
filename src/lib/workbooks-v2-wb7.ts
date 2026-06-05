// WB7 V3 - Capital Relacional estratégico (Mapeo del ecosistema)
// Estructura derivada de "WB7 — Mapeo del ecosistema estratégico V3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB7Config = WB1Config

export const WB7_V3_CONFIG: WB7Config = {
    code: 'WB7',
    version: 'V3',
    title: 'Capital Relacional estratégico',
    pillar: 'Shine Up (Ecosistema relacional)',
    sourceLabel: 'WB7 — Mapeo del ecosistema estratégico V3 (2026)',
    storageKey: 'workbooks-v2-wb7-v3-state',
    downloadFileName: 'wb7-capital-relacional-estrategico.html',
    summary:
        'Workbook digital para mapear tu red como ecosistema estratégico: tres tipos de red, mapa de poder e influencia, sponsors, valor antes de pedir, visibilidad y movimiento relacional de 90 días.',
    introduction:
        'Después de trabajar tu presencia, narrativa, comunicación y lenguaje ejecutivo, ahora vas a observar con más intención quiénes influyen en tu crecimiento, visibilidad, legitimidad, acceso y capacidad de generar impacto. Una red estratégica no se construye por cercanía casual, sino por valor, confianza e intención.',
    objective:
        'Construir un mapa estratégico de tus relaciones, identificar uno o dos sponsors potenciales, definir qué valor puedes aportar antes de pedir y diseñar un movimiento relacional concreto para los próximos 90 días.',
    deliverables: [
        'Un mapa simple de tus relaciones estratégicas.',
        'Una lectura de tus actores clave.',
        'Identificación de relaciones fuertes, frágiles y ausentes.',
        'Uno o dos sponsors potenciales.',
        'Una idea clara del valor que puedes aportar antes de pedir apoyo.',
        'Una acción de visibilidad estratégica.',
        'Un plan relacional de 15 días.'
    ],
    competencies: [
        'Conectividad interna y externa',
        'Gestión de relaciones',
        'Networking estratégico',
        'Lectura de poder e influencia',
        'Visibilidad estratégica',
        'Construcción de valor mutuo',
        'Inteligencia política y contextual'
    ],
    observableBehaviours: [
        'Identificas actores clave dentro y fuera de tu ecosistema.',
        'Construyes relaciones basadas en confianza y reciprocidad.',
        'Distingues cercanía personal de valor estratégico.',
        'Reconoces quién decide, quién influye, quién bloquea y quién amplifica.',
        'Activamente conectas personas, ideas o recursos.',
        'Haces visible tu aporte en espacios relevantes.',
        'Cultivas sponsors sin actuar de forma oportunista.',
        'Diseñas movimientos relacionales concretos, no solo intenciones generales.'
    ],
    rules: [
        'No confundas cercanía con valor estratégico.',
        'No todas las relaciones importantes son frecuentes.',
        'Antes de pedir apoyo, identifica qué valor puedes aportar.',
        'La visibilidad estratégica no es autopromoción: es hacer visible tu aporte en los espacios correctos.',
        'Un sponsor no es solo alguien que te aconseja: es alguien que puede abrir acceso, legitimidad o exposición.',
        'Tu red debe ayudarte a crecer, contribuir y ampliar impacto.'
    ],
    closing:
        'Tu red no es solo un conjunto de contactos: es un sistema vivo de confianza, valor, visibilidad y reciprocidad. Algunas relaciones sostienen tu presente; otras pueden abrir tu futuro. Algunas necesitan cuidado, otras necesitan activarse, y algunas todavía no existen pero deberían existir. Este workbook termina cuando puedes decir: "Sé quiénes importan en mi ecosistema. Sé qué relaciones debo cuidar. Sé qué vacíos necesito activar. Sé qué valor puedo aportar antes de pedir. Sé qué movimiento relacional haré en los próximos 90 días."',
    sections: [
        {
            id: 'ecosistema',
            label: '1. Mi Ecosistema Relacional Estratégico',
            shortLabel: 'Tres redes',
            purpose:
                'Tu crecimiento profesional no depende sólo de lo que sabes o haces: también de quién conoce tu trabajo, quién confía en ti, quién habla de ti cuando no estás presente y quién puede ayudarte a llegar a espacios donde hoy no tienes acceso. Los líderes de mayor impacto construyen tres tipos de red: Operativa, Personal y Estratégica.',
            concepts: [
                'Red Operativa — ejecutar y generar resultados',
                'Red Personal — ampliar perspectiva y aprender',
                'Red Estratégica — abrir nuevas posibilidades'
            ],
            narrative: [
                {
                    title: 'Red Operativa',
                    body:
                        'Personas que te ayudan a hacer que las cosas ocurran: equipo directo, pares de otras áreas, clientes internos, stakeholders funcionales, proveedores estratégicos, líderes de proyectos compartidos. Una red operativa sólida permite ejecutar con velocidad, confianza y alineación.'
                },
                {
                    title: 'Red Personal',
                    body:
                        'Personas que amplían tu perspectiva: mentores, coaches, amigos con criterio profesional, exjefes, colegas de otras industrias, personas que admiras. No participan en tus decisiones diarias pero tienen enorme influencia en tu crecimiento. Una red personal diversa evita que quedes atrapado en la misma forma de pensar.'
                },
                {
                    title: 'Red Estratégica',
                    body:
                        'Personas que pueden abrir nuevas posibilidades: sponsors, altos directivos, miembros de juntas, referentes de industria, líderes de otras organizaciones, conectores con acceso a comunidades. Suele ser la más escasa y la más determinante para acelerar el crecimiento. Muchas promociones, oportunidades de negocio y proyectos de alto impacto nacen aquí.'
                }
            ],
            groups: [
                {
                    id: 'tres-redes-q',
                    title: 'Reflexión por tipo de red',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb7v3-1-op',
                            label: 'Red Operativa — ¿Quiénes impactan hoy tu capacidad de ejecutar y generar resultados?',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb7v3-1-pe',
                            label: 'Red Personal — ¿Quiénes contribuyen hoy a tu aprendizaje, crecimiento o expansión?',
                            rows: 4
                        },
                        {
                            id: 'wb7v3-1-es',
                            label:
                                'Red Estratégica — ¿Quiénes podrían ayudarte a abrir oportunidades que hoy no podrías generar por tu cuenta?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'diagnostico-equilibrio',
                    title: 'Diagnóstico de equilibrio relacional',
                    description: 'Para cada red indica si está Fuerte / Media / Débil y explica brevemente.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-1-d-op', label: 'Red Operativa (Fuerte / Media / Débil + por qué)', rows: 2 },
                        { id: 'wb7v3-1-d-pe', label: 'Red Personal (Fuerte / Media / Débil + por qué)', rows: 2 },
                        { id: 'wb7v3-1-d-es', label: 'Red Estratégica (Fuerte / Media / Débil + por qué)', rows: 2 }
                    ]
                },
                {
                    id: 'preguntas-equilibrio',
                    title: 'Preguntas de equilibrio',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-1-eq-1', label: '¿Cuál es hoy tu red más fuerte?', rows: 3 },
                        { id: 'wb7v3-1-eq-2', label: '¿Cuál es tu red más débil?', rows: 3 },
                        {
                            id: 'wb7v3-1-eq-3',
                            label: '¿Qué oportunidades podrías estar perdiendo debido a ese desequilibrio?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'conclusion-personal',
                    title: 'Mi conclusión personal (IA)',
                    description: 'La IA puede sintetizar tu conclusión a partir de las respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb7v3-1-c-1', label: 'La red que más contribuye hoy a mis resultados es…', aiSuggested: true },
                        {
                            id: 'wb7v3-1-c-2',
                            label: 'La red que más necesito fortalecer para crecer hacia mi siguiente nivel es…',
                            aiSuggested: true
                        },
                        {
                            id: 'wb7v3-1-c-3',
                            label: 'La principal oportunidad que identifico en mi ecosistema relacional es…',
                            aiSuggested: true
                        },
                        {
                            id: 'wb7v3-1-c-4',
                            label: 'La acción más importante para fortalecer mi capital relacional es…',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        },
        {
            id: 'lectura-relaciones',
            label: '2. Lectura estratégica de relaciones',
            shortLabel: 'Lectura estratégica',
            purpose:
                'Observa tus relaciones desde tres criterios: Influencia (cuánto puede mover decisiones, acceso, reputación o recursos), Cercanía (qué tan activa, confiable o frecuente es) y Valor mutuo (cuánto intercambio real existe).',
            prompts: [
                'Guía de interpretación:',
                'Alta influencia + alta cercanía → relación crítica que debes cuidar.',
                'Alta influencia + baja cercanía → relación estratégica por desarrollar.',
                'Baja influencia + alta confianza → aliado valioso aunque no abra decisiones.',
                'Alto valor mutuo → relación que puede crecer de forma sostenible.',
                'Baja cercanía + alto potencial → relación dormida o subdesarrollada.'
            ],
            groups: [
                {
                    id: 'matriz-actores',
                    title: 'Matriz simple — 6 actores',
                    description: 'Para cada actor indica Influencia 1–5, Cercanía 1–5 y Valor mutuo 1–5.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-2-a1', label: 'Actor 1 — nombre + I:_ C:_ V:_', rows: 2 },
                        { id: 'wb7v3-2-a2', label: 'Actor 2 — nombre + I:_ C:_ V:_', rows: 2 },
                        { id: 'wb7v3-2-a3', label: 'Actor 3 — nombre + I:_ C:_ V:_', rows: 2 },
                        { id: 'wb7v3-2-a4', label: 'Actor 4 — nombre + I:_ C:_ V:_', rows: 2 },
                        { id: 'wb7v3-2-a5', label: 'Actor 5 — nombre + I:_ C:_ V:_', rows: 2 },
                        { id: 'wb7v3-2-a6', label: 'Actor 6 — nombre + I:_ C:_ V:_', rows: 2 }
                    ]
                },
                {
                    id: 'sintesis-lectura',
                    title: 'Síntesis (IA)',
                    description: 'La IA puede leer tu matriz e identificar prioridades.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar lectura con IA',
                    columns: ['Pregunta', 'Mi respuesta'],
                    fields: [
                        { id: 'wb7v3-2-s-1', label: '¿Qué relación debo cuidar más?', aiSuggested: true },
                        { id: 'wb7v3-2-s-2', label: '¿Qué relación debo desarrollar?', aiSuggested: true },
                        { id: 'wb7v3-2-s-3', label: '¿Qué relación está demasiado débil para su importancia?', aiSuggested: true },
                        { id: 'wb7v3-2-s-4', label: '¿Dónde dependo demasiado de pocas personas?', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'mapa-poder',
            label: '3. Mapa de Poder e Influencia',
            shortLabel: 'Mapa de poder',
            purpose:
                'Las decisiones no las toman únicamente las personas con cargo más alto. En todas las organizaciones existen dinámicas visibles e invisibles. Comprende quién decide, quién influye, quién amplifica, quién conecta y quién puede bloquear para construir relaciones más efectivas.',
            concepts: ['Decisores', 'Influenciadores', 'Amplificadores', 'Conectores', 'Bloqueadores'],
            narrative: [
                {
                    title: 'Cinco actores que influyen en tu crecimiento',
                    body:
                        '1) Decisores: tienen autoridad formal para aprobar, rechazar o priorizar (jefe directo, director, VP, CEO, junta, cliente decisor). 2) Influenciadores: moldean la opinión de quienes deciden (líderes informales, expertos técnicos, asesores cercanos a la alta dirección, líderes de opinión). 3) Amplificadores: hacen visible tu trabajo y te recomiendan (sponsors, líderes con alta exposición, referentes de industria, conectores internos). 4) Conectores: tienen acceso a múltiples redes y crean puentes (líderes de comunidades, referentes de networking, ejecutivos con amplias redes). 5) Bloqueadores: pueden ralentizar o impedir avance — no siempre intencionalmente. Los líderes estratégicos buscan comprenderlos.'
                }
            ],
            groups: [
                {
                    id: 'actores-q',
                    title: 'Reflexión por tipo de actor',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb7v3-3-de',
                            label: 'Decisores — ¿Quiénes son los principales decisores que impactan mis objetivos profesionales?',
                            rows: 3
                        },
                        {
                            id: 'wb7v3-3-in',
                            label:
                                'Influenciadores — ¿Quiénes son las personas cuya opinión es escuchada y respetada por quienes deciden?',
                            rows: 3
                        },
                        {
                            id: 'wb7v3-3-am',
                            label: 'Amplificadores — ¿Quiénes podrían ayudar a que mi trabajo sea más visible?',
                            rows: 3
                        },
                        {
                            id: 'wb7v3-3-co',
                            label: 'Conectores — ¿Quiénes tienen acceso a comunidades o personas a las que yo todavía no llego?',
                            rows: 3
                        },
                        {
                            id: 'wb7v3-3-bl',
                            label: 'Bloqueadores — ¿Quiénes podrían frenar o dificultar iniciativas importantes para mí?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'mapa-poder-construccion',
                    title: 'Construye tu Mapa de Poder — 8 personas',
                    description: 'Para cada persona indica nombre + rol predominante (Decisor / Influenciador / Amplificador / Conector / Bloqueador).',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-3-p1', label: 'Persona 1', rows: 2 },
                        { id: 'wb7v3-3-p2', label: 'Persona 2', rows: 2 },
                        { id: 'wb7v3-3-p3', label: 'Persona 3', rows: 2 },
                        { id: 'wb7v3-3-p4', label: 'Persona 4', rows: 2 },
                        { id: 'wb7v3-3-p5', label: 'Persona 5', rows: 2 },
                        { id: 'wb7v3-3-p6', label: 'Persona 6', rows: 2 },
                        { id: 'wb7v3-3-p7', label: 'Persona 7', rows: 2 },
                        { id: 'wb7v3-3-p8', label: 'Persona 8', rows: 2 }
                    ]
                },
                {
                    id: 'analisis-mapa',
                    title: 'Análisis estratégico',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-3-an-1', label: '¿Qué tipo de actor domina actualmente mi red?', rows: 3 },
                        { id: 'wb7v3-3-an-2', label: '¿Tengo suficiente acceso a decisores?', rows: 3 },
                        { id: 'wb7v3-3-an-3', label: '¿Tengo influenciadores que conozcan realmente mi trabajo?', rows: 3 },
                        { id: 'wb7v3-3-an-4', label: '¿Quién podría convertirse en amplificador de mi marca ejecutiva?', rows: 3 },
                        { id: 'wb7v3-3-an-5', label: '¿Qué conectores podrían expandir significativamente mi ecosistema?', rows: 3 },
                        { id: 'wb7v3-3-an-6', label: '¿Qué bloqueadores necesito comprender mejor?', rows: 3 }
                    ]
                },
                {
                    id: 'top-3-relaciones',
                    title: 'Top 3 relaciones de mayor impacto en los próximos 12 meses',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-3-r1', label: 'Relación estratégica 1', rows: 3 },
                        { id: 'wb7v3-3-r2', label: 'Relación estratégica 2', rows: 3 },
                        { id: 'wb7v3-3-r3', label: 'Relación estratégica 3', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'sponsors',
            label: '4. Sponsors y aliados estratégicos',
            shortLabel: 'Sponsors',
            purpose:
                'Un sponsor es alguien con influencia, credibilidad y acceso que puede ayudarte a ganar visibilidad, legitimidad u oportunidades. A diferencia de un mentor, un sponsor no sólo aconseja: recomienda, abre espacios, visibiliza tu trabajo o pone tu nombre en conversaciones relevantes.',
            groups: [
                {
                    id: 'sponsors-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-4-1', label: '¿Quién ya conoce tu trabajo y podría hablar bien de tu aporte?', rows: 3 },
                        { id: 'wb7v3-4-2', label: '¿Quién tiene acceso a espacios donde tu valor debería ser más visible?', rows: 3 },
                        {
                            id: 'wb7v3-4-3',
                            label:
                                '¿Quién podría abrirte una conversación, recomendación, exposición o aprendizaje estratégico?',
                            rows: 3
                        },
                        { id: 'wb7v3-4-4', label: '¿Qué relación necesitas fortalecer antes de pedir apoyo?', rows: 3 }
                    ]
                },
                {
                    id: 'mapa-sponsors',
                    title: 'Mapa breve de sponsors — 2 candidatos',
                    description: 'Para cada sponsor potencial: qué influencia tiene, qué sabe de tu valor, qué relación tienes hoy.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-4-s1', label: 'Sponsor potencial 1', rows: 4 },
                        { id: 'wb7v3-4-s2', label: 'Sponsor potencial 2', rows: 4 }
                    ]
                },
                {
                    id: 'sponsors-sintesis',
                    title: 'Síntesis de sponsors (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb7v3-4-syn-1', label: 'Mi sponsor prioritario es…', aiSuggested: true },
                        { id: 'wb7v3-4-syn-2', label: 'El primer movimiento para acercarme es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'valor-antes',
            label: '5. Valor antes de pedir',
            shortLabel: 'Valor antes',
            purpose:
                'Antes de pedir visibilidad, apoyo o acceso, pregúntate qué valor puedes aportar primero. Una relación estratégica se cuida desde la reciprocidad. Si sólo apareces cuando necesitas algo, la relación se vuelve transaccional.',
            groups: [
                {
                    id: 'valor-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb7v3-5-1',
                            label: '¿Qué le importa hoy a esta persona?',
                            helper: 'Prioridades, retos, presión, objetivos o agenda.',
                            rows: 3,
                            kind: 'long'
                        },
                        {
                            id: 'wb7v3-5-2',
                            label: '¿Qué puedo aportar sin pedir nada todavía?',
                            helper:
                                'Una idea, síntesis, conexión, lectura del contexto, información útil, apoyo, visibilidad para su iniciativa, conversación de criterio.',
                            rows: 3
                        },
                        { id: 'wb7v3-5-3', label: '¿Qué evidencia de mi valor podría hacer visible?', rows: 3 },
                        { id: 'wb7v3-5-4', label: '¿Qué debo evitar para no sonar oportunista?', rows: 3 }
                    ]
                },
                {
                    id: 'mapa-valor',
                    title: 'Mapa de valor antes de pedir — 2 personas',
                    description:
                        'Para cada persona clave: qué le importa, valor que puedes aportar primero, qué evitar.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-5-p1', label: 'Persona clave 1', rows: 4 },
                        { id: 'wb7v3-5-p2', label: 'Persona clave 2', rows: 4 }
                    ]
                },
                {
                    id: 'valor-sintesis',
                    title: 'Síntesis valor antes de pedir (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb7v3-5-syn-1', label: 'Mi primera aportación de valor será…', aiSuggested: true },
                        { id: 'wb7v3-5-syn-2', label: 'Lo que debo evitar para no sonar oportunista es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'visibilidad',
            label: '6. Visibilidad estratégica',
            shortLabel: 'Visibilidad',
            purpose:
                'La visibilidad estratégica no consiste en estar en todas partes: consiste en hacer visible el valor correcto frente a la audiencia correcta, con evidencia concreta.',
            groups: [
                {
                    id: 'visibilidad-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb7v3-6-1',
                            label: '¿Qué valor quieres que otros vean con más claridad en ti?',
                            helper:
                                'Criterio estratégico, confiabilidad, pensamiento sistémico, capacidad de ejecución, liderazgo humano, innovación, lectura de negocio, comunicación clara.',
                            rows: 3
                        },
                        { id: 'wb7v3-6-2', label: '¿Qué audiencia necesita ver ese valor?', rows: 3 },
                        {
                            id: 'wb7v3-6-3',
                            label: '¿Qué evidencia concreta puede sostenerlo?',
                            helper:
                                'Un proyecto, resultado, conversación, reporte, presentación, caso, aprendizaje, recomendación o contribución visible.',
                            rows: 3
                        },
                        {
                            id: 'wb7v3-6-4',
                            label: '¿En qué espacio puedes hacerlo visible?',
                            helper:
                                'Reunión ejecutiva, comité, conversación uno a uno, reporte breve, presentación, publicación, evento, mesa transversal, correo ejecutivo.',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'matriz-visibilidad',
                    title: 'Matriz micro de visibilidad (IA)',
                    description: 'La IA puede armar la matriz audiencia → valor → evidencia → espacio.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar matriz con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb7v3-6-m-1', label: 'Audiencia clave', aiSuggested: true },
                        { id: 'wb7v3-6-m-2', label: 'Valor que quiero hacer visible', aiSuggested: true },
                        { id: 'wb7v3-6-m-3', label: 'Evidencia concreta', aiSuggested: true },
                        { id: 'wb7v3-6-m-4', label: 'Espacio donde lo mostraré', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'movimiento-90',
            label: '7. Movimiento relacional de 90 días',
            shortLabel: 'Movimiento 90 días',
            purpose:
                'Durante los próximos 90 días vas a activar una relación, cuidar una relación crítica o hacer visible un aporte ante una audiencia clave.',
            prompts: [
                'Movimientos posibles: Fortalecer una relación crítica · Activar un vacío relacional · Acercarme a un sponsor potencial · Hacer visible un aporte estratégico · Conectar a dos personas o áreas · Reabrir una relación de valor.',
                'Ejemplos de acciones concretas: pedir una conversación breve para compartir una lectura útil; enviar una síntesis ejecutiva con valor real; conectar a dos personas que podrían ayudarse; pedir criterio sobre una decisión, no exposición; presentar un avance en una reunión clave; reactivar una relación con un mensaje específico y útil; ofrecer apoyo en una prioridad de la otra persona.'
            ],
            groups: [
                {
                    id: 'eleccion-movimiento',
                    title: 'Mi elección',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb7v3-7-mov',
                            label: 'Marca el movimiento que vas a hacer (Fortalecer / Activar vacío / Sponsor / Visibilidad / Conectar / Reabrir)',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'plan-activacion',
                    title: 'Plan de activación',
                    kind: 'questions',
                    fields: [
                        { id: 'wb7v3-7-p-1', label: 'Relación o audiencia prioritaria', rows: 2 },
                        { id: 'wb7v3-7-p-2', label: 'Por qué es estratégica', rows: 3 },
                        { id: 'wb7v3-7-p-3', label: 'Valor que aportaré primero', rows: 3 },
                        { id: 'wb7v3-7-p-4', label: 'Acción concreta en 15 días', rows: 3 },
                        { id: 'wb7v3-7-p-5', label: 'Riesgo a evitar', rows: 2 },
                        { id: 'wb7v3-7-p-6', label: 'Señal de avance que observaré', rows: 2 }
                    ]
                },
                {
                    id: 'plan-ia',
                    title: 'Plan integrado (IA)',
                    description: 'La IA puede armar el plan a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar plan con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb7v3-7-ia-1', label: 'Movimiento elegido', aiSuggested: true },
                        { id: 'wb7v3-7-ia-2', label: 'Primer paso de los 15 días', aiSuggested: true },
                        { id: 'wb7v3-7-ia-3', label: 'Indicador de avance a 90 días', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '8. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB7. La IA completa esta sección a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
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
                        { id: 'wb7v3-8-1', label: 'Mis relaciones más estratégicas hoy son…', aiSuggested: true },
                        { id: 'wb7v3-8-2', label: 'La relación que necesito cuidar más es…', aiSuggested: true },
                        { id: 'wb7v3-8-3', label: 'La relación que necesito desarrollar es…', aiSuggested: true },
                        { id: 'wb7v3-8-4', label: 'Mi principal vacío relacional es…', aiSuggested: true },
                        { id: 'wb7v3-8-5', label: 'Mi sponsor o sponsor potencial es…', aiSuggested: true },
                        { id: 'wb7v3-8-6', label: 'El valor que puedo aportar antes de pedir es…', aiSuggested: true },
                        { id: 'wb7v3-8-7', label: 'El valor que quiero hacer visible es…', aiSuggested: true },
                        { id: 'wb7v3-8-8', label: 'La audiencia que necesita verlo es…', aiSuggested: true },
                        { id: 'wb7v3-8-9', label: 'Mi movimiento relacional de 15 días será…', aiSuggested: true },
                        { id: 'wb7v3-8-10', label: 'La evidencia de avance será…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
