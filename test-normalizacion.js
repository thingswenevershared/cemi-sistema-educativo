import mysql from 'mysql2/promise';

async function testNormalizacion() {
  const conn = await mysql.createConnection({
    host: 'mainline.proxy.rlwy.net',
    port: 25836,
    user: 'root',
    password: 'FRlVpVLqtCfnIeJExrgJBJAOujTdICaE',
    database: 'railway'
  });

  console.log('✅ Conectado a Railway\n');

  // Test 1: Obtener admin activo
  console.log('🔍 TEST 1: Obtener administrador activo');
  const [admins] = await conn.query(`
    SELECT 
      u.username,
      u.password_hash,
      p.nombre,
      p.apellido,
      ad.nivel_acceso
    FROM usuarios u
    JOIN personas p ON u.id_persona = p.id_persona
    JOIN administradores ad ON ad.id_persona = p.id_persona
    WHERE ad.estado = 'activo'
    LIMIT 1
  `);
  console.log('Admin encontrado:', admins[0]);
  console.log('');

  // Test 2: Obtener profesor activo
  console.log('🔍 TEST 2: Obtener profesor activo');
  const [profesores] = await conn.query(`
    SELECT 
      u.username,
      p.nombre,
      p.apellido,
      pr.especialidad
    FROM usuarios u
    JOIN personas p ON u.id_persona = p.id_persona
    JOIN profesores pr ON pr.id_persona = p.id_persona
    WHERE pr.estado = 'activo'
    LIMIT 1
  `);
  console.log('Profesor encontrado:', profesores[0]);
  console.log('');

  // Test 3: Obtener alumno activo
  console.log('🔍 TEST 3: Obtener alumno activo');
  const [alumnos] = await conn.query(`
    SELECT 
      u.username,
      p.nombre,
      p.apellido,
      a.legajo
    FROM usuarios u
    JOIN personas p ON u.id_persona = p.id_persona
    JOIN alumnos a ON a.id_persona = p.id_persona
    WHERE a.estado = 'activo'
    LIMIT 1
  `);
  console.log('Alumno encontrado:', alumnos[0]);
  console.log('');

  // Test 4: Verificar que NO existen columnas antiguas
  console.log('🔍 TEST 4: Verificar que columnas redundantes fueron eliminadas');
  const [alumnosColumns] = await conn.query(`SHOW COLUMNS FROM alumnos`);
  const tieneUsuario = alumnosColumns.some(col => col.Field === 'usuario');
  const tienePassword = alumnosColumns.some(col => col.Field === 'password_hash');
  
  console.log('Tabla alumnos tiene columna "usuario":', tieneUsuario ? '❌ ERROR' : '✅ CORRECTO');
  console.log('Tabla alumnos tiene columna "password_hash":', tienePassword ? '❌ ERROR' : '✅ CORRECTO');
  console.log('');

  await conn.end();
  console.log('✅ Todas las verificaciones completadas');
}

testNormalizacion().catch(console.error);
