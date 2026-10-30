begin;
select plan(18);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

create temp table ctx (name text primary key, id uuid);
grant all on ctx to authenticated, anon;

-- Las notas ya no viven en las tablas del alumno ni de la clase.
select hasnt_column('public', 'students', 'notes', 'students ya no guarda las notas del profe');
select hasnt_column('public', 'lessons', 'private_notes', 'lessons ya no guarda las notas privadas');

-- Cada profe con su espacio. A carga un alumno con nota y una clase.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');
insert into ctx select 's1', r.student_id
from public.create_student('Lucía Pérez', p_phone => '1155551234', p_subject => 'Otra', p_notes => '  Le cuesta la tabla del 7  ') r;
insert into ctx select 's2', r.student_id from public.create_student('Mateo Gómez', p_phone => '1155551234', p_subject => 'Otra') r;
insert into ctx select 'l1', public.create_lesson(
  '2026-11-02', '17:00', 60, array[(select id from ctx where name = 's1')]
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');
insert into ctx select 'sb', r.student_id from public.create_student('Alumno de Beto', p_phone => '1155551234', p_subject => 'Otra') r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into ctx select 'org_a', org_id from public.students where id = (select id from ctx where name = 's1');

-- ---------------------------------------------------------------------------
-- Notas del alumno
-- ---------------------------------------------------------------------------
select is(
  (select body from public.student_notes where student_id = (select id from ctx where name = 's1')),
  'Le cuesta la tabla del 7', 'el alta guarda la nota en student_notes, sin espacios de más'
);
select is(
  (select count(*)::int from public.student_notes where student_id = (select id from ctx where name = 's2')),
  0, 'un alumno cargado sin nota no tiene fila de notas'
);

insert into public.student_notes (org_id, student_id, body)
select s.org_id, s.id, 'Prefiere los martes' from public.students s where s.id = (select id from ctx where name = 's2');
select is(
  (select body from public.student_notes where student_id = (select id from ctx where name = 's2')),
  'Prefiere los martes', 'el profe agrega la nota de un alumno'
);
update public.student_notes set body = 'Prefiere los jueves'
  where student_id = (select id from ctx where name = 's2');
select is(
  (select body from public.student_notes where student_id = (select id from ctx where name = 's2')),
  'Prefiere los jueves', 'el profe edita la nota de un alumno'
);
select throws_ok(
  format(
    $$insert into public.student_notes (org_id, student_id, body)
      select s.org_id, s.id, 'otra' from public.students s where s.id = %L$$,
    (select id from ctx where name = 's2')
  ),
  '23505', null, 'un alumno tiene una sola nota'
);
select throws_ok(
  format(
    $$insert into public.student_notes (org_id, student_id, body) values (%L, %L, 'ajena')$$,
    (select id from ctx where name = 'org_a'),
    (select id from ctx where name = 'sb')
  ),
  '42501', null, 'una nota no se carga para un alumno de otro espacio'
);

-- ---------------------------------------------------------------------------
-- Notas privadas de la clase
-- ---------------------------------------------------------------------------
insert into public.lesson_notes (org_id, lesson_id, body)
select l.org_id, l.id, 'Repasar irregulares' from public.lessons l where l.id = (select id from ctx where name = 'l1');
select is(
  (select body from public.lesson_notes where lesson_id = (select id from ctx where name = 'l1')),
  'Repasar irregulares', 'el profe guarda la nota privada de una clase'
);
select throws_ok(
  format(
    $$insert into public.lesson_notes (org_id, lesson_id, body)
      select l.org_id, l.id, 'otra' from public.lessons l where l.id = %L$$,
    (select id from ctx where name = 'l1')
  ),
  '23505', null, 'una clase tiene una sola nota privada'
);
select throws_ok(
  format(
    $$insert into public.lesson_notes (org_id, lesson_id, body)
      select l.org_id, l.id, repeat('x', 2001) from public.lessons l where l.id = %L$$,
    (select id from ctx where name = 'l1')
  ),
  '23514', null, 'una nota de clase no pasa de 2000 caracteres'
);

-- ---------------------------------------------------------------------------
-- Aislamiento: B no lee ni toca las notas de A
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.student_notes), 0, 'B no ve las notas de alumnos de A');
select is((select count(*)::int from public.lesson_notes), 0, 'B no ve las notas de clases de A');
update public.student_notes set body = 'Hackeada';
select is((select count(*)::int from public.student_notes where body = 'Hackeada'), 0, 'B no modifica notas de A');
select throws_ok(
  format(
    $$insert into public.student_notes (org_id, student_id, body) values (%L, %L, 'intruso')$$,
    (select id from ctx where name = 'org_a'),
    (select id from ctx where name = 's1')
  ),
  '42501', null, 'B no puede escribir una nota para un alumno de A'
);
select throws_ok(
  format(
    $$insert into public.lesson_notes (org_id, lesson_id, body) values (%L, %L, 'intruso')$$,
    (select id from ctx where name = 'org_a'),
    (select id from ctx where name = 'l1')
  ),
  '42501', null, 'B no puede escribir una nota para una clase de A'
);

-- Nadie sin sesión las lee.
reset role;
set local role anon;
select throws_ok($$select count(*) from public.student_notes$$, '42501', null, 'sin sesión no se leen las notas de alumnos');
select throws_ok($$select count(*) from public.lesson_notes$$, '42501', null, 'sin sesión no se leen las notas de clases');

select * from finish();
rollback;
