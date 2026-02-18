-- 🚀 SOLUCIÓN FINAL (VERSIÓN profiles + auth.users): RECONSTRUCCIÓN DE delete_user
-- He confirmado que public.users NO existe, pero public.profiles SÍ existe y contiene el role.

BEGIN;

-- 1️⃣ Eliminar versiones previas para evitar conflictos de firma
drop function if exists public.delete_user(p_user_id uuid);
drop function if exists public.delete_user(text);
drop function if exists public.delete_user(uuid);
drop function if exists public.delete_user(uuid, text);
drop function if exists public.delete_user(text, uuid);

-- 2️⃣ Crear la función CORRECTA usando profiles para validación y auth para borrado
create or replace function public.delete_user(
  p_secret text,
  p_user_id uuid
)
returns text
language plpgsql
security definer
as $$
declare
  admin_count int;
  user_role text;
begin
  -- A. Validar clave secreta contra app.secret_key
  if p_secret is null or p_secret <> current_setting('app.secret_key', true) then
    return 'CLAVE_INVALIDA';
  end if;

  -- B. Contar admins en la tabla profiles (fuente de roles en tu app)
  select count(*) into admin_count
  from public.profiles
  where role = 'administrador_general';

  -- C. Obtener rol del usuario objetivo desde profiles
  select role into user_role
  from public.profiles
  where id = p_user_id;

  -- D. Proteger último admin
  if user_role = 'administrador_general' and admin_count <= 1 then
    return 'ULTIMO_ADMIN';
  end if;

  -- 3️⃣ Ejecución de la eliminación (Orden de integridad)
  -- Primero borramos el perfil
  delete from public.profiles where id = p_user_id;
  
  -- Luego las identidades de auth
  delete from auth.identities where user_id = p_user_id;

  -- Finalmente el usuario de auth
  delete from auth.users where id = p_user_id;

  return 'OK';
end;
$$;

-- 4️⃣ Asegurar permisos explícitos
grant usage on schema public to anon, authenticated;
grant execute on function public.delete_user(text, uuid) to anon, authenticated, service_role;

-- 5️⃣ Refrescar cache de PostgREST
notify pgrst, 'reload schema';

COMMIT;
