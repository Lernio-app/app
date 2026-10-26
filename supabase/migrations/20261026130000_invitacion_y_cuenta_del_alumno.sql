-- Invitación y cuenta del alumno (ADR-0003, ADR-0004; plan v2.4, pieza de la migración antes de F4).
-- El alumno tiene una cuenta única en la plataforma. Se activa desde la invitación del profe o se
-- crea por registro propio, y queda vinculada a la ficha del alumno en cada espacio.
-- Reemplaza el link sin cuenta: `student_access`, `student_by_token` e `issue_student_link`.
-- No hay datos reales que convertir: los links que existían dejan de abrir.
-- Los menores y su consentimiento (ADR-0009, ADR-0012) son la pieza siguiente.

-- ---------------------------------------------------------------------------
-- La persona alumna
-- ---------------------------------------------------------------------------

create table public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger student_profiles_set_updated_at
  before update on public.student_profiles
  for each row execute function private.set_updated_at();

alter table public.student_profiles enable row level security;

revoke all on public.student_profiles from anon, authenticated;
-- Cada cuenta lee y edita lo suyo. El alta pasa por `ensure_student_profile` y por la invitación.
grant select on public.student_profiles to authenticated;
grant update (display_name, phone) on public.student_profiles to authenticated;

create policy student_profiles_select on public.student_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy student_profiles_update on public.student_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- El vínculo: la cuenta de la persona con su ficha en un espacio
-- ---------------------------------------------------------------------------
-- `user_id` queda vacío hasta que el alumno activa su cuenta. Una cuenta se puede vincular a varias
-- fichas (otra materia, otro profe): no hay índice único.

alter table public.students
  add column user_id uuid references auth.users (id),
  add column linked_at timestamptz,
  add constraint students_linked_ck check ((user_id is null) = (linked_at is null));

create index students_user_idx on public.students (user_id) where user_id is not null;

-- El vínculo (`user_id`, `linked_at`) lo escriben solo las funciones de la invitación: el profe no
-- puede vincular una cuenta a mano. Directo edita los datos de la ficha y la archiva.
revoke update on public.students from authenticated;
grant update (full_name, phone, email, area_id, subject_id, subject, level_id, status, archived_at)
  on public.students to authenticated;

-- El alumno vinculado lee su propia fila y su precio. No lee las notas del profe (tabla aparte, sin
-- política para él) ni al responsable de pago (`student_contacts`, solo del espacio).
create policy students_select_linked on public.students
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy price_plans_select_linked on public.price_plans
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = price_plans.student_id and s.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Invitaciones
-- ---------------------------------------------------------------------------
-- Solo se guarda el hash del token. Vence a los 7 días y se usa una vez. Sin acceso directo desde
-- el cliente: todo pasa por las funciones de abajo.

create table public.student_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((accepted_at is null) = (accepted_by is null))
);
create index student_invitations_student_idx on public.student_invitations (student_id);
create unique index student_invitations_one_pending
  on public.student_invitations (student_id) where accepted_at is null and revoked_at is null;

alter table public.student_invitations enable row level security;
revoke all on public.student_invitations from anon, authenticated;

