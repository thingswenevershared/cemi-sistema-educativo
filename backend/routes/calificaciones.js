// backend/routes/calificaciones.js
import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

// Guardar todas las calificaciones de un alumno en un curso
router.post("/todas", async (req, res) => {
  try {
    const { id_alumno, id_curso, parcial1, parcial2, final } = req.body;

    // Verificar si ya existen calificaciones para este alumno y curso
    const [existing] = await pool.query(
      "SELECT id_calificacion FROM calificaciones WHERE id_alumno = ? AND id_curso = ?",
      [id_alumno, id_curso]
    );

    if (existing.length > 0) {
      // Actualizar calificaciones existentes
      await pool.query(
        `UPDATE calificaciones 
         SET parcial1 = ?, parcial2 = ?, final = ?, 
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_alumno = ? AND id_curso = ?`,
        [parcial1, parcial2, final, id_alumno, id_curso]
      );
    } else {
      // Insertar nuevas calificaciones
      await pool.query(
        `INSERT INTO calificaciones 
         (id_alumno, id_curso, parcial1, parcial2, final) 
         VALUES (?, ?, ?, ?, ?)`,
        [id_alumno, id_curso, parcial1, parcial2, final]
      );
    }

    res.json({ success: true, message: "Calificaciones guardadas correctamente" });
  } catch (error) {
    console.error("Error al guardar calificaciones:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al guardar las calificaciones",
      error: error.message 
    });
  }
});

// Obtener calificaciones por profesor
router.get("/", async (req, res) => {
  try {
    const { id_profesor } = req.query;
    const query = `
      SELECT 
        c.id_calificacion,
        a.id_alumno,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_alumno,
        c.parcial1,
        c.parcial2,
        c.final,
        cur.id_curso,
        cur.nombre_curso
      FROM calificaciones c
      INNER JOIN alumnos a ON c.id_alumno = a.id_alumno
      INNER JOIN personas p ON a.id_persona = p.id_persona
      INNER JOIN cursos cur ON c.id_curso = cur.id_curso
      WHERE cur.id_profesor = ?
    `;
    
    const [rows] = await pool.query(query, [id_profesor]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ message: "Error al obtener calificaciones" });
  }
});

// Obtener calificaciones por curso
router.get("/curso/:id_curso", async (req, res) => {
  try {
    const { id_curso } = req.params;
    const query = `
      SELECT DISTINCT
        a.id_alumno,
        p.nombre,
        p.apellido,
        cal.parcial1,
        cal.parcial2,
        cal.final
      FROM inscripciones i
      INNER JOIN alumnos a ON i.id_alumno = a.id_alumno
      INNER JOIN personas p ON a.id_persona = p.id_persona
      LEFT JOIN calificaciones cal ON (cal.id_alumno = a.id_alumno AND cal.id_curso = i.id_curso)
      WHERE i.id_curso = ? AND i.estado = 'activo'
      LEFT JOIN calificaciones c ON (c.id_alumno = a.id_alumno AND c.id_curso = i.id_curso)
      WHERE i.id_curso = ? AND i.estado = 'activo'
    `;
    
    const [rows] = await pool.query(query, [id_curso]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener alumnos del curso:", error);
    res.status(500).json({ message: "Error al obtener alumnos del curso" });
  }
});

// Guardar una calificación individual
router.post("/", async (req, res) => {
  try {
    const { id_alumno, id_curso, tipo, valor } = req.body;
    
    // Validar tipo de calificación
    if (!['parcial1', 'parcial2', 'final'].includes(tipo)) {
      return res.status(400).json({ 
        message: "Tipo de calificación inválido. Debe ser parcial1, parcial2 o final" 
      });
    }

    // Validar que el alumno esté inscrito en el curso
    const [inscripcion] = await pool.query(
      "SELECT id_inscripcion FROM inscripciones WHERE id_alumno = ? AND id_curso = ? AND estado = 'activo'",
      [id_alumno, id_curso]
    );

    if (inscripcion.length === 0) {
      return res.status(400).json({ 
        message: "El alumno no está inscrito en este curso o su inscripción no está activa" 
      });
    }

    // Validar calificación
    if (valor && (valor < 0 || valor > 10)) {
      return res.status(400).json({ 
        message: "La calificación debe estar entre 0 y 10" 
      });
    }

    // Verificar si ya existe una calificación para este alumno y curso
    const [existing] = await pool.query(
      "SELECT id_calificacion FROM calificaciones WHERE id_alumno = ? AND id_curso = ?",
      [id_alumno, id_curso]
    );

    let query;
    let params;

    if (existing.length > 0) {
      // Actualizar calificación existente
      query = `UPDATE calificaciones SET ${tipo} = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_alumno = ? AND id_curso = ?`;
      params = [valor, id_alumno, id_curso];
    } else {
      // Insertar nueva calificación
      query = `INSERT INTO calificaciones (id_alumno, id_curso, ${tipo}) VALUES (?, ?, ?)`;
      params = [id_alumno, id_curso, valor];
    }

    await pool.query(query, params);
    res.json({ message: "Calificación guardada exitosamente" });
  } catch (error) {
    console.error("Error al guardar calificación:", error);
    res.status(500).json({ message: "Error al guardar calificación" });
  }
});

// Guardar todas las calificaciones de un alumno
router.post("/todas", async (req, res) => {
  try {
    const { id_alumno, id_curso, parcial1, parcial2, final } = req.body;
    
    // Validar que el alumno esté inscrito en el curso
    const [inscripcion] = await pool.query(
      "SELECT id_inscripcion FROM inscripciones WHERE id_alumno = ? AND id_curso = ? AND estado = 'activo'",
      [id_alumno, id_curso]
    );

    if (inscripcion.length === 0) {
      return res.status(400).json({ 
        message: "El alumno no está inscrito en este curso o su inscripción no está activa" 
      });
    }

    // Validar calificaciones
    if (parcial1 && (parcial1 < 0 || parcial1 > 10)) {
      return res.status(400).json({ message: "La calificación del Parcial 1 debe estar entre 0 y 10" });
    }
    if (parcial2 && (parcial2 < 0 || parcial2 > 10)) {
      return res.status(400).json({ message: "La calificación del Parcial 2 debe estar entre 0 y 10" });
    }
    if (final && (final < 0 || final > 10)) {
      return res.status(400).json({ message: "La calificación Final debe estar entre 0 y 10" });
    }

    // Verificar si ya existe una calificación para este alumno y curso
    const [existing] = await pool.query(
      "SELECT id_calificacion FROM calificaciones WHERE id_alumno = ? AND id_curso = ?",
      [id_alumno, id_curso]
    );

    let query;
    let params;

    if (existing.length > 0) {
      // Actualizar calificaciones existentes
      query = `
        UPDATE calificaciones 
        SET parcial1 = ?, parcial2 = ?, final = ?, 
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_alumno = ? AND id_curso = ?
      `;
      params = [parcial1, parcial2, final, id_alumno, id_curso];
    } else {
      // Insertar nuevas calificaciones
      query = `
        INSERT INTO calificaciones (id_alumno, id_curso, parcial1, parcial2, final) 
        VALUES (?, ?, ?, ?, ?)
      `;
      params = [id_alumno, id_curso, parcial1, parcial2, final];
    }

    await pool.query(query, params);
    res.json({ message: "Calificaciones guardadas exitosamente" });
  } catch (error) {
    console.error("Error al guardar calificaciones:", error);
    res.status(500).json({ message: "Error al guardar calificaciones" });
  }
});

export default router;