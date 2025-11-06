// backend/routes/perfil-classroom.js
import express from "express";
import pool from "../utils/db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const router = express.Router();

// Configuración de __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer para avatares
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.params.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    console.log('📤 Validando archivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log('  → Extensión válida:', extname);
    console.log('  → Mimetype válido:', mimetype);
    
    if (extname && mimetype) {
      console.log('  ✅ Archivo aceptado');
      return cb(null, true);
    } else {
      console.log('  ❌ Archivo rechazado');
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP, AVIF)'));
    }
  }
});

// =====================================================
// GET /api/classroom/perfil/:userId
// Obtener datos completos del perfil
// userId puede ser id_usuario, id_persona, id_alumno o id_profesor
// =====================================================

router.get("/perfil/:userId", async (req, res) => {
  const { userId } = req.params;
  const { tipo } = req.query; // Obtener tipo de la query string
  console.log(`🔍 [GET /perfil/:userId] Buscando perfil para userId: ${userId}, tipo: ${tipo || 'no especificado'}`);

  try {
    let usuarios = [];
    
    // Si se especificó un tipo, buscar primero por ese tipo
    if (tipo === 'alumno') {
      console.log('  → Buscando por id_alumno (tipo especificado)...');
      [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.username, u.id_persona, u.fecha_creacion,
                p.nombre, p.apellido, 
                p.mail as email, 
                p.telefono, p.fecha_nacimiento, 
                p.direccion, p.biografia, p.avatar,
                per.nombre_perfil as rol
         FROM alumnos alum
         JOIN personas p ON alum.id_persona = p.id_persona
         JOIN usuarios u ON p.id_persona = u.id_persona
         JOIN perfiles per ON u.id_perfil = per.id_perfil
         WHERE alum.id_alumno = ?`,
        [userId]
      );
    } else if (tipo === 'profesor') {
      console.log('  → Buscando por id_profesor (tipo especificado)...');
      [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.username, u.id_persona, u.fecha_creacion,
                p.nombre, p.apellido, 
                p.mail as email, 
                p.telefono, p.fecha_nacimiento, 
                p.direccion, p.biografia, p.avatar,
                per.nombre_perfil as rol
         FROM profesores prof
         JOIN personas p ON prof.id_persona = p.id_persona
         JOIN usuarios u ON p.id_persona = u.id_persona
         JOIN perfiles per ON u.id_perfil = per.id_perfil
         WHERE prof.id_profesor = ?`,
        [userId]
      );
    }
    
    // Si no se encontró con el tipo especificado o no se especificó tipo, buscar por id_usuario
    if (usuarios.length === 0) {
      console.log('  → Intentando buscar por id_usuario...');
      [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.username, u.id_persona, u.fecha_creacion,
                p.nombre, p.apellido, 
                p.mail as email, 
                p.telefono, p.fecha_nacimiento, 
                p.direccion, p.biografia, p.avatar,
                per.nombre_perfil as rol
         FROM usuarios u
         JOIN personas p ON u.id_persona = p.id_persona
         JOIN perfiles per ON u.id_perfil = per.id_perfil
         WHERE u.id_usuario = ?`,
        [userId]
      );
    }

    // Si no encontró por id_usuario, intentar por id_persona
    if (usuarios.length === 0) {
      console.log('  → No encontrado por id_usuario, intentando por id_persona...');
      [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.username, u.id_persona, u.fecha_creacion,
                p.nombre, p.apellido, 
                p.mail as email, 
                p.telefono, p.fecha_nacimiento, 
                p.direccion, p.biografia, p.avatar,
                per.nombre_perfil as rol
         FROM usuarios u
         JOIN personas p ON u.id_persona = p.id_persona
         JOIN perfiles per ON u.id_perfil = per.id_perfil
         WHERE p.id_persona = ?`,
        [userId]
      );
    }

    // Si no encontró por id_persona, intentar por id_profesor
    if (usuarios.length === 0) {
      console.log('  → No encontrado por id_persona, intentando por id_profesor...');
      [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.username, u.id_persona, u.fecha_creacion,
                p.nombre, p.apellido, 
                p.mail as email, 
                p.telefono, p.fecha_nacimiento, 
                p.direccion, p.biografia, p.avatar,
                per.nombre_perfil as rol
         FROM profesores prof
         JOIN personas p ON prof.id_persona = p.id_persona
         JOIN usuarios u ON p.id_persona = u.id_persona
         JOIN perfiles per ON u.id_perfil = per.id_perfil
         WHERE prof.id_profesor = ?`,
        [userId]
      );
    }

    // Si no encontró por id_profesor, intentar por id_alumno
    if (usuarios.length === 0) {
      console.log('  → No encontrado por id_profesor, intentando por id_alumno...');
      [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.username, u.id_persona, u.fecha_creacion,
                p.nombre, p.apellido, 
                p.mail as email, 
                p.telefono, p.fecha_nacimiento, 
                p.direccion, p.biografia, p.avatar,
                per.nombre_perfil as rol
         FROM alumnos alum
         JOIN personas p ON alum.id_persona = p.id_persona
         JOIN usuarios u ON p.id_persona = u.id_persona
         JOIN perfiles per ON u.id_perfil = per.id_perfil
         WHERE alum.id_alumno = ?`,
        [userId]
      );
    }

    if (usuarios.length === 0) {
      console.log('  ❌ Usuario no encontrado en ninguna tabla');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const perfil = usuarios[0];
    console.log('  ✅ Perfil encontrado:', {
      id_usuario: perfil.id_usuario,
      id_persona: perfil.id_persona,
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      rol: perfil.rol
    });

    return res.json({
      success: true,
      perfil: {
        id_usuario: perfil.id_usuario,
        id_persona: perfil.id_persona,
        username: perfil.username,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        email: perfil.email,
        telefono: perfil.telefono,
        fecha_nacimiento: perfil.fecha_nacimiento,
        direccion: perfil.direccion,
        biografia: perfil.biografia,
        avatar: perfil.avatar,
        rol: perfil.rol,
        fecha_creacion: perfil.fecha_creacion
      }
    });

  } catch (error) {
    console.error("💥 Error al obtener perfil:", error);
    return res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener el perfil'
    });
  }
});

