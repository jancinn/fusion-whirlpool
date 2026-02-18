-- 🕵️ VERIFICACIÓN FASE 1: PROPUESTAS (CORREGIDO V2)

-- 1. Confirmar qué roles han creado propuestas
-- Corregido el GROUP BY para usar la expresión completa
SELECT 
    'solicitudes' as table_name, 
    auth.users.raw_user_meta_data->>'role' as role, 
    count(*) 
FROM public.solicitudes 
JOIN auth.users ON public.solicitudes.user_id = auth.users.id
GROUP BY auth.users.raw_user_meta_data->>'role';

-- 2. Confirmar tablas existentes
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name ILIKE '%propuesta%'
   OR table_name ILIKE '%proposal%'
   OR table_name ILIKE '%solicitud%'
ORDER BY table_name;
