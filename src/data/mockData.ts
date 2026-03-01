export type Role = 'lider' | 'mentor' | 'admin' | 'gestor';

export interface UserStats {
    progress?: number;
    tests?: number;
    connections?: number;
    students?: number;
    hours?: number;
    rating?: number;
    totalUsers?: number;
    activeCohorts?: number;
    uptime?: string;
    // Gestor specific
    managedContent?: number;
    pendingReviews?: number;
    programSatisfaction?: string;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    role: string;
    image?: string;
}

export interface User {
    name: string;
    role: string;
    avatar: string; // Inicial
    color: string;
    company: string;
    location: string;
    stats: UserStats;
    // New Profile Fields (HU 2.1, 2.2, 2.3)
    profession?: string;
    industry?: string;
    planType?: 'VIP' | 'Premium' | 'Empresa Élite';
    bio?: string;
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
    interests?: string[];
    projects?: Project[];
    testResults?: {
        shineWithin: number;
        shineOut: number;
        shineUp: number;
        shineBeyond: number;
    };
    nextChallenges?: Challenge[];
}

export interface Mentee {
    id: number;
    name: string;
    company: string;
    progress: number;
    status: 'good' | 'warning' | 'danger';
    nextSession: string;
    // New fields for HU 4.1
    planType: 'VIP' | 'Premium' | 'Empresa Élite' | 'Standard';
    seniority: 'Senior' | 'C-Level' | 'Director' | 'Manager' | 'VP';
    email: string;
    location: string;
    industry: string;
}

export interface FeedItem {
    type: 'content' | 'social' | 'system' | 'job';
    title: string;
    desc: string;
    time: string;
    icon: unknown; // Lucide icon component type
    colorClass: string;
}

export interface NetworkingContact {
    id: number;
    name: string;
    role: string;
    company: string;
    location: string;
    sector: string;
    tags: string[];
    avatar: string;
    bio: string;
    experience: number; // years
    status: 'connected' | 'pending' | 'none';
}

export interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    postedDate: string;
    applicants: number;
    tags: string[];
}

export const USERS: Record<Role, User> = {
    lider: {
        name: "Sofía Martínez",
        role: "Líder",
        avatar: "S",
        color: "bg-amber-500",
        company: "FinTech Latam",
        location: "Bogotá",
        stats: { progress: 35, tests: 1, connections: 12 },
        profession: "Gerente de Innovación",
        industry: "Tecnología Financiera",
        planType: "VIP",
        bio: "Apasionada por la transformación digital y el liderazgo inclusivo. Con más de 10 años de experiencia liderando equipos de alto rendimiento en el sector fintech.",
        socialLinks: {
            linkedin: "linkedin.com/in/sofia-martinez",
            twitter: "@sofia_tech"
        },
        interests: ["Transformación Digital", "Liderazgo Femenino", "Blockchain", "Sostenibilidad"],
        projects: [
            { id: 1, title: "Lanzamiento Billetera Digital", description: "Lideré el equipo cross-funcional para el lanzamiento de la nueva wallet, alcanzando 1M de usuarios en 6 meses.", role: "Product Owner" },
            { id: 2, title: "Programa Mentoring Interno", description: "Diseñé e implementé el programa de mentoría para jóvenes talentos en FinTech Latam.", role: "Co-Lead" }
        ],
        testResults: {
            shineWithin: 85,
            shineOut: 65,
            shineUp: 72,
            shineBeyond: 40
        },
        nextChallenges: [
            { id: 1, title: "Visualizar el Futuro", description: "Define tu visión a 5 años usando la metodología Shine.", type: "strategic" },
            { id: 2, title: "Feedback 360", description: "Solicita feedback a 3 pares usando la herramienta de la plataforma.", type: "social" }
        ]
    },
    mentor: {
        name: "Dr. Carlos Ruiz",
        role: "Mentor",
        avatar: "C",
        color: "bg-blue-600",
        company: "Consultor Independiente",
        location: "Ciudad de México",
        stats: { students: 15, hours: 120, rating: 4.9 },
        planType: 'Premium',
        profession: "Estratega de Liderazgo",
        industry: "Consultoría & RRHH",
        bio: "Doctor en Psicología Organizacional con más de 15 años de experiencia ayudando a directivos a potenciar su impacto y bienestar. Especialista en liderazgo transformacional y gestión del cambio.",
        socialLinks: {
            linkedin: "linkedin.com/in/carlosruiz-mentor",
            website: "www.carlosruiz.com"
        },
        projects: [
            { id: 101, title: "Transformación Cultural Banco Global", description: "Lideré el programa de cambio cultural para 500 ejecutivos en LATAM, incrementando el engagement en un 40%.", role: "Lead Consultant" },
            { id: 102, title: "Programa Executive Women", description: "Co-creador del programa de aceleración para mujeres en alta dirección.", role: "Mentor Principal" }
        ]
    },
    gestor: {
        name: "Laura Gestión",
        role: "Gestor del Programa",
        avatar: "L",
        color: "bg-teal-600",
        company: "4Shine Ops",
        location: "Bogotá",
        stats: { managedContent: 45, pendingReviews: 8, programSatisfaction: "4.8/5" }
    },
    admin: {
        name: "Admin Sistema",
        role: "Administrador",
        avatar: "A",
        color: "bg-slate-700",
        company: "4Shine HQ",
        location: "Cloud",
        stats: { totalUsers: 342, activeCohorts: 3, uptime: "99.9%" }
    }
};

export interface Mentor {
    id: string;
    name: string;
    specialty: string; // 'Shine Within', 'Shine Out', etc.
    rating: number;
    avatar: string;
    sector: string;
    availability: string[]; // ISO strings of available slots
}

export const AVAILABLE_MENTORS: Mentor[] = [
    {
        id: "mentor_1",
        name: "Dr. Carlos Ruiz",
        specialty: "Shine Within",
        rating: 4.9,
        avatar: "C",
        sector: "Liderazgo",
        availability: [
            "2026-04-10T09:00:00",
            "2026-04-10T11:00:00",
            "2026-04-12T14:00:00"
        ]
    },
    {
        id: "mentor_2",
        name: "Ana Maria Tech",
        specialty: "Shine Out",
        rating: 4.8,
        avatar: "A",
        sector: "Tecnología",
        availability: [
            "2026-04-11T10:00:00",
            "2026-04-11T15:00:00"
        ]
    },
    {
        id: "mentor_3",
        name: "Sofia Marketing",
        specialty: "Shine Up",
        rating: 4.7,
        avatar: "S",
        sector: "Marketing",
        availability: [
            "2026-04-13T09:30:00",
            "2026-04-13T16:00:00"
        ]
    }
];

