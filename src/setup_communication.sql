-- 1️⃣ Crear la tabla public.messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  recipient_id uuid references auth.users(id) on delete cascade,
  subject text,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 2️⃣ Dar permisos mínimos a authenticated
grant select, insert, update on public.messages to authenticated;

-- 3️⃣ Activar RLS (muy importante)
alter table public.messages enable row level security;

-- 4️⃣ Crear policies seguras

-- El usuario autenticado puede ver mensajes donde es destinatario
create policy "read own messages"
on public.messages
for select
using (recipient_id = auth.uid());

-- El usuario autenticado puede enviar mensajes
create policy "send messages"
on public.messages
for insert
with check (sender_id = auth.uid());

-- El usuario solo puede marcar como leído sus mensajes
create policy "update own messages"
on public.messages
for update
using (recipient_id = auth.uid());

-- Policy adicional para que el remitente pueda ver sus mensajes enviados
create policy "read sent messages"
on public.messages
for select
using (sender_id = auth.uid());

-- Policy para administradores (Monitor Global)
-- Asumiendo que 'administrador_general' debe ver todo.
-- Nota: RLS es restrictivo por defecto. Si queremos que el admin vea todo, necesitamos una policy.
create policy "admin read all"
on public.messages
for select
using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador_general'
);
