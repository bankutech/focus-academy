// Focus Academy Thoramangalam - Service Worker with Background Sync
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background Sync API listener for offline lead inquiries
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-leads') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_SYNC_PENDING_LEADS' });
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'REGISTER_LEAD_SYNC') {
    if ('sync' in self.registration) {
      self.registration.sync.register('sync-pending-leads').catch(() => {});
    }
  }
});
