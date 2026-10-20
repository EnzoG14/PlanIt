-- Run only on an authorized test database after the migration. Requires two profiles.
-- Every fixture and clear operation is rolled back, including existing inbox rows.
begin;
create temporary table clear_fixture as
select id, row_number() over (order by id) as position from public.profiles order by id limit 2;
do $$ begin
    if (select count(*) from clear_fixture) <> 2 then raise exception 'Two test profiles are required'; end if;
    if has_function_privilege('anon', 'public.clear_notifications()', 'execute') then
        raise exception 'anon must not execute clear_notifications';
    end if;
end $$;
grant select on clear_fixture to authenticated;
create temporary table clear_notice_ids(id uuid primary key, recipient_id uuid, previous_read_at timestamp);
insert into clear_notice_ids
select gen_random_uuid(), f.id, case when n % 2 = 0 then timestamp '2026-10-19 10:00:00' end
from clear_fixture f cross join generate_series(1,35) n;
grant select on clear_notice_ids to authenticated;
insert into public.notifications(id,recipient_id,type,title,read_at)
select id,recipient_id,'system','Clear inbox fixture',previous_read_at from clear_notice_ids;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from clear_fixture where position=1), true);
-- A browser cannot dismiss another recipient's rows, even by guessing their IDs.
update public.notifications set dismissed_at = timestamp '2000-01-01'
where recipient_id = (select id from clear_fixture where position=2);
select public.clear_notifications();
select public.clear_notifications(); -- idempotent
do $$ begin
    if exists(select 1 from public.get_notifications()) then raise exception 'Inbox not empty'; end if;
    if exists(select 1 from public.get_notification_changes(array(select id from clear_notice_ids))) then
        raise exception 'Cleared rows returned by reconciliation';
    end if;
    if exists(select 1 from public.notifications where recipient_id=auth.uid() and read_at is null) then
        raise exception 'Unread badge not cleared';
    end if;
end $$;
-- Dismissal cannot be undone or supplied with an arbitrary browser timestamp.
update public.notifications set dismissed_at = null where recipient_id=auth.uid();
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
    begin
        perform public.clear_notifications();
        raise exception 'Missing identity was accepted';
    exception when insufficient_privilege then null;
    end;
end $$;
reset role;
do $$ begin
    if exists(select 1 from public.notifications n join clear_notice_ids f using(id)
        where f.recipient_id=(select id from clear_fixture where position=1)
        and (n.dismissed_at is null or n.read_at is null or
            (f.previous_read_at is not null and n.read_at <> f.previous_read_at))) then
        raise exception 'Server stamps or first-read preservation failed';
    end if;
    if exists(select 1 from public.notifications n join clear_notice_ids f using(id)
        where f.recipient_id=(select id from clear_fixture where position=2) and n.dismissed_at is not null) then
        raise exception 'Another recipient was changed';
    end if;
end $$;
insert into public.notifications(recipient_id,type,title)
select id,'system','New notification after clear' from clear_fixture where position=1;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from clear_fixture where position=1), true);
do $$ begin
    if (select count(*) from public.get_notifications()) <> 1 then raise exception 'New notification hidden'; end if;
end $$;
reset role;
rollback;
