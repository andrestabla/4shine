// WB10 V3 - Arquitectura de Impacto / Visión Estratégica Personal
// Estructura derivada de "WB10 — Visión Estratégica Personal V3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB10Config = WB1Config

export const WB10_V3_CONFIG: WB10Config = {
    code: 'WB10',
    version: 'V3',
    title: 'Arquitectura de Impacto · Visión Estratégica Personal',
    pillar: 'Shine Beyond (Legado)',
    sourceLabel: 'WB10 — Visión Estratégica Personal V3 (2026)',
    storageKey: 'workbooks-v2-wb10-v3-state',
    downloadFileName: 'wb10-arquitectura-de-impacto.html',
    summary:
        'Workbook final del programa 4Shine. Integra todo lo trabajado en una visión estratégica personal a 3 años, mapa integral de vida, prioridades, PDI, indicadores, plan 12 meses y Executive Growth Plan.',
    introduction:
        'Llegaste al final del programa. Pero este no es el final del camino, es el inicio de una nueva etapa. Durante los últimos meses trabajaste sobre tu identidad, creencias, propósito, comunicación, presencia, influencia, ecosistema relacional, pensamiento estratégico y marca ejecutiva. El verdadero impacto ocurre cuando se integran. Este workbook no busca ayudarte a descubrir quién eres: busca ayudarte a decidir quién quieres convertirte. Eleva la mirada y diseña conscientemente la siguiente etapa.',
    objective:
        'Diseñar tu Visión Estratégica Personal a 3 años con prioridades, decisiones, indicadores y un plan 12 meses. Cerrar con tu Executive Growth Plan: una hoja de ruta clara para transformar liderazgo, reputación y marca en oportunidades reales de impacto.',
    deliverables: [
        'Una definición clara de tu identidad de liderazgo futura.',
        'Una estrategia de crecimiento profesional y personal para los próximos años.',
        'Un mapa integral de vida en 9 áreas.',
        'Tres prioridades estratégicas a 12 meses.',
        'Una matriz de soltar, sostener y construir.',
        'Un PDI integrado 4Shine.',
        'Indicadores simples de avance (conducta, resultado, sostenibilidad).',
        'Un plan de acción de 12 meses por trimestre.',
        'Tu Executive Growth Plan (One-Page Personal Plan).'
    ],
    competencies: [
        'Visión estratégica personal',
        'Pensamiento sistémico',
        'Alineación de metas',
        'Ejecución con foco',
        'Sostenibilidad del crecimiento',
        'Legado personal',
        'Desarrollo de otros',
        'Institucionalización de cultura',
        'Responsabilidad sobre el impacto'
    ],
    observableBehaviours: [
        'Defines una visión clara de futuro.',
        'Traduces tu visión en prioridades concretas.',
        'Tomas decisiones alineadas con propósito y legado.',
        'Dejas de sostener frentes que dispersan energía.',
        'Diseñas acciones medibles para tu desarrollo.',
        'Defines indicadores simples de avance.',
        'Conectas éxito profesional con bienestar, relaciones, contribución y sostenibilidad.',
        'Construyes una huella que no depende únicamente de tu presencia directa.'
    ],
    rules: [
        'No diseñes solo metas. Diseña un sistema.',
        'No confundas crecimiento con acumulación.',
        'Una visión estratégica debe ayudarte a decidir qué aceptar, qué rechazar, qué cuidar y qué construir.',
        'Si todo depende de ti, todavía no estás escalando.',
        'El verdadero plan se nota en tus prioridades, agenda, conversaciones, hábitos y renuncias.',
        'Tu legado empieza cuando tu forma de liderar deja capacidades instaladas en otros.'
    ],
    closing:
        'Tu visión no se prueba por lo inspiradora que suena. Se prueba por las decisiones que empieza a ordenar. Una visión madura te ayuda a priorizar, a decir no, a cuidar tu energía, a desarrollar a otros y a construir algo que pueda permanecer. Este workbook termina cuando puedes decir: "Sé hacia dónde quiero ir. Sé qué necesito priorizar. Sé qué debo soltar. Sé qué debo desarrollar. Sé cómo medir avance. Sé cuál será mi próximo movimiento."',
    sections: [
        {
            id: 'transformacion',
            label: '1. Mi transformación como líder',
            shortLabel: 'Transformación',
            purpose:
                'Antes de definir tu futuro, reconoce el camino recorrido. El crecimiento ocurre de forma gradual; mira hacia atrás para identificar los avances, aprendizajes y transformaciones surgidas durante este proceso. La confianza para construir el futuro también nace de reconocer todo lo que ya construiste.',
            groups: [
                {
                    id: 'punto-partida',
                    title: 'Mi punto de partida',
                    description: 'Regresa mentalmente al momento en que comenzaste el programa.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-1-p1', label: '¿Qué situación profesional o personal te motivó a iniciar este proceso?', rows: 4 },
                        { id: 'wb10v3-1-p2', label: '¿Qué esperabas lograr?', rows: 3 }
                    ]
                },
                {
                    id: 'lo-que-cambio',
                    title: 'Lo que ha cambiado',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-1-c1', label: 'Hoy tengo mayor claridad sobre…', rows: 3, kind: 'completion' },
                        { id: 'wb10v3-1-c2', label: 'La habilidad que más he fortalecido es…', rows: 3, kind: 'completion' },
                        { id: 'wb10v3-1-c3', label: 'La conversación interna que ha cambiado en mí es…', rows: 3, kind: 'completion' },
                        { id: 'wb10v3-1-c4', label: 'La creencia que más he transformado es…', rows: 3, kind: 'completion' }
                    ]
                },
                {
                    id: 'aprendizajes',
                    title: 'Mis mayores aprendizajes',
                    description: '¿Cuáles han sido las lecciones más importantes que te llevas?',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-1-a1', label: 'Aprendizaje 1', rows: 3 },
                        { id: 'wb10v3-1-a2', label: 'Aprendizaje 2', rows: 3 },
                        { id: 'wb10v3-1-a3', label: 'Aprendizaje 3', rows: 3 }
                    ]
                },
                {
                    id: 'frase',
                    title: 'Mi transformación en una frase',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-1-frase', label: 'Si tuvieras que resumir tu evolución en una sola frase, ¿qué dirías?', rows: 3 }
                    ]
                },
                {
                    id: 'sintesis-1',
                    title: 'Síntesis IA',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb10v3-1-s1', label: 'Mi punto de partida', aiSuggested: true },
                        { id: 'wb10v3-1-s2', label: 'Mi principal transformación', aiSuggested: true },
                        { id: 'wb10v3-1-s3', label: 'La habilidad que más fortalecí', aiSuggested: true },
                        { id: 'wb10v3-1-s4', label: 'La creencia que más evolucionó', aiSuggested: true },
                        { id: 'wb10v3-1-s5', label: 'Mi mayor aprendizaje', aiSuggested: true },
                        { id: 'wb10v3-1-s6', label: 'Mi nueva definición como líder', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'vision-3-anios',
            label: '2. Mi visión a 3 años',
            shortLabel: 'Visión 3 años',
            purpose:
                'Construye una imagen clara de tu vida y liderazgo dentro de tres años. Tres años es un horizonte amplio para exigir rediseño, pero cercano para traducirse en decisiones actuales.',
            groups: [
                {
                    id: 'preguntas-vision',
                    title: 'Preguntas guía',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-2-q1', label: '1. En tres años, ¿qué tipo de líder quiero ser? (decidir, comunicar, influir, crear valor, relacionarte, sostener presión)', rows: 4 },
                        { id: 'wb10v3-2-q2', label: '2. ¿Qué quiero haber construido profesionalmente? (rol, empresa, práctica, equipo, reputación, modelo, comunidad, sistema)', rows: 4 },
                        { id: 'wb10v3-2-q3', label: '3. ¿Qué tipo de impacto quiero generar? (personas, equipos, organizaciones, industria, comunidad, familia, sociedad)', rows: 4 },
                        { id: 'wb10v3-2-q4', label: '4. ¿Qué quiero que ya no dependa sólo de mí? (decisiones, operación, ejecución, conocimiento, relaciones)', rows: 4 },
                        { id: 'wb10v3-2-q5', label: '5. ¿Qué huella quiero que empiece a ser visible?', rows: 4 }
                    ]
                },
                {
                    id: 'frase-vision',
                    title: 'Mi visión en una frase (IA)',
                    description: 'La IA arma una visión en una frase a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar visión con IA',
                    columns: ['Elemento', 'Mi visión'],
                    fields: [
                        {
                            id: 'wb10v3-2-frase',
                            label:
                                'En tres años quiero ser/haber construido…, generando…, de una forma…, y dejando como huella…',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        },
        {
            id: 'mapa-vida',
            label: '3. Mi mapa integral de vida',
            shortLabel: 'Mapa de vida',
            purpose:
                'Tu visión necesita sostenerse en una vida completa. No basta crecer profesionalmente si el crecimiento erosiona tu salud, relaciones, energía o sentido. Revisa las áreas principales que sostienen tu vida y liderazgo.',
            narrative: [
                {
                    title: 'Escala 0–10',
                    body:
                        '0 = muy descuidada o desconectada. 10 = muy cuidada, coherente y sostenible. Califica cada área, define qué quieres construir en 3 años y qué acciones tomarás en los próximos 90 días.'
                }
            ],
            groups: [
                {
                    id: 'areas-clave',
                    title: 'Áreas clave',
                    description: 'Para cada área: puntaje 0–10 · qué construir en 3 años · acciones en 90 días.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-3-a1', label: '1. Trabajo / desarrollo profesional', rows: 3 },
                        { id: 'wb10v3-3-a2', label: '2. Liderazgo / impacto en otros', rows: 3 },
                        { id: 'wb10v3-3-a3', label: '3. Finanzas / seguridad económica', rows: 3 },
                        { id: 'wb10v3-3-a4', label: '4. Salud y bienestar', rows: 3 },
                        { id: 'wb10v3-3-a5', label: '5. Familia / vida personal', rows: 3 },
                        { id: 'wb10v3-3-a6', label: '6. Relaciones significativas', rows: 3 },
                        { id: 'wb10v3-3-a7', label: '7. Tiempo libre / energía', rows: 3 },
                        { id: 'wb10v3-3-a8', label: '8. Espiritualidad / sentido', rows: 3 },
                        { id: 'wb10v3-3-a9', label: '9. Contribución social / legado', rows: 3 }
                    ]
                },
                {
                    id: 'lectura-mapa',
                    title: 'Lectura del mapa',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-3-l1', label: '¿Qué área está más fuerte hoy?', rows: 3 },
                        { id: 'wb10v3-3-l2', label: '¿Qué área necesita más atención?', rows: 3 },
                        { id: 'wb10v3-3-l3', label: '¿Qué área, si mejora, tendría impacto positivo en las demás?', rows: 3 },
                        { id: 'wb10v3-3-l4', label: '¿Qué área está poniendo en riesgo la sostenibilidad de mi crecimiento?', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'prioridades',
            label: '4. Mis prioridades estratégicas',
            shortLabel: 'Prioridades',
            purpose:
                'Una visión sin prioridades se vuelve aspiración. Las prioridades estratégicas convierten la visión en foco. Define tres prioridades para los próximos 12 meses.',
            groups: [
                {
                    id: 'preguntas-prioridad',
                    title: 'Preguntas guía',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-4-q1', label: '1. ¿Qué es lo más importante que necesito construir?', rows: 3 },
                        { id: 'wb10v3-4-q2', label: '2. ¿Qué necesito fortalecer en mí para sostener esa visión?', rows: 3 },
                        { id: 'wb10v3-4-q3', label: '3. ¿Qué relación, sistema o capacidad necesito desarrollar?', rows: 3 },
                        { id: 'wb10v3-4-q4', label: '4. ¿Qué debo dejar de hacer porque me dispersa o me mantiene en una versión anterior?', rows: 3 }
                    ]
                },
                {
                    id: 'tres-prioridades',
                    title: 'Mis tres prioridades estratégicas',
                    kind: 'table',
                    columns: ['Prioridad', 'Por qué importa', 'Qué resultado quiero ver'],
                    fields: [
                        { id: 'wb10v3-4-p1', label: 'Prioridad 1' },
                        { id: 'wb10v3-4-p2', label: 'Prioridad 2' },
                        { id: 'wb10v3-4-p3', label: 'Prioridad 3' }
                    ]
                }
            ]
        },
        {
            id: 'soltar-sostener-construir',
            label: '5. Soltar, sostener y construir',
            shortLabel: 'Soltar/sostener',
            purpose:
                'Toda visión exige decisiones. Algunas cosas deben soltarse, otras sostenerse y otras construirse desde cero. Distingue entre continuidad, renuncia y creación.',
            groups: [
                {
                    id: 'matriz-decision',
                    title: 'Matriz de decisión personal',
                    kind: 'table',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb10v3-5-soltar', label: 'Lo que necesito soltar' },
                        { id: 'wb10v3-5-sostener', label: 'Lo que necesito sostener' },
                        { id: 'wb10v3-5-construir', label: 'Lo que necesito construir' },
                        { id: 'wb10v3-5-delegar', label: 'Lo que necesito delegar' },
                        { id: 'wb10v3-5-aprender', label: 'Lo que necesito aprender' },
                        { id: 'wb10v3-5-proteger', label: 'Lo que necesito proteger' }
                    ]
                },
                {
                    id: 'pregunta-integracion',
                    title: 'Pregunta de integración',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-5-decision', label: '¿Qué decisión concreta me pide esta visión?', rows: 4 }
                    ]
                }
            ]
        },
        {
            id: 'pdi',
            label: '6. Mi PDI integrado 4Shine',
            shortLabel: 'PDI 4Shine',
            purpose:
                'Construye tu Plan de Desarrollo Individual integrado. Recoge lo trabajado en los workbooks anteriores y conviértelo en una ruta de acción concreta: qué capacidades necesitas desarrollar para sostener tu visión, marca, liderazgo y legado.',
            concepts: [
                'Pueden venir de: tu historia personal, patrón emocional, propósito, comunicación, presencia ejecutiva, red estratégica, propuesta de valor, marca ejecutiva, visión a 3 años.'
            ],
            groups: [
                {
                    id: 'pdi-areas',
                    title: 'PDI 4Shine (3 a 5 áreas prioritarias)',
                    description: 'Por área: competencia, conducta observable, acción concreta, evidencia de avance.',
                    kind: 'table',
                    columns: ['Área', 'Competencia · Conducta · Acción · Evidencia'],
                    fields: [
                        { id: 'wb10v3-6-pdi-1', label: 'Área de desarrollo 1' },
                        { id: 'wb10v3-6-pdi-2', label: 'Área de desarrollo 2' },
                        { id: 'wb10v3-6-pdi-3', label: 'Área de desarrollo 3' },
                        { id: 'wb10v3-6-pdi-4', label: 'Área de desarrollo 4 (opcional)' },
                        { id: 'wb10v3-6-pdi-5', label: 'Área de desarrollo 5 (opcional)' }
                    ]
                },
                {
                    id: 'pdi-ejemplo',
                    title: 'Ejemplo de referencia',
                    description:
                        'Delegación estratégica · Empoderamiento · Delega decisiones con criterio y seguimiento · Delegar una decisión semanal con condiciones claras de éxito · Reunión sin retomar control operativo.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-6-ejemplo', label: 'Notas sobre el ejemplo (opcional)', rows: 2 }
                    ]
                },
                {
                    id: 'indicadores-pdi',
                    title: '6.1 Indicadores de avance',
                    description:
                        'Tres niveles: conducta (qué harás distinto), resultado (cambio observable), sostenibilidad (qué cuidar para no crecer a costa de ti).',
                    kind: 'table',
                    columns: ['Nivel', 'Indicador · Cómo lo mediré · Frecuencia'],
                    fields: [
                        { id: 'wb10v3-6-ind-conducta', label: 'Conducta' },
                        { id: 'wb10v3-6-ind-resultado', label: 'Resultado' },
                        { id: 'wb10v3-6-ind-sostenibilidad', label: 'Sostenibilidad' }
                    ]
                },
                {
                    id: 'preguntas-control',
                    title: 'Preguntas de control',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-6-ctrl-1', label: '¿Qué señal me dirá que estoy avanzando?', rows: 3 },
                        { id: 'wb10v3-6-ctrl-2', label: '¿Qué señal me dirá que estoy repitiendo un patrón anterior?', rows: 3 },
                        { id: 'wb10v3-6-ctrl-3', label: '¿Qué señal me dirá que debo ajustar la estrategia?', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'plan-12-meses',
            label: '7. Mi plan de acción de 12 meses',
            shortLabel: 'Plan 12 meses',
            purpose:
                'Convierte la claridad en acción. Hoja de ruta de doce meses alineando crecimiento, posicionamiento, liderazgo y marca. El éxito rara vez depende de hacer más cosas: depende de hacer consistentemente las cosas correctas.',
            groups: [
                {
                    id: 'vision-12-meses',
                    title: 'Mi visión a 12 meses',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-7-v1', label: '¿Qué me gustaría que fuera diferente en mi vida profesional?', rows: 3 },
                        { id: 'wb10v3-7-v2', label: '¿Qué me gustaría que otros reconocieran en mí?', rows: 3 },
                        { id: 'wb10v3-7-v3', label: '¿Qué oportunidades me gustaría haber generado?', rows: 3 },
                        { id: 'wb10v3-7-v4', label: '¿Qué logro me haría sentir especialmente orgulloso?', rows: 3 }
                    ]
                },
                {
                    id: 'tres-objetivos',
                    title: '7.1 Mis tres objetivos prioritarios',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-7-o1', label: 'Objetivo 1', rows: 3 },
                        { id: 'wb10v3-7-o2', label: 'Objetivo 2', rows: 3 },
                        { id: 'wb10v3-7-o3', label: 'Objetivo 3', rows: 3 }
                    ]
                },
                {
                    id: 'cuatro-areas',
                    title: 'Las cuatro áreas que impulsarán mi crecimiento',
                    kind: 'table',
                    columns: ['Área', 'Foco / Acción clave'],
                    fields: [
                        { id: 'wb10v3-7-area-lid', label: 'Liderazgo — habilidad o capacidad a fortalecer + acción clave' },
                        { id: 'wb10v3-7-area-marca', label: 'Posicionamiento y marca ejecutiva — qué fortalecer + acción clave' },
                        { id: 'wb10v3-7-area-rel', label: 'Relaciones estratégicas — qué relaciones desarrollar + acción clave' },
                        { id: 'wb10v3-7-area-crec', label: 'Crecimiento profesional — experiencia o capacidad + acción clave' }
                    ]
                },
                {
                    id: 'trimestres',
                    title: '7.2 Plan de ejecución por trimestres',
                    description: 'Para cada trimestre: prioridad principal, tres acciones, resultado esperado.',
                    kind: 'table',
                    columns: ['Trimestre', 'Prioridad · Acciones · Resultado'],
                    fields: [
                        { id: 'wb10v3-7-t1', label: 'Primer trimestre (M 1–3)' },
                        { id: 'wb10v3-7-t2', label: 'Segundo trimestre (M 4–6)' },
                        { id: 'wb10v3-7-t3', label: 'Tercer trimestre (M 7–9)' },
                        { id: 'wb10v3-7-t4', label: 'Cuarto trimestre (M 10–12)' }
                    ]
                },
                {
                    id: 'indicadores-12m',
                    title: 'Indicadores de avance',
                    description:
                        'Marca lo que aplica: Liderazgo (influencia, comunicación, delegación, visibilidad interna); Marca (visibilidad, eventos, invitaciones, nuevas oportunidades); Relaciones (nuevas relaciones, networking, sponsors, acceso); Crecimiento (rol, proyecto, responsabilidad, certificación).',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-7-ind-lid', label: 'Indicadores de liderazgo', rows: 3 },
                        { id: 'wb10v3-7-ind-marca', label: 'Indicadores de marca ejecutiva', rows: 3 },
                        { id: 'wb10v3-7-ind-rel', label: 'Indicadores de ecosistema relacional', rows: 3 },
                        { id: 'wb10v3-7-ind-crec', label: 'Indicadores de crecimiento profesional', rows: 3 }
                    ]
                },
                {
                    id: 'riesgos',
                    title: '7.3 Los riesgos que debo evitar',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-7-r1', label: '¿Qué hábitos o comportamientos podrían impedir mi avance?', rows: 3 },
                        { id: 'wb10v3-7-r2', label: '¿Qué necesito dejar de hacer?', rows: 3 }
                    ]
                },
                {
                    id: 'compromiso',
                    title: 'Mi compromiso de los próximos 12 meses',
                    kind: 'questions',
                    fields: [
                        { id: 'wb10v3-7-comp', label: 'Mi principal prioridad será… y me comprometo a ejecutar las acciones necesarias incluso cuando el progreso no sea inmediato.', rows: 4, kind: 'completion' }
                    ]
                }
            ]
        },
        {
            id: 'executive-growth-plan',
            label: '8. Executive Growth Plan',
            shortLabel: 'EGP',
            purpose:
                'Página final del recorrido 4Shine. El One-Page Personal Plan visualiza tu futuro, alinea prioridades y traduce la visión en acciones concretas. Las personas más exitosas no viven reaccionando: construyen intencionalmente la vida, el liderazgo y el impacto que desean crear.',
            groups: [
                {
                    id: 'egp-sintesis',
                    title: 'Executive Growth Plan (IA)',
                    description: 'La IA arma el EGP usando todo lo trabajado en el programa.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar Executive Growth Plan con IA',
                    columns: ['Elemento', 'Mi Executive Growth Plan'],
                    fields: [
                        { id: 'wb10v3-8-vision', label: 'Mi visión a 3 años', aiSuggested: true },
                        { id: 'wb10v3-8-proposito', label: 'Mi propósito (estoy aquí para… a/en… para…)', aiSuggested: true },
                        { id: 'wb10v3-8-frase-marca', label: 'Mi frase central de marca', aiSuggested: true },
                        { id: 'wb10v3-8-prioridades', label: 'Mis tres prioridades estratégicas', aiSuggested: true },
                        { id: 'wb10v3-8-soltar', label: 'Lo que necesito soltar', aiSuggested: true },
                        { id: 'wb10v3-8-sostener', label: 'Lo que necesito sostener', aiSuggested: true },
                        { id: 'wb10v3-8-construir', label: 'Lo que necesito construir', aiSuggested: true },
                        { id: 'wb10v3-8-pdi', label: 'Mi PDI integrado (áreas, acciones, evidencia)', aiSuggested: true },
                        { id: 'wb10v3-8-indicadores', label: 'Mis indicadores de avance', aiSuggested: true },
                        { id: 'wb10v3-8-plan-12m', label: 'Mi plan 12 meses (1 mes · 6 meses · 1 año)', aiSuggested: true },
                        {
                            id: 'wb10v3-8-compromiso',
                            label:
                                'Mi compromiso final — durante los próximos 90 días voy a… para avanzar hacia… cuidando especialmente… y midiendo a través de…',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '9. Cierre del programa 4Shine',
            shortLabel: 'Cierre',
            purpose:
                'Última reflexión del recorrido. Cierra el workbook y el programa con una declaración personal de lo que llevas y lo que viene.',
            groups: [
                {
                    id: 'cierre-final',
                    title: 'Cierre reflexivo (IA)',
                    description: 'La IA puede armar tu cierre a partir de todo el WB10.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar cierre con IA',
                    columns: ['Dimensión', 'Mi cierre'],
                    fields: [
                        { id: 'wb10v3-9-1', label: 'Sé hacia dónde quiero ir…', aiSuggested: true },
                        { id: 'wb10v3-9-2', label: 'Sé qué necesito priorizar…', aiSuggested: true },
                        { id: 'wb10v3-9-3', label: 'Sé qué debo soltar…', aiSuggested: true },
                        { id: 'wb10v3-9-4', label: 'Sé qué debo desarrollar…', aiSuggested: true },
                        { id: 'wb10v3-9-5', label: 'Sé cómo medir avance…', aiSuggested: true },
                        { id: 'wb10v3-9-6', label: 'Sé cuál será mi próximo movimiento…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
