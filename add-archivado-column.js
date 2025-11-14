// Script temporal para agregar columna archivado en Railway
import mysql from 'mysql2/promise';

const config = {
  host: 'autorack.proxy.rlwy.net',
  port: 43406,
  user: 'root',
  password: 'vHzzVOzaSRiDpUlrWbLzEbMHMaCXLbJc',
  database: 'railway'
};

async function addArchivadoColumn() {
  let connection;
  try {
    console.log('🔌 Conectando a Railway MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado exitosamente');

    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna "archivado" existe...');
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM pagos LIKE 'archivado'"
    );

    if (columns.length > 0) {
      console.log('⚠️  La columna "archivado" ya existe');
      return;
    }

    // Agregar columna archivado
    console.log('➕ Agregando columna "archivado"...');
    await connection.query(
      'ALTER TABLE pagos ADD COLUMN archivado TINYINT(1) DEFAULT 0 AFTER estado_pago'
    );
    console.log('✅ Columna "archivado" agregada exitosamente');

    // Agregar índice
    console.log('📇 Agregando índice idx_archivado...');
    await connection.query(
      'ALTER TABLE pagos ADD INDEX idx_archivado (archivado)'
    );
    console.log('✅ Índice agregado exitosamente');

    // Verificar
    const [verify] = await connection.query(
      "SHOW COLUMNS FROM pagos LIKE 'archivado'"
    );
    console.log('✅ Verificación:', verify[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️  El índice ya existe, continuando...');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

addArchivadoColumn();
