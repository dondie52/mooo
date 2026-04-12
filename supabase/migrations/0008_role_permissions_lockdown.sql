-- =============================================================================
-- 0006 — Role Permissions Lockdown
-- Tightens RLS policies to match the authoritative vet/admin/farmer spec.
-- Drops conflicting policies from 0001/0003/0004 and recreates them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. HEALTH_EVENTS — vet update + scoped delete
-- ---------------------------------------------------------------------------

-- Drop old policies that are being replaced
drop policy if exists "Owners update health events"                     on public.health_events;
drop policy if exists "Vets update health events for assigned animals"  on public.health_events;  -- from 0004
drop policy if exists "Owners delete health events"                     on public.health_events;

-- UPDATE: farmer (own animals) + vet (assigned animals) + logged_by user + admin
create policy "Update health events"
  on public.health_events for update
  using (
    logged_by = auth.uid()                                      -- author can always edit own entries
    or public.current_user_role() = 'admin'
    or exists (
      select 1 from public.animals a
      where a.animal_id = health_events.animal_id
        and (
          a.owner_id = auth.uid()                               -- farmer owns the animal
          or (
            public.current_user_role() = 'vet'
            and exists (
              select 1 from public.vet_assignments va
              where va.vet_id = auth.uid()
                and va.farmer_id = a.owner_id
                and va.is_active = true
            )
          )
        )
    )
  );

-- DELETE: farmer (own animals) + admin + vet (only own logged_by entries)
create policy "Delete health events"
  on public.health_events for delete
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.animals a
      where a.animal_id = health_events.animal_id
        and a.owner_id = auth.uid()                             -- farmer owns the animal
    )
    or (
      public.current_user_role() = 'vet'
      and health_events.logged_by = auth.uid()                  -- vet can only delete own entries
    )
  );

-- ---------------------------------------------------------------------------
-- 2. VACCINATIONS — vet update + scoped delete
-- ---------------------------------------------------------------------------

drop policy if exists "Owners update vaccinations" on public.vaccinations;
drop policy if exists "Owners delete vaccinations" on public.vaccinations;

-- UPDATE: farmer (own animals) + vet (assigned animals) + logged_by user + admin
create policy "Update vaccinations"
  on public.vaccinations for update
  using (
    logged_by = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (
      select 1 from public.animals a
      where a.animal_id = vaccinations.animal_id
        and (
          a.owner_id = auth.uid()
          or (
            public.current_user_role() = 'vet'
            and exists (
              select 1 from public.vet_assignments va
              where va.vet_id = auth.uid()
                and va.farmer_id = a.owner_id
                and va.is_active = true
            )
          )
        )
    )
  );

-- DELETE: farmer (own animals) + admin + vet (only own logged_by entries)
create policy "Delete vaccinations"
  on public.vaccinations for delete
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.animals a
      where a.animal_id = vaccinations.animal_id
        and a.owner_id = auth.uid()
    )
    or (
      public.current_user_role() = 'vet'
      and vaccinations.logged_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. PROFILES — prevent users from changing their own role
-- ---------------------------------------------------------------------------

drop policy if exists "Users update own profile" on public.profiles;

-- Users can update own profile but cannot change their role
create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      public.current_user_role() = 'admin'           -- admins can set any role
      or role = public.current_user_role()            -- non-admins: role must stay unchanged
    )
  );

-- ---------------------------------------------------------------------------
-- 4. AUDIT_LOG — SECURITY DEFINER insert function (bypasses RLS)
-- ---------------------------------------------------------------------------

-- Keep "Admins read audit log" and "Admins insert audit log" from 0001.
-- Add a SECURITY DEFINER function so server-side code can insert audit rows
-- without requiring the caller to be admin (e.g. edge functions, triggers).

create or replace function public.log_audit_entry(
  p_action     text,
  p_table_name text    default null,
  p_record_id  uuid    default null,
  p_old_data   jsonb   default null,
  p_new_data   jsonb   default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data);
end;
$$;
