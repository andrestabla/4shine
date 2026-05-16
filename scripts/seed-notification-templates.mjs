/**
 * Seed: Notification Templates
 * Creates all 20 base notification templates for the organization.
 * Run: DATABASE_URL=<url> node scripts/seed-notification-templates.mjs
 * Safe to re-run (ON CONFLICT DO NOTHING per event_key).
 */

import pg from 'pg';
import { randomUUID } from 'crypto';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── Get org and admin user ───────────────────────────────────────────────────

const { rows: orgs } = await pool.query(
  `SELECT o.organization_id, u.user_id
   FROM app_core.organizations o
   JOIN app_core.users u ON u.organization_id = o.organization_id AND u.primary_role IN ('admin','gestor')
   ORDER BY o.created_at ASC
   LIMIT 1`
);

if (!orgs.length) {
  console.error('No organization or admin user found. Aborting.');
  process.exit(1);
}

const { organization_id: orgId, user_id: createdBy } = orgs[0];
console.log(`Seeding templates for org: ${orgId}`);

// ─── Templates ───────────────────────────────────────────────────────────────

const templates = [
  // ─── USUARIOS ─────────────────────────────────────────────────────────────
  {
    eventKey: 'auth.welcome',
    moduleCode: 'usuarios',
    name: 'Bienvenida a la plataforma',
    description: 'Email y notificación de bienvenida para nuevos usuarios',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: '¡Bienvenido/a a {{plataforma}}, {{nombre}}!',
    bodyHtmlTemplate: `<h2>¡Hola, {{nombre}}! Bienvenido/a a {{plataforma}}</h2>
<p>Nos alegra mucho que estés aquí. {{plataforma}} es tu espacio de crecimiento como líder: diagnósticos de liderazgo, mentorías personalizadas, rutas de aprendizaje y conexiones estratégicas, todo en un solo lugar.</p>
<p>Para comenzar, ingresa a la plataforma, completa tu perfil y explora los módulos disponibles. Tu recorrido de liderazgo empieza ahora.</p>
<p><a href="{{enlace_plataforma}}">Ir a {{plataforma}} →</a></p>
<p>Si tienes alguna pregunta, responde este correo y con gusto te ayudamos.</p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Bienvenido/a a {{plataforma}}. Tu cuenta está lista para que comiences tu recorrido de liderazgo.

Ingresa aquí: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: '¡Bienvenido/a a {{plataforma}}, {{nombre}}!',
    inAppBodyTemplate: 'Tu cuenta está lista. Explora los módulos y comienza tu recorrido de liderazgo.',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard',
  },
  {
    eventKey: 'auth.password_reset',
    moduleCode: 'usuarios',
    name: 'Restablecimiento de contraseña',
    description: 'Email con enlace seguro para restablecer contraseña',
    channelEmail: true,
    channelInApp: false,
    subjectTemplate: 'Restablece tu contraseña en {{plataforma}}',
    bodyHtmlTemplate: `<h2>Solicitud de restablecimiento de contraseña</h2>
<p>Hola {{nombre}}, recibimos una solicitud para restablecer la contraseña de tu cuenta en {{plataforma}}.</p>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña. Este enlace es válido por 24 horas.</p>
<p><a href="{{enlace_reset}}">Restablecer mi contraseña →</a></p>
<p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo la misma.</p>
<p>Por seguridad, nunca compartamos este enlace con nadie.</p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Solicitaste restablecer tu contraseña en {{plataforma}}.

Usa este enlace (válido 24h): {{enlace_reset}}

Si no lo solicitaste, ignora este mensaje.

El equipo de {{plataforma}}`,
    inAppTitleTemplate: '',
    inAppBodyTemplate: '',
    inAppType: 'alert',
    inAppActionUrlTemplate: '',
  },
  {
    eventKey: 'auth.invitation',
    moduleCode: 'usuarios',
    name: 'Invitación a la plataforma',
    description: 'Email de invitación enviado por el administrador a nuevos usuarios',
    channelEmail: true,
    channelInApp: false,
    subjectTemplate: '{{remitente_nombre}} te invita a {{plataforma}}',
    bodyHtmlTemplate: `<h2>Te invitaron a {{plataforma}}</h2>
<p>Hola {{nombre}}, <strong>{{remitente_nombre}}</strong> te ha invitado a unirte a {{plataforma}}, la plataforma de desarrollo de liderazgo.</p>
<p>Acepta la invitación y crea tu cuenta para comenzar tu recorrido de crecimiento.</p>
<p><a href="{{enlace_plataforma}}">Aceptar invitación →</a></p>
<p>Si tienes preguntas, responde este correo.</p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

{{remitente_nombre}} te invitó a unirte a {{plataforma}}.

Crea tu cuenta aquí: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: '',
    inAppBodyTemplate: '',
    inAppType: 'info',
    inAppActionUrlTemplate: '',
  },

  // ─── MENTORÍAS ────────────────────────────────────────────────────────────
  {
    eventKey: 'mentorias.session_scheduled_mentee',
    moduleCode: 'mentorias',
    name: 'Mentoría agendada — Para el Líder',
    description: 'Confirmación al líder cuando su mentoría queda agendada',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: '✓ Mentoría confirmada: {{titulo}}',
    bodyHtmlTemplate: `<h2>Tu mentoría está confirmada, {{nombre}}</h2>
<p>Tu sesión de mentoría ha sido agendada exitosamente. Aquí están los detalles:</p>
<ul>
  <li><strong>Sesión:</strong> {{titulo}}</li>
  <li><strong>Adviser:</strong> {{adviser_nombre}}</li>
  <li><strong>Fecha:</strong> {{fecha}}</li>
  <li><strong>Hora:</strong> {{hora}}</li>
</ul>
<p><a href="{{enlace_sesion}}">Unirme a la sesión →</a></p>
<p><a href="{{enlace_gcal}}">Agregar a Google Calendar →</a></p>
<p>Recuerda llegar puntual y tener tus objetivos de la sesión listos de antemano.</p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Tu mentoría "{{titulo}}" con {{adviser_nombre}} está confirmada.

Fecha: {{fecha}} a las {{hora}}
Enlace: {{enlace_sesion}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Mentoría confirmada: {{titulo}}',
    inAppBodyTemplate: 'Tu sesión con {{adviser_nombre}} es el {{fecha}} a las {{hora}}.',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/mentorias',
  },
  {
    eventKey: 'mentorias.session_scheduled_mentor',
    moduleCode: 'mentorias',
    name: 'Mentoría agendada — Para el Adviser',
    description: 'Notificación al adviser cuando un líder agenda una sesión',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Nueva mentoría agendada: {{titulo}}',
    bodyHtmlTemplate: `<h2>{{lider_nombre}} agendó una mentoría contigo</h2>
<p>Hola {{nombre}}, tienes una nueva sesión de mentoría programada. Aquí están los detalles:</p>
<ul>
  <li><strong>Sesión:</strong> {{titulo}}</li>
  <li><strong>Líder:</strong> {{lider_nombre}}</li>
  <li><strong>Fecha:</strong> {{fecha}}</li>
  <li><strong>Hora:</strong> {{hora}}</li>
</ul>
<p><a href="{{enlace_sesion}}">Ver enlace de la sesión →</a></p>
<p><a href="{{enlace_gcal}}">Agregar a Google Calendar →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

{{lider_nombre}} agendó la sesión "{{titulo}}" contigo.

Fecha: {{fecha}} a las {{hora}}
Enlace: {{enlace_sesion}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Nueva mentoría: {{titulo}}',
    inAppBodyTemplate: '{{lider_nombre}} agendó una sesión para el {{fecha}} a las {{hora}}.',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/mentorias',
  },
  {
    eventKey: 'mentorias.session_cancelled_mentee',
    moduleCode: 'mentorias',
    name: 'Mentoría cancelada — Para el Líder',
    description: 'Notificación al líder cuando el adviser cancela una sesión',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Mentoría cancelada: {{titulo}}',
    bodyHtmlTemplate: `<h2>Tu sesión fue cancelada, {{nombre}}</h2>
<p>Lamentamos informarte que la sesión <strong>{{titulo}}</strong> programada para el <strong>{{fecha}}</strong> ha sido cancelada.</p>
<p><strong>Motivo:</strong> {{motivo}}</p>
<p>{{nouvelle_fecha}}</p>
<p>Puedes reagendar tu sesión directamente desde la plataforma.</p>
<p><a href="{{enlace_plataforma}}">Ir a Mentorías →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Tu sesión "{{titulo}}" del {{fecha}} fue cancelada.
Motivo: {{motivo}}

Puedes reagendar desde la plataforma: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Sesión cancelada: {{titulo}}',
    inAppBodyTemplate: 'La sesión del {{fecha}} fue cancelada. {{motivo}}',
    inAppType: 'alert',
    inAppActionUrlTemplate: '/dashboard/mentorias',
  },
  {
    eventKey: 'mentorias.session_reminder',
    moduleCode: 'mentorias',
    name: 'Recordatorio de sesión',
    description: 'Recordatorio automático antes del inicio de una sesión',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Recordatorio: "{{titulo}}" es hoy a las {{hora}}',
    bodyHtmlTemplate: `<h2>Tu sesión comienza pronto, {{nombre}}</h2>
<p>Este es un recordatorio de que tienes una sesión de mentoría programada para hoy:</p>
<ul>
  <li><strong>Sesión:</strong> {{titulo}}</li>
  <li><strong>Fecha:</strong> {{fecha}}</li>
  <li><strong>Hora:</strong> {{hora}}</li>
</ul>
<p>Asegúrate de estar listo/a unos minutos antes para verificar tu conexión.</p>
<p><a href="{{enlace_sesion}}">Unirme a la sesión →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Recordatorio: tu sesión "{{titulo}}" es hoy a las {{hora}}.

Enlace: {{enlace_sesion}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Tu sesión comienza pronto',
    inAppBodyTemplate: '"{{titulo}}" es hoy a las {{hora}}. ¡Prepárate!',
    inAppType: 'info',
    inAppActionUrlTemplate: '/dashboard/mentorias',
  },
  {
    eventKey: 'mentorias.group_session_joined',
    moduleCode: 'mentorias',
    name: 'Inscripción a sesión grupal confirmada',
    description: 'Confirmación cuando el líder se inscribe a una sesión grupal',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: '✓ Inscripción confirmada: {{titulo}}',
    bodyHtmlTemplate: `<h2>Estás inscrito/a en la sesión grupal, {{nombre}}</h2>
<p>Tu inscripción a la siguiente sesión grupal ha sido confirmada:</p>
<ul>
  <li><strong>Sesión:</strong> {{titulo}}</li>
  <li><strong>Fecha:</strong> {{fecha}}</li>
  <li><strong>Hora:</strong> {{hora}}</li>
</ul>
<p><a href="{{enlace_sesion}}">Ver enlace de la sesión →</a></p>
<p><a href="{{enlace_gcal}}">Agregar a Google Calendar →</a></p>
<p>Te enviaremos un recordatorio antes de que comience.</p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Inscripción confirmada a "{{titulo}}".
Fecha: {{fecha}} a las {{hora}}
Enlace: {{enlace_sesion}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Inscripción confirmada: {{titulo}}',
    inAppBodyTemplate: 'Sesión grupal el {{fecha}} a las {{hora}}. ¡Te esperamos!',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/mentorias',
  },
  {
    eventKey: 'mentorias.group_session_published',
    moduleCode: 'mentorias',
    name: 'Nueva sesión grupal disponible',
    description: 'Notificación cuando se publica una nueva sesión grupal',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Nueva sesión grupal disponible: {{titulo}}',
    bodyHtmlTemplate: `<h2>Nueva sesión grupal disponible, {{nombre}}</h2>
<p>Se ha publicado una nueva sesión grupal que podría interesarte:</p>
<ul>
  <li><strong>Sesión:</strong> {{titulo}}</li>
  <li><strong>Fecha:</strong> {{fecha}}</li>
  <li><strong>Hora:</strong> {{hora}}</li>
</ul>
<p>{{descripcion}}</p>
<p>Los cupos son limitados. Inscríbete antes de que se agoten.</p>
<p><a href="{{enlace_plataforma}}">Ir a Mentorías para inscribirme →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Nueva sesión grupal: "{{titulo}}"
Fecha: {{fecha}} a las {{hora}}

{{descripcion}}

Inscríbete: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Nueva sesión grupal: {{titulo}}',
    inAppBodyTemplate: 'Disponible el {{fecha}} a las {{hora}}. ¡Inscríbete ahora!',
    inAppType: 'info',
    inAppActionUrlTemplate: '/dashboard/mentorias',
  },

  // ─── APRENDIZAJE ──────────────────────────────────────────────────────────
  {
    eventKey: 'aprendizaje.content_published',
    moduleCode: 'aprendizaje',
    name: 'Nuevo contenido publicado',
    description: 'Notificación cuando se publica un nuevo recurso de aprendizaje',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Nuevo contenido en {{plataforma}}: {{titulo}}',
    bodyHtmlTemplate: `<h2>Nuevo recurso de aprendizaje disponible, {{nombre}}</h2>
<p>Acabamos de publicar un nuevo recurso que puede ser valioso para tu desarrollo:</p>
<ul>
  <li><strong>Título:</strong> {{titulo}}</li>
  <li><strong>Categoría:</strong> {{categoria}}</li>
</ul>
<p>{{descripcion}}</p>
<p><a href="{{enlace_plataforma}}">Ir a Aprendizaje →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Nuevo contenido: "{{titulo}}" ({{categoria}})
{{descripcion}}

Ver en: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Nuevo contenido: {{titulo}}',
    inAppBodyTemplate: '{{categoria}} · {{descripcion}}',
    inAppType: 'info',
    inAppActionUrlTemplate: '/dashboard/aprendizaje',
  },
  {
    eventKey: 'aprendizaje.workbook_completed',
    moduleCode: 'aprendizaje',
    name: 'Workbook completado',
    description: 'Confirmación al líder cuando completa un workbook',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: '¡Completaste el workbook "{{titulo}}"!',
    bodyHtmlTemplate: `<h2>¡Felicitaciones, {{nombre}}!</h2>
<p>Completaste exitosamente el workbook <strong>{{titulo}}</strong>. Este es un logro importante en tu camino de desarrollo como líder.</p>
<p>Tu progreso queda registrado en tu perfil. Sigue explorando los demás recursos disponibles en {{plataforma}}.</p>
<p><a href="{{enlace_plataforma}}">Explorar más contenidos →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

¡Completaste el workbook "{{titulo}}"! Excelente avance en tu recorrido.

Explora más: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: '¡Workbook completado! 🎉',
    inAppBodyTemplate: 'Completaste "{{titulo}}". ¡Excelente avance en tu recorrido!',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/aprendizaje',
  },

  // ─── CONVOCATORIAS ────────────────────────────────────────────────────────
  {
    eventKey: 'convocatorias.published',
    moduleCode: 'convocatorias',
    name: 'Nueva convocatoria publicada',
    description: 'Notificación cuando se abre una nueva convocatoria',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Nueva convocatoria abierta: {{titulo}}',
    bodyHtmlTemplate: `<h2>Nueva convocatoria disponible, {{nombre}}</h2>
<p>Hay una nueva oportunidad abierta para ti en {{plataforma}}:</p>
<ul>
  <li><strong>Convocatoria:</strong> {{titulo}}</li>
  <li><strong>Cierre de postulaciones:</strong> {{fecha_cierre}}</li>
</ul>
<p>{{descripcion}}</p>
<p>No dejes pasar esta oportunidad. Las postulaciones cierran pronto.</p>
<p><a href="{{enlace_plataforma}}">Ver convocatoria y postularme →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Nueva convocatoria: "{{titulo}}"
Cierre: {{fecha_cierre}}

{{descripcion}}

Ver más: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Nueva convocatoria: {{titulo}}',
    inAppBodyTemplate: 'Postulaciones abiertas hasta el {{fecha_cierre}}. ¡No te quedes sin cupo!',
    inAppType: 'info',
    inAppActionUrlTemplate: '/dashboard/convocatorias',
  },
  {
    eventKey: 'convocatorias.application_approved',
    moduleCode: 'convocatorias',
    name: 'Postulación aprobada',
    description: 'Notificación al líder cuando su postulación es aprobada',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: '¡Tu postulación fue aprobada! — {{titulo}}',
    bodyHtmlTemplate: `<h2>¡Felicitaciones, {{nombre}}!</h2>
<p>Nos complace informarte que tu postulación a <strong>{{titulo}}</strong> ha sido <strong>aprobada</strong>.</p>
<p>Pronto recibirás más detalles sobre los próximos pasos. Mantente pendiente de tu correo y de las notificaciones en la plataforma.</p>
<p><a href="{{enlace_plataforma}}">Ir a Convocatorias →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

¡Tu postulación a "{{titulo}}" fue aprobada! Felicitaciones.

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Postulación aprobada ✓',
    inAppBodyTemplate: 'Tu postulación a "{{titulo}}" fue aprobada. ¡Felicitaciones!',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/convocatorias',
  },
  {
    eventKey: 'convocatorias.application_rejected',
    moduleCode: 'convocatorias',
    name: 'Postulación no seleccionada',
    description: 'Notificación al líder cuando su postulación no es seleccionada',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Actualización sobre tu postulación a {{titulo}}',
    bodyHtmlTemplate: `<h2>Hola {{nombre}}, gracias por postularte</h2>
<p>Queremos informarte que, tras revisar las postulaciones recibidas para <strong>{{titulo}}</strong>, en esta ocasión tu aplicación no fue seleccionada.</p>
<p><strong>Motivo:</strong> {{motivo}}</p>
<p>Valoramos tu interés y te animamos a estar atento/a a nuevas convocatorias. Tu participación en {{plataforma}} sigue siendo importante para nosotros.</p>
<p><a href="{{enlace_plataforma}}">Ver otras convocatorias →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Tu postulación a "{{titulo}}" no fue seleccionada en esta ocasión.
Motivo: {{motivo}}

Sigue explorando nuevas oportunidades en: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Actualización: {{titulo}}',
    inAppBodyTemplate: 'Tu postulación no fue seleccionada en esta convocatoria.',
    inAppType: 'alert',
    inAppActionUrlTemplate: '/dashboard/convocatorias',
  },

  // ─── NETWORKING ───────────────────────────────────────────────────────────
  {
    eventKey: 'networking.connection_request',
    moduleCode: 'networking',
    name: 'Solicitud de conexión recibida',
    description: 'Notificación cuando alguien envía una solicitud de conexión',
    channelEmail: false,
    channelInApp: true,
    subjectTemplate: '{{solicitante_nombre}} quiere conectar contigo en {{plataforma}}',
    bodyHtmlTemplate: `<h2>Nueva solicitud de conexión, {{nombre}}</h2>
<p><strong>{{solicitante_nombre}}</strong> quiere conectar contigo en {{plataforma}}.</p>
<p>Visita su perfil y acepta la conexión si lo deseas.</p>
<p><a href="{{enlace_plataforma}}">Ver solicitud →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

{{solicitante_nombre}} quiere conectar contigo en {{plataforma}}.

Ver solicitud: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Solicitud de conexión',
    inAppBodyTemplate: '{{solicitante_nombre}} quiere conectar contigo.',
    inAppType: 'message',
    inAppActionUrlTemplate: '/dashboard/networking',
  },
  {
    eventKey: 'networking.connection_accepted',
    moduleCode: 'networking',
    name: 'Conexión aceptada',
    description: 'Notificación cuando alguien acepta tu solicitud de conexión',
    channelEmail: false,
    channelInApp: true,
    subjectTemplate: '{{conexion_nombre}} aceptó tu solicitud de conexión',
    bodyHtmlTemplate: `<h2>¡Nueva conexión, {{nombre}}!</h2>
<p>Buenas noticias: <strong>{{conexion_nombre}}</strong> aceptó tu solicitud de conexión en {{plataforma}}.</p>
<p>Ya pueden intercambiar mensajes y colaborar.</p>
<p><a href="{{enlace_plataforma}}">Ver perfil →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

{{conexion_nombre}} aceptó tu solicitud de conexión.

Ver perfil: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: '¡Nueva conexión!',
    inAppBodyTemplate: '{{conexion_nombre}} aceptó tu solicitud. Ya pueden colaborar.',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/networking',
  },

  // ─── MENSAJES ─────────────────────────────────────────────────────────────
  {
    eventKey: 'mensajes.new_direct_message',
    moduleCode: 'mensajes',
    name: 'Nuevo mensaje directo',
    description: 'Notificación cuando se recibe un mensaje directo',
    channelEmail: false,
    channelInApp: true,
    subjectTemplate: 'Nuevo mensaje de {{remitente_nombre}} en {{plataforma}}',
    bodyHtmlTemplate: `<h2>Tienes un nuevo mensaje, {{nombre}}</h2>
<p><strong>{{remitente_nombre}}</strong> te envió un mensaje en {{plataforma}}.</p>
<p><a href="{{enlace_plataforma}}">Leer mensaje →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

{{remitente_nombre}} te envió un mensaje en {{plataforma}}.

Ver: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Mensaje de {{remitente_nombre}}',
    inAppBodyTemplate: '{{remitente_nombre}} te envió un mensaje directo.',
    inAppType: 'message',
    inAppActionUrlTemplate: '/dashboard/mensajes',
  },
  {
    eventKey: 'mensajes.new_group_message',
    moduleCode: 'mensajes',
    name: 'Nuevo mensaje en grupo',
    description: 'Notificación cuando hay actividad nueva en un chat grupal',
    channelEmail: false,
    channelInApp: true,
    subjectTemplate: 'Nuevo mensaje en {{grupo}} — {{plataforma}}',
    bodyHtmlTemplate: `<h2>Actividad nueva en {{grupo}}, {{nombre}}</h2>
<p><strong>{{remitente_nombre}}</strong> publicó en el grupo <strong>{{grupo}}</strong>.</p>
<p><a href="{{enlace_plataforma}}">Ver mensaje →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

{{remitente_nombre}} publicó en {{grupo}}.

Ver: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Nuevo en {{grupo}}',
    inAppBodyTemplate: '{{remitente_nombre}} tiene un nuevo mensaje en el grupo.',
    inAppType: 'message',
    inAppActionUrlTemplate: '/dashboard/mensajes',
  },

  // ─── WORKSHOPS ────────────────────────────────────────────────────────────
  {
    eventKey: 'workshops.published',
    moduleCode: 'workshops',
    name: 'Nuevo workshop disponible',
    description: 'Notificación cuando se publica un nuevo workshop',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: 'Nuevo workshop en {{plataforma}}: {{titulo}}',
    bodyHtmlTemplate: `<h2>Nuevo workshop disponible, {{nombre}}</h2>
<p>Tenemos un nuevo workshop que podría ser muy valioso para tu desarrollo:</p>
<ul>
  <li><strong>Workshop:</strong> {{titulo}}</li>
  <li><strong>Fecha:</strong> {{fecha}}</li>
</ul>
<p>{{descripcion}}</p>
<p>Los cupos son limitados. Inscríbete cuanto antes.</p>
<p><a href="{{enlace_plataforma}}">Ver workshop e inscribirme →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Nuevo workshop: "{{titulo}}"
Fecha: {{fecha}}
{{descripcion}}

Inscríbete: {{enlace_plataforma}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Nuevo workshop: {{titulo}}',
    inAppBodyTemplate: 'Disponible el {{fecha}}. ¡Inscríbete antes de que se agoten los cupos!',
    inAppType: 'info',
    inAppActionUrlTemplate: '/dashboard/workshops',
  },
  {
    eventKey: 'workshops.registration_confirmed',
    moduleCode: 'workshops',
    name: 'Inscripción a workshop confirmada',
    description: 'Confirmación de inscripción exitosa a un workshop',
    channelEmail: true,
    channelInApp: true,
    subjectTemplate: '✓ Inscripción confirmada: {{titulo}}',
    bodyHtmlTemplate: `<h2>¡Estás inscrito/a, {{nombre}}!</h2>
<p>Tu inscripción al workshop <strong>{{titulo}}</strong> ha sido confirmada. Te esperamos:</p>
<ul>
  <li><strong>Fecha:</strong> {{fecha}}</li>
  <li><strong>Hora:</strong> {{hora}}</li>
</ul>
<p>Te enviaremos el enlace y los materiales previos antes del evento.</p>
<p><a href="{{enlace_plataforma}}">Ver más detalles →</a></p>
<p><strong>El equipo de {{plataforma}}</strong></p>`,
    bodyTextTemplate: `Hola {{nombre}},

Inscripción confirmada a "{{titulo}}".
Fecha: {{fecha}} a las {{hora}}

El equipo de {{plataforma}}`,
    inAppTitleTemplate: 'Inscripción confirmada: {{titulo}}',
    inAppBodyTemplate: 'Workshop el {{fecha}} a las {{hora}}. ¡Te esperamos!',
    inAppType: 'success',
    inAppActionUrlTemplate: '/dashboard/workshops',
  },
];

// ─── Insert ───────────────────────────────────────────────────────────────────

let inserted = 0;
let skipped = 0;

for (const t of templates) {
  const { rowCount } = await pool.query(
    `INSERT INTO app_admin.notification_templates (
      template_id, organization_id, created_by,
      name, description, event_key, module_code,
      channel_email, channel_in_app,
      subject_template, body_html_template, body_text_template,
      in_app_title_template, in_app_body_template,
      in_app_type, in_app_action_url_template,
      is_active, is_system
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6, $7,
      $8, $9,
      $10, $11, $12,
      $13, $14,
      $15, $16,
      true, true
    )
    ON CONFLICT DO NOTHING`,
    [
      randomUUID(), orgId, createdBy,
      t.name, t.description, t.eventKey, t.moduleCode,
      t.channelEmail, t.channelInApp,
      t.subjectTemplate, t.bodyHtmlTemplate, t.bodyTextTemplate,
      t.inAppTitleTemplate, t.inAppBodyTemplate,
      t.inAppType, t.inAppActionUrlTemplate,
    ]
  );

  if (rowCount > 0) {
    console.log(`  ✓ ${t.eventKey}`);
    inserted++;
  } else {
    console.log(`  — ${t.eventKey} (ya existe, omitido)`);
    skipped++;
  }
}

console.log(`\nListo. ${inserted} plantillas creadas, ${skipped} omitidas.`);
await pool.end();