export const MENTEES: Mentee[] = [
    { id: 1, name: "Sofía Martínez", company: "FinTech Latam", progress: 35, status: "warning", nextSession: "Mañana 10:00 AM", planType: "VIP", seniority: "Director", email: "sofia.m@fintech.com", location: "Bogotá", industry: "Fintech" },
    { id: 2, name: "Jorge Ramírez", company: "Retail Global", progress: 62, status: "good", nextSession: "Viernes 2:00 PM", planType: "Premium", seniority: "Manager", email: "jorge.r@retail.com", location: "Ciudad de México", industry: "Retail" },
    { id: 3, name: "Ana Torres", company: "BankCorp", progress: 15, status: "danger", nextSession: "Pendiente", planType: "Empresa Élite", seniority: "VP", email: "ana.torres@bankcorp.com", location: "Santiago", industry: "Banca" },
    { id: 4, name: "Luis Vega", company: "TechSolutions", progress: 88, status: "good", nextSession: "Lunes 9:00 AM", planType: "VIP", seniority: "C-Level", email: "luis.vega@tech.com", location: "Miami", industry: "Tecnología" },
    { id: 5, name: "María Lopez", company: "Logística SA", progress: 45, status: "warning", nextSession: "Jueves 4:00 PM", planType: "Standard", seniority: "Manager", email: "maria.lopez@logistica.com", location: "Lima", industry: "Logística" },
    { id: 6, name: "Carlos D.", company: "AgroTech", progress: 78, status: "good", nextSession: "Martes 11:00 AM", planType: "Premium", seniority: "Director", email: "carlos.d@agrotech.com", location: "Buenos Aires", industry: "Agricultura" },
    { id: 7, name: "Elena F.", company: "HealthCare Inc", progress: 22, status: "danger", nextSession: "Pendiente", planType: "VIP", seniority: "VP", email: "elena.f@healthcare.com", location: "Madrid", industry: "Salud" },
    { id: 8, name: "Pedro H.", company: "Constructora X", progress: 55, status: "warning", nextSession: "Miércoles 3:00 PM", planType: "Empresa Élite", seniority: "Manager", email: "pedro.h@constructora.com", location: "São Paulo", industry: "Construcción" }
];

export interface LearningItem {
    id: number;
    title: string;
    type: 'video' | 'pdf' | 'scorm' | 'article' | 'podcast' | 'html' | 'ppt';
    duration: string;
    category: string;
    isRecommended: boolean;
    thumbnail?: string;
    likes: number;
    liked: boolean;
    commentsArray: Comment[];
    date: string;
    url?: string;
    seen?: boolean;
    progress?: number;
    tags?: string[];
    author?: string; // Adding author for consistency
}

export interface Comment {
    id: number;
    author: string;
    avatar?: string;
    text: string;
    date: string;
    role?: string;
}

export interface MethodologyResource {
    id: number;
    title: string;
    type: 'pdf' | 'video' | 'podcast' | 'ppt' | 'html' | 'scorm';
    category: 'Fundamentos' | 'Herramientas' | 'Evaluación' | 'Programas' | 'Reportes' | 'Implementación' | 'Casos';
    description: string;
    url: string;
    date: string;
    author: string;
    likes: number;
    liked: boolean;
    tags: string[];
    comments: Comment[];
    embedCode?: string;
}

