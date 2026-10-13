-- R4 block 7. LOCAL ONLY; remote application requires separate approval.
-- Redeeming creates/keeps a persistent access grant ONLY. It never touches
-- event_participations nor capacity. Only the SHA-256 of the token is compared.
begin;
create function public.redeem_event_link(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_hash text;
    v_event_id uuid;
    v_event public.events%rowtype;
    v_link_id uuid;
    v_grant public.event_access_grants%rowtype;
    v_now timestamp;
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    -- One indistinguishable error for malformed, unknown, rotated/revoked links,
    -- closed or public events and revoked users: no event enumeration oracle.
    if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
        raise exception 'invite_unavailable' using errcode = 'P0001';
    end if;
    v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
    select l.event_id into v_event_id from public.event_access_links l where l.token_hash = v_hash;
    if v_event_id is null then raise exception 'invite_unavailable' using errcode = 'P0001'; end if;
    -- Event lock first (same as rotate/visibility/closure/register); then re-read
    -- the link so a rotation that won the lock race invalidates this token.
    select * into v_event from public.events where id = v_event_id for update;
    if not found then raise exception 'invite_unavailable' using errcode = 'P0001'; end if;
    select l.id into v_link_id from public.event_access_links l
        where l.token_hash = v_hash and l.event_id = v_event_id and l.revoked_at is null;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_link_id is null or v_event.visibility <> 'unlisted' or v_event.cancelled_at is not null
        or v_event.archived_at is not null or v_event.ends_at <= v_now then
        raise exception 'invite_unavailable' using errcode = 'P0001';
    end if;
    if v_event.organizer_id = v_user then return v_event_id; end if;
    select * into v_grant from public.event_access_grants
        where event_id = v_event_id and user_id = v_user for update;
    if found then
        -- Revoked wins absolutely: no token, old or new, can resurrect it.
        if v_grant.status <> 'active' then raise exception 'invite_unavailable' using errcode = 'P0001'; end if;
        return v_event_id;
    end if;
    insert into public.event_access_grants(event_id, user_id, source_link_id, granted_at, updated_at)
        values (v_event_id, v_user, v_link_id, v_now, v_now)
        on conflict (event_id, user_id) do nothing;
    -- Confirm the committed outcome before reporting success.
    if not exists (select 1 from public.event_access_grants
        where event_id = v_event_id and user_id = v_user and status = 'active') then
        raise exception 'invite_unavailable' using errcode = 'P0001';
    end if;
    return v_event_id;
end;
$$;
revoke all on function public.redeem_event_link(text) from public, anon, authenticated;
grant execute on function public.redeem_event_link(text) to authenticated;
comment on function public.redeem_event_link(text) is
    'R4-08: redeem organizer link by SHA-256; auth.uid identity; idempotent active grant; revoked never reactivated; no participation, no capacity.';
commit;
