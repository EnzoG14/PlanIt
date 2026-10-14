-- R5 B1: local proposal. Never apply remotely without separate approval.
begin;

-- Invoker reads/Storage policies use viewer-bound helpers; no CREATE or internal
-- mutation EXECUTE is granted. The schema remains outside the Data API.
grant usage on schema planit_private to authenticated;

create table public.user_follows (
    follower_id uuid not null references public.profiles(id) on delete restrict,
    followed_id uuid not null references public.profiles(id) on delete restrict,
    status text not null check (status in ('pending', 'accepted', 'rejected')),
    request_version uuid not null default gen_random_uuid(),
    requested_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    responded_at timestamp,
    primary key (follower_id, followed_id),
    check (follower_id <> followed_id),
    check ((status = 'pending' and responded_at is null) or
           (status in ('accepted', 'rejected') and responded_at is not null)),
    check (responded_at is null or responded_at >= requested_at)
);
alter table public.user_follows enable row level security;
revoke all on public.user_follows from public, anon, authenticated;
grant select on public.user_follows to authenticated;
create policy user_follows_read_own on public.user_follows for select to authenticated
    using ((select auth.uid()) in (follower_id, followed_id));
create index user_follows_followed_idx on public.user_follows(followed_id, follower_id);
create index user_follows_pending_idx on public.user_follows(followed_id, requested_at, follower_id)
    where status = 'pending';

