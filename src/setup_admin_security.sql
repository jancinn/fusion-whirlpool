-- 🔐 SEGURIDAD ADMINISTRATIVA: CLAVE DE AUTORIZACIÓN
-- Este script crea la infraestructura para una segunda capa de validación en acciones críticas.

-- 1. Crear tabla segura para guardar la clave cifrada
CREATE TABLE IF NOT EXISTS admin_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insertar la clave inicial (bcrypt)
-- La clave es 'admiXN@310'
INSERT INTO admin_security (secret_hash)
SELECT crypt('admiXN@310', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM admin_security);

-- 3. Función para validar la clave
CREATE OR REPLACE FUNCTION verify_admin_secret(p_secret TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT secret_hash
  INTO stored_hash
  FROM admin_security
  LIMIT 1;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN extensions.crypt(p_secret, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql;

-- 4. Permisos
GRANT EXECUTE ON FUNCTION verify_admin_secret TO authenticated;

-- Comentario de confirmación
COMMENT ON TABLE admin_security IS 'Almacena el hash de la clave secreta para acciones administrativas críticas.';
