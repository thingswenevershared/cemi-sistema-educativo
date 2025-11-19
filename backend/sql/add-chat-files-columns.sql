-- =====================================================
-- AGREGAR COLUMNAS PARA ARCHIVOS ADJUNTOS EN CHAT
-- =====================================================

USE cemi_sistema_educativo;

-- Agregar columnas a la tabla chat_mensajes
-- Nota: Si las columnas ya existen, este script fallará. Eso es normal.

ALTER TABLE chat_mensajes 
ADD COLUMN archivo_adjunto VARCHAR(500) NULL COMMENT 'Ruta del archivo adjunto (imagen o PDF)';

ALTER TABLE chat_mensajes 
ADD COLUMN tipo_archivo VARCHAR(50) NULL COMMENT 'Tipo de archivo: image, pdf';

-- Verificar cambios
DESCRIBE chat_mensajes;

SELECT 'Columnas agregadas exitosamente' as resultado;