create table public.user_blocks (
    blocker_id uuid not null references public.profiles(id) on delete restrict,
    blocked_id uuid not null references public.profiles(id) on delete restrict,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    primary key (blocker_id, blocked_id),
    check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
revoke all on public.user_blocks from public, anon, authenticated;
grant select on public.user_blocks to authenticated;
create policy user_blocks_read_own on public.user_blocks for select to authenticated
    using (blocker_id = (select auth.uid()));
create index user_blocks_blocked_idx on public.user_blocks(blocked_id, blocker_id);

-- No actor parameter: even a direct helper call cannot inspect third-party pairs.
create function planit_private.social_blocked(p_target_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select auth.uid() is null or exists (
        select 1 from public.user_blocks b where
        (b.blocker_id = auth.uid() and b.blocked_id = p_target_id) or
        (b.blocker_id = p_target_id and b.blocked_id = auth.uid())
    );
$$;
revoke all on function planit_private.social_blocked(uuid) from public, anon, authenticated;
grant execute on function planit_private.social_blocked(uuid) to authenticated;

-- All social writes lock existing profiles, never a missing relation. FK KEY SHARE
-- remains compatible. Privacy locks only self and never locks followers afterward.
create function planit_private.lock_social_pair(p_target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    if p_target_id is null or p_target_id = auth.uid() then
        raise exception 'invalid_social_target' using errcode = '22023';
    end if;
    perform 1 from public.profiles where id in (auth.uid(), p_target_id)
        order by id for no key update;
    get diagnostics v_count = row_count;
    if v_count <> 2 then raise exception 'profile_unavailable' using errcode = '42501'; end if;
end;
$$;
revoke all on function planit_private.lock_social_pair(uuid) from public, anon, authenticated;

-- Close PATCH bypass of D04; other existing own-column edits retain their contract.
revoke update (visibility) on public.profiles from public, anon, authenticated;
create function public.update_my_social_profile(
    p_username text, p_display_name text, p_first_name text, p_last_name text,
    p_birth_date date, p_sex text, p_bio text, p_visibility text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old_visibility text; v_accepted integer := 0;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    select visibility into v_old_visibility from public.profiles
        where id = auth.uid() for no key update;
    if not found then raise exception 'profile_unavailable' using errcode = '42501'; end if;
    update public.profiles set username = p_username, display_name = p_display_name,
        first_name = p_first_name, last_name = p_last_name, birth_date = p_birth_date,
        sex = p_sex, bio = p_bio, visibility = p_visibility where id = auth.uid();
    if v_old_visibility = 'private' and p_visibility = 'public' then
        update public.user_follows f set status = 'accepted',
            responded_at = clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'
        where f.followed_id = auth.uid() and f.status = 'pending'
            and not planit_private.social_blocked(f.follower_id);
        get diagnostics v_accepted = row_count;
    end if;
    return jsonb_build_object('visibility', p_visibility, 'accepted_requests', v_accepted);
end;
$$;

create function public.follow_user(p_target_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_visibility text; v_status text; v_follow public.user_follows%rowtype; v_now timestamp;
begin
    perform planit_private.lock_social_pair(p_target_id);
    if planit_private.social_blocked(p_target_id) then
        raise exception 'profile_unavailable' using errcode = '42501';
    end if;
    select * into v_follow from public.user_follows
        where follower_id = auth.uid() and followed_id = p_target_id;
    if found and v_follow.status in ('pending', 'accepted') then
        return jsonb_build_object('status', v_follow.status, 'request_version', v_follow.request_version);
    end if;
    select visibility into v_visibility from public.profiles where id = p_target_id;
    v_status := case when v_visibility = 'public' then 'accepted' else 'pending' end;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    insert into public.user_follows(follower_id, followed_id, status, requested_at, responded_at)
    values (auth.uid(), p_target_id, v_status, v_now, case when v_status = 'accepted' then v_now end)
    on conflict (follower_id, followed_id) do update set status = excluded.status,
        request_version = gen_random_uuid(), requested_at = excluded.requested_at,
        responded_at = excluded.responded_at returning * into v_follow;
    return jsonb_build_object('status', v_follow.status, 'request_version', v_follow.request_version);
end;
$$;
create function public.unfollow_user(p_target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    perform planit_private.lock_social_pair(p_target_id);
    delete from public.user_follows where follower_id = auth.uid() and followed_id = p_target_id;
end;
$$;
create function public.resolve_follow_request(p_follower_id uuid, p_request_version uuid, p_decision text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_follow public.user_follows%rowtype;
begin
    perform planit_private.lock_social_pair(p_follower_id);
    if p_decision is null or p_decision not in ('accepted', 'rejected') or p_request_version is null then
        raise exception 'invalid_follow_decision' using errcode = '22023';
    end if;
    if planit_private.social_blocked(p_follower_id) then
        raise exception 'request_unavailable' using errcode = '42501';
    end if;
    select * into v_follow from public.user_follows
        where follower_id = p_follower_id and followed_id = auth.uid();
    if not found or v_follow.request_version <> p_request_version then
        raise exception 'request_unavailable' using errcode = '42501';
    end if;
    if v_follow.status <> 'pending' then
        if v_follow.status = p_decision then return v_follow.status; end if;
        raise exception 'request_already_resolved' using errcode = '22023';
    end if;
    update public.user_follows set status = p_decision,
        responded_at = clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'
        where follower_id = p_follower_id and followed_id = auth.uid();
    return p_decision;
end;
$$;
create function public.block_user(p_target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    perform planit_private.lock_social_pair(p_target_id);
    insert into public.user_blocks(blocker_id, blocked_id) values (auth.uid(), p_target_id)
        on conflict (blocker_id, blocked_id) do nothing;
    delete from public.user_follows where
        (follower_id = auth.uid() and followed_id = p_target_id) or
        (follower_id = p_target_id and followed_id = auth.uid());
end;
$$;
create function public.unblock_user(p_target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    perform planit_private.lock_social_pair(p_target_id);
    delete from public.user_blocks where blocker_id = auth.uid() and blocked_id = p_target_id;
end;
$$;

-- Preserve event UNIQUE, IDs, messages, notification FK and event trigger.
alter table public.conversations drop constraint conversations_kind_check;
alter table public.conversations alter column event_id drop not null;
alter table public.conversations add column user_low_id uuid references public.profiles(id) on delete restrict;
alter table public.conversations add column user_high_id uuid references public.profiles(id) on delete restrict;
alter table public.conversations add constraint conversations_kind_members_valid check (
    (kind = 'event' and event_id is not null and user_low_id is null and user_high_id is null) or
    (kind = 'direct' and event_id is null and user_low_id is not null and user_high_id is not null
        and user_low_id < user_high_id)
);
alter table public.conversations add constraint conversations_direct_pair_key unique (user_low_id, user_high_id);
create index conversations_direct_high_idx on public.conversations(user_high_id, created_at desc, id desc)
    where kind = 'direct';
create index conversations_direct_low_idx on public.conversations(user_low_id, created_at desc, id desc)
    where kind = 'direct';
drop policy conversations_read_member on public.conversations;
create policy conversations_read_member on public.conversations for select to authenticated using (
    (kind = 'event' and planit_private.can_read_event_chat(event_id)) or
    (kind = 'direct' and (select auth.uid()) in (user_low_id, user_high_id))
);
-- messages_read_member already delegates to conversations RLS. Do not alter it.
create function public.get_or_create_direct_conversation(p_target_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
    perform planit_private.lock_social_pair(p_target_id);
    if planit_private.social_blocked(p_target_id) then
        raise exception 'profile_unavailable' using errcode = '42501';
    end if;
    select id into v_id from public.conversations where kind = 'direct'
        and user_low_id = least(auth.uid(), p_target_id) and user_high_id = greatest(auth.uid(), p_target_id);
    if found then return v_id; end if;
    insert into public.conversations(kind, user_low_id, user_high_id)
        values ('direct', least(auth.uid(), p_target_id), greatest(auth.uid(), p_target_id))
        returning id into v_id;
    return v_id;
end;
$$;
create function public.send_direct_message(p_conversation_id uuid, p_message_id uuid, p_body text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_target uuid; v_existing public.messages%rowtype;
    v_body text := btrim(p_body, E' \t\n\r\f\v' || U&'\0085\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    select case when c.user_low_id = auth.uid() then c.user_high_id else c.user_low_id end
        into v_target from public.conversations c where c.id = p_conversation_id and c.kind = 'direct'
        and auth.uid() in (c.user_low_id, c.user_high_id);
    if not found then raise exception 'conversation_unavailable' using errcode = '42501'; end if;
    perform planit_private.lock_social_pair(v_target);
    if p_message_id is null or v_body is null or char_length(v_body) not between 1 and 2000 or v_body !~ '[^[:space:]]' then
        raise exception 'invalid_message' using errcode = '22023';
    end if;
    -- A successful retry is a read of an existing effect, also during a later block.
    select * into v_existing from public.messages where id = p_message_id;
    if found then
        if v_existing.sender_id = auth.uid() and v_existing.conversation_id = p_conversation_id
            and v_existing.body = v_body then return p_message_id; end if;
        raise exception 'message_id_conflict' using errcode = '22023';
    end if;
    if planit_private.social_blocked(v_target) then
        raise exception 'conversation_read_only' using errcode = '42501';
    end if;
    insert into public.messages(id, conversation_id, sender_id, body)
        values (p_message_id, p_conversation_id, auth.uid(), v_body);
    return p_message_id;
end;
$$;

-- Profile projections never expose profiles.* or demographics. Interaction
-- state is separate so minimal profile has exactly the three D02 fields.
create function public.get_social_profile(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_profile public.profiles%rowtype; v_result jsonb;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if planit_private.social_blocked(p_user_id) then return jsonb_build_object('unavailable', true); end if;
    select * into v_profile from public.profiles where id = p_user_id;
    if not found then return jsonb_build_object('unavailable', true); end if;
    v_result := jsonb_build_object('display_name', v_profile.display_name, 'username', v_profile.username,
        'avatar', case when v_profile.avatar_file_id is not null then p_user_id else null end);
    if p_user_id = auth.uid() or v_profile.visibility = 'public' or exists (
        select 1 from public.user_follows where follower_id = auth.uid() and followed_id = p_user_id and status = 'accepted'
    ) then v_result := v_result || jsonb_build_object('bio', v_profile.bio); end if;
    return v_result;
end;
$$;
create function public.get_social_relationship(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if planit_private.social_blocked(p_user_id) then
        return jsonb_build_object('unavailable', true, 'blocked_by_me', exists (
            select 1 from public.user_blocks where blocker_id = auth.uid() and blocked_id = p_user_id));
    end if;
    if not exists (select 1 from public.profiles where id = p_user_id) then
        return jsonb_build_object('unavailable', true, 'blocked_by_me', false);
    end if;
    return jsonb_build_object('visibility', (select visibility from public.profiles where id = p_user_id),
        'follow', (select jsonb_build_object('status',status,'request_version',request_version)
            from public.user_follows where follower_id = auth.uid() and followed_id = p_user_id));
end;
$$;

-- Future lists/events RPCs must use this viewer-bound gate, not event grants.
create function planit_private.can_read_social_content(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and not planit_private.social_blocked(p_user_id) and exists (
        select 1 from public.profiles p where p.id = p_user_id and
        (p.id = auth.uid() or p.visibility = 'public' or exists (
            select 1 from public.user_follows f where f.follower_id = auth.uid()
                and f.followed_id = p.id and f.status = 'accepted'))
    );
$$;
revoke all on function planit_private.can_read_social_content(uuid) from public, anon, authenticated;
grant execute on function planit_private.can_read_social_content(uuid) to authenticated;

-- Definers above are necessary for atomic writes / field allowlists with no
-- generic write or third-party profile SELECT grants. Internal lock stays private.
revoke all on function public.update_my_social_profile(text,text,text,text,date,text,text,text),
    public.follow_user(uuid), public.unfollow_user(uuid), public.resolve_follow_request(uuid,uuid,text),
    public.block_user(uuid), public.unblock_user(uuid), public.get_or_create_direct_conversation(uuid),
    public.send_direct_message(uuid,uuid,text), public.get_social_profile(uuid), public.get_social_relationship(uuid)
    from public, anon, authenticated;
grant execute on function public.update_my_social_profile(text,text,text,text,date,text,text,text),
    public.follow_user(uuid), public.unfollow_user(uuid), public.resolve_follow_request(uuid,uuid,text),
    public.block_user(uuid), public.unblock_user(uuid), public.get_or_create_direct_conversation(uuid),
    public.send_direct_message(uuid,uuid,text), public.get_social_profile(uuid), public.get_social_relationship(uuid)
    to authenticated;
commit;
