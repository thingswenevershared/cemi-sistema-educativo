-- =====================================================
-- CORREGIR TIPO DE COLUMNA cuotas_habilitadas
-- =====================================================
-- Cambiar de LONGTEXT/TEXT a JSON para validación correcta

-- Ver tipo actual
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'cursos'
AND COLUMN_NAME = 'cuotas_habilitadas';

-- Modificar la columna a tipo JSON
ALTER TABLE cursos
MODIFY COLUMN cuotas_habilitadas JSON DEFAULT NULL
COMMENT 'Cuotas disponibles para pago: null = todas habilitadas, JSON array = solo las especificadas. Ej: ["Matricula","Marzo","Abril"]';

-- Verificar cambio
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'cursos'
AND COLUMN_NAME = 'cuotas_habilitadas';

SELECT 'Columna actualizada correctamente a tipo JSON' AS mensaje;
