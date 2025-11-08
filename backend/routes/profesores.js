import express from "express";
import pool from "../utils/db.js";
import bcrypt from "bcryptjs";
const router = express.Router();

// Obtener todos los profesores con estadísticas básicas
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_profesor,
        per.nombre,
        per.apellido,
        per.mail,
        per.telefono,
        p.especialidad,
        p.estado,
        p.fecha_ingreso,
        (SELECT GROUP_CONCAT(DISTINCT i.nombre_idioma SEPARATOR ', ')
         FROM cursos c
         JOIN idiomas i ON c.id_idioma = i.id_idioma
         WHERE c.id_profesor = p.id_profesor) as idiomas,
        (SELECT COUNT(*)
         FROM cursos c
         WHERE c.id_profesor = p.id_profesor) as total_cursos
      FROM profesores p
      JOIN personas per ON p.id_profesor = per.id_persona
      ORDER BY p.id_profesor DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los profesores:", error);
    res.status(500).json({ message: "Error al obtener los profesores" });
  }
});

// Obtener profesor por ID con estadísticas completas
router.get("/:id", async (req, res) => {
  try {
    // Datos básicos del profesor
    const [profesorRows] = await pool.query(`
      SELECT 
        p.id_profesor,
        per.id_persona,
        per.nombre,
        per.apellido,
        per.mail,
        per.telefono,
        p.especialidad,
        p.estado,
        p.fecha_ingreso,
        u.username as usuario,
        u.password_hash
      FROM profesores p
      JOIN personas per ON p.id_profesor = per.id_persona
      LEFT JOIN usuarios u ON p.id_persona = u.id_persona
      WHERE p.id_profesor = ?
    `, [req.params.id]);
    
    if (profesorRows.length === 0) {
      return res.status(404).json({ message: "Profesor no encontrado" });
    }

    const profesor = profesorRows[0];

    // Cursos que dicta con estadísticas
    const [cursosRows] = await pool.query(`
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma,
        n.descripcion as nivel,
        c.horario,
        a.nombre_aula,
        (SELECT COUNT(*) 
         FROM inscripciones ins 
         WHERE ins.id_curso = c.id_curso AND ins.estado = 'activo') as total_alumnos,
        (SELECT AVG((COALESCE(cal.parcial1, 0) + COALESCE(cal.parcial2, 0) + COALESCE(cal.final, 0)) / 
                    (CASE WHEN cal.parcial1 IS NOT NULL THEN 1 ELSE 0 END + 
                     CASE WHEN cal.parcial2 IS NOT NULL THEN 1 ELSE 0 END + 
                     CASE WHEN cal.final IS NOT NULL THEN 1 ELSE 0 END))
         FROM calificaciones cal
         WHERE cal.id_curso = c.id_curso
           AND (cal.parcial1 IS NOT NULL OR cal.parcial2 IS NOT NULL OR cal.final IS NOT NULL)
        ) as promedio_curso
      FROM cursos c
      JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      LEFT JOIN aulas a ON c.id_aula = a.id_aula
      WHERE c.id_profesor = ?
    `, [req.params.id]);

    // Total de alumnos bajo supervisión
    const [alumnosRows] = await pool.query(`
      SELECT COUNT(DISTINCT ins.id_alumno) as total_alumnos
      FROM inscripciones ins
      JOIN cursos c ON ins.id_curso = c.id_curso
      WHERE c.id_profesor = ? AND ins.estado = 'activo'
    `, [req.params.id]);

    // Promedio general de calificaciones de sus alumnos
    const [promedioRows] = await pool.query(`
      SELECT AVG((COALESCE(cal.parcial1, 0) + COALESCE(cal.parcial2, 0) + COALESCE(cal.final, 0)) / 
                 (CASE WHEN cal.parcial1 IS NOT NULL THEN 1 ELSE 0 END + 
                  CASE WHEN cal.parcial2 IS NOT NULL THEN 1 ELSE 0 END + 
                  CASE WHEN cal.final IS NOT NULL THEN 1 ELSE 0 END)) as promedio_general
      FROM calificaciones cal
      JOIN cursos c ON cal.id_curso = c.id_curso
      WHERE c.id_profesor = ?
        AND (cal.parcial1 IS NOT NULL OR cal.parcial2 IS NOT NULL OR cal.final IS NOT NULL)
    `, [req.params.id]);

    // Idiomas que enseña
    const [idiomasRows] = await pool.query(`
      SELECT DISTINCT i.nombre_idioma
      FROM cursos c
      JOIN idiomas i ON c.id_idioma = i.id_idioma
      WHERE c.id_profesor = ?
    `, [req.params.id]);

    // Construir respuesta completa
    const response = {
      ...profesor,
      cursos: cursosRows,
      total_cursos: cursosRows.length,
      total_alumnos: alumnosRows[0]?.total_alumnos || 0,
      promedio_general: promedioRows[0]?.promedio_general ? parseFloat(promedioRows[0].promedio_general).toFixed(2) : null,
      idiomas: idiomasRows.map(i => i.nombre_idioma),
      antiguedad_anos: profesor.fecha_ingreso ? Math.floor((new Date() - new Date(profesor.fecha_ingreso)) / (365.25 * 24 * 60 * 60 * 1000)) : 0
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener profesor:', error);
    res.status(500).json({ message: "Error al obtener profesor" });
  }
});

// Actualizar profesor
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, mail, especialidad, telefono, estado } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !mail || !especialidad) {
      return res.status(400).json({ 
        success: false, 
        message: "Nombre, apellido, mail y especialidad son obligatorios" 
      });
    }

    // Actualizar tabla personas (id_profesor = id_persona, incluye telefono)
    await pool.query(
      'UPDATE personas SET nombre = ?, apellido = ?, mail = ?, telefono = ? WHERE id_persona = ?',
      [nombre, apellido, mail, telefono || null, id]
    );

    // Actualizar tabla profesores (solo campos propios de profesor)
    const [result] = await pool.query(
      'UPDATE profesores SET especialidad = ?, estado = ? WHERE id_profesor = ?',
      [especialidad, estado || 'activo', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Profesor no encontrado" 
      });
    }

    res.json({ message: "Profesor actualizado correctamente", success: true });
  } catch (error) {
    console.error("Error al actualizar profesor:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar profesor" 
    });
  }
});

