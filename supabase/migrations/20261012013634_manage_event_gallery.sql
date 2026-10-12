-- R3-03. Local proposal only. Objects with a files row remain immutable and
-- retained even after unlinking, so future duplication cannot lose shared media.
begin;

alter table public.event_images drop constraint event_images_event_id_sort_order_key;
alter table public.event_images add constraint event_images_event_id_sort_order_key
    unique (event_id, sort_order) deferrable initially immediate;

create function planit_private.lock_gallery(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'read_committed_required' using errcode = '25000';
    end if;
    perform 1 from public.events where id = p_event_id and organizer_id = auth.uid() for update;
    if not found then raise exception 'not_event_organizer' using errcode = '42501'; end if;
end;
$$;
revoke all on function planit_private.lock_gallery(uuid) from public, anon, authenticated;

-- Serialize registration vs Storage deletion, including direct files INSERTs.
-- A fresh query after the advisory lock sees a registration committed while
-- DELETE was waiting; RLS cannot rely on its original statement snapshot.
create function planit_private.can_delete_event_upload(p_path text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
    if auth.uid() is null or split_part(p_path,'/',1) <> auth.uid()::text then return false; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'read_committed_required' using errcode = '25000';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('event_media/' || p_path,0));
    return not exists(select 1 from public.files where bucket_name = 'event_media' and storage_path = p_path);
end;
$$;
revoke all on function planit_private.can_delete_event_upload(text) from public,anon,authenticated;
grant execute on function planit_private.can_delete_event_upload(text) to authenticated;
drop policy event_media_delete_unlinked on storage.objects;
create policy event_media_delete_unlinked on storage.objects for delete to authenticated
    using (bucket_id = 'event_media' and planit_private.can_delete_event_upload(name));

create or replace function planit_private.validate_event_file() returns trigger
language plpgsql set search_path = '' as $$
begin
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'read_committed_required' using errcode = '25000';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('event_media/' || new.storage_path,0));
    if not exists(select 1 from storage.objects where bucket_id = new.bucket_name and name = new.storage_path
        and owner_id = auth.uid()::text and metadata ->> 'mimetype' = new.mime_type
        and (metadata ->> 'size')::bigint = new.size_bytes) then
        raise exception 'invalid_image' using errcode = 'P0001';
    end if;
    return new;
end;
$$;

-- Direct INSERTs (including create_event) participate in the same lock protocol.
create or replace function planit_private.validate_event_image() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    perform planit_private.lock_gallery(new.event_id);
    if not exists (select 1 from public.files where id = new.file_id and uploaded_by = auth.uid()) then
        raise exception 'invalid_image_owner' using errcode = '42501';
    end if;
    return new;
end;
$$;

