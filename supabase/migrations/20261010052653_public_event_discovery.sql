-- PROMPT 05. Local preparation only; remote deployment requires approval.
begin;

-- Discovery is a restricted projection with the server's Argentina clock.
-- Invoker preserves events/media RLS, including denial for anonymous callers.
create function public.discover_public_events(
    p_south double precision, p_north double precision,
    p_west double precision, p_east double precision
) returns table (
    id uuid, organizer_id uuid, title text, description text,
    starts_at timestamp, ends_at timestamp, address text, location_name text,
    latitude double precision, longitude double precision, capacity integer,
    category_id uuid, visibility text, cancelled_at timestamp, archived_at timestamp,
    category_name text, image_path text
) language sql stable security invoker set search_path = '' as $$
    select e.id, e.organizer_id, e.title, e.description, e.starts_at, e.ends_at,
        e.address, e.location_name, e.latitude, e.longitude, e.capacity,
        e.category_id, e.visibility, e.cancelled_at, e.archived_at, c.name,
        (select f.storage_path from public.event_images i
         join public.files f on f.id = i.file_id
         where i.event_id = e.id order by i.sort_order limit 1)
    from public.events e join public.categories c on c.id = e.category_id
    where (select auth.uid()) is not null
        and e.visibility = 'public' and e.cancelled_at is null and e.archived_at is null
        and e.ends_at > (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires')
        and p_south between -90 and 90 and p_north between p_south and 90
        and p_west between -180 and 180 and p_east between -180 and 180
        and e.latitude between p_south and p_north
        and case when p_west <= p_east then e.longitude between p_west and p_east
                 else e.longitude >= p_west or e.longitude <= p_east end
    order by e.starts_at, e.id limit 101;
$$;
revoke all on function public.discover_public_events(double precision,double precision,double precision,double precision) from public, anon;
grant execute on function public.discover_public_events(double precision,double precision,double precision,double precision) to authenticated;
commit;
