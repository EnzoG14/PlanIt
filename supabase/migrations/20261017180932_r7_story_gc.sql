-- B6: maintenance only. No cron is installed or enabled by this migration.
begin;

-- Separate lease: B4's published upload/claim integrity remains in force until
-- the final transaction. No readable row is detached before Storage succeeds.
create table planit_private.story_gc_jobs (
    upload_id uuid primary key references planit_private.media_uploads(id) on delete restrict,
    lease_token uuid,
    lease_until timestamp without time zone,
    attempts integer not null default 0 check (attempts >= 0),
    next_attempt_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    last_error_code text check (last_error_code in ('storage_error','backend_error')),
    check ((lease_token is null) = (lease_until is null))
);
alter table planit_private.story_gc_jobs enable row level security;
revoke all on planit_private.story_gc_jobs from public,anon,authenticated,service_role;
create index story_gc_ready on planit_private.story_gc_jobs(next_attempt_at,upload_id);

-- Defense in depth against cross-domain reuse and corrupt identity/path data.
-- This helper is not a client API. The guards/FKs of B1/B4 prevent new domain
-- references to published story files, including while network I/O is pending.
create function planit_private.story_gc_target(p_upload_id uuid) returns jsonb
language sql volatile security definer set search_path = '' as $$
    select jsonb_build_object('upload_id',u.id,'story_id',s.id,'storage_path',u.storage_path)
    from planit_private.media_uploads u
    join planit_private.media_claims c on c.upload_id=u.id and c.file_id=u.id
        and c.purpose='story' and c.event_id=u.event_id
    join public.stories s on s.id=c.resource_id and s.file_id=u.id
        and s.event_id=u.event_id and s.author_id=u.user_id
    join public.files f on f.id=u.id and f.bucket_name=u.bucket_name
        and f.storage_path=u.storage_path and f.uploaded_by=u.user_id
    where u.id=p_upload_id and u.purpose='story' and u.state='published'
        and u.bucket_name='event_media'
        and u.storage_path=planit_private.r7_media_path(u.user_id,u.event_id,u.attempt_id,u.purpose,u.mime_type)
        and s.expires_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and not exists (select 1 from public.event_images i where i.file_id=u.id)
        and not exists (select 1 from public.profiles p where p.avatar_file_id=u.id)
        and not exists (select 1 from public.message_attachments a where a.file_id=u.id)
        and not exists (select 1 from storage.objects o where o.bucket_id=u.bucket_name and o.name=u.storage_path
            and (o.id is distinct from u.verified_object_id or o.metadata->>'eTag' is distinct from u.verified_etag));
$$;
revoke all on function planit_private.story_gc_target(uuid) from public,anon,authenticated,service_role;

-- Claim one object just before I/O. A worker invocation processes at most 100;
-- no worker can reserve a large batch and let its last lease expire in a queue.
create function public.claim_r7_story_gc() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_job planit_private.story_gc_jobs%rowtype; v_target jsonb;
begin
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode='40001';
    end if;
    select u.id into v_id from public.stories s
    join planit_private.media_uploads u on u.id=s.file_id
    left join planit_private.story_gc_jobs j on j.upload_id=u.id
    where s.expires_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and (j.upload_id is null or (j.next_attempt_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
            and (j.lease_until is null or j.lease_until <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'))))
        and planit_private.story_gc_target(u.id) is not null
    order by s.expires_at,s.id limit 1 for update of u skip locked;
    if not found then return null; end if;
    insert into planit_private.story_gc_jobs(upload_id) values(v_id) on conflict do nothing;
    select * into v_job from planit_private.story_gc_jobs where upload_id=v_id for update;
    if v_job.lease_until > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        or v_job.next_attempt_at > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then return null; end if;
    update planit_private.story_gc_jobs set lease_token=gen_random_uuid(),
        lease_until=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')+interval '120 seconds',
        attempts=least(attempts,2147483646)+1 where upload_id=v_id returning * into v_job;
    v_target := planit_private.story_gc_target(v_id);
    return v_target || jsonb_build_object('lease_token',v_job.lease_token);
end;
$$;

-- Revalidate immediately before DELETE, using only the server's target.
create function public.get_r7_story_gc_target(p_upload_id uuid,p_lease_token uuid) returns jsonb
language sql volatile security definer set search_path = '' as $$
    select planit_private.story_gc_target(j.upload_id)
    from planit_private.story_gc_jobs j where j.upload_id=p_upload_id and j.lease_token=p_lease_token
        and j.lease_until > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires');
$$;

create function public.complete_r7_story_gc(p_upload_id uuid,p_lease_token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_target jsonb;
begin
    -- Lock upload before job consistently with claim. No event lock is needed:
    -- GC never acquires one, and never mutates the event or its membership.
    perform 1 from planit_private.media_uploads where id=p_upload_id for update;
    perform 1 from planit_private.story_gc_jobs where upload_id=p_upload_id and lease_token=p_lease_token
        and lease_until > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') for update;
    if not found then return false; end if;
    v_target := planit_private.story_gc_target(p_upload_id);
    if v_target is null then return false; end if;
    -- The API response alone is insufficient: ensure Storage metadata is gone.
    if exists (select 1 from storage.objects where bucket_id='event_media' and name=v_target->>'storage_path') then
        return false;
    end if;
    delete from public.stories where id=(v_target->>'story_id')::uuid;
    delete from planit_private.media_claims where file_id=p_upload_id;
    delete from public.files where id=p_upload_id;
    -- Existing immutable reservation is the tombstone: prevents retry/path reuse.
    update planit_private.media_uploads set state='deleted',updated_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        where id=p_upload_id;
    delete from planit_private.story_gc_jobs where upload_id=p_upload_id;
    return true;
end;
$$;

create function public.fail_r7_story_gc(p_upload_id uuid,p_lease_token uuid,p_error_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
    if p_error_code is null or p_error_code not in ('storage_error','backend_error') then
        raise exception 'invalid_error_code' using errcode='22023';
    end if;
    update planit_private.story_gc_jobs set lease_token=null,lease_until=null,last_error_code=p_error_code,
        next_attempt_at=(clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
            + make_interval(secs => least(3600,30*power(2,least(attempts,7)))::integer)
    where upload_id=p_upload_id and lease_token=p_lease_token
        and lease_until > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires');
    return found;
end;
$$;

-- DEFINER is necessary to maintain private leases and remove restricted rows.
-- Only server service_role may invoke; no user-supplied identity is accepted.
revoke all on function public.claim_r7_story_gc() from public,anon,authenticated;
revoke all on function public.get_r7_story_gc_target(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_r7_story_gc(uuid,uuid) from public,anon,authenticated;
revoke all on function public.fail_r7_story_gc(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_r7_story_gc() to service_role;
grant execute on function public.get_r7_story_gc_target(uuid,uuid) to service_role;
grant execute on function public.complete_r7_story_gc(uuid,uuid) to service_role;
grant execute on function public.fail_r7_story_gc(uuid,uuid,text) to service_role;
commit;
