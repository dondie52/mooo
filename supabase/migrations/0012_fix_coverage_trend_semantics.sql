-- ---------------------------------------------------------------------------
-- Align get_vaccination_coverage_trend with get_farm_coverage (migration 0010)
-- so the trend chart's current-month point reconciles with the BMC Coverage KPI.
--
-- Before: month M counted an animal as covered when its vaccination's
-- next_due_date was > month_start (or NULL). Animals whose cover expired
-- partway through the current month were still counted as covered for that
-- month, producing ~80% on the trend while the instantaneous KPI
-- (get_farm_coverage, which uses next_due_date >= current_date) reported 60%.
--
-- After: for each month M, reference_date = least(month_end, current_date).
-- An animal is counted as covered when a vaccination exists with
-- date_given <= reference_date AND next_due_date >= reference_date.
-- The current-month point therefore uses the same rule as get_farm_coverage
-- and the two panels agree; past months retain their historical snapshot
-- meaning, just computed with the same rule applied at month-end.
-- ---------------------------------------------------------------------------

create or replace function public.get_vaccination_coverage_trend(months int default 6)
returns table(month text, coverage_pct numeric)
language sql stable security invoker
set search_path = public
as $$
  with month_series as (
    select generate_series(
      date_trunc('month', current_date) - ((months - 1) || ' months')::interval,
      date_trunc('month', current_date),
      '1 month'::interval
    )::date as month_start
  ),
  with_reference as (
    select
      month_start,
      least(
        (month_start + interval '1 month' - interval '1 day')::date,
        current_date
      ) as reference_date
    from month_series
  ),
  monthly_stats as (
    select
      wr.month_start,
      count(distinct a.animal_id) as total_animals,
      count(distinct case
        when v.next_due_date >= wr.reference_date
        then a.animal_id
      end) as vaccinated_animals
    from with_reference wr
    cross join public.animals a
    left join public.vaccinations v
      on v.animal_id = a.animal_id
      and v.date_given <= wr.reference_date
    where a.status = 'active'
    group by wr.month_start
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
