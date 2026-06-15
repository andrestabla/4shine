/**
 * Traduce los códigos técnicos de audit_logs a lenguaje humano (es) para
 * mostrarlos en el historial de actividad del perfil de usuario.
 */

const ACTION_LABELS: Record<string, string> = {
  // Autenticación / sesión
  auth_login_success: 'Inició sesión',
  auth_login_failed: 'Intento de inicio fallido',
  auth_login_locked: 'Cuenta bloqueada por intentos',
  auth_logout: 'Cerró sesión',
  auth_refresh_success: 'Renovó su sesión',
  auth_self_register: 'Se registró en la plataforma',
  auth_invitado_promoted_to_lider: 'Pasó de invitado a líder',
  auth_me_query: 'Verificó su sesión',
  auth_permissions_query: 'Cargó sus permisos',
  bootstrap_me_load: 'Cargó la plataforma',
  bootstrap_role_load: 'Cargó la plataforma',
  // Navegación
  ui_page_view: 'Visitó una página',
  ui_dashboard_load: 'Abrió el panel',
  // Aprendizaje
  query_learning_resources: 'Exploró aprendizaje',
  query_learning_resource_detail: 'Abrió un contenido',
  update_learning_progress: 'Avanzó en aprendizaje',
  create_learning_comment: 'Comentó en aprendizaje',
  toggle_learning_comment_reaction: 'Reaccionó a un comentario',
  // Descubrimiento
  query_discovery_overview: 'Revisó Descubrimiento',
  query_discovery_session: 'Abrió su diagnóstico',
  discovery_started_by_user: 'Inició su diagnóstico',
  generate_discovery_analysis: 'Generó análisis de diagnóstico',
  regenerate_discovery_report: 'Regeneró su informe',
  share_discovery_session: 'Compartió su diagnóstico',
  // Mentorías
  query_mentorships: 'Revisó mentorías',
  create_mentorship: 'Agendó una mentoría',
  update_mentorship: 'Actualizó una mentoría',
  schedule_program_mentorship: 'Programó una mentoría',
  participate_group_session: 'Participó en sesión grupal',
  create_additional_mentorship_order: 'Compró mentorías adicionales',
  // Networking
  query_connections: 'Revisó sus contactos',
  create_connection: 'Envió una solicitud de contacto',
  update_connection: 'Respondió una solicitud de contacto',
  follow_user: 'Siguió a alguien',
  unfollow_user: 'Dejó de seguir a alguien',
  join_community: 'Se unió a una comunidad',
  leave_community: 'Salió de una comunidad',
  create_community_post: 'Publicó en una comunidad',
  query_communities: 'Exploró comunidades',
  query_people_directory: 'Exploró el directorio',
  // Mensajes
  send_message: 'Envió un mensaje',
  query_messages: 'Revisó sus mensajes',
  query_threads: 'Abrió sus conversaciones',
  // Workshops / convocatorias
  query_workshops: 'Revisó workshops',
  apply_workshop: 'Se inscribió a un workshop',
  list_convocatorias: 'Revisó convocatorias',
  apply_convocatoria: 'Se postuló a una convocatoria',
  // Perfil / cuenta
  query_my_profile: 'Consultó su perfil',
  // Acciones administrativas sobre el usuario
  update_user: 'Su cuenta fue actualizada',
  reset_user_password: 'Se restableció su contraseña',
  send_user_direct_message: 'Recibió un mensaje del equipo',
  bulk_extend_subscription: 'Se amplió su suscripción',
  bulk_force_password_change: 'Se le exigió cambiar la contraseña',
  bulk_revoke_sessions: 'Se cerraron sus sesiones',
};

const MODULE_LABELS: Record<string, string> = {
  usuarios: 'Usuarios',
  aprendizaje: 'Aprendizaje',
  descubrimiento: 'Descubrimiento',
  mentorias: 'Mentorías',
  networking: 'Networking',
  mensajes: 'Mensajes',
  workshops: 'Workshops',
  convocatorias: 'Convocatorias',
  dashboard: 'Inicio',
  trayectoria: 'Trayectoria',
  metodologia: 'Metodología',
  perfil: 'Perfil',
  auth: 'Acceso',
};

/** Convierte un snake_case desconocido en una frase legible como respaldo. */
function humanizeFallback(action: string): string {
  const clean = action.replace(/_/g, ' ').trim();
  if (!clean) return 'Actividad';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeFallback(action);
}

export function moduleLabel(moduleCode: string | null): string {
  if (!moduleCode) return '—';
  return MODULE_LABELS[moduleCode] ?? moduleCode;
}

/** Extrae un detalle corto y legible del changeSummary (path visitado, etc.). */
export function logDetail(changeSummary: Record<string, unknown> | null | undefined): string {
  if (!changeSummary || typeof changeSummary !== 'object') return '';
  const path = (changeSummary as { path?: unknown }).path;
  if (typeof path === 'string' && path.length > 0) {
    return path.replace(/^\/dashboard/, '').replace(/^\//, '') || 'Inicio';
  }
  return '';
}
