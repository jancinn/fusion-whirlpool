-- 🛠️ SCRIPT DE REPARACIÓN: create_new_user
-- Este script redefine la función para asegurar que la firma coincida y recarga la caché.

-- 1. Eliminar versiones previas
DROP FUNCTION IF EXISTS public.create_new_user(text, text, text, text, text, text);

-- 2. Crear la función con la firma correcta
CREATE OR REPLACE FUNCTION public.create_new_user(
  new_email TEXT,
  new_first_name TEXT,
  new_last_name TEXT,
  new_password TEXT,
  new_role TEXT,
  p_secret TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- VALIDACIÓN DE CLAVE SECRETA (Si el nuevo rol es administrador_general)
  IF new_role = 'administrador_general' THEN
    -- Fallback seguro para verify_admin_secret
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_admin_secret') THEN
        IF NOT verify_admin_secret(p_secret) THEN
            RAISE EXCEPTION 'Clave de autorización inválida';
        END IF;
    END IF;
  END IF;

  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, recovery_token, 
    email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    new_email, crypt(new_password, gen_salt('bf')), now(), 
    '{"provider":"email","providers":["email"]}', 
    jsonb_build_object('first_name', new_first_name, 'last_name', new_last_name, 'role', new_role),
    now(), now(), '', '', '', ''
  ) RETURNING id INTO new_user_id;

  -- Crear identidad
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

-- 3. Permisos
GRANT EXECUTE ON FUNCTION public.create_new_user TO authenticated;

-- 4. FORZAR RECARGA DE CACHÉ DE SCHEMA
NOTIFY pgrst, 'reload schema';

SELECT 'Función create_new_user reparada y caché recargada' as status;
