// =====================================================
// RUTAS REST API PARA CHAT - CEMI
// =====================================================

import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

// =====================================================
// INICIAR NUEVA CONVERSACIÓN
// =====================================================

router.post("/iniciar", async (req, res) => {
  try {
    const { tipo_usuario, id_usuario, nombre, mensaje_inicial } = req.body;
    
    // Validaciones
    if (!tipo_usuario || !nombre || !mensaje_inicial) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltan datos requeridos" 
      });
    }
    
    let id_conversacion;
    
    // BUSCAR SI YA EXISTE UNA CONVERSACIÓN ACTIVA/PENDIENTE PARA ESTE USUARIO
    if (tipo_usuario !== 'invitado' && id_usuario) {
      const [existentes] = await pool.query(`
        SELECT id_conversacion 
        FROM chat_conversaciones 
        WHERE tipo_usuario = ? AND id_usuario = ? AND estado IN ('pendiente', 'activa')
        LIMIT 1
      `, [tipo_usuario, id_usuario]);
      
      if (existentes.length > 0) {
        // Ya existe una conversación, usar esa
        id_conversacion = existentes[0].id_conversacion;
        console.log(`✅ Conversación existente encontrada: ${id_conversacion} para ${nombre}`);
      }
    }
    
    // Si no existe conversación, crear una nueva
    if (!id_conversacion) {
      const [conversacion] = await pool.query(`
        INSERT INTO chat_conversaciones (tipo_usuario, id_usuario, nombre_invitado, estado)
        VALUES (?, ?, ?, 'pendiente')
      `, [
        tipo_usuario,
        tipo_usuario === 'invitado' ? null : id_usuario,
        tipo_usuario === 'invitado' ? nombre : null
      ]);
      
      id_conversacion = conversacion.insertId;
      console.log(`📝 Nueva conversación creada: ${id_conversacion} para ${nombre}`);
      
      // Crear registro de estadísticas solo para conversaciones nuevas
      await pool.query(`
        INSERT INTO chat_estadisticas (id_conversacion, total_mensajes, mensajes_usuario)
        VALUES (?, 0, 0)
      `, [id_conversacion]);
    }
    
    // Insertar mensaje inicial
    await pool.query(`
      INSERT INTO chat_mensajes (
        id_conversacion, 
        tipo_remitente, 
        id_remitente, 
        nombre_remitente, 
        mensaje
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      id_conversacion,
      tipo_usuario,
      tipo_usuario === 'invitado' ? null : id_usuario,
      nombre,
      mensaje_inicial
    ]);
    
    // Actualizar contador de mensajes no leídos para admin
    await pool.query(`
      UPDATE chat_conversaciones
      SET mensajes_no_leidos_admin = mensajes_no_leidos_admin + 1,
          ultima_actividad = CURRENT_TIMESTAMP
      WHERE id_conversacion = ?
    `, [id_conversacion]);
    
    console.log(`💬 Mensaje agregado a conversación: ${id_conversacion} por ${nombre}`);
    
    res.json({
      success: true,
      message: "Conversación iniciada exitosamente",
      data: {
        id_conversacion,
        tipo_usuario,
        nombre
      }
    });
    
  } catch (error) {
    console.error("Error al iniciar conversación:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al iniciar conversación" 
    });
  }
});

// =====================================================
// OBTENER MENSAJES DE UNA CONVERSACIÓN
// =====================================================

router.get("/conversacion/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información de la conversación
    const [conversaciones] = await pool.query(`
      SELECT c.*, 
             CASE 
               WHEN c.atendido_por IS NOT NULL THEN CONCAT(p.nombre, ' ', p.apellido)
               ELSE NULL
             END as nombre_admin
      FROM chat_conversaciones c
      LEFT JOIN usuarios u ON c.atendido_por = u.id_usuario
      LEFT JOIN personas p ON u.id_persona = p.id_persona
      WHERE c.id_conversacion = ?
    `, [id]);
    
    if (conversaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversación no encontrada"
      });
    }
    
    const conversacion = conversaciones[0];
    
    // Obtener mensajes con avatar del remitente usando LEFT JOINs
    const [mensajes] = await pool.query(`
      SELECT 
        cm.*,
        COALESCE(p_alumno.avatar, p_profesor.avatar) as avatar_remitente
      FROM chat_mensajes cm
      LEFT JOIN alumnos a ON cm.tipo_remitente = 'alumno' AND a.id_alumno = cm.id_remitente
      LEFT JOIN personas p_alumno ON a.id_persona = p_alumno.id_persona
      LEFT JOIN profesores pr ON cm.tipo_remitente = 'profesor' AND pr.id_profesor = cm.id_remitente
      LEFT JOIN personas p_profesor ON pr.id_persona = p_profesor.id_persona
      WHERE cm.id_conversacion = ?
      ORDER BY cm.fecha_envio ASC
    `, [id]);
    
    // Log para verificar avatares
    console.log(`📸 Conversación ${id} - Mensajes con avatares:`, mensajes.map(m => ({
      id: m.id_mensaje,
      tipo: m.tipo_remitente,
      id_rem: m.id_remitente,
      avatar: m.avatar_remitente
    })));
    
    // Desactivar caché para esta respuesta
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      data: {
        conversacion,
        mensajes
      }
    });
    
  } catch (error) {
    console.error("Error al obtener conversación:", error);
    res.status(500).json({
      success: false,
      message: "Error al cargar conversación"
    });
  }
});

// =====================================================
// OBTENER CONVERSACIONES (PARA ADMIN)
// =====================================================

router.get("/conversaciones", async (req, res) => {
  try {
    const { estado, atendido_por } = req.query;
    
    let query = `
      SELECT 
        c.*,
        COUNT(m.id_mensaje) as total_mensajes,
        (SELECT mensaje FROM chat_mensajes 
         WHERE id_conversacion = c.id_conversacion 
         ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT fecha_envio FROM chat_mensajes 
         WHERE id_conversacion = c.id_conversacion 
         ORDER BY fecha_envio DESC LIMIT 1) as fecha_ultimo_mensaje,
        CASE 
          WHEN c.atendido_por IS NOT NULL THEN CONCAT(p_admin.nombre, ' ', p_admin.apellido)
          ELSE NULL
        END as nombre_admin,
        CASE
          WHEN c.id_usuario IS NOT NULL THEN CONCAT(p_usuario.nombre, ' ', p_usuario.apellido)
          ELSE c.nombre_invitado
        END as nombre_completo_usuario
      FROM chat_conversaciones c
      LEFT JOIN chat_mensajes m ON c.id_conversacion = m.id_conversacion
      LEFT JOIN usuarios u_admin ON c.atendido_por = u_admin.id_usuario
      LEFT JOIN personas p_admin ON u_admin.id_persona = p_admin.id_persona
      LEFT JOIN usuarios u_usuario ON c.id_usuario = u_usuario.id_usuario
      LEFT JOIN personas p_usuario ON u_usuario.id_persona = p_usuario.id_persona
      WHERE 1=1
    `;
    
    const params = [];
    
    if (estado) {
      query += ` AND c.estado = ?`;
      params.push(estado);
    }
    
    if (atendido_por) {
      query += ` AND c.atendido_por = ?`;
      params.push(atendido_por);
    }
    
    query += `
      GROUP BY c.id_conversacion
      ORDER BY c.ultima_actividad DESC
    `;
    
    const [conversaciones] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: conversaciones
    });
    
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al cargar conversaciones"
    });
  }
});

// =====================================================
// TOMAR CONVERSACIÓN (ADMIN)
// =====================================================

router.put("/conversacion/:id/tomar", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_admin } = req.body;
    
    if (!id_admin) {
      return res.status(400).json({
        success: false,
        message: "ID de admin requerido"
      });
    }
    
    await pool.query(`
      UPDATE chat_conversaciones
      SET atendido_por = ?, estado = 'activa'
      WHERE id_conversacion = ?
    `, [id_admin, id]);
    
    res.json({
      success: true,
      message: "Conversación tomada exitosamente"
    });
    
  } catch (error) {
    console.error("Error al tomar conversación:", error);
    res.status(500).json({
      success: false,
      message: "Error al tomar conversación"
    });
  }
});

// =====================================================
// CERRAR CONVERSACIÓN
// =====================================================

router.put("/conversacion/:id/cerrar", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Actualizar conversación
    await pool.query(`
      UPDATE chat_conversaciones
      SET estado = 'cerrada', fecha_cierre = CURRENT_TIMESTAMP
      WHERE id_conversacion = ?
    `, [id]);
    
    // Calcular estadísticas finales
    const [stats] = await pool.query(`
      SELECT 
        MIN(fecha_envio) as fecha_inicio,
        MAX(fecha_envio) as fecha_fin
      FROM chat_mensajes
      WHERE id_conversacion = ?
    `, [id]);
    
    if (stats.length > 0 && stats[0].fecha_inicio && stats[0].fecha_fin) {
      const tiempoTotal = Math.floor(
        (new Date(stats[0].fecha_fin) - new Date(stats[0].fecha_inicio)) / 1000
      );
      
      await pool.query(`
        UPDATE chat_estadisticas
        SET tiempo_total_conversacion = ?
        WHERE id_conversacion = ?
      `, [tiempoTotal, id]);
    }
    
    res.json({
      success: true,
      message: "Conversación cerrada exitosamente"
    });
    
  } catch (error) {
    console.error("Error al cerrar conversación:", error);
    res.status(500).json({
      success: false,
      message: "Error al cerrar conversación"
    });
  }
});

// =====================================================
// ENVIAR MENSAJE (REST API - Alternativa a WebSocket)
// =====================================================

router.post("/mensaje", async (req, res) => {
  try {
    const { id_conversacion, tipo_remitente, id_remitente, nombre_remitente, mensaje } = req.body;
    
    // Validaciones
    if (!id_conversacion || !tipo_remitente || !nombre_remitente || !mensaje) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos"
      });
    }
    
    // Insertar mensaje
    const [result] = await pool.query(`
      INSERT INTO chat_mensajes (
        id_conversacion, 
        tipo_remitente, 
        id_remitente, 
        nombre_remitente, 
        mensaje
      ) VALUES (?, ?, ?, ?, ?)
    `, [id_conversacion, tipo_remitente, id_remitente, nombre_remitente, mensaje]);
    
    // Actualizar última actividad
    await pool.query(`
      UPDATE chat_conversaciones 
      SET ultima_actividad = CURRENT_TIMESTAMP
      WHERE id_conversacion = ?
    `, [id_conversacion]);
    
    res.json({
      success: true,
      message: "Mensaje enviado",
      data: {
        id_mensaje: result.insertId
      }
    });
    
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar mensaje"
    });
  }
});

// =====================================================
// MARCAR MENSAJES COMO LEÍDOS
// =====================================================

router.put("/conversacion/:id/leer", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_lector } = req.body; // 'admin' o 'usuario'
    
    if (tipo_lector === 'admin') {
      await pool.query(`
        UPDATE chat_mensajes 
        SET leido_por_admin = 1, leido = 1
        WHERE id_conversacion = ? 
          AND tipo_remitente != 'admin'
          AND leido_por_admin = 0
      `, [id]);
      
      await pool.query(`
        UPDATE chat_conversaciones
        SET mensajes_no_leidos_admin = 0
        WHERE id_conversacion = ?
      `, [id]);
    } else {
      await pool.query(`
        UPDATE chat_mensajes 
        SET leido_por_usuario = 1, leido = 1
        WHERE id_conversacion = ? 
          AND tipo_remitente = 'admin'
          AND leido_por_usuario = 0
      `, [id]);
      
      await pool.query(`
        UPDATE chat_conversaciones
        SET mensajes_no_leidos_usuario = 0
        WHERE id_conversacion = ?
      `, [id]);
    }
    
    res.json({
      success: true,
      message: "Mensajes marcados como leídos"
    });
    
  } catch (error) {
    console.error("Error al marcar como leído:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado"
    });
  }
});

// =====================================================
// OBTENER ESTADÍSTICAS DE CHAT
// =====================================================

router.get("/estadisticas", async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_conversaciones,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
        SUM(CASE WHEN estado = 'cerrada' THEN 1 ELSE 0 END) as cerradas,
        SUM(CASE WHEN tipo_usuario = 'invitado' THEN 1 ELSE 0 END) as invitados,
        SUM(CASE WHEN tipo_usuario = 'alumno' THEN 1 ELSE 0 END) as alumnos,
        SUM(CASE WHEN tipo_usuario = 'profesor' THEN 1 ELSE 0 END) as profesores
      FROM chat_conversaciones
    `);
    
    const [avgTime] = await pool.query(`
      SELECT 
        AVG(tiempo_primera_respuesta) as tiempo_promedio_respuesta,
        AVG(tiempo_total_conversacion) as tiempo_promedio_conversacion
      FROM chat_estadisticas
      WHERE tiempo_primera_respuesta IS NOT NULL
    `);
    
    res.json({
      success: true,
      data: {
        ...stats[0],
        ...avgTime[0]
      }
    });
    
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al cargar estadísticas"
    });
  }
});

