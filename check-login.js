import mysql from 'mysql2/promise';

async function checkLogin() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'proyecto_final'
  });

  try {
    console.log('🔍 Verificando credenciales de Mica Gomez...\n');
    
    // Verificar estructura de tabla alumnos
    const [columnsAlumnos] = await pool.query(`SHOW COLUMNS FROM alumnos`);
    console.log('ESTRUCTURA TABLA ALUMNOS:');
    console.log(columnsAlumnos.map(c => c.Field).join(', '));
    console.log('\n');
    
    // Verificar datos de alumno
    const [alumnoRows] = await pool.query(`
      SELECT 
        a.*,
        p.*
      FROM alumnos a 
      INNER JOIN personas p ON a.id_persona = p.id_persona 
      WHERE p.nombre LIKE '%Mica%'
    `);
    
    console.log('DATOS DE ALUMNO (DASHBOARD):');
    console.log(JSON.stringify(alumnoRows, null, 2));
    console.log('\n');
    
    // Verificar estructura de tabla usuarios
    const [columnsUsuarios] = await pool.query(`SHOW COLUMNS FROM usuarios`);
    console.log('ESTRUCTURA TABLA USUARIOS:');
    console.log(columnsUsuarios.map(c => c.Field).join(', '));
    console.log('\n');
    
    // Verificar si existe en la tabla de usuarios (classroom)
    const [usuarioRows] = await pool.query(`
      SELECT * FROM usuarios WHERE id_persona = 4
    `);
    
    console.log('DATOS DE USUARIO (CLASSROOM):');
    console.log(JSON.stringify(usuarioRows, null, 2));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLogin();
