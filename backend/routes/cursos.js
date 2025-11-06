// backend/routes/cursos.js
import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { id_profesor } = req.query; // viene del frontend

    const query = `
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma AS nombre_idioma,
        n.descripcion AS nivel,
        CONCAT(per.nombre, ' ', per.apellido) AS profesor,
        c.id_profesor,
        c.horario,
        a.nombre_aula AS nombre_aula,
        c.cupo_maximo,
        (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS alumnos_inscritos
      FROM cursos c
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      LEFT JOIN profesores p ON c.id_profesor = p.id_profesor
      LEFT JOIN personas per ON p.id_profesor = per.id_persona
      LEFT JOIN aulas a ON c.id_aula = a.id_aula
      ${id_profesor ? "WHERE c.id_profesor = ?" : ""}
      ORDER BY c.id_curso DESC
    `;

    const [rows] = await pool.query(query, id_profesor ? [id_profesor] : []);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ message: "Error al obtener los cursos" });
  }
});

// =====================================================
// GET /profesor/:idProfesor
// Obtener cursos de un profesor específico con información completa
// =====================================================
router.get("/profesor/:idProfesor", async (req, res) => {
  try {
    const { idProfesor } = req.params;
    console.log(`📚 [GET /cursos/profesor/:id] Obteniendo cursos del profesor ${idProfesor}`);

    const query = `
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma,
        n.descripcion AS nombre_nivel,
        c.horario,
        a.nombre_aula,
        c.cupo_maximo,
        (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS total_inscritos
      FROM cursos c
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      LEFT JOIN aulas a ON c.id_aula = a.id_aula
      WHERE c.id_profesor = ?
      ORDER BY c.nombre_curso
    `;

    const [cursos] = await pool.query(query, [idProfesor]);
    
    console.log(`  ✅ Encontrados ${cursos.length} cursos`);

    res.json({
      success: true,
      cursos: cursos
    });
  } catch (error) {
    console.error("💥 Error al obtener cursos del profesor:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al obtener cursos del profesor" 
    });
  }
});

