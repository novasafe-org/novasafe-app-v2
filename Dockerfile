# syntax=docker/dockerfile:1.7
#
# NovaSafe App (app.novasafe.io) — production image.
#
# See `novasafe-auth-v2/Dockerfile` for the rationale and shape — this
# project follows the same two-stage layout and only differs in the set of
# `VITE_*` build-args it accepts (it has no billing/RevenueCat envs since
# the paywall lives in the auth surface).

# -----------------------------------------------------------------------------
# Stage 1 — builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Pin to the same pnpm major/minor that generated `pnpm-lock.yaml`. Using
# `@latest` here previously pulled pnpm 11+, which (a) silently bypasses
# the legacy `package.json#pnpm` block and (b) ships a stricter default
# `minimumReleaseAge` than the lockfile-generation environment, both of
# which break a frozen-lockfile install.
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /app

ARG VITE_APP_URL=https://app.novasafe.io
ARG VITE_AUTH_URL=https://start.novasafe.io
ARG VITE_LANDING_URL=https://novasafe.io
ARG VITE_API_URL=https://api.novasafe.io
ARG VITE_APP_VERSION=0.0.0

ENV NODE_ENV=production \
    VITE_APP_URL=${VITE_APP_URL} \
    VITE_AUTH_URL=${VITE_AUTH_URL} \
    VITE_LANDING_URL=${VITE_LANDING_URL} \
    VITE_API_URL=${VITE_API_URL} \
    VITE_APP_VERSION=${VITE_APP_VERSION}

COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store-app,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

RUN --mount=type=cache,id=pnpm-store-app,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 2 — runner
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

RUN apk add --no-cache tini wget

WORKDIR /app

# Listen on a non-privileged port so we can drop to the unprivileged
# `node` user. Port 3102 is the cluster-wide convention for this service:
# the shared nginx reverse-proxy uses `proxy_pass http://app:3102;` and
# docker-compose maps the same port through to the host (127.0.0.1:3102)
# for on-box debugging.
ENV NODE_ENV=production \
    PORT=3102 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/package.json ./package.json

EXPOSE 3102

# `/` redirects to `/vault`, which redirects to the auth subdomain when
# unauthenticated — both 3xx responses count as "alive" for our purposes.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --spider --method=HEAD http://localhost:${PORT}/ || exit 1

USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "bin/server.mjs"]