// Cambiar estado del profesor
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'inactivo', 'licencia'].includes(estado)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const [result] = await pool.query(
      'UPDATE profesores SET estado = ? WHERE id_profesor = ?',
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Profesor no encontrado" });
    }

    res.json({ message: "Estado actualizado correctamente", success: true });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ message: "Error al cambiar estado" });
  }
});

// Crear nuevo profesor
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, dni, mail, especialidad, telefono, username, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !mail || !especialidad) {
      return res.status(400).json({ 
        success: false, 
        message: "Nombre, apellido, mail y especialidad son obligatorios" 
      });
    }

    // Verificar si el email ya existe
    const [existingMail] = await pool.query(
      'SELECT id_persona FROM personas WHERE mail = ?',
      [mail]
    );

    if (existingMail.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "El email ya está registrado en el sistema" 
      });
    }

    // Verificar si el DNI ya existe (si se proporcionó)
    if (dni) {
      const [existingDNI] = await pool.query(
        'SELECT id_persona FROM personas WHERE dni = ?',
        [dni]
      );

      if (existingDNI.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "El DNI ya está registrado en el sistema" 
        });
      }
    }

    // Primero crear persona (incluyendo telefono)
    const [personaResult] = await pool.query(
      'INSERT INTO personas (nombre, apellido, mail, dni, telefono) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, mail, dni || null, telefono || null]
    );

    const id_persona = personaResult.insertId;

    // Crear profesor (solo datos académicos, sin telefono - id_profesor debe ser igual a id_persona según el constraint)
    await pool.query(
      'INSERT INTO profesores (id_profesor, id_persona, especialidad, estado, fecha_ingreso) VALUES (?, ?, ?, ?, CURRENT_DATE)',
      [id_persona, id_persona, especialidad, 'activo']
    );

    // Crear usuario si se proporcionó username y password
    if (username && password) {
      const [perfilRows] = await pool.query(
        'SELECT id_perfil FROM perfiles WHERE nombre_perfil = ?',
        ['profesor']
      );

      if (perfilRows.length > 0) {
        await pool.query(
          'INSERT INTO usuarios (username, password_hash, password_plain, id_persona, id_perfil) VALUES (?, ?, ?, ?, ?)',
          [username, password, username, id_persona, perfilRows[0].id_perfil]
        );
      }
    }

    res.json({ 
      message: "Profesor creado correctamente", 
      success: true,
      id_profesor: id_persona
    });
  } catch (error) {
    console.error("Error al crear profesor:", error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        message: "El email ya está registrado en el sistema" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message || "Error al crear profesor" 
    });
  }
});

// Crear credenciales de acceso para un profesor
router.post("/:id/credenciales", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son obligatorios"
      });
    }

    // Verificar que el profesor existe
    const [profesor] = await pool.query(
      'SELECT id_profesor FROM profesores WHERE id_profesor = ?',
      [id]
    );

    if (profesor.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profesor no encontrado"
      });
    }

    // Verificar si ya tiene usuario
    const [usuarioExistente] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE id_persona = ?',
      [id]
    );

    if (usuarioExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Este profesor ya tiene credenciales de acceso"
      });
    }

    // Verificar si el username ya existe
    const [usernameExistente] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE username = ?',
      [username]
    );

    if (usernameExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario ya está en uso"
      });
    }

    // Obtener el id del perfil "profesor"
    const [perfilRows] = await pool.query(
      'SELECT id_perfil FROM perfiles WHERE nombre_perfil = ?',
      ['profesor']
    );

    if (perfilRows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No se encontró el perfil de profesor en el sistema"
      });
    }

    // Hashear la contraseña
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Crear el usuario
    await pool.query(
      'INSERT INTO usuarios (username, password_hash, password_plain, id_persona, id_perfil) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, password, id, perfilRows[0].id_perfil]
    );

    res.json({
      success: true,
      message: "Credenciales creadas exitosamente"
    });

  } catch (error) {
    console.error("Error al crear credenciales:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al crear credenciales"
    });
  }
});