// Obtener un curso específico por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        c.id_curso,
        c.nombre_curso,
        c.id_idioma,
        c.id_nivel,
        c.id_profesor,
        c.id_aula,
        i.nombre_idioma AS nombre_idioma,
        n.descripcion AS nivel,
        CONCAT(per.nombre, ' ', per.apellido) AS profesor,
        c.horario,
        a.nombre_aula AS nombre_aula,
        c.cupo_maximo,
        (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS alumnos_inscritos
      FROM cursos c
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      INNER JOIN profesores p ON c.id_profesor = p.id_profesor
      INNER JOIN personas per ON p.id_persona = per.id_persona
      LEFT JOIN aulas a ON c.id_aula = a.id_aula
      WHERE c.id_curso = ?
    `;

    const [rows] = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Curso no encontrado" });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    res.status(500).json({ message: "Error al obtener el curso" });
  }
});

// Obtener detalles completos del curso con alumnos y estadísticas
router.get("/:id/detalles", async (req, res) => {
  try {
    const { id } = req.params;

    // Información del curso
    const [cursoRows] = await pool.query(`
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma,
        n.descripcion AS nivel,
        c.id_nivel,
        c.horario,
        a.nombre_aula,
        a.capacidad,
        CONCAT(per.nombre, ' ', per.apellido) AS profesor,
        c.cupo_maximo,
        (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS alumnos_inscritos
      FROM cursos c
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      LEFT JOIN aulas a ON c.id_aula = a.id_aula
      INNER JOIN profesores p ON c.id_profesor = p.id_profesor
      INNER JOIN personas per ON p.id_persona = per.id_persona
      WHERE c.id_curso = ?
    `, [id]);

    if (cursoRows.length === 0) {
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    // Alumnos inscritos con sus calificaciones
    const [alumnosRows] = await pool.query(`
      SELECT 
        a.id_alumno,
        CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo,
        p.mail,
        i.fecha_inscripcion,
        cal.parcial1,
        cal.parcial2,
        cal.final,
        CASE 
          WHEN cal.parcial1 IS NULL AND cal.parcial2 IS NULL AND cal.final IS NULL THEN NULL
          ELSE ROUND(
            (COALESCE(cal.parcial1, 0) + COALESCE(cal.parcial2, 0) + COALESCE(cal.final, 0)) / 
            (
              (CASE WHEN cal.parcial1 IS NOT NULL THEN 1 ELSE 0 END) + 
              (CASE WHEN cal.parcial2 IS NOT NULL THEN 1 ELSE 0 END) + 
              (CASE WHEN cal.final IS NOT NULL THEN 1 ELSE 0 END)
            ), 
            2
          )
        END AS promedio
      FROM inscripciones i
      INNER JOIN alumnos a ON i.id_alumno = a.id_alumno
      INNER JOIN personas p ON a.id_persona = p.id_persona
      LEFT JOIN calificaciones cal ON (cal.id_alumno = a.id_alumno AND cal.id_curso = i.id_curso)
      WHERE i.id_curso = ? AND i.estado = 'activo'
      ORDER BY p.apellido, p.nombre
    `, [id]);

    // Calcular estadísticas
    const alumnosConPromedio = alumnosRows.filter(al => al.promedio !== null);
    const promedioGeneral = alumnosConPromedio.length > 0
      ? (alumnosConPromedio.reduce((sum, al) => sum + parseFloat(al.promedio), 0) / alumnosConPromedio.length).toFixed(2)
      : 0;

    const aprobados = alumnosRows.filter(al => al.promedio !== null && parseFloat(al.promedio) >= 7).length;
    const reprobados = alumnosRows.filter(al => al.promedio !== null && parseFloat(al.promedio) < 7).length;

    res.json({
      curso: cursoRows[0],
      alumnos: alumnosRows,
      estadisticas: {
        total_alumnos: alumnosRows.length,
        promedio_general: promedioGeneral,
        aprobados,
        reprobados,
        sin_calificaciones: alumnosRows.filter(al => al.promedio === null).length
      }
    });
  } catch (error) {
    console.error("Error al obtener detalles del curso:", error);
    res.status(500).json({ message: "Error al obtener detalles del curso" });
  }
});

// Obtener lista de alumnos de un curso
router.get("/:id/alumnos", async (req, res) => {
  try {
    const { id } = req.params;

    const [alumnos] = await pool.query(`
      SELECT 
        a.id_alumno,
        CONCAT(p.nombre, ' ', p.apellido) AS nombre,
        p.mail AS email,
        p.avatar,
        i.fecha_inscripcion,
        i.estado
      FROM inscripciones i
      INNER JOIN alumnos a ON i.id_alumno = a.id_alumno
      INNER JOIN personas p ON a.id_persona = p.id_persona
      WHERE i.id_curso = ? AND i.estado = 'activo'
      ORDER BY p.apellido, p.nombre
    `, [id]);

    res.json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos del curso:", error);
    res.status(500).json({ message: "Error al obtener alumnos del curso" });
  }
});

// Asignar/cambiar profesor de un curso
router.put("/:id/profesor", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_profesor } = req.body;

    if (!id_profesor) {
      return res.status(400).json({ 
        success: false, 
        message: "El ID del profesor es obligatorio" 
      });
    }

    // Verificar que el profesor existe
    const [profesorRows] = await pool.query(
      'SELECT id_profesor FROM profesores WHERE id_profesor = ? AND estado = "activo"',
      [id_profesor]
    );

    if (profesorRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Profesor no encontrado o inactivo" 
      });
    }

    // Actualizar el profesor del curso
    const [result] = await pool.query(
      'UPDATE cursos SET id_profesor = ? WHERE id_curso = ?',
      [id_profesor, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Curso no encontrado" 
      });
    }

    res.json({ 
      message: "Profesor asignado correctamente al curso", 
      success: true 
    });
  } catch (error) {
    console.error("Error al asignar profesor:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error al asignar profesor" 
    });
  }
});

// Actualizar un curso
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_curso, horario, cupo_maximo, id_aula, id_idioma, id_nivel, id_profesor } = req.body;

    const query = `
      UPDATE cursos 
      SET nombre_curso = ?, 
          horario = ?, 
          cupo_maximo = ?, 
          id_aula = ?,
          id_idioma = ?,
          id_nivel = ?,
          id_profesor = ?
      WHERE id_curso = ?
    `;

    const [result] = await pool.query(query, [
      nombre_curso, 
      horario, 
      cupo_maximo, 
      id_aula,
      id_idioma,
      id_nivel,
      id_profesor,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    res.json({ message: "Curso actualizado correctamente", success: true });
  } catch (error) {
    console.error("Error al actualizar el curso:", error);
    res.status(500).json({ message: "Error al actualizar el curso" });
  }
});

// Crear nuevo curso
router.post("/", async (req, res) => {
  try {
    const { nombre_curso, id_idioma, id_nivel, id_profesor, horario, cupo_maximo, id_aula } = req.body;

    // Validar campos requeridos
    if (!nombre_curso || !id_idioma || !id_profesor) {
      return res.status(400).json({ 
        success: false, 
        message: "Nombre del curso, idioma y profesor son obligatorios" 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO cursos (nombre_curso, id_idioma, id_nivel, id_profesor, horario, cupo_maximo, id_aula) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_curso, 
        id_idioma, 
        id_nivel || null, 
        id_profesor, 
        horario || 'Horario por definir', 
        cupo_maximo || 30, 
        id_aula || null
      ]
    );

    res.json({ 
      message: "Curso creado correctamente", 
      success: true,
      id_curso: result.insertId
    });
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error al crear curso" 
    });
  }
});

// Eliminar curso
router.delete("/:id", async (req, res) => {
  try {
    const id_curso = req.params.id;

    // Verificar si tiene inscripciones activas
    const [inscripciones] = await pool.query(
      'SELECT COUNT(*) as total FROM inscripciones WHERE id_curso = ? AND estado = "activo"',
      [id_curso]
    );

    if (inscripciones[0].total > 0) {
      return res.status(400).json({ 
        success: false,
        message: `No se puede eliminar: el curso tiene ${inscripciones[0].total} inscripción/es activa(s)` 
      });
    }

    // Eliminar registros relacionados
    await pool.query('DELETE FROM calificaciones WHERE id_curso = ?', [id_curso]);
    await pool.query('DELETE FROM asistencias WHERE id_curso = ?', [id_curso]);
    await pool.query('DELETE FROM inscripciones WHERE id_curso = ?', [id_curso]);
    
    // Eliminar curso
    const [result] = await pool.query('DELETE FROM cursos WHERE id_curso = ?', [id_curso]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Curso no encontrado" 
      });
    }

    res.json({ 
      message: "Curso eliminado correctamente", 
      success: true 
    });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error al eliminar curso" 
    });
  }
});

export default router;
