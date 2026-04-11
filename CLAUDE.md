# LMHTS — Claude Code Build Spec

This file tells Claude Code what this project is, what's already built, and what needs to be built. Read it fully before making changes.

## Project

**LMHTS** (Livestock Management & Health Tracking System) — a web application for smallholder cattle farmers in Botswana. Tracks animal records, vaccinations, health events, breeding cycles, and generates BMC/BAITS compliance reports.

**Author:** Refilwe Sengate (201805029), University of Botswana, Department of Computer Science. This is a final-year project.

**Target users:** Smallholder farmers (10–50 head of cattle), veterinary/extension officers, and system administrators.

## Stack

- **Next.js 15** (App Router, Server Components by default)
- **TypeScript** (strict)
- **Tailwind CSS** (custom palette — do not introduce other UI libraries without asking)
- **Supabase** (Postgres + Auth + RLS + Edge Functions + pg_cron)
- **Recharts** for charts (not Chart.js)
- **Lucide React** for icons
- **date-fns** for date handling
- **Zod** for form validation
- **Resend** for transactional email (from the edge function)

Do not add Shadcn, Radix, Chakra, MUI, or any component library. Styling stays in Tailwind with the custom component classes in `app/globals.css`.

## Design system

Defined in `tailwind.config.ts` and `app/globals.css`. Keep it consistent.

**Palette:**
- `forest-deep` `#0f2318`, `forest-mid` `#1c3829`, `forest-light` `#2d5840`, `forest-accent` `#4a8260`
- `gold` `#c8861a`, `gold-light` `#e8a93d`, `gold-dark` `#9c6510`
- `earth-cream` `#faf7f0` (body bg), `earth-sand` `#f2ead6`, `earth-stone` `#e8dfc8`
- `alert-red` `#c0392b`, `alert-amber` `#e8a93d`, `alert-green` `#3a7d4c`
- `muted` `#6b7564`, `border` `#e5e0d2`

**Typography:** Fraunces (display, for headings) + Inter (body). Loaded via Google Fonts in `app/globals.css`.

**Component classes available** (in `globals.css`): `.card`, `.card-hover`, `.btn-primary`, `.btn-secondary`, `.btn-gold`, `.input`, `.label`, `.badge`, `.badge-red`, `.badge-amber`, `.badge-green`, `.badge-muted`.

**Aesthetic direction:** Refined, professional, data-dense. NOT playful, NOT maximalist. The reference dashboard design this project is modeled on is a clean KPI-cards-plus-charts layout — see "Dashboard spec" below. Avoid decorative illustrations; every panel must display data.

## What's already built

```
package.json                    # deps installed? run `npm install` if not
tsconfig.json
next.config.mjs
tailwind.config.ts              # LMHTS palette + Fraunces/Inter fonts
postcss.config.mjs
.env.example                    # copy to .env.local and fill in Supabase keys
middleware.ts                   # calls updateSession()

app/
  layout.tsx                    # root layout
  page.tsx                      # redirects to /dashboard or /login
  globals.css                   # Tailwind + component classes
  (auth)/
    login/page.tsx              # DONE — styled two-column login
    register/page.tsx           # DONE — farmer/vet signup form

lib/
  supabase/
    client.ts                   # browser client
    server.ts                   # server component client
    middleware.ts               # session refresh + role-based route protection
    database.types.ts           # PLACEHOLDER — regenerate with `supabase gen types`
  utils/index.ts                # cn, formatDate, daysFromNow, vaccinationStatus, initials
```

**The auth flow is complete.** The register page assumes a Postgres trigger creates a `profiles` row when `auth.users` gets a new row — write this trigger in the migration (see below).

## What you need to build

Build these in order. Do not skip ahead. After each section, check it compiles and the dev server runs.

### 1. Supabase migration (`supabase/migrations/0001_initial.sql`)

Port the MySQL schema from the original PHP project to Postgres. Changes:

