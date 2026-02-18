-- 🔍 DIAGNÓSTICO: Inspección de Metadata Completa
CREATE OR REPLACE FUNCTION debug_inspect_metadata()
RETURNS TABLE (
  email TEXT,
  full_metadata JSONB
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.email::TEXT,
    u.raw_user_meta_data
  FROM auth.users u
  WHERE u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION debug_inspect_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION debug_inspect_metadata TO anon;
GRANT EXECUTE ON FUNCTION debug_inspect_metadata TO service_role;
