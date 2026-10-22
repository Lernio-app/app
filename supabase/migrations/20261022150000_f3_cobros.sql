-- F3 Cobros: cargos (por clase, paquete, mes o manuales), pagos a mano, asignaciones de pagos a
-- cargos y saldo de paquetes. Los pagos nunca se borran. Los totales no se guardan: deuda, vencido y
-- estadísticas se calculan desde cargos y pagos. El cobro al alumno ocurre fuera de la app.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id),
  source text not null check (source in ('lesson', 'package', 'monthly', 'manual')),
  lesson_id uuid references public.lessons (id),
  period text check (period is null or period ~ '^\d{4}-\d{2}$'),
  description text check (description is null or char_length(description) <= 200),
  amount integer not null check (amount > 0),
  due_on date not null,
  status text not null default 'active' check (status in ('active', 'void')),
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  check (source <> 'lesson' or lesson_id is not null),
  check (source <> 'monthly' or period is not null)
);
create index charges_org_due_idx on public.charges (org_id, due_on);
create index charges_student_idx on public.charges (student_id);
-- Una clase genera un solo cargo por alumno, y un mes genera una sola mensualidad.
create unique index charges_one_per_lesson
  on public.charges (lesson_id, student_id) where source = 'lesson';
create unique index charges_one_per_period
  on public.charges (student_id, period) where source = 'monthly';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id),
  amount integer not null check (amount > 0),
  method text not null check (method in ('transfer', 'cash', 'mercadopago', 'other')),
  paid_on date not null,
  reference text check (reference is null or char_length(reference) <= 200),
  recorded_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index payments_org_paid_idx on public.payments (org_id, paid_on);
create index payments_student_idx on public.payments (student_id);

-- Qué cargos cubre cada pago. Un pago puede cubrir varios cargos y un cargo recibir varios pagos.
create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  payment_id uuid not null references public.payments (id),
  charge_id uuid not null references public.charges (id),
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index payment_allocations_payment_idx on public.payment_allocations (payment_id);
create index payment_allocations_charge_idx on public.payment_allocations (charge_id);

-- Clases disponibles de cada paquete: +N al comprarlo, -1 por cada clase que se cobra.
create table public.package_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  student_id uuid not null references public.students (id),
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('purchase', 'lesson')),
  charge_id uuid references public.charges (id),
  lesson_id uuid references public.lessons (id),
  created_at timestamptz not null default now()
);
create index package_ledger_student_idx on public.package_ledger (student_id);
create unique index package_ledger_one_per_lesson
  on public.package_ledger (lesson_id, student_id) where reason = 'lesson';

-- ---------------------------------------------------------------------------
-- Vistas: cuánto se pagó de cada cargo y cuánto queda libre de cada pago
-- ---------------------------------------------------------------------------

create view public.charge_balances with (security_invoker = true) as
select
  c.id, c.org_id, c.student_id, c.source, c.lesson_id, c.period, c.description,
  c.amount, c.due_on, c.status, c.created_at,
  coalesce(a.paid, 0)::integer as paid,
  (c.amount - coalesce(a.paid, 0))::integer as remaining
from public.charges c
left join (
  select charge_id, sum(amount) as paid from public.payment_allocations group by charge_id
) a on a.charge_id = c.id;

create view public.payment_balances with (security_invoker = true) as
select
  p.id, p.org_id, p.student_id, p.amount, p.method, p.paid_on, p.reference, p.created_at,
  (p.amount - coalesce(a.used, 0))::integer as unallocated
from public.payments p
left join (
  select payment_id, sum(amount) as used from public.payment_allocations group by payment_id
) a on a.payment_id = p.id;

-- ---------------------------------------------------------------------------
-- RLS: solo lectura directa; todo se escribe por las funciones de abajo
-- ---------------------------------------------------------------------------

alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.package_ledger enable row level security;

revoke all on public.charges, public.payments, public.payment_allocations, public.package_ledger
  from anon, authenticated;
revoke all on public.charge_balances, public.payment_balances from anon, authenticated;
grant select on public.charges, public.payments, public.payment_allocations, public.package_ledger
  to authenticated;
