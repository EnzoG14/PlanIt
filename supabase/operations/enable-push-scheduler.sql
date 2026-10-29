-- Operational setup, separate from schema migrations. Requires explicit approval.
-- Target: planit-v2 only. Run as postgres AFTER securely provisioning Vault:
-- planit_push_worker_url = https://iepeqmvzjguwlhnecsdq.supabase.co/functions/v1/r7-push
-- planit_push_worker_token = existing PUSH_WORKER_TOKEN (do not rotate VAPID).
-- Never paste the token into this file or a logged SQL command.
begin;

do $preflight$
begin
    if (select count(*) from vault.decrypted_secrets
        where name = 'planit_push_worker_url'
          and decrypted_secret = 'https://iepeqmvzjguwlhnecsdq.supabase.co/functions/v1/r7-push') <> 1
       or (select count(*) from vault.decrypted_secrets
           where name = 'planit_push_worker_token'
             and decrypted_secret ~ '^[A-Za-z0-9_-]{43,128}$') <> 1 then
        raise exception 'push_scheduler_vault_unconfigured';
    end if;
end;
$preflight$;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Verify before enabling: net must NOT be exposed through the Data API.
-- pg_net temporarily stores Authorization in its request queue. Hosted Supabase
-- owns this table as supabase_admin; postgres cannot revoke its PUBLIC grants.
-- Direct database logins can inspect queued headers. Keep DB access restricted.
-- Do not claim that a REVOKE executed as postgres protects this managed table.

-- cron.schedule updates the existing job with this name for the same owner.
-- Run as postgres consistently, including subsequent configuration updates.
-- Historical job name retained to update the same job instead of duplicating it.
select cron.schedule('planit-push-every-minute', '10 seconds', $command$
do $dispatch$
declare
    v_url text;
    v_token text;
begin
    select decrypted_secret into strict v_url
        from vault.decrypted_secrets where name = 'planit_push_worker_url';
    select decrypted_secret into strict v_token
        from vault.decrypted_secrets where name = 'planit_push_worker_token';
    if v_url is distinct from 'https://iepeqmvzjguwlhnecsdq.supabase.co/functions/v1/r7-push'
       or v_token is null or v_token !~ '^[A-Za-z0-9_-]{43,128}$' then
        raise exception 'push_scheduler_vault_unconfigured';
    end if;
    perform net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_token),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    );
end;
$dispatch$;
$command$);

commit;
