-- Corregir encoding UTF-8 en conceptos_pago (Railway)
UPDATE conceptos_pago 
SET descripcion = 'Matricula' 
WHERE id_concepto = 1 OR descripcion LIKE '%Matr%';

-- Verificar cambio
SELECT * FROM conceptos_pago;
