-- Tabla de eventos del calendario
CREATE TABLE IF NOT EXISTS eventos_calendario (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_curso INT NOT NULL,
  id_profesor INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('examen', 'clase_especial', 'feriado', 'reunion', 'otro') DEFAULT 'otro',
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME,
  color VARCHAR(7) DEFAULT '#667eea',
  notificar TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE CASCADE,
  FOREIGN KEY (id_profesor) REFERENCES profesores(id_profesor) ON DELETE CASCADE,
  INDEX idx_fecha (fecha_inicio),
  INDEX idx_curso (id_curso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
