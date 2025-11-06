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
      FROM Pagos pa
      JOIN Alumnos a ON pa.id_alumno = a.id_alumno
      JOIN Personas p ON a.id_persona = p.id_persona
      JOIN Conceptos_Pago cp ON pa.id_concepto = cp.id_concepto
      JOIN Medios_Pago mp ON pa.id_medio_pago = mp.id_medio_pago
      LEFT JOIN Administrativos ad ON pa.id_administrativo = ad.id_administrativo
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
      FROM Pagos
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

// GET /pagos/alumno/:id - Obtener pagos de un alumno específico
router.get("/alumno/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[PAGOS] Consultando pagos para alumno ID: ${id}`);

    // Verificar primero si las columnas existen
    const [columnas] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND LOWER(TABLE_NAME) = 'pagos'
      AND COLUMN_NAME IN ('periodo', 'fecha_vencimiento', 'estado_pago')
    `);

    const tieneNuevasCols = columnas.length >= 2;
    console.log(`[PAGOS] Tiene columnas nuevas: ${tieneNuevasCols}, columnas encontradas: ${columnas.length}`);

    // Obtener pagos realizados
    let pagosRealizados = [];
    
    if (tieneNuevasCols) {
      const [rows] = await pool.query(`
        SELECT 
          pa.id_pago,
          cp.descripcion AS concepto,
          mp.descripcion AS medio_pago,
          pa.monto,
          pa.fecha_pago,
          pa.periodo,
          pa.fecha_vencimiento,
          pa.estado_pago
        FROM pagos pa
        JOIN conceptos_pago cp ON pa.id_concepto = cp.id_concepto
        JOIN medios_pago mp ON pa.id_medio_pago = mp.id_medio_pago
        WHERE pa.id_alumno = ?
        ORDER BY pa.fecha_pago DESC
      `, [id]);
      pagosRealizados = rows;
    } else {
      // Tabla antigua sin columnas nuevas
      const [rows] = await pool.query(`
        SELECT 
          pa.id_pago,
          cp.descripcion AS concepto,
          mp.descripcion AS medio_pago,
          pa.monto,
          pa.fecha_pago,
          DATE_FORMAT(pa.fecha_pago, '%Y-%m') as periodo,
          NULL as fecha_vencimiento,
          'pagado' as estado_pago
        FROM pagos pa
        JOIN conceptos_pago cp ON pa.id_concepto = cp.id_concepto
        JOIN medios_pago mp ON pa.id_medio_pago = mp.id_medio_pago
        WHERE pa.id_alumno = ?
        ORDER BY pa.fecha_pago DESC
      `, [id]);
      pagosRealizados = rows;
    }

    console.log(`[PAGOS] Pagos realizados encontrados: ${pagosRealizados.length}`);

    // Generar períodos pendientes (últimos 3 meses + próximos 3 meses)
    const periodosPendientes = [];
    const hoy = new Date();
    
    for (let i = -3; i <= 3; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      // Verificar si ya existe un pago para este período
      const yaExiste = pagosRealizados.some(p => p.periodo === periodo);
      
      if (!yaExiste) {
        const fechaVencimiento = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 10);
        const estaVencido = fechaVencimiento < hoy;
        
        periodosPendientes.push({
          periodo,
          monto: 15000.00, // Monto fijo mensual (puedes ajustarlo)
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
          estado: estaVencido ? 'vencido' : 'pendiente',
          mes_nombre: fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        });
      }
    }

    // Calcular estadísticas
    const totalPagado = pagosRealizados.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    const totalPendiente = periodosPendientes.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

    res.json({
      pagos_realizados: pagosRealizados,
      pagos_pendientes: periodosPendientes,
      estadisticas: {
        total_pagado: totalPagado,
        total_pendiente: totalPendiente,
        cantidad_pagos: pagosRealizados.length,
        cantidad_pendientes: periodosPendientes.length
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
    body('periodo')
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Periodo debe tener formato YYYY-MM'),
    body('monto')
      .isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0')
      .toFloat(),
    body('medio_pago')
      .isInt({ min: 1 }).withMessage('Medio de pago inválido')
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
    const { id_alumno, periodo, monto, medio_pago, datos_tarjeta } = req.body;

    // Verificar si las columnas nuevas existen
    const [columnas] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND LOWER(TABLE_NAME) = 'pagos'
      AND COLUMN_NAME IN ('periodo', 'estado_pago')
    `);

    const tieneNuevasCols = columnas.length >= 1;

    if (tieneNuevasCols) {
      // Verificar que no exista ya un pago para este período
      const [pagoExistente] = await pool.query(
        'SELECT id_pago FROM pagos WHERE id_alumno = ? AND periodo = ?',
        [id_alumno, periodo]
      );

      if (pagoExistente.length > 0) {
        return res.status(400).json({ message: "Ya existe un pago registrado para este período" });
      }
    }

    // Obtener id del medio de pago
    const [medios] = await pool.query(
      'SELECT id_medio_pago FROM medios_pago WHERE descripcion = ?',
      [medio_pago]
    );

    if (medios.length === 0) {
      return res.status(400).json({ message: "Medio de pago no válido" });
    }

    const id_medio_pago = medios[0].id_medio_pago;

    // Obtener id del concepto (asumimos concepto "Cuota Mensual" id=1)
    const id_concepto = 1;

    // Registrar el pago
    let result;
    
    if (tieneNuevasCols) {
      // Insertar con columnas nuevas
      [result] = await pool.query(`
        INSERT INTO pagos (id_alumno, id_concepto, id_medio_pago, monto, fecha_pago, periodo, estado_pago)
        VALUES (?, ?, ?, ?, CURDATE(), ?, 'pagado')
      `, [id_alumno, id_concepto, id_medio_pago, monto, periodo]);
    } else {
      // Insertar sin columnas nuevas
      [result] = await pool.query(`
        INSERT INTO pagos (id_alumno, id_concepto, id_medio_pago, monto, fecha_pago)
        VALUES (?, ?, ?, ?, CURDATE())
      `, [id_alumno, id_concepto, id_medio_pago, monto]);
    }

    res.json({
      success: true,
      message: "Pago registrado exitosamente",
      id_pago: result.insertId,
      comprobante: {
        numero: `COMP-${String(result.insertId).padStart(8, '0')}`,
        fecha: new Date().toISOString().split('T')[0],
        monto: monto,
        periodo: periodo
      }
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ 
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

    console.log(`[PAGOS] Intentando eliminar pago ID: ${id}`);

    // Verificar que el pago existe
    const [pago] = await pool.query('SELECT * FROM pagos WHERE id_pago = ?', [id]);
    
    if (pago.length === 0) {
      console.log(`[PAGOS] Pago ${id} no encontrado`);
      return res.status(404).json({ 
        success: false,
        message: "Pago no encontrado" 
      });
    }

    // Eliminar el pago
    await pool.query('DELETE FROM pagos WHERE id_pago = ?', [id]);

    console.log(`[PAGOS] Pago ${id} eliminado exitosamente`);
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

