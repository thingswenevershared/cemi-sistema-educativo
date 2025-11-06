import mysql from 'mysql2/promise';

async function checkAvatars() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'proyecto_final'
  });

  try {
    console.log('🔍 Verificando avatares en la base de datos...\n');
    
    // Verificar Mica Gomez
    const [micaRows] = await pool.query(`
      SELECT p.id_persona, p.nombre, p.apellido, p.avatar, a.id_alumno 
      FROM personas p 
      INNER JOIN alumnos a ON p.id_persona = a.id_persona 
      WHERE p.nombre LIKE '%Mica%' OR p.nombre LIKE '%Micaela%'
    `);
    
    console.log('MICA GOMEZ:');
    console.log(JSON.stringify(micaRows, null, 2));
    console.log('\n');
    
    // Verificar todos los alumnos con avatar
    const [alumnosConAvatar] = await pool.query(`
      SELECT p.id_persona, p.nombre, p.apellido, p.avatar, a.id_alumno 
      FROM personas p 
      INNER JOIN alumnos a ON p.id_persona = a.id_persona 
      WHERE p.avatar IS NOT NULL
    `);
    
    console.log('TODOS LOS ALUMNOS CON AVATAR:');
    console.log(JSON.stringify(alumnosConAvatar, null, 2));
    console.log('\n');
    
    // Verificar todas las conversaciones y sus participantes
    const [conversaciones] = await pool.query(`
      SELECT * FROM chat_conversaciones 
      ORDER BY id_conversacion DESC
    `);
    
    console.log('TODAS LAS CONVERSACIONES:');
    console.log(JSON.stringify(conversaciones, null, 2));
    console.log('\n');
    
    // Verificar mensajes de conversación 17 (Mica Gomez - alumno id=4) con avatar
    const [mensajes17] = await pool.query(`
      SELECT 
        cm.*,
        COALESCE(p_alumno.avatar, p_profesor.avatar) as avatar_remitente,
        COALESCE(p_alumno.nombre, p_profesor.nombre) as nombre_remitente
      FROM chat_mensajes cm
      LEFT JOIN alumnos a ON cm.tipo_remitente = 'alumno' AND a.id_alumno = cm.id_remitente
      LEFT JOIN personas p_alumno ON a.id_persona = p_alumno.id_persona
      LEFT JOIN profesores pr ON cm.tipo_remitente = 'profesor' AND pr.id_profesor = cm.id_remitente
      LEFT JOIN personas p_profesor ON pr.id_persona = p_profesor.id_persona
      WHERE cm.id_conversacion = 17
      ORDER BY cm.fecha_envio ASC
    `);
    
    console.log('MENSAJES DE CONVERSACIÓN 17 (MICA GOMEZ) CON AVATARES:');
    console.log(JSON.stringify(mensajes17, null, 2));
    console.log('\n');
    
    // Verificar mensajes de conversación 20 (Javier) con avatar
    const [mensajes] = await pool.query(`
      SELECT 
        cm.*,
        COALESCE(p_alumno.avatar, p_profesor.avatar) as avatar_remitente,
        COALESCE(p_alumno.nombre, p_profesor.nombre) as nombre_remitente
      FROM chat_mensajes cm
      LEFT JOIN alumnos a ON cm.tipo_remitente = 'alumno' AND a.id_alumno = cm.id_remitente
      LEFT JOIN personas p_alumno ON a.id_persona = p_alumno.id_persona
      LEFT JOIN profesores pr ON cm.tipo_remitente = 'profesor' AND pr.id_profesor = cm.id_remitente
      LEFT JOIN personas p_profesor ON pr.id_persona = p_profesor.id_persona
      WHERE cm.id_conversacion = 20
      ORDER BY cm.fecha_envio ASC
    `);
    
    console.log('MENSAJES DE CONVERSACIÓN 20 (MICA GOMEZ) CON AVATARES:');
    console.log(JSON.stringify(mensajes, null, 2));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAvatars();
