-- R1 creation + optional photos. Prepared locally; NOT applied remotely.
-- All wall-clock timestamps use Argentina time. No persistent drafts.
begin;

insert into public.categories (name, slug, description) values
    ('Música', 'musica', 'Recitales y encuentros musicales'),
    ('Arte', 'arte', 'Muestras y actividades culturales'),
    ('Deportes', 'deportes', 'Actividades deportivas'),
    ('Social', 'social', 'Encuentros con la comunidad'),
    ('Al aire libre', 'al-aire-libre', 'Planes al aire libre')
on conflict (slug) do nothing;

create table public.events (
    id uuid primary key default gen_random_uuid(),
    organizer_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
    category_id uuid not null references public.categories(id) on delete restrict,
    title text not null,
    description text not null,
    starts_at timestamp not null,
    ends_at timestamp not null,
    location_name text,
    address text not null,
    latitude double precision not null,
    longitude double precision not null,
    capacity integer not null,
    visibility text not null default 'public',
    cancelled_at timestamp,
    archived_at timestamp,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    updated_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    constraint events_title_valid check (title = btrim(title) and char_length(title) between 1 and 120),
    constraint events_description_valid check (description = btrim(description) and char_length(description) between 1 and 3000),
    constraint events_dates_valid check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at),
    constraint events_address_valid check (char_length(btrim(address)) > 0),
    constraint events_coordinates_valid check (latitude between -90 and 90 and longitude between -180 and 180),
    constraint events_capacity_valid check (capacity > 0),
    constraint events_visibility_valid check (visibility in ('public', 'unlisted')),
    constraint events_archive_valid check (archived_at is null or archived_at >= ends_at or cancelled_at is not null)
);
alter table public.events enable row level security;
create index events_organizer_idx on public.events(organizer_id);
create index events_category_start_idx on public.events(category_id, starts_at);
create index events_public_location_idx on public.events(latitude, longitude, starts_at)
    where visibility = 'public' and cancelled_at is null and archived_at is null;

create policy events_select_authenticated on public.events for select to authenticated
    using (organizer_id = (select auth.uid()) or (visibility = 'public' and cancelled_at is null and archived_at is null));
create policy events_insert_own on public.events for insert to authenticated
    with check (organizer_id = (select auth.uid()) and visibility = 'public' and cancelled_at is null and archived_at is null);
revoke all on public.events from public, anon, authenticated;
grant select on public.events to authenticated;
-- Column grants forbid clients/RPC callers from supplying identity/state/timestamps.
-- SECURITY INVOKER RPC uses the same grants and RLS as a direct valid insert.
grant insert (id, category_id, title, description, starts_at, ends_at, location_name, address, latitude, longitude, capacity)
    on public.events to authenticated;

create function planit_private.validate_new_event() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.starts_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        raise exception 'start_not_future' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.categories where id = new.category_id and is_active) then
        raise exception 'category_inactive' using errcode = 'P0001';
    end if;
    return new;
end;
$$;
create trigger events_validate_insert before insert on public.events
    for each row execute function planit_private.validate_new_event();
create trigger events_touch_updated_at before update on public.events
    for each row execute function planit_private.touch_updated_at();
revoke all on function planit_private.validate_new_event() from public, anon, authenticated;

create table public.files (
    id uuid primary key default gen_random_uuid(),
    uploaded_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
    bucket_name text not null,
    storage_path text not null,
    mime_type text not null,
    size_bytes bigint not null,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    unique (bucket_name, storage_path),
    constraint files_image_type_valid check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
    constraint files_image_size_valid check (size_bytes between 1 and 5242880),
    constraint files_event_bucket_valid check (bucket_name = 'event_media'),
    constraint files_path_valid check (split_part(storage_path, '/', 1) = uploaded_by::text)
);
alter table public.files enable row level security;
create index files_uploaded_by_idx on public.files(uploaded_by);
alter table public.profiles add constraint profiles_avatar_file_fk foreign key (avatar_file_id) references public.files(id) on delete restrict;
create index profiles_avatar_file_idx on public.profiles(avatar_file_id) where avatar_file_id is not null;

create table public.event_images (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete restrict,
    file_id uuid not null references public.files(id) on delete restrict,
    sort_order integer not null default 0,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    unique (event_id, file_id),
    unique (event_id, sort_order),
    constraint event_images_order_valid check (sort_order between 0 and 9)
);
alter table public.event_images enable row level security;
create index event_images_file_idx on public.event_images(file_id);

