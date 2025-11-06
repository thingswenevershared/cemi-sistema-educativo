// Test: Verificar qué devuelve el endpoint /conversaciones
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

async function testConversaciones() {
  try {
    console.log('🔍 Probando query de conversaciones...\n');
    
    const query = `
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
      GROUP BY c.id_conversacion
      ORDER BY c.ultima_actividad DESC
    `;
    
    const [conversaciones] = await pool.query(query);
    
    console.log(`📋 Total conversaciones: ${conversaciones.length}\n`);
    
    conversaciones.forEach(conv => {
      console.log(`Conversación ${conv.id_conversacion}:`);
      console.log(`  tipo_usuario: ${conv.tipo_usuario}`);
      console.log(`  id_usuario: ${conv.id_usuario}`);
      console.log(`  nombre_invitado: ${conv.nombre_invitado}`);
      console.log(`  nombre_completo_usuario: ${conv.nombre_completo_usuario}`);
      console.log(`  ultimo_mensaje: ${conv.ultimo_mensaje?.substring(0, 30)}...`);
      console.log(`  estado: ${conv.estado}`);
      console.log('');
    });
    
    // Verificar manualmente la conversación 23 (Eduardo Mendoza)
    console.log('\n🔍 Verificando conversación 23 (Eduardo Mendoza) manualmente:\n');
    
    const [conv23] = await pool.query(`
      SELECT 
        c.id_conversacion,
        c.tipo_usuario,
        c.id_usuario,
        u.id_persona as usuario_id_persona,
        p.nombre as persona_nombre,
        p.apellido as persona_apellido,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo
      FROM chat_conversaciones c
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      LEFT JOIN personas p ON u.id_persona = p.id_persona
      WHERE c.id_conversacion = 23
    `);
    
    if (conv23.length > 0) {
      console.log('Resultado:', conv23[0]);
    } else {
      console.log('⚠️ No se encontró conversación 23');
    }
    
    // Verificar si Eduardo Mendoza está en usuarios
    console.log('\n🔍 Buscando Eduardo Mendoza en usuarios:\n');
    const [eduardo] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.username,
        u.id_alumno,
        u.id_persona,
        p.nombre,
        p.apellido
      FROM usuarios u
      JOIN personas p ON u.id_persona = p.id_persona
      WHERE p.nombre LIKE '%Eduardo%' AND p.apellido LIKE '%Mendoza%'
    `);
    
    if (eduardo.length > 0) {
      console.log('Eduardo Mendoza encontrado:');
      eduardo.forEach(e => {
        console.log(`  id_usuario: ${e.id_usuario}`);
        console.log(`  id_alumno: ${e.id_alumno}`);
        console.log(`  id_persona: ${e.id_persona}`);
        console.log(`  nombre: ${e.nombre} ${e.apellido}\n`);
      });
    } else {
      console.log('⚠️ Eduardo Mendoza NO encontrado en usuarios');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testConversaciones();
