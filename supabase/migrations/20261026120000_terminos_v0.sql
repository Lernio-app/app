-- Términos y privacidad v0 (plan v2.4, pieza de la migración antes de F4).
-- Quién aceptó qué versión de los términos y de la privacidad, para tener la prueba desde el hito A.
-- Es de la persona (no de un espacio) y solo admite agregar: no se edita ni se borra. La versión
-- vigente vive en el código; acá solo se guarda lo que cada cuenta aceptó. El consentimiento de un
-- adulto sin cuenta por un menor no pasa por acá: lo guarda `minor_consents` con su versión.

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null check (document in ('terms', 'privacy')),
  version text not null check (version ~ '^[0-9]{1,3}$'),
  accepted_at timestamptz not null default now(),
  unique (user_id, document, version)
);

alter table public.legal_acceptances enable row level security;

revoke all on public.legal_acceptances from anon, authenticated;
-- Cada cuenta lee lo suyo. Se acepta solo por `accept_legal`.
grant select on public.legal_acceptances to authenticated;

create policy legal_acceptances_select on public.legal_acceptances
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Acepta los dos documentos en una versión. Repetirla no hace nada: se conserva la primera fecha.
create or replace function public.accept_legal(p_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.legal_acceptances (user_id, document, version)
  select v_user, d.document, p_version
  from (values ('terms'), ('privacy')) as d (document)
  on conflict (user_id, document, version) do nothing;
end;
$$;

revoke all on function public.accept_legal(text) from public, anon;
grant execute on function public.accept_legal(text) to authenticated;
