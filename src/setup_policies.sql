-- Habilitar RLS (Seguridad a Nivel de Fila) en la tabla solicitudes
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- 1. PERMITIR CREAR (INSERT)
-- Cualquier usuario autenticado puede crear una solicitud.
CREATE POLICY "Usuarios autenticados pueden crear solicitudes"
ON solicitudes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. PERMITIR VER (SELECT)
-- Por ahora, para que puedas probar el sistema de Aprobaciones,
-- permitiremos que cualquier usuario autenticado vea TODAS las solicitudes.
-- (Más adelante restringiremos esto solo a Admins)
CREATE POLICY "Usuarios autenticados pueden ver todas las solicitudes"
ON solicitudes FOR SELECT
TO authenticated
USING (true);

-- 3. PERMITIR ACTUALIZAR (UPDATE)
-- Necesario para que puedas Aprobar/Rechazar (cambiar el status).
-- También abierto a autenticados por ahora para pruebas.
CREATE POLICY "Usuarios autenticados pueden actualizar solicitudes"
ON solicitudes FOR UPDATE
TO authenticated
USING (true);
