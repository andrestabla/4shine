// WB5 V3 - Comunicación ejecutiva y estratégica
// Estructura derivada de "WB5 — Comunicación ejecutiva y estratégica V3.docx"

import type { WB1Config } from './workbooks-v2-wb1'

export type WB5Config = WB1Config

export const WB5_V3_CONFIG: WB5Config = {
    code: 'WB5',
    version: 'V3',
    title: 'Comunicación ejecutiva y estratégica',
    pillar: 'Shine Out (Presencia estratégica)',
    sourceLabel: 'WB5 — Comunicación ejecutiva y estratégica V3 (2026)',
    storageKey: 'workbooks-v2-wb5-v3-state',
    downloadFileName: 'wb5-comunicacion-ejecutiva.html',
    summary:
        'Workbook digital para perfilar audiencias, estructurar mensajes ejecutivos con la Pirámide, anticipar objeciones y desarrollar un lenguaje de alta dirección.',
    introduction:
        'Comunicar estratégicamente no significa decir más: significa saber qué necesita entender la audiencia, qué necesita sentir para abrirse al mensaje y qué acción debe quedar clara al final. Aquí desarrollas dos capacidades centrales: perfilamiento de audiencia (cómo reconocer estilo, carácter comunicacional y necesidades de quien tienes al frente) y la influencia del carácter personal en tu comunicación.',
    objective:
        'Adaptar tu mensaje según diferentes perfiles, estructurar ideas complejas con la Pirámide del Mensaje Ejecutivo, anticipar objeciones y desarrollar un lenguaje de alta dirección que genere claridad, criterio y dirección.',
    deliverables: [
        'Claridad sobre tu intención comunicativa.',
        'Un mapa estratégico de tus audiencias.',
        'Capacidad de adaptar tu mensaje según diferentes perfiles.',
        'Una estructura ejecutiva (Pirámide) para organizar ideas complejas.',
        'Un lenguaje más estratégico y de alta dirección.',
        'Un sistema personal de comunicación e influencia.'
    ],
    competencies: [
        'Comunicación de impacto',
        'Claridad e inspiración',
        'Adaptabilidad comunicativa',
        'Escucha activa y empática',
        'Influencia ética y persuasión',
        'Construcción de confianza',
        'Lectura estratégica de audiencia'
    ],
    observableBehaviours: [
        'Lees a tu audiencia antes de comunicar.',
        'Ajustas tu estilo, lenguaje y nivel de detalle según el interlocutor.',
        'Identificas qué necesita la otra persona para confiar, comprender o decidir.',
        'Comunicas con claridad sin perder conexión humana.',
        'Anticipas objeciones y adaptas tu comunicación sin manipular.',
        'Conectas emoción, evidencia y acción.',
        'Cierras tus mensajes dejando claro qué esperas que la audiencia piense, sienta o haga.'
    ],
    rules: [
        'Comunicar bien empieza antes de hablar: empieza leyendo a la audiencia y entendiendo el carácter personal en el estilo de comunicación.',
        'No todas las personas necesitan el mismo nivel de detalle, emoción, velocidad o evidencia.',
        'La historia correcta puede abrir una conversación que los datos solos no logran abrir.',
        'La influencia ética no presiona ni manipula: ayuda a comprender mejor, ver posibilidades y decidir con mayor claridad.',
        'Un mensaje estratégico debe responder tres preguntas: qué quiero que entiendan, qué quiero que sientan y qué quiero que hagan.'
    ],
    closing:
        'Comunicar estratégicamente significa leer mejor a quien tienes al frente y construir un mensaje que pueda ser recibido, comprendido y accionado. Tu audiencia necesita sentirse vista; tu mensaje necesita tener dirección; tu historia necesita hacer visible por qué importa; tu cierre necesita mover a la acción. Este workbook termina cuando puedes decir: "Sé con quién hablo. Sé qué necesita esa audiencia para confiar. Sé qué historia puede abrir comprensión. Sé cómo estructurar mi mensaje. Sé qué acción quiero provocar."',
    sections: [
        {
            id: 'intencion',
            label: '1. Mi intención comunicativa',
            shortLabel: 'Intención',
            purpose:
                'Antes de preparar un mensaje, ten clara tu intención. Muchas conversaciones fallan porque el mensaje empieza sin dirección: se habla mucho, pero no queda claro qué se quiere lograr. Una intención clara te ayuda a ordenar contenido, elegir tono y cerrar con una acción concreta.',
            groups: [
                {
                    id: 'autoeval',
                    title: 'Autoevaluación actual',
                    description:
                        'Cuando necesitas influir en una decisión importante o preparar una comunicación…',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-1-1', label: '¿Qué suele funcionar bien en mi comunicación?', rows: 3, kind: 'long' },
                        { id: 'wb5v3-1-2', label: '¿Qué suele limitar mi impacto?', rows: 3 },
                        { id: 'wb5v3-1-3', label: '¿Qué comentarios he recibido sobre mi forma de comunicar?', rows: 3 },
                        {
                            id: 'wb5v3-1-4',
                            label: '¿Qué situaciones me resultan más difíciles?',
                            helper:
                                'Marca: Comité ejecutivo / Junta directiva / Conversación con mi jefe / Presentación en público / Clientes / Pares o colegas / Conversación difícil.',
                            rows: 3
                        },
                        {
                            id: 'wb5v3-1-5',
                            label: 'Pensando en una situación próxima, ¿qué cambio quieres generar en esa audiencia?',
                            helper:
                                'Marca: Comprensión / Alineación / Decisión / Acción / Confianza / Compromiso.',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'diagnostico-tabla',
                    title: 'Mi diagnóstico actual (1–10)',
                    description: 'Indica un puntaje y, si quieres, una breve explicación.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-1-d-1', label: 'Claridad (1–10)', rows: 2 },
                        { id: 'wb5v3-1-d-2', label: 'Influencia (1–10)', rows: 2 },
                        { id: 'wb5v3-1-d-3', label: 'Adaptabilidad (1–10)', rows: 2 },
                        { id: 'wb5v3-1-d-4', label: 'Síntesis (1–10)', rows: 2 },
                        { id: 'wb5v3-1-d-5', label: 'Credibilidad (1–10)', rows: 2 },
                        { id: 'wb5v3-1-d-6', label: 'Seguridad (1–10)', rows: 2 },
                        { id: 'wb5v3-1-d-7', label: 'Capacidad de persuasión (1–10)', rows: 2 }
                    ]
                }
            ]
        },
        {
            id: 'perfilamiento',
            label: '2. Perfilamiento de audiencia y carácter comunicacional',
            shortLabel: 'Perfilamiento',
            purpose:
                'Los líderes de alto impacto no comunican igual con todas las personas: primero entienden a quién tienen al frente. Perfilar no es etiquetar: es observar cómo procesan los mensajes, qué valoran y qué facilita la confianza.',
            concepts: [
                'Analítico — datos y estructura',
                'Directivo — síntesis y decisión',
                'Relacional — confianza y vínculo',
                'Visionario — futuro y posibilidad',
                'Escéptico — riesgos y pruebas',
                'Pragmático — utilidad y aplicación',
                'Cuidador del sistema — estabilidad y cultura'
            ],
            narrative: [
                {
                    title: 'Siete perfiles comunicacionales',
                    body:
                        'Analítico (datos, precisión, lógica) — bloquea por emoción sin evidencia. Usa datos, criterios y argumentos claros. Directivo (síntesis, decisión, impacto) — bloquea por rodeos. Ve al punto y cierra con decisión. Relacional (confianza, contexto humano) — bloquea por frialdad. Crea conexión y cuida el tono. Visionario (futuro, propósito) — bloquea por exceso de detalle. Muestra oportunidad y escenario. Escéptico (riesgos, pruebas) — bloquea por promesas sin sustento. Anticipa objeciones y muestra evidencia. Pragmático (utilidad, rapidez) — bloquea por teoría excesiva. Aterriza el mensaje en pasos y resultados. Cuidador del sistema (estabilidad, personas) — bloquea por cambios bruscos. Explica efectos, transición y cuidado del proceso.'
                }
            ],
            groups: [
                {
                    id: 'lectura-inicial',
                    title: '2.1 Lectura inicial de la audiencia',
                    description: 'Pensando en la persona o grupo al que vas a comunicar.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb5v3-2-li-1',
                            label: '¿Qué sabes de esta audiencia?',
                            helper: 'Rol, nivel de decisión, intereses, responsabilidades, presión actual, relación contigo.',
                            rows: 4,
                            kind: 'long'
                        },
                        {
                            id: 'wb5v3-2-li-2',
                            label: '¿Qué le importa más a esta audiencia?',
                            helper:
                                'Resultado, seguridad, velocidad, detalle, relación, reputación, innovación, control, impacto, eficiencia, confianza o visión.',
                            rows: 3
                        },
                        {
                            id: 'wb5v3-2-li-3',
                            label: '¿Qué suele generarle resistencia?',
                            helper:
                                'Mensajes largos, falta de datos, exceso de emoción, ambigüedad, presión, improvisación, falta de contexto, promesas grandes, poca claridad en la acción.',
                            rows: 3
                        },
                        {
                            id: 'wb5v3-2-li-4',
                            label: '¿Qué tipo de evidencia necesita para confiar?',
                            helper:
                                'Datos, casos, experiencia, testimonios, lógica financiera, historia humana, benchmark, resultados, criterios técnicos, visión estratégica.',
                            rows: 3
                        },
                        {
                            id: 'wb5v3-2-li-5',
                            label: '¿Qué tono sería más efectivo?',
                            helper:
                                'Directo, cercano, técnico, inspirador, prudente, firme, empático, ejecutivo, consultivo, retador.',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'perfil-dominante',
                    title: '2.3 Perfil dominante de mi audiencia (IA)',
                    description: 'La IA puede inferir el perfil dominante a partir de tu lectura inicial.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Pregunta', 'Mi respuesta'],
                    fields: [
                        { id: 'wb5v3-2-pd-1', label: 'Perfil comunicacional predominante', aiSuggested: true },
                        { id: 'wb5v3-2-pd-2', label: 'Segundo perfil posible', aiSuggested: true },
                        { id: 'wb5v3-2-pd-3', label: 'Lo que esta audiencia necesita para confiar', aiSuggested: true },
                        { id: 'wb5v3-2-pd-4', label: 'Lo que debo evitar al comunicar', aiSuggested: true },
                        { id: 'wb5v3-2-pd-5', label: 'El tipo de evidencia que debo usar', aiSuggested: true },
                        { id: 'wb5v3-2-pd-6', label: 'El tono más adecuado', aiSuggested: true }
                    ]
                },
                {
                    id: 'ecosistema',
                    title: '2.4 Mi ecosistema de influencia',
                    description: 'Identifica el nivel de influencia de cada audiencia en tus objetivos.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-2-ec-1', label: 'Jefe — nivel de influencia y notas', rows: 2 },
                        { id: 'wb5v3-2-ec-2', label: 'Equipo — nivel de influencia y notas', rows: 2 },
                        { id: 'wb5v3-2-ec-3', label: 'Pares — nivel de influencia y notas', rows: 2 },
                        { id: 'wb5v3-2-ec-4', label: 'Clientes — nivel de influencia y notas', rows: 2 },
                        { id: 'wb5v3-2-ec-5', label: 'Stakeholders — nivel de influencia y notas', rows: 2 },
                        { id: 'wb5v3-2-ec-6', label: 'Alta dirección — nivel de influencia y notas', rows: 2 }
                    ]
                }
            ]
        },
        {
            id: 'ajuste-mensaje',
            label: '3. Ajuste estratégico del mensaje',
            shortLabel: 'Ajuste del mensaje',
            purpose:
                'El mismo mensaje puede fracasar o ganar fuerza según orden, tono, nivel de detalle y evidencia. Adaptar no es dejar de ser auténtico: es hacer que tu mensaje sea asertivo para quien tienes al frente.',
            groups: [
                {
                    id: 'variables',
                    title: 'Variables de ajuste',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-3-v-1', label: 'Qué debo enfatizar', rows: 3 },
                        { id: 'wb5v3-3-v-2', label: 'Qué debo reducir', rows: 3 },
                        { id: 'wb5v3-3-v-3', label: 'Qué palabra o concepto debo cuidar', rows: 3 },
                        { id: 'wb5v3-3-v-4', label: 'Qué evidencia necesita esta audiencia', rows: 3 },
                        { id: 'wb5v3-3-v-5', label: 'Qué emoción debo activar', rows: 3 },
                        { id: 'wb5v3-3-v-6', label: 'Qué objeción debo anticipar', rows: 3 },
                        { id: 'wb5v3-3-v-7', label: 'Qué tono conviene usar', rows: 3 },
                        { id: 'wb5v3-3-v-8', label: 'Qué cierre será más efectivo', rows: 3 }
                    ]
                },
                {
                    id: 'precision',
                    title: 'Preguntas de precisión',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-3-p-1', label: '¿Qué parte de mi mensaje puede conectar más con esta audiencia?', rows: 3 },
                        { id: 'wb5v3-3-p-2', label: '¿Qué parte puede generar resistencia?', rows: 3 },
                        { id: 'wb5v3-3-p-3', label: '¿Qué debo decir de forma más simple?', rows: 3 },
                        { id: 'wb5v3-3-p-4', label: '¿Qué debo respaldar con evidencia?', rows: 3 },
                        { id: 'wb5v3-3-p-5', label: '¿Qué debo dejar para una segunda conversación?', rows: 3 }
                    ]
                },
                {
                    id: 'ajuste-sintesis',
                    title: 'Síntesis de ajuste (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Variable', 'Mi ajuste'],
                    fields: [
                        { id: 'wb5v3-3-s-1', label: 'Resumen del ajuste estratégico', aiSuggested: true },
                        { id: 'wb5v3-3-s-2', label: 'Riesgos comunicacionales a mitigar', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'piramide',
            label: '4. La Pirámide del Mensaje Ejecutivo',
            shortLabel: 'Pirámide ejecutiva',
            purpose:
                'Los líderes con presencia ejecutiva no comunican información: comunican claridad. Estructura: 1) conclusión, 2) tres razones, 3) evidencia, 4) acción. Comienza por la conclusión y usa los detalles para fortalecerla.',
            concepts: ['Nivel 1: Mensaje principal', 'Nivel 2: Tres razones clave', 'Nivel 3: Evidencia', 'Nivel 4: Acción'],
            narrative: [
                {
                    title: 'Comunica claridad, no información',
                    body:
                        'Cuando una persona ocupa posiciones de mayor responsabilidad, el tiempo para escuchar disminuye. Los comités, clientes y juntas necesitan comprender rápidamente cuál es el punto central, por qué importa y qué decisión se requiere. Las personas con menor experiencia comienzan por los detalles esperando que la audiencia descubra la conclusión; los líderes de alto impacto comienzan por la conclusión y usan los detalles para fortalecerla. No empieces por lo que sabes: empieza por lo que necesitas que la audiencia comprenda.'
                }
            ],
            groups: [
                {
                    id: 'piramide-construccion',
                    title: 'Construye tu Pirámide para una conversación, reunión o presentación próxima',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb5v3-4-msg',
                            label: 'Nivel 1 — Mi mensaje principal (una sola frase)',
                            helper: '¿Qué quiero que esta audiencia recuerde incluso si olvida todo lo demás?',
                            rows: 3,
                            kind: 'completion'
                        },
                        { id: 'wb5v3-4-r1', label: 'Nivel 2 — Razón clave 1', rows: 3 },
                        { id: 'wb5v3-4-r2', label: 'Nivel 2 — Razón clave 2', rows: 3 },
                        { id: 'wb5v3-4-r3', label: 'Nivel 2 — Razón clave 3', rows: 3 },
                        { id: 'wb5v3-4-e1', label: 'Nivel 3 — Evidencia para la razón 1', rows: 3 },
                        { id: 'wb5v3-4-e2', label: 'Nivel 3 — Evidencia para la razón 2', rows: 3 },
                        { id: 'wb5v3-4-e3', label: 'Nivel 3 — Evidencia para la razón 3', rows: 3 },
                        {
                            id: 'wb5v3-4-accion',
                            label: 'Nivel 4 — La acción que quiero provocar',
                            helper: '¿Qué necesito que ocurra después de este mensaje?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'chequeo-piramide',
                    title: 'Chequeo ejecutivo',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-4-ch-1', label: '¿Puedo expresar mi conclusión en una sola frase?', rows: 2 },
                        { id: 'wb5v3-4-ch-2', label: '¿Mis tres razones son realmente las más importantes?', rows: 2 },
                        { id: 'wb5v3-4-ch-3', label: '¿Tengo evidencia suficiente para respaldarlas?', rows: 2 },
                        { id: 'wb5v3-4-ch-4', label: '¿La audiencia comprenderá rápidamente mi mensaje?', rows: 2 },
                        { id: 'wb5v3-4-ch-5', label: '¿Está claro qué acción espero después?', rows: 2 },
                        { id: 'wb5v3-4-ch-6', label: '¿Estoy comunicando una conclusión o simplemente información?', rows: 2 }
                    ]
                },
                {
                    id: 'piramide-ia',
                    title: 'Pirámide integrada (IA)',
                    description: 'La IA puede armar la versión integrada lista para decir.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Integrar pirámide con IA',
                    columns: ['Nivel', 'Mi versión'],
                    fields: [
                        { id: 'wb5v3-4-ia-1', label: 'Frase única integrada (mensaje + razones + acción)', aiSuggested: true },
                        { id: 'wb5v3-4-ia-2', label: 'Versión 60 segundos con evidencia clave', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'objeciones',
            label: '5. Anticipación de objeciones',
            shortLabel: 'Objeciones',
            purpose:
                'Una comunicación estratégica anticipa resistencias. No es defenderse antes de tiempo: es comprender qué puede preocupar a la audiencia y preparar respuestas más claras.',
            prompts: [
                'Frases puente útiles: "Entiendo esa preocupación; justamente por eso propongo…"',
                '"Ese riesgo existe, y por eso el primer paso sería…"',
                '"La pregunta es válida. La evidencia que tenemos muestra…"',
                '"Estoy de acuerdo en cuidar ese punto; el ajuste que haría es…"'
            ],
            groups: [
                {
                    id: 'objeciones-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-5-1', label: '¿Qué objeción podría aparecer?', rows: 3 },
                        { id: 'wb5v3-5-2', label: '¿Qué preocupación legítima hay detrás de esa objeción?', rows: 3 },
                        { id: 'wb5v3-5-3', label: '¿Qué evidencia puede ayudar a responderla?', rows: 3 },
                        {
                            id: 'wb5v3-5-4',
                            label: '¿Qué frase puedo usar para reconocer la objeción sin perder dirección?',
                            rows: 3
                        }
                    ]
                },
                {
                    id: 'matriz-objeciones',
                    title: 'Matriz de objeciones (IA)',
                    description: 'La IA puede sintetizar tu matriz a partir de las respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar matriz con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb5v3-5-m-1', label: 'Objeción posible', aiSuggested: true },
                        { id: 'wb5v3-5-m-2', label: 'Preocupación detrás', aiSuggested: true },
                        { id: 'wb5v3-5-m-3', label: 'Evidencia o respuesta', aiSuggested: true },
                        { id: 'wb5v3-5-m-4', label: 'Frase de manejo', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'lenguaje-alta-direccion',
            label: '6. Lenguaje de Alta Dirección',
            shortLabel: 'Lenguaje ejecutivo',
            purpose:
                'La presencia ejecutiva se refleja en las palabras: claridad (la audiencia entiende rápido el punto), criterio (perciben evaluación consciente) y dirección (saben qué decisión debe ocurrir).',
            narrative: [
                {
                    title: 'Reemplaza hábitos que reducen tu impacto',
                    body:
                        'Las personas que ocupan alta dirección utilizan un lenguaje más claro, preciso y orientado a decisiones. Evitan expresiones que transmiten duda innecesaria, exceso de justificación o falta de criterio. No es arrogancia ni seguridad artificial: es asumir la responsabilidad de tus ideas y expresarlas con claridad. Desarrollar lenguaje ejecutivo no consiste en aprender frases elegantes, sino en reemplazar hábitos comunicacionales que reducen tu impacto por formas que fortalecen tu credibilidad e influencia.'
                },
                {
                    title: 'Ejemplos prácticos (consulta)',
                    body:
                        'Para expresar criterio: "Yo creo que…" → "Mi recomendación es…". "Tal vez sería bueno…" → "El camino más conveniente es…". Para ordenar: "Hay muchas cosas pasando…" → "Ordenemos en tres puntos." Para responder bajo presión: "No tengo respuesta ahora…" → "Necesito validar esa información antes de responder con precisión." Para presentar recomendación: "Yo haría esto…" → "Recomiendo avanzar con esta opción por tres razones." Para manejar desacuerdo: "No estoy de acuerdo…" → "Tengo una lectura distinta." Para pedir claridad: "No entiendo…" → "Ayúdame a precisar el punto central." Para cerrar: "Cualquier cosa me dicen…" → "Quedo disponible para resolver dudas específicas sobre…".'
                }
            ],
            groups: [
                {
                    id: 'mi-lenguaje',
                    title: '6.2 Mi lenguaje actual',
                    description:
                        'Piensa en una reunión reciente, una presentación o una conversación importante.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-6-1', label: '¿Qué expresiones utilizas frecuentemente cuando estás bajo presión?', rows: 3, kind: 'long' },
                        { id: 'wb5v3-6-2', label: '¿Qué palabras aparecen cuando dudas de ti mismo?', rows: 3 },
                        { id: 'wb5v3-6-3', label: '¿Qué frases utilizas para suavizar tus opiniones?', rows: 3 },
                        { id: 'wb5v3-6-4', label: '¿Qué expresiones podrían estar restando fuerza a tus ideas?', rows: 3 },
                        { id: 'wb5v3-6-5', label: 'Mis expresiones más frecuentes son…', rows: 3 }
                    ]
                },
                {
                    id: 'nuevo-lenguaje',
                    title: 'Mi nuevo lenguaje ejecutivo',
                    description: 'Selecciona entre 3 y 5 expresiones que quieres incorporar de manera intencional las próximas semanas.',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb5v3-6-nuevo',
                            label: 'Las expresiones que practicaré son…',
                            rows: 5,
                            kind: 'long'
                        }
                    ]
                },
                {
                    id: 'lenguaje-ia',
                    title: 'Sustituciones recomendadas (IA)',
                    description: 'La IA puede proponer reemplazos ejecutivos para tus expresiones actuales.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar sustituciones con IA',
                    columns: ['Expresión actual', 'Versión ejecutiva sugerida'],
                    fields: [
                        { id: 'wb5v3-6-ia-1', label: 'Sustitución 1', aiSuggested: true },
                        { id: 'wb5v3-6-ia-2', label: 'Sustitución 2', aiSuggested: true },
                        { id: 'wb5v3-6-ia-3', label: 'Sustitución 3', aiSuggested: true },
                        { id: 'wb5v3-6-ia-4', label: 'Sustitución 4', aiSuggested: true },
                        { id: 'wb5v3-6-ia-5', label: 'Sustitución 5', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'practica',
            label: '7. Práctica aplicada',
            shortLabel: 'Práctica',
            purpose:
                'La comunicación se entrena en contexto real. Elige una situación concreta donde aplicarás este mensaje.',
            groups: [
                {
                    id: 'practica-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-7-1', label: '¿Dónde vas a usar este mensaje?', rows: 3 },
                        { id: 'wb5v3-7-2', label: '¿Cuándo?', rows: 2 },
                        { id: 'wb5v3-7-3', label: '¿Qué audiencia tendrás al frente?', rows: 3 },
                        {
                            id: 'wb5v3-7-4',
                            label: '¿Qué ajuste harás por el perfil comunicacional de esa audiencia?',
                            rows: 3
                        },
                        { id: 'wb5v3-7-5', label: '¿Qué historia o ejemplo usarás?', rows: 3 },
                        { id: 'wb5v3-7-6', label: '¿Qué acción quieres lograr al final?', rows: 3 }
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
                        { id: 'wb5v3-7-pl-1', label: 'Situación donde lo practicaré', aiSuggested: true },
                        { id: 'wb5v3-7-pl-2', label: 'Audiencia', aiSuggested: true },
                        { id: 'wb5v3-7-pl-3', label: 'Perfil comunicacional predominante', aiSuggested: true },
                        { id: 'wb5v3-7-pl-4', label: 'Ajuste principal que haré', aiSuggested: true },
                        { id: 'wb5v3-7-pl-5', label: 'Historia o ejemplo que usaré', aiSuggested: true },
                        { id: 'wb5v3-7-pl-6', label: 'Nivel de la Pirámide que debo cuidar más', aiSuggested: true },
                        { id: 'wb5v3-7-pl-7', label: 'Acción que quiero provocar', aiSuggested: true },
                        { id: 'wb5v3-7-pl-8', label: 'Objeción que debo anticipar', aiSuggested: true },
                        { id: 'wb5v3-7-pl-9', label: 'Evidencia de avance', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'feedback',
            label: '8. Feedback y ajuste',
            shortLabel: 'Feedback',
            purpose:
                'Después de comunicar, observa qué ocurrió. La mejora comunicativa surge cuando revisas el efecto real de tu mensaje, no sólo cómo crees que hablaste.',
            groups: [
                {
                    id: 'revision-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb5v3-8-1', label: '¿Qué entendió la audiencia?', rows: 3 },
                        { id: 'wb5v3-8-2', label: '¿Qué emoción o reacción noté?', rows: 3 },
                        { id: 'wb5v3-8-3', label: '¿Qué parte del mensaje funcionó mejor?', rows: 3 },
                        { id: 'wb5v3-8-4', label: '¿Qué parte generó duda, resistencia o desconexión?', rows: 3 },
                        { id: 'wb5v3-8-5', label: '¿Qué ajustaría la próxima vez?', rows: 3 }
                    ]
                },
                {
                    id: 'registro',
                    title: 'Registro breve (IA)',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar registro con IA',
                    columns: ['Pregunta', 'Mi respuesta'],
                    fields: [
                        { id: 'wb5v3-8-r-1', label: 'Lo que funcionó', aiSuggested: true },
                        { id: 'wb5v3-8-r-2', label: 'Lo que debo ajustar', aiSuggested: true },
                        { id: 'wb5v3-8-r-3', label: 'Objeción o resistencia observada', aiSuggested: true },
                        { id: 'wb5v3-8-r-4', label: 'Aprendizaje principal', aiSuggested: true },
                        { id: 'wb5v3-8-r-5', label: 'Próximo ajuste comunicacional', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '9. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Síntesis final del WB5. La IA completa esta sección a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
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
                        { id: 'wb5v3-9-1', label: 'La comunicación que preparé fue…', aiSuggested: true },
                        { id: 'wb5v3-9-2', label: 'Mi audiencia principal fue…', aiSuggested: true },
                        { id: 'wb5v3-9-3', label: 'El perfil comunicacional predominante fue…', aiSuggested: true },
                        { id: 'wb5v3-9-4', label: 'Lo que necesitaba que entendieran era…', aiSuggested: true },
                        { id: 'wb5v3-9-5', label: 'Lo que necesitaba que sintieran era…', aiSuggested: true },
                        { id: 'wb5v3-9-6', label: 'Lo que necesitaba que hicieran era…', aiSuggested: true },
                        { id: 'wb5v3-9-7', label: 'El ajuste principal que hice según la audiencia fue…', aiSuggested: true },
                        { id: 'wb5v3-9-8', label: 'La historia o ejemplo que usé fue…', aiSuggested: true },
                        { id: 'wb5v3-9-9', label: 'Mi objeción anticipada fue…', aiSuggested: true },
                        { id: 'wb5v3-9-10', label: 'Mi próxima mejora comunicacional será…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
