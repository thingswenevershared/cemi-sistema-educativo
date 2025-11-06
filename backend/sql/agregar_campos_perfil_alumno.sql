-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS DE PERFIL AL ALUMNO
-- Proyecto Final CEMI
-- Fecha: 2025-11-02
-- =====================================================

USE proyecto_final;

-- =====================================================
-- AGREGAR CAMPOS A LA TABLA ALUMNOS
-- =====================================================

-- Agregar domicilio (si no existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'alumnos' 
               AND COLUMN_NAME = 'domicilio');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE alumnos ADD COLUMN domicilio VARCHAR(200) NULL AFTER telefono',
    'SELECT "⚠️ Campo domicilio ya existe en alumnos" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar fecha_nacimiento (si no existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'alumnos' 
               AND COLUMN_NAME = 'fecha_nacimiento');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE alumnos ADD COLUMN fecha_nacimiento DATE NULL AFTER domicilio',
    'SELECT "⚠️ Campo fecha_nacimiento ya existe en alumnos" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- VERIFICAR ESTRUCTURA FINAL
-- =====================================================
SELECT '✅ Estructura FINAL de ALUMNOS:' AS Info;
DESCRIBE alumnos;

SELECT '✅ ¡Script ejecutado correctamente!' AS Resultado;
