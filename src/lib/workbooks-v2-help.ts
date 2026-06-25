// Contenido de ayuda mostrado dentro del runtime del WB.
// Se accede vía el botón "Ayuda" del header. Cada WB puede tener
// guía específica; los demás heredan la guía general V3.

export type WorkbookHelpBlock = {
    title: string
    body: string
    bullets?: string[]
}

export type WorkbookHelpContent = {
    title: string
    intro: string
    blocks: WorkbookHelpBlock[]
}

const GENERAL_BLOCKS: WorkbookHelpBlock[] = [
    {
        title: '1. Escribe libre o graba audio en cada campo',
        body:
            'Cada campo tiene un cuadro de texto y un botón "Grabar audio". Puedes escribir directamente, dictar con tu voz o combinarlas. La transcripción aparece automáticamente.',
        bullets: [
            'Texto: simplemente escribe tu respuesta.',
            'Audio: pulsa el micrófono, habla con calma y detén la grabación; se transcribe sola.',
            'Puedes editar la transcripción si la IA capta algo distinto.'
        ]
    },
    {
        title: '2. Autocompleta tablas y síntesis con IA',
        body:
            'Las tablas marcadas con el botón "Autocompletar con IA" toman lo que ya respondiste para proponer una versión inicial.',
        bullets: [
            'Primero responde libremente las preguntas guía.',
            'Luego pulsa "Autocompletar con IA" en la tabla o síntesis.',
            'Revisa, ajusta y haz tuya cada respuesta — la IA es un punto de partida, no la última palabra.'
        ]
    },
    {
        title: '3. Avanza con calma',
        body:
            'No tienes que terminar el workbook en una sola sesión. Tu progreso queda guardado y puedes regresar las veces que necesites.',
        bullets: [
            'El indicador del header muestra tu % de avance.',
            'Cada sección queda guardada al moverte a la siguiente.',
            'Puedes descargar tu trabajo en PDF cuando quieras.'
        ]
    },
    {
        title: '4. Si te bloqueas',
        body:
            'Es normal. Algunas preguntas requieren reflexión. Habla con tu mentor o advisor sobre las preguntas que te cuesten más — su mirada externa suele desbloquear claridad.',
        bullets: [
            'Marca con bullets las ideas borrador y vuelve a depurarlas después.',
            'Usa el botón "Grabar audio" como si le hablaras a alguien de confianza: a veces ahí surge la respuesta.',
            'Si una pregunta no aplica a tu contexto, déjala vacía y sigue avanzando.'
        ]
    }
]

const GENERAL_HELP: WorkbookHelpContent = {
    title: '¿Cómo diligenciar este workbook?',
    intro:
        'Este workbook está diseñado para reflexionar, no para responder rápido. Avanza con honestidad y tómate el tiempo que necesites en cada sección.',
    blocks: GENERAL_BLOCKS
}

