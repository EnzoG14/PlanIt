begin;

-- One STABLE invocation uses the caller statement's MVCC snapshot, including
-- ownership, masking, membership, names and first registration. No pagination.
-- DEFINER is needed for owner-only profile/history RLS; no table grants change.
create function public.get_my_event_export_rows(p_event_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_title text;
    v_rows jsonb;
    v_result jsonb;
begin
    if v_user is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    select e.title into v_title from public.events e
    where e.id = p_event_id and e.organizer_id = v_user;
    if not found then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if (select count(*) from (
        select 1 from public.event_participations p
        where p.event_id = p_event_id and p.status = 'confirmed' and p.user_id <> v_user
        limit 5001
    ) bounded) > 5000 then
        raise exception 'export_too_large' using errcode = '54000';
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
        'username', case when planit_private.social_blocked(profile.id) then '' else profile.username end,
        'display_name', case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end,
        'status', p.status,
        'first_registered_at', (select min(h.created_at) from public.participation_history h
            where h.participation_id = p.id and h.previous_status is null and h.new_status = 'confirmed')
    ) order by p.id), '[]'::jsonb) into v_rows
    from public.event_participations p join public.profiles profile on profile.id = p.user_id
    where p.event_id = p_event_id and p.status = 'confirmed' and p.user_id <> v_user;

    v_result := jsonb_build_object('version', 1, 'event_id', p_event_id,
        'event_title', v_title,
        'as_of', statement_timestamp() at time zone 'America/Argentina/Buenos_Aires', 'rows', v_rows);
    if octet_length(convert_to(v_result::text, 'UTF8')) > 10485760 then
        raise exception 'export_too_large' using errcode = '54000';
    end if;
    return v_result;
end;
$$;
revoke all on function public.get_my_event_export_rows(uuid) from public, anon, authenticated;
grant execute on function public.get_my_event_export_rows(uuid) to authenticated;
comment on function public.get_my_event_export_rows(uuid) is
    'Owner-only confirmed registration CSV projection v1; single snapshot, max5000 rows/10MiB UTF8 JSON, R5 block masking; no physical attendance or individual demographics.';
commit;
