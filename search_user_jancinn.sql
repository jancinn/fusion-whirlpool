-- 🔍 BÚSQUEDA EXHAUSTIVA DE jancinn@gmail.com
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1️⃣ Buscar en auth.users
-- ============================================
select id, email, created_at, email_confirmed_at, 
       raw_user_meta_data->>'role' as role,
       raw_user_meta_data->>'first_name' as first_name,
       raw_user_meta_data->>'last_name' as last_name
from auth.users
where email ilike 'jancinn@gmail.com';

-- ============================================
-- 2️⃣ Buscar en auth.identities
-- ============================================
select i.id, i.user_id, i.provider, i.identity_data->>'email' as email
from auth.identities i
join auth.users u on u.id = i.user_id
where u.email ilike 'jancinn@gmail.com';

-- ============================================
-- 3️⃣ Buscar en profiles (por si quedó basura)
-- ============================================
select id, email, user_id, created_at
from public.profiles
where email ilike 'jancinn@gmail.com';

-- ============================================
-- 4️⃣ Buscar en messages (enviados o recibidos)
-- ============================================
select m.id, m.subject, m.created_at,
       sender.email as sender_email,
       recipient.email as recipient_email
from public.messages m
left join auth.users sender on sender.id = m.sender_id
left join auth.users recipient on recipient.id = m.recipient_id
where sender.email ilike 'jancinn@gmail.com'
   or recipient.email ilike 'jancinn@gmail.com';

-- ============================================
-- 5️⃣ Buscar en solicitudes
-- ============================================
select s.id, s.activity_type, s.status, s.created_at,
       u.email as creator_email
from public.solicitudes s
left join auth.users u on u.id = s.user_id
where u.email ilike 'jancinn@gmail.com';

-- ============================================
-- 6️⃣ Buscar en actas (si las creó)
-- ============================================
select a.id, a.fecha_reunion, a.tipo_reunion, a.estado,
       u.email as creator_email
from public.actas a
left join auth.users u on u.id = a.creado_por
where u.email ilike 'jancinn@gmail.com';


-- ============================================
-- DESPUÉS DE OBTENER EL UUID, EJECUTAR:
-- ============================================
-- Reemplaza 'UUID_AQUI' con el UUID obtenido del paso 1

-- Buscar TODAS las referencias al UUID en public
DO $$
DECLARE
    target_uuid uuid := 'UUID_AQUI'; -- REEMPLAZAR
    rec record;
BEGIN
    FOR rec IN 
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type = 'uuid'
    LOOP
        EXECUTE format('SELECT %L as table_name, %L as column_name, count(*) as count FROM %I.%I WHERE %I = %L',
            rec.table_name, rec.column_name, 'public', rec.table_name, rec.column_name, target_uuid);
    END LOOP;
END $$;
