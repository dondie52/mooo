-- =============================================================================
-- LMHTS Initial Migration
-- Livestock Management & Health Tracking System — Postgres / Supabase
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------

create type public.user_role       as enum ('farmer', 'vet', 'admin');
create type public.animal_type     as enum ('cattle', 'goat', 'sheep');
create type public.animal_status   as enum ('active', 'sold', 'deceased', 'missing');
create type public.gender          as enum ('male', 'female');
create type public.event_type      as enum ('disease', 'injury', 'treatment', 'vaccination', 'checkup', 'other');
create type public.severity        as enum ('mild', 'moderate', 'severe', 'critical');
create type public.outcome         as enum ('recovering', 'recovered', 'ongoing', 'referred', 'deceased');
create type public.alert_type      as enum ('vaccination_due', 'vaccination_overdue', 'disease_risk', 'health_event', 'outbreak', 'system');
create type public.alert_severity  as enum ('info', 'warning', 'critical');
create type public.movement_type   as enum ('transfer', 'sale', 'purchase', 'import', 'export');
create type public.breeding_event_type as enum ('mating', 'ai', 'pregnant', 'calving', 'abortion', 'weaning');
create type public.acquired_how    as enum ('born', 'purchased', 'donated', 'inherited', 'other');

-- ---------------------------------------------------------------------------
-- 2. HELPER: updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. TABLES
-- ---------------------------------------------------------------------------

-- profiles (linked to auth.users via id)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        public.user_role not null default 'farmer',
  phone       text,
  farm_name   text,
  district    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- animals
