-- Allow vets to update health events for their assigned farmers' animals
-- + Disease frequency RPC for vet dashboard surveillance chart

-- ── RLS: Vet UPDATE on health_events ──────────────────────────────

create policy "Vets update health events for assigned animals"
  on public.health_events for update
  using (
    exists (
      select 1 from public.animals a
      inner join public.vet_assignments va
        on va.farmer_id = a.owner_id
        and va.vet_id = auth.uid()
        and va.is_active = true
      where a.animal_id = health_events.animal_id
    )
  );

-- ── RPC: Disease frequency across vet's assigned farms ────────────

create or replace function public.get_vet_disease_frequency(vet_uuid uuid)
returns table(
  condition_name text,
  count          bigint
)
language sql stable security invoker
set search_path = public
as $$
  select
    coalesce(he.condition_name, he.event_type::text) as condition_name,
    count(*) as count
  from public.health_events he
  inner join public.animals a on a.animal_id = he.animal_id
  inner join public.vet_assignments va
    on va.farmer_id = a.owner_id
    and va.vet_id = vet_uuid
    and va.is_active = true
  where he.event_date >= current_date - interval '12 months'
    and a.status = 'active'
  group by coalesce(he.condition_name, he.event_type::text)
  order by count desc
  limit 10;
$$;
