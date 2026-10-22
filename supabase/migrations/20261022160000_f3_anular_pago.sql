-- Deshacer un pago registrado por error. El pago no se borra: queda anulado con su fecha, deja de
-- contar en las estadísticas y su dinero se libera de los cargos que cubría.

alter table public.payments add column voided_at timestamptz;

-- Un pago anulado no tiene saldo libre. voided_at va al final: una vista solo puede sumar columnas así.
create or replace view public.payment_balances with (security_invoker = true) as
select
  p.id, p.org_id, p.student_id, p.amount, p.method, p.paid_on, p.reference, p.created_at,
  (case when p.voided_at is null then p.amount - coalesce(a.used, 0) else 0 end)::integer as unallocated,
  p.voided_at
from public.payments p
left join (
  select payment_id, sum(amount) as used from public.payment_allocations group by payment_id
) a on a.payment_id = p.id;

create or replace function public.void_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.require_org();
  v_user uuid := auth.uid();
  v_payment public.payments;
begin
  select p.* into v_payment
  from public.payments p
  where p.id = p_payment_id and p.org_id = v_org
  for update;
  if v_payment.id is null then
    raise exception 'payment_not_found' using errcode = '42501';
  end if;
  if v_payment.voided_at is not null then
    raise exception 'payment_void' using errcode = '22023';
  end if;

  update public.payments set voided_at = now() where id = p_payment_id;
  delete from public.payment_allocations where payment_id = p_payment_id;

  perform private.settle_student(v_payment.student_id);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'payment_voided');
end;
$$;

revoke all on function public.void_payment(uuid) from public, anon;
grant execute on function public.void_payment(uuid) to authenticated;
