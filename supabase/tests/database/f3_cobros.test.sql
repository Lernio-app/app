begin;
select plan(63);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

create temp table ctx (name text primary key, id uuid);
grant all on ctx to authenticated, anon;

-- A tiene alumnos con cada modalidad de precio; B tiene uno.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');
insert into ctx select 's1', r.student_id from public.create_student('Por clase', p_mode => 'per_lesson', p_amount => 1800000) r;
insert into ctx select 's2', r.student_id from public.create_student('Paquete', p_mode => 'package', p_amount => 6400000, p_lessons_per_package => 4) r;
insert into ctx select 's3', r.student_id from public.create_student('Mensual', p_mode => 'monthly', p_amount => 5000000, p_billing_day => 1::smallint) r;
insert into ctx select 's4', r.student_id from public.create_student('Sin precio') r;
insert into ctx select 's5', r.student_id from public.create_student('Pagos') r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');
insert into ctx select 'sb', r.student_id from public.create_student('Alumno de Beto') r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- Cargo por clase (precio por clase)
-- ---------------------------------------------------------------------------
insert into ctx select 'l1', public.create_lesson('2026-09-01', '10:00', 60, array[(select id from ctx where name = 's1')]);
select public.set_attendance((select id from ctx where name = 'l1'), (select id from ctx where name = 's1'), 'present');
select is(
  (select count(*)::int from public.charges where student_id = (select id from ctx where name = 's1') and source = 'lesson' and status = 'active'),
  1, 'marcar la asistencia genera el cargo de la clase'
);
select is(
  (select amount from public.charges where lesson_id = (select id from ctx where name = 'l1')),
  1800000, 'el cargo es el precio por clase del alumno'
);
select is(
  (select due_on from public.charges where lesson_id = (select id from ctx where name = 'l1')),
  '2026-09-01'::date, 'el cargo vence el día de la clase'
);

select public.set_attendance((select id from ctx where name = 'l1'), (select id from ctx where name = 's1'), 'late');
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l1')),
  1, 'cambiar la asistencia no duplica el cargo'
);

select public.set_attendance((select id from ctx where name = 'l1'), (select id from ctx where name = 's1'), null);
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l1') and status = 'void'),
  1, 'deshacer la asistencia anula el cargo'
);

select public.set_attendance((select id from ctx where name = 'l1'), (select id from ctx where name = 's1'), 'absent');
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l1') and status = 'active'),
  1, 'volver a marcar reactiva el mismo cargo'
);
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l1')),
  1, 'no se crea un cargo nuevo al reactivar'
);

-- Avisar con tiempo no se cobra; si el profe fuerza el cobro, sí.
insert into ctx select 'l2', public.create_lesson('2027-01-15', '10:00', 60, array[(select id from ctx where name = 's1')]);
select public.set_attendance((select id from ctx where name = 'l2'), (select id from ctx where name = 's1'), 'excused');
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l2') and status = 'active'),
  0, 'avisar con tiempo no genera cargo'
);
select public.set_attendance((select id from ctx where name = 'l2'), (select id from ctx where name = 's1'), 'excused', true);
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l2') and status = 'active'),
  1, 'si el profe fuerza que se cobre, genera el cargo'
);

-- Cancelaciones del alumno: con tiempo no se cobra, tarde sí; deshacer anula el cargo.
insert into ctx select 'l3', public.create_lesson('2027-02-01', '10:00', 60, array[(select id from ctx where name = 's1')]);
select public.cancel_lesson((select id from ctx where name = 'l3'), 'student');
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l3') and status = 'active'),
  0, 'cancelar con tiempo no genera cargo'
);

insert into ctx select 'l4', public.create_lesson('2027-02-02', '10:00', 60, array[(select id from ctx where name = 's1')]);
reset role;
update public.lessons set starts_at = now() + interval '2 hours', ends_at = now() + interval '3 hours'
  where id = (select id from ctx where name = 'l4');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.cancel_lesson((select id from ctx where name = 'l4'), 'student');
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l4') and status = 'active'),
  1, 'cancelar tarde genera el cargo'
);
select public.restore_lesson((select id from ctx where name = 'l4'));
select is(
  (select count(*)::int from public.charges where lesson_id = (select id from ctx where name = 'l4') and status = 'active'),
  0, 'deshacer la cancelación anula el cargo'
);

