-- Release 2, block 1. Applied to planit-v2 as migration 20261010212819.
begin;

-- Upcoming public events are read through the existing events/media RLS. A
-- stable (starts_at, id) cursor keeps pages deterministic as categories group
-- the returned rows in the client.
create function public.get_home_events(
    p_before_starts_at timestamp default null,
    p_before_id uuid default null,
    p_limit integer default 30
) returns table (
    id uuid, organizer_id uuid, title text, description text,
    starts_at timestamp, ends_at timestamp, address text, location_name text,
    latitude double precision, longitude double precision, capacity integer,
    category_id uuid, visibility text, cancelled_at timestamp, archived_at timestamp,
    category_name text, image_path text
) language sql stable security invoker set search_path = '' as $$
    select e.id, e.organizer_id, e.title, e.description,
        e.starts_at, e.ends_at, e.address, e.location_name,
        e.latitude, e.longitude, e.capacity, e.category_id,
        e.visibility, e.cancelled_at, e.archived_at, c.name,
        (select f.storage_path
         from public.event_images i
         join public.files f on f.id = i.file_id
         where i.event_id = e.id
         order by i.sort_order
         limit 1)
    from public.events e
    join public.categories c on c.id = e.category_id
    where (select auth.uid()) is not null
        and e.visibility = 'public'
        and e.cancelled_at is null
        and e.archived_at is null
        and e.starts_at > (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and (
            (p_before_starts_at is null and p_before_id is null)
            or (p_before_starts_at is not null and p_before_id is not null
                and (e.starts_at, e.id) > (p_before_starts_at, p_before_id))
        )
    order by e.starts_at, e.id
    limit least(greatest(coalesce(p_limit, 30), 1), 100) + 1;
$$;
revoke all on function public.get_home_events(timestamp, uuid, integer) from public, anon, authenticated;
grant execute on function public.get_home_events(timestamp, uuid, integer) to authenticated;
comment on function public.get_home_events(timestamp, uuid, integer) is
    'R2-01/02/03: upcoming public events with category and first media path; invoker RLS and stable keyset pagination.';

-- Do not grant SELECT on profiles. This definer projection returns only
-- display_name and username and only after matching the caller's current
-- event visibility, organizer, or participation access.
create function public.get_event_organizer(p_event_id uuid)
returns table (display_name text, username text)
language sql stable security definer set search_path = '' as $$
    select profile.display_name, profile.username
    from public.events event
    join public.profiles profile on profile.id = event.organizer_id
    where (select auth.uid()) is not null
        and event.id = p_event_id
        and (
            event.organizer_id = (select auth.uid())
            or (event.visibility = 'public' and event.cancelled_at is null and event.archived_at is null)
            or exists (
                select 1
                from public.event_participations participation
                where participation.event_id = event.id
                    and participation.user_id = (select auth.uid())
            )
        );
$$;
revoke all on function public.get_event_organizer(uuid) from public, anon, authenticated;
grant execute on function public.get_event_organizer(uuid) to authenticated;
comment on function public.get_event_organizer(uuid) is
    'R2-01: returns only social organizer name and username to authenticated users who can read the event.';

commit;
