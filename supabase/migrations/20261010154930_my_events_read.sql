-- Block 5: read-only own lists. Pending authorized remote deployment.
begin;

create function public.get_my_events(p_section text, p_offset integer default 0)
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
    if p_section is null or p_section not in ('organizing', 'participating')
        or p_offset is null or p_offset < 0 then
        raise exception 'invalid_list_parameters' using errcode = '22023';
    end if;
    return query
    select e.id, e.title, e.starts_at, e.ends_at, e.location_name, e.address, c.name,
        case when e.archived_at is not null then 'archived'
            when e.cancelled_at is not null then 'cancelled'
            when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended'
            else 'open' end,
        case when p_section = 'participating' then p.status else null end, photo.storage_path
    from public.events e
    join public.categories c on c.id = e.category_id
    left join public.event_participations p on p.event_id = e.id and p.user_id = (select auth.uid())
    left join lateral (
        select f.storage_path from public.event_images i
        join public.files f on f.id = i.file_id
        where i.event_id = e.id
        order by i.sort_order limit 1
    ) photo on true
    where (p_section = 'organizing' and e.organizer_id = (select auth.uid()))
       or (p_section = 'participating' and p.user_id = (select auth.uid()) and e.organizer_id <> (select auth.uid()))
    order by e.starts_at desc, e.id
    limit 31 offset p_offset;
end;
$$;
revoke all on function public.get_my_events(text, integer) from public, anon, authenticated;
grant execute on function public.get_my_events(text, integer) to authenticated;

commit;
