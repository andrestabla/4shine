// WB1 V3 - Creencias, identidad y pilares personales
// Estructura derivada de "WB1 — Creencias, identidad y pilares personalesV3.docx"

export type WB1FieldKind = 'short' | 'long' | 'completion'

export type WB1Field = {
    id: string
    label: string
    kind?: WB1FieldKind
    rows?: number
    placeholder?: string
    helper?: string
    aiSuggested?: boolean
}

export type WB1GroupKind = 'questions' | 'table' | 'completion' | 'matrix'

export type WB1Group = {
    id: string
    title?: string
    description?: string
    kind?: WB1GroupKind
    aiAutofill?: boolean
    aiAutofillCta?: string
    columns?: string[]
    fields: WB1Field[]
}

export type WB1NarrativeBlock = {
    title?: string
    body: string
}

export type WB1Section = {
    id: string
    label: string
    shortLabel: string
    purpose: string
    concepts?: string[]
    prompts?: string[]
    narrative?: WB1NarrativeBlock[]
    groups: WB1Group[]
}

export type WB1Example = {
    title: string
    rows: { label: string; value: string }[]
}

export type WB1Config = {
    code: string
    version: string
    title: string
    pillar: string
    sourceLabel: string
    storageKey: string
    downloadFileName: string
    summary: string
    introduction: string
    objective: string
    deliverables: string[]
    competencies: string[]
    observableBehaviours: string[]
    rules: string[]
    closing: string
    examples?: WB1Example[]
    sections: WB1Section[]
}

