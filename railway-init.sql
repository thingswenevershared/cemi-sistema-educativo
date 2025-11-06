-- Estructura mínima para que la app funcione
-- Ejecutar esto en Railway MySQL

-- Tabla Perfiles
CREATE TABLE IF NOT EXISTS Perfiles (
  id_perfil INT PRIMARY KEY AUTO_INCREMENT,
  nombre_perfil VARCHAR(50) NOT NULL UNIQUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar perfiles básicos
INSERT INTO Perfiles (nombre_perfil) VALUES 
  ('administrador'),
  ('profesor'),
  ('alumno');

-- Tabla Personas
CREATE TABLE IF NOT EXISTS Personas (
  id_persona INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  mail VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  dni VARCHAR(20),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
  id_usuario INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  id_persona INT NOT NULL,
  id_perfil INT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_persona) REFERENCES Personas(id_persona) ON DELETE CASCADE,
  FOREIGN KEY (id_perfil) REFERENCES Perfiles(id_perfil)
);

-- Insertar persona admin
INSERT INTO Personas (nombre, apellido, mail, telefono, dni) 
VALUES ('Admin', 'Sistema', 'admin@cemi.com', '1234567890', '00000000');

-- Insertar usuario admin (password: admin123)
INSERT INTO Usuarios (username, password_hash, id_persona, id_perfil) 
VALUES ('admin', '$2b$10$pDtjYfMYAm3o6jmfJ7ns7O3TTEEeRz0jijoqtysiKGI7D/HJtsCau', 1, 1);
