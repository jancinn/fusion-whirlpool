DO $$
DECLARE
    r RECORD;
BEGIN
    -- Borrar TODAS las variantes de la función create_new_user
    FOR r IN (SELECT oid::regprocedure as func_signature FROM pg_proc WHERE proname = 'create_new_user' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

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
  -- Validación Admin
  IF new_role = 'administrador_general' THEN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_admin_secret') THEN
        IF NOT verify_admin_secret(p_secret) THEN RAISE EXCEPTION 'Clave de autorización inválida'; END IF;
    END IF;
  END IF;

  -- Insertar Usuario
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', new_email, crypt(new_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('first_name', new_first_name, 'last_name', new_last_name, 'role', new_role), now(), now(), '', '', '', ''
  ) RETURNING id INTO new_user_id;

  -- Insertar Identidad
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES (
    gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id, new_email)::jsonb, 'email', now(), now(), now()
  );

  RETURN json_build_object('success', true, 'message', 'Usuario creado correctamente', 'user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_new_user TO authenticated;
NOTIFY pgrst, 'reload schema';
