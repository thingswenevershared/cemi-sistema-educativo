-- ========================================
-- MODIFICACIÓN DE TABLA PAGOS
-- Agregar soporte para pagos por curso
-- ========================================

-- Paso 1: Limpiar tabla de pagos existente
-- (Los pagos antiguos no tienen asociación a curso)
TRUNCATE TABLE pagos;

-- Paso 2: Agregar columna id_curso
ALTER TABLE pagos 
ADD COLUMN id_curso INT AFTER id_alumno,
ADD FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE CASCADE;

-- Paso 3: Agregar columna detalle_pago
ALTER TABLE pagos 
ADD COLUMN detalle_pago VARCHAR(255) AFTER periodo;

-- Paso 4: Agregar columna mes_cuota 
ALTER TABLE pagos 
ADD COLUMN mes_cuota ENUM(
  'Matricula', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 
  'Octubre', 'Noviembre'
) AFTER detalle_pago;

-- Paso 5: Verificar estructura
DESCRIBE pagos;

-- ========================================
-- NOTAS:
-- - Los pagos ahora están asociados a un curso específico
-- - mes_cuota representa el mes académico (Marzo-Noviembre)
-- - detalle_pago almacena descripción automática del pago
-- - Si se elimina un curso, sus pagos también se eliminan
-- ========================================
