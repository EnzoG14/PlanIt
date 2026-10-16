-- R7 B1. Local implementation only; remote application needs separate approval.
begin;

create table planit_private.media_uploads (
    id uuid primary key,
    attempt_id uuid not null unique,
    user_id uuid not null references public.profiles(id) on delete restrict,
    event_id uuid not null references public.events(id) on delete restrict,
    purpose text not null check (purpose in ('chat','story')),
    bucket_name text not null default 'event_media' check (bucket_name = 'event_media'),
    storage_path text not null unique,
    mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
    size_bytes bigint not null check (size_bytes between 1 and 5242880),
    -- Hash of the reservation payload, not a claim to have decoded object bytes.
    payload_hash text not null,
    -- Populated only by a trusted byte validator, never by the reserve RPC or
    -- browser. Fail closed until that separately reviewed boundary is present.
    verified_sha256 text check (verified_sha256 ~ '^[0-9a-f]{64}$'),
    verified_at timestamp without time zone,
    verified_object_id uuid,
    verified_etag text,
    state text not null default 'reserved' check (state in ('reserved','published','deleting','deleted')),
    created_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    updated_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    lease_token uuid,
    lease_until timestamp without time zone,
    check ((state = 'deleting') = (lease_token is not null and lease_until is not null)),
    check ((verified_sha256 is null) = (verified_at is null)),
    check ((verified_object_id is null) = (verified_at is null))
);
alter table planit_private.media_uploads enable row level security;
revoke all on planit_private.media_uploads from public,anon,authenticated;
create index media_uploads_owner on planit_private.media_uploads(user_id,event_id);
create index media_uploads_event on planit_private.media_uploads(event_id);
create index media_uploads_gc on planit_private.media_uploads(state,updated_at,id);

create table planit_private.media_claims (
    file_id uuid primary key references public.files(id) on delete restrict,
    upload_id uuid not null unique references planit_private.media_uploads(id) on delete restrict,
    purpose text not null check (purpose in ('chat','story')),
    resource_id uuid not null unique,
    event_id uuid not null references public.events(id) on delete restrict,
    created_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    check (file_id = upload_id)
);
alter table planit_private.media_claims enable row level security;
revoke all on planit_private.media_claims from public,anon,authenticated;
create index media_claims_event on planit_private.media_claims(event_id);

create table public.message_attachments (
    id uuid primary key,
    message_id uuid not null unique references public.messages(id) on delete restrict,
    file_id uuid not null unique references public.files(id) on delete restrict,
    created_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
);
alter table public.message_attachments enable row level security;
revoke all on public.message_attachments from public,anon,authenticated;
grant select on public.message_attachments to authenticated;
create policy message_attachments_read_member on public.message_attachments for select to authenticated
    using (exists (select 1 from public.messages m join public.conversations c on c.id = m.conversation_id
        where m.id = message_id and c.kind = 'event' and planit_private.can_read_event_chat(c.event_id)));

create function planit_private.r7_media_path(p_user uuid,p_event uuid,p_attempt uuid,p_purpose text,p_mime text)
returns text language sql immutable set search_path = '' as $$
    select 'r7/' || case p_purpose when 'chat' then 'chat' when 'story' then 'stories' end
        || '/' || p_user::text || '/' || p_event::text || '/' || p_attempt::text
        || case p_mime when 'image/jpeg' then '.jpg' when 'image/png' then '.png' when 'image/webp' then '.webp' end;
$$;
revoke all on function planit_private.r7_media_path(uuid,uuid,uuid,text,text) from public,anon,authenticated;

