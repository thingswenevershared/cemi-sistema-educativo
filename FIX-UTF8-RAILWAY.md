# 🔧 FIX UTF-8 CHARSET EN RAILWAY MYSQL

## Problema
Los caracteres especiales aparecen mal: "MatrÃ­cula", "InglÃ©s" en lugar de "Matrícula", "Inglés"

## Causa
La base de datos en Railway no está configurada con charset UTF-8.

## Solución
Ejecutar estos comandos en **Railway MySQL Console**:

### 1. Acceder a Railway MySQL Console
1. Ir a https://railway.app/
2. Abrir el proyecto: **cemi-sistema-educativo**
3. Click en el servicio **MySQL**
4. Click en pestaña **Data**
5. Click en **Query**

### 2. Ejecutar estos comandos SQL

```sql
-- Cambiar charset de la base de datos
ALTER DATABASE proyecto_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convertir tablas principales a UTF-8
ALTER TABLE personas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE alumnos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE profesores CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE cursos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE idiomas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE niveles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE aulas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE inscripciones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE calificaciones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE asistencias CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pagos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE conceptos_pago CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE medios_pago CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chat_conversaciones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chat_mensajes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chat_estadisticas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE usuarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE perfiles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE notificaciones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE anuncios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Verificar que funcionó

```sql
-- Verificar charset de la base de datos
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM INFORMATION_SCHEMA.SCHEMATA 
WHERE SCHEMA_NAME = 'proyecto_final';

-- Verificar charset de una tabla
SELECT TABLE_NAME, TABLE_COLLATION 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'proyecto_final' 
AND TABLE_NAME = 'idiomas';
```

### 4. Reiniciar la aplicación
Después de ejecutar los comandos, hacer un hard refresh en el navegador:
- **Windows/Linux**: `Ctrl + Shift + F5` o `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

## Resultado esperado
✅ "Matrícula" en lugar de "MatrÃ­cula"
✅ "Inglés" en lugar de "InglÃ©s"
✅ Todos los acentos y caracteres especiales correctos

## Nota importante
⚠️ Este comando **NO borra datos**, solo cambia la codificación de caracteres.
⚠️ Ejecutar **UNA SOLA VEZ**.
