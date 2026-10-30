begin;
select plan(44);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beto@example.test'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'menor@example.test'),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adulto@example.test');

create temp table ctx (name text primary key, id uuid, token text);
grant all on ctx to authenticated, anon;

-- Ana: un adulto, un menor de 13 o más con responsable, uno de menos de 13 y otro de 13 o más sin responsable.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');
insert into ctx select 'adulto', r.student_id, r.token from public.create_student('Adulto Gómez', p_phone => '1155551234', p_subject => 'Otra') r;
insert into ctx select 'teen', r.student_id, r.token from public.create_student(
  'Teo Pérez', p_phone => '1155551234', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => true,
  p_payer_name => 'Marta Pérez', p_payer_relation => 'Madre', p_payer_phone => '1155550000'
) r;
insert into ctx select 'kid', r.student_id, r.token from public.create_student(
  'Kiki Pérez', p_phone => '1155551234', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => false,
  p_payer_name => 'Marta Pérez'
) r;
insert into ctx select 'sinresp', r.student_id, r.token from public.create_student(
  'Sin Responsable', p_phone => '1155551234', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => true
) r;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select public.create_workspace('Beto', 'Beto');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

-- ---------------------------------------------------------------------------
-- El alta
-- ---------------------------------------------------------------------------
select isnt((select token from ctx where name = 'adulto'), null, 'un adulto recibe su invitación al cargarlo');
select is((select token from ctx where name = 'teen'), null, 'un menor no recibe invitación al cargarlo');
select is((select token from ctx where name = 'kid'), null, 'tampoco uno de menos de 13');
select is((select is_minor from public.students where id = (select id from ctx where name = 'teen')), true, 'queda marcado como menor');
select is((select minor_13_plus from public.students where id = (select id from ctx where name = 'teen')), true, 'con su franja de edad');
select throws_ok(
  $$select * from public.create_student('Sin Edad', p_phone => '1155551234', p_subject => 'Otra', p_is_minor => true)$$,
  '23514', null, 'un menor necesita decir si tiene 13 años o más'
);
select throws_ok(
  $$update public.students set minor_13_plus = true where id = (select id from public.students where full_name = 'Adulto Gómez')$$,
  '23514', null, 'la franja de edad solo va con la marca de menor'
);

-- ---------------------------------------------------------------------------
-- Sin consentimiento no hay invitación
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$select public.issue_student_invitation(%L)$$, (select id from ctx where name = 'teen')),
  '22023', 'consent_required', 'un menor de 13 o más necesita el consentimiento antes de la invitación'
);
select throws_ok(
  format($$select public.issue_student_invitation(%L)$$, (select id from ctx where name = 'kid')),
  '22023', 'minor_under_13', 'uno de menos de 13 no tiene cuenta'
);

-- ---------------------------------------------------------------------------
-- Pedir el consentimiento
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$select public.request_minor_consent(%L)$$, (select id from ctx where name = 'adulto')),
  '22023', 'not_minor', 'no se pide consentimiento por un adulto'
);
select throws_ok(
  format($$select public.request_minor_consent(%L)$$, (select id from ctx where name = 'kid')),
  '22023', 'minor_under_13', 'ni por uno de menos de 13'
);
select throws_ok(
  format($$select public.request_minor_consent(%L)$$, (select id from ctx where name = 'sinresp')),
  '22023', 'no_payer', 'sin responsable de pago no hay a quién pedírselo'
);
select is((select consent_status from public.student_consent_info((select id from ctx where name = 'teen'))), 'none', 'antes del pedido no hay nada');

update ctx set token = (select public.request_minor_consent((select id from ctx where name = 'teen'))) where name = 'teen';
select is((select length(token) from ctx where name = 'teen'), 64, 'el pedido devuelve un token largo');
select is((select consent_status from public.student_consent_info((select id from ctx where name = 'teen'))), 'pending', 'queda pendiente');
select is((select payer_name from public.student_consent_info((select id from ctx where name = 'teen'))), 'Marta Pérez', 'con el nombre de quien tiene que darlo');
select throws_ok($$select count(*) from public.minor_consents$$, '42501', null, 'el profe no lee los consentimientos directo');

reset role;
select is(
  (select count(*)::int from public.minor_consents where token_hash = (select token from ctx where name = 'teen')),
  0, 'la base no guarda el token en claro'
);

-- ---------------------------------------------------------------------------
-- El responsable de pago, sin cuenta
-- ---------------------------------------------------------------------------
set local role anon;
select is((select status from public.consent_by_token((select token from ctx where name = 'teen'))), 'valid', 'el link vigente se puede abrir sin cuenta');
select is((select student_name from public.consent_by_token((select token from ctx where name = 'teen'))), 'Teo Pérez', 'dice por quién es');
select is((select count(*)::int from public.consent_by_token('inventado')), 0, 'un token inventado no devuelve nada');
select throws_ok(
  format($$select public.give_minor_consent(%L, '0', 'no-es-un-email')$$, (select token from ctx where name = 'teen')),
  '22023', 'invalid_email', 'el email del menor tiene que parecer un email'
);
select throws_ok(
  format($$select public.give_minor_consent(%L, 'abc')$$, (select token from ctx where name = 'teen')),
  '22023', 'invalid_version', 'la versión de los términos tiene que ser un número'
);
select public.give_minor_consent((select token from ctx where name = 'teen'), '0', ' Teo@Example.test ');
select is((select status from public.consent_by_token((select token from ctx where name = 'teen'))), 'given', 'queda dado');
select public.give_minor_consent((select token from ctx where name = 'teen'), '1');

