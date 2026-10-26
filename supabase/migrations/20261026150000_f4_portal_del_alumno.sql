-- F4 Portal del alumno: lo que ve la cuenta del alumno de sus clases y sus cobros (ADR-0003 #4).
-- El alumno vinculado lee, con su sesión y RLS, solo los registros de su propia ficha, en cualquier
-- organización. Es solo lectura. No lee las notas del profe (tablas aparte, sin política para él), a
-- los responsables de pago ni a los otros alumnos de una clase grupal.

-- ---------------------------------------------------------------------------
-- Clases
-- ---------------------------------------------------------------------------

-- Sus filas de asistencia: `student_id` es su ficha vinculada.
create policy lesson_attendees_select_linked on public.lesson_attendees
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = lesson_attendees.student_id and s.user_id = (select auth.uid())
    )
  );

-- Las clases a las que asiste. De una clase grupal ve la clase, pero no a los otros asistentes.
create policy lessons_select_linked on public.lessons
  for select to authenticated
  using (
    exists (
      select 1
      from public.lesson_attendees a
      join public.students s on s.id = a.student_id
      where a.lesson_id = lessons.id and s.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Cobros: sus cargos, pagos y saldo de paquete (las vistas son `security_invoker`)
-- ---------------------------------------------------------------------------

create policy charges_select_linked on public.charges
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = charges.student_id and s.user_id = (select auth.uid())
    )
  );

create policy payments_select_linked on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = payments.student_id and s.user_id = (select auth.uid())
    )
  );

create policy payment_allocations_select_linked on public.payment_allocations
  for select to authenticated
  using (
    exists (
      select 1
      from public.charges c
      join public.students s on s.id = c.student_id
      where c.id = payment_allocations.charge_id and s.user_id = (select auth.uid())
    )
  );

create policy package_ledger_select_linked on public.package_ledger
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = package_ledger.student_id and s.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Los espacios de la cuenta, con cómo pagar
-- ---------------------------------------------------------------------------
-- El alumno no lee `organizations`: esta función le da solo lo que necesita para mostrar el portal.

drop function public.my_student_links();

create or replace function public.my_student_links()
returns table (
  student_id uuid,
  student_name text,
  teacher_name text,
  org_name text,
  archived boolean,
  timezone text,
  payment_alias text,
  payment_link text,
  late_cancel_hours integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.full_name,
    coalesce(tp.display_name, o.name),
    o.name,
    s.archived_at is not null,
    o.timezone,
    o.payment_alias,
    o.payment_link,
    o.late_cancel_hours
  from public.students s
  join public.organizations o on o.id = s.org_id
  left join public.teacher_profiles tp on tp.org_id = s.org_id and tp.user_id = s.teacher_id
  where s.user_id = auth.uid()
  order by s.created_at;
$$;

revoke all on function public.my_student_links() from public, anon;
grant execute on function public.my_student_links() to authenticated;
