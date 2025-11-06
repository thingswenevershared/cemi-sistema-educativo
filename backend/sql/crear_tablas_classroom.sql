-- Tabla de anuncios
CREATE TABLE IF NOT EXISTS anuncios (
  id_anuncio INT AUTO_INCREMENT PRIMARY KEY,
  id_curso INT NOT NULL,
  id_profesor INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE CASCADE,
  FOREIGN KEY (id_profesor) REFERENCES profesores(id_profesor) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id_tarea INT AUTO_INCREMENT PRIMARY KEY,
  id_curso INT NOT NULL,
  id_profesor INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_limite DATETIME NOT NULL,
  puntos INT DEFAULT 100,
  FOREIGN KEY (id_curso) REFERENCES cursos(id_curso) ON DELETE CASCADE,
  FOREIGN KEY (id_profesor) REFERENCES profesores(id_profesor) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de entregas de tareas
CREATE TABLE IF NOT EXISTS entregas_tareas (
  id_entrega INT AUTO_INCREMENT PRIMARY KEY,
  id_tarea INT NOT NULL,
  id_alumno INT NOT NULL,
  contenido TEXT,
  archivo_url VARCHAR(500),
  fecha_entrega DATETIME DEFAULT CURRENT_TIMESTAMP,
  calificacion DECIMAL(5,2) DEFAULT NULL,
  comentario_profesor TEXT,
  FOREIGN KEY (id_tarea) REFERENCES tareas(id_tarea) ON DELETE CASCADE,
  FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