export const METHODOLOGY_CONTENT: MethodologyResource[] = [
    {
        id: 1,
        title: "Dossier Maestro 4Shine (Whitepaper)",
        type: "pdf",
        category: "Fundamentos",
        description: "El marco conceptual definitivo. Incluye pilares, definiciones clave, supuestos, alcance y diferenciadores de la Metodología 4Shine.",
        url: "#",
        date: "2024-01-10",
        author: "Carmenza Alarcón",
        likes: 120,
        liked: true,
        tags: ["Fundamentos", "Teoría", "Visión"],
        comments: [
            { id: 1, author: "Ana Mentor", text: "Fundamental para entender la base del programa.", date: "2024-02-10", role: "Mentor", avatar: "A" }
        ]
    },
    {
        id: 2,
        title: "Manual Metodológico",
        type: "pdf",
        category: "Fundamentos",
        description: "Guía paso a paso de aplicación: estructura de sesiones, tiempos, materiales necesarios y ejercicios prácticos.",
        url: "#",
        date: "2024-01-15",
        author: "Equipo Académico",
        likes: 85,
        liked: false,
        tags: ["Guía", "Procesos", "Sesiones"],
        comments: []
    },
    {
        id: 3,
        title: "Guía de Facilitación",
        type: "pdf",
        category: "Herramientas",
        description: "Scripts sugeridos, preguntas poderosas, dinámicas de rompehielos, manejo de grupos difíciles y errores comunes.",
        url: "#",
        date: "2024-01-20",
        author: "Carmenza Alarcón",
        likes: 95,
        liked: true,
        tags: ["Facilitación", "Soft Skills", "Mentoring"],
        comments: []
    },
    {
        id: 4,
        title: "Paquete de Herramientas (Toolkits)",
        type: "ppt",
        category: "Herramientas",
        description: "Set completo de plantillas editables, checklists, rúbricas de evaluación, guías de conversación y matrices de decisión.",
        url: "#",
        date: "2024-02-01",
        author: "Equipo Académico",
        likes: 150,
        liked: true,
        tags: ["Plantillas", "Editables", "Recursos"],
        comments: []
    },
    {
        id: 5,
        title: "Repositorio de Casos",
        type: "html",
        category: "Casos",
        description: "Colección de casos de éxito y estudio anónimos (antes/después), lecciones aprendidas y patrones comunes en líderes.",
        url: "#",
        date: "2024-02-10",
        author: "Comunidad 4Shine",
        likes: 60,
        liked: false,
        tags: ["Casos", "Ejemplos", "Real World"],
        comments: []
    },
    {
        id: 6,
        title: "Assessment 'Baseline' 4Shine",
        type: "scorm",
        category: "Evaluación",
        description: "Herramienta interactiva para la medición inicial por pilar (Within/Out/Up/Beyond) con generación de reporte ejecutivo.",
        url: "#",
        date: "2024-01-05",
        author: "Tech Team",
        likes: 200,
        liked: false,
        tags: ["Diagnóstico", "Interactivo", "Métricas"],
        comments: []
    },
    {
        id: 7,
        title: "Tests 2–5 de Evolución",
        type: "html",
        category: "Evaluación",
        description: "Instrumentación para medir hitos clave: progreso, consolidación, impacto y legado a lo largo del programa.",
        url: "#",
        date: "2024-03-01",
        author: "Equipo Académico",
        likes: 45,
        liked: false,
        tags: ["Seguimiento", "Hitos", "KPIs"],
        comments: []
    },
    {
        id: 8,
        title: "Reportes por Perfil",
        type: "pdf",
        category: "Reportes",
        description: "Modelos de reporte individual para el líder, reporte de avance para el mentor y reporte ejecutivo agregado para HR.",
        url: "#",
        date: "2024-02-15",
        author: "Equipo Académico",
        likes: 70,
        liked: false,
        tags: ["Reporting", "Entregables", "HR"],
        comments: []
    },
    {
        id: 9,
        title: "Índices y Métricas Propietarias",
        type: "pdf",
        category: "Reportes",
        description: "Explicación detallada del '4Shine Score', 'Presencia Estratégica Index' e 'Influence Index'. Cálculo e interpretación.",
        url: "#",
        date: "2024-01-25",
        author: "Data Science Team",
        likes: 110,
        liked: true,
        tags: ["Data", "Analytics", "Scores"],
        comments: []
    },
    {
        id: 10,
        title: "Benchmarking Global",
        type: "pdf",
        category: "Reportes",
        description: "Comparativos agregados por industria, cohorte y país. Solo datos estadísticos para contexto.",
        url: "#",
        date: "2024-03-10",
        author: "Intelligence Unit",
        likes: 88,
        liked: false,
        tags: ["Mercado", "Comparativo", "Trends"],
        comments: []
    },
    {
        id: 11,
        title: "Ruta Autodirigida (e-learning)",
        type: "scorm",
        category: "Programas",
        description: "Módulos de microaprendizaje asignables para cerrar brechas específicas detectadas en el assessment.",
        url: "#",
        date: "2024-02-20",
        author: "L&D 4Shine",
        likes: 130,
        liked: true,
        tags: ["Self-paced", "Microlearning", "Remedial"],
        comments: []
    },
    {
        id: 12,
        title: "Bootcamp 4Shine",
        type: "html",
        category: "Programas",
        description: "Estructura del programa intensivo de 4-8 semanas: sesiones semanales, retos diarios y esquema de seguimiento.",
        url: "#",
        date: "2024-01-15",
        author: "Program Manager",
        likes: 140,
        liked: true,
        tags: ["Intensivo", "Retos", "Estructura"],
        comments: []
    },
    {
        id: 13,
        title: "Programa Corporativo",
        type: "html",
        category: "Programas",
        description: "Guía del programa de 12-16 semanas para cohortes empresariales: evaluaciones, mentorías y métricas de impacto.",
        url: "#",
        date: "2024-01-12",
        author: "B2B Unit",
        likes: 115,
        liked: false,
        tags: ["B2B", "Largo Plazo", "Empresas"],
        comments: []
    },
    {
        id: 14,
        title: "Masterclass por Pilar",
        type: "video",
        category: "Programas",
        description: "Serie de videos cortos profundizando en Within, Out, Up y Beyond. Incluye lista de entregables asociados.",
        url: "#",
        date: "2024-02-05",
        author: "Carmenza Alarcón",
        likes: 210,
        liked: true,
        tags: ["Video", "Pilares", "Deep Dive"],
        comments: []
    },
    {
        id: 15,
        title: "Kit de Implementación para HR",
        type: "podcast",
        category: "Implementación",
        description: "Audio-guía y recursos sobre cómo desplegar 4Shine: gobernanza, medición de ROI y plan de comunicación interna.",
        url: "#",
        date: "2024-03-05",
        author: "Customer Success",
        likes: 92,
        liked: false,
        tags: ["HR", "Rollout", "Estrategia"],
        comments: []
    }
];

