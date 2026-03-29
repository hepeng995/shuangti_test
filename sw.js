var CACHE_NAME = 'quiz-platform-v4';
var CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './db.js',
  './router.js',
  './quiz-core.js',
  './quiz-select.js',
  './admin.js',
  './bank-java.js'
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
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Stale-while-revalidate for Google Fonts
  if (url.indexOf('fonts.googleapis.com') !== -1 ||
      url.indexOf('fonts.gstatic.com') !== -1) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        }).catch(function() { return cached; });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cache-first for local assets
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );
});
