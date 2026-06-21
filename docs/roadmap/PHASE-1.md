# Phase 1 roadmap — spec-wide, build-narrow

Phase 1 proves the marketplace loop on the **Farm vertical** end-to-end. Because the data model is
neutral and participant type is an attribute, adding the next vertical later is configuration + a
profile extension, not a rebuild. Each sprint is a vertical slice (schema → API → screen).

| Sprint | Deliverable |
| --- | --- |
| **1 (current)** | DB core + Auth + Users slice behind `@workarmy/auth`: register → verify email OTP → login → refresh → logout → forgot/reset password. Neutral `persons`/`organisations`, atomic WA-ID, design tokens + labels layer, Users app marketing + auth + dashboard stub. |
| 2 | **Providers app** register/login (reuse `@workarmy/auth` + `organisations`/`org_members`) + the **9-step provider onboarding wizard**. |
| 3 | Profiles + profile-completeness; industry-type as an attribute (kept separate from compliance). |
| 4 | Jobs & tasks — a Farm posts work (draft → published → closed). |
| 5 | Applications & hiring pipeline (applied → shortlisted → interview → hired / rejected / withdrawn) + `application_events`. |
| 6 | Admin verification queue + member directory (by WA ID) + jobs moderation. |
| 7 | Documents (upload + review) — foundation for the Phase-2 compliance engine. |

## Sprint 1 — acceptance

A Job Seeker can, on `workarmy.co`:

1. Register (email + password + AU mobile, Turnstile-checked).
2. Verify by 6-digit email OTP (resendable, expiring, hashed at rest).
3. Log in / log out; sessions use a rotating httpOnly refresh cookie.
4. Reset a forgotten password (single-use hashed token; no email enumeration).
5. Land on a dashboard stub showing "Profile status: Incomplete".

Plus: a permanent immutable WA ID is allocated atomically at registration (register twice → two
sequential WA IDs, no gap/dup), and every auth event is written to `audit_logs`.

## Sprint 2 — Provider onboarding wizard (captured now from the provider spec)

A 9-step wizard in the Providers app, data-driven left rail, save-and-return, submit → SuperAdmin
Approvals Queue (profile inert until approved). SMS verification (Twilio) precedes activation. ABN
validated against the ABR; banking/tax fields encrypted at rest and masked on display.

1. Account (email, password, mobile — SMS verified)
2. Business identity (legal/trading name, ABN, structure, labour-hire licence + expiry)
3. Primary contact (name, **position/title**, email, phone, authorised-signatory + compliance-alert flags)
4. Additional contacts (repeatable)
5. Locations (registered + billing address, service regions)
6. Industry & workforce (primary industry, workforce size, role types)
7. Compliance & insurance (public liability, workers' comp, document upload)
8. Banking & payroll (account, BSB, GST status — encrypted)
9. Review & submit (read-only summary with inline edit links, terms, submit)

**Modelling rule (Principle 2):** contacts are a **separate repeatable entity** `contacts` linked
to the provider org — never flat columns. Fields: `id, provider_id, first_name, last_name,
position, email, phone, role_tag?, is_primary (exactly one true per provider),
is_authorised_signatory?, is_billing_contact?, is_emergency_contact?, preferred_contact_method?`.
The worker / contractor / farm / agency onboarding variants reuse the same wizard shell with
different step sets.

## Designed-for, not built now

The **Worker engagement model** — TFN, ABN profile, super, pay-mode-per-engagement, and the Closing
Loopholes **ABN classification gate** (a whole-of-relationship questionnaire whose answers + verdict
are stored, timestamped, as the hirer's reasonableness-test evidence) — lands in Phase 4
(finance/engagement). The neutral model keeps these as engagement-level attributes, never per-type
tables.
