// Eliminar conversaciones 29 y 30 que tienen id_usuario null
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

async function eliminarConversaciones29y30() {
  try {
    console.log('🗑️ Eliminando conversaciones 29 y 30...\n');
    
    // Ver qué hay en esas conversaciones
    const [conversaciones] = await pool.query(`
      SELECT 
        c.id_conversacion,
        c.tipo_usuario,
        c.id_usuario,
        COUNT(m.id_mensaje) as total_mensajes
      FROM chat_conversaciones c
      LEFT JOIN chat_mensajes m ON c.id_conversacion = m.id_conversacion
      WHERE c.id_conversacion IN (29, 30)
      GROUP BY c.id_conversacion
    `);
    
    console.log('📋 Conversaciones a eliminar:\n');
    conversaciones.forEach(conv => {
      console.log(`  ID ${conv.id_conversacion}: ${conv.tipo_usuario}, id_usuario=${conv.id_usuario}, mensajes=${conv.total_mensajes}`);
    });
    console.log('');
    
    // Eliminar mensajes
    const [resultMensajes] = await pool.query(`
      DELETE FROM chat_mensajes WHERE id_conversacion IN (29, 30)
    `);
    console.log(`✅ ${resultMensajes.affectedRows} mensajes eliminados`);
    
    // Eliminar estadísticas
    const [resultStats] = await pool.query(`
      DELETE FROM chat_estadisticas WHERE id_conversacion IN (29, 30)
    `);
    console.log(`✅ ${resultStats.affectedRows} estadísticas eliminadas`);
    
    // Eliminar conversaciones
    const [resultConv] = await pool.query(`
      DELETE FROM chat_conversaciones WHERE id_conversacion IN (29, 30)
    `);
    console.log(`✅ ${resultConv.affectedRows} conversaciones eliminadas\n`);
    
    // Ver conversaciones restantes
    console.log('📋 Conversaciones restantes:\n');
    const [restantes] = await pool.query(`
      SELECT 
        c.id_conversacion,
        c.tipo_usuario,
        c.id_usuario,
        CASE
          WHEN c.id_usuario IS NOT NULL THEN CONCAT(p.nombre, ' ', p.apellido)
          ELSE c.nombre_invitado
        END as nombre_usuario
      FROM chat_conversaciones c
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      LEFT JOIN personas p ON u.id_persona = p.id_persona
      ORDER BY c.ultima_actividad DESC
    `);
    
    restantes.forEach(conv => {
      console.log(`  ${conv.id_conversacion}. ${conv.nombre_usuario || 'Sin nombre'} (${conv.tipo_usuario}) - id_usuario: ${conv.id_usuario}`);
    });
    
    console.log('\n✅ Eliminación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

eliminarConversaciones29y30();
