UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "administrador_general"}'::jsonb 
WHERE email = 'fava839@gmail.com';
