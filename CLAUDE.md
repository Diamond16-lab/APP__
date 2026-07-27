# CLAUDE.md — Reporte Técnico Xerox (IDS Service)

> **Maintenance rule:** Update this file every time a meaningful change is made —
> new features, bug fixes, new env vars, schema changes, deploy changes.
> This file is auto-loaded by Claude Code at the start of every session.
> Real secrets (passwords, connection strings) live ONLY in `.env` — never here.

---

## What This App Does

A fullstack web app for Xerox field technicians to capture service reports on-site:

- Technician logs in → fills a 9-step guided form about a service call
- System captures: client info, equipment details, meter readings, activities,
  parts used, checklist, and digital signatures
- Saves report to MongoDB → generates a Xerox-branded PDF
- History view shows all past reports per equipment serial with meter deltas between visits

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 (port 5173 in dev) |
| Backend | Express 5 + Mongoose 9 (port 4000 in dev) |
| Database | MongoDB Atlas (cloud) |
| Auth | JWT via httpOnly cookie `rt_session` (7-day expiry) |
| PDF | jsPDF + PNG template at `public/reporte-template.png` |
| Tests | Vitest 4 — 106 tests (74 unit + 32 integration) |
| Deployment | Vercel (primary) + Render.com (also configured) |

---

## Repository & Branches

- **GitHub:** `https://github.com/Diamond16-lab/APP__`
- **Remote `main`:** belongs to a *different project* on the same repo — never push the app there
- **`reporte-tecnico-app`:** intended Vercel **production** branch (git auto-deploy NOT connected — see below)
- **`staging`:** intended Vercel **preview** branch
- **Local `main`:** where all development happens
- **Live production URL (stable):** `https://reporte-tecnico-diamond1612s-projects.vercel.app`
  — this Vercel project alias always points at the latest `npx vercel deploy --prod`. Verified working
  end-to-end on 2026-07-25 (login `admin/Admin123!` → Atlas DB `reporte-tecnico`).

### Deploy Workflow — CURRENT FLOW IS TWO MANUAL STEPS

Git → Vercel auto-deploy is **not connected** (see warning below), so publishing a change today
takes **two separate commands** — `git push` only backs the code up to GitHub; it does NOT build
on Vercel. `npx vercel deploy --prod` is what actually publishes.

```bash
npm run dev                  # local dev: Vite :5173 + Express :4000
npm test                     # run 106 tests in ~7s (much slower on a cold OneDrive cache)

# --- publish a change (do BOTH, in order) ---
npm run deploy:production    # STEP 1: runs tests, then git push main:reporte-tecnico-app
                             #         (backs code up to GitHub — does NOT trigger a Vercel build)
npx vercel deploy --prod     # STEP 2: actually builds & publishes to the live prod URL
                             #         then verify: curl <prod-url>/api/health  → {"ok":true}

npm run vercel:env           # (one-time / when secrets change) push .env values to Vercel
npm run deploy:staging       # STEP 1 for staging: tests → git push main:staging (backup only)
```

GitHub branches `reporte-tecnico-app` (prod) and `staging` are both kept in sync with local `main`
via `git push` — they are the code backup, not a deploy trigger. (First full sync: 2026-07-26.)

The `predeploy:staging` / `predeploy:production` hooks run `npm test` and block the push if any
test fails. **They must keep the `:staging` / `:production` suffix.** npm only fires `pre<script>`
for the exact script name, so a hook named plain `predeploy` matches a script named `deploy` —
which does not exist — and silently never runs. (This was the case until 2026-07-16: both deploy
scripts pushed without ever running the tests.)

> ⚠️ **Git → Vercel auto-deploy is NOT connected.** `vercel link` fails with
> `You need admin or write access to the repository "APP__"` — the git user is `Diamond16-lab`
> but the Vercel account is `diamond1612` (two different accounts). Until reconciled, `git push` /
> `npm run deploy:*` only update GitHub and **never trigger a Vercel build** — you must also run
> `npx vercel deploy --prod` to publish. To connect it (optional, one-time, requires dashboard
> access): give `diamond1612` write access to the repo on GitHub, then Vercel project →
> Settings → Git → Connect Repository → set Production Branch = `reporte-tecnico-app`. After that,
> a single push to that branch auto-deploys.

