export const SESSION_IDLE_LIMIT_MINUTES = 30;
export const SESSION_IDLE_LIMIT_MS = SESSION_IDLE_LIMIT_MINUTES * 60 * 1000;

/**
 * Mientras el usuario esté activo, la sesión se renueva en el servidor cada
 * cierto tiempo aunque no haga peticiones a la API (por ejemplo, viendo un
 * video o grabando en un workbook). Debe ser menor que el límite de
 * inactividad para que el access token nunca caduque con el usuario activo.
 */
export const SESSION_REFRESH_INTERVAL_MINUTES = 15;
export const SESSION_REFRESH_INTERVAL_MS = SESSION_REFRESH_INTERVAL_MINUTES * 60 * 1000;

export const SESSION_IDLE_TIMEOUT_TITLE = 'Tu sesión ha expirado';
export const SESSION_IDLE_TIMEOUT_MESSAGE = `Hemos detectado inactividad por más de ${SESSION_IDLE_LIMIT_MINUTES} minutos. Por motivos de seguridad, es necesario que inicies sesión nuevamente.`;
