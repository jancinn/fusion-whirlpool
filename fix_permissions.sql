-- 1️⃣ Asegurar permisos de esquema y tablas al rol authenticated
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO authenticated;

-- 2️⃣ Crear políticas mínimas SOLO en tablas con RLS activo

-- PROFILES: permitir que usuarios autenticados lean perfiles
-- (Usamos DO block para evitar error si ya existe, o simplemente intentamos crearla)
-- Nota: En el editor SQL de Supabase, si falla porque existe, no pasa nada grave.

CREATE POLICY "authenticated read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- MESSAGES: permitir que usuarios autenticados lean mensajes
CREATE POLICY "authenticated read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);
