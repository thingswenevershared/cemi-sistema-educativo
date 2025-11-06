# 👤 Mi Perfil - CEMI Classroom

## ✅ Implementación Completada

Se ha creado exitosamente la sección "Mi Perfil" del Classroom con las siguientes características:

---

## 📁 Archivos Creados

### Frontend
1. **`frontend/perfil-classroom.html`** - Página principal del perfil
2. **`frontend/assets/css/perfil-classroom.css`** - Estilos con paleta azul
3. **`frontend/assets/js/perfil-classroom.js`** - Funcionalidad completa

### Backend
4. **`backend/routes/perfil-classroom.js`** - API endpoints para perfil
5. **`backend/sql/agregar_campos_perfil_personas.sql`** - Migración de base de datos

### Modificaciones
6. **`frontend/classroom.html`** - Agregado botón "Mi Perfil" en menú de usuario
7. **`server.js`** - Registrada nueva ruta de perfil
8. **`uploads/avatars/`** - Carpeta creada para avatares

---

## 🎨 Características Implementadas

### ✅ Secciones Incluidas

#### 1. **Información General**
- Header con avatar personalizable
- Nombre completo y rol
- Username y fecha de registro
- Cards con información de contacto (email, teléfono, fecha nacimiento, dirección)

#### 2. **Datos Personales (Editable)**
- Formulario completo para actualizar:
  - Nombre y Apellido
  - Email
  - Teléfono
  - Fecha de Nacimiento
  - Dirección
- Validación de campos
- Guardado en tiempo real

#### 3. **Información Académica**

**Para Alumnos:**
- Total de cursos inscritos
- Promedio general de calificaciones
- Tareas completadas vs totales
- Porcentaje de asistencia
- Lista de cursos con detalles

**Para Profesores:**
- Total de cursos que imparte
- Total de alumnos
- Especialidad/Idioma principal
- Lista de cursos asignados

#### 4. **Estadísticas del Classroom**
- Tiempo en la plataforma
- Última actividad registrada

#### 5. **Configuración del Perfil**
- Editor de biografía personal
- Cambio de foto de perfil
- Acciones rápidas:
  - Volver al Classroom
  - Ir al Dashboard
  - Exportar datos personales (JSON)

### ✅ Funcionalidades

- 🎨 **Paleta de colores azul** (como solicitaste)
- 🌙 **Modo oscuro completo**
- 📱 **Diseño responsive** (móvil, tablet, desktop)
- 🖼️ **Upload de avatar** con validación (max 2MB, solo imágenes)
- 💾 **Guardado automático** de preferencias
- 🔄 **Actualización en tiempo real** de datos
- 📊 **Estadísticas dinámicas** según el rol
- 🎯 **Navegación por secciones** con sidebar

---

## 🚀 Instrucciones de Uso

### Paso 1: Ejecutar Migración de Base de Datos

**IMPORTANTE:** Antes de usar la funcionalidad, debes ejecutar la migración SQL para agregar los campos necesarios a la tabla `personas`.

```bash
# Opción A: Desde MySQL Workbench o phpMyAdmin
# Abre y ejecuta el archivo:
backend/sql/agregar_campos_perfil_personas.sql

# Opción B: Desde la línea de comandos
mysql -u root -p cemi_educativo < backend/sql/agregar_campos_perfil_personas.sql
```

Esta migración agrega las siguientes columnas a la tabla `personas`:
- `email` (VARCHAR 100)
- `fecha_nacimiento` (DATE)
- `direccion` (VARCHAR 255)
- `biografia` (TEXT)
- `avatar` (VARCHAR 255)

### Paso 2: Reiniciar el Servidor

```bash
# Si el servidor está corriendo, detenlo y reinícialo
node server.js
```

### Paso 3: Acceder al Perfil

1. Inicia sesión en el Classroom
2. Haz clic en tu avatar/inicial en la esquina superior derecha
3. Selecciona **"Mi Perfil"**
4. ¡Listo! Ya puedes editar tu perfil

