begin;
select plan(52);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

create temp table ctx (name text primary key, id uuid);
grant all on ctx to authenticated, anon;

-- Cada profe con su espacio. A tiene dos alumnos y B uno.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');
insert into ctx select 's1', r.student_id from public.create_student('Lucía Pérez') r;
insert into ctx select 's2', r.student_id from public.create_student('Mateo Gómez') r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');
insert into ctx select 'sb', r.student_id from public.create_student('Alumno de Beto') r;

-- ---------------------------------------------------------------------------
-- Clases sueltas
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into ctx select 'l1', public.create_lesson(
  '2026-11-02', '17:00', 60, array[(select id from ctx where name = 's1')],
  'https://meet.example.test/abc', 'Verbos'
);
select is((select count(*)::int from public.lessons), 1, 'A ve su clase suelta');
select is((select count(*)::int from public.lesson_attendees), 1, 'la clase individual tiene un asistente');
select is(
  (select starts_at from public.lessons where id = (select id from ctx where name = 'l1')),
  '2026-11-02 20:00:00+00'::timestamptz,
  'la hora se guarda en la zona de la organización (17:00 en Buenos Aires)'
);
select is(
  (select ends_at - starts_at from public.lessons where id = (select id from ctx where name = 'l1')),
  interval '1 hour', 'la clase dura lo indicado'
);

insert into ctx select 'l2', public.create_lesson(
  '2026-11-03', '10:00', 90,
  array[(select id from ctx where name = 's1'), (select id from ctx where name = 's2'), (select id from ctx where name = 's2')]
);
select is(
  (select count(*)::int from public.lesson_attendees where lesson_id = (select id from ctx where name = 'l2')),
  2, 'la clase grupal tiene un asistente por alumno, sin repetidos'
);

select throws_ok(
  $$select public.create_lesson('2026-11-04', '10:00', 60, '{}')$$,
  '22023', 'no_students', 'una clase necesita al menos un alumno'
);
select throws_ok(
  format($$select public.create_lesson('2026-11-04', '10:00', 60, array[%L::uuid])$$, (select id from ctx where name = 'sb')),
  '42501', 'student_not_found', 'A no puede cargar una clase con un alumno de B'
);
select throws_ok(
  $$select public.create_lesson('2026-11-04', '10:00', 0, array[(select id from ctx where name = 's1')])$$,
  '23514', null, 'la duración tiene que ser positiva'
);
select throws_ok(
  $$select public.create_lesson('2026-11-04', '10:00', 60, array[(select id from ctx where name = 's1')], 'javascript:alert(1)')$$,
  '23514', null, 'el link de la clase tiene que ser http o https'
);

-- El cliente no inserta ni mueve clases directo: solo edita los textos.
select throws_ok(
  $$insert into public.lessons (org_id, teacher_id, starts_at, ends_at)
    select org_id, teacher_id, now(), now() + interval '1 hour' from public.lessons limit 1$$,
  '42501', null, 'no se insertan clases directo'
);
select throws_ok(
  $$update public.lessons set starts_at = now()$$,
  '42501', null, 'no se cambia la hora de una clase directo'
);
update public.lessons set topic = 'Pasado simple', private_notes = 'Repasar irregulares'
  where id = (select id from ctx where name = 'l1');
select is(
  (select topic from public.lessons where id = (select id from ctx where name = 'l1')),
  'Pasado simple', 'el profe edita el tema y las notas de la clase'
);
update public.lesson_attendees set reminded_at = now() where lesson_id = (select id from ctx where name = 'l1');
select isnt(
  (select reminded_at from public.lesson_attendees where lesson_id = (select id from ctx where name = 'l1')),
  null, 'el profe marca el recordatorio como enviado'
);
select throws_ok(
  $$update public.lesson_attendees set attendance = 'present'$$,
  '42501', null, 'la asistencia no se marca directo'
);

-- Un alumno archivado no se puede agendar.
update public.students set archived_at = now() where id = (select id from ctx where name = 's2');
select throws_ok(
  $$select public.create_lesson('2026-11-04', '10:00', 60, array[(select id from ctx where name = 's2')])$$,
  '42501', 'student_not_found', 'no se agenda a un alumno archivado'
);
update public.students set archived_at = null where id = (select id from ctx where name = 's2');