export const LEARNING_CONTENT: LearningItem[] = [
    {
        id: 1,
        title: "Liderazgo de Alto Impacto",
        type: "video",
        duration: "10 min",
        category: "Módulo 1",
        isRecommended: true,
        likes: 24,
        liked: true,
        commentsArray: [
            { id: 1, author: "Maria L.", text: "Excelente introducción.", date: "2024-02-05", role: "Mentor", avatar: "M" }
        ],
        date: "2023-11-10",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Modulo+1-+Introduccion/1.+Lider+de+alto+impacto.mp4",
        seen: true,
        progress: 100,
        tags: ["Liderazgo", "Fundamentos"],
        author: "Carmenza Alarcón"
    },
    {
        id: 2,
        title: "Presencia Ejecutiva",
        type: "video",
        duration: "12 min",
        category: "Módulo 1",
        isRecommended: true,
        likes: 12,
        liked: false,
        commentsArray: [],
        date: "2023-11-12",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Modulo+1-+Introduccion/2-+Presencia-ejecutiva.mp4",
        seen: false,
        progress: 0,
        tags: ["Presencia", "Marca Personal"],
        author: "Carmenza Alarcón"
    },
    {
        id: 3,
        title: "Workbook: Autoconfianza",
        type: "pdf",
        duration: "15 pgs",
        category: "Módulo 2",
        isRecommended: false,
        likes: 45,
        liked: false,
        commentsArray: [],
        date: "2023-10-25",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Archivos+para+cada+mo%CC%81dulo+/Workbook+Modulo+2+-+Autoconfianza.pdf",
        seen: false,
        progress: 0,
        tags: ["Autoconfianza", "Workbook"],
        author: "Carmenza Alarcón"
    },
    {
        id: 4,
        title: "Workbook: Comunicación",
        type: "pdf",
        duration: "20 pgs",
        category: "Módulo 3",
        isRecommended: false,
        likes: 8,
        liked: false,
        commentsArray: [],
        date: "2023-11-05",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Archivos+para+cada+mo%CC%81dulo+/workbook+Modulo+3+-+Comunicacio%CC%81n.pdf",
        seen: false,
        progress: 0,
        tags: ["Comunicación", "Ejercicios"],
        author: "Carmenza Alarcón"
    },
    {
        id: 5,
        title: "Networking: Estrategias Conectadas (Parte 1)",
        type: "video",
        duration: "15 min",
        category: "Módulo 4",
        isRecommended: true,
        likes: 156,
        liked: true,
        commentsArray: [
            { id: 3, author: "Sofia M.", text: "Cambió mi forma de ver el networking.", date: "2024-01-15", role: "Mentor", avatar: "S" }
        ],
        date: "2023-11-14",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Mo%CC%81dulo+4+-+Networking/1.-Networking.mp4",
        seen: true,
        progress: 45,
        tags: ["Networking", "Conexiones"],
        author: "Carmenza Alarcón"
    },
    {
        id: 6,
        title: "Networking: Construyendo Redes (Parte 2)",
        type: "video",
        duration: "15 min",
        category: "Módulo 4",
        isRecommended: false,
        likes: 32,
        liked: false,
        commentsArray: [],
        date: "2023-09-15",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Mo%CC%81dulo+4+-+Networking/2-Networking.mp4",
        seen: false,
        progress: 0,
        tags: ["Networking", "Práctica"],
        author: "Carmenza Alarcón"
    },
    {
        id: 7,
        title: "Serenidad: Fundamentos",
        type: "video",
        duration: "20 min",
        category: "Módulo 5",
        isRecommended: true,
        likes: 98,
        liked: true,
        commentsArray: [],
        date: "2023-11-01",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Mo%CC%81dulo+5+-+Serenidad/1-+Serenidad.mp4",
        seen: false,
        progress: 0,
        tags: ["Bienestar", "Mindset"],
        author: "Carmenza Alarcón"
    },
    {
        id: 8,
        title: "Workbook: Serenidad en la Práctica",
        type: "pdf",
        duration: "10 pgs",
        category: "Módulo 5",
        isRecommended: false,
        likes: 21,
        liked: false,
        commentsArray: [],
        date: "2023-08-20",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Archivos+para+cada+mo%CC%81dulo+/Workbook+5+-Serenidad.pdf",
        seen: false,
        progress: 0,
        tags: ["Serenidad", "Workbook"],
        author: "Carmenza Alarcón"
    },
    {
        id: 9,
        title: "Autenticidad II: Profundización",
        type: "pdf",
        duration: "25 pgs",
        category: "Módulo 6",
        isRecommended: true,
        likes: 56,
        liked: true,
        commentsArray: [],
        date: "2023-11-20",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Archivos+para+cada+mo%CC%81dulo+/Modulo6+-+Autenticidad+II.pdf",
        seen: false,
        progress: 0,
        tags: ["Autenticidad", "Liderazgo"],
        author: "Carmenza Alarcón"
    },
    {
        id: 10,
        title: "Workbook: Autenticidad I",
        type: "pdf",
        duration: "12 pgs",
        category: "Módulo 6",
        isRecommended: false,
        likes: 18,
        liked: false,
        commentsArray: [],
        date: "2023-11-22",
        url: "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/Liderazgo+de+Alto+Impacto/Archivos+para+cada+mo%CC%81dulo+/Workbook+6-+Autenticidad+1.pdf",
        seen: false,
        progress: 0,
        tags: ["Autenticidad", "Ejercicios"],
        author: "Carmenza Alarcón"
    }
];

export interface MentorshipSession {
    id: number;
    title: string;
    mentor: string; // Name of mentor OR mentee depending on view context? Let's assume this is the OTHER party.
    mentee?: string; // Explicitly add mentee name for Mentor view
    menteeId?: number;
    date: string;
    time: string;
    type: 'individual' | 'grupal';
    status: 'scheduled' | 'completed' | 'cancelled' | 'pending_rating' | 'pending_approval'; // Added pending_approval
    link?: string;
    rating?: number;
    feedback?: string;
    joinUrl?: string;
    participants?: { name: string; avatar: string }[]; // For group sessions
    privateNotes?: string; // Bitácora
}

export const MENTORSHIPS: MentorshipSession[] = [
    {
        id: 1,
        title: "Sesión de Estrategia Personal",
        mentor: "Dr. Carlos Ruiz",
        mentee: "Sofía Martínez", // Líder - Gerente de Innovación
        menteeId: 1,
        date: "2026-04-15",
        time: "09:00 AM",
        type: 'individual',
        status: 'scheduled',
        link: "https://zoom.us/j/123456789",
        joinUrl: "https://zoom.us/j/123456789"
    },
    {
        id: 2,
        title: "Revisión de Objetivos Q1",
        mentor: "Dr. Carlos Ruiz",
        mentee: "Jorge Ramírez", // Líder - Director Comercial
        menteeId: 2,
        date: "2026-03-10",
        time: "02:00 PM",
        type: 'individual',
        status: 'completed',
        rating: 5,
        feedback: "Excelente sesión, muy clara. Jorge está listo para su siguiente desafío.",
        privateNotes: "Jorge ha mejorado mucho su comunicación estratégica. Pendiente revisar OKRs del Q2. Sugerí trabajar en delegación efectiva."
    },
    {
        id: 3,
        title: "Mastermind: Liderazgo Ágil",
        mentor: "Dr. Carlos Ruiz",
        mentee: "Grupo A - Líderes Senior",
        date: "2026-04-20",
        time: "04:00 PM",
        type: 'grupal',
        status: 'scheduled',
        link: "https://zoom.us/j/987654321",
        joinUrl: "https://zoom.us/j/987654321",
        participants: [
            { name: "Sofía Martínez", avatar: "S" },
            { name: "Jorge Ramírez", avatar: "J" },
            { name: "Ana Torres", avatar: "A" },
            { name: "Luis Vega", avatar: "L" }
        ]
    },
    {
        id: 4,
        title: "Solicitud: Coaching Ejecutivo",
        mentor: "Dr. Carlos Ruiz",
        mentee: "Luis Vega", // Líder - CEO
        menteeId: 4,
        date: "2026-04-22",
        time: "11:00 AM",
        type: 'individual',
        status: 'pending_approval'
    },
    {
        id: 5,
        title: "Sesión de Shine Within",
        mentor: "Dr. Carlos Ruiz",
        mentee: "Ana Torres", // Líder - Directora de RRHH
        menteeId: 3,
        date: "2026-02-28",
        time: "10:00 AM",
        type: 'individual',
        status: 'completed',
        rating: 5,
        feedback: "Muy útil para mi autoconocimiento.",
        privateNotes: "Ana mostró gran apertura en la sesión. Trabajamos en su autenticidad y presencia ejecutiva. Próximo paso: Shine Out."
    }
];

