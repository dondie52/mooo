-- ============================================================
-- Migration 0009: System settings table
-- ============================================================

create table public.system_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.system_settings enable row level security;

-- Admin-only read
create policy "Admins read settings"
  on public.system_settings for select
  using (public.current_user_role() = 'admin');

-- Admin-only update
create policy "Admins update settings"
  on public.system_settings for update
  using (public.current_user_role() = 'admin');

-- Seed defaults
insert into public.system_settings (key, value) values
  ('bmc_threshold',           '80'),
  ('reminder_days',           '7'),
  ('overdue_escalation_days', '15'),
  ('email_enabled',           'true'),
  ('sender_name',             '"LMHTS"'),
  ('reply_to_email',          '""');

-- SECURITY DEFINER function so edge functions can read settings
-- without being blocked by RLS
create or replace function public.get_system_setting(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select value into result from public.system_settings where key = p_key;
  return result;
end;
$$;
