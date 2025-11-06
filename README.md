# 🎓 CEMI - Sistema de Gestión Educativa

Sistema completo de gestión para institutos de idiomas con chat en tiempo real, classroom, gestión de alumnos, profesores y administradores.

## 🚀 Tecnologías

- **Backend**: Node.js + Express.js
- **Base de Datos**: MySQL
- **WebSockets**: ws (chat en tiempo real)
- **Frontend**: Vanilla JavaScript
- **Seguridad**: Helmet, bcryptjs, express-rate-limit

## 📦 Instalación Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# Iniciar servidor de desarrollo
npm run dev
```

## 🌐 Deployment a Railway.app

### Paso 1: Preparar el proyecto

1. Crea una cuenta en [Railway.app](https://railway.app)
2. Instala Railway CLI (opcional):
   ```bash
   npm i -g @railway/cli
   ```

### Paso 2: Subir código a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <tu-repo-github>
git push -u origin main
```

### Paso 3: Crear proyecto en Railway

1. Ve a railway.app y crea un nuevo proyecto
2. Selecciona "Deploy from GitHub repo"
3. Elige tu repositorio

### Paso 4: Agregar MySQL

1. En Railway, click en "+ New"
2. Selecciona "Database" → "MySQL"
3. Railway creará automáticamente las variables de entorno:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

### Paso 5: Configurar Variables de Entorno Adicionales

En Railway, ve a tu servicio → Variables y agrega:

```
NODE_ENV=production
RAILWAY_PUBLIC_DOMAIN=(se genera automáticamente)
```

**IMPORTANTE**: Railway detecta automáticamente las variables MySQL. NO necesitas configurar DB_HOST, DB_USER, etc.

### Paso 6: Importar Base de Datos

Opción 1: Usar Railway CLI
```bash
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < railway-init.sql
```

Opción 2: Conectar con MySQL Workbench
1. Copia las credenciales de Railway (Variables tab)
2. Conecta usando esas credenciales
3. Ejecuta el archivo `railway-init.sql`

### Paso 7: Deploy

Railway desplegará automáticamente cuando hagas push a GitHub. Tu app estará disponible en:
```
https://tu-proyecto.up.railway.app
```

## 🔧 Configuración Automática de Entorno

El sistema detecta automáticamente si está en producción o desarrollo:

- **Producción** (Railway): Usa variables `MYSQL*` y dominio Railway
- **Desarrollo** (localhost): Usa variables `DB_*` y localhost:3000

No necesitas cambiar código para deployar.

## 📁 Estructura del Proyecto

```
proyecto-final/
├── backend/
│   ├── config/         # Configuración (multer, etc)
│   ├── routes/         # Rutas de la API
│   ├── sql/            # Scripts SQL de migraciones
│   └── utils/          # Utilidades (db.js, chat-server.js)
├── frontend/
│   ├── assets/
│   │   ├── css/        # Estilos
│   │   └── js/         # Scripts del cliente
│   │       └── config.js  # Auto-detección de entorno
│   ├── images/         # Imágenes
│   └── *.html          # Páginas HTML
├── uploads/            # Archivos subidos (tareas, etc)
├── server.js           # Servidor principal (producción y desarrollo)
├── dev-server.js       # Servidor de desarrollo con hot-reload (opcional)
├── railway-init.sql    # Script de inicialización para Railway
├── railway.json        # Configuración de Railway
├── railway.toml        # Configuración alternativa de Railway
└── .railwayignore      # Archivos excluidos del deploy
```

## ✨ Nuevas Características (Última Actualización)

### Sistema Dual de Autenticación
- **Dashboard Login**: Para administradores, profesores y alumnos (gestión interna)
- **Classroom Login**: Para profesores y alumnos (plataforma educativa)

### Gestión de Credenciales
Los administradores pueden modificar credenciales de usuarios:
- **Profesores y Alumnos**: Dashboard + Classroom
- **Administradores**: Solo Dashboard
- Cambio de usuario y contraseña por separado
- Actualización opcional (solo si se proporciona nueva contraseña)

### Endpoints de Credenciales
Nuevos endpoints para gestión de credenciales:
- `PATCH /api/profesores/:id/usuario` - Cambiar usuario Dashboard
- `POST /api/profesores/:id/cambiar-password-dashboard` - Cambiar contraseña Dashboard
- `PATCH /api/alumnos/:id/usuario` - Cambiar usuario Dashboard
- `POST /api/alumnos/:id/cambiar-password-dashboard` - Cambiar contraseña Dashboard
- `PATCH /api/administradores/:id/usuario` - Cambiar usuario Dashboard
- `POST /api/administradores/:id/cambiar-password` - Cambiar contraseña Dashboard
- `POST /api/auth/classroom-login` - Login separado para Classroom

## 🔒 Seguridad

- ✅ Helmet para headers seguros con CSP personalizado
- ✅ Rate limiting en todas las rutas
- ✅ Contraseñas hasheadas con bcrypt (10 salt rounds)
- ✅ Validación de inputs
- ✅ CORS configurado dinámicamente (localhost + Railway)
- ✅ Variables de entorno para credenciales
- ✅ Autenticación dual (Dashboard/Classroom)

## 👥 Usuarios de Prueba

Después de importar la base de datos con `railway-init.sql`:

- **Admin (Classroom)**: `admin` / `admin123`

Puedes crear más usuarios desde el panel de administración.

## 📝 Scripts Disponibles

- `npm start` - Inicia servidor (producción o desarrollo según entorno)
- `npm run dev` - Servidor de desarrollo con hot-reload
- `npm run prod` - Servidor en modo producción forzado

## 🐛 Debugging

### Ver logs en Railway
```bash
railway logs
```

### Health Check
El sistema incluye un endpoint de health check:
```
GET /api/health
```

Respuesta:
```json
{
  "status": "ok",
  "message": "CEMI API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 Actualizaciones

Para actualizar el código en Railway:

```bash
git add .
git commit -m "Tu mensaje"
git push origin main
```

Railway detectará el push y re-desplegará automáticamente.

## 📚 Documentación Adicional

- `/backend/sql/` - Scripts de migración de base de datos
- `railway-init.sql` - Script inicial de base de datos
- Ver comentarios en `server.js` para configuración avanzada

## 🆘 Solución de Problemas

### Error de conexión a base de datos
1. Verifica que Railway MySQL esté activo
2. Revisa las variables de entorno en Railway
3. Asegúrate de que `railway-init.sql` se haya ejecutado

### CORS errors
- Verifica que `RAILWAY_PUBLIC_DOMAIN` esté configurado
- Revisa la configuración de CORS en `server.js`

### Frontend no carga
- Verifica que `config.js` esté incluido antes de otros scripts en HTML
- Revisa la consola del navegador para errores

---

**Desarrollado con ❤️ para CEMI**
