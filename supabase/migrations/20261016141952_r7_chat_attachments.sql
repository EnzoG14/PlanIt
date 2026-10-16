-- R7 B2: versioned event chat API. Remote application requires separate approval.
begin;

-- DEFINER is required for atomic writes to private reservations/files and the
-- social-only sender projection. No new table grants or Storage policies.
create function public.send_event_chat_message_v2(
    p_event_id uuid, p_message_id uuid, p_body text default null, p_file_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
    v_event public.events%rowtype;
    v_conversation uuid;
    v_existing public.messages%rowtype;
    v_file uuid;
    v_body text := nullif(btrim(p_body, E' \t\n\r\f\v' || U&'\0085\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'),'');
begin
    if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
    if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    -- Same order as text send and membership mutation: event -> participation.
    select * into v_event from public.events where id = p_event_id for update;
    if not found then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    if v_event.organizer_id <> auth.uid() then
        perform 1 from public.event_participations where event_id = p_event_id
            and user_id = auth.uid() and status = 'confirmed' for update;
        if not found then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    end if;
    select id into v_conversation from public.conversations where event_id = p_event_id and kind = 'event';
    if not found then raise exception 'chat_unavailable' using errcode = '42501'; end if;
    if p_message_id is null or (v_body is null and p_file_id is null)
        or char_length(v_body) > 2000 then raise exception 'invalid_message'; end if;
    select * into v_existing from public.messages where id = p_message_id;
    if found then
        select file_id into v_file from public.message_attachments where message_id = p_message_id;
        if v_existing.sender_id = auth.uid() and v_existing.conversation_id = v_conversation
            and v_existing.body is not distinct from v_body and v_file is not distinct from p_file_id then
            return p_message_id;
        end if;
        raise exception 'message_id_conflict';
    end if;
    if v_event.cancelled_at is not null or v_event.archived_at is not null
        or v_event.ends_at <= (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') then
        raise exception 'chat_read_only';
    end if;
    if p_file_id is not null then
        -- Resolve path only from the JWT-owned reservation for THIS event.
        -- Reject foreign-event files before the shared helper takes more locks.
        perform 1 from planit_private.media_uploads where id = p_file_id and user_id = auth.uid()
            and event_id = p_event_id and purpose = 'chat';
        if not found then raise exception 'media_unavailable' using errcode = '42501'; end if;
        perform planit_private.register_r7_media(p_file_id,p_message_id);
    end if;
    insert into public.messages(id,conversation_id,sender_id,body)
        values(p_message_id,v_conversation,auth.uid(),v_body);
    if p_file_id is not null then
        insert into public.message_attachments(id,message_id,file_id)
            values(gen_random_uuid(),p_message_id,p_file_id);
    end if;
    return p_message_id;
exception when unique_violation then
    -- Global UUID collisions can arise in files/claims/messages while another
    -- event send commits. Roll back the entire call, including its registration.
    raise exception 'message_id_conflict';
end;
$$;

create function public.get_event_chat_messages_v2(
    p_event_id uuid,p_before_at timestamp default null,p_before_id uuid default null
) returns table(id uuid,sender_id uuid,body text,created_at timestamp,display_name text,username text,
    attachment_id uuid,file_id uuid,bucket_name text,storage_path text,mime_type text,size_bytes bigint)
language plpgsql security definer set search_path = '' as $$
begin
    if not planit_private.can_read_event_chat(p_event_id) then
        raise exception 'chat_unavailable' using errcode = '42501';
    end if;
    if (p_before_at is null) <> (p_before_id is null) then raise exception 'invalid_cursor'; end if;
    return query select m.id,m.sender_id,m.body,m.created_at,p.display_name,p.username,
        a.id,f.id,f.bucket_name,f.storage_path,f.mime_type,f.size_bytes
        from public.messages m join public.conversations c on c.id = m.conversation_id
        join public.profiles p on p.id = m.sender_id
        left join public.message_attachments a on a.message_id = m.id
        left join public.files f on f.id = a.file_id
        where c.kind = 'event' and c.event_id = p_event_id
        and (p_before_at is null or (m.created_at,m.id) < (p_before_at,p_before_id))
        order by m.created_at desc,m.id desc limit 51;
end;
$$;
revoke all on function public.send_event_chat_message_v2(uuid,uuid,text,uuid),
    public.get_event_chat_messages_v2(uuid,timestamp,uuid) from public,anon,authenticated;
grant execute on function public.send_event_chat_message_v2(uuid,uuid,text,uuid),
    public.get_event_chat_messages_v2(uuid,timestamp,uuid) to authenticated;
commit;
