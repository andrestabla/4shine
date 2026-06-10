import type { NotificationEventDef, VariableDef, VariableKey } from './types';

// ─── Variable Dictionary ──────────────────────────────────────────────────────

export const VARIABLE_DEFS: Record<VariableKey, VariableDef> = {
  nombre: {
    key: 'nombre',
    label: 'Nombre',
    description: 'Primer nombre del destinatario',
    example: 'María',
  },
  nombre_completo: {
    key: 'nombre_completo',
    label: 'Nombre completo',
    description: 'Nombre completo del destinatario',
    example: 'María González',
  },
  plataforma: {
    key: 'plataforma',
    label: 'Nombre de la plataforma',
    description: 'Nombre configurado de la plataforma',
    example: '4Shine',
  },
  enlace_plataforma: {
    key: 'enlace_plataforma',
    label: 'Enlace a la plataforma',
    description: 'URL principal de la plataforma',
    example: 'https://4shine.co',
  },
  titulo: {
    key: 'titulo',
    label: 'Título',
    description: 'Título del evento o recurso',
    example: 'Sesión de liderazgo estratégico',
  },
  fecha: {
    key: 'fecha',
    label: 'Fecha',
    description: 'Fecha del evento en formato largo',
    example: 'lunes, 20 de mayo de 2026',
  },
  hora: {
    key: 'hora',
    label: 'Hora',
    description: 'Hora del evento',
    example: '10:00 AM',
  },
  descripcion: {
    key: 'descripcion',
    label: 'Descripción',
    description: 'Descripción del evento o recurso',
    example: 'Sesión de retroalimentación sobre los objetivos del trimestre.',
  },
  adviser_nombre: {
    key: 'adviser_nombre',
    label: 'Nombre del Adviser',
    description: 'Nombre del mentor/adviser asignado',
    example: 'Carlos Ruiz',
  },
  lider_nombre: {
    key: 'lider_nombre',
    label: 'Nombre del Líder',
    description: 'Nombre del líder participante',
    example: 'Ana Torres',
  },
  remitente_nombre: {
    key: 'remitente_nombre',
    label: 'Nombre del remitente',
    description: 'Nombre de quien originó el evento',
    example: 'Juan Pérez',
  },
  enlace_sesion: {
    key: 'enlace_sesion',
    label: 'Enlace de sesión',
    description: 'URL para unirse a la sesión (Zoom / Meet)',
    example: 'https://zoom.us/j/123456',
  },
  enlace_gcal: {
    key: 'enlace_gcal',
    label: 'Enlace Google Calendar',
    description: 'URL para agregar el evento a Google Calendar',
    example: 'https://calendar.google.com/render?...',
  },
  enlace_reset: {
    key: 'enlace_reset',
    label: 'Enlace de restablecimiento',
    description: 'URL segura para restablecer la contraseña',
    example: 'https://4shine.co/restablecer?token=...',
  },
  motivo: {
    key: 'motivo',
    label: 'Motivo',
    description: 'Motivo de cancelación o rechazo',
    example: 'El adviser tiene una emergencia personal.',
  },
  nueva_fecha: {
    key: 'nueva_fecha',
    label: 'Nueva fecha propuesta',
    description: 'Fecha alternativa propuesta tras cancelación',
    example: 'miércoles, 22 de mayo de 2026 a las 10:00 AM',
  },
  fecha_cierre: {
    key: 'fecha_cierre',
    label: 'Fecha de cierre',
    description: 'Fecha límite de una convocatoria',
    example: 'viernes, 31 de mayo de 2026',
  },
  categoria: {
    key: 'categoria',
    label: 'Categoría',
    description: 'Categoría del contenido o recurso',
    example: 'Liderazgo',
  },
  grupo: {
    key: 'grupo',
    label: 'Nombre del grupo',
    description: 'Nombre del grupo o chat',
    example: 'Equipo de Innovación',
  },
  solicitante_nombre: {
    key: 'solicitante_nombre',
    label: 'Nombre del solicitante',
    description: 'Nombre de quien envió la solicitud',
    example: 'Laura Méndez',
  },
  conexion_nombre: {
    key: 'conexion_nombre',
    label: 'Nombre de la conexión',
    description: 'Nombre de la persona con quien se estableció la conexión',
    example: 'Roberto Silva',
  },
  codigo_acceso: {
    key: 'codigo_acceso',
    label: 'Código de acceso',
    description: 'Código único de acceso al diagnóstico',
    example: 'JEXK',
  },
  enlace_invitacion: {
    key: 'enlace_invitacion',
    label: 'Enlace de invitación',
    description: 'URL directa para acceder al diagnóstico',
    example: 'https://4shine.co/descubrimiento?inv=...',
  },
  tipo_convocatoria: {
    key: 'tipo_convocatoria',
    label: 'Tipo de convocatoria',
    description: 'Tipo de convocatoria (laboral, proyecto social, etc.)',
    example: 'Laboral',
  },
  objetivo: {
    key: 'objetivo',
    label: 'Objetivo',
    description: 'Objetivo de la convocatoria o solicitud',
    example: 'Vincular líderes con empresas del ecosistema',
  },
  correo: {
    key: 'correo',
    label: 'Correo del usuario',
    description: 'Email del destinatario (útil al enviar credenciales)',
    example: 'maria.gonzalez@empresa.com',
  },
  contrasena: {
    key: 'contrasena',
    label: 'Contraseña inicial',
    description: 'Contraseña asignada/generada al crear la cuenta',
    example: 'Xz9k!2pQ',
  },
  monto: {
    key: 'monto',
    label: 'Monto',
    description: 'Monto del pago formateado con moneda',
    example: '$ 250.000 COP',
  },
  metodo_pago: {
    key: 'metodo_pago',
    label: 'Método de pago',
    description: 'Proveedor de pago usado (Stripe, Wompi, Coordinación manual)',
    example: 'Wompi',
  },
  codigo_reserva: {
    key: 'codigo_reserva',
    label: 'Código de reserva',
    description: 'Identificador corto de la orden',
    example: 'a1b2c3d4',
  },
  motivo_reembolso: {
    key: 'motivo_reembolso',
    label: 'Motivo del reembolso',
    description: 'Razón ingresada por el administrador al reembolsar',
    example: 'Cancelación solicitada por el líder',
  },
  estado_inscripcion: {
    key: 'estado_inscripcion',
    label: 'Estado de inscripción',
    description: 'Si quedó registrado o en lista de espera tras pagar un workshop',
    example: 'Inscrito',
  },
  enlace_workshop: {
    key: 'enlace_workshop',
    label: 'Enlace al workshop',
    description: 'URL al detalle del workshop dentro de la plataforma',
    example: 'https://4shine.co/dashboard/workshops/abc-123',
  },
};

