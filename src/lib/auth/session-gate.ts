import type { AuthUser } from "@/lib/api";
import { loadCurrentUserAction, type CurrentUserResult } from "@/lib/auth/server-actions";

/**
 * Short-lived in-memory cache so client-side navigations (vault → settings → vault)
 * do not call `validate-session` on the backend for every sidebar click.
 *
 * The HttpOnly cookie remains the source of truth; this only avoids redundant
 * network hops during a single tab session.
 */

const SESSION_GATE_TTL_MS = 5 * 60 * 1000;

let cached:
  | {
      user: AuthUser;
      fetchedAt: number;
    }
  | null = null;

export function clearAuthGateCache(): void {
  cached = null;
}

export async function ensureAuthenticatedUser(
  currentPath: string,
): Promise<CurrentUserResult> {
  if (cached && Date.now() - cached.fetchedAt < SESSION_GATE_TTL_MS) {
    return { status: "ok", user: cached.user };
  }

  const result = await loadCurrentUserAction({ data: { currentPath } });

  if (result.status === "ok") {
    cached = { user: result.user, fetchedAt: Date.now() };
  } else {
    cached = null;
  }

  return result;
}
