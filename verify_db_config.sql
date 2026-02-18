-- 🕵️‍♂️ SCRIPT DE VERIFICACIÓN DE CONFIGURACIÓN
-- Ejecuta esto para confirmar dónde está pgcrypto y cómo está configurada la función.

-- 1. Verificar ubicación de pgcrypto
SELECT 
    e.extname as extension, 
    n.nspname as schema, 
    e.extversion as version
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE e.extname = 'pgcrypto';

-- 2. Verificar search_path de create_new_user
SELECT 
    proname as function_name, 
    proconfig as configuration_settings
FROM pg_proc 
WHERE proname = 'create_new_user';

-- Si 'proconfig' muestra algo como {"search_path=public,auth,extensions"}, ESTÁ CORRECTO.
