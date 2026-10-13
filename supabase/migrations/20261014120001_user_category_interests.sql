-- R4 block 3. Created in Git; no remote application authorized.
begin;

create table public.user_category_interests (
    user_id uuid not null references public.profiles(id) on delete restrict,
    category_id uuid not null references public.categories(id) on delete restrict,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    primary key (user_id, category_id)
);
alter table public.user_category_interests enable row level security;
revoke all on table public.user_category_interests from public, anon, authenticated;
grant select on table public.user_category_interests to authenticated;
create policy user_category_interests_select_own
    on public.user_category_interests for select to authenticated
    using ((select auth.uid()) = user_id);

-- Only this RPC can write. DEFINER is needed because REST receives SELECT only;
-- it never accepts a user_id and explicitly scopes every mutation to auth.uid().
create function public.set_my_category_interests(p_category_ids uuid[])
returns table (category_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'interests_auth_required' using errcode = '42501';
    end if;
    if p_category_ids is null or array_position(p_category_ids, null) is not null
       or cardinality(p_category_ids) <> (select count(distinct id) from unnest(p_category_ids) as ids(id)) then
        raise exception 'interests_invalid_selection' using errcode = '22023';
    end if;

    -- Serialize even an initially empty selection. Lock order: own profile,
    -- then categories ordered by id. Keep category validation stable until ACK.
    perform 1 from public.profiles where id = v_user_id for update;
    if not found then
        raise exception 'interests_profile_required' using errcode = '42501';
    end if;
    perform 1 from public.categories c where c.id = any(p_category_ids)
        order by c.id for share;
    if exists (
        select 1 from unnest(p_category_ids) as ids(id)
        left join public.categories c on c.id = ids.id
        where c.id is null or (not c.is_active and not exists (
            select 1 from public.user_category_interests i
            where i.user_id = v_user_id and i.category_id = ids.id
        ))
    ) then
        raise exception 'interests_category_unavailable' using errcode = '22023';
    end if;

    delete from public.user_category_interests i
        where i.user_id = v_user_id and not (i.category_id = any(p_category_ids));
    insert into public.user_category_interests (user_id, category_id)
        select v_user_id, ids.id from unnest(p_category_ids) as ids(id)
        on conflict on constraint user_category_interests_pkey do nothing;
    return query select i.category_id from public.user_category_interests i
        where i.user_id = v_user_id order by i.category_id;
end;
$$;
revoke all on function public.set_my_category_interests(uuid[]) from public, anon, authenticated;
grant execute on function public.set_my_category_interests(uuid[]) to authenticated;
comment on table public.user_category_interests is 'Private category preferences; inactive retained until explicitly removed.';
commit;
