// =============================
// 🌐 CONFIGURACIÓN GLOBAL
// =============================

(function() {
  // Detectar entorno automáticamente
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  // Configurar URLs base según entorno
  const BASE_URL = isProduction 
    ? window.location.origin  // En producción usa el mismo dominio
    : 'http://localhost:3000'; // En desarrollo usa localhost

  const WS_URL = isProduction
    ? `wss://${window.location.host}` // WebSocket seguro en producción
    : 'ws://localhost:3000'; // WebSocket normal en desarrollo

  // Exportar como propiedades globales de window
  window.API_URL = `${BASE_URL}/api`;
  window.BASE_URL = BASE_URL;
  window.WS_URL = WS_URL;

  // Log para debugging
  console.log('🌐 Configuración:', {
    isProduction,
    BASE_URL,
    API_URL: window.API_URL,
    WS_URL,
    hostname: window.location.hostname
  });
})();
