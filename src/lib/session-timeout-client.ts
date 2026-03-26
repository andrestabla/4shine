"use client";

import {
  SESSION_IDLE_LIMIT_MS,
  SESSION_IDLE_TIMEOUT_MESSAGE,
} from "@/lib/session-timeout";

const LAST_ACTIVITY_KEY = "4shine:last-activity-at";
const SESSION_MARKER_KEY = "4shine:session-active";
const SESSION_TIMEOUT_NOTICE_KEY = "4shine:session-timeout-notice";

function hasBrowserContext(): boolean {
  return typeof window !== "undefined";
}

export function trackSessionActivity(at = Date.now()): void {
  if (!hasBrowserContext()) return;

  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  window.sessionStorage.setItem(SESSION_MARKER_KEY, "1");
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

export function clearTrackedSessionActivity(): void {
  if (!hasBrowserContext()) return;

  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  window.sessionStorage.removeItem(SESSION_MARKER_KEY);
}

export async function tryRefreshSessionFromActivity(): Promise<boolean> {
  if (!hasBrowserContext()) return false;

  const lastActivityAt = readLastSessionActivity();
  if (!lastActivityAt) return false;
  if (Date.now() - lastActivityAt >= SESSION_IDLE_LIMIT_MS) {
    return false;
  }

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
    return true;
  } catch (error) {
    console.error("Session refresh failed", error);
    return false;
  }
}

export function consumeSessionTimeoutNotice(): string | null {
  if (!hasBrowserContext()) return null;

  const notice = window.sessionStorage.getItem(SESSION_TIMEOUT_NOTICE_KEY);
  if (!notice) return null;

  window.sessionStorage.removeItem(SESSION_TIMEOUT_NOTICE_KEY);
  return notice;
}

export async function redirectToLoginAfterSessionTimeout(): Promise<never> {
  if (!hasBrowserContext()) {
    throw new Error(SESSION_IDLE_TIMEOUT_MESSAGE);
  }

  window.sessionStorage.setItem(
    SESSION_TIMEOUT_NOTICE_KEY,
    SESSION_IDLE_TIMEOUT_MESSAGE,
  );

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
    window.location.assign("/");
  }

  return new Promise<never>(() => {});
}
