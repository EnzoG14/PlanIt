-- Storage 1.80.2 authorizes a raw upload before S3 has produced final metadata.
-- Its caller-role INSERT probe contains mimetype/contentLength, not size/cacheControl.
-- Keep final metadata/bytes mandatory at state lookup, Edge attestation and commit.
begin;

create or replace function planit_private.can_upload_r7_media(p_path text,p_owner text,p_metadata jsonb) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_upload planit_private.media_uploads%rowtype;
begin
    if auth.uid() is null or p_owner is distinct from auth.uid()::text then return false; end if;
    select * into v_upload from planit_private.media_uploads where storage_path = p_path and user_id = auth.uid();
    if not found then return false; end if;
    perform planit_private.lock_r7_media_event(v_upload.event_id);
    select * into v_upload from planit_private.media_uploads where storage_path = p_path for update;
    perform pg_advisory_xact_lock(hashtextextended('event_media/' || p_path,0));
    if v_upload.state <> 'reserved' or jsonb_typeof(p_metadata) is distinct from 'object'
        or p_metadata->>'mimetype' is distinct from v_upload.mime_type then return false; end if;

    -- A fully populated object must still match the exact reserved size and no-store.
    if p_metadata ? 'size' or p_metadata ? 'cacheControl' then
        return coalesce(p_metadata->>'size' = v_upload.size_bytes::text
            and p_metadata->>'cacheControl' = 'no-store',false);
    end if;

    -- Only the exact raw preflight shape is accepted. A missing/incorrect length,
    -- other MIME, compression or arbitrary partial final metadata is denied.
    -- This permits staging bytes, never reading, attesting or publishing them.
    return coalesce(p_metadata->>'contentLength' = v_upload.size_bytes::text
        and p_metadata->>'contentEncoding' is null
        and (p_metadata - array['mimetype','contentLength','contentEncoding']) = '{}'::jsonb,false);
end;
$$;
revoke all on function planit_private.can_upload_r7_media(text,text,jsonb) from public,anon,authenticated;
grant execute on function planit_private.can_upload_r7_media(text,text,jsonb) to authenticated;

commit;
