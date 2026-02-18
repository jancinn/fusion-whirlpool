-- 🔐 HABILITAR PGCRYPTO
-- Esta extensión es necesaria para las funciones de hash de contraseñas (crypt, gen_salt).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT 'Extensión pgcrypto habilitada correctamente' as status;
