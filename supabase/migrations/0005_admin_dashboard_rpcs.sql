-- ---------------------------------------------------------------------------
-- Admin Dashboard RPC Functions
-- All use SECURITY INVOKER — rely on existing RLS policies (admins can
-- already SELECT on all tables via 0001_initial.sql policies).
-- ---------------------------------------------------------------------------

-- 1. System-wide stats for admin KPI cards
create or replace function get_admin_system_stats()
returns table (
  total_users int,
  total_farmers int,
  total_vets int,
  total_animals int,
  avg_coverage_pct int,
  active_alerts_7d int
) language sql stable security invoker as $$
  select
    (select count(*) from profiles where is_active = true)::int,
    (select count(*) from profiles where role = 'farmer' and is_active = true)::int,
    (select count(*) from profiles where role = 'vet' and is_active = true)::int,
    (select count(*) from animals where status = 'active')::int,
    coalesce((
      select round(avg(coverage))::int from (
        select
          case when count(distinct a.animal_id) = 0 then 0
               else (count(distinct case when v.next_due_date >= current_date then v.animal_id end)::numeric
                     / count(distinct a.animal_id) * 100)
          end as coverage
        from profiles p
        left join animals a on a.owner_id = p.id and a.status = 'active'
        left join vaccinations v on v.animal_id = a.animal_id
        where p.role = 'farmer' and p.is_active = true
        group by p.id
        having count(distinct a.animal_id) > 0
      ) farm_coverage
    ), 0),
    (select count(*) from alerts where created_at >= current_date - interval '7 days')::int;
$$;

-- 2. All farms with compliance status (sorted worst-first)
create or replace function get_admin_all_farms()
returns table (
  farmer_id uuid,
  full_name text,
  farm_name text,
  district text,
  animal_count int,
  coverage_pct int,
  overdue_count int,
  assigned_vet_name text,
  is_active boolean
) language sql stable security invoker as $$
  select
    p.id,
    p.full_name,
    p.farm_name,
    p.district,
    coalesce(stats.total, 0)::int,
    case when coalesce(stats.total, 0) = 0 then 0
         else round((coalesce(stats.compliant, 0)::numeric / stats.total) * 100)::int
    end,
    coalesce(stats.overdue, 0)::int,
    vp.full_name,
    p.is_active
  from profiles p
  left join lateral (
    select
      count(distinct a.animal_id) as total,
      count(distinct case when v.next_due_date >= current_date then v.animal_id end) as compliant,
      count(distinct case when v.next_due_date < current_date then v.animal_id end) as overdue
    from animals a
    left join vaccinations v on v.animal_id = a.animal_id
    where a.owner_id = p.id and a.status = 'active'
  ) stats on true
  left join vet_assignments va on va.farmer_id = p.id
  left join profiles vp on vp.id = va.vet_id
  where p.role = 'farmer'
  order by
    case when coalesce(stats.total, 0) = 0 then 0
         else round((coalesce(stats.compliant, 0)::numeric / stats.total) * 100)::int
    end asc,
    p.full_name;
$$;

-- 3. Vet workload overview
create or replace function get_admin_vet_workload()
returns table (
  vet_id uuid,
  full_name text,
  farmer_count int,
  animal_count int
) language sql stable security invoker as $$
  select
    p.id,
    p.full_name,
    count(distinct va.farmer_id)::int,
    coalesce(sum(animal_stats.total), 0)::int
  from profiles p
  left join vet_assignments va on va.vet_id = p.id
  left join lateral (
    select count(*) as total from animals
    where owner_id = va.farmer_id and status = 'active'
  ) animal_stats on true
  where p.role = 'vet' and p.is_active = true
  group by p.id, p.full_name
  order by count(distinct va.farmer_id) desc;
$$;

-- 4. Recent system activity from audit log
create or replace function get_admin_recent_activity(lim int default 15)
returns table (
  log_id uuid,
  user_name text,
  action text,
  table_name text,
  created_at timestamptz
) language sql stable security invoker as $$
  select al.log_id, p.full_name, al.action, al.table_name, al.created_at
  from audit_log al
  left join profiles p on p.id = al.user_id
  order by al.created_at desc
  limit lim;
$$;
