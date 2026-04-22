-- =============================================================================
-- 0011 — Veterinary Officer Vaccination Certification Workflow
--
-- Adds a certification layer on top of vaccinations:
--   • Farmer-logged entries start as 'pending' and alert the assigned vet(s).
--   • Vet-logged entries are auto-certified on insert.
--   • Vets certify / reject via security-definer RPCs scoped to active
--     assignments. Admins bypass assignment checks.
--   • Certified rows are locked against farmer edits; a column-level trigger
--     keeps vets from modifying clinical fields while certifying.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum + columns
-- ---------------------------------------------------------------------------

create type public.vaccination_cert_status as enum ('pending', 'certified', 'rejected');

alter table public.vaccinations
  add column cert_status   public.vaccination_cert_status not null default 'pending',
  add column certified_by  uuid references public.profiles(id) on delete set null,
  add column certified_at  timestamptz,
  add column vet_notes     text;

alter type public.alert_type add value if not exists 'vaccination_certification_pending';

-- ---------------------------------------------------------------------------
-- 2. Backfill: grandfather all pre-existing rows as certified so BMC coverage
--    metrics do not regress on rollout.
-- ---------------------------------------------------------------------------

update public.vaccinations
   set cert_status  = 'certified',
       certified_by = logged_by,
       certified_at = created_at
 where cert_status = 'pending';

-- ---------------------------------------------------------------------------
-- 3. BEFORE INSERT trigger — auto-certify vet/admin entries; otherwise mark
--    'pending' and alert every active vet assigned to the animal's owner.
-- ---------------------------------------------------------------------------

create or replace function public.set_vaccination_cert_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  logger_role  public.user_role;
  v_owner_id   uuid;
  v_tag_number text;
  assigned_vet uuid;
