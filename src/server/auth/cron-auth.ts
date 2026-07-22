import { timingSafeEqual } from 'node:crypto';

/**
 * Autenticación de los endpoints de cron.
 *
 * Falla CERRADO: si `CRON_SECRET` no está configurado, se rechaza siempre. La
 * versión anterior caía a comprobar la cabecera `x-vercel-cron`, que la envía el
 * cliente y por tanto cualquiera puede falsificar — en un despliegue sin la
 * variable (preview, un segundo proyecto del mismo repo) bastaba un curl para
 * disparar recordatorios masivos por correo y generaciones de IA, además con
 * contexto de rol admin.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const provided = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${cronSecret}`;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}
