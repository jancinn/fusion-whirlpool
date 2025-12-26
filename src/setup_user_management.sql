-- FUNCIONES DE GESTIÓN DE USUARIOS (RPC)
-- Estas funciones permiten al 'administrador_general' gestionar usuarios de forma segura
-- sin exponer la tabla auth.users directamente.

-- 1. LISTAR USUARIOS
-- Devuelve ID, Email, Rol y Nombres de todos los usuarios.
-- Restricción: Solo ejecutable por 'administrador_general'.
CREATE OR REPLACE FUNCTION get_users_list()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  role TEXT,
  first_name TEXT,
  last_name TEXT
)
SECURITY DEFINER -- Se ejecuta con permisos de admin (para leer auth.users)
SET search_path = public, auth -- Asegura acceso al esquema auth
AS $$
BEGIN
  -- Verificación de Seguridad Estricta
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'administrador_general' THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administrador_general puede listar usuarios.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::VARCHAR,
    au.raw_user_meta_data ->> 'role',
    au.raw_user_meta_data ->> 'first_name',
    au.raw_user_meta_data ->> 'last_name'
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. ACTUALIZAR ROL
-- Permite cambiar el rol de un usuario.
-- Restricción: Solo 'administrador_general'. No auto-cambio. Roles válidos.
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- A. Verificar Permisos
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'administrador_general' THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administrador_general puede cambiar roles.';
  END IF;

  -- B. Prevenir Auto-Cambio
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operación no permitida: No puedes cambiar tu propio rol.';
  END IF;

  -- C. Validar Roles Permitidos
  IF new_role NOT IN ('administrador_general', 'secretaria', 'coordinador_area', 'coordinador_operativo', 'director') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role;
  END IF;

  -- D. Actualizar Metadatos
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new_role)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;
