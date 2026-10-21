-- El precio de un alumno es opcional: un alumno sin precio no genera cobros.
-- create_student no crea precio si no se indica modalidad, y set_price_plan con
-- modalidad nula solo cierra el precio vigente.

drop function public.create_student(
  text, text, text, text, text, text, text, text, text, text, text, integer, integer, smallint
);
drop function public.set_price_plan(uuid, text, integer, integer, smallint);

create or replace function public.create_student(
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_subject text default null,
  p_level text default null,
  p_notes text default null,
  p_payer_name text default null,
  p_payer_relation text default null,
  p_payer_phone text default null,
  p_payer_email text default null,
  p_mode text default null,
  p_amount integer default null,
  p_lessons_per_package integer default null,
  p_billing_day smallint default null
)
returns table (student_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_student uuid;
  v_token text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select m.org_id into v_org
  from public.memberships m
  where m.user_id = v_user
  order by m.created_at
  limit 1;
  if v_org is null then
    raise exception 'no_workspace' using errcode = '42501';
  end if;

  insert into public.students (org_id, teacher_id, full_name, phone, email, subject, level, notes)
  values (
    v_org,
    v_user,
    btrim(p_full_name),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_subject), ''),
    nullif(btrim(p_level), ''),
    nullif(btrim(p_notes), '')
  )
  returning id into v_student;

  if nullif(btrim(p_payer_name), '') is not null then
    insert into public.student_contacts
      (org_id, student_id, name, relation, phone, email, is_payer, gets_reports)
    values (
      v_org,
      v_student,
      btrim(p_payer_name),
      nullif(btrim(p_payer_relation), ''),
      nullif(btrim(p_payer_phone), ''),
      nullif(btrim(p_payer_email), ''),
      true,
      true
    );
  end if;

  if p_mode is not null then
    insert into public.price_plans
      (org_id, student_id, mode, amount, lessons_per_package, billing_day, starts_on)
    values (
      v_org, v_student, p_mode, coalesce(p_amount, 0), p_lessons_per_package, p_billing_day,
      private.today_in_org_tz()
    );
  end if;

  v_token := private.new_student_token(v_org, v_student);

  insert into public.events (org_id, actor_type, actor_id, name)
  values (v_org, 'teacher', v_user, 'student_created');

  return query select v_student, v_token;
end;
$$;

-- Cambia el precio: cierra el vigente y abre el nuevo (queda el historial). Con modalidad
-- nula solo cierra el vigente y devuelve null: el alumno queda sin precio.
create or replace function public.set_price_plan(
  p_student_id uuid,
  p_mode text default null,
  p_amount integer default null,
  p_lessons_per_package integer default null,
  p_billing_day smallint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_today date := private.today_in_org_tz();
  v_plan uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select s.org_id into v_org from public.students s where s.id = p_student_id;
  if v_org is null or not private.is_org_member(v_org) then
    raise exception 'student_not_found' using errcode = '42501';
  end if;

  update public.price_plans
  set ended_on = greatest(starts_on, v_today)
  where student_id = p_student_id and ended_on is null;

  if p_mode is null then
    return null;
  end if;

  insert into public.price_plans
    (org_id, student_id, mode, amount, lessons_per_package, billing_day, starts_on)
  values (
    v_org, p_student_id, p_mode, coalesce(p_amount, 0), p_lessons_per_package, p_billing_day,
    v_today
  )
  returning id into v_plan;

  return v_plan;
end;
$$;

revoke all on function public.create_student(
  text, text, text, text, text, text, text, text, text, text, text, integer, integer, smallint
) from public, anon;
grant execute on function public.create_student(
  text, text, text, text, text, text, text, text, text, text, text, integer, integer, smallint
) to authenticated;

revoke all on function public.set_price_plan(uuid, text, integer, integer, smallint)
  from public, anon;
grant execute on function public.set_price_plan(uuid, text, integer, integer, smallint)
  to authenticated;