-- ---------------------------------------------------------------------------
-- Aislamiento entre organizaciones
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.lessons), 0, 'B no ve clases de A');
select is((select count(*)::int from public.lesson_attendees), 0, 'B no ve asistentes de A');
update public.lessons set topic = 'Hackeado';
select is(
  (select count(*)::int from public.lessons), 0, 'B no modifica clases de A'
);
select throws_ok(
  format($$select public.cancel_lesson(%L, 'teacher')$$, (select id from ctx where name = 'l1')),
  '42501', 'lesson_not_found', 'B no puede cancelar una clase de A'
);
select throws_ok(
  format($$select public.set_attendance(%L, %L, 'present')$$, (select id from ctx where name = 'l1'), (select id from ctx where name = 's1')),
  '42501', 'lesson_not_found', 'B no puede marcar asistencia en una clase de A'
);
select throws_ok(
  format($$select public.move_lesson(%L, '2026-11-05', '09:00')$$, (select id from ctx where name = 'l1')),
  '42501', 'lesson_not_found', 'B no puede mover una clase de A'
);

reset role;
set local role anon;
select throws_ok(
  $$select public.create_lesson('2026-11-04', '10:00', 60, '{}')$$,
  '42501', null, 'sin sesión no se crean clases'
);
reset role;

-- ---------------------------------------------------------------------------
-- Cancelación y asistencia (con la regla de aviso de 24 horas por defecto)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into ctx select 'near', public.create_lesson('2026-11-10', '10:00', 60, array[(select id from ctx where name = 's1')]);
insert into ctx select 'far', public.create_lesson('2026-11-11', '10:00', 60, array[(select id from ctx where name = 's1')]);
-- Se acomodan los horarios respecto de ahora para probar la regla de las 24 horas.
reset role;
update public.lessons set starts_at = now() + interval '2 hours', ends_at = now() + interval '3 hours'
  where id = (select id from ctx where name = 'near');
update public.lessons set starts_at = now() + interval '3 days', ends_at = now() + interval '3 days 1 hour'
  where id = (select id from ctx where name = 'far');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(
  (select public.set_attendance((select id from ctx where name = 'near'), (select id from ctx where name = 's1'), 'present')),
  true, 'presente se cobra'
);
select is(
  (select attendance from public.lesson_attendees where lesson_id = (select id from ctx where name = 'near')),
  'present', 'queda marcada la asistencia'
);
select is(
  (select public.set_attendance((select id from ctx where name = 'near'), (select id from ctx where name = 's1'), 'absent')),
  true, 'faltar sin aviso se cobra'
);
select is(
  (select public.set_attendance((select id from ctx where name = 'near'), (select id from ctx where name = 's1'), 'excused')),
  true, 'avisar con menos de 24 horas se cobra'
);
select is(
  (select public.set_attendance((select id from ctx where name = 'far'), (select id from ctx where name = 's1'), 'excused')),
  false, 'avisar con tiempo no se cobra'
);
select is(
  (select public.set_attendance((select id from ctx where name = 'far'), (select id from ctx where name = 's1'), 'excused', true)),
  true, 'el profe puede forzar que se cobre'
);
select public.set_attendance((select id from ctx where name = 'far'), (select id from ctx where name = 's1'), null);
select is(
  (select attendance from public.lesson_attendees where lesson_id = (select id from ctx where name = 'far')),
  null, 'se puede deshacer la asistencia'
);
select is(
  (select marked_at from public.lesson_attendees where lesson_id = (select id from ctx where name = 'far')),
  null, 'al deshacer también se borra la fecha de la marca'
);
select throws_ok(
  format($$select public.set_attendance(%L, %L, 'foo')$$, (select id from ctx where name = 'far'), (select id from ctx where name = 's1')),
  '22023', 'invalid_attendance', 'la asistencia tiene que ser una de las cuatro'
);
select throws_ok(
  format($$select public.set_attendance(%L, %L, 'present')$$, (select id from ctx where name = 'far'), (select id from ctx where name = 's2')),
  '42501', 'attendee_not_found', 'no se marca a un alumno que no está en la clase'
);

-- Cancelaciones: la regla decide si se cobra.
select public.cancel_lesson((select id from ctx where name = 'near'), 'student', 'Se enfermó');
select is(
  (select status from public.lessons where id = (select id from ctx where name = 'near')),
  'cancelled', 'la clase queda cancelada'
);
select is(
  (select billable from public.lesson_attendees where lesson_id = (select id from ctx where name = 'near')),
  true, 'cancela el alumno con menos de 24 horas: se cobra'
);
select throws_ok(
  format($$select public.set_attendance(%L, %L, 'present')$$, (select id from ctx where name = 'near'), (select id from ctx where name = 's1')),
  '22023', 'lesson_cancelled', 'no se marca asistencia en una clase cancelada'
);
select public.restore_lesson((select id from ctx where name = 'near'));
select is(
  (select status from public.lessons where id = (select id from ctx where name = 'near')),
  'scheduled', 'se puede deshacer la cancelación'
);

