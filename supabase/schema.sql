-- México 2027: esquema compartido.
-- Ejecutar en el SQL Editor de un proyecto Supabase propio.
-- Lectura pública de itinerario y notas. No almacenar datos sensibles.
-- Los editores deben estar incluidos explícitamente en trip_editors.

create table if not exists public.trip_editors (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.trip_editors enable row level security;
revoke all on public.trip_editors from anon, authenticated;
grant select on public.trip_editors to authenticated;

drop policy if exists "editors_can_check_own_email" on public.trip_editors;
create policy "editors_can_check_own_email"
on public.trip_editors for select to authenticated
using (email = lower(auth.jwt() ->> 'email'));

create table if not exists public.trip_documents (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.trip_documents enable row level security;
revoke all on public.trip_documents from anon, authenticated;
grant select on public.trip_documents to anon, authenticated;
grant insert (id, data) on public.trip_documents to authenticated;
grant update (data) on public.trip_documents to authenticated;

drop policy if exists "public_can_read_trip" on public.trip_documents;
create policy "public_can_read_trip"
on public.trip_documents for select to anon, authenticated
using (id = 'mexico-2027');

drop policy if exists "editors_can_create_trip" on public.trip_documents;
create policy "editors_can_create_trip"
on public.trip_documents for insert to authenticated
with check (
  id = 'mexico-2027'
  and exists (
    select 1 from public.trip_editors e
    where e.email = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "editors_can_update_trip" on public.trip_documents;
create policy "editors_can_update_trip"
on public.trip_documents for update to authenticated
using (
  id = 'mexico-2027'
  and exists (
    select 1 from public.trip_editors e
    where e.email = lower(auth.jwt() ->> 'email')
  )
)
with check (
  id = 'mexico-2027'
  and exists (
    select 1 from public.trip_editors e
    where e.email = lower(auth.jwt() ->> 'email')
  )
);

create or replace function public.trip_document_revision()
returns trigger language plpgsql set search_path = public as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
drop trigger if exists update_trip_revision on public.trip_documents;
create trigger update_trip_revision
before update on public.trip_documents
for each row execute function public.trip_document_revision();

-- Después, añade el email de cada persona autorizada (desde SQL Editor).
-- Nunca publiques direcciones de correo en GitHub.
-- insert into public.trip_editors(email) values (lower('tu-correo@example.com'));
