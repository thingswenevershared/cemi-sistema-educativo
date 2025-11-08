-- ========================================
-- AGREGAR MATRÍCULA AL ENUM DE MES_CUOTA
-- Solo ejecutar si ya tienes la tabla pagos con mes_cuota
-- ========================================

-- Modificar la columna mes_cuota para incluir 'Matricula' (sin tilde para evitar problemas de encoding)
ALTER TABLE pagos 
MODIFY COLUMN mes_cuota ENUM(
  'Matricula', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 
  'Octubre', 'Noviembre'
);

-- Verificar el cambio
DESCRIBE pagos;

-- ========================================
-- NOTAS:
-- - Ahora se puede registrar el pago de Matrícula
-- - La matrícula aparecerá como primera opción
-- - El detalle_pago se genera automáticamente como:
--   "Matrícula - [Idioma] [Nivel]"
-- - El concepto para Matrícula es id_concepto = 1
-- ========================================
