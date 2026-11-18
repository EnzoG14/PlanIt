-- Run as postgres on planit-v2 after applying the reminder migration and
-- publishing the profile setting. Assumes the existing pg_cron installation.
begin;

select cron.schedule(
    'planit-event-reminders',
    '* * * * *',
    $command$select planit_private.generate_event_reminders();$command$
);

commit;
