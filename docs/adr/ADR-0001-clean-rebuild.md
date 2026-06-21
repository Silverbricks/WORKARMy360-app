# ADR-0001 — Clean rebuild of WorkArmy 2.0 as a fresh pnpm + turbo monorepo

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** Darshan Singh Bhogal (owner), build team
- **Supersedes:** the scattered SRS drafts, prototypes and the legacy `../workarmy` codebase as the
  build target.

## Context

WorkArmy 2.0 is a restart. An existing codebase (`../workarmy`, ~60–70% built: NestJS + TypeORM,
two Next.js apps, Expo stubs) exists alongside this empty repository. The Master SRS §13.4 names
exactly one open decision to record before Sprint 1: **retrofit the existing code vs. clean
rebuild.**

A structured inventory of the legacy repo found genuinely reusable parts (auth algorithms, a WA-ID
format scheme, design-token file structure, prototypes) but also debt that directly contradicts the
2.0 guiding principles:

- a **106-table** schema with **role-specific profile tables** (`worker_profile`, `agency_profile`,
  …) — violates Principle 2 (small neutral model);
- a `users` table that **conflates** auth + profile + worker fields;
- a **non-atomic** WA-ID counter (`count()+1`, race-prone);
- **single-JWT** auth with no refresh tokens and no sessions table;
- **plaintext** OTP / verification-code storage;
- design tokens whose palette + fonts drift from the agreed system.

Retrofitting would inherit precisely the model shape 2.0 was written to escape.

## Decision

**Clean rebuild** in `workarmy360new/` as a fresh pnpm + turbo monorepo, built strictly to the SRS
small-neutral model and the 5 principles, **selectively copying** only proven, spec-aligned assets
from the legacy repo (see the copy-asset table in the build plan). Concretely:

- ORM: **Prisma** (not the legacy TypeORM) — schema is the single source of truth and maps cleanly
  to the neutral entity catalogue.
- Data model: ONE `persons`, ONE `organisations`; participant type is an `accountType` **attribute**.
  `users` is **auth-only**; identity/profile lives in `persons`.
- WA IDs: a **single global atomic counter** (`INSERT … ON CONFLICT DO UPDATE … RETURNING` in the
  creating transaction). The legacy `count()+1` is explicitly not carried over.
- Auth: access + refresh tokens with a hashed-token `sessions` store; email OTP and reset tokens
  stored **hashed**; one shared **pure** `@workarmy/auth` package.
- Design system: charcoal header + white workspace + per-account-type accent (owner direction),
  authored fresh — the legacy palette is not carried over.

## Consequences

**Positive:** clean neutral schema; atomic WA-ID; one shared auth implementation; package
boundaries that keep validation/types/auth reusable across web + future mobile; no legacy debt.

**Negative / cost:** we forgo direct reuse of the legacy TypeORM entities and the 26-role RBAC
matrix (deferred to a later sprint); some features the legacy repo already has must be rebuilt as we
clone the proven Phase-1 vertical outward.

**Mitigation:** the legacy repo remains available read-only as a reference for algorithms and
visual layout; the build plan's copy-asset table records, per asset, whether to copy-as-is, adapt,
or author fresh.

## Alternatives rejected

- **In-place retrofit of `../workarmy`** — fastest to a running app, but permanently inherits the
  106-table / per-type-profile shape, the non-atomic WA-ID, and conflated `users`. Rejected as
  contrary to Principles 2 and 4.
- **Strict clean rebuild copying nothing** — maximally clean but slower; needlessly re-types
  genuinely reusable algorithms and layout. Rejected in favour of clean-rebuild-with-copy.