> 🔴 **`vercel.json` must NOT contain a `services` block.** Vercel CLI 56's `vercel link` auto-rewrote
> `vercel.json` into a `services` microfrontend config. That format stops `api/index.js` from deploying
> as a serverless function, so every `/api/*` request silently falls through to the SPA `index.html`
> (the API returns HTML instead of JSON and login/reports break in prod — no error, just wrong response).
> The correct config is framework `vite` + two rewrites (`/api/(.*)`→`/api/index.js`, `/(.*)`→`/index.html`).
> After every deploy, verify with: `curl https://reporte-tecnico-diamond1612s-projects.vercel.app/api/health`
> → must be `{"ok":true}`, never `<!doctype html>`. (This broke prod on 2026-07-25; fixed by removing `services`.)

> ℹ️ **Demo login is public on purpose.** `admin / Admin123!` is shown on the login screen and works in
> BOTH local and production — this is a portfolio app with fictitious data. See the comment block at the
> top of `src/pages/LoginPage.jsx` for what to change before pointing this at real client data.

---

## Key Directory Structure

```
reporte-tecnico_cds/
├── api/
│   └── index.js             # Vercel serverless entry — wraps createServerApp()
│                            # caches DB connection across warm invocations
├── server/
│   ├── app.js               # createServerApp() — pure Express factory (no listen/connect)
│   ├── index.js             # production entry: connectDB → seed → app.listen()
│   ├── config/
│   │   ├── db.js            # connectToDatabase(uri)
│   │   └── env.js           # assertEnv(), env object
│   ├── middleware/
│   │   └── requireAuth.js   # JWT cookie verification → attaches req.user
│   ├── models/
│   │   ├── User.js          # username (lowercase unique), passwordHash,
│   │   │                    # displayName, employeeNumber, isActive
│   │   └── Report.js        # full schema: datePartsSchema, partSchema,
│   │                        # checklistItemSchema, reportTechnicalNo (unique index)
│   ├── routes/
│   │   ├── auth.js          # POST /login /logout; GET /session
│   │   ├── catalogs.js      # GET /api/catalogs (FTE codes, checklist items)
│   │   └── reports.js       # CRUD + autocomplete + comparison
│   └── utils/
│       ├── auth.js          # createSessionToken, verifySessionToken, sessionCookieOptions
│       ├── reportPayload.js # validateReportPayload, normalizeReportPayload
│       └── seedDefaultUser.js # creates admin user on first boot if collection empty
├── shared/
│   └── reportUtils.js       # ⚠️ IMPORTED BY BOTH frontend AND backend:
│                            # computeMeterTotal, isPartEmpty, resolveFteDisplay,
│                            # createReportId, getNowParts
├── src/
│   ├── components/
│   │   └── SignaturePad.jsx  # canvas-based digital signature component
│   ├── context/
│   │   └── AuthContext.jsx  # global auth state (user, login, logout)
│   ├── generarPDF.js        # PDF generation with jsPDF + template PNG
│   ├── lib/
│   │   ├── api.js           # axios instance with base URL + credentials
│   │   └── reportForm.js    # validateReportStep (1-9), buildDemoForm,
│   │                        # buildReportPayload, computeFormTotalMeters
│   └── pages/
│       ├── ReportFormPage.jsx   # 9-step form, demo button, signature injection
│       ├── ReportDetailPage.jsx # view single report + PDF re-generation
│       └── HistoryPage.jsx      # list/filter reports, comparison view
├── tests/
│   ├── helpers/db.js            # startDb / stopDb / clearDb (mongodb-memory-server)
│   ├── shared/reportUtils.test.js
│   ├── lib/reportForm.test.js
│   └── server/
│       ├── reportPayload.test.js
│       ├── auth.test.js         # supertest + in-memory MongoDB integration
│       └── reports.test.js      # supertest + in-memory MongoDB integration
├── scripts/
│   └── download-mongo-binary.js # one-time pre-download of mongodb-memory-server binary
├── render.yaml              # Render.com config (branch: reporte-tecnico-app)
├── vercel.json              # Vercel config: /api/*→serverless, /*→dist/index.html
└── vitest.config.js         # globals:true, hookTimeout:60000, coverage via v8
```

---

## Two Environments — Local (dev) vs Vercel (production)

