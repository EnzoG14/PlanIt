-- R4 block 8. Local migration; remote application requires separate authorization.
begin;

-- Definers are necessary: neither grants nor third-party private profiles have
-- generic SELECT/UPDATE privileges. Only this minimal owner-authorized projection is exposed.
create function public.get_event_access_grants(
    p_event_id uuid, p_status text default 'active', p_after_id uuid default null,
    p_limit integer default 30
) returns jsonb language plpgsql security definer set search_path = '' as $$
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
        select g.id, g.user_id, g.status, p.username, p.display_name,
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
$$;

create function public.revoke_event_access(p_event_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_part public.event_participations%rowtype;
    v_grant public.event_access_grants%rowtype;
    v_now timestamp;
begin
    if auth.uid() is null then raise exception 'access_denied' using errcode = '42501'; end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then raise exception 'access_denied' using errcode = '42501'; end if;
    if v_event.visibility <> 'unlisted' then raise exception 'event_not_hidden'; end if;
    if v_event.cancelled_at is not null or v_event.archived_at is not null or
        v_event.ends_at <= clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' then raise exception 'event_closed'; end if;
    select * into v_part from public.event_participations where event_id = p_event_id and user_id = p_user_id for update;
    select * into v_grant from public.event_access_grants where event_id = p_event_id and user_id = p_user_id for update;
    if not found then raise exception 'access_grant_missing'; end if;
    if v_grant.status = 'revoked' then return; end if;
    if v_part.status = 'confirmed' then
        -- Existing trigger records exactly one organizer_removal; no manual history INSERT.
        update public.event_participations set status = 'removed' where id = v_part.id;
    end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    update public.event_access_grants set status = 'revoked', revoked_at = v_now, updated_at = v_now where id = v_grant.id;
end;
$$;

create function public.restore_event_access(p_event_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_grant public.event_access_grants%rowtype;
    v_now timestamp;
begin
    if auth.uid() is null then raise exception 'access_denied' using errcode = '42501'; end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then raise exception 'access_denied' using errcode = '42501'; end if;
    if v_event.visibility <> 'unlisted' then raise exception 'event_not_hidden'; end if;
    if v_event.cancelled_at is not null or v_event.archived_at is not null or
        v_event.ends_at <= clock_timestamp() at time zone 'America/Argentina/Buenos_Aires' then raise exception 'event_closed'; end if;
    -- Same lock order as revocation and all R3 participation operations.
    perform 1 from public.event_participations where event_id = p_event_id and user_id = p_user_id for update;
    select * into v_grant from public.event_access_grants where event_id = p_event_id and user_id = p_user_id for update;
    if not found then raise exception 'access_grant_missing'; end if;
    if v_grant.status = 'active' then return; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    update public.event_access_grants set status = 'active', revoked_at = null, restored_at = v_now, updated_at = v_now where id = v_grant.id;
end;
$$;

revoke all on function public.get_event_access_grants(uuid,text,uuid,integer),
    public.revoke_event_access(uuid,uuid), public.restore_event_access(uuid,uuid) from public, anon, authenticated;
grant execute on function public.get_event_access_grants(uuid,text,uuid,integer),
    public.revoke_event_access(uuid,uuid), public.restore_event_access(uuid,uuid) to authenticated;
commit;
