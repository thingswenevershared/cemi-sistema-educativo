-- =====================================================
-- SCRIPT: Sincronizar usuarios entre tablas
-- =====================================================
-- Este script asegura que los usuarios puedan hacer login
-- copiando datos de la tabla 'usuarios' a las columnas
-- 'usuario' y 'password_hash' de alumnos/profesores/administradores
-- =====================================================

-- 1. Verificar que existen las columnas necesarias
SELECT 'Verificando estructura...' as status;

-- Si no existe la columna 'usuario' en alumnos, descomentar:
-- ALTER TABLE alumnos ADD COLUMN usuario VARCHAR(50) UNIQUE NULL;
-- ALTER TABLE alumnos ADD COLUMN password_hash VARCHAR(255) NULL;

-- Si no existe la columna 'usuario' en profesores, descomentar:
-- ALTER TABLE profesores ADD COLUMN usuario VARCHAR(50) UNIQUE NULL;
-- ALTER TABLE profesores ADD COLUMN password_hash VARCHAR(255) NULL;

-- Si no existe la columna 'usuario' en administradores, descomentar:
-- ALTER TABLE administradores ADD COLUMN usuario VARCHAR(50) UNIQUE NULL;
-- ALTER TABLE administradores ADD COLUMN password_hash VARCHAR(255) NULL;

-- =====================================================
-- 2. Sincronizar ALUMNOS
-- =====================================================
UPDATE alumnos a
JOIN usuarios u ON a.id_persona = u.id_persona
JOIN perfiles per ON u.id_perfil = per.id_perfil
SET 
  a.usuario = u.username,
  a.password_hash = u.password_hash
WHERE per.nombre_perfil = 'alumno';

SELECT 'Alumnos sincronizados' as status, COUNT(*) as total
FROM alumnos 
WHERE usuario IS NOT NULL;

-- =====================================================
-- 3. Sincronizar PROFESORES
-- =====================================================
UPDATE profesores p
JOIN usuarios u ON p.id_persona = u.id_persona
JOIN perfiles per ON u.id_perfil = per.id_perfil
SET 
  p.usuario = u.username,
  p.password_hash = u.password_hash
WHERE per.nombre_perfil = 'profesor';

SELECT 'Profesores sincronizados' as status, COUNT(*) as total
FROM profesores 
WHERE usuario IS NOT NULL;

-- =====================================================
-- 4. Sincronizar ADMINISTRADORES
-- =====================================================
UPDATE administradores adm
JOIN usuarios u ON adm.id_persona = u.id_persona
JOIN perfiles per ON u.id_perfil = per.id_perfil
SET 
  adm.usuario = u.username,
  adm.password_hash = u.password_hash
WHERE per.nombre_perfil = 'admin';

SELECT 'Administradores sincronizados' as status, COUNT(*) as total
FROM administradores 
WHERE usuario IS NOT NULL;

-- =====================================================
-- 5. Verificar resultados
-- =====================================================
SELECT 'Verificación final' as status;

-- Ver algunos usuarios de ejemplo
SELECT 
  'ALUMNO' as tipo,
  a.id_alumno as id,
  a.usuario,
  CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
  a.estado
FROM alumnos a
JOIN personas p ON a.id_persona = p.id_persona
WHERE a.usuario IS NOT NULL
LIMIT 5;

SELECT 
  'PROFESOR' as tipo,
  pr.id_profesor as id,
  pr.usuario,
  CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
  pr.estado
FROM profesores pr
JOIN personas p ON pr.id_persona = p.id_persona
WHERE pr.usuario IS NOT NULL
LIMIT 5;

SELECT 
  'ADMIN' as tipo,
  adm.id_administrador as id,
  adm.usuario,
  CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
  adm.estado
FROM administradores adm
JOIN personas p ON adm.id_persona = p.id_persona
WHERE adm.usuario IS NOT NULL
LIMIT 5;

-- =====================================================
-- NOTAS:
-- =====================================================
-- Este script copia username y password_hash desde la tabla 'usuarios'
-- hacia las columnas 'usuario' y 'password_hash' de las tablas antiguas
-- (alumnos, profesores, administradores).
--
-- Esto permite que el login funcione tanto con el sistema nuevo
-- (tabla usuarios) como con el sistema antiguo (tablas separadas).
--
-- IMPORTANTE: Ejecutar SOLO UNA VEZ después de verificar la estructura.
-- =====================================================