begin
  select role into logger_role from public.profiles where id = new.logged_by;

  if logger_role in ('vet', 'admin') then
    new.cert_status  := 'certified';
    new.certified_by := new.logged_by;
    new.certified_at := now();
    return new;
  end if;

  -- Farmer-logged entry: remains 'pending' and we alert assigned vets.
  new.cert_status  := 'pending';
  new.certified_by := null;
  new.certified_at := null;

  select a.owner_id, a.tag_number
    into v_owner_id, v_tag_number
    from public.animals a
   where a.animal_id = new.animal_id;

  for assigned_vet in
    select vet_id
      from public.vet_assignments
     where farmer_id = v_owner_id
       and is_active = true
  loop
    insert into public.alerts (user_id, animal_id, alert_type, severity, title, message)
    values (
      assigned_vet,
      new.animal_id,
      'vaccination_certification_pending',
      'info',
      'Vaccination awaiting certification',
      'Farmer logged ' || new.vaccine_name || ' for animal ' || v_tag_number
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists vaccinations_before_insert_cert on public.vaccinations;
create trigger vaccinations_before_insert_cert
  before insert on public.vaccinations
  for each row execute function public.set_vaccination_cert_on_insert();

-- ---------------------------------------------------------------------------
-- 4. BEFORE UPDATE trigger — column-level guard.
--    RLS can't restrict which columns an UPDATE touches, so we enforce:
--      - Admins: anything goes.
--      - Vets: may ONLY update cert_status, certified_by, certified_at,
--              vet_notes. Clinical fields are frozen.
--      - Farmers: must not touch certification fields at all; cannot edit a
--              row that is already 'certified'. Editing a 'rejected' row
--              resets it to 'pending' for re-review.
-- ---------------------------------------------------------------------------

create or replace function public.guard_vaccination_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role public.user_role := public.current_user_role();
begin
  if my_role = 'admin' then
    return new;
  end if;

  if my_role = 'vet' then
    if new.animal_id     is distinct from old.animal_id
       or new.vaccine_name  is distinct from old.vaccine_name
       or new.date_given    is distinct from old.date_given
       or new.next_due_date is distinct from old.next_due_date
       or new.batch_number  is distinct from old.batch_number
       or new.vet_name      is distinct from old.vet_name
       or new.notes         is distinct from old.notes
       or new.logged_by     is distinct from old.logged_by then
      raise exception 'Vets may only update certification fields on vaccinations';
    end if;
    return new;
  end if;

  -- Farmer path (the RLS policy already ensures this is the owner).
  if old.cert_status = 'certified' then
    raise exception 'Cannot edit a certified vaccination';
  end if;

  if new.cert_status  is distinct from old.cert_status
     or new.certified_by is distinct from old.certified_by
     or new.certified_at is distinct from old.certified_at
     or new.vet_notes    is distinct from old.vet_notes then
    raise exception 'Farmers cannot change certification fields';
  end if;

  if old.cert_status = 'rejected' then
    new.cert_status  := 'pending';
    new.certified_by := null;
    new.certified_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists vaccinations_before_update_guard on public.vaccinations;
create trigger vaccinations_before_update_guard
  before update on public.vaccinations
  for each row execute function public.guard_vaccination_update();

-- ---------------------------------------------------------------------------
-- 5. BEFORE DELETE trigger — farmers cannot delete certified rows.
-- ---------------------------------------------------------------------------

create or replace function public.guard_vaccination_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role public.user_role := public.current_user_role();
begin
  if my_role = 'admin' then return old; end if;
  if my_role = 'farmer' and old.cert_status = 'certified' then
    raise exception 'Cannot delete a certified vaccination';
  end if;
  return old;
end;
$$;

drop trigger if exists vaccinations_before_delete_guard on public.vaccinations;
create trigger vaccinations_before_delete_guard
  before delete on public.vaccinations
  for each row execute function public.guard_vaccination_delete();

-- ---------------------------------------------------------------------------
-- 6. RPC: list pending vaccinations for the calling vet
-- ---------------------------------------------------------------------------

create or replace function public.get_pending_vaccinations_for_vet()
returns table (
  vacc_id        uuid,
  animal_id      uuid,
  tag_number     text,
  breed          text,
  vaccine_name   text,
  date_given     date,
  next_due_date  date,
  batch_number   text,
  notes          text,
  farmer_id      uuid,
  farmer_name    text,
  logged_at      timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    v.vacc_id,
    v.animal_id,
    a.tag_number,
    a.breed,
    v.vaccine_name,
    v.date_given,
    v.next_due_date,
    v.batch_number,
    v.notes,
    a.owner_id   as farmer_id,
    p.full_name  as farmer_name,
    v.created_at as logged_at
  from public.vaccinations v
  join public.animals  a on a.animal_id = v.animal_id
  join public.profiles p on p.id        = a.owner_id
  where v.cert_status = 'pending'
    and exists (
      select 1 from public.vet_assignments va
       where va.vet_id   = auth.uid()
         and va.farmer_id = a.owner_id
         and va.is_active = true
    )
  order by v.created_at asc;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: certify_vaccination
-- ---------------------------------------------------------------------------

create or replace function public.certify_vaccination(
  p_vacc_id   uuid,
  p_vet_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  my_role    public.user_role := public.current_user_role();
begin
  if my_role not in ('vet', 'admin') then
    raise exception 'Only vets or admins can certify vaccinations';
  end if;

  select a.owner_id into v_owner_id
    from public.vaccinations v
    join public.animals a on a.animal_id = v.animal_id
   where v.vacc_id = p_vacc_id;

  if v_owner_id is null then
    raise exception 'Vaccination not found';
  end if;

  if my_role = 'vet' and not exists (
    select 1 from public.vet_assignments
     where vet_id = auth.uid()
       and farmer_id = v_owner_id
       and is_active = true
  ) then
    raise exception 'You are not the assigned vet for this farmer';
  end if;

  update public.vaccinations
     set cert_status  = 'certified',
         certified_by = auth.uid(),
         certified_at = now(),
         vet_notes    = coalesce(p_vet_notes, vet_notes)
   where vacc_id = p_vacc_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC: reject_vaccination (also used for "request clarification" — the
--    farmer can edit and resubmit, flipping the row back to 'pending')
-- ---------------------------------------------------------------------------

create or replace function public.reject_vaccination(
  p_vacc_id uuid,
  p_reason  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id   uuid;
  v_tag_number text;
  v_vaccine    text;
  my_role      public.user_role := public.current_user_role();
begin
  if my_role not in ('vet', 'admin') then
    raise exception 'Only vets or admins can reject vaccinations';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required to reject a vaccination';
  end if;

  select a.owner_id, a.tag_number, v.vaccine_name
    into v_owner_id, v_tag_number, v_vaccine
    from public.vaccinations v
    join public.animals a on a.animal_id = v.animal_id
   where v.vacc_id = p_vacc_id;

  if v_owner_id is null then
    raise exception 'Vaccination not found';
  end if;

  if my_role = 'vet' and not exists (
    select 1 from public.vet_assignments
     where vet_id = auth.uid()
       and farmer_id = v_owner_id
       and is_active = true
  ) then
    raise exception 'You are not the assigned vet for this farmer';
  end if;

  update public.vaccinations
     set cert_status  = 'rejected',
         certified_by = auth.uid(),
         certified_at = now(),
         vet_notes    = p_reason
   where vacc_id = p_vacc_id;

  -- Notify the farmer
  insert into public.alerts (user_id, animal_id, alert_type, severity, title, message)
  values (
    v_owner_id,
    (select animal_id from public.vaccinations where vacc_id = p_vacc_id),
    'system',
    'warning',
    'Vaccination entry rejected',
    v_vaccine || ' for ' || v_tag_number || ' was rejected. Reason: ' || p_reason
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. RPC: revoke_vaccination_cert — resets a certified row back to 'pending'.
--    Only the certifying vet or an admin can revoke.
-- ---------------------------------------------------------------------------

create or replace function public.revoke_vaccination_cert(
  p_vacc_id uuid,
  p_reason  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cert_by uuid;
  my_role   public.user_role := public.current_user_role();
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required to revoke certification';
  end if;

  select certified_by into v_cert_by
    from public.vaccinations where vacc_id = p_vacc_id;

  if v_cert_by is null then
    raise exception 'Vaccination not found or not certified';
  end if;

  if my_role <> 'admin' and v_cert_by <> auth.uid() then
    raise exception 'Only the certifying vet or an admin can revoke certification';
  end if;

  update public.vaccinations
     set cert_status  = 'pending',
         certified_by = null,
         certified_at = null,
         vet_notes    = 'Certification revoked: ' || p_reason
   where vacc_id = p_vacc_id;
end;
$$;

grant execute on function public.get_pending_vaccinations_for_vet()                     to authenticated;
grant execute on function public.certify_vaccination(uuid, text)                        to authenticated;
grant execute on function public.reject_vaccination(uuid, text)                         to authenticated;
grant execute on function public.revoke_vaccination_cert(uuid, text)                    to authenticated;
