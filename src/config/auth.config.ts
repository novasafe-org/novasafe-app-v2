/**
 * Auth-related configuration that is safe for the browser bundle.
 * The actual cookie attributes live in `auth.server.ts` (server-only).
 *
 * Path-based routing — every auth screen has a real URL on the auth
 * project (e.g. `/login`, `/signup`, `/signup/pro`). Mirror of the same
 * module in novasafe-auth-v2.
 */

export const AUTH_PATH = {
  Login: "/login",
  Signup: "/signup",
  SignupPro: "/signup/pro",
  Upgrade: "/upgrade",
  BillingManage: "/billing/manage",
} as const;

export type AuthPath = (typeof AUTH_PATH)[keyof typeof AUTH_PATH];

export const authConfig = Object.freeze({
  paths: AUTH_PATH,
  /** Open-redirect-safe `next` parameter (validated by the auth project). */
  nextQueryKey: "next",
  /** Optional analytics ref. Not security-relevant. */
  refQueryKey: "ref",
});

export type AuthConfig = typeof authConfig;