grant select on public.charge_balances, public.payment_balances to authenticated;

create policy charges_select on public.charges
  for select to authenticated using ((select private.is_org_member(org_id)));
create policy payments_select on public.payments
  for select to authenticated using ((select private.is_org_member(org_id)));
create policy payment_allocations_select on public.payment_allocations
  for select to authenticated using ((select private.is_org_member(org_id)));
create policy package_ledger_select on public.package_ledger
  for select to authenticated using ((select private.is_org_member(org_id)));

-- ---------------------------------------------------------------------------
-- Utilidades internas
-- ---------------------------------------------------------------------------

-- Precio de un alumno que rige en un día: el vigente ese día; si no hay (una clase anterior a que se
-- cargara el precio), el vigente hoy.
create or replace function private.plan_at(p_student_id uuid, p_on date)
returns setof public.price_plans
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.price_plans p
  where p.student_id = p_student_id
  order by
    (p.starts_on <= p_on and (p.ended_on is null or p.ended_on >= p_on)) desc,
    (p.ended_on is null) desc,
    p.starts_on desc,
    p.created_at desc
  limit 1;
$$;
revoke all on function private.plan_at(uuid, date) from public, anon, authenticated;

-- Aplica los pagos con saldo libre a los cargos pendientes, del más viejo al más nuevo.
-- Se llama después de crear un pago o un cargo, así el saldo a favor cubre solo los cargos nuevos.
create or replace function private.settle_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pay record;
  v_charge record;
  v_amount integer;
begin
  loop
    select pb.id, pb.org_id, pb.unallocated into v_pay
    from public.payment_balances pb
    where pb.student_id = p_student_id and pb.unallocated > 0
    order by pb.paid_on, pb.created_at
    limit 1;
    exit when not found;

    select cb.id, cb.remaining into v_charge
    from public.charge_balances cb
    where cb.student_id = p_student_id and cb.status = 'active' and cb.remaining > 0
    order by cb.due_on, cb.created_at
    limit 1;
    exit when not found;

    v_amount := least(v_pay.unallocated, v_charge.remaining);
    insert into public.payment_allocations (org_id, payment_id, charge_id, amount)
    values (v_pay.org_id, v_pay.id, v_charge.id, v_amount);
  end loop;
end;
$$;
revoke all on function private.settle_student(uuid) from public, anon, authenticated;

