-- Agregar campos adicionales a la tabla tareas
ALTER TABLE tareas
ADD COLUMN IF NOT EXISTS requerimientos TEXT NULL AFTER descripcion,
ADD COLUMN IF NOT EXISTS link_url VARCHAR(500) NULL AFTER fecha_limite,
ADD COLUMN IF NOT EXISTS archivo_adjunto VARCHAR(500) NULL AFTER link_url,
ADD COLUMN IF NOT EXISTS notificar TINYINT(1) DEFAULT 1 AFTER puntos;