create policy event_images_select_visible on public.event_images for select to authenticated
    using (exists (select 1 from public.events where id = event_id));
create policy files_select_visible on public.files for select to authenticated
    using (uploaded_by = (select auth.uid()) or exists (select 1 from public.event_images where file_id = files.id));
create policy files_insert_own on public.files for insert to authenticated
    with check (uploaded_by = (select auth.uid()));
create policy event_images_insert_own on public.event_images for insert to authenticated
    with check (
        exists (select 1 from public.events where id = event_id and organizer_id = (select auth.uid()))
    );
revoke all on public.files, public.event_images from public, anon, authenticated;
grant select on public.files, public.event_images to authenticated;
grant insert (bucket_name, storage_path, mime_type, size_bytes) on public.files to authenticated;
grant insert (event_id, file_id, sort_order) on public.event_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('event_media', 'event_media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
-- Objects are immutable in R1: no UPDATE/upsert policy. Staging occurs only
-- after Publish; deleting a linked file is denied to preserve shared references.
create policy event_media_insert_own on storage.objects for insert to authenticated
    with check (bucket_id = 'event_media' and split_part(name, '/', 1) = (select auth.uid())::text);
create policy event_media_select_visible on storage.objects for select to authenticated
    using (bucket_id = 'event_media' and (
        split_part(name, '/', 1) = (select auth.uid())::text
        or exists (select 1 from public.files where bucket_name = bucket_id and storage_path = name)
    ));
create policy event_media_delete_unlinked on storage.objects for delete to authenticated
    using (bucket_id = 'event_media' and split_part(name, '/', 1) = (select auth.uid())::text
        and not exists (select 1 from public.files where bucket_name = bucket_id and storage_path = name));

-- Validate server-recorded Storage metadata even for direct Data API writes.
create function planit_private.validate_event_file() returns trigger
language plpgsql set search_path = '' as $$
begin
    if not exists (
        select 1 from storage.objects where bucket_id = new.bucket_name and name = new.storage_path
        and owner_id = (select auth.uid())::text
        and metadata ->> 'mimetype' = new.mime_type
        and (metadata ->> 'size')::bigint = new.size_bytes
    ) then
        raise exception 'invalid_image' using errcode = 'P0001';
    end if;
    return new;
end;
$$;
create trigger files_validate_insert before insert on public.files
    for each row execute function planit_private.validate_event_file();
revoke all on function planit_private.validate_event_file() from public, anon, authenticated;
-- Check file ownership in a separate trigger query: embedding files in the
-- INSERT policy would recurse through files SELECT -> event_images SELECT.
create function planit_private.validate_event_image() returns trigger
language plpgsql set search_path = '' as $$
begin
    if not exists (select 1 from public.files where id = new.file_id and uploaded_by = (select auth.uid())) then
        raise exception 'invalid_image_owner' using errcode = '42501';
    end if;
    return new;
end;
$$;
create trigger event_images_validate_insert before insert on public.event_images
    for each row execute function planit_private.validate_event_image();
revoke all on function planit_private.validate_event_image() from public, anon, authenticated;
-- Ten unique slots (0..9) enforce the limit under concurrency without count races.

create function public.create_event(
    p_id uuid, p_title text, p_description text, p_starts_at timestamp, p_ends_at timestamp,
    p_category_id uuid, p_capacity integer, p_address text, p_latitude double precision,
    p_longitude double precision, p_location_name text default null, p_image_paths text[] default '{}'
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
    if p_id is null then raise exception 'request_id_required' using errcode = '23514'; end if;
    -- Serialize retries for one publication; a lost response must not duplicate it.
    perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
    if exists (select 1 from public.events where id = p_id and organizer_id = (select auth.uid())) then return p_id; end if;
    if p_image_paths is null or cardinality(p_image_paths) > 10 then
        raise exception 'invalid_image_count' using errcode = '23514';
    end if;
    insert into public.events (id, category_id, title, description, starts_at, ends_at, location_name, address, latitude, longitude, capacity)
    values (p_id, p_category_id, btrim(p_title), btrim(p_description), p_starts_at, p_ends_at, nullif(btrim(p_location_name), ''), btrim(p_address), p_latitude, p_longitude, p_capacity)
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
revoke all on function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[]) from public, anon;
grant execute on function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[]) to authenticated;
comment on function public.create_event(uuid,text,text,timestamp,timestamp,uuid,integer,text,double precision,double precision,text,text[]) is
    'R1: atomic complete public event + up to 10 uploaded images; auth.uid identity, invoker RLS, idempotent request UUID.';

commit;
