# 🔍 VERIFICAR USUARIOS EN RAILWAY

## Problema
Login falla con "Usuario no encontrado" para usuarios como `alumnojose`, `alumnojosecemi`

## Posibles causas

### 1. Verificar si existen usuarios en las tablas antiguas
Ejecutar en **Railway MySQL Console**:

```sql
-- Ver usuarios en tabla alumnos
SELECT id_alumno, usuario, password_hash, estado 
FROM alumnos 
WHERE usuario IS NOT NULL 
LIMIT 10;

-- Ver usuarios en tabla profesores
SELECT id_profesor, usuario, password_hash, estado 
FROM profesores 
WHERE usuario IS NOT NULL 
LIMIT 10;

-- Ver usuarios en tabla administradores
SELECT id_administrador, usuario, password_hash, estado 
FROM administradores 
WHERE usuario IS NOT NULL 
LIMIT 10;
```

### 2. Si las tablas antiguas NO tienen usuarios, verificar tabla usuarios
```sql
-- Ver usuarios en tabla usuarios (nuevo sistema)
SELECT u.id_usuario, u.username, per.nombre_perfil, p.nombre, p.apellido
FROM usuarios u
JOIN personas p ON u.id_persona = p.id_persona
JOIN perfiles per ON u.id_perfil = per.id_perfil
LIMIT 10;
```

### 3. Verificar estructura de columnas
```sql
-- Ver columnas de tabla alumnos
SHOW COLUMNS FROM alumnos;

-- Ver columnas de tabla usuarios
SHOW COLUMNS FROM usuarios;
```

## Soluciones

### Si los usuarios están en la tabla `usuarios`:
El código de login debe buscar primero en la tabla `usuarios` usando el campo `username` en lugar de buscar en `alumnos.usuario`, `profesores.usuario`, etc.

### Si las tablas antiguas NO tienen la columna `usuario`:
Ejecutar script de migración para agregar columnas y sincronizar datos.

### Si los passwords están en formato incorrecto:
Ejecutar el script `actualizar-passwords-railway.sql` que ya está en el proyecto.

## Acción requerida
1. Ejecutar las queries de verificación en Railway
2. Reportar los resultados
3. Aplicar la solución correspondiente
