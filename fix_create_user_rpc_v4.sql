-- 🛠️ SCRIPT DE REPARACIÓN V4: create_new_user (NUCLEAR + SEARCH_PATH)
-- Este script es la SOLUCIÓN DEFINITIVA.
-- 1. Borra todas las versiones anteriores.
-- 2. Asegura pgcrypto en 'extensions'.
-- 3. Crea la función con el search_path CORRECTO.

-- A. LIMPIEZA TOTAL (Nuclear)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as func_signature FROM pg_proc WHERE proname = 'create_new_user' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- B. PREPARACIÓN DE EXTENSIONES
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- C. CREACIÓN DE LA FUNCIÓN (Con search_path explícito)
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
-- 🔥 AQUÍ ESTÁ LA CLAVE: Agregamos 'extensions'
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validación Admin
  IF new_role = 'administrador_general' THEN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_admin_secret') THEN
        IF NOT verify_admin_secret(p_secret) THEN RAISE EXCEPTION 'Clave de autorización inválida'; END IF;
    END IF;
  END IF;

  -- Insertar Usuario
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

  -- Insertar Identidad
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

GRANT EXECUTE ON FUNCTION public.create_new_user TO authenticated;
NOTIFY pgrst, 'reload schema';

SELECT 'REPARACIÓN COMPLETADA: search_path incluye extensions' as status;
