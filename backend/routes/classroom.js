// backend/routes/classroom.js
import express from "express";
import pool from "../utils/db.js";
import upload from "../config/multer.js";

const router = express.Router();

// =====================================================
// OBTENER CLASES DEL USUARIO
// =====================================================
router.get("/clases/:tipo/:id", async (req, res) => {
  try {
    const { tipo, id } = req.params; // tipo: 'profesor' o 'alumno'
    
    let query;
    let params;

    if (tipo === 'profesor') {
      // Obtener cursos que dicta el profesor
      query = `
        SELECT 
          c.id_curso,
          c.nombre_curso,
          i.nombre_idioma,
          n.descripcion AS nivel,
          c.horario,
          a.nombre_aula,
          c.cupo_maximo,
          (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS total_alumnos,
          CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre
        FROM cursos c
        INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
        LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
        LEFT JOIN aulas a ON c.id_aula = a.id_aula
        LEFT JOIN profesores prof ON c.id_profesor = prof.id_profesor
        LEFT JOIN personas p ON prof.id_persona = p.id_persona
        WHERE c.id_profesor = ?
        ORDER BY c.nombre_curso
      `;
      params = [id];
    } else if (tipo === 'alumno') {
      // Obtener cursos en los que está inscrito el alumno
      query = `
        SELECT 
          c.id_curso,
          c.nombre_curso,
          i.nombre_idioma,
          n.descripcion AS nivel,
          c.horario,
          a.nombre_aula,
          c.cupo_maximo,
          (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS total_alumnos,
          CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
          ins.fecha_inscripcion,
          ins.estado AS estado_inscripcion
        FROM inscripciones ins
        INNER JOIN cursos c ON ins.id_curso = c.id_curso
        INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
        LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
        LEFT JOIN aulas a ON c.id_aula = a.id_aula
        LEFT JOIN profesores prof ON c.id_profesor = prof.id_profesor
        LEFT JOIN personas p ON prof.id_persona = p.id_persona
        WHERE ins.id_alumno = ? AND ins.estado = 'activo'
        ORDER BY c.nombre_curso
      `;
      params = [id];
    } else {
      return res.status(400).json({ message: "Tipo de usuario inválido" });
    }

    const [clases] = await pool.query(query, params);
    res.json(clases);
  } catch (error) {
    console.error("Error al obtener clases:", error);
    res.status(500).json({ message: "Error al obtener clases" });
  }
});

// =====================================================
// OBTENER ACTIVIDAD RECIENTE (FEED)
// =====================================================
router.get("/feed/:tipo/:id", async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const feed = [];

    // Por ahora retornamos datos de ejemplo
    // Más adelante se pueden crear tablas específicas para anuncios y tareas

    if (tipo === 'profesor') {
      // Feed para profesores: sus propios anuncios y tareas
      const [cursos] = await pool.query(
        'SELECT id_curso, nombre_curso FROM cursos WHERE id_profesor = ?',
        [id]
      );

      res.json({
        cursos,
        message: "Feed en construcción - Conectar con tabla de anuncios/tareas"
      });
    } else if (tipo === 'alumno') {
      // Feed para alumnos: anuncios y tareas de sus cursos
      const [cursos] = await pool.query(`
        SELECT c.id_curso, c.nombre_curso 
        FROM inscripciones ins
        INNER JOIN cursos c ON ins.id_curso = c.id_curso
        WHERE ins.id_alumno = ? AND ins.estado = 'activo'
      `, [id]);

      res.json({
        cursos,
        message: "Feed en construcción - Conectar con tabla de anuncios/tareas"
      });
    }
  } catch (error) {
    console.error("Error al obtener feed:", error);
    res.status(500).json({ message: "Error al obtener feed" });
  }
});

// =====================================================
// OBTENER TAREAS DEL USUARIO
// =====================================================
router.get("/tareas/:tipo/:id", async (req, res) => {
  try {
    const { tipo, id } = req.params;
    
    // Por ahora usamos las calificaciones como "tareas"
    // Más adelante se puede crear una tabla específica de tareas
    
    if (tipo === 'alumno') {
      const [tareas] = await pool.query(`
        SELECT 
          c.id_curso,
          c.nombre_curso,
          i.nombre_idioma,
          cal.parcial1,
          cal.parcial2,
          cal.final,
          CASE 
            WHEN cal.parcial1 IS NULL THEN 'pendiente'
            WHEN cal.parcial2 IS NULL THEN 'pendiente'
            WHEN cal.final IS NULL THEN 'pendiente'
            ELSE 'completada'
          END as estado
        FROM inscripciones ins
        INNER JOIN cursos c ON ins.id_curso = c.id_curso
        INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
        LEFT JOIN calificaciones cal ON (cal.id_alumno = ins.id_alumno AND cal.id_curso = c.id_curso)
        WHERE ins.id_alumno = ? AND ins.estado = 'activo'
        ORDER BY c.nombre_curso
      `, [id]);
      
      res.json(tareas);
    } else if (tipo === 'profesor') {
      // Para profesores: todas las evaluaciones pendientes de calificar
      const [tareas] = await pool.query(`
        SELECT 
          c.id_curso,
          c.nombre_curso,
          COUNT(DISTINCT ins.id_alumno) as total_alumnos,
          SUM(CASE WHEN cal.parcial1 IS NULL THEN 1 ELSE 0 END) as pendientes_p1,
          SUM(CASE WHEN cal.parcial2 IS NULL THEN 1 ELSE 0 END) as pendientes_p2,
          SUM(CASE WHEN cal.final IS NULL THEN 1 ELSE 0 END) as pendientes_final
        FROM cursos c
        INNER JOIN inscripciones ins ON c.id_curso = ins.id_curso
        LEFT JOIN calificaciones cal ON (cal.id_alumno = ins.id_alumno AND cal.id_curso = c.id_curso)
        WHERE c.id_profesor = ? AND ins.estado = 'activo'
        GROUP BY c.id_curso, c.nombre_curso
        ORDER BY c.nombre_curso
      `, [id]);
      
      res.json(tareas);
    }
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ message: "Error al obtener tareas" });
  }
});

