-- =====================================================
-- FIX: Agregar columnas id_alumno, id_profesor, id_administrador a tabla usuarios
-- =====================================================
-- La tabla usuarios en Railway no tiene las columnas necesarias
-- para relacionar con alumnos, profesores y administradores
-- =====================================================

-- 1. Verificar estructura actual
SELECT 'Estructura actual de usuarios:' as info;
DESCRIBE usuarios;

-- 2. Agregar columnas si no existen
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS id_alumno INT NULL,
ADD COLUMN IF NOT EXISTS id_profesor INT NULL,
ADD COLUMN IF NOT EXISTS id_administrador INT NULL;

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_alumno ON usuarios(id_alumno);
CREATE INDEX IF NOT EXISTS idx_usuario_profesor ON usuarios(id_profesor);
CREATE INDEX IF NOT EXISTS idx_usuario_admin ON usuarios(id_administrador);

-- 4. Sincronizar datos desde perfiles
-- Encontrar alumnos por id_perfil (asumiendo que perfil 3 = alumno)
UPDATE usuarios u
JOIN perfiles p ON u.id_perfil = p.id_perfil
JOIN alumnos a ON u.id_persona = a.id_persona
SET u.id_alumno = a.id_alumno
WHERE p.nombre_perfil = 'alumno' OR p.id_perfil = 3;

-- Encontrar profesores por id_perfil (asumiendo que perfil 2 = profesor)
UPDATE usuarios u
JOIN perfiles p ON u.id_perfil = p.id_perfil
JOIN profesores pr ON u.id_persona = pr.id_persona
SET u.id_profesor = pr.id_profesor
WHERE p.nombre_perfil = 'profesor' OR p.id_perfil = 2;

-- Encontrar administradores por id_perfil (asumiendo que perfil 1 = admin)
UPDATE usuarios u
JOIN perfiles p ON u.id_perfil = p.id_perfil
JOIN administradores adm ON u.id_persona = adm.id_persona
SET u.id_administrador = adm.id_administrador
WHERE p.nombre_perfil = 'admin' OR p.id_perfil = 1;

-- 5. Verificar resultados
SELECT 'Verificación de sincronización:' as info;

SELECT 
  u.id_usuario,
  u.username,
  p.nombre_perfil as perfil,
  u.id_alumno,
  u.id_profesor,
  u.id_administrador,
  CONCAT(per.nombre, ' ', per.apellido) as nombre_completo
FROM usuarios u
JOIN perfiles p ON u.id_perfil = p.id_perfil
LEFT JOIN personas per ON u.id_persona = per.id_persona
ORDER BY u.id_usuario;

-- 6. Ver específicamente a Micaela Gomez
SELECT 'Datos de Micaela Gomez:' as info;

SELECT 
  u.id_usuario,
  u.username,
  u.id_alumno,
  a.id_alumno as alumno_real,
  CONCAT(p.nombre, ' ', p.apellido) as nombre
FROM usuarios u
JOIN personas p ON u.id_persona = p.id_persona
LEFT JOIN alumnos a ON u.id_persona = a.id_persona
WHERE p.nombre LIKE '%Micaela%' OR p.apellido LIKE '%Gomez%';

SELECT '✅ Sincronización completada' as resultado;
