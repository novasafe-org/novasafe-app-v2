import { serverEnv } from "./env.server";
import { runtime } from "./env";

/**
 * Server-only auth configuration (cookie attributes).
 *
 * Mirror of the same module in novasafe-auth-v2 — both projects must use
 * identical cookie names/domains/options for the cross-subdomain session to
 * survive the redirect from start.* to app.*.
 */

export const authServerConfig = Object.freeze({
  cookie: Object.freeze({
    name: serverEnv.AUTH_COOKIE_NAME,
    domain: serverEnv.AUTH_COOKIE_DOMAIN || undefined,
    secure: serverEnv.AUTH_COOKIE_SECURE,
    sameSite: serverEnv.AUTH_COOKIE_SAMESITE,
    maxAgeSeconds: serverEnv.AUTH_COOKIE_MAX_AGE,
    path: serverEnv.AUTH_COOKIE_PATH,
    httpOnly: true,
  }),
  runtime,
});

export type AuthServerConfig = typeof authServerConfig;
