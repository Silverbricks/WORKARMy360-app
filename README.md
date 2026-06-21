# WorkArmy 2.0

Australian workforce platform — clean rebuild (pnpm + turbo monorepo). One backend, multiple
frontends, shared typed packages. See `docs/CLAUDE.md` for conventions and `docs/roadmap/PHASE-1.md`
for the build plan. Sprint 1 ships the auth + Users slice (register → verify → login → reset).

## Layout

```
apps/backend-api        NestJS REST API (auth slice)
apps/frontend-users     Next.js — workarmy.co (marketing + auth + dashboard stub)
apps/frontend-providers placeholder (Sprint 2)
apps/admin-portal       placeholder (Sprint 6)
apps/mobile-*           placeholder (Phase 3+)
packages/types          shared TS contracts
packages/validation     zod schemas + AU primitives (client + server)
packages/auth           pure auth helpers (hash, jwt, otp, tokens)
packages/sdk            typed API client
packages/ui             design tokens + labels + components
database                Prisma schema / migrations / seed
```

## Prerequisites

- Node 20+ and pnpm 11+ (`corepack enable`).
- A PostgreSQL database. Easiest: a free [Neon](https://neon.tech) project. Or run local Postgres
  via Docker: `docker run -e POSTGRES_PASSWORD=workarmy -e POSTGRES_DB=workarmy -p 5432:5432 -d postgres:16`
  (then `DATABASE_URL=postgresql://postgres:workarmy@localhost:5432/workarmy`).

## Getting started

```bash
cp .env.example .env          # then fill DATABASE_URL (+ DIRECT_URL for Neon) and JWT secrets
pnpm install
pnpm db:generate              # prisma client
pnpm db:migrate               # creates tables (needs DATABASE_URL)
pnpm db:seed                  # seeds the WA-ID counter (first id = WA100001)
pnpm build                    # build shared packages

# run the two apps (separate terminals)
pnpm --filter backend-api dev      # http://localhost:4000/api/v1
pnpm --filter frontend-users dev   # http://localhost:3000
```

In dev, emails (OTP + reset links) print to the **backend** terminal (console email provider) and
Turnstile is disabled, so registration/verification work without external keys.

## Useful commands

```bash
pnpm typecheck                       # type-check the whole workspace
pnpm --filter @workarmy/auth test    # unit tests for the pure auth helpers
pnpm db:studio                       # Prisma Studio (run inside database/)
```

## Troubleshooting

**TLS / corporate proxy** — if `prisma generate` (or `next dev` fetching Google Fonts) fails with
`unable to verify the first certificate`, your machine is behind a TLS-inspecting proxy. Run Node
with the system trust store:

```bash
# bash
export NODE_OPTIONS=--use-system-ca
# PowerShell
$env:NODE_OPTIONS = "--use-system-ca"
```

Then re-run the command. (Requires Node 22+. This repo was verified on Node 24.)

**`ERR_PNPM_IGNORED_BUILDS`** — native build scripts (Prisma, esbuild, sharp) are pre-approved in
`pnpm-workspace.yaml`. If pnpm still reports ignored builds, run `pnpm approve-builds` once.
