-- Read-only catalog verification; no business writes or simulated JWTs.
select jsonb_build_object(
    'version',version(),
    'migration_applied',exists(select 1 from supabase_migrations.schema_migrations where version='20261012013634'),
    'functions',(select jsonb_agg(jsonb_build_object(
        'schema',n.nspname,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),
        'security_definer',p.prosecdef,'settings',p.proconfig,'source',p.prosrc,
        'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
        'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
        'service_role_execute',has_function_privilege('service_role',p.oid,'EXECUTE')
    ) order by n.nspname,p.proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='public' and p.proname in ('add_event_image','remove_event_image','reorder_event_images','get_event_unregistered_uploads'))
        or (n.nspname='planit_private' and p.proname in ('lock_gallery','can_delete_event_upload','validate_event_file','validate_event_image'))),
    'tables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,
        'authenticated_update',has_table_privilege('authenticated',c.oid,'UPDATE'),
        'authenticated_delete',has_table_privilege('authenticated',c.oid,'DELETE'))) from pg_class c
        where c.oid in ('public.files'::regclass,'public.event_images'::regclass)),
    'slot_constraint',(select jsonb_build_object('deferrable',condeferrable,'initially_deferred',condeferred,'definition',pg_get_constraintdef(oid))
        from pg_constraint where conrelid='public.event_images'::regclass and conname='event_images_event_id_sort_order_key'),
    'storage_policies',(select jsonb_agg(jsonb_build_object('name',policyname,'command',cmd,'roles',roles,'using',qual,'check',with_check))
        from pg_policies where schemaname='storage' and policyname like 'event_media%'),
    'missing_objects',(select count(*) from public.files f where f.bucket_name='event_media' and not exists
        (select 1 from storage.objects o where o.bucket_id=f.bucket_name and o.name=f.storage_path))
) as verification;
