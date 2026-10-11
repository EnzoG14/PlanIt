-- R3 block 1. Local verification required; remote application needs authorization.
begin;

create function public.get_my_organized_events(p_filter text default 'all', p_offset integer default 0)
returns table (
    id uuid, title text, starts_at timestamp, ends_at timestamp,
    location_name text, address text, category_name text,
    event_state text, participation_status text, image_path text
)
language plpgsql stable security invoker set search_path = '' as $$
begin
    if auth.uid() is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if p_filter is null or p_filter not in ('all', 'upcoming', 'past', 'cancelled', 'archived')
        or p_offset is null or p_offset < 0 then
        raise exception 'invalid_list_parameters' using errcode = '22023';
    end if;
    return query
    with own_events as (
        select e.*, case when e.archived_at is not null then 'archived'
            when e.cancelled_at is not null then 'cancelled'
            when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended'
            else 'open' end as state
        from public.events e
        where e.organizer_id = (select auth.uid())
    )
    select e.id, e.title, e.starts_at, e.ends_at, e.location_name, e.address, c.name,
        e.state, null::text, photo.storage_path
    from own_events e
    join public.categories c on c.id = e.category_id
    left join lateral (
        select f.storage_path from public.event_images i
        join public.files f on f.id = i.file_id
        where i.event_id = e.id
        order by i.sort_order limit 1
    ) photo on true
    where (p_filter = 'all' and e.state <> 'archived')
       or (p_filter = 'upcoming' and e.state = 'open')
       or (p_filter = 'past' and e.state = 'ended')
       or (p_filter = 'cancelled' and e.state = 'cancelled')
       or (p_filter = 'archived' and e.state = 'archived')
    order by e.starts_at desc, e.id
    limit 31 offset p_offset;
end;
$$;
revoke all on function public.get_my_organized_events(text, integer) from public, anon, authenticated;
-- Local Auth scaffolding may omit service_role; Supabase grants it by default.
do $$ begin
    if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
        revoke all on function public.get_my_organized_events(text, integer) from service_role;
    end if;
end $$;
grant execute on function public.get_my_organized_events(text, integer) to authenticated;

commit;