// =====================================================
// PUT /api/classroom/perfil/:userId
// Actualizar datos del perfil
// =====================================================

router.put("/perfil/:userId", async (req, res) => {
  const { userId } = req.params;
  const { nombre, apellido, email, telefono, fecha_nacimiento, direccion, biografia } = req.body;
  
  console.log(`💾 [PUT /perfil/:userId] Actualizando perfil para userId: ${userId}`);
  console.log('  📦 Datos recibidos:', { nombre, apellido, email, telefono, fecha_nacimiento, direccion, biografia });

  try {
    // Obtener id_persona del usuario (puede recibir id_usuario o id_persona directamente)
    let id_persona = userId;
    
    console.log('  → Buscando id_persona...');
    const [checkUsuario] = await pool.query(
      'SELECT id_persona FROM usuarios WHERE id_usuario = ? OR id_persona = ?',
      [userId, userId]
    );

    if (checkUsuario.length > 0) {
      id_persona = checkUsuario[0].id_persona;
      console.log(`  ✓ id_persona encontrado: ${id_persona}`);
    } else {
      console.log(`  ⚠️ No se encontró usuario, asumiendo userId=${userId} es id_persona`);
    }

    // Construir query dinámica solo con campos proporcionados
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (apellido !== undefined) {
      updates.push('apellido = ?');
      values.push(apellido);
    }
    if (email !== undefined) {
      // Actualizar solo mail (campo que siempre existe)
      updates.push('mail = ?');
      values.push(email);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono);
    }
    // Los siguientes campos son opcionales y pueden no existir en la tabla
    // El error se manejará en el catch si la columna no existe
    if (fecha_nacimiento !== undefined) {
      updates.push('fecha_nacimiento = ?');
      values.push(fecha_nacimiento);
    }
    if (direccion !== undefined) {
      updates.push('direccion = ?');
      values.push(direccion);
    }
    if (biografia !== undefined) {
      updates.push('biografia = ?');
      values.push(biografia);
    }

    if (updates.length === 0) {
      console.log('  ⚠️ No hay datos para actualizar');
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }

    values.push(id_persona);

    const query = `UPDATE personas SET ${updates.join(', ')} WHERE id_persona = ?`;
    console.log('  → Ejecutando query:', query);
    console.log('  → Valores:', values);
    
    await pool.query(query, values);

    console.log(`  ✅ Perfil actualizado exitosamente para id_persona=${id_persona}`);

    return res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error("💥 Error al actualizar perfil:", error);
    return res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar el perfil'
    });
  }
});

// =====================================================
// POST /api/classroom/perfil/:userId/avatar
// Subir avatar del usuario
// =====================================================

router.post("/perfil/:userId/avatar", (req, res) => {
  console.log(`📸 [POST /perfil/:userId/avatar] Subiendo avatar para userId: ${req.params.userId}`);
  
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      console.error('❌ Error en multer:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    const { userId } = req.params;

    if (!req.file) {
      console.log('⚠️ No se recibió archivo');
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    try {
      console.log('✓ Archivo recibido:', req.file.filename);
      
      // Obtener id_persona del usuario
      let id_persona = userId;
      
      const [checkUsuario] = await pool.query(
        'SELECT id_persona FROM usuarios WHERE id_usuario = ? OR id_persona = ?',
        [userId, userId]
      );

      if (checkUsuario.length > 0) {
        id_persona = checkUsuario[0].id_persona;
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Actualizar ruta del avatar en la base de datos
      await pool.query(
        'UPDATE personas SET avatar = ? WHERE id_persona = ?',
        [avatarPath, id_persona]
      );

      console.log(`  ✅ Avatar actualizado para id_persona=${id_persona}: ${avatarPath}`);

      return res.json({
        success: true,
        message: 'Avatar actualizado correctamente',
        avatar: avatarPath
      });

    } catch (error) {
      console.error("💥 Error al subir avatar:", error);
      return res.status(500).json({
        success: false,
        message: 'Error del servidor al subir el avatar'
      });
    }
  });
});

export default router;