insert into ctx select 'l5', public.create_lesson('2026-09-02', '10:00', 60, array[(select id from ctx where name = 's4')]);
select public.set_attendance((select id from ctx where name = 'l5'), (select id from ctx where name = 's4'), 'present');
select is(
  (select count(*)::int from public.charges where student_id = (select id from ctx where name = 's4')),
  0, 'un alumno sin precio no genera cargos'
);

-- ---------------------------------------------------------------------------
-- Paquete: cada clase descuenta una y al agotarse se compra otro
-- ---------------------------------------------------------------------------
insert into ctx select 'p1', public.create_lesson('2026-09-03', '10:00', 60, array[(select id from ctx where name = 's2')]);
insert into ctx select 'p2', public.create_lesson('2026-09-04', '10:00', 60, array[(select id from ctx where name = 's2')]);
insert into ctx select 'p3', public.create_lesson('2026-09-05', '10:00', 60, array[(select id from ctx where name = 's2')]);
insert into ctx select 'p4', public.create_lesson('2026-09-06', '10:00', 60, array[(select id from ctx where name = 's2')]);
insert into ctx select 'p5', public.create_lesson('2026-09-07', '10:00', 60, array[(select id from ctx where name = 's2')]);

select public.set_attendance((select id from ctx where name = 'p1'), (select id from ctx where name = 's2'), 'present');
select is(
  (select count(*)::int from public.charges where student_id = (select id from ctx where name = 's2') and source = 'package'),
  1, 'la primera clase compra el paquete'
);
select is(
  (select sum(delta)::int from public.package_ledger where student_id = (select id from ctx where name = 's2')),
  3, 'el paquete de 4 deja 3 clases tras la primera'
);
select is(
  (select amount from public.charges where student_id = (select id from ctx where name = 's2') and source = 'package'),
  6400000, 'el cargo del paquete es el precio del paquete'
);
select is(
  (select count(*)::int from public.charges where student_id = (select id from ctx where name = 's2') and source = 'lesson'),
  0, 'las clases de un paquete no generan cargos propios'
);

select public.set_attendance((select id from ctx where name = 'p2'), (select id from ctx where name = 's2'), 'present');
select is(
  (select sum(delta)::int from public.package_ledger where student_id = (select id from ctx where name = 's2')),
  2, 'la segunda clase deja 2'
);
select public.set_attendance((select id from ctx where name = 'p2'), (select id from ctx where name = 's2'), null);
select is(
  (select sum(delta)::int from public.package_ledger where student_id = (select id from ctx where name = 's2')),
  3, 'deshacer una asistencia devuelve la clase al paquete'
);
select public.set_attendance((select id from ctx where name = 'p2'), (select id from ctx where name = 's2'), 'present');
select public.set_attendance((select id from ctx where name = 'p3'), (select id from ctx where name = 's2'), 'present');
select public.set_attendance((select id from ctx where name = 'p4'), (select id from ctx where name = 's2'), 'present');
select is(
  (select sum(delta)::int from public.package_ledger where student_id = (select id from ctx where name = 's2')),
  0, 'tras cuatro clases el paquete se agota'
);
select public.set_attendance((select id from ctx where name = 'p5'), (select id from ctx where name = 's2'), 'present');
select is(
  (select count(*)::int from public.charges where student_id = (select id from ctx where name = 's2') and source = 'package'),
  2, 'la quinta clase compra otro paquete'
);
select is(
  (select sum(delta)::int from public.package_ledger where student_id = (select id from ctx where name = 's2')),
  3, 'el paquete nuevo deja 3 clases'
);
select public.renew_package((select id from ctx where name = 's2'));
select is(
  (select sum(delta)::int from public.package_ledger where student_id = (select id from ctx where name = 's2')),
  7, 'renovar suma las clases de otro paquete'
);
select throws_ok(
  format($$select public.renew_package(%L)$$, (select id from ctx where name = 's1')),
  '22023', 'not_a_package', 'solo se renueva un paquete'
);

-- ---------------------------------------------------------------------------
-- Mensualidades
-- ---------------------------------------------------------------------------
reset role;
update public.price_plans set starts_on = (now() at time zone 'America/Argentina/Buenos_Aires')::date - 100
  where student_id = (select id from ctx where name = 's3');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into ctx select 'gen', null;
