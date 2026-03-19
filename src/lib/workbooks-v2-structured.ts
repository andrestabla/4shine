export type StructuredWorkbookField = {
    id: string
    label: string
    placeholder?: string
    rows?: number
}

export type StructuredWorkbookFieldGroup = {
    id: string
    title: string
    description?: string
    fields: StructuredWorkbookField[]
}

export type StructuredWorkbookSection = {
    id: string
    label: string
    shortLabel: string
    purpose: string
    concepts: string[]
    prompts?: string[]
    groups: StructuredWorkbookFieldGroup[]
}

export type StructuredWorkbookConfig = {
    code: string
    title: string
    pillar: string
    storageKey: string
    downloadFileName: string
    sourceLabel: string
    summary: string
    objective: string
    components: string[]
    competencies: string[]
    rules: string[]
    sections: StructuredWorkbookSection[]
}

const makeFields = (prefix: string, labels: string[], rows = 3): StructuredWorkbookField[] =>
    labels.map((label, index) => ({
        id: `${prefix}-${index + 1}`,
        label,
        rows
    }))

const lifeAreas = [
    'Trabajo / profesional',
    'Contribución a la sociedad',
    'Finanzas',
    'Salud y bienestar',
    'Relaciones',
    'Familia / personal',
    'Tiempo libre y energía',
    'Espiritualidad'
]

