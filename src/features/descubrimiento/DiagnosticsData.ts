export interface Question {
    id: number | string;
    pillar: 'within' | 'out' | 'up' | 'beyond';
    comp: string;
    text: string;
    type: 'likert' | 'sjt';
    scale?: 'freq' | 'agree' | 'prob' | 'imp';
    options?: { id: string; text: string; weight: number }[]; // For SJT
}

export const DB: Question[] = [
    // --- PILLAR 1: WITHIN (1-30) ---
    { id: 1, type: 'likert', pillar: 'within', comp: 'Autoeficacia y seguridad', text: "Cuando enfrento un desafío difícil en el trabajo, confío en mis capacidades para resolverlo sin mostrar arrogancia hacia los demás.", scale: 'freq' },
    { id: 2, type: 'likert', pillar: 'within', comp: 'Autoeficacia y seguridad', text: "Si me comprometo con mi equipo a hacer algo, cumplo esa promesa con acciones coherentes, reforzando la confianza que tienen en mí.", scale: 'freq' },
    { id: 3, type: 'likert', pillar: 'within', comp: 'Gestión de creencias (mindset)', text: "Reflexiono de forma activa sobre mis propias creencias limitantes y trabajo para reemplazarlas por una mentalidad de crecimiento.", scale: 'freq' },
    { id: 4, type: 'likert', pillar: 'within', comp: 'Gestión de creencias (mindset)', text: "Cuando enfrento un contratiempo, en lugar de preguntarme “¿Por qué me pasa esto a mí?”, me pregunto “¿Qué puedo aprender de esta situación?”.", scale: 'freq' },
    { id: 5, type: 'likert', pillar: 'within', comp: 'Responsabilidad radical (accountability)', text: "Ante un problema, evito poner excusas y tomo las decisiones necesarias, reconociendo que tengo el control sobre los resultados de mi equipo.", scale: 'agree' },
    { id: 6, type: 'likert', pillar: 'within', comp: 'Responsabilidad radical (accountability)', text: "Cuando algo sale mal por mi responsabilidad, no culpo a factores externos; asumo mi error y busco de inmediato una solución proactiva.", scale: 'freq' },
    { id: 7, type: 'likert', pillar: 'within', comp: 'Autoconciencia emocional', text: "Soy consciente de mis emociones en tiempo real y reconozco cómo pueden influir en mis reacciones durante situaciones de trabajo.", scale: 'agree' },
    { id: 8, type: 'likert', pillar: 'within', comp: 'Autoconciencia emocional', text: "Tengo identificadas las situaciones que disparan emociones negativas en mí, lo cual me ayuda a prepararme para manejarlas adecuadamente.", scale: 'agree' },
    { id: 9, type: 'likert', pillar: 'within', comp: 'Regulación emocional', text: "Cuando estoy bajo una presión intensa en el trabajo, logro mantener la calma y no reaccionar de forma impulsiva.", scale: 'freq' },
    { id: 10, type: 'likert', pillar: 'within', comp: 'Regulación emocional', text: "Si siento frustración u otra emoción fuerte con el equipo, la expreso de manera controlada y asertiva, sin reprimirla pero sin perder la compostura.", scale: 'freq' },
    { id: 11, type: 'likert', pillar: 'within', comp: 'Regulación emocional', text: "Después de una situación tensa que me altera emocionalmente, soy capaz de recuperarme con rapidez usando técnicas como respiración profunda o una breve pausa.", scale: 'freq' },
    { id: 12, type: 'likert', pillar: 'within', comp: 'Gestión de la energía', text: "Me aseguro de descansar lo suficiente y desconectar del trabajo para mantener mi mente clara, sabiendo que el agotamiento perjudica mi liderazgo.", scale: 'freq' },
    { id: 13, type: 'likert', pillar: 'within', comp: 'Gestión de la energía', text: "Tengo rutinas de bienestar (ejercicio, meditación u otras) integradas en mi semana para recargar energías y rendir mejor como líder.", scale: 'freq' },
    { id: 14, type: 'likert', pillar: 'within', comp: 'Claridad de propósito (Ikigai)', text: "Tengo claramente definido mi “para qué” como líder y sé articular cómo mi trabajo diario contribuye a un propósito más grande.", scale: 'agree' },
    { id: 15, type: 'likert', pillar: 'within', comp: 'Claridad de propósito (Ikigai)', text: "Cuando enfrento una decisión difícil, la tomo considerando si está alineada con mis valores y mi propósito personal como líder.", scale: 'freq' },
    { id: 16, type: 'likert', pillar: 'within', comp: 'Integridad y coherencia', text: "Aunque esté bajo presión para lograr resultados, me niego a violar mis valores o comprometer mi ética para obtener un beneficio a corto plazo.", scale: 'agree' },
    { id: 17, type: 'likert', pillar: 'within', comp: 'Integridad y coherencia', text: "Soy transparente con mi equipo: si cometo un error lo admito abiertamente, y no dudo en decir “no sé” cuando corresponde.", scale: 'freq' },
    { id: 18, type: 'likert', pillar: 'within', comp: 'Autenticidad', text: "En mi rol de líder me presento tal como soy, sin adoptar una “máscara” corporativa, manteniendo mi estilo personal con autenticidad.", scale: 'agree' },
    { id: 19, type: 'likert', pillar: 'within', comp: 'Práctica reflexiva', text: "Suelo dedicar tiempo a reflexionar sobre mis experiencias (por ejemplo, llevando un diario o haciendo retrospecciones) para aprender de ellas.", scale: 'freq' },
    { id: 20, type: 'likert', pillar: 'within', comp: 'Práctica reflexiva', text: "Después de un proyecto o situación importante, analizo con honestidad qué podría haber hecho mejor, en lugar de simplemente seguir adelante sin más.", scale: 'freq' },
    { id: 21, type: 'likert', pillar: 'within', comp: 'Apertura al feedback', text: "Periódicamente le pido a colegas o miembros de mi equipo que me den feedback sincero sobre mi desempeño como líder.", scale: 'freq' },
    { id: 22, type: 'likert', pillar: 'within', comp: 'Apertura al feedback', text: "Cuando alguien de mi equipo me hace una crítica o sugerencia, la recibo sin ponerme a la defensiva, agradeciendo sus comentarios y considerando mejoras.", scale: 'freq' },
    { id: 23, type: 'likert', pillar: 'within', comp: 'Mentalidad de crecimiento', text: "Cuando enfrento un desafío o cometo un error, lo percibo principalmente como una oportunidad de aprendizaje en vez de un fracaso personal.", scale: 'agree' },
    { id: 24, type: 'likert', pillar: 'within', comp: 'Mentalidad de crecimiento', text: "Estoy dispuesto a salir de mi zona de confort en el trabajo para desarrollar habilidades nuevas y seguir aprendiendo.", scale: 'agree' },
    { id: 25, type: 'likert', pillar: 'within', comp: 'Regulación somática y fisiológica', text: "Cuido mi sueño, alimentación y ejercicio para manejar el estrés y asegurar que mi desempeño como líder se mantenga óptimo.", scale: 'freq' },
    { id: 26, type: 'likert', pillar: 'within', comp: 'Regulación somática y fisiológica', text: "Soy consciente de las señales físicas de estrés o cansancio en mí (tensión, fatiga) y tomo medidas oportunas para recuperarme antes de que afecte mi rendimiento.", scale: 'freq' },
    { id: 27, type: 'likert', pillar: 'within', comp: 'Compostura', text: "Ante una crisis o conflicto serio, consigo mantener la serenidad y el profesionalismo, evitando mostrar pánico o enojo desmedido frente al equipo.", scale: 'freq' },
    { id: 28, type: 'likert', pillar: 'within', comp: 'Compostura', text: "Incluso en una discusión acalorada, controlo mi tono de voz y lenguaje corporal para proyectar calma y respeto.", scale: 'freq' },
    { id: 29, type: 'likert', pillar: 'within', comp: 'Re-alineación Cognitiva', text: "Si una situación adversa me abruma, trato de replantearla mentalmente de forma constructiva para poder enfrentarla mejor.", scale: 'freq' },
    { id: 30, type: 'likert', pillar: 'within', comp: 'Re-alineación Cognitiva', text: "Cuando detecto que estoy cayendo en un pensamiento negativo recurrente, deliberadamente lo sustituyo por una perspectiva más positiva y realista.", scale: 'freq' },

    // --- PILLAR 2: SHINE OUT (31-46) ---
    { id: 31, type: 'likert', pillar: 'out', comp: 'Claridad e inspiración', text: "Cuando comunico la visión o los objetivos a mi equipo, lo hago de forma clara y sin ambigüedades, explicando qué espero de ellos y por qué es importante.", scale: 'freq' },
    { id: 32, type: 'likert', pillar: 'out', comp: 'Claridad e inspiración', text: "Al compartir la visión con el equipo, suelo emplear un tono entusiasta y uso historias o metáforas que los inspiren y alineen con un propósito común.", scale: 'freq' },
    { id: 33, type: 'likert', pillar: 'out', comp: 'Escucha Activa y Empática', text: "En reuniones con mi equipo, dejo que cada quien se exprese sin interrumpir y demuestro con mis gestos y preguntas que escucho atentamente.", scale: 'freq' },
    { id: 34, type: 'likert', pillar: 'out', comp: 'Escucha Activa y Empática', text: "Cuando un colaborador expresa una preocupación o punto de vista distinto al mío, reconozco sus sentimientos y le hago saber que entiendo su perspectiva, aunque difiera de la mía.", scale: 'freq' },
    { id: 35, type: 'likert', pillar: 'out', comp: 'Adaptabilidad Comunicativa', text: "Adapto mi forma de comunicarme según la audiencia; por ejemplo, con personas ajenas a lo técnico evito jerga y explico en términos sencillos.", scale: 'freq' },
    { id: 36, type: 'likert', pillar: 'out', comp: 'Adaptabilidad Comunicativa', text: "Mientras hablo con alguien, estoy atento a su lenguaje corporal y expresiones, ajustando mi mensaje sobre la marcha para asegurarme de que me entiendan.", scale: 'freq' },
    { id: 37, type: 'likert', pillar: 'out', comp: 'Construcción de confianza (Trust)', text: "Si prometo algo a mi equipo o a un colega, cumplo con ese compromiso de forma consistente, mostrando que se puede confiar en mí.", scale: 'freq' },
    { id: 38, type: 'likert', pillar: 'out', comp: 'Construcción de confianza (Trust)', text: "Cuando alguien me comparte información confidencial o sensible, la mantengo reservada y trato el asunto con respeto, generando un ambiente de confianza.", scale: 'freq' },
    { id: 39, type: 'likert', pillar: 'out', comp: 'Influencia ética y persuasión', text: "Al intentar convencer a otros, respaldo mis propuestas con datos y hechos concretos en vez de apoyarme en mi autoridad formal.", scale: 'freq' },
    { id: 40, type: 'likert', pillar: 'out', comp: 'Influencia ética y persuasión', text: "Influyo en mi equipo apelando a valores e ideales que todos compartimos, para motivar una colaboración genuina en lugar de imponer por obligación.", scale: 'freq' },
    { id: 41, type: 'likert', pillar: 'out', comp: 'Reconocimiento y feedback', text: "Cuando un miembro del equipo logra algo importante, reconozco su logro de forma específica y en el momento adecuado, en lugar de solo decir cumplidos genéricos.", scale: 'freq' },
    { id: 42, type: 'likert', pillar: 'out', comp: 'Reconocimiento y feedback', text: "Al dar feedback por un error o área de mejora, me enfoco en la conducta específica (no en la persona) y ofrezco sugerencias concretas para mejorar.", scale: 'freq' },
    { id: 43, type: 'likert', pillar: 'out', comp: 'Influencia asíncrona y virtual', text: "Soy capaz de motivar e influir en mi equipo incluso a distancia, aprovechando herramientas digitales (como correos o mensajes claros y videos) cuando no estoy presente físicamente.", scale: 'freq' },
    { id: 44, type: 'likert', pillar: 'out', comp: 'Influencia asíncrona y virtual', text: "En equipos remotos o híbridos, me comunico proactivamente de manera regular para mantener mi presencia y que nadie se sienta desconectado o aislado.", scale: 'freq' },
    { id: 45, type: 'likert', pillar: 'out', comp: 'Ingeniería del lenguaje (promesas y pedidos)', text: "Cuando necesito algo de un colaborador, formulo un pedido claro especificando qué requiero y para cuándo, y me aseguro de obtener su compromiso explícito en lugar de asumirlo.", scale: 'freq' },
    { id: 46, type: 'likert', pillar: 'out', comp: 'Ingeniería del lenguaje (promesas y pedidos)', text: "Cumplo las promesas que hago; si veo que no podré cumplir algún compromiso asumido, lo comunico y renegocio con antelación en lugar de dejarlo incumplido.", scale: 'freq' },

    // --- PILLAR 3: SHINE UP (47-72) ---
    { id: 47, type: 'likert', pillar: 'up', comp: 'Conectividad interna y externa', text: "Promuevo que mi equipo colabore con otras áreas de la organización, conectándolos activamente con colegas de otros departamentos para derribar silos.", scale: 'freq' },
    { id: 48, type: 'likert', pillar: 'up', comp: 'Conectividad interna y externa', text: "Me involucro en eventos de nuestra industria y mantengo relaciones con clientes y proveedores clave para mantenerme al tanto de nuevas tendencias.", scale: 'freq' },
    { id: 49, type: 'likert', pillar: 'up', comp: 'Gestión de relaciones (relationship management)', text: "Cultivo relaciones sólidas con personas clave de la organización (alta gerencia, aliados en otras áreas) para construir alianzas estratégicas mutuamente beneficiosas.", scale: 'freq' },
    { id: 50, type: 'likert', pillar: 'up', comp: 'Gestión de relaciones (relationship management)', text: "Me intereso de forma genuina por las personas de mi equipo (no solo por los resultados), lo que ayuda a crear confianza y lealtad mutua.", scale: 'freq' },
    { id: 51, type: 'likert', pillar: 'up', comp: 'Visibilidad estratégica', text: "Doy visibilidad a los logros de mi equipo en la organización, por ejemplo presentando sus iniciativas en reuniones o reportes ejecutivos.", scale: 'freq' },
    { id: 52, type: 'likert', pillar: 'up', comp: 'Visibilidad estratégica', text: "He desarrollado una reputación clara como líder (por ejemplo, ser referente en cierta área) y trabajo en comunicar esa marca ejecutiva de forma coherente.", scale: 'agree' },
    { id: 53, type: 'likert', pillar: 'up', comp: 'Pensamiento estratégico', text: "Regularmente analizo tendencias de la industria y el entorno para anticipar cambios que podrían afectar nuestra estrategia.", scale: 'freq' },
    { id: 54, type: 'likert', pillar: 'up', comp: 'Pensamiento estratégico', text: "En la toma de decisiones, priorizo teniendo en cuenta el largo plazo: no sacrifico objetivos futuros importantes por resolver solo necesidades inmediatas.", scale: 'freq' },
    { id: 55, type: 'likert', pillar: 'up', comp: 'Visión compartida (visioning)', text: "Trabajo junto con mi equipo para construir una visión de futuro motivadora con la que todos nos sintamos identificados.", scale: 'freq' },
    { id: 56, type: 'likert', pillar: 'up', comp: 'Visión compartida (visioning)', text: "Comunico la visión de nuestra organización de forma regular y la vinculo con las tareas cotidianas del equipo, para que no se pierda de vista en el día a día.", scale: 'freq' },
    { id: 57, type: 'likert', pillar: 'up', comp: 'Alineación de metas (execution)', text: "Tomo la visión estratégica general y la convierto en objetivos concretos y medibles que mi equipo pueda ejecutar.", scale: 'freq' },
    { id: 58, type: 'likert', pillar: 'up', comp: 'Alineación de metas (execution)', text: "Realizo seguimientos frecuentes del progreso hacia nuestras metas y, si detecto desvíos importantes, ajusto los planes o prioridades para realinearnos.", scale: 'freq' },
    { id: 59, type: 'likert', pillar: 'up', comp: 'Decisión bajo incertidumbre', text: "Cuando debo decidir con información incompleta o bajo incertidumbre, soy capaz de hacerlo con criterio y confianza en mi juicio.", scale: 'agree' },
    { id: 60, type: 'likert', pillar: 'up', comp: 'Decisión bajo incertidumbre', text: "No me paralizo por análisis excesivo: si enfrento una decisión arriesgada, evalúo pros y contras y tomo una acción calculada en lugar de no decidir nada.", scale: 'freq' },
    { id: 61, type: 'likert', pillar: 'up', comp: 'Resolución de causa raíz', text: "Cuando surge un problema recurrente, investigo a fondo apoyándome en datos para encontrar la causa raíz, en lugar de conformarme con soluciones superficiales a los síntomas.", scale: 'freq' },
    { id: 62, type: 'likert', pillar: 'up', comp: 'Resolución de causa raíz', text: "Al enfrentar un problema complejo, involucro a las personas pertinentes para analizarlo juntos y obtener diversas perspectivas antes de decidir la solución.", scale: 'freq' },
    { id: 63, type: 'likert', pillar: 'up', comp: 'Agilidad y adaptabilidad', text: "Si las condiciones cambian repentinamente, adapto los planes o estrategias de mi equipo ágilmente, sin aferrarme al plan original por orgullo personal.", scale: 'freq' },
    { id: 64, type: 'likert', pillar: 'up', comp: 'Agilidad y adaptabilidad', text: "Animo a mi equipo a que cambie de rumbo cuando las circunstancias lo requieren, valorando la innovación y la flexibilidad por encima de la rutina establecida.", scale: 'freq' },
    { id: 65, type: 'likert', pillar: 'up', comp: 'Estimulación intelectual (innovación)', text: "Hago preguntas desafiantes a mi equipo que los impulsen a pensar fuera de lo convencional y proponer ideas innovadoras.", scale: 'freq' },
    { id: 66, type: 'likert', pillar: 'up', comp: 'Estimulación intelectual (innovación)', text: "Doy a mi equipo espacio y recursos para experimentar con nuevas ideas, y tolero los errores inteligentes entendiendo que son parte del proceso de innovación.", scale: 'freq' },
    { id: 67, type: 'likert', pillar: 'up', comp: 'Gestión del error constructivo', text: "Cuando ocurre un error o fracaso, lo analizo junto con el equipo para extraer lecciones aprendidas en vez de enfocarme en buscar culpables.", scale: 'freq' },
    { id: 68, type: 'likert', pillar: 'up', comp: 'Gestión del error constructivo', text: "Si alguien de mi equipo comete un error, reacciono con calma y lo tomo como una oportunidad de coaching, ayudándole a corregir sin avergonzarlo públicamente.", scale: 'freq' },
    { id: 69, type: 'likert', pillar: 'up', comp: 'Lectura de poder y patrocinio', text: "Soy consciente de quiénes en la organización tienen la influencia o el poder de apoyar nuestras iniciativas, e intento involucrarlos como patrocinadores de mi equipo.", scale: 'agree' },
    { id: 70, type: 'likert', pillar: 'up', comp: 'Lectura de poder y patrocinio', text: "Navego la política interna de forma ética: construyo redes de apoyo y consenso para las iniciativas de mi equipo, evitando caer en favoritismos o maniobras poco éticas.", scale: 'agree' },
    { id: 71, type: 'likert', pillar: 'up', comp: 'Liderazgo en la industria 5.0', text: "Me mantengo actualizado sobre tendencias emergentes (como IA, automatización o sostenibilidad) que puedan afectar a nuestra industria y al futuro de nuestro negocio.", scale: 'freq' },
    { id: 72, type: 'likert', pillar: 'up', comp: 'Liderazgo en la industria 5.0', text: "Busco adaptar las prácticas de mi equipo integrando nuevas tecnologías o enfoques innovadores que aporten valor a nuestro trabajo.", scale: 'freq' },

    // --- PILLAR 4: SHINE BEYOND (73-96) ---
    { id: 73, type: 'likert', pillar: 'beyond', comp: 'Mentoría y sucesión', text: "Identifico a personas con alto potencial en mi organización y dedico tiempo a orientarlas, preparando así una posible sucesión y continuidad de liderazgo.", scale: 'freq' },
    { id: 74, type: 'likert', pillar: 'beyond', comp: 'Mentoría y sucesión', text: "Comparto abiertamente mis conocimientos y experiencias con líderes emergentes de la organización, actuando como mentor para acelerar su desarrollo.", scale: 'freq' },
    { id: 75, type: 'likert', pillar: 'beyond', comp: 'Empoderamiento (empowerment)', text: "Delego en mi equipo responsabilidades desafiantes y les doy la autonomía para decidir cómo llevarlas a cabo, demostrando la confianza que tengo en ellos.", scale: 'freq' },
    { id: 76, type: 'likert', pillar: 'beyond', comp: 'Empowerment', text: "Aclaro el qué, pero permito al equipo decidir el cómo, evitando el micro-management.", scale: 'freq' },
    { id: 77, type: 'likert', pillar: 'beyond', comp: 'Desafío para el crecimiento', text: "Desafío a mi equipo con objetivos ambiciosos que los hagan crecer, brindándoles apoyo cuando lo necesitan pero sin sobreprotegerlos.", scale: 'freq' },
    { id: 78, type: 'likert', pillar: 'beyond', comp: 'Desafío para el crecimiento', text: "Si a mi equipo le imponen retos desmedidos desde fuera, intervengo para equilibrar la carga de trabajo y asegurar que el crecimiento sea manejable y no abrumador.", scale: 'freq' },
    { id: 79, type: 'likert', pillar: 'beyond', comp: 'Ética y responsabilidad social', text: "Cuando tomo decisiones financieras o estratégicas importantes, incorporo las consideraciones éticas y evalúo el impacto en la comunidad o sociedad.", scale: 'freq' },
    { id: 80, type: 'likert', pillar: 'beyond', comp: 'Ética y responsabilidad social', text: "Promuevo iniciativas dentro de la empresa que generan valor social (como proyectos de sostenibilidad o inclusión) y modelo con mi ejemplo la integridad en su implementación.", scale: 'freq' },
    { id: 81, type: 'likert', pillar: 'beyond', comp: 'Liderazgo de servicio (stewardship)', text: "En mis decisiones priorizo el bienestar de mi equipo y de la organización por encima de cualquier interés personal o reconocimiento individual.", scale: 'agree' },
    { id: 82, type: 'likert', pillar: 'beyond', comp: 'Liderazgo de servicio (stewardship)', text: "Estoy dispuesto a hacer sacrificios personales (como dedicar tiempo extra o ceder protagonismo) si con ello beneficio a mi equipo u organización.", scale: 'agree' },
    { id: 83, type: 'likert', pillar: 'beyond', comp: 'Inclusión y equidad', text: "Me aseguro de crear un ambiente inclusivo en el equipo, donde se valoran perspectivas diversas y nadie se sienta excluido o ignorado.", scale: 'freq' },
    { id: 84, type: 'likert', pillar: 'beyond', comp: 'Inclusión y equidad', text: "Estoy atento a posibles sesgos (conscientes o inconscientes) en decisiones de contratación, asignación de roles o evaluaciones, y actúo para corregirlos y asegurar equidad.", scale: 'freq' },
    { id: 85, type: 'likert', pillar: 'beyond', comp: 'Institucionalización de cultura', text: "Promuevo activamente los valores y comportamientos deseados de nuestra cultura organizacional y trato de ser un ejemplo viviente de esos valores día a día.", scale: 'freq' },
    { id: 86, type: 'likert', pillar: 'beyond', comp: 'Institucionalización de cultura', text: "He implementado en mi equipo ciertas prácticas recurrentes (como reconocimientos mensuales o reuniones de aprendizaje) que refuerzan la cultura organizacional deseada.", scale: 'freq' },
    { id: 87, type: 'likert', pillar: 'beyond', comp: 'Reconocimiento y humildad', text: "Cuando mi equipo logra un éxito importante, dejo que sean ellos quienes brillen y reciban el reconocimiento; si en cambio afrontamos un fracaso, doy la cara y asumo yo la responsabilidad ante la organización.", scale: 'freq' },
    { id: 88, type: 'likert', pillar: 'beyond', comp: 'Reconocimiento y humildad', text: "No tengo reparo en admitir cuando no tengo todas las respuestas; busco consejo o ayuda de otros sin que mi ego se interponga, demostrando humildad intelectual.", scale: 'freq' },
    { id: 89, type: 'likert', pillar: 'beyond', comp: 'Conexión con el propósito (meaning)', text: "Ayudo a cada miembro de mi equipo a ver cómo su trabajo conecta con un propósito mayor, de modo que encuentren un sentido personal en lo que hacen.", scale: 'freq' },
    { id: 90, type: 'likert', pillar: 'beyond', comp: 'Conexión con el propósito (meaning)', text: "Suelo compartir con el equipo historias o ejemplos que muestran el impacto positivo que nuestro trabajo tiene en otras personas, para reforzar el sentido de propósito.", scale: 'freq' },
    { id: 91, type: 'likert', pillar: 'beyond', comp: 'Gestión de la diversidad cognitiva', text: "Reconozco que en mi equipo hay diferentes formas de pensar (unos más analíticos, otros más creativos, etc.) y asigno las tareas aprovechando esas fortalezas diversas.", scale: 'freq' },
    { id: 92, type: 'likert', pillar: 'beyond', comp: 'Gestión de la diversidad cognitiva', text: "Fomento debates saludables en el equipo donde las opiniones divergentes sean bienvenidas, evitando caer en una mentalidad de grupo donde todos piensan igual.", scale: 'freq' },
    { id: 93, type: 'likert', pillar: 'beyond', comp: 'Conciencia sistémica y comunitaria', text: "Al tomar decisiones en mi área, considero cómo podrían afectar al conjunto de la organización o incluso a la comunidad, y ajusto mis acciones pensando en ese impacto más amplio.", scale: 'freq' },
    { id: 94, type: 'likert', pillar: 'beyond', comp: 'Conciencia sistémica y comunitaria', text: "Como líder, participo o impulso iniciativas de responsabilidad social (como voluntariados o proyectos comunitarios) para contribuir más allá de los resultados de negocio.", scale: 'freq' },
    { id: 95, type: 'likert', pillar: 'beyond', comp: 'Legado personal y trascendencia', text: "Pienso a menudo en cómo quiero ser recordado como líder, y trato de orientar mis acciones día a día para dejar una huella positiva en mi equipo y organización.", scale: 'agree' },
    { id: 96, type: 'likert', pillar: 'beyond', comp: 'Legado personal y trascendencia', text: "Dedico parte de mi tiempo a actividades que trascienden mi rol inmediato (como mentorías o docencia), contribuyendo al crecimiento de personas fuera de mi equipo directo.", scale: 'freq' },

    // --- PILLAR 1: WITHIN TRIANGULATION (97-116) ---
    {
        id: 97, type: 'sjt', pillar: 'within', comp: 'Autoeficacia y seguridad',
        text: "Situación: Te asignan liderar una presentación ante dirección sobre un tema que dominas “a medias”. Quedan 48 horas. ¿Qué haces primero?",
        options: [
            { id: 'A', text: "Delegar la tarea en un colega experto para asegurar la calidad del resultado final.", weight: 1 },
            { id: 'B', text: "Posponer el compromiso argumentando falta de tiempo para una preparación de excelencia.", weight: 0 },
            { id: 'C', text: "Estructurar los puntos clave y solicitar apoyo técnico para los vacíos de información.", weight: 3 },
            { id: 'D', text: "Estudiar el tema de manera aislada para evitar mostrar vulnerabilidad ante los demás.", weight: 2 }
        ]
    },
    { id: 98, type: 'likert', pillar: 'within', comp: 'Autoeficacia y seguridad', text: "Cuando me asignan un reto nuevo que aún no domino totalmente, confío en que puedo aprender lo necesario y pido apoyo específico sin sentir que eso disminuye mi liderazgo.", scale: 'freq' },
    {
        id: 99, type: 'sjt', pillar: 'within', comp: 'Mentalidad de crecimiento',
        text: "Situación: Un proyecto bajo su liderazgo fracasa y el equipo está desmotivado. ¿Qué hace primero en la reunión siguiente?",
        options: [
            { id: 'A', text: "Buscar responsables directos de la ejecución para evitar que el error se repita pronto.", weight: 0 },
            { id: 'B', text: "Analizar las causas raíz con el equipo para extraer lecciones y ajustar la estrategia.", weight: 3 },
            { id: 'C', text: "Restar importancia a lo ocurrido y orientar al equipo de inmediato al siguiente reto.", weight: 1 },
            { id: 'D', text: "Posponer la revisión del proyecto hasta que el clima emocional sea menos tenso y difícil.", weight: 0 }
        ]
    },
    { id: 100, type: 'likert', pillar: 'within', comp: 'Mentalidad de crecimiento', text: "Cuando algo sale mal, mi enfoque principal es identificar aprendizajes y ajustar el proceso, más que buscar culpables o explicaciones definitivas.", scale: 'freq' },
    {
        id: 101, type: 'sjt', pillar: 'within', comp: 'Responsabilidad radical (accountability)',
        text: "Situación: Un entregable importante se atrasó y un stakeholder reclama. Parte del atraso fue por su decisión de cambiar prioridades a última hora. ¿Qué hace primero?",
        options: [
            { id: 'A', text: "Señalar la falta de agilidad del equipo ante el cambio de prioridades solicitado antes.", weight: 0 },
            { id: 'B', text: "Reconocer el impacto del cambio solicitado y presentar un nuevo plan de entrega sólido.", weight: 3 },
            { id: 'C', text: "Explicar que las necesidades del negocio justifican plenamente el retraso del cierre.", weight: 1 },
            { id: 'D', text: "Evitar el contacto directo hasta tener el producto terminado y listo para su revisión.", weight: 0 }
        ]
    },
    { id: 102, type: 'likert', pillar: 'within', comp: 'Responsabilidad radical (accountability)', text: "Cuando un compromiso no se cumple bajo mi liderazgo, asumo públicamente mi parte del resultado y defino acciones concretas para corregirlo.", scale: 'freq' },
    {
        id: 103, type: 'sjt', pillar: 'within', comp: 'Autoconciencia emocional',
        text: "Situación: En una reunión, una persona cuestiona tu decisión con un tono que percibes como desafiante. Notas irritación creciente. ¿Qué es lo más efectivo hacer primero?",
        options: [
            { id: 'A', text: "Confrontar la actitud desafiante de inmediato para dejar clara tu posición de mando.", weight: 0 },
            { id: 'B', text: "Hacer una pausa breve para valorar tu reacción y pedir una aclaración objetiva al otro.", weight: 3 },
            { id: 'C', text: "Continuar con la exposición ignorando la tensión para no perder el control del tiempo.", weight: 1 },
            { id: 'D', text: "Suspender el encuentro argumentando que las condiciones actuales no son productivas.", weight: 0 }
        ]
    },
    { id: 104, type: 'likert', pillar: 'within', comp: 'Autoconciencia emocional', text: "En medio de una interacción tensa, suelo poder identificar con precisión lo que estoy sintiendo (p. ej., frustración, miedo, vergüenza) y cómo eso podría sesgar mi respuesta.", scale: 'freq' },
    {
        id: 105, type: 'sjt', pillar: 'within', comp: 'Compostura',
        text: "Situación: Una discusión se torna acalorada; dos personas elevan la voz. ¿Qué haces primero como líder?",
        options: [
            { id: 'A', text: "Intervenir a favor de la postura que consideras más alineada con tu visión personal.", weight: 0 },
            { id: 'B', text: "Detener la interacción y establecer acuerdos de respeto para retomar la conversación.", weight: 3 },
            { id: 'C', text: "Retirarte momentáneamente para permitir que las partes resuelvan el conflicto solas.", weight: 1 },
            { id: 'D', text: "Seguir con el orden del día permitiendo que los involucrados gestionen su desacuerdo.", weight: 0 }
        ]
    },
    { id: 106, type: 'likert', pillar: 'within', comp: 'Compostura', text: "En discusiones tensas, cuido mi tono de voz y lenguaje corporal para mantener un clima de respeto, incluso si no estoy de acuerdo.", scale: 'freq' },
    {
        id: 107, type: 'sjt', pillar: 'within', comp: 'Gestión de la energía',
        text: "Situación: Llevas semanas con alta carga. Estás cansado y notas irritabilidad. Surge una urgencia “para ayer” que no es crítica. ¿Qué haces primero?",
        options: [
            { id: 'A', text: "Asumir la nueva responsabilidad de inmediato para demostrar compromiso total al líder.", weight: 1 },
            { id: 'B', text: "Expresar tu malestar de forma abierta para que la organización note tu nivel de fatiga.", weight: 0 },
            { id: 'C', text: "Validar la urgencia real y proponer una alternativa de entrega o delegación efectiva.", weight: 3 },
            { id: 'D', text: "Continuar trabajando sin pausas hasta que todas las pendientes queden solucionadas.", weight: 0 }
        ]
    },
    { id: 108, type: 'likert', pillar: 'within', comp: 'Gestión de la energía', text: "Programo intencionalmente hábitos de recuperación (descanso, movimiento, pausas, desconexión) para sostener mi rendimiento como líder.", scale: 'freq' },
    {
        id: 109, type: 'sjt', pillar: 'within', comp: 'Claridad de propósito (Ikigai)',
        text: "Situación: Te ofrecen liderar una iniciativa de alto impacto y visibilidad, pero implica prácticas que chocan con valores que tú declaras (p. ej., transparencia con clientes). ¿Qué haces primero?",
        options: [
            { id: 'A', text: "Priorizar el éxito de la iniciativa para asegurar tu crecimiento dentro del equipo líder.", weight: 1 },
            { id: 'B', text: "Expresar tus dudas éticas y buscar un ajuste que alinee el proyecto con tus valores.", weight: 3 },
            { id: 'C', text: "Declinar la oportunidad sin dar explicaciones para no comprometer tu imagen personal.", weight: 0 },
            { id: 'D', text: "Participar pero evitar involucrarte en las dinámicas que consideras poco transparentes.", weight: 0 }
        ]
    },
    { id: 110, type: 'likert', pillar: 'within', comp: 'Claridad de propósito (Ikigai)', text: "Tener claro mi “para qué” me ayuda a priorizar y decir no a actividades que no aportan a ese propósito, incluso si son urgentes o populares.", scale: 'freq' },
    {
        id: 111, type: 'sjt', pillar: 'within', comp: 'Integridad y coherencia',
        text: "Situación: Te piden “ajustar” un informe para que se vea mejor antes de una reunión, aunque eso implique omitir datos relevantes. ¿Qué haces primero?",
        options: [
            { id: 'A', text: "Acceder a la edición del documento para evitar un conflicto innecesario con tu superior.", weight: 0 },
            { id: 'B', text: "Presentar la realidad de forma constructiva, explicando el valor de la transparencia.", weight: 3 },
            { id: 'C', text: "Negarte a realizar el cambio de forma rotunda para marcar un límite ético personal claro.", weight: 0 },
            { id: 'D', text: "Realizar el ajuste solicitado y preparar una justificación técnica por si hay preguntas.", weight: 1 }
        ]
    },
    { id: 112, type: 'likert', pillar: 'within', comp: 'Integridad y coherencia', text: "Aun cuando exista presión por resultados, prefiero asumir el costo de una decisión difícil antes que comprometer mis valores o la transparencia.", scale: 'freq' },
    {
        id: 113, type: 'sjt', pillar: 'within', comp: 'Autenticidad',
        text: "Situación: En tu organización se valora un estilo muy “duro” y tú sueles liderar desde la calma y el diálogo. Un colega te dice: “Así no te van a respetar”. ¿Qué haces primero?",
        options: [
            { id: 'A', text: "Intentar proyectar una imagen más severa para ganar el respeto de quienes te critican.", weight: 1 },
            { id: 'B', text: "Mantener tu estilo, explicando cómo tu enfoque basado en el diálogo genera resultados.", weight: 3 },
            { id: 'C', text: "No dar importancia al comentario y seguir trabajando bajo tus propios criterios de éxito.", weight: 1 },
            { id: 'D', text: "Adoptar las sugerencias del colega para adaptarte mejor a la cultura dominante actual.", weight: 0 }
        ]
    },
    { id: 114, type: 'likert', pillar: 'within', comp: 'Autenticidad', text: "En situaciones de presión social o política, puedo ser firme y claro sin dejar de actuar desde mi estilo personal y valores.", scale: 'freq' },
    {
        id: 115, type: 'sjt', pillar: 'within', comp: 'Práctica reflexiva',
        text: "Situación: Un colaborador te dice: “Siento que no escuchas en reuniones y cierras rápido”. Te incomoda el comentario. ¿Qué haces primero?",
        options: [
            { id: 'A', text: "Explicar que la velocidad del negocio exige cierres rápidos y poca apertura al debate.", weight: 1 },
            { id: 'B', text: "Valorar el comentario sinceramente y organizar una instancia para mejorar la escucha.", weight: 3 },
            { id: 'C', text: "Marcar distancia con esa persona para evitar sesgos emocionales en futuras reuniones.", weight: 0 },
            { id: 'D', text: "Indicar que su percepción es subjetiva y que el equipo debe enfocarse en los objetivos.", weight: 0 }
        ]
    },
    { id: 116, type: 'likert', pillar: 'within', comp: 'Práctica reflexiva', text: "Después de un proyecto o situación importante, realizo una reflexión deliberada (solo o con el equipo) para extraer aprendizajes y ajustar mi forma de liderar.", scale: 'freq' },

    // --- PILLAR 2: SHINE OUT SJT (117-119) ---
    {
        id: 117, type: 'sjt', pillar: 'out', comp: 'Escucha Activa y Empática',
        text: "Situación: Durante una reunión, una persona del equipo se mantiene callada y con gestos de desacuerdo. ¿Qué haces?",
        options: [
            { id: 'A', text: "Mantener el enfoque en los puntos de la agenda para no dilatar el cierre de la sesión.", weight: 0 },
            { id: 'B', text: "Crear un espacio seguro para que la persona comparta su visión y se sienta escuchada.", weight: 3 },
            { id: 'C', text: "Llamar la atención sobre su falta de participación para fomentar el aporte de ideas.", weight: 0 },
            { id: 'D', text: "Girar la conversación hacia otros temas menos polémicos para reducir el nivel de tensión.", weight: 1 }
        ]
    },
    {
        id: 118, type: 'sjt', pillar: 'out', comp: 'Claridad e inspiración',
        text: "Situación: Debes comunicar un cambio de estrategia que sabes será impopular. ¿Cómo lo abordas?",
        options: [
            { id: 'A', text: "Presentar la directriz de forma firme y directa para evitar cuestionamientos técnicos.", weight: 0 },
            { id: 'B', text: "Comunicar el propósito del cambio y abrir un diálogo para gestionar el impacto grupal.", weight: 3 },
            { id: 'C', text: "Esperar a que la necesidad del cambio sea evidente para comunicarlo de forma oficial.", weight: 0 },
            { id: 'D', text: "Pedir a un tercero que realice el anuncio para mantener tu neutralidad ante el equipo.", weight: 0 }
        ]
    },
    {
        id: 119, type: 'sjt', pillar: 'out', comp: 'Apertura al feedback',
        text: "Situación: Recibes un feedback negativo de un compañero sobre tu forma de delegar. ¿Qué haces?",
        options: [
            { id: 'A', text: "Rebatir los puntos de la crítica con ejemplos donde la delegación fue exitosa antes.", weight: 1 },
            { id: 'B', text: "Recibir la información con apertura y definir un plan de acción para delegar mejor.", weight: 3 },
            { id: 'C', text: "Pasar por alto la observación al considerar que no refleja tu proceso real de gestión.", weight: 0 },
            { id: 'D', text: "Aumentar el nivel de control sobre el compañero para evitar que su opinión te afecte.", weight: 0 }
        ]
    },

    // --- PILLAR 3: SHINE UP SJT (120-122) ---
    {
        id: 120, type: 'sjt', pillar: 'up', comp: 'Pensamiento estratégico',
        text: "Situación: La dirección exige recortes presupuestarios significativos. Debes decidir qué proyectos priorizar. ¿Qué haces?",
        options: [
            { id: 'A', text: "Intentar sostener todas las iniciativas cargando al equipo para evitar bajas de moral.", weight: 1 },
            { id: 'B', text: "Analizar el impacto a largo plazo de cada proyecto y priorizar según la visión global.", weight: 3 },
            { id: 'C', text: "Pedir a los líderes de proyecto que decidan entre ellos qué iniciativas deben pausarse.", weight: 0 },
            { id: 'D', text: "Aplicar un recorte porcentual igualitario a todas las áreas para parecer lo más justo.", weight: 0 }
        ]
    },
    {
        id: 121, type: 'sjt', pillar: 'up', comp: 'Gestión de relaciones (relationship management)',
        text: "Situación: Estás formando alianzas con otros departamentos que compiten por recursos. ¿Cómo aseguras una colaboración efectiva?",
        options: [
            { id: 'A', text: "Establecer acuerdos de beneficio mutuo que alineen los intereses de todas las partes.", weight: 3 },
            { id: 'B', text: "Ceder ante las presiones externas con tal de asegurar la paz y la fluidez del proyecto.", weight: 1 },
            { id: 'C', text: "Asegurar tus propios recursos primero mediante un uso firme de tu posición y poder.", weight: 0 },
            { id: 'D', text: "Mantener una comunicación mínima con otras áreas para evitar conflictos por recursos.", weight: 0 }
        ]
    },
    {
        id: 122, type: 'sjt', pillar: 'up', comp: 'Decisión bajo incertidumbre',
        text: "Situación: Debes tomar una decisión bajo alta incertidumbre y presión de tiempo. ¿Cuál es tu enfoque?",
        options: [
            { id: 'A', text: "Suspender la decisión hasta contar con datos precisos que minimicen cualquier riesgo.", weight: 0 },
            { id: 'B', text: "Valorar la información disponible, consultar expertos y actuar con determinación clara.", weight: 3 },
            { id: 'C', text: "Tomar una dirección basada en tu experiencia previa sin consultar otras perspectivas.", weight: 1 },
            { id: 'D', text: "Transferir la responsabilidad de la elección a un comité para diluir el riesgo personal.", weight: 0 }
        ]
    },

    // --- PILLAR 4: SHINE BEYOND SJT (123-125) ---
    {
        id: 123, type: 'sjt', pillar: 'beyond', comp: 'Inclusión y equidad',
        text: "Situación: Observas que un colega no está siendo incluido en decisiones importantes debido a su origen o estilo de trabajo. ¿Qué haces?",
        options: [
            { id: 'A', text: "Evitar la intervención directa para no generar fricciones con la cultura de la empresa.", weight: 0 },
            { id: 'B', text: "Promover la integración del colega y proponer cambios en los criterios de participación.", weight: 3 },
            { id: 'C', text: "Sugerir al colaborador que intente mimetizarse más con el estilo de trabajo del resto.", weight: 1 },
            { id: 'D', text: "Hablar sobre la situación en privado con otros colegas sin proponer acciones de cambio.", weight: 0 }
        ]
    },
    {
        id: 124, type: 'sjt', pillar: 'beyond', comp: 'Ética y responsabilidad social',
        text: "Situación: Te piden acelerar un proyecto sacrificando estándares éticos o de seguridad. ¿Qué haces?",
        options: [
            { id: 'A', text: "Cumplir con los plazos solicitados asumiendo que la dirección conoce bien los riesgos.", weight: 0 },
            { id: 'B', text: "Exponer los riesgos de seguridad y ética, ofreciendo una ruta que respete los mínimos.", weight: 3 },
            { id: 'C', text: "Omitir los protocolos de seguridad actuales para garantizar la competitividad externa.", weight: 0 },
            { id: 'D', text: "Dilatar la entrega del proyecto de forma pasiva sin explicar los motivos reales detrás.", weight: 1 }
        ]
    },
    {
        id: 125, type: 'sjt', pillar: 'beyond', comp: 'Mentoría y sucesión',
        text: "Situación: Estás acompañando a un nuevo líder. ¿Cómo fomentas que desarrolle su propio legado?",
        options: [
            { id: 'A', text: "Exigir que el aprendiz replique tus métodos para asegurar la continuidad de tu éxito.", weight: 0 },
            { id: 'B', text: "Ayudarle a encontrar su propio estilo de liderazgo alentando su visión y creatividad.", weight: 3 },
            { id: 'C', text: "Supervisar cada una de sus decisiones para evitar que se desvíe de los estándares hoy.", weight: 0 },
            { id: 'D', text: "Permitir que descubra su camino por cuenta propia sin ofrecerle guía o acompañamiento.", weight: 1 }
        ]
    }
];

