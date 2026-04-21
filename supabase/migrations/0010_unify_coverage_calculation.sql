-- ---------------------------------------------------------------------------
-- Unify vaccination coverage calculation across all dashboards
--
-- Before this migration three RPCs computed farm vaccination coverage with
-- different formulas, so the same farm could show 60% to a vet and 80% to
-- its farmer. This replaces them with a single `get_farm_coverage` helper
-- that all three dashboards delegate to.
--
-- Canonical formula:
--   (active animals with >= 1 vaccination where next_due_date >= today)
--   / (total active animals)  * 100,  rounded to int
-- ---------------------------------------------------------------------------

-- 1. Shared source of truth
create or replace function public.get_farm_coverage(farmer_uuid uuid)
returns int
language sql stable security invoker
set search_path = public
as $$
  select case
    when count(distinct a.animal_id) = 0 then 0
    else round(
      count(distinct case when v.next_due_date >= current_date then a.animal_id end)::numeric
      / count(distinct a.animal_id) * 100
    )::int
  end
  from public.animals a
  left join public.vaccinations v on v.animal_id = a.animal_id
  where a.owner_id = farmer_uuid
    and a.status = 'active';
$$;

-- 2. Vet dashboard: delegate coverage_pct to the shared fn
create or replace function public.get_vet_assigned_farmers(vet_uuid uuid)
returns table(
  farmer_id       uuid,
  full_name       text,
  farm_name       text,
  district        text,
  animal_count    bigint,
  coverage_pct    numeric,
  overdue_count   bigint,
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
    public.get_farm_coverage(p.id)::numeric as coverage_pct,
    coalesce(od.cnt, 0) as overdue_count,
    lv.visit_date as last_visit_date
  from public.profiles p
  inner join assigned a on a.farmer_id = p.id
  left join animal_counts ac on ac.owner_id = p.id
  left join overdue od on od.owner_id = p.id
  left join last_visits lv on lv.owner_id = p.id
  order by p.full_name;
$$;

-- 3. Admin farms list: delegate coverage_pct to the shared fn
create or replace function public.get_admin_all_farms()
returns table (
  farmer_id         uuid,
  full_name         text,
  farm_name         text,
  district          text,
  animal_count      int,
  coverage_pct      int,
  overdue_count     int,
  assigned_vet_name text,
  is_active         boolean
)
language sql stable security invoker
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.farm_name,
    p.district,
    coalesce(stats.total, 0)::int,
    public.get_farm_coverage(p.id),
    coalesce(stats.overdue, 0)::int,
    vp.full_name,
    p.is_active
  from public.profiles p
  left join lateral (
    select
      count(distinct a.animal_id) as total,
      count(distinct case when v.next_due_date < current_date then v.animal_id end) as overdue
    from public.animals a
    left join public.vaccinations v on v.animal_id = a.animal_id
    where a.owner_id = p.id and a.status = 'active'
  ) stats on true
  left join public.vet_assignments va on va.farmer_id = p.id
  left join public.profiles vp on vp.id = va.vet_id
  where p.role = 'farmer'
  order by
    public.get_farm_coverage(p.id) asc,
    p.full_name;
$$;

-- 4. Admin system stats: average coverage across farms with >= 1 animal,
--    using the shared fn
create or replace function public.get_admin_system_stats()
returns table (
  total_users      int,
  total_farmers    int,
  total_vets       int,
  total_animals    int,
  avg_coverage_pct int,
  active_alerts_7d int
)
language sql stable security invoker
set search_path = public
as $$
  select
    (select count(*) from public.profiles where is_active = true)::int,
    (select count(*) from public.profiles where role = 'farmer' and is_active = true)::int,
    (select count(*) from public.profiles where role = 'vet' and is_active = true)::int,
    (select count(*) from public.animals where status = 'active')::int,
    coalesce((
      select round(avg(public.get_farm_coverage(p.id)))::int
      from public.profiles p
      where p.role = 'farmer'
        and p.is_active = true
        and exists (
          select 1 from public.animals a
          where a.owner_id = p.id and a.status = 'active'
        )
    ), 0),
    (select count(*) from public.alerts where created_at >= current_date - interval '7 days')::int;
$$;
