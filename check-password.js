import bcrypt from 'bcryptjs';

const hash = '$2b$10$FYQMeDO8G6Hc61llHmdXHu8hQjYQ7kJZDIOVn/Pzves.LA.qQbiQW';
const passwords = ['micagomez', 'alumnamica', 'Mica2024', 'password', '123456', 'mica123'];

console.log('🔐 Verificando contraseñas contra el hash de Mica Gomez...\n');

passwords.forEach(p => {
  const match = bcrypt.compareSync(p, hash);
  console.log(`Password '${p}': ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
});

process.exit(0);
