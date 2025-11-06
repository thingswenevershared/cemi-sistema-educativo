// Test para verificar error en POST /api/chat/iniciar
const API_URL = 'https://cemi-sistema-educativo-production.up.railway.app/api';

async function testChatIniciar() {
  console.log('🧪 Testing POST /api/chat/iniciar...');
  
  const payload = {
    tipo_usuario: 'alumno',
    id_usuario: 1,
    nombre: 'Test Usuario',
    mensaje_inicial: 'Hola, prueba de chat'
  };
  
  try {
    const response = await fetch(`${API_URL}/chat/iniciar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 Status:', response.status);
    const data = await response.json();
    console.log('📦 Response:', data);
    
    if (!response.ok) {
      console.error('❌ Error:', data);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (error) {
    console.error('💥 Fetch error:', error);
  }
}

testChatIniciar();
