-- Habilitar RLS
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Politica de Visibilidad de Solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Politica de Edicion de Solicitudes" ON solicitudes;

-- 1. INSERT — cualquier usuario autenticado puede crear solicitudes
-- (incluyendo coordinadores enviando por otros)
CREATE POLICY "Usuarios autenticados pueden crear solicitudes"
ON solicitudes FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. SELECT — el dueño ve las suyas; admin y coordinadores ven todas
CREATE POLICY "Politica de Visibilidad de Solicitudes"
ON solicitudes FOR SELECT TO authenticated
USING (
  (auth.uid() = user_id)
  OR ((auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin','coordinador','coordinador_operativo'))
);

-- 3. UPDATE — solo Admin / Coordinador / Coordinador Operativo pueden editar
CREATE POLICY "Politica de Edicion de Solicitudes"
ON solicitudes FOR UPDATE TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')
  IN ('admin','coordinador','coordinador_operativo')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role')
  IN ('admin','coordinador','coordinador_operativo')
);
