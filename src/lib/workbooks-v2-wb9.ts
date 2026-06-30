// WB9 V3 - Latido de Marca Ejecutiva
// Estructura derivada de "WB9 — Latido de marca V3.docx"
// Entregable especial: Brochure ejecutivo (PDF) con foto y paleta de marca del líder.

import type { WB1Config } from './workbooks-v2-wb1'

export type WB9Config = WB1Config

export const WB9_V3_CONFIG: WB9Config = {
    code: 'WB9',
    version: 'V3',
    title: 'Latido de Marca Ejecutiva',
    pillar: 'Shine Beyond (Legado)',
    sourceLabel: 'WB9 — Latido de marca V3 (2026)',
    storageKey: 'workbooks-v2-wb9-v3-state',
    downloadFileName: 'wb9-latido-de-marca-ejecutiva.html',
    summary:
        'Workbook V3 para construir el Latido de Marca Ejecutiva del líder. Integra narrativa, territorio de autoridad, pilares, propósito, promesa de valor, audiencia, arquetipo, storytelling, pilares de contenido, LinkedIn y plan 30-60-90. Entregable final: brochure ejecutivo PDF con foto y paleta de marca personalizables (defaults 4Shine).',
    introduction:
        'Después de trabajar tu historia, propósito, comunicación, presencia, ecosistema relacional y pensamiento estratégico, ahora vas a construir tu Latido de Marca: una síntesis ejecutiva de quién eres como líder, qué representas, qué problemas resuelves, qué huella quieres dejar y cómo quieres ser reconocido. Tu marca ejecutiva es la forma en que tu trayectoria, tus valores, tu voz, tus decisiones y tu impacto se vuelven reconocibles para otros. Idea central: tu marca no es lo que dices de ti; es la huella coherente que otros pueden reconocer, recordar y confirmar.',
    objective:
        'Construir tu Latido de Marca Ejecutiva: una marca coherente, visible y útil que conecte tu identidad, tu propósito, tu valor y tu legado, lista para activarse en los próximos 90 días.',
    deliverables: [
        'Narrativa de marca ejecutiva.',
        'Frase central de posicionamiento.',
        'Tres pilares de liderazgo.',
        'Fortalezas distintivas.',
        'Mantras de liderazgo.',
        'Promesa de valor.',
        'Audiencia prioritaria.',
        'Causa o contribución de legado.',
        'Arquetipo, tono y estilo de comunicación.',
        'Tres pilares de contenido.',
        'Versión inicial de tu perfil LinkedIn.',
        'Plan de activación 30-60-90.',
        'Brochure ejecutivo PDF (Latido de Marca) con foto y paleta personalizables.'
    ],
    competencies: [
        'Marca ejecutiva',
        'Propósito aplicado',
        'Influencia estratégica',
        'Visibilidad con criterio',
        'Liderazgo de servicio',
        'Legado personal',
        'Comunicación de valor',
        'Coherencia reputacional'
    ],
    observableBehaviours: [
        'Comunicas tu valor de forma clara y coherente.',
        'Haces visible tu aporte sin caer en autopromoción vacía.',
        'Conectas propósito, experiencia y reputación.',
        'Expresas una narrativa profesional consistente.',
        'Identificas qué problemas puedes resolver con mayor credibilidad.',
        'Defines una audiencia estratégica.',
        'Usas tu visibilidad para generar valor, no sólo exposición.',
        'Conectas tu marca con una huella de impacto más amplia.'
    ],
    rules: [
        'No construyas imagen; construye coherencia.',
        'No intentes parecer alguien distinto. Haz más visible lo que ya tiene valor en ti.',
        'Tu marca ejecutiva debe poder sostenerse con evidencia.',
        'Menos cargo, más criterio. Menos descripción de funciones, más forma de pensar.',
        'Menos exposición vacía, más visibilidad dirigida.',
        'La marca ejecutiva gana fuerza cuando conecta experiencia, propósito, valor y legado.'
    ],
    closing:
        'Tu marca ejecutiva empieza a tomar fuerza cuando tu historia, tu propósito, tu valor y tu forma de comunicar cuentan una misma verdad. No se trata de parecer más; se trata de ser más reconocible, más coherente y útil para las audiencias correctas. Tu Latido de Marca debe responder con claridad: quién soy como líder, qué represento, qué problema resuelvo, para quién genero valor, qué huella quiero dejar y cómo quiero ser recordado.',
    sections: [
        {
            id: 'identidad-visual',
            label: '0. Identidad visual del brochure',
            shortLabel: 'Identidad visual',
            purpose:
                'Tu Latido de Marca se entrega como un brochure ejecutivo PDF. Aquí configuras la identidad visual del brochure: foto del líder y paleta de marca. Por defecto se usa la identidad 4Shine; puedes personalizarla para reflejar tu marca personal.',
            narrative: [
                {
                    title: 'Defaults seguros',
                    body:
                        'Si no personalizas la foto o los colores, el brochure se generará con la identidad 4Shine (azul ejecutivo, dorado de acento y fondos oscuros). Cuando estés listo, sube tu foto profesional y elige tu paleta para que el brochure refleje tu marca.'
                }
            ],
            groups: [
                {
                    id: 'foto-lider',
                    title: 'Foto del líder',
                    description:
                        'Foto profesional que aparecerá en la portada y el bloque de autor del brochure. Recomendado: vertical, fondo neutro, encuadre busto, mínimo 800×1000 px.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb9v3-0-foto-url',
                            label: 'URL pública de tu foto (o usa "Subir foto" en el editor del brochure)',
                            rows: 2,
                            kind: 'short',
                            placeholder: 'https://…'
                        },
                        {
                            id: 'wb9v3-0-foto-pie',
                            label: 'Crédito o pie de foto (opcional)',
                            rows: 2
                        }
                    ]
                },
                {
                    id: 'paleta-marca',
                    title: 'Paleta de marca (defaults 4Shine)',
                    description:
                        'Indica los hex de tu paleta. Si dejas en blanco, se usan los colores 4Shine: #0D1B2A (primario), #1B263B (secundario), #C9A227 (acento), #F4F1EA (fondo claro).',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb9v3-0-color-primario',
                            label: 'Color primario (hex) — por defecto #0D1B2A',
                            rows: 1,
                            placeholder: '#0D1B2A'
                        },
                        {
                            id: 'wb9v3-0-color-secundario',
                            label: 'Color secundario (hex) — por defecto #1B263B',
                            rows: 1,
                            placeholder: '#1B263B'
                        },
                        {
                            id: 'wb9v3-0-color-acento',
                            label: 'Color de acento (hex) — por defecto #C9A227',
                            rows: 1,
                            placeholder: '#C9A227'
                        },
                        {
                            id: 'wb9v3-0-color-fondo',
                            label: 'Color de fondo claro (hex) — por defecto #F4F1EA',
                            rows: 1,
                            placeholder: '#F4F1EA'
                        }
                    ]
                },
                {
                    id: 'edicion-brochure',
                    title: 'Etiquetas del brochure',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-0-edicion', label: 'Edición / año (aparece en la portada y cierre)', rows: 1, placeholder: '2026 · Edición ejecutiva' },
                        { id: 'wb9v3-0-frase-portada', label: 'Frase central de portada (puedes dejarla y la IA la sincroniza con tu frase central)', rows: 2 }
                    ]
                }
            ]
        },
        {
            id: 'narrativa',
            label: '1. Mi narrativa de marca ejecutiva',
            shortLabel: 'Narrativa',
            purpose:
                'Tu narrativa de marca cuenta quién eres como líder, qué te ha formado, qué punto de inflexión transformó tu manera de liderar, qué representas hoy y hacia dónde quieres construir impacto. Breve, clara y estratégica — no una biografía completa.',
            groups: [
                {
                    id: 'preguntas-guia',
                    title: 'Preguntas guía',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-1-q1', label: '1. ¿Qué has sido reconocido por hacer bien? (capacidades, resultados, decisiones, formas de liderar o problemas que otros asocian contigo)', rows: 4 },
                        { id: 'wb9v3-1-q2', label: '2. ¿Qué experiencia o punto de inflexión cambió tu forma de liderar?', rows: 4 },
                        { id: 'wb9v3-1-q3', label: '3. ¿Qué entiendes hoy sobre liderazgo que antes no veías con tanta claridad?', rows: 4 },
                        { id: 'wb9v3-1-q4', label: '4. ¿Qué representas hoy como líder? (claridad, serenidad, expansión, criterio, humanidad, estrategia, innovación, confianza, impacto, legado…)', rows: 4 },
                        { id: 'wb9v3-1-q5', label: '5. ¿Qué futuro quieres ayudar a construir?', rows: 4 }
                    ]
                },
                {
                    id: 'formula-base',
                    title: 'Fórmula base de narrativa',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-1-f1', label: 'Soy un líder que aprendió que…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-1-f2', label: 'Durante años fui reconocido por…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-1-f3', label: 'Pero hubo un punto de inflexión:…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-1-f4', label: 'Hoy lidero desde…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-1-f5', label: 'Mi liderazgo se basa en…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-1-f6', label: 'Lo que quiero construir hacia adelante es…', rows: 2, kind: 'completion' }
                    ]
                },
                {
                    id: 'narrativa-ia',
                    title: 'Mi narrativa de marca (IA)',
                    description: 'Versión de 10 a 15 líneas. La IA puede armarla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar narrativa con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-1-narr', label: 'Mi narrativa de marca ejecutiva (10–15 líneas)', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'territorio',
            label: '2. Mi Territorio de Autoridad',
            shortLabel: 'Territorio',
            purpose:
                'Tu territorio de autoridad es el espacio donde convergen tu experiencia, tu propósito, tus fortalezas y el impacto que deseas generar. No es un cargo: es el lugar donde quieres construir reconocimiento, credibilidad e influencia.',
            groups: [
                {
                    id: 'experiencia-distintiva',
                    title: 'Mi experiencia distintiva',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-2-e1', label: '¿Qué experiencia o conocimiento has desarrollado que tiene un valor especial para otros?', rows: 3 },
                        { id: 'wb9v3-2-e2', label: '¿Qué desafíos has enfrentado o ayudado a resolver de manera recurrente?', rows: 3 },
                        { id: 'wb9v3-2-e3', label: '¿Sobre qué tema quieres ser reconocido dentro de cinco años?', rows: 3 },
                        { id: 'wb9v3-2-e4', label: '¿Qué conversación te gustaría ayudar a transformar o liderar?', rows: 3 },
                        { id: 'wb9v3-2-e5', label: '¿Qué problema o desafío quieres ayudar a resolver a mayor escala?', rows: 3 }
                    ]
                },
                {
                    id: 'perspectiva',
                    title: 'Mi perspectiva diferencial',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-2-p1', label: '¿Qué veo diferente frente a la mayoría de las personas en mi industria o entorno?', rows: 3 },
                        { id: 'wb9v3-2-p2', label: '¿Qué he aprendido que otros podrían beneficiarse de conocer?', rows: 3 },
                        { id: 'wb9v3-2-p3', label: '¿Qué mensaje siento que vale la pena compartir de manera consistente?', rows: 3 }
                    ]
                },
                {
                    id: 'audiencia-influencia',
                    title: 'Mi audiencia de influencia',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-2-a1', label: '¿Quiénes son las personas que más podrían beneficiarse de mi experiencia?', rows: 3 },
                        { id: 'wb9v3-2-a2', label: '¿A quién quiero influir, desarrollar o inspirar?', rows: 3 },
                        { id: 'wb9v3-2-a3', label: '¿Con quién quiero ser asociado profesionalmente en el futuro?', rows: 3 }
                    ]
                },
                {
                    id: 'construir-territorio',
                    title: 'Construyendo mi territorio',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-2-c1', label: 'Quiero ser reconocido por…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-2-c2', label: 'Quiero ayudar a otros a…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-2-c3', label: 'La conversación que quiero liderar es…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-2-c4', label: 'El cambio que quiero impulsar es…', rows: 2, kind: 'completion' }
                    ]
                },
                {
                    id: 'territorio-sintesis',
                    title: 'Síntesis y declaración de autoridad (IA)',
                    description: 'Imagina que tu marca ya alcanzó el posicionamiento que deseas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-2-syn-1', label: 'Mi Territorio de Autoridad (síntesis)', aiSuggested: true },
                        {
                            id: 'wb9v3-2-syn-2',
                            label: 'Declaración: "Quiero que mi nombre sea asociado con … porque ayudo a … a lograr …"',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        },
        {
            id: 'pilares-liderazgo',
            label: '3. Mis tres pilares de liderazgo de impacto',
            shortLabel: 'Pilares',
            purpose:
                'Tus pilares de liderazgo son las tres ideas que sostienen tu marca ejecutiva. Ayudan a que otros entiendan qué representas y desde dónde lideras. Ejemplos de referencia: Visión que Escala, Liderazgo que Multiplica, Legado Empresarial.',
            groups: [
                {
                    id: 'pilar-1',
                    title: 'Pilar 1',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-3-p1-nombre', label: 'Nombre del pilar' },
                        { id: 'wb9v3-3-p1-significa', label: 'Qué significa' },
                        { id: 'wb9v3-3-p1-conducta', label: 'Cómo se ve en mi liderazgo' },
                        { id: 'wb9v3-3-p1-evidencia', label: 'Evidencia que lo respalda' }
                    ]
                },
                {
                    id: 'pilar-2',
                    title: 'Pilar 2',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-3-p2-nombre', label: 'Nombre del pilar' },
                        { id: 'wb9v3-3-p2-significa', label: 'Qué significa' },
                        { id: 'wb9v3-3-p2-conducta', label: 'Cómo se ve en mi liderazgo' },
                        { id: 'wb9v3-3-p2-evidencia', label: 'Evidencia que lo respalda' }
                    ]
                },
                {
                    id: 'pilar-3',
                    title: 'Pilar 3',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-3-p3-nombre', label: 'Nombre del pilar' },
                        { id: 'wb9v3-3-p3-significa', label: 'Qué significa' },
                        { id: 'wb9v3-3-p3-conducta', label: 'Cómo se ve en mi liderazgo' },
                        { id: 'wb9v3-3-p3-evidencia', label: 'Evidencia que lo respalda' }
                    ]
                }
            ]
        },
        {
            id: 'fortalezas-mantras',
            label: '4. Mis fortalezas distintivas y mantras',
            shortLabel: 'Fortalezas y mantras',
            purpose:
                'Las fortalezas muestran qué haces bien. Los mantras condensan cómo quieres recordarte tu forma de liderar.',
            groups: [
                {
                    id: 'fortalezas',
                    title: '4.1 Fortalezas distintivas (5 a 7)',
                    description:
                        'Ejemplos: serenidad bajo presión, visión estratégica, ejecución, lectura de negocio, liderazgo humano, negociación de alto impacto, convertir complejidad en claridad, autoridad sin imposición, desarrollo de equipos, pensamiento sistémico, influencia en contextos complejos, coraje para decisiones difíciles.',
                    kind: 'table',
                    columns: ['Fortaleza', 'Evidencia concreta'],
                    fields: [
                        { id: 'wb9v3-4-f1', label: 'Fortaleza 1' },
                        { id: 'wb9v3-4-f2', label: 'Fortaleza 2' },
                        { id: 'wb9v3-4-f3', label: 'Fortaleza 3' },
                        { id: 'wb9v3-4-f4', label: 'Fortaleza 4' },
                        { id: 'wb9v3-4-f5', label: 'Fortaleza 5' },
                        { id: 'wb9v3-4-f6', label: 'Fortaleza 6 (opcional)' },
                        { id: 'wb9v3-4-f7', label: 'Fortaleza 7 (opcional)' }
                    ]
                },
                {
                    id: 'mantras',
                    title: '4.2 Mis mantras de liderazgo (3 a 4)',
                    description:
                        'Ejemplos: "Mi liderazgo crece cuando respondo con estrategia." "Cada decisión debe dejar valor más allá del presente." "La serenidad también comunica autoridad." "El legado se construye con otros."',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-4-m1', label: 'Mantra 1', rows: 2 },
                        { id: 'wb9v3-4-m2', label: 'Mantra 2', rows: 2 },
                        { id: 'wb9v3-4-m3', label: 'Mantra 3', rows: 2 },
                        { id: 'wb9v3-4-m4', label: 'Mantra 4 (opcional)', rows: 2 }
                    ]
                }
            ]
        },
        {
            id: 'proposito-promesa',
            label: '5. Propósito, promesa de valor y problemas que resuelves',
            shortLabel: 'Propósito y promesa',
            purpose:
                'El propósito muestra para qué lideras. La promesa de valor muestra qué transformación puedes generar. El problema que resuelves muestra dónde tu marca tiene utilidad real.',
            groups: [
                {
                    id: 'proposito',
                    title: '5.1 Mi propósito (retoma WB3)',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-5-p1', label: 'Estoy aquí para… a/en… para…', rows: 4, kind: 'completion' }
                    ]
                },
                {
                    id: 'promesa',
                    title: '5.2 Mi promesa de valor',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-5-pv1', label: 'Transformo / ayudo a / convierto…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-5-pv2', label: 'en…', rows: 2, kind: 'completion' },
                        { id: 'wb9v3-5-pv3', label: 'con impacto en…', rows: 2, kind: 'completion' }
                    ]
                },
                {
                    id: 'promesa-ia',
                    title: 'Mi promesa de valor (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-5-pv-ia', label: 'Mi promesa de valor (versión final)', aiSuggested: true }
                    ]
                },
                {
                    id: 'problemas',
                    title: '5.3 Problemas que resuelves (máximo 3)',
                    kind: 'table',
                    columns: ['Problema que resuelvo', 'A quién le importa', 'Qué cambia cuando lo resuelvo'],
                    fields: [
                        { id: 'wb9v3-5-pr1', label: 'Problema 1' },
                        { id: 'wb9v3-5-pr2', label: 'Problema 2' },
                        { id: 'wb9v3-5-pr3', label: 'Problema 3' }
                    ]
                }
            ]
        },
        {
            id: 'audiencia-diferencial',
            label: '6. Audiencia, causa y diferencial',
            shortLabel: 'Audiencia y diferencial',
            purpose:
                'Una marca ejecutiva necesita saber a quién quiere hablarle, qué causa quiere mover y qué la hace diferente. No le hables a todo el mundo: sé claro para las audiencias correctas.',
            groups: [
                {
                    id: 'audiencia',
                    title: '6.1 Audiencia prioritaria',
                    description: 'Ejemplos: presidentes, comités directivos, CEOs, VPs, gerentes generales, clientes, equipos ejecutivos, headhunters, juntas directivas, comunidades profesionales, líderes en transición.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-6-a1', label: 'Mi audiencia prioritaria es…', rows: 3 },
                        { id: 'wb9v3-6-a2', label: '¿Qué necesita escuchar esta audiencia de mí?', rows: 3 }
                    ]
                },
                {
                    id: 'causa',
                    title: '6.2 Mi causa o contribución de legado',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-6-c1', label: 'Mi causa es…', rows: 3, kind: 'completion' },
                        { id: 'wb9v3-6-c2', label: 'Porque quiero contribuir a…', rows: 3, kind: 'completion' }
                    ]
                },
                {
                    id: 'diferencial',
                    title: '6.3 Mi diferencial',
                    kind: 'table',
                    columns: ['Pregunta', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-6-d1', label: 'Qué sé hacer con credibilidad' },
                        { id: 'wb9v3-6-d2', label: 'Qué experiencia me respalda' },
                        { id: 'wb9v3-6-d3', label: 'Qué forma de liderar me distingue' },
                        { id: 'wb9v3-6-d4', label: 'Qué resultados o evidencia me respaldan' },
                        { id: 'wb9v3-6-d5', label: 'Qué combinación me hace diferente' }
                    ]
                },
                {
                    id: 'diferencial-ia',
                    title: 'Mi diferencial en una frase (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar diferencial con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-6-d-ia', label: 'Lo que me hace diferente es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'arquetipo',
            label: '7. Arquetipo, tono y código simbólico',
            shortLabel: 'Arquetipo',
            purpose:
                'Aquí traduces tu marca en personalidad, lenguaje y símbolos. No es decoración: es coherencia expresiva — que tu forma de comunicar "se sienta" como tú. Trabajarás 4 piezas que se conectan: (7.1) tu ARQUETIPO (la personalidad central), (7.2) tu ESTILO Y TONO (cómo suenas), (7.3) tus VALORES (qué defiendes) y (7.4) tu CÓDIGO SIMBÓLICO (la imagen que te representa). Todo esto alimenta tu brochure ejecutivo: el arquetipo, el tono y el símbolo aparecen en sus páginas finales. Ejemplo completo (referencia): arquetipo "El Sabio Estratega", tono sereno/firme/claro/confiable, valores claridad·criterio·constancia, símbolo "El Faro" (dirección y calma en medio de la tormenta).',
            groups: [
                {
                    id: 'arquetipo-eleccion',
                    title: '7.1 Arquetipo de marca',
                    description:
                        'El arquetipo es la "personalidad" central de tu marca: define cómo te perciben antes de explicar nada. Elige UNO principal (puedes añadir uno secundario que lo matice). Inspírate en estos: El Sabio Estratega (claridad y criterio) · El Arquitecto de Futuro (visión y diseño) · El Catalizador (impulso y cambio) · El Guía Sereno (calma y dirección) · El Constructor de Legado (trascendencia) · El Conector (relaciones y comunidad) · El Innovador Humano (tecnología con propósito). No tiene que ser exacto: elige el que más resuene con cómo lideras hoy.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-7-a1', label: 'Mi arquetipo de marca es…', rows: 2, helper: 'Un solo arquetipo principal. Es la esencia de tu personalidad de marca.', placeholder: 'Ej.: El Sabio Estratega' },
                        { id: 'wb9v3-7-a2', label: 'Representa…', rows: 3, kind: 'completion', helper: 'En 1–2 frases: qué encarna ese arquetipo en tu forma de liderar y por qué te identifica.', placeholder: 'Ej.: …el liderazgo que ordena la complejidad y da dirección con criterio, sin ruido ni autoritarismo.' },
                        { id: 'wb9v3-7-a3', label: 'Arquetipo secundario (opcional)', rows: 2, helper: 'Solo si un segundo matiz te describe (p. ej. un Sabio con alma de Constructor de Legado).', placeholder: 'Ej.: El Constructor de Legado' }
                    ]
                },
                {
                    id: 'estilo-tono',
                    title: '7.2 Estilo y tono de comunicación',
                    description:
                        'El ESTILO es la forma (cómo estructuras y presentas tus ideas); el TONO es la emoción/actitud con la que suenas. Juntos hacen que cualquier persona reconozca tu voz. Sé concreto: usa 3–5 adjetivos por línea. El tono que escribas aquí aparece en tu brochure.',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-7-e1', label: 'Mi estilo es', helper: 'La forma: estructura, ritmo, recursos que usas.', placeholder: 'Ej.: directo, estructurado, con datos y un relato que aterriza la idea.' },
                        { id: 'wb9v3-7-e2', label: 'Mi tono es', helper: '3–5 adjetivos que definen tu actitud al comunicar.', placeholder: 'Ej.: sereno, firme, claro, cálido, confiable.' },
                        { id: 'wb9v3-7-e3', label: 'Hablo desde', helper: 'El lugar/legitimidad desde donde comunicas.', placeholder: 'Ej.: la experiencia y la evidencia, no desde la teoría ni la imposición.' },
                        { id: 'wb9v3-7-e4', label: 'Evito sonar como', helper: 'Lo que NO eres: te ayuda a no diluir tu voz.', placeholder: 'Ej.: vendedor, gurú motivacional, distante o genérico.' }
                    ]
                },
                {
                    id: 'valores-marca',
                    title: '7.3 Valores de marca (3 a 5)',
                    description:
                        'Los valores son los principios que tu marca defiende y que se deben NOTAR en cómo comunicas y decides. No basta nombrarlos: describe cómo se ven en la práctica. Elige entre 3 y 5 (calidad sobre cantidad).',
                    kind: 'table',
                    columns: ['Valor', 'Cómo debe verse en mi marca'],
                    fields: [
                        { id: 'wb9v3-7-v1', label: 'Valor 1', helper: 'Valor + cómo se manifiesta concretamente.', placeholder: 'Ej.: Claridad — cada mensaje deja una idea accionable, sin jerga.' },
                        { id: 'wb9v3-7-v2', label: 'Valor 2', placeholder: 'Ej.: Criterio — priorizo lo esencial y digo lo que importa, aunque incomode.' },
                        { id: 'wb9v3-7-v3', label: 'Valor 3', placeholder: 'Ej.: Constancia — presencia sostenida, no campañas aisladas.' },
                        { id: 'wb9v3-7-v4', label: 'Valor 4 (opcional)', placeholder: 'Ej.: Humanidad — hablo con las personas, no a una audiencia.' },
                        { id: 'wb9v3-7-v5', label: 'Valor 5 (opcional)', placeholder: 'Ej.: Rigor — afirmo con evidencia y reconozco lo que no sé.' }
                    ]
                },
                {
                    id: 'codigo-simbolico',
                    title: '7.4 Código simbólico',
                    description:
                        'Tu símbolo es una imagen/objeto que captura tu esencia de un vistazo (más memorable que mil palabras). No es tu logo: es una metáfora de tu liderazgo. En el brochure aparece como el círculo central de la página "Código simbólico de marca", con su significado y sus palabras asociadas. Cómo elegirlo: piensa en qué objeto haría tu audiencia para describir lo que aportas. Ejemplos: faro (dirección y calma), puente (conectar mundos), brújula (criterio), raíz (solidez y origen), fuego (impulso), arquitectura (estructura), río (flujo y constancia), semilla (potencial), montaña (visión de largo plazo), constelación (sentido en el caos), motor (energía), mapa (claridad de ruta).',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-7-s1', label: 'Símbolo de mi marca', helper: 'Una sola imagen/objeto. Aparece como el círculo central del brochure.', placeholder: 'Ej.: El Faro' },
                        { id: 'wb9v3-7-s2', label: 'Qué representa', helper: 'El significado: qué dice de tu forma de liderar (1–2 frases).', placeholder: 'Ej.: dirección y calma en medio de la tormenta; el criterio que orienta cuando todo es incertidumbre.' },
                        { id: 'wb9v3-7-s3', label: 'Palabras asociadas', helper: '3–6 palabras que evoca tu símbolo (separadas por comas).', placeholder: 'Ej.: guía, claridad, constancia, seguridad, dirección.' }
                    ]
                }
            ]
        },
        {
            id: 'storytelling',
            label: '8. Storytelling para conectar con mi audiencia',
            shortLabel: 'Storytelling',
            purpose:
                'Escribe una historia breve para conectar con la persona o audiencia que quieres impactar. No se centra solo en ti: se centra en una tensión que tu audiencia reconoce y en cómo tu experiencia te permite aportar valor.',
            groups: [
                {
                    id: 'formula-storytelling',
                    title: 'Fórmula de storytelling',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-8-f1', label: 'Durante años…', rows: 3, kind: 'completion' },
                        { id: 'wb9v3-8-f2', label: 'Con el tiempo entendí que…', rows: 3, kind: 'completion' },
                        { id: 'wb9v3-8-f3', label: 'Ahí evolucionó mi forma de liderar/trabajar/aportar. Hoy mi foco está en…', rows: 3, kind: 'completion' },
                        { id: 'wb9v3-8-f4', label: 'Mi diferencial está en…', rows: 3, kind: 'completion' },
                        { id: 'wb9v3-8-f5', label: 'Mi objetivo profesional es…', rows: 3, kind: 'completion' }
                    ]
                },
                {
                    id: 'storytelling-ia',
                    title: 'Mi storytelling de conexión (IA)',
                    description: 'Versión de 8 a 12 líneas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar storytelling con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-8-story', label: 'Mi storytelling de conexión (8–12 líneas)', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'pilares-contenido',
            label: '9. Tres pilares de contenido',
            shortLabel: 'Pilares contenido',
            purpose:
                'Tus pilares de contenido son los temas principales desde los cuales construyes visibilidad con criterio. No publiques sobre todo: repite ideas que fortalezcan tu posicionamiento.',
            groups: [
                {
                    id: 'contenido-1',
                    title: 'Pilar de contenido 1',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-9-c1-nombre', label: 'Nombre del pilar' },
                        { id: 'wb9v3-9-c1-idea', label: 'Idea central' },
                        { id: 'wb9v3-9-c1-percepcion', label: 'Qué percepción construye' },
                        { id: 'wb9v3-9-c1-tema', label: 'Ejemplo de tema' }
                    ]
                },
                {
                    id: 'contenido-2',
                    title: 'Pilar de contenido 2',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-9-c2-nombre', label: 'Nombre del pilar' },
                        { id: 'wb9v3-9-c2-idea', label: 'Idea central' },
                        { id: 'wb9v3-9-c2-percepcion', label: 'Qué percepción construye' },
                        { id: 'wb9v3-9-c2-tema', label: 'Ejemplo de tema' }
                    ]
                },
                {
                    id: 'contenido-3',
                    title: 'Pilar de contenido 3',
                    kind: 'table',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-9-c3-nombre', label: 'Nombre del pilar' },
                        { id: 'wb9v3-9-c3-idea', label: 'Idea central' },
                        { id: 'wb9v3-9-c3-percepcion', label: 'Qué percepción construye' },
                        { id: 'wb9v3-9-c3-tema', label: 'Ejemplo de tema' }
                    ]
                }
            ]
        },
        {
            id: 'linkedin',
            label: '10. LinkedIn como vitrina estratégica',
            shortLabel: 'LinkedIn',
            purpose:
                'Tu perfil de LinkedIn debe comunicar quién eres, qué aportas y qué quieres que otros recuerden. Construye una versión inicial de titular, banner y Acerca de.',
            groups: [
                {
                    id: 'titular',
                    title: '10.1 Titular de LinkedIn',
                    description:
                        'Fórmula: [Qué transformo / qué aporto] | [Área de autoridad] | [Rol o aspiración] | [Rasgo distintivo].',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-10-titular', label: 'Mi titular', rows: 3 }
                    ]
                },
                {
                    id: 'banner',
                    title: '10.2 Banner de LinkedIn',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-10-banner', label: 'Mi frase de banner (puede ser la promesa o la frase central)', rows: 3 }
                    ]
                },
                {
                    id: 'acerca-de',
                    title: '10.3 Acerca de',
                    description: 'Versión breve 8–12 líneas. Debe incluir quién eres, qué experiencia te respalda, qué problema resuelves, cómo aportas valor, qué tipo de impacto quieres generar.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar Acerca de con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb9v3-10-acerca', label: 'Mi Acerca de (8–12 líneas)', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'capitalizacion',
            label: '11. Capitalización de mi marca ejecutiva',
            shortLabel: 'Capitalización',
            purpose:
                'Una marca bien construida genera confianza, oportunidades y retorno. Define cómo quieres capitalizar tu marca y qué acciones te llevan a convertirte en una referencia.',
            groups: [
                {
                    id: 'retorno',
                    title: '11.1 El retorno que quiero generar',
                    description:
                        'Marca opciones: ascender · llegar a C-Level · CEO/Gerente General · juntas directivas · influencia interna · referente de industria · speaker · construir comunidad · advisor/mentor · consultoría · nuevas fuentes de ingreso · publicar contenido de referencia.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-11-r1', label: 'Opciones que más resuenan conmigo', rows: 4, kind: 'long' },
                        { id: 'wb9v3-11-r2', label: 'Otro / aclaración', rows: 2 }
                    ]
                },
                {
                    id: 'vision-posicionamiento',
                    title: 'Mi visión de posicionamiento (en 5 años)',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-11-v1', label: '¿Por qué quiero ser reconocido?', rows: 3 },
                        { id: 'wb9v3-11-v2', label: '¿Qué tipo de oportunidades me gustaría recibir?', rows: 3 },
                        { id: 'wb9v3-11-v3', label: '¿Qué conversaciones quiero estar liderando?', rows: 3 },
                        { id: 'wb9v3-11-v4', label: '¿Qué impacto quiero tener en mi industria o comunidad?', rows: 3 }
                    ]
                },
                {
                    id: 'niveles-autoridad',
                    title: '11.2 Los cuatro niveles de autoridad',
                    description: 'Nivel 1 Experiencia · Nivel 2 Visibilidad · Nivel 3 Influencia · Nivel 4 Referencia.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-11-na', label: 'Hoy estoy en el nivel… porque…', rows: 3, kind: 'completion' }
                    ]
                },
                {
                    id: 'plan-autoridad',
                    title: '11.3 Mi plan para fortalecer autoridad',
                    kind: 'questions',
                    fields: [
                        { id: 'wb9v3-11-p1', label: 'Una acción para fortalecer mi credibilidad', rows: 3 },
                        { id: 'wb9v3-11-p2', label: 'Una acción para aumentar mi visibilidad', rows: 3 },
                        { id: 'wb9v3-11-p3', label: 'Una acción para expandir mi red de influencia', rows: 3 },
                        { id: 'wb9v3-11-p4', label: 'Una acción para posicionarme como referente', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'plan-30-60-90',
            label: '12. Plan de activación 30-60-90',
            shortLabel: 'Plan 30/60/90',
            purpose:
                'Una marca se activa con acciones consistentes. Define tu plan de 90 días para activar tu marca con foco en claridad, visibilidad dirigida y posicionamiento.',
            groups: [
                {
                    id: 'plan-tabla',
                    title: 'Plan 30-60-90',
                    description: '30 días: claridad y ajuste. 60 días: visibilidad dirigida. 90 días: posicionamiento y relaciones estratégicas.',
                    kind: 'table',
                    columns: ['Tiempo', 'Foco', 'Acciones concretas'],
                    fields: [
                        { id: 'wb9v3-12-d30', label: '30 días — Claridad y ajuste' },
                        { id: 'wb9v3-12-d60', label: '60 días — Visibilidad dirigida' },
                        { id: 'wb9v3-12-d90', label: '90 días — Posicionamiento y relaciones estratégicas' }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '13. Cierre — Mi Latido de Marca',
            shortLabel: 'Latido de Marca',
            purpose:
                'Síntesis final del WB9. La IA arma tu Latido de Marca Ejecutiva tomando todo lo anterior. Revísalo, ajústalo y hazlo tuyo — será la base del brochure.',
            groups: [
                {
                    id: 'sintesis-final',
                    title: 'Síntesis final (IA) — base del brochure',
                    description: 'La IA genera la síntesis con todo el WB9 y la usa como contenido del brochure.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar Latido de Marca con IA',
                    columns: ['Elemento', 'Mi Latido de Marca'],
                    fields: [
                        { id: 'wb9v3-13-frase', label: 'Mi frase central de marca', aiSuggested: true },
                        { id: 'wb9v3-13-narrativa', label: 'Mi narrativa ejecutiva', aiSuggested: true },
                        { id: 'wb9v3-13-pilares', label: 'Mis tres pilares de liderazgo', aiSuggested: true },
                        { id: 'wb9v3-13-fortalezas', label: 'Mis fortalezas distintivas', aiSuggested: true },
                        { id: 'wb9v3-13-mantras', label: 'Mis mantras de liderazgo', aiSuggested: true },
                        { id: 'wb9v3-13-proposito', label: 'Mi propósito', aiSuggested: true },
                        { id: 'wb9v3-13-promesa', label: 'Mi promesa de valor', aiSuggested: true },
                        { id: 'wb9v3-13-problemas', label: 'Los tres problemas que resuelvo', aiSuggested: true },
                        { id: 'wb9v3-13-audiencia', label: 'Mi audiencia prioritaria', aiSuggested: true },
                        { id: 'wb9v3-13-causa', label: 'Mi causa o contribución de legado', aiSuggested: true },
                        { id: 'wb9v3-13-diferencial', label: 'Mi diferencial', aiSuggested: true },
                        { id: 'wb9v3-13-arquetipo', label: 'Mi arquetipo de marca', aiSuggested: true },
                        { id: 'wb9v3-13-tono', label: 'Mi tono de comunicación', aiSuggested: true },
                        { id: 'wb9v3-13-valores', label: 'Mis valores de marca', aiSuggested: true },
                        { id: 'wb9v3-13-simbolo', label: 'Mi símbolo de marca', aiSuggested: true },
                        { id: 'wb9v3-13-contenido', label: 'Mis tres pilares de contenido', aiSuggested: true },
                        { id: 'wb9v3-13-titular', label: 'Mi titular de LinkedIn', aiSuggested: true },
                        { id: 'wb9v3-13-banner', label: 'Mi frase de banner', aiSuggested: true },
                        { id: 'wb9v3-13-plan', label: 'Mi plan 30-60-90 (resumen)', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
