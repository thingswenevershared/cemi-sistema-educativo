# Migración Campo Archivado - Railway

## ⚠️ IMPORTANTE: Ejecutar esta migración antes de usar el sistema de archivo de pagos

La columna `archivado` es necesaria para el funcionamiento del sistema de archivo de pagos.

## Opción 1: Ejecutar desde Railway CLI

```bash
# Conectarse a Railway
railway login

# Seleccionar el proyecto
railway link

# Ejecutar la migración
railway run node migrate-archivado.js
```

## Opción 2: Ejecutar en Railway Shell

1. Ve a tu proyecto en Railway Dashboard
2. Abre la pestaña de tu servicio
3. Ve a "Settings" → "Deploy"
4. En "Custom Start Command" temporalmente cambia a:
   ```
   node migrate-archivado.js && node server.js
   ```
5. Redeploy el servicio
6. Una vez completado, vuelve a cambiar el comando a:
   ```
   node server.js
   ```

## Opción 3: Conectarse directamente a MySQL de Railway

1. Ve a Railway Dashboard → Tu base de datos MySQL
2. Copia las credenciales de conexión
3. Conéctate usando MySQL Workbench o cualquier cliente MySQL
4. Ejecuta el script: `railway-migration-archivado.sql`

## Verificar que la migración se ejecutó correctamente

```sql
SHOW COLUMNS FROM pagos LIKE 'archivado';
```

Deberías ver una columna `archivado TINYINT(1) DEFAULT 0`
