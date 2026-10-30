begin;
select plan(36);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beto@example.test'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucia@example.test'),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mateo@example.test');

create temp table ctx (name text primary key, id uuid, token text);
grant all on ctx to authenticated, anon;

-- Ana: Lucía (por clase) y Mateo, con una clase individual de cada uno y una grupal de los dos.
-- Beto: un alumno con su propia clase y su propio cargo.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana', '{}', 'ana.profe', 'https://mpago.example.test/ana', 12);
insert into ctx select 'lucia', r.student_id, r.token from public.create_student(
  'Lucía Pérez', p_phone => '1155551234', p_subject => 'Otra', p_notes => 'Nota privada de Lucía',
  p_payer_name => 'Marta Pérez', p_mode => 'per_lesson', p_amount => 1800000
) r;
insert into ctx select 'mateo', r.student_id, r.token from public.create_student(
  'Mateo Gómez', p_phone => '1155551234', p_subject => 'Otra', p_mode => 'per_lesson', p_amount => 2000000
) r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');
insert into ctx select 'beto', r.student_id, r.token from public.create_student('Alumno de Beto', p_phone => '1155551234', p_subject => 'Otra', p_mode => 'per_lesson', p_amount => 900000) r;
insert into ctx select 'lb', public.create_lesson('2026-11-04', '10:00', 60, array[(select id from ctx where name = 'beto')]);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into ctx select 'l_lucia', public.create_lesson('2026-09-01', '10:00', 60, array[(select id from ctx where name = 'lucia')], 'https://meet.example.test/lucia', 'Pasado simple');
insert into ctx select 'l_mateo', public.create_lesson('2026-09-02', '10:00', 60, array[(select id from ctx where name = 'mateo')]);
insert into ctx select 'l_grupal', public.create_lesson('2026-09-03', '10:00', 60, array[(select id from ctx where name = 'lucia'), (select id from ctx where name = 'mateo')]);
update public.lessons set shared_notes = 'Traer el cuaderno' where id = (select id from ctx where name = 'l_lucia');
insert into public.lesson_notes (org_id, lesson_id, body)
  select org_id, id, 'Nota privada de la clase' from public.lessons where id = (select id from ctx where name = 'l_lucia');

-- Asistencia: genera los cargos por clase. Lucía paga una parte.
select public.set_attendance((select id from ctx where name = 'l_lucia'), (select id from ctx where name = 'lucia'), 'present');
select public.set_attendance((select id from ctx where name = 'l_grupal'), (select id from ctx where name = 'lucia'), 'present');
select public.set_attendance((select id from ctx where name = 'l_mateo'), (select id from ctx where name = 'mateo'), 'present');
select public.record_payment((select id from ctx where name = 'lucia'), 1000000, 'transfer', '2026-09-05');

-- Lucía activa su cuenta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select public.accept_student_invitation((select token from ctx where name = 'lucia'));

-- ---------------------------------------------------------------------------
-- Lo que ve
-- ---------------------------------------------------------------------------
select is((select count(*)::int from public.lesson_attendees), 2, 've sus dos asistencias, la individual y la grupal');
select is(
  (select count(*)::int from public.lesson_attendees where student_id = (select id from ctx where name = 'mateo')),
  0, 'no ve las asistencias de otro alumno, ni siquiera en la clase grupal'
);
select is((select count(*)::int from public.lessons), 2, 've sus dos clases');
select is(
  (select meeting_url from public.lessons where id = (select id from ctx where name = 'l_lucia')),
  'https://meet.example.test/lucia', 've el link de su clase'
);
select is(
  (select shared_notes from public.lessons where id = (select id from ctx where name = 'l_lucia')),
  'Traer el cuaderno', 've las notas que el profe le dejó para él'
);
select is((select count(*)::int from public.lessons where id = (select id from ctx where name = 'l_mateo')), 0, 'no ve la clase de Mateo');
select is((select count(*)::int from public.lessons where id = (select id from ctx where name = 'lb')), 0, 'ni la de otro espacio');

