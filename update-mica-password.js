import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function updatePassword() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'proyecto_final'
  });

  try {
    console.log('🔐 Actualizando contraseña de Mica Gomez a "micagomez"...\n');
    
    // Hashear la nueva contraseña
    const newPassword = 'micagomez';
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    console.log(`Nueva contraseña: ${newPassword}`);
    console.log(`Hash generado: ${hashedPassword}\n`);
    
    // Actualizar en la base de datos
    const [result] = await pool.query(`
      UPDATE usuarios 
      SET password_hash = ? 
      WHERE username = 'alumnamica'
    `, [hashedPassword]);
    
    console.log(`✅ Contraseña actualizada. Filas afectadas: ${result.affectedRows}`);
    
    // Verificar la actualización
    const [rows] = await pool.query(`
      SELECT username, password_hash FROM usuarios WHERE username = 'alumnamica'
    `);
    
    console.log('\n📋 Datos actualizados:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Verificar que funciona
    const match = bcrypt.compareSync(newPassword, rows[0].password_hash);
    console.log(`\n🔍 Verificación: ${match ? '✅ Contraseña correcta' : '❌ Error'}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePassword();