-- Compra un paquete: crea su cargo y suma sus clases al saldo.
create or replace function private.buy_package(
  p_org_id uuid,
  p_student_id uuid,
  p_plan public.price_plans,
  p_due_on date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_charge uuid;
begin
  if p_plan.amount > 0 then
    insert into public.charges (org_id, student_id, source, description, amount, due_on)
    values (
      p_org_id, p_student_id, 'package',
      'Paquete de ' || p_plan.lessons_per_package || ' clases',
      p_plan.amount, p_due_on
    )
    returning id into v_charge;
  end if;

  insert into public.package_ledger (org_id, student_id, delta, reason, charge_id)
  values (p_org_id, p_student_id, p_plan.lessons_per_package, 'purchase', v_charge);
end;
$$;
revoke all on function private.buy_package(uuid, uuid, public.price_plans, date)
  from public, anon, authenticated;

-- Deja el cargo de una clase como corresponde a su asistencia y a si se cobra:
--   - por clase: un cargo con el precio de ese día (se anula si la clase deja de cobrarse);
--   - por paquete: descuenta una clase del saldo y, si no quedaban, compra un paquete nuevo;
--   - por mes o sin precio: la clase no genera cargo.
-- Una clase se cobra si el asistente es cobrable y se marcó su asistencia, o si la canceló el alumno.
create or replace function private.sync_lesson_charge(p_lesson_id uuid, p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lesson public.lessons;
  v_att public.lesson_attendees;
  v_tz text;
  v_day date;
  v_plan public.price_plans;
  v_chargeable boolean;
  v_balance integer;
begin
  select l.* into v_lesson from public.lessons l where l.id = p_lesson_id;
  if v_lesson.id is null then
    return;
  end if;
  select a.* into v_att
  from public.lesson_attendees a
  where a.lesson_id = p_lesson_id and a.student_id = p_student_id;

  select o.timezone into v_tz from public.organizations o where o.id = v_lesson.org_id;
  v_day := (v_lesson.starts_at at time zone v_tz)::date;

  v_chargeable := v_att.lesson_id is not null and v_att.billable and (
    (v_lesson.status = 'scheduled' and v_att.attendance is not null)
    or (v_lesson.status = 'cancelled' and v_lesson.cancelled_by = 'student')
  );

  if not v_chargeable then
    update public.charges
    set status = 'void', voided_at = now()
    where lesson_id = p_lesson_id and student_id = p_student_id
      and source = 'lesson' and status = 'active';

    -- Un cargo anulado deja de tener pagos asignados: ese dinero vuelve a ser saldo a favor.
    delete from public.payment_allocations pa
    using public.charges c
    where pa.charge_id = c.id
      and c.lesson_id = p_lesson_id and c.student_id = p_student_id
      and c.source = 'lesson' and c.status = 'void';

    delete from public.package_ledger
    where lesson_id = p_lesson_id and student_id = p_student_id and reason = 'lesson';
  else
    select * into v_plan from private.plan_at(p_student_id, v_day);

    if v_plan.id is not null and v_plan.amount > 0 then
      if v_plan.mode = 'per_lesson' then
        insert into public.charges (org_id, student_id, source, lesson_id, amount, due_on)
        values (v_lesson.org_id, p_student_id, 'lesson', p_lesson_id, v_plan.amount, v_day)
        on conflict (lesson_id, student_id) where source = 'lesson'
        do update set
          status = 'active', voided_at = null, amount = excluded.amount, due_on = excluded.due_on
        where public.charges.status = 'void';
      elsif v_plan.mode = 'package' then
        if not exists (
          select 1 from public.package_ledger g
          where g.lesson_id = p_lesson_id and g.student_id = p_student_id and g.reason = 'lesson'
        ) then
          select coalesce(sum(g.delta), 0) into v_balance
          from public.package_ledger g where g.student_id = p_student_id;
          if v_balance <= 0 then
            perform private.buy_package(v_lesson.org_id, p_student_id, v_plan, v_day);
          end if;
          insert into public.package_ledger (org_id, student_id, delta, reason, lesson_id)
          values (v_lesson.org_id, p_student_id, -1, 'lesson', p_lesson_id);
        end if;
      end if;
    end if;
  end if;

  perform private.settle_student(p_student_id);
end;
$$;
revoke all on function private.sync_lesson_charge(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funciones de la agenda (F2), ahora con su cargo
-- ---------------------------------------------------------------------------

create or replace function public.set_attendance(
  p_lesson_id uuid,
  p_student_id uuid,
  p_attendance text default null,
  p_billable boolean default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_lesson public.lessons;
  v_late_hours integer;
  v_billable boolean;
begin
  if p_attendance is not null and p_attendance not in ('present', 'absent', 'late', 'excused') then
    raise exception 'invalid_attendance' using errcode = '22023';
  end if;

  select l.* into v_lesson
  from public.lessons l
  where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null;
  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;
  if v_lesson.status = 'cancelled' then
    raise exception 'lesson_cancelled' using errcode = '22023';
  end if;

  select o.late_cancel_hours into v_late_hours from public.organizations o where o.id = v_org;

  v_billable := coalesce(
    p_billable,
    case
      when p_attendance = 'excused' then
        now() < v_lesson.starts_at
        and (v_lesson.starts_at - now()) < make_interval(hours => v_late_hours)
      else true
    end
  );

  update public.lesson_attendees
  set attendance = p_attendance,
      billable = v_billable,
      marked_at = case when p_attendance is null then null else now() end
  where lesson_id = p_lesson_id and student_id = p_student_id;
  if not found then
    raise exception 'attendee_not_found' using errcode = '42501';
  end if;

  perform private.sync_lesson_charge(p_lesson_id, p_student_id);

  if p_attendance is not null then
    insert into public.events (org_id, actor_type, actor_id, name, props)
    values (v_org, 'teacher', v_user, 'attendance_marked', jsonb_build_object('attendance', p_attendance));
  end if;

  return v_billable;
end;
$$;

create or replace function public.cancel_lesson(
  p_lesson_id uuid,
  p_by text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_lesson public.lessons;
  v_late boolean;
  v_student uuid;
begin
  if p_by not in ('teacher', 'student') then
    raise exception 'invalid_cancelled_by' using errcode = '22023';
  end if;

  select l.* into v_lesson
  from public.lessons l
  where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null
  for update;
  if v_lesson.id is null then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;
  if v_lesson.status = 'cancelled' then
    raise exception 'lesson_cancelled' using errcode = '22023';
  end if;

  select (v_lesson.starts_at - now()) < make_interval(hours => o.late_cancel_hours)
  into v_late
  from public.organizations o
  where o.id = v_org;

  update public.lessons
  set status = 'cancelled',
      cancelled_by = p_by,
      cancelled_at = now(),
      cancel_reason = nullif(btrim(p_reason), '')
  where id = p_lesson_id;

  update public.lesson_attendees
  set billable = (p_by = 'student' and coalesce(v_late, false))
  where lesson_id = p_lesson_id;

  for v_student in select a.student_id from public.lesson_attendees a where a.lesson_id = p_lesson_id loop
    perform private.sync_lesson_charge(p_lesson_id, v_student);
  end loop;

  insert into public.events (org_id, actor_type, actor_id, name, props)
  values (v_org, 'teacher', v_user, 'lesson_cancelled', jsonb_build_object('by', p_by));
end;
$$;

create or replace function public.restore_lesson(p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_student uuid;
begin
  update public.lessons
  set status = 'scheduled', cancelled_by = null, cancelled_at = null, cancel_reason = null
  where id = p_lesson_id and org_id = v_org and archived_at is null and status = 'cancelled';
  if not found then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;

  update public.lesson_attendees set billable = true where lesson_id = p_lesson_id;

  for v_student in select a.student_id from public.lesson_attendees a where a.lesson_id = p_lesson_id loop
    perform private.sync_lesson_charge(p_lesson_id, v_student);
  end loop;
end;
$$;

create or replace function public.set_lesson_students(p_lesson_id uuid, p_student_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_ids uuid[];
  v_student uuid;
begin
  if not exists (
    select 1 from public.lessons l
    where l.id = p_lesson_id and l.org_id = v_org and l.archived_at is null
  ) then
    raise exception 'lesson_not_found' using errcode = '42501';
  end if;

  v_ids := private.check_students(v_org, p_student_ids);

  insert into public.lesson_attendees (lesson_id, student_id, org_id)
  select p_lesson_id, x, v_org from unnest(v_ids) as x
  on conflict (lesson_id, student_id) do nothing;

  -- Quien sale de la clase deja de deberla (p. ej. una cancelación tardía que ya no corresponde).
  for v_student in
    delete from public.lesson_attendees a
    where a.lesson_id = p_lesson_id
      and a.student_id <> all (v_ids)
      and a.attendance is null
    returning a.student_id
  loop
    perform private.sync_lesson_charge(p_lesson_id, v_student);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones públicas de cobros
-- ---------------------------------------------------------------------------

-- Cargo a mano, con fecha de vencimiento. Con fecha futura es una cuenta a cobrar.
create or replace function public.create_charge(
  p_student_id uuid,
  p_amount integer,
  p_description text,
  p_due_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_charge uuid;
begin
  if not exists (
    select 1 from public.students s where s.id = p_student_id and s.org_id = v_org
  ) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  insert into public.charges (org_id, student_id, source, description, amount, due_on)
  values (v_org, p_student_id, 'manual', nullif(btrim(p_description), ''), p_amount, p_due_on)
  returning id into v_charge;

  perform private.settle_student(p_student_id);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'charge_created');

  return v_charge;
end;
$$;

-- Anula un cargo cargado por error. Los de clase no se anulan acá: se corrigen en la asistencia.
create or replace function public.void_charge(p_charge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_charge public.charges;
begin
  select c.* into v_charge
  from public.charges c
  where c.id = p_charge_id and c.org_id = v_org
  for update;
  if v_charge.id is null then
    raise exception 'charge_not_found' using errcode = '42501';
  end if;
  if v_charge.status = 'void' then
    raise exception 'charge_void' using errcode = '22023';
  end if;
  if v_charge.source = 'lesson' then
    raise exception 'lesson_charge' using errcode = '22023';
  end if;

  update public.charges set status = 'void', voided_at = now() where id = p_charge_id;
  delete from public.payment_allocations where charge_id = p_charge_id;
  delete from public.package_ledger where charge_id = p_charge_id and reason = 'purchase';

  perform private.settle_student(v_charge.student_id);
end;
$$;

-- Registra un pago. Con un cargo, lo asigna a ese cargo (hasta lo que le falta); sin cargo, cubre los
-- pendientes del más viejo al más nuevo y lo que sobre queda como saldo a favor.
create or replace function public.record_payment(
  p_student_id uuid,
  p_amount integer,
  p_method text,
  p_paid_on date,
  p_reference text default null,
  p_charge_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_payment uuid;
  v_remaining integer;
begin
  if not exists (
    select 1 from public.students s where s.id = p_student_id and s.org_id = v_org
  ) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  if p_charge_id is not null then
    select cb.remaining into v_remaining
    from public.charge_balances cb
    where cb.id = p_charge_id and cb.org_id = v_org
      and cb.student_id = p_student_id and cb.status = 'active';
    if v_remaining is null then
      raise exception 'charge_not_found' using errcode = '42501';
    end if;
    if p_amount > v_remaining then
      raise exception 'exceeds_charge' using errcode = '22023';
    end if;
  end if;

  insert into public.payments (org_id, student_id, amount, method, paid_on, reference, recorded_by)
  values (v_org, p_student_id, p_amount, p_method, p_paid_on, nullif(btrim(p_reference), ''), v_user)
  returning id into v_payment;

  if p_charge_id is not null then
    insert into public.payment_allocations (org_id, payment_id, charge_id, amount)
    values (v_org, v_payment, p_charge_id, p_amount);
  end if;

  perform private.settle_student(p_student_id);

  insert into public.events (org_id, actor_type, actor_id, name, props)
  values (v_org, 'teacher', v_user, 'payment_recorded', jsonb_build_object('method', p_method));

  return v_payment;
end;
$$;

-- «Cobrado»: paga lo que le falta a un cargo.
create or replace function public.mark_charge_paid(
  p_charge_id uuid,
  p_method text,
  p_paid_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_charge record;
begin
  select cb.student_id, cb.remaining into v_charge
  from public.charge_balances cb
  where cb.id = p_charge_id and cb.org_id = v_org and cb.status = 'active';
  if v_charge.student_id is null then
    raise exception 'charge_not_found' using errcode = '42501';
  end if;
  if v_charge.remaining <= 0 then
    raise exception 'already_paid' using errcode = '22023';
  end if;

  return public.record_payment(
    v_charge.student_id, v_charge.remaining, p_method, p_paid_on, null, p_charge_id
  );
end;
$$;

-- Compra el siguiente paquete antes de que se acabe el actual (se avisa cuando quedan dos clases).
create or replace function public.renew_package(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_plan public.price_plans;
begin
  if not exists (
    select 1 from public.students s where s.id = p_student_id and s.org_id = v_org
  ) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  select p.* into v_plan
  from public.price_plans p
  where p.student_id = p_student_id and p.ended_on is null;
  if v_plan.id is null or v_plan.mode <> 'package' then
    raise exception 'not_a_package' using errcode = '22023';
  end if;

  perform private.buy_package(v_org, p_student_id, v_plan, private.today_in_org_tz());
  perform private.settle_student(p_student_id);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'package_renewed');
end;
$$;

-- Crea las mensualidades de los alumnos con precio por mes cuyo día de cobro ya llegó. Es
-- idempotente: un mes ya cobrado o anulado no se vuelve a crear. Se llama al abrir Cobros.
create or replace function public.generate_monthly_charges()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_tz text;
  v_today date;
  v_students uuid[];
  v_student uuid;
  v_count integer;
begin
  select o.timezone into v_tz from public.organizations o where o.id = v_org;
  v_today := (now() at time zone v_tz)::date;

  with inserted as (
    insert into public.charges (org_id, student_id, source, period, amount, due_on)
    select s.org_id, s.id, 'monthly', to_char(d.due_on, 'YYYY-MM'), p.amount, d.due_on
    from public.students s
    join public.price_plans p on p.student_id = s.id and p.mode = 'monthly' and p.amount > 0
    cross join lateral (
      select (mo::date + (p.billing_day - 1)) as due_on
      from generate_series(
        date_trunc('month', p.starts_on)::timestamp,
        date_trunc('month', least(coalesce(p.ended_on, v_today), v_today))::timestamp,
        interval '1 month'
      ) as mo
    ) d
    where s.org_id = v_org
      and s.archived_at is null
      and s.status = 'active'
      and d.due_on >= p.starts_on
      and d.due_on <= least(coalesce(p.ended_on, v_today), v_today)
    order by p.starts_on desc, p.created_at desc
    on conflict (student_id, period) where source = 'monthly' do nothing
    returning student_id
  )
  select array_agg(distinct student_id), count(*) into v_students, v_count from inserted;

  foreach v_student in array coalesce(v_students, '{}') loop
    perform private.settle_student(v_student);
  end loop;

  return coalesce(v_count, 0);
end;
$$;

-- Aumento de precios: cada cambio es {studentId, amount} con el monto nuevo en centavos. Conserva la
-- modalidad, las clases del paquete y el día de cobro; los cargos ya creados no cambian.
create or replace function public.apply_price_changes(p_changes jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_today date := private.today_in_org_tz();
  v_change jsonb;
  v_student uuid;
  v_amount integer;
  v_plan public.price_plans;
  v_count integer := 0;
begin
  for v_change in select * from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb)) loop
    v_student := (v_change ->> 'studentId')::uuid;
    v_amount := (v_change ->> 'amount')::integer;
    if v_amount is null or v_amount <= 0 then
      raise exception 'invalid_amount' using errcode = '22023';
    end if;

    select p.* into v_plan
    from public.price_plans p
    join public.students s on s.id = p.student_id
    where p.student_id = v_student and s.org_id = v_org and p.ended_on is null;
    if v_plan.id is null then
      raise exception 'student_not_found' using errcode = '42501';
    end if;

    update public.price_plans
    set ended_on = greatest(starts_on, v_today)
    where id = v_plan.id;

    insert into public.price_plans
      (org_id, student_id, mode, amount, lessons_per_package, billing_day, starts_on)
    values (
      v_org, v_student, v_plan.mode, v_amount, v_plan.lessons_per_package, v_plan.billing_day,
      v_today
    );

    v_count := v_count + 1;
  end loop;

  insert into public.events (org_id, actor_type, actor_id, name, props)
  values (v_org, 'teacher', v_user, 'price_increase_applied', jsonb_build_object('students', v_count));

  return v_count;
end;
$$;

revoke all on function public.create_charge(uuid, integer, text, date) from public, anon;
grant execute on function public.create_charge(uuid, integer, text, date) to authenticated;

revoke all on function public.void_charge(uuid) from public, anon;
grant execute on function public.void_charge(uuid) to authenticated;

revoke all on function public.record_payment(uuid, integer, text, date, text, uuid) from public, anon;
grant execute on function public.record_payment(uuid, integer, text, date, text, uuid) to authenticated;

revoke all on function public.mark_charge_paid(uuid, text, date) from public, anon;
grant execute on function public.mark_charge_paid(uuid, text, date) to authenticated;

revoke all on function public.renew_package(uuid) from public, anon;
grant execute on function public.renew_package(uuid) to authenticated;

revoke all on function public.generate_monthly_charges() from public, anon;
grant execute on function public.generate_monthly_charges() to authenticated;

revoke all on function public.apply_price_changes(jsonb) from public, anon;
grant execute on function public.apply_price_changes(jsonb) to authenticated;
