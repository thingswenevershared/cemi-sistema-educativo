-- =====================================================
-- Migración: Agregar campos para perfil de usuario
-- =====================================================

USE cemi_educativo;

-- Agregar columnas a la tabla personas
-- Si alguna ya existe, comentarla manualmente

ALTER TABLE personas
ADD COLUMN `fecha_nacimiento` DATE DEFAULT NULL;

ALTER TABLE personas
ADD COLUMN `direccion` VARCHAR(255) DEFAULT NULL;

ALTER TABLE personas  
ADD COLUMN `biografia` TEXT DEFAULT NULL;

ALTER TABLE personas
ADD COLUMN `avatar` VARCHAR(255) DEFAULT NULL;

-- Mensaje de confirmación
SELECT '✅ Migración completada: Campos de perfil agregados a la tabla personas' AS Resultado;
