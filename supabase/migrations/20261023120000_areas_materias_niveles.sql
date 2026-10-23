-- Áreas, materias y niveles (plan v2.4, pieza 1 de la migración antes de F4).
-- Catálogo cerrado que mantiene Lernio: 4 áreas, 30 materias y los niveles de cada área.
-- El alumno y el profe dejan de llevar materia y nivel en texto libre y pasan a elegir de esa lista.
-- Reemplaza: students.level (texto), teacher_profiles.subjects y .levels (texto) y .is_public.
-- No hay datos reales que convertir: los alumnos que ya existían quedan como «Otra».

-- ---------------------------------------------------------------------------
-- Catálogo (configuración de la plataforma: sin org_id, lectura pública, sin escritura)
-- ---------------------------------------------------------------------------

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z]+$'),
  name text not null unique,
  -- Clave del token de color (no un hex): idiomas, ingreso, apoyo, musica.
  color text not null check (color in ('idiomas', 'ingreso', 'apoyo', 'musica')),
  position smallint not null unique
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null unique,
  position smallint not null unique
);

-- En qué áreas se puede enseñar cada materia (una o dos).
create table public.subject_areas (
  subject_id uuid not null references public.subjects (id) on delete cascade,
  area_id uuid not null references public.areas (id) on delete cascade,
  primary key (subject_id, area_id)
);
create index subject_areas_area_idx on public.subject_areas (area_id);

-- Los niveles son de cada área. Que el alumno sea adulto no es un nivel.
create table public.levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  position smallint not null,
  area_id uuid not null references public.areas (id) on delete cascade,
  unique (area_id, position),
  -- Permite que un alumno referencie (nivel, área) juntos y que el nivel sea del área elegida.
  unique (id, area_id)
);

alter table public.areas enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_areas enable row level security;
alter table public.levels enable row level security;

revoke all on public.areas, public.subjects, public.subject_areas, public.levels
  from anon, authenticated;
grant select on public.areas, public.subjects, public.subject_areas, public.levels
  to anon, authenticated;

create policy areas_select on public.areas for select to anon, authenticated using (true);
create policy subjects_select on public.subjects for select to anon, authenticated using (true);
create policy subject_areas_select on public.subject_areas
  for select to anon, authenticated using (true);
create policy levels_select on public.levels for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Carga inicial
-- ---------------------------------------------------------------------------

insert into public.areas (code, name, color, position) values
  ('idiomas', 'Inglés e idiomas', 'idiomas', 1),
  ('ingreso', 'Ingreso y universidad', 'ingreso', 2),
  ('apoyo', 'Apoyo escolar', 'apoyo', 3),
  ('musica', 'Música', 'musica', 4);

insert into public.subjects (code, name, position) values
  ('ingles', 'Inglés', 1),
  ('portugues', 'Portugués', 2),
  ('frances', 'Francés', 3),
  ('italiano', 'Italiano', 4),
  ('aleman', 'Alemán', 5),
  ('espanol_extranjeros', 'Español para extranjeros', 6),
  ('piano', 'Piano', 7),
  ('guitarra', 'Guitarra', 8),
  ('canto', 'Canto', 9),
  ('bateria', 'Batería', 10),
  ('violin', 'Violín', 11),
  ('lenguaje_musical', 'Lenguaje musical', 12),
  ('matematica', 'Matemática', 13),
  ('fisica', 'Física', 14),
  ('quimica', 'Química', 15),
  ('biologia', 'Biología', 16),
  ('lengua_literatura', 'Lengua y literatura', 17),
  ('comprension_redaccion', 'Comprensión de textos y redacción', 18),
  ('historia', 'Historia', 19),
  ('geografia', 'Geografía', 20),
  ('economia', 'Economía', 21),
  ('programacion', 'Programación', 22),
  ('dibujo_tecnico', 'Dibujo técnico', 23),
  ('filosofia', 'Filosofía', 24),
  ('algebra', 'Álgebra', 25),
  ('analisis_matematico', 'Análisis matemático', 26),
  ('estadistica_probabilidad', 'Estadística y probabilidad', 27),
  ('anatomia_fisiologia', 'Anatomía y fisiología', 28),
  ('contabilidad', 'Contabilidad', 29),
  ('psicologia', 'Psicología', 30);

-- Idiomas y música: un área cada una. Las 12 del medio se enseñan en Apoyo escolar o en Ingreso y
-- universidad; las últimas 6, solo en Ingreso y universidad.
insert into public.subject_areas (subject_id, area_id)
select s.id, a.id
from public.subjects s
join public.areas a on (
  (s.position between 1 and 6 and a.code = 'idiomas')
  or (s.position between 7 and 12 and a.code = 'musica')
  or (s.position between 13 and 24 and a.code in ('apoyo', 'ingreso'))
  or (s.position between 25 and 30 and a.code = 'ingreso')
);

