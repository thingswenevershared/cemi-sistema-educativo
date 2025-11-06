-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS FALTANTES A LAS TABLAS
-- Proyecto Final CEMI
-- Fecha: 2025-11-01
-- =====================================================

USE proyecto_final;

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA ACTUAL
-- =====================================================
SELECT '📋 Estructura actual de PERSONAS:' AS Info;
DESCRIBE personas;

SELECT '📋 Estructura actual de USUARIOS:' AS Info;
DESCRIBE usuarios;

-- =====================================================
-- 2. AGREGAR CAMPOS A LA TABLA PERSONAS (SI NO EXISTEN)
-- =====================================================

-- Agregar telefono (si no existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'personas' 
               AND COLUMN_NAME = 'telefono');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE personas ADD COLUMN telefono VARCHAR(20) NULL AFTER mail',
    'SELECT "⚠️ Campo telefono ya existe en personas" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar dni (si no existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'personas' 
               AND COLUMN_NAME = 'dni');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE personas ADD COLUMN dni VARCHAR(20) NULL',
    'SELECT "⚠️ Campo dni ya existe en personas" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar fecha_creacion (si no existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'personas' 
               AND COLUMN_NAME = 'fecha_creacion');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE personas ADD COLUMN fecha_creacion DATETIME DEFAULT NOW()',
    'SELECT "⚠️ Campo fecha_creacion ya existe en personas" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice para DNI (si no existe)
SET @exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'personas' 
               AND INDEX_NAME = 'idx_dni');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE personas ADD INDEX idx_dni (dni)',
    'SELECT "⚠️ Índice idx_dni ya existe" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. AGREGAR CAMPO FECHA_CREACION A LA TABLA USUARIOS
-- =====================================================
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'proyecto_final' 
               AND TABLE_NAME = 'usuarios' 
               AND COLUMN_NAME = 'fecha_creacion');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN fecha_creacion DATETIME DEFAULT NOW()',
    'SELECT "⚠️ Campo fecha_creacion ya existe en usuarios" AS Aviso');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 4. VERIFICAR LAS ESTRUCTURAS FINALES
-- =====================================================
SELECT '✅ Estructura FINAL de PERSONAS:' AS Info;
DESCRIBE personas;

SELECT '✅ Estructura FINAL de USUARIOS:' AS Info;
DESCRIBE usuarios;

SELECT '✅ ¡Script ejecutado correctamente!' AS Resultado;
