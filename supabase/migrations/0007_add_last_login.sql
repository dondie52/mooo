-- Add last_login column to profiles for topbar greeting
alter table public.profiles
  add column if not exists last_login timestamptz;
