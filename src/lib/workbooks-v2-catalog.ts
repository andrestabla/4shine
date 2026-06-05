export type WorkbookV2CatalogItem = {
    id: string;
    slug: string;
    code: string;
    title: string;
    pillar: string;
    statusLabel: string;
    progress: number;
    summary: string;
    isImplemented: boolean;
}

export const WORKBOOKS_V2_CATALOG: WorkbookV2CatalogItem[] = [
    {
        id: 'wb1',
        slug: 'wb1',
        code: 'WB1',
        title: 'Creencias, identidad y pilares personales',
        pillar: 'Shine Within',
        statusLabel: 'V3 — escritura, voz e IA',
        progress: 100,
        summary: 'Workbook V3 con escritura y grabación por voz en cada campo, transcripción automática y análisis IA de la sesión de trabajo (admin/gestor/adviser).',
        isImplemented: true,
    },
    {
        id: 'wb2',
        slug: 'wb2',
        code: 'WB2',
        title: 'Serenidad estratégica · Gestión emocional',
        pillar: 'Shine Within',
        statusLabel: 'V3 — escritura, voz e IA',
        progress: 100,
        summary: 'Workbook V3 con escritura y grabación por voz en cada campo, transcripción automática y análisis IA de la sesión de trabajo (admin/gestor/adviser).',
        isImplemented: true,
    },
    {
        id: 'wb3',
        slug: 'wb3',
        code: 'WB3',
        title: 'Propósito y valores no negociables',
        pillar: 'Shine Within',
        statusLabel: 'V3 — escritura, voz e IA',
        progress: 100,
        summary: 'Workbook V3 con escritura y grabación por voz en cada campo, transcripción automática y análisis IA de la sesión de trabajo (admin/gestor/adviser).',
        isImplemented: true,
    },
    {
        id: 'wb4',
        slug: 'wb4',
        code: 'WB4',
        title: 'Narrativa profesional y Elevator Pitch',
        pillar: 'Shine Out',
        statusLabel: 'V3 — escritura, voz e IA',
        progress: 100,
        summary: 'Workbook V3 con escritura y grabación por voz en cada campo, transcripción automática y análisis IA de la sesión de trabajo (admin/gestor/adviser).',
        isImplemented: true,
    },
    {
        id: 'wb5',
        slug: 'wb5',
        code: 'WB5',
        title: 'Comunicación ejecutiva y estratégica',
        pillar: 'Shine Out',
        statusLabel: 'Construcción activa',
        progress: 40,
        summary: 'Estructura digital en desarrollo con portada, presentación y bloques operativos iniciales para comunicación, influencia y conversaciones estratégicas.',
        isImplemented: true,
    },
    {
        id: 'wb6',
        slug: 'wb6',
        code: 'WB6',
        title: 'Lenguaje verbal y no verbal de impacto',
        pillar: 'Shine Out',
        statusLabel: 'Construcción activa',
        progress: 78,
        summary: 'Edición premium con bloques avanzados de lenguaje corporal, voz, presión, objeciones, coherencia y evaluación.',
        isImplemented: true,
    },
    {
        id: 'wb7',
        slug: 'wb7',
        code: 'WB7',
        title: 'Mapeo del ecosistema estratégico',
        pillar: 'Shine Up',
        statusLabel: 'Portada y presentación activas',
        progress: 15,
        summary: 'Nueva versión digital con portada e identificación, presentación informativa completa y continuidad automática por sesión.',
        isImplemented: true,
    },
    {
        id: 'wb8',
        slug: 'wb8',
        code: 'WB8',
        title: 'Pensamiento estratégico y toma de decisiones',
        pillar: 'Shine Up',
        statusLabel: 'Construcción activa',
        progress: 35,
        summary: 'Portada, presentación y sección Escalera de valor con pasos, ejemplos, validaciones suaves y esquema visual interactivo.',
        isImplemented: true,
    },
    {
        id: 'wb9',
        slug: 'wb9',
        code: 'WB9',
        title: 'Latido de marca',
        pillar: 'Shine Beyond',
        statusLabel: 'Versión estructurada activa',
        progress: 100,
        summary: 'Versión digital estructurada importada desde el source de 4Shinebuilder para trabajar propósito, posicionamiento, reputación y legado.',
        isImplemented: true,
    },
    {
        id: 'wb10',
        slug: 'wb10',
        code: 'WB10',
        title: 'Visión estratégica personal',
        pillar: 'Shine Beyond',
        statusLabel: 'Versión estructurada activa',
        progress: 100,
        summary: 'Versión digital estructurada importada desde el source de 4Shinebuilder para diseñar visión a 3 años, prioridades e indicadores.',
        isImplemented: true,
    },
];