The two environments differ in exactly two things: **which branch** and **which database**.
Same code, same Atlas cluster.

| | Local (development) | Vercel (production) |
|---|---|---|
| Runs on | `127.0.0.1:5173` + `:4000` (`npm run dev`) | public Vercel URL |
| Branch | local `main` | `reporte-tecnico-app` |
| **Database** | **`reporte-tecnico-dev`** | **`reporte-tecnico`** |
| `MONGODB_URI` | direct shards, in `.env` | `mongodb+srv://`, in Vercel dashboard |
| Env source | `.env` (gitignored) | Vercel env vars (`npm run vercel:env`) |

**The database names must stay different.** Both point at the same Atlas cluster
(`cluster0.astms5i.mongodb.net`), and only the DB name in the URI path separates them. If local
ever points back at `reporte-tecnico`, every "Rellenar demo" click writes junk into real technician
data. `scripts/setup-vercel-env.ps1` hardcodes the production DB name for this reason — it does not
copy the DB name out of `.env`.

Each database seeds its own `admin` user independently on first boot (see `seedDefaultUser`).

## MongoDB Connection — Windows Local Issue

**Critical:** `mongodb+srv://` fails on Windows with Node.js because c-ares uses TCP for SRV
DNS queries, which is blocked by most local networks. This is a local-only issue.

- **Local `.env`** → uses **direct shard hostnames** (see `.env` file for the full string)
  - Format: `mongodb://user:pass@shard-00-00:27017,shard-00-01:27017,shard-00-02:27017/db?ssl=true&replicaSet=...`
- **Production (Vercel / Render / any Linux)** → use the clean `mongodb+srv://` URI
  - Linux resolves SRV records correctly over UDP — no issue

Cluster: `cluster0.astms5i.mongodb.net` | DB: `reporte-tecnico` | AuthSource: `admin`

---

## Environment Variables

| Variable | Local (in `.env`) | Production (Vercel/Render dashboard) |
|----------|--------------------|--------------------------------------|
| `MONGODB_URI` | direct shard string | `mongodb+srv://...` URI |
| `JWT_SECRET` | any long secret | same type, set in dashboard |
| `PORT` | `4000` | auto-set by host |
| `NODE_ENV` | `development` | `production` |
| `SEED_USERNAME` | `admin` | `admin` |
| `SEED_PASSWORD` | see `.env` | set in dashboard |
| `SEED_DISPLAY_NAME` | `Ing. Demo Tecnico` | `Ing. Demo Tecnico` |
| `SEED_EMPLOYEE_NUMBER` | `IDS-001` | `IDS-001` |

**Actual credential values live only in `.env` (gitignored) and in the hosting dashboard.**

---

## Default Admin User (auto-seeded on first boot)

- **Username:** `admin` (value of `SEED_USERNAME`)
- **Password:** value of `SEED_PASSWORD` in `.env`
- **Display name:** `Ing. Demo Tecnico`
- **Employee number:** `IDS-001`

Seeding runs on every boot but only creates the user if the `users` collection is empty.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | `{"ok":true}` liveness check |
| POST | `/api/auth/login` | — | `{username, password}` → sets `rt_session` cookie |
| POST | `/api/auth/logout` | — | clears `rt_session` cookie |
| GET | `/api/auth/session` | — | `{user: null}` or `{user: {...}}` |
| GET | `/api/catalogs` | JWT | FTE source codes + checklist item definitions |
| POST | `/api/reports` | JWT | create report → 201 with saved data |
| GET | `/api/reports` | JWT | list; supports `?serial=`, `?businessName=`, `?dateFrom=`, `?dateTo=` |
| GET | `/api/reports/autocomplete` | JWT | `?serial=`, `?businessName=` → last matching report |
| GET | `/api/reports/:id` | JWT | full report document |
| GET | `/api/reports/:id/comparison` | JWT | `{previousReport, deltas{bn,color,total}, partHistory}` |

---

## Vercel Deployment

`vercel.json` routing:
- `/api/*` → `api/index.js` (Node.js serverless function)
- `/*` → `dist/index.html` (SPA fallback; static assets served by CDN before this)

`api/index.js` caches the Express app + MongoDB connection in a module-level variable so warm
invocations skip the connect/seed step entirely.