create table public.animals (
  animal_id     uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  tag_number    text not null,
  lits_tag      text,
  animal_type   public.animal_type not null default 'cattle',
  breed         text not null default '',
  gender        public.gender not null,
  date_of_birth date,
  colour        text,
  location      text,
  acquired_date date not null default current_date,
  acquired_how  public.acquired_how not null default 'purchased',
  status        public.animal_status not null default 'active',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index animals_owner_tag_idx on public.animals(owner_id, tag_number);
create index animals_owner_status_idx on public.animals(owner_id, status);

create trigger animals_updated_at
  before update on public.animals
  for each row execute function public.set_updated_at();

-- health_events
create table public.health_events (
  event_id        uuid primary key default gen_random_uuid(),
  animal_id       uuid not null references public.animals(animal_id) on delete cascade,
  logged_by       uuid not null references public.profiles(id),
  event_date      date not null default current_date,
  event_type      public.event_type not null,
  condition_name  text,
  severity        public.severity,
  symptoms        text,
  treatment_given text,
  vet_name        text,
  outcome         public.outcome,
  followup_date   date,
  notes           text,
  created_at      timestamptz not null default now()
);

create index health_events_animal_idx on public.health_events(animal_id);

-- vaccinations
create table public.vaccinations (
  vacc_id       uuid primary key default gen_random_uuid(),
  animal_id     uuid not null references public.animals(animal_id) on delete cascade,
  logged_by     uuid not null references public.profiles(id),
  vaccine_name  text not null,
  date_given    date not null default current_date,
  next_due_date date,
  vet_name      text,
  batch_number  text,
  notes         text,
  reminder_sent boolean not null default false,
  created_at    timestamptz not null default now()
);

create index vaccinations_animal_idx on public.vaccinations(animal_id);
create index vaccinations_due_idx   on public.vaccinations(next_due_date) where next_due_date is not null;

-- breeding_records
create table public.breeding_records (
  breeding_id   uuid primary key default gen_random_uuid(),
  animal_id     uuid not null references public.animals(animal_id) on delete cascade,
  logged_by     uuid not null references public.profiles(id),
  event_type    public.breeding_event_type not null,
  event_date    date not null default current_date,
  mate_tag      text,
  sire_breed    text,
  notes         text,
  created_at    timestamptz not null default now()
);

create index breeding_records_animal_idx on public.breeding_records(animal_id);

-- movements
create table public.movements (
  movement_id    uuid primary key default gen_random_uuid(),
  animal_id      uuid not null references public.animals(animal_id) on delete cascade,
  logged_by      uuid not null references public.profiles(id),
  movement_type  public.movement_type not null,
  from_location  text,
  to_location    text,
  movement_date  date not null default current_date,
  permit_number  text,
  notes          text,
  created_at     timestamptz not null default now()
);

create index movements_animal_idx on public.movements(animal_id);

-- alerts
create table public.alerts (
  alert_id   uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  animal_id  uuid references public.animals(animal_id) on delete set null,
  alert_type public.alert_type not null,
  severity   public.alert_severity not null default 'info',
  title      text not null,
  message    text not null default '',
  is_read    boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index alerts_user_unread_idx on public.alerts(user_id) where is_read = false;

-- vet_assignments
create table public.vet_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  vet_id        uuid not null references public.profiles(id) on delete cascade,
  farmer_id     uuid not null references public.profiles(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  is_active     boolean not null default true,
  unique (vet_id, farmer_id)
);

-- audit_log
create table public.audit_log (
  log_id      uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log(created_at desc);

-- ---------------------------------------------------------------------------
-- 4. SIGNUP TRIGGER  (creates a profile row when a new auth user is inserted)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone, farm_name, district)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'farmer'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'farm_name',
    new.raw_user_meta_data->>'district'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. RLS HELPER
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- ---- profiles -----------------------------------------------------------

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins manage all profiles"
  on public.profiles for all
  using (public.current_user_role() = 'admin');

-- ---- animals ------------------------------------------------------------

alter table public.animals enable row level security;

-- Farmer sees own animals
create policy "Farmers read own animals"
  on public.animals for select
  using (
    owner_id = auth.uid()
    or public.current_user_role() = 'admin'
    or (
      public.current_user_role() = 'vet'
      and exists (
        select 1 from public.vet_assignments va
        where va.vet_id = auth.uid()
          and va.farmer_id = animals.owner_id
          and va.is_active = true
      )
    )
  );

create policy "Farmers insert own animals"
  on public.animals for insert
  with check (owner_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Farmers update own animals"
  on public.animals for update
  using (owner_id = auth.uid() or public.current_user_role() = 'admin')
  with check (owner_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Farmers delete own animals"
  on public.animals for delete
  using (owner_id = auth.uid() or public.current_user_role() = 'admin');

-- ---- health_events ------------------------------------------------------

alter table public.health_events enable row level security;

create policy "Read health events for accessible animals"
  on public.health_events for select
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = health_events.animal_id
        and (
          a.owner_id = auth.uid()
          or public.current_user_role() = 'admin'
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

create policy "Owners and vets insert health events"
  on public.health_events for insert
  with check (
    exists (
      select 1 from public.animals a
      where a.animal_id = health_events.animal_id
        and (
          a.owner_id = auth.uid()
          or public.current_user_role() = 'admin'
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

create policy "Owners update health events"
  on public.health_events for update
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = health_events.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Owners delete health events"
  on public.health_events for delete
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = health_events.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

-- ---- vaccinations -------------------------------------------------------

alter table public.vaccinations enable row level security;

create policy "Read vaccinations for accessible animals"
  on public.vaccinations for select
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = vaccinations.animal_id
        and (
          a.owner_id = auth.uid()
          or public.current_user_role() = 'admin'
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

create policy "Owners and vets insert vaccinations"
  on public.vaccinations for insert
  with check (
    exists (
      select 1 from public.animals a
      where a.animal_id = vaccinations.animal_id
        and (
          a.owner_id = auth.uid()
          or public.current_user_role() = 'admin'
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

create policy "Owners update vaccinations"
  on public.vaccinations for update
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = vaccinations.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Owners delete vaccinations"
  on public.vaccinations for delete
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = vaccinations.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

-- ---- breeding_records ---------------------------------------------------

alter table public.breeding_records enable row level security;

create policy "Read breeding records for accessible animals"
  on public.breeding_records for select
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = breeding_records.animal_id
        and (
          a.owner_id = auth.uid()
          or public.current_user_role() = 'admin'
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

create policy "Owners insert breeding records"
  on public.breeding_records for insert
  with check (
    exists (
      select 1 from public.animals a
      where a.animal_id = breeding_records.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Owners update breeding records"
  on public.breeding_records for update
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = breeding_records.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Owners delete breeding records"
  on public.breeding_records for delete
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = breeding_records.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

-- ---- movements ----------------------------------------------------------

alter table public.movements enable row level security;

create policy "Read movements for accessible animals"
  on public.movements for select
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = movements.animal_id
        and (
          a.owner_id = auth.uid()
          or public.current_user_role() = 'admin'
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

create policy "Owners insert movements"
  on public.movements for insert
  with check (
    exists (
      select 1 from public.animals a
      where a.animal_id = movements.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Owners update movements"
  on public.movements for update
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = movements.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Owners delete movements"
  on public.movements for delete
  using (
    exists (
      select 1 from public.animals a
      where a.animal_id = movements.animal_id
        and (a.owner_id = auth.uid() or public.current_user_role() = 'admin')
    )
  );

-- ---- alerts -------------------------------------------------------------

alter table public.alerts enable row level security;

create policy "Users read own alerts"
  on public.alerts for select
  using (user_id = auth.uid());

create policy "Users update own alerts"
  on public.alerts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "System and admins insert alerts"
  on public.alerts for insert
  with check (user_id = auth.uid() or public.current_user_role() = 'admin');

-- ---- vet_assignments ----------------------------------------------------

alter table public.vet_assignments enable row level security;

create policy "Vets and admins read assignments"
  on public.vet_assignments for select
  using (
    vet_id = auth.uid()
    or farmer_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "Admins manage assignments"
  on public.vet_assignments for all
  using (public.current_user_role() = 'admin');

-- ---- audit_log ----------------------------------------------------------

alter table public.audit_log enable row level security;

create policy "Admins read audit log"
  on public.audit_log for select
  using (public.current_user_role() = 'admin');

create policy "Admins insert audit log"
  on public.audit_log for insert
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 7. RPC FUNCTIONS (dashboard)
-- ---------------------------------------------------------------------------

-- 7a. Herd composition — breed breakdown for current user's accessible animals
create or replace function public.get_herd_composition()
returns table(breed text, count bigint)
language sql stable security invoker
as $$
  select
    a.breed,
    count(*) as count
  from public.animals a
  where a.status = 'active'
  group by a.breed
  order by count desc;
$$;

-- 7b. Vaccination coverage trend over the last N months
create or replace function public.get_vaccination_coverage_trend(months int default 6)
returns table(month text, coverage_pct numeric)
language sql stable security invoker
as $$
  with month_series as (
    select generate_series(
      date_trunc('month', current_date) - ((months - 1) || ' months')::interval,
      date_trunc('month', current_date),
      '1 month'::interval
    )::date as month_start
  ),
  monthly_stats as (
    select
      ms.month_start,
      count(distinct a.animal_id) as total_animals,
      count(distinct case
        when v.vacc_id is not null
          and v.date_given <= (ms.month_start + interval '1 month' - interval '1 day')::date
          and (v.next_due_date is null or v.next_due_date > ms.month_start)
        then a.animal_id
      end) as vaccinated_animals
    from month_series ms
    cross join public.animals a
    left join public.vaccinations v
      on v.animal_id = a.animal_id
      and v.date_given <= (ms.month_start + interval '1 month' - interval '1 day')::date
    where a.status = 'active'
    group by ms.month_start
  )
  select
    to_char(month_start, 'Mon YYYY') as month,
    case
      when total_animals = 0 then 0
      else round((vaccinated_animals::numeric / total_animals) * 100, 1)
    end as coverage_pct
  from monthly_stats
  order by month_start;
$$;

-- 7c. Disease frequency — top conditions in the last 12 months
create or replace function public.get_disease_frequency()
returns table(condition_name text, count bigint)
language sql stable security invoker
as $$
  select
    coalesce(he.condition_name, he.event_type::text) as condition_name,
    count(*) as count
  from public.health_events he
  join public.animals a on a.animal_id = he.animal_id
  where he.event_type in ('disease', 'injury')
    and he.event_date >= current_date - interval '12 months'
  group by coalesce(he.condition_name, he.event_type::text)
  order by count desc
  limit 10;
$$;

-- 7d. Predictive risk — classifies animals by health risk level
create or replace function public.get_predictive_risk()
returns table(
  animal_id uuid,
  tag_number text,
  breed text,
  risk_level text,
  reason text
)
language sql stable security invoker
as $$
  with animal_overdue as (
    -- animals with at least one overdue vaccination
    select distinct v.animal_id
    from public.vaccinations v
    join public.animals a on a.animal_id = v.animal_id
    where v.next_due_date < current_date
      and a.status = 'active'
  ),
  animal_recent_events as (
    -- animals with disease/injury events in last 90 days
    select distinct he.animal_id
    from public.health_events he
    join public.animals a on a.animal_id = he.animal_id
    where he.event_type in ('disease', 'injury')
      and he.event_date >= current_date - interval '90 days'
      and a.status = 'active'
  ),
  owner_coverage as (
    -- per-owner vaccination coverage rate
    select
      a.owner_id,
      case
        when count(distinct a.animal_id) = 0 then 100
        else round(
          count(distinct case
            when v.vacc_id is not null
              and (v.next_due_date is null or v.next_due_date >= current_date)
            then a.animal_id
          end)::numeric / count(distinct a.animal_id) * 100, 1
        )
      end as coverage
    from public.animals a
    left join public.vaccinations v on v.animal_id = a.animal_id
    where a.status = 'active'
    group by a.owner_id
  )
  select
    a.animal_id,
    a.tag_number,
    a.breed,
    case
      when ao.animal_id is not null and are.animal_id is not null then 'high'
      when ao.animal_id is not null then 'medium'
      when oc.coverage < 80 then 'medium'
      else 'low'
    end as risk_level,
    case
      when ao.animal_id is not null and are.animal_id is not null
        then 'Overdue vaccination + recent disease/injury'
      when ao.animal_id is not null
        then 'Overdue vaccination'
      when oc.coverage < 80
        then 'Owner herd coverage below 80%'
      else 'No risk factors detected'
    end as reason
  from public.animals a
  left join animal_overdue ao on ao.animal_id = a.animal_id
  left join animal_recent_events are on are.animal_id = a.animal_id
  left join owner_coverage oc on oc.owner_id = a.owner_id
  where a.status = 'active'
  order by
    case
      when ao.animal_id is not null and are.animal_id is not null then 1
      when ao.animal_id is not null then 2
      when oc.coverage < 80 then 2
      else 3
    end,
    a.tag_number;
$$;

-- 7e. Upcoming calvings within N days
create or replace function public.get_upcoming_calvings(days int default 30)
returns table(
  animal_id uuid,
  tag_number text,
  expected_date date
)
language sql stable security invoker
as $$
  with pregnant_records as (
    select
      br.animal_id,
      br.event_date as pregnant_date,
      -- Look for a mating record for the same animal before the pregnancy record
      (
        select m.event_date
        from public.breeding_records m
        where m.animal_id = br.animal_id
          and m.event_type in ('mating', 'ai')
          and m.event_date <= br.event_date
        order by m.event_date desc
        limit 1
      ) as mate_date
    from public.breeding_records br
    join public.animals a on a.animal_id = br.animal_id
    where br.event_type = 'pregnant'
      and a.status = 'active'
      -- Exclude pregnancies that already have a calving record after them
      and not exists (
        select 1 from public.breeding_records c
        where c.animal_id = br.animal_id
          and c.event_type in ('calving', 'abortion')
          and c.event_date > br.event_date
      )
  )
  select
    a.animal_id,
    a.tag_number,
    case
      when pr.mate_date is not null
        then (pr.mate_date + 283)::date  -- 283 days = cattle gestation
      else (pr.pregnant_date + 60)::date  -- fallback approximation
    end as expected_date
  from pregnant_records pr
  join public.animals a on a.animal_id = pr.animal_id
  where
    case
      when pr.mate_date is not null
        then (pr.mate_date + 283)::date
      else (pr.pregnant_date + 60)::date
    end between current_date and (current_date + days)
  order by expected_date;
$$;
