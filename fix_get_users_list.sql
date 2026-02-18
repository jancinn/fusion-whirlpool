-- 🛠️ SCRIPT DE REPARACIÓN: get_users_list (NUCLEAR OPTION)
-- Este script asegura que la lista de usuarios lea correctamente TODOS los usuarios activos.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Borrar TODAS las variantes de get_users_list para evitar conflictos
    FOR r IN (SELECT oid::regprocedure as func_signature FROM pg_proc WHERE proname = 'get_users_list' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Crear la función limpia y correcta
CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  is_suspended BOOLEAN
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    (u.raw_user_meta_data->>'first_name')::TEXT,
    (u.raw_user_meta_data->>'last_name')::TEXT,
    (u.raw_user_meta_data->>'role')::TEXT,
    u.created_at,
    (u.banned_until IS NOT NULL AND u.banned_until > now()) as is_suspended
  FROM auth.users u
  WHERE u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Permisos
GRANT EXECUTE ON FUNCTION public.get_users_list TO authenticated;

-- Recargar caché
NOTIFY pgrst, 'reload schema';

SELECT 'Función get_users_list reparada y lista para usar' as status;