- IDs become `uuid default gen_random_uuid()` — no more AUTO_INCREMENT integers.
- Drop the `users` table. Use Supabase Auth's `auth.users` + a `public.profiles` table keyed on `auth.users.id`.
- Enums become real Postgres types: `user_role`, `animal_type`, `animal_status`, `gender`, `event_type`, `severity`, `outcome`, `alert_type`, `alert_severity`, `movement_type`, `breeding_event_type`, `acquired_how`.
- `DATETIME` → `timestamptz`. `ON UPDATE CURRENT_TIMESTAMP` → a trigger.
- Tables: `profiles`, `animals`, `health_events`, `vaccinations`, `breeding_records`, `movements`, `alerts`, `vet_assignments`, `audit_log`. Keep all the fields and FKs from the original.

**Signup trigger:**
```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone, farm_name, district)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'farmer'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'farm_name',
    new.raw_user_meta_data->>'district'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**RLS policies — REQUIRED.** Enable RLS on every table and write these policies (this replaces the `requireRole`/`accessibleAnimals` logic from the PHP version that was never actually enforced):

- **profiles:** users see their own profile; admins see all; users can update their own profile.
- **animals:** farmers see/manage only `owner_id = auth.uid()`; vets see animals belonging to farmers assigned to them via `vet_assignments`; admins see all.
- **health_events, vaccinations, breeding_records, movements:** scoped through `animals` — if a user can see the animal, they can see its records. Insert/update permission mirrors the animal's owner rule, except vets can also insert health_events and vaccinations for animals they're assigned to.
- **alerts:** users see only their own alerts.
- **vet_assignments:** vets and admins see rows involving them; admins manage.
- **audit_log:** admins only.

Create a `security definer` helper function `public.current_user_role()` that reads from `profiles` so policies don't hit `profiles` repeatedly.

**Postgres functions for the dashboard** (called via `supabase.rpc()`):

- `get_herd_composition()` → returns breed, count for the current user's accessible animals (respects RLS, so it uses `auth.uid()` and filters through the regular tables — don't use SECURITY DEFINER here).
- `get_vaccination_coverage_trend(months int default 6)` → returns month, coverage_pct for the last N months.
- `get_disease_frequency()` → returns condition_name, count from health_events in the last 12 months.
- `get_predictive_risk()` → returns animal_id, tag_number, breed, risk_level ('high'|'medium'|'low'), reason. Rules:
  - **High:** overdue vaccination (next_due_date < today) AND has a disease/injury health event in the last 90 days.
  - **Medium:** overdue vaccination OR (coverage for this animal's owner is below 80%).
  - **Low:** everything else.
- `get_upcoming_calvings(days int default 30)` → returns animal_id, tag_number, expected_date from breeding_records where event_type='pregnant', estimated via typical cattle gestation (283 days from mate date if available, else 60 days out from 'pregnant' date as an approximation).

**Seed data:** port the seed data from the original MySQL schema — 3 users (admin/farmer/vet), 10 animals, ~13 vaccinations, ~7 health events, breeding and movement records, and sample alerts. Use the signup trigger for users (insert into auth.users through Supabase, not raw seed).

Actually — for seed data, write it as a separate file `supabase/seed.sql` that runs after migrations. Create the three auth users via `supabase.auth.admin.createUser` in a TypeScript seed script at `scripts/seed.ts` instead, because direct inserts into `auth.users` require hashed passwords and are fragile. The script should:
1. Create the three users with password `Password@1234`
2. Insert animals, vaccinations, health events, etc. using the created user IDs
3. Be idempotent (check if data exists first)

### 2. Dashboard layout (`app/(dashboard)/layout.tsx`)

Server Component. Fetches the current user's profile. Renders:

- **Left sidebar** (fixed, 240px wide on desktop, collapsible drawer on mobile):
  - Top: LMHTS logo + user avatar with initials + full name + role label
  - Nav groups:
    - **Overview:** Dashboard
    - **Livestock:** Animals, Health Events, Vaccinations, Breeding
    - **Compliance:** Reports, Alerts (with unread count badge)
    - **Administration:** Users (admin only — check `profile.role === 'admin'`)
  - Bottom: Logout button (calls `supabase.auth.signOut()` then redirects)
- **Main content area:** renders `{children}`. Background `earth-cream`. Max width 1400px. Comfortable padding.

Use Lucide icons (`LayoutDashboard`, `Cog`, `HeartPulse`, `Syringe`, `Baby`, `FileText`, `Bell`, `Users`, `LogOut`).

Sidebar styling: dark forest background (`bg-forest-deep`), cream text, gold accent for active link. Active state detected via `usePathname()` — this means the sidebar itself is a Client Component, but the layout that wraps it is a Server Component that passes `profile` as a prop.

### 3. Dashboard page (`app/(dashboard)/dashboard/page.tsx`)

Server Component. This is the centerpiece — implements the approved design (refer to "Dashboard spec" below). Fetches all data in parallel using `Promise.all`, passes to client components for the charts.

### 4. Dashboard components

Create these in `components/dashboard/`:

- **KpiCard.tsx** — props: `{ label, value, sublabel?, trend?, variant?: 'default'|'warning'|'danger' }`. White card, small uppercase label, huge value (Fraunces, font-semibold, text-4xl), optional sublabel. Warning variant gets amber border-left; danger gets red.
- **BmcCoverageCard.tsx** — special KPI card showing vaccination coverage percentage with a progress bar and the 80% BMC threshold line marked on it. Shows "Compliant" (green) or "Below minimum" (red) badge.
- **PredictiveRiskPanel.tsx** — props: `{ animals: Array<{ tag_number, breed, risk_level, reason }> }`. List/table with colored risk badges (red/amber/green) and the rule that triggered the classification.
- **CriticalAlertCard.tsx** — props: `{ title, message, action?: { label, href } }`. Red card, bell icon, inline action button. Only rendered if there's an actual critical alert.
- **RecentAnimalsTable.tsx** — props: `{ animals }`. Simple table: tag, breed, location, vaccination status badge.

### 5. Chart components

Create in `components/charts/`. All are Client Components (`"use client"`). Use Recharts.

- **VaccinationTrendChart.tsx** — line chart, last 6 months, y-axis 0–100%, with a horizontal reference line at 80% labeled "BMC minimum". Forest-mid line color, gold dots.
- **HerdCompositionChart.tsx** — doughnut (pie with innerRadius). Colors from the LMHTS palette.
- **DiseaseFrequencyChart.tsx** — horizontal bar chart, top 6 conditions.

Every chart must have empty states ("No data yet — log your first vaccination to see trends").

### 6. Dashboard spec (reference for the dashboard page)

Layout (desktop, 12-column grid):

- **Row 1 (4 cards, 3 cols each):** Total Active Animals · BMC Vaccination Coverage (BmcCoverageCard) · Overdue Vaccinations (danger variant) · Upcoming Calvings (next 30 days)
- **Row 2:** Vaccination Coverage Trend (wide, 8 cols) · Herd Composition (4 cols)
- **Row 3:** Disease Frequency (6 cols) · Predictive Risk Panel (6 cols)
- **Row 4:** Recent Animals table (full width) — limit 5 rows, "View all →" link to /animals

If there's a critical alert (e.g. FMD outbreak, coverage below 80% with overdues), show a CriticalAlertCard as Row 0, above the KPIs.

Data fetching pattern:

```tsx
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { count: totalAnimals },
    { count: overdueCount },
    { data: coverageData },
    { data: composition },
    { data: diseaseFreq },
    { data: riskAnimals },
    { data: calvings },
    { data: recentAnimals },
  ] = await Promise.all([
    supabase.from("animals").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("vaccinations").select("*", { count: "exact", head: true }).lt("next_due_date", new Date().toISOString()),
    supabase.rpc("get_vaccination_coverage_trend", { months: 6 }),
    supabase.rpc("get_herd_composition"),
    supabase.rpc("get_disease_frequency"),
    supabase.rpc("get_predictive_risk"),
    supabase.rpc("get_upcoming_calvings", { days: 30 }),
    supabase.from("animals").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(5),
  ]);

  // ... render
}
```

### 7. Animals CRUD

- `app/(dashboard)/animals/page.tsx` — list with search and filter by status. Server Component for data, Client Component for the search input.
- `app/(dashboard)/animals/new/page.tsx` — form with Zod validation. Fields: tag_number, lits_tag, animal_type, breed, gender, date_of_birth, colour, location, acquired_date, acquired_how, notes. On submit, insert into `animals` with `owner_id = auth.uid()`.
- `app/(dashboard)/animals/[id]/page.tsx` — detail view showing the animal profile plus tabs: Health Events, Vaccinations, Breeding, Movements.
- `app/(dashboard)/animals/[id]/edit/page.tsx` — same form as new, pre-filled.

For delete, use a server action that calls `supabase.from("animals").delete().eq("animal_id", id)`. RLS will reject unauthorized deletes automatically.

### 8. Other pages

- `app/(dashboard)/health/page.tsx` — list of health events across all animals the user can see, with a "Log event" button.
- `app/(dashboard)/vaccinations/page.tsx` — three sections: Overdue, Upcoming (next 14 days), History. "Record vaccination" button.
- `app/(dashboard)/breeding/page.tsx` — breeding records list + expected calvings panel.
- `app/(dashboard)/reports/page.tsx` — four report cards (vaccination compliance, animal traceability, health summary, herd inventory) with date range filters and CSV export. CSV generated client-side from fetched data.
- `app/(dashboard)/alerts/page.tsx` — list with Mark as Read, filter by severity. Use Supabase Realtime subscription to get new alerts live.
- `app/(dashboard)/admin/users/page.tsx` — admin only (middleware enforces). List all profiles with role/is_active controls.

### 9. Edge function (`supabase/functions/send-reminders/index.ts`)

Port the PHP `cron/send_reminders.php`. Three existing rules plus one new:

1. 7-day advance vaccination reminders
2. Overdue vaccination alerts
3. Coverage below 80% warning
4. **NEW: Expected calving within 14 days** (breeding reminders — this was missing from the PHP and is needed to fully meet Objective 2)

Schedule with pg_cron:
```sql
select cron.schedule(
  'daily-reminders',
  '0 7 * * *',
  $$ select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
  ) $$
);
```

Use Resend API (`RESEND_API_KEY` env var) for email. Log each send into `alerts` table with `email_sent = true`.

## Conventions

- Server Components by default. Only add `"use client"` when you need state, effects, event handlers, or browser APIs.
- Data fetching in Server Components using `createClient()` from `lib/supabase/server`.
- Mutations in Server Actions (form `action={async (fd) => { "use server"; ... }}`) or Client Components calling `createClient()` from `lib/supabase/client`.
- Always use the component classes in `globals.css` first (`.card`, `.btn-primary`, etc.) before writing new Tailwind combinations.
- Every page that fetches user-specific data must call `supabase.auth.getUser()` and redirect to `/login` if null — the middleware handles this but defense in depth is cheap.
- Never use the service role key in client code. It stays in the edge function only.
- When you need new tables or columns, write a new migration file (`0002_*.sql`), don't edit `0001_initial.sql`.
- Form validation with Zod schemas in `lib/validators/`. Share schemas between server and client.

## Objectives this project must meet (for the dissertation)

1. Secure login, animal CRUD, health logging ✓ (auth done, CRUD to build)
2. Automated rule-based email reminders for vaccinations, breeding, health risks ← the breeding rule is new, don't forget it
3. Analytics with herd composition, vaccination coverage, disease trends, predictive risk ← this is where the original PHP was weak; the dashboard must deliver all four
4. Role-based access control via RLS (farmer/vet/admin) ← RLS must be real, not theoretical
5. BMC-compliant report generation (vaccination certificates, traceability, CSV export)

When in doubt, check the dashboard covers all four analytics types from objective 3, and that RLS policies exist on every table for objective 4.

## First steps when you open this project

1. `npm install`
2. Create a Supabase project at supabase.com
3. Copy `.env.example` to `.env.local` and fill in keys
4. Install Supabase CLI: `npm install -g supabase`
5. `supabase link --project-ref YOUR_PROJECT_REF`
6. Write and run `supabase/migrations/0001_initial.sql` via `supabase db push`
7. Run `npx supabase gen types typescript --linked > lib/supabase/database.types.ts` to replace the placeholder types
8. Build the seed script and run it
9. `npm run dev` and verify login works
10. Start building the dashboard

Good luck.
