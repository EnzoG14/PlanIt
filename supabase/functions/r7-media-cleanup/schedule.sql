-- MANUAL DEPLOY TEMPLATE. Not a migration. Do not execute without explicit
-- permission to enable the remote scheduler. Run as postgres after verifying
-- the approved project, migration, Edge deployment and private Vault entries.
-- Install pg_cron/pg_net via the approved dashboard procedure first.
-- Vault names (values are provisioned separately, never committed/logged):
--   planit_project_url      : the approved project's HTTPS base URL
--   planit_story_gc_token   : same high-entropy value as STORY_GC_WORKER_TOKEN
-- No endpoint/key value is embedded in cron.job.command.
begin;
do $$
begin
    if (select count(*) from vault.decrypted_secrets where name in ('planit_project_url','planit_story_gc_token')) <> 2 then
        raise exception 'story_gc_vault_unconfigured';
    end if;
    if exists (select 1 from cron.job where jobname='planit-r7-story-gc') then
        raise exception 'story_gc_schedule_already_exists';
    end if;
end;
$$;
select cron.schedule('planit-r7-story-gc','*/15 * * * *', $job$
    select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name='planit_project_url') || '/functions/v1/r7-media-cleanup',
        headers := jsonb_build_object('Content-Type','application/json','Authorization',
            'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='planit_story_gc_token')),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    );
$job$);
commit;