// Eliminar profesor
router.delete("/:id", async (req, res) => {
  try {
    const id_profesor = req.params.id;

    // Verificar si tiene cursos asignados
    const [cursos] = await pool.query(
      'SELECT COUNT(*) as total FROM cursos WHERE id_profesor = ?',
      [id_profesor]
    );

    if (cursos[0].total > 0) {
      return res.status(400).json({ 
        success: false,
        message: `No se puede eliminar: el profesor tiene ${cursos[0].total} curso(s) asignado(s). Los cursos quedarán sin profesor.` 
      });
    }

    // Eliminar registros relacionados (UPDATE cursos para dejar sin profesor)
    await pool.query('UPDATE cursos SET id_profesor = NULL WHERE id_profesor = ?', [id_profesor]);
    
    // Eliminar usuario si existe
    await pool.query('DELETE FROM usuarios WHERE id_persona = ?', [id_profesor]);
    
    // Eliminar profesor
    await pool.query('DELETE FROM profesores WHERE id_profesor = ?', [id_profesor]);
    
    // Eliminar persona
    const [result] = await pool.query('DELETE FROM personas WHERE id_persona = ?', [id_profesor]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Profesor no encontrado" 
      });
    }

    res.json({ 
      message: "Profesor eliminado correctamente", 
      success: true 
    });
  } catch (error) {
    console.error("Error al eliminar profesor:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error al eliminar profesor" 
    });
  }
});

// =====================================================
// Obtener datos del perfil del profesor
// =====================================================
router.get("/:id/perfil", async (req, res) => {
  try {
    const { id } = req.params;

    const [profesor] = await pool.query(`
      SELECT 
        p.id_profesor,
        per.nombre,
        per.apellido,
        per.mail,
        per.dni,
        per.telefono,
        p.especialidad,
        p.fecha_ingreso,
        p.estado,
        -- Total de cursos asignados
        (SELECT COUNT(*) 
         FROM cursos c 
         WHERE c.id_profesor = p.id_profesor) as total_cursos,
        -- Total de alumnos (suma de todos los cursos)
        (SELECT COUNT(DISTINCT i.id_alumno)
         FROM cursos c
         JOIN inscripciones i ON c.id_curso = i.id_curso
         WHERE c.id_profesor = p.id_profesor 
         AND i.estado = 'activo') as total_alumnos
      FROM profesores p
      JOIN personas per ON p.id_profesor = per.id_persona
      WHERE p.id_profesor = ?
    `, [id]);

    if (profesor.length === 0) {
      return res.status(404).json({ message: "Profesor no encontrado" });
    }

    console.log("Datos del perfil del profesor obtenidos:", profesor[0]); // Debug

    res.json(profesor[0]);

  } catch (error) {
    console.error("Error al obtener perfil del profesor:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// =====================================================
// Actualizar perfil del profesor
// =====================================================
router.put("/:id/perfil", async (req, res) => {
  try {
    const { id } = req.params;
    const { telefono } = req.body;

    await pool.query(`
      UPDATE profesores 
      SET telefono = ?
      WHERE id_profesor = ?
    `, [telefono, id]);

    res.json({ 
      success: true,
      message: "Perfil actualizado correctamente" 
    });

  } catch (error) {
    console.error("Error al actualizar perfil del profesor:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar perfil" 
    });
  }
});

// Cambiar contraseña del Dashboard - Profesor
router.post("/:id/cambiar-password-dashboard", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "La contraseña debe tener al menos 6 caracteres"
    });
  }

  try {
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar en la tabla usuarios (compartida Dashboard + Classroom)
    await pool.query(
      "UPDATE usuarios SET password_hash = ?, password_plain = ? WHERE id_persona = ?",
      [hashedPassword, password, id]
    );

    console.log(`✅ Contraseña actualizada para profesor ID: ${id} (Dashboard + Classroom)`);

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente para Dashboard y Classroom"
    });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar la contraseña"
    });
  }
});

// Actualizar usuario del Dashboard
router.patch("/:id/usuario", async (req, res) => {
  try {
    const { usuario } = req.body;
    const idProfesor = req.params.id;

    if (!usuario || usuario.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "El usuario es obligatorio"
      });
    }

    // Verificar que el usuario no esté en uso por otro usuario
    const [existente] = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE username = ? AND id_persona != ?",
      [usuario.trim(), idProfesor]
    );

    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Este usuario ya está en uso"
      });
    }

    // Actualizar usuario en tabla usuarios (compartida Dashboard + Classroom)
    await pool.query(
      "UPDATE usuarios SET username = ? WHERE id_persona = ?",
      [usuario.trim(), idProfesor]
    );

    res.json({
      success: true,
      message: "Usuario actualizado correctamente para Dashboard y Classroom"
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el usuario"
    });
  }
});

export default router;