export interface TimelineEvent {
    id: number;
    title: string;
    date: string;
    status: 'completed' | 'current' | 'locked';
    type: 'test' | 'mentoria' | 'milestone';
}

export interface Challenge {
    id: number;
    title: string;
    description: string;
    type: 'strategic' | 'social' | 'personal';
}

export const TIMELINE: TimelineEvent[] = [
    { id: 1, title: "Diagnóstico Inicial (Shine Test)", date: "15 Ene 2026", status: "completed", type: "test" },
    { id: 2, title: "Test: Shine Within (Autoliderazgo)", date: "15 Feb 2026", status: "completed", type: "test" },
    { id: 3, title: "Test: Shine Out (Comunicación)", date: "Presente", status: "current", type: "test" },
    { id: 4, title: "Test: Shine Up (Estrategia)", date: "Abr 2026", status: "locked", type: "test" },
    { id: 5, title: "Test: Shine Beyond (Legado)", date: "May 2026", status: "locked", type: "test" },
];

export const NETWORKING: NetworkingContact[] = [
    { id: 1, name: "Patricia Gómez", role: "HR Manager", company: "Grupo Aval", location: "Bogotá", sector: "Finanzas", tags: ["Talento", "Cultura"], avatar: "P", bio: "Experta en gestión del talento humano y cultura organizacional.", experience: 12, status: 'connected' },
    { id: 2, name: "Roberto Diaz", role: "CTO", company: "StartUp X", location: "Medellín", sector: "Tecnología", tags: ["Tech", "Agile"], avatar: "R", bio: "Apasionado por la tecnología y las metodologías ágiles de desarrollo.", experience: 8, status: 'none' },
    { id: 3, name: "Elena White", role: "VP Ventas", company: "Pharma Inc", location: "Ciudad de México", sector: "Salud", tags: ["Ventas", "Negociación"], avatar: "E", bio: "Líder comercial con historial probado en la industria farmacéutica.", experience: 15, status: 'pending' },
    { id: 4, name: "Fernando Sol", role: "CEO", company: "Solar Energy", location: "Santiago", sector: "Energía", tags: ["Sostenibilidad", "Estrategia"], avatar: "F", bio: "Emprendedor enfocado en energías renovables y desarrollo sostenible.", experience: 20, status: 'none' },
    { id: 5, name: "Mónica P.", role: "Consultora", company: "Freelance", location: "Remoto", sector: "Consultoría", tags: ["Marketing", "Branding"], avatar: "M", bio: "Ayudo a marcas a encontrar su voz y conectar con su audiencia.", experience: 5, status: 'none' },
    { id: 6, name: "David K.", role: "Head of Product", company: "Rappi", location: "Bogotá", sector: "Tecnología", tags: ["Producto", "UX"], avatar: "D", bio: "Product Manager obsesionado con la experiencia de usuario.", experience: 7, status: 'connected' }
];

export interface InterestGroup {
    id: number;
    name: string;
    description: string;
    members: number;
    category: string;
    image: string;
}

export const INTEREST_GROUPS: InterestGroup[] = [
    { id: 1, name: "Liderazgo Femenino", description: "Espacio para compartir experiencias y empoderar a mujeres líderes.", members: 120, category: "Social", image: "bg-purple-100 text-purple-600" },
    { id: 2, name: "Innovación & Tech", description: "Debates sobre las últimas tendencias tecnológicas y su impacto.", members: 85, category: "Tecnología", image: "bg-blue-100 text-blue-600" },
    { id: 3, name: "Sostenibilidad Corp", description: "Estrategias para implementar prácticas sostenibles en empresas.", members: 64, category: "Negocios", image: "bg-green-100 text-green-600" },
];

export const JOBS: Job[] = [
    { id: 1, title: "Gerente Regional", company: "Alimentos del Valle", location: "Cali, CO", type: "Presencial", description: "Buscamos un líder estratégico para dirigir nuestras operaciones en el suroccidente.", postedDate: "Hace 2 días", applicants: 12, tags: ["Ventas", "Operaciones"] },
    { id: 2, title: "Líder de Transformación Digital", company: "Seguros Bolívar", location: "Bogotá, CO", type: "Híbrido", description: "Lidera la evolución digital de una de las aseguradoras más grandes del país.", postedDate: "Hace 5 días", applicants: 45, tags: ["Transformación", "Agile"] },
    { id: 3, title: "Board Member (Externo)", company: "Fundación Crecer", location: "Remoto", type: "Voluntariado", description: "Únete a nuestra junta directiva para aportar tu visión estratégica.", postedDate: "Hace 1 semana", applicants: 8, tags: ["Estrategia", "ONG"] },
    { id: 4, title: "Director Financiero", company: "Tech Unicorn", location: "Medellín, CO", type: "Presencial", description: "Startup en hipercrecimiento busca CFO para preparar ronda Serie B.", postedDate: "Hace 3 días", applicants: 24, tags: ["Finanzas", "Startup"] },
];

export interface Message {
    id: number;
    senderId: number | 'me';
    content: string;
    timestamp: string;
}

export interface Chat {
    id: number;
    participantId: number;
    lastMessage: string;
    lastMessageTime: string;
    unread: number;
    messages: Message[];
}

