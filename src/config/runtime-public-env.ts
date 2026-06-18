/**
 * Serialize validated public env for browser hydration.
 * SSR reads process.env (server .env); the script runs before client bundles load.
 */
import type { PublicEnv } from "./env";

export function buildBrowserRuntimeEnvScript(env: PublicEnv): string {
  const payload: Record<string, string> = {
    VITE_APP_URL: env.APP_URL,
    VITE_AUTH_URL: env.AUTH_URL,
    VITE_LANDING_URL: env.LANDING_URL,
    VITE_API_URL: env.API_URL,
    VITE_APP_VERSION: env.APP_VERSION,
  };

  return `window.__NS_PUBLIC_ENV__=${JSON.stringify(payload)};`;
}