select is((select count(*)::int from public.charge_balances where status = 'active'), 2, 've sus dos cargos');
select is((select sum(remaining)::int from public.charge_balances where status = 'active'), 2600000, 'con lo que le falta pagar de cada uno');
select is((select count(*)::int from public.payment_balances), 1, 've su pago');
select is((select sum(amount)::int from public.payments), 1000000, 'por el monto que pagó');
select is((select count(*)::int from public.payment_allocations), 1, 've a qué cargo se aplicó');
select is((select count(*)::int from public.charges where student_id = (select id from ctx where name = 'mateo')), 0, 'no ve los cargos de Mateo');
select is((select count(*)::int from public.payments where student_id = (select id from ctx where name = 'beto')), 0, 'ni los pagos de otro espacio');

-- Cómo pagar, sin abrir el espacio.
select is((select payment_alias from public.my_student_links()), 'ana.profe', 'el portal le muestra el alias del profe');
select is((select payment_link from public.my_student_links()), 'https://mpago.example.test/ana', 'y su link de pago');
select is((select late_cancel_hours from public.my_student_links()), 12, 'y la regla de cancelación');
select is((select timezone from public.my_student_links()), 'America/Argentina/Buenos_Aires', 'y la zona horaria del espacio');
select is((select count(*)::int from public.organizations), 0, 'pero no lee la organización');

-- ---------------------------------------------------------------------------
-- Lo que sigue cerrado
-- ---------------------------------------------------------------------------
select is((select count(*)::int from public.lesson_notes), 0, 'no lee las notas privadas de la clase');
select is((select count(*)::int from public.student_notes), 0, 'ni las notas del profe sobre él');
select is((select count(*)::int from public.student_contacts), 0, 'ni a los responsables de pago');
select is((select count(*)::int from public.lesson_series), 0, 'ni los horarios fijos del profe');

-- Solo lectura.
update public.lessons set topic = 'Hackeado';
select is((select count(*)::int from public.lessons where topic = 'Hackeado'), 0, 'no edita clases');
select throws_ok($$update public.charges set amount = 1$$, '42501', null, 'no modifica cargos');
select throws_ok(
  $$insert into public.payments (org_id, student_id, amount, method, paid_on, recorded_by)
    select org_id, id, 1, 'cash', current_date, user_id from public.students limit 1$$,
  '42501', null, 'no registra pagos'
);

-- ---------------------------------------------------------------------------
-- Alumno archivado: solo lectura y sin próximas clases (producto #13)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into ctx select 'l_futura', public.create_lesson('2099-01-05', '10:00', 60, array[(select id from ctx where name = 'lucia')]);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.lessons where id = (select id from ctx where name = 'l_futura')), 1, 'antes de archivarlo ve su próxima clase');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
update public.students set archived_at = now() where id = (select id from ctx where name = 'lucia');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.lessons), 2, 'archivado sigue viendo sus clases pasadas');
select is((select count(*)::int from public.lessons where id = (select id from ctx where name = 'l_futura')), 0, 'pero no la próxima clase');
select is((select count(*)::int from public.charge_balances where status = 'active'), 2, 'sigue viendo sus cargos');
select is((select sum(remaining)::int from public.charge_balances where status = 'active'), 2600000, 'y cuánto debe');
select is((select count(*)::int from public.payments), 1, 'y sus pagos');
select is((select archived from public.my_student_links()), true, 'el espacio figura archivado');
select is((select payment_alias from public.my_student_links()), 'ana.profe', 'y sigue viendo cómo pagar');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
update public.students set archived_at = null where id = (select id from ctx where name = 'lucia');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.lessons), 3, 'al restaurarlo vuelve a ver su próxima clase');

-- Mateo, sin cuenta vinculada, no ve nada de esto.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
select is((select count(*)::int from public.lessons) + (select count(*)::int from public.charges), 0, 'una cuenta sin vínculo no ve clases ni cobros');

select * from finish();
rollback;