export const CHATS: Chat[] = [
    {
        id: 1,
        participantId: 1, // Patricia Gómez
        lastMessage: "¡Claro! Me encantaría compartir mi experiencia sobre cultura organizacional.",
        lastMessageTime: "10:30 AM",
        unread: 2,
        messages: [
            { id: 1, senderId: 'me', content: "Hola Patricia, vi tu perfil y me interesa mucho tu trabajo en Grupo Aval.", timestamp: "Yesterday" },
            { id: 2, senderId: 1, content: "Hola! Muchas gracias.", timestamp: "10:00 AM" },
            { id: 3, senderId: 1, content: "¡Claro! Me encantaría compartir mi experiencia sobre cultura organizacional.", timestamp: "10:30 AM" }
        ]
    },
    {
        id: 2,
        participantId: 6, // David K.
        lastMessage: "Te envío el link de la reunión para el viernes.",
        lastMessageTime: "Yesterday",
        unread: 0,
        messages: [
            { id: 1, senderId: 6, content: "Hola, ¿cómo estás?", timestamp: "Yesterday" },
            { id: 2, senderId: 'me', content: "Todo bien, gracias. ¿Listo para la sesión?", timestamp: "Yesterday" },
            { id: 3, senderId: 6, content: "Te envío el link de la reunión para el viernes.", timestamp: "Yesterday" }
        ]
    }
];

export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'message' | 'alert' | 'success' | 'info';
}

export const NOTIFICATIONS: Notification[] = [
    { id: 1, title: "Nuevo Mensaje", message: "Carmen te ha enviado un mensaje.", time: "Hace 5 min", read: false, type: "message" },
    { id: 2, title: "Mentoría Confirmada", message: "Tu sesión con Dr. Carlos está lista.", time: "Hace 1 hora", read: false, type: "success" },
    { id: 3, title: "Alerta de Progreso", message: "Recuerda completar el Test de Liderazgo.", time: "Hace 1 día", read: true, type: "alert" },
    { id: 4, title: "Bienvenido", message: "Bienvenido a la plataforma 4Shine.", time: "Hace 2 días", read: true, type: "info" }
];

export interface Quote {
    text: string;
    author: string;
}

export const QUOTES: Quote[] = [
    { text: "El liderazgo no es una posición o un título, es acción y ejemplo.", author: "CARMENZA ALARCÓN" },
    { text: "La innovación distingue a los líderes de los seguidores.", author: "STEVE JOBS" },
    { text: "No cuentes los días, haz que los días cuenten.", author: "MUHAMMAD ALI" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "ROBERT COLLIER" }
];

export interface NewsUpdate {
    id: number;
    title: string;
    category: string;
    summary: string;
    date: string;
    image: string;
    likes?: number; // Optional
}

export const NEWS_UPDATES: NewsUpdate[] = [
    { id: 1, title: "Lanzamiento Cohorte 5", category: "Comunidad", summary: "Damos la bienvenida a los 50 nuevos líderes que se unen hoy.", date: "Hoy", image: "bg-amber-100 text-amber-600", likes: 42 },
    { id: 2, title: "Tendencias 2026: IA y Liderazgo", category: "Blog", summary: "Nuestro último artículo explora cómo la IA está cambiando el C-Level.", date: "Ayer", image: "bg-blue-100 text-blue-600", likes: 128 },
];

// --- WORKSHOPS DATA (HU New Module) ---
export interface Workshop {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'Relacionamiento' | 'Formación' | 'Innovación' | 'Wellbeing' | 'Otro';
    facilitator: string;
    link?: string;
    attendees: { id: number; name: string; avatar: string; role: Role }[];
    status: 'upcoming' | 'completed' | 'cancelled';
    image?: string;
}

export const WORKSHOPS: Workshop[] = [
    {
        id: 1,
        title: "Networking de Alto Impacto",
        description: "Sesión quincenal para conectar con otros líderes de la industria y compartir experiencias sobre transformación digital.",
        date: "2025-10-15",
        time: "18:00",
        type: "Relacionamiento",
        facilitator: "Laura Gestión",
        link: "https://zoom.us/j/workshop1",
        status: 'upcoming',
        attendees: [
            { id: 101, name: "Ana Líder", avatar: "A", role: "lider" },
            { id: 102, name: "Carlos Mentor", avatar: "C", role: "mentor" }
        ]
    },
    {
        id: 2,
        title: "Taller de Innovación Abierta",
        description: "Aprende metodologías ágiles para fomentar la innovación dentro de tu equipo.",
        date: "2025-10-22",
        time: "10:00",
        type: "Innovación",
        facilitator: "Roberto Innova",
        link: "https://zoom.us/j/workshop2",
        status: 'upcoming',
        attendees: [
            { id: 101, name: "Ana Líder", avatar: "A", role: "lider" }
        ]
    },
    {
        id: 3,
        title: "Liderazgo Consciente",
        description: "Explorando herramientas de mindfulness para la toma de decisiones estratégicas.",
        date: "2025-10-01",
        time: "19:00",
        type: "Wellbeing",
        facilitator: "Sandra Peace",
        status: 'completed',
        attendees: []
    }
];
export const MENTOR_TRAINING: LearningItem[] = [
    {
        id: 101,
        title: "Fundamentos del Mentoring 4Shine",
        type: "scorm",
        duration: "45 min",
        category: "Metodología",
        isRecommended: true,
        likes: 12,
        liked: true,
        commentsArray: [],
        date: "2024-01-01",
        url: "#",
        seen: true,
        progress: 75,
        tags: ["Mentoring", "Fundamentos"],
        author: "4Shine Academy"
    },
    {
        id: 102,
        title: "Escucha Activa y Comunicación",
        type: "scorm",
        duration: "30 min",
        category: "Habilidades Blandas",
        isRecommended: true,
        likes: 5,
        liked: false,
        commentsArray: [],
        date: "2024-01-01",
        url: "#",
        seen: false,
        progress: 15,
        tags: ["Comunicación", "Soft Skills"],
        author: "4Shine Academy"
    },
    {
        id: 103,
        title: "Establecimiento de Objetivos SMART",
        type: "scorm",
        duration: "40 min",
        category: "Herramientas",
        isRecommended: true,
        likes: 8,
        liked: false,
        commentsArray: [],
        date: "2024-01-01",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Objetivos", "SMART"],
        author: "4Shine Academy"
    },
    {
        id: 104,
        title: "Feedback Efectivo y Constructivo",
        type: "scorm",
        duration: "35 min",
        category: "Habilidades Blandas",
        isRecommended: true,
        likes: 20,
        liked: true,
        commentsArray: [],
        date: "2024-01-01",
        url: "#",
        seen: true,
        progress: 100,
        tags: ["Feedback", "Comunicación"],
        author: "4Shine Academy"
    },
    {
        id: 105,
        title: "Guía de Cierre de Procesos",
        type: "scorm",
        duration: "25 min",
        category: "Metodología",
        isRecommended: false,
        likes: 2,
        liked: false,
        commentsArray: [],
        date: "2024-01-01",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Cierre", "Procesos"],
        author: "4Shine Academy"
    }
];

