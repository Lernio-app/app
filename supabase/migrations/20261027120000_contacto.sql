-- Contacto (F10): mensajes del formulario público del sitio. Los lee y contesta el equipo Lernio desde
-- la bandeja del panel interno (F13); hasta entonces quedan guardados como nuevos. Nadie los lee
-- desde el cliente: solo se agregan por `submit_contact_message`, que aplica el límite de envíos.
-- De la dirección de red se guarda una huella (hash), no la dirección.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254 and email like '%_@_%'),
  topic text not null check (topic in ('profe', 'clases', 'datos', 'otro')),
  message text not null check (char_length(message) between 10 and 4000),
  ip_hash text not null check (char_length(ip_hash) = 64),
  status text not null default 'nuevo'
    check (status in ('nuevo', 'en_curso', 'respondido', 'cerrado', 'spam')),
  created_at timestamptz not null default now()
);

create index contact_messages_ip_hash_created_at on public.contact_messages (ip_hash, created_at);
create index contact_messages_email_created_at on public.contact_messages (lower(email), created_at);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

-- Guarda un mensaje. Límite: 3 por hora y 10 por día, por huella de red y por email.
create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_topic text,
  p_message text,
  p_ip_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_hour int;
  v_day int;
begin
  select
    count(*) filter (where created_at > now() - interval '1 hour'),
    count(*)
  into v_hour, v_day
  from public.contact_messages
  where created_at > now() - interval '1 day'
    and (ip_hash = p_ip_hash or lower(email) = v_email);

  if v_hour >= 3 or v_day >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.contact_messages (name, email, topic, message, ip_hash)
  values (trim(p_name), v_email, p_topic, trim(p_message), p_ip_hash);
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text)
  to anon, authenticated;
