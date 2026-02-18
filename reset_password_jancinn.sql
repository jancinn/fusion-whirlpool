-- 🔐 RESTABLECER CONTRASEÑA DE ADMINISTRADOR
-- Ejecuta esto en el SQL Editor de Supabase para fijar la contraseña a: inn123

UPDATE auth.users 
SET encrypted_password = crypt('inn123', gen_salt('bf')),
    updated_at = now(),
    email_confirmed_at = now() -- Asegurar que el email esté confirmado
WHERE email = 'jancinn@gmail.com';

-- Verificar que el usuario existe y fue actualizado
SELECT id, email, updated_at, email_confirmed_at
FROM auth.users 
WHERE email = 'jancinn@gmail.com';
