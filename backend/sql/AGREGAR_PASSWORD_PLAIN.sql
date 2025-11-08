-- =============================================
-- AGREGAR COLUMNA password_plain A TABLA usuarios
-- =============================================
-- Esta columna guardará las contraseñas en texto plano
-- para que los administradores puedan verlas y comunicarlas
-- a los usuarios que olviden sus credenciales.
-- =============================================

USE railway;

-- Agregar columna password_plain (permitir NULL para usuarios existentes)
ALTER TABLE usuarios 
ADD COLUMN password_plain TEXT NULL 
COMMENT 'Contraseña en texto plano para que admins puedan visualizarla';

-- Verificar que se agregó correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'railway'
  AND TABLE_NAME = 'usuarios'
  AND COLUMN_NAME = 'password_plain';

SELECT '✅ Columna password_plain agregada correctamente' AS resultado;
