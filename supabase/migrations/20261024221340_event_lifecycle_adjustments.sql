begin;

-- These receipts contain no event content and deliberately have no event FK:
-- the owner can resolve a lost response even after the event has been removed.
create table planit_private.event_operations (
    operation_id uuid primary key,
    event_id uuid not null,
    owner_id uuid not null references public.profiles(id) on delete restrict,
    action text not null check (action in ('reactivate','delete')),
    payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
    completed_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
);
alter table planit_private.event_operations enable row level security;
revoke all on planit_private.event_operations from public,anon,authenticated,service_role;
create index event_operations_event on planit_private.event_operations(event_id,action);

create table planit_private.event_media_gc_jobs (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null,
    bucket_name text not null check (bucket_name = 'event_media'),
    storage_path text not null,
    object_id uuid,
    lease_token uuid,
    lease_until timestamp,
    attempts integer not null default 0 check (attempts >= 0),
    next_attempt_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    last_error_code text check (last_error_code in ('storage_error','backend_error')),
    unique(bucket_name,storage_path),
    check ((lease_token is null) = (lease_until is null))
);
alter table planit_private.event_media_gc_jobs enable row level security;
revoke all on planit_private.event_media_gc_jobs from public,anon,authenticated,service_role;
create index event_media_gc_ready on planit_private.event_media_gc_jobs(next_attempt_at,id);

create function public.get_event_operation(p_operation_id uuid,p_event_id uuid,p_action text)
returns boolean language sql security definer set search_path = '' as $$
    select exists(select 1 from planit_private.event_operations where operation_id=p_operation_id
        and event_id=p_event_id and owner_id=auth.uid() and action=p_action);
$$;
revoke all on function public.get_event_operation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.get_event_operation(uuid,uuid,text) to authenticated;

