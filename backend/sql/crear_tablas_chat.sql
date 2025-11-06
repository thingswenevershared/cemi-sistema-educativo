-- =====================================================
-- SISTEMA DE CHAT EN TIEMPO REAL - CEMI
-- Tablas para soporte de chat con WebSocket
-- =====================================================

-- Tabla de Conversaciones
CREATE TABLE IF NOT EXISTS chat_conversaciones (
  id_conversacion INT PRIMARY KEY AUTO_INCREMENT,
  tipo_usuario ENUM('invitado', 'alumno', 'profesor') NOT NULL,
  id_usuario INT NULL COMMENT 'NULL para invitados, id_alumno o id_profesor para usuarios loggeados',
  nombre_invitado VARCHAR(100) NULL COMMENT 'Solo para usuarios invitados sin login',
  estado ENUM('pendiente', 'activa', 'cerrada') DEFAULT 'pendiente',
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP NULL,
  atendido_por INT NULL COMMENT 'id_usuario del admin que atiende',
  mensajes_no_leidos_admin INT DEFAULT 0 COMMENT 'Contador de mensajes no leídos por el admin',
  mensajes_no_leidos_usuario INT DEFAULT 0 COMMENT 'Contador de mensajes no leídos por el usuario',
  ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (atendido_por) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_estado (estado),
  INDEX idx_atendido_por (atendido_por),
  INDEX idx_tipo_usuario (tipo_usuario),
  INDEX idx_ultima_actividad (ultima_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Conversaciones de chat de soporte';

-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id_mensaje INT PRIMARY KEY AUTO_INCREMENT,
  id_conversacion INT NOT NULL,
  tipo_remitente ENUM('invitado', 'alumno', 'profesor', 'admin') NOT NULL,
  id_remitente INT NULL COMMENT 'NULL para invitados, id del usuario para loggeados',
  nombre_remitente VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido TINYINT(1) DEFAULT 0,
  leido_por_admin TINYINT(1) DEFAULT 0,
  leido_por_usuario TINYINT(1) DEFAULT 0,
  FOREIGN KEY (id_conversacion) REFERENCES chat_conversaciones(id_conversacion) ON DELETE CASCADE,
  INDEX idx_conversacion (id_conversacion),
  INDEX idx_leido (leido),
  INDEX idx_fecha_envio (fecha_envio),
  INDEX idx_tipo_remitente (tipo_remitente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Mensajes del chat de soporte';

-- Tabla de Estadísticas de Chat (opcional pero útil)
CREATE TABLE IF NOT EXISTS chat_estadisticas (
  id_estadistica INT PRIMARY KEY AUTO_INCREMENT,
  id_conversacion INT NOT NULL,
  tiempo_primera_respuesta INT NULL COMMENT 'Tiempo en segundos hasta primera respuesta del admin',
  tiempo_total_conversacion INT NULL COMMENT 'Duración total en segundos',
  total_mensajes INT DEFAULT 0,
  mensajes_usuario INT DEFAULT 0,
  mensajes_admin INT DEFAULT 0,
  calificacion TINYINT(1) NULL COMMENT 'Calificación de 1-5 estrellas',
  comentario_calificacion TEXT NULL,
  fecha_calificacion TIMESTAMP NULL,
  FOREIGN KEY (id_conversacion) REFERENCES chat_conversaciones(id_conversacion) ON DELETE CASCADE,
  INDEX idx_calificacion (calificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Estadísticas y métricas del chat';

-- =====================================================
-- Triggers para actualizar contadores
-- =====================================================

DELIMITER $$

-- Trigger: Actualizar contador de mensajes no leídos al insertar mensaje
CREATE TRIGGER after_chat_mensaje_insert
AFTER INSERT ON chat_mensajes
FOR EACH ROW
BEGIN
  IF NEW.tipo_remitente = 'admin' THEN
    -- Mensaje del admin, incrementar contador para el usuario
    UPDATE chat_conversaciones 
    SET mensajes_no_leidos_usuario = mensajes_no_leidos_usuario + 1,
        ultima_actividad = CURRENT_TIMESTAMP
    WHERE id_conversacion = NEW.id_conversacion;
  ELSE
    -- Mensaje del usuario, incrementar contador para el admin
    UPDATE chat_conversaciones 
    SET mensajes_no_leidos_admin = mensajes_no_leidos_admin + 1,
        ultima_actividad = CURRENT_TIMESTAMP
    WHERE id_conversacion = NEW.id_conversacion;
  END IF;
END$$

-- Trigger: Actualizar estadísticas al insertar mensaje
CREATE TRIGGER after_mensaje_estadisticas
AFTER INSERT ON chat_mensajes
FOR EACH ROW
BEGIN
  -- Actualizar o crear estadísticas
  INSERT INTO chat_estadisticas (id_conversacion, total_mensajes, mensajes_usuario, mensajes_admin)
  VALUES (NEW.id_conversacion, 1, 
          IF(NEW.tipo_remitente != 'admin', 1, 0),
          IF(NEW.tipo_remitente = 'admin', 1, 0))
  ON DUPLICATE KEY UPDATE
    total_mensajes = total_mensajes + 1,
    mensajes_usuario = mensajes_usuario + IF(NEW.tipo_remitente != 'admin', 1, 0),
    mensajes_admin = mensajes_admin + IF(NEW.tipo_remitente = 'admin', 1, 0);
END$$

DELIMITER ;

-- =====================================================
-- Procedimientos almacenados útiles
-- =====================================================

DELIMITER $$

-- Obtener conversaciones activas de un admin
CREATE PROCEDURE sp_get_conversaciones_admin(IN p_id_admin INT)
BEGIN
  SELECT 
    c.*,
    COUNT(m.id_mensaje) as total_mensajes,
    (SELECT mensaje FROM chat_mensajes 
     WHERE id_conversacion = c.id_conversacion 
     ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
    (SELECT fecha_envio FROM chat_mensajes 
     WHERE id_conversacion = c.id_conversacion 
     ORDER BY fecha_envio DESC LIMIT 1) as fecha_ultimo_mensaje
  FROM chat_conversaciones c
  LEFT JOIN chat_mensajes m ON c.id_conversacion = m.id_conversacion
  WHERE c.atendido_por = p_id_admin OR c.atendido_por IS NULL
  GROUP BY c.id_conversacion
  ORDER BY c.ultima_actividad DESC;
END$$

-- Marcar mensajes como leídos
CREATE PROCEDURE sp_marcar_mensajes_leidos(
  IN p_id_conversacion INT,
  IN p_tipo_lector ENUM('admin', 'usuario')
)
BEGIN
  IF p_tipo_lector = 'admin' THEN
    UPDATE chat_mensajes 
    SET leido_por_admin = 1, leido = 1
    WHERE id_conversacion = p_id_conversacion 
      AND tipo_remitente != 'admin'
      AND leido_por_admin = 0;
    
    UPDATE chat_conversaciones
    SET mensajes_no_leidos_admin = 0
    WHERE id_conversacion = p_id_conversacion;
  ELSE
    UPDATE chat_mensajes 
    SET leido_por_usuario = 1, leido = 1
    WHERE id_conversacion = p_id_conversacion 
      AND tipo_remitente = 'admin'
      AND leido_por_usuario = 0;
    
    UPDATE chat_conversaciones
    SET mensajes_no_leidos_usuario = 0
    WHERE id_conversacion = p_id_conversacion;
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- Datos de prueba (opcional)
-- =====================================================

-- INSERT INTO chat_conversaciones (tipo_usuario, nombre_invitado, estado)
-- VALUES ('invitado', 'Juan Pérez', 'pendiente');

-- INSERT INTO chat_mensajes (id_conversacion, tipo_remitente, nombre_remitente, mensaje)
-- VALUES (1, 'invitado', 'Juan Pérez', '¿Hola, necesito información sobre los cursos de inglés?');

-- =====================================================
-- Verificación de tablas creadas
-- =====================================================

SELECT 'Tablas de chat creadas exitosamente' AS resultado;

SHOW TABLES LIKE 'chat_%';