export interface MentorAssignment {
    id: number;
    mentorId: number;
    mentorName: string;
    courseId: number;
    courseTitle: string;
    assignedDate: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    progress: number;
    lastAccess?: string;
}

export const MENTOR_ASSIGNMENTS: MentorAssignment[] = [
    {
        id: 1,
        mentorId: 1, // Dr. Carlos Ruiz
        mentorName: "Dr. Carlos Ruiz",
        courseId: 101, // Fundamentos del Mentoring
        courseTitle: "Fundamentos del Mentoring 4Shine",
        assignedDate: "2025-10-01",
        status: "Completed",
        progress: 100,
        lastAccess: "2025-10-05"
    },
    {
        id: 2,
        mentorId: 1,
        mentorName: "Dr. Carlos Ruiz",
        courseId: 102,
        courseTitle: "Escucha Activa y Comunicación",
        assignedDate: "2025-10-05",
        status: "In Progress",
        progress: 45,
        lastAccess: "2025-10-15"
    },
    {
        id: 3,
        mentorId: 2, // Ana García
        mentorName: "Ana García",
        courseId: 101,
        courseTitle: "Fundamentos del Mentoring 4Shine",
        assignedDate: "2025-10-10",
        status: "Not Started",
        progress: 0
    }
    // ... existing code ...
];

export const LEADER_TRAINING: LearningItem[] = [
    {
        id: 201,
        title: "Liderazgo Adaptativo en la Era Digital",
        type: "scorm",
        duration: "45 min",
        category: "Liderazgo",
        isRecommended: true,
        likes: 42,
        liked: false,
        commentsArray: [],
        date: "2024-02-01",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Liderazgo", "Digital"],
        author: "4Shine Academy"
    },
    {
        id: 202,
        title: "Gestión de Equipos Remotos y Híbridos",
        type: "scorm",
        duration: "60 min",
        category: "Gestión",
        isRecommended: true,
        likes: 35,
        liked: true,
        commentsArray: [],
        date: "2024-02-05",
        url: "#",
        seen: true,
        progress: 45,
        tags: ["Remoto", "Híbrido"],
        author: "4Shine Academy"
    },
    {
        id: 203,
        title: "Inteligencia Emocional para Líderes",
        type: "scorm",
        duration: "40 min",
        category: "Habilidades Blandas",
        isRecommended: false,
        likes: 120,
        liked: true,
        commentsArray: [],
        date: "2024-02-10",
        url: "#",
        seen: true,
        progress: 100,
        tags: ["IE", "Soft Skills"],
        author: "Dr. Carlos Ruiz"
    },
    {
        id: 204,
        title: "Comunicación Asertiva y Feedback Efectivo",
        type: "scorm",
        duration: "55 min",
        category: "Comunicación",
        isRecommended: true,
        likes: 89,
        liked: false,
        commentsArray: [],
        date: "2024-02-15",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Feedback", "Comunicación"],
        author: "Ana García"
    },
    {
        id: 205,
        title: "Resolución de Conflictos y Negociación",
        type: "scorm",
        duration: "50 min",
        category: "Gestión",
        isRecommended: false,
        likes: 65,
        liked: false,
        commentsArray: [],
        date: "2024-02-20",
        url: "#",
        seen: false,
        progress: 10,
        tags: ["Conflictos", "Negociación"],
        author: "4Shine Academy"
    },
    {
        id: 206,
        title: "Toma de Decisiones Estratégicas",
        type: "scorm",
        duration: "70 min",
        category: "Estrategia",
        isRecommended: true,
        likes: 55,
        liked: false,
        commentsArray: [],
        date: "2024-03-01",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Estrategia", "Decisiones"],
        author: "Global Strategy Unit"
    },
    {
        id: 207,
        title: "Gestión del Tiempo y Productividad",
        type: "scorm",
        duration: "30 min",
        category: "Productividad",
        isRecommended: false,
        likes: 210,
        liked: true,
        commentsArray: [],
        date: "2024-03-05",
        url: "#",
        seen: true,
        progress: 80,
        tags: ["Tiempo", "Productividad"],
        author: "4Shine Academy"
    },
    {
        id: 208,
        title: "Delegación Efectiva y Empoderamiento",
        type: "scorm",
        duration: "40 min",
        category: "Gestión",
        isRecommended: false,
        likes: 44,
        liked: false,
        commentsArray: [],
        date: "2024-03-10",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Delegación", "Empoderamiento"],
        author: "Laura Gestión"
    },
    {
        id: 209,
        title: "Innovación y Creatividad Empresarial",
        type: "scorm",
        duration: "65 min",
        category: "Innovación",
        isRecommended: true,
        likes: 92,
        liked: true,
        commentsArray: [],
        date: "2024-03-15",
        url: "#",
        seen: false,
        progress: 25,
        tags: ["Innovación", "Creatividad"],
        author: "Tech Lab"
    },
    {
        id: 210,
        title: "Cultura Organizacional y Valores",
        type: "scorm",
        duration: "50 min",
        category: "Cultura",
        isRecommended: false,
        likes: 30,
        liked: false,
        commentsArray: [],
        date: "2024-03-20",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Cultura", "Valores"],
        author: "HR Dept"
    },
    {
        id: 211,
        title: "Fundamentos de Finanzas para No Financieros",
        type: "scorm",
        duration: "90 min",
        category: "Finanzas",
        isRecommended: true,
        likes: 150,
        liked: false,
        commentsArray: [],
        date: "2024-04-01",
        url: "#",
        seen: false,
        progress: 5,
        tags: ["Finanzas", "Economía"],
        author: "CFO Office"
    },
    {
        id: 212,
        title: "Marketing Digital para Líderes",
        type: "scorm",
        duration: "60 min",
        category: "Marketing",
        isRecommended: false,
        likes: 78,
        liked: true,
        commentsArray: [],
        date: "2024-04-05",
        url: "#",
        seen: true,
        progress: 60,
        tags: ["Marketing", "Digital"],
        author: "Marketing Team"
    },
    {
        id: 213,
        title: "Gestión del Cambio Organizacional",
        type: "scorm",
        duration: "55 min",
        category: "Gestión del Cambio",
        isRecommended: true,
        likes: 112,
        liked: false,
        commentsArray: [],
        date: "2024-04-10",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Cambio", "Transformación"],
        author: "Change Management"
    },
    {
        id: 214,
        title: "Ética y Responsabilidad Social Corporativa",
        type: "scorm",
        duration: "45 min",
        category: "Ética",
        isRecommended: false,
        likes: 40,
        liked: false,
        commentsArray: [],
        date: "2024-04-15",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Ética", "RSC"],
        author: "Compliance"
    },
    {
        id: 215,
        title: "Bienestar y Salud Mental en el Trabajo",
        type: "scorm",
        duration: "35 min",
        category: "Bienestar",
        isRecommended: true,
        likes: 200,
        liked: true,
        commentsArray: [],
        date: "2024-04-20",
        url: "#",
        seen: true,
        progress: 100,
        tags: ["Wellbeing", "Salud"],
        author: "Wellness Program"
    },
    {
        id: 216,
        title: "Diversidad e Inclusión en el Liderazgo",
        type: "scorm",
        duration: "50 min",
        category: "Inclusión",
        isRecommended: true,
        likes: 85,
        liked: false,
        commentsArray: [],
        date: "2024-05-01",
        url: "#",
        seen: false,
        progress: 15,
        tags: ["Diversidad", "Inclusión"],
        author: "D&I Committee"
    },
    {
        id: 217,
        title: "Herramientas de Colaboración Digital",
        type: "scorm",
        duration: "40 min",
        category: "Tecnología",
        isRecommended: false,
        likes: 60,
        liked: true,
        commentsArray: [],
        date: "2024-05-05",
        url: "#",
        seen: true,
        progress: 90,
        tags: ["Tools", "Colaboración"],
        author: "IT Support"
    },
    {
        id: 218,
        title: "Presentaciones de Alto Impacto",
        type: "scorm",
        duration: "55 min",
        category: "Comunicación",
        isRecommended: true,
        likes: 130,
        liked: false,
        commentsArray: [],
        date: "2024-05-10",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Public Speaking", "Presentaciones"],
        author: "Comms Team"
    },
    {
        id: 219,
        title: "Mentoring para Líderes (Cómo ser mentee)",
        type: "scorm",
        duration: "30 min",
        category: "Mentoring",
        isRecommended: true,
        likes: 95,
        liked: true,
        commentsArray: [],
        date: "2024-05-15",
        url: "#",
        seen: true,
        progress: 100,
        tags: ["Mentoring", "Desarrollo"],
        author: "4Shine Academy"
    },
    {
        id: 220,
        title: "Planificación de Carrera y Desarrollo",
        type: "scorm",
        duration: "45 min",
        category: "Desarrollo",
        isRecommended: false,
        likes: 70,
        liked: false,
        commentsArray: [],
        date: "2024-05-20",
        url: "#",
        seen: false,
        progress: 0,
        tags: ["Carrera", "Crecimiento"],
        author: "Talent Management"
    }
];

