-- FUNCIONES DE GESTIÓN DE USUARIOS (RPC)
-- Estas funciones permiten al 'administrador_general' gestionar usuarios de forma segura
-- sin exponer la tabla auth.users directamente.

-- Habilitar pgcrypto para hashing de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- 3. ELIMINAR USUARIO (Solo Admin)
-- Permite eliminar un usuario permanentemente.
-- Restricción: Solo 'administrador_general'. No auto-eliminación.
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- A. Verificar Permisos
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'administrador_general' THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administrador_general puede eliminar usuarios.';
  END IF;

  -- B. Prevenir Auto-Eliminación
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operación no permitida: No puedes eliminar tu propia cuenta.';
  END IF;

  -- C. Eliminar Dependencias (Cascade Manual)
  -- Eliminar solicitudes/propuestas asociadas al usuario
  DELETE FROM public.solicitudes WHERE user_id = target_user_id;
  
  -- (Agregar aquí otras tablas si existen, ej: meeting_minutes, etc.)

  -- D. Eliminar Usuario (Esto borra de auth.users)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- 4. CREAR USUARIO (Solo Admin)
-- Permite crear un nuevo usuario con rol específico.
-- Restricción: Solo 'administrador_general'.
CREATE OR REPLACE FUNCTION create_user(
  email TEXT,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id UUID;
  new_identity_id UUID;
BEGIN
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'administrador_general' THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administrador_general puede crear usuarios.';
  END IF;

  IF role = 'administrador_general' THEN
     RAISE EXCEPTION 'Seguridad: No se puede crear un Administrador General directamente.';
  END IF;

  new_user_id := gen_random_uuid();
  new_identity_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email,
    extensions.crypt(password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'first_name', first_name,
      'last_name', last_name,
      'role', role
    ),
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at
  )
  VALUES (
    new_identity_id,
    new_user_id,
    'email',
    email,
    jsonb_build_object('sub', new_user_id, 'email', email),
    now(),
    now()
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;
