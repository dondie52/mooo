# LMHTS — Livestock Management & Health Tracking

Digital livestock management for smallholder farmers in Botswana. BMC-compliant vaccination tracking, health monitoring, breeding management, and analytics.

University of Botswana · Department of Computer Science · Refilwe Sengate (201805029)

## Stack

Next.js 15 · TypeScript · Tailwind · Supabase (Postgres + Auth + RLS + Edge Functions) · Recharts

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Set up Supabase
#    - Create a project at supabase.com
#    - Copy your keys into .env.local (see .env.example)

cp .env.example .env.local
# edit .env.local

# 3. Install Supabase CLI
npm install -g supabase

# 4. Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# 5. Push the database schema (once you've written the migration)
supabase db push

# 6. Generate TypeScript types from your database
npx supabase gen types typescript --linked > lib/supabase/database.types.ts

# 7. Run the dev server
npm run dev
```

Visit http://localhost:3000

## Project status

**Built:**
- Project scaffolding, Tailwind config, design system
- Supabase client setup (browser + server + middleware)
- Auth middleware with role-based route protection
- Login page
- Register page (farmer + vet)
- Utility helpers (date formatting, vaccination status, etc.)

**To build:** See `CLAUDE.md` for the full spec. Hand that file to Claude Code to continue.

## Structure

```
app/
  (auth)/            public routes — login, register
  (dashboard)/       authenticated routes — sidebar layout
  layout.tsx
  page.tsx           redirects to /dashboard or /login
  globals.css        Tailwind + component classes

lib/
  supabase/          client.ts, server.ts, middleware.ts, database.types.ts
  utils/             helpers

components/
  ui/                primitives
  dashboard/         KpiCard, BmcCoverageCard, PredictiveRiskPanel, etc.
  charts/            VaccinationTrendChart, HerdCompositionChart, etc.
  layout/            Sidebar, Topbar

supabase/
  migrations/        SQL migrations
  functions/         edge functions (send-reminders)
```

## Environment variables

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, for seed scripts and admin operations |
| `RESEND_API_KEY` | Email sending from the reminders edge function |

## Design system

See `tailwind.config.ts` for the full palette. Primary colors:

- **Forest green** (primary) — `#1c3829`
- **Gold** (accent) — `#c8861a`
- **Earth cream** (background) — `#faf7f0`
- **Alert red** — `#c0392b`

Fonts: Fraunces (display) + Inter (body).