// =====================================================
// OBTENER CONVERSACIÓN DE UN USUARIO LOGGEADO
// =====================================================

router.get("/mi-conversacion", async (req, res) => {
  try {
    const { tipo_usuario, id_usuario } = req.query;
    
    if (!tipo_usuario || !id_usuario) {
      return res.status(400).json({
        success: false,
        message: "Parámetros requeridos: tipo_usuario, id_usuario"
      });
    }
    
    // Buscar conversación activa o pendiente del usuario
    const [conversaciones] = await pool.query(`
      SELECT 
        c.*,
        (SELECT mensaje FROM chat_mensajes 
         WHERE id_conversacion = c.id_conversacion 
         ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT fecha_envio FROM chat_mensajes 
         WHERE id_conversacion = c.id_conversacion 
         ORDER BY fecha_envio DESC LIMIT 1) as fecha_ultimo_mensaje
      FROM chat_conversaciones c
      WHERE tipo_usuario = ? AND id_usuario = ?
        AND estado IN ('pendiente', 'activa')
      ORDER BY fecha_inicio DESC
      LIMIT 1
    `, [tipo_usuario, id_usuario]);
    
    if (conversaciones.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No hay conversación activa"
      });
    }
    
    const conversacion = conversaciones[0];
    
    // Obtener mensajes con avatar del remitente
    const [mensajes] = await pool.query(`
      SELECT 
        cm.*,
        COALESCE(p_alumno.avatar, p_profesor.avatar) as avatar_remitente
      FROM chat_mensajes cm
      LEFT JOIN alumnos a ON cm.tipo_remitente = 'alumno' AND a.id_alumno = cm.id_remitente
      LEFT JOIN personas p_alumno ON a.id_persona = p_alumno.id_persona
      LEFT JOIN profesores pr ON cm.tipo_remitente = 'profesor' AND pr.id_profesor = cm.id_remitente
      LEFT JOIN personas p_profesor ON pr.id_persona = p_profesor.id_persona
      WHERE cm.id_conversacion = ?
      ORDER BY cm.fecha_envio ASC
    `, [conversacion.id_conversacion]);
    
    // Log para verificar avatares
    console.log(`📸 Mi conversación - Mensajes con avatares:`, mensajes.map(m => ({
      id: m.id_mensaje,
      tipo: m.tipo_remitente,
      id_rem: m.id_remitente,
      avatar: m.avatar_remitente
    })));
    
    // Desactivar caché para esta respuesta
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      data: {
        conversacion,
        mensajes
      }
    });
    
  } catch (error) {
    console.error("Error al obtener conversación del usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al cargar conversación"
    });
  }
});

// =====================================================
// ELIMINAR CONVERSACIÓN (SOLO ADMIN)
// =====================================================

router.delete("/conversacion/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_admin } = req.body; // ID del administrador que elimina
    
    console.log(`🗑️ Admin ${id_admin} eliminando conversación ${id}`);
    
    // Verificar que la conversación existe
    const [conversacion] = await pool.query(`
      SELECT * FROM chat_conversaciones WHERE id_conversacion = ?
    `, [id]);
    
    if (conversacion.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversación no encontrada"
      });
    }
    
    // Eliminar la conversación (CASCADE eliminará mensajes y estadísticas)
    await pool.query(`
      DELETE FROM chat_conversaciones WHERE id_conversacion = ?
    `, [id]);
    
    console.log(`✅ Conversación ${id} eliminada exitosamente`);
    
    res.json({
      success: true,
      message: "Conversación eliminada exitosamente",
      data: {
        id_conversacion: id,
        tipo_usuario: conversacion[0].tipo_usuario,
        id_usuario: conversacion[0].id_usuario
      }
    });
    
  } catch (error) {
    console.error("Error al eliminar conversación:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar conversación"
    });
  }
});

export default router;

