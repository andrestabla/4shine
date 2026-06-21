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
    ],
  },
  {
    slug: 'convocatorias',
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
    ],
  },
  {
    slug: 'mensajes',
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
    ],
  },
  {
    slug: 'workshops',
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
    ],
  },
  {
    slug: 'lideres',
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
    ],
  },
  {
    slug: 'notificaciones',
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
    ],
  },
  {
    slug: 'planes',
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
    ],
  },
  {
    slug: 'usuarios',
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
    ],
  },
  {
    slug: 'contenido',
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
    ],
  },
  {
    slug: 'trayectoria',
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
    ],
  },
  {
    slug: 'perfil',
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
    ],
  },
  {
    slug: 'site-builder',
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
    ],
  },
  {
    slug: 'formacion-advisers',
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
    ],
  },
  {
    slug: 'asistente-ia',
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
          ['IA', 'Modelos de Claude / OpenAI'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Contexto real',
        text: 'El asistente incorpora una "agenda real" con las sesiones 1:1 próximas (incluidas y adicionales) como fuente de verdad para responder sobre lo agendado.',
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
