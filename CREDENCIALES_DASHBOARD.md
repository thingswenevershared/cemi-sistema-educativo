# 🔐 CREDENCIALES DEL SISTEMA - DASHBOARD

## ✅ Migración Completada

Se han separado exitosamente las credenciales del **Dashboard** y del **Classroom**.

### 📊 Resumen de la Migración

- **Alumnos con credenciales:** 6
- **Profesores con credenciales:** 5  
- **Administradores:** 1

---

## 🔑 Credenciales por Defecto

### 👤 Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Nivel:** Superadmin

### 👨‍🎓 Alumnos
Los alumnos tienen credenciales con formato `alumnoX` donde X es su ID:

| Usuario | Contraseña | Nombre Completo |
|---------|-----------|-----------------|
| `alumnamica` | `micagomez` | Micaela Gomez |
| `alumno1` | `alumno123` | (Según ID en BD) |
| `alumno2` | `alumno123` | (Según ID en BD) |
| `alumno3` | `alumno123` | (Según ID en BD) |
| `alumno5` | `alumno123` | (Según ID en BD) |
| `alumno6` | `alumno123` | (Según ID en BD) |

### 👨‍🏫 Profesores
Los profesores tienen credenciales con formato `profesorX` donde X es su ID:

| Usuario | Contraseña |
|---------|-----------|
| `profesor1` | `profesor123` |
| `profesor2` | `profesor123` |
| `profesor3` | `profesor123` |
| `profesor4` | `profesor123` |
| `profesor5` | `profesor123` |

---

## 🔄 Diferencia entre Dashboard y Classroom

### Dashboard (Sistema de Gestión)
- **Tablas:** `alumnos`, `profesores`, `administradores`
- **Columnas:** `usuario`, `password_hash`
- **Endpoint:** `POST /api/auth/login`
- **Cambiar contraseña:** `POST /api/auth/cambiar-password-dashboard`

### Classroom (Plataforma Educativa)
- **Tabla:** `usuarios`
- **Columnas:** `username`, `password_hash`
- **Endpoint:** `POST /api/auth/login` (mismo endpoint, busca en tabla `usuarios`)
- **Cambiar contraseña:** `POST /api/auth/cambiar-password-classroom`

**IMPORTANTE:** Ambos sistemas son completamente independientes. Un usuario puede tener:
- Una contraseña para el Dashboard
- Una contraseña diferente para el Classroom

---

## 🛠️ Cambiar Contraseña del Dashboard

### Endpoint
```
POST /api/auth/cambiar-password-dashboard
```

### Body
```json
{
  "username": "alumnamica",
  "passwordActual": "micagomez",
  "passwordNueva": "nuevacontraseña123"
}
```

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Contraseña del Dashboard actualizada correctamente"
}
```

---

## 📋 Estructura de Base de Datos

### Tabla `alumnos`
```sql
ALTER TABLE alumnos 
ADD COLUMN usuario VARCHAR(50) UNIQUE,
ADD COLUMN password_hash VARCHAR(255);
```

### Tabla `profesores`
```sql
ALTER TABLE profesores 
ADD COLUMN usuario VARCHAR(50) UNIQUE,
ADD COLUMN password_hash VARCHAR(255);
```

### Tabla `administradores` (Nueva)
```sql
CREATE TABLE administradores (
  id_administrador INT PRIMARY KEY AUTO_INCREMENT,
  id_persona INT NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nivel_acceso ENUM('superadmin', 'admin') DEFAULT 'admin',
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE
);
```

---

## ✅ Próximos Pasos

1. **Probar login en el Dashboard:**
   - Usuario: `alumnamica`
   - Contraseña: `micagomez`

2. **Probar login de administrador:**
   - Usuario: `admin`
   - Contraseña: `admin123`

3. **Verificar que NO funcione con credenciales del Classroom**

4. **Crear interfaz para cambiar contraseña del Dashboard** (opcional)

---

## 🔧 Scripts de Migración

### Migración Principal
```bash
node migrar-credenciales.js
```

### Verificar Contraseñas
```bash
node check-login.js
```

---

## 📝 Notas Importantes

- ✅ Las credenciales del Dashboard están en las tablas `alumnos`, `profesores` y `administradores`
- ✅ Las credenciales del Classroom permanecen en la tabla `usuarios`
- ✅ Los sistemas son completamente independientes
- ✅ Un cambio de contraseña en el Classroom NO afecta al Dashboard
- ✅ Un cambio de contraseña en el Dashboard NO afecta al Classroom
- ✅ Todos los usuarios existentes tienen credenciales inicializadas
- ✅ Los nuevos usuarios necesitarán credenciales asignadas en ambos sistemas

---

**Fecha de Migración:** 2025-11-06  
**Versión:** 1.0.0
