// Script para sincronizar administradores entre tabla usuarios y tabla administradores
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function sincronizarAdministradores() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_final'
  });

  try {
    console.log('🔍 Buscando administradores en tabla usuarios...');

    // Buscar administradores en tabla usuarios que NO están en tabla administradores
    const [adminsUsuarios] = await connection.query(`
      SELECT 
        u.id_usuario,
        u.username,
        u.password_hash,
        u.id_persona,
        p.nombre,
        p.apellido
      FROM usuarios u
      JOIN perfiles pf ON u.id_perfil = pf.id_perfil
      JOIN personas p ON u.id_persona = p.id_persona
      WHERE (pf.nombre_perfil = 'admin' OR pf.nombre_perfil = 'administrador')
      AND u.id_persona NOT IN (SELECT id_persona FROM administradores)
    `);

    if (adminsUsuarios.length === 0) {
      console.log('✅ Todos los administradores ya están sincronizados');
      await connection.end();
      return;
    }

    console.log(`📝 Encontrados ${adminsUsuarios.length} administradores para sincronizar:`);
    adminsUsuarios.forEach(admin => {
      console.log(`   - ${admin.nombre} ${admin.apellido} (${admin.username})`);
    });

    // Insertar en tabla administradores
    for (const admin of adminsUsuarios) {
      await connection.query(
        `INSERT INTO administradores (id_persona, usuario, password_hash, nivel_acceso, estado)
         VALUES (?, ?, ?, 'admin', 'activo')`,
        [admin.id_persona, admin.username, admin.password_hash]
      );
      console.log(`   ✅ Sincronizado: ${admin.nombre} ${admin.apellido}`);
    }

    console.log(`\n🎉 Sincronización completada: ${adminsUsuarios.length} administradores agregados a tabla administradores`);

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
  } finally {
    await connection.end();
  }
}

sincronizarAdministradores();
