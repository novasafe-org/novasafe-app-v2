import { appConfig } from "./app.config";
import { AUTH_PATH, authConfig, type AuthPath } from "./auth.config";

/**
 * URL builders for cross-subdomain navigation.
 *
 * App-side mirror of the same module in novasafe-auth-v2. The app project
 * uses these helpers to redirect to the auth project (e.g. when the session
 * cookie is missing or invalid).
 */

export interface BuildOptions {
  path?: string;
  next?: string;
  ref?: string;
  query?: Record<string, string | undefined | null>;
}

function applyOptions(url: URL, options?: BuildOptions): URL {
  if (options?.path) {
    const trimmed = options.path.startsWith("/") ? options.path : `/${options.path}`;
    url.pathname = trimmed;
  }
  if (options?.next) url.searchParams.set(authConfig.nextQueryKey, options.next);
  if (options?.ref) url.searchParams.set(authConfig.refQueryKey, options.ref);
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, value);
    }
  }
  return url;
}

function buildAuthUrlAt(path: AuthPath, options?: Omit<BuildOptions, "path">): string {
  const url = new URL(path, appConfig.urls.auth);
  applyOptions(url, options);
  return url.toString();
}

export function buildLoginUrl(options?: Omit<BuildOptions, "path">): string {
  return buildAuthUrlAt(AUTH_PATH.Login, options);
}

export function buildSignupUrl(options?: Omit<BuildOptions, "path">): string {
  return buildAuthUrlAt(AUTH_PATH.Signup, options);
}

export function buildSignupProUrl(options?: Omit<BuildOptions, "path">): string {
  return buildAuthUrlAt(AUTH_PATH.SignupPro, options);
}

/** Authenticated Pro checkout on the auth project. */
export function buildProUrl(options?: Omit<BuildOptions, "path">): string {
  return buildAuthUrlAt(AUTH_PATH.Pro, options);
}

/** @deprecated Use `buildProUrl`. */
export function buildUpgradeUrl(options?: Omit<BuildOptions, "path">): string {
  return buildProUrl(options);
}

/** RevenueCat customer portal on the auth project (subscription management). */
export function buildManageBillingUrl(options?: Omit<BuildOptions, "path">): string {
  return buildAuthUrlAt(AUTH_PATH.BillingManage, options);
}

export function buildAppUrl(options?: BuildOptions): string {
  const url = new URL(appConfig.urls.app);
  applyOptions(url, options);
  return url.toString();
}

export function buildLandingUrl(options?: BuildOptions): string {
  const url = new URL(appConfig.urls.landing);
  applyOptions(url, options);
  return url.toString();
}

/** Sign-in URL with a `next` parameter so the user returns to where they were. */
export function buildLoginRedirectFor(currentUrl?: string): string {
  return buildLoginUrl(currentUrl ? { next: currentUrl } : undefined);
}

export const ROUTES = Object.freeze({
  paths: AUTH_PATH,
  buildLoginUrl,
  buildSignupUrl,
  buildSignupProUrl,
  buildProUrl,
  buildUpgradeUrl,
  buildManageBillingUrl,
  buildAppUrl,
  buildLandingUrl,
  buildLoginRedirectFor,
});

export type Routes = typeof ROUTES;
