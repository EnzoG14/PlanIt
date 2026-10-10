-- PlanIt v2 · primera migración real
-- Proyecto de destino: planit-v2. No ejecutar en el Supabase histórico.
-- La migración 20261010011204_create_profiles_and_categories.sql está vacía
-- y ya fue registrada; NO editarla ni reutilizar su versión.
-- Convención propia: timestamp without time zone, horario local de Argentina.

create schema if not exists planit_private;
revoke all on schema planit_private from public, anon, authenticated;

create table public.profiles (
    id uuid primary key references auth.users (id) on delete restrict,
    username text not null unique,
    display_name text not null,
    first_name text,
    last_name text,
    birth_date date,
    sex text,
    bio text,
    visibility text not null default 'public',
    avatar_file_id uuid,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    updated_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
    constraint profiles_display_name_valid check (
        display_name = btrim(display_name)
        and char_length(display_name) between 2 and 60
    ),
    constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
    constraint profiles_sex_valid check (sex is null or sex in ('female', 'male', 'other')),
    constraint profiles_visibility_valid check (visibility in ('public', 'private'))
);

comment on table public.profiles is
    'Un perfil por auth.users; los datos privados no se exponen mediante consultas públicas.';
comment on column public.profiles.avatar_file_id is
    'La FK hacia public.files(id) se agrega en la migración de multimedia.';

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text,
    is_active boolean not null default true,
    created_at timestamp not null default (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires'),
    constraint categories_name_valid check (
        name = btrim(name) and char_length(name) between 2 and 60
    ),
    constraint categories_slug_valid check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    constraint categories_description_length check (
        description is null or char_length(description) <= 500
    )
);

create unique index categories_name_lower_unique
    on public.categories (lower(name));

-- Toda tabla expuesta en public debe tener RLS desde su creación.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;

-- Acceso completo al perfil sólo para su propietario.
-- Las fichas sociales de terceros se implementarán después mediante
-- una proyección/RPC limitada; NO agregar SELECT general a profiles.
create policy profiles_select_own
    on public.profiles for select to authenticated
    using ((select auth.uid()) = id);

create policy profiles_update_own
    on public.profiles for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

-- Usuarios autenticados pueden leer el catálogo; sólo administradores
-- o migraciones podrán crear/editar/desactivar categorías.
create policy categories_select_authenticated
    on public.categories for select to authenticated
    using (true);

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (
    username, display_name, first_name, last_name,
    birth_date, sex, bio, visibility
) on table public.profiles to authenticated;

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to authenticated;

create function planit_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := clock_timestamp() at time zone 'America/Argentina/Buenos_Aires';
    return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function planit_private.touch_updated_at();

-- La fecha de nacimiento opcional nunca puede ser futura.
-- Se valida con trigger, evitando un CHECK temporal no inmutable.
create function planit_private.validate_birth_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.birth_date is not null
       and new.birth_date > (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date then
        raise exception 'birth_date must not be in the future'
            using errcode = '23514';
    end if;
    return new;
end;
$$;

create trigger profiles_validate_birth_date
before insert or update of birth_date on public.profiles
for each row execute function planit_private.validate_birth_date();

-- Registro: Supabase Auth crea automáticamente el perfil.
-- El frontend debe enviar { data: { display_name: ... } } al signUp.
-- user_metadata se usa sólo como dato de presentación, nunca para permisos.
create function planit_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_display_name text;
    v_username text;
    v_attempt integer;
begin
    v_display_name := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
    if char_length(v_display_name) not between 2 and 60 then
        raise exception 'display_name must contain between 2 and 60 characters'
            using errcode = '23514';
    end if;

    for v_attempt in 1..5 loop
        v_username := 'user_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
        begin
            insert into public.profiles (id, username, display_name)
            values (new.id, v_username, v_display_name);
            return new;
        exception when unique_violation then
            -- Reintentar sólo una colisión del username generado.
            if exists (select 1 from public.profiles where id = new.id) then
                raise;
            end if;
        end;
    end loop;

    raise exception 'could not generate a unique username after five attempts';
end;
$$;

create trigger on_planit_auth_user_created
after insert on auth.users
for each row execute function planit_private.handle_new_auth_user();

-- Evitar llamadas directas a funciones internas, especialmente SECURITY DEFINER.
revoke all on function planit_private.touch_updated_at() from public, anon, authenticated;
revoke all on function planit_private.validate_birth_date() from public, anon, authenticated;
revoke all on function planit_private.handle_new_auth_user() from public, anon, authenticated;
