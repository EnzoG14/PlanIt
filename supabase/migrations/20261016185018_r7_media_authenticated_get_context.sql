-- Keep the operation-aware gate and additionally recognize the exact private
-- GET context set by Storage's connection (never browser-provided parameters).
-- No grant, domain authorization, upload, signing, listing or legacy change.
begin;
alter policy event_media_select_visible on storage.objects using (
    bucket_id = 'event_media' and (
        (split_part(name,'/',1) <> 'r7' and (split_part(name,'/',1) = (select auth.uid())::text
            or exists (select 1 from public.files where bucket_name = bucket_id and storage_path = name)))
        or (split_part(name,'/',1) = 'r7'
            and (
                storage.allow_only_operation('object.get_authenticated')
                or (current_setting('request.method',true) = 'GET'
                    and current_setting('request.path',true) in (
                        '/object/event_media/' || name,
                        '/object/authenticated/event_media/' || name,
                        '/storage/v1/object/event_media/' || name,
                        '/storage/v1/object/authenticated/event_media/' || name
                    ))
            )
            and planit_private.can_read_r7_media(name))
    )
);
commit;
