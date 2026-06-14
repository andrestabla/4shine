/**
 * Seed: Onboarding Tour steps (is_system).
 * Run: DATABASE_URL=<url> node scripts/seed-tour-steps.mjs
 * Safe to re-run (ON CONFLICT (organization_id, step_key) DO NOTHING).
 */

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows: orgs } = await pool.query(
  `SELECT o.organization_id, u.user_id
   FROM app_core.organizations o
   LEFT JOIN app_core.users u
     ON u.organization_id = o.organization_id AND u.primary_role IN ('admin','gestor')
   ORDER BY o.created_at ASC
   LIMIT 1`,
);

if (!orgs.length) {
  console.error('No organization found. Aborting.');
  process.exit(1);
}

const { organization_id: orgId, user_id: createdBy } = orgs[0];
console.log(`Seeding tour steps for org: ${orgId}`);

const ALL = ['lider', 'mentor', 'gestor', 'admin'];

// step_key, anchorKey, title, bodyHtml, roles
const steps = [
  // ── Bienvenida / Inicio ──────────────────────────────────────────────
  {
    key: 'inicio',
    anchor: 'nav-dashboard',
    title: 'Tu panel de inicio',
    body: '<p>Este es tu <strong>punto de partida</strong>. Aquí ves un resumen de tu progreso, accesos rápidos a tus módulos y novedades de la plataforma. Vuelve aquí siempre que quieras una vista general.</p>',
    roles: ALL,
  },
  // ── Trayectoria ──────────────────────────────────────────────────────
  {
    key: 'trayectoria-lider',
    anchor: 'nav-trayectoria',
    title: 'Tu trayectoria de crecimiento',
    body: '<p>Tu <strong>ruta de desarrollo paso a paso</strong>. Aquí sigues las etapas del programa, ves lo completado y lo que viene a continuación para avanzar como líder.</p>',
    roles: ['lider'],
  },
  // ── Descubrimiento ───────────────────────────────────────────────────
  {
    key: 'descubrimiento-lider',
    anchor: 'nav-descubrimiento',
    title: 'Diagnóstico de liderazgo',
    body: '<p>El módulo de <strong>Descubrimiento</strong> es tu diagnóstico inicial: responde el cuestionario y obtén un informe con tus fortalezas y áreas de mejora según las 4 competencias 4shine.</p>',
    roles: ['lider'],
  },
  {
    key: 'descubrimiento-invitado',
    anchor: 'nav-descubrimiento',
    title: '¡Bienvenido! Empieza por tu diagnóstico',
    body: '<p>Como invitado, tu acceso se centra en <strong>Descubrimiento</strong>. Completa el diagnóstico para conocer tu perfil de liderazgo y recibir tu informe personalizado.</p>',
    roles: ['invitado'],
  },
  // ── Aprendizaje ──────────────────────────────────────────────────────
  {
    key: 'aprendizaje-lider',
    anchor: 'nav-aprendizaje',
    title: 'Aprendizaje a tu ritmo',
    body: '<p>Cursos, contenidos libres y <strong>workbooks interactivos</strong> con grabación de voz y análisis con IA. Avanza a tu ritmo y registra tus reflexiones en cada actividad.</p>',
    roles: ['lider'],
  },
  // ── Metodología ──────────────────────────────────────────────────────
  {
    key: 'metodologia',
    anchor: 'nav-metodologia',
    title: 'La metodología 4shine',
    body: '<p>Consulta el <strong>marco conceptual</strong> del programa: las 4 competencias (Shine Within, Out, Up y Beyond) y los recursos que sustentan tu desarrollo.</p>',
    roles: ALL,
  },
  // ── Mentorías ────────────────────────────────────────────────────────
  {
    key: 'mentorias-lider',
    anchor: 'nav-mentorias',
    title: 'Tus mentorías',
    body: '<p>Agenda y gestiona sesiones <strong>1:1 con tu adviser</strong>, únete a mentorías grupales y compra paquetes adicionales. Aquí ves tu calendario y el historial de sesiones.</p>',
    roles: ['lider'],
  },
  {
    key: 'mentorias-mentor',
    anchor: 'nav-mentorias',
    title: 'Acompaña a tus líderes',
    body: '<p>Como adviser, aquí gestionas tu <strong>disponibilidad</strong>, ves tus sesiones agendadas y haces seguimiento al progreso de los líderes que acompañas.</p>',
    roles: ['mentor'],
  },
  // ── Networking ───────────────────────────────────────────────────────
  {
    key: 'networking',
    anchor: 'nav-networking',
    title: 'Conecta con la comunidad',
    body: '<p>Explora <strong>perfiles, comunidades y conexiones</strong>. Sigue a otros participantes, únete a grupos de interés y amplía tu red dentro del programa.</p>',
    roles: ['lider', 'mentor'],
  },
  // ── Convocatorias ────────────────────────────────────────────────────
  {
    key: 'convocatorias-lider',
    anchor: 'nav-convocatorias',
    title: 'Convocatorias y oportunidades',
    body: '<p>Descubre <strong>convocatorias, retos y oportunidades</strong> abiertas. Postúlate y haz seguimiento al estado de tus aplicaciones.</p>',
    roles: ['lider'],
  },
  // ── Mensajes ─────────────────────────────────────────────────────────
  {
    key: 'mensajes',
    anchor: 'nav-mensajes',
    title: 'Mensajería interna',
    body: '<p>Conversa en tiempo real con tu adviser, gestores y otros participantes. Aquí encuentras todos tus <strong>chats</strong> en un solo lugar.</p>',
    roles: ALL,
  },
  // ── Workshops ────────────────────────────────────────────────────────
  {
    key: 'workshops',
    anchor: 'nav-workshops',
    title: 'Workshops en vivo',
    body: '<p>Inscríbete a <strong>talleres y sesiones grupales</strong>. Consulta fechas, cupos y materiales; algunos pueden requerir pago o quedar en lista de espera.</p>',
    roles: ALL,
  },
  // ── Formación de Advisers (mentor) ───────────────────────────────────
  {
    key: 'formacion-mentores-mentor',
    anchor: 'nav-formacion-mentores',
    title: 'Tu formación como adviser',
    body: '<p>Cursos y recursos para <strong>formarte y certificarte como adviser</strong>. Completa los módulos para habilitar el acompañamiento a líderes.</p>',
    roles: ['mentor'],
  },
  // ── Líderes (gestor/admin) ───────────────────────────────────────────
  {
    key: 'lideres-gestion',
    anchor: 'nav-lideres',
    title: 'Gestión de líderes',
    body: '<p>Supervisa a los <strong>líderes del programa</strong>: su progreso, diagnósticos, mentorías y estado general. Útil para acompañar y reportar.</p>',
    roles: ['gestor', 'admin'],
  },
  // ── Gestión Formación Advisers (gestor/admin) ────────────────────────
  {
    key: 'gestion-formacion',
    anchor: 'nav-gestion-formacion-mentores',
    title: 'Gestión de formación de advisers',
    body: '<p>Administra los <strong>cursos de formación de advisers</strong>: contenidos, inscripciones y avances de quienes se están certificando.</p>',
    roles: ['gestor', 'admin'],
  },
  // ── Contenidos (gestor/admin) ────────────────────────────────────────
  {
    key: 'contenido-gestion',
    anchor: 'nav-contenido',
    title: 'Gestión de contenidos',
    body: '<p>Crea y organiza los <strong>contenidos de la plataforma</strong>: cursos, workbooks, recursos y materiales disponibles para los participantes.</p>',
    roles: ['gestor', 'admin'],
  },
  // ── Analítica (gestor/admin) ─────────────────────────────────────────
  {
    key: 'analitica-gestion',
    anchor: 'nav-analitica',
    title: 'Analítica del programa',
    body: '<p>Métricas y reportes de <strong>uso, progreso y resultados</strong> del programa para tomar decisiones basadas en datos.</p>',
    roles: ['gestor', 'admin'],
  },
  // ── Administración (admin) ───────────────────────────────────────────
  {
    key: 'administracion-panel',
    anchor: 'nav-administracion',
    title: 'Panel de administración',
    body: '<p>El <strong>centro de control</strong> de la plataforma: usuarios, branding, notificaciones, planes, integraciones, site y este mismo tour.</p>',
    roles: ['admin'],
  },
  {
    key: 'usuarios-gestion',
    anchor: 'nav-usuarios',
    title: 'Gestión de usuarios',
    body: '<p>Crea, edita, suspende o elimina usuarios y <strong>asigna roles y planes</strong>. Incluye el log de navegación y auditoría.</p>',
    roles: ['admin'],
  },
  {
    key: 'planes-gestion',
    anchor: 'nav-planes',
    title: 'Planes y precios',
    body: '<p>Define los <strong>planes de suscripción</strong> y el acceso a cada módulo. Lo que configures aquí determina qué ve cada tipo de usuario.</p>',
    roles: ['admin'],
  },
  {
    key: 'branding-gestion',
    anchor: 'nav-branding',
    title: 'Branding y marca',
    body: '<p>Personaliza la <strong>identidad visual</strong>: colores, logo, tipografía, favicon y loader de la plataforma.</p>',
    roles: ['admin'],
  },
  {
    key: 'integraciones-gestion',
    anchor: 'nav-integraciones',
    title: 'Integraciones',
    body: '<p>Conecta servicios externos: <strong>Meet, Calendar, R2, OpenAI/Gemini, SSO de Google, Stripe y Wompi</strong>.</p>',
    roles: ['admin'],
  },
  {
    key: 'site-gestion',
    anchor: 'nav-site',
    title: 'Site público',
    body: '<p>Gestiona las <strong>páginas públicas</strong> del sitio con el editor por bloques: home, diagnóstico, metodología, precios y advisers.</p>',
    roles: ['admin'],
  },
  // ── Barra superior (todos) ───────────────────────────────────────────
  {
    key: 'header-notificaciones',
    anchor: 'header-notifications',
    title: 'Tus notificaciones',
    body: '<p>La <strong>campana</strong> te avisa de mensajes, recordatorios de sesiones y novedades. El número rojo indica cuántas tienes sin leer.</p>',
    roles: [...ALL, 'invitado'],
  },
  {
    key: 'header-perfil',
    anchor: 'header-profile',
    title: 'Tu perfil y suscripción',
    body: '<p>Desde tu <strong>foto de perfil</strong> accedes a tu información profesional, proyectos, intereses y el detalle de tu plan activo.</p>',
    roles: [...ALL, 'invitado'],
  },
  {
    key: 'header-salir',
    anchor: 'header-logout',
    title: 'Cerrar sesión',
    body: '<p>Cuando termines, cierra tu sesión de forma segura desde este botón. ¡Listo! Ya conoces la plataforma. Puedes repetir este tour cuando quieras.</p>',
    roles: [...ALL, 'invitado'],
  },
];

let order = 1;
let inserted = 0;
for (const s of steps) {
  const res = await pool.query(
    `INSERT INTO app_admin.tour_steps
       (organization_id, step_key, anchor_key, title, body_html, visible_roles, sort_order, is_active, is_system, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,true,$8,$8)
     ON CONFLICT (organization_id, step_key) DO NOTHING`,
    [orgId, s.key, s.anchor, s.title, s.body, s.roles, order, createdBy],
  );
  if (res.rowCount > 0) inserted += 1;
  order += 1;
}

console.log(`Done. Inserted ${inserted} new step(s) of ${steps.length} total.`);
await pool.end();
