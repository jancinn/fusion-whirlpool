-- 🔐 SCRIPT PARA ELIMINAR Y RECREAR jancinn@gmail.com
-- Ejecutar paso a paso en Supabase SQL Editor

-- ============================================
-- PASO 1: OBTENER EL UUID DEL USUARIO
-- ============================================
select id, email, created_at 
from auth.users 
where email = 'jancinn@gmail.com';

-- ⚠️ COPIA EL UUID QUE TE DEVUELVE
-- Ejemplo: 12345678-1234-1234-1234-123456789abc


-- ============================================
-- PASO 2: ELIMINAR EL USUARIO (FORMA SEGURA)
-- ============================================
-- Reemplaza 'PEGA_AQUI_EL_UUID' con el UUID del paso 1

-- OPCIÓN A: Si existe la función admin_delete_user
-- select auth.admin_delete_user('PEGA_AQUI_EL_UUID');

-- OPCIÓN B: Si no existe la función (más común en proyectos nuevos)
-- DELETE FROM auth.users WHERE id = 'PEGA_AQUI_EL_UUID';


-- ============================================
-- PASO 3: LIMPIAR DATOS RELACIONADOS
-- ============================================
-- Eliminar perfil si existe
delete from profiles where email = 'jancinn@gmail.com';

-- Eliminar mensajes enviados/recibidos (si existen)
delete from messages where sender_id = 'PEGA_AQUI_EL_UUID' OR recipient_id = 'PEGA_AQUI_EL_UUID';

-- Eliminar solicitudes creadas (si existen)
delete from solicitudes where user_id = 'PEGA_AQUI_EL_UUID';


-- ============================================
-- PASO 4: RECREAR EL USUARIO
-- ============================================
-- Usa la función create_user que ya tienes en tu proyecto
-- IMPORTANTE: Ejecuta esto desde el backdoor admin@inn.com

-- Opción 1: Desde la app (recomendado)
-- 1. Login con admin@inn.com / admin123
-- 2. Ir a /registro-usuarios
-- 3. Crear usuario con:
--    - Email: jancinn@gmail.com
--    - Password: 123456 (o la que prefieras)
--    - Nombre: Jorge
--    - Apellido: Sr
--    - Rol: administrador_general


-- Opción 2: Desde SQL (si prefieres)
-- NOTA: Esto requiere que estés logueado como admin en la app
-- y que la función create_user esté disponible

-- INSERT INTO auth.users (
--   id,
--   instance_id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   created_at,
--   updated_at
-- )
-- VALUES (
--   gen_random_uuid(),
--   '00000000-0000-0000-0000-000000000000',
--   'authenticated',
--   'authenticated',
--   'jancinn@gmail.com',
--   crypt('123456', gen_salt('bf')),
--   now(),
--   '{"provider":"email","providers":["email"]}',
--   '{"first_name":"Jorge","last_name":"Sr","role":"administrador_general"}',
--   now(),
--   now()
-- );


-- ============================================
-- PASO 5: VERIFICAR
-- ============================================
select id, email, raw_user_meta_data->>'role' as role
from auth.users 
where email = 'jancinn@gmail.com';