export const WB9_STRUCTURED_CONFIG: StructuredWorkbookConfig = {
    code: 'WB9',
    title: 'Latido de marca',
    pillar: 'Shine Beyond',
    storageKey: 'workbooks-v2-wb9-structured-state',
    downloadFileName: 'wb9-latido-de-marca.html',
    sourceLabel: 'Importado desde 4Shinebuilder / Workbooksfinales / WB9',
    summary:
        'Versión digital estructurada del workbook de marca ejecutiva, reputación, propósito, causa social y visibilidad 30-60-90.',
    objective:
        'Integrar propósito, posicionamiento, reputación y legado en una marca ejecutiva clara, coherente y visible, para que el líder deje de ser percibido solo por su rol actual y comience a ser reconocido por la huella estratégica, ética y humana que proyecta.',
    components: [
        'Legado personal y trascendencia',
        'Liderazgo regenerativo',
        'Impacto social y humano',
        'Desarrollo de otros líderes (mentoring & coaching)'
    ],
    competencies: [
        'Mentoría y sucesión',
        'Empoderamiento (empowerment)',
        'Desafío para el crecimiento',
        'Ética y responsabilidad social',
        'Liderazgo de servicio (stewardship)',
        'Inclusión y equidad',
        'Institucionalización de cultura',
        'Reconocimiento y humildad',
        'Conexión con el propósito (meaning)',
        'Gestión de la diversidad cognitiva',
        'Conciencia sistémica y comunitaria'
    ],
    rules: [
        'No construyas imagen; construye coherencia.',
        'Tu marca ejecutiva no es lo que dices de ti, sino la huella que otros pueden confirmar.',
        'No confundas visibilidad con exposición vacía.',
        'Si tu propósito no conversa con tu posicionamiento, la marca se fractura.',
        'El legado empieza cuando tu influencia deja de depender solo de tu presencia directa.'
    ],
    sections: [
        {
            id: 'purpose',
            label: '1. Propósito integrado',
            shortLabel: 'Propósito',
            purpose:
                'Integrar tu propósito personal, profesional y de impacto en una formulación clara, consistente y accionable, para que tu marca ejecutiva sea una expresión coherente de quién eres, qué causas mueves y qué huella quieres dejar.',
            concepts: [
                'Propósito integrado',
                'Coherencia propósito-posicionamiento',
                'Legado personal y trascendencia',
                'Causa social estratégica',
                'Promesa de valor con sentido'
            ],
            prompts: [
                'Identifica de dónde sale tu propósito antes de formularlo.',
                'Conecta propósito con huella visible y no solo con intención.',
                'Usa el test de coherencia para detectar ajustes de marca.'
            ],
            groups: [
                {
                    id: 'purpose-sources',
                    title: 'Inventario de propósito en 5 fuentes',
                    description: 'Responde desde vocación, experiencia, misión y huella.',
                    fields: makeFields('wb9-purpose-sources', [
                        'Pasión: qué te mueve de forma genuina',
                        'Vocación: qué tiendes a despertar o facilitar en otros',
                        'Misión: qué transformación quieres impulsar',
                        'Profesión / expertise: qué sabes hacer con credibilidad',
                        'Impacto deseado: qué cambio quieres dejar'
                    ], 4)
                },
                {
                    id: 'purpose-matrix',
                    title: 'Matriz propósito-aporte-huella',
                    description: 'Baja el propósito a contribución concreta.',
                    fields: makeFields('wb9-purpose-matrix', [
                        'Qué me mueve',
                        'Qué sé aportar',
                        'A quién quiero servir',
                        'Qué transformación quiero generar',
                        'Qué huella quiero dejar'
                    ], 4)
                },
                {
                    id: 'purpose-statement',
                    title: 'Fórmula del propósito integrado',
                    description: 'Usa la estructura: Estoy aquí para + verbo + transformación + audiencia + impacto.',
                    fields: [
                        {
                            id: 'wb9-purpose-statement',
                            label: 'Mi propósito integrado es',
                            placeholder: 'Estoy aquí para...',
                            rows: 5
                        }
                    ]
                },
                {
                    id: 'purpose-coherence',
                    title: 'Test de coherencia propósito-marca',
                    description: 'Responde Sí/No y el ajuste necesario en cada punto.',
                    fields: makeFields('wb9-purpose-coherence', [
                        '¿Mi propósito coincide con la huella que hoy dejo?',
                        '¿Mi posicionamiento actual refleja ese propósito?',
                        '¿Mis decisiones recientes reforzaron esa dirección?',
                        '¿Mi propósito trasciende el cargo actual?',
                        '¿Se conecta con una contribución social o humana verificable?'
                    ], 3)
                },
                {
                    id: 'purpose-life-map',
                    title: 'Mapa de integración de vida',
                    description: 'Escribe una visión breve por cada área clave.',
                    fields: makeFields('wb9-purpose-life', lifeAreas, 3)
                }
            ]
        },
        {
            id: 'brand',
            label: '2. Marca ejecutiva',
            shortLabel: 'Marca',
            purpose:
                'Definir una marca ejecutiva clara, creíble y diferenciada, para que tu posicionamiento deje de depender solo del cargo y se sostenga en una propuesta de valor reconocible, coherente y estratégicamente visible.',
            concepts: [
                'Marca ejecutiva',
                'Posicionamiento ejecutivo',
                'USP / propuesta única',
                'Promesa de valor',
                'Señal de marca',
                'Coherencia reputacional'
            ],
            prompts: [
                'No basta con decir “soy distinto”; debes mostrar para quién, en qué y con qué evidencia.',
                'Piensa tu marca como un activo estratégico de carrera, no como imagen.'
            ],
            groups: [
                {
                    id: 'brand-current',
                    title: 'Lectura actual de tu marca',
                    description: 'Identifica las señales que ya emites hoy.',
                    fields: makeFields('wb9-brand-current', [
                        'Cómo me describen hoy cuando no estoy presente',
                        'Qué valor suelen asociar conmigo',
                        'Qué problema creen que sé resolver',
                        'Qué estilo o tono me reconocen',
                        'Qué atributo aparece más fuerte',
                        'Qué vacío o confusión hay en mi marca actual'
                    ], 3)
                },
                {
                    id: 'brand-matrix',
                    title: 'Matriz diferenciador-problema-prueba',
                    description: 'Resume la arquitectura estratégica de tu valor.',
                    fields: makeFields('wb9-brand-matrix', [
                        'Diferenciador clave',
                        'Problema o necesidad al que responde',
                        'Audiencia para la que ese diferenciador importa',
                        'Prueba o evidencia que lo vuelve creíble',
                        'Señal de marca que deja instalada'
                    ], 3)
                },
                {
                    id: 'brand-core',
                    title: 'Arquitectura mínima de marca ejecutiva',
                    description: 'Formula tu núcleo narrativo y reputacional.',
                    fields: makeFields('wb9-brand-core', [
                        'Quién soy profesionalmente',
                        'Qué problema principal ayudo a resolver',
                        'Qué me hace diferente',
                        'Qué transformación genero',
                        'Qué tono o estilo define mi marca',
                        'Qué audiencia quiero atraer o impactar',
                        'Qué señal principal quiero instalar'
                    ], 3)
                },
                {
                    id: 'brand-statement',
                    title: 'Declaración síntesis de marca',
                    fields: [
                        {
                            id: 'wb9-brand-statement',
                            label: 'Mi marca ejecutiva en una frase',
                            rows: 4
                        }
                    ]
                }
            ]
        },
        {
            id: 'values',
            label: '3. Valores de marca',
            shortLabel: 'Valores',
            purpose:
                'Definir los valores que sostienen tu marca ejecutiva, para que tu posicionamiento no dependa solo de narrativa atractiva sino de principios verificables que ordenen tu conducta, tus decisiones y tu reputación.',
            concepts: [
                'Valores de marca',
                'Integración ética en decisiones',
                'No negociable de marca',
                'Credibilidad moral',
                'Huella ética'
            ],
            prompts: [
                'Distingue entre valores aspiracionales y valores probados.',
                'Cada valor debe poder verse en conducta y evidencia.'
            ],
            groups: [
                {
                    id: 'values-inventory',
                    title: 'Inventario amplio de valores',
                    description: 'Selecciona entre 10 y 15 valores que realmente expliquen tu marca.',
                    fields: makeFields('wb9-values-inventory', [
                        'Valor 1',
                        'Valor 2',
                        'Valor 3',
                        'Valor 4',
                        'Valor 5',
                        'Valor 6',
                        'Valor 7',
                        'Valor 8',
                        'Valor 9',
                        'Valor 10'
                    ], 2)
                },
                {
                    id: 'values-core',
                    title: 'Valores núcleo de marca',
                    description: 'Reduce el inventario a la columna vertebral de tu marca.',
                    fields: makeFields('wb9-values-core', [
                        'Valor núcleo 1',
                        'Valor núcleo 2',
                        'Valor núcleo 3',
                        'Valor núcleo 4',
                        'Valor núcleo 5'
                    ], 2)
                },
                {
                    id: 'values-non-negotiables',
                    title: 'No negociables de marca',
                    description: 'Completa la frase y el costo que estarías dispuesto a asumir.',
                    fields: makeFields('wb9-values-non-negotiables', [
                        'No negocio 1 aunque eso implique...',
                        'No negocio 2 aunque eso implique...',
                        'No negocio 3 aunque eso implique...'
                    ], 3)
                },
                {
                    id: 'values-ethics',
                    title: 'Reflexión ética y reputacional',
                    fields: makeFields('wb9-values-ethics', [
                        'Decisión reciente que sí fue coherente con mis valores',
                        'Tensión valor-resultado que hoy debo vigilar',
                        'Señal reputacional que quiero fortalecer'
                    ], 4)
                }
            ]
        },
        {
            id: 'archetype',
            label: '4. Arquetipo de liderazgo',
            shortLabel: 'Arquetipo',
            purpose:
                'Definir el arquetipo de liderazgo que mejor representa tu marca ejecutiva, para darle una identidad simbólica, narrativa y conductual más clara a tu posicionamiento, tu tono y tu forma de ejercer influencia.',
            concepts: [
                'Arquetipo de liderazgo',
                'Identidad simbólica',
                'Tono arquetípico',
                'Sombra del arquetipo',
                'Coherencia arquetípica'
            ],
            prompts: [
                'Busca una figura que ordene cómo lideras, cómo suenas y cómo te perciben.',
                'Elige también la sombra que debes equilibrar para no distorsionar la marca.'
            ],
            groups: [
                {
                    id: 'archetype-traits',
                    title: 'Inventario de rasgos dominantes',
                    fields: makeFields('wb9-archetype-traits', [
                        'Rasgo dominante 1',
                        'Rasgo dominante 2',
                        'Rasgo dominante 3',
                        'Tipo de presencia que genero',
                        'Forma de influencia más natural',
                        'Rasgo valioso pero subnombrado'
                    ], 3)
                },
                {
                    id: 'archetype-options',
                    title: 'Arquetipos tentativos',
                    description: 'Formula tres arquetipos posibles y qué fortalece cada uno.',
                    fields: makeFields('wb9-archetype-options', [
                        'Arquetipo tentativo 1',
                        'Arquetipo tentativo 2',
                        'Arquetipo tentativo 3'
                    ], 3)
                },
                {
                    id: 'archetype-final',
                    title: 'Selección final y equilibrio',
                    fields: makeFields('wb9-archetype-final', [
                        'Arquetipo principal elegido',
                        'Arquetipos secundarios que lo complementan',
                        'Sombra o exceso que debo vigilar',
                        'Qué lo equilibra en mi liderazgo'
                    ], 3)
                },
                {
                    id: 'archetype-code',
                    title: 'Código simbólico y tono',
                    fields: makeFields('wb9-archetype-code', [
                        'Símbolo o metáfora de mi arquetipo',
                        'Tono con el que quiero sonar',
                        'Señal visible que debe reconocer la gente',
                        'Frase narrativa de mi liderazgo'
                    ], 3)
                }
            ]
        },
        {
            id: 'linkedin',
            label: '5. Perfil LinkedIn optimizado',
            shortLabel: 'LinkedIn',
            purpose:
                'Optimizar tu perfil de LinkedIn para que funcione como una pieza coherente de tu marca ejecutiva, capaz de traducir propósito, posicionamiento, reputación y propuesta de valor en una presencia digital clara, creíble y estratégicamente visible.',
            concepts: [
                'Headline estratégico',
                'Banner de posicionamiento',
                'Acerca de ejecutivo',
                'Visibilidad por pensamiento',
                'Prueba reputacional'
            ],
            prompts: [
                'Haz visible tu criterio, no solo tu CV.',
                'Usa el perfil como sistema coherente entre foto, banner, headline, about y actividad.'
            ],
            groups: [
                {
                    id: 'linkedin-audit',
                    title: 'Auditoría estratégica del perfil actual',
                    fields: makeFields('wb9-linkedin-audit', [
                        'URL del perfil',
                        'Qué impresión general deja hoy',
                        'Qué valor comunica con claridad',
                        'Qué parte del perfil está genérica o débil',
                        'Qué señal de autoridad aparece',
                        'Qué oportunidad podría abrir hoy'
                    ], 3)
                },
                {
                    id: 'linkedin-headline',
                    title: 'Headline y banner de posicionamiento',
                    fields: makeFields('wb9-linkedin-headline', [
                        'Mi headline estratégico',
                        'Frase principal del banner',
                        'Subtítulo o idea secundaria',
                        'Señal visual o simbólica',
                        'Qué debe reforzar del perfil'
                    ], 3)
                },
                {
                    id: 'linkedin-about',
                    title: 'Matriz del “Acerca de”',
                    fields: makeFields('wb9-linkedin-about', [
                        'Quién soy y desde dónde hablo',
                        'Resultados o trayectoria que me respaldan',
                        'Problema principal que resuelvo',
                        'Cómo pienso / cómo lidero',
                        'Qué organizaciones o audiencias quiero impactar',
                        'Qué visión o legado estoy construyendo'
                    ], 3)
                },
                {
                    id: 'linkedin-plan',
                    title: 'Plan de optimización del perfil',
                    fields: makeFields('wb9-linkedin-plan', [
                        'Sección del perfil que más debo ajustar primero',
                        'Acción prioritaria de esta semana',
                        'Señal de autoridad digital que quiero instalar',
                        'Oportunidad que espero abrir con este perfil'
                    ], 3)
                }
            ]
        },
        {
            id: 'cause',
            label: '6. Causa social estratégica',
            shortLabel: 'Causa',
            purpose:
                'Definir una causa social estratégica que extienda tu marca ejecutiva más allá del logro individual, para conectar tu liderazgo con una contribución visible, coherente y sostenible hacia la sociedad.',
            concepts: [
                'Causa social estratégica',
                'Territorio de contribución',
                'Tesis de impacto',
                'Vehículo de contribución',
                'Coherencia causa-marca'
            ],
            prompts: [
                'No elijas la causa que “suena mejor”; elige la que tenga raíces reales en tu historia y tu liderazgo.',
                'Busca una formulación que puedas volver visible en acciones.'
            ],
            groups: [
                {
                    id: 'cause-inventory',
                    title: 'Inventario de causas con resonancia real',
                    fields: makeFields('wb9-cause-inventory', [
                        'Causa posible 1',
                        'Causa posible 2',
                        'Causa posible 3',
                        'Causa posible 4',
                        'Causa posible 5',
                        'Causa posible 6'
                    ], 2)
                },
                {
                    id: 'cause-legitimacy',
                    title: 'Evaluación de legitimidad',
                    description: 'Resume la lectura estratégica de tus mejores causas.',
                    fields: makeFields('wb9-cause-legitimacy', [
                        'Causa priorizada 1: conexión, coherencia y credibilidad',
                        'Causa priorizada 2: conexión, coherencia y credibilidad',
                        'Causa priorizada 3: conexión, coherencia y credibilidad',
                        'Lectura final de legitimidad'
                    ], 3)
                },
                {
                    id: 'cause-formulation',
                    title: 'Formulación de la causa social estratégica',
                    fields: makeFields('wb9-cause-formulation', [
                        'Mi causa social estratégica',
                        'Tesis de impacto que quiero impulsar',
                        'Vehículo de contribución principal',
                        'Primera acción visible en los próximos 30 días'
                    ], 3)
                },
                {
                    id: 'cause-test',
                    title: 'Test causa-marca',
                    fields: makeFields('wb9-cause-test', [
                        'Cómo esta causa conversa con mi propósito',
                        'Cómo esta causa conversa con mis valores y arquetipo',
                        'Cómo la volveré visible sin caer en oportunismo'
                    ], 3)
                }
            ]
        },
        {
            id: 'content',
            label: '7. Plan de contenido 30-60-90 días',
            shortLabel: '30-60-90',
            purpose:
                'Diseñar un plan de contenido 30-60-90 días que convierta tu marca ejecutiva en presencia visible, consistente y estratégica, para que propósito, posicionamiento, causa social y reputación empiecen a moverse de forma concreta en audiencias relevantes.',
            concepts: [
                'Plan de contenido 30-60-90',
                'Pilares de contenido',
                'Cadencia de marca',
                'Consistencia narrativa',
                'Retorno reputacional'
            ],
            prompts: [
                'Decide primero qué señal quieres instalar y luego diseña la arquitectura del contenido.',
                'La repetición coherente importa más que la exposición vacía.'
            ],
            groups: [
                {
                    id: 'content-signal',
                    title: 'Señal central de contenido',
                    fields: makeFields('wb9-content-signal', [
                        'La percepción que quiero instalar en 90 días',
                        'La idea central que quiero repetir',
                        'El tono que debe sostener esa señal',
                        'Lo que no quiero proyectar',
                        'Cómo esta señal se conecta con mi marca ejecutiva'
                    ], 3)
                },
                {
                    id: 'content-pillars',
                    title: 'Arquitectura de pilares de contenido',
                    fields: makeFields('wb9-content-pillars', [
                        'Pilar de autoridad: qué mostraré y qué percepción reforzará',
                        'Pilar de identidad: qué mostraré y qué percepción reforzará',
                        'Pilar de legado / causa: qué mostraré y qué percepción reforzará'
                    ], 3)
                },
                {
                    id: 'content-calendar',
                    title: 'Plan 30-60-90',
                    fields: makeFields('wb9-content-calendar', [
                        '30 días: activación mínima viable',
                        '60 días: consolidación de señal',
                        '90 días: expansión de posicionamiento'
                    ], 3)
                },
                {
                    id: 'content-pieces',
                    title: 'Piezas prioritarias',
                    fields: makeFields('wb9-content-pieces', [
                        'Pieza o tema 1',
                        'Pieza o tema 2',
                        'Pieza o tema 3',
                        'Pieza o tema 4',
                        'Pieza o tema 5'
                    ], 2)
                },
                {
                    id: 'content-commitment',
                    title: 'Compromiso de visibilidad',
                    fields: makeFields('wb9-content-commitment', [
                        'Cadencia mínima sostenible',
                        'Métrica reputacional que revisaré'
                    ], 3)
                }
            ]
        }
    ]
}

