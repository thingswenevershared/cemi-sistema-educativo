-- =====================================================
-- AGREGAR COLUMNAS PARA ARCHIVOS ADJUNTOS EN CHAT
-- =====================================================

USE cemi_sistema_educativo;

-- Agregar columnas a la tabla chat_mensajes
ALTER TABLE chat_mensajes 
ADD COLUMN IF NOT EXISTS archivo_adjunto VARCHAR(500) NULL COMMENT 'Ruta del archivo adjunto (imagen o PDF)',
ADD COLUMN IF NOT EXISTS tipo_archivo VARCHAR(50) NULL COMMENT 'Tipo de archivo: image, pdf';

-- Verificar cambios
DESCRIBE chat_mensajes;

SELECT 'Columnas agregadas exitosamente' as resultado;
