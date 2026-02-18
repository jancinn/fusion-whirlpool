-- 🔐 REPARACIÓN COMPLETA: TABLAS + FUNCIONES + ESQUEMA
-- (Complemento al script anterior)

BEGIN;

-- 1️⃣ Acceso al esquema (ya lo hiciste, pero por si acaso)
GRANT USAGE ON SCHEMA public
TO service_role, supabase_auth_admin;

-- 2️⃣ CRÍTICO: Acceso a TODAS las tablas
GRANT ALL ON ALL TABLES IN SCHEMA public
TO service_role, supabase_auth_admin;

-- 3️⃣ Acceso a funciones (ya lo hiciste, pero por si acaso)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public
TO service_role, supabase_auth_admin;

-- 4️⃣ Acceso a secuencias (para IDs autoincrementales)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public
TO service_role, supabase_auth_admin;

-- 5️⃣ Permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO service_role, supabase_auth_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO service_role, supabase_auth_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO service_role, supabase_auth_admin;

COMMIT;

-- Verificar que se aplicó
SELECT 'PERMISOS COMPLETOS RESTAURADOS' as status;