insert into public.levels (code, name, position, area_id)
select v.code, v.name, v.position, a.id
from (values
  ('a1', 'A1', 1, 'idiomas'),
  ('a2', 'A2', 2, 'idiomas'),
  ('b1', 'B1', 3, 'idiomas'),
  ('b2', 'B2', 4, 'idiomas'),
  ('c1', 'C1', 5, 'idiomas'),
  ('c2', 'C2', 6, 'idiomas'),
  ('ingreso', 'Ingreso', 1, 'ingreso'),
  ('universidad', 'Universidad', 2, 'ingreso'),
  ('primaria', 'Primaria', 1, 'apoyo'),
  ('secundaria', 'Secundaria', 2, 'apoyo'),
  ('inicial', 'Inicial', 1, 'musica'),
  ('intermedio', 'Intermedio', 2, 'musica'),
  ('avanzado', 'Avanzado', 3, 'musica')
) as v (code, name, position, area_code)
join public.areas a on a.code = v.area_code;

-- ---------------------------------------------------------------------------
-- Alumnos: área, materia y nivel de la lista, o «Otra»
-- ---------------------------------------------------------------------------
-- Con materia de la lista: area_id y subject_id llevan valor, el nivel es opcional y `subject` es un
-- detalle libre (First, Análisis I). «Otra»: sin área, materia ni nivel, y `subject` es el nombre.

alter table public.students
  add column area_id uuid references public.areas (id),
  add column subject_id uuid references public.subjects (id),
  add column level_id uuid;

update public.students
set subject = coalesce(nullif(btrim(subject), ''), 'Otra');

alter table public.students drop column level;

alter table public.students
  add constraint students_subject_area_fk
    foreign key (subject_id, area_id) references public.subject_areas (subject_id, area_id),
  add constraint students_level_area_fk
    foreign key (level_id, area_id) references public.levels (id, area_id),
  add constraint students_catalog_ck check (
    (area_id is not null and subject_id is not null)
    or (area_id is null and subject_id is null and level_id is null and subject is not null)
  );

create index students_area_idx on public.students (area_id);

-- ---------------------------------------------------------------------------
-- Profe: materias que enseña y área principal
-- ---------------------------------------------------------------------------
-- `subject_ids` sugiere la materia al cargar alumnos y publicaciones. El área principal (color del
-- avatar) se deriva sola: la que más se repite entre sus materias y, si empatan, la de menor
-- posición. Sin materias queda vacía (gris).

alter table public.teacher_profiles
  add column subject_ids uuid[] not null default '{}',
  add column main_area_id uuid references public.areas (id),
  add column photo_path text check (photo_path is null or char_length(photo_path) <= 300);

alter table public.teacher_profiles
  drop column subjects,
  drop column levels,
  drop column is_public;

alter table public.teacher_profiles rename column public_slug to slug;

create or replace function private.sync_teacher_subjects()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.subject_ids := coalesce(
    (select array_agg(distinct s.id) from unnest(new.subject_ids) as s (id)), '{}'
  );

  if exists (
    select 1 from unnest(new.subject_ids) as s (id)
    where not exists (select 1 from public.subjects x where x.id = s.id)
  ) then
    raise exception 'unknown_subject' using errcode = '23503';
  end if;

  new.main_area_id := (
    select a.id
    from unnest(new.subject_ids) as s (id)
    join public.subject_areas sa on sa.subject_id = s.id
    join public.areas a on a.id = sa.area_id
    group by a.id, a.position
    order by count(*) desc, a.position
    limit 1
  );
  return new;
end;
$$;

revoke all on function private.sync_teacher_subjects() from public;

create trigger teacher_profiles_sync_subjects
  before insert or update on public.teacher_profiles
  for each row execute function private.sync_teacher_subjects();

-- Los perfiles que ya existían se recalculan (sin materias: área principal vacía).
update public.teacher_profiles set subject_ids = '{}';

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

drop function public.create_workspace(text, text, text[], text[], text, text, integer);

create or replace function public.create_workspace(
  p_name text,
  p_display_name text,
  p_subject_ids uuid[] default '{}',
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

  insert into public.teacher_profiles (org_id, user_id, display_name, subject_ids)
  values (v_org, v_user, btrim(p_display_name), coalesce(p_subject_ids, '{}'));

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'workspace_created');

  return v_org;
end;
$$;

revoke all on function public.create_workspace(text, text, uuid[], text, text, integer)
  from public, anon;
grant execute on function public.create_workspace(text, text, uuid[], text, text, integer)
  to authenticated;

drop function public.create_student(
  text, text, text, text, text, text, text, text, text, text, text, integer, integer, smallint
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
    (org_id, teacher_id, full_name, phone, email, area_id, subject_id, subject, level_id, notes)
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

revoke all on function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint
) from public, anon;
grant execute on function public.create_student(
  text, text, text, uuid, uuid, text, uuid, text, text, text, text, text, text, integer, integer,
  smallint
) to authenticated;