export const WB10_STRUCTURED_CONFIG: StructuredWorkbookConfig = {
    code: 'WB10',
    title: 'Visión estratégica personal',
    pillar: 'Shine Beyond',
    storageKey: 'workbooks-v2-wb10-structured-state',
    downloadFileName: 'wb10-vision-estrategica-personal.html',
    sourceLabel: 'Importado desde 4Shinebuilder / Workbooksfinales / WB10',
    summary:
        'Versión digital estructurada del workbook de visión a 3 años, prioridades maestras, indicadores y plan estratégico personal en una página.',
    objective:
        'Diseñar una visión estratégica personal a 3 años que integre legado, crecimiento, sostenibilidad, impacto y prioridades de vida, para que tu desarrollo deje de depender de urgencias o logros aislados y empiece a operar como un sistema consciente, escalable y trascendente.',
    components: [
        'Desarrollo de otros líderes (mentoring & coaching)',
        'Impacto social y humano',
        'Legado personal y trascendencia',
        'Inteligencia cultural e inclusiva',
        'Liderazgo regenerativo'
    ],
    competencies: [
        'Mentoría y sucesión',
        'Empoderamiento (empowerment)',
        'Desafío para el crecimiento',
        'Ética y responsabilidad social',
        'Liderazgo de servicio (stewardship)',
        'Inclusión y equidad',
        'Institucionalización de cultura',
        'Reconocimiento y humildad',
        'Conexión con el propósito (meaning)',
        'Gestión de la diversidad cognitiva',
        'Conciencia sistémica y comunitaria'
    ],
    rules: [
        'No diseñes solo metas; diseña un sistema de vida y legado.',
        'No confundas crecimiento con acumulación.',
        'Una visión estratégica personal debe seguir existiendo incluso cuando cambie tu cargo.',
        'Si todo depende de ti, todavía no estás escalando.',
        'El verdadero plan se nota en lo que priorizas, sueltas e institucionalizas.'
    ],
    sections: [
        {
            id: 'vision',
            label: '1. Visión a 3 años',
            shortLabel: 'Visión',
            purpose:
                'Construir una visión a 3 años clara, inspiradora y estratégicamente aterrizada, para orientar tus decisiones presentes hacia un futuro con más coherencia, sostenibilidad, impacto y capacidad de trascendencia.',
            concepts: [
                'Visión estratégica personal',
                'Legado consciente',
                'Integración sistémica del crecimiento',
                'Escalamiento personal',
                'Sostenibilidad del crecimiento'
            ],
            prompts: [
                'Describe un futuro que te obligue a rediseñar el presente.',
                'Conecta identidad, impacto, sistema y legado en una sola lógica.'
            ],
            groups: [
                {
                    id: 'vision-photo',
                    title: 'Foto de futuro a 3 años',
                    fields: makeFields('wb10-vision-photo', [
                        'En 3 años, profesionalmente soy / hago esto',
                        'El impacto que produzco se ve así',
                        'Mi forma de vivir y trabajar se ve así',
                        'Lo que ya no depende solo de mí es',
                        'La huella que empieza a ser visible es'
                    ], 4)
                },
                {
                    id: 'vision-system',
                    title: 'Matriz visión-sistema-legado',
                    fields: makeFields('wb10-vision-system', [
                        'Qué quiero construir a 3 años',
                        'Qué sistema debe existir para sostenerlo',
                        'Qué personas / capacidades deben multiplicarlo',
                        'Qué parte de la visión ya apunta a legado',
                        'Qué riesgo la volvería solo éxito temporal'
                    ], 4)
                },
                {
                    id: 'vision-life-map',
                    title: 'Mapa integral de vida a 3 años',
                    fields: makeFields('wb10-vision-life', [
                        'Trabajo / profesional',
                        'Contribución a la sociedad',
                        'Finanzas / éxito financiero',
                        'Salud y bienestar',
                        'Relaciones',
                        'Familia / personal',
                        'Tiempo libre y energía',
                        'Espiritualidad'
                    ], 3)
                },
                {
                    id: 'vision-statement',
                    title: 'Declaración de visión estratégica personal',
                    fields: [
                        {
                            id: 'wb10-vision-statement',
                            label: 'Mi visión estratégica personal a 3 años es',
                            placeholder: 'En 3 años, habré construido...',
                            rows: 5
                        }
                    ]
                }
            ]
        },
        {
            id: 'goals',
            label: '2. Objetivos por área de vida',
            shortLabel: 'Objetivos',
            purpose:
                'Traducir tu visión a 3 años en objetivos concretos por área de vida, para que tu crecimiento no quede concentrado solo en lo profesional, sino que avance como un sistema equilibrado, sostenible y coherente con tu legado.',
            concepts: [
                'Objetivo por área de vida',
                'Área tractora',
                'Área vulnerable',
                'Equilibrio dinámico',
                'Interdependencia de áreas'
            ],
            prompts: [
                'No todas las áreas crecerán igual, pero sí deben mantenerse dentro de un rango sano y consciente.',
                'Busca metas de sostén, expansión y legado.'
            ],
            groups: [
                {
                    id: 'goals-prioritization',
                    title: 'Priorización de áreas de vida',
                    fields: makeFields('wb10-goals-prioritization', [
                        'Trabajo / profesional: importancia, estado actual y urgencia',
                        'Contribución a la sociedad: importancia, estado actual y urgencia',
                        'Finanzas / éxito financiero: importancia, estado actual y urgencia',
                        'Salud y bienestar: importancia, estado actual y urgencia',
                        'Relaciones: importancia, estado actual y urgencia',
                        'Familia / personal: importancia, estado actual y urgencia',
                        'Tiempo libre y energía: importancia, estado actual y urgencia',
                        'Espiritualidad: importancia, estado actual y urgencia'
                    ], 3)
                },
                {
                    id: 'goals-areas',
                    title: 'Objetivo estratégico por área',
                    fields: makeFields('wb10-goals-areas', [
                        'Objetivo para trabajo / profesional',
                        'Objetivo para contribución a la sociedad',
                        'Objetivo para finanzas / éxito financiero',
                        'Objetivo para salud y bienestar',
                        'Objetivo para relaciones',
                        'Objetivo para familia / personal',
                        'Objetivo para tiempo libre y energía',
                        'Objetivo para espiritualidad'
                    ], 3)
                },
                {
                    id: 'goals-system',
                    title: 'Lectura sistémica del crecimiento',
                    fields: makeFields('wb10-goals-system', [
                        'Área tractora que impulsará el resto del sistema',
                        'Área vulnerable que hoy puede limitar el plan',
                        'Mi definición de éxito integral en esta etapa'
                    ], 3)
                }
            ]
        },
        {
            id: 'priorities',
            label: '3. Prioridades estratégicas',
            shortLabel: 'Prioridades',
            purpose:
                'Definir las prioridades estratégicas que harán viable tu visión a 3 años, para concentrar energía, recursos y decisiones en los pocos frentes que realmente mueven tu sistema personal, profesional y de legado.',
            concepts: [
                'Prioridad estratégica',
                'Palanca estratégica',
                'Trade-off estratégico',
                'Despriorización consciente',
                'Ruta crítica personal'
            ],
            prompts: [
                'El foco estratégico implica renunciar a cosas buenas para proteger las decisivas.',
                'Piensa en prioridades tractoras, de sostén, expansión y legado.'
            ],
            groups: [
                {
                    id: 'priorities-fronts',
                    title: 'Inventario de frentes estratégicos',
                    fields: makeFields('wb10-priorities-fronts', [
                        'Frente 1',
                        'Frente 2',
                        'Frente 3',
                        'Frente 4',
                        'Frente 5',
                        'Frente 6',
                        'Frente 7',
                        'Frente 8',
                        'Frente 9',
                        'Frente 10'
                    ], 2)
                },
                {
                    id: 'priorities-top',
                    title: 'Top prioridades maestras',
                    fields: makeFields('wb10-priorities-top', [
                        'Prioridad maestra 1',
                        'Prioridad maestra 2',
                        'Prioridad maestra 3',
                        'Prioridad maestra 4',
                        'Prioridad maestra 5'
                    ], 3)
                },
                {
                    id: 'priorities-tradeoffs',
                    title: 'Trade-offs y despriorizaciones',
                    fields: makeFields('wb10-priorities-tradeoffs', [
                        'Qué debo pausar o soltar para proteger el foco',
                        'Qué actividad compite hoy sin ser estratégica',
                        'Costo de no priorizar correctamente',
                        'Decisión difícil pero necesaria de este trimestre'
                    ], 3)
                },
                {
                    id: 'priorities-sequence',
                    title: 'Secuencia estratégica',
                    fields: makeFields('wb10-priorities-sequence', [
                        'Qué debe ocurrir primero en los próximos 90 días',
                        'Dependencias o condiciones para que avance el plan',
                        'Ruta crítica personal que no puedo ignorar'
                    ], 3)
                }
            ]
        },
        {
            id: 'commitments',
            label: '4. Compromisos de acción inmediata',
            shortLabel: 'Acción',
            purpose:
                'Convertir las prioridades estratégicas en compromisos de acción inmediata, para que la visión personal deje de ser solo una dirección inspiradora y empiece a producir tracción visible, responsables claros y primeras evidencias de cambio.',
            concepts: [
                'Compromiso verificable',
                'Acción palanca',
                'Tracción estratégica',
                'Ventana de ejecución',
                'Hito temprano'
            ],
            prompts: [
                'Elige compromisos que produzcan evidencia visible en 30 días.',
                'Cada compromiso debe tener dueño, fecha, tracción esperada y riesgo si no ocurre.'
            ],
            groups: [
                {
                    id: 'commitments-list',
                    title: 'Compromisos críticos de arranque',
                    fields: makeFields('wb10-commitments-list', [
                        'Compromiso 1',
                        'Compromiso 2',
                        'Compromiso 3',
                        'Compromiso 4',
                        'Compromiso 5',
                        'Compromiso 6',
                        'Compromiso 7'
                    ], 2)
                },
                {
                    id: 'commitments-matrix',
                    title: 'Matriz compromiso-prioridad-tracción',
                    fields: makeFields('wb10-commitments-matrix', [
                        'Compromiso 1: prioridad, tipo, tracción esperada y riesgo',
                        'Compromiso 2: prioridad, tipo, tracción esperada y riesgo',
                        'Compromiso 3: prioridad, tipo, tracción esperada y riesgo',
                        'Compromiso 4: prioridad, tipo, tracción esperada y riesgo',
                        'Compromiso 5: prioridad, tipo, tracción esperada y riesgo'
                    ], 3)
                },
                {
                    id: 'commitments-impeccable',
                    title: 'Diseño de compromisos impecables',
                    fields: makeFields('wb10-commitments-impeccable', [
                        'Quién responde por la ejecución',
                        'Fecha o ventana exacta de cumplimiento',
                        'Qué evidencia mostrará que ya empezó',
                        'Qué apoyo o recurso necesito para hacerlo viable'
                    ], 3)
                },
                {
                    id: 'commitments-730',
                    title: 'Plan 7-15-30',
                    fields: makeFields('wb10-commitments-730', [
                        'Acción crítica de los próximos 7 días',
                        'Acción crítica de los próximos 15 días',
                        'Acción crítica de los próximos 30 días'
                    ], 3)
                }
            ]
        },
        {
            id: 'indicators',
            label: '5. Indicadores de avance',
            shortLabel: 'Indicadores',
            purpose:
                'Definir indicadores de avance que permitan medir si tu visión estratégica personal realmente está tomando forma, para que el workbook no quede en intención inspiradora sino en un sistema con señales de progreso, responsables y capacidad de ajuste.',
            concepts: [
                'Indicador de avance',
                'Línea base',
                'Indicador líder',
                'Indicador resultado',
                'Semáforo de avance'
            ],
            prompts: [
                'Mide sostén, expansión y legado; no solo ejecución.',
                'Cada indicador debe tener evidencia verificable y frecuencia de revisión.'
            ],
            groups: [
                {
                    id: 'indicators-dimensions',
                    title: 'Dimensiones a medir',
                    fields: makeFields('wb10-indicators-dimensions', [
                        'Dimensión 1',
                        'Dimensión 2',
                        'Dimensión 3',
                        'Dimensión 4',
                        'Dimensión 5',
                        'Dimensión 6',
                        'Dimensión 7',
                        'Dimensión 8'
                    ], 2)
                },
                {
                    id: 'indicators-matrix',
                    title: 'Indicadores críticos',
                    fields: makeFields('wb10-indicators-matrix', [
                        'Indicador 1: dimensión, evidencia y frecuencia',
                        'Indicador 2: dimensión, evidencia y frecuencia',
                        'Indicador 3: dimensión, evidencia y frecuencia',
                        'Indicador 4: dimensión, evidencia y frecuencia',
                        'Indicador 5: dimensión, evidencia y frecuencia'
                    ], 3)
                },
                {
                    id: 'indicators-baseline',
                    title: 'Línea base y metas',
                    fields: makeFields('wb10-indicators-baseline', [
                        'Indicador 1: línea base y meta',
                        'Indicador 2: línea base y meta',
                        'Indicador 3: línea base y meta',
                        'Indicador 4: línea base y meta',
                        'Indicador 5: línea base y meta'
                    ], 3)
                },
                {
                    id: 'indicators-cadence',
                    title: 'Cadencia y decisiones',
                    fields: makeFields('wb10-indicators-cadence', [
                        'Frecuencia de revisión del tablero',
                        'Qué se verá en verde',
                        'Qué se verá en amarillo',
                        'Qué decisión correctiva tomaré en rojo'
                    ], 3)
                }
            ]
        },
        {
            id: 'one-page-plan',
            label: '6. Plan estratégico personal en una página',
            shortLabel: 'One Page',
            purpose:
                'Sintetizar tu visión estratégica personal en una sola página ejecutiva, para integrar en un mapa claro tu horizonte, objetivos, prioridades, compromisos, indicadores y lógica de legado, de modo que tu plan pueda ser entendido, seguido y ajustado con facilidad.',
            concepts: [
                'One Strategic Page Plan',
                'Síntesis estratégica',
                'Mapa ejecutivo personal',
                'Ruta crítica del plan',
                'Plan vivo'
            ],
            prompts: [
                'La página única debe responder: hacia dónde voy, qué priorizo, qué acciono, cómo mido y qué legado construyo.',
                'Reduce complejidad sin perder dirección.'
            ],
            groups: [
                {
                    id: 'one-page-blocks',
                    title: 'Bloques imprescindibles',
                    fields: makeFields('wb10-one-page-blocks', [
                        'Visión a 3 años',
                        'Objetivos por área de vida',
                        'Prioridades estratégicas',
                        'Compromisos inmediatos',
                        'Indicadores de avance',
                        'Legado / institucionalización'
                    ], 3)
                },
                {
                    id: 'one-page-synthesis',
                    title: 'Síntesis ejecutiva del plan',
                    fields: makeFields('wb10-one-page-synthesis', [
                        'Visión estratégica en una frase',
                        'Objetivos integradores',
                        'Prioridades maestras',
                        'Compromisos inmediatos',
                        'Indicadores críticos',
                        'Frase de legado'
                    ], 3)
                },
                {
                    id: 'one-page-layout',
                    title: 'Layout estratégico de una página',
                    fields: makeFields('wb10-one-page-layout', [
                        'Bloque 1 — Norte',
                        'Bloque 2 — Áreas clave',
                        'Bloque 3 — Prioridades',
                        'Bloque 4 — Acción',
                        'Bloque 5 — Medición',
                        'Bloque 6 — Revisión'
                    ], 3)
                },
                {
                    id: 'one-page-coherence',
                    title: 'Test de coherencia interna',
                    fields: makeFields('wb10-one-page-coherence', [
                        '¿La visión conversa con los objetivos?',
                        '¿Los objetivos justifican las prioridades?',
                        '¿Las prioridades se traducen en compromisos inmediatos?',
                        '¿Los indicadores miden realmente lo que importa?',
                        '¿Qué ajuste haría para que el plan sea más coherente?'
                    ], 3)
                }
            ]
        }
    ]
}
