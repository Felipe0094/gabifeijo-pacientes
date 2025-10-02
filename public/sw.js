const CACHE_NAME = 'gabi-feijo-v2';

// Cache apenas arquivos estáticos não versionados (sem hash)
const STATIC_ASSETS = [
  '/favicon.png',
  '/favicon.ico',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Instalação rápida sem bloquear a página
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Assume imediatamente o controle e limpa caches antigos
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Navegações (HTML): strategy network-first para evitar servir index antigo
  const isNavigationRequest =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigationRequest) {
    event.respondWith(
      (async () => {
        try {
          // Busca sempre a versão mais recente do HTML
          const networkResp = await fetch(req);
          return networkResp;
        } catch (e) {
          // Offline: tenta cair para um HTML em cache, se existir
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/index.html');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Assets e demais requests: cache-first com atualização em segundo plano
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        // Atualiza em segundo plano
        fetch(req).then((resp) => {
          if (resp && resp.ok) cache.put(req, resp.clone());
        });
        return cached;
      }
      const networkResp = await fetch(req);
      // Só cacheia respostas bem-sucedidas
      if (networkResp && networkResp.ok && req.method === 'GET') {
        cache.put(req, networkResp.clone());
      }
      return networkResp;
    })()
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gabi Feijó - Pacientes', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});