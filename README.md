# HRD Intelligence — Web Frontend (static-data prototype)

AI-powered HRD management platform UI built from the **HRD Intelligence – System Overview and Scope (Draft v5)** document.
This is the **Next.js + TypeScript web frontend only**: every screen runs on deterministic static data with an in-memory
store, so there is no backend, database, Keycloak or AI service required to explore it.

## Tech stack (as specified in §4 System Architecture)

| Concern | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| UI & styling | Tailwind CSS v4, shadcn/ui (Radix primitives), Heroicons |
| Forms | React Hook Form + Zod |
| API client | Axios (`src/lib/api/client.ts`, wired but unused until a backend exists) |
| Auth | Keycloak / OIDC — mocked with demo accounts (`src/lib/auth/auth-context.tsx`) |
| Charts & visualisation | Recharts (KPI cards, donut, bar, line) |
| Notifications | In-app notification centre + email channel indicators |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks and lints)
npm run typecheck  # tsc --noEmit
```

Sign in with one of the demo accounts (password for all: `Hrd@2026`):

| Role | Email |
| --- | --- |
| HRD Admin | `admin@hrd-intelligence.local` |
| Instructor | `vannak@hrd-intelligence.local` |

The user menu (top-right) has a **Switch to Admin/Instructor** shortcut so you can compare the two role experiences quickly.

## What is implemented

| Spec section | Module | Route |
| --- | --- | --- |
| 2.1 Authentication | Login, forgot password, change password (RHF + Zod) | `/login`, `/forgot-password`, `/settings` |
| 2.2 Student management | Profiles, search, filters (generation / class / course / status), detail page with scores, attendance, feedback, allowance | `/students`, `/students/[id]` |
| 2.2 Attendance | Filter by class, month or specific day, status; search; CSV export | `/attendance` |
| 2.2 Scores | Assignment / quiz / exam / homework with auto totals & averages, score-range filter, per-subject breakdown | `/scores` |
| 2.2 At-risk tracking | Automatic risk levels (Low / Medium / High), AI alerts, AI-suggested support, AI-drafted warning email | `/at-risk` |
| 2.2 Extra-class & allowance (Admin) | Records, approval, per-student totals, monthly history, editable hourly rate | `/extra-class` |
| 2.2 Monthly allowance (Admin) | Seven allowance types, score / attendance tiers, auto-calculated totals, CSV & Excel export | `/allowances` |
| 2.2 Instructor feedback | Private categorised feedback (create / edit / delete), filters, AI summary | `/feedback` |
| 1.2 Overtime (Instructor) | Overtime report submission + standby-day reminders | `/overtime` |
| 2.3 Alumni (Admin) | Directory with 6 filters, create / edit, employment history, documents, manual or AI update requests, analytics | `/alumni`, `/alumni/[id]` |
| 2.4 Data management | Folders & files, upload (supported formats only), rename / move / duplicate / delete / ZIP export, owner-based sharing with Viewer / Editor permissions, search, filter by extension & owner, sort | `/files` |
| 2.5 Dashboard & analytics | KPI cards, gender donut, top-5 by metric, attendance donut + rate over time (daily / weekly / monthly), at-risk table, generation bar, alumni KPI, employment bar, report export (CSV / PDF) | `/dashboard` |
| 2.6 Notifications | Unread count, role-specific trigger events, in-app + email channels | `/notifications` + bell menu |
| 2.7 AI chatbot | Text + voice (Web Speech API) input, 10 recent sessions (search / rename / delete / continue), general and folder-specific scope, replies with charts, tables, generated files and email actions requiring confirmation | `/chat` |
| 2.8 Autonomous agents (Admin) | 3 scheduled + 2 trigger-based agents, enable / disable, run now, run history | `/agents` |

Role-based access follows the §3 feature matrix: admin-only modules render an access notice for instructors and are hidden from their navigation.

## Project structure

```
src/
  app/                 # App Router: (auth) group for public pages, (app) group wrapped in the authenticated shell
  components/
    ui/                # shadcn/ui primitives (Heroicons used for icons)
    layout/            # sidebar, topbar, app shell, navigation config
    shared/            # KPI card, badges, page header, search, pagination, empty state, role gate
    charts/            # Recharts wrappers with a shared palette
    <module>/          # dashboard, students, attendance, scores, at-risk, allowances, feedback, alumni, files, chat, agents, notifications, settings
  lib/
    data/              # Typed static data (deterministic, seeded) + risk / allowance / chat engines
    store/             # In-memory app store (mutations for feedback, alumni, files, chat, agents, …)
    auth/              # Mock Keycloak auth context
    api/               # Axios instance + endpoint map for the Spring Cloud Gateway
    validation/        # Zod schemas
    utils/             # formatting and export helpers (CSV, Excel, PDF via print)
  hooks/               # toast, pagination
```

## Replacing static data with the backend

Each `src/lib/data/*.ts` module exports plain typed arrays and pure functions. To connect the Spring microservices,
replace the imports in `src/lib/store/app-store.tsx` with calls through `apiClient` (`src/lib/api/client.ts`) and keep the
same TypeScript interfaces (`src/lib/data/types.ts`). The AI chatbot's `generateReply` in `src/lib/data/chat.ts` is the
single place to swap in the FastAPI RAG service.

## Notes

* The in-memory store resets on page reload (by design for the prototype). The login session and theme are persisted in `localStorage`.
* "Today" inside the dataset is fixed to **6 Oct 2026** so server and client render identically.
* PDF export uses the browser print dialog; Excel export produces an Excel-compatible `.xls` workbook.
