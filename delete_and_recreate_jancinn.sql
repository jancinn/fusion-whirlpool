-- 🔐 ELIMINACIÓN Y RECREACIÓN COMPLETA DE jancinn@gmail.com
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PASO 1: OBTENER UUID Y VERIFICAR EXISTENCIA
-- ============================================
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Obtener UUID
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'jancinn@gmail.com';
    
    IF user_uuid IS NULL THEN
        RAISE NOTICE 'Usuario no encontrado';
    ELSE
        RAISE NOTICE 'Usuario encontrado: %', user_uuid;
        
        -- ============================================
        -- PASO 2: ELIMINAR DATOS RELACIONADOS
        -- ============================================
        
        -- Eliminar de profiles
        DELETE FROM public.profiles WHERE id = user_uuid OR email = 'jancinn@gmail.com';
        RAISE NOTICE 'Profiles eliminados';
        
        -- Eliminar mensajes
        DELETE FROM public.messages WHERE sender_id = user_uuid OR recipient_id = user_uuid;
        RAISE NOTICE 'Mensajes eliminados';
        
        -- Eliminar solicitudes
        DELETE FROM public.solicitudes WHERE user_id = user_uuid;
        RAISE NOTICE 'Solicitudes eliminadas';
        
        -- Eliminar actas
        DELETE FROM public.actas WHERE creado_por = user_uuid;
        RAISE NOTICE 'Actas eliminadas';
        
        -- ============================================
        -- PASO 3: ELIMINAR IDENTIDADES
        -- ============================================
        DELETE FROM auth.identities WHERE user_id = user_uuid;
        RAISE NOTICE 'Identidades eliminadas';
        
        -- ============================================
        -- PASO 4: ELIMINAR USUARIO
        -- ============================================
        DELETE FROM auth.users WHERE id = user_uuid;
        RAISE NOTICE 'Usuario eliminado completamente';
    END IF;
END $$;


-- ============================================
-- PASO 5: RECREAR USUARIO (MÉTODO DIRECTO)
-- ============================================
DO $$
DECLARE
    new_user_id uuid;
    new_identity_id uuid;
BEGIN
    -- Generar UUIDs
    new_user_id := gen_random_uuid();
    new_identity_id := gen_random_uuid();
    
    -- Crear usuario en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'jancinn@gmail.com',
        crypt('inn123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object(
            'first_name', 'Jorge',
            'last_name', 'Sr',
            'role', 'administrador_general'
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );
    
    -- Crear identidad en auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        provider,
        identity_data,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        new_identity_id,
        new_user_id,
        new_user_id::text,
        'email',
        jsonb_build_object(
            'sub', new_user_id::text,
            'email', 'jancinn@gmail.com'
        ),
        now(),
        now(),
        now()
    );
    
    RAISE NOTICE 'Usuario recreado con ID: %', new_user_id;
END $$;


-- ============================================
-- PASO 6: VERIFICAR
-- ============================================
SELECT 
    id, 
    email, 
    email_confirmed_at,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    created_at
FROM auth.users 
WHERE email = 'jancinn@gmail.com';

-- Verificar identidad
SELECT 
    id,
    user_id,
    provider,
    identity_data->>'email' as email
FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jancinn@gmail.com');
