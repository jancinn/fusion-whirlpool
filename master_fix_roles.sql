-- 🚀 MASTER FIX: Restauración de Roles y Limpieza de Datos
-- Ejecutar este script en el SQL Editor de Supabase

BEGIN;

-- 1. Corregir usuarios con roles nulos o vacíos
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', 'staff')
WHERE (raw_user_meta_data->>'role') IS NULL 
   OR (raw_user_meta_data->>'role') = '';

-- 2. Corregir el usuario con email corrupto (si existe)
-- Nota: Esto une el email duplicado por el error del robot
UPDATE auth.users
SET email = 'test.secretaria@test.com'
WHERE email = 'jancinn@gmail.comtest.secretaria@test.com';

-- 3. Asegurar que los nombres estén presentes en la metadata
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || 
  jsonb_build_object(
    'first_name', COALESCE(raw_user_meta_data->>'first_name', 'Usuario'),
    'last_name', COALESCE(raw_user_meta_data->>'last_name', 'NN')
  )
WHERE (raw_user_meta_data->>'first_name') IS NULL;

-- 4. Re-instalar funciones RPC con nombres de parámetros ultra-claros para evitar conflictos
CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
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
    u.created_at
  FROM auth.users u
  WHERE u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_old_role TEXT;
  v_admin_count INTEGER;
BEGIN
  -- 1. Obtener rol actual
  SELECT raw_user_meta_data->>'role' INTO v_old_role FROM auth.users WHERE id = p_user_id;
  
  -- 2. Validar regla de último admin
  IF v_old_role = 'administrador_general' AND p_role != 'administrador_general' THEN
    SELECT COUNT(*) INTO v_admin_count FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrador_general' AND deleted_at IS NULL;
    
    IF v_admin_count <= 1 THEN
      RETURN json_build_object('success', false, 'message', 'Debe existir al menos un Administrador General activo');
    END IF;
  END IF;

  -- 3. Actualización forzada
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name', p_last_name,
      'role', p_role
    ),
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Perfil actualizado correctamente');
END;
$$ LANGUAGE plpgsql;

-- 5. Re-asignar permisos
GRANT EXECUTE ON FUNCTION public.get_users_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_list TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_profile TO anon;

COMMIT;

SELECT 'Master Fix completado con éxito' as resultado;
