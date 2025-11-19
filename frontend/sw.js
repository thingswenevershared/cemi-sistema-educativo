const CACHE_NAME = 'cemi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/assets/css/style.css',
  '/assets/css/dashboard.css',
  '/assets/js/config.js',
  '/images/logo.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Error al cachear:', err);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia: Network First, luego Cache (para contenido dinámico)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones a APIs externas
  if (url.origin !== location.origin) {
    return;
  }

  // Para peticiones a tu API backend
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clonar la respuesta porque solo puede usarse una vez
          const responseClone = response.clone();
          
          // Guardar en cache si es exitosa
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(request);
        })
    );
    return;
  }

  // Para archivos estáticos (HTML, CSS, JS, imágenes)
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Si está en cache, devolverlo
          return cachedResponse;
        }

        // Si no, hacer fetch y guardar en cache
        return fetch(request)
          .then(response => {
            // Solo cachear respuestas exitosas
            if (!response || response.status !== 200) {
              return response;
            }

            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(err => {
            console.error('[Service Worker] Fetch falló:', err);
            
            // Página offline personalizada (opcional)
            if (request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Escuchar mensajes desde la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
