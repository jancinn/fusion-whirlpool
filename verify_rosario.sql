-- 🕵️‍♀️ SCRIPT DE VERIFICACIÓN: Buscar usuario 'Rosario'
-- Ejecuta esto para ver si el usuario existe realmente en la base de datos de Auth.

select 
  id, 
  email, 
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'role' as role,
  deleted_at
from auth.users
where email ilike '%rosario%';
