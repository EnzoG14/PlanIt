begin;

-- Profiles and participation rows are private under RLS. Only this aggregate
-- may read them for an event owner; no table grants or social projection changes.
create function public.get_my_event_demographics(p_event_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_today date := (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date;
    v_age bigint[];
    v_sex bigint[];
    v_counts bigint[];
    v_keys text[];
    v_groups jsonb;
    v_dimension jsonb;
    v_result jsonb;
    v_total bigint;
    v_hidden boolean;
    i integer;
    j integer;
begin
    if v_user is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if not exists (select 1 from public.events e where e.id = p_event_id and e.organizer_id = v_user) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;

    with cohort as materialized (
        select extract(year from age(v_today, p.birth_date))::integer as years, p.sex
        from public.event_participations ep
        join public.profiles p on p.id = ep.user_id
        where ep.event_id = p_event_id and ep.status = 'confirmed' and ep.user_id <> v_user
    )
    select count(*), array[
        count(*) filter (where years < 18), count(*) filter (where years between 18 and 24),
        count(*) filter (where years between 25 and 34), count(*) filter (where years between 35 and 44),
        count(*) filter (where years between 45 and 54), count(*) filter (where years >= 55),
        count(*) filter (where years is null)
    ], array[
        count(*) filter (where sex = 'female'), count(*) filter (where sex = 'male'),
        count(*) filter (where sex = 'other'), count(*) filter (where sex is null)
    ] into v_total, v_age, v_sex from cohort;

    v_result := jsonb_build_object('event_id', p_event_id,
        'as_of', statement_timestamp() at time zone 'America/Argentina/Buenos_Aires', 'age_as_of', v_today);
    for i in 1..2 loop
        v_counts := case when i = 1 then v_age else v_sex end;
        v_keys := case when i = 1 then array['under_18','18_24','25_34','35_44','45_54','55_plus','unknown']
            else array['female','male','other','unknown'] end;
        v_hidden := false;
        for j in 1..cardinality(v_counts) loop
            v_hidden := v_hidden or v_counts[j] between 1 and 4;
        end loop;
        v_groups := '[]'::jsonb;
        -- Whole-dimension suppression also hides complements, unknown and zeros.
        -- Exact dynamic releases retain the temporal/cross-event risk accepted in D04.
        if v_total > 0 and not v_hidden then
            for j in 1..cardinality(v_counts) loop
                v_groups := v_groups || jsonb_build_array(jsonb_build_object('key', v_keys[j], 'count', v_counts[j]));
            end loop;
        end if;
        v_dimension := jsonb_build_object('state', case when v_total = 0 then 'empty'
            when v_hidden then 'suppressed' else 'available' end, 'groups', v_groups);
        v_result := v_result || jsonb_build_object(case when i = 1 then 'age' else 'sex' end, v_dimension);
    end loop;
    return v_result;
end;
$$;

revoke all on function public.get_my_event_demographics(uuid) from public, anon, authenticated;
grant execute on function public.get_my_event_demographics(uuid) to authenticated;
comment on function public.get_my_event_demographics(uuid) is
    'Owner-only confirmed age/declared-sex aggregates; k=5 whole-dimension suppression. Exact dynamic releases do not prevent temporal or cross-event inference (D04 accepted risk).';
commit;
