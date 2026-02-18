-- 🔐 REEMPLAZO DE FUNCIÓN delete_user CON FIRMA EXACTA
-- Esta versión usa app.secret_key y devuelve códigos de error planos (OK, CLAVE_INVALIDA, ULTIMO_ADMIN)

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
  -- validar clave
  if p_secret is null or p_secret <> current_setting('app.secret_key', true) then
    return 'CLAVE_INVALIDA';
  end if;

  -- prevenir borrar el último admin
  -- Nota: Se asume que existe una vista o tabla 'users' en el search_path
  -- Si falla, es posible que deba referenciarse como auth.users y ajustar la columna role
  select count(*) into admin_count
  from users
  where role = 'administrador_general';

  select role into user_role
  from users
  where id = p_user_id;

  if user_role = 'administrador_general' and admin_count <= 1 then
    return 'ULTIMO_ADMIN';
  end if;

  delete from users
  where id = p_user_id;

  return 'OK';
end;
$$;

-- Refrescar el schema cache (esto es un comando de PostgREST, no SQL puro, 
-- pero se puede incluir como comentario o ejecutar vía NOTIFY si está configurado)
NOTIFY pgrst, 'reload schema';
