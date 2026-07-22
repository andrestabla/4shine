import { SESSION_IDLE_LIMIT_MINUTES } from '@/lib/session-timeout';

/**
 * Antes había secretos por defecto escritos en el repositorio, y solo un
 * chequeo de NODE_ENV impedía usarlos. Ese valor es idéntico para cualquiera
 * que clone el proyecto: en cualquier despliegue accesible por red que no
 * corriera como "production" —un staging, un contenedor de QA, un `next dev`
 * expuesto— se podían forjar tokens con role 'admin' y entrar sin credenciales.
 *
 * Ahora no hay valor por defecto: si falta el secreto, la aplicación no
 * arranca, sea cual sea el entorno. Para desarrollo local basta definirlos en
 * .env.local con cualquier cadena de 16+ caracteres.
 */
function requiredSecret(value: string | undefined, name: string): string {
  if (value && value.trim().length >= 16) {
    return value;
  }

  throw new Error(
    `Falta la variable de entorno ${name} (mínimo 16 caracteres). ` +
      'Defínela en .env.local para desarrollo y en el proveedor para producción.',
  );
}

let accessSecretCache: string | null = null;
let refreshSecretCache: string | null = null;

export function getAccessSecret(): string {
  if (accessSecretCache) {
    return accessSecretCache;
  }

  accessSecretCache = requiredSecret(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  return accessSecretCache;
}

export function getRefreshSecret(): string {
  if (refreshSecretCache) {
    return refreshSecretCache;
  }

  refreshSecretCache = requiredSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  return refreshSecretCache;
}

export const authConfig = {
  accessTtlSeconds: SESSION_IDLE_LIMIT_MINUTES * 60,
  refreshTtlSeconds: 30 * 24 * 60 * 60,
  lockMaxAttempts: 5,
  lockMinutes: 15,
};
