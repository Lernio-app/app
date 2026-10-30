begin;
select plan(28);

insert into auth.users (id, instance_id, aud, role, email)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.test');

create temp table ctx (name text primary key, student_id uuid);
grant all on ctx to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Normalización (misma lógica que src/lib/phone.ts)
-- ---------------------------------------------------------------------------

select is(private.normalize_ar_phone('11 5555 1234'), '5491155551234', 'celular de Buenos Aires');
select is(private.normalize_ar_phone('011 15 5555-1234'), '5491155551234', 'con 0 y 15');
select is(private.normalize_ar_phone('+54 9 11 5555 1234'), '5491155551234', 'con +54 9');
select is(private.normalize_ar_phone('54 11 5555 1234'), '5491155551234', 'con 54');
select is(private.normalize_ar_phone('0351 15 555 1234'), '5493515551234', 'área de tres dígitos');
select is(private.normalize_ar_phone('5491155551234'), '5491155551234', 'normalizar de nuevo da lo mismo');
select is(private.normalize_ar_phone('1234'), null, 'un número corto no se entiende');
select is(private.normalize_ar_phone('abc'), null, 'sin dígitos no se entiende');
select is(private.normalize_ar_phone(null), null, 'null da null');

-- ---------------------------------------------------------------------------
-- Alta
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select public.create_workspace('Ana', 'Ana');

insert into ctx select 'adulto', r.student_id
from public.create_student('Ana Adulta', '011 15 5555-1234', p_subject => 'Otra') r;
select is(
  (select phone from public.students where id = (select student_id from ctx where name = 'adulto')),
  '5491155551234', 'el alta guarda el teléfono normalizado'
);

select throws_ok(
  $$select * from public.create_student('Sin Teléfono', p_subject => 'Otra')$$,
  '22023', 'phone_required', 'un adulto sin teléfono no se guarda'
);
select throws_ok(
  $$select * from public.create_student('Teléfono Vacío', '   ', p_subject => 'Otra')$$,
  '22023', 'phone_required', 'un teléfono en blanco cuenta como vacío'
);
select throws_ok(
  $$select * from public.create_student('Teléfono Roto', '1234', p_subject => 'Otra')$$,
  '22023', 'invalid_phone', 'un teléfono que no se entiende no se guarda'
);
select is((select count(*)::int from public.students), 1, 'las altas rechazadas no dejaron nada guardado');

-- Un adulto no puede apoyarse en el teléfono de su responsable de pago.
select throws_ok(
  $$select * from public.create_student(
    'Adulto con Pagador', p_subject => 'Otra', p_payer_name => 'Marta', p_payer_phone => '11 5555 0000'
  )$$,
  '22023', 'phone_required', 'el teléfono del responsable no reemplaza al del adulto'
);

-- Un menor: alcanza con el suyo o con el del responsable de pago.
insert into ctx select 'menor_propio', r.student_id
from public.create_student(
  'Menor con Teléfono', '11 5555 2222', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => true
) r;
select ok(
  (select phone is not null from public.students where id = (select student_id from ctx where name = 'menor_propio')),
  'un menor puede guardarse con teléfono propio y sin responsable'
);

insert into ctx select 'menor_pagador', r.student_id
from public.create_student(
  'Menor del Pagador', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => false,
  p_payer_name => 'Marta', p_payer_phone => '011 15 5555-0000'
) r;
select is(
  (select phone from public.students where id = (select student_id from ctx where name = 'menor_pagador')),
  null, 'un menor con el teléfono del responsable no necesita el propio'
);
select is(
  (select phone from public.student_contacts where student_id = (select student_id from ctx where name = 'menor_pagador')),
  '5491155550000', 'el teléfono del responsable también se guarda normalizado'
);

select throws_ok(
  $$select * from public.create_student(
    'Menor Sin Nada', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => false
  )$$,
  '22023', 'phone_required', 'un menor sin ningún teléfono no se guarda'
);
select throws_ok(
  $$select * from public.create_student(
    'Menor con Pagador sin Teléfono', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => false,
    p_payer_name => 'Marta'
  )$$,
  '22023', 'phone_required', 'el responsable sin teléfono no alcanza'
);
select throws_ok(
  $$select * from public.create_student(
    'Menor Pagador Roto', p_subject => 'Otra', p_is_minor => true, p_minor_13_plus => false,
    p_payer_name => 'Marta', p_payer_phone => '12'
  )$$,
  '22023', 'invalid_phone', 'el teléfono del responsable que no se entiende no se guarda'
);

-- ---------------------------------------------------------------------------
-- Edición
-- ---------------------------------------------------------------------------

update public.students set phone = '11 5555 9999'
where id = (select student_id from ctx where name = 'adulto');
select is(
  (select phone from public.students where id = (select student_id from ctx where name = 'adulto')),
  '5491155559999', 'al editar, el teléfono se guarda normalizado'
);

select throws_ok(
  $$update public.students set phone = null where id = (select student_id from ctx where name = 'adulto')$$,
  '22023', 'phone_required', 'a un adulto no se le puede sacar el teléfono'
);
select throws_ok(
  $$update public.students set phone = 'abc' where id = (select student_id from ctx where name = 'adulto')$$,
  '22023', 'invalid_phone', 'no se guarda un teléfono que no se entiende'
);
select throws_ok(
  $$update public.students set is_minor = false, minor_13_plus = null
    where id = (select student_id from ctx where name = 'menor_pagador')$$,
  '22023', 'phone_required', 'un menor sin teléfono propio no pasa a adulto sin cargarlo'
);

-- Archivar no toca el teléfono: no se vuelve a validar.
update public.students set archived_at = now() where id = (select student_id from ctx where name = 'adulto');
select ok(
  (select archived_at is not null from public.students where id = (select student_id from ctx where name = 'adulto')),
  'archivar a un alumno no exige volver a cargar el teléfono'
);

-- ---------------------------------------------------------------------------
-- Responsable de pago
-- ---------------------------------------------------------------------------

update public.student_contacts set phone = '11 5555 3333'
where student_id = (select student_id from ctx where name = 'menor_pagador');
select is(
  (select phone from public.student_contacts where student_id = (select student_id from ctx where name = 'menor_pagador')),
  '5491155553333', 'al editar al responsable, su teléfono se guarda normalizado'
);
select throws_ok(
  $$update public.student_contacts set phone = 'abc'
    where student_id = (select student_id from ctx where name = 'menor_pagador')$$,
  '22023', 'invalid_phone', 'no se guarda un teléfono del responsable que no se entiende'
);

select * from finish();
rollback;
