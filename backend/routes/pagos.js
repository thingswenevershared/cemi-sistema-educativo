// backend/routes/pagos.js
import express from "express";
import pool from "../utils/db.js";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

// GET /pagos - Lista de pagos con estadísticas y filtros
router.get("/", async (req, res) => {
  try {
    // Obtener lista de pagos con información completa
    const [rows] = await pool.query(`
      SELECT 
        pa.id_pago,
        pa.id_alumno,
        CONCAT(p.nombre, ' ', p.apellido) AS alumno,
        a.legajo,
        cp.descripcion AS concepto,
        mp.descripcion AS medio_pago,
        pa.monto,
        pa.fecha_pago,
        pa.periodo,
        pa.fecha_vencimiento,
        pa.estado_pago,
        ad.cargo AS administrativo,
        CASE
          WHEN pa.fecha_pago IS NULL AND pa.fecha_vencimiento < CURDATE() THEN 'mora'
          WHEN pa.fecha_pago IS NULL AND DATEDIFF(pa.fecha_vencimiento, CURDATE()) <= 5 THEN 'proximo_vencimiento'
          WHEN pa.fecha_pago IS NOT NULL THEN 'pagado'
          ELSE 'al_dia'
        END AS estado_visual
      FROM pagos pa
      JOIN alumnos a ON pa.id_alumno = a.id_alumno
      JOIN personas p ON a.id_persona = p.id_persona
      JOIN conceptos_pago cp ON pa.id_concepto = cp.id_concepto
      JOIN medios_pago mp ON pa.id_medio_pago = mp.id_medio_pago
      LEFT JOIN administrativos ad ON pa.id_administrativo = ad.id_administrativo
      ORDER BY pa.fecha_pago DESC, pa.fecha_vencimiento DESC
    `);

    // Calcular estadísticas del mes actual
    const mesActual = new Date().toISOString().slice(0, 7); // Formato: YYYY-MM
    
    const [stats] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN periodo = ? THEN monto ELSE 0 END), 0) AS total_mes,
        COUNT(CASE WHEN periodo = ? AND fecha_pago IS NOT NULL THEN 1 END) AS cuotas_cobradas,
        COUNT(CASE WHEN periodo = ? AND fecha_pago IS NULL THEN 1 END) AS cuotas_pendientes,
        COUNT(CASE WHEN fecha_pago IS NULL AND fecha_vencimiento < CURDATE() THEN 1 END) AS alumnos_mora,
        COALESCE(AVG(monto), 0) AS promedio_pago
      FROM pagos
    `, [mesActual, mesActual, mesActual]);

    res.json({
      pagos: rows,
      estadisticas: stats[0]
    });
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ message: "Error al obtener pagos" });
  }
});

// GET /pagos/alumno/:id - Obtener pagos de un alumno agrupados por curso
router.get("/alumno/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[pagos] Consultando pagos para alumno ID: ${id}`);

    // Obtener cursos activos del alumno
    const [cursosActivos] = await pool.query(`
      SELECT 
        c.id_curso,
        c.nombre_curso,
        i.nombre_idioma,
        n.descripcion AS nivel,
        CONCAT(prof_p.nombre, ' ', prof_p.apellido) AS profesor,
        15000 AS costo_mensual,
        insc.fecha_inscripcion
      FROM inscripciones insc
      JOIN cursos c ON insc.id_curso = c.id_curso
      JOIN idiomas i ON c.id_idioma = i.id_idioma
      JOIN niveles n ON c.id_nivel = n.id_nivel
      JOIN profesores prof ON c.id_profesor = prof.id_profesor
      JOIN personas prof_p ON prof.id_persona = prof_p.id_persona
      WHERE insc.id_alumno = ? AND insc.estado = 'activo'
      ORDER BY c.nombre_curso
    `, [id]);

    console.log(`[pagos] Cursos activos encontrados: ${cursosActivos.length}`);

    // Meses académicos (Matrícula + Marzo-Noviembre)
    const mesesAcademicos = [
      'Matricula', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 
      'Octubre', 'Noviembre'
    ];

    // Para cada curso, obtener estado de pagos de cada mes
    const cursosPagos = await Promise.all(cursosActivos.map(async (curso) => {
      // Obtener pagos realizados para este curso
      const [pagosRealizados] = await pool.query(`
        SELECT 
          pa.id_pago,
          pa.mes_cuota,
          pa.monto,
          pa.fecha_pago,
          pa.detalle_pago
        FROM pagos pa
        WHERE pa.id_alumno = ? AND pa.id_curso = ?
        ORDER BY pa.fecha_pago DESC
      `, [id, curso.id_curso]);

      console.log(`[GET PAGOS] Curso ${curso.id_curso} - Pagos encontrados:`, pagosRealizados.map(p => ({mes: p.mes_cuota, id: p.id_pago})));

      // Generar estado de cada mes académico
      const estadoMeses = mesesAcademicos.map((mes, index) => {
        const pago = pagosRealizados.find(p => p.mes_cuota === mes);
        
        if (pago) {
          console.log(`[MATCH] Mes "${mes}" encontrado en pagos como "${pago.mes_cuota}"`);
          return {
            mes,
            estado: 'pagado',
            fecha_pago: pago.fecha_pago,
            monto: pago.monto,
            id_pago: pago.id_pago
          };
        } else {
          // Determinar estado según el mes actual
          const hoy = new Date();
          const mesActual = hoy.getMonth(); // 0-11
          
          // Matrícula (index 0) siempre se considera impaga si no está pagada
          if (index === 0 && mes === 'Matricula') {
            return {
              mes,
              estado: 'impago',
              fecha_pago: null,
              monto: curso.costo_mensual,
              id_pago: null
            };
          }
          
          // Para los demás meses (Marzo=index 1, Abril=index 2, etc.)
          const mesAcademicoActual = mesActual - 2; // Marzo = 0, Abril = 1, etc.
          const indexMesReal = index - 1; // Ajustar por Matrícula
          
          let estado = 'pendiente';
          if (indexMesReal < mesAcademicoActual) {
            estado = 'impago';
          } else if (indexMesReal === mesAcademicoActual) {
            estado = 'pendiente';
          } else {
            estado = 'proximo';
          }

          return {
            mes,
            estado,
            fecha_pago: null,
            monto: curso.costo_mensual,
            id_pago: null
          };
        }
      });

      // Calcular estadísticas del curso
      const cuotasPagadas = estadoMeses.filter(m => m.estado === 'pagado').length;
      const cuotasImpagas = estadoMeses.filter(m => m.estado === 'impago').length;
      const cuotasPendientes = estadoMeses.filter(m => m.estado === 'pendiente').length;
      const totalPagado = pagosRealizados.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

      return {
        id_curso: curso.id_curso,
        nombre_curso: `${curso.nombre_idioma} - ${curso.nivel}`,
        profesor: curso.profesor,
        costo_mensual: curso.costo_mensual,
        meses: estadoMeses,
        estadisticas: {
          cuotas_pagadas: cuotasPagadas,
          cuotas_impagas: cuotasImpagas,
          cuotas_pendientes: cuotasPendientes,
          total_pagado: totalPagado,
          total_pendiente: (10 - cuotasPagadas) * parseFloat(curso.costo_mensual) // 10 = Matrícula + 9 meses
        }
      };
    }));

    // Estadísticas globales
    const totalGlobalPagado = cursosPagos.reduce((sum, c) => sum + c.estadisticas.total_pagado, 0);
    const totalGlobalPendiente = cursosPagos.reduce((sum, c) => sum + c.estadisticas.total_pendiente, 0);
    const totalCuotasImpagas = cursosPagos.reduce((sum, c) => sum + c.estadisticas.cuotas_impagas, 0);

    res.json({
      cursos: cursosPagos,
      estadisticas_globales: {
        total_pagado: totalGlobalPagado,
        total_pendiente: totalGlobalPendiente,
        total_cursos: cursosPagos.length,
        cuotas_impagas: totalCuotasImpagas
      }
    });
  } catch (error) {
    console.error("Error al obtener pagos del alumno:", error);
    res.status(500).json({ 
      message: "Error al obtener pagos del alumno",
      error: error.message 
    });
  }
});

