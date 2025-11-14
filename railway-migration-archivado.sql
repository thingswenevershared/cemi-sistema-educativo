-- Railway Database Migration Script
-- Se ejecuta automáticamente al desplegar en Railway
-- Para ejecutar manualmente: Conectarse a la base de datos de Railway y ejecutar este script

-- Verificar y agregar columna archivado si no existe
SET @dbname = DATABASE();
SET @tablename = 'pagos';
SET @columnname = 'archivado';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE pagos ADD COLUMN archivado TINYINT(1) DEFAULT 0 AFTER estado_pago'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Crear índice si no existe
SET @indexname = 'idx_archivado';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND INDEX_NAME = @indexname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE pagos ADD INDEX idx_archivado (archivado)'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Migración completada: columna archivado verificada/agregada' AS status;
