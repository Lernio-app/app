-- F1 Alumnos: alumnos, contactos, link de acceso sin cuenta y plan de cobro.
-- Los alumnos se archivan, no se borran. El token del link nunca se guarda: solo su hash.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.students (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  teacher_id uuid not null references auth.users (id),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 200),
  subject text check (subject is null or char_length(subject) <= 60),
  level text check (level is null or char_length(level) <= 60),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  notes text check (notes is null or char_length(notes) <= 2000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_org_archived_idx on public.students (org_id, archived_at);

create table public.student_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  relation text check (relation is null or char_length(relation) <= 60),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 200),
  is_payer boolean not null default false,
  gets_reports boolean not null default false,
  created_at timestamptz not null default now()
);
create index student_contacts_student_idx on public.student_contacts (student_id);

create table public.student_access (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  token_hash text not null unique,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index student_access_one_active
  on public.student_access (student_id) where revoked_at is null;

create table public.price_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  mode text not null check (mode in ('per_lesson', 'package', 'monthly')),
  amount integer not null check (amount >= 0),
  lessons_per_package integer,
  billing_day smallint,
  starts_on date not null,
  ended_on date,
  created_at timestamptz not null default now(),
  check (mode <> 'package' or coalesce(lessons_per_package, 0) > 0),
  check (mode = 'package' or lessons_per_package is null),
  check (mode <> 'monthly' or coalesce(billing_day, 0) between 1 and 28),
  check (mode = 'monthly' or billing_day is null),
  check (ended_on is null or ended_on >= starts_on)
);
create index price_plans_student_idx on public.price_plans (student_id);
create unique index price_plans_one_current
  on public.price_plans (student_id) where ended_on is null;

create trigger students_set_updated_at
  before update on public.students
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.students enable row level security;
alter table public.student_contacts enable row level security;
alter table public.student_access enable row level security;
alter table public.price_plans enable row level security;

revoke all on public.students, public.student_contacts, public.student_access, public.price_plans
  from anon, authenticated;
-- Altas de alumnos y planes: solo por las funciones de abajo. student_access: sin acceso directo.
grant select, update on public.students to authenticated;
grant select, insert, update on public.student_contacts to authenticated;
grant select on public.price_plans to authenticated;

create policy students_select on public.students
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy students_update on public.students
  for update to authenticated
  using ((select private.is_org_member(org_id)))
  with check ((select private.is_org_member(org_id)));

create policy student_contacts_select on public.student_contacts
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy student_contacts_insert on public.student_contacts
  for insert to authenticated
  with check (
    (select private.is_org_member(org_id))
    and exists (
      select 1 from public.students s where s.id = student_id and s.org_id = student_contacts.org_id
    )
  );

create policy student_contacts_update on public.student_contacts
  for update to authenticated
  using ((select private.is_org_member(org_id)))
  with check ((select private.is_org_member(org_id)));

create policy price_plans_select on public.price_plans
  for select to authenticated
  using ((select private.is_org_member(org_id)));

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

