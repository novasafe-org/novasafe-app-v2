import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import { appConfig } from "./config";
import { renderErrorPage } from "./lib/error-page";

/**
 * SSR runtime instance for the NovaSafe App project.
 *
 * Same shape as `novasafe-auth-v2/src/start.ts` — only the trusted origin
 * differs: this project's server functions are only reachable from
 * `app.novasafe.io` (or `localhost:3002` in dev).
 */

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  secFetchSite: "same-origin",
  origin: appConfig.urls.app,
  referer: true,
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, errorMiddleware],
}));
