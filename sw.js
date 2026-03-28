var CACHE_NAME = 'java-quiz-v1';
var CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './quiz.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).catch(function() {
    return fetch(event.request);
  })
  );
});