---

## 🔌 Endpoints API Creados

### GET `/api/classroom/perfil/:userId`
Obtiene todos los datos del perfil del usuario

**Respuesta:**
```json
{
  "success": true,
  "perfil": {
    "id_usuario": 4,
    "username": "alumnamica",
    "nombre": "Micaela",
    "apellido": "Gomez",
    "email": "micaela.gomez@cemi.com",
    "telefono": "11-1439-3159",
    "fecha_nacimiento": "1998-05-15",
    "direccion": "Buenos Aires, Argentina",
    "biografia": "Estudiante de inglés...",
    "avatar": "/uploads/avatars/avatar-4-123456.jpg",
    "rol": "alumno",
    "fecha_creacion": "2025-11-01"
  }
}
```

### PUT `/api/classroom/perfil/:userId`
Actualiza los datos del perfil

**Body:**
```json
{
  "nombre": "Micaela",
  "apellido": "Gomez",
  "email": "nuevo@email.com",
  "telefono": "+54 11 1234-5678",
  "fecha_nacimiento": "1998-05-15",
  "direccion": "Nueva dirección",
  "biografia": "Mi biografía actualizada"
}
```

### POST `/api/classroom/perfil/:userId/avatar`
Sube/actualiza el avatar del usuario

**Body:** FormData con archivo de imagen
**Validaciones:** 
- Solo imágenes (JPEG, PNG, GIF)
- Máximo 2MB

---

## 🎨 Paleta de Colores Azul

```css
--primary-blue: #1976d2;       /* Azul principal */
--primary-blue-dark: #1565c0;  /* Azul oscuro */
--primary-blue-light: #42a5f5; /* Azul claro */
--secondary-blue: #0288d1;     /* Azul secundario */
--accent-blue: #03a9f4;        /* Azul acento */
```

---

## 📱 Responsive Breakpoints

- **Desktop:** > 1024px (Layout completo con sidebar)
- **Tablet:** 768px - 1024px (Sidebar convertido en tabs)
- **Mobile:** < 768px (Layout vertical, cards apiladas)

---

## ⚠️ Notas Importantes

### Compatibilidad con la Base de Datos Actual

El sistema está configurado para funcionar con la estructura actual de tu base de datos:
- Usa `COALESCE(p.email, p.mail)` para leer email de ambos campos
- Al guardar email, actualiza tanto `email` como `mail`
- Los campos nuevos (`biografia`, `avatar`, etc.) son opcionales

### Carpeta de Uploads

La carpeta `uploads/avatars/` ya fue creada. Si usas Railway o un servidor en producción, asegúrate de que tenga permisos de escritura.

### Exclusiones Aplicadas

Como solicitaste, **NO se incluyeron**:
- ❌ Mensajes enviados (chat)
- ❌ Participación en chat
- ❌ Vista de perfil público/privado

---

## 🐛 Troubleshooting

### Error: "Usuario no encontrado"
- Verifica que hayas iniciado sesión correctamente
- Revisa que `localStorage` tenga `id_usuario` y `rol`

### Error: "No se pudo cargar el perfil"
- Ejecuta la migración SQL primero
- Verifica que el servidor esté corriendo en puerto 3000
- Revisa la consola del navegador y del servidor

### Avatar no se sube
- Verifica que la carpeta `uploads/avatars/` exista
- Revisa que tenga permisos de escritura
- Confirma que la imagen sea menor a 2MB

---

## ✨ Resultado Final

Ahora tienes un perfil completo y profesional con:
- ✅ Diseño moderno con paleta azul
- ✅ Modo oscuro funcional
- ✅ Edición de datos personales
- ✅ Upload de avatar
- ✅ Estadísticas académicas por rol
- ✅ Responsive en todos los dispositivos
- ✅ Integración completa con el backend

¡Disfruta tu nueva sección de perfil! 🎉
