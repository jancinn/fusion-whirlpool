-- Verificación de Permisos
-- Ejecuta esto y mira el resultado (t, f, true, false)

SELECT 
  has_schema_privilege('authenticated', 'public', 'usage') as tiene_uso_public,
  has_table_privilege('authenticated', 'public.profiles', 'select') as puede_leer_profiles,
  has_table_privilege('authenticated', 'public.messages', 'select') as puede_leer_messages;
