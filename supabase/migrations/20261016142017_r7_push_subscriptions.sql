-- R7 block 9: Web Push subscriptions and preview preferences (owner-only RPCs, no direct client SELECT of endpoints/keys).
begin;

create table public.push_subscriptions (
    id uuid primary key,
    user_id uuid not null references public.profiles(id) on delete restrict,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    created_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    updated_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    disabled_at timestamp without time zone,
    check (length(endpoint) between 1 and 2048),
    check (endpoint ~ '^https://[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]{1,5})?/[^[:space:]#]+$' and endpoint !~ '[[:cntrl:][:space:]]'),
    check (length(p256dh) between 1 and 256 and p256dh ~ '^[A-Za-z0-9_-]+$'),
    check (length(auth) between 1 and 256 and auth ~ '^[A-Za-z0-9_-]+$'),
    check (updated_at >= created_at),
    check (disabled_at is null or disabled_at >= created_at)
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;
create index push_subscriptions_active_user on public.push_subscriptions(user_id, id) where disabled_at is null;
create index push_subscriptions_user_idx on public.push_subscriptions(user_id, created_at desc, id desc);

create table public.push_preferences (
    user_id uuid primary key references public.profiles(id) on delete restrict,
    show_previews boolean not null,
    updated_at timestamp without time zone not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')
);
alter table public.push_preferences enable row level security;
revoke all on public.push_preferences from public, anon, authenticated;

create function planit_private.decode_base64url(p_value text) returns bytea
language plpgsql immutable security invoker set search_path = '' as $$
declare
    v_padded text;
    v_bytes bytea;
    v_canonical text;
begin
    if p_value is null or p_value !~ '^[A-Za-z0-9_-]+$' or pg_catalog.length(p_value) % 4 = 1 then
        raise exception 'invalid_push_subscription' using errcode = '22023';
    end if;
    v_padded := pg_catalog.translate(p_value, '-_', '+/')
        || pg_catalog.repeat('=', (4 - pg_catalog.length(p_value) % 4) % 4);
    begin
        v_bytes := pg_catalog.decode(v_padded, 'base64');
    exception when others then
        raise exception 'invalid_push_subscription' using errcode = '22023';
    end;
    v_canonical := pg_catalog.rtrim(
        pg_catalog.translate(pg_catalog.encode(v_bytes, 'base64'), '+/' || pg_catalog.chr(10) || pg_catalog.chr(13), '-_'),
        '='
    );
    if v_canonical <> p_value then
        raise exception 'invalid_push_subscription' using errcode = '22023';
    end if;
    return v_bytes;
end;
$$;
revoke all on function planit_private.decode_base64url(text) from public, anon, authenticated;

create function planit_private.bytes_to_numeric(p_bytes bytea) returns numeric
language plpgsql immutable security invoker set search_path = '' as $$
declare
    v_acc numeric := 0;
    v_idx integer;
begin
    for v_idx in 0 .. pg_catalog.octet_length(p_bytes) - 1 loop
        v_acc := v_acc * 256 + pg_catalog.get_byte(p_bytes, v_idx);
    end loop;
    return v_acc;
end;
$$;
revoke all on function planit_private.bytes_to_numeric(bytea) from public, anon, authenticated;

create function planit_private.is_valid_p256_public_key(p_bytes bytea) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare
    v_p constant numeric := 115792089210356248762697446949407573530086143415290314195533631308867097853951;
    v_b constant numeric := 41058363725152142129326129780047268409114441015993725554835256314039467401291;
    v_x numeric;
    v_y numeric;
    v_lhs numeric;
    v_rhs numeric;
begin
    if p_bytes is null or pg_catalog.octet_length(p_bytes) <> 65 or pg_catalog.get_byte(p_bytes, 0) <> 4 then
        return false;
    end if;
    v_x := planit_private.bytes_to_numeric(pg_catalog.substr(p_bytes, 2, 32));
    v_y := planit_private.bytes_to_numeric(pg_catalog.substr(p_bytes, 34, 32));
    if v_x <= 0 or v_x >= v_p or v_y <= 0 or v_y >= v_p then
        return false;
    end if;
    v_lhs := pg_catalog.mod(v_y * v_y, v_p);
    v_rhs := pg_catalog.mod(pg_catalog.mod(pg_catalog.mod(v_x * v_x, v_p) * v_x - 3 * v_x + v_b, v_p) + v_p, v_p);
    return v_lhs = v_rhs;
end;
$$;
revoke all on function planit_private.is_valid_p256_public_key(bytea) from public, anon, authenticated;

create function planit_private.is_valid_push_endpoint(p_endpoint text) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare
    v_host text;
begin
    if p_endpoint is null
        or pg_catalog.length(p_endpoint) not between 1 and 2048
        or p_endpoint ~ '[[:cntrl:][:space:]]'
        or p_endpoint !~ '^https://[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]{1,5})?/[^[:space:]#]+$'
    then
        return false;
    end if;
    v_host := pg_catalog.lower((pg_catalog.regexp_match(p_endpoint, '^https://([^/:]+)'))[1]);
    if v_host is null
        or v_host = 'localhost'
        or v_host ~ '\.(localhost|local|internal|invalid|test|example|lan|home|arpa)$'
        or v_host ~ '^[0-9.]+$'
        or v_host ~ '(^|\.)-'
        or v_host ~ '-(\.|$)'
    then
        return false;
    end if;
    return true;
end;
$$;
revoke all on function planit_private.is_valid_push_endpoint(text) from public, anon, authenticated;

create function public.upsert_my_push_subscription(
    p_id uuid,
    p_endpoint text,
    p_p256dh text,
    p_auth text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_p256dh_bytes bytea;
    v_auth_bytes bytea;
    v_lock_a bigint;
    v_lock_b bigint;
    v_by_endpoint public.push_subscriptions%rowtype;
    v_by_id public.push_subscriptions%rowtype;
    v_now timestamp without time zone;
    v_result_id uuid;
begin
    if v_user_id is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    if p_id is null
        or not planit_private.is_valid_push_endpoint(p_endpoint)
        or p_p256dh is null or pg_catalog.length(p_p256dh) not between 1 and 256
        or p_auth is null or pg_catalog.length(p_auth) not between 1 and 256
    then
        raise exception 'invalid_push_subscription' using errcode = '22023';
    end if;

    v_p256dh_bytes := planit_private.decode_base64url(p_p256dh);
    v_auth_bytes := planit_private.decode_base64url(p_auth);
    if not planit_private.is_valid_p256_public_key(v_p256dh_bytes)
        or pg_catalog.octet_length(v_auth_bytes) <> 16
    then
        raise exception 'invalid_push_subscription' using errcode = '22023';
    end if;

    perform 1 from public.profiles p where p.id = v_user_id for key share;
    if not found then
        raise exception 'authentication_required' using errcode = '42501';
    end if;

    v_lock_a := pg_catalog.hashtextextended('push_endpoint:' || p_endpoint, 0);
    v_lock_b := pg_catalog.hashtextextended('push_id:' || p_id::text, 0);
    if v_lock_a <= v_lock_b then
        perform pg_catalog.pg_advisory_xact_lock(v_lock_a);
        if v_lock_b <> v_lock_a then
            perform pg_catalog.pg_advisory_xact_lock(v_lock_b);
        end if;
    else
        perform pg_catalog.pg_advisory_xact_lock(v_lock_b);
        perform pg_catalog.pg_advisory_xact_lock(v_lock_a);
    end if;

    select * into v_by_endpoint
    from public.push_subscriptions s
    where s.endpoint = p_endpoint
    for update;

    if v_by_endpoint.id is not null and v_by_endpoint.user_id <> v_user_id then
        raise exception 'push_subscription_unavailable' using errcode = '42501';
    end if;

    select * into v_by_id
    from public.push_subscriptions s
    where s.id = p_id
    for update;

    if v_by_id.id is not null and v_by_id.user_id <> v_user_id then
        raise exception 'push_subscription_unavailable' using errcode = '42501';
    end if;
    if v_by_id.id is not null and v_by_id.endpoint <> p_endpoint then
        raise exception 'push_subscription_conflict' using errcode = 'P0001';
    end if;

    v_now := pg_catalog.clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';

    if v_by_endpoint.id is not null then
        update public.push_subscriptions
        set p256dh = p_p256dh,
            auth = p_auth,
            updated_at = greatest(v_now, created_at),
            disabled_at = null
        where id = v_by_endpoint.id
        returning id into v_result_id;
    else
        insert into public.push_subscriptions (
            id, user_id, endpoint, p256dh, auth, created_at, updated_at, disabled_at
        ) values (
            p_id, v_user_id, p_endpoint, p_p256dh, p_auth, v_now, v_now, null
        ) returning id into v_result_id;
    end if;

    insert into public.push_preferences (user_id, show_previews, updated_at)
    values (v_user_id, true, v_now)
    on conflict (user_id) do nothing;

    return v_result_id;
end;
$$;

create function public.get_my_push_settings() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_show_previews boolean;
    v_subscriptions jsonb;
begin
    if v_user_id is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;

    select p.show_previews into v_show_previews
    from public.push_preferences p
    where p.user_id = v_user_id;

    select coalesce(
        pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'id', s.id,
                'created_at', s.created_at,
                'updated_at', s.updated_at,
                'disabled_at', s.disabled_at
            )
            order by s.created_at desc, s.id desc
        ),
        '[]'::jsonb
    ) into v_subscriptions
    from public.push_subscriptions s
    where s.user_id = v_user_id;

    return pg_catalog.jsonb_build_object(
        'show_previews', coalesce(v_show_previews, true),
        'subscriptions', v_subscriptions
    );
