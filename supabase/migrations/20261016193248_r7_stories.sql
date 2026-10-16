-- R7 B4. Local implementation; remote application/deployment require approval.
begin;

create table public.stories (
    id uuid primary key,
    event_id uuid not null references public.events(id) on delete restrict,
    author_id uuid not null references public.profiles(id) on delete restrict,
    file_id uuid not null unique references public.files(id) on delete restrict,
    created_at timestamp without time zone not null,
    expires_at timestamp without time zone not null,
    constraint stories_lifetime check (expires_at = created_at + interval '24 hours')
);
alter table public.stories enable row level security;
revoke all on public.stories from public,anon,authenticated;
grant select on public.stories to authenticated;
create index stories_event_cursor on public.stories(event_id,created_at desc,id desc);
create index stories_expiry on public.stories(expires_at,id);
create index stories_author on public.stories(author_id);

-- Explicit viewer is PRIVATE, for both JWT RPCs and the service-only reader.
-- Existing R4/R6 event-detail permission also applies to cancelled/archived events.
create function planit_private.can_read_story_event(p_event_id uuid,p_viewer_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select p_viewer_id is not null and exists (
        select 1 from public.events e where e.id = p_event_id and (
            e.organizer_id = p_viewer_id or (
                exists (select 1 from public.event_participations p where p.event_id = e.id
                    and p.user_id = p_viewer_id and p.status = 'confirmed')
                and (e.visibility = 'public' or exists (select 1 from public.event_access_grants g
                    where g.event_id = e.id and g.user_id = p_viewer_id and g.status = 'active'))
            )
        )
    );
$$;
revoke all on function planit_private.can_read_story_event(uuid,uuid) from public,anon,authenticated;

create function planit_private.can_read_story(p_id uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
    select exists (select 1 from public.stories s where s.id = p_id
        and s.expires_at > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and planit_private.can_read_story_event(s.event_id,auth.uid()));
$$;
revoke all on function planit_private.can_read_story(uuid) from public,anon,authenticated;
grant execute on function planit_private.can_read_story(uuid) to authenticated;
create policy stories_read_current on public.stories for select to authenticated
    using (planit_private.can_read_story(id));

-- No client mutation grants. The trigger is defense in depth for all privileged
-- insertion paths: take the same locks, derive author/time, and freeze the row.
create function planit_private.guard_r7_story() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_now timestamp without time zone;
begin
    if tg_op = 'UPDATE' then raise exception 'immutable_story' using errcode = '23514'; end if;
    perform planit_private.lock_r7_media_event(new.event_id);
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    new.author_id := auth.uid();
    new.created_at := v_now;
    new.expires_at := v_now + interval '24 hours';
    return new;
end;
$$;
revoke all on function planit_private.guard_r7_story() from public,anon,authenticated;
create trigger stories_guard before insert or update on public.stories
    for each row execute function planit_private.guard_r7_story();

-- Registration and bidirectional constraint validators are extended below;
-- their chat branches retain B1/B2 semantics.

create function public.publish_event_story(p_event_id uuid,p_story_id uuid,p_file_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype; v_existing public.stories%rowtype;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'stories_unavailable' using errcode = '42501'; end if;
    if v_event.organizer_id <> auth.uid() then
        perform 1 from public.event_participations where event_id = p_event_id
            and user_id = auth.uid() and status = 'confirmed' for update;
        if not found then raise exception 'stories_unavailable' using errcode = '42501'; end if;
    end if;
    if not planit_private.can_read_story_event(p_event_id,auth.uid()) then
        raise exception 'stories_unavailable' using errcode = '42501';
    end if;
    if p_story_id is null or p_file_id is null then
        raise exception 'invalid_story' using errcode = '22023';
    end if;
    select * into v_existing from public.stories where id = p_story_id;
    if found then
        if v_existing.event_id = p_event_id and v_existing.author_id = auth.uid()
            and v_existing.file_id = p_file_id then
            -- Acknowledges an earlier commit; does NOT extend TTL or grant bytes.
            return p_story_id;
        end if;
        raise exception 'story_conflict' using errcode = 'P0001';
    end if;
    perform planit_private.lock_r7_media_event(p_event_id);
    perform 1 from planit_private.media_uploads where id = p_file_id and user_id = auth.uid()
        and event_id = p_event_id and purpose = 'story';
    if not found then raise exception 'media_unavailable' using errcode = '42501'; end if;
    perform planit_private.register_r7_media(p_file_id,p_story_id);
    insert into public.stories(id,event_id,file_id) values(p_story_id,p_event_id,p_file_id);
    return p_story_id;
exception when unique_violation then
    raise exception 'story_conflict' using errcode = 'P0001';
end;
$$;
revoke all on function public.publish_event_story(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_event_story(uuid,uuid,uuid) to authenticated;

-- Server time, deterministic keyset cursor and bounded lookahead, no URL.
create function public.get_event_stories(p_event_id uuid,p_before_at timestamp default null,
    p_before_id uuid default null,p_limit integer default 30) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_now timestamp without time zone; v_rows jsonb; v_last jsonb; v_more boolean;
begin
    if not planit_private.can_read_story_event(p_event_id,auth.uid()) then
        raise exception 'stories_unavailable' using errcode = '42501';
    end if;
    if (p_before_at is null) <> (p_before_id is null) or p_limit is null or p_limit not between 1 and 50 then
        raise exception 'invalid_cursor' using errcode = '22023';
    end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    select coalesce(jsonb_agg(to_jsonb(page) order by page.created_at desc,page.id desc),'[]'::jsonb)
    into v_rows from (
        select s.id,s.event_id,s.author_id,s.file_id,s.created_at,s.expires_at,
            case when planit_private.social_blocked(s.author_id) then 'Perfil no disponible' else p.display_name end as display_name,
            case when planit_private.social_blocked(s.author_id) then '' else p.username end as username,
            f.bucket_name,f.storage_path,f.mime_type,f.size_bytes
        from public.stories s join public.files f on f.id = s.file_id
        join public.profiles p on p.id = s.author_id
        where s.event_id = p_event_id and s.expires_at > v_now
            and (p_before_at is null or (s.created_at,s.id) < (p_before_at,p_before_id))
            and planit_private.can_read_r7_media(f.storage_path)
        order by s.created_at desc,s.id desc limit p_limit + 1
    ) page;
    v_more := jsonb_array_length(v_rows) > p_limit;
    if v_more then v_rows := v_rows - p_limit; end if;
    v_last := v_rows -> (jsonb_array_length(v_rows)-1);
    return jsonb_build_object('server_now',v_now,'items',v_rows,'next_cursor',
        case when v_more then jsonb_build_object('created_at',v_last->'created_at','id',v_last->'id') else null end);
end;
$$;
revoke all on function public.get_event_stories(uuid,timestamp,uuid,integer) from public,anon,authenticated;
grant execute on function public.get_event_stories(uuid,timestamp,uuid,integer) to authenticated;

-- Service-only, explicit viewer supplied by Auth.getUser in r7-story-image.
-- Each call uses fresh server time, including after the image I/O.
create function public.get_r7_story_image_target(p_viewer_id uuid,p_story_id uuid) returns jsonb
language sql volatile security definer set search_path = '' as $$
    select jsonb_build_object('file_id',u.id,'storage_path',u.storage_path,'mime_type',u.mime_type,
        'size_bytes',u.size_bytes,'sha256',u.verified_sha256,'object_id',u.verified_object_id,'etag',u.verified_etag)
    from public.stories s
    join planit_private.media_claims cl on cl.file_id = s.file_id and cl.resource_id = s.id and cl.purpose = 'story'
    join planit_private.media_uploads u on u.id = cl.upload_id and u.id = s.file_id
        and u.event_id = s.event_id and cl.event_id = s.event_id and u.user_id = s.author_id
        and u.purpose = 'story' and u.state = 'published'
    join storage.objects o on o.bucket_id = u.bucket_name and o.name = u.storage_path
        and o.id = u.verified_object_id and o.metadata->>'eTag' is not distinct from u.verified_etag
    where s.id = p_story_id and u.verified_sha256 is not null
        and s.expires_at > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and planit_private.can_read_story_event(s.event_id,p_viewer_id);
$$;
revoke all on function public.get_r7_story_image_target(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_r7_story_image_target(uuid,uuid) to service_role;

create or replace function planit_private.register_r7_media(p_file_id uuid,p_resource_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_upload planit_private.media_uploads%rowtype;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    select * into v_upload from planit_private.media_uploads where id = p_file_id and user_id = auth.uid();
    if not found then raise exception 'media_unavailable' using errcode = '42501'; end if;
    perform planit_private.lock_r7_media_event(v_upload.event_id);
    select * into v_upload from planit_private.media_uploads where id = p_file_id for update;
    perform pg_advisory_xact_lock(hashtextextended('event_media/' || v_upload.storage_path,0));
    if v_upload.state = 'published' and exists (select 1 from planit_private.media_claims
        where file_id = p_file_id and resource_id = p_resource_id and purpose = v_upload.purpose and event_id = v_upload.event_id) then
        return p_file_id;
    end if;
    if v_upload.state <> 'reserved' or v_upload.purpose not in ('chat','story') or p_resource_id is null then
        raise exception 'media_conflict' using errcode = 'P0001';
    end if;
    if v_upload.verified_at is null then
        raise exception 'image_verification_required' using errcode = 'P0001';
    end if;
    perform 1 from storage.objects where bucket_id = v_upload.bucket_name and name = v_upload.storage_path
        and id = v_upload.verified_object_id and metadata->>'eTag' is not distinct from v_upload.verified_etag for update;
    if not found then raise exception 'upload_unavailable' using errcode = 'P0001'; end if;
    insert into public.files(id,uploaded_by,bucket_name,storage_path,mime_type,size_bytes)
        values(v_upload.id,auth.uid(),v_upload.bucket_name,v_upload.storage_path,v_upload.mime_type,v_upload.size_bytes);
    insert into planit_private.media_claims(file_id,upload_id,purpose,resource_id,event_id)
        values(p_file_id,p_file_id,v_upload.purpose,p_resource_id,v_upload.event_id);
    update planit_private.media_uploads set state = 'published',
        updated_at = (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') where id = p_file_id;
    return p_file_id;
end;
$$;

create or replace function planit_private.check_r7_file(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare u planit_private.media_uploads%rowtype; cl planit_private.media_claims%rowtype; f public.files%rowtype;
begin
    select * into u from planit_private.media_uploads where id = p_id;
    select * into cl from planit_private.media_claims where file_id = p_id;
    select * into f from public.files where id = p_id;
    if cl.file_id is not null or u.state = 'published' or split_part(f.storage_path,'/',1) = 'r7' then
        if u.id is null or cl.file_id is null or f.id is null or u.state <> 'published'
            or u.purpose not in ('chat','story') or u.verified_at is null or cl.purpose <> u.purpose or cl.event_id <> u.event_id
            or cl.upload_id <> u.id or f.uploaded_by <> u.user_id
            or f.bucket_name <> u.bucket_name or f.storage_path <> u.storage_path
            or f.mime_type <> u.mime_type or f.size_bytes <> u.size_bytes
            or (u.purpose = 'chat' and not exists (select 1 from public.message_attachments where file_id = p_id and message_id = cl.resource_id))
            or (u.purpose = 'story' and not exists (select 1 from public.stories where file_id = p_id and id = cl.resource_id
                and event_id = u.event_id and author_id = u.user_id)) then
            raise exception 'media_conflict' using errcode = '23514';
        end if;
        if u.purpose = 'chat' then perform planit_private.check_r7_message(cl.resource_id); end if;
    end if;
end;
$$;

create or replace function planit_private.check_r7_claim_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_claim planit_private.media_claims%rowtype;
begin
    if tg_op <> 'INSERT' then
        perform planit_private.check_r7_message(old.resource_id);
    end if;
    if tg_op <> 'DELETE' then
        select * into v_claim from planit_private.media_claims where file_id = new.file_id;
        if found then
            if v_claim.purpose = 'chat' and not exists (select 1 from public.message_attachments
                where file_id = v_claim.file_id and message_id = v_claim.resource_id) then
                raise exception 'media_conflict' using errcode = '23514';
            end if;
            if v_claim.purpose = 'chat' then
                perform planit_private.check_r7_message(v_claim.resource_id);
            elsif not exists (select 1 from public.stories where id = v_claim.resource_id and file_id = v_claim.file_id
                and event_id = v_claim.event_id) then
                raise exception 'media_conflict' using errcode = '23514';
            end if;
        end if;
    end if;
    return null;
end;
$$;

create or replace function planit_private.can_read_r7_media(p_path text) returns boolean
language sql volatile security definer set search_path = '' as $$
    select auth.uid() is not null and exists (
        select 1 from planit_private.media_uploads u
        join storage.objects o on o.bucket_id = u.bucket_name and o.name = u.storage_path
            and o.id = u.verified_object_id and o.metadata->>'eTag' is not distinct from u.verified_etag
        join planit_private.media_claims cl on cl.upload_id = u.id and cl.file_id = u.id
        where u.storage_path = p_path and u.state = 'published' and (
            (u.purpose = 'chat' and cl.purpose = 'chat' and cl.event_id = u.event_id and exists (
                select 1 from public.message_attachments a join public.messages m on m.id = a.message_id
                join public.conversations c on c.id = m.conversation_id
                where a.file_id = cl.file_id and a.message_id = cl.resource_id and c.kind = 'event'
                    and c.event_id = u.event_id and planit_private.can_read_event_chat(c.event_id)
            ))
            or (u.purpose = 'story' and cl.purpose = 'story' and cl.event_id = u.event_id and exists (
                select 1 from public.stories s where s.id = cl.resource_id and s.file_id = cl.file_id
                    and s.author_id = u.user_id and s.event_id = u.event_id
                    and s.expires_at > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
                    and planit_private.can_read_story_event(s.event_id,auth.uid())
            ))
        )
    );
$$;

create function planit_private.check_r7_story_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if tg_op <> 'INSERT' then perform planit_private.check_r7_file(old.file_id); end if;
    if tg_op <> 'DELETE' then perform planit_private.check_r7_file(new.file_id); end if;
    return null;
end;
$$;
revoke all on function planit_private.check_r7_story_trigger() from public,anon,authenticated;
create constraint trigger stories_r7_integrity after insert or update or delete on public.stories
    deferrable initially deferred for each row execute function planit_private.check_r7_story_trigger();

commit;
