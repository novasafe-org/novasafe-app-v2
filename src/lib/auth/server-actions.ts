import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

import { ApiError, authApi, type AuthUser } from "@/lib/api";
import { appConfig, buildLoginRedirectFor } from "@/config";
import { clearSessionCookie, readSessionToken } from "./session.server";

/**
 * Server functions used by the authenticated app project.
 *
 * - `loadCurrentUserAction`: validate the session cookie against the backend
 *   and return either the user or a redirect target. Used from `_app`'s
 *   `beforeLoad` so SSR pages always render with verified auth state.
 * - `logoutAction`: revoke the session and clear the cookie.
 */

export type CurrentUserResult =
  | {
      status: "ok";
      user: AuthUser;
      pendingOtpProvider?: "google" | "apple";
      pendingEmailVerification?: boolean;
    }
  | {
      status: "unauthenticated";
      reason: "missing-cookie" | "invalid-session" | "pending-onboarding";
      redirectTo: string;
    };

export type LogoutResult = { status: "ok" } | { status: "error"; message: string };

/**
 * Build an absolute URL for the current request that is safe to round-trip
 * through `next=`.
 *
 * If the URL doesn't match `appConfig.urls.app`'s origin (e.g. a stale
 * proxy header) we fall back to the bare app origin to keep redirects sane.
 */
function currentRequestUrl(fallbackPath: string | undefined): string {
  try {
    const incoming = getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
    const expected = new URL(appConfig.urls.app);
    if (incoming.host === expected.host) {
      return incoming.toString();
    }
    return new URL(fallbackPath ?? incoming.pathname + incoming.search, expected).toString();
  } catch {
    if (fallbackPath) {
      try {
        return new URL(fallbackPath, appConfig.urls.app).toString();
      } catch {
        /* fall through */
      }
    }
    return appConfig.urls.app;
  }
}

/** Inspect the current request's session cookie and resolve the user. */
export const loadCurrentUserAction = createServerFn({ method: "POST" })
  .inputValidator((input: { currentPath?: string } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<CurrentUserResult> => {
    const buildRedirect = () => buildLoginRedirectFor(currentRequestUrl(data.currentPath));

    const token = readSessionToken();
    if (!token) {
      return {
        status: "unauthenticated",
        reason: "missing-cookie",
        redirectTo: buildRedirect(),
      };
    }

    try {
      const response = await authApi.validateSession(token);

      if (!response.success || !response.user) {
        clearSessionCookie();
        return {
          status: "unauthenticated",
          reason: "invalid-session",
          redirectTo: buildRedirect(),
        };
      }

      // OAuth-pending tokens (e.g. Google flow that hasn't completed OTP)
      // can't access the app yet. Send them back to auth to finish.
      if (response.pendingOtpProvider || response.pendingNovaSafeEmailVerification) {
        return {
          status: "unauthenticated",
          reason: "pending-onboarding",
          redirectTo: buildRedirect(),
        };
      }

      return {
        status: "ok",
        user: response.user,
        pendingOtpProvider: response.pendingOtpProvider,
        pendingEmailVerification: response.pendingNovaSafeEmailVerification,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSessionCookie();
        return {
          status: "unauthenticated",
          reason: "invalid-session",
          redirectTo: buildRedirect(),
        };
      }
      // Don't lock the user out if the backend is briefly unreachable —
      // re-throw so the caller can surface a 5xx to the user.
      console.error("[loadCurrentUserAction] validate-session failed", err);
      throw err;
    }
  });

/** Best-effort logout: revoke server-side session, then clear the cookie. */
export const logoutAction = createServerFn({ method: "POST" }).handler(
  async (): Promise<LogoutResult> => {
    const token = readSessionToken();
    try {
      if (token) {
        await authApi.logout(token).catch(() => undefined);
      }
      return { status: "ok" };
    } finally {
      clearSessionCookie();
    }
  },
);
