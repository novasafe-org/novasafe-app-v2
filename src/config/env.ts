import { z } from "zod";

/**
 * Public, browser-safe environment.
 *
 * Reads values from BOTH:
 *   - `import.meta.env.*` (Vite-injected; only `VITE_*` keys are exposed to
 *     the browser, but every key is also visible during SSR)
 *   - `process.env.*` (Node SSR runtime; harmless on the client because we
 *     guard `typeof process` before access)
 *
 * Validation runs once at module load. If a value is malformed the import
 * throws — fail fast, fail loud.
 *
 * IMPORTANT: never put server-only secrets here. Use `env.server.ts` for
 * anything that must not ship in the browser bundle.
 */

type EnvRecord = Record<string, string | undefined>;

const viteEnv: EnvRecord =
  typeof import.meta !== "undefined" && (import.meta as { env?: EnvRecord }).env
    ? ((import.meta as { env: EnvRecord }).env as EnvRecord)
    : {};

const procEnv: EnvRecord =
  typeof process !== "undefined" && process.env ? (process.env as EnvRecord) : {};

const isServer = typeof window === "undefined";

declare global {
  interface Window {
    __NS_PUBLIC_ENV__?: Record<string, string>;
  }
}

function readRuntimeInjected(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = window.__NS_PUBLIC_ENV__?.[key];
  return value != null && value !== "" ? value : undefined;
}

/**
 * SSR prefers `process.env` (server `.env` via docker-compose).
 * Browser prefers `window.__NS_PUBLIC_ENV__` over build-time values.
 */
export function readEnv(key: string, ...aliases: string[]): string | undefined {
  const candidates = [key, ...aliases];

  for (const candidate of candidates) {
    if (!isServer) {
      const fromRuntime = readRuntimeInjected(candidate);
      if (fromRuntime != null) return fromRuntime;
    }

    if (isServer) {
      const fromProc = procEnv[candidate];
      if (fromProc != null && fromProc !== "") return fromProc;
    }

    const fromVite = viteEnv[candidate];
    if (fromVite != null && fromVite !== "") return fromVite;

    if (!isServer) {
      const fromProc = procEnv[candidate];
      if (fromProc != null && fromProc !== "") return fromProc;
    }
  }

  return undefined;
}

const positiveInt = (fallback: number) =>
  z.union([z.string(), z.number(), z.undefined()]).transform((v) => {
    if (v === undefined || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  });

const url = z.string().url("must be a fully-qualified URL (http(s)://…)");

const DEFAULT_PUBLIC_URLS = Object.freeze({
  AUTH_URL: "https://start.novasafe.io",
  LANDING_URL: "https://novasafe.io",
  APP_URL: "https://app.novasafe.io",
  API_URL: "https://mobile-api.novasafe.io",
});

const PublicEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: positiveInt(3002),
  AUTH_URL: url,
  LANDING_URL: url,
  APP_URL: url,
  API_URL: url,
  APP_VERSION: z.string().min(1).default("0.0.0"),
});

const rawPublic = {
  NODE_ENV: readEnv("NODE_ENV", "MODE"),
  PORT: readEnv("PORT", "VITE_PORT"),
  AUTH_URL: readEnv("VITE_AUTH_URL", "AUTH_URL") ?? DEFAULT_PUBLIC_URLS.AUTH_URL,
  LANDING_URL: readEnv("VITE_LANDING_URL", "LANDING_URL") ?? DEFAULT_PUBLIC_URLS.LANDING_URL,
  APP_URL: readEnv("VITE_APP_URL", "APP_URL") ?? DEFAULT_PUBLIC_URLS.APP_URL,
  API_URL: readEnv("VITE_API_URL", "API_URL") ?? DEFAULT_PUBLIC_URLS.API_URL,
  APP_VERSION: readEnv("VITE_APP_VERSION", "APP_VERSION"),
};

let parsed: z.infer<typeof PublicEnvSchema>;
try {
  parsed = PublicEnvSchema.parse(rawPublic);
} catch (err) {
  if (err instanceof z.ZodError) {
    const lines = err.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[novasafe-app] Invalid public environment configuration:\n${lines}\n\n` +
        `Set the missing values in your .env (see .env.example).`,
    );
  }
  throw err;
}

export const env = Object.freeze(parsed);
export type PublicEnv = typeof env;

export const runtime = Object.freeze({
  isBrowser: typeof window !== "undefined",
  isServer: typeof window === "undefined",
  isProduction: env.NODE_ENV === "production",
  isStaging: env.NODE_ENV === "staging",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
});
