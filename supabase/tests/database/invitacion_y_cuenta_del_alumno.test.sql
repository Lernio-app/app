begin;
select plan(37);

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@example.test', '{}'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beto@example.test', '{}'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucia@example.test', '{}'),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mateo@example.test', '{"full_name":"Mateo Gómez"}');

create temp table ctx (name text primary key, id uuid, token text);
grant all on ctx to authenticated, anon;

-- Ana (profe A) con dos alumnos y Beto (profe B) con uno.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');
insert into ctx select 'lucia', r.student_id, r.token from public.create_student('Lucía Pérez', p_subject => 'Otra', p_notes => 'Nota privada') r;
insert into ctx select 'otro', r.student_id, r.token from public.create_student('Otro Alumno', p_subject => 'Otra') r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');
insert into ctx select 'beto', r.student_id, r.token from public.create_student('Alumno de Beto', p_subject => 'Otra') r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- Invitación vigente
-- ---------------------------------------------------------------------------
select is((select user_id from public.students where id = (select id from ctx where name = 'lucia')), null, 'el alumno nuevo figura pendiente de activación');
select is((select pending_expires_at > now() + interval '6 days' from public.student_link_info((select id from ctx where name = 'lucia'))), true, 'la invitación vale unos 7 días');
select is((select linked_email from public.student_link_info((select id from ctx where name = 'lucia'))), null, 'sin vínculo no hay email vinculado');

-- El profe no vincula a mano ni toca las invitaciones.
select throws_ok(
  format($$update public.students set user_id = '00000000-0000-0000-0000-0000000000c3' where id = %L$$, (select id from ctx where name = 'lucia')),
  '42501', null, 'el profe no vincula una cuenta con un update directo'
);
select throws_ok($$select count(*) from public.student_invitations$$, '42501', null, 'el profe no lee las invitaciones directo');

-- ---------------------------------------------------------------------------
-- Lo que ve quien abre la invitación
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select is(
  (select status from public.invitation_by_token((select token from ctx where name = 'lucia'))),
  'valid', 'sin sesión se ve que la invitación está vigente'
);
select is(
  (select teacher_name from public.invitation_by_token((select token from ctx where name = 'lucia'))),
  'Ana', 'y de qué profe es'
);
select is((select count(*)::int from public.invitation_by_token('inventado')), 0, 'un token inventado no devuelve nada');
select throws_ok(
  format($$select public.accept_student_invitation(%L)$$, (select token from ctx where name = 'lucia')),
  '42501', null, 'sin sesión no se activa nada'
);

-- ---------------------------------------------------------------------------
-- Activación
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.student_profiles), 0, 'antes de activar la cuenta no tiene perfil de alumno');
select is((select count(*)::int from public.students), 0, 'ni ve alumnos');

select is(
  public.accept_student_invitation((select token from ctx where name = 'lucia')),
  (select id from ctx where name = 'lucia'), 'activar devuelve la ficha vinculada'
);
select is((select count(*)::int from public.student_profiles), 1, 'se crea la persona alumna');
select is((select display_name from public.student_profiles), 'Lucía Pérez', 'con el nombre de la ficha');
select is((select user_id from public.students), '00000000-0000-0000-0000-0000000000c3'::uuid, 'la ficha queda vinculada a la cuenta');
select is((select count(*)::int from public.students), 1, 'la cuenta ve solo su ficha');
select is(
  (select public.accept_student_invitation((select token from ctx where name = 'lucia'))),
  (select id from ctx where name = 'lucia'), 'abrir de nuevo la misma invitación con la misma cuenta no falla'
);

-- Lo que la cuenta no puede leer: notas del profe, contactos y fichas ajenas.
select is((select count(*)::int from public.student_notes), 0, 'no lee las notas del profe');
select is((select count(*)::int from public.student_contacts), 0, 'no lee a los responsables de pago');
select throws_ok($$select count(*) from public.student_invitations$$, '42501', null, 'ni las invitaciones');
select is((select count(*)::int from public.my_student_links()), 1, 'my_student_links lista su vínculo');
select is((select teacher_name from public.my_student_links()), 'Ana', 'con el nombre del profe');
update public.students set full_name = 'Hackeado';
select is((select full_name from public.students), 'Lucía Pérez', 'no edita su ficha: eso es del profe');

-- ---------------------------------------------------------------------------
-- Una invitación se usa una vez
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
select throws_ok(
  format($$select public.accept_student_invitation(%L)$$, (select token from ctx where name = 'lucia')),
  '22023', 'invitation_used', 'otra cuenta no reutiliza una invitación ya usada'
);
select throws_ok(
  $$select public.accept_student_invitation('inventado')$$,
  '22023', 'invitation_not_found', 'un token inventado no activa nada'
);

-- Vencida: no se activa.
reset role;
update public.student_invitations set expires_at = now() - interval '1 minute'
  where student_id = (select id from ctx where name = 'otro');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
select is(
  (select status from public.invitation_by_token((select token from ctx where name = 'otro'))),
  'expired', 'una invitación vencida figura vencida'
);
select throws_ok(
  format($$select public.accept_student_invitation(%L)$$, (select token from ctx where name = 'otro')),
  '22023', 'invitation_expired', 'una invitación vencida no activa la cuenta'
);

-- Mateo se registra solo: tiene cuenta sin profe.
select public.ensure_student_profile();
select is((select display_name from public.student_profiles), 'Mateo Gómez', 'el registro propio toma el nombre del ingreso');
select is((select count(*)::int from public.my_student_links()), 0, 'sin profe todavía');

-- ---------------------------------------------------------------------------
-- El profe: ve el vínculo, genera otra invitación, lo deshace
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(
  (select linked_email from public.student_link_info((select id from ctx where name = 'lucia'))),
  'lucia@example.test', 'el profe ve con qué email quedó vinculado'
);
select throws_ok(
  format($$select public.issue_student_invitation(%L)$$, (select id from ctx where name = 'lucia')),
  '22023', 'already_linked', 'no se invita a quien ya está vinculado'
);

-- Una invitación nueva reemplaza a la vencida y deja de abrir la anterior.
update ctx set token = (select public.issue_student_invitation((select id from ctx where name = 'otro'))) where name = 'otro';
select is(
  (select status from public.invitation_by_token((select token from ctx where name = 'otro'))),
  'valid', 'la invitación nueva está vigente'
);

select public.unlink_student((select id from ctx where name = 'lucia'));
select is((select user_id from public.students where id = (select id from ctx where name = 'lucia')), null, 'el profe deshace el vínculo');
update ctx set token = (select public.issue_student_invitation((select id from ctx where name = 'lucia'))) where name = 'lucia';

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is((select count(*)::int from public.students), 0, 'sin vínculo la cuenta deja de ver la ficha');
select is((select count(*)::int from public.student_profiles), 1, 'pero conserva su cuenta de alumno');

-- ---------------------------------------------------------------------------
-- Aislamiento entre profes
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select throws_ok(
  format($$select public.unlink_student(%L)$$, (select id from ctx where name = 'lucia')),
  '42501', 'student_not_found', 'B no deshace vínculos de alumnos de A'
);
select throws_ok(
  format($$select * from public.student_link_info(%L)$$, (select id from ctx where name = 'lucia')),
  '42501', 'student_not_found', 'B no ve el email vinculado de un alumno de A'
);

select * from finish();
rollback;
