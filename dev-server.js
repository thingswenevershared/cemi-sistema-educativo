/**
 * 🔥 DEV SERVER CON HOT-RELOAD
 * Servidor de desarrollo profesional para el frontend
 * 
 * Características:
 * - Hot-reload automático al guardar archivos
 * - WebSocket para comunicación en tiempo real
 * - Watch de archivos HTML, CSS y JS
 * - Notificaciones en consola
 * 
 * Uso: npm run dev
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Crear servidor HTTP
const server = http.createServer(app);

// Crear servidor WebSocket
const wss = new WebSocketServer({ server });

// Array de clientes conectados
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 Cliente conectado al hot-reload');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 Cliente desconectado');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ Error en WebSocket:', error.message);
    clients.delete(ws);
  });
});

// Observador de archivos (watch)
const watcher = chokidar.watch('frontend/**/*', {
  ignored: [
    /(^|[\/\\])\../, // archivos ocultos
    '**/node_modules/**',
    '**/*.tmp',
    '**/*.log'
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100
  }
});

// Contador de cambios
let changeCount = 0;

watcher
  .on('change', (filePath) => {
    changeCount++;
    const fileName = path.basename(filePath);
    const relPath = path.relative(__dirname, filePath);
    
    console.log(`\n📝 [${changeCount}] Archivo modificado: ${relPath}`);
    console.log(`⏰ ${new Date().toLocaleTimeString()}`);
    
    // Notificar a todos los clientes
    let notified = 0;
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'reload',
          file: fileName,
          path: relPath,
          timestamp: Date.now()
        }));
        notified++;
      }
    });
    
    console.log(`🔄 Recargando ${notified} cliente(s)...`);
  })
  .on('add', (filePath) => {
    const relPath = path.relative(__dirname, filePath);
    console.log(`➕ Nuevo archivo detectado: ${relPath}`);
  })
  .on('unlink', (filePath) => {
    const relPath = path.relative(__dirname, filePath);
    console.log(`➖ Archivo eliminado: ${relPath}`);
  })
  .on('error', (error) => {
    console.error('❌ Error en watcher:', error);
  });

// Iniciar servidor
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DEV SERVER CON HOT-RELOAD INICIADO');
  console.log('='.repeat(60));
  console.log(`\n📍 URL: http://localhost:${PORT}`);
  console.log(`👀 Observando: frontend/**/*`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('\n💡 Tip: Abre el navegador y edita cualquier archivo del frontend');
  console.log('   Los cambios se reflejarán automáticamente!\n');
  console.log('Para detener: Ctrl+C\n');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando dev server...');
  watcher.close();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  watcher.close();
  server.close();
});