select ok(public.generate_monthly_charges() >= 3, 'se generan las mensualidades de los meses transcurridos');
select ok(
  (select count(*) from public.charges where student_id = (select id from ctx where name = 's3') and source = 'monthly') >= 3,
  'cada mes tiene su cargo'
);
select is(public.generate_monthly_charges(), 0, 'generar de nuevo no duplica');
select is(
  (select count(distinct amount)::int from public.charges where student_id = (select id from ctx where name = 's3') and source = 'monthly'),
  1, 'todas las mensualidades son del monto del precio'
);
select is(
  (select count(*)::int from public.charges where student_id = (select id from ctx where name = 's3') and source = 'monthly' and extract(day from due_on) <> 1),
  0, 'vencen el día de cobro'
);

-- ---------------------------------------------------------------------------
-- Cargos a mano, pagos y «Cobrado»
-- ---------------------------------------------------------------------------
insert into ctx select 'm1', public.create_charge((select id from ctx where name = 's4'), 1000000, 'Clase de apoyo', '2027-03-01');
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'm1')),
  1000000, 'un cargo a mano a futuro queda por cobrar'
);
select throws_ok(
  format($$select public.create_charge(%L, 0, 'x', '2027-03-01')$$, (select id from ctx where name = 's4')),
  '23514', null, 'el monto del cargo tiene que ser positivo'
);

select public.record_payment((select id from ctx where name = 's4'), 400000, 'transfer', '2026-10-01', null, (select id from ctx where name = 'm1'));
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'm1')),
  600000, 'un pago parcial descuenta lo que falta'
);
select throws_ok(
  format($$select public.record_payment(%L, 700000, 'cash', '2026-10-01', null, %L)$$, (select id from ctx where name = 's4'), (select id from ctx where name = 'm1')),
  '22023', 'exceeds_charge', 'no se paga más de lo que le falta al cargo'
);
select throws_ok(
  format($$select public.record_payment(%L, 100000, 'bitcoin', '2026-10-01')$$, (select id from ctx where name = 's4')),
  '23514', null, 'el medio de pago tiene que ser uno de la lista'
);
select public.mark_charge_paid((select id from ctx where name = 'm1'), 'cash', '2026-10-02');
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'm1')),
  0, '«Cobrado» paga lo que falta'
);
select throws_ok(
  format($$select public.mark_charge_paid(%L, 'cash', '2026-10-02')$$, (select id from ctx where name = 'm1')),
  '22023', 'already_paid', 'un cargo pagado no se cobra de nuevo'
);

-- Un pago adelantado queda como saldo a favor y cubre el cargo que llega después.
select public.record_payment((select id from ctx where name = 's5'), 500000, 'transfer', '2026-10-03');
select is(
  (select sum(unallocated)::int from public.payment_balances where student_id = (select id from ctx where name = 's5')),
  500000, 'un pago sin cargo queda como saldo a favor'
);
insert into ctx select 'm2', public.create_charge((select id from ctx where name = 's5'), 800000, null, '2026-11-01');
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'm2')),
  300000, 'el saldo a favor cubre el cargo nuevo'
);
select is(
  (select sum(unallocated)::int from public.payment_balances where student_id = (select id from ctx where name = 's5')),
  0, 'el saldo a favor se usó entero'
);

-- Sin cargo indicado, el pago cubre primero lo más viejo.
insert into ctx select 'old', public.create_charge((select id from ctx where name = 's5'), 1000000, 'Viejo', '2026-01-01');
insert into ctx select 'new', public.create_charge((select id from ctx where name = 's5'), 1000000, 'Nuevo', '2026-02-01');
select public.record_payment((select id from ctx where name = 's5'), 1500000, 'cash', '2026-10-04');
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'old')),
  0, 'el pago cubre primero el cargo más viejo'
);
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'new')),
  500000, 'y lo que sobra, el siguiente'
);

-- Anular un cargo libera su dinero como saldo a favor.
select public.void_charge((select id from ctx where name = 'new'));
select is(
  (select status from public.charges where id = (select id from ctx where name = 'new')),
  'void', 'el cargo anulado queda marcado, no se borra'
);
select throws_ok(
  format($$select public.void_charge(%L)$$, (select id from ctx where name = 'new')),
  '22023', 'charge_void', 'un cargo anulado no se anula de nuevo'
);
select throws_ok(
  format($$select public.void_charge(%L)$$, (select id from charges where lesson_id = (select id from ctx where name = 'l1'))),
  '22023', 'lesson_charge', 'los cargos de clase se corrigen en la asistencia'
);
select is(
  (select sum(unallocated)::int from public.payment_balances where student_id = (select id from ctx where name = 's5')),
  200000, 'el dinero de un cargo anulado cubre otros pendientes y el resto queda a favor'
);

