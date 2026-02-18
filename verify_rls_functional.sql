-- 🧪 VERIFICACIÓN INTEGRAL DE RLS (POLÍTICAS Y PRUEBAS FUNCIONALES)

BEGIN;

-- 1️⃣ LISTAR POLÍTICAS ACTIVAS
-- Esto nos permite ver visualmente qué reglas existen.
SELECT
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'solicitudes';

-- 2️⃣ PRUEBAS FUNCIONALES SIMULADAS
-- Usamos un bloque anónimo para simular diferentes usuarios y probar las reglas.

DO $$
DECLARE
    v_director_id uuid := gen_random_uuid();
    v_coordinador_id uuid := gen_random_uuid();
    v_error_text text;
BEGIN
    RAISE NOTICE '--- INICIANDO PRUEBAS DE SEGURIDAD RLS ---';

    ----------------------------------------------------------------
    -- CASO 1: DIRECTOR INTENTA CREAR PROPUESTA FORMAL (DEBE FALLAR)
    ----------------------------------------------------------------
    BEGIN
        -- Simular sesión de Director
        PERFORM set_config('request.jwt.claims', json_build_object(
            'sub', v_director_id,
            'role', 'authenticated',
            'user_metadata', json_build_object('role', 'director_ministerio')
        )::text, true);
        PERFORM set_config('role', 'authenticated', true);

        -- Intento de inserción prohibida
        INSERT INTO public.solicitudes (user_id, tipo, activity_type, area, event_date, event_time, status)
        VALUES (v_director_id, 'propuesta', 'INTENTO ILEGAL DIRECTOR', 'ministerial', '2025-01-01', '10:00', 'pendiente');

        -- Si llega aquí, falló la seguridad
        RAISE EXCEPTION '❌ FALLO DE SEGURIDAD: El Director pudo crear una propuesta formal.';
    EXCEPTION WHEN insufficient_privilege OR row_security_policy_violation THEN
        RAISE NOTICE '✅ ÉXITO: El sistema bloqueó al Director de crear una propuesta formal.';
    END;

    ----------------------------------------------------------------
    -- CASO 2: DIRECTOR INTENTA CREAR SUGERENCIA (DEBE FUNCIONAR)
    ----------------------------------------------------------------
    BEGIN
        -- (La sesión sigue siendo Director)
        
        -- Intento de inserción permitida
        INSERT INTO public.solicitudes (user_id, tipo, activity_type, area, event_date, event_time, status)
        VALUES (v_director_id, 'sugerencia', 'Sugerencia Legítima', 'ministerial', '2025-01-01', '10:00', 'pendiente_de_revision');

        RAISE NOTICE '✅ ÉXITO: El Director pudo crear una sugerencia correctamente.';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_text = MESSAGE_TEXT;
        RAISE EXCEPTION '❌ FALLO FUNCIONAL: El Director NO pudo crear una sugerencia. Error: %', v_error_text;
    END;

    ----------------------------------------------------------------
    -- CASO 3: COORDINADOR INTENTA CREAR PROPUESTA (DEBE FUNCIONAR)
    ----------------------------------------------------------------
    BEGIN
        -- Simular sesión de Coordinador
        PERFORM set_config('request.jwt.claims', json_build_object(
            'sub', v_coordinador_id,
            'role', 'authenticated',
            'user_metadata', json_build_object('role', 'coordinador_ministerio')
        )::text, true);
        PERFORM set_config('role', 'authenticated', true);

        -- Intento de inserción permitida
        INSERT INTO public.solicitudes (user_id, tipo, activity_type, area, event_date, event_time, status)
        VALUES (v_coordinador_id, 'propuesta', 'Propuesta Oficial Coordinador', 'ministerial', '2025-01-01', '10:00', 'pendiente');

        RAISE NOTICE '✅ ÉXITO: El Coordinador pudo crear una propuesta formal correctamente.';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_text = MESSAGE_TEXT;
        RAISE EXCEPTION '❌ FALLO FUNCIONAL: El Coordinador NO pudo crear una propuesta. Error: %', v_error_text;
    END;

    RAISE NOTICE '--- TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE ---';
    
    -- Rollback explícito de los datos de prueba para no ensuciar la DB
    RAISE EXCEPTION 'PRUEBAS FINALIZADAS (Rollback automático para limpieza)';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'PRUEBAS FINALIZADAS (Rollback automático para limpieza)' THEN
        RAISE NOTICE '%', SQLERRM;
    ELSE
        RAISE NOTICE '❌ ERROR EN PRUEBAS: %', SQLERRM;
    END IF;
END $$;

ROLLBACK; -- Aseguramos que nada se guarde realmente
