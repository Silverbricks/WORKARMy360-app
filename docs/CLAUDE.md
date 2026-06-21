# CLAUDE.md — WorkArmy 2.0 build conventions

This file anchors how code is generated in this repo. Read it before writing or changing code.
It is the operational companion to the Master SRS and the approved build plan.

## What WorkArmy is

An Australian workforce platform connecting six participant types — Job Seekers, Employers, Farms,
Contractors, Labour Hire Agencies, Recruitment Agencies — through one marketplace + workforce
management platform. Two public apps over one backend:

- **Users app** — `workarmy.co` — people seeking work + consumers posting tasks (Job Seekers).
- **Providers app** — `platform.workarmy.co` — any org that hires/manages (the other 5 types).
- **Admin portal** — internal verification, moderation, operations.

## The 5 non-negotiable principles

1. **Spec-wide, build-narrow.** Document the whole vision; build ONE vertical end-to-end, then
   clone. Phase 1 launch vertical = Farm. Don't widen scope mid-build.
2. **Small neutral data model.** ONE `persons`, ONE `organisations`, ONE `jobs`, ONE
   `applications`. Participant type, classification, industry, seniority are **attributes/roles ON
   those entities — never separate tables or separate systems.** Do NOT recreate the legacy
   106-table / per-type-profile-table shape.
3. **Terminology lives in a labels layer.** Every user-facing word is a key in `@workarmy/ui`
   labels, decoupled from schema and routes. Renaming "Find Work" → "Job Seeker" is a one-line
   change, never a migration. Routes/columns use stable neutral names (`/work`, `person`,
   `organisation`).
4. **Compliance ≠ profile completeness.** Completeness = % of fields filled (a UX progress metric,
   derived from `persons`/profiles). Compliance = verified legal/credential standing (licences,
   insurance, ABN, right-to-work) stored in `credentials` + `verifications`. Stored, scored and
   displayed **separately**. Never conflate them in code or UI.
5. **Build in vertical slices.** schema → API → screen for ONE feature at a time, each shippable.
   "Backend first" applies WITHIN a slice, not as a months-long API-only phase.

## Monorepo map

```
apps/backend-api        NestJS REST API (the one backend)
apps/frontend-users     Next.js — workarmy.co
apps/frontend-providers Next.js — platform.workarmy.co   (placeholder until Sprint 2)
apps/admin-portal       Next.js — internal               (placeholder)
apps/mobile-*           Expo                              (placeholder, Phase 3+)
packages/types          shared TS DTOs/contracts (framework-free)
packages/validation     zod schemas + AU primitives (client + server)
packages/auth           PURE auth helpers — no Nest, no Prisma, no IO
packages/sdk            typed API client used by all frontends
packages/ui             design tokens + labels layer + components
database                Prisma schema/migrations/seed — owns the DB
docs                    this file, ADRs, roadmap
```

Internal packages are referenced by workspace name: `@workarmy/types`, `@workarmy/validation`,
`@workarmy/auth`, `@workarmy/sdk`, `@workarmy/ui`, `@workarmy/database`. They build to `dist/` and
are consumed as compiled JS + `.d.ts`. Turbo's `^build` ordering builds packages before apps.

### Package boundaries (enforce strictly)
- `@workarmy/auth` is **pure**: hashing, JWT sign/verify, OTP/token generation + hashing. No Nest
  decorators, no Prisma, no `fetch`, no env reads. Unit-testable in isolation.
- `@workarmy/validation` holds every zod schema, shared by client and server. A rule is written
  once and enforced on both sides.
- `@workarmy/types` is framework-free request/response contracts. No zod, no runtime deps.
- `@workarmy/sdk` is the only place that talks HTTP to the backend. Apps never hand-roll `fetch`.
- `@workarmy/ui` owns design tokens, the labels layer, and shared components.
- Persistence + HTTP orchestration live in `apps/backend-api` (NestJS), never in packages.

## Stack

- Backend: NestJS + Prisma + PostgreSQL (Neon). Validation via a `ZodValidationPipe` (no
  class-validator). Migrations in `database/`.
- Frontend: Next.js 15 (App Router) + React 19 + Tailwind CSS v4.
- Auth: JWT **access** token (HS256, short-lived, held in memory by clients) + opaque **refresh**
  token stored hashed in `sessions`, delivered as an httpOnly `wa_refresh` cookie, rotated on
  refresh. Email OTP for verification (hashed, attempt-capped). Password hashing = bcryptjs
  (`PASSWORD_HASHER=argon2` to switch later). Turnstile + email are provider-abstracted (console/
  noop in dev).

## Identity — the WA ID system

Every member (person OR organisation) gets a permanent, immutable WA ID like `WA100001`, allocated
from a **single global atomic counter** (`wa_id_counters`, one `GLOBAL` row, incremented via an
`INSERT … ON CONFLICT DO UPDATE … RETURNING` inside the same transaction that creates the row).
Never reused, never recycled. The legacy `count()+1` approach was race-prone — do not reintroduce
it. WA IDs are the stable internal reference; any human-friendly display id is presentation only.

## Design system (per product owner direction)

Constant chrome, per-account-type accent — so users instantly recognise their context. This
**overrides** the earlier "soft paper" palette; do not reintroduce paper/field-green tokens.

- **Chrome (every page — marketing AND app):** header `#1B1F24` (charcoal, white text); app canvas
  `#F8FAFC`; sidebar + cards `#FFFFFF`; borders `#E5E7EB`. Text: primary `#1E293B`, secondary
  `#64748B`, muted `#94A3B8`.
- **Per-account-type accent** (active nav, primary buttons, highlights — header stays charcoal):
  Job Seeker `#2563EB`, Employer `#BE7327`, Farm `#65A30D`, Contractor `#7C3AED`, Labour Hire
  `#2563EB`, Recruitment Agency `#0891B2`, Super Admin `#4B5563`, Sub Admin `#374151`. The app
  shell sets a `--accent` CSS variable from the signed-in account type. Use `var(--accent)` — do
  not hardcode an accent in a component.
- **Status:** success `#16A34A`, warning `#F59E0B`, error `#DC2626`, info `#2563EB`.
- **Type:** Fraunces (display) + Hanken Grotesk (body) via `next/font`. **Icons = inline SVG only**
  (no icon webfonts).
- Tokens live in `@workarmy/ui` as the TS source of truth and are mirrored into Tailwind v4
  `@theme`. Australian formats everywhere: dd/mm/yyyy, AUD, AU mobile `04xx xxx xxx`.

## Commands

```bash
pnpm install                 # install workspace
pnpm db:generate             # prisma generate
pnpm db:migrate              # prisma migrate dev  (needs DATABASE_URL + DIRECT_URL)
pnpm db:seed                 # seed wa_id_counters etc.
pnpm build                   # turbo build (packages, then apps)
pnpm typecheck               # turbo typecheck
pnpm --filter backend-api dev        # NestJS on :4000
pnpm --filter frontend-users dev     # Next.js on :3000
```

## Guardrails (do NOT)

- Do NOT add a separate table/system per participant type. Type is an attribute.
- Do NOT conflate completeness and compliance.
- Do NOT hardcode user-facing copy or terminology in components — use the labels layer.
- Do NOT hand-roll `fetch` in apps — use `@workarmy/sdk`.
- Do NOT put Prisma/Nest/IO into `@workarmy/auth`.
- Do NOT reintroduce: the legacy `count()+1` WA-ID, the soft-paper palette, dark-green headers, or
  per-type profile tables.
- Do NOT store OTPs or reset tokens in plaintext — store hashes only.
