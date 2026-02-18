-- 🔐 FUNCIONES RPC PARA GESTIÓN DE USUARIOS (V7 - SUSPENSIÓN Y ELIMINACIÓN)
-- Sistema autocontenido con soporte para suspender y eliminar usuarios

-- 1. Actualizar get_users_list para incluir estado de suspensión
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

-- 2. Función para suspender/activar usuario
CREATE OR REPLACE FUNCTION public.suspend_user(
  p_user_id UUID,
  p_is_suspended BOOLEAN,
  p_secret TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- 1. Verificar si el usuario afectado es admin_general
  SELECT raw_user_meta_data->>'role' INTO v_role FROM auth.users WHERE id = p_user_id;

  IF v_role = 'administrador_general' THEN
    IF NOT verify_admin_secret(p_secret) THEN
      RAISE EXCEPTION 'Clave de autorización inválida';
    END IF;
  END IF;

  UPDATE auth.users
  SET banned_until = CASE WHEN p_is_suspended THEN '3000-01-01 00:00:00+00'::TIMESTAMPTZ ELSE NULL END,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true, 
    'message', CASE WHEN p_is_suspended THEN 'Usuario suspendido correctamente' ELSE 'Usuario activado correctamente' END
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 3. Función para eliminar usuario definitivamente
CREATE OR REPLACE FUNCTION public.delete_user(
  p_user_id UUID,
  p_secret TEXT DEFAULT NULL
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
  v_admin_count INTEGER;
BEGIN
  SELECT raw_user_meta_data->>'role'
  INTO v_role
  FROM auth.users
  WHERE id = p_user_id;

  IF v_role = 'administrador_general' THEN
    IF NOT verify_admin_secret(p_secret) THEN
      RAISE EXCEPTION 'Clave de autorización inválida';
    END IF;

    SELECT COUNT(*) INTO v_admin_count
    FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrador_general'
      AND deleted_at IS NULL;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'No se puede eliminar al único Administrador General activo';
    END IF;
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN 'Usuario eliminado correctamente';
END;
$$ LANGUAGE plpgsql;

-- PERMISOS
GRANT EXECUTE ON FUNCTION public.get_users_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Sistema de usuarios V7 listo' as status;
