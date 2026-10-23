begin;
select plan(24);

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

select is((select count(*)::int from public.areas), 4, 'hay cuatro áreas');
select is((select count(*)::int from public.subjects), 30, 'hay treinta materias');
select is(
  (select count(*)::int from public.subjects s
   where (select count(*) from public.subject_areas sa where sa.subject_id = s.id) not in (1, 2)),
  0, 'cada materia se enseña en una o dos áreas'
);
select is(
  (select count(*)::int from public.subject_areas sa
   join public.subjects s on s.id = sa.subject_id
   where s.code = 'fisica'),
  2, 'Física se enseña en Apoyo escolar y en Ingreso y universidad'
);
select is(
  (select count(*)::int from public.subject_areas sa
   join public.subjects s on s.id = sa.subject_id
   where s.code = 'psicologia'),
  1, 'Psicología solo se enseña en Ingreso y universidad'
);
select is((select count(*)::int from public.levels), 13, 'hay trece niveles');
select is(
  (select count(*)::int from public.levels l join public.areas a on a.id = l.area_id
   where a.code = 'idiomas'),
  6, 'idiomas va de A1 a C2'
);

-- El catálogo se lee sin sesión y nadie lo escribe desde el cliente.
set local role anon;
select is((select count(*)::int from public.subjects), 30, 'anon lee las materias');
select throws_ok(
  $$insert into public.subjects (code, name, position) values ('otra', 'Otra', 99)$$,
  '42501', null, 'anon no escribe materias'
);
reset role;

insert into auth.users (id, instance_id, aud, role, email)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  $$update public.areas set name = 'Hackeada'$$,
  '42501', null, 'un profe no edita las áreas'
);

-- ---------------------------------------------------------------------------
-- Profe: materias y área principal
-- ---------------------------------------------------------------------------

select public.create_workspace(
  'Ana', 'Ana',
  array[
    (select id from public.subjects where code = 'ingles'),
    (select id from public.subjects where code = 'portugues'),
    (select id from public.subjects where code = 'piano')
  ]
);
select is(
  (select a.code from public.teacher_profiles tp join public.areas a on a.id = tp.main_area_id),
  'idiomas', 'el área principal es la que más se repite entre sus materias'
);

update public.teacher_profiles
set subject_ids = array[(select id from public.subjects where code = 'matematica')];
select is(
  (select a.code from public.teacher_profiles tp join public.areas a on a.id = tp.main_area_id),
  'ingreso', 'si una materia sirve en dos áreas y empatan, gana la de menor posición'
);

update public.teacher_profiles set subject_ids = '{}';
select is(
  (select main_area_id from public.teacher_profiles), null::uuid,
  'sin materias no hay área principal'
);

select throws_ok(
  $$update public.teacher_profiles set subject_ids = array['00000000-0000-0000-0000-00000000dead'::uuid]$$,
  '23503', 'unknown_subject', 'no se acepta una materia que no existe'
);

-- ---------------------------------------------------------------------------
-- Alumnos: materia de la lista u «Otra»
-- ---------------------------------------------------------------------------

select lives_ok(
  $$select * from public.create_student(
    'Con lista',
    p_area_id => (select id from public.areas where code = 'idiomas'),
    p_subject_id => (select id from public.subjects where code = 'ingles'),
    p_subject => 'First',
    p_level_id => (select id from public.levels where code = 'b2')
  )$$,
  'se carga un alumno con área, materia, detalle y nivel de la lista'
);
select lives_ok(
  $$select * from public.create_student(
    'Otra materia', p_subject => 'Ajedrez'
  )$$,
  'se carga un alumno con «Otra» y su nombre'
);
select is(
  (select count(*)::int from public.students where area_id is null and subject = 'Ajedrez'),
  1, '«Otra» no lleva área'
);

select throws_ok(
  $$select * from public.create_student('Sin materia')$$,
  '23514', null, 'el alumno necesita materia o «Otra» con su nombre'
);
select throws_ok(
  $$select * from public.create_student(
    'Sin área', p_subject_id => (select id from public.subjects where code = 'ingles')
  )$$,
  '23514', null, 'una materia de la lista exige el área'
);
select throws_ok(
  $$select * from public.create_student(
    'Área equivocada',
    p_area_id => (select id from public.areas where code = 'musica'),
    p_subject_id => (select id from public.subjects where code = 'ingles')
  )$$,
  '23503', null, 'la materia tiene que enseñarse en el área elegida'
);
select throws_ok(
  $$select * from public.create_student(
    'Nivel de otra área',
    p_area_id => (select id from public.areas where code = 'idiomas'),
    p_subject_id => (select id from public.subjects where code = 'ingles'),
    p_level_id => (select id from public.levels where code = 'primaria')
  )$$,
  '23503', null, 'el nivel tiene que ser del área elegida'
);
select throws_ok(
  $$select * from public.create_student(
    'Otra con nivel',
    p_subject => 'Ajedrez',
    p_level_id => (select id from public.levels where code = 'a1')
  )$$,
  '23514', null, '«Otra» no lleva nivel'
);

-- Física puede cargarse en las dos áreas.
select lives_ok(
  $$select * from public.create_student(
    'Física apoyo',
    p_area_id => (select id from public.areas where code = 'apoyo'),
    p_subject_id => (select id from public.subjects where code = 'fisica')
  )$$,
  'Física se carga en Apoyo escolar'
);
select lives_ok(
  $$select * from public.create_student(
    'Física ingreso',
    p_area_id => (select id from public.areas where code = 'ingreso'),
    p_subject_id => (select id from public.subjects where code = 'fisica')
  )$$,
  'Física se carga en Ingreso y universidad'
);

select * from finish();
rollback;
