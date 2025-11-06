// Script para limpiar conversaciones duplicadas sin id_usuario
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mainline.proxy.rlwy.net',
  port: 25836,
  user: 'root',
  password: 'atQKukcWRVWyllGqIJKWjahbMpsaeZPt',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10
});

async function limpiarConversacionesDuplicadas() {
  try {
    console.log('🧹 Limpiando conversaciones duplicadas...\n');
    
    // 1. Ver conversaciones con id_usuario NULL
    console.log('📋 Conversaciones con id_usuario NULL:\n');
    const [conversacionesNull] = await pool.query(`
      SELECT 
        c.id_conversacion,
        c.tipo_usuario,
        c.nombre_invitado,
        c.estado,
        c.fecha_inicio,
        COUNT(m.id_mensaje) as total_mensajes
      FROM chat_conversaciones c
      LEFT JOIN chat_mensajes m ON c.id_conversacion = m.id_conversacion
      WHERE c.id_usuario IS NULL AND c.tipo_usuario != 'invitado'
      GROUP BY c.id_conversacion
      ORDER BY c.fecha_inicio DESC
    `);
    
    if (conversacionesNull.length === 0) {
      console.log('✅ No hay conversaciones con id_usuario NULL\n');
      return;
    }
    
    console.log(`⚠️ Se encontraron ${conversacionesNull.length} conversaciones sin id_usuario:\n`);
    conversacionesNull.forEach(conv => {
      console.log(`ID ${conv.id_conversacion}: ${conv.tipo_usuario} - ${conv.nombre_invitado || 'Sin nombre'}`);
      console.log(`   Estado: ${conv.estado}, Mensajes: ${conv.total_mensajes}, Fecha: ${conv.fecha_inicio}\n`);
    });
    
    // 2. Ver los mensajes de esas conversaciones para saber de quién son
    console.log('📨 Verificando mensajes de estas conversaciones:\n');
    for (const conv of conversacionesNull) {
      const [mensajes] = await pool.query(`
        SELECT mensaje, nombre_remitente, fecha_envio
        FROM chat_mensajes
        WHERE id_conversacion = ?
        ORDER BY fecha_envio ASC
      `, [conv.id_conversacion]);
      
      console.log(`Conversación ${conv.id_conversacion}:`);
      mensajes.forEach(m => {
        console.log(`   - ${m.nombre_remitente}: "${m.mensaje.substring(0, 50)}..."`);
      });
      console.log('');
    }
    
    // 3. Preguntar confirmación (simulado - en este caso eliminar automáticamente)
    console.log('🗑️ Eliminando conversaciones sin id_usuario (duplicadas)...\n');
    
    const idsAEliminar = conversacionesNull.map(c => c.id_conversacion);
    
    // Eliminar mensajes primero (por foreign key)
    const [resultMensajes] = await pool.query(`
      DELETE FROM chat_mensajes
      WHERE id_conversacion IN (?)
    `, [idsAEliminar]);
    
    console.log(`✅ ${resultMensajes.affectedRows} mensajes eliminados`);
    
    // Eliminar estadísticas
    const [resultStats] = await pool.query(`
      DELETE FROM chat_estadisticas
      WHERE id_conversacion IN (?)
    `, [idsAEliminar]);
    
    console.log(`✅ ${resultStats.affectedRows} estadísticas eliminadas`);
    
    // Eliminar conversaciones
    const [resultConv] = await pool.query(`
      DELETE FROM chat_conversaciones
      WHERE id_conversacion IN (?)
    `, [idsAEliminar]);
    
    console.log(`✅ ${resultConv.affectedRows} conversaciones eliminadas\n`);
    
    // 4. Verificar que quedó limpio
    console.log('🔍 Verificando resultado final...\n');
    const [verificacion] = await pool.query(`
      SELECT COUNT(*) as total
      FROM chat_conversaciones
      WHERE id_usuario IS NULL AND tipo_usuario != 'invitado'
    `);
    
    if (verificacion[0].total === 0) {
      console.log('✅ Todas las conversaciones duplicadas fueron eliminadas\n');
    } else {
      console.log(`⚠️ Aún quedan ${verificacion[0].total} conversaciones sin id_usuario\n`);
    }
    
    // 5. Mostrar conversaciones actuales
    console.log('📋 Conversaciones actuales:\n');
    const [actuales] = await pool.query(`
      SELECT 
        c.id_conversacion,
        c.tipo_usuario,
        c.id_usuario,
        CASE
          WHEN c.id_usuario IS NOT NULL THEN CONCAT(p.nombre, ' ', p.apellido)
          ELSE c.nombre_invitado
        END as nombre_usuario,
        c.estado,
        c.mensajes_no_leidos_admin
      FROM chat_conversaciones c
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      LEFT JOIN personas p ON u.id_persona = p.id_persona
      ORDER BY c.ultima_actividad DESC
      LIMIT 10
    `);
    
    actuales.forEach(conv => {
      console.log(`${conv.id_conversacion}. ${conv.nombre_usuario} (${conv.tipo_usuario})`);
      console.log(`   Estado: ${conv.estado}, No leídos: ${conv.mensajes_no_leidos_admin}\n`);
    });
    
    console.log('✅ Limpieza completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

limpiarConversacionesDuplicadas();
