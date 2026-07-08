// Minimal service worker — required for PWA installability.
// Intentionally does not cache anything yet; this just satisfies the
// browser's requirement that a service worker be registered and active
// for the "Add to Home Screen" / install prompt to be offered.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Pass-through fetch handler (no offline caching yet).
self.addEventListener("fetch", (event) => {
  // Intentionally left as a network pass-through for now.
});