// POST /pagos/realizar - Registrar un nuevo pago
router.post("/realizar",
  // Validaciones
  [
    body('id_alumno')
      .isInt({ min: 1 }).withMessage('ID de alumno inválido')
      .toInt(),
    body('id_curso')
      .isInt({ min: 1 }).withMessage('ID de curso inválido')
      .toInt(),
    body('mes_cuota')
      .isIn(['Matricula', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'])
      .withMessage('Mes de cuota inválido'),
    body('monto')
      .isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0')
      .toFloat(),
    body('medio_pago')
      .isString().withMessage('Medio de pago inválido')
  ],
  async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  try {
    const { id_alumno, id_curso, mes_cuota, monto, medio_pago } = req.body;

    // Verificar que no exista ya un pago para este curso y mes
    const [pagoExistente] = await pool.query(
      'SELECT id_pago FROM pagos WHERE id_alumno = ? AND id_curso = ? AND mes_cuota = ?',
      [id_alumno, id_curso, mes_cuota]
    );

    if (pagoExistente.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Ya existe un pago registrado para este mes en este curso" 
      });
    }

    // Obtener información del curso
    const [cursoInfo] = await pool.query(`
      SELECT c.nombre_curso, i.nombre_idioma AS idioma, n.descripcion AS nivel
      FROM cursos c
      JOIN idiomas i ON c.id_idioma = i.id_idioma
      JOIN niveles n ON c.id_nivel = n.id_nivel
      WHERE c.id_curso = ?
    `, [id_curso]);

    if (cursoInfo.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Curso no encontrado" 
      });
    }

    // Obtener id del medio de pago
    const [medios] = await pool.query(
      'SELECT id_medio_pago FROM medios_pago WHERE descripcion = ?',
      [medio_pago]
    );

    if (medios.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Medio de pago no válido" 
      });
    }

    const id_medio_pago = medios[0].id_medio_pago;

    // Obtener id del concepto
    // Matrícula = 1, Cuota Mensual = 2
    const id_concepto = mes_cuota === 'Matricula' ? 1 : 2;

    // Generar detalle del pago
    const detalle_pago = mes_cuota === 'Matricula' 
      ? `Matrícula - ${cursoInfo[0].idioma} ${cursoInfo[0].nivel}`
      : `Cuota ${mes_cuota} - ${cursoInfo[0].idioma} ${cursoInfo[0].nivel}`;

    // Calcular periodo en formato YYYY-MM
    const mesesMap = {
      'Matricula': '02', // Febrero para matrícula
      'Marzo': '03', 'Abril': '04', 'Mayo': '05', 'Junio': '06',
      'Julio': '07', 'Agosto': '08', 'Septiembre': '09', 
      'Octubre': '10', 'Noviembre': '11'
    };
    const año = new Date().getFullYear();
    const periodo = `${año}-${mesesMap[mes_cuota]}`;

    console.log(`[PAGO] Registrando - mes_cuota: "${mes_cuota}", concepto ID: ${id_concepto}, detalle: "${detalle_pago}"`);

    // Registrar el pago
    const [result] = await pool.query(`
      INSERT INTO pagos 
      (id_alumno, id_curso, id_concepto, id_medio_pago, monto, fecha_pago, periodo, detalle_pago, mes_cuota, estado_pago)
      VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, 'pagado')
    `, [id_alumno, id_curso, id_concepto, id_medio_pago, monto, periodo, detalle_pago, mes_cuota]);

    console.log(`[PAGO] Guardado exitosamente - ID: ${result.insertId}`);

    res.json({
      success: true,
      message: "Pago registrado exitosamente",
      id_pago: result.insertId,
      comprobante: {
        numero: `COMP-${String(result.insertId).padStart(8, '0')}`,
        fecha: new Date().toISOString().split('T')[0],
        monto: monto,
        detalle: detalle_pago,
        mes_cuota: mes_cuota
      }
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al procesar el pago",
      error: error.message 
    });
  }
});

// DELETE /pagos/:id - Eliminar un pago
router.delete("/:id",
  // Validación
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID de pago inválido')
      .toInt()
  ],
  async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }
  try {
    const { id } = req.params;

    console.log(`[pagos] Intentando eliminar pago ID: ${id}`);

    // Verificar que el pago existe
    const [pago] = await pool.query('SELECT * FROM pagos WHERE id_pago = ?', [id]);
    
    if (pago.length === 0) {
      console.log(`[pagos] Pago ${id} no encontrado`);
      return res.status(404).json({ 
        success: false,
        message: "Pago no encontrado" 
      });
    }

    // Eliminar el pago
    await pool.query('DELETE FROM pagos WHERE id_pago = ?', [id]);

    console.log(`[pagos] Pago ${id} eliminado exitosamente`);
    res.json({ 
      success: true, 
      message: "Pago eliminado correctamente" 
    });
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar pago",
      error: error.message 
    });
  }
});

export default router;


