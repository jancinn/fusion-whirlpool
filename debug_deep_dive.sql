-- DIAGNÓSTICO PROFUNDO (Ejecutar en SQL Editor)
-- Devuelve un JSON con el estado de permisos, triggers y políticas.

SELECT json_build_object(
  'permissions', json_build_object(
    'public_usage', has_schema_privilege('authenticated', 'public', 'usage'),
    'profiles_select', has_table_privilege('authenticated', 'public.profiles', 'select'),
    'messages_select', has_table_privilege('authenticated', 'public.messages', 'select')
  ),
  'triggers_on_auth_users', (
    SELECT json_agg(json_build_object('name', tgname, 'enabled', tgenabled))
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
  ),
  'rls_policies', (
    SELECT json_agg(policyname)
    FROM pg_policies
    WHERE schemaname = 'public'
  ),
  'current_user_role', (
    SELECT role FROM auth.users WHERE email = 'jancinn@gmail.com'
  )
);
