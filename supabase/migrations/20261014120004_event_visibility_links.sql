-- R4 block 6. LOCAL ONLY; remote application requires separate approval.
-- Signature replacement has no SQL dependents in versioned migrations. No CASCADE.
-- Trailing defaults preserve old named/positional calls without overload ambiguity.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
drop policy events_insert_own on public.events;
create policy events_insert_own on public.events for insert to authenticated
    with check (organizer_id = (select auth.uid()) and visibility in ('public','unlisted')
        and cancelled_at is null and archived_at is null);
grant insert (visibility) on public.events to authenticated;
drop function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[]);
drop function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text);
create function public.create_event(
    p_id uuid, p_title text, p_description text, p_starts_at timestamp, p_ends_at timestamp,
    p_category_id uuid, p_capacity integer, p_address text, p_latitude double precision,
    p_longitude double precision, p_location_name text default null, p_image_paths text[] default '{}', p_visibility text default 'public'
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
    v_event_id uuid;
    v_file_id uuid;
    v_path text;
    v_mime text;
    v_size bigint;
    v_sort integer := 0;
begin
    if (select auth.uid()) is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if p_visibility is null or p_visibility not in ('public','unlisted') then raise exception 'invalid_visibility' using errcode = '23514'; end if;
    if p_id is null then raise exception 'request_id_required' using errcode = '23514'; end if;
    -- Serialize retries for one publication; a lost response must not duplicate it.
    perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
    if exists (select 1 from public.events where id = p_id and organizer_id = (select auth.uid())) then return p_id; end if;
    if p_image_paths is null or cardinality(p_image_paths) > 10 then
        raise exception 'invalid_image_count' using errcode = '23514';
    end if;
    insert into public.events (id, category_id, title, description, starts_at, ends_at, location_name, address, latitude, longitude, capacity, visibility)
    values (p_id, p_category_id, btrim(p_title), btrim(p_description), p_starts_at, p_ends_at, nullif(btrim(p_location_name), ''), btrim(p_address), p_latitude, p_longitude, p_capacity, p_visibility)
    returning id into v_event_id;
    foreach v_path in array p_image_paths loop
        select metadata ->> 'mimetype', (metadata ->> 'size')::bigint into v_mime, v_size
        from storage.objects where bucket_id = 'event_media' and name = v_path
            and owner_id = (select auth.uid())::text;
        if not found or v_path is null or split_part(v_path, '/', 1) <> (select auth.uid())::text then
            raise exception 'invalid_image' using errcode = 'P0001';
        end if;
        insert into public.files (bucket_name, storage_path, mime_type, size_bytes)
        values ('event_media', v_path, v_mime, v_size) returning id into v_file_id;
        insert into public.event_images (event_id, file_id, sort_order) values (v_event_id, v_file_id, v_sort);
        v_sort := v_sort + 1;
    end loop;
    return v_event_id;
end;
$$;
revoke all on function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[],text) from public, anon;
grant execute on function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[],text) to authenticated;
comment on function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[],text) is
    'R1: atomic complete public/unlisted event + up to 10 uploaded images; auth.uid identity, invoker RLS, idempotent request UUID.';

