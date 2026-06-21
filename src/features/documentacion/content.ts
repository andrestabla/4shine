// Documentación técnica interna de la plataforma 4Shine.
//
// Este archivo es la ÚNICA fuente de verdad del módulo "Documentación técnica"
// del panel de administración (/dashboard/administracion/documentacion). Es
// contenido estático (no consulta base de datos); editarlo aquí actualiza la
// documentación que ve el administrador. Mantenerlo alineado con el código real.

export type DocBlock =
  | { type: 'p'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; code: string }
  | { type: 'diagram'; title?: string; svg: string }
  | { type: 'callout'; tone?: 'info' | 'warn'; title?: string; text: string };

export type DocCategory = 'arquitectura' | 'modulo';

export interface DocSection {
  slug: string;
  label: string;
  /** Resumen corto para la tarjeta del hub. */
  tagline: string;
  /** Clave del icono de lucide-react (se resuelve en la UI). */
  icon: string;
  category: DocCategory;
  blocks: DocBlock[];
  /**
   * Capacidades por rol (solo módulos). Refleja la matriz de permisos por
   * defecto (app_auth.role_module_permissions), editable en Administración → Roles.
   */
  roles?: { role: string; can: string }[];
}

// ─── Arquitectura y temas transversales ──────────────────────────────────────

