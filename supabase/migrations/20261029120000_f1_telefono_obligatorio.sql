-- Teléfono obligatorio del alumno (ADR-0013, `app` #38 · F1-4).
-- El teléfono del alumno es obligatorio en el alta y en la edición, y se guarda en formato
-- internacional argentino (549 + área + número). Un menor alcanza con un teléfono, el suyo o el del
-- responsable de pago. El email sigue siendo opcional.
-- No se usa para vincular cuentas: es un dato de contacto y una pista de duplicados (F1-6).

-- ---------------------------------------------------------------------------
-- Normalización
-- ---------------------------------------------------------------------------
-- Misma lógica que `normalizeArPhone` en `src/lib/phone.ts`: celular argentino escrito de cualquier
-- forma -> 549 + 10 dígitos. Devuelve null si no se puede interpretar.

create or replace function private.normalize_ar_phone(p_raw text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text := regexp_replace(coalesce(p_raw, ''), '\D', '', 'g');
  v_at integer;
begin
  if v = '' then
    return null;
  end if;

  v := regexp_replace(v, '^0+', '');
  if v like '54%' then
    v := substr(v, 3);
    if v like '9%' then
      v := substr(v, 2);
    end if;
  end if;

  -- El 15 de los celulares se saca: 11 15 5555 1234 -> 11 5555 1234.
  if length(v) = 12 then
    foreach v_at in array array[2, 3, 4] loop
      if substr(v, v_at + 1, 2) = '15' then
        v := substr(v, 1, v_at) || substr(v, v_at + 3);
        exit;
      end if;
    end loop;
  end if;

  if length(v) = 10 then
    return '549' || v;
  end if;
  return null;
end;
$$;
revoke all on function private.normalize_ar_phone(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Datos de prueba que ya estaban cargados
-- ---------------------------------------------------------------------------
-- Se normalizan los que se pueden interpretar. Los que no, quedan como están (no se borra ningún
-- alumno): la ficha pide el teléfono la próxima vez que se edite.

update public.students
set phone = private.normalize_ar_phone(phone)
where phone is not null
  and private.normalize_ar_phone(phone) is not null
  and phone is distinct from private.normalize_ar_phone(phone);

update public.student_contacts
set phone = private.normalize_ar_phone(phone)
where phone is not null
  and private.normalize_ar_phone(phone) is not null
  and phone is distinct from private.normalize_ar_phone(phone);

-- ---------------------------------------------------------------------------
-- Reglas al guardar
-- ---------------------------------------------------------------------------
-- Alumno: normaliza el teléfono y lo exige a quien no es menor. En un menor la regla («al menos un
-- teléfono, el suyo o el del responsable de pago») la valida `create_student` y la ficha al editar:
-- el teléfono del responsable vive en `student_contacts` y se guarda en otro paso.
-- Solo se dispara al escribir `phone` o `is_minor`: archivar o restaurar no lo toca.

create or replace function private.guard_student_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.phone := nullif(btrim(new.phone), '');
  if new.phone is not null then
    new.phone := private.normalize_ar_phone(new.phone);
    if new.phone is null then
      raise exception 'invalid_phone' using errcode = '22023';
    end if;
  end if;
  if new.phone is null and not new.is_minor then
    raise exception 'phone_required' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_student_phone() from public, anon, authenticated;

create trigger students_guard_phone
  before insert or update of phone, is_minor on public.students
  for each row execute function private.guard_student_phone();

-- Contacto (responsable de pago): si trae teléfono, se guarda normalizado.
create or replace function private.guard_contact_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.phone := nullif(btrim(new.phone), '');
  if new.phone is not null then
    new.phone := private.normalize_ar_phone(new.phone);
    if new.phone is null then
      raise exception 'invalid_phone' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_contact_phone() from public, anon, authenticated;

create trigger student_contacts_guard_phone
  before insert or update of phone on public.student_contacts
  for each row execute function private.guard_contact_phone();

-- ---------------------------------------------------------------------------
-- Alta de un alumno: valida el teléfono antes de guardar nada (la firma no cambia)
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
  v_minor boolean := coalesce(p_is_minor, false);
  v_phone text := private.normalize_ar_phone(p_phone);
  v_has_payer boolean := nullif(btrim(p_payer_name), '') is not null;
  v_payer_phone text := private.normalize_ar_phone(p_payer_phone);
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

  -- Un teléfono escrito que no se puede interpretar es un error, no un dato vacío.
  if (nullif(btrim(p_phone), '') is not null and v_phone is null)
     or (v_has_payer and nullif(btrim(p_payer_phone), '') is not null and v_payer_phone is null) then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  -- Adulto: su teléfono. Menor: el suyo o el del responsable de pago (ADR-0013).
  if v_phone is null and (not v_minor or not v_has_payer or v_payer_phone is null) then
    raise exception 'phone_required' using errcode = '22023';
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
    v_phone,
    nullif(btrim(p_email), ''),
    p_area_id,
    p_subject_id,
    nullif(btrim(p_subject), ''),
    p_level_id,
    v_minor,
    case when v_minor then p_minor_13_plus end
  )
  returning id into v_student;

  if nullif(btrim(p_notes), '') is not null then
    insert into public.student_notes (org_id, student_id, body)
    values (v_org, v_student, btrim(p_notes));
  end if;

  if v_has_payer then
    insert into public.student_contacts
      (org_id, student_id, name, relation, phone, email, is_payer, gets_reports)
    values (
      v_org,
      v_student,
      btrim(p_payer_name),
      nullif(btrim(p_payer_relation), ''),
      v_payer_phone,
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
  if not v_minor then
    v_token := private.new_student_invitation(v_org, v_student);
  end if;

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_created');

  return query select v_student, v_token;
end;
$$;
