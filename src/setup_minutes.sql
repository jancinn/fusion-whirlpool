-- TABLA MAESTRA: ACTAS
-- Almacena el historial de juntas con snapshots inmutables.

CREATE TABLE IF NOT EXISTS actas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio SERIAL UNIQUE, -- Número secuencial legible
  created_at TIMESTAMPTZ DEFAULT now(),
  fecha_reunion DATE NOT NULL,
  tipo_reunion TEXT NOT NULL,
  
  -- Estado del ciclo de vida
  estado TEXT CHECK (estado IN ('borrador', 'cerrada', 'oficial')) DEFAULT 'borrador',
  es_oficial BOOLEAN DEFAULT false,
  
  -- Visibilidad y Acceso
  visibilidad TEXT DEFAULT 'interno', -- 'interno' (roles autorizados), 'publico' (si se requiere futuro)
  
  -- Datos de la Reunión
  asistentes JSONB DEFAULT '[]'::jsonb, -- Lista estructurada de asistentes
  acuerdos_extra JSONB DEFAULT '[]'::jsonb, -- Acuerdos generales no vinculados a solicitudes
  
  -- SNAPSHOT CRÍTICO (Auditoría Histórica)
  -- Guarda una copia congelada de las solicitudes aprobadas en ese momento
  snapshot_solicitudes JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Documento Oficial
  pdf_url TEXT, -- Solo si es_oficial = true
  
  -- Metadatos
  creado_por UUID REFERENCES auth.users(id)
);

-- HABILITAR RLS
ALTER TABLE actas ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURIDAD (RLS) - DEFINICIÓN ESTRICTA DE ROLES

-- 1. INSERT (Crear)
-- SOLO: secretaria, coordinador_general
CREATE POLICY "Crear Actas: Secretaria y Coord General"
ON actas FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('secretaria', 'coordinador_general')
);

-- 2. SELECT (Ver)
-- PERMITIDO: coordinador_general, secretaria, coordinador_area, coordinador_operativo
-- DENEGADO: director (y cualquier otro no listado)
CREATE POLICY "Ver Actas: Roles Autorizados"
ON actas FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('coordinador_general', 'secretaria', 'coordinador_area', 'coordinador_operativo')
);

-- 3. UPDATE (Editar)
-- CASO A: Estado 'borrador' -> Secretaria y Coord General
CREATE POLICY "Editar Borradores: Secretaria y Coord General"
ON actas FOR UPDATE
TO authenticated
USING (
  estado = 'borrador' 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('secretaria', 'coordinador_general')
)
WITH CHECK (
  estado = 'borrador'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('secretaria', 'coordinador_general')
);

-- CASO B: Estado 'cerrada' u 'oficial' -> SOLO Coordinador General
-- Nota: Incluso el Coord General tiene límites si se quisiera inmutabilidad total, 
-- pero el requerimiento dice "excepto el coordinador_general".
CREATE POLICY "Editar Cerradas/Oficiales: Solo Coord General"
ON actas FOR UPDATE
TO authenticated
USING (
  estado IN ('cerrada', 'oficial')
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinador_general'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinador_general'
);

-- 4. DELETE (Borrar)
-- SOLO: coordinador_general
CREATE POLICY "Borrar Actas: Solo Coord General"
ON actas FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinador_general'
);
