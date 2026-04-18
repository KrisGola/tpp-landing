# twojapomocprawna.pl — TPP B2C layer

Client-facing marketplace layer sitting on top of the `legal-portal`
Supabase backend. Built with Next.js 14 (Pages Router), `@supabase/supabase-js`,
and Anthropic API.

**This repo implements the B2C side** (wizard, public catalog, client portal).
The B2B lawyer-facing admin lives in the colleague's `legal-portal` repo and
shares the same Supabase project.

---

## Quick start

```bash
# 1. Install
npm install

# 2. (Optional) Configure env — see .env.example
cp .env.example .env.local

# 3. Dev server
npm run dev
# → http://localhost:3000
```

**Without any env vars** the app runs in **mock mode**: wizard, portal and
catalog all work with hard-coded fixtures. Good enough to click through the UI
and demo the flow. See `lib/mockData.js` for shape.

---

## Pages

| Route | What | Auth |
|-------|------|------|
| `/` | Landing — hero + CTAs to wizard / catalog | Public |
| `/wizard` | 8-step guided flow: category → describe → AI analysis → matching → confirm | Public (registers at end) |
| `/prawnicy` | Public lawyer catalog with search/filter/sort | Public |
| `/p/[slug]` | Public lawyer profile (lives in `legal-portal`) | Public |
| `/book/[slug]` | Booking flow (lives in `legal-portal`) | Public |
| `/login` | Magic-link sign-in for clients | Public |
| `/register` | Magic-link sign-up with name capture | Public |
| `/auth/callback` | Magic-link landing page — creates profile + pending case | Public (token-auth) |
| `/portal` | Client dashboard (cases, docs, chat) | **Requires login** |

---

## API routes

All API routes require `Authorization: Bearer <access_token>` except where
noted. They degrade to mock data if Supabase env vars are missing — 401s only
surface when Supabase IS configured and the caller is unauthenticated.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/analyze` | POST | AI analysis of a case (Anthropic) — public + rate-limited |
| `/api/match` | POST | Rank lawyers against aiAnalysis — public + rate-limited |
| `/api/cases` | GET, POST | List / create the caller's cases |
| `/api/cases/[id]` | GET, PATCH | Get / update a single case |
| `/api/messages` | GET, POST | List messages for a case / send new |
| `/api/profile` | GET, POST | Get / upsert client_profiles row |

---

## Folder layout

```
pages/
  index.js              — landing
  wizard/index.js       — 8-step guided flow
  prawnicy/index.js     — public catalog
  portal/index.js       — client dashboard (auth-guarded)
  login.js, register.js — magic-link auth pages
  auth/callback.js      — post-login handler (creates profile + pending case)
  api/                  — see table above

components/
  wizard/               — step components (Intro, Category, Describe, Clarify,
                          Analyzing, Results, Matching, Confirm)
  portal/               — Header, Nav, Home, Sprawy, Dokumenty, Wiadomości,
                          CaseDetail, AccountDrawer
  directory/            — LawyerCard, DirectorySearch, Directory.module.css
  auth/                 — RequireAuth (client-side route guard)

lib/
  supabaseBrowser.js    — singleton browser client + authedFetch helper
  supabaseAdmin.js      — service-role + per-user JWT clients (server only)
  AuthContext.js        — AuthProvider + useUser() hook
  aiPipeline.js         — Anthropic API wrapper
  fallback.js           — deterministic fallback AI outputs per category
  matchingEngine.js     — lawyer ranking algorithm
  portalAdapter.js      — DB rows → portal-component shape
  mockData.js           — fixtures for preview-without-env-vars mode

