begin read only;
select jsonb_build_object(
 'server_version',current_setting('server_version'),
 'body_matches_git',replace(p.prosrc,chr(13),'') = replace($expected$
declare
    v_user uuid := auth.uid();
    v_title text;
    v_rows jsonb;
    v_result jsonb;
begin
    if v_user is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    select e.title into v_title from public.events e
    where e.id = p_event_id and e.organizer_id = v_user;
    if not found then
        raise exception 'event_unavailable' using errcode = '42501';
    end if;
    if (select count(*) from (
        select 1 from public.event_participations p
        where p.event_id = p_event_id and p.status = 'confirmed' and p.user_id <> v_user
        limit 5001
    ) bounded) > 5000 then
        raise exception 'export_too_large' using errcode = '54000';
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
        'username', case when planit_private.social_blocked(profile.id) then '' else profile.username end,
        'display_name', case when planit_private.social_blocked(profile.id) then 'Perfil no disponible' else profile.display_name end,
        'status', p.status,
        'first_registered_at', (select min(h.created_at) from public.participation_history h
            where h.participation_id = p.id and h.previous_status is null and h.new_status = 'confirmed')
    ) order by p.id), '[]'::jsonb) into v_rows
    from public.event_participations p join public.profiles profile on profile.id = p.user_id
    where p.event_id = p_event_id and p.status = 'confirmed' and p.user_id <> v_user;

    v_result := jsonb_build_object('version', 1, 'event_id', p_event_id,
        'event_title', v_title,
        'as_of', statement_timestamp() at time zone 'America/Argentina/Buenos_Aires', 'rows', v_rows);
    if octet_length(convert_to(v_result::text, 'UTF8')) > 10485760 then
        raise exception 'export_too_large' using errcode = '54000';
    end if;
    return v_result;
end;
$expected$,chr(13),''),
 'stable',p.provolatile='s','security_definer',p.prosecdef,
 'search_path_empty',p.proconfig=array['search_path=""'],
 'anon_execute',has_function_privilege('anon',p.oid,'execute'),
 'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),
 'public_execute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),
 'public_tables_without_rls',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
 'migration_count',(select count(*) from supabase_migrations.schema_migrations),
 'migration_recorded',exists(select 1 from supabase_migrations.schema_migrations where version='20261015173426')
) as verification
from pg_proc p where p.oid='public.get_my_event_export_rows(uuid)'::regprocedure;
rollback;