select public.cancel_lesson((select id from ctx where name = 'far'), 'student');
select is(
  (select billable from public.lesson_attendees where lesson_id = (select id from ctx where name = 'far')),
  false, 'cancela el alumno con tiempo: no se cobra'
);
select public.restore_lesson((select id from ctx where name = 'far'));
select public.cancel_lesson((select id from ctx where name = 'near'), 'teacher');
select is(
  (select billable from public.lesson_attendees where lesson_id = (select id from ctx where name = 'near')),
  false, 'si cancela el profe nunca se cobra'
);
select throws_ok(
  format($$select public.cancel_lesson(%L, 'teacher')$$, (select id from ctx where name = 'near')),
  '22023', 'lesson_cancelled', 'una clase cancelada no se cancela de nuevo'
);
select throws_ok(
  format($$select public.cancel_lesson(%L, 'otro')$$, (select id from ctx where name = 'far')),
  '22023', 'invalid_cancelled_by', 'quién cancela es el profe o el alumno'
);

-- Mover una clase.
select public.move_lesson((select id from ctx where name = 'far'), '2026-12-01', '15:30');
select is(
  (select starts_at from public.lessons where id = (select id from ctx where name = 'far')),
  '2026-12-01 18:30:00+00'::timestamptz, 'mover cambia el día y la hora locales'
);
select is(
  (select ends_at - starts_at from public.lessons where id = (select id from ctx where name = 'far')),
  interval '1 hour', 'mover conserva la duración'
);
select throws_ok(
  format($$select public.move_lesson(%L, '2026-12-02', '09:00')$$, (select id from ctx where name = 'near')),
  '22023', 'lesson_cancelled', 'una clase cancelada no se mueve'
);

-- Alumnos de una clase.
select public.set_lesson_students((select id from ctx where name = 'far'), array[(select id from ctx where name = 's2')]);
select is(
  (select array_agg(student_id) from public.lesson_attendees where lesson_id = (select id from ctx where name = 'far')),
  array[(select id from ctx where name = 's2')],
  'se cambia el alumno de la clase si no tenía asistencia marcada'
);

-- ---------------------------------------------------------------------------
-- Horarios fijos
-- ---------------------------------------------------------------------------
insert into ctx select 'serie', public.create_lesson_series(
  2::smallint, '18:00', 60,
  array[(select id from ctx where name = 's1'), (select id from ctx where name = 's2')],
  (now() at time zone 'America/Argentina/Buenos_Aires')::date
);
select ok(
  (select count(*) from public.lessons where series_id = (select id from ctx where name = 'serie')) between 8 and 9,
  'el horario fijo genera las clases de las próximas 8 semanas'
);
select is(
  (select count(*)::int from public.lessons
   where series_id = (select id from ctx where name = 'serie')
     and (starts_at at time zone 'America/Argentina/Buenos_Aires')::time <> '18:00'
     and extract(isodow from starts_at at time zone 'America/Argentina/Buenos_Aires') <> 2),
  0, 'todas caen el martes a las 18:00 locales'
);
select is(
  (select count(*)::int from public.lesson_attendees a join public.lessons l on l.id = a.lesson_id
   where l.series_id = (select id from ctx where name = 'serie')),
  (select count(*)::int * 2 from public.lessons where series_id = (select id from ctx where name = 'serie')),
  'cada clase del horario fijo trae a sus dos alumnos'
);
select is(public.extend_lesson_series(), 0, 'extender de nuevo no duplica clases');

-- Una clase movida o cancelada de la serie no se regenera.
select public.cancel_lesson(
  (select id from public.lessons where series_id = (select id from ctx where name = 'serie') order by starts_at limit 1),
  'teacher'
);
select is(public.extend_lesson_series(), 0, 'una clase cancelada de la serie no se vuelve a crear');

-- Terminar el horario fijo archiva las clases futuras sin asistencia, pero respeta las ya marcadas.
select public.set_attendance(
  (select id from public.lessons where series_id = (select id from ctx where name = 'serie') and status = 'scheduled' order by starts_at limit 1),
  (select id from ctx where name = 's1'),
  'present'
);
select public.end_lesson_series((select id from ctx where name = 'serie'));
select is(
  (select count(*)::int from public.lessons where series_id = (select id from ctx where name = 'serie') and archived_at is null and status = 'scheduled'),
  1, 'al terminar el horario fijo solo queda la clase con asistencia marcada'
);
select is(public.extend_lesson_series(), 0, 'un horario fijo terminado no genera más clases');
select isnt(
  (select archived_at from public.lesson_series where id = (select id from ctx where name = 'serie')),
  null, 'el horario fijo queda archivado, no borrado'
);

select * from finish();
rollback;
