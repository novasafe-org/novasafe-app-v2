// Production Node server entry for the NovaSafe App project.
//
// See `novasafe-auth-v2/bin/server.mjs` for the rationale — this is the
// same wrapper, just rebranded so log output is service-attributable.

import { serve } from "srvx/node";

const handlerModule = await import("../dist/server/server.js");
const handler = handlerModule.default ?? handlerModule;

if (typeof handler.fetch !== "function") {
  console.error("[novasafe-app] dist/server/server.js does not export a fetch handler.");
  process.exit(1);
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const server = serve({
  fetch: (request) => handler.fetch(request, process.env, {}),
  port: Number.isFinite(port) && port > 0 ? port : 3000,
  hostname,
});

await server.ready();

const banner = `[novasafe-app] listening on http://${hostname}:${server.addr?.port ?? port}`;
console.log(banner);

function shutdown(signal) {
  console.log(`[novasafe-app] received ${signal}, closing…`);
  server.close().finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
