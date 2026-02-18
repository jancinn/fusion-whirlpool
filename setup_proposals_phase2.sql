-- 🚀 FASE 2: IMPLEMENTACIÓN DE FLUJO DE PROPUESTAS
-- Objetivo: Diferenciar Sugerencias (Directores) de Propuestas (Coordinadores)

BEGIN;

-- 1️⃣ AGREGAR COLUMNAS A TABLA SOLICITUDES
ALTER TABLE public.solicitudes
ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'propuesta' CHECK (tipo IN ('propuesta', 'sugerencia')),
ADD COLUMN IF NOT EXISTS sugerida_por uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dirigida_a uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS responsable_oficial uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS source_suggestion_id uuid REFERENCES public.solicitudes(id);

-- Actualizar registros existentes para que sean propuestas oficiales (asumimos legado)
UPDATE public.solicitudes SET tipo = 'propuesta' WHERE tipo IS NULL;

-- 2️⃣ ACTUALIZAR POLÍTICAS RLS

-- Primero, aseguramos que RLS esté activo
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Eliminamos políticas anteriores que puedan entrar en conflicto (ajustar nombres si es necesario)
-- DROP POLICY IF EXISTS "..." ON public.solicitudes; 
-- (Como no conocemos los nombres exactos anteriores, creamos nuevas con prioridad o asumimos limpieza manual si falla)

-- A. INSERT (Crear)
-- Coordinadores: Pueden crear Propuestas y Sugerencias
CREATE POLICY "Crear Solicitudes: Coordinadores"
ON public.solicitudes FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('coordinador_general', 'coordinador_area', 'coordinador_operativo', 'coordinador_ministerio')
);

-- Directores: SOLO pueden crear Sugerencias
CREATE POLICY "Crear Sugerencias: Directores"
ON public.solicitudes FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') LIKE 'director%' 
  AND tipo = 'sugerencia'
);

-- Admin: Todo
CREATE POLICY "Crear Todo: Admin"
ON public.solicitudes FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador_general'
);

-- B. SELECT (Ver)
-- Directores: Solo ven sus propias sugerencias (y propuestas si fueran autores, por compatibilidad)
CREATE POLICY "Ver Propias: Directores"
ON public.solicitudes FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') LIKE 'director%'
  AND (sugerida_por = auth.uid() OR user_id = auth.uid())
);

-- Coordinadores: Ven lo de su área (simplificación) o dirigido a ellos, y lo propio
CREATE POLICY "Ver Area/Propias: Coordinadores"
ON public.solicitudes FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') LIKE 'coordinador%'
  AND (
    dirigida_a = auth.uid() 
    OR user_id = auth.uid() 
    OR responsable_oficial = auth.uid()
    -- Opcional: Ver todas las de su área si quisiéramos agregar lógica de área
  )
);

-- Admin: Ve TODO (El filtrado de "Solo Propuestas" se hará en Frontend para no restringir DB innecesariamente en admin)
CREATE POLICY "Ver Todo: Admin"
ON public.solicitudes FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador_general'
);

-- C. UPDATE (Editar)
-- Coordinadores pueden editar lo suyo y tomar sugerencias
CREATE POLICY "Editar: Coordinadores"
ON public.solicitudes FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') LIKE 'coordinador%'
  AND (user_id = auth.uid() OR responsable_oficial = auth.uid())
);

NOTIFY pgrst, 'reload schema';

COMMIT;
