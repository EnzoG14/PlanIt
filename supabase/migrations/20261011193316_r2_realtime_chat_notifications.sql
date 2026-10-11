-- Prepared only: remote application requires explicit authorization.
begin;
-- Preserve existing table grants and SELECT policies: Postgres Changes checks RLS.
do $$
begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        create publication supabase_realtime;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
        alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
        alter publication supabase_realtime add table public.notifications;
    end if;
end;
$$;
-- Batch changed IDs without rereading the inbox or exposing actor/profile data.
create or replace function public.get_notification_changes(p_ids uuid[])
returns table (id uuid, type text, title text, body text, read_at timestamp, created_at timestamp, target text)
language plpgsql stable security invoker set search_path = '' as $$
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if p_ids is null or cardinality(p_ids) > 100 then raise exception 'invalid_ids' using errcode = '22023'; end if;
    return query select n.id, n.type, n.title, n.body, n.read_at, n.created_at, public.get_notification_target(n.id)
        from public.notifications n where n.id = any(p_ids) and n.recipient_id = (select auth.uid())
        order by n.created_at desc, n.id desc;
end;
$$;
revoke all on function public.get_notification_changes(uuid[]) from public, anon, authenticated;
grant execute on function public.get_notification_changes(uuid[]) to authenticated;
create index if not exists notifications_recipient_unread_idx on public.notifications(recipient_id) where read_at is null;
commit;