supabase/migrations/    — 6 SQL files (run in Supabase Studio once)
styles/                 — globals.css + auth/landing module CSS
```

---

## Deployment

### 1. Vercel project

The repo is already linked to the existing Vercel project
(`twojapomocprawna.pl`). Pushing branches creates preview deploys
automatically. This branch: `feat/api-guided-flow`.

### 2. Environment variables

In Vercel **Settings → Environment Variables**, add:

| Variable | Scope | Required? |
|----------|-------|-----------|
| `ANTHROPIC_API_KEY` | Prod + Preview | for real AI analysis (else fallback) |
| `NEXT_PUBLIC_SUPABASE_URL` | All | for DB (else mock mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | for DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod + Preview only (NOT Dev) | server-side ops |

Without `ANTHROPIC_API_KEY` the `/api/analyze` endpoint returns
`lib/fallback.js` output — wizard flow stays clickable.

Without Supabase vars the whole app runs in mock mode.

### 3. Run migrations

Six SQL files in `supabase/migrations/`. Run in order via Supabase Studio →
SQL Editor, against the same project the `legal-portal` repo uses:

```
20260402000000_create_tpp_client_profiles.sql
20260402000001_create_tpp_cases.sql
20260402000002_create_tpp_messages.sql
20260402000003_create_tpp_documents.sql
20260402000004_create_tpp_bookings.sql
20260402000005_extend_user_profiles_tpp.sql
```

These add new tables (`client_profiles`, `tpp_cases`, `tpp_messages`, …) and
new columns on `user_profiles` (`tpp_slug`, `tpp_specializations`,
`tpp_is_listed`, …). **Nothing in the existing `legal-portal` schema is
modified** — all additions are prefixed `tpp_*` or live in new tables.

### 4. Supabase Auth configuration

- **Site URL**: `https://twojapomocprawna.pl` (plus any Vercel preview URLs)
- **Redirect URLs** (Auth → URL Configuration):
  - `https://twojapomocprawna.pl/auth/callback`
  - `https://<preview>.vercel.app/auth/callback` (wildcards OK)
  - `http://localhost:3000/auth/callback` (for dev)
- **Enable Email provider** — magic link is the only flow we use for TPP
  clients.
- **Enable Realtime** on `tpp_messages` table (the migration does this).

### 5. Lawyer onboarding (done in legal-portal)

For a lawyer to appear in `/prawnicy` and be matchable, their `user_profiles`
row needs `tpp_is_listed = true` plus at least `tpp_slug`,
`tpp_specializations`, `tpp_city`. A toggle lives in the lawyer dashboard
(legal-portal) — coordinate with colleague.

---

## Integration contract with legal-portal

See `INTEGRATION.md` for the full technical contract — URL routing split,
shared schema, design tokens, phased rollout plan (4 weeks to beta).

Key points:
- Shared Supabase project (one source of truth for users and data)
- Shared `auth.users` table; separate profile tables:
  - `client_profiles` — TPP clients (new in this branch)
  - `user_profiles` — lawyers (existing, extended with `tpp_*` columns)
- URL split:
  - Client-facing (TPP): `/`, `/wizard`, `/prawnicy`, `/portal`, `/login`, …
  - Lawyer-facing (legal-portal): `/dashboard`, `/cases`, `/clients`, `/landing-page`, `/p/[slug]`, `/book/[slug]`
  - Shared: `/p/[slug]`, `/book/[slug]` linked from both

---

## Testing the flow end-to-end (mock mode)

```bash
npm run dev
# Open http://localhost:3000

# Path A: "Find a lawyer with AI"
#   1. /           — hero, click "Opisz sprawę →"
#   2. /wizard     — intro → category → describe → clarify → analyzing → results → matching → confirm
#   3. /portal     — see the just-created case (mock)

# Path B: "Browse catalog"
#   1. /prawnicy   — filter by spec / city / availability

# Path C: Auth
#   1. /login      — magic-link (requires Supabase to send real email)
#   2. /register   — magic-link with name capture
```

---

## Scripts

```
npm run dev     — next dev (http://localhost:3000)
npm run build   — production build
npm run start   — run built app
npm run lint    — next lint
```

---

## License

Private — © twojapomocprawna.pl.
