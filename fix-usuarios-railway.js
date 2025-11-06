// Script para agregar columnas y sincronizar tabla usuarios en Railway
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

async function fixTablaUsuarios() {
  try {
    console.log('🔧 Iniciando fix de tabla usuarios...\n');
    
    // 1. Verificar estructura actual
    console.log('📊 Verificando estructura actual...');
    const [estructura] = await pool.query(`DESCRIBE usuarios`);
    const columnas = estructura.map(col => col.Field);
    console.log('Columnas actuales:', columnas.join(', '));
    
    // 2. Agregar columnas si no existen
    console.log('\n➕ Agregando columnas necesarias...');
    
    if (!columnas.includes('id_alumno')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN id_alumno INT NULL`);
      console.log('✅ Columna id_alumno agregada');
    } else {
      console.log('⚠️ Columna id_alumno ya existe');
    }
    
    if (!columnas.includes('id_profesor')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN id_profesor INT NULL`);
      console.log('✅ Columna id_profesor agregada');
    } else {
      console.log('⚠️ Columna id_profesor ya existe');
    }
    
    if (!columnas.includes('id_administrador')) {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN id_administrador INT NULL`);
      console.log('✅ Columna id_administrador agregada');
    } else {
      console.log('⚠️ Columna id_administrador ya existe');
    }
    
    // 3. Crear índices
    console.log('\n📇 Creando índices...');
    try {
      await pool.query(`CREATE INDEX idx_usuario_alumno ON usuarios(id_alumno)`);
      console.log('✅ Índice idx_usuario_alumno creado');
    } catch (e) {
      console.log('⚠️ Índice idx_usuario_alumno ya existe');
    }
    
    try {
      await pool.query(`CREATE INDEX idx_usuario_profesor ON usuarios(id_profesor)`);
      console.log('✅ Índice idx_usuario_profesor creado');
    } catch (e) {
      console.log('⚠️ Índice idx_usuario_profesor ya existe');
    }
    
    try {
      await pool.query(`CREATE INDEX idx_usuario_admin ON usuarios(id_administrador)`);
      console.log('✅ Índice idx_usuario_admin creado');
    } catch (e) {
      console.log('⚠️ Índice idx_usuario_admin ya existe');
    }
    
    // 4. Sincronizar ALUMNOS
    console.log('\n👨‍🎓 Sincronizando alumnos...');
    const [resultAlumnos] = await pool.query(`
      UPDATE usuarios u
      JOIN perfiles p ON u.id_perfil = p.id_perfil
      JOIN alumnos a ON u.id_persona = a.id_persona
      SET u.id_alumno = a.id_alumno
      WHERE p.nombre_perfil = 'alumno' OR p.id_perfil = 3
    `);
    console.log(`✅ ${resultAlumnos.affectedRows} alumnos sincronizados`);
    
    // 5. Sincronizar PROFESORES
    console.log('\n👨‍🏫 Sincronizando profesores...');
    const [resultProfesores] = await pool.query(`
      UPDATE usuarios u
      JOIN perfiles p ON u.id_perfil = p.id_perfil
      JOIN profesores pr ON u.id_persona = pr.id_persona
      SET u.id_profesor = pr.id_profesor
      WHERE p.nombre_perfil = 'profesor' OR p.id_perfil = 2
    `);
    console.log(`✅ ${resultProfesores.affectedRows} profesores sincronizados`);
    
    // 6. Sincronizar ADMINISTRADORES
    console.log('\n👨‍💼 Sincronizando administradores...');
    const [resultAdmins] = await pool.query(`
      UPDATE usuarios u
      JOIN perfiles p ON u.id_perfil = p.id_perfil
      JOIN administradores adm ON u.id_persona = adm.id_persona
      SET u.id_administrador = adm.id_administrador
      WHERE p.nombre_perfil = 'admin' OR p.id_perfil = 1
    `);
    console.log(`✅ ${resultAdmins.affectedRows} administradores sincronizados`);
    
    // 7. Verificar resultados
    console.log('\n📋 Verificando sincronización...\n');
    const [usuarios] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.username,
        p.nombre_perfil as perfil,
        u.id_alumno,
        u.id_profesor,
        u.id_administrador,
        CONCAT(per.nombre, ' ', per.apellido) as nombre_completo
      FROM usuarios u
      JOIN perfiles p ON u.id_perfil = p.id_perfil
      LEFT JOIN personas per ON u.id_persona = per.id_persona
      ORDER BY u.id_usuario
    `);
    
    usuarios.forEach(u => {
      console.log(`ID ${u.id_usuario}: ${u.username} (${u.perfil}) - ${u.nombre_completo}`);
      console.log(`   alumno=${u.id_alumno || 'N/A'}, profesor=${u.id_profesor || 'N/A'}, admin=${u.id_administrador || 'N/A'}\n`);
    });
    
    // 8. Verificar específicamente a Micaela Gomez
    console.log('🔍 Buscando a Micaela Gomez...\n');
    const [micaela] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.username,
        u.id_alumno,
        a.id_alumno as alumno_real,
        CONCAT(p.nombre, ' ', p.apellido) as nombre
      FROM usuarios u
      JOIN personas p ON u.id_persona = p.id_persona
      LEFT JOIN alumnos a ON u.id_persona = a.id_persona
      WHERE p.nombre LIKE '%Micaela%' OR p.apellido LIKE '%Gomez%'
    `);
    
    if (micaela.length > 0) {
      console.log('✅ Micaela Gomez encontrada:');
      micaela.forEach(m => {
        console.log(`   id_usuario: ${m.id_usuario}`);
        console.log(`   username: ${m.username}`);
        console.log(`   id_alumno: ${m.id_alumno}`);
        console.log(`   nombre: ${m.nombre}\n`);
      });
    } else {
      console.log('⚠️ No se encontró a Micaela Gomez\n');
    }
    
    console.log('✅ Sincronización completada exitosamente\n');
    console.log('🔄 Ahora los usuarios deben cerrar sesión y volver a iniciar sesión para obtener el id_usuario correcto');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixTablaUsuarios();
