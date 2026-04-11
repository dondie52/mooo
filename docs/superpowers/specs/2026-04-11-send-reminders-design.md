# Send-Reminders Edge Function — Design Spec

## Context

Objective 2 of the LMHTS project requires automated rule-based email reminders for vaccinations, breeding, and health risks. The PHP `cron/send_reminders.php` from the original project needs to be ported to a Supabase Edge Function. This is currently the biggest gap in the project — the edge function directory exists but is empty.

## Architecture

A single Deno edge function at `supabase/functions/send-reminders/index.ts`.

**Trigger:** pg_cron schedule (`0 7 * * *`) calls `net.http_post()` to invoke the function daily at 7am.

**Auth:** The function validates the `Authorization: Bearer <service_role_key>` header. It uses the service role Supabase client internally to bypass RLS (it needs to query all farmers' data).

**Email:** Brevo transactional API (`POST https://api.brevo.com/v3/smtp/email`) using `BREVO_API_KEY` env var.

**User email lookup:** The `profiles` table has no email column. The function fetches emails from `auth.users` via `supabase.auth.admin.listUsers()`, building a `Map<userId, email>`.

## Reminder Rules

### Rule 1: 7-day advance vaccination reminder
- **Query:** vaccinations where `next_due_date` is between today and today+7 days, `reminder_sent = false`
- **Join:** animals (for tag_number, owner_id) → profiles (for user_id, full_name)
- **Alert type:** `vaccination_due`, severity: `info`
- **After send:** set `reminder_sent = true` on the vaccination row
- **Dedup:** the `reminder_sent` flag prevents re-sending

### Rule 2: Overdue vaccination alert
- **Query:** vaccinations where `next_due_date < today`
- **Join:** same as Rule 1
- **Alert type:** `vaccination_overdue`, severity: `warning` (1-14 days) or `critical` (15+ days)
- **Dedup:** check if alert with same `alert_type` + `animal_id` + `user_id` exists today (created_at >= today)

### Rule 3: Coverage below 80% BMC threshold
- **Query:** per-farmer coverage calculation (same logic as `owner_coverage` CTE in `get_predictive_risk`):
  - count active animals per owner
  - count animals with at least one non-overdue vaccination
  - coverage = vaccinated / total * 100
- **Filter:** farmers where coverage < 80
- **Alert type:** `disease_risk`, severity: `warning`
- **Dedup:** one alert per farmer per day (check existing alert today)

### Rule 4: Expected calving within 14 days
- **Query:** reuse logic from `get_upcoming_calvings(14)` RPC:
  - breeding_records where `event_type IN ('mating', 'pregnant')`
  - no subsequent 'calving' or 'abortion' for the same animal
  - expected date = event_date + 283 days (mating) or event_date + 60 days (pregnant fallback)
  - filter where expected date is between today and today+14
- **Join:** animals → profiles
- **Alert type:** `health_event`, severity: `info`
- **Dedup:** check existing alert today

## Email Template

Simple branded HTML email:
- LMHTS header bar (forest-deep background, gold text)
- Greeting: "Hello {full_name},"
- Rule-specific body with animal details
- Action button linking to the relevant app page
- Footer: "LMHTS — Livestock Management & Health Tracking System"

Sent via Brevo with:
- `sender`: `{ name: "LMHTS", email: "noreply@lmhts.bw" }` (or whatever verified sender domain exists)
- `to`: `[{ email: userEmail, name: fullName }]`
- `subject`: rule-specific
- `htmlContent`: the template

## Data Flow

```
1. Function invoked via HTTP POST
2. Validate Authorization header
3. Create service-role Supabase client
4. Fetch all user emails from auth.users → Map<userId, email>
5. Run Rule 1 query → for each result: insert alert + send email + update reminder_sent
6. Run Rule 2 query → for each result: insert alert + send email (if not already alerted today)
7. Run Rule 3 query → for each farmer below 80%: insert alert + send email
8. Run Rule 4 query → for each upcoming calving: insert alert + send email
9. Return JSON summary: { rule1: N, rule2: N, rule3: N, rule4: N, errors: [] }
```

## File Structure

```
supabase/
  functions/
    send-reminders/
      index.ts          # Main handler: auth, orchestration, response
  migrations/
    0002_pg_cron.sql    # pg_cron schedule for daily 7am invocation
```

The function is a single file (~200-250 lines). No external dependencies beyond `@supabase/supabase-js` (available in Deno edge runtime via esm.sh).

## pg_cron Migration

New file `supabase/migrations/0002_pg_cron.sql`:

```sql
select cron.schedule(
  'daily-reminders',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://qjalhbedktyyquqscrdp.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
```

## Error Handling

- If Brevo API fails for one email, log the error but continue processing remaining reminders
- Set `email_sent = false` on the alert row if email fails (alert still created for in-app visibility)
- Return all errors in the response JSON for debugging
- The function itself always returns 200 with a summary (even if some emails failed)

## Environment Variables (Edge Function)

Set via `supabase secrets set`:
- `BREVO_API_KEY` — already in .env.local
- `SUPABASE_SERVICE_ROLE_KEY` — already in .env.local
- `SUPABASE_URL` — auto-available in edge functions as `Deno.env.get("SUPABASE_URL")`

## Verification

1. Deploy: `supabase functions deploy send-reminders`
2. Test manually: `curl -X POST https://qjalhbedktyyquqscrdp.supabase.co/functions/v1/send-reminders -H "Authorization: Bearer <service_role_key>"`
3. Check alerts table for new rows
4. Check Brevo dashboard for sent emails
5. Verify `reminder_sent` flag updated on vaccinations
6. Run pg_cron migration and verify schedule exists
