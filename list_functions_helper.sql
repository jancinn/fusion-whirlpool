-- 🔍 HELPER PARA INSPECCIONAR FUNCIONES
CREATE OR REPLACE FUNCTION list_public_functions()
RETURNS TABLE (
  function_name TEXT,
  argument_types TEXT
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT as function_name,
    pg_get_function_arguments(p.oid)::TEXT as argument_types
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY p.proname;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION list_public_functions TO authenticated;
GRANT EXECUTE ON FUNCTION list_public_functions TO anon;
