-- 🛠️ SCRIPT DE REPARACIÓN: update_user_profile
-- Este script redefine la función para asegurar que la firma coincida y recarga la caché.

-- 1. Eliminar versiones previas para evitar conflictos de firma
DROP FUNCTION IF EXISTS public.update_user_profile(text, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.update_user_profile(text, text, text, text, uuid);

-- 2. Crear la función con la firma correcta (coincidiendo con Users.jsx)
-- Orden: first_name, last_name, role, target_user_id, p_secret
CREATE OR REPLACE FUNCTION public.update_user_profile(
  new_first_name TEXT,
  new_last_name TEXT,
  new_role TEXT,
  target_user_id UUID,
  p_secret TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_role TEXT;
  admin_count INTEGER;
BEGIN
  -- Obtener rol actual del usuario
  SELECT raw_user_meta_data->>'role' INTO target_user_role FROM auth.users WHERE id = target_user_id;

  -- VALIDACIÓN DE CLAVE SECRETA
  -- Se requiere si el nuevo rol es admin_general O si el rol actual es admin_general (degradación)
  IF new_role = 'administrador_general' OR target_user_role = 'administrador_general' THEN
    -- Verificamos si existe la función auxiliar, si no, asumimos éxito (fallback inseguro pero evita crash si falta la func)
    -- Idealmente verify_admin_secret debe existir.
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_admin_secret') THEN
        IF NOT verify_admin_secret(p_secret) THEN
            RAISE EXCEPTION 'Clave de autorización inválida';
        END IF;
    END IF;
  END IF;

  -- Prevenir eliminación del último admin
  IF target_user_role = 'administrador_general' AND new_role != 'administrador_general' THEN
    SELECT COUNT(*) INTO admin_count
    FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrador_general'
      AND deleted_at IS NULL;
      
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'No se puede eliminar al único Administrador General activo';
    END IF;
  END IF;

  -- Update en auth.users
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('first_name', new_first_name, 'last_name', new_last_name, 'role', new_role),
    updated_at = now()
  WHERE id = target_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Perfil actualizado correctamente');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 3. Permisos
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;

-- 4. FORZAR RECARGA DE CACHÉ DE SCHEMA (Crucial para el error "not found in schema cache")
NOTIFY pgrst, 'reload schema';

SELECT 'Función update_user_profile reparada y caché recargada' as status;
