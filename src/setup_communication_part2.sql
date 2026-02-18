-- 1️⃣ Policy para ver mensajes ENVIADOS (Faltante)
create policy "read sent messages"
on public.messages
for select
using (sender_id = auth.uid());

-- 2️⃣ Policy para que el Admin vea TODO (Monitor Global)
create policy "admin read all"
on public.messages
for select
using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'administrador_general'
);

-- 3️⃣ Función para obtener directorio de usuarios (Para el dropdown "Para:")
-- Permite a cualquier usuario autenticado ver la lista de nombres/emails para enviar mensajes.
CREATE OR REPLACE FUNCTION get_directory()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  first_name TEXT,
  last_name TEXT,
  role TEXT
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::VARCHAR,
    au.raw_user_meta_data ->> 'first_name',
    au.raw_user_meta_data ->> 'last_name',
    au.raw_user_meta_data ->> 'role'
  FROM auth.users au
  ORDER BY au.raw_user_meta_data ->> 'first_name' ASC;
END;
$$ LANGUAGE plpgsql;

-- Dar permiso de ejecución a todos los autenticados
GRANT EXECUTE ON FUNCTION get_directory TO authenticated;
