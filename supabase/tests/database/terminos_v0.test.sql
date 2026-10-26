begin;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

create temp table ctx (name text primary key, at timestamptz);
grant all on ctx to authenticated, anon;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is((select count(*)::int from public.legal_acceptances), 0, 'al empezar nadie aceptó nada');

select public.accept_legal('0');
select is(
  (select count(*)::int from public.legal_acceptances where version = '0'),
  2, 'aceptar guarda los términos y la privacidad'
);
select is(
  (select array_agg(document order by document) from public.legal_acceptances),
  array['privacy', 'terms'], 'quedan los dos documentos'
);

-- Repetir la aceptación no duplica ni cambia la fecha.
insert into ctx select 'first', min(accepted_at) from public.legal_acceptances;
select public.accept_legal('0');
select is((select count(*)::int from public.legal_acceptances), 2, 'aceptar de nuevo la misma versión no duplica');
select is(
  (select min(accepted_at) from public.legal_acceptances),
  (select at from ctx where name = 'first'), 'se conserva la primera fecha'
);

-- Una versión nueva se suma al historial.
select public.accept_legal('1');
select is((select count(*)::int from public.legal_acceptances), 4, 'cada versión aceptada queda en el historial');

select throws_ok($$select public.accept_legal('v1')$$, '23514', null, 'la versión tiene que ser un número');

-- Es solo para agregar: el cliente no escribe directo.
select throws_ok(
  $$insert into public.legal_acceptances (user_id, document, version)
    values ('00000000-0000-0000-0000-0000000000a1', 'terms', '9')$$,
  '42501', null, 'no se inserta directo'
);
select throws_ok($$update public.legal_acceptances set version = '9'$$, '42501', null, 'no se edita');

-- Cada cuenta ve solo lo suyo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.legal_acceptances), 0, 'B no ve lo que aceptó A');

-- Sin sesión no se acepta ni se lee.
reset role;
set local role anon;
select throws_ok($$select public.accept_legal('0')$$, '42501', null, 'sin sesión no se acepta');

select * from finish();
rollback;
