-- 🛠️ SCRIPT DE CONFIRMACIÓN: get_users_list
-- Este script garantiza que SOLO exista esta versión exacta de la función.

-- 1. LIMPIEZA TOTAL: Borrar cualquier variante existente
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as func_signature FROM pg_proc WHERE proname = 'get_users_list' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- 2. CREACIÓN EXACTA (Según solicitud)
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
    (u.banned_until IS NOT NULL AND u.banned_until > now())
  FROM auth.users u
  WHERE u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. PERMISOS
GRANT EXECUTE ON FUNCTION public.get_users_list TO authenticated;

-- 4. RECARGA
NOTIFY pgrst, 'reload schema';

SELECT 'Función get_users_list redefinida exactamente y variantes eliminadas' as status;
