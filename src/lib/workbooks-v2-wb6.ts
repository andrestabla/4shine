// WB6 V3 - Lenguaje verbal, no verbal y storytelling de impacto
// Estructura derivada de "WB6 — Lenguaje verbal y no verbal de impacto V3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB6Config = WB1Config

export const WB6_V3_CONFIG: WB6Config = {
    code: 'WB6',
    version: 'V3',
    title: 'Lenguaje verbal, no verbal y storytelling de impacto',
    pillar: 'Shine Out (Presencia estratégica)',
    sourceLabel: 'WB6 — Lenguaje verbal y no verbal de impacto V3 (2026)',
    storageKey: 'workbooks-v2-wb6-v3-state',
    downloadFileName: 'wb6-lenguaje-verbal-no-verbal-storytelling.html',
    summary:
        'Workbook digital para fortalecer presencia ejecutiva a través de cuerpo, voz y lenguaje: postura, mirada, manos, tono, ritmo, pausas, gravitas, storytelling y técnica Monroe.',
    introduction:
        'Después de tu narrativa profesional, elevator pitch y comunicación estratégica, ahora vas a observar la forma en que tu mensaje se expresa: postura, mirada, manos, tono, ritmo, pausas, palabras y respuesta bajo presión. La presencia ejecutiva se construye cuando lo que dices, cómo lo dices y cómo lo sostiene tu cuerpo transmiten coherencia. Tu forma también comunica.',
    objective:
        'Alinear cuerpo, voz y palabras para que tu mensaje gane claridad, gravitas y capacidad de movilizar acción. Construir un protocolo breve para responder bajo presión y dominar storytelling + técnica Monroe.',
    deliverables: [
        'Una lectura clara de tu presencia corporal actual.',
        'Identificación de tus principales fugas corporales.',
        'Un ajuste concreto de postura, mirada y manos.',
        'Una partitura vocal simple para comunicar con intención.',
        'Un protocolo breve para responder bajo presión.',
        'Una historia de impacto estructurada con técnica Monroe.',
        'Una práctica concreta para aplicar en una reunión, presentación o conversación real.'
    ],
    competencies: [
        'Presencia ejecutiva',
        'Comunicación de impacto',
        'Claridad e inspiración',
        'Adaptabilidad comunicativa',
        'Construcción de confianza',
        'Influencia ética y persuasión',
        'Influencia presencial, virtual e híbrida',
        'Compostura bajo presión',
        'Storytelling ejecutivo'
    ],
    observableBehaviours: [
        'Ajustas postura, mirada y tono según el contexto.',
        'Comunicas con claridad, serenidad y firmeza.',
        'Sostienes presencia corporal sin rigidez.',
        'Usas pausas para ordenar el mensaje y regular la conversación.',
        'Mantienes coherencia entre cuerpo, voz y palabras.',
        'Lees señales de la audiencia y ajustas ritmo o énfasis.',
        'Respondes bajo presión con precisión, criterio y calma.',
        'Proyectas gravitas y cercanía en espacios presenciales, virtuales e híbridos.',
        'Usas historias, ejemplos o casos para hacer más memorable el mensaje.'
    ],
    rules: [
        'Tu cuerpo, tu voz y tus palabras deben contar la misma historia.',
        'La presencia ejecutiva combina claridad, calma y criterio.',
        'La autoridad se fortalece con serenidad, no con dureza.',
        'La pausa también comunica liderazgo.',
        'Una frase bien formulada puede ordenar una conversación completa.',
        'La forma no reemplaza el fondo; lo hace más visible, creíble y recordable.'
    ],
    closing:
        'Tu presencia comunica antes, durante y después de tus palabras. Cuando tu cuerpo transmite estabilidad, tu voz ordena y tu lenguaje expresa criterio, tu mensaje gana fuerza. La presencia ejecutiva no consiste en ocupar más espacio: consiste en ocuparlo con intención. Este workbook termina cuando puedes decir: "Sé qué comunica mi cuerpo. Sé qué necesita ajustar mi voz. Sé cómo construir historias de impacto. Sé cómo responder bajo presión con más claridad, serenidad y dirección."',
    sections: [
        {
            id: 'presencia-corporal',
            label: '1. Mi presencia corporal actual',
            shortLabel: 'Presencia corporal',
            purpose:
                'Antes de ajustar tu lenguaje corporal, observa cómo llegas hoy a los espacios de interacción profesional. Tu cuerpo comunica seguridad, apertura, tensión, prisa, defensa, calma, disponibilidad o desconexión incluso antes de que hables.',
            groups: [
                {
                    id: 'presencia-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-1-1',
                            label: '¿Cómo sueles entrar a una reunión importante?',
                            helper: 'Postura, energía, respiración, mirada y ritmo.',
                            rows: 4,
                            kind: 'long'
                        },
                        { id: 'wb6v3-1-2', label: '¿Qué suele comunicar tu cuerpo cuando estás tranquilo?', rows: 3 },
                        { id: 'wb6v3-1-3', label: '¿Qué suele comunicar tu cuerpo cuando estás bajo presión?', rows: 3 },
                        {
                            id: 'wb6v3-1-4',
                            label: '¿Qué parte de tu presencia corporal consideras una fortaleza?',
                            helper:
                                'Mirada, postura, serenidad, sonrisa, manos, cercanía, energía, quietud o capacidad de sostener atención.',
                            rows: 3
                        },
                        {
                            id: 'wb6v3-1-5',
                            label: '¿Qué parte de tu presencia corporal necesitas ajustar?',
                            helper:
                                'Rigidez, movimiento excesivo, evasión de mirada, manos inquietas, rostro tenso, voz acelerada, postura cerrada o baja energía.',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'escaneo-corporal',
                    title: 'Escaneo corporal breve (IA)',
                    description:
                        'La IA puede completar este escaneo a partir de tus respuestas, marcando ajustes por dimensión.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar escaneo con IA',
                    columns: ['Dimensión', 'Cómo me observo + ajuste necesario'],
                    fields: [
                        { id: 'wb6v3-1-e-1', label: 'Postura', aiSuggested: true },
                        { id: 'wb6v3-1-e-2', label: 'Mirada', aiSuggested: true },
                        { id: 'wb6v3-1-e-3', label: 'Manos', aiSuggested: true },
                        { id: 'wb6v3-1-e-4', label: 'Rostro / mandíbula', aiSuggested: true },
                        { id: 'wb6v3-1-e-5', label: 'Movimiento', aiSuggested: true },
                        { id: 'wb6v3-1-e-6', label: 'Respiración', aiSuggested: true },
                        { id: 'wb6v3-1-e-7', label: 'Energía general', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'fugas-corporales',
            label: '2. Fugas corporales',
            shortLabel: 'Fugas corporales',
            purpose:
                'Las fugas corporales son señales no verbales que restan fuerza al mensaje. Aparecen bajo presión, cansancio, inseguridad o exceso de control. Reconocerlas permite corregirlas sin sobreactuar.',
            prompts: [
                'Señales frecuentes: mover demasiado las manos, cruzar brazos, mirar al piso, tensar mandíbula, hablar muy rápido, pausas incómodas, balancearse, revisar pantalla, rigidez, sonreír incómodo, gestos interruptores, cuerpo contradice mensaje, justificar demasiado, sobreexplicar, interrumpir.'
            ],
            groups: [
                {
                    id: 'fugas-lectura',
                    title: 'Lectura personal',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-2-1', label: '¿Cuál es tu fuga corporal más frecuente?', rows: 3, kind: 'long' },
                        { id: 'wb6v3-2-2', label: '¿En qué situaciones aparece más?', rows: 3 },
                        { id: 'wb6v3-2-3', label: '¿Qué puede interpretar la audiencia cuando aparece esa señal?', rows: 3 },
                        { id: 'wb6v3-2-4', label: '¿Qué ajuste concreto puedes practicar?', rows: 3 }
                    ]
                },
                {
                    id: 'fugas-sintesis',
                    title: 'Síntesis (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb6v3-2-syn-1', label: 'Mi fuga corporal principal es', aiSuggested: true },
                        { id: 'wb6v3-2-syn-2', label: 'Aparece especialmente cuando', aiSuggested: true },
                        { id: 'wb6v3-2-syn-3', label: 'Puede comunicar', aiSuggested: true },
                        { id: 'wb6v3-2-syn-4', label: 'El ajuste que practicaré es', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'presencia-ejecutiva',
            label: '3. Presencia corporal ejecutiva',
            shortLabel: 'Anclas corporales',
            purpose:
                'La presencia corporal ejecutiva busca transmitir seguridad tranquila, apertura y claridad. No se trata de actuar: se trata de alinear tu cuerpo con la intención de tu mensaje. Tres anclas: Base, Apertura, Dirección.',
            groups: [
                {
                    id: 'anclas-q',
                    title: 'Tres anclas corporales',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-3-base',
                            label: 'Base — pies, postura y estabilidad',
                            helper: '¿Cómo puedo sostener una base más estable sin verme rígido?',
                            rows: 4
                        },
                        {
                            id: 'wb6v3-3-apertura',
                            label: 'Apertura — pecho, hombros, brazos, rostro y disposición',
                            helper: '¿Cómo puedo comunicar mayor apertura y disponibilidad?',
                            rows: 4
                        },
                        {
                            id: 'wb6v3-3-direccion',
                            label: 'Dirección — mirada, orientación corporal y foco',
                            helper: '¿Cómo puedo mostrar con mi cuerpo hacia dónde quiero llevar la conversación?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'anclas-sintesis',
                    title: 'Mi ajuste corporal prioritario (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Ancla', 'Mi práctica'],
                    fields: [
                        { id: 'wb6v3-3-syn-base', label: 'Base', aiSuggested: true },
                        { id: 'wb6v3-3-syn-apertura', label: 'Apertura', aiSuggested: true },
                        { id: 'wb6v3-3-syn-direccion', label: 'Dirección', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'voz-ejecutiva',
            label: '4. Voz ejecutiva',
            shortLabel: 'Voz ejecutiva',
            purpose:
                'La voz es una de las señales más fuertes de presencia. Tono, ritmo, volumen, pausa y énfasis aumentan o disminuyen tu credibilidad. Una voz ejecutiva transmite calma, intención y claridad.',
            groups: [
                {
                    id: 'voz-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-4-1', label: '¿Cómo suena tu voz cuando estás seguro?', rows: 3, kind: 'long' },
                        {
                            id: 'wb6v3-4-2',
                            label: '¿Cómo cambia tu voz cuando estás bajo presión?',
                            helper:
                                'Puede volverse más rápida, más fuerte, más baja, más fría, más cortante, más insegura o más explicativa.',
                            rows: 3
                        },
                        {
                            id: 'wb6v3-4-3',
                            label: '¿Qué quieres que tu voz comunique con mayor consistencia?',
                            helper:
                                'Elige: calma, autoridad, cercanía, energía, firmeza, claridad, confianza, apertura.',
                            rows: 3
                        },
                        { id: 'wb6v3-4-4', label: '¿Qué necesitas ajustar en tu voz?', rows: 3 }
                    ]
                },
                {
                    id: 'partitura',
                    title: 'Partitura vocal simple (IA)',
                    description: 'La IA puede armar tu partitura indicando ajuste por elemento.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar partitura con IA',
                    columns: ['Elemento vocal', 'Cómo lo uso + ajuste'],
                    fields: [
                        { id: 'wb6v3-4-p-1', label: 'Tono', aiSuggested: true },
                        { id: 'wb6v3-4-p-2', label: 'Ritmo', aiSuggested: true },
                        { id: 'wb6v3-4-p-3', label: 'Volumen', aiSuggested: true },
                        { id: 'wb6v3-4-p-4', label: 'Pausas', aiSuggested: true },
                        { id: 'wb6v3-4-p-5', label: 'Énfasis', aiSuggested: true },
                        { id: 'wb6v3-4-p-6', label: 'Cierre de frases', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'pausa-ritmo-enfasis',
            label: '5. Pausa, ritmo y énfasis',
            shortLabel: 'Pausa y énfasis',
            purpose:
                'Una comunicación ejecutiva necesita ritmo. La pausa permite que la audiencia procese; el énfasis marca lo importante; el cierre firme evita que el mensaje se diluya.',
            prompts: [
                'Ejemplo sin pausa: "Tenemos que priorizar este proyecto porque afecta la experiencia del cliente y puede impactar directamente los resultados del trimestre."',
                'Ejemplo con pausa: "Tenemos que priorizar este proyecto. · Porque afecta la experiencia del cliente. · Y puede impactar directamente los resultados del trimestre."'
            ],
            groups: [
                {
                    id: 'pausa-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-5-frase',
                            label: 'Frase que voy a practicar (de una reunión o presentación próxima)',
                            rows: 3,
                            kind: 'long'
                        },
                        {
                            id: 'wb6v3-5-pausas',
                            label:
                                'Mi versión ajustada con pausas: antes de la idea central, después de la idea central y antes del cierre',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb6v3-5-enfasis',
                            label: 'Mi énfasis principal — ¿Qué palabra o idea necesita más fuerza?',
                            rows: 3
                        }
                    ]
                }
            ]
        },
        {
            id: 'coherencia',
            label: '6. Coherencia cuerpo, voz y mensaje',
            shortLabel: 'Coherencia',
            purpose:
                'Tu mensaje gana fuerza cuando cuerpo, voz y palabras están alineados. Si comunicas una decisión importante con voz insegura, mirada evasiva o cuerpo cerrado, la audiencia puede creerle más a la forma que al contenido.',
            groups: [
                {
                    id: 'coherencia-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-6-1', label: '¿Qué mensaje importante necesitas comunicar próximamente?', rows: 3 },
                        {
                            id: 'wb6v3-6-2',
                            label: '¿Qué quieres que la audiencia perciba de ti?',
                            helper:
                                'Claridad, calma, autoridad, cercanía, seguridad, apertura, firmeza o sensibilidad.',
                            rows: 3
                        },
                        { id: 'wb6v3-6-3', label: '¿Qué debe comunicar tu cuerpo?', rows: 3 },
                        { id: 'wb6v3-6-4', label: '¿Qué debe comunicar tu voz?', rows: 3 },
                        { id: 'wb6v3-6-5', label: '¿Qué palabras deben sostener esa intención?', rows: 3 }
                    ]
                },
                {
                    id: 'matriz-coherencia',
                    title: 'Matriz de coherencia (IA)',
                    description: 'La IA puede armar la matriz a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar matriz con IA',
                    columns: ['Elemento', 'Mi decisión'],
                    fields: [
                        { id: 'wb6v3-6-m-1', label: 'Mensaje que voy a comunicar', aiSuggested: true },
                        { id: 'wb6v3-6-m-2', label: 'Percepción que quiero generar', aiSuggested: true },
                        { id: 'wb6v3-6-m-3', label: 'Cuerpo: postura, mirada, manos', aiSuggested: true },
                        { id: 'wb6v3-6-m-4', label: 'Voz: tono, ritmo, pausa', aiSuggested: true },
                        { id: 'wb6v3-6-m-5', label: 'Palabras: frase clave', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'gravitas',
            label: '7. Gravitas ejecutiva',
            shortLabel: 'Gravitas',
            purpose:
                'Gravitas es la capacidad de proyectar serenidad, criterio y confianza incluso en situaciones de incertidumbre, presión o complejidad. No es parecer importante ni mostrarse distante: nace de la coherencia entre lo que piensas, sientes, dices y haces.',
            narrative: [
                {
                    title: 'Cómo se percibe la gravitas',
                    body:
                        'Las personas con gravitas generan sensación de estabilidad. Pueden navegar situaciones complejas sin perder claridad, sostener conversaciones difíciles y aportar dirección cuando otros se sienten confundidos. Se percibe cuando hablan con intención en lugar de llenar silencios; cuando escuchan para comprender en lugar de para responder; cuando pueden reconocer una dificultad sin transmitir desesperación; cuando sostienen incertidumbre sin perder dirección. Las personas con gravitas no eliminan la complejidad: ayudan a otros a navegarla.'
                },
                {
                    title: 'Lo que suele debilitar la gravitas',
                    body:
                        'Hablar demasiado rápido. Sobreexplicar cada idea. Justificar constantemente. Interrumpir para demostrar conocimiento. Reaccionar emocionalmente ante el desacuerdo. Necesitar tener siempre la razón. Buscar aprobación antes de expresar una opinión. Llenar cada silencio con palabras. Evitar conversaciones difíciles. Cambiar de posición ante la primera objeción. La gravitas no significa ausencia de nervios: significa capacidad para liderar a pesar de ellos.'
                }
            ],
            groups: [
                {
                    id: 'mejor-version',
                    title: 'Tu mejor versión como líder',
                    description:
                        'Piensa en un momento de tu carrera en el que sentiste que estabas en tu mejor versión: seguro, claro y conectado.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-7-mv',
                            label:
                                'Mi mejor versión como líder se caracteriza por… (energía, voz, reacción a preguntas difíciles, cómo te percibían)',
                            rows: 5,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'detonantes',
                    title: 'Situaciones donde pierdo gravitas',
                    description:
                        'La presencia se pone a prueba cuando aparece presión, incertidumbre o conflicto.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-7-d-1', label: '¿En qué contextos comienzas a dudar de ti?', rows: 3 },
                        { id: 'wb6v3-7-d-2', label: '¿Ante qué tipo de personas te sientes más inseguro?', rows: 3 },
                        { id: 'wb6v3-7-d-3', label: '¿Qué conversaciones te generan tensión?', rows: 3 },
                        { id: 'wb6v3-7-d-4', label: '¿Qué situaciones activan tus reacciones automáticas?', rows: 3 },
                        { id: 'wb6v3-7-d-5', label: 'Mis principales detonantes son…', rows: 4 }
                    ]
                },
                {
                    id: 'protocolo',
                    title: '7.1 Protocolo Pausar — Precisar — Dirigir',
                    description:
                        'Frases útiles: Pausar ("Dame un momento para ordenar la respuesta."); Precisar ("El punto central es…", "La decisión que necesitamos tomar es…"); Dirigir ("Propongo avanzar con…", "El siguiente paso concreto es…").',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-7-p-pausar', label: 'Mi frase para Pausar', rows: 2, kind: 'completion' },
                        { id: 'wb6v3-7-p-precisar', label: 'Mi frase para Precisar', rows: 2, kind: 'completion' },
                        { id: 'wb6v3-7-p-dirigir', label: 'Mi frase para Dirigir', rows: 2, kind: 'completion' }
                    ]
                }
            ]
        },
        {
            id: 'storytelling',
            label: '8. Storytelling de impacto + Técnica Monroe',
            shortLabel: 'Storytelling · Monroe',
            purpose:
                'El storytelling de impacto no es contar una anécdota larga: es seleccionar una historia breve que ayude a transmitir una idea, revelar una tensión y movilizar una acción. La técnica Monroe estructura mensajes persuasivos en cinco pasos: Atención, Necesidad, Satisfacción, Visualización, Acción.',
            groups: [
                {
                    id: 'elegir-historia',
                    title: '8.1 Elegir la historia correcta',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-8-h-1',
                            label: '¿Qué historia, caso o ejemplo podría ayudar a esta audiencia a entender el mensaje?',
                            helper:
                                'Experiencia propia, caso de negocio, conversación, escena de cliente, situación de equipo, error, decisión difícil o aprendizaje.',
                            rows: 4,
                            kind: 'long'
                        },
                        { id: 'wb6v3-8-h-2', label: '¿Por qué esta historia es relevante para esta audiencia?', rows: 3 },
                        { id: 'wb6v3-8-h-3', label: '¿Qué idea debe quedar clara después de escucharla?', rows: 3 }
                    ]
                },
                {
                    id: 'estructura-historia',
                    title: '8.2 Estructura simple — Contexto · Tensión · Decisión · Resultado · Aprendizaje',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-8-e-1', label: 'Contexto — ¿Dónde ocurre y por qué importa?', rows: 3 },
                        { id: 'wb6v3-8-e-2', label: 'Tensión — ¿Qué problema, riesgo, conflicto o necesidad apareció?', rows: 3 },
                        { id: 'wb6v3-8-e-3', label: 'Decisión — ¿Qué se hizo o qué decisión fue necesaria?', rows: 3 },
                        { id: 'wb6v3-8-e-4', label: 'Resultado — ¿Qué cambió?', rows: 3 },
                        { id: 'wb6v3-8-e-5', label: 'Aprendizaje — ¿Qué debe recordar la audiencia?', rows: 3 }
                    ]
                },
                {
                    id: 'historia-versionada',
                    title: '8.3 y 8.4 — Mi historia + cierre',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-8-historia',
                            label: 'Mi historia de impacto (8 a 10 líneas)',
                            rows: 8,
                            kind: 'long'
                        },
                        {
                            id: 'wb6v3-8-cierre-1',
                            label: 'Esta historia importa porque…',
                            kind: 'completion',
                            rows: 3
                        },
                        {
                            id: 'wb6v3-8-cierre-2',
                            label: 'Lo que quiero que la audiencia vea es…',
                            kind: 'completion',
                            rows: 3
                        },
                        {
                            id: 'wb6v3-8-cierre-3',
                            label: 'La decisión o acción que esta historia prepara es…',
                            kind: 'completion',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'monroe-pasos',
                    title: '8.5 Técnica Monroe — 5 pasos',
                    description:
                        'Atención (captar interés) → Necesidad (mostrar tensión) → Satisfacción (propuesta) → Visualización (qué cambia) → Acción (siguiente paso).',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb6v3-8-m1-frase',
                            label: 'Paso 1 — Atención · Frase, dato, pregunta o historia para abrir + emoción a activar',
                            rows: 3
                        },
                        {
                            id: 'wb6v3-8-m2',
                            label: 'Paso 2 — Necesidad · ¿Qué está pasando?, ¿por qué importa?, ¿qué riesgo si no se atiende?',
                            rows: 4
                        },
                        {
                            id: 'wb6v3-8-m3',
                            label: 'Paso 3 — Satisfacción · ¿Qué propongo?, ¿por qué responde a la necesidad?, ¿qué evidencia la sostiene?',
                            rows: 4
                        },
                        {
                            id: 'wb6v3-8-m4',
                            label: 'Paso 4 — Visualización · ¿Qué cambia si actuamos?, ¿qué se vuelve posible?, ¿qué pasa si no actuamos?',
                            rows: 4
                        },
                        {
                            id: 'wb6v3-8-m5',
                            label: 'Paso 5 — Acción · ¿Qué necesito que la audiencia haga ahora?, primer paso concreto y cierre',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'monroe-matriz',
                    title: 'Matriz Monroe integrada (IA)',
                    description: 'La IA puede armar la matriz integrada lista para decir.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Integrar Monroe con IA',
                    columns: ['Paso', 'Mi mensaje'],
                    fields: [
                        { id: 'wb6v3-8-mi-1', label: 'Atención', aiSuggested: true },
                        { id: 'wb6v3-8-mi-2', label: 'Necesidad', aiSuggested: true },
                        { id: 'wb6v3-8-mi-3', label: 'Satisfacción', aiSuggested: true },
                        { id: 'wb6v3-8-mi-4', label: 'Visualización', aiSuggested: true },
                        { id: 'wb6v3-8-mi-5', label: 'Acción', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'practica',
            label: '9. Práctica aplicada',
            shortLabel: 'Práctica',
            purpose:
                'Lleva este workbook a una situación real. Elige una reunión, presentación, conversación difícil, comité, entrevista o intervención pública donde puedas practicar presencia ejecutiva.',
            groups: [
                {
                    id: 'practica-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb6v3-9-1', label: '¿Dónde voy a practicar?', rows: 3 },
                        { id: 'wb6v3-9-2', label: '¿Qué quiero comunicar?', rows: 3 },
                        { id: 'wb6v3-9-3', label: '¿Qué ajuste corporal voy a practicar?', rows: 3 },
                        { id: 'wb6v3-9-4', label: '¿Qué ajuste vocal voy a practicar?', rows: 3 },
                        { id: 'wb6v3-9-5', label: '¿Qué frase ejecutiva voy a usar?', rows: 3 },
                        { id: 'wb6v3-9-6', label: '¿Qué evidencia me mostrará que avancé?', rows: 3 }
                    ]
                },
                {
                    id: 'plan-practica',
                    title: 'Plan de práctica (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar plan con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb6v3-9-pl-1', label: 'Situación donde practicaré', aiSuggested: true },
                        { id: 'wb6v3-9-pl-2', label: 'Mensaje principal', aiSuggested: true },
                        { id: 'wb6v3-9-pl-3', label: 'Ajuste corporal', aiSuggested: true },
                        { id: 'wb6v3-9-pl-4', label: 'Ajuste vocal', aiSuggested: true },
                        { id: 'wb6v3-9-pl-5', label: 'Frase ejecutiva a practicar', aiSuggested: true },
                        { id: 'wb6v3-9-pl-6', label: 'Evidencia de avance', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '10. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB6. La IA completa esta sección a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
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
                        { id: 'wb6v3-10-1', label: 'Mi fuga corporal principal es…', aiSuggested: true },
                        { id: 'wb6v3-10-2', label: 'Mi ajuste corporal prioritario es…', aiSuggested: true },
                        { id: 'wb6v3-10-3', label: 'Mi ajuste vocal prioritario es…', aiSuggested: true },
                        { id: 'wb6v3-10-4', label: 'La percepción que quiero generar es…', aiSuggested: true },
                        { id: 'wb6v3-10-5', label: 'Mi protocolo Pausar — Precisar — Dirigir es…', aiSuggested: true },
                        { id: 'wb6v3-10-6', label: 'Mi historia de impacto en una frase es…', aiSuggested: true },
                        { id: 'wb6v3-10-7', label: 'Mi mensaje Monroe en una frase es…', aiSuggested: true },
                        { id: 'wb6v3-10-8', label: 'Mi frase ejecutiva a practicar es…', aiSuggested: true },
                        { id: 'wb6v3-10-9', label: 'La situación real donde voy a practicarla es…', aiSuggested: true },
                        { id: 'wb6v3-10-10', label: 'La evidencia de avance será…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
