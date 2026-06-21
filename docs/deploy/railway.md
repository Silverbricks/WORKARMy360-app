# Deploy the backend API to Railway

The Users frontend runs on Vercel; the NestJS API (`apps/backend-api`) runs on **Railway** with a
managed Postgres. The repo is already Railway-ready:

- [`Dockerfile`](../../Dockerfile) (root) — builds the monorepo and runs the API.
- [`railway.json`](../../railway.json) — Dockerfile builder + a start command that runs
  `prisma migrate deploy` then boots the server.
- `main.ts` listens on Railway's injected `PORT` on `0.0.0.0`.
- Cookies are cross-site-ready via `COOKIE_SAMESITE` / `COOKIE_SECURE` / `COOKIE_DOMAIN`.

## 1. Create the project + database

Easiest is the dashboard (gives auto-deploy on every push):

1. **railway.com → New Project → Deploy from GitHub repo →** `Silverbricks/WORKARMy360-app`.
2. Railway detects the root `Dockerfile`/`railway.json` and creates a **service** for the API.
3. In the project, **New → Database → PostgreSQL**. This exposes a `DATABASE_URL` variable.

(CLI alternative: `npm i -g @railway/cli` → `railway login` → `railway init` → `railway up`.)

## 2. Set the service variables

On the **API service → Variables**, add (mark secrets as sealed):

```
# Database — reference the Postgres plugin. Railway's PG isn't a pooler, so DIRECT_URL = DATABASE_URL.
DATABASE_URL = ${{Postgres.DATABASE_URL}}
DIRECT_URL   = ${{Postgres.DATABASE_URL}}

# Auth secrets (generate strong random values)
JWT_ACCESS_SECRET  = <32+ random chars>
JWT_REFRESH_SECRET = <32+ random chars>

# Email — switch off console for prod
EMAIL_PROVIDER = resend
RESEND_API_KEY = <your resend key>
EMAIL_FROM     = WorkArmy <no-reply@yourdomain>

# CORS + cross-site cookies (frontend is on a different domain → SameSite=None; Secure)
CORS_ORIGINS   = https://workarmy360-users.vercel.app
COOKIE_SECURE  = true
COOKIE_SAMESITE = none
COOKIE_DOMAIN  =                     # leave empty (host-only)
APP_USERS_URL  = https://workarmy360-users.vercel.app

# Optional
TURNSTILE_ENABLED = false
API_GLOBAL_PREFIX = api/v1
```

`PORT` is injected by Railway automatically — don't set it.

## 3. Database schema (first deploy)

The repo has no migration files yet. Pick one:

- **Quick (recommended for MVP):** create the schema directly. Locally, with the Railway DB's public
  `DATABASE_URL` in your `.env`:
  ```bash
  pnpm --filter @workarmy/database exec prisma db push
  pnpm db:seed       # seeds the WA-ID counter (first id = WA100001)
  ```
- **Proper migrations:** `pnpm db:migrate` (creates `database/prisma/migrations/`), commit it. On every
  deploy, `railway.json`'s start command runs `prisma migrate deploy` to apply them automatically.

Either way, run the **seed once** so WA IDs start at `WA100001`.

## 4. Deploy

- Dashboard: it deploys on creation and on every push to `main`.
- CLI: `railway up`.

Grab the service's public URL (**Settings → Networking → Generate Domain**), e.g.
`https://workarmy-api-production.up.railway.app`. Health-check it:

```bash
curl https://<your-api>.up.railway.app/api/v1/auth/me   # expect 401 (UNAUTHORIZED) = it's alive
```

## 5. Point the frontend at it

On **Vercel → workarmy360-users → Settings → Environment Variables**, set:

```
NEXT_PUBLIC_API_URL = https://<your-api>.up.railway.app/api/v1
```

Then redeploy the frontend (`vercel deploy --prod` from the repo root, or push to `main` if Git is
connected). Register → verify (OTP arrives by email via Resend) → login now works end-to-end.

## Notes
- The refresh cookie is `httpOnly; Secure; SameSite=None` in prod, so it only flows over HTTPS and
  only because `CORS_ORIGINS` lists the exact Vercel origin with credentials enabled.
- Keep `DATABASE_URL`/secrets in Railway variables (or a secret manager) — never commit them.
