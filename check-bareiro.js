import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'proyecto_final'
});

async function checkBareiro() {
  try {
    console.log('🔍 Buscando información del profesor Bareiro...\n');
    
    // Buscar en profesores
    const [profesores] = await pool.query(`
      SELECT 
        pr.id_profesor,
        pr.usuario,
        pr.password_hash,
        pr.estado,
        p.id_persona,
        p.nombre,
        p.apellido,
        p.mail
      FROM profesores pr
      INNER JOIN personas p ON pr.id_persona = p.id_persona
      WHERE p.apellido LIKE '%Bareiro%' OR p.nombre LIKE '%Bareiro%'
    `);
    
    console.log('📋 DATOS EN TABLA PROFESORES:');
    console.log(JSON.stringify(profesores, null, 2));
    
    // Buscar en usuarios (classroom)
    const [usuarios] = await pool.query(`
      SELECT 
        u.id_usuario,
        u.username,
        u.password_hash,
        p.nombre,
        p.apellido
      FROM usuarios u
      INNER JOIN personas p ON u.id_persona = p.id_persona
      WHERE p.apellido LIKE '%Bareiro%' OR p.nombre LIKE '%Bareiro%'
    `);
    
    console.log('\n📋 DATOS EN TABLA USUARIOS (CLASSROOM):');
    console.log(JSON.stringify(usuarios, null, 2));
    
    // Listar TODOS los profesores con credenciales
    const [todosProfs] = await pool.query(`
      SELECT 
        pr.id_profesor,
        pr.usuario,
        CASE WHEN pr.password_hash IS NOT NULL THEN 'Sí' ELSE 'No' END as tiene_password,
        p.nombre,
        p.apellido
      FROM profesores pr
      INNER JOIN personas p ON pr.id_persona = p.id_persona
      ORDER BY pr.id_profesor
    `);
    
    console.log('\n📋 TODOS LOS PROFESORES:');
    console.table(todosProfs);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkBareiro();
