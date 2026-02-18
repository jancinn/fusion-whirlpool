-- 🔒 AUDITORÍA Y BLINDAJE DE ACTAS
-- Objetivo: Garantizar tabla única y acceso exclusivo para administrador_general y secretaria.

BEGIN;

-- 1️⃣ Asegurar que solo existe la tabla 'actas'
-- (No podemos borrar otras tablas ciegamente, pero aseguramos que esta es la oficial)
-- Si existieran 'minutes' o 'actas_old', deberían ser eliminadas manualmente o archivadas.

-- 2️⃣ RESET TOTAL DE RLS (Eliminar políticas anteriores permisivas)
DROP POLICY IF EXISTS "Crear Actas: Secretaria y Coord General" ON public.actas;
DROP POLICY IF EXISTS "Ver Actas: Roles Autorizados" ON public.actas;
DROP POLICY IF EXISTS "Editar Borradores: Secretaria y Coord General" ON public.actas;
DROP POLICY IF EXISTS "Editar Cerradas/Oficiales: Solo Coord General" ON public.actas;
DROP POLICY IF EXISTS "Borrar Actas: Solo Coord General" ON public.actas;

-- 3️⃣ NUEVAS POLÍTICAS ESTRICTAS (Solo admin y secretaria)

-- A. SELECT (Ver)
CREATE POLICY "Ver Actas: Solo Admin y Secretaria"
ON public.actas FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('administrador_general', 'secretaria')
);

-- B. INSERT (Crear)
CREATE POLICY "Crear Actas: Solo Admin y Secretaria"
ON public.actas FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('administrador_general', 'secretaria')
);

-- C. UPDATE (Editar)
-- Ambos pueden editar borradores.
-- Solo Admin puede editar/cerrar actas finales (opcional, pero seguro).
CREATE POLICY "Editar Actas: Solo Admin y Secretaria"
ON public.actas FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('administrador_general', 'secretaria')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('administrador_general', 'secretaria')
);

-- D. DELETE (Borrar)
-- Solo Administrador General
CREATE POLICY "Borrar Actas: Solo Admin General"
ON public.actas FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador_general'
);

-- 4️⃣ Notificar cambio de esquema
NOTIFY pgrst, 'reload schema';

COMMIT;
