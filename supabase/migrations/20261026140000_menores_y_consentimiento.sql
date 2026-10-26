-- Menores y consentimiento (ADR-0009, ADR-0012; plan v2.4, última pieza antes de F4).
-- Un alumno menor de 13 años no tiene cuenta. Desde los 13 la tiene, pero la invitación llega solo
-- después de que el responsable de pago da el consentimiento, por un link y sin cuenta.
-- El consentimiento es del alumno del espacio y no autoriza un email (ADR-0012): quien abre después
-- la invitación queda vinculado, sin exigir que su email coincida.
-- No se guarda la fecha de nacimiento: el profe marca "menor" y "13 años o más".

-- ---------------------------------------------------------------------------
-- El alumno menor
-- ---------------------------------------------------------------------------

alter table public.students
  add column is_minor boolean not null default false,
  add column minor_13_plus boolean,
  add constraint students_minor_ck check (
    (is_minor and minor_13_plus is not null) or (not is_minor and minor_13_plus is null)
  );

-- El profe edita directo la marca de menor; las reglas de abajo la cuidan.
grant update (is_minor, minor_13_plus) on public.students to authenticated;

-- ---------------------------------------------------------------------------
-- Consentimientos
-- ---------------------------------------------------------------------------
-- Cada fila es un pedido al responsable de pago (con su token, del que solo se guarda el hash). Cuando
-- lo da, queda quién lo dio, cuándo, para qué alumno y con qué versión de los términos. Se puede
-- retirar y no se borra. Sin acceso directo desde el cliente: todo pasa por las funciones de abajo.

create table public.minor_consents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  contact_id uuid not null references public.student_contacts (id),
  minor_email text check (minor_email is null or char_length(minor_email) <= 200),
  token_hash text not null unique,
  expires_at timestamptz not null,
  legal_version text check (legal_version is null or legal_version ~ '^[0-9]{1,3}$'),
  given_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((given_at is null) = (legal_version is null))
);
create index minor_consents_student_idx on public.minor_consents (student_id);
-- A lo sumo un pedido vigente o consentimiento activo por alumno.
create unique index minor_consents_one_open
  on public.minor_consents (student_id) where revoked_at is null;

alter table public.minor_consents enable row level security;
revoke all on public.minor_consents from anon, authenticated;

-- ¿Tiene el alumno un consentimiento dado y no retirado?
create or replace function private.has_minor_consent(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.minor_consents c
    where c.student_id = p_student_id and c.given_at is not null and c.revoked_at is null
  );
