# syntax=docker/dockerfile:1
# WorkArmy 2.0 backend (NestJS) — builds the pnpm/turbo monorepo and runs the API.
# Used by Railway (Dockerfile builder) and works on any container host.

FROM node:22-slim

# OpenSSL + CA certs are required by the Prisma query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:$PATH"
RUN corepack enable

WORKDIR /repo

# Install with dev deps (needed to build); NODE_ENV is set to production AFTER the
# build so the running container is production but the build still has the toolchain.
COPY . .
RUN pnpm install --frozen-lockfile

# Builds backend-api and its workspace deps, incl. `prisma generate` in @workarmy/database.
RUN pnpm turbo run build --filter=backend-api

ENV NODE_ENV=production

# Railway/Cloud Run inject PORT; main.ts listens on it (defaults to API_PORT locally).
EXPOSE 8080
CMD ["node", "apps/backend-api/dist/main.js"]