end;
$$;

create function public.disable_my_push_subscription(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_now timestamp without time zone;
    v_result_id uuid;
begin
    if v_user_id is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    if p_id is null then
        raise exception 'invalid_push_subscription' using errcode = '22023';
    end if;

    perform 1
    from public.push_subscriptions s
    where s.id = p_id and s.user_id = v_user_id
    for update;

    if not found then
        raise exception 'push_subscription_unavailable' using errcode = '42501';
    end if;

    v_now := pg_catalog.clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';

    update public.push_subscriptions
    set disabled_at = coalesce(disabled_at, greatest(v_now, created_at)),
        updated_at = greatest(v_now, created_at)
    where id = p_id and user_id = v_user_id
    returning id into v_result_id;

    return v_result_id;
end;
$$;

create function public.set_my_push_previews(p_show_previews boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
    v_user_id uuid := (select auth.uid());
    v_now timestamp without time zone;
    v_result boolean;
begin
    if v_user_id is null then
        raise exception 'authentication_required' using errcode = '42501';
    end if;
    if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'retry_read_committed' using errcode = '40001';
    end if;
    if p_show_previews is null then
        raise exception 'invalid_push_preferences' using errcode = '22023';
    end if;

    perform 1 from public.profiles p where p.id = v_user_id for key share;
    if not found then
        raise exception 'authentication_required' using errcode = '42501';
    end if;

    v_now := pg_catalog.clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';

    insert into public.push_preferences (user_id, show_previews, updated_at)
    values (v_user_id, p_show_previews, v_now)
    on conflict (user_id) do update
    set show_previews = excluded.show_previews,
        updated_at = excluded.updated_at
    returning show_previews into v_result;

    return v_result;
end;
$$;

revoke all on function
    public.upsert_my_push_subscription(uuid, text, text, text),
    public.get_my_push_settings(),
    public.disable_my_push_subscription(uuid),
    public.set_my_push_previews(boolean)
from public, anon, authenticated;

grant execute on function
    public.upsert_my_push_subscription(uuid, text, text, text),
    public.get_my_push_settings(),
    public.disable_my_push_subscription(uuid),
    public.set_my_push_previews(boolean)
to authenticated;

commit;
