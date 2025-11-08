-- ============================================================
-- NORMALIZACIÓN A 3FN - RAILWAY
-- Fecha: 7 de Noviembre 2025
-- Objetivo: Eliminar redundancia de credenciales
-- ============================================================

-- IMPORTANTE: Ejecutar en orden y verificar cada paso

-- ============================================================
-- PASO 1: VERIFICACIÓN PRE-MIGRACIÓN
-- ============================================================

-- Ver estado actual de credenciales
SELECT 'ALUMNOS CON CREDENCIALES' as tabla, COUNT(*) as total 
FROM alumnos WHERE usuario IS NOT NULL
UNION ALL
SELECT 'PROFESORES CON CREDENCIALES', COUNT(*) 
FROM profesores WHERE usuario IS NOT NULL
UNION ALL
SELECT 'ADMINS CON CREDENCIALES', COUNT(*) 
FROM administradores WHERE usuario IS NOT NULL
UNION ALL
SELECT 'USUARIOS EN TABLA USUARIOS', COUNT(*) 
FROM usuarios;

-- ============================================================
-- PASO 2: MIGRAR DATOS A TABLA USUARIOS (si no existen)
-- ============================================================

-- Migrar alumnos que NO están en usuarios
INSERT INTO usuarios (username, password_hash, id_persona, id_perfil, fecha_creacion)
SELECT 
    a.usuario,
    a.password_hash,
    a.id_persona,
    (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'alumno'),
    NOW()
FROM alumnos a
WHERE a.usuario IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id_persona = a.id_persona
);

-- Migrar profesores que NO están en usuarios
INSERT INTO usuarios (username, password_hash, id_persona, id_perfil, fecha_creacion)
SELECT 
    p.usuario,
    p.password_hash,
    p.id_persona,
    (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'profesor'),
    NOW()
FROM profesores p
WHERE p.usuario IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id_persona = p.id_persona
);

-- Migrar administradores que NO están en usuarios
INSERT INTO usuarios (username, password_hash, id_persona, id_perfil, fecha_creacion)
SELECT 
    ad.usuario,
    ad.password_hash,
    ad.id_persona,
    (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'admin'),
    NOW()
FROM administradores ad
WHERE ad.usuario IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id_persona = ad.id_persona
);

-- ============================================================
-- PASO 3: VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================

-- Verificar que todos los usuarios fueron migrados
SELECT 
    'ALUMNOS' as tipo,
    COUNT(*) as con_credenciales_originales,
    (SELECT COUNT(*) FROM usuarios u 
     JOIN alumnos a ON u.id_persona = a.id_persona 
     WHERE a.usuario IS NOT NULL) as migrados_a_usuarios
FROM alumnos WHERE usuario IS NOT NULL
UNION ALL
SELECT 
    'PROFESORES',
    COUNT(*),
    (SELECT COUNT(*) FROM usuarios u 
     JOIN profesores p ON u.id_persona = p.id_persona 
     WHERE p.usuario IS NOT NULL)
FROM profesores WHERE usuario IS NOT NULL
UNION ALL
SELECT 
    'ADMINS',
    COUNT(*),
    (SELECT COUNT(*) FROM usuarios u 
     JOIN administradores ad ON u.id_persona = ad.id_persona 
     WHERE ad.usuario IS NOT NULL)
FROM administradores WHERE usuario IS NOT NULL;

-- ============================================================
-- PASO 4: ELIMINAR COLUMNAS REDUNDANTES (3FN)
-- ============================================================

-- ⚠️ CRÍTICO: Solo ejecutar DESPUÉS de actualizar TODO el código backend

-- Eliminar credenciales de alumnos
ALTER TABLE alumnos 
    DROP COLUMN usuario,
    DROP COLUMN password_hash;

-- Eliminar credenciales de profesores  
ALTER TABLE profesores 
    DROP COLUMN usuario,
    DROP COLUMN password_hash;

-- Eliminar credenciales de administradores
ALTER TABLE administradores 
    DROP COLUMN usuario,
    DROP COLUMN password_hash;

-- Eliminar teléfono duplicado (ya está en personas)
ALTER TABLE alumnos DROP COLUMN telefono;
ALTER TABLE profesores DROP COLUMN telefono;

-- Eliminar columnas redundantes de usuarios
ALTER TABLE usuarios 
    DROP COLUMN id_alumno,
    DROP COLUMN id_profesor,
    DROP COLUMN id_administrador;

-- ============================================================
-- PASO 5: OPTIMIZAR FOREIGN KEYS
-- ============================================================

-- Eliminar FK redundante de alumnos
ALTER TABLE alumnos DROP FOREIGN KEY IF EXISTS fk_alumno_persona;

-- Eliminar FK redundante de profesores (si existe)
ALTER TABLE profesores DROP FOREIGN KEY IF EXISTS fk_profesor_persona;

-- ============================================================
-- PASO 6: VERIFICACIÓN FINAL
-- ============================================================

-- Verificar estructura final
SHOW COLUMNS FROM alumnos;
SHOW COLUMNS FROM profesores;
SHOW COLUMNS FROM administradores;
SHOW COLUMNS FROM usuarios;

-- Contar registros finales
SELECT 
    'USUARIOS TOTALES' as descripcion,
    COUNT(*) as cantidad
FROM usuarios
UNION ALL
SELECT 
    'ALUMNOS ACTIVOS',
    COUNT(*)
FROM alumnos
WHERE estado = 'activo'
UNION ALL
SELECT 
    'PROFESORES ACTIVOS',
    COUNT(*)
FROM profesores
WHERE estado = 'activo';

-- ============================================================
-- NOTAS IMPORTANTES:
-- ============================================================
-- 1. NO ejecutar PASO 4 hasta que el código esté actualizado
-- 2. Hacer backup antes de ejecutar
-- 3. Ejecutar en horario de bajo tráfico
-- 4. Monitorear logs después de cada paso
-- ============================================================
