-- Actualizar el rol de jancinn@gmail.com a 'administrador_general'
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', 'administrador_general')
WHERE email = 'jancinn@gmail.com';

-- Verificar el cambio
SELECT email, raw_user_meta_data->>'role' as new_role 
FROM auth.users 
WHERE email = 'jancinn@gmail.com';