$$;
revoke all on function private.has_minor_consent(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Marcar como menor (ADR-0012 #4)
-- ---------------------------------------------------------------------------
-- Con la cuenta vinculada no se marca ni se cambia la edad: el profe deshace el vínculo, lo marca y
-- vuelve a invitar con consentimiento. Al pasar a menor se deja sin efecto la invitación pendiente.

create or replace function private.guard_student_minor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_minor
     and (not old.is_minor or old.minor_13_plus is distinct from new.minor_13_plus) then
    if old.user_id is not null then
      raise exception 'student_linked' using errcode = '22023';
    end if;
    update public.student_invitations
    set revoked_at = now()
    where student_id = new.id and accepted_at is null and revoked_at is null;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_student_minor() from public, anon, authenticated;

create trigger students_guard_minor
  before update of is_minor, minor_13_plus on public.students
  for each row execute function private.guard_student_minor();

-- ---------------------------------------------------------------------------
-- Alta de un alumno: los menores no reciben invitación
-- ---------------------------------------------------------------------------

drop function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint
);

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
  p_billing_day smallint default null,
  p_is_minor boolean default false,
  p_minor_13_plus boolean default null
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

  -- El área y la materia de la lista, o «Otra» con su nombre, los exige students_catalog_ck; la
  -- edad del menor, students_minor_ck.
  insert into public.students
    (org_id, teacher_id, full_name, phone, email, area_id, subject_id, subject, level_id,
     is_minor, minor_13_plus)
  values (
    v_org,
    v_user,
    btrim(p_full_name),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    p_area_id,
    p_subject_id,
    nullif(btrim(p_subject), ''),
    p_level_id,
    coalesce(p_is_minor, false),
    case when coalesce(p_is_minor, false) then p_minor_13_plus end
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

  -- Un menor no recibe invitación: primero va el consentimiento del adulto (`request_minor_consent`).
  if not coalesce(p_is_minor, false) then
    v_token := private.new_student_invitation(v_org, v_student);
  end if;

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_created');

  return query select v_student, v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invitación: un menor la recibe solo con consentimiento
-- ---------------------------------------------------------------------------

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
  if v_student.is_minor then
    if not v_student.minor_13_plus then
      raise exception 'minor_under_13' using errcode = '22023';
    end if;
    if not private.has_minor_consent(p_student_id) then
      raise exception 'consent_required' using errcode = '22023';
    end if;
  end if;

  v_token := private.new_student_invitation(v_student.org_id, p_student_id);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_student.org_id, 'teacher', v_user, 'student_invitation_issued');

  return v_token;
end;
$$;

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
      when s.is_minor and not private.has_minor_consent(s.id) then 'unavailable'
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
  -- Un menor activa la cuenta solo con el consentimiento vigente de un adulto.
  if v_student.is_minor
     and (not v_student.minor_13_plus or not private.has_minor_consent(v_student.id)) then
    raise exception 'invitation_unavailable' using errcode = '22023';
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

-- ---------------------------------------------------------------------------
-- Lado del profe: pedir el consentimiento y ver cómo está
-- ---------------------------------------------------------------------------

-- Pide el consentimiento al responsable de pago. Deja sin efecto el pedido anterior y devuelve el
-- token en claro (una sola vez), para armar el link que el profe le manda.
create or replace function public.request_minor_consent(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_student public.students;
  v_contact uuid;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.* into v_student from public.students s where s.id = p_student_id;
  if v_student.id is null or v_student.archived_at is not null
     or not private.is_org_member(v_student.org_id) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;
  if not v_student.is_minor then
    raise exception 'not_minor' using errcode = '22023';
  end if;
  if not v_student.minor_13_plus then
    raise exception 'minor_under_13' using errcode = '22023';
  end if;
  if v_student.user_id is not null then
    raise exception 'already_linked' using errcode = '22023';
  end if;
  if private.has_minor_consent(p_student_id) then
    raise exception 'consent_given' using errcode = '22023';
  end if;

  select c.id into v_contact
  from public.student_contacts c
  where c.student_id = p_student_id and c.is_payer
  order by c.created_at
  limit 1;
  if v_contact is null then
    raise exception 'no_payer' using errcode = '22023';
  end if;

  update public.minor_consents set revoked_at = now()
  where student_id = p_student_id and revoked_at is null;

  insert into public.minor_consents (org_id, student_id, contact_id, token_hash, expires_at)
  values (
    v_student.org_id,
    p_student_id,
    v_contact,
    encode(pg_catalog.sha256(convert_to(v_token, 'utf8')), 'hex'),
    now() + interval '7 days'
  );

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_student.org_id, 'teacher', v_user, 'minor_consent_requested');

  return v_token;
end;
$$;

-- Cómo está el consentimiento de un alumno: none, pending, expired, given o revoked (el último pedido).
create or replace function public.student_consent_info(p_student_id uuid)
returns table (
  is_minor boolean,
  minor_13_plus boolean,
  payer_name text,
  consent_status text,
  given_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student public.students;
  v_consent public.minor_consents;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.* into v_student from public.students s where s.id = p_student_id;
  if v_student.id is null or not private.is_org_member(v_student.org_id) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  select c.* into v_consent
  from public.minor_consents c
  where c.student_id = p_student_id
  order by (c.revoked_at is null) desc, c.created_at desc
  limit 1;

  return query
    select
      v_student.is_minor,
      v_student.minor_13_plus,
      (select c.name from public.student_contacts c
       where c.student_id = p_student_id and c.is_payer order by c.created_at limit 1),
      case
        when v_consent.id is null then 'none'
        when v_consent.revoked_at is not null then 'revoked'
        when v_consent.given_at is not null then 'given'
        when v_consent.expires_at <= now() then 'expired'
        else 'pending'
      end,
      v_consent.given_at,
      v_consent.expires_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lado del responsable de pago: sin cuenta, con el link
-- ---------------------------------------------------------------------------

-- Lo que ve quien abre el link: nombres y el estado del pedido.
create or replace function public.consent_by_token(p_token text)
returns table (
  student_name text,
  teacher_name text,
  payer_name text,
  status text,
  given_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.full_name,
    coalesce(tp.display_name, o.name),
    pc.name,
    case
      when c.revoked_at is not null then 'revoked'
      when s.archived_at is not null or not s.is_minor or not coalesce(s.minor_13_plus, false)
        then 'unavailable'
      when c.given_at is not null then 'given'
      when c.expires_at <= now() then 'expired'
      else 'valid'
    end,
    c.given_at
  from public.minor_consents c
  join public.students s on s.id = c.student_id
  join public.organizations o on o.id = c.org_id
  join public.student_contacts pc on pc.id = c.contact_id
  left join public.teacher_profiles tp on tp.org_id = c.org_id and tp.user_id = s.teacher_id
  where c.token_hash = encode(pg_catalog.sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex');
$$;

-- El responsable de pago da el consentimiento: acepta los términos (queda la versión) y, si quiere,
-- deja el email del menor. Darlo dos veces no cambia nada.
create or replace function public.give_minor_consent(
  p_token text,
  p_legal_version text,
  p_minor_email text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent public.minor_consents;
  v_student public.students;
  v_email text := nullif(lower(btrim(p_minor_email)), '');
begin
  if p_legal_version is null or p_legal_version !~ '^[0-9]{1,3}$' then
    raise exception 'invalid_version' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select c.* into v_consent
  from public.minor_consents c
  where c.token_hash = encode(pg_catalog.sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex')
  for update;
  if v_consent.id is null then
    raise exception 'consent_not_found' using errcode = '22023';
  end if;

  select s.* into v_student from public.students s where s.id = v_consent.student_id;

  if v_consent.revoked_at is not null then
    raise exception 'consent_revoked' using errcode = '22023';
  end if;
  if v_consent.given_at is not null then
    return;
  end if;
  if v_student.archived_at is not null or not v_student.is_minor
     or not coalesce(v_student.minor_13_plus, false) then
    raise exception 'consent_unavailable' using errcode = '22023';
  end if;
  if v_consent.expires_at <= now() then
    raise exception 'consent_expired' using errcode = '22023';
  end if;

  update public.minor_consents
  set given_at = now(), legal_version = p_legal_version, minor_email = v_email
  where id = v_consent.id;

  insert into public.events (org_id, actor_type, name)
  values (v_consent.org_id, 'contact', 'minor_consent_given');
end;
$$;

-- El responsable de pago retira el consentimiento (o descarta el pedido) desde el mismo link. La
-- cuenta del menor deja de ver ese espacio y la invitación pendiente queda sin efecto; el profe
-- sigue trabajando con el alumno como antes de la activación.
create or replace function public.revoke_minor_consent(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent public.minor_consents;
begin
  select c.* into v_consent
  from public.minor_consents c
  where c.token_hash = encode(pg_catalog.sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex')
  for update;
  if v_consent.id is null then
    raise exception 'consent_not_found' using errcode = '22023';
  end if;
  if v_consent.revoked_at is not null then
    return;
  end if;

  update public.minor_consents set revoked_at = now() where id = v_consent.id;

  update public.student_invitations
  set revoked_at = now()
  where student_id = v_consent.student_id and accepted_at is null and revoked_at is null;

  update public.students set user_id = null, linked_at = null
  where id = v_consent.student_id and user_id is not null;

  insert into public.events (org_id, actor_type, name)
  values (v_consent.org_id, 'contact', 'minor_consent_revoked');
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos de las funciones
-- ---------------------------------------------------------------------------

revoke all on function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint, boolean, boolean
) from public, anon;
grant execute on function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint, boolean, boolean
) to authenticated;

revoke all on function public.request_minor_consent(uuid) from public, anon;
grant execute on function public.request_minor_consent(uuid) to authenticated;

revoke all on function public.student_consent_info(uuid) from public, anon;
grant execute on function public.student_consent_info(uuid) to authenticated;

revoke all on function public.consent_by_token(text) from public;
grant execute on function public.consent_by_token(text) to anon, authenticated;

revoke all on function public.give_minor_consent(text, text, text) from public;
grant execute on function public.give_minor_consent(text, text, text) to anon, authenticated;

revoke all on function public.revoke_minor_consent(text) from public;
grant execute on function public.revoke_minor_consent(text) to anon, authenticated;
