// Script para verificar las conversaciones duplicadas en Railway
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

async function verificarConversaciones() {
  try {
    console.log('🔍 Verificando conversaciones duplicadas...\n');
    
    // Ver todas las conversaciones
    const [conversaciones] = await pool.query(`
      SELECT 
        id_conversacion,
        tipo_usuario,
        id_usuario,
        nombre_invitado,
        estado,
        fecha_inicio,
        mensajes_no_leidos_admin
      FROM chat_conversaciones
      ORDER BY fecha_inicio DESC
      LIMIT 20
    `);
    
    console.log(`📋 Total conversaciones encontradas: ${conversaciones.length}\n`);
    
    conversaciones.forEach((conv, i) => {
      console.log(`${i + 1}. ID: ${conv.id_conversacion}`);
      console.log(`   Tipo: ${conv.tipo_usuario}`);
      console.log(`   id_usuario: ${conv.id_usuario === null ? 'NULL' : conv.id_usuario}`);
      console.log(`   Nombre: ${conv.nombre_invitado || 'N/A'}`);
      console.log(`   Estado: ${conv.estado}`);
      console.log(`   No leídos admin: ${conv.mensajes_no_leidos_admin}`);
      console.log(`   Fecha: ${conv.fecha_inicio}`);
      console.log('');
    });
    
    // Buscar duplicados por id_usuario
    console.log('\n🔍 Buscando usuarios con múltiples conversaciones...\n');
    
    const [duplicados] = await pool.query(`
      SELECT 
        tipo_usuario,
        id_usuario,
        COUNT(*) as total_conversaciones,
        GROUP_CONCAT(id_conversacion) as ids_conversaciones
      FROM chat_conversaciones
      WHERE id_usuario IS NOT NULL
      GROUP BY tipo_usuario, id_usuario
      HAVING COUNT(*) > 1
    `);
    
    if (duplicados.length > 0) {
      console.log(`⚠️ Se encontraron ${duplicados.length} usuarios con conversaciones duplicadas:\n`);
      duplicados.forEach(dup => {
        console.log(`- ${dup.tipo_usuario} ID ${dup.id_usuario}: ${dup.total_conversaciones} conversaciones`);
        console.log(`  IDs: ${dup.ids_conversaciones}\n`);
      });
    } else {
      console.log('✅ No hay usuarios con conversaciones duplicadas\n');
    }
    
    // Ver estructura de tabla usuarios
    console.log('\n📊 Estructura de tabla usuarios:\n');
    const [estructura] = await pool.query(`DESCRIBE usuarios`);
    estructura.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    // Ver usuarios en la tabla usuarios
    console.log('\n👥 Usuarios en tabla usuarios:\n');
    const [usuarios] = await pool.query(`
      SELECT *
      FROM usuarios
      LIMIT 10
    `);
    
    console.log(`Total usuarios: ${usuarios.length}\n`);
    usuarios.forEach(u => {
      console.log(`ID ${u.id_usuario}: alumno=${u.id_alumno || 'N/A'}, prof=${u.id_profesor || 'N/A'}, admin=${u.id_administrador || 'N/A'}`);
    });
    
    // Buscar alumno Micaela
    console.log('\n🔍 Buscando alumno Micaela Gomez:\n');
    const [micaela] = await pool.query(`
      SELECT a.id_alumno, a.usuario, p.nombre, p.apellido
      FROM alumnos a
      JOIN personas p ON a.id_persona = p.id_persona
      WHERE p.nombre LIKE '%Micaela%' OR p.apellido LIKE '%Gomez%'
    `);
    
    if (micaela.length > 0) {
      console.log('Alumno encontrado:');
      micaela.forEach(m => {
        console.log(`- ID Alumno: ${m.id_alumno}, Usuario: ${m.usuario}, Nombre: ${m.nombre} ${m.apellido}`);
      });
      
      // Verificar si existe en tabla usuarios
      const [enUsuarios] = await pool.query(`
        SELECT * FROM usuarios WHERE id_alumno = ?
      `, [micaela[0].id_alumno]);
      
      console.log(`\n¿Está en tabla usuarios? ${enUsuarios.length > 0 ? 'SÍ' : 'NO ⚠️'}`);
      if (enUsuarios.length > 0) {
        console.log(`id_usuario: ${enUsuarios[0].id_usuario}`);
      }
    } else {
      console.log('⚠️ No se encontró alumno Micaela Gomez');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarConversaciones();