-- Shared with future publish RPCs. Order: event -> participation -> upload ->
-- advisory object path -> storage row -> files/claims -> message/attachment.
create function planit_private.lock_r7_media_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_event public.events%rowtype;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    select * into v_event from public.events where id = p_event_id for update;
    if not found or not planit_private.can_read_event_chat(p_event_id) then
        raise exception 'media_unavailable' using errcode = '42501';
    end if;
    if v_event.organizer_id <> auth.uid() then
        perform 1 from public.event_participations where event_id = p_event_id
            and user_id = auth.uid() and status = 'confirmed' for update;
        if not found then raise exception 'media_unavailable' using errcode = '42501'; end if;
    end if;
    if v_event.cancelled_at is not null or v_event.archived_at is not null
        or v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        raise exception 'event_read_only' using errcode = 'P0001';
    end if;
end;
$$;
revoke all on function planit_private.lock_r7_media_event(uuid) from public,anon,authenticated;

create function public.reserve_event_media_upload(p_event_id uuid,p_attempt_id uuid,p_file_id uuid,
    p_purpose text,p_mime_type text,p_size_bytes bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_upload planit_private.media_uploads%rowtype; v_path text; v_hash text;
begin
    perform planit_private.lock_r7_media_event(p_event_id);
    if p_attempt_id is null or p_file_id is null or p_purpose is null or p_purpose not in ('chat','story')
        or p_mime_type is null or p_mime_type not in ('image/jpeg','image/png','image/webp')
        or p_size_bytes is null or p_size_bytes not between 1 and 5242880 then
        raise exception 'invalid_media_parameters' using errcode = '22023';
    end if;
    v_path := planit_private.r7_media_path(auth.uid(),p_event_id,p_attempt_id,p_purpose,p_mime_type);
    v_hash := encode(sha256(convert_to(jsonb_build_array(auth.uid(),p_event_id,p_attempt_id,p_file_id,
        p_purpose,p_mime_type,p_size_bytes)::text,'UTF8')),'hex');
    -- Unique keys serialize simultaneous retry, including a colliding file_id.
    insert into planit_private.media_uploads(id,attempt_id,user_id,event_id,purpose,storage_path,mime_type,size_bytes,payload_hash)
        values(p_file_id,p_attempt_id,auth.uid(),p_event_id,p_purpose,v_path,p_mime_type,p_size_bytes,v_hash)
        on conflict do nothing;
    select * into v_upload from planit_private.media_uploads where attempt_id = p_attempt_id for update;
    if not found or v_upload.payload_hash <> v_hash or v_upload.state not in ('reserved','published') then
        raise exception 'media_conflict' using errcode = 'P0001';
    end if;
    return jsonb_build_object('file_id',v_upload.id,'attempt_id',v_upload.attempt_id,
        'bucket_name',v_upload.bucket_name,'storage_path',v_upload.storage_path);
end;
$$;
revoke all on function public.reserve_event_media_upload(uuid,uuid,uuid,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_event_media_upload(uuid,uuid,uuid,text,text,bigint) to authenticated;

-- Operation-aware read deliberately has no uploader shortcut. B4 extends only
-- this helper with its actual stories table and server TTL; B1 denies all stories.
create function planit_private.can_read_r7_media(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (
        select 1 from planit_private.media_uploads u
        join storage.objects o on o.bucket_id = u.bucket_name and o.name = u.storage_path
            and o.id = u.verified_object_id and o.metadata->>'eTag' is not distinct from u.verified_etag
        join planit_private.media_claims cl on cl.upload_id = u.id and cl.file_id = u.id
        join public.message_attachments a on a.file_id = cl.file_id and a.message_id = cl.resource_id
        join public.messages m on m.id = a.message_id
        join public.conversations c on c.id = m.conversation_id
        where u.storage_path = p_path and u.state = 'published' and u.purpose = 'chat'
            and cl.purpose = 'chat' and cl.event_id = u.event_id and c.kind = 'event'
            and c.event_id = u.event_id and planit_private.can_read_event_chat(c.event_id)
    );
$$;
revoke all on function planit_private.can_read_r7_media(text) from public,anon,authenticated;
grant execute on function planit_private.can_read_r7_media(text) to authenticated;

create function planit_private.can_upload_r7_media(p_path text,p_owner text,p_metadata jsonb) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_upload planit_private.media_uploads%rowtype;
begin
    if auth.uid() is null or p_owner is distinct from auth.uid()::text then return false; end if;
    select * into v_upload from planit_private.media_uploads where storage_path = p_path and user_id = auth.uid();
    if not found then return false; end if;
    perform planit_private.lock_r7_media_event(v_upload.event_id);
    select * into v_upload from planit_private.media_uploads where storage_path = p_path for update;
    perform pg_advisory_xact_lock(hashtextextended('event_media/' || p_path,0));
    return v_upload.state = 'reserved' and p_metadata->>'mimetype' = v_upload.mime_type
        and p_metadata->>'size' = v_upload.size_bytes::text and p_metadata->>'cacheControl' = 'no-store';
end;
$$;
revoke all on function planit_private.can_upload_r7_media(text,text,jsonb) from public,anon,authenticated;
grant execute on function planit_private.can_upload_r7_media(text,text,jsonb) to authenticated;

drop policy event_media_select_visible on storage.objects;
create policy event_media_select_visible on storage.objects for select to authenticated using (
    bucket_id = 'event_media' and (
        (split_part(name,'/',1) <> 'r7' and (split_part(name,'/',1) = (select auth.uid())::text
            or exists (select 1 from public.files where bucket_name = bucket_id and storage_path = name)))
        or (split_part(name,'/',1) = 'r7' and storage.allow_only_operation('object.get_authenticated')
            and planit_private.can_read_r7_media(name))
    )
);
drop policy event_media_insert_own on storage.objects;
create policy event_media_insert_own on storage.objects for insert to authenticated with check (
    bucket_id = 'event_media' and (
        (split_part(name,'/',1) <> 'r7' and split_part(name,'/',1) = (select auth.uid())::text
            and split_part(name,'/',2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            and not exists (select 1 from public.events where id::text = split_part(name,'/',2) and organizer_id <> (select auth.uid())))
        or (split_part(name,'/',1) = 'r7' and planit_private.can_upload_r7_media(name,owner_id,metadata))
    )
);
-- R7 client cleanup is intentionally denied. B6 owns the service-only leased GC;
-- failed/retried uploads keep their immutable reservation, never delete blindly.
drop policy event_media_delete_unlinked on storage.objects;
create policy event_media_delete_unlinked on storage.objects for delete to authenticated using (
    bucket_id = 'event_media' and split_part(name,'/',1) <> 'r7' and planit_private.can_delete_event_upload(name)
);

drop policy files_select_visible on public.files;
create policy files_select_visible on public.files for select to authenticated using (
    (split_part(storage_path,'/',1) <> 'r7' and (uploaded_by = (select auth.uid())
        or exists (select 1 from public.event_images where file_id = files.id)))
    or (bucket_name = 'event_media' and split_part(storage_path,'/',1) = 'r7'
        and planit_private.can_read_r7_media(storage_path))
);
drop policy files_insert_own on public.files;
create policy files_insert_own on public.files for insert to authenticated
    with check (uploaded_by = (select auth.uid()) and split_part(storage_path,'/',1) <> 'r7');

alter table public.files drop constraint files_path_valid;
alter table public.files add constraint files_path_valid check (
    (split_part(storage_path,'/',1) <> 'r7' and split_part(storage_path,'/',1) = uploaded_by::text)
    or (bucket_name = 'event_media' and split_part(storage_path,'/',1) = 'r7'
        and split_part(storage_path,'/',2) in ('chat','stories')
        and split_part(storage_path,'/',3) = uploaded_by::text
        and split_part(storage_path,'/',4) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and split_part(storage_path,'/',5) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
        and array_length(string_to_array(storage_path,'/'),1) = 5)
);

-- Keep the historical metadata trigger unchanged for legacy. The additional
-- guard covers every privileged registration path, including create_event.
create function planit_private.guard_r7_file() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_upload planit_private.media_uploads%rowtype;
begin
    if tg_op = 'UPDATE' then
        if split_part(old.storage_path,'/',1) = 'r7' or split_part(new.storage_path,'/',1) = 'r7' then
            raise exception 'immutable_media' using errcode = '23514';
        end if;
        return new;
    end if;
    if split_part(new.storage_path,'/',1) <> 'r7' then return new; end if;
    select * into v_upload from planit_private.media_uploads where id = new.id for update;
    if not found or auth.uid() is null or v_upload.user_id <> auth.uid() or new.uploaded_by <> auth.uid()
        or v_upload.state <> 'reserved' or new.bucket_name <> v_upload.bucket_name
        or new.storage_path <> v_upload.storage_path or new.mime_type <> v_upload.mime_type
        or new.size_bytes <> v_upload.size_bytes then
        raise exception 'invalid_image' using errcode = '23514';
    end if;
    return new;
end;
$$;
revoke all on function planit_private.guard_r7_file() from public,anon,authenticated;
create trigger files_guard_r7 before insert or update on public.files for each row execute function planit_private.guard_r7_file();

-- The legacy INVOKER metadata trigger cannot read unpublished R7 objects via
-- RLS. Switch just that lookup to a private DEFINER, with explicit owner checks.
create or replace function planit_private.validate_event_file() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null or new.uploaded_by <> auth.uid() then raise exception 'invalid_image' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'read_committed_required' using errcode = '25000';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(new.bucket_name || '/' || new.storage_path,0));
    if not exists (select 1 from storage.objects where bucket_id = new.bucket_name and name = new.storage_path
        and owner_id = auth.uid()::text and metadata->>'mimetype' = new.mime_type
        and metadata->>'size' = new.size_bytes::text
        and ((split_part(new.storage_path,'/',1) = 'r7' and metadata->>'cacheControl' = 'no-store')
            or (split_part(new.storage_path,'/',1) <> 'r7'
                and (new.bucket_name <> 'avatars' or metadata->>'cacheControl' in ('no-store','no-cache','max-age=0'))))) then
        raise exception 'invalid_image' using errcode = 'P0001';
    end if;
    return new;
end;
$$;

create function planit_private.guard_r7_gallery() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if exists (select 1 from public.files where id = new.file_id and split_part(storage_path,'/',1) = 'r7') then
        raise exception 'media_conflict' using errcode = '23514';
    end if;
    return new;
end;
$$;
revoke all on function planit_private.guard_r7_gallery() from public,anon,authenticated;
create trigger event_images_guard_r7 before insert or update of file_id on public.event_images
    for each row execute function planit_private.guard_r7_gallery();

-- No client EXECUTE. B2 invokes this inside its message transaction. B4 extends
-- the story final-reference branch in its own migration, rather than creating
-- a premature stories table here.
create function planit_private.register_r7_media(p_file_id uuid,p_resource_id uuid) returns uuid
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
    if v_upload.state <> 'reserved' or v_upload.purpose <> 'chat' or p_resource_id is null then
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
revoke all on function planit_private.register_r7_media(uuid,uuid) from public,anon,authenticated;

-- Cross-table CHECKs cannot see the final transaction and PostgreSQL forbids
-- subqueries in CHECK. Deferred constraint triggers inspect both sides at commit.
alter table public.messages alter column body drop not null;
alter table public.messages drop constraint messages_body_check;
alter table public.messages add constraint messages_body_check check (
    body is null or (char_length(body) between 1 and 2000 and body ~ '[^[:space:]]')
);
create function planit_private.check_r7_message(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_message public.messages%rowtype; v_kind text; v_event uuid; v_count integer;
begin
    select * into v_message from public.messages where id = p_id;
    if not found then return; end if;
    select kind,event_id into v_kind,v_event from public.conversations where id = v_message.conversation_id;
    select count(*) into v_count from public.message_attachments where message_id = p_id;
    if (v_kind = 'direct' and (v_message.body is null or v_count <> 0))
        or (v_kind = 'event' and v_message.body is null and v_count <> 1) then
        raise exception 'invalid_message' using errcode = '23514';
    end if;
    if v_count <> 0 and not exists (
        select 1 from public.message_attachments a join public.files f on f.id = a.file_id
        join planit_private.media_claims cl on cl.file_id = f.id
        join planit_private.media_uploads u on u.id = cl.upload_id
        where a.message_id = p_id and v_kind = 'event' and cl.resource_id = p_id
            and cl.purpose = 'chat' and cl.event_id = v_event and u.purpose = 'chat'
            and u.state = 'published' and u.id = f.id and u.event_id = v_event
            and u.user_id = v_message.sender_id and f.uploaded_by = v_message.sender_id
            and f.bucket_name = u.bucket_name and f.storage_path = u.storage_path
            and f.mime_type = u.mime_type and f.size_bytes = u.size_bytes
    ) then raise exception 'media_conflict' using errcode = '23514'; end if;
end;
$$;
revoke all on function planit_private.check_r7_message(uuid) from public,anon,authenticated;
create function planit_private.check_r7_message_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if tg_table_name = 'messages' then
        if tg_op <> 'INSERT' then perform planit_private.check_r7_message(old.id); end if;
        if tg_op <> 'DELETE' then perform planit_private.check_r7_message(new.id); end if;
    else
        if tg_op <> 'INSERT' then
            perform planit_private.check_r7_message(old.message_id);
            perform planit_private.check_r7_file(old.file_id);
        end if;
        if tg_op <> 'DELETE' then
            perform planit_private.check_r7_message(new.message_id);
            perform planit_private.check_r7_file(new.file_id);
        end if;
    end if;
    return null;
end;
$$;
revoke all on function planit_private.check_r7_message_trigger() from public,anon,authenticated;
create constraint trigger messages_r7_integrity after insert or update or delete on public.messages
    deferrable initially deferred for each row execute function planit_private.check_r7_message_trigger();
create constraint trigger attachments_r7_integrity after insert or update or delete on public.message_attachments
    deferrable initially deferred for each row execute function planit_private.check_r7_message_trigger();

create function planit_private.check_r7_claim_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_claim planit_private.media_claims%rowtype;
begin
    if tg_op <> 'INSERT' then
        perform planit_private.check_r7_message(old.resource_id);
    end if;
    if tg_op <> 'DELETE' then
        select * into v_claim from planit_private.media_claims where file_id = new.file_id;
        if found then
            if v_claim.purpose <> 'chat' or not exists (select 1 from public.message_attachments
                where file_id = v_claim.file_id and message_id = v_claim.resource_id) then
                raise exception 'media_conflict' using errcode = '23514';
            end if;
            perform planit_private.check_r7_message(v_claim.resource_id);
        end if;
    end if;
    return null;
end;
$$;
revoke all on function planit_private.check_r7_claim_trigger() from public,anon,authenticated;
create constraint trigger claims_r7_integrity after insert or update or delete on planit_private.media_claims
    deferrable initially deferred for each row execute function planit_private.check_r7_claim_trigger();

-- Check reverse references as well: removing/reassigning an attachment must not
-- leave a published claim orphaned even when its message still has text.
create function planit_private.check_r7_file(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare u planit_private.media_uploads%rowtype; cl planit_private.media_claims%rowtype; f public.files%rowtype;
begin
    select * into u from planit_private.media_uploads where id = p_id;
    select * into cl from planit_private.media_claims where file_id = p_id;
    select * into f from public.files where id = p_id;
    if cl.file_id is not null or u.state = 'published' or split_part(f.storage_path,'/',1) = 'r7' then
        if u.id is null or cl.file_id is null or f.id is null or u.state <> 'published'
            or u.purpose <> 'chat' or u.verified_at is null or cl.purpose <> u.purpose or cl.event_id <> u.event_id
            or cl.upload_id <> u.id or f.uploaded_by <> u.user_id
            or f.bucket_name <> u.bucket_name or f.storage_path <> u.storage_path
            or f.mime_type <> u.mime_type or f.size_bytes <> u.size_bytes
            or not exists (select 1 from public.message_attachments where file_id = p_id and message_id = cl.resource_id) then
            raise exception 'media_conflict' using errcode = '23514';
        end if;
        perform planit_private.check_r7_message(cl.resource_id);
    end if;
end;
$$;
revoke all on function planit_private.check_r7_file(uuid) from public,anon,authenticated;
create function planit_private.check_r7_file_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if tg_table_name = 'media_claims' then
        if tg_op <> 'INSERT' then perform planit_private.check_r7_file(old.file_id); end if;
        if tg_op <> 'DELETE' then perform planit_private.check_r7_file(new.file_id); end if;
    else
        if tg_op <> 'INSERT' then perform planit_private.check_r7_file(old.id); end if;
        if tg_op <> 'DELETE' then perform planit_private.check_r7_file(new.id); end if;
    end if;
    return null;
end;
$$;
revoke all on function planit_private.check_r7_file_trigger() from public,anon,authenticated;
create constraint trigger uploads_r7_references after insert or update or delete on planit_private.media_uploads
    deferrable initially deferred for each row execute function planit_private.check_r7_file_trigger();
create constraint trigger files_r7_references after insert or update or delete on public.files
    deferrable initially deferred for each row execute function planit_private.check_r7_file_trigger();
create constraint trigger claims_r7_references after insert or update or delete on planit_private.media_claims
    deferrable initially deferred for each row execute function planit_private.check_r7_file_trigger();

create function planit_private.guard_r7_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if (new.kind,new.event_id) is distinct from (old.kind,old.event_id)
        and exists (select 1 from public.messages m join public.message_attachments a on a.message_id = m.id
            where m.conversation_id = old.id) then
        raise exception 'media_conflict' using errcode = '23514';
    end if;
    return new;
end;
$$;
revoke all on function planit_private.guard_r7_conversation() from public,anon,authenticated;
create trigger conversations_guard_r7 before update of kind,event_id on public.conversations
    for each row execute function planit_private.guard_r7_conversation();

-- Preserve v1 text-only return contract, cursor and function signature.
create or replace function public.get_event_chat_messages(p_event_id uuid,p_before_at timestamp default null,p_before_id uuid default null)
returns table(id uuid,sender_id uuid,body text,created_at timestamp,display_name text,username text)
language plpgsql security definer set search_path = '' as $$
begin
    if not planit_private.can_read_event_chat(p_event_id) then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_cursor'; end if;
    return query select m.id,m.sender_id,m.body,m.created_at,p.display_name,p.username
        from public.messages m join public.conversations c on c.id = m.conversation_id
        join public.profiles p on p.id = m.sender_id where c.event_id = p_event_id and m.body is not null
        and (p_before_at is null or (m.created_at,m.id) < (p_before_at,p_before_id))
        order by m.created_at desc,m.id desc limit 51;
end;
$$;
-- Private metadata reconciliation for uncertain upload/409. It neither publishes
-- nor exposes object bytes, and never treats a duplicate HTTP status as success.
create function public.get_event_media_upload_state(p_file_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u planit_private.media_uploads%rowtype; v_uploaded boolean;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    select * into u from planit_private.media_uploads where id = p_file_id and user_id = auth.uid();
    if not found or not planit_private.can_read_event_chat(u.event_id) then
        raise exception 'media_unavailable' using errcode = '42501';
    end if;
    select exists(select 1 from storage.objects where bucket_id = u.bucket_name and name = u.storage_path
        and owner_id = auth.uid()::text and metadata->>'mimetype' = u.mime_type
        and metadata->>'size' = u.size_bytes::text and metadata->>'cacheControl' = 'no-store') into v_uploaded;
    if exists(select 1 from storage.objects where bucket_id = u.bucket_name and name = u.storage_path) and not v_uploaded then
        raise exception 'invalid_image' using errcode = 'P0001';
    end if;
    return jsonb_build_object('state',u.state,'uploaded',v_uploaded);
end;
$$;
revoke all on function public.get_event_media_upload_state(uuid) from public,anon,authenticated;
grant execute on function public.get_event_media_upload_state(uuid) to authenticated;

-- Service-only byte-validation boundary (explicitly authorized during B1).
-- Viewer comes from Auth.getUser in Edge, never from its request body.
create function public.get_r7_media_validation_target(p_viewer_id uuid,p_file_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
    select jsonb_build_object('file_id',u.id,'storage_path',u.storage_path,'mime_type',u.mime_type,
        'size_bytes',u.size_bytes,'object_id',o.id,'etag',o.metadata->>'eTag')
    from planit_private.media_uploads u join storage.objects o on o.bucket_id = u.bucket_name and o.name = u.storage_path
    join public.events e on e.id = u.event_id
    where u.id = p_file_id and u.user_id = p_viewer_id and u.state in ('reserved','published')
        and o.owner_id = p_viewer_id::text and o.metadata->>'size' = u.size_bytes::text
        and o.metadata->>'mimetype' = u.mime_type and o.metadata->>'cacheControl' = 'no-store'
        and e.cancelled_at is null and e.archived_at is null
        and e.ends_at > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and (e.organizer_id = p_viewer_id or (exists (select 1 from public.event_participations p
            where p.event_id = e.id and p.user_id = p_viewer_id and p.status = 'confirmed')
            and (e.visibility = 'public' or exists (select 1 from public.event_access_grants g
                where g.event_id = e.id and g.user_id = p_viewer_id and g.status = 'active'))));
$$;
revoke all on function public.get_r7_media_validation_target(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_r7_media_validation_target(uuid,uuid) to service_role;

create function public.complete_r7_media_validation(p_viewer_id uuid,p_file_id uuid,p_object_id uuid,p_etag text,p_sha256 text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare u planit_private.media_uploads%rowtype; v_target jsonb;
begin
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode = '40001'; end if;
    select * into u from planit_private.media_uploads where id = p_file_id and user_id = p_viewer_id;
    if not found then raise exception 'media_unavailable' using errcode = '42501'; end if;
    perform 1 from public.events where id = u.event_id for update;
    perform 1 from public.event_participations where event_id = u.event_id and user_id = p_viewer_id for update;
    select * into u from planit_private.media_uploads where id = p_file_id for update;
    perform pg_advisory_xact_lock(hashtextextended(u.bucket_name || '/' || u.storage_path,0));
    perform 1 from storage.objects where bucket_id = u.bucket_name and name = u.storage_path for update;
    v_target := public.get_r7_media_validation_target(p_viewer_id,p_file_id);
    if v_target is null or p_object_id is null or (v_target->>'object_id')::uuid <> p_object_id
        or v_target->>'etag' is distinct from p_etag or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
        raise exception 'media_unavailable' using errcode = '42501';
    end if;
    if u.verified_sha256 is not null and u.verified_sha256 <> p_sha256 then
        raise exception 'media_conflict' using errcode = '23514';
    end if;
    update planit_private.media_uploads set verified_sha256 = p_sha256, verified_object_id = p_object_id, verified_etag = p_etag,
        verified_at = coalesce(verified_at,clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') where id = p_file_id;
    return true;
end;
$$;
revoke all on function public.complete_r7_media_validation(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.complete_r7_media_validation(uuid,uuid,uuid,text,text) to service_role;
commit;