export const SCALES = {
    freq: ["Nunca", "Rara vez", "A veces", "A menudo", "Siempre"],
    agree: ["Totalmente en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Totalmente de acuerdo"],
    prob: ["Muy improbable", "Improbable", "Posible", "Probable", "Muy probable"],
    imp: ["Nada importante", "Poco importante", "Importante", "Muy importante", "Crítico"]
};

export const PILLAR_INFO = {
    within: { title: "Shine Within", sub: "Esencia y Autoliderazgo" },
    out: { title: "Shine Out", sub: "Presencia e Influencia" },
    up: { title: "Shine Up", sub: "Ecosistema y Estrategia" },
    beyond: { title: "Shine Beyond", sub: "Legado y Trascendencia" }
};

export const COMP_DEFINITIONS: Record<string, string> = {
    'Autoeficacia y seguridad': 'Confianza en la propia capacidad para lograr metas y manejar desafíos.',
    'Gestión de creencias (mindset)': 'Capacidad para identificar y transformar pensamientos limitantes.',
    'Responsabilidad radical (accountability)': 'Asumir plena responsabilidad por los resultados, sin excusas.',
    'Autoconciencia emocional': 'Reconocimiento en tiempo real de las propias emociones y su impacto.',
    'Regulación emocional': 'Habilidad para gestionar respuestas emocionales bajo presión.',
    'Gestión de la energía': 'Administración estratégica de los recursos físicos y mentales.',
    'Claridad de propósito (Ikigai)': 'Conexión profunda con el "para qué" personal y profesional.',
    'Integridad y coherencia': 'Coherencia inquebrantable entre valores, palabras y acciones.',
    'Autenticidad': 'Liderar desde la propia esencia, sin máscaras.',
    'Práctica reflexiva': 'Hábito de analizar experiencias para extraer aprendizaje continuo.',
    'Apertura al feedback': 'Búsqueda y aceptación proactiva de retroalimentación.',
    'Mentalidad de crecimiento': 'Ver los retos como oportunidades de desarrollo.',
    'Regulación somática y fisiológica': 'Conexión cuerpo-mente para el manejo del estrés.',
    'Compostura': 'Mantener la serenidad y claridad en momentos críticos.',
    'Re-alineación Cognitiva': 'Capacidad de reinterpretar situaciones adversas de forma constructiva.',
    'Claridad e inspiración': 'Comunicar la visión de forma que movilice a otros.',
    'Escucha Activa y Empática': 'Escuchar para comprender, no solo para responder.',
    'Adaptabilidad Comunicativa': 'Ajustar el estilo de comunicación a la audiencia.',
    'Construcción de confianza (Trust)': 'Crear vínculos basados en la fiabilidad y cercanía.',
    'Influencia ética y persuasión': 'Persuadir basándose en valores y beneficios mutuos.',
    'Reconocimiento y feedback': 'Valorar visiblemente el aporte de los demás.',
    'Influencia asíncrona y virtual': 'Liderar efectivamente a través de canales digitales.',
    'Ingeniería del lenguaje (promesas y pedidos)': 'Uso preciso del lenguaje para coordinar acciones.',
    'Conectividad interna y externa': 'Crear puentes entre personas y áreas diversas.',
    'Gestión de relaciones (relationship management)': 'Cultivar redes de contacto estratégicas y genuinas.',
    'Visibilidad estratégica': 'Posicionar al equipo y sus logros en la organización.',
    'Pensamiento estratégico': 'Anticipar tendencias y planificar a largo plazo.',
    'Visión compartida (visioning)': 'Co-crear un futuro deseable con el equipo.',
    'Alineación de metas (execution)': 'Conectar objetivos individuales con la estrategia macro.',
    'Decisión bajo incertidumbre': 'Actuar con determinación aun sin tener toda la información.',
    'Resolución de causa raíz': 'Ir al fondo de los problemas en lugar de tratar síntomas.',
    'Agilidad y adaptabilidad': 'Adaptarse rápidamente a cambios del entorno.',
    'Estimulación intelectual (innovación)': 'Desafiar al equipo a pensar de formas nuevas.',
    'Gestión del error constructivo': 'Tratar el error como fuente de aprendizaje, no de castigo.',
    'Lectura de poder y patrocinio': 'Entender las dinámicas políticas de la organización.',
    'Liderazgo en la industria 5.0': 'Integrar tecnología y humanidad en la gestión.',
    'Mentoría y sucesión': 'Preparar a la próxima generación de líderes.',
    'Empoderamiento (empowerment)': 'Otorga poder y autonomía real al equipo.',
    'Desafío para el crecimiento': 'Impulsar al equipo a superar sus propios límites.',
    'Ética y responsabilidad social': 'Considerar el impacto social en las decisiones de negocio.',
    'Liderazgo de servicio (stewardship)': 'Priorizar las necesidades del equipo sobre las propias.',
    'Inclusión y equidad': 'Crear entornos donde todos se sientan valorados.',
    'Institucionalización de cultura': 'Ser guardián y modelo de los valores culturales.',
    'Reconocimiento y humildad': 'Reconocer limitaciones y valorar el aporte de otros.',
    'Conexión con el propósito (meaning)': 'Ayudar a otros a encontrar sentido en su trabajo.',
    'Gestión de la diversidad cognitiva': 'Valorar y aprovechar diferentes formas de pensar.',
    'Conciencia sistémica y comunitaria': 'Entender la organización como un todo interconectado.',
    'Legado personal y trascendencia': 'Construir algo que perdure más allá de la propia gestión.'
};
