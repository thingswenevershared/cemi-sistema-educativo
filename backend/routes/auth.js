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
    // NORMALIZADO: Buscar en tabla usuarios centralizada
    let [rows] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.username,
        u.password_hash,
        u.id_perfil,
        p.id_persona,
        p.nombre,
        p.apellido,
        perf.nombre_perfil as rol
       FROM usuarios u
       JOIN personas p ON u.id_persona = p.id_persona
       JOIN perfiles perf ON u.id_perfil = perf.id_perfil
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
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    const rol = user.rol;

    // Obtener ID específico según el rol
    let id_especifico = null;
    if (rol === 'administrador' || rol === 'admin') {
      const [admins] = await pool.query(
        'SELECT id_administrador FROM administradores WHERE id_persona = ?',
        [user.id_persona]
      );
      id_especifico = admins[0]?.id_administrador;
    } else if (rol === 'profesor') {
      const [profs] = await pool.query(
        'SELECT id_profesor FROM profesores WHERE id_persona = ?',
        [user.id_persona]
      );
      id_especifico = profs[0]?.id_profesor;
    } else if (rol === 'alumno') {
      const [alums] = await pool.query(
        'SELECT id_alumno FROM alumnos WHERE id_persona = ?',
        [user.id_persona]
      );
      id_especifico = alums[0]?.id_alumno;
    }

    // Preparar respuesta según el rol
    const response = {
      success: true,
      message: "Login exitoso",
      rol,
      nombre: `${user.nombre} ${user.apellido}`.trim(),
      username: user.username,
      id_persona: user.id_persona,
      id_usuario: user.id_usuario
    };

    if (rol === 'administrador' || rol === 'admin') {
      response.id_administrador = id_especifico;
    } else if (rol === 'profesor') {
      response.id_profesor = id_especifico;
    } else if (rol === 'alumno') {
      response.id_alumno = id_especifico;
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
      // Verificar si el usuario ya existe en la tabla centralizada 'usuarios'
      const [existingUser] = await pool.query(
        "SELECT id_usuario FROM usuarios WHERE username = ?",
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
        "SELECT id_persona FROM personas WHERE mail = ?",
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
        "SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'alumno'"
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
        // Insertar en personas
        const [personaResult] = await connection.query(
          `INSERT INTO personas (nombre, apellido, mail, telefono, dni, fecha_creacion)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [nombre.trim(), apellido.trim(), email.trim(), telefono?.trim() || null, dni?.trim() || null]
        );

        const id_persona = personaResult.insertId;

        // Insertar en usuarios (DASHBOARD)
        const [usuarioResult] = await connection.query(
          `INSERT INTO usuarios (id_persona, id_perfil, username, password_hash, fecha_creacion)
           VALUES (?, ?, ?, ?, NOW())`,
          [id_persona, id_perfil_alumno, username.trim(), passwordHash]
        );
        
        const id_usuario = usuarioResult.insertId;

        // Generar legajo automático (A001, A002, A003...)
        const [ultimoLegajo] = await connection.query(
          `SELECT legajo FROM alumnos WHERE legajo LIKE 'A%' ORDER BY legajo DESC LIMIT 1`
        );
        
        let nuevoLegajo = 'A001';
        if (ultimoLegajo.length > 0 && ultimoLegajo[0].legajo) {
          const numeroActual = parseInt(ultimoLegajo[0].legajo.substring(1));
          const nuevoNumero = numeroActual + 1;
          nuevoLegajo = 'A' + String(nuevoNumero).padStart(3, '0');
        }

        // Insertar en alumnos (solo datos académicos, SIN credenciales)
        const [alumnoResult] = await connection.query(
          `INSERT INTO alumnos (id_alumno, id_persona, legajo, fecha_registro, estado)
           VALUES (?, ?, ?, NOW(), 'activo')`,
          [id_persona, id_persona, nuevoLegajo]
        );
        
        const id_alumno = alumnoResult.insertId;

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

      // Buscar usuario en la tabla centralizada 'usuarios'
      const [urows] = await pool.query(
        `SELECT u.id_usuario, u.username, u.password_hash, perf.nombre_perfil as tipo, p.id_persona
         FROM usuarios u
         JOIN perfiles perf ON u.id_perfil = perf.id_perfil
         JOIN personas p ON u.id_persona = p.id_persona
         WHERE u.username = ?`,
        [username]
      );

      if (urows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en el Dashboard'
        });
      }

      const user = urows[0];
      const stored = String(user.password_hash ?? "");

      // Verificar contraseña actual
      let passwordMatch = false;
      if (isBcrypt(stored)) {
        passwordMatch = await bcrypt.compare(passwordActual, stored);
      } else if (ALLOW_PLAINTEXT && !isProd) {
        passwordMatch = passwordActual === stored;
      }

      if (!passwordMatch) {
        console.log(`❌ Contraseña actual incorrecta para usuario ${user.username}`);
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual del Dashboard es incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordNueva, 10);

      // Actualizar contraseña en la tabla centralizada 'usuarios'
      await pool.query(
        'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?',
        [hashedPassword, user.id_usuario]
      );

      console.log(`✅ Contraseña del Dashboard actualizada para usuario: ${user.username}`);

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
// Admin cambia usuario y/o contraseña (Dashboard y Classroom usan la misma)
// Recibe: id_persona, username, password (opcional)
// -------------------------
router.post("/admin-cambiar-password-classroom",
  [
    body('id_persona').isInt().withMessage('ID de persona inválido'),
    body('username').notEmpty().withMessage('El nombre de usuario es obligatorio')
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
      console.log(`🔑 Admin actualizando credenciales para id_persona: ${id_persona}`);

      // Verificar que el usuario no esté en uso por otra persona
      const [existingUser] = await pool.query(
        `SELECT id_persona FROM usuarios WHERE username = ? AND id_persona != ?`,
        [username, id_persona]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso por otra persona'
        });
      }

      // Buscar el usuario en la tabla usuarios
      const [user] = await pool.query(
        `SELECT id_usuario, username FROM usuarios WHERE id_persona = ?`,
        [id_persona]
      );

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en la tabla usuarios'
        });
      }

      // Actualizar username
      await pool.query(
        `UPDATE usuarios SET username = ? WHERE id_persona = ?`,
        [username, id_persona]
      );

      console.log(`✅ Username actualizado a: ${username}`);

      // Si se proporcionó password, actualizarlo también
      if (password && password.trim().length > 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
          `UPDATE usuarios SET password_hash = ? WHERE id_persona = ?`,
          [hashedPassword, id_persona]
        );

        console.log(`✅ Password actualizada para id_persona: ${id_persona}`);

        return res.json({
          success: true,
          message: 'Usuario y contraseña actualizados correctamente (válidos para Dashboard y Classroom)'
        });
      } else {
        return res.json({
          success: true,
          message: 'Usuario actualizado correctamente (válido para Dashboard y Classroom)'
        });
      }

    } catch (error) {
      console.error("💥 /auth/admin-cambiar-password-classroom error:", error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar las credenciales'
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

// -------------------------
// GET /api/auth/usuario-classroom/:id
// Obtener información de usuario (Dashboard y Classroom usan mismas credenciales)
// -------------------------
router.get("/usuario-classroom/:id", async (req, res) => {
  const { id } = req.params;
  const { tipo } = req.query; // 'alumno' o 'profesor'

  try {
    let tienePassword;

    if (tipo === 'alumno') {
      const [rows] = await pool.query(
        `SELECT a.id_alumno, u.username as usuario, u.password_hash,
                p.nombre, p.apellido
         FROM alumnos a
         JOIN personas p ON a.id_persona = p.id_persona
         LEFT JOIN usuarios u ON a.id_persona = u.id_persona
         WHERE a.id_alumno = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Alumno no encontrado'
        });
      }

      tienePassword = rows[0].password_hash !== null;

      return res.json({
        success: true,
        usuario: rows[0].usuario,
        nombre: `${rows[0].nombre} ${rows[0].apellido}`,
        tiene_password: tienePassword, // Dashboard y Classroom usan mismo password
        tiene_password_classroom: tienePassword // Por compatibilidad con frontend
      });

    } else if (tipo === 'profesor') {
      const [rows] = await pool.query(
        `SELECT pr.id_profesor, u.username as usuario, u.password_hash,
                per.nombre, per.apellido
         FROM profesores pr
         JOIN personas per ON pr.id_persona = per.id_persona
         LEFT JOIN usuarios u ON pr.id_persona = u.id_persona
         WHERE pr.id_profesor = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profesor no encontrado'
        });
      }

      tienePassword = rows[0].password_hash !== null;

      return res.json({
        success: true,
        usuario: rows[0].usuario,
        nombre: `${rows[0].nombre} ${rows[0].apellido}`,
        tiene_password: tienePassword, // Dashboard y Classroom usan mismo password
        tiene_password_classroom: tienePassword // Por compatibilidad con frontend
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Tipo de usuario no especificado'
    });

  } catch (error) {
    console.error("💥 /auth/usuario-classroom error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener información del usuario"
    });
  }
});

export default router;
