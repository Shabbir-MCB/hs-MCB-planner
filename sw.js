/**
 * HS Project Planner — Service Worker
 * =====================================
 * Caches the app "shell" (this HTML file's own static parts) so it
 * opens instantly on repeat visits, even on a weak connection — and
 * shows a friendly offline message instead of a blank error page if
 * there's truly no signal at all.
 *
 * IMPORTANT — this does NOT cache or store live project data. Every
 * BOQ row, every activity, every dashboard number still requires a
 * real connection to your Google Sheet backend, exactly as before.
 * This only speeds up and stabilizes the loading of the app's own
 * interface (the buttons, layout, styling) — never your data.
 */
const CACHE_NAME = 'hs-planner-shell-v1';
const SHELL_FILES = [
  self.location.pathname.replace('sw.js', ''), // the folder this sits in
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(SHELL_FILES.map((url) => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never intercept calls to the Google Apps Script backend — those
  // must always go straight to the network, live, every time. Only
  // the app's own static shell is ever served from cache.
  if (req.url.indexOf('script.google.com') > -1) return;

  event.respondWith(
    fetch(req).catch(() => {
      return caches.match(req).then((cached) => {
        if (cached) return cached;
        return new Response(
          '<!DOCTYPE html><html><body style="background:#0F1419;color:#E6EDF3;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;">' +
          '<div><h2>No connection</h2><p style="color:#8B949E;">This app needs the internet to load your project data. Reconnect and try again.</p></div>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
