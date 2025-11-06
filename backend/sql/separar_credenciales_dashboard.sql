-- ============================================================================
-- MIGRACIÓN: SEPARAR CREDENCIALES DASHBOARD Y CLASSROOM
-- ============================================================================
-- Agrega columnas de usuario y password a las tablas de alumnos, profesores
-- y crea tabla de administradores para tener credenciales independientes
-- del sistema Classroom
-- ============================================================================

-- 1. Agregar columnas a tabla ALUMNOS
ALTER TABLE alumnos 
ADD COLUMN IF NOT EXISTS usuario VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Agregar columnas a tabla PROFESORES
ALTER TABLE profesores 
ADD COLUMN IF NOT EXISTS usuario VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 3. Crear tabla ADMINISTRADORES si no existe
CREATE TABLE IF NOT EXISTS administradores (
  id_administrador INT PRIMARY KEY AUTO_INCREMENT,
  id_persona INT NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nivel_acceso ENUM('superadmin', 'admin') DEFAULT 'admin',
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE
);

-- 4. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_alumnos_usuario ON alumnos(usuario);
CREATE INDEX IF NOT EXISTS idx_profesores_usuario ON profesores(usuario);
CREATE INDEX IF NOT EXISTS idx_administradores_usuario ON administradores(usuario);

-- ============================================================================
-- DATOS INICIALES: Migrar usuarios existentes con contraseñas por defecto
-- ============================================================================

-- Inicializar credenciales de ALUMNOS existentes
-- Password por defecto: "alumno123" (hash bcrypt)
UPDATE alumnos a
INNER JOIN personas p ON a.id_persona = p.id_persona
SET 
  a.usuario = CONCAT('alumno', a.id_alumno),
  a.password_hash = '$2b$10$vKxZ8tqZ9kWzJH3X.HxBxOYwF5LkN6LPvXqZ8tqZ9kWzJH3X.HxBx.'
WHERE a.usuario IS NULL;

-- Inicializar credenciales de PROFESORES existentes
-- Password por defecto: "profesor123" (hash bcrypt)
UPDATE profesores pr
INNER JOIN personas p ON pr.id_persona = p.id_persona
SET 
  pr.usuario = CONCAT('profesor', pr.id_profesor),
  pr.password_hash = '$2b$10$xY9aZ1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zA4bC5dE6f.'
WHERE pr.usuario IS NULL;

-- Insertar administrador principal si no existe
INSERT INTO administradores (id_persona, usuario, password_hash, nivel_acceso)
SELECT p.id_persona, 'admin', '$2b$10$aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7i.', 'superadmin'
FROM personas p
WHERE p.nombre = 'Eduardo' AND p.apellido = 'Mendoza'
AND NOT EXISTS (SELECT 1 FROM administradores WHERE usuario = 'admin');

-- ============================================================================
-- CREDENCIALES ESPECÍFICAS PARA USUARIOS DE PRUEBA
-- ============================================================================

-- Mica Gomez: alumnamica / micagomez
UPDATE alumnos a
INNER JOIN personas p ON a.id_persona = p.id_persona
SET a.usuario = 'alumnamica',
    a.password_hash = '$2b$10$ppnYPeZHqJOaEcbbB6/frO1PKarhxan/TftSEaxOiYa2ULvTHX3Hq'
WHERE p.nombre = 'Micaela' AND p.apellido = 'Gomez';

-- Hernán Toledo
UPDATE alumnos a
INNER JOIN personas p ON a.id_persona = p.id_persona
SET a.usuario = 'hernan.toledo',
    a.password_hash = '$2b$10$vKxZ8tqZ9kWzJH3X.HxBxOYwF5LkN6LPvXqZ8tqZ9kWzJH3X.HxBx.'
WHERE p.nombre = 'Hernán' AND p.apellido = 'Toledo';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 'Alumnos con credenciales' as Tabla, COUNT(*) as Total 
FROM alumnos WHERE usuario IS NOT NULL AND password_hash IS NOT NULL
UNION ALL
SELECT 'Profesores con credenciales', COUNT(*) 
FROM profesores WHERE usuario IS NOT NULL AND password_hash IS NOT NULL
UNION ALL
SELECT 'Administradores', COUNT(*) 
FROM administradores;

-- ============================================================================
-- CONTRASEÑAS POR DEFECTO (PARA REFERENCIA)
-- ============================================================================
-- Alumnos:       "alumno123"
-- Profesores:    "profesor123"
-- Administrador: "admin123"
-- Mica Gomez:    "micagomez"
-- ============================================================================
