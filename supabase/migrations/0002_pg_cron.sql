-- Enable required extensions
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Schedule daily reminder emails at 7am UTC
select cron.schedule(
  'daily-reminders',
  '0 7 * * *',
  $$
  select net.http_post(
    url := current_setting('supabase_functions_endpoint') || '/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
