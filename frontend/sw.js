// sw.js - Service Worker for TravelNusa PWA

const CACHE_NAME = 'travelnusa-cache-v1';
const urlsToCache = [
  '/',
  '/login.html',
  '/customer.html',
  '/index.html',
  '/customer-styles.css',
  '/styles.css',
  '/app.js',
  '/customer-app.js',
  '/auth.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
