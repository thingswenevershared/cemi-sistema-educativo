-- =====================================================
-- TABLAS PARA SISTEMA DE ENCUESTAS EN ANUNCIOS
-- =====================================================

-- Tabla de encuestas
CREATE TABLE IF NOT EXISTS encuestas (
  id_encuesta INT PRIMARY KEY AUTO_INCREMENT,
  id_anuncio INT NOT NULL,
  pregunta VARCHAR(255) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_anuncio) REFERENCES anuncios(id_anuncio) ON DELETE CASCADE
);

-- Tabla de opciones de encuesta
CREATE TABLE IF NOT EXISTS opciones_encuesta (
  id_opcion INT PRIMARY KEY AUTO_INCREMENT,
  id_encuesta INT NOT NULL,
  texto VARCHAR(255) NOT NULL,
  votos INT DEFAULT 0,
  FOREIGN KEY (id_encuesta) REFERENCES encuestas(id_encuesta) ON DELETE CASCADE
);

-- Tabla de votos de alumnos (evita votos duplicados)
CREATE TABLE IF NOT EXISTS votos_encuesta (
  id_voto INT PRIMARY KEY AUTO_INCREMENT,
  id_encuesta INT NOT NULL,
  id_opcion INT NOT NULL,
  id_alumno INT NOT NULL,
  fecha_voto DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_encuesta) REFERENCES encuestas(id_encuesta) ON DELETE CASCADE,
  FOREIGN KEY (id_opcion) REFERENCES opciones_encuesta(id_opcion) ON DELETE CASCADE,
  FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (id_encuesta, id_alumno)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_encuesta_anuncio ON encuestas(id_anuncio);
CREATE INDEX idx_opciones_encuesta ON opciones_encuesta(id_encuesta);
CREATE INDEX idx_votos_alumno ON votos_encuesta(id_alumno);
