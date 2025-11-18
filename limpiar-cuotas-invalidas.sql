-- =====================================================
-- LIMPIAR Y CORREGIR TODOS LOS VALORES DE CUOTAS
-- =====================================================

-- 1. Ver valores actuales (para verificar el problema)
SELECT id_curso, nombre_curso, 
       cuotas_habilitadas,
       LENGTH(cuotas_habilitadas) as longitud,
       SUBSTRING(cuotas_habilitadas, 1, 50) as primeros_50_chars
FROM cursos
WHERE cuotas_habilitadas IS NOT NULL;

-- 2. Limpiar TODOS los valores incorrectos (establecer NULL)
UPDATE cursos SET cuotas_habilitadas = NULL;

-- 3. Verificar que se limpiaron
SELECT id_curso, nombre_curso, cuotas_habilitadas
FROM cursos;

-- 4. Mensaje
SELECT 'Todos los valores limpiados. Ahora prueba guardar cuotas desde el dashboard.' AS resultado;