reset role;
select is(
  (select array[legal_version, minor_email] from public.minor_consents where student_id = (select id from ctx where name = 'teen')),
  array['0', 'teo@example.test'], 'queda la versión de los términos y el email, y darlo de nuevo no cambia nada'
);

-- ---------------------------------------------------------------------------
-- Con consentimiento, el profe invita y el menor activa su cuenta
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select consent_status from public.student_consent_info((select id from ctx where name = 'teen'))), 'given', 'el profe ve que lo dieron');
select throws_ok(
  format($$select public.request_minor_consent(%L)$$, (select id from ctx where name = 'teen')),
  '22023', 'consent_given', 'no se pide de nuevo un consentimiento vigente'
);
insert into ctx select 'teen_inv', null, public.issue_student_invitation((select id from ctx where name = 'teen'));
select is((select status from public.invitation_by_token((select token from ctx where name = 'teen_inv'))), 'valid', 'ahora sí hay invitación vigente');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is(
  public.accept_student_invitation((select token from ctx where name = 'teen_inv')),
  (select id from ctx where name = 'teen'), 'el menor activa su cuenta con otro email que el cargado'
);

-- ---------------------------------------------------------------------------
-- Retirar el consentimiento
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select public.revoke_minor_consent((select token from ctx where name = 'teen'));
select is((select status from public.consent_by_token((select token from ctx where name = 'teen'))), 'revoked', 'el link queda retirado');
select throws_ok(
  format($$select public.give_minor_consent(%L, '0')$$, (select token from ctx where name = 'teen')),
  '22023', 'consent_revoked', 'un consentimiento retirado no se vuelve a dar con el mismo link'
);

reset role;
select is((select user_id from public.students where id = (select id from ctx where name = 'teen')), null, 'la cuenta del menor deja de estar vinculada');
select is(
  (select count(*)::int from public.student_profiles where user_id = '00000000-0000-0000-0000-0000000000c3'),
  1, 'pero conserva su cuenta de alumno'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select consent_status from public.student_consent_info((select id from ctx where name = 'teen'))), 'revoked', 'el profe ve que lo retiraron');
select throws_ok(
  format($$select public.issue_student_invitation(%L)$$, (select id from ctx where name = 'teen')),
  '22023', 'consent_required', 'sin consentimiento vigente no se vuelve a invitar'
);
update ctx set token = (select public.request_minor_consent((select id from ctx where name = 'teen'))) where name = 'teen';
select is((select consent_status from public.student_consent_info((select id from ctx where name = 'teen'))), 'pending', 'el profe puede pedirlo de nuevo');

-- Un pedido vencido no se puede dar.
reset role;
update public.minor_consents set expires_at = now() - interval '1 minute'
  where student_id = (select id from ctx where name = 'teen') and revoked_at is null;
set local role anon;
select is((select status from public.consent_by_token((select token from ctx where name = 'teen'))), 'expired', 'un pedido vencido figura vencido');
select throws_ok(
  format($$select public.give_minor_consent(%L, '0')$$, (select token from ctx where name = 'teen')),
  '22023', 'consent_expired', 'y no se puede dar');

-- ---------------------------------------------------------------------------
-- Marcar como menor a un alumno ya vinculado (ADR-0012 #4)
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}', true);
select public.accept_student_invitation((select token from ctx where name = 'adulto'));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  format($$update public.students set is_minor = true, minor_13_plus = true where id = %L$$, (select id from ctx where name = 'adulto')),
  '22023', 'student_linked', 'no se marca como menor a un alumno ya vinculado'
);
select public.unlink_student((select id from ctx where name = 'adulto'));
update public.students set is_minor = true, minor_13_plus = true where id = (select id from ctx where name = 'adulto');
select is((select is_minor from public.students where id = (select id from ctx where name = 'adulto')), true, 'deshecho el vínculo, se lo puede marcar');

-- Al pasar a menor, la invitación pendiente deja de valer.
insert into ctx select 'otro', r.student_id, r.token from public.create_student('Otro Adulto', p_phone => '1155551234', p_subject => 'Otra') r;
update public.students set is_minor = true, minor_13_plus = true where id = (select id from ctx where name = 'otro');
select is((select status from public.invitation_by_token((select token from ctx where name = 'otro'))), 'unavailable', 'la invitación pendiente de quien pasa a ser menor queda sin efecto');

-- ---------------------------------------------------------------------------
-- Aislamiento
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select throws_ok(
  format($$select public.request_minor_consent(%L)$$, (select id from ctx where name = 'teen')),
  '42501', 'student_not_found', 'B no pide consentimiento por un alumno de A'
);
select throws_ok(
  format($$select * from public.student_consent_info(%L)$$, (select id from ctx where name = 'teen')),
  '42501', 'student_not_found', 'B no ve el consentimiento de un alumno de A'
);

reset role;
set local role anon;
select throws_ok($$select count(*) from public.minor_consents$$, '42501', null, 'sin sesión no se leen los consentimientos');

select * from finish();
rollback;
