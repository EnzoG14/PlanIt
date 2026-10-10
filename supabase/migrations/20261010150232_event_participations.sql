-- Block 4. Pending remote approval. All own timestamps are Argentina wall time.
begin;

create table public.event_participations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete restrict,
    user_id uuid not null references public.profiles(id) on delete restrict,
    status text not null check (status in ('confirmed', 'cancelled', 'removed')),
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    updated_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    unique (event_id, user_id)
);
alter table public.event_participations enable row level security;
revoke all on public.event_participations from public, anon, authenticated;
grant select on public.event_participations to authenticated;
create policy participations_select_own on public.event_participations for select to authenticated
    using (user_id = (select auth.uid()));
-- Unique(event_id,user_id) already indexes event_id/FK. These serve real counts and own lists.
create index participations_event_status_idx on public.event_participations(event_id, status);
create index participations_user_status_idx on public.event_participations(user_id, status);

create table public.participation_history (
    id uuid primary key default gen_random_uuid(),
    participation_id uuid not null references public.event_participations(id) on delete restrict,
    previous_status text check (previous_status in ('confirmed', 'cancelled', 'removed')),
    new_status text not null check (new_status in ('confirmed', 'cancelled', 'removed')),
    changed_by uuid not null references public.profiles(id) on delete restrict,
    reason text not null,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    check (previous_status is distinct from new_status)
);
alter table public.participation_history enable row level security;
revoke all on public.participation_history from public, anon, authenticated;
grant select on public.participation_history to authenticated;
create policy participation_history_select_own on public.participation_history for select to authenticated
    using (exists (select 1 from public.event_participations p where p.id = participation_id));
create index participation_history_participation_created_idx on public.participation_history(participation_id, created_at);
create index participation_history_changed_by_idx on public.participation_history(changed_by);

create trigger participations_touch_updated_at before update on public.event_participations
    for each row execute function planit_private.touch_updated_at();
-- One history row per actual transition, including creation; failures roll back both.
create function planit_private.record_participation_history() returns trigger
language plpgsql set search_path = '' as $$
begin
    if TG_OP = 'INSERT' or old.status is distinct from new.status then
        insert into public.participation_history(participation_id, previous_status, new_status, changed_by, reason)
        values (new.id, case when TG_OP = 'UPDATE' then old.status end, new.status, auth.uid(),
            case new.status when 'confirmed' then 'registration' when 'cancelled' then 'voluntary_leave' else 'organizer_removal' end);
    end if;
    return new;
end;
$$;
create trigger participations_record_history after insert or update of status on public.event_participations
    for each row execute function planit_private.record_participation_history();
revoke all on function planit_private.record_participation_history() from public, anon, authenticated;

-- Retain detail access for one's own historical participation after cancellation/archive.
create policy events_select_participating on public.events for select to authenticated
    using (exists (select 1 from public.event_participations p where p.event_id = events.id));

-- Definer is required to lock events without granting UPDATE, count other users'
-- confirmed rows without exposing them, and write participation/history atomically.
-- Each endpoint derives identity, checks accessibility/ownership, has an empty path,
-- no dynamic SQL and authenticated-only EXECUTE. No direct mutation grants exist.
create function public.get_event_participation_summary(p_event_id uuid)
returns table (confirmed_count bigint, capacity integer, available_spots bigint, own_status text, is_organizer boolean, event_state text)
language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    return query
    select counts.total, e.capacity, greatest(e.capacity - counts.total, 0::bigint), own.status,
        e.organizer_id = auth.uid(),
        case when e.archived_at is not null then 'archived' when e.cancelled_at is not null then 'cancelled'
            when e.ends_at <= (statement_timestamp() at time zone 'America/Argentina/Buenos_Aires') then 'ended' else 'open' end
    from public.events e
    left join public.event_participations own on own.event_id = e.id and own.user_id = auth.uid()
    cross join lateral (select count(*) as total from public.event_participations p where p.event_id = e.id and p.status = 'confirmed') counts
    where e.id = p_event_id and (e.organizer_id = auth.uid() or own.id is not null
        or (e.visibility = 'public' and e.cancelled_at is null and e.archived_at is null));
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
end;
$$;

create function public.register_for_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_event public.events%rowtype;
    v_status text;
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    -- Counts after a waited lock need a fresh snapshot. Supabase/PostgREST uses
    -- READ COMMITTED; reject frozen snapshots rather than risk oversubscription.
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    -- Always event first, participation second. Subsequent statements see committed
    -- competitors under READ COMMITTED.
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if v_event.visibility <> 'public' then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if v_event.organizer_id = v_user then raise exception 'organizer_cannot_register' using errcode = 'P0001'; end if;
    if v_event.archived_at is not null or v_event.cancelled_at is not null then raise exception 'event_cancelled' using errcode = 'P0001'; end if;
    if v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then raise exception 'event_ended' using errcode = 'P0001'; end if;
    select status into v_status from public.event_participations where event_id = p_event_id and user_id = v_user;
    if v_status = 'removed' then raise exception 'rejoin_requires_approval' using errcode = 'P0001'; end if;
    if v_status = 'confirmed' then return; end if;
    if (select count(*) from public.event_participations where event_id = p_event_id and status = 'confirmed') >= v_event.capacity then
        raise exception 'event_full' using errcode = 'P0001';
    end if;
    if v_status = 'cancelled' then
        update public.event_participations set status = 'confirmed' where event_id = p_event_id and user_id = v_user;
    else
        insert into public.event_participations(event_id, user_id, status) values (p_event_id, v_user, 'confirmed');
    end if;
end;
$$;

create function public.leave_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
    v_user uuid := auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    -- Leaving remains possible after cancellation/end/archive; only the holder changes.
    perform 1 from public.events where id = p_event_id for update;
    if not found then raise exception 'event_unavailable' using errcode = '42501'; end if;
    if not exists (select 1 from public.event_participations where event_id = p_event_id and user_id = v_user) then
        raise exception 'not_participating' using errcode = 'P0001';
    end if;
    update public.event_participations set status = 'cancelled'
        where event_id = p_event_id and user_id = v_user and status = 'confirmed';
    -- cancelled/removed retries are no-ops and never append fabricated history.
end;
$$;
revoke all on function public.register_for_event(uuid), public.leave_event(uuid), public.get_event_participation_summary(uuid) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid), public.leave_event(uuid), public.get_event_participation_summary(uuid) to authenticated;
commit;
