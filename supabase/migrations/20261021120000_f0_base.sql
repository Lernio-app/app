-- F0 Base: organizaciones, miembros, perfil del profe y eventos, con RLS.
-- Todo cuelga de una organización. Un profe solo es una organización con un miembro.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  currency text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  payment_alias text check (payment_alias is null or char_length(payment_alias) <= 120),
  payment_link text check (payment_link is null or payment_link ~ '^https?://'),
  late_cancel_hours integer not null default 24 check (late_cancel_hours between 0 and 168),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'teacher', 'admin')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_id_idx on public.memberships (user_id);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 40),
  bio text check (bio is null or char_length(bio) <= 2000),
  subjects text[] not null default '{}',
  levels text[] not null default '{}',
  public_slug text unique check (public_slug is null or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index teacher_profiles_user_id_idx on public.teacher_profiles (user_id);

create table public.events (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  actor_type text not null check (actor_type in ('teacher', 'student', 'contact', 'system')),
  actor_id uuid,
  name text not null check (char_length(name) between 1 and 80),
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_org_created_idx on public.events (org_id, created_at desc);
create index events_name_idx on public.events (name, created_at desc);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function private.set_updated_at();

create trigger teacher_profiles_set_updated_at
  before update on public.teacher_profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers de acceso (security definer: leen memberships sin pasar por su RLS)
-- ---------------------------------------------------------------------------

create or replace function private.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = p_org_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_admin(uuid) from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.events enable row level security;

revoke all on public.organizations, public.memberships, public.teacher_profiles, public.events
  from anon, authenticated;
grant select, update on public.organizations to authenticated;
grant select on public.memberships to authenticated;
grant select, insert, update on public.teacher_profiles to authenticated;
grant select, insert on public.events to authenticated;

create policy organizations_select on public.organizations
  for select to authenticated
  using ((select private.is_org_member(id)));

create policy organizations_update on public.organizations
  for update to authenticated
  using ((select private.is_org_admin(id)))
  with check ((select private.is_org_admin(id)));

create policy memberships_select on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_org_member(org_id)));

create policy teacher_profiles_select on public.teacher_profiles
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy teacher_profiles_insert on public.teacher_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_org_member(org_id)));

create policy teacher_profiles_update on public.teacher_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select private.is_org_member(org_id)));

create policy events_select on public.events
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy events_insert on public.events
  for insert to authenticated
  with check (
    (select private.is_org_member(org_id))
    and actor_type = 'teacher'
    and actor_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Alta del espacio de trabajo
-- ---------------------------------------------------------------------------
-- Crea la organización, la membresía de dueño y el perfil del profe en una sola
-- transacción. Evita el huevo-y-gallina de las políticas: nadie es miembro de una
-- organización que todavía no existe. Un usuario tiene un solo espacio en el MVP.

create or replace function public.create_workspace(
  p_name text,
  p_display_name text,
  p_subjects text[] default '{}',
  p_levels text[] default '{}',
  p_payment_alias text default null,
  p_payment_link text default null,
  p_late_cancel_hours integer default 24
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_base text;
  v_slug text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if exists (select 1 from public.memberships where user_id = v_user) then
    raise exception 'workspace_exists' using errcode = '23505';
  end if;

  v_base := btrim(regexp_replace(
    lower(translate(btrim(p_name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')),
    '[^a-z0-9]+', '-', 'g'
  ), '-');
  if v_base = '' then
    v_base := 'espacio';
  end if;
  v_slug := v_base;
  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
  end loop;

  insert into public.organizations (name, slug, payment_alias, payment_link, late_cancel_hours)
  values (
    btrim(p_name),
    v_slug,
    nullif(btrim(p_payment_alias), ''),
    nullif(btrim(p_payment_link), ''),
    coalesce(p_late_cancel_hours, 24)
  )
  returning id into v_org;

  insert into public.memberships (org_id, user_id, role)
  values (v_org, v_user, 'owner');

  insert into public.teacher_profiles (org_id, user_id, display_name, subjects, levels)
  values (
    v_org,
    v_user,
    btrim(p_display_name),
    coalesce(p_subjects, '{}'),
    coalesce(p_levels, '{}')
  );

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'workspace_created');

  return v_org;
end;
$$;

revoke all on function public.create_workspace(text, text, text[], text[], text, text, integer)
  from public, anon;
grant execute on function public.create_workspace(text, text, text[], text[], text, text, integer)
  to authenticated;
