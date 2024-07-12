// public/service-worker.js
self.addEventListener('push', function(event) {
  console.log('Push event received');
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/icon.png',
    badge: '/badge.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
});