Env vars required in Vercel dashboard:
`MONGODB_URI` (use SRV), `JWT_SECRET`, `NODE_ENV=production`,
`SEED_USERNAME`, `SEED_PASSWORD`, `SEED_DISPLAY_NAME`, `SEED_EMPLOYEE_NUMBER`

---

## Render.com Deployment (also configured)

`render.yaml` at project root. Production branch: `reporte-tecnico-app`. Free tier.
Build: `npm ci --include=dev && npm run build`. Start: `npm start`.
Same env vars as Vercel (set via Render dashboard).

---

## Test Suite

```bash
npm test                # all 106 tests once
npm run test:watch      # watch mode
npm run test:coverage   # + lcov coverage report
```

| File | Tests | What it covers |
|------|-------|---------------|
| `tests/shared/reportUtils.test.js` | 28 | computeMeterTotal, isPartEmpty, resolveFteDisplay, createReportId, getNowParts |
| `tests/lib/reportForm.test.js` | 32 | all 9 step validators, buildReportPayload, buildDemoForm, computeFormTotalMeters |
| `tests/server/reportPayload.test.js` | 14 | validateReportPayload, normalizeReportPayload |
| `tests/server/auth.test.js` | 12 | login/logout/session via real HTTP + in-memory MongoDB |
| `tests/server/reports.test.js` | 20 | create, list/filter, autocomplete, get-by-id, comparison |

**mongodb-memory-server binary** must be cached at `~/.cache/mongodb-binaries/` or the two
integration files (`auth.test.js`, `reports.test.js`) fail with `Hook timed out in 60000ms` while
`startDb()` tries to download it mid-run. It is **not** bundled and is **not** restored by
`npm install`. If those two files time out: `node scripts/download-mongo-binary.js` (~110MB zip).

> ⚠️ **This project lives inside OneDrive**, and `node_modules` files are cloud-only placeholders
> (attribute `4199968` = ARCHIVE+SPARSE+REPARSE+OFFLINE+RECALL_ON_DATA_ACCESS). OneDrive cannot
> hydrate them fast enough under parallel I/O, which causes:
> - `Error: UNKNOWN: unknown error, read` / `errno: -4094` — seen crashing `npm run dev` while
>   `concurrently` loaded `rxjs`. **Intermittent — just re-run the command**; the failed read
>   hydrates the file for next time.
> - Wild first-run slowness. Same suite, same machine, same day: **310s** cold (474s of "import"),
>   **28s** partially hydrated, **6s** fully hydrated. A slow run is a cache symptom, not a regression.
>
> These look like code bugs but are not. Real fix: move the repo outside OneDrive, or exclude
> `node_modules` from sync. Note PowerShell's `$_.Attributes -match 'Offline'` will NOT match these
> — Windows reports the flags as a raw number.

---

## Known Bugs Fixed — Do Not Re-Introduce

### 1. `computeMeterTotal('', '')` returned `'0'` instead of `''`
- `Number('') === 0` is finite, so empty strings were treated as zero values
- **Fix in `shared/reportUtils.js`:** added `cleanBn !== ''` guard before `Number.isFinite()`
- **Effect:** Total meter field shows blank until user actually enters a value

### 2. "Rellenar demo" left `reportTechnicalNo` and signatures empty
- `buildDemoForm()` had `reportTechnicalNo: ''` and no signature data URLs
- **Fix in `src/lib/reportForm.js`:** auto-generates `reportTechnicalNo` from current date (`RT-YYYYMMDD-DEMO`)
- **Fix in `src/pages/ReportFormPage.jsx`:** `generateDemoSignature()` draws name on a 640×190 canvas, injects PNG data URL into both signature fields in `fillDemo()`
- **Effect:** One click fills every required field → PDF can be generated immediately

### 3. Demo "Rellenar demo" failed on second save — "A report with the same folio already exists"
- `buildDemoForm()` generated `RT-YYYYMMDD-DEMO` (same value all day) → MongoDB unique index rejected the second save
- `handleSubmit` also had no retry logic, so ANY duplicate folio blocked PDF generation entirely
- **Fix 1 in `src/lib/reportForm.js`:** demo folio now includes HH:MM:SS → `RT-YYYYMMDD-DEMO-HHmmss`; each "Rellenar demo" click is unique
- **Fix 2 in `src/pages/ReportFormPage.jsx`:** on 409 duplicate folio, `handleSubmit` auto-appends `-2`, `-3`, … up to 5 retries before showing an error (handles demo AND real duplicate folios)
- **Fix 3 in `tests/lib/reportForm.test.js`:** updated regex from `/^RT-\d{8}-DEMO$/` to `/^RT-\d{8}-DEMO-\d{6}$/`
- **Effect:** Demo data can be saved and PDF-generated unlimited times; real duplicate folios also self-heal

