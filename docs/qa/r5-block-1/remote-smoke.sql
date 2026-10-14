begin read only;
select set_config('request.jwt.claim.sub','',true), set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $$
declare v_sql text; v_denied integer := 0;
begin
    foreach v_sql in array array[
        'select public.get_social_profile(''00000000-0000-0000-0000-000000000001'')',
        'select public.follow_user(''00000000-0000-0000-0000-000000000001'')',
        'select public.block_user(''00000000-0000-0000-0000-000000000001'')',
        'select public.get_or_create_direct_conversation(''00000000-0000-0000-0000-000000000001'')',
        'select public.send_direct_message(''00000000-0000-0000-0000-000000000001'',''00000000-0000-0000-0000-000000000002'',''test'')',
        'select public.set_my_avatar(null)',
        'select public.update_my_social_profile(''test_user'',''Test'',null,null,null,null,null,''public'')'
    ] loop
        begin
            execute v_sql;
            raise exception 'missing_identity_was_not_denied';
        exception when insufficient_privilege then v_denied := v_denied + 1;
        end;
    end loop;
    if v_denied <> 7 then raise exception 'unexpected_denial_count'; end if;
end;
$$;
reset role;
select jsonb_build_object(
    'smoke', 'PASS: 7 missing-identity denials under authenticated, READ ONLY',
    'migration_count', (select count(*) from supabase_migrations.schema_migrations),
    'tables_without_rls', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
    'visibility_patch_allowed', has_column_privilege('authenticated','public.profiles','visibility','UPDATE'),
    'avatar_patch_allowed', has_column_privilege('authenticated','public.profiles','avatar_file_id','UPDATE'),
    'signing_authenticated_execute', has_function_privilege('authenticated','public.get_social_avatar_for_signing(uuid,uuid)','EXECUTE'),
    'signing_anon_execute', has_function_privilege('anon','public.get_social_avatar_for_signing(uuid,uuid)','EXECUTE'),
    'signing_service_execute', has_function_privilege('service_role','public.get_social_avatar_for_signing(uuid,uuid)','EXECUTE')
) as checks;
rollback;