const WB9_HELP: WorkbookHelpContent = {
    title: '¿Cómo diligenciar el WB9 y generar tu brochure?',
    intro:
        'El WB9 tiene una particularidad: además de un workbook reflexivo, su entregable es un brochure ejecutivo PDF (libro de marca) con tu foto y tu paleta de colores. Sigue estos pasos para que tu brochure refleje tu marca personal.',
    blocks: [
        {
            title: '1. Configura tu identidad visual en la Sección 0',
            body:
                'Antes de empezar el contenido reflexivo, ve a la sección "0. Identidad visual del brochure" y configura tu foto y paleta.',
            bullets: [
                'Foto del líder: usa "Subir foto del líder" para cargar una imagen vertical, fondo neutro, encuadre busto (mínimo 800×1000 px). Aparecerá en la portada del brochure.',
                'Paleta de marca: si no editas los cuatro campos de color, el brochure se genera con la identidad 4Shine (azul ejecutivo + dorado).',
                'Para personalizar, usa los selectores de color o escribe los hex. Sugerencia: un primario oscuro, un secundario relacionado, un acento contrastante y un fondo claro.',
                'Edición / año y frase de portada también son editables.'
            ]
        },
        {
            title: '2. Trabaja las 13 secciones reflexivas',
            body:
                'Las secciones 1 a 12 construyen tu Latido de Marca: narrativa, territorio de autoridad, pilares, propósito, audiencia, arquetipo, storytelling, contenido, LinkedIn, capitalización y plan 30-60-90.',
            bullets: [
                'Escribe libremente o graba audio en cada campo.',
                'Las tablas de "Síntesis" se completan con IA usando lo que ya respondiste.',
                'La sección 13 (Cierre) arma tu Latido de Marca completo con IA y es el contenido principal del brochure.'
            ]
        },
        {
            title: '3. Descarga tu brochure ejecutivo',
            body:
                'Cuando tengas suficiente contenido, pulsa "Descargar brochure" en el header. El PDF se genera con tu foto, tu paleta y tu contenido del WB9, listo para compartir.',
            bullets: [
                '13 páginas estilo slide: portada, narrativa, pilares, propósito, audiencia, arquetipo, símbolo, storytelling, pilares de contenido, LinkedIn, plan 30/60/90, síntesis y cierre.',
                'Si no completaste algún campo, ese bloque del brochure muestra "Pendiente" — siempre puedes volver, completar y descargar de nuevo.',
                'Puedes regenerar el brochure tantas veces como quieras a medida que evoluciona tu marca.'
            ]
        },
        {
            title: '4. Iterar y refinar',
            body:
                'Tu Latido de Marca no es estático. Revisa tu brochure cada trimestre y ajústalo cuando cambien tu rol, tus prioridades o tu audiencia.',
            bullets: [
                'Cambia foto o paleta cuando renueves tu identidad visual.',
                'Edita la frase central a medida que tu posicionamiento madura.',
                'Comparte el brochure con sponsors, mentores o headhunters como pieza de marca ejecutiva.'
            ]
        }
    ]
}

const WB10_HELP: WorkbookHelpContent = {
    title: '¿Cómo diligenciar el WB10 — Visión Estratégica Personal?',
    intro:
        'Este es el workbook que cierra el programa. Integra todo lo trabajado en una visión a 3 años, prioridades, PDI y plan 12 meses. Tómate más tiempo aquí que en cualquier otro — el objetivo es decidir quién quieres convertirte.',
    blocks: [
        {
            title: '1. Mira hacia atrás antes de proyectar',
            body:
                'La Sección 1 (Mi transformación como líder) te invita a reconocer el camino recorrido durante el programa. Esa lectura honesta es el punto de partida para diseñar tu siguiente etapa.'
        },
        {
            title: '2. Diseña la visión a 3 años con detalle',
            body:
                'La Sección 2 te pide imaginar el líder que quieres ser en tres años. Hazlo concreto: qué construiste, qué impacto generas, qué ya no depende de ti, qué huella es visible.'
        },
        {
            title: '3. Equilibra todas las áreas de tu vida',
            body:
                'La Sección 3 (Mapa integral) te invita a calificar 9 áreas de 0 a 10 y proyectar acciones a 3 años + 90 días. Si tu visión solo crece profesionalmente y descuida salud, familia o sentido, no es sostenible.'
        },
        {
            title: '4. Priorizar es decidir qué no harás',
            body:
                'Las secciones 4 y 5 te llevan a elegir tres prioridades y a definir qué soltar, sostener, construir, delegar, aprender y proteger. Toda visión implica renuncias.'
        },
        {
            title: '5. PDI + indicadores + plan 12 meses',
            body:
                'Las secciones 6 y 7 traducen la visión en acción: 3–5 áreas de desarrollo (PDI), tres niveles de indicadores (conducta, resultado, sostenibilidad) y un plan trimestral concreto.'
        },
        {
            title: '6. Tu Executive Growth Plan',
            body:
                'La Sección 8 arma tu One-Page Personal Plan con IA usando todo lo anterior. Es el entregable final del programa: tu hoja de ruta de los próximos doce meses.'
        }
    ]
}

const CONTENT_BY_CODE: Record<string, WorkbookHelpContent> = {
    WB9: WB9_HELP,
    WB10: WB10_HELP
}

export function resolveWorkbookHelp(code: string): WorkbookHelpContent {
    return CONTENT_BY_CODE[code.toUpperCase()] ?? GENERAL_HELP
}
