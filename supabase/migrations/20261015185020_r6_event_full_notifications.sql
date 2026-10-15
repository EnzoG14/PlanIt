-- R6 B6 / D07: a real confirmation that takes the last seat emits one notice.
begin;

-- Invoked inside the existing authorized RPCs (register_for_event/resolve_rejoin).
-- They acquire the event lock BEFORE writing a participation, reject frozen
-- snapshots and confirm a single row. Client participation DML remains revoked.
-- No extra DEFINER privilege, occupancy cache, backfill or global event dedupe.
create function planit_private.notify_event_full() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
    v_event public.events%rowtype;
begin
    if new.status <> 'confirmed' then return new; end if;
    if tg_op = 'UPDATE' then
        if old.status = 'confirmed' then return new; end if;
    end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;

    -- Reentrant lock: the invoking RPC already owns it. Later SQL statements
    -- see competitors committed before that lock was obtained (READ COMMITTED).
    select * into v_event from public.events where id = new.event_id for update;
    if not found or new.user_id = v_event.organizer_id
        or v_event.cancelled_at is not null or v_event.archived_at is not null
        or v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        return new;
    end if;
    if (select count(*) from public.event_participations p
        where p.event_id = new.event_id and p.status = 'confirmed'
            and p.user_id <> v_event.organizer_id) = v_event.capacity then
        insert into public.notifications(recipient_id, event_id, type, title, body)
        values (v_event.organizer_id, v_event.id, 'event_full', 'Cupo completo',
            'Tu evento alcanzó su cupo máximo de inscripciones confirmadas.');
    end if;
    -- Never swallow insert errors: participation, history, rejoin resolution and
    -- notification must commit or roll back together. A subsequent free→full
    -- transition is a new D07 episode, even for the same participant.
    return new;
end;
$$;
revoke all on function planit_private.notify_event_full() from public, anon, authenticated;

create trigger participations_notify_event_full
after insert or update of status on public.event_participations
for each row execute function planit_private.notify_event_full();

comment on function planit_private.notify_event_full() is
    'R6 D07: transactional event_full on actual last-seat confirmation through event-locked RPCs; no capacity-edit alerts or backfill.';
commit;