-- Revoca la invitación pendiente y emite una nueva. Devuelve el token en claro (una sola vez).
create or replace function private.new_student_invitation(p_org_id uuid, p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  update public.student_invitations
  set revoked_at = now()
  where student_id = p_student_id and accepted_at is null and revoked_at is null;

  insert into public.student_invitations (org_id, student_id, token_hash, expires_at)
  values (
    p_org_id,
    p_student_id,
    encode(pg_catalog.sha256(convert_to(v_token, 'utf8')), 'hex'),
    now() + interval '7 days'
  );
  return v_token;
end;
$$;
revoke all on function private.new_student_invitation(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Alta de un alumno: ahora emite una invitación (la firma no cambia)
-- ---------------------------------------------------------------------------

create or replace function public.create_student(
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_area_id uuid default null,
  p_subject_id uuid default null,
  p_subject text default null,
  p_level_id uuid default null,
  p_notes text default null,
  p_payer_name text default null,
  p_payer_relation text default null,
  p_payer_phone text default null,
  p_payer_email text default null,
  p_mode text default null,
  p_amount integer default null,
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

  -- El área y la materia de la lista, o «Otra» con su nombre, los exige students_catalog_ck.
  insert into public.students
    (org_id, teacher_id, full_name, phone, email, area_id, subject_id, subject, level_id)
  values (
    v_org,
    v_user,
    btrim(p_full_name),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    p_area_id,
    p_subject_id,
    nullif(btrim(p_subject), ''),
    p_level_id
  )
  returning id into v_student;

  if nullif(btrim(p_notes), '') is not null then
    insert into public.student_notes (org_id, student_id, body)
    values (v_org, v_student, btrim(p_notes));
  end if;

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

  if p_mode is not null then
    insert into public.price_plans
      (org_id, student_id, mode, amount, lessons_per_package, billing_day, starts_on)
    values (
      v_org, v_student, p_mode, coalesce(p_amount, 0), p_lessons_per_package, p_billing_day,
      private.today_in_org_tz()
    );
  end if;

  v_token := private.new_student_invitation(v_org, v_student);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_created');

  return query select v_student, v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- Se va el link sin cuenta
-- ---------------------------------------------------------------------------

drop function public.student_by_token(text);
drop function public.issue_student_link(uuid);
drop function private.new_student_token(uuid, uuid);
drop table public.student_access;

-- ---------------------------------------------------------------------------
-- Lado del profe
-- ---------------------------------------------------------------------------

-- Genera una invitación nueva (la anterior deja de funcionar). Devuelve el token en claro.
create or replace function public.issue_student_invitation(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_student public.students;
  v_token text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.* into v_student from public.students s where s.id = p_student_id;
  if v_student.id is null or v_student.archived_at is not null
     or not private.is_org_member(v_student.org_id) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;
  if v_student.user_id is not null then
    raise exception 'already_linked' using errcode = '22023';
  end if;

  v_token := private.new_student_invitation(v_student.org_id, p_student_id);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_student.org_id, 'teacher', v_user, 'student_invitation_issued');

  return v_token;
end;
$$;

-- Deshace el vínculo: el alumno vuelve a figurar pendiente de activación y el profe puede invitarlo
-- de nuevo. La cuenta del alumno no se toca.
create or replace function public.unlink_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_student public.students;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.* into v_student from public.students s where s.id = p_student_id;
  if v_student.id is null or not private.is_org_member(v_student.org_id) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  update public.students set user_id = null, linked_at = null where id = p_student_id;

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_student.org_id, 'teacher', v_user, 'student_unlinked');
end;
$$;

-- Con qué email quedó vinculado el alumno y hasta cuándo vale su invitación pendiente.
create or replace function public.student_link_info(p_student_id uuid)
returns table (linked_email text, linked_at timestamptz, pending_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student public.students;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.* into v_student from public.students s where s.id = p_student_id;
  if v_student.id is null or not private.is_org_member(v_student.org_id) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  return query
    select
      (select u.email::text from auth.users u where u.id = v_student.user_id),
      v_student.linked_at,
      (select i.expires_at from public.student_invitations i
       where i.student_id = p_student_id and i.accepted_at is null and i.revoked_at is null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Lado del alumno
-- ---------------------------------------------------------------------------

-- Lo que ve quien abre la invitación, con o sin sesión: nombres y el estado del link.
create or replace function public.invitation_by_token(p_token text)
returns table (student_name text, teacher_name text, org_name text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.full_name,
    coalesce(tp.display_name, o.name),
    o.name,
    case
      when i.revoked_at is not null or s.archived_at is not null then 'unavailable'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at <= now() then 'expired'
      else 'valid'
    end
  from public.student_invitations i
  join public.students s on s.id = i.student_id
  join public.organizations o on o.id = i.org_id
  left join public.teacher_profiles tp on tp.org_id = i.org_id and tp.user_id = s.teacher_id
  where i.token_hash = encode(pg_catalog.sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex');
$$;

-- Activa la cuenta: quien abre la invitación queda vinculado a la ficha, sin exigir que su email
-- coincida con el cargado (ADR-0004 #1). Abrirla dos veces con la misma cuenta no hace nada.
create or replace function public.accept_student_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_invitation public.student_invitations;
  v_student public.students;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select i.* into v_invitation
  from public.student_invitations i
  where i.token_hash = encode(pg_catalog.sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex')
  for update;
  if v_invitation.id is null then
    raise exception 'invitation_not_found' using errcode = '22023';
  end if;

  select s.* into v_student from public.students s where s.id = v_invitation.student_id for update;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by = v_user and v_student.user_id = v_user then
      return v_student.id;
    end if;
    raise exception 'invitation_used' using errcode = '22023';
  end if;
  if v_invitation.revoked_at is not null or v_student.archived_at is not null then
    raise exception 'invitation_unavailable' using errcode = '22023';
  end if;
  if v_invitation.expires_at <= now() then
    raise exception 'invitation_expired' using errcode = '22023';
  end if;
  if v_student.user_id is not null then
    raise exception 'already_linked' using errcode = '22023';
  end if;

  insert into public.student_profiles (user_id, display_name)
  values (v_user, v_student.full_name)
  on conflict (user_id) do nothing;

  update public.students set user_id = v_user, linked_at = now() where id = v_student.id;
  update public.student_invitations
  set accepted_at = now(), accepted_by = v_user
  where id = v_invitation.id;

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_student.org_id, 'student', v_user, 'student_activated');

  return v_student.id;
end;
$$;

-- Registro propio: la cuenta del alumno existe aunque todavía no tenga profe. El nombre sale de lo
-- que trae el ingreso (Google) o, si no, de la primera parte del email; se edita después.
create or replace function public.ensure_student_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.student_profiles (user_id, display_name)
  select
    u.id,
    left(coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(split_part(u.email, '@', 1)), ''),
      'Alumno'
    ), 120)
  from auth.users u
  where u.id = v_user
  on conflict (user_id) do nothing;
end;
$$;

-- Los espacios a los que está vinculada la cuenta del alumno, con los nombres para mostrarlos.
create or replace function public.my_student_links()
returns table (
  student_id uuid,
  student_name text,
  teacher_name text,
  org_name text,
  archived boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.full_name,
    coalesce(tp.display_name, o.name),
    o.name,
    s.archived_at is not null
  from public.students s
  join public.organizations o on o.id = s.org_id
  left join public.teacher_profiles tp on tp.org_id = s.org_id and tp.user_id = s.teacher_id
  where s.user_id = auth.uid()
  order by s.created_at;
$$;

-- ---------------------------------------------------------------------------
-- Permisos de las funciones
-- ---------------------------------------------------------------------------

revoke all on function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint
) from public, anon;
grant execute on function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint
) to authenticated;

revoke all on function public.issue_student_invitation(uuid) from public, anon;
grant execute on function public.issue_student_invitation(uuid) to authenticated;

revoke all on function public.unlink_student(uuid) from public, anon;
grant execute on function public.unlink_student(uuid) to authenticated;

revoke all on function public.student_link_info(uuid) from public, anon;
grant execute on function public.student_link_info(uuid) to authenticated;

revoke all on function public.invitation_by_token(text) from public;
grant execute on function public.invitation_by_token(text) to anon, authenticated;

revoke all on function public.accept_student_invitation(text) from public, anon;
grant execute on function public.accept_student_invitation(text) to authenticated;

revoke all on function public.ensure_student_profile() from public, anon;
grant execute on function public.ensure_student_profile() to authenticated;

revoke all on function public.my_student_links() from public, anon;
grant execute on function public.my_student_links() to authenticated;
