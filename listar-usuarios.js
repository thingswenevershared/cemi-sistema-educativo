import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'proyecto_final'
};

async function listarUsuarios() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('\n=== ADMINISTRADORES ===');
    const [admins] = await connection.query(`
      SELECT id_administrador, usuario, 
             CASE WHEN password_hash IS NOT NULL THEN '✓ Configurado' ELSE '✗ Sin configurar' END as password_dashboard
      FROM administradores
      ORDER BY id_administrador
    `);
    console.table(admins);
    
    console.log('\n=== PROFESORES ===');
    const [profesores] = await connection.query(`
      SELECT p.id_profesor, p.id_persona, per.nombre, per.apellido, 
             p.usuario as usuario_dashboard,
             CASE WHEN p.password_hash IS NOT NULL THEN '✓ Configurado' ELSE '✗ Sin configurar' END as password_dashboard,
             u.username as usuario_classroom,
             CASE WHEN u.password_hash IS NOT NULL THEN '✓ Configurado' ELSE '✗ Sin configurar' END as password_classroom
      FROM profesores p
      INNER JOIN personas per ON p.id_persona = per.id_persona
      LEFT JOIN usuarios u ON u.id_persona = p.id_persona
      ORDER BY p.id_profesor
    `);
    console.table(profesores);
    
    console.log('\n=== ALUMNOS ===');
    const [alumnos] = await connection.query(`
      SELECT a.id_alumno, a.id_persona, per.nombre, per.apellido, 
             a.usuario as usuario_dashboard,
             CASE WHEN a.password_hash IS NOT NULL THEN '✓ Configurado' ELSE '✗ Sin configurar' END as password_dashboard,
             u.username as usuario_classroom,
             CASE WHEN u.password_hash IS NOT NULL THEN '✓ Configurado' ELSE '✗ Sin configurar' END as password_classroom
      FROM alumnos a
      INNER JOIN personas per ON a.id_persona = per.id_persona
      LEFT JOIN usuarios u ON u.id_persona = a.id_persona
      ORDER BY a.id_alumno
    `);
    console.table(alumnos);
    
    console.log('\n=== CREDENCIALES POR DEFECTO ===');
    console.log('Admin: admin / admin123');
    console.log('Profesores: profesor2, profesor3, profesor10, profesor24, profesor25 / profesor123');
    console.log('Alumnos: alumno1, alumno2, alumno3, alumno4, alumno5, alumno6 / alumno123');
    console.log('Especial: alumnamica / micagomez');
    
    console.log('\n=== USUARIOS SIN CREDENCIALES DASHBOARD ===');
    const [sinDashboard] = await connection.query(`
      SELECT 'Profesor' as tipo, p.id_profesor as id, per.nombre, per.apellido
      FROM profesores p
      INNER JOIN personas per ON p.id_persona = per.id_persona
      WHERE p.usuario IS NULL OR p.password_hash IS NULL
      UNION ALL
      SELECT 'Alumno' as tipo, a.id_alumno as id, per.nombre, per.apellido
      FROM alumnos a
      INNER JOIN personas per ON a.id_persona = per.id_persona
      WHERE a.usuario IS NULL OR a.password_hash IS NULL
    `);
    
    if (sinDashboard.length > 0) {
      console.log('\nUsuarios que necesitan credenciales Dashboard:');
      console.table(sinDashboard);
    } else {
      console.log('\nTodos los usuarios tienen credenciales Dashboard configuradas ✓');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

listarUsuarios();
