import http from 'http';

const API_URL = 'http://localhost:3000/api/auth';

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => JSON.parse(data) });
        } catch (e) {
          resolve({ ok: false, json: () => ({ message: 'Error parsing response' }) });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testLogin(username, password, esperado) {
  console.log(`\n🔐 Probando login: ${username} / ${password}`);
  
  try {
    const response = await makeRequest(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Login exitoso: ${data.nombre} (${data.rol})`);
      console.log(`   Datos:`, data);
    } else {
      console.log(`❌ Login fallido: ${data.message}`);
    }
    
    if (esperado && response.ok === esperado) {
      console.log(`✔️  Resultado esperado`);
    } else if (esperado !== undefined) {
      console.log(`❗ Resultado inesperado (esperado: ${esperado ? 'éxito' : 'fallo'})`);
    }
    
    return response.ok;
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRUEBAS DE LOGIN - SISTEMA DASHBOARD CON CREDENCIALES SEPARADAS');
  console.log('='.repeat(70));

  // Esperar a que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n📋 PRUEBA 1: Login de Administrador');
  await testLogin('admin', 'admin123', true);

  console.log('\n📋 PRUEBA 2: Login de Mica Gomez (Alumna)');
  await testLogin('alumnamica', 'micagomez', true);

  console.log('\n📋 PRUEBA 3: Login con contraseña incorrecta');
  await testLogin('alumnamica', 'contraseña_incorrecta', false);

  console.log('\n📋 PRUEBA 4: Login de Profesor (profesor1)');
  await testLogin('profesor1', 'profesor123', true);

  console.log('\n📋 PRUEBA 5: Login de Alumno genérico (alumno1)');
  await testLogin('alumno1', 'alumno123', true);

  console.log('\n📋 PRUEBA 6: Usuario inexistente');
  await testLogin('usuarioinexistente', 'password', false);

  console.log('\n📋 PRUEBA 7: Verificar que NO funciona con credenciales del Classroom');
  console.log('   (alumnamica con password del classroom debería fallar)');
  await testLogin('alumnamica', 'alumno123', false);

  console.log('\n' + '='.repeat(70));
  console.log('✅ PRUEBAS COMPLETADAS');
  console.log('='.repeat(70));
  console.log('\n💡 RESUMEN:');
  console.log('   - Dashboard usa credenciales de tablas: alumnos, profesores, administradores');
  console.log('   - Classroom usa credenciales de tabla: usuarios');
  console.log('   - Ambos sistemas son independientes');
  console.log('   - Los usuarios pueden tener contraseñas diferentes en cada sistema');
  console.log('\n');

  process.exit(0);
}

runTests();
