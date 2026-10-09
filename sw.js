const CACHE_NAME = 'grit-gain-v1';
const ASSETS = [
  '/grit-and-gain/',
  '/grit-and-gain/index.html',
  '/grit-and-gain/app.html',
  '/grit-and-gain/manifest.json',
  '/grit-and-gain/icon-512.svg'
];

// Instalar y cachear
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar y limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Servir desde caché si no hay red
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Notificaciones push
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Grit & Gain', {
      body: data.body || '',
      icon: '/grit-and-gain/icon-512.svg',
      badge: '/grit-and-gain/icon-512.svg',
      data: { url: data.url || '/grit-and-gain/app.html' }
    })
  );
});

// Al hacer clic en la notificación, abrir la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const appUrl = e.notification.data?.url || '/grit-and-gain/app.html';
      for (const client of list) {
        if (client.url.includes('grit-and-gain') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(appUrl);
    })
  );
});

// Alarma semanal via setTimeout (funciona si SW está activo)
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    scheduleWeeklyReminder(e.data.day, e.data.hour);
  }
});

function scheduleWeeklyReminder(targetDay = 0, targetHour = 9) {
  // targetDay: 0=domingo, 1=lunes... 6=sábado
  function msUntilNext() {
    const now = new Date();
    const next = new Date();
    next.setHours(targetHour, 0, 0, 0);
    let daysAhead = targetDay - now.getDay();
    if (daysAhead < 0 || (daysAhead === 0 && now >= next)) daysAhead += 7;
    next.setDate(now.getDate() + daysAhead);
    return next - now;
  }

  setTimeout(() => {
    self.registration.showNotification('📸 Grit & Gain — Seguimiento semanal', {
      body: 'Es momento de registrar tu peso y hacer tus fotos de progreso.',
      icon: '/grit-and-gain/icon-512.svg',
      badge: '/grit-and-gain/icon-512.svg',
      data: { url: '/grit-and-gain/app.html#photos' }
    });
    scheduleWeeklyReminder(targetDay, targetHour);
  }, msUntilNext());
}
