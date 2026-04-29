-- ---------------------------------------------------------------------------
-- Align Vet "Vaccinations Due" KPI with Farmer overdue metric.
--
-- Farmer dashboard treats "due" as overdue vaccinations:
--   vaccinations.next_due_date < current_date
-- for active animals.
--
-- Vet dashboard previously used upcoming vaccinations (next 7 days), which
-- caused cross-role mismatches. This RPC provides a vet-scoped overdue count
-- using the Farmer-compatible rule.
-- ---------------------------------------------------------------------------

create or replace function public.get_vet_overdue_vaccinations_count(vet_uuid uuid)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(distinct v.vacc_id)
  from public.vaccinations v
  inner join public.animals a on a.animal_id = v.animal_id
  inner join public.vet_assignments va
    on va.farmer_id = a.owner_id
    and va.vet_id = vet_uuid
    and va.is_active = true
  where a.status = 'active'
    and v.next_due_date is not null
    and v.next_due_date < current_date;
$$;

grant execute on function public.get_vet_overdue_vaccinations_count(uuid) to authenticated;
