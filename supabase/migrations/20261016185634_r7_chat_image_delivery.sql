-- Authorized byte delivery uses the same event-chat membership as message RPCs.
-- The private digest/path are service-only. Never grant the browser this target.
begin;
create function public.get_r7_chat_image_target(p_viewer_id uuid,p_message_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
    select jsonb_build_object('file_id',u.id,'storage_path',u.storage_path,
        'mime_type',u.mime_type,'size_bytes',u.size_bytes,'sha256',u.verified_sha256,
        'object_id',u.verified_object_id,'etag',u.verified_etag)
    from public.message_attachments a
    join public.messages m on m.id=a.message_id
    join public.conversations c on c.id=m.conversation_id and c.kind='event'
    join planit_private.media_claims cl on cl.file_id=a.file_id and cl.resource_id=m.id and cl.purpose='chat'
    join planit_private.media_uploads u on u.id=cl.upload_id and u.id=a.file_id
        and u.event_id=c.event_id and cl.event_id=c.event_id and u.purpose='chat' and u.state='published'
    join storage.objects o on o.bucket_id=u.bucket_name and o.name=u.storage_path
        and o.id=u.verified_object_id and o.metadata->>'eTag' is not distinct from u.verified_etag
    join public.events e on e.id=c.event_id
    where m.id=p_message_id and p_viewer_id is not null and u.verified_sha256 is not null
        and (e.organizer_id=p_viewer_id or exists (select 1 from public.event_participations p
            where p.event_id=e.id and p.user_id=p_viewer_id and p.status='confirmed')
            and (e.visibility='public' or exists (select 1 from public.event_access_grants g
                where g.event_id=e.id and g.user_id=p_viewer_id and g.status='active')));
$$;
revoke all on function public.get_r7_chat_image_target(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_r7_chat_image_target(uuid,uuid) to service_role;
commit;