create function public.add_event_image(p_event_id uuid, p_storage_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_file uuid; v_image uuid; v_mime text; v_size bigint; v_slot integer;
begin
    perform planit_private.lock_gallery(p_event_id);
    if p_storage_path is null or split_part(p_storage_path, '/', 1) <> auth.uid()::text
        or split_part(p_storage_path, '/', 2) <> p_event_id::text then
        raise exception 'invalid_image' using errcode = 'P0001';
    end if;
    -- Path is the idempotency key: reconcile a lost commit before checking slots.
    select i.id into v_image from public.event_images i join public.files f on f.id = i.file_id
        where i.event_id = p_event_id and f.bucket_name = 'event_media' and f.storage_path = p_storage_path;
    if found then return v_image; end if;
    select s into v_slot from generate_series(0,9) s where not exists
        (select 1 from public.event_images where event_id = p_event_id and sort_order = s) order by s limit 1;
    if v_slot is null then raise exception 'gallery_full' using errcode = 'P0001'; end if;
    perform pg_advisory_xact_lock(hashtextextended('event_media/' || p_storage_path,0));
    select metadata ->> 'mimetype', (metadata ->> 'size')::bigint into v_mime,v_size
        from storage.objects where bucket_id = 'event_media' and name = p_storage_path
        and owner_id = auth.uid()::text for update;
    if not found then raise exception 'invalid_image' using errcode = 'P0001'; end if;
    select id into v_file from public.files where bucket_name = 'event_media' and storage_path = p_storage_path;
    if v_file is null then
        insert into public.files(uploaded_by,bucket_name,storage_path,mime_type,size_bytes)
            values(auth.uid(),'event_media',p_storage_path,v_mime,v_size) returning id into v_file;
    end if;
    insert into public.event_images(event_id,file_id,sort_order) values(p_event_id,v_file,v_slot) returning id into v_image;
    return v_image;
end;
$$;

create function public.remove_event_image(p_event_id uuid, p_image_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    perform planit_private.lock_gallery(p_event_id);
    delete from public.event_images where id = p_image_id and event_id = p_event_id;
    -- IDs remain stable. File metadata and physical object deliberately retained.
    set constraints public.event_images_event_id_sort_order_key deferred;
    with ordered as (select id, row_number() over(order by sort_order,id)-1 as position
        from public.event_images where event_id = p_event_id)
    update public.event_images i set sort_order = o.position from ordered o where i.id = o.id;
    set constraints public.event_images_event_id_sort_order_key immediate;
end;
$$;

create function public.reorder_event_images(p_event_id uuid, p_image_ids uuid[], p_expected_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_ids uuid[];
begin
    perform planit_private.lock_gallery(p_event_id);
    select coalesce(array_agg(id order by sort_order,id),'{}'::uuid[]) into v_ids from public.event_images where event_id = p_event_id;
    if p_expected_ids is distinct from v_ids then raise exception 'gallery_changed' using errcode = 'P0001'; end if;
    if p_image_ids is null or cardinality(p_image_ids) <> cardinality(v_ids)
        or exists(select 1 from unnest(p_image_ids) x where x is null or not x = any(v_ids))
        or (select count(distinct x) from unnest(p_image_ids) x) <> cardinality(v_ids) then
        raise exception 'invalid_image_order' using errcode = '23514';
    end if;
    set constraints public.event_images_event_id_sort_order_key deferred;
    update public.event_images i set sort_order = o.position-1
        from unnest(p_image_ids) with ordinality o(id,position) where i.id = o.id and i.event_id = p_event_id;
    set constraints public.event_images_event_id_sort_order_key immediate;
end;
$$;

create function public.get_event_unregistered_uploads(p_event_id uuid) returns table(storage_path text)
language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null or not exists(select 1 from public.events where id = p_event_id and organizer_id = auth.uid()) then
        raise exception 'not_event_organizer' using errcode = '42501';
    end if;
    return query select o.name from storage.objects o where o.bucket_id = 'event_media'
        and split_part(o.name,'/',1) = auth.uid()::text and split_part(o.name,'/',2) = p_event_id::text
        and not exists(select 1 from public.files f where f.bucket_name = o.bucket_id and f.storage_path = o.name)
        order by o.name limit 100;
end;
$$;

revoke all on function public.add_event_image(uuid,text), public.remove_event_image(uuid,uuid),
    public.reorder_event_images(uuid,uuid[],uuid[]), public.get_event_unregistered_uploads(uuid) from public,anon,authenticated;
grant execute on function public.add_event_image(uuid,text), public.remove_event_image(uuid,uuid),
    public.reorder_event_images(uuid,uuid[],uuid[]), public.get_event_unregistered_uploads(uuid) to authenticated;

-- Preserve R1 staging before publication, but deny paths inside another event.
drop policy event_media_insert_own on storage.objects;
create policy event_media_insert_own on storage.objects for insert to authenticated with check (
    bucket_id = 'event_media' and split_part(name,'/',1) = (select auth.uid())::text
    and split_part(name,'/',2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and not exists(select 1 from public.events where id::text = split_part(name,'/',2) and organizer_id <> (select auth.uid()))
);
-- No UPDATE/DELETE grants on business tables, no object overwrite policy.
commit;