create function public.reactivate_event(
    p_event_id uuid,p_operation_id uuid,p_title text,p_description text,p_starts_at timestamp,
    p_ends_at timestamp,p_category_id uuid,p_capacity integer,p_address text,
    p_latitude double precision,p_longitude double precision,p_location_name text default null,p_visibility text default 'public'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_receipt planit_private.event_operations%rowtype;
    v_payload jsonb := jsonb_build_array(p_title,p_description,p_starts_at,p_ends_at,p_category_id,
        p_capacity,p_address,p_latitude,p_longitude,p_location_name,p_visibility);
    v_now timestamp;
    v_parts uuid[];
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
    if p_operation_id is null then raise exception 'request_id_required' using errcode='22023'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode='40001'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
    select * into v_receipt from planit_private.event_operations where operation_id=p_operation_id;
    if found then
        if v_receipt.owner_id<>auth.uid() or v_receipt.event_id<>p_event_id or v_receipt.action<>'reactivate'
            or v_receipt.payload_hash<>encode(extensions.digest(v_payload::text,'sha256'),'hex') then raise exception 'operation_conflict' using errcode='22023'; end if;
        return p_event_id;
    end if;
    select * into v_event from public.events where id=p_event_id for update;
    if not found or v_event.organizer_id<>auth.uid() then raise exception 'event_unavailable' using errcode='42501'; end if;
    if v_event.archived_at is null then raise exception 'event_not_archived' using errcode='P0001'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if p_starts_at is null or p_ends_at is null or not isfinite(p_starts_at) or not isfinite(p_ends_at)
        or p_starts_at<=v_now then raise exception 'start_not_future' using errcode='P0001'; end if;
    if p_ends_at<=p_starts_at then raise exception 'end_before_start' using errcode='P0001'; end if;
    if not exists(select 1 from public.categories where id=p_category_id and is_active) then raise exception 'category_inactive' using errcode='P0001'; end if;
    if p_visibility is null or p_visibility not in ('public','unlisted') then raise exception 'invalid_visibility' using errcode='23514'; end if;
    -- Existing history trigger runs as usual. Relabel only the transitions made
    -- here, rather than exposing a browser-controlled trigger context flag.
    select coalesce(array_agg(id),'{}'::uuid[]) into v_parts from public.event_participations where event_id=p_event_id and status='confirmed';
    update public.event_participations set status='cancelled' where id=any(v_parts);
    update public.participation_history set reason='event_reactivation' where participation_id=any(v_parts)
        and previous_status='confirmed' and new_status='cancelled' and changed_by=auth.uid() and created_at>=v_now;
    update public.events set title=btrim(p_title),description=btrim(p_description),starts_at=p_starts_at,
        ends_at=p_ends_at,category_id=p_category_id,capacity=p_capacity,address=btrim(p_address),
        latitude=p_latitude,longitude=p_longitude,location_name=nullif(btrim(p_location_name),''),
        visibility=p_visibility,archived_at=null,cancelled_at=null where id=p_event_id;
    insert into planit_private.event_operations(operation_id,event_id,owner_id,action,payload_hash)
        values(p_operation_id,p_event_id,auth.uid(),'reactivate',encode(extensions.digest(v_payload::text,'sha256'),'hex'));
    return p_event_id;
end;
$$;

-- Serialize Storage INSERTs for event-specific paths with deletion. Publication
-- staging for a new UUID still works; a deleted UUID can never be reused.
create function planit_private.allow_event_media_insert(p_path text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_text text; v_event uuid;
begin
    v_text := case when split_part(p_path,'/',1)='r7' then split_part(p_path,'/',4) else split_part(p_path,'/',2) end;
    if v_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        v_event := v_text::uuid;
        perform 1 from public.events where id=v_event for update;
        perform pg_advisory_xact_lock(hashtextextended('event-media:'||v_event::text,0));
        if exists(select 1 from planit_private.event_operations where event_id=v_event and action='delete') then return false; end if;
    end if;
    -- Also fence older gallery paths without an event UUID. The queue remains
    -- present across Storage I/O, so a checked object cannot acquire a new link.
    perform pg_advisory_xact_lock(hashtextextended('event_media/'||p_path,0));
    return not exists(select 1 from planit_private.event_media_gc_jobs where storage_path=p_path);
end;
$$;
revoke all on function planit_private.allow_event_media_insert(text) from public,anon,authenticated;
grant execute on function planit_private.allow_event_media_insert(text) to authenticated;
create policy event_media_no_deleted_event on storage.objects as restrictive for insert to authenticated
    with check (bucket_id<>'event_media' or planit_private.allow_event_media_insert(name));

-- An uploader must not relink a queued object while the worker performs I/O.
create function planit_private.guard_deleted_event_file() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if new.bucket_name='event_media' and not planit_private.allow_event_media_insert(new.storage_path) then
        raise exception 'event_unavailable' using errcode='42501';
    end if;
    return new;
end;
$$;
revoke all on function planit_private.guard_deleted_event_file() from public,anon,authenticated;
create trigger files_guard_deleted_event before insert or update of bucket_name,storage_path on public.files
    for each row execute function planit_private.guard_deleted_event_file();
create function planit_private.guard_deleted_event_id() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    perform pg_advisory_xact_lock(hashtextextended('event-media:'||new.id::text,0));
    if exists(select 1 from planit_private.event_operations where event_id=new.id and action='delete') then
        raise exception 'event_unavailable' using errcode='42501';
    end if;
    return new;
end;
$$;
revoke all on function planit_private.guard_deleted_event_id() from public,anon,authenticated;
create trigger events_guard_deleted_id before insert on public.events for each row execute function planit_private.guard_deleted_event_id();

create function public.delete_event(p_event_id uuid,p_operation_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_receipt planit_private.event_operations%rowtype;
    v_files uuid[];
    v_now timestamp;
    v_path text;
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
    if p_operation_id is null then raise exception 'request_id_required' using errcode='22023'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then raise exception 'retry_read_committed' using errcode='40001'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
    select * into v_receipt from planit_private.event_operations where operation_id=p_operation_id;
    if found then
        if v_receipt.owner_id<>auth.uid() or v_receipt.event_id<>p_event_id or v_receipt.action<>'delete' then
            raise exception 'operation_conflict' using errcode='22023'; end if;
        return p_event_id;
    end if;
    select * into v_event from public.events where id=p_event_id for update;
    if not found or v_event.organizer_id<>auth.uid() then raise exception 'event_unavailable' using errcode='42501'; end if;
    v_now := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    if v_event.cancelled_at is null and v_event.ends_at>v_now then raise exception 'event_not_closed' using errcode='P0001'; end if;
    perform pg_advisory_xact_lock(hashtextextended('event-media:'||p_event_id::text,0));
    -- Path locks precede file locks, matching upload/file guards, including
    -- legacy paths that do not embed this event ID.
    for v_path in
        select storage_path from public.files where id in (
            select file_id from public.event_images where event_id=p_event_id
            union select id from public.files where bucket_name='event_media' and split_part(storage_path,'/',1)=v_event.organizer_id::text and split_part(storage_path,'/',2)=p_event_id::text
            union select file_id from planit_private.media_claims where event_id=p_event_id
            union select file_id from public.stories where event_id=p_event_id
            union select a.file_id from public.message_attachments a join public.messages m on m.id=a.message_id
                join public.conversations c on c.id=m.conversation_id where c.event_id=p_event_id)
        union select storage_path from planit_private.media_uploads where event_id=p_event_id
        union select name from storage.objects where bucket_id='event_media'
            and split_part(name,'/',1)=v_event.organizer_id::text and split_part(name,'/',2)=p_event_id::text
        order by 1
    loop
        perform pg_advisory_xact_lock(hashtextextended('event_media/'||v_path,0));
    end loop;
    -- Lock every candidate file before checking reverse references. FK locks
    -- serialize concurrent attempts to reuse a gallery file elsewhere.
    perform 1 from public.files f where f.id in (
        select file_id from public.event_images where event_id=p_event_id
            union select id from public.files where bucket_name='event_media' and split_part(storage_path,'/',1)=v_event.organizer_id::text and split_part(storage_path,'/',2)=p_event_id::text
        union select file_id from planit_private.media_claims where event_id=p_event_id
        union select file_id from public.stories where event_id=p_event_id
        union select a.file_id from public.message_attachments a join public.messages m on m.id=a.message_id
            join public.conversations c on c.id=m.conversation_id where c.event_id=p_event_id
    ) order by f.id for update;
    select coalesce(array_agg(f.id),'{}'::uuid[]) into v_files from public.files f where f.bucket_name='event_media' and f.id in (
        select file_id from public.event_images where event_id=p_event_id
            union select id from public.files where bucket_name='event_media' and split_part(storage_path,'/',1)=v_event.organizer_id::text and split_part(storage_path,'/',2)=p_event_id::text
        union select file_id from planit_private.media_claims where event_id=p_event_id
        union select file_id from public.stories where event_id=p_event_id
        union select a.file_id from public.message_attachments a join public.messages m on m.id=a.message_id
            join public.conversations c on c.id=m.conversation_id where c.event_id=p_event_id
    ) and not exists(select 1 from public.profiles where avatar_file_id=f.id)
      and not exists(select 1 from public.event_images where file_id=f.id and event_id<>p_event_id)
      and not exists(select 1 from public.stories where file_id=f.id and event_id<>p_event_id)
      and not exists(select 1 from public.message_attachments a join public.messages m on m.id=a.message_id
        join public.conversations c on c.id=m.conversation_id where a.file_id=f.id and c.event_id is distinct from p_event_id);
    insert into planit_private.event_media_gc_jobs(event_id,bucket_name,storage_path,object_id)
    select p_event_id,'event_media',paths.storage_path,o.id from (
        select storage_path from public.files where id=any(v_files)
        union select storage_path from planit_private.media_uploads where event_id=p_event_id
        union select name from storage.objects where bucket_id='event_media'
            and split_part(name,'/',1)=v_event.organizer_id::text and split_part(name,'/',2)=p_event_id::text
    ) paths left join storage.objects o on o.bucket_id='event_media' and o.name=paths.storage_path
    where not exists(select 1 from public.files f where f.storage_path=paths.storage_path and f.bucket_name='event_media' and not(f.id=any(v_files)))
    on conflict(bucket_name,storage_path) do nothing;
    delete from planit_private.push_jobs where notification_id in (
        select id from public.notifications where event_id=p_event_id or conversation_id in(select id from public.conversations where event_id=p_event_id));
    delete from public.notifications where event_id=p_event_id or conversation_id in(select id from public.conversations where event_id=p_event_id);
    delete from public.message_attachments where message_id in(select m.id from public.messages m join public.conversations c on c.id=m.conversation_id where c.event_id=p_event_id);
    delete from public.messages where conversation_id in(select id from public.conversations where event_id=p_event_id);
    delete from public.conversations where event_id=p_event_id;
    delete from public.stories where event_id=p_event_id;
    delete from public.event_images where event_id=p_event_id;
    delete from public.event_rejoin_requests where participation_id in(select id from public.event_participations where event_id=p_event_id);
    delete from public.participation_history where participation_id in(select id from public.event_participations where event_id=p_event_id);
    delete from public.event_participations where event_id=p_event_id;
    delete from public.event_access_grants where event_id=p_event_id;
    delete from public.event_access_links where event_id=p_event_id;
    delete from planit_private.story_gc_jobs where upload_id in(select id from planit_private.media_uploads where event_id=p_event_id);
    delete from planit_private.media_claims where event_id=p_event_id;
    delete from public.files where id=any(v_files);
    delete from planit_private.media_uploads where event_id=p_event_id;
    delete from public.events where id=p_event_id;
    insert into planit_private.event_operations(operation_id,event_id,owner_id,action,payload_hash)
        values(p_operation_id,p_event_id,auth.uid(),'delete',encode(extensions.digest('[]','sha256'),'hex'));
    return p_event_id;
end;
$$;
revoke all on function public.reactivate_event(uuid,uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text),public.delete_event(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reactivate_event(uuid,uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text),public.delete_event(uuid,uuid) to authenticated;

create function public.claim_event_media_gc() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_job planit_private.event_media_gc_jobs%rowtype; v_now timestamp := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
begin
    select * into v_job from planit_private.event_media_gc_jobs where next_attempt_at<=v_now and (lease_until is null or lease_until<=v_now)
        order by next_attempt_at,id for update skip locked limit 1;
    if not found then return null; end if;
    update planit_private.event_media_gc_jobs set lease_token=gen_random_uuid(),lease_until=v_now+interval '2 minutes',attempts=attempts+1
        where id=v_job.id returning * into v_job;
    return jsonb_build_object('job_id',v_job.id,'lease_token',v_job.lease_token,'storage_path',v_job.storage_path);
end;
$$;
create function public.get_event_media_gc_target(p_job_id uuid,p_lease_token uuid) returns jsonb
language sql security definer set search_path = '' as $$
    select jsonb_build_object('job_id',j.id,'storage_path',j.storage_path) from planit_private.event_media_gc_jobs j
    where j.id=p_job_id and j.lease_token=p_lease_token and j.lease_until>(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and not exists(select 1 from public.files where bucket_name=j.bucket_name and storage_path=j.storage_path)
        and not exists(select 1 from planit_private.media_uploads where bucket_name=j.bucket_name and storage_path=j.storage_path)
        and not exists(select 1 from storage.objects where bucket_id=j.bucket_name and name=j.storage_path and id is distinct from j.object_id);
$$;
create function public.complete_event_media_gc(p_job_id uuid,p_lease_token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_job planit_private.event_media_gc_jobs%rowtype;
begin
    select * into v_job from planit_private.event_media_gc_jobs where id=p_job_id for update;
    if not found or v_job.lease_token is distinct from p_lease_token or v_job.lease_until<=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then return false; end if;
    if exists(select 1 from storage.objects where bucket_id=v_job.bucket_name and name=v_job.storage_path) then return false; end if;
    delete from planit_private.event_media_gc_jobs where id=v_job.id;
    return true;
end;
$$;
create function public.fail_event_media_gc(p_job_id uuid,p_lease_token uuid,p_error_code text) returns void
language sql security definer set search_path = '' as $$
    update planit_private.event_media_gc_jobs set lease_token=null,lease_until=null,last_error_code=p_error_code,
        next_attempt_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '1 minute'*least(attempts,60)
    where id=p_job_id and lease_token=p_lease_token;
$$;
revoke all on function public.claim_event_media_gc(),public.get_event_media_gc_target(uuid,uuid),public.complete_event_media_gc(uuid,uuid),public.fail_event_media_gc(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.claim_event_media_gc(),public.get_event_media_gc_target(uuid,uuid),public.complete_event_media_gc(uuid,uuid),public.fail_event_media_gc(uuid,uuid,text) to service_role;
commit;
