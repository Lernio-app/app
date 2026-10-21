begin;
select plan(14);

-- Dos profes con su propio espacio.
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.test');

create temp table ctx (name text primary key, org_id uuid);
grant all on ctx to authenticated;

-- Profe A crea su espacio.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into ctx select 'a', public.create_workspace('Ana Inglés', 'Ana', array['Inglés'], array['Secundario']);

select is((select count(*)::int from public.organizations), 1, 'A ve su organización');
select is((select slug from public.organizations), 'ana-ingles', 'el slug sale del nombre, sin tildes');
select is((select count(*)::int from public.memberships where role = 'owner'), 1, 'A es dueña de su espacio');
select is((select count(*)::int from public.teacher_profiles), 1, 'se creó el perfil del profe');
select is((select count(*)::int from public.events where name = 'workspace_created'), 1, 'quedó el evento de alta');
select throws_ok(
  $$select public.create_workspace('Otro', 'Ana')$$,
  '23505', 'workspace_exists', 'un usuario no puede crear dos espacios'
);

-- Profe B no ve nada de A y crea el suyo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
select is((select count(*)::int from public.organizations), 0, 'B no ve la organización de A');
insert into ctx select 'b', public.create_workspace('Beto Música', 'Beto');
select is((select count(*)::int from public.organizations), 1, 'B ve solo la suya');
select is((select count(*)::int from public.teacher_profiles), 1, 'B ve solo su perfil');

-- B no puede escribir en el espacio de A.
select throws_ok(
  format($$insert into public.events (org_id, actor_type, actor_id, name) values (%L, 'teacher', %L, 'intruso')$$,
         (select org_id from ctx where name = 'a'), '00000000-0000-0000-0000-0000000000b2'),
  '42501', null, 'B no puede registrar eventos en la organización de A'
);
update public.organizations set name = 'Hackeada' where id = (select org_id from ctx where name = 'a');
select is((select count(*)::int from public.organizations where name = 'Hackeada'), 0, 'B no modifica la organización de A');

-- El dueño sí edita su espacio.
update public.organizations set late_cancel_hours = 12 where id = (select org_id from ctx where name = 'b');
select is((select late_cancel_hours from public.organizations), 12, 'el dueño edita la regla de cancelación');

-- Sin sesión no se accede a nada.
reset role;
set local role anon;
select throws_ok($$select count(*) from public.organizations$$, '42501', null, 'anon no lee organizaciones');
select throws_ok($$select public.create_workspace('X', 'X')$$, '42501', null, 'anon no puede crear espacios');

select * from finish();
rollback;
