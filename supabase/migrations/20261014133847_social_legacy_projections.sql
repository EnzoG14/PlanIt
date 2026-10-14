-- R5 B1 C01: neutral social identity; preserve operational IDs and R3/R4 permissions.
begin;

CREATE OR REPLACE FUNCTION public.get_event_organizer(p_event_id uuid)
 RETURNS TABLE(display_name text, username text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    select profile.display_name, profile.username
    from public.events event
    join public.profiles profile on profile.id = event.organizer_id
    where (select auth.uid()) is not null
        and event.id = p_event_id
        and planit_private.can_view_event(event.id)
        and not planit_private.social_blocked(profile.id);
$function$
;

CREATE OR REPLACE FUNCTION public.get_event_attendees(p_event_id uuid, p_status text DEFAULT 'confirmed'::text, p_search text DEFAULT ''::text, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if not exists (select 1 from public.events where id = p_event_id and organizer_id = auth.uid()) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if p_status is null or p_status not in ('confirmed', 'removed') or p_search is null
        or char_length(p_search) > 120 or p_offset is null or p_offset < 0 then
        raise exception 'invalid_attendees_query' using errcode = '22023';
    end if;
    return (
        with page as materialized (
            select p.id as participation_id, p.user_id, p.status, case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end as display_name,
                case when planit_private.social_blocked(profile.id) then '' else profile.username end as username,
                lower(case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end) as sort_name
            from public.event_participations p join public.profiles profile on profile.id = p.user_id
            where p.event_id = p_event_id and p.status = p_status
                and (btrim(p_search) = '' or not planit_private.social_blocked(profile.id))
                and strpos(lower(case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end), lower(btrim(p_search))) > 0
            order by lower(case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end), p.id limit 31 offset p_offset
        )
        select jsonb_build_object(
            'title', e.title, 'capacity', e.capacity,
            'event_state', case when e.archived_at is not null then 'archived'
                when e.cancelled_at is not null then 'cancelled'
                when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end,
            'confirmed_count', (select count(*) from public.event_participations where event_id = e.id and status = 'confirmed'),
            'removed_count', (select count(*) from public.event_participations where event_id = e.id and status = 'removed'),
            'pending_count', (select count(*) from public.event_rejoin_requests r join public.event_participations p on p.id = r.participation_id where p.event_id = e.id and r.status = 'pending'),
            'has_more', (select count(*) > 30 from page),
            'attendees', coalesce((select jsonb_agg(to_jsonb(visible) - 'sort_name' order by sort_name, participation_id)
                from (select * from page order by sort_name, participation_id limit 30) visible), '[]'::jsonb)
        )
        from public.events e
        where e.id = p_event_id
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_event_rejoin_requests(p_event_id uuid, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if not exists (select 1 from public.events where id = p_event_id and organizer_id = auth.uid()) then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if p_offset is null or p_offset < 0 then raise exception 'invalid_rejoin_query' using errcode = '22023'; end if;
    return (
        with page as materialized (
            select r.id as request_id, r.participation_id, r.status, r.requested_at, case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end as display_name,
                case when planit_private.social_blocked(profile.id) then '' else profile.username end as username
            from public.event_rejoin_requests r join public.event_participations p on p.id = r.participation_id
            join public.profiles profile on profile.id = p.user_id
            where p.event_id = p_event_id and r.status = 'pending'
            order by r.requested_at desc, r.id desc limit 31 offset p_offset
        )
        select jsonb_build_object('title', e.title, 'capacity', e.capacity,
            'event_state', case when e.archived_at is not null then 'archived' when e.cancelled_at is not null then 'cancelled'
                when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end,
            'confirmed_count', (select count(*) from public.event_participations where event_id = e.id and status = 'confirmed'),
            'pending_count', (select count(*) from public.event_rejoin_requests r join public.event_participations p on p.id=r.participation_id where p.event_id=e.id and r.status='pending'),
            'has_more', (select count(*) > 30 from page),
            'requests', coalesce((select jsonb_agg(to_jsonb(visible) order by requested_at desc, request_id desc)
                from (select * from page order by requested_at desc, request_id desc limit 30) visible), '[]'::jsonb))
        from public.events e where e.id = p_event_id
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_event_access_grants(p_event_id uuid, p_status text DEFAULT 'active'::text, p_after_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_event public.events%rowtype;
    v_rows jsonb;
    v_more boolean;
begin
    if auth.uid() is null then raise exception 'access_denied' using errcode = '42501'; end if;
    select * into v_event from public.events where id = p_event_id;
    if not found or v_event.organizer_id <> auth.uid() then
        raise exception 'access_denied' using errcode = '42501';
    end if;
    if v_event.visibility <> 'unlisted' then raise exception 'event_not_hidden'; end if;
    if p_status is null or p_status not in ('active', 'revoked') or p_limit is null or p_limit < 1 or p_limit > 50 then
        raise exception 'invalid_access_query' using errcode = '22023';
    end if;
    with candidates as (
        select g.id, g.user_id, g.status, case when planit_private.social_blocked(p.id) then '' else p.username end as username,
            case when planit_private.social_blocked(p.id) then 'Perfil no disponible' else p.display_name end as display_name,
            exists(select 1 from public.event_participations ep
                where ep.event_id = g.event_id and ep.user_id = g.user_id and ep.status = 'confirmed') as is_confirmed
        from public.event_access_grants g join public.profiles p on p.id = g.user_id
        where g.event_id = p_event_id and g.status = p_status and (p_after_id is null or g.id > p_after_id)
        order by g.id limit p_limit + 1
    ), numbered as (select *, row_number() over(order by id) as n from candidates)
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'user_id',user_id,'status',status,
        'username',username,'display_name',display_name,'avatar_url',null,'is_confirmed',is_confirmed)
        order by id) filter(where n <= p_limit),'[]'::jsonb), count(*) > p_limit
    into v_rows, v_more from numbered;
    return jsonb_build_object('title',v_event.title,'event_state',
        case when v_event.archived_at is not null then 'archived' when v_event.cancelled_at is not null then 'cancelled'
            when v_event.ends_at <= clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' then 'ended' else 'open' end,
        'grants',v_rows,'next_cursor',case when v_more then v_rows->(p_limit-1)->>'id' else null end);
end;
$function$
;

-- CREATE OR REPLACE preserves signatures and ACL; restate the boundary.
revoke all on function public.get_event_organizer(uuid), public.get_event_attendees(uuid,text,text,integer),
    public.get_event_rejoin_requests(uuid,integer), public.get_event_access_grants(uuid,text,uuid,integer)
    from public,anon,authenticated;
grant execute on function public.get_event_organizer(uuid), public.get_event_attendees(uuid,text,text,integer),
    public.get_event_rejoin_requests(uuid,integer), public.get_event_access_grants(uuid,text,uuid,integer)
    to authenticated;
commit;
