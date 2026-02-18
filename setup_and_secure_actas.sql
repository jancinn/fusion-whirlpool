-- 🛠️ SETUP COMPLETO: TABLA ACTAS + SEGURIDAD BLINDADA
-- Este script crea la tabla si no existe y aplica las políticas de seguridad estrictas.

BEGIN;

-- 1️⃣ CREACIÓN DE TABLA (Si no existe)
CREATE TABLE IF NOT EXISTS public.actas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio SERIAL UNIQUE, -- Número secuencial legible
  created_at TIMESTAMPTZ DEFAULT now(),
  fecha_reunion DATE NOT NULL,
  tipo_reunion TEXT NOT NULL,
  
  -- Estado del ciclo de vida
  estado TEXT CHECK (estado IN ('borrador', 'cerrada', 'oficial')) DEFAULT 'borrador',
  es_oficial BOOLEAN DEFAULT false,
  
  -- Visibilidad y Acceso
  visibilidad TEXT DEFAULT 'interno', 
  
  -- Datos de la Reunión
  asistentes JSONB DEFAULT '[]'::jsonb, 
  acuerdos_extra JSONB DEFAULT '[]'::jsonb, 
  
  -- SNAPSHOT CRÍTICO (Auditoría Histórica)
  snapshot_solicitudes JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Documento Oficial
  pdf_url TEXT, 
  
  -- Metadatos
  creado_por UUID REFERENCES auth.users(id)
);

-- 2️⃣ HABILITAR RLS
ALTER TABLE public.actas ENABLE ROW LEVEL SECURITY;

-- 3️⃣ LIMPIEZA DE POLÍTICAS ANTIGUAS (Para evitar duplicados o conflictos)
DROP POLICY IF EXISTS "Crear Actas: Secretaria y Coord General" ON public.actas;
DROP POLICY IF EXISTS "Ver Actas: Roles Autorizados" ON public.actas;
DROP POLICY IF EXISTS "Editar Borradores: Secretaria y Coord General" ON public.actas;
DROP POLICY IF EXISTS "Editar Cerradas/Oficiales: Solo Coord General" ON public.actas;
DROP POLICY IF EXISTS "Borrar Actas: Solo Coord General" ON public.actas;
DROP POLICY IF EXISTS "Ver Actas: Solo Admin y Secretaria" ON public.actas;
DROP POLICY IF EXISTS "Crear Actas: Solo Admin y Secretaria" ON public.actas;
DROP POLICY IF EXISTS "Editar Actas: Solo Admin y Secretaria" ON public.actas;
DROP POLICY IF EXISTS "Borrar Actas: Solo Admin General" ON public.actas;

-- 4️⃣ APLICAR POLÍTICAS ESTRICTAS (Solo Admin y Secretaria)

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

-- 5️⃣ Notificar cambio de esquema
NOTIFY pgrst, 'reload schema';

COMMIT;