// =====================================================
// OBTENER CALIFICACIONES DEL ALUMNO
// =====================================================
router.get("/calificaciones/alumno/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [calificaciones] = await pool.query(`
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma,
        n.descripcion AS nivel,
        cal.parcial1,
        cal.parcial2,
        cal.final,
        ROUND((COALESCE(cal.parcial1, 0) + COALESCE(cal.parcial2, 0) + COALESCE(cal.final, 0)) / 
              (CASE WHEN cal.parcial1 IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN cal.parcial2 IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN cal.final IS NOT NULL THEN 1 ELSE 0 END), 2) AS promedio,
        cal.fecha_actualizacion
      FROM inscripciones ins
      INNER JOIN cursos c ON ins.id_curso = c.id_curso
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      LEFT JOIN calificaciones cal ON (cal.id_alumno = ins.id_alumno AND cal.id_curso = c.id_curso)
      WHERE ins.id_alumno = ? AND ins.estado = 'activo'
      ORDER BY c.nombre_curso
    `, [id]);

    // Calcular estadísticas
    const promedios = calificaciones.filter(c => c.promedio > 0).map(c => parseFloat(c.promedio));
    const promedioGeneral = promedios.length > 0 
      ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)
      : 0;
    
    const totalCalificaciones = calificaciones.reduce((sum, c) => {
      return sum + (c.parcial1 ? 1 : 0) + (c.parcial2 ? 1 : 0) + (c.final ? 1 : 0);
    }, 0);
    
    const maxPosibles = calificaciones.length * 3;
    const mejorNota = Math.max(...calificaciones.flatMap(c => 
      [c.parcial1, c.parcial2, c.final].filter(n => n !== null)
    ), 0);

    res.json({
      calificaciones,
      estadisticas: {
        promedio_general: promedioGeneral,
        tareas_completadas: totalCalificaciones,
        tareas_totales: maxPosibles,
        mejor_nota: mejorNota
      }
    });
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ message: "Error al obtener calificaciones" });
  }
});

// =====================================================
// OBTENER ALUMNOS DE UN CURSO (PROFESOR)
// =====================================================
router.get("/curso/:id/alumnos", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [alumnos] = await pool.query(`
      SELECT 
        a.id_alumno,
        CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo,
        p.mail,
        p.dni,
        a.legajo,
        ins.fecha_inscripcion,
        ins.estado,
        cal.parcial1,
        cal.parcial2,
        cal.final,
        ROUND((COALESCE(cal.parcial1, 0) + COALESCE(cal.parcial2, 0) + COALESCE(cal.final, 0)) / 
              (CASE WHEN cal.parcial1 IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN cal.parcial2 IS NOT NULL THEN 1 ELSE 0 END + 
               CASE WHEN cal.final IS NOT NULL THEN 1 ELSE 0 END), 2) AS promedio
      FROM inscripciones ins
      INNER JOIN alumnos a ON ins.id_alumno = a.id_alumno
      INNER JOIN personas p ON a.id_persona = p.id_persona
      LEFT JOIN calificaciones cal ON (cal.id_alumno = a.id_alumno AND cal.id_curso = ins.id_curso)
      WHERE ins.id_curso = ? AND ins.estado = 'activo'
      ORDER BY p.apellido, p.nombre
    `, [id]);
    
    res.json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    res.status(500).json({ message: "Error al obtener alumnos" });
  }
});

// =====================================================
// ESTADÍSTICAS DEL PROFESOR
// =====================================================
router.get("/estadisticas/profesor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Total de cursos
    const [cursosRows] = await pool.query(
      'SELECT COUNT(*) as total FROM cursos WHERE id_profesor = ?',
      [id]
    );
    
    // Total de alumnos
    const [alumnosRows] = await pool.query(`
      SELECT COUNT(DISTINCT ins.id_alumno) as total
      FROM inscripciones ins
      INNER JOIN cursos c ON ins.id_curso = c.id_curso
      WHERE c.id_profesor = ? AND ins.estado = 'activo'
    `, [id]);
    
    // Promedio general
    const [promedioRows] = await pool.query(`
      SELECT AVG(
        (COALESCE(cal.parcial1, 0) + COALESCE(cal.parcial2, 0) + COALESCE(cal.final, 0)) / 
        (CASE WHEN cal.parcial1 IS NOT NULL THEN 1 ELSE 0 END + 
         CASE WHEN cal.parcial2 IS NOT NULL THEN 1 ELSE 0 END + 
         CASE WHEN cal.final IS NOT NULL THEN 1 ELSE 0 END)
      ) as promedio
      FROM calificaciones cal
      INNER JOIN cursos c ON cal.id_curso = c.id_curso
      WHERE c.id_profesor = ?
      AND (cal.parcial1 IS NOT NULL OR cal.parcial2 IS NOT NULL OR cal.final IS NOT NULL)
    `, [id]);
    
    res.json({
      total_cursos: cursosRows[0].total,
      total_alumnos: alumnosRows[0].total,
      promedio_general: promedioRows[0].promedio ? parseFloat(promedioRows[0].promedio).toFixed(2) : 0
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
});

// =====================================================
// CREAR ANUNCIO
// =====================================================
router.post("/anuncios", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id_curso, id_profesor, titulo, contenido, link_url, importante, notificar, poll } = req.body;

    if (!id_curso || !id_profesor || !titulo || !contenido) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    // Crear el anuncio
    const [result] = await connection.query(
      "INSERT INTO anuncios (id_curso, id_profesor, titulo, contenido, link_url, importante, notificar) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id_curso, id_profesor, titulo, contenido, link_url, importante || false, notificar !== false]
    );

    const idAnuncio = result.insertId;

    // Si hay encuesta, crearla
    if (poll && poll.question && poll.options && poll.options.length >= 2) {
      const [pollResult] = await connection.query(
        "INSERT INTO encuestas (id_anuncio, pregunta) VALUES (?, ?)",
        [idAnuncio, poll.question]
      );

      const idEncuesta = pollResult.insertId;

      // Insertar opciones de la encuesta
      for (const option of poll.options) {
        await connection.query(
          "INSERT INTO opciones_encuesta (id_encuesta, texto) VALUES (?, ?)",
          [idEncuesta, option]
        );
      }
    }

    await connection.commit();

    // Crear notificaciones para los alumnos del curso si notificar es true
    if (notificar !== false) {
      const [cursoInfo] = await pool.query(
        `SELECT c.nombre_curso FROM cursos c WHERE c.id_curso = ?`,
        [id_curso]
      );

      const [alumnos] = await pool.query(
        `SELECT i.id_alumno 
         FROM inscripciones i 
         WHERE i.id_curso = ? AND i.estado = 'activo'`,
        [id_curso]
      );

      if (cursoInfo.length > 0 && alumnos.length > 0) {
        const nombreCurso = cursoInfo[0].nombre_curso;
        const tipoNotif = importante ? 'anuncio_importante' : 'anuncio';
        const tituloNotif = importante ? '⚠️ Anuncio Importante' : 'Nuevo anuncio';
        
        for (const alumno of alumnos) {
          await pool.query(
            `INSERT INTO notificaciones 
             (id_usuario, tipo_usuario, tipo_notificacion, titulo, mensaje, link, id_referencia) 
             VALUES (?, 'alumno', ?, ?, ?, ?, ?)`,
            [
              alumno.id_alumno,
              tipoNotif,
              tituloNotif,
              `${titulo} - ${nombreCurso}`,
              `/anuncios/${idAnuncio}`,
              idAnuncio
            ]
          );
        }
      }
    }

    res.json({ 
      success: true, 
      message: "Anuncio creado exitosamente",
      id_anuncio: idAnuncio 
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear anuncio:", error);
    res.status(500).json({ message: "Error al crear anuncio" });
  } finally {
    connection.release();
  }
});

// =====================================================
// OBTENER ANUNCIOS POR CURSO (debe ir antes de /anuncios/:tipo/:id)
// =====================================================
router.get("/anuncios/curso/:idCurso", async (req, res) => {
  try {
    const { idCurso } = req.params;
    
    console.log(`📢 GET /anuncios/curso/${idCurso}`);
    
    const query = `
      SELECT 
        a.id_anuncio,
        a.titulo,
        a.contenido,
        a.link_url,
        a.importante,
        a.fecha_creacion,
        c.nombre_curso,
        c.id_curso,
        prof.id_profesor,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
        p.avatar AS profesor_avatar
      FROM anuncios a
      INNER JOIN cursos c ON a.id_curso = c.id_curso
      INNER JOIN profesores prof ON a.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      WHERE a.id_curso = ?
      ORDER BY a.importante DESC, a.fecha_creacion DESC
    `;
    
    const [anuncios] = await pool.query(query, [idCurso]);
    console.log(`✅ ${anuncios.length} anuncios encontrados para curso ${idCurso}`);
    
    // Para cada anuncio, obtener la encuesta si existe y contador de comentarios
    for (let anuncio of anuncios) {
      // Obtener cantidad de comentarios
      const [countComentarios] = await pool.query(
        `SELECT COUNT(*) as total FROM comentarios_anuncios WHERE id_anuncio = ?`,
        [anuncio.id_anuncio]
      );
      anuncio.total_comentarios = countComentarios[0].total;
      
      const [encuestas] = await pool.query(
        `SELECT e.id_encuesta, e.pregunta,
          (SELECT COUNT(*) FROM votos_encuesta WHERE id_encuesta = e.id_encuesta) as total_votos
         FROM encuestas e
         WHERE e.id_anuncio = ?`,
        [anuncio.id_anuncio]
      );
      
      if (encuestas.length > 0) {
        const encuesta = encuestas[0];
        
        // Obtener opciones de la encuesta
        const [opciones] = await pool.query(
          `SELECT o.id_opcion, o.texto, o.votos,
            (SELECT COUNT(*) FROM votos_encuesta WHERE id_opcion = o.id_opcion) as votos_reales
           FROM opciones_encuesta o
           WHERE o.id_encuesta = ?
           ORDER BY o.id_opcion`,
          [encuesta.id_encuesta]
        );
        
        encuesta.opciones = opciones;
        anuncio.encuesta = encuesta;
        
        // Nota: No podemos verificar si ya votó aquí porque no tenemos el id_alumno
        // Eso se manejará en el frontend si es necesario
        anuncio.encuesta.ya_voto = false;
        anuncio.encuesta.id_opcion_votada = null;
      }
    }
    
    // Devolver array directamente para consistencia
    res.json(anuncios);
  } catch (error) {
    console.error("❌ Error al obtener anuncios del curso:", error);
    // Devolver array vacío en caso de error para evitar problemas en frontend
    res.status(500).json([]);
  }
});

// =====================================================
// OBTENER ANUNCIOS (por profesor o por alumno)
// =====================================================
router.get("/anuncios/:tipo/:id", async (req, res) => {
  try {
    const { tipo, id } = req.params;
    
    let query;
    let params;

    if (tipo === 'profesor') {
      // Obtener anuncios del profesor en sus cursos
      query = `
        SELECT 
          a.id_anuncio,
          a.titulo,
          a.contenido,
          a.link_url,
          a.importante,
          a.fecha_creacion,
          c.nombre_curso,
          c.id_curso,
          prof.id_profesor,
          CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
          p.avatar AS profesor_avatar
        FROM anuncios a
        INNER JOIN cursos c ON a.id_curso = c.id_curso
        INNER JOIN profesores prof ON a.id_profesor = prof.id_profesor
        INNER JOIN personas p ON prof.id_persona = p.id_persona
        WHERE a.id_profesor = ?
        ORDER BY a.importante DESC, a.fecha_creacion DESC
      `;
      params = [id];
    } else if (tipo === 'alumno') {
      // Obtener anuncios de los cursos en los que está inscrito
      query = `
        SELECT DISTINCT
          a.id_anuncio,
          a.titulo,
          a.contenido,
          a.link_url,
          a.importante,
          a.fecha_creacion,
          c.nombre_curso,
          c.id_curso,
          prof.id_profesor,
          CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
          p.avatar AS profesor_avatar
        FROM anuncios a
        INNER JOIN cursos c ON a.id_curso = c.id_curso
        INNER JOIN inscripciones ins ON c.id_curso = ins.id_curso
        INNER JOIN profesores prof ON a.id_profesor = prof.id_profesor
        INNER JOIN personas p ON prof.id_persona = p.id_persona
        WHERE ins.id_alumno = ? AND ins.estado = 'activo'
        ORDER BY a.importante DESC, a.fecha_creacion DESC
      `;
      params = [id];
    } else {
      return res.status(400).json({ message: "Tipo de usuario inválido" });
    }

    const [anuncios] = await pool.query(query, params);
    
    // Para cada anuncio, obtener la encuesta si existe y contador de comentarios
    for (let anuncio of anuncios) {
      // Obtener cantidad de comentarios
      const [countComentarios] = await pool.query(
        `SELECT COUNT(*) as total FROM comentarios_anuncios WHERE id_anuncio = ?`,
        [anuncio.id_anuncio]
      );
      anuncio.total_comentarios = countComentarios[0].total;
      
      const [encuestas] = await pool.query(
        `SELECT e.id_encuesta, e.pregunta,
          (SELECT COUNT(*) FROM votos_encuesta WHERE id_encuesta = e.id_encuesta) as total_votos
         FROM encuestas e
         WHERE e.id_anuncio = ?`,
        [anuncio.id_anuncio]
      );
      
      if (encuestas.length > 0) {
        const encuesta = encuestas[0];
        
        // Obtener opciones de la encuesta
        const [opciones] = await pool.query(
          `SELECT o.id_opcion, o.texto, o.votos,
            (SELECT COUNT(*) FROM votos_encuesta WHERE id_opcion = o.id_opcion) as votos_reales
           FROM opciones_encuesta o
           WHERE o.id_encuesta = ?
           ORDER BY o.id_opcion`,
          [encuesta.id_encuesta]
        );
        
        encuesta.opciones = opciones;
        anuncio.encuesta = encuesta;
        
        // Si es alumno, verificar si ya votó
        if (tipo === 'alumno') {
          const [yaVoto] = await pool.query(
            `SELECT id_voto, id_opcion FROM votos_encuesta WHERE id_encuesta = ? AND id_alumno = ?`,
            [encuesta.id_encuesta, id]
          );
          anuncio.encuesta.ya_voto = yaVoto.length > 0;
          anuncio.encuesta.id_opcion_votada = yaVoto.length > 0 ? yaVoto[0].id_opcion : null;
        }
      }
    }
    
    res.json(anuncios);
  } catch (error) {
    console.error("Error al obtener anuncios:", error);
    res.status(500).json({ message: "Error al obtener anuncios" });
  }
});

// =====================================================
// OBTENER ANUNCIO ESPECÍFICO POR ID
// =====================================================
router.get("/anuncio/:idAnuncio/:userId", async (req, res) => {
  try {
    const { idAnuncio, userId } = req.params;
    
    // Obtener datos del anuncio
    const [anuncios] = await pool.query(`
      SELECT 
        a.id_anuncio,
        a.titulo,
        a.contenido,
        a.link_url,
        a.importante,
        a.fecha_creacion,
        c.nombre_curso,
        c.id_curso,
        prof.id_profesor,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
        p.avatar AS profesor_avatar
      FROM anuncios a
      INNER JOIN cursos c ON a.id_curso = c.id_curso
      INNER JOIN profesores prof ON a.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      WHERE a.id_anuncio = ?
    `, [idAnuncio]);
    
    if (anuncios.length === 0) {
      return res.status(404).json({ message: "Anuncio no encontrado" });
    }
    
    const anuncio = anuncios[0];
    
    // Obtener cantidad de comentarios
    const [countComentarios] = await pool.query(
      `SELECT COUNT(*) as total FROM comentarios_anuncios WHERE id_anuncio = ?`,
      [idAnuncio]
    );
    anuncio.total_comentarios = countComentarios[0].total;
    
    // Obtener encuesta si existe
    const [encuestas] = await pool.query(
      `SELECT e.id_encuesta, e.pregunta,
        (SELECT COUNT(*) FROM votos_encuesta WHERE id_encuesta = e.id_encuesta) as total_votos
       FROM encuestas e
       WHERE e.id_anuncio = ?`,
      [idAnuncio]
    );
    
    if (encuestas.length > 0) {
      const encuesta = encuestas[0];
      
      // Obtener opciones de la encuesta
      const [opciones] = await pool.query(
        `SELECT o.id_opcion, o.texto, o.votos,
          (SELECT COUNT(*) FROM votos_encuesta WHERE id_opcion = o.id_opcion) as votos_reales
         FROM opciones_encuesta o
         WHERE o.id_encuesta = ?
         ORDER BY o.id_opcion`,
        [encuesta.id_encuesta]
      );
      
      encuesta.opciones = opciones;
      anuncio.encuesta = encuesta;
      
      // Verificar si el usuario ya votó (userId siempre viene del parámetro)
      const [yaVoto] = await pool.query(
        `SELECT id_voto, id_opcion FROM votos_encuesta WHERE id_encuesta = ? AND id_alumno = ?`,
        [encuesta.id_encuesta, userId]
      );
      anuncio.encuesta.ya_voto = yaVoto.length > 0;
      anuncio.encuesta.id_opcion_votada = yaVoto.length > 0 ? yaVoto[0].id_opcion : null;
    }
    
    res.json(anuncio);
  } catch (error) {
    console.error("Error al obtener anuncio:", error);
    res.status(500).json({ message: "Error al obtener anuncio" });
  }
});

// =====================================================
// OBTENER TAREAS POR CURSO
// =====================================================
router.get("/tareas/curso/:idCurso/:tipo/:idUsuario", async (req, res) => {
  try {
    const { idCurso, tipo, idUsuario } = req.params;
    
    let query;
    let params;
    
    if (tipo === 'profesor') {
      // Obtener tareas del curso para el profesor
      query = `
        SELECT 
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.requerimientos,
          t.link_url,
          t.archivo_adjunto,
          t.fecha_creacion,
          t.fecha_limite,
          t.puntos,
          t.notificar,
          c.nombre_curso,
          c.id_curso,
          (SELECT COUNT(*) FROM entregas_tareas WHERE id_tarea = t.id_tarea) AS total_entregas,
          (SELECT COUNT(*) FROM inscripciones WHERE id_curso = t.id_curso AND estado = 'activo') AS total_alumnos
        FROM tareas t
        INNER JOIN cursos c ON t.id_curso = c.id_curso
        WHERE t.id_curso = ? AND t.id_profesor = ?
        ORDER BY t.fecha_limite DESC
      `;
      params = [idCurso, idUsuario];
    } else {
      // Obtener tareas del curso para el alumno
      query = `
        SELECT 
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.requerimientos,
          t.link_url,
          t.archivo_adjunto,
          t.fecha_creacion,
          t.fecha_limite,
          t.puntos,
          c.nombre_curso,
          c.id_curso,
          CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
          et.id_entrega,
          et.fecha_entrega,
          et.calificacion,
          CASE 
            WHEN et.id_entrega IS NOT NULL THEN 'entregada'
            WHEN t.fecha_limite < NOW() THEN 'vencida'
            ELSE 'pendiente'
          END AS estado
        FROM tareas t
        INNER JOIN cursos c ON t.id_curso = c.id_curso
        INNER JOIN inscripciones ins ON c.id_curso = ins.id_curso
        INNER JOIN profesores prof ON t.id_profesor = prof.id_profesor
        INNER JOIN personas p ON prof.id_persona = p.id_persona
        LEFT JOIN entregas_tareas et ON t.id_tarea = et.id_tarea AND et.id_alumno = ?
        WHERE t.id_curso = ? AND ins.id_alumno = ? AND ins.estado = 'activo'
        ORDER BY t.fecha_limite DESC
      `;
      params = [idUsuario, idCurso, idUsuario];
    }
    
    const [tareas] = await pool.query(query, params);
    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas del curso:", error);
    res.status(500).json({ message: "Error al obtener tareas" });
  }
});

// =====================================================
// OBTENER ALUMNOS DE UN CURSO
// =====================================================
router.get("/curso/:idCurso/alumnos", async (req, res) => {
  try {
    const { idCurso } = req.params;
    
    const query = `
      SELECT 
        a.id_alumno,
        CONCAT(p.nombre, ' ', p.apellido) as nombre,
        p.email,
        p.telefono,
        p.avatar,
        ins.fecha_inscripcion,
        ins.estado
      FROM inscripciones ins
      INNER JOIN alumnos a ON ins.id_alumno = a.id_alumno
      INNER JOIN personas p ON a.id_persona = p.id_persona
      WHERE ins.id_curso = ? AND ins.estado = 'activo'
      ORDER BY p.apellido, p.nombre
    `;
    
    const [alumnos] = await pool.query(query, [idCurso]);
    res.json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos del curso:", error);
    res.status(500).json({ message: "Error al obtener alumnos" });
  }
});

// =====================================================
// SUBIR ARCHIVO PARA TAREA
// =====================================================
router.post("/upload-archivo", upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se ha enviado ningún archivo" });
    }

    // Retornar solo la ruta relativa para que funcione en cualquier entorno
    const fileUrl = `/uploads/tareas/${req.file.filename}`;
    
    res.json({
      success: true,
      message: "Archivo subido exitosamente",
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    res.status(500).json({ message: error.message || "Error al subir archivo" });
  }
});

// =====================================================
// CREAR TAREA
// =====================================================
router.post("/tareas", async (req, res) => {
  try {
    const { id_curso, id_profesor, titulo, descripcion, requerimientos, fecha_limite, puntos, link_url, archivo_adjunto, notificar } = req.body;

    if (!id_curso || !id_profesor || !titulo || !descripcion || !fecha_limite) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    const [result] = await pool.query(
      "INSERT INTO tareas (id_curso, id_profesor, titulo, descripcion, requerimientos, fecha_limite, link_url, archivo_adjunto, puntos, notificar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id_curso, id_profesor, titulo, descripcion, requerimientos, fecha_limite, link_url, archivo_adjunto, puntos || 100, notificar || 1]
    );

    const idTarea = result.insertId;

    // Crear notificaciones para los alumnos del curso si notificar es true
    if (notificar !== false) {
      const [cursoInfo] = await pool.query(
        `SELECT c.nombre_curso FROM cursos c WHERE c.id_curso = ?`,
        [id_curso]
      );

      const [alumnos] = await pool.query(
        `SELECT i.id_alumno 
         FROM inscripciones i 
         WHERE i.id_curso = ? AND i.estado = 'activo'`,
        [id_curso]
      );

      if (cursoInfo.length > 0 && alumnos.length > 0) {
        const nombreCurso = cursoInfo[0].nombre_curso;
        
        for (const alumno of alumnos) {
          await pool.query(
            `INSERT INTO notificaciones 
             (id_usuario, tipo_usuario, tipo_notificacion, titulo, mensaje, link, id_referencia) 
             VALUES (?, 'alumno', 'nueva_tarea', ?, ?, ?, ?)`,
            [
              alumno.id_alumno,
              'Nueva tarea asignada',
              `${titulo} - ${nombreCurso}`,
              `/tareas/${idTarea}`,
              idTarea
            ]
          );
        }
      }
    }

    res.json({ 
      success: true, 
      message: "Tarea creada exitosamente",
      id_tarea: result.insertId 
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ message: "Error al crear tarea" });
  }
});

// Eliminar tarea
router.delete("/tareas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar las entregas asociadas (si la base de datos no tiene CASCADE)
    await pool.query("DELETE FROM entregas_tareas WHERE id_tarea = ?", [id]);

    // Luego eliminar la tarea
    await pool.query("DELETE FROM tareas WHERE id_tarea = ?", [id]);

    res.json({ 
      success: true, 
      message: "Tarea eliminada exitosamente" 
    });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
});

// =====================================================
// OBTENER TAREAS CREADAS (por profesor o asignadas a alumno)
// =====================================================
router.get("/tareas-lista/:tipo/:id", async (req, res) => {
  try {
    const { tipo, id } = req.params;
    
    let query;
    let params;

    if (tipo === 'profesor') {
      // Obtener tareas creadas por el profesor
      query = `
        SELECT 
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.requerimientos,
          t.link_url,
          t.archivo_adjunto,
          t.fecha_creacion,
          t.fecha_limite,
          t.puntos,
          t.notificar,
          c.nombre_curso,
          c.id_curso,
          (SELECT COUNT(*) FROM entregas_tareas WHERE id_tarea = t.id_tarea) AS total_entregas,
          (SELECT COUNT(*) FROM inscripciones WHERE id_curso = t.id_curso AND estado = 'activo') AS total_alumnos
        FROM tareas t
        INNER JOIN cursos c ON t.id_curso = c.id_curso
        WHERE t.id_profesor = ?
        ORDER BY t.fecha_limite DESC
      `;
      params = [id];
    } else if (tipo === 'alumno') {
      // Obtener tareas de los cursos del alumno
      query = `
        SELECT DISTINCT
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.requerimientos,
          t.link_url,
          t.archivo_adjunto,
          t.fecha_creacion,
          t.fecha_limite,
          t.puntos,
          c.nombre_curso,
          c.id_curso,
          CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
          et.id_entrega,
          et.fecha_entrega,
          et.calificacion,
          CASE 
            WHEN et.id_entrega IS NOT NULL THEN 'entregada'
            WHEN t.fecha_limite < NOW() THEN 'vencida'
            ELSE 'pendiente'
          END AS estado
        FROM tareas t
        INNER JOIN cursos c ON t.id_curso = c.id_curso
        INNER JOIN inscripciones ins ON c.id_curso = ins.id_curso
        INNER JOIN profesores prof ON t.id_profesor = prof.id_profesor
        INNER JOIN personas p ON prof.id_persona = p.id_persona
        LEFT JOIN entregas_tareas et ON t.id_tarea = et.id_tarea AND et.id_alumno = ?
        WHERE ins.id_alumno = ? AND ins.estado = 'activo'
        ORDER BY t.fecha_limite DESC
      `;
      params = [id, id];
    } else {
      return res.status(400).json({ message: "Tipo de usuario inválido" });
    }

    const [tareas] = await pool.query(query, params);
    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ message: "Error al obtener tareas" });
  }
});

// =====================================================
// VOTAR EN ENCUESTA
// =====================================================
router.post("/encuestas/votar", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id_encuesta, id_opcion, id_alumno } = req.body;

    if (!id_encuesta || !id_opcion || !id_alumno) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    // Verificar si ya votó
    const [yaVoto] = await connection.query(
      "SELECT id_voto, id_opcion FROM votos_encuesta WHERE id_encuesta = ? AND id_alumno = ?",
      [id_encuesta, id_alumno]
    );

    if (yaVoto.length > 0) {
      // Ya votó, cambiar el voto
      const opcionAnterior = yaVoto[0].id_opcion;
      
      if (opcionAnterior === id_opcion) {
        // Está votando la misma opción, no hacer nada
        await connection.commit();
        return res.json({ 
          success: true, 
          message: "Voto ya registrado"
        });
      }
      
      // Decrementar voto de la opción anterior
      await connection.query(
        "UPDATE opciones_encuesta SET votos = GREATEST(votos - 1, 0) WHERE id_opcion = ?",
        [opcionAnterior]
      );
      
      // Actualizar el voto a la nueva opción
      await connection.query(
        "UPDATE votos_encuesta SET id_opcion = ?, fecha_voto = NOW() WHERE id_encuesta = ? AND id_alumno = ?",
        [id_opcion, id_encuesta, id_alumno]
      );
      
      // Incrementar contador de la nueva opción
      await connection.query(
        "UPDATE opciones_encuesta SET votos = votos + 1 WHERE id_opcion = ?",
        [id_opcion]
      );
      
      await connection.commit();
      
      return res.json({ 
        success: true, 
        message: "Voto actualizado exitosamente",
        cambio: true
      });
    }

    // Primera vez que vota, registrar el voto
    await connection.query(
      "INSERT INTO votos_encuesta (id_encuesta, id_opcion, id_alumno) VALUES (?, ?, ?)",
      [id_encuesta, id_opcion, id_alumno]
    );

    // Incrementar contador de votos de la opción
    await connection.query(
      "UPDATE opciones_encuesta SET votos = votos + 1 WHERE id_opcion = ?",
      [id_opcion]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: "Voto registrado exitosamente",
      cambio: false
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al votar en encuesta:", error);
    res.status(500).json({ message: "Error al votar en encuesta" });
  } finally {
    connection.release();
  }
});

// =====================================================
// ENCUESTAS - OBTENER ENCUESTA ESPECÍFICA ACTUALIZADA
// =====================================================
router.get("/encuestas/:idEncuesta/:idAlumno", async (req, res) => {
  try {
    const { idEncuesta, idAlumno } = req.params;
    
    // Obtener datos de la encuesta
    const [encuesta] = await pool.query(
      "SELECT id_encuesta, pregunta FROM encuestas WHERE id_encuesta = ?",
      [idEncuesta]
    );
    
    if (encuesta.length === 0) {
      return res.status(404).json({ message: "Encuesta no encontrada" });
    }
    
    // Obtener opciones con sus votos
    const [opciones] = await pool.query(
      "SELECT id_opcion, texto, votos AS votos_reales FROM opciones_encuesta WHERE id_encuesta = ? ORDER BY id_opcion",
      [idEncuesta]
    );
    
    // Calcular total de votos
    const totalVotos = opciones.reduce((sum, op) => sum + op.votos_reales, 0);
    
    // Verificar si el alumno ya votó y cuál opción
    const [votoAlumno] = await pool.query(
      "SELECT id_opcion FROM votos_encuesta WHERE id_encuesta = ? AND id_alumno = ?",
      [idEncuesta, idAlumno]
    );
    
    const yaVoto = votoAlumno.length > 0;
    const idOpcionVotada = yaVoto ? votoAlumno[0].id_opcion : null;
    
    res.json({
      id_encuesta: encuesta[0].id_encuesta,
      pregunta: encuesta[0].pregunta,
      opciones: opciones,
      total_votos: totalVotos,
      ya_voto: yaVoto,
      id_opcion_votada: idOpcionVotada
    });
    
  } catch (error) {
    console.error("Error al obtener encuesta:", error);
    res.status(500).json({ message: "Error al obtener encuesta" });
  }
});

// =====================================================
// COMENTARIOS - OBTENER COMENTARIOS DE UN ANUNCIO
// =====================================================
router.get("/comentarios/:idAnuncio", async (req, res) => {
  try {
    const { idAnuncio } = req.params;
    
    const [comentarios] = await pool.query(`
      SELECT 
        c.id_comentario,
        c.contenido,
        c.fecha_creacion,
        c.tipo_usuario,
        c.id_usuario,
        CASE 
          WHEN c.tipo_usuario = 'profesor' THEN CONCAT(p_prof.nombre, ' ', p_prof.apellido)
          WHEN c.tipo_usuario = 'alumno' THEN CONCAT(p_alum.nombre, ' ', p_alum.apellido)
        END as nombre_usuario,
        CASE 
          WHEN c.tipo_usuario = 'profesor' THEN p_prof.avatar
          WHEN c.tipo_usuario = 'alumno' THEN p_alum.avatar
        END as avatar_usuario
      FROM comentarios_anuncios c
      LEFT JOIN profesores prof ON c.id_usuario = prof.id_profesor AND c.tipo_usuario = 'profesor'
      LEFT JOIN personas p_prof ON prof.id_persona = p_prof.id_persona
      LEFT JOIN alumnos alum ON c.id_usuario = alum.id_alumno AND c.tipo_usuario = 'alumno'
      LEFT JOIN personas p_alum ON alum.id_persona = p_alum.id_persona
      WHERE c.id_anuncio = ?
      ORDER BY c.fecha_creacion ASC
    `, [idAnuncio]);
    
    res.json(comentarios);
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    res.status(500).json({ message: "Error al obtener comentarios" });
  }
});

// =====================================================
// COMENTARIOS - CREAR COMENTARIO
// =====================================================
router.post("/comentarios", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id_anuncio, id_usuario, tipo_usuario, contenido } = req.body;
    
    if (!id_anuncio || !id_usuario || !tipo_usuario || !contenido) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }
    
    const [result] = await connection.query(
      `INSERT INTO comentarios_anuncios (id_anuncio, id_usuario, tipo_usuario, contenido) 
       VALUES (?, ?, ?, ?)`,
      [id_anuncio, id_usuario, tipo_usuario, contenido]
    );
    
    // Obtener el comentario recién creado con el nombre del usuario
    const [comentario] = await connection.query(`
      SELECT 
        c.id_comentario,
        c.contenido,
        c.fecha_creacion,
        c.tipo_usuario,
        CASE 
          WHEN c.tipo_usuario = 'profesor' THEN CONCAT(p_prof.nombre, ' ', p_prof.apellido)
          WHEN c.tipo_usuario = 'alumno' THEN CONCAT(p_alum.nombre, ' ', p_alum.apellido)
        END as nombre_usuario
      FROM comentarios_anuncios c
      LEFT JOIN profesores prof ON c.id_usuario = prof.id_profesor AND c.tipo_usuario = 'profesor'
      LEFT JOIN personas p_prof ON prof.id_persona = p_prof.id_persona
      LEFT JOIN alumnos alum ON c.id_usuario = alum.id_alumno AND c.tipo_usuario = 'alumno'
      LEFT JOIN personas p_alum ON alum.id_persona = p_alum.id_persona
      WHERE c.id_comentario = ?
    `, [result.insertId]);
    
    // Obtener información del anuncio para crear la notificación
    const [anuncioInfo] = await connection.query(`
      SELECT 
        a.titulo,
        a.id_profesor
      FROM anuncios a
      WHERE a.id_anuncio = ?
    `, [id_anuncio]);
    
    if (anuncioInfo.length > 0) {
      const anuncio = anuncioInfo[0];
      const nombreComentador = comentario[0].nombre_usuario;
      
      // Crear notificación para el profesor del anuncio (si el comentario es de un alumno)
      if (tipo_usuario === 'alumno') {
        await connection.query(`
          INSERT INTO notificaciones 
          (id_usuario, tipo_usuario, tipo_notificacion, titulo, mensaje, link, id_referencia)
          VALUES (?, 'profesor', 'comentario', ?, ?, ?, ?)
        `, [
          anuncio.id_profesor,
          'Nuevo comentario',
          `${nombreComentador} comentó en "${anuncio.titulo}"`,
          null,
          id_anuncio
        ]);
      }
      
      // Si el comentario es del profesor, notificar a todos los alumnos que hayan comentado antes
      if (tipo_usuario === 'profesor') {
        const [alumnosComentadores] = await connection.query(`
          SELECT DISTINCT c.id_usuario
          FROM comentarios_anuncios c
          WHERE c.id_anuncio = ? 
          AND c.tipo_usuario = 'alumno'
          AND c.id_usuario != ?
        `, [id_anuncio, id_usuario]);
        
        for (const alumno of alumnosComentadores) {
          await connection.query(`
            INSERT INTO notificaciones 
            (id_usuario, tipo_usuario, tipo_notificacion, titulo, mensaje, link, id_referencia)
            VALUES (?, 'alumno', 'comentario', ?, ?, ?, ?)
          `, [
            alumno.id_usuario,
            'Respuesta del profesor',
            `El profesor comentó en "${anuncio.titulo}"`,
            null,
            id_anuncio
          ]);
        }
      }
    }
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      comentario: comentario[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear comentario:", error);
    res.status(500).json({ message: "Error al crear comentario" });
  } finally {
    connection.release();
  }
});

// =====================================================
// CALENDARIO - OBTENER EVENTOS DEL MES
// =====================================================
router.get("/calendario/:tipo/:id/:year/:month", async (req, res) => {
  try {
    const { tipo, id, year, month } = req.params;
    
    // Calcular primer y último día del mes
    const primerDia = `${year}-${month.padStart(2, '0')}-01`;
    const ultimoDia = new Date(year, month, 0).getDate();
    const ultimaFecha = `${year}-${month.padStart(2, '0')}-${ultimoDia}`;
    
    let eventos = [];
    let tareas = [];
    
    if (tipo === 'profesor') {
      // Obtener eventos creados por el profesor
      const [eventosProfesor] = await pool.query(`
        SELECT 
          e.id_evento,
          e.titulo,
          e.descripcion,
          e.tipo,
          e.fecha_inicio,
          e.fecha_fin,
          e.color,
          e.id_curso,
          c.nombre_curso
        FROM eventos_calendario e
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        WHERE e.id_profesor = ? 
          AND DATE(e.fecha_inicio) BETWEEN ? AND ?
        ORDER BY e.fecha_inicio ASC
      `, [id, primerDia, ultimaFecha]);
      
      eventos = eventosProfesor;
      
      // Obtener tareas del mes
      const [tareasProfesor] = await pool.query(`
        SELECT 
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.fecha_limite,
          t.puntos,
          t.id_curso,
          c.nombre_curso,
          'tarea' as tipo,
          '#f59e0b' as color
        FROM tareas t
        INNER JOIN cursos c ON t.id_curso = c.id_curso
        WHERE t.id_profesor = ?
          AND DATE(t.fecha_limite) BETWEEN ? AND ?
        ORDER BY t.fecha_limite ASC
      `, [id, primerDia, ultimaFecha]);
      
      tareas = tareasProfesor;
      
    } else if (tipo === 'alumno') {
      // Obtener eventos de los cursos del alumno
      const [eventosAlumno] = await pool.query(`
        SELECT DISTINCT
          e.id_evento,
          e.titulo,
          e.descripcion,
          e.tipo,
          e.fecha_inicio,
          e.fecha_fin,
          e.color,
          e.id_curso,
          c.nombre_curso
        FROM eventos_calendario e
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        INNER JOIN inscripciones ins ON c.id_curso = ins.id_curso
        WHERE ins.id_alumno = ? 
          AND ins.estado = 'activo'
          AND DATE(e.fecha_inicio) BETWEEN ? AND ?
        ORDER BY e.fecha_inicio ASC
      `, [id, primerDia, ultimaFecha]);
      
      eventos = eventosAlumno;
      
      // Obtener tareas de los cursos del alumno
      const [tareasAlumno] = await pool.query(`
        SELECT DISTINCT
          t.id_tarea,
          t.titulo,
          t.descripcion,
          t.fecha_limite,
          t.puntos,
          t.id_curso,
          c.nombre_curso,
          'tarea' as tipo,
          CASE 
            WHEN et.id_entrega IS NOT NULL THEN '#10b981'
            WHEN t.fecha_limite < NOW() THEN '#ef4444'
            ELSE '#f59e0b'
          END as color,
          CASE 
            WHEN et.id_entrega IS NOT NULL THEN 'entregada'
            WHEN t.fecha_limite < NOW() THEN 'vencida'
            ELSE 'pendiente'
          END as estado
        FROM tareas t
        INNER JOIN cursos c ON t.id_curso = c.id_curso
        INNER JOIN inscripciones ins ON c.id_curso = ins.id_curso
        LEFT JOIN entregas_tareas et ON t.id_tarea = et.id_tarea AND et.id_alumno = ?
        WHERE ins.id_alumno = ?
          AND ins.estado = 'activo'
          AND DATE(t.fecha_limite) BETWEEN ? AND ?
        ORDER BY t.fecha_limite ASC
      `, [id, id, primerDia, ultimaFecha]);
      
      tareas = tareasAlumno;
    }
    
    // Combinar eventos y tareas
    const calendario = {
      eventos: eventos,
      tareas: tareas,
      mes: parseInt(month),
      año: parseInt(year)
    };
    
    res.json(calendario);
  } catch (error) {
    console.error("Error al obtener calendario:", error);
    res.status(500).json({ message: "Error al obtener calendario" });
  }
});

// =====================================================
// CALENDARIO - CREAR EVENTO
// =====================================================
router.post("/calendario/eventos", async (req, res) => {
  try {
    const { id_curso, id_profesor, titulo, descripcion, tipo, fecha_inicio, fecha_fin, color, notificar } = req.body;
    
    if (!id_curso || !id_profesor || !titulo || !fecha_inicio) {
      return res.status(400).json({ message: "Campos requeridos: curso, profesor, título, fecha_inicio" });
    }
    
    const [result] = await pool.query(
      `INSERT INTO eventos_calendario 
       (id_curso, id_profesor, titulo, descripcion, tipo, fecha_inicio, fecha_fin, color, notificar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_curso, id_profesor, titulo, descripcion, tipo, fecha_inicio, fecha_fin, color || '#667eea', notificar || 1]
    );
    
    res.json({
      success: true,
      message: "Evento creado exitosamente",
      id_evento: result.insertId
    });
  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ message: "Error al crear evento" });
  }
});

