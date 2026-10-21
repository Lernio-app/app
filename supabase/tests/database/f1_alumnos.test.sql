begin;
select plan(24);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

create temp table ctx (name text primary key, student_id uuid, token text);
grant all on ctx to authenticated, anon;

-- Cada profe con su espacio.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');

-- Profe A carga un alumno con responsable de pago y paquete.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into ctx
select 'a', r.student_id, r.token
from public.create_student(
  'Lucía Pérez', '1155551234', null, 'Inglés', 'Secundaria', null,
  'Marta Pérez', 'Madre', '1155550000', null,
  'package', 4000000, 4, null
) r;

select is((select count(*)::int from public.students), 1, 'A ve a su alumno');
select is((select count(*)::int from public.student_contacts where is_payer and gets_reports), 1, 'se creó el responsable de pago');
select is((select mode from public.price_plans), 'package', 'se creó el plan de cobro');
select is((select lessons_per_package from public.price_plans), 4, 'el paquete guarda la cantidad de clases');
select is((select count(*)::int from public.events where name = 'student_created'), 1, 'quedó el evento de alta del alumno');
select is((select length(token) from ctx where name = 'a'), 64, 'el token es largo (32 bytes en hex)');

-- El token no se guarda en claro y el cliente no lee student_access.
select throws_ok($$select count(*) from public.student_access$$, '42501', null, 'el profe no lee student_access directo');

reset role;
select is(
  (select count(*)::int from public.student_access where token_hash = (select token from ctx where name = 'a')),
  0, 'la base no guarda el token en claro'
);
select is(
  (select count(*)::int from public.student_access
   where token_hash = encode(sha256(convert_to((select token from ctx where name = 'a'), 'utf8')), 'hex')),
  1, 'la base guarda el hash del token'
);

-- Aislamiento: B no ve ni toca a los alumnos de A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.students), 0, 'B no ve alumnos de A');
select is((select count(*)::int from public.price_plans), 0, 'B no ve planes de A');
update public.students set full_name = 'Hackeado';
select is((select count(*)::int from public.students where full_name = 'Hackeado'), 0, 'B no modifica alumnos de A');
select throws_ok(
  format($$select public.issue_student_link(%L)$$, (select student_id from ctx where name = 'a')),
  '42501', 'student_not_found', 'B no puede emitir un link para un alumno de A'
);
select throws_ok(
  format($$select public.set_price_plan(%L, 'monthly', 100, null, 5::smallint)$$, (select student_id from ctx where name = 'a')),
  '42501', 'student_not_found', 'B no puede cambiar el plan de un alumno de A'
);

-- Restricciones del plan.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  $$select * from public.create_student('X', p_mode => 'package', p_amount => 100)$$,
  '23514', null, 'un paquete exige cantidad de clases'
);
select throws_ok(
  $$select * from public.create_student('X', p_mode => 'monthly', p_amount => 100)$$,
  '23514', null, 'un plan mensual exige día de facturación'
);

-- El link abre con el token vigente y deja de abrir al regenerarlo.
reset role;
set local role anon;
select is((select student_name from public.student_by_token((select token from ctx where name = 'a'))), 'Lucía Pérez', 'el token vigente abre el link');
select is((select count(*)::int from public.student_by_token('no-existe')), 0, 'un token inventado no abre nada');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into ctx select 'old', student_id, token from ctx where name = 'a';
update ctx set token = (select public.issue_student_link((select student_id from ctx where name = 'a'))) where name = 'a';

reset role;
set local role anon;
select is(
  (select count(*)::int from public.student_by_token((select token from ctx where name = 'a'))),
  1, 'el token nuevo abre el link'
);
select is(
  (select count(*)::int from public.student_by_token((select token from ctx where name = 'old'))),
  0, 'el token anterior quedó revocado'
);

-- Cambiar el plan conserva el historial.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.set_price_plan((select student_id from ctx where name = 'a'), 'monthly', 5000000, null, 5::smallint);
select is((select count(*)::int from public.price_plans), 2, 'el cambio de plan guarda el historial');

-- El precio es opcional: sin modalidad no se crea y se puede quitar.
select is(
  (select public.set_price_plan((select student_id from ctx where name = 'a'), null)),
  null::uuid, 'set_price_plan sin modalidad no crea un precio nuevo'
);
select is(
  (select count(*)::int from public.price_plans where ended_on is null and student_id = (select student_id from ctx where name = 'a')),
  0, 'quitar el precio deja al alumno sin precio vigente'
);
insert into ctx select 'sin_precio', r.student_id, r.token from public.create_student('Sin Precio') r;
select is(
  (select count(*)::int from public.price_plans where student_id = (select student_id from ctx where name = 'sin_precio')),
  0, 'un alumno cargado sin precio no tiene precio'
);

select * from finish();
rollback;
