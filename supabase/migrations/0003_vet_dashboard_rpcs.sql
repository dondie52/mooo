-- Vet Dashboard: RLS policy + RPC functions
-- Allows vets to read assigned farmer profiles and provides
-- aggregated data for the vet-specific dashboard.

-- ── RLS: Let vets read their assigned farmers' profiles ────────────

create policy "Vets read assigned farmer profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.vet_assignments va
      where va.vet_id = auth.uid()
        and va.farmer_id = profiles.id
        and va.is_active = true
    )
  );

-- ── RPC 1: Vet's assigned farmers with stats ──────────────────────

create or replace function public.get_vet_assigned_farmers(vet_uuid uuid)
returns table(
  farmer_id     uuid,
  full_name     text,
  farm_name     text,
  district      text,
  animal_count  bigint,
  coverage_pct  numeric,
  overdue_count bigint,
  last_visit_date date
)
language sql stable security invoker
set search_path = public
as $$
  with assigned as (
    select va.farmer_id
    from public.vet_assignments va
    where va.vet_id = vet_uuid
      and va.is_active = true
  ),
  farmer_animals as (
    select
      a.owner_id,
      a.animal_id
    from public.animals a
    inner join assigned af on af.farmer_id = a.owner_id
    where a.status = 'active'
  ),
  animal_counts as (
    select owner_id, count(*) as cnt
    from farmer_animals
    group by owner_id
  ),
  coverage as (
    select
      fa.owner_id,
      case
        when count(distinct fa.animal_id) = 0 then 100
        else round(
          count(distinct case
            when v.vacc_id is not null
              and (v.next_due_date is null or v.next_due_date >= current_date)
            then fa.animal_id
          end)::numeric / count(distinct fa.animal_id) * 100, 1
        )
      end as pct
    from farmer_animals fa
    left join public.vaccinations v on v.animal_id = fa.animal_id
    group by fa.owner_id
  ),
  overdue as (
    select
      fa.owner_id,
      count(distinct v.vacc_id) as cnt
    from farmer_animals fa
    inner join public.vaccinations v on v.animal_id = fa.animal_id
    where v.next_due_date is not null
      and v.next_due_date < current_date
    group by fa.owner_id
  ),
  last_visits as (
    select
      a.owner_id,
      max(he.event_date) as visit_date
    from public.health_events he
    inner join public.animals a on a.animal_id = he.animal_id
    inner join assigned af on af.farmer_id = a.owner_id
    where he.logged_by = vet_uuid
    group by a.owner_id
  )
  select
    p.id as farmer_id,
    p.full_name,
    p.farm_name,
    p.district,
    coalesce(ac.cnt, 0) as animal_count,
    coalesce(cov.pct, 100) as coverage_pct,
    coalesce(od.cnt, 0) as overdue_count,
    lv.visit_date as last_visit_date
  from public.profiles p
  inner join assigned a on a.farmer_id = p.id
  left join animal_counts ac on ac.owner_id = p.id
  left join coverage cov on cov.owner_id = p.id
  left join overdue od on od.owner_id = p.id
  left join last_visits lv on lv.owner_id = p.id
  order by p.full_name;
$$;

-- ── RPC 2: Active cases for vet's assigned farmers ────────────────

create or replace function public.get_vet_active_cases(vet_uuid uuid)
returns table(
  event_id       uuid,
  animal_id      uuid,
  tag_number     text,
  condition_name text,
  severity       text,
  event_date     date,
  farmer_name    text,
  outcome        text
)
language sql stable security invoker
set search_path = public
as $$
  select
    he.event_id,
    he.animal_id,
    a.tag_number,
    he.condition_name,
    he.severity::text,
    he.event_date,
    p.full_name as farmer_name,
    he.outcome::text
  from public.health_events he
  inner join public.animals a on a.animal_id = he.animal_id
  inner join public.vet_assignments va
    on va.farmer_id = a.owner_id
    and va.vet_id = vet_uuid
    and va.is_active = true
  inner join public.profiles p on p.id = a.owner_id
  where he.outcome in ('recovering', 'ongoing')
    and a.status = 'active'
  order by he.event_date desc;
$$;

-- ── RPC 3: Upcoming vaccinations for vet's assigned farmers ───────

create or replace function public.get_vet_upcoming_vaccinations(
  vet_uuid uuid,
  days int default 7
)
returns table(
  vacc_id       uuid,
  animal_id     uuid,
  tag_number    text,
  vaccine_name  text,
  next_due_date date,
  farmer_name   text
)
language sql stable security invoker
set search_path = public
as $$
  select
    v.vacc_id,
    v.animal_id,
    a.tag_number,
    v.vaccine_name,
    v.next_due_date,
    p.full_name as farmer_name
  from public.vaccinations v
  inner join public.animals a on a.animal_id = v.animal_id
  inner join public.vet_assignments va
    on va.farmer_id = a.owner_id
    and va.vet_id = vet_uuid
    and va.is_active = true
  inner join public.profiles p on p.id = a.owner_id
  where v.next_due_date is not null
    and v.next_due_date >= current_date
    and v.next_due_date <= current_date + days
    and a.status = 'active'
  order by v.next_due_date;
$$;
