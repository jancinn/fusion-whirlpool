-- 🕵️ VERIFICACIÓN DE POLÍTICAS RLS
-- Lista todas las políticas activas en la tabla 'solicitudes' para verificar conflictos.

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'solicitudes'
ORDER BY
    policyname;
