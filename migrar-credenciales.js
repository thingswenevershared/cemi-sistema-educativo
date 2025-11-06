import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'proyecto_final'
});

async function migrarCredenciales() {
  console.log('\n🔄 INICIANDO MIGRACIÓN DE CREDENCIALES DASHBOARD\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Agregar columnas a alumnos
    console.log('\n📋 Paso 1: Agregando columnas a tabla ALUMNOS...');
    await pool.query(`
      ALTER TABLE alumnos 
      ADD COLUMN IF NOT EXISTS usuario VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);
    console.log('✅ Columnas agregadas a alumnos');

    // 2. Agregar columnas a profesores
    console.log('\n📋 Paso 2: Agregando columnas a tabla PROFESORES...');
    await pool.query(`
      ALTER TABLE profesores 
      ADD COLUMN IF NOT EXISTS usuario VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);
    console.log('✅ Columnas agregadas a profesores');

    // 3. Crear tabla administradores
    console.log('\n📋 Paso 3: Creando tabla ADMINISTRADORES...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id_administrador INT PRIMARY KEY AUTO_INCREMENT,
        id_persona INT NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nivel_acceso ENUM('superadmin', 'admin') DEFAULT 'admin',
        estado ENUM('activo', 'inactivo') DEFAULT 'activo',
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla administradores creada');

    // 4. Crear índices
    console.log('\n📋 Paso 4: Creando índices...');
    try {
      await pool.query('CREATE INDEX idx_alumnos_usuario ON alumnos(usuario)');
    } catch (e) {
      if (!e.message.includes('Duplicate key name')) throw e;
    }
    try {
      await pool.query('CREATE INDEX idx_profesores_usuario ON profesores(usuario)');
    } catch (e) {
      if (!e.message.includes('Duplicate key name')) throw e;
    }
    try {
      await pool.query('CREATE INDEX idx_administradores_usuario ON administradores(usuario)');
    } catch (e) {
      if (!e.message.includes('Duplicate key name')) throw e;
    }
    console.log('✅ Índices creados');

    // 5. Generar hashes de contraseñas
    console.log('\n📋 Paso 5: Generando hashes de contraseñas...');
    const hashAlumno = bcrypt.hashSync('alumno123', 10);
    const hashProfesor = bcrypt.hashSync('profesor123', 10);
    const hashAdmin = bcrypt.hashSync('admin123', 10);
    const hashMica = bcrypt.hashSync('micagomez', 10);
    console.log('✅ Hashes generados');

    // 6. Inicializar credenciales de ALUMNOS
    console.log('\n📋 Paso 6: Inicializando credenciales de ALUMNOS...');
    const [alumnos] = await pool.query('SELECT id_alumno FROM alumnos WHERE usuario IS NULL');
    for (const alumno of alumnos) {
      await pool.query(`
        UPDATE alumnos 
        SET usuario = ?, password_hash = ?
        WHERE id_alumno = ?
      `, [`alumno${alumno.id_alumno}`, hashAlumno, alumno.id_alumno]);
    }
    console.log(`✅ ${alumnos.length} alumnos inicializados con usuario: alumnoX / password: alumno123`);

    // 7. Inicializar credenciales de PROFESORES
    console.log('\n📋 Paso 7: Inicializando credenciales de PROFESORES...');
    const [profesores] = await pool.query('SELECT id_profesor FROM profesores WHERE usuario IS NULL');
    for (const profesor of profesores) {
      await pool.query(`
        UPDATE profesores 
        SET usuario = ?, password_hash = ?
        WHERE id_profesor = ?
      `, [`profesor${profesor.id_profesor}`, hashProfesor, profesor.id_profesor]);
    }
    console.log(`✅ ${profesores.length} profesores inicializados con usuario: profesorX / password: profesor123`);

    // 8. Crear administrador principal
    console.log('\n📋 Paso 8: Creando administrador principal...');
    const [eduardo] = await pool.query(`
      SELECT id_persona FROM personas 
      WHERE nombre = 'Eduardo' AND apellido = 'Mendoza'
    `);
    
    if (eduardo.length > 0) {
      const [existeAdmin] = await pool.query('SELECT 1 FROM administradores WHERE usuario = "admin"');
      if (existeAdmin.length === 0) {
        await pool.query(`
          INSERT INTO administradores (id_persona, usuario, password_hash, nivel_acceso)
          VALUES (?, 'admin', ?, 'superadmin')
        `, [eduardo[0].id_persona, hashAdmin]);
        console.log('✅ Administrador principal creado: admin / admin123');
      } else {
        console.log('ℹ️  Administrador principal ya existe');
      }
    }

    // 9. Configurar credenciales específicas para Mica Gomez
    console.log('\n📋 Paso 9: Configurando credenciales específicas...');
    const [mica] = await pool.query(`
      SELECT a.id_alumno 
      FROM alumnos a
      INNER JOIN personas p ON a.id_persona = p.id_persona
      WHERE p.nombre = 'Micaela' AND p.apellido = 'Gomez'
    `);
    
    if (mica.length > 0) {
      await pool.query(`
        UPDATE alumnos 
        SET usuario = 'alumnamica', password_hash = ?
        WHERE id_alumno = ?
      `, [hashMica, mica[0].id_alumno]);
      console.log('✅ Mica Gomez: alumnamica / micagomez');
    }

    // 10. Verificación final
    console.log('\n📋 Paso 10: Verificación final...');
    const [statsAlumnos] = await pool.query(`
      SELECT COUNT(*) as total FROM alumnos 
      WHERE usuario IS NOT NULL AND password_hash IS NOT NULL
    `);
    const [statsProfesores] = await pool.query(`
      SELECT COUNT(*) as total FROM profesores 
      WHERE usuario IS NOT NULL AND password_hash IS NOT NULL
    `);
    const [statsAdmins] = await pool.query('SELECT COUNT(*) as total FROM administradores');

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`\n📊 RESUMEN:`);
    console.log(`   - Alumnos con credenciales:       ${statsAlumnos[0].total}`);
    console.log(`   - Profesores con credenciales:    ${statsProfesores[0].total}`);
    console.log(`   - Administradores:                ${statsAdmins[0].total}`);
    
    console.log(`\n🔑 CREDENCIALES POR DEFECTO:`);
    console.log(`   - Alumnos:       alumnoX / alumno123`);
    console.log(`   - Profesores:    profesorX / profesor123`);
    console.log(`   - Administrador: admin / admin123`);
    console.log(`   - Mica Gomez:    alumnamica / micagomez`);
    console.log('\n' + '='.repeat(60) + '\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

migrarCredenciales();
