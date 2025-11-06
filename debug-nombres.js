// Debug: Verificar exactamente qué hay en la BD vs qué envía el frontend
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

async function debugNombres() {
  try {
    console.log('🔍 DEBUG: Comparando nombres en BD vs Frontend\n');
    
    // 1. Ver TODOS los usuarios con sus nombres EXACTOS
    console.log('📋 Usuarios en la BD con nombres EXACTOS:\n');
    const [usuarios] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.username,
        u.id_alumno,
        u.id_profesor,
        u.id_administrador,
        p.nombre,
        p.apellido,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        CHAR_LENGTH(p.nombre) as len_nombre,
        CHAR_LENGTH(p.apellido) as len_apellido
      FROM usuarios u
      JOIN personas p ON u.id_persona = p.id_persona
      ORDER BY u.id_usuario
    `);
    
    usuarios.forEach(u => {
      console.log(`ID ${u.id_usuario}: "${u.nombre_completo}"`);
      console.log(`  username: ${u.username}`);
      console.log(`  nombre: "${u.nombre}" (${u.len_nombre} chars)`);
      console.log(`  apellido: "${u.apellido}" (${u.len_apellido} chars)`);
      console.log(`  HEX nombre: ${Buffer.from(u.nombre).toString('hex')}`);
      console.log(`  HEX apellido: ${Buffer.from(u.apellido).toString('hex')}\n`);
    });
    
    // 2. Probar búsqueda con el nombre que envía el frontend
    const nombreFrontend = "Micaela Gomez"; // Lo que envía el login
    console.log(`\n🔍 Buscando: "${nombreFrontend}"\n`);
    
    const [resultado1] = await pool.query(`
      SELECT u.id_usuario, CONCAT(p.nombre, ' ', p.apellido) as nombre
      FROM usuarios u
      JOIN personas p ON u.id_persona = p.id_persona
      WHERE CONCAT(p.nombre, ' ', p.apellido) = ?
    `, [nombreFrontend]);
    
    console.log('Resultado búsqueda exacta:');
    if (resultado1.length > 0) {
      console.log(`✅ Encontrado: id_usuario = ${resultado1[0].id_usuario}`);
    } else {
      console.log('❌ NO encontrado con búsqueda exacta\n');
      
      // Probar con TRIM
      const [resultado2] = await pool.query(`
        SELECT u.id_usuario, CONCAT(p.nombre, ' ', p.apellido) as nombre
        FROM usuarios u
        JOIN personas p ON u.id_persona = p.id_persona
        WHERE CONCAT(TRIM(p.nombre), ' ', TRIM(p.apellido)) = ?
      `, [nombreFrontend]);
      
      console.log('Resultado con TRIM:');
      if (resultado2.length > 0) {
        console.log(`✅ Encontrado con TRIM: id_usuario = ${resultado2[0].id_usuario}`);
      } else {
        console.log('❌ NO encontrado ni con TRIM\n');
      }
    }
    
    // 3. Ver qué devuelve el login para Micaela
    console.log('\n🔍 Simulando login de Micaela:\n');
    const [loginMicaela] = await pool.query(`
      SELECT 
        a.id_alumno,
        a.usuario,
        p.id_persona,
        p.nombre,
        p.apellido,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        'alumno' as rol
      FROM alumnos a
      JOIN personas p ON a.id_persona = p.id_persona
      WHERE a.usuario = 'alumnamica'
    `);
    
    if (loginMicaela.length > 0) {
      const user = loginMicaela[0];
      console.log('Datos que devuelve el login:');
      console.log(`  nombre: "${user.nombre}"`);
      console.log(`  apellido: "${user.apellido}"`);
      console.log(`  nombre_completo: "${user.nombre_completo}"`);
      console.log(`  nombre para localStorage: "${user.nombre} ${user.apellido}"`);
      
      // Ahora buscar id_usuario con ese nombre
      const nombreLogin = `${user.nombre} ${user.apellido}`;
      console.log(`\n🔍 Buscando id_usuario con: "${nombreLogin}"\n`);
      
      const [usuarioBuscado] = await pool.query(`
        SELECT u.id_usuario
        FROM usuarios u
        JOIN personas p ON u.id_persona = p.id_persona
        WHERE CONCAT(p.nombre, ' ', p.apellido) = ?
      `, [nombreLogin]);
      
      if (usuarioBuscado.length > 0) {
        console.log(`✅ id_usuario encontrado: ${usuarioBuscado[0].id_usuario}`);
      } else {
        console.log('❌ NO se pudo encontrar id_usuario\n');
        
        // Última prueba: buscar por id_persona directamente
        const [porIdPersona] = await pool.query(`
          SELECT id_usuario FROM usuarios WHERE id_persona = ?
        `, [user.id_persona]);
        
        if (porIdPersona.length > 0) {
          console.log(`✅ Encontrado por id_persona: ${porIdPersona[0].id_usuario}`);
          console.log('⚠️ El problema es la comparación de strings del nombre');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugNombres();
