/** Web session lifetime — must match `AUTH_COOKIE_MAX_AGE` (30 minutes). */
export const WEB_SESSION_TTL_MS = 30 * 60 * 1000;

const STORAGE_KEY = "ns_session_started_at";

export function markWebSessionStarted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function clearWebSessionStarted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isWebSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const started = Number(raw);
  if (!Number.isFinite(started)) return true;
  return Date.now() - started > WEB_SESSION_TTL_MS;
}

export function webSessionExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const started = Number(raw);
  if (!Number.isFinite(started)) return null;
  return started + WEB_SESSION_TTL_MS;
}