-- Genera un token aleatorio, guarda solo su hash y lo devuelve en claro (una sola vez).
create or replace function private.new_student_token(p_org_id uuid, p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  insert into public.student_access (org_id, student_id, token_hash)
  values (
    p_org_id,
    p_student_id,
    encode(pg_catalog.sha256(convert_to(v_token, 'utf8')), 'hex')
  );
  return v_token;
end;
$$;
revoke all on function private.new_student_token(uuid, uuid) from public, anon, authenticated;

create or replace function private.today_in_org_tz()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date;
$$;
grant execute on function private.today_in_org_tz() to authenticated;

-- Alta de un alumno con su contacto pagador (opcional), su plan de cobro y su link.
create or replace function public.create_student(
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_subject text default null,
  p_level text default null,
  p_notes text default null,
  p_payer_name text default null,
  p_payer_relation text default null,
  p_payer_phone text default null,
  p_payer_email text default null,
  p_mode text default 'per_lesson',
  p_amount integer default 0,
  p_lessons_per_package integer default null,
  p_billing_day smallint default null
)
returns table (student_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_student uuid;
  v_token text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select m.org_id into v_org
  from public.memberships m
  where m.user_id = v_user
  order by m.created_at
  limit 1;
  if v_org is null then
    raise exception 'no_workspace' using errcode = '42501';
  end if;

  insert into public.students (org_id, teacher_id, full_name, phone, email, subject, level, notes)
  values (
    v_org,
    v_user,
    btrim(p_full_name),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_subject), ''),
    nullif(btrim(p_level), ''),
    nullif(btrim(p_notes), '')
  )
  returning id into v_student;

  if nullif(btrim(p_payer_name), '') is not null then
    insert into public.student_contacts
      (org_id, student_id, name, relation, phone, email, is_payer, gets_reports)
    values (
      v_org,
      v_student,
      btrim(p_payer_name),
      nullif(btrim(p_payer_relation), ''),
      nullif(btrim(p_payer_phone), ''),
      nullif(btrim(p_payer_email), ''),
      true,
      true
    );
  end if;

  insert into public.price_plans
    (org_id, student_id, mode, amount, lessons_per_package, billing_day, starts_on)
  values (
    v_org, v_student, p_mode, p_amount, p_lessons_per_package, p_billing_day,
    private.today_in_org_tz()
  );

  v_token := private.new_student_token(v_org, v_student);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_created');

  return query select v_student, v_token;
end;
$$;

-- Revoca el link vigente y emite uno nuevo. Devuelve el token en claro (una sola vez).
create or replace function public.issue_student_link(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_token text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.org_id into v_org from public.students s where s.id = p_student_id;
  if v_org is null or not private.is_org_member(v_org) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  update public.student_access
  set revoked_at = now()
  where student_id = p_student_id and revoked_at is null;

  v_token := private.new_student_token(v_org, p_student_id);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_link_issued');

  return v_token;
end;
$$;

-- Cambia el plan de cobro: cierra el vigente y abre el nuevo (queda el historial de precios).
create or replace function public.set_price_plan(
  p_student_id uuid,
  p_mode text,
  p_amount integer,
  p_lessons_per_package integer default null,
  p_billing_day smallint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_today date := private.today_in_org_tz();
  v_plan uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.org_id into v_org from public.students s where s.id = p_student_id;
  if v_org is null or not private.is_org_member(v_org) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  update public.price_plans
  set ended_on = greatest(starts_on, v_today)
  where student_id = p_student_id and ended_on is null;

  insert into public.price_plans
    (org_id, student_id, mode, amount, lessons_per_package, billing_day, starts_on)
  values (v_org, p_student_id, p_mode, p_amount, p_lessons_per_package, p_billing_day, v_today)
  returning id into v_plan;

  return v_plan;
end;
$$;

-- Lo que ve quien abre el link del alumno: solo nombres, y solo si el token está vigente.
create or replace function public.student_by_token(p_token text)
returns table (student_name text, teacher_name text, org_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_access public.student_access;
begin
  select a.* into v_access
  from public.student_access a
  where a.token_hash = encode(pg_catalog.sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex')
    and a.revoked_at is null;

  if v_access.id is null then
    return;
  end if;

  update public.student_access set last_seen_at = now() where id = v_access.id;

  return query
    select s.full_name,
           coalesce(tp.display_name, o.name),
           o.name
    from public.students s
    join public.organizations o on o.id = s.org_id
    left join public.teacher_profiles tp on tp.org_id = s.org_id and tp.user_id = s.teacher_id
    where s.id = v_access.student_id
      and s.archived_at is null;
end;
$$;

revoke all on function public.create_student(
  text, text, text, text, text, text, text, text, text, text, text, integer, integer, smallint
) from public, anon;
grant execute on function public.create_student(
  text, text, text, text, text, text, text, text, text, text, text, integer, integer, smallint
) to authenticated;

revoke all on function public.issue_student_link(uuid) from public, anon;
grant execute on function public.issue_student_link(uuid) to authenticated;

revoke all on function public.set_price_plan(uuid, text, integer, integer, smallint)
  from public, anon;
grant execute on function public.set_price_plan(uuid, text, integer, integer, smallint)
  to authenticated;

revoke all on function public.student_by_token(text) from public;
grant execute on function public.student_by_token(text) to anon, authenticated;
