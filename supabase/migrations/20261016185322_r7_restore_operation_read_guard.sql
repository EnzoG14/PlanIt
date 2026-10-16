-- Revert the unsuccessful request-context fallback; preserve the original GET-only operation boundary.
begin;
drop policy event_media_select_visible on storage.objects;
create policy event_media_select_visible on storage.objects for select to authenticated using (
    bucket_id = 'event_media' and (
        (split_part(name,'/',1) <> 'r7' and (split_part(name,'/',1) = (select auth.uid())::text
            or exists (select 1 from public.files where bucket_name = bucket_id and storage_path = name)))
        or (split_part(name,'/',1) = 'r7' and storage.allow_only_operation('object.get_authenticated')
            and planit_private.can_read_r7_media(name))
    )
);
commit;