const ARCHITECTURE_SECTIONS: DocSection[] = [
  {
    slug: 'arquitectura-general',
    label: 'Arquitectura general',
    tagline:
      'Stack, lenguajes, estructura de carpetas y el flujo de una petición de punta a punta.',
    icon: 'Layers',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'La plataforma 4Shine es una aplicación web monolítica construida sobre Next.js (App Router), desplegada en Vercel y respaldada por una base de datos PostgreSQL. Todo —el sitio público, el dashboard y la API— vive en un único proyecto de Next.js bajo /src.',
      },
      {
        type: 'diagram',
        title: 'Vista de alto nivel: el navegador habla con Vercel (que ejecuta el código), y la API se conecta a Neon, R2 y los servicios externos.',
        svg: `<svg viewBox="0 0 760 388" width="100%" role="img" aria-label="Arquitectura de alto nivel" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arrA" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3 L0,6 Z" fill="var(--app-muted)"/></marker></defs>
  <rect x="24" y="22" width="150" height="46" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/>
  <text x="99" y="44" text-anchor="middle" font-size="13" font-weight="600" fill="var(--app-ink)">GitHub</text>
  <text x="99" y="59" text-anchor="middle" font-size="9" fill="var(--app-muted)">push a main → deploy</text>
  <rect x="250" y="20" width="300" height="52" rx="10" fill="var(--app-ink)"/>
  <text x="400" y="44" text-anchor="middle" font-size="13" font-weight="600" fill="#ffffff">Navegador (cliente)</text>
  <text x="400" y="60" text-anchor="middle" font-size="9.5" fill="#cbd5e1">React 19 · Tailwind · Contexts</text>
  <line x1="400" y1="72" x2="400" y2="106" stroke="var(--app-muted)" stroke-width="1.4" marker-end="url(#arrA)"/>
  <text x="408" y="92" font-size="9" fill="var(--app-muted)">requestApi · HTTPS · cookie</text>
  <line x1="99" y1="68" x2="99" y2="106" stroke="var(--app-muted)" stroke-width="1.4" marker-end="url(#arrA)"/>
  <text x="104" y="92" font-size="9" fill="var(--app-muted)">deploy</text>
  <rect x="40" y="108" width="680" height="150" rx="12" fill="none" stroke="var(--brand-primary)" stroke-dasharray="5 4"/>
  <text x="54" y="128" font-size="12" font-weight="700" fill="var(--app-ink)">Vercel · Next.js 16</text>
  <rect x="60" y="142" width="190" height="96" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/>
  <text x="155" y="178" text-anchor="middle" font-size="12" font-weight="600" fill="var(--app-ink)">App Router</text>
  <text x="155" y="195" text-anchor="middle" font-size="9" fill="var(--app-muted)">Sitio público + Dashboard</text>
  <text x="155" y="209" text-anchor="middle" font-size="9" fill="var(--app-muted)">(SSR / client comp.)</text>
  <rect x="285" y="142" width="190" height="96" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/>
  <text x="380" y="178" text-anchor="middle" font-size="12" font-weight="600" fill="var(--app-ink)">API · /api/v1</text>
  <text x="380" y="195" text-anchor="middle" font-size="9" fill="var(--app-muted)">route handlers</text>
  <text x="380" y="209" text-anchor="middle" font-size="9" fill="var(--app-muted)">(serverless)</text>
  <rect x="510" y="142" width="190" height="96" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/>
  <text x="605" y="178" text-anchor="middle" font-size="12" font-weight="600" fill="var(--app-ink)">Cron · cada 15 min</text>
  <text x="605" y="195" text-anchor="middle" font-size="9" fill="var(--app-muted)">recordatorios</text>
  <line x1="250" y1="190" x2="284" y2="190" stroke="var(--app-muted)" stroke-width="1.3" marker-end="url(#arrA)"/>
  <line x1="510" y1="190" x2="476" y2="190" stroke="var(--app-muted)" stroke-width="1.3" marker-end="url(#arrA)"/>
  <rect x="60" y="300" width="200" height="74" rx="9" fill="var(--app-surface)" stroke="var(--app-border-strong)"/>
  <text x="160" y="330" text-anchor="middle" font-size="12" font-weight="600" fill="var(--app-ink)">Neon · PostgreSQL</text>
  <text x="160" y="348" text-anchor="middle" font-size="9" fill="var(--app-muted)">datos relacionales + RLS</text>
  <rect x="284" y="300" width="172" height="74" rx="9" fill="var(--app-surface)" stroke="var(--app-border-strong)"/>
  <text x="370" y="330" text-anchor="middle" font-size="12" font-weight="600" fill="var(--app-ink)">Cloudflare R2</text>
  <text x="370" y="348" text-anchor="middle" font-size="9" fill="var(--app-muted)">archivos · SCORM</text>
  <rect x="480" y="300" width="220" height="74" rx="9" fill="var(--app-surface)" stroke="var(--app-border-strong)"/>
  <text x="590" y="326" text-anchor="middle" font-size="12" font-weight="600" fill="var(--app-ink)">Servicios externos</text>
  <text x="590" y="343" text-anchor="middle" font-size="9" fill="var(--app-muted)">Zoom · Stripe/Wompi</text>
  <text x="590" y="356" text-anchor="middle" font-size="9" fill="var(--app-muted)">Pusher · SMTP · IA</text>
  <line x1="350" y1="238" x2="170" y2="298" stroke="var(--app-muted)" stroke-width="1.3" marker-end="url(#arrA)"/>
  <line x1="380" y1="238" x2="372" y2="298" stroke="var(--app-muted)" stroke-width="1.3" marker-end="url(#arrA)"/>
  <line x1="410" y1="238" x2="585" y2="298" stroke="var(--app-muted)" stroke-width="1.3" marker-end="url(#arrA)"/>
</svg>`,
      },
      { type: 'subheading', text: 'Stack y lenguajes' },
      {
        type: 'table',
        headers: ['Capa', 'Tecnología'],
        rows: [
          ['Framework web', 'Next.js 16 (App Router) sobre Node.js'],
          ['UI', 'React 19 + TypeScript 5 (modo estricto)'],
          ['Estilos', 'Tailwind CSS 4 (utility-first) + variables CSS de marca'],
          ['Base de datos', 'PostgreSQL, acceso directo con el driver pg (sin ORM)'],
          ['Autenticación', 'JWT con la librería jose (access + refresh) y bcryptjs'],
          ['Gráficas', 'Recharts y Chart.js'],
          ['Editor de texto', 'Tiptap (rich text) + react-markdown'],
          ['Almacenamiento de archivos', 'Cloudflare R2 (compatible con S3, AWS SDK v3)'],
          ['Pagos', 'Stripe y Wompi'],
          ['Tiempo real', 'Pusher (canales privados)'],
          ['Email', 'Nodemailer (SMTP)'],
          ['Reuniones', 'Zoom (OAuth2 Server-to-Server)'],
          ['Documentos', 'jsPDF (certificados/exportes) y xlsx (Excel)'],
        ],
      },
      { type: 'subheading', text: 'Estructura de carpetas (src/)' },
      {
        type: 'table',
        headers: ['Carpeta', 'Contenido'],
        rows: [
          ['app/', 'Páginas y rutas de API (App Router). El sitio público, /dashboard y /api viven aquí.'],
          ['features/', 'Lógica de dominio por módulo (types.ts, service.ts, client.ts).'],
          ['components/', 'Componentes de UI reutilizables.'],
          ['context/', 'Proveedores de React Context (usuario, branding, diálogos).'],
          ['lib/', 'Utilidades compartidas: cliente de API, email, certificados, helpers.'],
          ['server/', 'Utilidades de servidor: pool de BD, autenticación, auditoría, integraciones.'],
        ],
      },
      { type: 'subheading', text: 'Flujo de una petición' },
      {
        type: 'steps',
        items: [
          'La UI llama a la API mediante el wrapper requestApi() (src/lib/api-client.ts), que adjunta la cookie del token de acceso y, si recibe 401, intenta refrescar el token automáticamente.',
          'El handler de la ruta (src/app/api/v1/...) autentica la petición: valida el JWT y vuelve a leer el rol del usuario desde la base de datos (no confía en el rol del token).',
          'Se obtiene un cliente de BD con contexto de rol en tiempo de ejecución (withClient + withRoleContext), que fija app.current_user_id y app.current_role para la seguridad a nivel de fila (RLS).',
          'Se verifica el permiso de módulo con requireModulePermission(client, módulo, acción). Si no se cumple, se devuelve 403.',
          'Se invoca la función de servicio del feature correspondiente, que ejecuta la lógica de negocio y las consultas SQL.',
          'Se registra la acción en la auditoría (app_admin.audit_logs) y se devuelve una respuesta con el sobre { ok, data?, error? }.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Convención de respuesta',
        text: 'Todas las rutas de API devuelven un sobre uniforme: { ok: boolean, data?: T, error?: string }. La UI desempaqueta data cuando ok es true.',
      },
    ],
  },
  {
    slug: 'base-de-datos',
    label: 'Lógica de base de datos',
    tagline:
      'PostgreSQL, organización por esquemas, pool de conexiones, seguridad por fila (RLS) y migraciones.',
    icon: 'Database',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'La persistencia es PostgreSQL. No se usa ORM: las consultas son SQL directo ejecutado con el driver pg a través de un pool de conexiones. La base se organiza por esquemas, uno por dominio funcional.',
      },
      { type: 'subheading', text: 'Esquemas principales' },
      {
        type: 'table',
        headers: ['Esquema', 'Responsabilidad'],
        rows: [
          ['app_auth', 'Credenciales, sesiones de refresh, roles y la matriz de permisos por módulo.'],
          ['app_core', 'Usuarios, perfiles, organizaciones, cohortes, notificaciones, eventos de trayectoria.'],
          ['app_assessment', 'Diagnósticos, intentos y puntajes por pilar (Descubrimiento).'],
          ['app_learning', 'Contenido de aprendizaje: cursos, recursos, actividades, tareas, progreso, workbooks.'],
          ['app_mentoring', 'Sesiones de mentoría (1:1 y grupales), participantes, asignaciones, recordatorios.'],
          ['app_networking', 'Conexiones, hilos de chat, mensajes, comunidades, convocatorias.'],
          ['app_admin', 'Auditoría, configuración de integraciones, branding, plantillas de notificación, site builder.'],
        ],
      },
      {
        type: 'diagram',
        title: 'Esquemas de PostgreSQL. app_core es el núcleo; los demás esquemas referencian al usuario por user_id (y al actor en la auditoría).',
        svg: `<svg viewBox="0 0 760 432" width="100%" role="img" aria-label="Esquemas de base de datos y conexiones" xmlns="http://www.w3.org/2000/svg">
  <g stroke="var(--app-border-strong)" stroke-width="1.4">
  <line x1="380" y1="196" x2="380" y2="102"/>
  <line x1="300" y1="212" x2="222" y2="124"/>
  <line x1="460" y1="212" x2="540" y2="124"/>
  <line x1="300" y1="262" x2="222" y2="330"/>
  <line x1="380" y1="278" x2="380" y2="356"/>
  <line x1="460" y1="262" x2="540" y2="330"/>
  </g>
  <text x="388" y="152" font-size="8.5" fill="var(--app-muted)">roles · permisos</text>
  <text x="468" y="170" font-size="8.5" fill="var(--app-muted)">user_id</text>
  <text x="468" y="305" font-size="8.5" fill="var(--app-muted)">actor</text>
  <rect x="295" y="196" width="170" height="82" rx="10" fill="var(--app-ink)"/>
  <text x="380" y="224" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">app_core</text>
  <text x="380" y="242" text-anchor="middle" font-size="9" fill="#cbd5e1">users · perfiles · orgs</text>
  <text x="380" y="256" text-anchor="middle" font-size="9" fill="#cbd5e1">notificaciones · cohortes</text>
  <g font-size="11.5" font-weight="600" fill="var(--app-ink)" text-anchor="middle">
  <rect x="300" y="36" width="160" height="66" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="380" y="62">app_auth</text>
  <rect x="36" y="62" width="184" height="62" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="128" y="88">app_assessment</text>
  <rect x="540" y="62" width="184" height="62" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="632" y="86">app_learning</text>
  <rect x="36" y="330" width="184" height="62" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="128" y="356">app_mentoring</text>
  <rect x="295" y="356" width="170" height="66" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="380" y="382">app_networking</text>
  <rect x="540" y="330" width="184" height="62" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="632" y="356">app_admin</text>
  </g>
  <g font-size="9" fill="var(--app-muted)" text-anchor="middle">
  <text x="380" y="80">roles · permisos · sesiones</text>
  <text x="128" y="106">diagnósticos · pilares</text>
  <text x="632" y="101">cursos · progreso · workbooks</text>
  <text x="128" y="374">sesiones · participantes</text>
  <text x="380" y="400">conexiones · chat · convocatorias</text>
  <text x="632" y="374">auditoría · branding · site</text>
  </g>
</svg>`,
      },
      { type: 'subheading', text: 'Pool de conexiones y rol de ejecución' },
      {
        type: 'bullets',
        items: [
          'El pool de pg se define en src/server/db (cadena de conexión desde DATABASE_URL, SSL obligatorio).',
          'Cada conexión adopta un rol de ejecución no-propietario (DB_RUNTIME_ROLE, por defecto app_runtime) mediante SET ROLE, de modo que la RLS siempre aplica.',
          'Por petición se fija el contexto con set_config(\'app.current_user_id\', ...) y set_config(\'app.current_role\', ...), que las políticas de RLS leen para decidir qué filas son visibles.',
        ],
      },
      { type: 'subheading', text: 'Seguridad a nivel de fila (RLS)' },
      {
        type: 'p',
        text: 'Las tablas sensibles (usuarios, perfiles, contenido, sesiones de mentoría, chats, notificaciones) tienen RLS activado. Las políticas aíslan los datos por usuario y por rol; el rol admin las puede sortear. Esto significa que aunque una consulta olvide filtrar, la base de datos no devuelve filas ajenas.',
      },
      { type: 'subheading', text: 'Migraciones' },
      {
        type: 'bullets',
        items: [
          'Las migraciones son archivos SQL en db/migrations, nombrados por timestamp (YYYYMMDD..._descripcion.sql) y aplicados en orden.',
          'No hay migraciones de ORM: el esquema se versiona como SQL plano e idempotente.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Multi-tenant',
        text: 'El esquema soporta varias organizaciones (organization_id), aunque el despliegue actual opera como una sola organización. Branding, plantillas e integraciones se guardan por organización.',
      },
    ],
  },
  {
    slug: 'autenticacion-permisos',
    label: 'Autenticación y permisos',
    tagline:
      'JWT (access/refresh), roles del sistema, y el modelo de permisos por módulo y acción.',
    icon: 'ShieldCheck',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'La autenticación usa JWT firmados con jose. Hay un token de acceso de vida corta (en cookie HttpOnly) y un token de refresh de vida larga persistido en app_auth.refresh_sessions para poder revocarlo. Existen también tokens de invitado con alcance limitado al módulo de Descubrimiento.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'El rol se relee siempre',
        text: 'Aunque el JWT incluya el rol al iniciar sesión, cada petición autenticada vuelve a leer el rol vigente desde app_core.users. Así, si un admin cambia el rol o desactiva una cuenta, el cambio aplica de inmediato sin esperar a que expire el token.',
      },
      { type: 'subheading', text: 'Roles del sistema' },
      {
        type: 'table',
        headers: ['Rol', 'Descripción'],
        rows: [
          ['admin', 'Administrador del sistema. Acceso total, incluyendo el panel de administración.'],
          ['gestor', 'Gestor del programa: coordina, crea y modera contenido y operaciones.'],
          ['lider', 'Participante del programa (líder). Consume el recorrido de aprendizaje y mentorías.'],
          ['mentor', 'Adviser que acompaña a los líderes (mentorías, revisión de tareas).'],
          ['invitado', 'Cuenta con acceso limitado, solo a Descubrimiento.'],
        ],
      },
      { type: 'subheading', text: 'Modelo de permisos' },
      {
        type: 'p',
        text: 'El acceso se controla por módulo y acción. Cada módulo tiene una clave (por ejemplo aprendizaje, mentorias, usuarios) y cada permiso una acción: view, create, update, delete, approve, moderate o manage. La relación rol → (módulo, acción) se guarda en app_auth.role_module_permissions.',
      },
      {
        type: 'code',
        code: `// En servidor, antes de ejecutar la lógica:
await requireModulePermission(client, 'aprendizaje', 'view');
// Lanza ForbiddenError (403) si el rol no tiene el permiso.

// En cliente, para mostrar/ocultar controles:
const { can } = useUser();
if (can('usuarios', 'manage')) { /* ... */ }`,
      },
      {
        type: 'bullets',
        items: [
          'Todo el panel de administración se protege con el permiso usuarios:manage.',
          'El rol invitado está cableado para acceder solo al módulo descubrimiento.',
          'El layout del dashboard (src/app/dashboard/layout.tsx) mapea cada ruta a su (módulo, acción) requerido y bloquea el acceso antes de renderizar.',
        ],
      },
    ],
  },
  {
    slug: 'logica-de-modulos',
    label: 'Lógica de módulos',
    tagline:
      'Cómo se estructura cada módulo: feature (types/service/client), API gateway y separación servidor/cliente.',
    icon: 'Boxes',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Cada módulo funcional sigue el mismo patrón de tres capas. Conocer este patrón permite leer cualquier módulo del sistema sin sorpresas.',
      },
      { type: 'subheading', text: 'La carpeta del feature (src/features/<módulo>/)' },
      {
        type: 'table',
        headers: ['Archivo', 'Rol'],
        rows: [
          ['types.ts', 'Tipos compartidos entre cliente y servidor (formas de datos, filtros, payloads).'],
          ['service.ts', 'Lógica de negocio del lado servidor. Recibe un PoolClient y el actor (AuthUser), ejecuta SQL y efectos.'],
          ['client.ts', 'Funciones del lado cliente que llaman a la API y exponen tipos a la UI.'],
        ],
      },
      { type: 'subheading', text: 'El gateway de API (src/app/api/v1/modules/<módulo>/)' },
      {
        type: 'bullets',
        items: [
          'Cada módulo expone sus endpoints REST bajo /api/v1/modules/<módulo>/.../route.ts.',
          'El handler autentica, abre el contexto de rol en la BD, verifica el permiso, llama al servicio y audita.',
          'La UI nunca toca la base de datos directamente: siempre pasa por el gateway.',
        ],
      },
      {
        type: 'code',
        code: `// Esqueleto típico de un handler de ruta
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  return withClient((client) =>
    withRoleContext(client, identity.userId, identity.role, async () => {
      await requireModulePermission(client, 'aprendizaje', 'view');
      const data = await listLearningResources(client, identity, query);
      await logModuleAudit(client, request, identity, { /* ... */ });
      return jsonOk(data);
    }),
  );
}`,
      },
      {
        type: 'diagram',
        title: 'Ciclo de vida de una petición: del cliente al borde, a la API, a los permisos, al servicio y a PostgreSQL con RLS.',
        svg: `<svg viewBox="0 0 480 588" width="100%" role="img" aria-label="Ciclo de vida de una petición" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arrB" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3 L0,6 Z" fill="var(--app-muted)"/></marker></defs>
  <g font-size="11.5" fill="var(--app-ink)" text-anchor="middle">
  <rect x="70" y="14" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="240" y="41">1 · Cliente — requestApi()</text>
  <rect x="70" y="78" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="240" y="105">2 · Borde (proxy.ts) — host canónico · rate limit</text>
  <rect x="70" y="142" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="240" y="169">3 · Route handler · /api/v1</text>
  <rect x="70" y="206" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="240" y="233">4 · authenticateRequest — rol desde BD</text>
  <rect x="70" y="270" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="240" y="297">5 · withClient + withRoleContext — fija RLS</text>
  <rect x="70" y="334" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--brand-primary)" stroke-width="1.6"/><text x="240" y="361">6 · requireModulePermission — 403 si falla</text>
  <rect x="70" y="398" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="240" y="425">7 · Service — lógica + SQL</text>
  <rect x="70" y="462" width="340" height="44" rx="8" fill="var(--app-surface-muted)" stroke="var(--brand-primary)" stroke-width="1.6"/><text x="240" y="489">8 · PostgreSQL — políticas RLS</text>
  <rect x="70" y="526" width="340" height="44" rx="8" fill="var(--app-ink)"/><text x="240" y="553" fill="#ffffff">9 · logModuleAudit → { ok, data }</text>
  </g>
  <g stroke="var(--app-muted)" stroke-width="1.4" marker-end="url(#arrB)">
  <line x1="240" y1="58" x2="240" y2="76"/><line x1="240" y1="122" x2="240" y2="140"/><line x1="240" y1="186" x2="240" y2="204"/><line x1="240" y1="250" x2="240" y2="268"/><line x1="240" y1="314" x2="240" y2="332"/><line x1="240" y1="378" x2="240" y2="396"/><line x1="240" y1="442" x2="240" y2="460"/><line x1="240" y1="506" x2="240" y2="524"/>
  </g>
</svg>`,
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Bootstrap',
        text: 'Al cargar la app, /api/v1/bootstrap/me devuelve el usuario actual, sus permisos y el estado inicial en una sola llamada, evitando múltiples peticiones al arrancar.',
      },
    ],
  },
  {
    slug: 'frontend-cliente',
    label: 'Frontend y estado del cliente',
    tagline:
      'Cómo funciona la capa de cliente: React Context, data fetching, theming por variables CSS y gating de rutas.',
    icon: 'AppWindow',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'El frontend es React sobre el App Router de Next.js. No usa Redux ni un store global pesado: el estado compartido vive en unos pocos React Context, y los datos se piden a la API con un wrapper común. La mayoría de las páginas del dashboard son client components (\'use client\') que hidratan sus datos al montar.',
      },
      { type: 'subheading', text: 'Proveedores de contexto' },
      {
        type: 'table',
        headers: ['Context (hook)', 'Qué expone'],
        rows: [
          ['UserContext (useUser)', 'currentUser, currentRole, isAuthenticated, isHydrating, mustChangePassword y can(módulo, acción). Es la fuente de la sesión y los permisos en el cliente.'],
          ['BrandingContext (useBranding)', 'tokens de marca (colores, tipografía) para el theming; reflejan lo configurado en Administración → Branding.'],
          ['AppDialogProvider (useAppDialog)', 'alert / confirm / prompt con UI propia, en vez de los window.alert nativos.'],
        ],
      },
      { type: 'subheading', text: 'Peticiones a la API' },
      {
        type: 'p',
        text: 'Toda llamada al backend pasa por requestApi<T>(ruta, init) (src/lib/api-client.ts). Adjunta la cookie de sesión; si recibe 401, intenta refrescar el token y reintenta; desempaqueta el campo data del sobre de respuesta y lanza si ok es false.',
      },
      {
        type: 'code',
        code: `const data = await requestApi<MiTipo>('/api/v1/modules/aprendizaje/resources', {
  method: 'GET',
  cache: 'no-store',
});`,
      },
      { type: 'subheading', text: 'Theming por variables CSS' },
      {
        type: 'bullets',
        items: [
          'Los colores no se escriben a mano: se usan tokens CSS. Familia --app-* para superficies/estructura (--app-ink texto principal, --app-muted texto secundario, --app-border, --app-surface, --app-surface-muted) y familia --brand-* para la identidad (--brand-primary, --brand-accent, etc.).',
          'Se aplican con Tailwind mediante la sintaxis arbitraria: text-[var(--app-ink)], bg-[var(--app-surface)].',
          'Branding (Administración → Branding) reescribe estos tokens, de modo que cambiar la marca no requiere tocar componentes.',
          'Hay clases utilitarias propias reutilizables: .app-panel (panel con borde), .app-list-card (tarjeta clicable), .app-button-primary (CTA principal).',
        ],
      },
      { type: 'subheading', text: 'Protección de rutas en el cliente' },
      {
        type: 'p',
        text: 'El layout del dashboard (src/app/dashboard/layout.tsx) mapea cada ruta a su (módulo, acción) requerido (ACCESS_BY_PATH + resolveRouteAccess) y bloquea o redirige antes de renderizar. Dentro de un componente, can(\'usuarios\', \'manage\') decide si mostrar u ocultar un control.',
      },
    ],
  },
  {
    slug: 'errores-validacion',
    label: 'Manejo de errores y validación',
    tagline:
      'Sobre de respuesta, helpers compartidos, mapeo de errores a códigos HTTP y validación de entrada.',
    icon: 'ShieldAlert',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Las rutas de API responden con un sobre uniforme y comparten helpers de manejo de error en src/app/api/v1/modules/_utils.ts. Esto mantiene consistentes los códigos HTTP y los mensajes.',
      },
      { type: 'subheading', text: 'Sobre de respuesta' },
      {
        type: 'bullets',
        items: [
          'Éxito: { ok: true, data: ... }.',
          'Error: { ok: false, error: "mensaje", detail?: "..." }.',
          'En el cliente, requestApi desempaqueta data cuando ok es true y lanza un error cuando ok es false.',
        ],
      },
      { type: 'subheading', text: 'Helpers compartidos (_utils.ts)' },
      {
        type: 'table',
        headers: ['Helper', 'Comportamiento'],
        rows: [
          ['unauthorizedResponse()', 'Responde 401 { ok:false, error:"Unauthorized" } cuando no hay sesión válida.'],
          ['errorResponse(error, fallback)', 'Si el error es ForbiddenError, responde con su statusCode (403) y su mensaje. Cualquier otro error → 500 con { error: fallback, detail }.'],
          ['parseJsonBody<T>(request)', 'Parsea el cuerpo JSON o devuelve null si es inválido (para validarlo antes de usarlo).'],
        ],
      },
      { type: 'subheading', text: 'Clases de error' },
      {
        type: 'p',
        text: 'La jerarquía es deliberadamente pequeña: ForbiddenError (statusCode 403), que lanza requireModulePermission cuando falta un permiso, y SiteBuilderError para ese módulo. El resto de fallos se tratan como 500 con un detail descriptivo.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'La validación de entrada es manual',
        text: 'El proyecto NO usa zod ni un validador por esquema. Los servicios normalizan y validan a mano (typeof, trim, listas de valores permitidos) antes de tocar la base de datos, y la RLS es la última línea de defensa. Si agregas validación, sigue ese estilo (normalizar en el service) o introduce una librería de forma consistente en todo el módulo.',
      },
    ],
  },
  {
    slug: 'receta-nuevo-modulo',
    label: 'Receta: agregar un módulo',
    tagline:
      'Pasos de punta a punta para crear un módulo o sección nueva siguiendo el patrón del sistema.',
    icon: 'Wrench',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Todos los módulos se construyen igual. Esta es la secuencia recomendada para añadir uno nuevo (o una sección de administración) sin romper convenciones.',
      },
      {
        type: 'steps',
        items: [
          'Crea la carpeta del feature src/features/<modulo>/ con types.ts (formas de datos), service.ts (lógica + SQL; recibe PoolClient y AuthUser) y client.ts (llamadas con requestApi).',
          'Si necesitas tablas nuevas, añade una migración SQL en db/migrations (con RLS y grants si aplica) y aplícala con npm run db:migrate.',
          'Si es un nuevo dominio de permisos, agrega su clave a MODULE_CODES (src/lib/permissions.ts) y otorga el permiso a los roles en la matriz (app_auth.role_module_permissions).',
          'Crea la(s) ruta(s) API en src/app/api/v1/modules/<modulo>/route.ts: autentica, abre contexto (withClient + withRoleContext), verifica permiso (requireModulePermission), llama al service, audita (logModuleAudit) y responde con el sobre. Usa los helpers de _utils.ts para los errores.',
          'Crea la página en src/app/dashboard/<modulo>/page.tsx (client component) consumiendo el client.ts y usando useUser().can() para mostrar u ocultar controles.',
          'Registra el acceso de la ruta en ACCESS_BY_PATH (y resolveRouteAccess para rutas dinámicas) en src/app/dashboard/layout.tsx.',
          'Registra la ruta y su etiqueta en DashboardBackButton.tsx (DASHBOARD_ROUTES + SEGMENT_LABELS) y, según corresponda, en Sidebar.tsx o en ADMIN_CARDS (hub de Administración).',
          'Verifica con npm run lint y npx tsc --noEmit antes de subir.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Ejemplo real',
        text: 'Este mismo módulo de Documentación técnica se construyó siguiendo estos pasos (sin tablas nuevas: su contenido es estático en src/features/documentacion/content.ts).',
      },
    ],
  },
  {
    slug: 'integraciones-servicios',
    label: 'Integraciones y servicios',
    tagline:
      'Almacenamiento R2, Zoom, pagos, tiempo real, email, IA y tareas programadas (cron).',
    icon: 'PlugZap',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Las integraciones externas se configuran por organización en app_admin.integration_configs (datos del asistente + secreto cifrado) y se administran desde Administración → Integraciones.',
      },
      {
        type: 'table',
        headers: ['Servicio', 'Uso'],
        rows: [
          ['Cloudflare R2', 'Almacenamiento de archivos (cursos SCORM, imágenes, adjuntos) vía URLs prefirmadas. Subida desde el cliente.'],
          ['Zoom', 'Creación de reuniones para mentorías 1:1 y grupales, con grabación en la nube y transcripción automática.'],
          ['Stripe / Wompi', 'Cobros: checkout de mentorías, workshops y suscripciones. Webhooks para confirmar pagos.'],
          ['Pusher', 'Mensajería y notificaciones en tiempo real mediante canales privados.'],
          ['Nodemailer (SMTP)', 'Envío de emails transaccionales con plantillas de marca.'],
          ['OpenAI / Claude', 'Asistente IA, sugerencias de metadatos y transcripción/análisis de sesiones.'],
        ],
      },
      { type: 'subheading', text: 'Tareas programadas (cron)' },
      {
        type: 'bullets',
        items: [
          'Vercel Cron invoca /api/v1/cron/... cada 15 minutos, autenticado con CRON_SECRET.',
          'Envía recordatorios de sesiones 1:1 y grupales (ventanas configurables: 72h, 24h, …, 30 min).',
          'Envía recordatorios de Descubrimiento a quienes iniciaron el diagnóstico y no lo completaron.',
          'Es idempotente: cada (sesión/usuario, ventana) se notifica una sola vez.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Dónde se configura cada secreto',
        text: 'Hay dos lugares: (1) variables de entorno en Vercel para los secretos del núcleo (base de datos, JWT, Stripe, Pusher, SMTP, CRON_SECRET); y (2) el panel Administración → Integraciones, que guarda credenciales por organización en app_admin.integration_configs (R2, Zoom, etc.). Lo segundo permite cambiar conectores sin redeploy.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Auditoría',
        text: 'Cada acción relevante se registra en app_admin.audit_logs (actor, acción, módulo, entidad y resumen del cambio), consultable desde la gestión de usuarios.',
      },
    ],
  },
  {
    slug: 'infraestructura-plataformas',
    label: 'Infraestructura y plataformas',
    tagline:
      'Los servicios externos que sostienen la plataforma: Vercel, Neon, Cloudflare R2, GitHub, Pusher y más.',
    icon: 'Cloud',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'La plataforma no administra servidores propios: se apoya en servicios gestionados (managed/serverless). El código vive en GitHub, Vercel lo construye y lo sirve, Neon es la base de datos y Cloudflare R2 guarda los archivos. Cada uno cumple un rol acotado.',
      },
      {
        type: 'table',
        headers: ['Plataforma', 'Rol en 4Shine'],
        rows: [
          ['GitHub (andrestabla/4shine)', 'Repositorio del código fuente y control de versiones. Cada push a la rama main dispara un despliegue en Vercel.'],
          ['Vercel', 'Hosting de la app Next.js: build, funciones serverless para la API, CDN/edge para estáticos, gestión de dominios, variables de entorno y tareas cron.'],
          ['Neon', 'PostgreSQL serverless gestionado. Es la base de datos; DATABASE_URL apunta a Neon (conexión SSL). Soporta ramas de base de datos (branching).'],
          ['Cloudflare R2', 'Almacenamiento de objetos compatible con S3 para archivos: paquetes SCORM, imágenes, adjuntos y grabaciones. Acceso por URLs prefirmadas.'],
          ['Pusher', 'Canales en tiempo real para chat y notificaciones (mensajería instantánea).'],
          ['Proveedor SMTP', 'Envío de correos transaccionales vía Nodemailer.'],
          ['Zoom', 'Reuniones para mentorías (1:1 y grupales) con grabación y transcripción.'],
          ['Stripe / Wompi', 'Procesadores de pago para mentorías, workshops y suscripciones.'],
        ],
      },
      { type: 'subheading', text: 'Dominios' },
      {
        type: 'bullets',
        items: [
          'Producción: 4shine.co y www.4shine.co, servidos por Vercel.',
          'Alias técnico de Vercel: 4shine.vercel.app (apunta al despliegue de producción).',
          'Cada despliegue genera además una URL única e inmutable (por ejemplo 4shine-<hash>-<scope>.vercel.app) útil para inspección.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Separación de responsabilidades',
        text: 'Vercel ejecuta el código pero no almacena datos persistentes: el estado vive en Neon (datos relacionales) y en R2 (archivos). Esto permite que las funciones serverless sean efímeras y escalables.',
      },
    ],
  },
  {
    slug: 'entornos-vercel',
    label: 'Entornos de Vercel y CI/CD',
    tagline:
      'Cómo funcionan (y deberían funcionar) los entornos Production, Preview y Development, y el flujo de despliegue.',
    icon: 'GitBranch',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Vercel maneja tres entornos. Entender cuál se activa en cada situación evita sorpresas al desplegar y al configurar variables de entorno.',
      },
      {
        type: 'table',
        headers: ['Entorno', 'Cuándo se activa', 'Para qué sirve'],
        rows: [
          ['Production', 'Push/merge a la rama main.', 'Lo que ven los usuarios reales en 4shine.co. Es el único entorno donde corren las tareas cron.'],
          ['Preview', 'Push a cualquier otra rama o al abrir un Pull Request.', 'Despliegue de prueba con URL única por rama/commit. Permite revisar un cambio antes de llevarlo a producción.'],
          ['Development', 'Ejecución local con vercel dev o npm run dev.', 'Trabajo en la máquina del desarrollador antes de subir nada.'],
        ],
      },
      {
        type: 'diagram',
        title: 'Cada origen de código aterriza en un entorno distinto. El cron solo se ejecuta en Producción.',
        svg: `<svg viewBox="0 0 720 236" width="100%" role="img" aria-label="Entornos de Vercel" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arrD" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3 L0,6 Z" fill="var(--app-muted)"/></marker></defs>
  <g text-anchor="middle">
  <rect x="24" y="24" width="200" height="52" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="124" y="55" font-size="12" font-weight="600" fill="var(--app-ink)">Rama main</text>
  <rect x="420" y="24" width="276" height="52" rx="9" fill="var(--app-ink)"/><text x="558" y="48" font-size="12" font-weight="600" fill="#ffffff">Production</text><text x="558" y="64" font-size="9" fill="#cbd5e1">4shine.co</text>
  <rect x="24" y="96" width="200" height="52" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="124" y="127" font-size="12" font-weight="600" fill="var(--app-ink)">Otra rama / Pull Request</text>
  <rect x="420" y="96" width="276" height="52" rx="9" fill="var(--app-surface)" stroke="var(--brand-primary)" stroke-width="1.6"/><text x="558" y="120" font-size="12" font-weight="600" fill="var(--app-ink)">Preview</text><text x="558" y="136" font-size="9" fill="var(--app-muted)">URL única por commit</text>
  <rect x="24" y="168" width="200" height="52" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="124" y="199" font-size="12" font-weight="600" fill="var(--app-ink)">Local · npm run dev</text>
  <rect x="420" y="168" width="276" height="52" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="558" y="199" font-size="12" font-weight="600" fill="var(--app-ink)">Development</text>
  </g>
  <g stroke="var(--app-muted)" stroke-width="1.4" marker-end="url(#arrD)">
  <line x1="224" y1="50" x2="418" y2="50"/><line x1="224" y1="122" x2="418" y2="122"/><line x1="224" y1="194" x2="418" y2="194"/>
  </g>
  <text x="322" y="44" text-anchor="middle" font-size="8.5" fill="var(--app-muted)">build</text>
  <text x="322" y="116" text-anchor="middle" font-size="8.5" fill="var(--app-muted)">build</text>
</svg>`,
      },
      { type: 'subheading', text: 'Flujo de despliegue (CI/CD)' },
      {
        type: 'steps',
        items: [
          'El desarrollador trabaja en local (Development) y hace commit.',
          'Al hacer push, Vercel detecta el commit vía la integración con GitHub.',
          'Si la rama es main, construye y publica en Production; si es otra rama o un PR, genera un Preview con URL propia.',
          'Vercel ejecuta next build; si falla, el despliegue se marca como error y no reemplaza al actual.',
          'Si el build pasa, el nuevo despliegue queda READY y los dominios de ese entorno apuntan a él.',
        ],
      },
      { type: 'subheading', text: 'Variables de entorno por entorno' },
      {
        type: 'bullets',
        items: [
          'Cada variable se define en Vercel con un alcance: Production, Preview y/o Development. Así, por ejemplo, DATABASE_URL puede apuntar a una base distinta en Preview que en Production.',
          'Las variables con prefijo NEXT_PUBLIC_ se incrustan en el bundle del navegador (son públicas); el resto solo existen en el servidor.',
          'En local, las variables se leen de .env.local (no se versiona). En Vercel se gestionan desde el panel del proyecto.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Recomendado: previews con base de datos aislada',
        text: 'Lo ideal es que los despliegues Preview apunten a una rama de base de datos de Neon (no a producción), para probar migraciones y cambios sin riesgo. Neon Branching permite crear una copia instantánea de la base por cada preview.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'Estado actual: dos proyectos Vercel y despliegue directo a main',
        text: 'Hoy se despliega empujando directamente a main (cada push va a producción, sin paso por Preview). Además existen dos proyectos de Vercel conectados al mismo repo: "4shine" (sirve producción en 4shine.co) y "4shine-platform" (sin despliegue de producción). Conviene consolidar en un solo proyecto y adoptar ramas + PRs con Preview, para evitar builds duplicados y reducir el riesgo de publicar cambios sin revisar.',
      },
      { type: 'subheading', text: 'Tareas programadas (cron)' },
      {
        type: 'p',
        text: 'Las crons declaradas en vercel.json solo se ejecutan en Production. Hoy hay una: /api/v1/cron/mentorias/session-reminders cada 15 minutos, que envía recordatorios de sesiones y de Descubrimiento. Se autentica con CRON_SECRET.',
      },
    ],
  },
  {
    slug: 'modo-desarrollo',
    label: 'Modo de desarrollo (local)',
    tagline:
      'Cómo levantar el proyecto en local: requisitos, variables, base de datos, scripts y configuración de Next.',
    icon: 'TerminalSquare',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'El proyecto es una app de Next.js estándar. En local se ejecuta con el servidor de desarrollo de Next, apuntando a una base de datos PostgreSQL (puede ser una rama de Neon o una instancia local).',
      },
      { type: 'subheading', text: 'Puesta en marcha' },
      {
        type: 'steps',
        items: [
          'Clonar el repositorio andrestabla/4shine e instalar dependencias con npm install (el proyecto usa npm; hay package-lock.json).',
          'Copiar el archivo de ejemplo: cp .env.example .env.local y completar las variables (DATABASE_URL, DB_RUNTIME_ROLE, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, APP_URL, NEXT_PUBLIC_APP_URL, etc.).',
          'Aplicar el esquema con npm run db:migrate y cargar datos iniciales con npm run db:seed.',
          'Levantar el servidor con npm run dev y abrir http://localhost:3000.',
        ],
      },
      { type: 'subheading', text: 'Scripts de npm' },
      {
        type: 'table',
        headers: ['Comando', 'Qué hace'],
        rows: [
          ['npm run dev', 'Inicia el servidor de desarrollo de Next.js (con hot reload).'],
          ['npm run build', 'Compila la app para producción (lo que ejecuta Vercel).'],
          ['npm run start', 'Sirve la build de producción localmente.'],
          ['npm run lint', 'Ejecuta ESLint (config de Next.js).'],
          ['npm run db:migrate', 'Aplica las migraciones SQL de db/migrations (scripts/db-apply-migration.mjs).'],
          ['npm run db:seed', 'Carga datos iniciales en la base (scripts/seed-db.mjs).'],
        ],
      },
      { type: 'subheading', text: 'Variables de entorno principales' },
      {
        type: 'table',
        headers: ['Variable', 'Propósito'],
        rows: [
          ['DATABASE_URL', 'Cadena de conexión a PostgreSQL (Neon), con SSL.'],
          ['DB_RUNTIME_ROLE', 'Rol no-propietario que adopta cada conexión (por defecto app_runtime) para forzar RLS.'],
          ['JWT_ACCESS_SECRET / JWT_REFRESH_SECRET', 'Claves para firmar los tokens de acceso y refresh.'],
          ['APP_URL / NEXT_PUBLIC_APP_URL', 'URL pública de la app (p. ej. https://www.4shine.co). La NEXT_PUBLIC_ se expone al navegador.'],
          ['STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET', 'Credenciales de Stripe y validación de webhooks.'],
          ['PUSHER_* / NEXT_PUBLIC_PUSHER_*', 'Configuración de Pusher (servidor y cliente) para tiempo real.'],
          ['SEED_DEFAULT_PASSWORD', 'Contraseña por defecto que usa el seeder para los usuarios de prueba.'],
          ['CRON_SECRET', 'Token con el que Vercel autentica las llamadas a las rutas cron.'],
        ],
      },
      { type: 'subheading', text: 'Configuración de Next (next.config.ts)' },
      {
        type: 'bullets',
        items: [
          'Cabeceras de seguridad globales: X-Frame-Options DENY (anti-clickjacking), X-Content-Type-Options nosniff, Referrer-Policy, HSTS (HTTPS forzado un año) y Permissions-Policy.',
          'Permissions-Policy habilita microphone=(self): necesario para la grabación de voz de los workbooks V3; cámara, geolocalización y pago quedan desactivados.',
          'La ruta /api/v1/scorm/serve/* sobrescribe X-Frame-Options a SAMEORIGIN para poder embeber el contenido SCORM en un iframe propio.',
          'Redirección permanente /afiliados → /advisers.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Migraciones y seed',
        text: 'El esquema se versiona como SQL plano en db/migrations (la migración base es 20260301_initial_platform_schema.sql) y se aplica de forma ordenada e idempotente. El seeder inicial crea roles, permisos y usuarios de prueba.',
      },
    ],
  },
  {
    slug: 'mapa-subsistemas',
    label: 'Mapa de subsistemas',
    tagline:
      'Las piezas que no son un módulo de negocio pero sostienen la app: sitio público, borde, webhooks, archivos/SCORM, realtime, certificados y sesión.',
    icon: 'Network',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Además de los módulos de negocio, hay subsistemas transversales que conviene ubicar para no perderse. Esta es la foto de cómo el sitio público y el dashboard se conectan, a través del borde y la API, con cada pieza.',
      },
      {
        type: 'diagram',
        title: 'El borde (proxy.ts) y la API /api/v1 conectan las dos superficies (sitio público y dashboard) con cada subsistema.',
        svg: `<svg viewBox="0 0 760 432" width="100%" role="img" aria-label="Mapa de subsistemas" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arrE" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3 L0,6 Z" fill="var(--app-muted)"/></marker></defs>
  <g stroke="var(--app-muted)" stroke-width="1.3" marker-end="url(#arrE)">
  <line x1="200" y1="86" x2="332" y2="204"/>
  <line x1="560" y1="86" x2="438" y2="204"/>
  <line x1="206" y1="178" x2="298" y2="216"/>
  <line x1="470" y1="216" x2="554" y2="178"/>
  <line x1="320" y1="272" x2="208" y2="312"/>
  <line x1="385" y1="272" x2="385" y2="358"/>
  <line x1="452" y1="272" x2="554" y2="312"/>
  </g>
  <rect x="300" y="205" width="170" height="66" rx="10" fill="var(--app-ink)"/>
  <text x="385" y="234" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">API · /api/v1</text>
  <text x="385" y="252" text-anchor="middle" font-size="9" fill="#cbd5e1">+ Borde (proxy.ts)</text>
  <g text-anchor="middle">
  <rect x="110" y="28" width="180" height="56" rx="9" fill="var(--app-surface)" stroke="var(--app-border-strong)"/><text x="200" y="52" font-size="11.5" font-weight="600" fill="var(--app-ink)">Sitio público</text><text x="200" y="68" font-size="8.5" fill="var(--app-muted)">landing · /descubrimiento · /advisers</text>
  <rect x="470" y="28" width="180" height="56" rx="9" fill="var(--app-surface)" stroke="var(--app-border-strong)"/><text x="560" y="52" font-size="11.5" font-weight="600" fill="var(--app-ink)">Dashboard</text><text x="560" y="68" font-size="8.5" fill="var(--app-muted)">app autenticada</text>
  <rect x="24" y="150" width="182" height="58" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="115" y="174" font-size="11" font-weight="600" fill="var(--app-ink)">Webhooks (entrantes)</text><text x="115" y="190" font-size="8.5" fill="var(--app-muted)">Stripe · Wompi · Zoom</text>
  <rect x="554" y="150" width="182" height="58" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="645" y="174" font-size="11" font-weight="600" fill="var(--app-ink)">Uploads R2 + SCORM</text><text x="645" y="190" font-size="8.5" fill="var(--app-muted)">presign · serve · relay</text>
  <rect x="24" y="300" width="182" height="58" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="115" y="324" font-size="11" font-weight="600" fill="var(--app-ink)">Realtime (Pusher)</text><text x="115" y="340" font-size="8.5" fill="var(--app-muted)">auth → canales privados</text>
  <rect x="290" y="358" width="190" height="56" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="385" y="382" font-size="11" font-weight="600" fill="var(--app-ink)">Certificados (PDF)</text><text x="385" y="398" font-size="8.5" fill="var(--app-muted)">jsPDF · pdf-branding</text>
  <rect x="554" y="300" width="182" height="58" rx="9" fill="var(--app-surface-muted)" stroke="var(--app-border)"/><text x="645" y="324" font-size="11" font-weight="600" fill="var(--app-ink)">Sesión</text><text x="645" y="340" font-size="8.5" fill="var(--app-muted)">JWT refresh · idle logout</text>
  </g>
</svg>`,
      },
      { type: 'subheading', text: 'Subsistemas y dónde viven' },
      {
        type: 'table',
        headers: ['Subsistema', 'Qué hace', 'Dónde vive'],
        rows: [
          ['Borde (middleware)', 'Redirige al host canónico (www.4shine.co), aplica rate limit a los endpoints de auth y bloquea páginas públicas deshabilitadas.', 'src/proxy.ts (middleware de Next.js 16)'],
          ['Sitio público', 'Páginas no autenticadas: landing, diagnóstico, advisers, precios, etc. Renderizadas por el App Router.', 'src/app/* (fuera de /dashboard), components/marketing'],
          ['Catálogo de API', 'Toda la superficie REST: auth, bootstrap, módulos, pagos, cron, uploads, scorm, pusher.', 'src/app/api/v1/**'],
          ['Webhooks', 'Reciben eventos externos para confirmar pagos y cambios de Zoom.', 'api/v1/payments/stripe|wompi/webhook, api/v1/integrations/zoom/webhook'],
          ['Archivos (R2)', 'Genera URLs prefirmadas para subir/descargar archivos directamente desde el cliente.', 'api/v1/uploads/r2/* (+ presign)'],
          ['SCORM', 'Empaqueta y sirve los cursos SCORM dentro de un iframe (cabecera X-Frame-Options SAMEORIGIN).', 'api/v1/uploads/r2/scorm/*, api/v1/scorm/serve/*'],
          ['Realtime', 'Autoriza la conexión a canales privados de Pusher para chat y notificaciones.', 'api/v1/pusher/auth, lib/pusher-*.ts'],
          ['Certificados', 'Genera PDFs de certificado con la marca de la organización.', 'lib/certificate-generator.ts, lib/pdf-branding.ts'],
          ['Sesión', 'Refresca el token de acceso y cierra la sesión por inactividad en el cliente.', 'lib/session-timeout*.ts, api/v1/auth/refresh'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Documentación viva',
        text: 'El detalle fino de cada endpoint y pipeline cambia seguido; conviene mantenerlo cerca del código (comentarios y docs por módulo). Este mapa da la ubicación para encontrarlo rápido.',
      },
    ],
  },
  {
    slug: 'glosario-dominio',
    label: 'Glosario de dominio',
    tagline:
      'Vocabulario del negocio que aparece en el código (roles, fases, scopes), más cómo crear migraciones y el estado de las pruebas.',
    icon: 'BookA',
    category: 'arquitectura',
    blocks: [
      {
        type: 'p',
        text: 'Algunos términos del código no son obvios para alguien nuevo. Esta es la traducción entre el negocio y el código.',
      },
      { type: 'subheading', text: 'Roles' },
      {
        type: 'table',
        headers: ['En código', 'En la UI / negocio'],
        rows: [
          ['lider', 'Líder: participante del programa.'],
          ['mentor', 'Adviser: acompaña a los líderes. OJO: en la interfaz se llama "Adviser", pero en el código y la base de datos el rol es mentor.'],
          ['gestor', 'Gestor: coordina el programa, crea y modera contenido.'],
          ['admin', 'Administrador del sistema.'],
          ['invitado', 'Invitado: cuenta con acceso limitado solo a Descubrimiento.'],
        ],
      },
      { type: 'subheading', text: 'Conceptos del programa' },
      {
        type: 'table',
        headers: ['Término', 'Significado'],
        rows: [
          ['Las 5 fases', 'El recorrido del programa: Descubrimiento → Shine Within → Shine Out → Shine Up → Shine Beyond (~10 semanas).'],
          ['Workbook', 'Cuaderno digital del programa (WB1–WB10) con avance sincronizado. La versión V3 incorpora grabación de voz, transcripción y análisis con IA.'],
          ['Scope (ámbito)', 'Separa el contenido por destino: aprendizaje, metodologia, formacion_mentores (formación de advisers), etc.'],
          ['Audiencia', 'A quién se dirige un contenido: all, lider, lider_suscrito, lider_sin_suscripcion o ishiners (advisers).'],
          ['library_location', 'Dónde aparece un contenido en la biblioteca: cursos o contenidos_libres.'],
          ['Entitlement', 'Derecho otorgado por el plan (p. ej. el número de mentorías 1:1 incluidas).'],
        ],
      },
      { type: 'subheading', text: 'Cómo crear una migración' },
      {
        type: 'bullets',
        items: [
          'Crea un archivo db/migrations/<YYYYMMDD>_<descripcion>.sql.',
          'Escribe SQL idempotente (CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, etc.) para que reaplicarlo sea seguro.',
          'Para tablas nuevas, incluye sus políticas RLS y los grants para el rol de ejecución (app_runtime).',
          'Aplica con npm run db:migrate. Nunca edites una migración ya aplicada: agrega una nueva.',
        ],
      },
      { type: 'subheading', text: 'Pruebas y calidad' },
      {
        type: 'callout',
        tone: 'warn',
        title: 'No hay pruebas automatizadas',
        text: 'Actualmente el proyecto no tiene tests ni framework de pruebas configurado. La red de seguridad antes de cada push es el typecheck (npx tsc --noEmit) y el linter (npm run lint). Introducir pruebas (unitarias de servicios y end-to-end de flujos críticos como login, agendar mentoría o publicar contenido) es una mejora pendiente.',
      },
    ],
  },
];

