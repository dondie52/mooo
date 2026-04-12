-- Fix: admins could not read other users' alerts (only user_id = auth.uid() existed)
-- This caused the Active Alerts KPI on the admin dashboard to always show 0.

create policy "Admins read all alerts"
  on public.alerts for select
  using (public.current_user_role() = 'admin');