// ─── Event Catalog ────────────────────────────────────────────────────────────

export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  // ── USUARIOS / AUTH ────────────────────────────────────────────────────────
  {
    key: 'auth.welcome',
    moduleCode: 'usuarios',
    moduleLabel: 'Usuarios',
    label: 'Bienvenida a la plataforma',
    description: 'Se envía cuando un nuevo usuario es creado en el sistema.',
    variables: ['nombre', 'plataforma', 'enlace_plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'auth.password_reset',
    moduleCode: 'usuarios',
    moduleLabel: 'Usuarios',
    label: 'Restablecimiento de contraseña',
    description: 'Se envía cuando el usuario solicita restablecer su contraseña.',
    variables: ['nombre', 'plataforma', 'enlace_reset'],
    defaultInAppType: 'alert',
  },
  {
    key: 'auth.invitation',
    moduleCode: 'usuarios',
    moduleLabel: 'Usuarios',
    label: 'Invitación a la plataforma',
    description: 'Se envía cuando el administrador invita a un nuevo usuario.',
    variables: ['nombre', 'plataforma', 'enlace_plataforma', 'remitente_nombre'],
    defaultInAppType: 'info',
  },
  {
    key: 'auth.account_created_by_admin',
    moduleCode: 'usuarios',
    moduleLabel: 'Usuarios',
    label: 'Bienvenida con credenciales (cuenta creada por admin)',
    description: 'Se envía cuando un admin/gestor crea manualmente una cuenta y marca "enviar correo de bienvenida". Incluye el correo y la contraseña inicial para que el usuario pueda ingresar.',
    variables: ['nombre', 'correo', 'contrasena', 'plataforma', 'enlace_plataforma', 'remitente_nombre'],
    defaultInAppType: 'success',
  },

  // ── MENTORIAS ─────────────────────────────────────────────────────────────
  {
    key: 'mentorias.session_scheduled_mentee',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Mentoría agendada (para el Líder)',
    description: 'Se envía al líder cuando su mentoría queda agendada.',
    variables: ['nombre', 'titulo', 'fecha', 'hora', 'adviser_nombre', 'enlace_sesion', 'enlace_gcal', 'plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'mentorias.session_scheduled_mentor',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Mentoría agendada (para el Adviser)',
    description: 'Se envía al adviser cuando un líder agenda una mentoría con él.',
    variables: ['nombre', 'titulo', 'fecha', 'hora', 'lider_nombre', 'enlace_sesion', 'enlace_gcal', 'plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'mentorias.session_cancelled_mentee',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Mentoría cancelada (para el Líder)',
    description: 'Se envía al líder cuando su mentoría es cancelada por el adviser.',
    variables: ['nombre', 'titulo', 'fecha', 'motivo', 'nueva_fecha', 'adviser_nombre', 'plataforma'],
    defaultInAppType: 'alert',
  },
  {
    key: 'mentorias.session_reminder',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Recordatorio de sesión',
    description: 'Recordatorio automático previo al inicio de una sesión.',
    variables: ['nombre', 'titulo', 'fecha', 'hora', 'enlace_sesion', 'plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'mentorias.group_session_joined',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Inscripción a sesión grupal confirmada',
    description: 'Se envía cuando el líder se inscribe a una sesión grupal.',
    variables: ['nombre', 'titulo', 'fecha', 'hora', 'enlace_sesion', 'enlace_gcal', 'plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'mentorias.group_session_published',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Nueva sesión grupal disponible',
    description: 'Se envía cuando se publica una nueva sesión grupal para inscripción.',
    variables: ['nombre', 'titulo', 'fecha', 'hora', 'descripcion', 'plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'mentorias.payment_confirmed',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Pago confirmado (mentoría adicional)',
    description: 'Se envía al líder cuando el webhook del proveedor confirma el pago de una sesión adicional.',
    variables: [
      'nombre',
      'titulo',
      'fecha',
      'hora',
      'adviser_nombre',
      'monto',
      'metodo_pago',
      'codigo_reserva',
      'enlace_sesion',
      'plataforma',
    ],
    defaultInAppType: 'success',
  },
  {
    key: 'mentorias.payment_refunded',
    moduleCode: 'mentorias',
    moduleLabel: 'Mentorías',
    label: 'Pago reembolsado (mentoría adicional)',
    description: 'Se envía al líder cuando un administrador procesa el reembolso de una sesión adicional.',
    variables: [
      'nombre',
      'titulo',
      'adviser_nombre',
      'monto',
      'metodo_pago',
      'codigo_reserva',
      'motivo_reembolso',
      'plataforma',
    ],
    defaultInAppType: 'info',
  },

  // ── WORKSHOPS (pago) ──────────────────────────────────────────────────────
  // Pagos de workshops siguen el mismo patrón que mentorías adicionales:
  // un evento para pago confirmado y otro para reembolso.
  {
    key: 'workshops.payment_confirmed',
    moduleCode: 'workshops',
    moduleLabel: 'Workshops',
    label: 'Pago confirmado (workshop)',
    description: 'Se envía al líder cuando el webhook del proveedor confirma el pago de un workshop. Indica si quedó registrado o en lista de espera.',
    variables: [
      'nombre',
      'titulo',
      'fecha',
      'hora',
      'monto',
      'metodo_pago',
      'codigo_reserva',
      'estado_inscripcion', // 'registered' | 'waitlist'
      'enlace_workshop',
      'plataforma',
    ],
    defaultInAppType: 'success',
  },
  {
    key: 'workshops.payment_refunded',
    moduleCode: 'workshops',
    moduleLabel: 'Workshops',
    label: 'Pago reembolsado (workshop)',
    description: 'Se envía al líder cuando un administrador procesa el reembolso de un workshop pagado.',
    variables: [
      'nombre',
      'titulo',
      'monto',
      'metodo_pago',
      'codigo_reserva',
      'motivo_reembolso',
      'plataforma',
    ],
    defaultInAppType: 'info',
  },

  // ── APRENDIZAJE ───────────────────────────────────────────────────────────
  {
    key: 'aprendizaje.content_published',
    moduleCode: 'aprendizaje',
    moduleLabel: 'Aprendizaje',
    label: 'Nuevo contenido publicado',
    description: 'Se envía cuando se publica un nuevo recurso de aprendizaje.',
    variables: ['nombre', 'titulo', 'categoria', 'descripcion', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'aprendizaje.workbook_completed',
    moduleCode: 'aprendizaje',
    moduleLabel: 'Aprendizaje',
    label: 'Workbook completado',
    description: 'Confirmación para el líder cuando completa un workbook.',
    variables: ['nombre', 'titulo', 'plataforma'],
    defaultInAppType: 'success',
  },

  // ── CONVOCATORIAS ─────────────────────────────────────────────────────────
  {
    key: 'convocatorias.published',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Nueva convocatoria publicada',
    description: 'Se envía a todos los líderes cuando se abre una convocatoria.',
    variables: ['nombre', 'titulo', 'descripcion', 'fecha_cierre', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'convocatorias.application_approved',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Postulación aprobada',
    description: 'Se envía al líder cuando su postulación es aprobada.',
    variables: ['nombre', 'titulo', 'plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'convocatorias.application_rejected',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Postulación rechazada',
    description: 'Se envía al líder cuando su postulación es rechazada.',
    variables: ['nombre', 'titulo', 'motivo', 'plataforma'],
    defaultInAppType: 'alert',
  },
  {
    key: 'convocatorias.request_submitted',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Solicitud enviada (confirmación al líder)',
    description: 'Confirmación al líder cuando envía una solicitud de publicación.',
    variables: ['nombre', 'titulo', 'plataforma', 'enlace_plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'convocatorias.request_received',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Nueva solicitud de convocatoria (para gestores y admin)',
    description: 'Se envía a gestores y administradores cuando un líder solicita publicar una convocatoria.',
    variables: ['nombre', 'lider_nombre', 'titulo', 'descripcion', 'tipo_convocatoria', 'objetivo', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'convocatorias.applied',
    moduleCode: 'convocatorias',
    moduleLabel: 'Convocatorias',
    label: 'Postulación recibida (para el líder)',
    description: 'Confirmación al líder cuando aplica a una convocatoria.',
    variables: ['nombre', 'titulo', 'fecha_cierre', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'success',
  },

  // ── NETWORKING ────────────────────────────────────────────────────────────
  {
    key: 'networking.connection_request',
    moduleCode: 'networking',
    moduleLabel: 'Networking',
    label: 'Solicitud de conexión recibida',
    description: 'Se envía cuando alguien envía una solicitud de conexión.',
    variables: ['nombre', 'solicitante_nombre', 'plataforma'],
    defaultInAppType: 'message',
  },
  {
    key: 'networking.connection_accepted',
    moduleCode: 'networking',
    moduleLabel: 'Networking',
    label: 'Conexión aceptada',
    description: 'Se envía cuando alguien acepta tu solicitud de conexión.',
    variables: ['nombre', 'conexion_nombre', 'plataforma'],
    defaultInAppType: 'success',
  },

  // ── MENSAJES ──────────────────────────────────────────────────────────────
  {
    key: 'mensajes.new_direct_message',
    moduleCode: 'mensajes',
    moduleLabel: 'Mensajes',
    label: 'Nuevo mensaje directo',
    description: 'Se envía cuando se recibe un mensaje directo.',
    variables: ['nombre', 'remitente_nombre', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'message',
  },
  {
    key: 'mensajes.new_group_message',
    moduleCode: 'mensajes',
    moduleLabel: 'Mensajes',
    label: 'Nuevo mensaje en grupo',
    description: 'Se envía cuando hay actividad nueva en un chat grupal.',
    variables: ['nombre', 'remitente_nombre', 'grupo', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'message',
  },

  // ── DESCUBRIMIENTO ────────────────────────────────────────────────────────
  {
    key: 'descubrimiento.invitation',
    moduleCode: 'descubrimiento',
    moduleLabel: 'Descubrimiento',
    label: 'Invitación al diagnóstico',
    description: 'Se envía cuando el administrador invita a alguien a completar el diagnóstico de liderazgo.',
    variables: ['nombre', 'plataforma', 'enlace_invitacion', 'codigo_acceso'],
    defaultInAppType: 'info',
  },
  {
    key: 'descubrimiento.started_admin_alert',
    moduleCode: 'descubrimiento',
    moduleLabel: 'Descubrimiento',
    label: 'Diagnóstico iniciado · alerta a administradores',
    description: 'Se envía a admins/gestores cuando un líder o invitado inicia un diagnóstico DX por primera vez.',
    variables: ['nombre', 'lider_nombre', 'titulo', 'plataforma', 'enlace_plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'descubrimiento.completed',
    moduleCode: 'descubrimiento',
    moduleLabel: 'Descubrimiento',
    label: 'Diagnóstico completado',
    description: 'Se envía al participante cuando finaliza el diagnóstico y sus resultados están listos.',
    variables: ['nombre', 'plataforma', 'enlace_plataforma'],
    defaultInAppType: 'success',
  },
  {
    key: 'descubrimiento.reminder',
    moduleCode: 'descubrimiento',
    moduleLabel: 'Descubrimiento',
    label: 'Recordatorio de diagnóstico pendiente',
    description: 'Se envía manualmente al participante para recordarle que termine su diagnóstico. Incluye el enlace y, para invitados, el código único de acceso (regenerado en cada envío).',
    variables: ['nombre', 'plataforma', 'enlace_plataforma', 'enlace_invitacion', 'codigo_acceso'],
    defaultInAppType: 'alert',
  },

  // ── WORKSHOPS ─────────────────────────────────────────────────────────────
  {
    key: 'workshops.published',
    moduleCode: 'workshops',
    moduleLabel: 'Workshops',
    label: 'Nuevo workshop disponible',
    description: 'Se envía cuando se publica un nuevo workshop.',
    variables: ['nombre', 'titulo', 'fecha', 'descripcion', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'info',
  },
  {
    key: 'workshops.registration_confirmed',
    moduleCode: 'workshops',
    moduleLabel: 'Workshops',
    label: 'Inscripción a workshop confirmada',
    description: 'Confirmación de inscripción a un workshop.',
    variables: ['nombre', 'titulo', 'fecha', 'hora', 'enlace_plataforma', 'plataforma'],
    defaultInAppType: 'success',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const EVENTS_BY_KEY: Record<string, NotificationEventDef> = Object.fromEntries(
  NOTIFICATION_EVENTS.map((e) => [e.key, e]),
);

export const EVENTS_BY_MODULE: Record<string, NotificationEventDef[]> = NOTIFICATION_EVENTS.reduce<
  Record<string, NotificationEventDef[]>
>((acc, event) => {
  (acc[event.moduleCode] ??= []).push(event);
  return acc;
}, {});

export const MODULE_LABELS: Record<string, string> = {
  usuarios: 'Usuarios',
  descubrimiento: 'Descubrimiento',
  mentorias: 'Mentorías',
  aprendizaje: 'Aprendizaje',
  convocatorias: 'Convocatorias',
  networking: 'Networking',
  mensajes: 'Mensajes',
  workshops: 'Workshops',
};
