// backend/routes/auth.js
import express from "express";
import pool from "../utils/db.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";

dotenv.config();

const router = express.Router();

const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOW_PLAINTEXT = process.env.ALLOW_PLAINTEXT_LOGIN === "true";
const isProd = NODE_ENV === "production";
const isBcrypt = (h) => typeof h === "string" && h.startsWith("$2");

// -------------------------
// POST /api/auth/login
// -------------------------
router.post("/login", 
  // Validaciones
  [
    body('username')
      .trim()
      .notEmpty().withMessage('El usuario es requerido')
      .isLength({ min: 3, max: 50 }).withMessage('Usuario debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Usuario contiene caracteres inválidos'),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 3 }).withMessage('Contraseña muy corta')
  ],
  async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  let { username, password } = req.body || {};
  username = String(username ?? "").trim();
  const pw = String(password ?? "").trim();

  if (!username || !pw) {
    return res.status(400).json({ success: false, message: "Faltan credenciales" });
  }

  try {
    // NUEVO: Buscar en las tablas del Dashboard (alumnos, profesores, administradores)
    // Intentar encontrar en administradores
    let [rows] = await pool.query(
      `SELECT 
        adm.id_administrador,
        adm.usuario,
        adm.password_hash,
        adm.nivel_acceso,
        p.id_persona,
        p.nombre,
        p.apellido,
        'admin' as rol
       FROM administradores adm
       JOIN personas p ON adm.id_persona = p.id_persona
       WHERE adm.usuario = ? AND adm.estado = 'activo'`,
      [username]
    );

    // Si no es admin, buscar en profesores
    if (rows.length === 0) {
      [rows] = await pool.query(
        `SELECT 
          prof.id_profesor,
          prof.usuario,
          prof.password_hash,
          p.id_persona,
          p.nombre,
          p.apellido,
          'profesor' as rol
         FROM profesores prof
         JOIN personas p ON prof.id_persona = p.id_persona
         WHERE prof.usuario = ? AND prof.estado = 'activo'`,
        [username]
      );
    }

    // Si no es profesor, buscar en alumnos
    if (rows.length === 0) {
      [rows] = await pool.query(
        `SELECT 
          al.id_alumno,
          al.usuario,
          al.password_hash,
          p.id_persona,
          p.nombre,
          p.apellido,
          'alumno' as rol
         FROM alumnos al
         JOIN personas p ON al.id_persona = p.id_persona
         WHERE al.usuario = ? AND al.estado = 'activo'`,
        [username]
      );
    }

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = rows[0];
    const stored = String(user.password_hash ?? "");

    // Verificar contraseña
    let ok = false;
    if (isBcrypt(stored)) ok = bcrypt.compareSync(pw, stored);
    else if (ALLOW_PLAINTEXT && !isProd) ok = pw === stored;

    if (!ok) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    const rol = user.rol;

    // Preparar respuesta según el rol
    const response = {
      success: true,
      message: "Login exitoso",
      rol,
      nombre: `${user.nombre} ${user.apellido}`.trim(),
      username: user.usuario,
      id_persona: user.id_persona
    };

    if (rol === 'admin') {
      response.id_administrador = user.id_administrador;
      response.nivel_acceso = user.nivel_acceso;
    } else if (rol === 'profesor') {
      response.id_profesor = user.id_profesor;
    } else if (rol === 'alumno') {
      response.id_alumno = user.id_alumno;
    }

    return res.json(response);
  } catch (error) {
    console.error("💥 /auth/login error:", error);
    return res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// -------------------------
// POST /api/auth/register
// Registro exclusivo para alumnos
// -------------------------
router.post("/register",
  [
    body('username')
      .trim()
      .notEmpty().withMessage('El usuario es requerido')
      .isLength({ min: 3, max: 50 }).withMessage('Usuario debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Usuario solo puede contener letras, números, punto, guión y guión bajo'),
    body('email')
      .trim()
      .notEmpty().withMessage('El email es requerido')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
    body('apellido')
      .trim()
      .notEmpty().withMessage('El apellido es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('Apellido debe tener entre 2 y 100 caracteres'),
    body('telefono')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]*$/).withMessage('Teléfono contiene caracteres inválidos'),
    body('dni')
      .optional()
      .trim()
      .matches(/^[0-9]*$/).withMessage('DNI solo debe contener números')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { username, email, password, nombre, apellido, telefono, dni } = req.body;

    try {
      // Verificar si el usuario ya existe
      const [existingUser] = await pool.query(
        "SELECT id_usuario FROM Usuarios WHERE username = ?",
        [username.trim()]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El nombre de usuario ya está en uso"
        });
      }

      // Verificar si el email ya existe (campo 'mail' en la tabla)
      const [existingEmail] = await pool.query(
        "SELECT id_persona FROM Personas WHERE mail = ?",
        [email.trim()]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado"
        });
      }

      // Hash de la contraseña
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password.trim(), salt);

      // Obtener ID del perfil "alumno"
      const [perfiles] = await pool.query(
        "SELECT id_perfil FROM Perfiles WHERE nombre_perfil = 'alumno'"
      );

      if (perfiles.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Error: perfil 'alumno' no encontrado"
        });
      }

      const id_perfil_alumno = perfiles[0].id_perfil;

      // Transacción
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Insertar en Personas (con todos los campos después de ejecutar el script SQL)
        const [personaResult] = await connection.query(
          `INSERT INTO Personas (nombre, apellido, mail, telefono, dni, fecha_creacion)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [nombre.trim(), apellido.trim(), email.trim(), telefono?.trim() || null, dni?.trim() || null]
        );

        const id_persona = personaResult.insertId;

        // Insertar en Usuarios
        await connection.query(
          `INSERT INTO Usuarios (id_persona, id_perfil, username, password_hash, fecha_creacion)
           VALUES (?, ?, ?, ?, NOW())`,
          [id_persona, id_perfil_alumno, username.trim(), passwordHash]
        );

        // Generar legajo automático (A001, A002, A003...)
        const [ultimoLegajo] = await connection.query(
          `SELECT legajo FROM Alumnos WHERE legajo LIKE 'A%' ORDER BY legajo DESC LIMIT 1`
        );
        
        let nuevoLegajo = 'A001';
        if (ultimoLegajo.length > 0 && ultimoLegajo[0].legajo) {
          const numeroActual = parseInt(ultimoLegajo[0].legajo.substring(1));
          const nuevoNumero = numeroActual + 1;
          nuevoLegajo = 'A' + String(nuevoNumero).padStart(3, '0');
        }

        // Insertar en Alumnos (id_alumno debe ser igual a id_persona, con legajo y teléfono)
        await connection.query(
          `INSERT INTO Alumnos (id_alumno, id_persona, legajo, telefono, fecha_registro, estado)
           VALUES (?, ?, ?, ?, NOW(), 'activo')`,
          [id_persona, id_persona, nuevoLegajo, telefono?.trim() || null]
        );

        await connection.commit();
        connection.release();

        return res.status(201).json({
          success: true,
          message: "¡Registro exitoso! Ya podés iniciar sesión.",
          legajo: nuevoLegajo,
          username: username.trim()
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }

    } catch (error) {
      console.error("💥 /auth/register error:", error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: "El usuario o email ya existe"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear la cuenta. Intentá de nuevo."
      });
    }
  }
);

// -------------------------
// POST /api/auth/cambiar-password
// Cambiar contraseña del usuario autenticado
// -------------------------
router.post("/cambiar-password",
  [
    body('passwordActual')
      .notEmpty().withMessage('La contraseña actual es requerida'),
    body('passwordNueva')
      .notEmpty().withMessage('La contraseña nueva es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { passwordActual, passwordNueva } = req.body;
    
    // Obtener usuario del token (si usas autenticación JWT)
    // Por ahora usaremos el usuario del header o body
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    try {
      // Decodificar el token para obtener el ID del usuario
      // Nota: Esto es una implementación básica, deberías usar JWT en producción
      const userId = parseInt(token); // Asumiendo que el token es el ID por ahora

      // Obtener información del usuario actual
      const [usuarios] = await pool.query(
        'SELECT id_persona, password FROM personas WHERE id_persona = ?',
        [userId]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuario = usuarios[0];

      // Verificar contraseña actual
      const passwordMatch = await bcrypt.compare(passwordActual, usuario.password);
      
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordNueva, 10);

      // Actualizar contraseña
      await pool.query(
        'UPDATE personas SET password = ? WHERE id_persona = ?',
        [hashedPassword, userId]
      );

      return res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });

    } catch (error) {
      console.error("💥 /auth/cambiar-password error:", error);
      return res.status(500).json({
        success: false,
        message: 'Error al cambiar la contraseña'
      });
    }
  }
);

// POST /api/auth/cambiar-password-classroom
// Cambiar contraseña del Classroom (usuarios tabla)
// -------------------------
router.post("/cambiar-password-classroom",
  [
    body('userId')
      .notEmpty().withMessage('El ID de usuario es requerido'),
    body('passwordActual')
      .notEmpty().withMessage('La contraseña actual es requerida'),
    body('passwordNueva')
      .notEmpty().withMessage('La contraseña nueva es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { userId, passwordActual, passwordNueva } = req.body;

    try {
      // Obtener usuario del Classroom
      const [usuarios] = await pool.query(
        'SELECT id_usuario, username, password_hash FROM usuarios WHERE id_usuario = ?',
        [userId]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario del Classroom no encontrado'
        });
      }

      const usuario = usuarios[0];
      const stored = String(usuario.password_hash ?? "");

      // Verificar contraseña actual (soporta bcrypt y texto plano)
      let passwordMatch = false;
      if (isBcrypt(stored)) {
        passwordMatch = await bcrypt.compare(passwordActual, stored);
      } else if (ALLOW_PLAINTEXT && !isProd) {
        passwordMatch = passwordActual === stored;
      }
      
      if (!passwordMatch) {
        console.log(`❌ Contraseña incorrecta para usuario ${usuario.username}. Tipo hash: ${isBcrypt(stored) ? 'bcrypt' : 'plaintext'}`);
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual del Classroom es incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordNueva, 10);

      // Actualizar contraseña del Classroom
      await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
        [hashedPassword, userId]
      );

      console.log(`✅ Contraseña del Classroom actualizada para usuario: ${usuario.username}`);

      return res.json({
        success: true,
        message: 'Contraseña del Classroom actualizada correctamente'
      });

    } catch (error) {
      console.error("💥 /auth/cambiar-password-classroom error:", error);
      return res.status(500).json({
        success: false,
        message: 'Error al cambiar la contraseña del Classroom'
      });
    }
  }
);

// -------------------------
// POST /api/auth/cambiar-password-dashboard
// Cambiar contraseña del Dashboard (separada del Classroom)
// -------------------------
router.post("/cambiar-password-dashboard",
  [
    body('username').trim().notEmpty().withMessage('El usuario es requerido'),
    body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida'),
    body('passwordNueva')
      .notEmpty().withMessage('La contraseña nueva es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { username, passwordActual, passwordNueva } = req.body;

    try {
      console.log(`🔑 Intentando cambiar contraseña del Dashboard para: ${username}`);

      // Buscar usuario en administradores
      let [rows] = await pool.query(
        'SELECT id_administrador as id, usuario, password_hash, "admin" as tipo FROM administradores WHERE usuario = ?',
        [username]
      );

      // Si no es admin, buscar en profesores
      if (rows.length === 0) {
        [rows] = await pool.query(
          'SELECT id_profesor as id, usuario, password_hash, "profesor" as tipo FROM profesores WHERE usuario = ?',
          [username]
        );
      }

      // Si no es profesor, buscar en alumnos
      if (rows.length === 0) {
        [rows] = await pool.query(
          'SELECT id_alumno as id, usuario, password_hash, "alumno" as tipo FROM alumnos WHERE usuario = ?',
          [username]
        );
      }

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en el Dashboard'
        });
      }

      const user = rows[0];
      const stored = String(user.password_hash ?? "");

      // Verificar contraseña actual
      let passwordMatch = false;
      if (isBcrypt(stored)) {
        passwordMatch = await bcrypt.compare(passwordActual, stored);
      } else if (ALLOW_PLAINTEXT && !isProd) {
        passwordMatch = passwordActual === stored;
      }

      if (!passwordMatch) {
        console.log(`❌ Contraseña actual incorrecta para usuario ${user.usuario}`);
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual del Dashboard es incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordNueva, 10);

      // Actualizar contraseña según el tipo de usuario
      if (user.tipo === 'admin') {
        await pool.query(
          'UPDATE administradores SET password_hash = ? WHERE id_administrador = ?',
          [hashedPassword, user.id]
        );
      } else if (user.tipo === 'profesor') {
        await pool.query(
          'UPDATE profesores SET password_hash = ? WHERE id_profesor = ?',
          [hashedPassword, user.id]
        );
      } else if (user.tipo === 'alumno') {
        await pool.query(
          'UPDATE alumnos SET password_hash = ? WHERE id_alumno = ?',
          [hashedPassword, user.id]
        );
      }

      console.log(`✅ Contraseña del Dashboard actualizada para usuario: ${user.usuario} (${user.tipo})`);

      return res.json({
        success: true,
        message: 'Contraseña del Dashboard actualizada correctamente'
      });

    } catch (error) {
      console.error("💥 /auth/cambiar-password-dashboard error:", error);
      return res.status(500).json({
        success: false,
        message: 'Error al cambiar la contraseña del Dashboard'
      });
    }
  }
);

// -------------------------
// GET /api/auth/usuario-classroom/:id_persona
// Obtener usuario de classroom por id_persona (para admins)
// -------------------------
router.get("/usuario-classroom/:id_persona", async (req, res) => {
  const { id_persona } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, username FROM usuarios WHERE id_persona = ?',
      [id_persona]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario de Classroom no encontrado'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("💥 /auth/usuario-classroom error:", error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario de Classroom'
    });
  }
});

// -------------------------
// POST /api/auth/admin-cambiar-password-classroom
// Cambiar contraseña y/o usuario del Classroom (solo para admins)
// -------------------------
router.post("/admin-cambiar-password-classroom",
  [
    body('id_persona').isInt().withMessage('ID de persona inválido'),
    body('username').optional().trim().notEmpty().withMessage('El usuario no puede estar vacío'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { id_persona, username, password } = req.body;

    try {
      console.log(`🔑 Admin actualizando credenciales de Classroom para id_persona: ${id_persona}`);

      // Verificar que existe el usuario
      const [rows] = await pool.query(
        'SELECT id_usuario, username FROM usuarios WHERE id_persona = ?',
        [id_persona]
      );

      if (rows.length === 0) {
        // Si no existe, crear el usuario
        if (!username || !password) {
          return res.status(400).json({
            success: false,
            message: 'Para crear un usuario nuevo se requiere username y password'
          });
        }

        // Verificar que el username no esté en uso
        const [existente] = await pool.query(
          'SELECT id_usuario FROM usuarios WHERE username = ?',
          [username]
        );

        if (existente.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Este nombre de usuario ya está en uso'
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          'INSERT INTO usuarios (id_persona, username, password_hash, rol) VALUES (?, ?, ?, ?)',
          [id_persona, username, hashedPassword, 'estudiante']
        );

        console.log(`✅ Usuario de Classroom creado: ${username}`);
        return res.json({
          success: true,
          message: 'Usuario de Classroom creado correctamente'
        });
      }

      // Si existe, actualizar lo que se haya enviado
      const updates = [];
      const values = [];

      if (username && username !== rows[0].username) {
        // Verificar que el nuevo username no esté en uso
        const [existente] = await pool.query(
          'SELECT id_usuario FROM usuarios WHERE username = ? AND id_persona != ?',
          [username, id_persona]
        );

        if (existente.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Este nombre de usuario ya está en uso'
          });
        }

        updates.push('username = ?');
        values.push(username);
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password_hash = ?');
        values.push(hashedPassword);
      }

      if (updates.length > 0) {
        values.push(id_persona);
        await pool.query(
          `UPDATE usuarios SET ${updates.join(', ')} WHERE id_persona = ?`,
          values
        );

        console.log(`✅ Credenciales de Classroom actualizadas para: ${username || rows[0].username}`);
      }

      return res.json({
        success: true,
        message: 'Credenciales del Classroom actualizadas correctamente'
      });

    } catch (error) {
      console.error("💥 /auth/admin-cambiar-password-classroom error:", error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar las credenciales del Classroom'
      });
    }
  }
);

// -------------------------
// POST /api/auth/classroom-login
// Login específico para Classroom (tabla usuarios)
// -------------------------
router.post("/classroom-login", async (req, res) => {
  let { username, password } = req.body || {};
  username = String(username ?? "").trim();
  const pw = String(password ?? "").trim();

  if (!username || !pw) {
    return res.status(400).json({ success: false, message: "Faltan credenciales" });
  }

  try {
    // Buscar en la tabla usuarios (Classroom)
    const [rows] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.username,
        u.password_hash,
        u.id_persona,
        u.id_perfil,
        p.nombre,
        p.apellido,
        per.nombre_perfil as rol
       FROM usuarios u
       JOIN personas p ON u.id_persona = p.id_persona
       JOIN perfiles per ON u.id_perfil = per.id_perfil
       WHERE u.username = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = rows[0];
    const stored = String(user.password_hash ?? "");

    // Verificar contraseña
    let ok = false;
    if (isBcrypt(stored)) ok = bcrypt.compareSync(pw, stored);
    else if (ALLOW_PLAINTEXT && !isProd) ok = pw === stored;

    if (!ok) {
      console.log(`❌ Classroom login fallido para ${username}. Hash tipo: ${isBcrypt(stored) ? 'bcrypt' : 'plaintext'}`);
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    console.log(`✅ Classroom login exitoso para ${username} (${user.rol})`);

    // Determinar el rol y datos adicionales
    let rolFinal = user.rol;
    let id_profesor = null;
    let id_alumno = null;

    if (user.id_perfil === 2) { // Profesor
      const [prof] = await pool.query('SELECT id_profesor FROM profesores WHERE id_persona = ?', [user.id_persona]);
      if (prof.length > 0) id_profesor = prof[0].id_profesor;
      rolFinal = 'profesor';
    } else if (user.id_perfil === 3) { // Alumno
      const [alum] = await pool.query('SELECT id_alumno FROM alumnos WHERE id_persona = ?', [user.id_persona]);
      if (alum.length > 0) id_alumno = alum[0].id_alumno;
      rolFinal = 'alumno';
    } else if (user.id_perfil === 1) { // Admin
      rolFinal = 'admin';
    }

    // Respuesta
    const response = {
      success: true,
      message: "Login exitoso",
      id_usuario: user.id_usuario,
      rol: rolFinal,
      nombre: `${user.nombre} ${user.apellido}`.trim(),
      username: user.username,
      id_persona: user.id_persona
    };

    if (id_profesor) response.id_profesor = id_profesor;
    if (id_alumno) response.id_alumno = id_alumno;

    return res.json(response);
  } catch (error) {
    console.error("💥 /auth/classroom-login error:", error);
    return res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

export default router;
