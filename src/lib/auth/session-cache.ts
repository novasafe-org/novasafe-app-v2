import type { AuthUser } from "@/lib/api";
import { runtime } from "@/config";

/**
 * In-memory session cache, mirrored across the same tab.
 *
 * The canonical session lives in an HttpOnly cookie that the browser cannot
 * read. SSR hydrates this cache with the current user; client code reads
 * from the cache for things like the topbar avatar and never touches
 * cookies directly. Token-bearing API calls go through server functions.
 *
 * NOTE: this module is isomorphic — it can be imported in server code
 * because all operations are pure JS (no DOM/window access). Per-request
 * memory on the server is discarded after the request completes.
 */

interface ClientSession {
  user: AuthUser;
  /** Whether the cached session is OAuth-pending (rare in the app — we
   *  redirect such users back to auth for completion). */
  pending: boolean;
  pendingProvider?: "google" | "apple";
}

let memorySession: ClientSession | null = null;
const listeners = new Set<(session: ClientSession | null) => void>();

function notify(): void {
  for (const listener of listeners) listener(memorySession);
}

export function setClientSession(session: ClientSession | null): void {
  memorySession = session ? { ...session } : null;
  notify();
}

export function getClientSession(): ClientSession | null {
  return memorySession;
}

export function clearClientSession(): void {
  if (memorySession === null) return;
  memorySession = null;
  notify();
}

export function subscribeToClientSession(
  listener: (session: ClientSession | null) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function assertBrowserSessionContext(): void {
  if (!runtime.isBrowser) {
    throw new Error(
      "[novasafe-app] session-cache browser-only helpers were called from a server context.",
    );
  }
}

export type { ClientSession };
