begin;
select plan(6);

set local role anon;

select lives_ok(
  $$select public.submit_contact_message('Ana', 'ana@example.test', 'profe', 'Quiero saber si sirve para grupos.', repeat('a', 64))$$,
  'un anónimo puede mandar un mensaje'
);

select throws_ok(
  $$select count(*) from public.contact_messages$$,
  '42501', null, 'un anónimo no puede leer los mensajes'
);

select throws_ok(
  $$select public.submit_contact_message('Ana', 'ana@example.test', 'cualquiera', 'Quiero saber si sirve para grupos.', repeat('a', 64))$$,
  '23514', null, 'el motivo tiene que ser uno de la lista'
);

select throws_ok(
  $$select public.submit_contact_message('Ana', 'ana@example.test', 'profe', 'corto', repeat('a', 64))$$,
  '23514', null, 'el mensaje tiene un mínimo'
);

-- Dos más llegan al límite de 3 por hora: el cuarto se frena por email y por huella de red.
select public.submit_contact_message('Ana', 'ana@example.test', 'otro', 'Segundo mensaje de prueba.', repeat('a', 64));
select public.submit_contact_message('Ana', 'ANA@example.test', 'otro', 'Tercer mensaje de prueba.', repeat('a', 64));
select throws_ok(
  $$select public.submit_contact_message('Ana', 'ana@example.test', 'otro', 'Cuarto mensaje de prueba.', repeat('c', 64))$$,
  'P0001', 'rate_limited', 'el cuarto mensaje en una hora se frena por email'
);
select throws_ok(
  $$select public.submit_contact_message('Otra', 'otra@example.test', 'otro', 'Mensaje desde la misma red.', repeat('a', 64))$$,
  'P0001', 'rate_limited', 'y se frena por huella de red'
);

select * from finish();
rollback;