### 4. PDF: signature images overlapped the observations/comments section
- `SIGNATURES.top = 660` was **inside** `OBSERVATIONS.box = [645.2, 681.6]` — 21.6pt overlap
- Signature images were also stretched (156pt wide × 39pt tall = 4:1 vs native 640×190 = 3.37:1 canvas)
- **Fix in `src/generarPDF.js`:**
  - Shortened `OBSERVATIONS.box` bottom from 681.6 → 673.0 (27.8pt content area)
  - Moved `SIGNATURES.top` from 660.0 → 675.0 (just below observations)
  - Adjusted `SIGNATURES.bottom` from 699.0 → 705.0 (30pt signature band)
  - Moved name text cell from hardcoded y=692 → `SIGNATURES.bottom` (705)
  - Added aspect-ratio-correct rendering: `Math.min(maxWidth, height × 3.368)` + centered horizontally
- **Effect:** Signatures appear clearly below the comments section with no bleed-through

### 5. MongoDB SRV lookup fails on Windows with Node.js
- c-ares sends SRV queries over TCP; local Windows networks block TCP port 53
- **Fix:** use direct shard hostnames in local `.env` (see MongoDB section above)
- **Effect:** `GET /api/health` returns `{"ok":true}` on first try

---

## Navigation

- Clicking the **Xerox logo + "Xerox Service / Reporte tecnico"** brand area in the header navigates to `/reportes/nuevo` (new report form)
- Implemented in `AppShell.jsx`: `<BrandMark compact />` is wrapped in `<Link to="/reportes/nuevo" className="brand-home-link">`
- CSS in `App.css`: `.brand-home-link` keeps flex layout intact, strips underline/color, adds `opacity:0.7` on hover

---

## 9-Step Form Overview

| Step | Content |
|------|---------|
| 1 | Report metadata: task number, report number, received/documented date+time |
| 2 | Activity times: travel + up to 3 service rounds (start/end per day) |
| 3 | Client: business name, contact person, area, address, phone, city/state |
| 4 | Equipment: model, serial number, system, subsystem |
| 5 | Meter readings: B&N + Color → Total auto-computed |
| 6 | Technical: problem reported, fault code, incomplete call flag, solution |
| 7 | Parts used: part number, qty, FTE source code, folio (up to N rows) |
| 8 | Checklist: 6 yes/no items with optional comments each |
| 9 | Signatures (canvas draw) + observations + save/PDF button |

Draft auto-saves to `localStorage` on every keystroke. "Rellenar demo" fills all fields.

---

## Shared Module Warning

`shared/reportUtils.js` is imported by **both** frontend and backend:
- Frontend import: `src/lib/reportForm.js`
- Backend import: `server/utils/reportPayload.js`

Any change there affects both sides simultaneously. Always run `npm test` after touching it.

---

## npm Scripts Reference

| Script | What it does |
|--------|-------------|
| `npm run dev` | Vite :5173 + Express :4000 (concurrently) |
| `npm run dev:server:watch` | Express with `node --watch` (auto-restart on backend file saves) |
| `npm run build` | Vite production build → `dist/` |
| `npm start` | Express only, production mode (serves `dist/`) |
| `npm test` | Run all 106 tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Tests + lcov coverage |
| `npm run deploy:staging` | Tests → push `main:staging` → Vercel preview |
| `npm run deploy:production` | Tests → push `main:reporte-tecnico-app` → Vercel production |

---

## Session Start Checklist

When starting a new Claude Code session on this project:

1. Is the dev server running? If not: `npm run dev`
2. Verify API is up: `http://127.0.0.1:4000/api/health` → `{"ok":true}`
3. App UI: `http://127.0.0.1:5173`
4. Run `npm test` to confirm baseline is green before making changes
5. All code changes go on local `main` — deploy only when ready with `npm run deploy:*`