// =====================================================
// NOTAS PERSONALES DEL CALENDARIO
// =====================================================

// Obtener notas de un mes específico
router.get('/notas/:tipo/:id/:year/:month', async (req, res) => {
  try {
    const { tipo, id, year, month } = req.params;
    
    const primerDia = `${year}-${String(month).padStart(2, '0')}-01`;
    const ultimoDia = new Date(year, month, 0);
    const ultimoDiaStr = `${year}-${String(month).padStart(2, '0')}-${ultimoDia.getDate()}`;
    
    const [notas] = await pool.query(
      `SELECT * FROM notas_calendario 
       WHERE id_usuario = ? 
       AND tipo_usuario = ? 
       AND fecha BETWEEN ? AND ?
       ORDER BY fecha, fecha_creacion`,
      [id, tipo, primerDia, ultimoDiaStr]
    );
    
    res.json(notas);
  } catch (error) {
    console.error("Error al obtener notas:", error);
    res.status(500).json({ message: "Error al obtener notas" });
  }
});

// Crear nota
router.post('/notas', async (req, res) => {
  try {
    const { id_usuario, tipo_usuario, fecha, titulo, contenido, color } = req.body;
    
    if (!id_usuario || !tipo_usuario || !fecha) {
      return res.status(400).json({ message: "Campos requeridos: usuario, tipo, fecha" });
    }
    
    const [result] = await pool.query(
      `INSERT INTO notas_calendario (id_usuario, tipo_usuario, fecha, titulo, contenido, color) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, tipo_usuario, fecha, titulo, contenido, color || '#FFD700']
    );
    
    res.json({
      success: true,
      message: "Nota creada exitosamente",
      id_nota: result.insertId
    });
  } catch (error) {
    console.error("Error al crear nota:", error);
    res.status(500).json({ message: "Error al crear nota" });
  }
});

// Actualizar nota
router.put('/notas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, color } = req.body;
    
    await pool.query(
      `UPDATE notas_calendario 
       SET titulo = ?, contenido = ?, color = ? 
       WHERE id_nota = ?`,
      [titulo, contenido, color, id]
    );
    
    res.json({
      success: true,
      message: "Nota actualizada exitosamente"
    });
  } catch (error) {
    console.error("Error al actualizar nota:", error);
    res.status(500).json({ message: "Error al actualizar nota" });
  }
});

// Eliminar nota
router.delete('/notas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM notas_calendario WHERE id_nota = ?', [id]);
    
    res.json({
      success: true,
      message: "Nota eliminada exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar nota:", error);
    res.status(500).json({ message: "Error al eliminar nota" });
  }
});

// =====================================================
// ENTREGAS DE TAREAS
// =====================================================

// Entregar tarea (alumno)
router.post('/entregas', async (req, res) => {
  try {
    const { id_tarea, id_alumno, contenido, archivo_url } = req.body;

    if (!id_tarea || !id_alumno) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    // Insertar entrega
    const [result] = await pool.query(
      `INSERT INTO entregas_tareas (id_tarea, id_alumno, contenido, archivo_url) 
       VALUES (?, ?, ?, ?)`,
      [id_tarea, id_alumno, contenido, archivo_url]
    );

    // Obtener información para la notificación
    const [tareaInfo] = await pool.query(
      `SELECT t.titulo, t.id_profesor, t.id_curso, c.nombre_curso,
              CONCAT(p.nombre, ' ', p.apellido) AS alumno_nombre
       FROM tareas t
       INNER JOIN cursos c ON t.id_curso = c.id_curso
       INNER JOIN alumnos a ON a.id_alumno = ?
       INNER JOIN personas p ON a.id_persona = p.id_persona
       WHERE t.id_tarea = ?`,
      [id_alumno, id_tarea]
    );

    if (tareaInfo.length > 0) {
      const tarea = tareaInfo[0];
      
      // Crear notificación para el profesor
      await pool.query(
        `INSERT INTO notificaciones 
         (id_usuario, tipo_usuario, tipo_notificacion, titulo, mensaje, link, id_referencia) 
         VALUES (?, 'profesor', 'entrega_tarea', ?, ?, ?, ?)`,
        [
          tarea.id_profesor,
          'Nueva entrega recibida',
          `${tarea.alumno_nombre} ha entregado la tarea "${tarea.titulo}" del curso ${tarea.nombre_curso}`,
          `/entregas/${id_tarea}`,
          id_tarea
        ]
      );
    }

    res.json({
      success: true,
      message: "Tarea entregada exitosamente",
      id_entrega: result.insertId
    });
  } catch (error) {
    console.error("Error al entregar tarea:", error);
    res.status(500).json({ message: "Error al entregar tarea" });
  }
});

// Obtener entregas de una tarea (profesor)
router.get('/entregas/:idTarea', async (req, res) => {
  try {
    const { idTarea } = req.params;

    const [entregas] = await pool.query(
      `SELECT 
        e.*,
        CONCAT(p.nombre, ' ', p.apellido) AS alumno_nombre,
        p.mail AS alumno_email
       FROM entregas_tareas e
       INNER JOIN alumnos a ON e.id_alumno = a.id_alumno
       INNER JOIN personas p ON a.id_persona = p.id_persona
       WHERE e.id_tarea = ?
       ORDER BY e.fecha_entrega DESC`,
      [idTarea]
    );

    res.json(entregas);
  } catch (error) {
    console.error("Error al obtener entregas:", error);
    res.status(500).json({ message: "Error al obtener entregas" });
  }
});

// Obtener entrega específica de un alumno
router.get('/entregas/:idTarea/alumno/:idAlumno', async (req, res) => {
  try {
    const { idTarea, idAlumno } = req.params;

    const [entrega] = await pool.query(
      `SELECT 
        e.*,
        t.titulo AS tarea_titulo,
        t.puntos AS tarea_puntos,
        CONCAT(p.nombre, ' ', p.apellido) AS alumno_nombre
       FROM entregas_tareas e
       INNER JOIN tareas t ON e.id_tarea = t.id_tarea
       INNER JOIN alumnos a ON e.id_alumno = a.id_alumno
       INNER JOIN personas p ON a.id_persona = p.id_persona
       WHERE e.id_tarea = ? AND e.id_alumno = ?`,
      [idTarea, idAlumno]
    );

    if (entrega.length === 0) {
      return res.status(404).json({ message: "No se encontró la entrega" });
    }

    res.json(entrega[0]);
  } catch (error) {
    console.error("Error al obtener entrega:", error);
    res.status(500).json({ message: "Error al obtener entrega" });
  }
});

// Obtener una entrega específica por ID (profesor)
router.get('/entrega/:idEntrega', async (req, res) => {
  try {
    const { idEntrega } = req.params;

    const [entrega] = await pool.query(
      `SELECT 
        et.id_entrega,
        et.id_tarea,
        et.id_alumno,
        et.contenido,
        et.archivo_url,
        et.fecha_entrega,
        et.calificacion,
        et.comentario_profesor,
        t.titulo as tarea_titulo,
        t.puntos as tarea_puntos,
        CONCAT(p.nombre, ' ', p.apellido) as alumno_nombre,
        p.mail as alumno_email
      FROM entregas_tareas et
      JOIN tareas t ON et.id_tarea = t.id_tarea
      JOIN alumnos a ON et.id_alumno = a.id_alumno
      JOIN personas p ON a.id_persona = p.id_persona
      WHERE et.id_entrega = ?`,
      [idEntrega]
    );

    if (entrega.length === 0) {
      return res.status(404).json({ message: "No se encontró la entrega" });
    }

    res.json(entrega[0]);
  } catch (error) {
    console.error("Error al obtener entrega:", error);
    res.status(500).json({ message: "Error al obtener entrega" });
  }
});

// Calificar entrega (profesor)
router.put('/entregas/:idEntrega/calificar', async (req, res) => {
  try {
    const { idEntrega } = req.params;
    const { calificacion, comentario_profesor } = req.body;

    // Actualizar calificación
    await pool.query(
      `UPDATE entregas_tareas 
       SET calificacion = ?, comentario_profesor = ? 
       WHERE id_entrega = ?`,
      [calificacion, comentario_profesor, idEntrega]
    );

    // Obtener información para notificación
    const [entregaInfo] = await pool.query(
      `SELECT e.id_alumno, e.id_tarea, t.titulo, c.nombre_curso
       FROM entregas_tareas e
       INNER JOIN tareas t ON e.id_tarea = t.id_tarea
       INNER JOIN cursos c ON t.id_curso = c.id_curso
       WHERE e.id_entrega = ?`,
      [idEntrega]
    );

    if (entregaInfo.length > 0) {
      const entrega = entregaInfo[0];
      
      // Crear notificación para el alumno
      await pool.query(
        `INSERT INTO notificaciones 
         (id_usuario, tipo_usuario, tipo_notificacion, titulo, mensaje, link, id_referencia) 
         VALUES (?, 'alumno', 'calificacion', ?, ?, ?, ?)`,
        [
          entrega.id_alumno,
          'Nueva calificación',
          `Tu entrega de "${entrega.titulo}" ha sido calificada: ${calificacion}`,
          `/tareas/${entrega.id_tarea}`,
          entrega.id_tarea
        ]
      );
    }

    res.json({
      success: true,
      message: "Entrega calificada exitosamente"
    });
  } catch (error) {
    console.error("Error al calificar entrega:", error);
    res.status(500).json({ message: "Error al calificar entrega" });
  }
});

// =====================================================
// ENDPOINTS EXCLUSIVOS PARA ADMINISTRADORES
// =====================================================

// Obtener TODOS los cursos del sistema (admin)
router.get("/admin/todos-cursos", async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma,
        n.descripcion AS nivel,
        c.horario,
        a.nombre_aula,
        c.cupo_maximo,
        (SELECT COUNT(*) FROM inscripciones WHERE id_curso = c.id_curso AND estado = 'activo') AS total_alumnos,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
        c.fecha_inicio,
        c.fecha_fin,
        c.activo
      FROM cursos c
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      LEFT JOIN niveles n ON c.id_nivel = n.id_nivel
      LEFT JOIN aulas a ON c.id_aula = a.id_aula
      LEFT JOIN profesores prof ON c.id_profesor = prof.id_profesor
      LEFT JOIN personas p ON prof.id_persona = p.id_persona
      ORDER BY c.fecha_inicio DESC, c.nombre_curso
    `;
    
    const [cursos] = await pool.query(query);
    res.json(cursos);
  } catch (error) {
    console.error("Error al obtener todos los cursos:", error);
    res.status(500).json({ message: "Error al obtener cursos" });
  }
});

// Obtener TODOS los anuncios del sistema (admin)
router.get("/admin/todos-anuncios", async (req, res) => {
  try {
    const [anuncios] = await pool.query(`
      SELECT 
        a.*,
        c.nombre_curso,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
        i.nombre_idioma
      FROM anuncios a
      INNER JOIN cursos c ON a.id_curso = c.id_curso
      INNER JOIN profesores prof ON c.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      ORDER BY a.fecha_creacion DESC
    `);
    
    res.json(anuncios);
  } catch (error) {
    console.error("Error al obtener todos los anuncios:", error);
    res.status(500).json({ message: "Error al obtener anuncios" });
  }
});

// Obtener TODAS las tareas del sistema (admin)
router.get("/admin/todas-tareas", async (req, res) => {
  try {
    const [tareas] = await pool.query(`
      SELECT 
        t.*,
        c.nombre_curso,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
        i.nombre_idioma,
        (SELECT COUNT(*) FROM entregas WHERE id_tarea = t.id_tarea) AS total_entregas,
        (SELECT COUNT(*) FROM entregas WHERE id_tarea = t.id_tarea AND calificacion IS NOT NULL) AS total_calificadas
      FROM tareas t
      INNER JOIN cursos c ON t.id_curso = c.id_curso
      INNER JOIN profesores prof ON c.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      ORDER BY t.fecha_creacion DESC
    `);
    
    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener todas las tareas:", error);
    res.status(500).json({ message: "Error al obtener tareas" });
  }
});

// Obtener TODOS los polls del sistema (admin)
router.get("/admin/todos-polls", async (req, res) => {
  try {
    const [polls] = await pool.query(`
      SELECT 
        po.*,
        c.nombre_curso,
        CONCAT(p.nombre, ' ', p.apellido) AS profesor_nombre,
        i.nombre_idioma
      FROM polls po
      INNER JOIN cursos c ON po.id_curso = c.id_curso
      INNER JOIN profesores prof ON c.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      ORDER BY po.fecha_creacion DESC
    `);
    
    // Para cada poll, obtener sus opciones
    for (let poll of polls) {
      const [opciones] = await pool.query(`
        SELECT * FROM poll_opciones WHERE id_poll = ? ORDER BY id_opcion
      `, [poll.id_poll]);
      
      poll.opciones = opciones;
    }
    
    res.json(polls);
  } catch (error) {
    console.error("Error al obtener todos los polls:", error);
    res.status(500).json({ message: "Error al obtener polls" });
  }
});

// Obtener TODOS los comentarios del sistema (admin)
router.get("/admin/todos-comentarios", async (req, res) => {
  try {
    const [comentarios] = await pool.query(`
      SELECT 
        co.*,
        CONCAT(p.nombre, ' ', p.apellido) AS nombre_usuario,
        c.nombre_curso,
        CASE 
          WHEN co.id_anuncio IS NOT NULL THEN 'anuncio'
          WHEN co.id_tarea IS NOT NULL THEN 'tarea'
          ELSE 'otro'
        END AS tipo_publicacion
      FROM comentarios co
      LEFT JOIN alumnos al ON co.id_alumno = al.id_alumno
      LEFT JOIN profesores prof ON co.id_profesor = prof.id_profesor
      LEFT JOIN personas p ON COALESCE(al.id_persona, prof.id_persona) = p.id_persona
      LEFT JOIN anuncios a ON co.id_anuncio = a.id_anuncio
      LEFT JOIN tareas t ON co.id_tarea = t.id_tarea
      LEFT JOIN cursos c ON COALESCE(a.id_curso, t.id_curso) = c.id_curso
      ORDER BY co.fecha_comentario DESC
    `);
    
    res.json(comentarios);
  } catch (error) {
    console.error("Error al obtener todos los comentarios:", error);
    res.status(500).json({ message: "Error al obtener comentarios" });
  }
});

// Obtener actividad reciente completa del sistema (admin)
router.get("/admin/actividad-completa", async (req, res) => {
  try {
    const actividad = [];
    
    // Anuncios recientes (últimos 50)
    const [anuncios] = await pool.query(`
      SELECT 
        'anuncio' AS tipo,
        a.id_anuncio AS id,
        a.titulo,
        a.contenido AS descripcion,
        a.fecha_creacion AS fecha,
        c.nombre_curso,
        c.id_curso,
        CONCAT(p.nombre, ' ', p.apellido) AS autor,
        i.nombre_idioma
      FROM anuncios a
      INNER JOIN cursos c ON a.id_curso = c.id_curso
      INNER JOIN profesores prof ON c.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      ORDER BY a.fecha_creacion DESC
      LIMIT 50
    `);
    
    // Tareas recientes (últimas 50)
    const [tareas] = await pool.query(`
      SELECT 
        'tarea' AS tipo,
        t.id_tarea AS id,
        t.titulo,
        t.descripcion,
        t.fecha_creacion AS fecha,
        c.nombre_curso,
        c.id_curso,
        CONCAT(p.nombre, ' ', p.apellido) AS autor,
        i.nombre_idioma,
        t.fecha_limite
      FROM tareas t
      INNER JOIN cursos c ON t.id_curso = c.id_curso
      INNER JOIN profesores prof ON c.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      ORDER BY t.fecha_creacion DESC
      LIMIT 50
    `);
    
    // Polls recientes (últimos 30)
    const [polls] = await pool.query(`
      SELECT 
        'poll' AS tipo,
        po.id_poll AS id,
        po.pregunta AS titulo,
        '' AS descripcion,
        po.fecha_creacion AS fecha,
        c.nombre_curso,
        c.id_curso,
        CONCAT(p.nombre, ' ', p.apellido) AS autor,
        i.nombre_idioma
      FROM polls po
      INNER JOIN cursos c ON po.id_curso = c.id_curso
      INNER JOIN profesores prof ON c.id_profesor = prof.id_profesor
      INNER JOIN personas p ON prof.id_persona = p.id_persona
      INNER JOIN idiomas i ON c.id_idioma = i.id_idioma
      ORDER BY po.fecha_creacion DESC
      LIMIT 30
    `);
    
    // Combinar y ordenar por fecha
    actividad.push(...anuncios, ...tareas, ...polls);
    actividad.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    res.json(actividad);
  } catch (error) {
    console.error("Error al obtener actividad completa:", error);
    res.status(500).json({ message: "Error al obtener actividad" });
  }
});

// =====================================================
// ENDPOINTS DE ELIMINACIÓN (ADMIN)
// =====================================================

// Eliminar anuncio
router.delete("/anuncio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando anuncio ${id}`);
    
    // Eliminar anuncio (CASCADE eliminará comentarios asociados)
    await pool.query(`DELETE FROM anuncios WHERE id_anuncio = ?`, [id]);
    
    res.json({
      success: true,
      message: "Anuncio eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar anuncio:", error);
    res.status(500).json({ message: "Error al eliminar anuncio" });
  }
});

// Eliminar tarea
router.delete("/tarea/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando tarea ${id}`);
    
    // Eliminar tarea (CASCADE eliminará entregas y comentarios asociados)
    await pool.query(`DELETE FROM tareas WHERE id_tarea = ?`, [id]);
    
    res.json({
      success: true,
      message: "Tarea eliminada exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
});

// Eliminar poll
router.delete("/poll/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando poll ${id}`);
    
    // Eliminar poll (CASCADE eliminará opciones y votos asociados)
    await pool.query(`DELETE FROM polls WHERE id_poll = ?`, [id]);
    
    res.json({
      success: true,
      message: "Poll eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar poll:", error);
    res.status(500).json({ message: "Error al eliminar poll" });
  }
});

export default router;
