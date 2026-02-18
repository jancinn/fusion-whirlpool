-- CORRECCIÓN FINAL: Eliminar funciones viejas antes de crear nuevas (para cambiar return types)

-- 1. ELIMINAR VERSIONES ANTERIORES
DROP FUNCTION IF EXISTS create_new_user(text, text, text, text, text, text, text); -- Intenta borrar la nueva firma
DROP FUNCTION IF EXISTS create_new_user(text, text, text, text, text, text);       -- Intenta borrar firma vieja
DROP FUNCTION IF EXISTS update_user_profile(text, text, text, uuid, text, text);   -- Nueva firma
DROP FUNCTION IF EXISTS update_user_profile(text, text, text, uuid, text);         -- Vieja firma
DROP FUNCTION IF EXISTS get_users_list(); -- Borrar funcion de lista para cambiar columnas

-- 2. RE-CREAR FUNCIONES LIMPIAS

-- CREATE USER
CREATE OR REPLACE FUNCTION create_new_user(
  new_email TEXT,
  new_first_name TEXT,
  new_last_name TEXT,
  new_password TEXT,
  new_role TEXT,
  new_department TEXT DEFAULT NULL, 
  p_secret TEXT DEFAULT NULL       
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  IF new_role = 'administrador_general' THEN
    IF NOT verify_admin_secret(p_secret) THEN
      RAISE EXCEPTION 'Clave de autorización inválida';
    END IF;
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, recovery_token, 
    email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    new_email, crypt(new_password, gen_salt('bf')), now(), 
    '{"provider":"email","providers":["email"]}', 
    jsonb_build_object(
        'first_name', new_first_name, 
        'last_name', new_last_name, 
        'role', new_role,
        'department', new_department
    ),
    now(), now(), '', '', '', ''
  ) RETURNING id INTO new_user_id;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, 
    format('{"sub":"%s","email":"%s"}', new_user_id, new_email)::jsonb, 
    'email', now(), now(), now()
  );

  RETURN json_build_object('success', true, 'message', 'Usuario creado correctamente', 'user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- UPDATE USER
CREATE OR REPLACE FUNCTION update_user_profile(
  new_first_name TEXT,
  new_last_name TEXT,
  new_role TEXT,
  target_user_id UUID,             
  new_department TEXT DEFAULT NULL, 
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
  SELECT raw_user_meta_data->>'role' INTO target_user_role FROM auth.users WHERE id = target_user_id;

  IF new_role = 'administrador_general' OR target_user_role = 'administrador_general' THEN
    IF NOT verify_admin_secret(p_secret) THEN
      RAISE EXCEPTION 'Clave de autorización inválida';
    END IF;
  END IF;

  SELECT raw_user_meta_data->>'role' INTO target_user_role FROM auth.users WHERE id = target_user_id;
  
  IF target_user_role = 'administrador_general' AND new_role != 'administrador_general' THEN
    admin_count := get_admin_count();
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'No se puede eliminar al único Administrador General activo';
    END IF;
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'first_name', new_first_name, 
        'last_name', new_last_name, 
        'role', new_role,
        'department', new_department
    ),
    updated_at = now()
  WHERE id = target_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Perfil actualizado correctamente');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- GET USERS LIST (Updated Return Type)
CREATE OR REPLACE FUNCTION get_users_list()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  department TEXT, -- Nueva columna
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
    (u.raw_user_meta_data->>'department')::TEXT,
    u.created_at
  FROM auth.users u
  WHERE u.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION create_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_list TO authenticated;

NOTIFY pgrst, 'reload schema';
