// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Dev-server port resolution: PORT > VITE_PORT > 3002.
 * Keeps localhost development environment-driven (matches `src/config/env.ts`).
 */
function resolveDevPort(): number | undefined {
  const raw = process.env.PORT ?? process.env.VITE_PORT;
  if (!raw) return 3002;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3002;
}

/**
 * Build target — defaults to Node.js (TanStack Start's Nitro `node-server`
 * preset) so `pnpm build` produces `.output/server/index.mjs` ready to run
 * inside our Docker image. Set `BUILD_TARGET=cloudflare` in CI to opt back
 * into the Workers build without any code changes.
 */
const useCloudflare = process.env.BUILD_TARGET === "cloudflare";

export default defineConfig({
  cloudflare: useCloudflare ? {} : false,
  tanstackStart: {
    server: { entry: useCloudflare ? "server" : undefined },
  },
  vite: {
    server: {
      port: resolveDevPort(),
    },
    preview: {
      port: resolveDevPort(),
    },
    ssr: {
      noExternal: true,
    },
  },
});
