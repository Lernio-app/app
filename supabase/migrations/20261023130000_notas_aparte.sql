-- Notas del profe aparte (plan v2.4, pieza de la migración antes de F4).
-- RLS filtra por fila y no por columna: con las notas dentro de `students` y `lessons`, el alumno
-- vinculado (F4) leería las notas privadas del profe junto con el resto de su fila (ADR-0004 #2).
-- Pasan a tablas propias, de acceso solo del espacio. Ni el alumno ni el equipo Lernio las leen.
-- Reemplaza: students.notes y lessons.private_notes. No hay datos reales que convertir.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Una nota por alumno, la que el profe escribe en su ficha.
create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null unique references public.students (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  updated_at timestamptz not null default now()
);

-- Una nota privada por clase. Las notas compartidas con el alumno siguen en `lessons.shared_notes`.
create table public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  lesson_id uuid not null unique references public.lessons (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  updated_at timestamptz not null default now()
);

create trigger student_notes_set_updated_at
  before update on public.student_notes
  for each row execute function private.set_updated_at();

create trigger lesson_notes_set_updated_at
  before update on public.lesson_notes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Solo los miembros del espacio leen y escriben. No hay política para el alumno: al sumarse la
-- lectura por vínculo en `students` y `lessons`, estas tablas siguen cerradas para él.

alter table public.student_notes enable row level security;
alter table public.lesson_notes enable row level security;

revoke all on public.student_notes, public.lesson_notes from anon, authenticated;
grant select, insert, update on public.student_notes, public.lesson_notes to authenticated;

create policy student_notes_select on public.student_notes
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy student_notes_insert on public.student_notes
  for insert to authenticated
  with check (
    (select private.is_org_member(org_id))
    and exists (
      select 1 from public.students s where s.id = student_id and s.org_id = student_notes.org_id
    )
  );

create policy student_notes_update on public.student_notes
  for update to authenticated
  using ((select private.is_org_member(org_id)))
  with check (
    (select private.is_org_member(org_id))
    and exists (
      select 1 from public.students s where s.id = student_id and s.org_id = student_notes.org_id
    )
  );

create policy lesson_notes_select on public.lesson_notes
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy lesson_notes_insert on public.lesson_notes
  for insert to authenticated
  with check (
    (select private.is_org_member(org_id))
    and exists (
      select 1 from public.lessons l where l.id = lesson_id and l.org_id = lesson_notes.org_id
    )
  );

create policy lesson_notes_update on public.lesson_notes
  for update to authenticated
  using ((select private.is_org_member(org_id)))
  with check (
    (select private.is_org_member(org_id))
    and exists (
      select 1 from public.lessons l where l.id = lesson_id and l.org_id = lesson_notes.org_id
    )
  );

-- ---------------------------------------------------------------------------
-- Se van las columnas que reemplazan
-- ---------------------------------------------------------------------------

alter table public.students drop column notes;
alter table public.lessons drop column private_notes;

-- El alta de un alumno guarda su nota en `student_notes`. La firma no cambia.
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

  v_token := private.new_student_token(v_org, v_student);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_created');

  return query select v_student, v_token;
end;
$$;
