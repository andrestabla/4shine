"use client";

import {
  SESSION_IDLE_LIMIT_MS,
  SESSION_IDLE_TIMEOUT_MESSAGE,
  SESSION_REFRESH_INTERVAL_MS,
} from "@/lib/session-timeout";

const LAST_ACTIVITY_KEY = "4shine:last-activity-at";
const LAST_REFRESH_KEY = "4shine:last-refresh-at";
const SESSION_MARKER_KEY = "4shine:session-active";
const SESSION_TIMEOUT_NOTICE_KEY = "4shine:session-timeout-notice";

/** Evento que emite cualquier parte de la app para decir "el usuario sigue activo". */
export const SESSION_ACTIVITY_EVENT = "4shine:session-activity";
/** Evento que emite el cliente HTTP cuando el servidor rechaza la sesión por inactividad. */
export const SESSION_EXPIRED_EVENT = "4shine:session-expired";

const ACTIVITY_DISPATCH_THROTTLE_MS = 5000;
let lastActivityDispatchAt = 0;

function hasBrowserContext(): boolean {
  return typeof window !== "undefined";
}

export function trackSessionActivity(at = Date.now()): void {
  if (!hasBrowserContext()) return;

  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  window.sessionStorage.setItem(SESSION_MARKER_KEY, "1");
}

/**
 * Señala actividad del usuario desde componentes que no generan eventos DOM
 * en la ventana principal (contenido SCORM en iframe, grabación de audio,
 * reproducción de video, etc.). Está limitada a una señal cada 5 s, así que
 * puede llamarse con frecuencia sin coste.
 */
export function registerSessionActivity(): void {
  if (!hasBrowserContext()) return;

  const now = Date.now();
  if (now - lastActivityDispatchAt < ACTIVITY_DISPATCH_THROTTLE_MS) return;
  lastActivityDispatchAt = now;

  trackSessionActivity(now);
  window.dispatchEvent(new CustomEvent(SESSION_ACTIVITY_EVENT, { detail: { at: now } }));
}

export function readLastSessionActivity(): number | null {
  if (!hasBrowserContext()) return null;

  const rawValue = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!rawValue) return null;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasTrackedSessionActivity(): boolean {
  if (!hasBrowserContext()) return false;

  return (
    window.sessionStorage.getItem(SESSION_MARKER_KEY) === "1" ||
    readLastSessionActivity() !== null
  );
}

export function isSessionIdleExpired(now = Date.now()): boolean {
  const lastActivity = readLastSessionActivity();
  if (!lastActivity) return false;
  return now - lastActivity >= SESSION_IDLE_LIMIT_MS;
}

export function markSessionRefreshed(at = Date.now()): void {
  if (!hasBrowserContext()) return;
  window.localStorage.setItem(LAST_REFRESH_KEY, String(at));
}

/**
 * True cuando la última renovación de tokens es lo bastante antigua como
 * para que convenga renovar ya, mientras el usuario sigue activo.
 */
export function shouldRefreshSessionProactively(now = Date.now()): boolean {
  if (!hasBrowserContext()) return false;

  const rawValue = window.localStorage.getItem(LAST_REFRESH_KEY);
  const lastRefreshAt = rawValue ? Number(rawValue) : NaN;
  if (!Number.isFinite(lastRefreshAt)) return true;
  return now - lastRefreshAt >= SESSION_REFRESH_INTERVAL_MS;
}

export function clearTrackedSessionActivity(): void {
  if (!hasBrowserContext()) return;

  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  window.localStorage.removeItem(LAST_REFRESH_KEY);
  window.sessionStorage.removeItem(SESSION_MARKER_KEY);
}

export async function tryRestoreSession(): Promise<boolean> {
  if (!hasBrowserContext()) return false;

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) return false;

    trackSessionActivity();
    markSessionRefreshed();
    return true;
  } catch (error) {
    console.error('Session restore failed', error);
    return false;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

export async function tryRefreshSessionFromActivity(): Promise<boolean> {
  if (!hasBrowserContext()) return false;

  const lastActivityAt = readLastSessionActivity();
  if (!lastActivityAt) return false;
  if (Date.now() - lastActivityAt >= SESSION_IDLE_LIMIT_MS) {
    return false;
  }

  // Evita renovaciones concurrentes: el refresh token rota en cada llamada y
  // dos peticiones en paralelo harían que la segunda llegara con un token ya
  // consumido.
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshResponse = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastActivityAt }),
      });

      if (!refreshResponse.ok) {
        return false;
      }

      trackSessionActivity();
      markSessionRefreshed();
      return true;
    } catch (error) {
      console.error("Session refresh failed", error);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function consumeSessionTimeoutNotice(): string | null {
  if (!hasBrowserContext()) return null;

  const notice = window.sessionStorage.getItem(SESSION_TIMEOUT_NOTICE_KEY);
  if (!notice) return null;

  window.sessionStorage.removeItem(SESSION_TIMEOUT_NOTICE_KEY);
  return notice;
}

/**
 * Cierra la sesión en el servidor y limpia el rastro local. Se usa tanto
 * desde el modal de expiración como desde el fallback sin modal.
 */
export async function terminateExpiredSession(): Promise<void> {
  if (!hasBrowserContext()) return;

  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    });
  } catch (error) {
    console.error("Session timeout logout failed", error);
  } finally {
    clearTrackedSessionActivity();
  }
}

/**
 * Expulsa al usuario por inactividad. Primero avisa al UserProvider mediante
 * un evento cancelable: si este lo atiende (muestra el modal y cierra la
 * sesión), no hacemos nada más. Si nadie lo atiende, cerramos sesión y
 * redirigimos al acceso dejando un aviso para que allí se muestre el modal.
 */
export async function redirectToLoginAfterSessionTimeout(): Promise<never> {
  if (!hasBrowserContext()) {
    throw new Error(SESSION_IDLE_TIMEOUT_MESSAGE);
  }

  const event = new CustomEvent(SESSION_EXPIRED_EVENT, { cancelable: true });
  const handledByProvider = !window.dispatchEvent(event);

  if (!handledByProvider) {
    window.sessionStorage.setItem(SESSION_TIMEOUT_NOTICE_KEY, SESSION_IDLE_TIMEOUT_MESSAGE);
    await terminateExpiredSession();
    window.location.assign("/acceso");
  }

  return new Promise<never>(() => {});
}