export const WB1_V3_CONFIG: WB1Config = {
    code: 'WB1',
    version: 'V3',
    title: 'Creencias, identidad y pilares personales',
    pillar: 'Shine Within (Esencia y autoliderazgo)',
    sourceLabel: 'WB1 — Creencias, identidad y pilares personales V3 (2026)',
    storageKey: 'workbooks-v2-wb1-v3-state',
    downloadFileName: 'wb1-creencias-identidad-pilares-personales.html',
    summary:
        'Workbook digital interactivo para narrar tu historia personal, reconocer creencias formativas, identificar patrones y elegir un primer cambio observable de liderazgo.',
    introduction:
        'Este primer workbook abre el proceso 4Shine desde tu historia personal. Antes de trabajar propósito, comunicación, relaciones, marca o visión, necesitas mirar con honestidad quién eres, de dónde vienes, qué historia te formó, qué patrones repites y qué parte de ti quieres transformar para liderar con mayor coherencia. Aquí vas a narrar tu historia de una forma sencilla, profunda y útil. No se trata de reconstruir toda tu vida en detalle, sino de reconocer las experiencias, personas, vínculos, creencias y aprendizajes que siguen influyendo en tu forma de decidir, relacionarte y liderar.',
    objective:
        'Activar autoconocimiento, integridad y apertura al feedback para construir una identidad de líder más consciente, sólida y alineada con el impacto que quieres generar.',
    deliverables: [
        'Una primera narrativa de tu historia personal.',
        'Mayor claridad sobre cómo te defines hoy.',
        'Una lectura inicial de tu estructura familiar y sus aprendizajes.',
        'Una hipótesis sobre cómo te ven jefes, pares y equipo.',
        'Una identificación de tus fortalezas y puntos ciegos.',
        'Una creencia o patrón principal que quieres transformar.',
        'Un compromiso inicial de cambio observable.'
    ],
    competencies: [
        'Autenticidad',
        'Práctica reflexiva',
        'Gestión de creencias',
        'Integridad y coherencia',
        'Responsabilidad personal',
        'Apertura al feedback'
    ],
    observableBehaviours: [
        'Reconoces patrones personales que influyen en tu liderazgo.',
        'Describes tu identidad con hechos y ejemplos, no solo con adjetivos.',
        'Identificas creencias que han condicionado tu conducta.',
        'Asumes responsabilidad sobre el impacto que generas en otros.',
        'Reconoces fortalezas y puntos ciegos con apertura.',
        'Defines una conducta concreta para empezar a liderar distinto.'
    ],
    rules: [
        'No necesitas responder “correctamente”. Necesitas responder honestamente.',
        'Escribe desde tu experiencia real. Una respuesta clara y verdadera vale más que una respuesta elaborada para sonar bien.',
        'Permite que aparezcan contradicciones; a veces el trabajo más valioso comienza cuando reconoces la distancia entre lo que crees de ti y lo que otros podrían estar experimentando.',
        'Usa ejemplos concretos cuando puedas. No necesitas justificar tu historia; necesitas comprenderla.'
    ],
    closing:
        'Reconocer tu historia es una fuente de información para un nuevo liderazgo. Algunas partes de tu historia te dieron fuerza, otras te enseñaron formas de protegerte. Cada historia y creencia te convirtió en el líder que eres hoy, pero también puede estar limitando tu liderazgo. Este primer workbook busca ayudarte a mirar con honestidad, reconocer patrones y elegir una primera forma distinta de actuar. El proceso empieza cuando puedes decir: “Esto aprendí. Esto me sostuvo. Esto me limita. Esto elijo transformar.”',
    examples: [
        {
            title: 'Ejemplo de matriz de creencia',
            rows: [
                { label: 'Creencia que reconozco', value: 'Si pido ayuda, pierdo autoridad.' },
                { label: 'Origen probable', value: 'Aprendí a ser reconocido por resolver solo y rápido.' },
                {
                    label: 'Conducta que produce',
                    value: 'Centralizo, pregunto tarde, cargo más de lo necesario.'
                },
                {
                    label: 'Costo actual',
                    value: 'Estrés, menor delegación, menor desarrollo del equipo.'
                },
                {
                    label: 'Nueva creencia que quiero practicar',
                    value: 'Pedir apoyo específico también es una forma de liderar con criterio.'
                }
            ]
        }
    ],
    sections: [
        {
            id: 'identidad-hoy',
            label: '1. Cómo me defino hoy',
            shortLabel: 'Identidad hoy',
            purpose:
                'Antes de mirar tu historia, empieza por tu identidad actual. Esta primera respuesta servirá como punto de partida para observar qué tanto esa identidad viene de tu historia, de tus decisiones, de tus vínculos y de tus creencias.',
            concepts: ['Identidad actual', 'Patrones bajo presión', 'Fortaleza auténtica', 'Necesidad emocional'],
            groups: [
                {
                    id: 'identidad-hoy-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-1-1',
                            label: '¿Cómo te defines hoy como persona y como líder?',
                            helper:
                                'Piensa en tu forma de ser, decidir, trabajar, relacionarte, liderar y enfrentar presión.',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb1v3-1-2',
                            label: '¿Cómo eres cuando te sientes seguro y en confianza?',
                            helper:
                                'Describe cómo actúas cuando no necesitas demostrar, defenderte o cumplir expectativas externas.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-1-3',
                            label: '¿Cómo reaccionas cuando estás bajo presión?',
                            helper:
                                'Observa tu manera de responder cuando hay tensión, incertidumbre, crítica, urgencia o alta expectativa.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-1-4',
                            label: '¿Qué parte de ti reconoces hoy como una fortaleza sólida y auténtica?',
                            helper:
                                'Piensa en aquello que consistentemente genera valor en otros y que probablemente ha sido clave en tu crecimiento profesional. No respondas desde lo técnico; responde desde aquello que impacta cómo lideras y te relacionas.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-1-5',
                            label:
                                '¿Qué comportamiento o patrón sientes que hoy está limitando tu crecimiento o impacto profesional?',
                            helper:
                                'Responde desde una conducta concreta. Por ejemplo: controlar menos, escuchar más, pedir ayuda, poner límites, delegar, hablar con más claridad, sostener conversaciones difíciles.',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'identidad-hoy-sintesis',
                    title: 'Síntesis breve',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb1v3-1-syn-1', label: 'Hoy me defino como una persona que…', aiSuggested: true },
                        { id: 'wb1v3-1-syn-2', label: 'Cuando me siento seguro tiendo a…', aiSuggested: true },
                        {
                            id: 'wb1v3-1-syn-3',
                            label: 'El patrón que aparece con más fuerza bajo presión',
                            aiSuggested: true
                        },
                        {
                            id: 'wb1v3-1-syn-4',
                            label: 'La fortaleza más consistente en mi liderazgo',
                            aiSuggested: true
                        },
                        {
                            id: 'wb1v3-1-syn-5',
                            label: 'El comportamiento que hoy puede estar limitando mi siguiente nivel',
                            aiSuggested: true
                        },
                        {
                            id: 'wb1v3-1-syn-6',
                            label: 'Posible necesidad emocional que estoy intentando proteger',
                            aiSuggested: true
                        }
                    ]
                }
            ]
        },
        {
            id: 'historia-familiar',
            label: '2. Mi historia personal y familiar',
            shortLabel: 'Historia familiar',
            purpose:
                'Tu historia no determina tu liderazgo, pero sí deja huellas. Algunas te fortalecen. Otras pueden haberse convertido en formas automáticas de protegerte, decidir o relacionarte. Cuenta de dónde vienes, cómo se formó tu identidad y qué aprendizajes familiares siguen presentes hoy.',
            concepts: ['Creencias nucleares', 'Neuroplasticidad', 'Filtros emocionales', 'Sombras de fortalezas'],
            prompts: [
                'Escribe como si conversaras con alguien que quiere comprenderte en profundidad.',
                'No necesitas una línea de tiempo: incluye lo relevante para entender cómo te formaste.',
                'Reconoce que muchas creencias nacieron para protegerte; no se trata de juzgarte.'
            ],
            narrative: [
                {
                    title: 'Cómo se forman las creencias',
                    body:
                        'Las creencias no aparecen de un día para otro. Tampoco nacemos pensando que debemos demostrar constantemente nuestro valor, que equivocarnos es peligroso o que pedir ayuda nos hace ver débiles. La mayoría de esas ideas se construyen silenciosamente a partir de experiencias, vínculos, reconocimiento, rechazo, presión y adaptación emocional. Con el tiempo, dejamos de cuestionarlas y empezamos a operar desde ellas de manera automática, como si fueran verdades absolutas sobre quiénes somos y cómo debemos movernos en el mundo.'
                },
                {
                    title: 'El cerebro busca seguridad, pertenencia y protección',
                    body:
                        'Desde la neurociencia y la psicología del comportamiento sabemos que el cerebro humano está diseñado para buscar seguridad, pertenencia y protección. Cuando vivimos experiencias emocionalmente intensas o repetitivas, el cerebro intenta sacar conclusiones rápidas que le permitan anticiparse al dolor, al rechazo o a la incertidumbre. Así empiezan a formarse muchas de nuestras creencias más profundas: no necesariamente porque alguien nos las haya dicho explícitamente, sino porque aprendimos a interpretarlas observando el entorno, la dinámica familiar, la forma en que recibíamos amor, reconocimiento o validación.'
                },
                {
                    body:
                        'Una persona que solo recibía reconocimiento cuando obtenía resultados puede haber aprendido inconscientemente que su valor depende de su desempeño. Alguien que creció en ambientes donde equivocarse generaba crítica o tensión pudo desarrollar una relación muy dura con el error. Una persona que asumió responsabilidades muy temprano quizás aprendió que depender de otros no era seguro y desarrolló una autosuficiencia que hoy puede verse como fortaleza, pero que también limita su capacidad de delegar, confiar o construir equipos más autónomos.'
                },
                {
                    title: 'De creencias a conductas observables',
                    body:
                        'Muchas conclusiones que alguna vez nos ayudaron a adaptarnos terminan convirtiéndose en filtros invisibles desde los cuales interpretamos la realidad. Aaron Beck llamaba “creencias nucleares” a esas ideas profundas que construimos sobre nosotros mismos, los demás y el mundo, y que luego condicionan cómo pensamos, sentimos y actuamos. Dos líderes pueden vivir la misma situación y reaccionar de formas completamente distintas: uno verá un feedback como oportunidad y otro como amenaza. La situación es la misma; lo que cambia es la creencia desde la que cada uno opera.'
                },
                {
                    body:
                        'Las creencias no se quedan en el pensamiento; se vuelven comportamientos observables. Un líder que cree que debe demostrar constantemente su valor tendrá dificultad para descansar, poner límites o desconectarse. Un líder que asocia el error con pérdida de reconocimiento puede caer en microgestión y miedo a delegar. Quien aprendió que el conflicto es peligroso tenderá a evitar conversaciones difíciles. Y quien siente que mostrar vulnerabilidad lo debilita puede terminar construyendo una presencia aparentemente fuerte, pero emocionalmente distante.'
                },
                {
                    title: 'La buena noticia: neuroplasticidad',
                    body:
                        'Las creencias no son permanentes. Gracias al principio de neuroplasticidad, hoy sabemos que el cerebro puede reorganizar conexiones neuronales y construir nuevas formas de interpretar la realidad. Pero eso no ocurre únicamente pensando distinto: ocurre cuando empezamos a vivir experiencias nuevas de manera sostenida y consciente. Una creencia cambia cuando la persona empieza a actuar diferente, observa resultados diferentes y le da al cerebro nueva evidencia emocional.'
                }
            ],
            groups: [
                {
                    id: 'estructura-familiar',
                    title: '2.1 Mi estructura familiar',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-2-1-1',
                            label: '¿Cómo era la estructura de tu familia?',
                            helper:
                                'Incluye lo que aplique: con quién creciste, qué lugar ocupabas, si tienes hermanos, qué rol sentías que cumplías, cómo era la dinámica en casa.',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb1v3-2-1-2',
                            label: '¿Qué papel sentías que tenías que cumplir?',
                            helper: 'Piensa en el rol que asumiste de forma explícita o silenciosa.',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'figura-materna',
                    title: '2.2 Mi madre o figura materna',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-2-2-1',
                            label: '¿Qué recuerdas de tu mamá o figura materna?',
                            helper:
                                'Describe su personalidad, su forma de amar, exigir, cuidar, comunicarse, resolver problemas o enfrentar la vida.',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb1v3-2-2-2',
                            label: '¿Qué aprendiste de ella?',
                            helper:
                                'Puede ser algo que admiras, algo que repetiste, algo que cuestionaste o algo que te marcó.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-2-2-3',
                            label: '¿Qué parte de esa relación sigue influyendo en ti hoy?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'figura-paterna',
                    title: '2.3 Mi padre o figura paterna',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-2-3-1',
                            label: '¿Qué recuerdas de tu papá o figura paterna?',
                            helper:
                                'Describe su personalidad, su forma de estar presente, trabajar, poner límites, comunicar, exigir, proteger o relacionarse.',
                            rows: 5,
                            kind: 'long'
                        },
                        {
                            id: 'wb1v3-2-3-2',
                            label: '¿Qué aprendiste de él?',
                            helper:
                                'Puede ser una fortaleza, una regla, una exigencia, una ausencia, una forma de mirar el mundo o una idea sobre el éxito.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-2-3-3',
                            label: '¿Qué parte de esa relación sigue influyendo en ti hoy?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'reglas-aprendidas',
                    title: '2.4 Reglas aprendidas',
                    description:
                        'En toda historia familiar hay reglas explícitas y reglas silenciosas. Algunas se dijeron en voz alta. Otras se aprendieron observando.',
                    kind: 'completion',
                    fields: [
                        { id: 'wb1v3-2-4-1', label: 'En mi casa aprendí que ser fuerte significaba…', kind: 'completion' },
                        {
                            id: 'wb1v3-2-4-2',
                            label: 'En mi casa aprendí que equivocarse significaba…',
                            kind: 'completion'
                        },
                        { id: 'wb1v3-2-4-3', label: 'En mi casa aprendí que tener éxito significaba…', kind: 'completion' },
                        { id: 'wb1v3-2-4-4', label: 'En mi casa aprendí que pedir ayuda significaba…', kind: 'completion' },
                        {
                            id: 'wb1v3-2-4-5',
                            label: 'En mi casa aprendí que expresar emociones significaba…',
                            kind: 'completion'
                        },
                        {
                            id: 'wb1v3-2-4-6',
                            label: 'En mi casa aprendí que recibir reconocimiento dependía de…',
                            kind: 'completion'
                        },
                        { id: 'wb1v3-2-4-7', label: 'En mi casa aprendí que el conflicto se manejaba…', kind: 'completion' }
                    ]
                }
            ]
        },
        {
            id: 'narrativa-breve',
            label: '3. Mi historia en una narrativa breve',
            shortLabel: 'Narrativa breve',
            purpose:
                'Ahora vas a unir lo anterior en una narrativa simple. No necesitas escribir una biografía completa. El objetivo es reconocer cómo tu historia influyó en tu identidad actual.',
            prompts: [
                'Escribe entre 12 y 20 líneas, en primera persona.',
                'Incluye tres elementos: de dónde vengo, qué aprendí sobre mí y la vida, y cómo eso se refleja hoy en mi liderazgo.'
            ],
            groups: [
                {
                    id: 'narrativa-personal',
                    title: 'Mi narrativa personal',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-3-1',
                            label: 'Mi historia personal se ha formado a partir de…',
                            kind: 'long',
                            rows: 12,
                            placeholder:
                                'De dónde vengo, qué aprendí sobre mí y la vida, y cómo eso se refleja hoy en mi liderazgo.'
                        }
                    ]
                },
                {
                    id: 'narrativa-apoyo',
                    title: 'Preguntas de apoyo (opcional)',
                    description:
                        'Úsalas si necesitas profundizar. Puedes responder solo las que aporten claridad a tu narrativa.',
                    kind: 'questions',
                    fields: [
                        { id: 'wb1v3-3-s1', label: '¿Qué experiencias me hicieron sentir capaz?', rows: 3 },
                        { id: 'wb1v3-3-s2', label: '¿Qué experiencias me hicieron protegerme?', rows: 3 },
                        { id: 'wb1v3-3-s3', label: '¿Qué aprendí a demostrar para sentirme valioso?', rows: 3 },
                        { id: 'wb1v3-3-s4', label: '¿Qué aprendí a ocultar para sentirme seguro?', rows: 3 },
                        { id: 'wb1v3-3-s5', label: '¿Qué parte de mi historia se convirtió en fortaleza?', rows: 3 },
                        { id: 'wb1v3-3-s6', label: '¿Qué parte de mi historia se convirtió en carga?', rows: 3 },
                        { id: 'wb1v3-3-s7', label: '¿Qué sigo repitiendo sin darme cuenta?', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'como-me-ven',
            label: '4. Cómo creo que me ven otros',
            shortLabel: 'Cómo me ven',
            purpose:
                'La identidad propia necesita contraste. Formula una hipótesis honesta sobre cómo podrían describirte personas que trabajan contigo si hablaran con claridad y respeto.',
            concepts: ['Espejo de stakeholders', 'Fortalezas vs. puntos ciegos', 'Hipótesis de percepción'],
            groups: [
                {
                    id: 'como-me-ven-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-4-1',
                            label: '¿Qué dirían tus jefes o sponsors sobre tus principales fortalezas?',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-4-2',
                            label: '¿Qué dirían tus jefes o sponsors sobre tus puntos ciegos?',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-4-3',
                            label: '¿Qué dirían tu equipo o colegas sobre tu forma de trabajar y relacionarte?',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-4-4',
                            label: '¿Qué dirían tu equipo o colegas sobre aquello que podrías mejorar?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'como-me-ven-matriz',
                    title: 'Matriz de espejo',
                    description: 'La IA puede completar esta matriz a partir de tus respuestas.',
                    kind: 'matrix',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar matriz con IA',
                    columns: ['Mirada', 'Fortaleza probable', 'Punto ciego probable'],
                    fields: [
                        { id: 'wb1v3-4-mat-1-fort', label: 'Jefe / sponsor — Fortaleza probable', aiSuggested: true },
                        { id: 'wb1v3-4-mat-1-pc', label: 'Jefe / sponsor — Punto ciego probable', aiSuggested: true },
                        { id: 'wb1v3-4-mat-2-fort', label: 'Par / colega — Fortaleza probable', aiSuggested: true },
                        { id: 'wb1v3-4-mat-2-pc', label: 'Par / colega — Punto ciego probable', aiSuggested: true },
                        {
                            id: 'wb1v3-4-mat-3-fort',
                            label: 'Equipo / personas que lidero — Fortaleza probable',
                            aiSuggested: true
                        },
                        {
                            id: 'wb1v3-4-mat-3-pc',
                            label: 'Equipo / personas que lidero — Punto ciego probable',
                            aiSuggested: true
                        }
                    ]
                },
                {
                    id: 'como-me-ven-sintesis',
                    title: 'Síntesis',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-4-syn-1',
                            label: '¿Qué patrón se repite en la forma como otros podrían verte?',
                            rows: 3
                        },
                        { id: 'wb1v3-4-syn-2', label: '¿Qué fortaleza aparece con más claridad?', rows: 3 },
                        { id: 'wb1v3-4-syn-3', label: '¿Qué punto ciego debo mirar con más honestidad?', rows: 3 }
                    ]
                }
            ]
        },
        {
            id: 'patrones-personales',
            label: '5. Lo que reconozco en mí',
            shortLabel: 'Patrones personales',
            purpose:
                'Identifica patrones personales: formas repetidas de actuar, decidir, reaccionar o protegerte. Pueden haber sido útiles en algún momento, pero también pueden limitar tu impacto actual.',
            concepts: ['Patrón conductual', 'Fortaleza con sombra', 'Costos personales', 'Impacto en otros'],
            groups: [
                {
                    id: 'patrones-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-5-1',
                            label: '¿Qué haces muy bien y reconoces como fortaleza real?',
                            helper: 'Describe una conducta, no solo una cualidad.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-5-2',
                            label: '¿Qué haces hoy que sabes que te limita?',
                            helper:
                                'Por ejemplo: controlar demasiado, postergar conversaciones, asumir de más, reaccionar a la defensiva, evitar pedir ayuda, decir sí cuando quieres decir no.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-5-3',
                            label: '¿Qué te gustaría cambiar porque sabes que podría generar un impacto diferente?',
                            rows: 4
                        },
                        { id: 'wb1v3-5-4', label: '¿Qué impacto tiene hoy ese patrón en ti?', rows: 4 },
                        {
                            id: 'wb1v3-5-5',
                            label: '¿Qué impacto tiene ese patrón en otros?',
                            helper: 'Piensa en equipo, pares, jefe, familia, clientes o personas cercanas.',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'patrones-sintesis',
                    title: 'Síntesis de patrón personal',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb1v3-5-syn-1', label: 'Mi fortaleza principal es…', aiSuggested: true },
                        { id: 'wb1v3-5-syn-2', label: 'El patrón que más se repite en mí es…', aiSuggested: true },
                        { id: 'wb1v3-5-syn-3', label: 'Ese patrón aparece especialmente cuando…', aiSuggested: true },
                        { id: 'wb1v3-5-syn-4', label: 'Lo que intento proteger cuando actúo así es…', aiSuggested: true },
                        { id: 'wb1v3-5-syn-5', label: 'El costo de sostenerlo es…', aiSuggested: true },
                        { id: 'wb1v3-5-syn-6', label: 'El impacto en otros es…', aiSuggested: true },
                        { id: 'wb1v3-5-syn-7', label: 'Lo que quiero empezar a hacer distinto es…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'creencias',
            label: '6. Creencias que me han formado',
            shortLabel: 'Creencias',
            purpose:
                'Una creencia es una convicción interna que guía tu comportamiento. En esta sección vas a identificar una creencia principal que ha influido en tu liderazgo y diseñar una nueva interpretación más sana y funcional.',
            concepts: [
                'Creencias nucleares (Aaron Beck)',
                'Creencia → conducta → resultado',
                'Cinco pasos para transformar una creencia',
                'Evidencia emocional nueva'
            ],
            prompts: [
                'Reconócela: no puedes cambiar algo que sigues operando automáticamente.',
                'Entiende de dónde viene: muchas nacieron intentando protegerte.',
                'Identifica el costo de seguir liderando desde esa idea.',
                'Construye una nueva interpretación más madura, realista y funcional.',
                'Practica conductas nuevas: el cambio se hace observable.'
            ],
            narrative: [
                {
                    title: 'Creencia → conducta observable',
                    body:
                        '“Tengo que resolver todo solo” suele verse como dificultad para delegar, sobrecarga y agotamiento. “Si me equivoco, pierdo valor” aparece como perfeccionismo, miedo a decidir y exceso de control. “Debo demostrar constantemente mi valor” aparece como hiperproductividad e incapacidad de parar. “El conflicto es peligroso” se vuelve evasión de conversaciones difíciles. “Necesito aprobación para sentir seguridad” aparece como dificultad para poner límites. “Mostrar vulnerabilidad me debilita” se vuelve desconexión emocional con el equipo.'
                },
                {
                    title: 'Cómo se transforma una creencia',
                    body:
                        'Una creencia no desaparece pensando distinto. Se transforma con nuevas experiencias, conciencia repetida, práctica consistente, regulación emocional, nuevo lenguaje interno y nuevas conductas observables. El cerebro necesita evidencia emocional nueva: la acción es la clave para construir una nueva identidad de liderazgo basada en nuevas creencias.'
                }
            ],
            groups: [
                {
                    id: 'creencias-q',
                    kind: 'questions',
                    fields: [
                        {
                            id: 'wb1v3-6-1',
                            label: '¿Qué frase interna aparece cuando estás bajo presión?',
                            helper:
                                'Ejemplos: “Tengo que poder solo.” / “Si me equivoco, pierdo valor.” / “Si pido ayuda, pierdo autoridad.”',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-6-2',
                            label: '¿De dónde crees que viene esa creencia?',
                            helper:
                                'Puede venir de tu familia, escuela, primeros trabajos, experiencias de logro, fracaso, rechazo, exigencia o responsabilidad temprana.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-6-3',
                            label: '¿Cómo se ve esa creencia en tu conducta actual?',
                            helper: 'Describe qué haces, evitas, dices, callas o controlas.',
                            rows: 4
                        },
                        { id: 'wb1v3-6-4', label: '¿Qué costo tiene seguir operando desde esa creencia?', rows: 4 },
                        {
                            id: 'wb1v3-6-5',
                            label: '¿Qué nueva creencia sería más sana, realista y útil para tu liderazgo actual?',
                            rows: 4
                        }
                    ]
                },
                {
                    id: 'creencias-matriz',
                    title: 'Matriz breve de creencia',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar matriz con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb1v3-6-mat-1', label: 'Creencia que reconozco', aiSuggested: true },
                        { id: 'wb1v3-6-mat-2', label: 'Origen probable', aiSuggested: true },
                        { id: 'wb1v3-6-mat-3', label: 'Conducta que produce', aiSuggested: true },
                        { id: 'wb1v3-6-mat-4', label: 'Costo actual', aiSuggested: true },
                        { id: 'wb1v3-6-mat-5', label: 'Nueva creencia que quiero practicar', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cambio-prioritario',
            label: '7. Mi cambio prioritario',
            shortLabel: 'Cambio prioritario',
            purpose:
                'Después de mirar tu historia, tu identidad, tus patrones y tus creencias, elige una conducta que quieras empezar a transformar. El cambio inicial debe ser pequeño, visible y practicable.',
            concepts: ['Conducta visible', 'Práctica situacional', 'Evidencia observable'],
            groups: [
                {
                    id: 'cambio-q',
                    kind: 'questions',
                    fields: [
                        { id: 'wb1v3-7-1', label: '¿Qué quiero cambiar que hoy sé que hago?', rows: 4 },
                        { id: 'wb1v3-7-2', label: '¿Qué impacto diferente quiero generar?', rows: 4 },
                        {
                            id: 'wb1v3-7-3',
                            label: '¿Qué conducta concreta demostraría ese cambio?',
                            helper:
                                'Ejemplos: hacer una pregunta antes de responder, delegar una tarea con claridad, pedir ayuda específica, decir no a una urgencia no crítica, abrir una conversación pendiente, pausar antes de reaccionar.',
                            rows: 4
                        },
                        {
                            id: 'wb1v3-7-4',
                            label: '¿En qué situación específica voy a practicarlo esta semana?',
                            rows: 3
                        },
                        { id: 'wb1v3-7-5', label: '¿Qué evidencia mostrará que empecé a cambiar?', rows: 3 }
                    ]
                },
                {
                    id: 'cambio-compromiso',
                    title: 'Compromiso inicial',
                    description: 'La IA puede completar esta tabla a partir de tus respuestas.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Autocompletar con IA',
                    columns: ['Elemento', 'Mi respuesta'],
                    fields: [
                        { id: 'wb1v3-7-com-1', label: 'Lo que quiero cambiar es…', aiSuggested: true },
                        { id: 'wb1v3-7-com-2', label: 'Hoy eso impacta en…', aiSuggested: true },
                        { id: 'wb1v3-7-com-3', label: 'El impacto diferente que quiero generar es…', aiSuggested: true },
                        { id: 'wb1v3-7-com-4', label: 'La conducta visible que voy a practicar es…', aiSuggested: true },
                        { id: 'wb1v3-7-com-5', label: 'La situación donde voy a practicarlo es…', aiSuggested: true },
                        { id: 'wb1v3-7-com-6', label: 'La evidencia de avance será…', aiSuggested: true }
                    ]
                }
            ]
        },
        {
            id: 'cierre',
            label: '8. Cierre del workbook',
            shortLabel: 'Cierre',
            purpose:
                'Cierra el workbook con una síntesis final clara: tu identidad actual, tu fortaleza, tu punto ciego, la creencia que transformas y el compromiso de cambio observable.',
            concepts: ['Síntesis final', 'Compromiso de cambio', 'Entregables WB1'],
            groups: [
                {
                    id: 'cierre-sintesis',
                    title: 'Síntesis final (IA)',
                    description:
                        'Esta sección se autocompleta con IA a partir de todo lo anterior. Revísala, ajústala y hazla tuya.',
                    kind: 'table',
                    aiAutofill: true,
                    aiAutofillCta: 'Generar síntesis final con IA',
                    columns: ['Dimensión', 'Mi respuesta'],
                    fields: [
                        { id: 'wb1v3-8-syn-1', label: 'Hoy me defino como…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-2', label: 'La fortaleza que reconozco en mí es…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-3', label: 'El punto ciego que necesito trabajar es…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-4', label: 'La creencia que quiero transformar es…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-5', label: 'La nueva creencia que quiero practicar es…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-6', label: 'Mis tres pilares de liderazgo son…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-7', label: 'Mi compromiso de cambio inicial es…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-8', label: 'Durante esta semana voy a…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-9', label: 'Para generar este impacto diferente…', aiSuggested: true },
                        { id: 'wb1v3-8-syn-10', label: 'La evidencia será…', aiSuggested: true }
                    ]
                }
            ]
        }
    ]
}
