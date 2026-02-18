-- 🚀 PROMOCIÓN MANUAL DE ADMINISTRADOR GENERAL
-- Ejecuta este script en el SQL Editor de Supabase para asegurar que tu cuenta tenga los permisos correctos.

UPDATE auth.users 
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', 'administrador_general',
    'first_name', 'Jorge',
    'last_name', 'Sr'
  )
WHERE email = 'jancinn@gmail.com';

-- Verificar el cambio
SELECT id, email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'jancinn@gmail.com';