// ─── Módulos del sistema ─────────────────────────────────────────────────────

const MODULE_SECTIONS: DocSection[] = [
  {
    slug: 'aprendizaje',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, publicar, aprobar, archivar/eliminar y administrar todo el contenido.' },
      { role: 'Gestor', can: 'Crear, editar, publicar/aprobar, archivar y eliminar contenido; administra la biblioteca.' },
      { role: 'Adviser (mentor)', can: 'Ve el contenido publicado dirigido a su audiencia (all / ishiners); puede crear y editar (aportar), pero no publicar ni eliminar.' },
      { role: 'Líder', can: 'Ve y avanza (registra progreso) en el contenido publicado dirigido a su audiencia; no crea contenido.' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Aprendizaje',
    tagline:
      'Biblioteca de contenidos: cursos SCORM, contenidos libres, actividades, tareas, workbooks y certificados.',
    icon: 'BookOpen',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Aprendizaje es la biblioteca central de formación. Los usuarios consumen contenido estructurado, realizan actividades, entregan tareas, avanzan en workbooks y obtienen certificados.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'aprendizaje'],
          ['UI', '/dashboard/aprendizaje (pestañas: Contenidos libres, Cursos, Workbooks)'],
          ['API', '/api/v1/modules/aprendizaje/... (resources, courses, activities, assignments)'],
          ['Feature', 'src/features/aprendizaje/ (service.ts, types, metadata-assistant.ts)'],
          ['Base de datos', 'app_learning (content_items, content_progress, content_tags, content_comments)'],
        ],
      },
      { type: 'subheading', text: 'Tipos de contenido' },
      {
        type: 'bullets',
        items: [
          'Cursos (SCORM): experiencias estructuradas por módulos y recursos internos. content_type = scorm, library_location = cursos.',
          'Contenidos libres: videos, pódcasts, documentos y piezas sueltas. library_location = contenidos_libres.',
          'Actividades (activity): quizzes y evaluaciones autocalificadas; el contenido se configura en Contenido, no tienen archivo/URL propio.',
          'Tareas (assignment): entregas del líder revisadas por adviser/gestor/admin; solo se consumen dentro de un curso.',
          'Workbooks: cuadernos digitales del programa con avance sincronizado (incluye la versión V3 con grabación de voz, transcripción Whisper y análisis IA).',
        ],
      },
      { type: 'subheading', text: 'Visibilidad por audiencia y estado' },
      {
        type: 'bullets',
        items: [
          'Cada contenido tiene un estado (draft, pending_review, published, archived, rejected). Los roles sin gestión solo ven los published.',
          'Cada contenido tiene una audiencia: all (toda la plataforma), lider, lider_suscrito, lider_sin_suscripcion o ishiners (advisers). El listado filtra según el rol del usuario.',
          'show_in_library controla si el contenido aparece en la biblioteca o solo es accesible dentro de un curso / por enlace directo.',
          'El borrado es lógico (deleted_at): los contenidos van a una papelera recuperable en vez de eliminarse de forma irreversible.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Quién gestiona',
        text: 'gestor y admin pueden crear y publicar contenido (canManage). Los advisers (mentor) y líderes consumen contenido publicado y dirigido a su audiencia.',
      },
    ],
  },
  {
    slug: 'mentorias',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, cancelar y aprobar todas las sesiones; ver todo.' },
      { role: 'Gestor', can: 'Administra mentorías: crea/edita/cancela sesiones, aprueba y supervisa.' },
      { role: 'Adviser (mentor)', can: 'Ve y gestiona sus sesiones, publica sus franjas disponibles y registra notas.' },
      { role: 'Líder', can: 'Ve, agenda (consumiendo su paquete del programa o adicionales) y reprograma sus mentorías.' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Mentorías',
    tagline:
      'Sesiones 1:1 y grupales con Zoom, agendamiento, recordatorios, grabación y entitlements del programa.',
    icon: 'Video',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Mentorías gestiona el acompañamiento entre advisers y líderes. Incluye sesiones individuales (1:1) y grupales, con integración a Zoom, agendamiento por franjas disponibles, recordatorios automáticos y consumo de las mentorías incluidas en el plan.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'mentorias'],
          ['UI', '/dashboard/mentorias (programa, grupales, comprar)'],
          ['API', '/api/v1/modules/mentorias/...'],
          ['Feature', 'src/features/mentorias/'],
          ['Base de datos', 'app_mentoring (mentorship_sessions, session_participants, mentor_assignments, session_feedback)'],
        ],
      },
      { type: 'subheading', text: 'Lógica clave' },
      {
        type: 'bullets',
        items: [
          'Sesiones 1:1: el líder elige un adviser y una franja real disponible; la reserva descuenta de las mentorías incluidas del programa o se agenda como adicional.',
          'Sesiones grupales: webinars en vivo, con calendario destacado y vistas de próximas/pasadas.',
          'Zoom: al crear una sesión se genera la reunión (host = adviser) con grabación en la nube y transcripción automática; opcionalmente se admite un enlace manual.',
          'Recordatorios: el cron envía avisos en ventanas configurables por evento (1:1 y grupal), de forma idempotente.',
        ],
      },
    ],
  },
  {
    slug: 'descubrimiento',
    roles: [
      { role: 'Admin', can: 'Control total: ver todos los diagnósticos, gestionar invitaciones y configuración.' },
      { role: 'Gestor', can: 'Realiza y actualiza su diagnóstico; ve resultados.' },
      { role: 'Adviser (mentor)', can: 'Realiza y actualiza su diagnóstico; ve resultados.' },
      { role: 'Líder', can: 'Realiza y actualiza su diagnóstico; ve su informe.' },
      { role: 'Invitado', can: 'Acceso EXCLUSIVO a este módulo: realiza y consulta su diagnóstico (no entra a ningún otro módulo).' },
    ],
    label: 'Descubrimiento',
    tagline:
      'Diagnóstico de liderazgo con IA: puntajes por pilar, informe personalizado y gestión de invitaciones.',
    icon: 'Compass',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Descubrimiento es el diagnóstico de autoevaluación. Califica al participante en pilares de liderazgo, genera un informe personalizado con IA y produce un PDF descargable. También gestiona invitaciones de diagnóstico a personas externas (rol invitado).',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'descubrimiento'],
          ['UI', '/dashboard/descubrimiento (y landing pública /descubrimiento)'],
          ['Feature', 'src/features/descubrimiento/'],
          ['Base de datos', 'app_assessment (assessments, assessment_attempts, pillar_scores)'],
          ['Roles', 'lider y admin; el rol invitado accede únicamente a este módulo'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'El cuestionario produce puntajes por pilar visualizados en un radar.',
          'El informe se genera con IA a partir de las respuestas.',
          'Recordatorio automático por intervalos a quienes inician y no completan el diagnóstico.',
        ],
      },
    ],
  },
  {
    slug: 'networking',
    roles: [
      { role: 'Admin', can: 'Control total: administra y modera conexiones, comunidades y publicaciones.' },
      { role: 'Gestor', can: 'Administra y modera comunidades, conexiones y contenido; puede eliminar.' },
      { role: 'Adviser (mentor)', can: 'Ve el directorio, conecta y participa en comunidades.' },
      { role: 'Líder', can: 'Ve el directorio, conecta y participa en comunidades.' },
      { role: 'Invitado', can: 'Sin acceso (además, se excluye del directorio de contactos).' },
    ],
    label: 'Networking',
    tagline:
      'Grafo social de líderes: conexiones, directorio de perfiles y comunidades con publicaciones.',
    icon: 'Users',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Networking es la capa social. Permite a los líderes conectar entre sí, explorar un directorio de perfiles y participar en comunidades con publicaciones, comentarios y reacciones.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'networking'],
          ['UI', '/dashboard/networking (perfiles, comunidades)'],
          ['Feature', 'src/features/networking/'],
          ['Base de datos', 'app_networking (connections, interest_groups, group_memberships)'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'Conexiones con estados (pendiente / conectado / rechazado).',
          'El directorio muestra a usuarios activos (líderes, advisers, gestores, admins) y excluye a las cuentas con rol invitado.',
          'Comunidades abiertas o cerradas con su propio muro.',
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tablas (app_networking): connections, user_follows, interest_groups, group_memberships, community_posts (con reacciones y comentarios).',
          'Conexión: una solicitud pasa de pending a connected o rejected (también puede quedar blocked). El perfil completo de un líder solo es visible entre usuarios conectados (o para admin).',
          'Comunidades: visibilidad open o closed; roles de membresía owner, moderator y member. Las comunidades "generales" permiten publicar sin ser miembro.',
          'El directorio (people) excluye a las cuentas con rol invitado. Seguir (follow) está limitado a líderes con acceso al programa.',
        ],
      },
    ],
  },
  {
    slug: 'convocatorias',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, aprobar, eliminar y administrar convocatorias.' },
      { role: 'Gestor', can: 'Crea, edita, aprueba y administra convocatorias y postulaciones.' },
      { role: 'Adviser (mentor)', can: 'Solo ver convocatorias.' },
      { role: 'Líder', can: 'Ve convocatorias y se postula; puede solicitar una publicación (flujo de solicitudes). No crea ni edita convocatorias.' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Convocatorias',
    tagline:
      'Tablero de oportunidades: publicaciones de empleo/proyectos y postulaciones con archivos o URL.',
    icon: 'Briefcase',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Convocatorias es el tablero de oportunidades (empleo, proyectos sociales, alianzas y otros). Las organizaciones publican vacantes y los líderes se postulan adjuntando archivos o una URL. Cada oportunidad puede tener un foro de discusión.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'convocatorias'],
          ['UI', '/dashboard/convocatorias (detalle, nueva, solicitar)'],
          ['Feature', 'src/features/convocatorias/'],
          ['Base de datos', 'app_networking (oportunidades y postulaciones)'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'p',
        text: 'Hay dos flujos que conviene no confundir: postular y solicitar.',
      },
      {
        type: 'bullets',
        items: [
          'Postular (convocatoria_applications): un usuario aplica a una convocatoria abierta —una postulación por convocatoria—. El gestor/admin la revisa y la deja approved o rejected, y el postulante recibe notificación.',
          'Solicitar (convocatoria_requests): un líder pide que se publique una convocatoria. La solicitud nace pending y avisa a gestores/admin; al aprobarla se crea o vincula la convocatoria.',
          'Cada convocatoria tiene imágenes, adjuntos, fechas clave, FAQs y un foro propio. Los usuarios pueden activar el aviso de nuevas convocatorias (opt-in).',
        ],
      },
      {
        type: 'table',
        headers: ['Entidad', 'Estados / valores'],
        rows: [
          ['Convocatoria', 'draft · open · closed · suspended (los borradores solo los ven gestor/admin)'],
          ['Tipo', 'laboral · proyecto_social · proveedor · convenio · otra'],
          ['Postulación', 'pending → approved / rejected'],
          ['Solicitud', 'pending → approved / rejected'],
        ],
      },
    ],
  },
  {
    slug: 'mensajes',
    roles: [
      { role: 'Admin', can: 'Control total.' },
      { role: 'Gestor', can: 'Ve, envía, edita/elimina y modera mensajes.' },
      { role: 'Adviser (mentor)', can: 'Ve, envía, edita y elimina sus propios mensajes.' },
      { role: 'Líder', can: 'Ve, envía, edita y elimina sus propios mensajes.' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Mensajes',
    tagline:
      'Mensajería directa entre usuarios: hilos, historial y tiempo real con Pusher.',
    icon: 'MessageSquare',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Mensajes es el chat directo entre usuarios (advisers con líderes, y entre pares). Soporta conversaciones por hilo, historial y entrega en tiempo real mediante canales privados de Pusher.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'mensajes'],
          ['UI', '/dashboard/mensajes'],
          ['Feature', 'src/features/mensajes/'],
          ['Base de datos', 'app_networking (chat_threads, messages)'],
          ['Tiempo real', 'Pusher (canal private-thread-<id>, evento new-message)'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tablas (app_networking): chat_threads (tipo direct/group), thread_participants (guarda last_read_at por usuario) y messages (borrado lógico con deleted_at).',
          'Al abrir un chat se reutiliza el hilo si ya existe entre los dos usuarios (evita duplicados) y se marca como leído (last_read_at = ahora). Los no leídos son los mensajes posteriores a esa marca.',
          'Tiempo real (Pusher): el canal privado private-thread-{id} emite new-message; además se avisa a cada participante por private-user-{id} con thread-updated. La conexión se autoriza en /api/v1/pusher/auth.',
          'El líder solo puede escribir a usuarios con los que está conectado; los demás roles, a cualquier usuario activo. Editar o borrar un mensaje es solo del autor (el borrado es lógico).',
        ],
      },
    ],
  },
  {
    slug: 'workshops',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, aprobar, moderar, eliminar y administrar workshops y órdenes.' },
      { role: 'Gestor', can: 'Crea, edita, aprueba, modera y administra workshops y sus órdenes.' },
      { role: 'Adviser (mentor)', can: 'Ve, se inscribe y compra cupos.' },
      { role: 'Líder', can: 'Ve, se inscribe y compra cupos.' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Workshops',
    tagline:
      'Eventos de formación en vivo o bajo demanda, con inscripción y compra de cupos.',
    icon: 'Presentation',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Workshops son eventos de formación (a menudo de aliados externos), en vivo o bajo demanda. Los líderes los exploran, se inscriben y compran cupos. Incluye FAQ, foro y gestión de órdenes.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'workshops'],
          ['UI', '/dashboard/workshops (detalle, edición, nuevo)'],
          ['Feature', 'src/features/workshops/'],
          ['Pagos', 'Checkout vía Stripe / Wompi (workshop_orders)'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'p',
        text: 'Hay dos caminos según el precio del workshop:',
      },
      {
        type: 'bullets',
        items: [
          'Gratis (precio 0): la inscripción es directa y crea la asistencia como registered.',
          'De pago (precio > 0): se crea una orden (workshop_orders), se va al checkout con Stripe o Wompi, y un webhook confirma el pago, marca la orden pagada e inscribe al usuario.',
          'Cupos: max_attendees es opcional; si al pagar no hay cupo, el usuario entra en lista de espera (waitlist) y su promoción es manual.',
          'El precio se congela en la orden (subir el precio después no afecta órdenes existentes). El pago es idempotente por (proveedor, referencia); un reembolso marca la orden refunded y cancela la asistencia sin borrar el historial.',
          'Cada workshop tiene FAQs y foro propios.',
        ],
      },
      {
        type: 'table',
        headers: ['Entidad', 'Estados'],
        rows: [
          ['Workshop', 'upcoming · completed · cancelled'],
          ['Orden', 'pending_payment → paid → refunded / cancelled'],
          ['Asistencia', 'invited · registered · waitlist · attended · no_show · cancelled'],
        ],
      },
    ],
  },
  {
    slug: 'lideres',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, eliminar y ver la vista 360 de cualquier líder.' },
      { role: 'Gestor', can: 'Administra líderes (crear, editar, eliminar), ve la 360 y agenda mentorías on-behalf.' },
      { role: 'Adviser (mentor)', can: 'Ve y actualiza la vista 360 de sus líderes; agenda 1:1 on-behalf. No crea ni elimina.' },
      { role: 'Líder', can: 'Sin acceso (es el sujeto de la vista, no la gestiona).' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Líderes (vista 360)',
    tagline:
      'Perfil 360 del líder: workbooks, diagnóstico y mentorías; agendamiento on-behalf desde el admin.',
    icon: 'UserCog',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'El módulo Líderes ofrece la vista 360 de cada líder: un panorama de su avance (workbooks, diagnóstico, mentorías) y la capacidad de agendar mentorías 1:1 en su nombre desde el panel.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'lideres'],
          ['UI', '/dashboard/lideres (lista y /dashboard/lideres/<userId> detalle 360)'],
          ['Feature', 'src/features/lideres/'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'El snapshot del líder expone el total de mentorías incluidas del programa y la próxima a consumir.',
          'Agendar 1:1 on-behalf puede descontar del paquete del programa o crear una sesión adicional.',
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'La vista 360 agrega en tiempo real (sin caché) datos de 8 dominios: perfil, workbooks, diagnóstico, mentorías, contenido, networking, convocatorias y workshops. Al abrirla se provisionan los workbooks del líder si faltan.',
          'Mentorías incluidas del programa: viven en user_program_mentorships con estados available, scheduled, completed o locked, ordenadas por secuencia.',
          'Cadencia de 10 días: una mentoría agendada bloquea la siguiente durante 10 días desde su inicio. La "próxima a consumir" indica si ya es agendable o la fecha en que se desbloquea.',
          'Agendar on-behalf (solo admin/gestor/adviser): modo "programa" (consume un entitlement, valida la secuencia, reserva la franja del adviser, crea la reunión de Zoom y notifica) o "manual" (sesión adicional sin consumir el paquete).',
        ],
      },
    ],
  },
  {
    slug: 'notificaciones',
    roles: [
      { role: 'Admin', can: 'Control total: plantillas, eventos, envíos masivos, popups y recordatorios.' },
      { role: 'Gestor', can: 'Ve, edita y administra plantillas y configuración (no crea de cero, elimina ni aprueba).' },
      { role: 'Adviser / Líder / Invitado', can: 'Sin acceso (es un módulo de administración). Sí reciben las notificaciones.' },
    ],
    label: 'Mensajes y Notificaciones',
    tagline:
      'Plantillas, eventos por módulo, canales (email/in-app), recordatorios y envíos masivos.',
    icon: 'Bell',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'El sistema de notificaciones gestiona las comunicaciones automáticas y manuales. Define plantillas con variables dinámicas, asigna plantillas a eventos del sistema por módulo, controla los canales de envío (email e in-app) y permite envíos masivos segmentados.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'notificaciones'],
          ['UI', '/dashboard/administracion/notificaciones (plantillas, eventos, enviar, historial, popups, recordatorios)'],
          ['Feature', 'src/features/notificaciones/'],
          ['Base de datos', 'app_admin (notification_templates, notification_event_configs) + app_core.notifications'],
          ['Canales', 'In-app (persistente + Pusher) y email (Nodemailer SMTP)'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'Plantillas con variables tipo {{variable}} y vista previa en tiempo real.',
          'Configuración por evento: qué plantilla, qué canales y quién recibe.',
          'Ventanas de recordatorio configurables por evento (sesiones 1:1 y grupales).',
          'Envío masivo segmentado por plan, días de suscripción, rol, país, etc.',
        ],
      },
    ],
  },
  {
    slug: 'analitica',
    roles: [
      { role: 'Admin', can: 'Control total de reportes y exportaciones.' },
      { role: 'Gestor', can: 'Ve y administra los reportes y dashboards.' },
      { role: 'Adviser / Líder / Invitado', can: 'Sin acceso.' },
    ],
    label: 'Analítica',
    tagline:
      'Dashboards y KPIs por módulo con filtro de periodo y exportación a Excel/PDF.',
    icon: 'BarChart3',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Analítica reúne métricas reales de cada módulo, con alcance por organización y rango de fechas. Presenta KPIs y gráficas (área, barras, dona, radar) en pestañas por módulo, con presets de periodo.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'analitica'],
          ['UI', '/dashboard/analitica'],
          ['API', '/api/v1/modules/analitica?from&to'],
          ['Feature', 'src/features/analitica/'],
          ['Exportación', 'Excel multi-hoja (xlsx) y PDF con marca (jsPDF)'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'Cubre Usuarios, Mentorías, Descubrimiento, Aprendizaje, Networking, Convocatorias y Workshops.',
          'Métricas como usuarios activos/nuevos, distribución por rol/plan/país, completitud y asistencia.',
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'No tiene tablas propias: getAnalytics ejecuta consultas SQL en vivo sobre los esquemas de cada módulo, acotadas a la organización del usuario.',
          'Rango de fechas: por defecto los últimos 90 días, configurable con ?from y ?to (ISO).',
          'Devuelve KPIs y series temporales por módulo: usuarios (activos/nuevos, por rol/plan/país, vigencia), mentorías (por estado/tipo, asistencia), descubrimiento (completitud, promedio por pilar), aprendizaje (avance de workbooks, contenido por tipo/estado), networking, convocatorias y workshops.',
          'La UI exporta a Excel (una hoja por módulo) y PDF con marca.',
        ],
      },
    ],
  },
  {
    slug: 'planes',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, activar/desactivar y eliminar planes.' },
      { role: 'Gestor', can: 'Ve, edita y administra planes (la creación y eliminación quedan en Admin).' },
      { role: 'Adviser / Líder / Invitado', can: 'Sin acceso a la gestión (sí consumen lo que su plan les habilita).' },
    ],
    label: 'Planes y Suscripciones',
    tagline:
      'Gestión dinámica de planes y precios con permisos granulares de acceso por módulo.',
    icon: 'CreditCard',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Planes define las suscripciones y lo que incluye cada una. Mapea cada plan a los módulos y cuotas a los que da acceso (por ejemplo, número de mentorías), con control granular por módulo.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'planes'],
          ['UI', '/dashboard/administracion/planes (lista, detalle, nuevo)'],
          ['Feature', 'src/features/planes/ y src/features/access/ (gating por plan)'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Gating por plan',
        text: 'El acceso efectivo combina permiso de rol (role_module_permissions) y feature gating por plan (módulos y cuotas incluidos en la suscripción del usuario).',
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tablas: app_billing.subscription_plans (catálogo: plan_code, plan_group program/circulo/custom, precio, duration_days, is_active, is_system) y plan_module_features (qué módulos habilita y con qué cuota).',
          'Cada plan enciende o apaga funciones (trayectoria, descubrimiento, aprendizaje_cursos, mentorias_1on1, mentorias_grupales, networking, etc.) y puede fijar una cuota (p. ej. 10 mentorías 1:1).',
          'Gating en runtime (features/access): para un líder, getViewerAccessState lee su plan vigente (no vencido) más las compras puntuales y deriva los permisos efectivos. Con plan asignado, el plan manda; las compras suman acceso (pack de mentorías, diagnóstico).',
          'Los roles no-líder (gestor/adviser/admin) no se limitan por plan; el invitado solo accede a Descubrimiento.',
          'Un plan is_system o con usuarios suscritos no se puede eliminar, solo desactivar.',
        ],
      },
    ],
  },
  {
    slug: 'usuarios',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, suspender y eliminar usuarios; asignar roles, gestionar permisos, sesiones y auditoría.' },
      { role: 'Gestor', can: 'Ve, crea y edita usuarios (p. ej. dar de alta líderes). No elimina ni gestiona la matriz de roles/permisos.' },
      { role: 'Adviser / Líder / Invitado', can: 'Sin acceso.' },
    ],
    label: 'Usuarios, Roles y Permisos',
    tagline:
      'Alta/edición de usuarios, asignación de roles, matriz de permisos, sesiones y auditoría.',
    icon: 'Settings',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Usuarios es la capa central de identidad y acceso: creación, edición, suspensión y eliminación de cuentas, asignación de rol y plan, gestión de sesiones, restablecimiento de contraseñas y revisión de la auditoría. La matriz de permisos define qué puede hacer cada rol en cada módulo.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'usuarios'],
          ['UI', '/dashboard/usuarios (lista, detalle, nuevo) y todo /dashboard/administracion'],
          ['Feature', 'src/features/usuarios/'],
          ['Base de datos', 'app_core.users, app_core.user_profiles, app_auth (roles, sesiones, permisos)'],
          ['Permiso', 'usuarios:view para consultar; usuarios:manage para administrar'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tablas: app_core.users (identidad, primary_role, is_active, organización), app_core.user_profiles (demografía y plan), app_auth.user_credentials (hash, intentos, tokens), app_auth.user_roles y app_auth.refresh_sessions (sesiones).',
          'Alta: createUser inserta en esas tablas; si es líder con plan premium/vip, calcula la vigencia como ahora + duration_days del plan, y puede enviar email de bienvenida con contraseña temporal.',
          'Baja: "suspender" es is_active = false (bloquea el login, conserva los datos). "Eliminar" es un borrado físico irreversible que primero deja un registro en app_admin.deleted_users_log.',
          'Seguridad: cambiar el rol o desactivar a un usuario revoca todas sus sesiones. El reseteo por el admin envía email; el autoservicio usa un token de un solo uso con 1 hora de validez.',
          'Auditoría: las acciones y la bitácora de navegación quedan en app_admin.audit_logs; las sesiones activas (IP, user-agent, en línea) se listan aparte.',
        ],
      },
    ],
  },
  {
    slug: 'contenido',
    roles: [
      { role: 'Admin', can: 'Control total: crear, editar, publicar/aprobar, archivar/eliminar y administrar contenido en todos los ámbitos.' },
      { role: 'Gestor', can: 'Crea, edita, publica/aprueba, archiva, elimina y administra contenido en todos los ámbitos.' },
      { role: 'Adviser / Líder / Invitado', can: 'Sin acceso a la gestión (consumen el contenido desde Aprendizaje).' },
    ],
    label: 'Gestión de Contenido',
    tagline:
      'Administración transversal del contenido (recursos, cursos, actividades, tareas) en todos los ámbitos.',
    icon: 'FolderCog',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Contenido es la administración transversal de la biblioteca: crear, editar, publicar y archivar recursos, cursos, actividades y tareas en todos los ámbitos (aprendizaje, metodología, formación de advisers). Es la cara de gestión de lo que Aprendizaje muestra al usuario final.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'contenido'],
          ['UI', '/dashboard/contenido (y editores de actividad/tarea por contenido)'],
          ['Feature', 'src/features/content/'],
          ['Base de datos', 'app_learning.content_items y tablas relacionadas'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'El ámbito (scope) separa el contenido: aprendizaje, metodología, formación de advisers, etc.',
          'Soporta borrado lógico con papelera y restauración, además del toggle de visibilidad en biblioteca.',
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tabla central app_learning.content_items con: scope (aprendizaje / metodologia / formacion_mentores / formacion_lideres), content_type (video, pdf, scorm, podcast, article, ppt, html, activity, assignment), status, library_location, show_in_library, deleted_at y structure_payload (módulos y recursos de un curso).',
          'Estados: draft → pending_review → published → archived / rejected. Publicar requiere el permiso de aprobar.',
          'Borrado en dos pasos: deleteContent es lógico (deleted_at, va a Papelera), restoreContent lo recupera y purgeContent lo elimina definitivamente (irreversible).',
          'Actividades (content_activities + activity_questions + activity_attempts): quizzes autocalificados con tipos de pregunta single_choice, multiple_choice, true_false, fill_blank, numeric y ordering, con puntaje de aprobación e intentos.',
          'Tareas (content_assignments + assignment_submissions): definen instrucciones, criterios, formatos aceptados y puntaje; las entregas pasan por draft → submitted → graded / rejected / revision_requested.',
        ],
      },
    ],
  },
  {
    slug: 'trayectoria',
    roles: [
      { role: 'Admin', can: 'Control total sobre la configuración del recorrido.' },
      { role: 'Gestor', can: 'Ve y administra la configuración del recorrido.' },
      { role: 'Adviser (mentor)', can: 'Ve el recorrido y registra avance.' },
      { role: 'Líder', can: 'Ve su recorrido y registra avance.' },
      { role: 'Invitado', can: 'Sin acceso.' },
    ],
    label: 'Trayectoria',
    tagline:
      'El recorrido de 10 semanas en 5 fases que agrega el avance de workbooks, diagnóstico y mentorías.',
    icon: 'Map',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Trayectoria muestra el recorrido del programa, dividido en 5 fases (Descubrimiento → Shine Within → Shine Out → Shine Up → Shine Beyond) a lo largo de ~10 semanas. Agrega el avance del usuario en workbooks, diagnóstico, mentorías y networking.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'trayectoria'],
          ['UI', '/dashboard/trayectoria'],
          ['Feature', 'src/features/trayectoria/ (definición de fases e hitos)'],
        ],
      },
      {
        type: 'p',
        text: 'No tiene servicio propio de escritura: es una vista que compone datos de otros módulos (workbooks, descubrimiento, mentorías).',
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Es de solo lectura: no tiene tablas ni servicio de escritura. La definición de fases e hitos vive en código (journey-leader.ts).',
          '5 fases sobre ~24 semanas: Descubrimiento (semana 1), Shine Within (WB1–3), Shine Out (WB4–6), Shine Up (WB7–8) y Shine Beyond (WB9–10).',
          'El avance global se calcula promediando la completitud de los hitos (diagnóstico + WB1..WB10) con computeRouteProgressPercent, tomando datos de descubrimiento, workbooks y mentorías.',
        ],
      },
    ],
  },
  {
    slug: 'perfil',
    roles: [
      { role: 'Admin', can: 'Control total; además ve/edita su propio perfil.' },
      { role: 'Gestor', can: 'Ve y edita su propio perfil.' },
      { role: 'Adviser (mentor)', can: 'Ve y edita su propio perfil.' },
      { role: 'Líder', can: 'Ve y edita su propio perfil.' },
      { role: 'Invitado', can: 'Sin acceso al perfil completo.' },
    ],
    label: 'Perfil',
    tagline:
      'Perfil propio del usuario: bio, profesión, enlaces, demografía, ubicación y avatar.',
    icon: 'IdCard',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Perfil permite a cada usuario editar y consultar sus propios datos: biografía, profesión, enlaces sociales, demografía, ubicación y avatar. Incluye extracción de datos desde un CV.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Clave de módulo', 'perfil'],
          ['UI', '/dashboard/perfil'],
          ['Feature', 'src/features/perfil/'],
          ['Base de datos', 'app_core.user_profiles'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tablas: app_core.user_profiles (profesión, industria, bio, país, job_role, género, años de experiencia, redes), app_core.user_interests y app_core.user_projects (máx. 8). Si el usuario es adviser, app_mentoring.mentors (experiencia, precio de sesión, temas por pilar).',
          'Campos validados contra listas blancas: país (21 opciones), job_role (5) y género (3). La demografía es obligatoria en el primer ingreso (onboarding).',
          'Extracción desde CV: se sube un archivo (.docx o texto), se extrae el texto y se envía a OpenAI (temperatura baja) para inferir y normalizar los campos del perfil —incluidos proyectos e intereses—. Usa las credenciales de OpenAI de Integraciones.',
        ],
      },
    ],
  },
  {
    slug: 'site-builder',
    roles: [
      { role: 'Admin', can: 'Control total del sitio público (páginas, bloques, visibilidad). Protegido por usuarios:manage.' },
      { role: 'Gestor / Adviser / Líder / Invitado', can: 'Sin acceso.' },
    ],
    label: 'Site Builder',
    tagline:
      'CMS por bloques (tipo Elementor) para el sitio público, gestionado desde Administración → Site.',
    icon: 'Globe',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Site Builder es el CMS por bloques del sitio público: permite componer y administrar páginas (home, diagnóstico, metodología, precios, afiliados) con secciones reutilizables (hero, features, CTA, testimonios, lista de advisers, footer).',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['UI', '/dashboard/administracion/site (lista y /site/<pageId> editor)'],
          ['Base de datos', 'app_admin (site_pages)'],
          ['Acceso', 'Solo admin (usuarios:manage)'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tabla app_admin.site_pages: cada página tiene page_key, slug, navegación (show_in_nav, nav_order), is_visible (gating público) y un array sections (jsonb) con los bloques.',
          'Hay ~25 tipos de bloque: estructura (section por columnas, hero, divider, spacer), contenido (richText, imageText, cards, features, steps, faq, quote, team, gallery, logos), social (testimonials y advisers —dinámico, trae advisers reales—), conversión (cta, banner, pricing), media (video, image) y html avanzado.',
          'El sitio público renderiza las páginas por page_key o slug (lib/site-pages.ts); el borde (proxy.ts) consulta la visibilidad (lib/site-settings.ts) y oculta las páginas deshabilitadas.',
          'Las páginas de sistema no se borran y conservan su slug canónico, salvo que se active use_builder.',
        ],
      },
    ],
  },
  {
    slug: 'formacion-advisers',
    roles: [
      { role: 'Admin', can: 'Control total: gestiona el currículo y consume la formación.' },
      { role: 'Gestor', can: 'Administra la formación de advisers (currículo, aprobaciones, seguimiento) vía gestion_formacion_mentores.' },
      { role: 'Adviser (mentor)', can: 'Consume su formación: ve, hace actividades y entregas (formacion_mentores). No la administra.' },
      { role: 'Líder / Invitado', can: 'Sin acceso.' },
    ],
    label: 'Formación Advisers',
    tagline:
      'Programa de formación para nuevos advisers, con su propio ámbito de contenido y gestión.',
    icon: 'GraduationCap',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'Formación Advisers es el programa estructurado para capacitar a nuevos advisers (mentores). Es un ámbito de aprendizaje separado, con cursos, actividades, workbooks y mentorías propios, gateado por rol.',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['Claves de módulo', 'formacion_mentores (consumo) y gestion_formacion_mentores (administración)'],
          ['UI', '/dashboard/formacion-mentores y /dashboard/gestion-formacion-mentores'],
          ['Base de datos', 'app_learning con scope de formación de advisers'],
        ],
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Reutiliza el sistema de Aprendizaje/Contenido con el scope formacion_mentores (en vez de aprendizaje): mismas tablas (content_items, content_progress, comentarios) y el mismo editor.',
          'Dos caras: el adviser consume su formación en /dashboard/formacion-mentores (ver, comentar, registrar progreso); el gestor/admin la administra y hace seguimiento en /dashboard/gestion-formacion-mentores.',
          'Se sirve por las mismas rutas de Aprendizaje con ?scope=formacion_mentores; los permisos están separados (formacion_mentores para consumir, gestion_formacion_mentores para administrar).',
        ],
      },
    ],
  },
  {
    slug: 'asistente-ia',
    roles: [
      { role: 'Admin', can: 'Configura el asistente (estado, persona, instrucciones, base de conocimiento/FAQs) y revisa conversaciones.' },
      { role: 'Gestor / Adviser / Líder', can: 'Usan el widget del asistente en la app (no lo configuran).' },
      { role: 'Invitado', can: 'Uso limitado según su alcance.' },
    ],
    label: 'Asistente IA (Chatbot)',
    tagline:
      'Chatbot de soporte 360 que responde con contexto del usuario; configurable desde Administración.',
    icon: 'Bot',
    category: 'modulo',
    blocks: [
      {
        type: 'p',
        text: 'El Asistente IA es un chatbot conversacional disponible en la app. Responde preguntas y orienta al usuario tomando contexto de su avance (agenda de mentorías, workbooks, oportunidades, red). Se configura desde Administración → Asistente IA (estado, persona, instrucciones y base de conocimiento/FAQs).',
      },
      {
        type: 'table',
        headers: ['Aspecto', 'Detalle'],
        rows: [
          ['UI', 'Widget in-app + /dashboard/administracion/asistente-ia (configuración)'],
          ['Feature', 'src/features/chatbot/'],
          ['IA', 'OpenAI (modelo configurable, p. ej. gpt-4o)'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Contexto real',
        text: 'El asistente incorpora una "agenda real" con las sesiones 1:1 próximas (incluidas y adicionales) como fuente de verdad para responder sobre lo agendado.',
      },
      { type: 'subheading', text: 'Cómo funciona por dentro' },
      {
        type: 'bullets',
        items: [
          'Tablas: app_admin.chatbot_settings (estado, modelo, persona, instrucciones, mensaje de bienvenida, ventana de contexto), chatbot_faqs (base de conocimiento) y app_core.chatbot_conversations / chatbot_messages (historial por usuario).',
          'Proveedor: OpenAI (modelo configurable, por defecto gpt-4o) usando las credenciales de Integraciones.',
          'Contexto real: en cada conversación se arma un bloque con datos del usuario —plan, agenda de mentorías (incluida la cadencia de 10 días), workbooks, convocatorias, networking, workshops y lista de advisers— más las FAQs y un mapa de rutas. El bot orienta y enlaza, pero no ejecuta acciones.',
          'Briefing proactivo: al abrir el widget genera un resumen de pendientes y sugerencias clicables. El admin revisa conversaciones y métricas desde Administración → Asistente IA.',
        ],
      },
    ],
  },
];

export const DOC_SECTIONS: DocSection[] = [
  ...ARCHITECTURE_SECTIONS,
  ...MODULE_SECTIONS,
];

export function getDocSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((section) => section.slug === slug);
}

export const ARCHITECTURE_SLUGS = ARCHITECTURE_SECTIONS.map((s) => s.slug);
export const MODULE_SLUGS = MODULE_SECTIONS.map((s) => s.slug);
