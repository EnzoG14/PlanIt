begin read only;
-- Global quality only: no identity, date of birth, sex value or event ID leaves DB.
-- Even global counts below 5 are withheld; no per-event profile drill-down.
with totals as (
 select count(*) as profiles,
 count(*) filter (where birth_date is null) as birth_date_missing,
 count(*) filter (where sex is null) as sex_missing,
 count(*) filter (where birth_date > (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date) as future_birth_dates
 from public.profiles
), safe as (
 select key, case when value::bigint < 5 then null else value end as count,
 value::bigint < 5 as suppressed
 from totals t cross join lateral jsonb_each_text(to_jsonb(t))
)
select jsonb_agg(to_jsonb(safe)) as quality from safe;
rollback;
