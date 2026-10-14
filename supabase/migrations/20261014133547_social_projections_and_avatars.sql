-- R5 B1. Local only. C02: event permissions stay independent of social blocks.
begin;

create function public.get_social_profile_events(
    p_user_id uuid, p_before_starts_at timestamp default null, p_before_id uuid default null,
    p_limit integer default 30
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_rows jsonb; v_more boolean;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if not planit_private.can_read_social_content(p_user_id) then
        raise exception 'profile_unavailable' using errcode = '42501';
    end if;
    if p_limit is null or p_limit not between 1 and 50 or
        (p_before_starts_at is null) <> (p_before_id is null) then
        raise exception 'invalid_social_query' using errcode = '22023';
    end if;
    with page as (
        select e.id, e.title, e.starts_at, e.ends_at, e.category_id, e.location_name
        from public.events e where e.organizer_id = p_user_id and e.visibility = 'public'
            and e.cancelled_at is null and e.archived_at is null
            and e.ends_at > statement_timestamp() at time zone 'America/Argentina/Buenos_Aires'
            and (p_before_starts_at is null or (e.starts_at, e.id) < (p_before_starts_at, p_before_id))
        order by e.starts_at desc, e.id desc limit p_limit + 1
    ), numbered as (select *, row_number() over(order by starts_at desc, id desc) as n from page)
    select coalesce(jsonb_agg(to_jsonb(numbered) - 'n' order by starts_at desc, id desc)
        filter(where n <= p_limit), '[]'::jsonb), count(*) > p_limit into v_rows, v_more from numbered;
    return jsonb_build_object('events', v_rows, 'next_cursor', case when v_more then
        jsonb_build_object('starts_at', v_rows->(p_limit-1)->'starts_at', 'id', v_rows->(p_limit-1)->'id') end);
end;
$$;
create function public.get_event_social_participants(
    p_event_id uuid, p_after_user_id uuid default null, p_limit integer default 30
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_rows jsonb; v_more boolean;
begin
    -- Exact R4 detail + R3 confirmed boundary; this does not grant administration.
    if not planit_private.can_read_event_chat(p_event_id) then
        raise exception 'participants_unavailable' using errcode = '42501';
    end if;
    if p_limit is null or p_limit not between 1 and 50 then
        raise exception 'invalid_social_query' using errcode = '22023';
    end if;
    with page as (
        select p.id as user_id, p.display_name, p.username,
            case when p.avatar_file_id is not null then p.id end as avatar
        from public.event_participations ep join public.profiles p on p.id = ep.user_id
        where ep.event_id = p_event_id and ep.status = 'confirmed'
            and not planit_private.social_blocked(p.id)
            and (p_after_user_id is null or p.id > p_after_user_id)
        order by p.id limit p_limit + 1
    ), numbered as (select *, row_number() over(order by user_id) as n from page)
    select coalesce(jsonb_agg(to_jsonb(numbered) - 'n' order by user_id)
        filter(where n <= p_limit), '[]'::jsonb), count(*) > p_limit into v_rows, v_more from numbered;
    return jsonb_build_object('participants', v_rows,
        'next_cursor', case when v_more then v_rows->(p_limit-1)->>'user_id' end);
end;
$$;

create function public.list_follow_requests(
    p_after_requested_at timestamp default null, p_after_follower_id uuid default null,
    p_limit integer default 30
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_rows jsonb; v_more boolean;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if p_limit is null or p_limit not between 1 and 50 or
        (p_after_requested_at is null) <> (p_after_follower_id is null) then
        raise exception 'invalid_social_query' using errcode = '22023';
    end if;
    with page as (
        select f.follower_id, f.request_version, f.requested_at, p.display_name, p.username,
            case when p.avatar_file_id is not null then p.id end as avatar
        from public.user_follows f join public.profiles p on p.id = f.follower_id
        where f.followed_id = auth.uid() and f.status = 'pending'
            and not planit_private.social_blocked(f.follower_id)
            and (p_after_requested_at is null or
                (f.requested_at, f.follower_id) > (p_after_requested_at, p_after_follower_id))
        order by f.requested_at, f.follower_id limit p_limit + 1
    ), numbered as (select *, row_number() over(order by requested_at, follower_id) as n from page)
    select coalesce(jsonb_agg(to_jsonb(numbered) - 'n' order by requested_at, follower_id)
        filter(where n <= p_limit), '[]'::jsonb), count(*) > p_limit into v_rows, v_more from numbered;
    return jsonb_build_object('requests', v_rows, 'next_cursor', case when v_more then
        jsonb_build_object('requested_at',v_rows->(p_limit-1)->'requested_at',
            'follower_id',v_rows->(p_limit-1)->'follower_id') end);
end;
$$;
create function public.list_social_follows(
    p_user_id uuid, p_direction text, p_after_user_id uuid default null, p_limit integer default 30
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_rows jsonb; v_more boolean;
begin
    if not planit_private.can_read_social_content(p_user_id) then
        raise exception 'profile_unavailable' using errcode = '42501';
    end if;
    if p_direction is null or p_direction not in ('followers','following') or p_limit is null or p_limit not between 1 and 50 then
        raise exception 'invalid_social_query' using errcode = '22023';
    end if;
    with related as (
        select case when p_direction = 'followers' then f.follower_id else f.followed_id end as user_id
        from public.user_follows f where f.status = 'accepted' and
            ((p_direction = 'followers' and f.followed_id = p_user_id) or
             (p_direction = 'following' and f.follower_id = p_user_id))
    ), page as (
        select p.id as user_id, p.display_name, p.username,
            case when p.avatar_file_id is not null then p.id end as avatar
        from related r join public.profiles p on p.id = r.user_id
        where not planit_private.social_blocked(p.id) and not exists (
            select 1 from public.user_blocks b where
            (b.blocker_id = p_user_id and b.blocked_id = p.id) or
            (b.blocker_id = p.id and b.blocked_id = p_user_id))
            and (p_after_user_id is null or p.id > p_after_user_id)
        order by p.id limit p_limit + 1
    ), numbered as (select *, row_number() over(order by user_id) as n from page)
    select coalesce(jsonb_agg(to_jsonb(numbered) - 'n' order by user_id)
        filter(where n <= p_limit), '[]'::jsonb), count(*) > p_limit into v_rows, v_more from numbered;
    return jsonb_build_object('users',v_rows,'next_cursor',case when v_more then v_rows->(p_limit-1)->>'user_id' end);
end;
$$;
create function public.get_social_counts(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if not planit_private.can_read_social_content(p_user_id) then
        raise exception 'profile_unavailable' using errcode = '42501';
    end if;
    return (
        select jsonb_build_object('followers', count(*) filter(where followed_id = p_user_id),
            'following', count(*) filter(where follower_id = p_user_id))
        from public.user_follows f where status = 'accepted' and p_user_id in (follower_id,followed_id)
            and not planit_private.social_blocked(case when follower_id = p_user_id then followed_id else follower_id end)
            and not exists (select 1 from public.user_blocks b where
                (b.blocker_id = f.follower_id and b.blocked_id = f.followed_id) or
                (b.blocker_id = f.followed_id and b.blocked_id = f.follower_id))
    );
end;
$$;

create function public.get_direct_messages(
    p_conversation_id uuid, p_before_at timestamp default null, p_before_id uuid default null,
    p_limit integer default 30
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_rows jsonb; v_more boolean;
begin
    if auth.uid() is null or not exists (select 1 from public.conversations c
        where c.id = p_conversation_id and c.kind = 'direct') then
        raise exception 'conversation_unavailable' using errcode = '42501';
    end if;
    if p_limit is null or p_limit not between 1 and 50 or (p_before_at is null) <> (p_before_id is null) then
        raise exception 'invalid_message_cursor' using errcode = '22023';
    end if;
    with page as (
        select m.id, m.sender_id, m.body, m.created_at from public.messages m
        where m.conversation_id = p_conversation_id
            and (p_before_at is null or (m.created_at,m.id) < (p_before_at,p_before_id))
        order by m.created_at desc, m.id desc limit p_limit + 1
    ), numbered as (select *, row_number() over(order by created_at desc,id desc) as n from page)
    select coalesce(jsonb_agg(to_jsonb(numbered) - 'n' order by created_at desc,id desc)
        filter(where n <= p_limit), '[]'::jsonb), count(*) > p_limit into v_rows,v_more from numbered;
    return jsonb_build_object('messages',v_rows,'next_cursor',case when v_more then
        jsonb_build_object('created_at',v_rows->(p_limit-1)->'created_at','id',v_rows->(p_limit-1)->'id') end);
end;
$$;
create function public.list_direct_conversations(
    p_before_at timestamp default null, p_before_id uuid default null, p_limit integer default 30
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_rows jsonb; v_more boolean;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if p_limit is null or p_limit not between 1 and 50 or (p_before_at is null) <> (p_before_id is null) then
        raise exception 'invalid_message_cursor' using errcode = '22023';
    end if;
    -- No profile join: blocked peers' social identity must not leak via headers.
    with page as (
        select c.id, c.created_at,
            case when c.user_low_id = auth.uid() then c.user_high_id else c.user_low_id end as peer_id,
            planit_private.social_blocked(case when c.user_low_id = auth.uid() then c.user_high_id else c.user_low_id end) as read_only
        from public.conversations c where c.kind = 'direct'
            and (p_before_at is null or (c.created_at,c.id) < (p_before_at,p_before_id))
        order by c.created_at desc,c.id desc limit p_limit + 1
    ), numbered as (select *, row_number() over(order by created_at desc,id desc) as n from page)
    select coalesce(jsonb_agg(to_jsonb(numbered) - 'n' order by created_at desc,id desc)
        filter(where n <= p_limit),'[]'::jsonb),count(*) > p_limit into v_rows,v_more from numbered;
    return jsonb_build_object('conversations',v_rows,'next_cursor',case when v_more then
        jsonb_build_object('created_at',v_rows->(p_limit-1)->'created_at','id',v_rows->(p_limit-1)->'id') end);
end;
$$;

create or replace function public.get_notification_target(p_id uuid) returns text
language sql stable security invoker set search_path = '' as $$
    select case when n.conversation_id is not null then
        case when c.kind = 'event' then '/events/' || c.event_id::text || '/chat' end
        else '/events/' || e.id::text end
    from public.notifications n
    left join public.conversations c on c.id = n.conversation_id
    left join public.events e on e.id = n.event_id
    where n.id = p_id and n.recipient_id = (select auth.uid());
$$;

-- Separate immutable avatar objects. Generic files and event-media reads do not
-- gain social access. Only the owner can read/sign directly through Storage.
alter table public.files drop constraint files_event_bucket_valid;
alter table public.files add constraint files_bucket_valid check (bucket_name in ('event_media','avatars'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values ('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy avatars_insert_own on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and split_part(name,'/',1) = (select auth.uid())::text);
create policy avatars_select_own on storage.objects for select to authenticated
    using (bucket_id = 'avatars' and split_part(name,'/',1) = (select auth.uid())::text);
create function planit_private.can_delete_avatar_upload(p_path text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
    if auth.uid() is null or split_part(p_path,'/',1) <> auth.uid()::text then return false; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('avatars/' || p_path,0));
    return not exists (select 1 from public.files where bucket_name = 'avatars' and storage_path = p_path);
end;
$$;
revoke all on function planit_private.can_delete_avatar_upload(text) from public,anon,authenticated;
grant execute on function planit_private.can_delete_avatar_upload(text) to authenticated;
create policy avatars_delete_unlinked on storage.objects for delete to authenticated
    using (bucket_id = 'avatars' and planit_private.can_delete_avatar_upload(name));

-- Same object lock as deletion; no mutation to platform tables outside policies.
create or replace function planit_private.validate_event_file() returns trigger
language plpgsql set search_path = '' as $$
begin
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'read_committed_required' using errcode = '25000';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(new.bucket_name || '/' || new.storage_path,0));
    if not exists(select 1 from storage.objects where bucket_id = new.bucket_name and name = new.storage_path
        and owner_id = auth.uid()::text and metadata ->> 'mimetype' = new.mime_type
        and (metadata ->> 'size')::bigint = new.size_bytes
        and (new.bucket_name <> 'avatars' or metadata ->> 'cacheControl' in ('no-store','no-cache','max-age=0'))) then
        raise exception 'invalid_image' using errcode = 'P0001';
    end if;
    return new;
end;
$$;
-- An avatar can never enter an event gallery, including direct INSERTs.
create or replace function planit_private.validate_event_image() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    perform planit_private.lock_gallery(new.event_id);
    if not exists (select 1 from public.files where id = new.file_id
        and uploaded_by = auth.uid() and bucket_name = 'event_media') then
        raise exception 'invalid_image_owner' using errcode = '42501';
    end if;
    return new;
end;
$$;
create function public.set_my_avatar(p_storage_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_file uuid; v_mime text; v_size bigint;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    perform 1 from public.profiles where id = auth.uid() for no key update;
    if not found then raise exception 'profile_unavailable' using errcode = '42501'; end if;
    if p_storage_path is null then
        update public.profiles set avatar_file_id = null where id = auth.uid(); return null;
    end if;
    if split_part(p_storage_path,'/',1) <> auth.uid()::text then
        raise exception 'invalid_avatar' using errcode = '42501';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('avatars/' || p_storage_path,0));
    select metadata->>'mimetype',(metadata->>'size')::bigint into v_mime,v_size
        from storage.objects where bucket_id = 'avatars' and name = p_storage_path and owner_id = auth.uid()::text
            and metadata ->> 'cacheControl' in ('no-store','no-cache','max-age=0');
    if not found then raise exception 'invalid_avatar' using errcode = '42501'; end if;
    insert into public.files(uploaded_by,bucket_name,storage_path,mime_type,size_bytes)
        values (auth.uid(),'avatars',p_storage_path,v_mime,v_size)
        on conflict (bucket_name,storage_path) do nothing;
    select id into v_file from public.files where bucket_name = 'avatars' and storage_path = p_storage_path and uploaded_by = auth.uid();
    if v_file is null then raise exception 'invalid_avatar' using errcode = '42501'; end if;
    update public.profiles set avatar_file_id = v_file where id = auth.uid();
    return v_file;
end;
$$;
-- Enforce owner/purpose even if a future privileged writer updates profiles.
create function planit_private.validate_profile_avatar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if new.avatar_file_id is not null and not exists (select 1 from public.files f
        where f.id = new.avatar_file_id and f.uploaded_by = new.id and f.bucket_name = 'avatars') then
        raise exception 'invalid_avatar' using errcode = '23514';
    end if;
    return new;
end;
$$;
revoke all on function planit_private.validate_profile_avatar() from public,anon,authenticated;
create trigger profiles_validate_avatar before insert or update of avatar_file_id on public.profiles
    for each row execute function planit_private.validate_profile_avatar();

-- Refuse deployment over legacy event-media avatar references. Do not silently
-- migrate/copy/delete anyone's files; any data repair requires separate review.
do $$
begin
    if exists (select 1 from public.profiles p join public.files f on f.id = p.avatar_file_id
        where f.uploaded_by <> p.id or f.bucket_name <> 'avatars') then
        raise exception 'legacy_avatar_requires_review' using errcode = '23514';
    end if;
end;
$$;

-- Private signing gateway only. No authenticated/anon path projection: otherwise
-- callers could ask Storage for arbitrarily long signed URLs. The gateway obtains
-- the viewer from Auth.getUser, never from the HTTP body; C03 TTL is fixed at 60s.
create function public.get_social_avatar_for_signing(p_viewer_id uuid, p_user_id uuid) returns text
language sql stable security definer set search_path = '' as $$
    select f.storage_path from public.profiles p join public.files f on f.id = p.avatar_file_id
    where p.id = p_user_id and f.uploaded_by = p.id and f.bucket_name = 'avatars'
        and exists (select 1 from public.profiles where id = p_viewer_id)
        and not exists (select 1 from public.user_blocks b where
            (b.blocker_id = p_viewer_id and b.blocked_id = p_user_id) or
            (b.blocker_id = p_user_id and b.blocked_id = p_viewer_id));
$$;
revoke all on function public.get_social_avatar_for_signing(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_social_avatar_for_signing(uuid,uuid) to service_role;

revoke all on function public.get_social_profile_events(uuid,timestamp,uuid,integer),
    public.get_event_social_participants(uuid,uuid,integer), public.list_follow_requests(timestamp,uuid,integer),
    public.list_social_follows(uuid,text,uuid,integer), public.get_social_counts(uuid),
    public.get_direct_messages(uuid,timestamp,uuid,integer), public.list_direct_conversations(timestamp,uuid,integer),
    public.set_my_avatar(text) from public,anon,authenticated;
grant execute on function public.get_social_profile_events(uuid,timestamp,uuid,integer),
    public.get_event_social_participants(uuid,uuid,integer), public.list_follow_requests(timestamp,uuid,integer),
    public.list_social_follows(uuid,text,uuid,integer), public.get_social_counts(uuid),
    public.get_direct_messages(uuid,timestamp,uuid,integer), public.list_direct_conversations(timestamp,uuid,integer),
    public.set_my_avatar(text) to authenticated;
commit;