-- Deshacer un pago: queda anulado, no se borra, y el cargo vuelve a quedar pendiente.
insert into ctx select 'm3', public.create_charge((select id from ctx where name = 's4'), 700000, 'Otro', '2027-04-01');
insert into ctx select 'pay', public.mark_charge_paid((select id from ctx where name = 'm3'), 'cash', '2026-10-05');
select public.void_payment((select id from ctx where name = 'pay'));
select is(
  (select remaining from public.charge_balances where id = (select id from ctx where name = 'm3')),
  700000, 'al anular un pago el cargo vuelve a quedar pendiente'
);
select isnt(
  (select voided_at from public.payments where id = (select id from ctx where name = 'pay')),
  null, 'el pago anulado queda registrado, no se borra'
);
select is(
  (select unallocated from public.payment_balances where id = (select id from ctx where name = 'pay')),
  0, 'un pago anulado no deja saldo a favor'
);
select throws_ok(
  format($$select public.void_payment(%L)$$, (select id from ctx where name = 'pay')),
  '22023', 'payment_void', 'un pago anulado no se anula de nuevo'
);

-- ---------------------------------------------------------------------------
-- Aumento de precios
-- ---------------------------------------------------------------------------
select is(
  public.apply_price_changes(format('[{"studentId":"%s","amount":2000000}]', (select id from ctx where name = 's1'))::jsonb),
  1, 'el aumento se aplica a los alumnos elegidos'
);
select is(
  (select count(*)::int from public.price_plans where student_id = (select id from ctx where name = 's1')),
  2, 'el precio anterior queda en el historial'
);
select is(
  (select amount from public.price_plans where student_id = (select id from ctx where name = 's1') and ended_on is null),
  2000000, 'rige el precio nuevo'
);
select is(
  (select amount from public.charges where lesson_id = (select id from ctx where name = 'l1')),
  1800000, 'los cargos ya creados no cambian'
);
insert into ctx select 'l6', public.create_lesson('2026-09-10', '10:00', 60, array[(select id from ctx where name = 's1')]);
select public.set_attendance((select id from ctx where name = 'l6'), (select id from ctx where name = 's1'), 'present');
select is(
  (select amount from public.charges where lesson_id = (select id from ctx where name = 'l6')),
  2000000, 'los cargos nuevos usan el precio nuevo'
);
select throws_ok(
  format($$select public.apply_price_changes('[{"studentId":"%s","amount":0}]'::jsonb)$$, (select id from ctx where name = 's1')),
  '22023', 'invalid_amount', 'el monto nuevo tiene que ser positivo'
);

-- ---------------------------------------------------------------------------
-- Aislamiento entre organizaciones y escrituras directas
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select is(
  (select (select count(*) from public.charges) + (select count(*) from public.payments)
        + (select count(*) from public.payment_allocations) + (select count(*) from public.package_ledger)
        + (select count(*) from public.charge_balances) + (select count(*) from public.payment_balances))::int,
  0, 'B no ve cargos, pagos, asignaciones ni paquetes de A'
);
select throws_ok(
  format($$select public.record_payment(%L, 100000, 'cash', '2026-10-01')$$, (select id from ctx where name = 's1')),
  '42501', 'student_not_found', 'B no registra pagos de un alumno de A'
);
select throws_ok(
  format($$select public.create_charge(%L, 100000, 'x', '2026-10-01')$$, (select id from ctx where name = 's1')),
  '42501', 'student_not_found', 'B no crea cargos para un alumno de A'
);
select throws_ok(
  format($$select public.apply_price_changes('[{"studentId":"%s","amount":100}]'::jsonb)$$, (select id from ctx where name = 's1')),
  '42501', 'student_not_found', 'B no cambia el precio de un alumno de A'
);
select throws_ok(
  format($$select public.void_payment(%L)$$, (select id from ctx where name = 'pay')),
  '42501', 'payment_not_found', 'B no anula pagos de A'
);
select is(public.generate_monthly_charges(), 0, 'B no genera mensualidades de A');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.charges (org_id, student_id, source, amount, due_on)
    select org_id, student_id, 'manual', 100, now()::date from public.charges limit 1$$,
  '42501', null, 'no se insertan cargos directo'
);
select throws_ok(
  $$delete from public.payments$$,
  '42501', null, 'los pagos no se borran'
);

select * from finish();
rollback;