export interface RuntimeBootstrapPayload {
    users: Record<Role, User>;
    availableMentors: Mentor[];
    mentees: Mentee[];
    learningContent: LearningItem[];
    methodologyContent: MethodologyResource[];
    mentorships: MentorshipSession[];
    timeline: TimelineEvent[];
    networking: NetworkingContact[];
    interestGroups: InterestGroup[];
    jobs: Job[];
    chats: Chat[];
    notifications: Notification[];
    quotes: Quote[];
    newsUpdates: NewsUpdate[];
    workshops: Workshop[];
    mentorTraining: LearningItem[];
    leaderTraining: LearningItem[];
    mentorAssignments: MentorAssignment[];
}

function replaceArrayData<T>(target: T[], source?: T[]) {
    if (!source) return;
    target.splice(0, target.length, ...source);
}

export function hydrateMockData(payload: RuntimeBootstrapPayload) {
    if (!payload) return;

    (Object.keys(USERS) as Role[]).forEach((role) => {
        const nextUser = payload.users?.[role];
        if (nextUser) {
            USERS[role] = { ...USERS[role], ...nextUser };
        }
    });

    replaceArrayData(AVAILABLE_MENTORS, payload.availableMentors);
    replaceArrayData(MENTEES, payload.mentees);
    replaceArrayData(LEARNING_CONTENT, payload.learningContent);
    replaceArrayData(METHODOLOGY_CONTENT, payload.methodologyContent);
    replaceArrayData(MENTORSHIPS, payload.mentorships);
    replaceArrayData(TIMELINE, payload.timeline);
    replaceArrayData(NETWORKING, payload.networking);
    replaceArrayData(INTEREST_GROUPS, payload.interestGroups);
    replaceArrayData(JOBS, payload.jobs);
    replaceArrayData(CHATS, payload.chats);
    replaceArrayData(NOTIFICATIONS, payload.notifications);
    replaceArrayData(QUOTES, payload.quotes);
    replaceArrayData(NEWS_UPDATES, payload.newsUpdates);
    replaceArrayData(WORKSHOPS, payload.workshops);
    replaceArrayData(MENTOR_TRAINING, payload.mentorTraining);
    replaceArrayData(LEADER_TRAINING, payload.leaderTraining);
    replaceArrayData(MENTOR_ASSIGNMENTS, payload.mentorAssignments);
}
