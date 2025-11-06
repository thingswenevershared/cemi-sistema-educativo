/**
 * 🔥 HOT-RELOAD CLIENT
 * Script de cliente para auto-recarga en desarrollo
 * Se conecta al dev-server via WebSocket
 */

(function() {
  // Solo activar en localhost
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return;
  }

  // Solo activar si estamos en puerto 8080 (dev server)
  if (window.location.port !== '8080') {
    console.log('ℹ️ Hot-reload desactivado (no estás en dev server)');
    return;
  }

  console.log('%c🔥 HOT-RELOAD ACTIVADO', 'color: #ff6b6b; font-size: 14px; font-weight: bold;');
  console.log('%cLos cambios en archivos se reflejarán automáticamente', 'color: #4ecdc4; font-size: 12px;');

  let ws;
  let reconnectInterval;
  let isReloading = false;

  function connect() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('%c✅ Conectado al dev server', 'color: #95e1d3; font-weight: bold;');
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onmessage = (event) => {
      if (isReloading) return;

      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'reload') {
          isReloading = true;
          console.log(`%c📝 Archivo modificado: ${data.file}`, 'color: #ffd93d; font-weight: bold;');
          console.log(`%c🔄 Recargando página...`, 'color: #6bcf7f; font-weight: bold;');
          
          // Pequeño delay para que se vea el mensaje
          setTimeout(() => {
            location.reload();
          }, 200);
        }
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
      }
    };

    ws.onerror = (error) => {
      console.warn('⚠️ Error en WebSocket:', error.message);
    };

    ws.onclose = () => {
      console.log('%c🔌 Desconectado del dev server', 'color: #ff6b6b;');
      console.log('Intentando reconectar...');
      
      // Intentar reconectar cada 2 segundos
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('🔄 Intentando reconectar...');
          connect();
        }, 2000);
      }
    };
  }

  // Iniciar conexión
  connect();

  // Limpiar al cerrar la página
  window.addEventListener('beforeunload', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
    }
  });

  // Atajos de teclado útiles
  document.addEventListener('keydown', (e) => {
    // Ctrl + Shift + R: Reload forzado
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      console.log('%c🔃 Recarga forzada', 'color: #ff6b6b; font-weight: bold;');
      location.reload(true);
    }
  });

  // Indicador visual desactivado

})();
