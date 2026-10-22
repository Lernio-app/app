-- F2 Agenda y asistencia: clases sueltas y fijas, asistentes (individuales y grupales),
-- asistencia en un toque y cancelaciones con la regla de aviso de la organización.
-- Las clases se archivan o se cancelan, no se borran. Los cargos los genera F3 a partir de `billable`.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Horario fijo: una clase que se repite todas las semanas el mismo día y a la misma hora.
create table public.lesson_series (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  teacher_id uuid not null references auth.users (id),
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 lunes ... 7 domingo
  start_time time not null,
  duration_min integer not null check (duration_min between 5 and 480),
  starts_on date not null,
  ends_on date,
  meeting_url text check (meeting_url is null or (meeting_url ~ '^https?://' and char_length(meeting_url) <= 500)),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_series_org_idx on public.lesson_series (org_id, archived_at);

-- A quién le corresponde cada horario fijo; las clases que se generan copian esta lista.
create table public.series_students (
  series_id uuid not null references public.lesson_series (id) on delete cascade,
  student_id uuid not null references public.students (id),
  org_id uuid not null references public.organizations (id) on delete cascade,
  primary key (series_id, student_id)
);
create index series_students_student_idx on public.series_students (student_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  teacher_id uuid not null references auth.users (id),
  series_id uuid references public.lesson_series (id),
  series_date date, -- el día para el que se generó; evita regenerar una clase movida o cancelada
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  cancelled_by text check (cancelled_by in ('teacher', 'student')),
  cancelled_at timestamptz,
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 300),
  meeting_url text check (meeting_url is null or (meeting_url ~ '^https?://' and char_length(meeting_url) <= 500)),
  topic text check (topic is null or char_length(topic) <= 200),
  shared_notes text check (shared_notes is null or char_length(shared_notes) <= 2000),
  private_notes text check (private_notes is null or char_length(private_notes) <= 2000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (cancelled_by is null or status = 'cancelled'),
  unique (series_id, series_date)
);
create index lessons_org_starts_idx on public.lessons (org_id, starts_at);

create table public.lesson_attendees (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.students (id),
  org_id uuid not null references public.organizations (id) on delete cascade,
  attendance text check (attendance in ('present', 'absent', 'late', 'excused')), -- null: sin marcar
  billable boolean not null default true,
  marked_at timestamptz,
  reminded_at timestamptz,
  primary key (lesson_id, student_id)
);
create index lesson_attendees_student_idx on public.lesson_attendees (student_id);

create trigger lesson_series_set_updated_at
  before update on public.lesson_series
  for each row execute function private.set_updated_at();

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.lesson_series enable row level security;
alter table public.series_students enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_attendees enable row level security;

revoke all on public.lesson_series, public.series_students, public.lessons, public.lesson_attendees
  from anon, authenticated;
-- Las altas, movimientos, cancelaciones y asistencia pasan por las funciones de abajo.
-- Directo solo se editan los textos de la clase y la marca de recordatorio enviado.
grant select on public.lesson_series, public.series_students to authenticated;
grant select on public.lessons, public.lesson_attendees to authenticated;
grant update (topic, shared_notes, private_notes, meeting_url) on public.lessons to authenticated;
grant update (reminded_at) on public.lesson_attendees to authenticated;

create policy lesson_series_select on public.lesson_series
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy series_students_select on public.series_students
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy lessons_select on public.lessons
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy lessons_update on public.lessons
  for update to authenticated
  using ((select private.is_org_member(org_id)))
  with check ((select private.is_org_member(org_id)));

create policy lesson_attendees_select on public.lesson_attendees
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy lesson_attendees_update on public.lesson_attendees
  for update to authenticated
  using ((select private.is_org_member(org_id)))
  with check ((select private.is_org_member(org_id)));

-- ---------------------------------------------------------------------------
-- Utilidades internas
-- ---------------------------------------------------------------------------

-- Organización del usuario actual. Falla si no hay sesión o no tiene espacio.
create or replace function private.require_org()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
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

  return v_org;
end;
$$;
revoke all on function private.require_org() from public, anon, authenticated;

-- Verifica que los alumnos sean de la organización y no estén archivados. Devuelve la lista sin repetidos.
create or replace function private.check_students(p_org_id uuid, p_student_ids uuid[])
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(p_student_ids) as x;
  if cardinality(v_ids) = 0 then
    raise exception 'no_students' using errcode = '22023';
  end if;
  if (
    select count(*) from public.students s
    where s.id = any (v_ids) and s.org_id = p_org_id and s.archived_at is null
  ) <> cardinality(v_ids) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;
  return v_ids;
end;
$$;
revoke all on function private.check_students(uuid, uuid[]) from public, anon, authenticated;

-- Genera las clases de un horario fijo para las próximas 8 semanas (hora local de la organización).
-- Es idempotente: una clase ya generada, movida o cancelada no se vuelve a crear.
create or replace function private.extend_series(p_series_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series public.lesson_series;
  v_tz text;
  v_today date;
  v_horizon date;
  v_count integer;
begin
  select s.* into v_series from public.lesson_series s where s.id = p_series_id;
  if v_series.id is null or v_series.archived_at is not null then
    return 0;
  end if;

  select o.timezone into v_tz from public.organizations o where o.id = v_series.org_id;
  v_today := (now() at time zone v_tz)::date;
  v_horizon := v_today + 56;

  with days as (
    select d::date as day
    from generate_series(
      greatest(v_series.starts_on, v_today)::timestamp,
      least(coalesce(v_series.ends_on, v_horizon), v_horizon)::timestamp,
      interval '1 day'
    ) as d
    where extract(isodow from d) = v_series.weekday
  ),
  new_lessons as (
    insert into public.lessons
      (org_id, teacher_id, series_id, series_date, starts_at, ends_at, meeting_url)
    select
      v_series.org_id,
      v_series.teacher_id,
      v_series.id,
      days.day,
      (days.day + v_series.start_time) at time zone v_tz,
      (days.day + v_series.start_time) at time zone v_tz + make_interval(mins => v_series.duration_min),
      v_series.meeting_url
    from days
    on conflict (series_id, series_date) do nothing
    returning id
  ),
  new_attendees as (
    insert into public.lesson_attendees (lesson_id, student_id, org_id)
    select nl.id, ss.student_id, ss.org_id
    from new_lessons nl
    join public.series_students ss on ss.series_id = v_series.id
    join public.students st on st.id = ss.student_id and st.archived_at is null
    returning 1
  )
  select count(*) into v_count from new_lessons;

  return v_count;
end;
$$;
revoke all on function private.extend_series(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funciones públicas
-- ---------------------------------------------------------------------------

-- Clase suelta, individual o grupal. La fecha y la hora son locales de la organización.
create or replace function public.create_lesson(
  p_date date,
  p_start time,
  p_duration_min integer,
  p_student_ids uuid[],
  p_meeting_url text default null,
  p_topic text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_tz text;
  v_ids uuid[];
  v_starts timestamptz;
  v_lesson uuid;
begin
  v_ids := private.check_students(v_org, p_student_ids);
  select o.timezone into v_tz from public.organizations o where o.id = v_org;
  v_starts := (p_date + p_start) at time zone v_tz;

  insert into public.lessons (org_id, teacher_id, starts_at, ends_at, meeting_url, topic)
  values (
    v_org,
    v_user,
    v_starts,
    v_starts + make_interval(mins => p_duration_min),
    nullif(btrim(p_meeting_url), ''),
    nullif(btrim(p_topic), '')
  )
  returning id into v_lesson;

  insert into public.lesson_attendees (lesson_id, student_id, org_id)
  select v_lesson, x, v_org from unnest(v_ids) as x;

  insert into public.events (org_id, actor_type, actor_id, name, props)
  values (v_org, 'teacher', v_user, 'lesson_created', jsonb_build_object('attendees', cardinality(v_ids)));

  return v_lesson;
end;
$$;

-- Horario fijo: crea la serie y sus clases de las próximas 8 semanas.
create or replace function public.create_lesson_series(
  p_weekday smallint,
  p_start time,
  p_duration_min integer,
  p_student_ids uuid[],
  p_starts_on date,
  p_ends_on date default null,
  p_meeting_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_ids uuid[];
  v_series uuid;
begin
  v_ids := private.check_students(v_org, p_student_ids);
  if p_ends_on is not null and p_ends_on < p_starts_on then
    raise exception 'invalid_range' using errcode = '22023';
  end if;

  insert into public.lesson_series
    (org_id, teacher_id, weekday, start_time, duration_min, starts_on, ends_on, meeting_url)
  values (
    v_org, v_user, p_weekday, p_start, p_duration_min, p_starts_on, p_ends_on,
    nullif(btrim(p_meeting_url), '')
  )
  returning id into v_series;

  insert into public.series_students (series_id, student_id, org_id)
  select v_series, x, v_org from unnest(v_ids) as x;

  perform private.extend_series(v_series);

  insert into public.events (org_id, actor_type, actor_id, name, props)
  values (v_org, 'teacher', v_user, 'lesson_series_created', jsonb_build_object('attendees', cardinality(v_ids)));

  return v_series;
end;
$$;

-- Completa las próximas 8 semanas de todos los horarios fijos vigentes. Se llama al abrir la agenda.
create or replace function public.extend_lesson_series()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_tz text;
  v_today date;
  v_series uuid;
  v_total integer := 0;
begin
  select o.timezone into v_tz from public.organizations o where o.id = v_org;
  v_today := (now() at time zone v_tz)::date;

  for v_series in
    select s.id from public.lesson_series s
    where s.org_id = v_org
      and s.archived_at is null
      and (s.ends_on is null or s.ends_on >= v_today)
  loop
    v_total := v_total + private.extend_series(v_series);
  end loop;

  return v_total;
end;
$$;

-- Termina un horario fijo desde hoy: archiva las clases futuras sin asistencia marcada.
create or replace function public.end_lesson_series(p_series_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_tz text;
  v_today date;
begin
  if not exists (
    select 1 from public.lesson_series s
    where s.id = p_series_id and s.org_id = v_org and s.archived_at is null
  ) then
    raise exception 'series_not_found' using errcode = '42501';
  end if;

  select o.timezone into v_tz from public.organizations o where o.id = v_org;
  v_today := (now() at time zone v_tz)::date;

  update public.lesson_series
  set archived_at = now(), ends_on = v_today - 1
  where id = p_series_id;

  update public.lessons l
  set archived_at = now()
  where l.series_id = p_series_id
    and l.series_date >= v_today
    and l.archived_at is null
    and not exists (
      select 1 from public.lesson_attendees a
      where a.lesson_id = l.id and a.attendance is not null
    );

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'lesson_series_ended');
end;
$$;

-- Mueve una clase a otro día u horario. Si viene de un horario fijo, solo se mueve esa.
create or replace function public.move_lesson(
  p_lesson_id uuid,
  p_date date,
  p_start time,
  p_duration_min integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_lesson public.lessons;
  v_tz text;
  v_starts timestamptz;
  v_minutes integer;
begin
  select l.* into v_lesson
  from public.lessons l
  where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null
  for update;
  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;
  if v_lesson.status = 'cancelled' then
    raise exception 'lesson_cancelled' using errcode = '22023';
  end if;

  select o.timezone into v_tz from public.organizations o where o.id = v_org;
  v_starts := (p_date + p_start) at time zone v_tz;
  v_minutes := coalesce(
    p_duration_min,
    (extract(epoch from (v_lesson.ends_at - v_lesson.starts_at)) / 60)::integer
  );

  update public.lessons
  set starts_at = v_starts, ends_at = v_starts + make_interval(mins => v_minutes)
  where id = p_lesson_id;

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'lesson_moved');
end;
$$;

-- Cancela una clase. Si la cancela el profe no se cobra. Si la cancela el alumno, se cobra solo si
-- avisó con menos horas que la regla de la organización (late_cancel_hours).
create or replace function public.cancel_lesson(
  p_lesson_id uuid,
  p_by text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_lesson public.lessons;
  v_late boolean;
begin
  if p_by not in ('teacher', 'student') then
    raise exception 'invalid_cancelled_by' using errcode = '22023';
  end if;

  select l.* into v_lesson
  from public.lessons l
  where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null
  for update;
  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;
  if v_lesson.status = 'cancelled' then
    raise exception 'lesson_cancelled' using errcode = '22023';
  end if;

  select (v_lesson.starts_at - now()) < make_interval(hours => o.late_cancel_hours)
  into v_late
  from public.organizations o
  where o.id = v_org;

  update public.lessons
  set status = 'cancelled',
      cancelled_by = p_by,
      cancelled_at = now(),
      cancel_reason = nullif(btrim(p_reason), '')
  where id = p_lesson_id;

  update public.lesson_attendees
  set billable = (p_by = 'student' and coalesce(v_late, false))
  where lesson_id = p_lesson_id;

  insert into public.events (org_id, actor_type, actor_id, name, props)
  values (v_org, 'teacher', v_user, 'lesson_cancelled', jsonb_build_object('by', p_by));
end;
$$;

-- Deshace una cancelación: la clase vuelve a estar programada y se cobra como siempre.
create or replace function public.restore_lesson(p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
begin
  update public.lessons
  set status = 'scheduled', cancelled_by = null, cancelled_at = null, cancel_reason = null
  where id = p_lesson_id and org_id = v_org and archived_at is null and status = 'cancelled';
  if not found then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;

  update public.lesson_attendees set billable = true where lesson_id = p_lesson_id;
end;
$$;

-- Marca la asistencia de un alumno en una clase. Devuelve si se cobra.
-- "Avisó" no se cobra salvo que haya avisado fuera de la regla (clase por empezar, con menos
-- horas que late_cancel_hours). Con p_attendance nulo se deshace la marca. p_billable fuerza el valor.
create or replace function public.set_attendance(
  p_lesson_id uuid,
  p_student_id uuid,
  p_attendance text default null,
  p_billable boolean default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_lesson public.lessons;
  v_late_hours integer;
  v_billable boolean;
begin
  if p_attendance is not null and p_attendance not in ('present', 'absent', 'late', 'excused') then
    raise exception 'invalid_attendance' using errcode = '22023';
  end if;

  select l.* into v_lesson
  from public.lessons l
  where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null;
  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;
  if v_lesson.status = 'cancelled' then
    raise exception 'lesson_cancelled' using errcode = '22023';
  end if;

  select o.late_cancel_hours into v_late_hours from public.organizations o where o.id = v_org;

  v_billable := coalesce(
    p_billable,
    case
      when p_attendance = 'excused' then
        now() < v_lesson.starts_at
        and (v_lesson.starts_at - now()) < make_interval(hours => v_late_hours)
      else true
    end
  );

  update public.lesson_attendees
  set attendance = p_attendance,
      billable = v_billable,
      marked_at = case when p_attendance is null then null else now() end
  where lesson_id = p_lesson_id and student_id = p_student_id;
  if not found then
    raise exception 'attendee_not_found' using errcode = '42501';
  end if;

  if p_attendance is not null then
    insert into public.events (org_id, actor_type, actor_id, name, props)
    values (v_org, 'teacher', v_user, 'attendance_marked', jsonb_build_object('attendance', p_attendance));
  end if;

  return v_billable;
end;
$$;

-- Cambia los alumnos de una clase. Los que ya tienen asistencia marcada no se sacan.
create or replace function public.set_lesson_students(p_lesson_id uuid, p_student_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_ids uuid[];
begin
  if not exists (
    select 1 from public.lessons l
    where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null
  ) then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;

  v_ids := private.check_students(v_org, p_student_ids);

  insert into public.lesson_attendees (lesson_id, student_id, org_id)
  select p_lesson_id, x, v_org from unnest(v_ids) as x
  on conflict (lesson_id, student_id) do nothing;

  delete from public.lesson_attendees a
  where a.lesson_id = p_lesson_id
    and a.student_id <> all (v_ids)
    and a.attendance is null;
end;
$$;

revoke all on function public.create_lesson(date, time, integer, uuid[], text, text)
  from public, anon;
grant execute on function public.create_lesson(date, time, integer, uuid[], text, text)
  to authenticated;

revoke all on function public.create_lesson_series(smallint, time, integer, uuid[], date, date, text)
  from public, anon;
grant execute on function public.create_lesson_series(smallint, time, integer, uuid[], date, date, text)
  to authenticated;

revoke all on function public.extend_lesson_series() from public, anon;
grant execute on function public.extend_lesson_series() to authenticated;

revoke all on function public.end_lesson_series(uuid) from public, anon;
grant execute on function public.end_lesson_series(uuid) to authenticated;

revoke all on function public.move_lesson(uuid, date, time, integer) from public, anon;
grant execute on function public.move_lesson(uuid, date, time, integer) to authenticated;

revoke all on function public.cancel_lesson(uuid, text, text) from public, anon;
grant execute on function public.cancel_lesson(uuid, text, text) to authenticated;

revoke all on function public.restore_lesson(uuid) from public, anon;
grant execute on function public.restore_lesson(uuid) to authenticated;

revoke all on function public.set_attendance(uuid, uuid, text, boolean) from public, anon;
grant execute on function public.set_attendance(uuid, uuid, text, boolean) to authenticated;

revoke all on function public.set_lesson_students(uuid, uuid[]) from public, anon;
grant execute on function public.set_lesson_students(uuid, uuid[]) to authenticated;