create function public.update_event(
    p_event_id uuid, p_title text, p_description text, p_starts_at timestamp,
    p_ends_at timestamp, p_category_id uuid, p_capacity integer, p_address text,
    p_latitude double precision, p_longitude double precision, p_location_name text default null, p_visibility text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_event public.events%rowtype;
    v_now timestamp;
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    if p_visibility is not null and p_visibility not in ('public','unlisted') then raise exception 'invalid_visibility' using errcode = '23514'; end if;
    -- Same lock as registration/leave. Count AFTER lock using a fresh snapshot.
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if v_event.organizer_id <> v_user then raise exception 'not_event_organizer' using errcode = '42501'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_event.cancelled_at is not null or v_event.archived_at is not null or v_event.starts_at <= v_now then
        raise exception 'event_not_editable' using errcode = 'P0001';
    end if;
    if p_starts_at is null or p_ends_at is null or not isfinite(p_starts_at) or not isfinite(p_ends_at)
        or p_starts_at <= v_now then raise exception 'start_not_future' using errcode = 'P0001'; end if;
    if p_ends_at <= p_starts_at then raise exception 'end_before_start' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.categories where id = p_category_id and is_active) then
        raise exception 'category_inactive' using errcode = 'P0001';
    end if;
    if p_capacity is null or p_capacity < 1 then raise exception 'invalid_capacity' using errcode = '23514'; end if;
    if p_capacity < (select count(*) from public.event_participations where event_id = p_event_id and status = 'confirmed') then
        raise exception 'capacity_below_confirmed' using errcode = 'P0001';
    end if;
    -- Existing NOT NULL/CHECK/FK constraints validate remaining content atomically.
    update public.events set title = btrim(p_title), description = btrim(p_description),
        starts_at = p_starts_at, ends_at = p_ends_at, category_id = p_category_id,
        capacity = p_capacity, address = btrim(p_address), latitude = p_latitude,
        longitude = p_longitude, location_name = nullif(btrim(p_location_name), ''), visibility = coalesce(p_visibility, v_event.visibility)
    where id = p_event_id;
    return p_event_id;
end;
$$;
revoke all on function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text) from public, anon, authenticated;
grant execute on function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text) to authenticated;
comment on function public.update_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text) is
    'R3: organizer-only editing before original start, event lock + confirmed count, no direct UPDATE grants.';
-- Reuses the B5 trigger for A04/A05/D12. No generic client UPDATE privilege.
create function public.set_event_visibility(p_event_id uuid, p_visibility text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode = '40001'; end if;
    if p_visibility is null or p_visibility not in ('public','unlisted') then raise exception 'invalid_visibility' using errcode = '23514'; end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if v_event.cancelled_at is not null or v_event.archived_at is not null
        or v_event.starts_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        raise exception 'event_not_editable' using errcode = 'P0001';
    end if;
    if v_event.visibility <> p_visibility then update public.events set visibility = p_visibility where id = p_event_id; end if;
    return p_event_id;
end;
$$;
revoke all on function public.set_event_visibility(uuid,text) from public, anon, authenticated;
grant execute on function public.set_event_visibility(uuid,text) to authenticated;

-- 32 CSPRNG bytes (256 bits); only SHA-256 is persisted. No recover-token API.
-- Event lock serializes rotation with visibility/closure and later B7 redemption.
create function public.create_or_rotate_event_link(p_event_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_token text; v_now timestamp;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode = '40001'; end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or v_event.organizer_id <> auth.uid() then raise exception 'event_unavailable' using errcode = '42501'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_event.visibility <> 'unlisted' then raise exception 'event_not_unlisted' using errcode = 'P0001'; end if;
    if v_event.ends_at <= v_now or v_event.cancelled_at is not null or v_event.archived_at is not null then
        raise exception 'event_link_closed' using errcode = 'P0001';
    end if;
    v_token := encode(extensions.gen_random_bytes(32), 'hex');
    update public.event_access_links set revoked_at = v_now where event_id = p_event_id and revoked_at is null;
    insert into public.event_access_links(event_id,created_by,token_hash,created_at)
        values(p_event_id,auth.uid(),encode(extensions.digest(v_token,'sha256'),'hex'),v_now);
    return v_token;
end;
$$;
revoke all on function public.create_or_rotate_event_link(uuid) from public, anon, authenticated;
grant execute on function public.create_or_rotate_event_link(uuid) to authenticated;

-- Owner-only boolean for UI; never expose hash, token, link IDs or other users.
create function public.get_event_link_status(p_event_id uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
    if auth.uid() is null or not exists(select 1 from public.events where id = p_event_id and organizer_id = auth.uid()) then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    return exists(select 1 from public.event_access_links where event_id = p_event_id and revoked_at is null);
end;
$$;
revoke all on function public.get_event_link_status(uuid) from public, anon, authenticated;
grant execute on function public.get_event_link_status(uuid) to authenticated;
commit;
