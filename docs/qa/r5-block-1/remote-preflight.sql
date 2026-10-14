begin read only;
select jsonb_build_object(
    'database', current_database(),
    'legacy_invalid_avatar_count', (select count(*) from public.profiles p join public.files f on f.id = p.avatar_file_id where f.uploaded_by <> p.id or f.bucket_name <> 'avatars'),
    'migration_count', (select count(*) from supabase_migrations.schema_migrations),
    'social_tables_existing', (select count(*) from pg_tables where schemaname = 'public' and tablename in ('user_follows','user_blocks'))
) as preflight;
rollback;
