import { env, runtime } from "./env";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const appConfig = Object.freeze({
  name: "NovaSafe",
  version: env.APP_VERSION,
  surface: "novasafe-app-web",
  urls: Object.freeze({
    landing: trimTrailingSlash(env.LANDING_URL),
    auth: trimTrailingSlash(env.AUTH_URL),
    app: trimTrailingSlash(env.APP_URL),
    api: trimTrailingSlash(env.API_URL),
  }),
  runtime,
});

export type AppConfig = typeof appConfig;
