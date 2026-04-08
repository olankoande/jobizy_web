const CACHE_NAME = "jobizy-shell-v3";
const STATIC_ASSETS = ["/manifest.webmanifest", "/logo.png"];

// ── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: routing strategy ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // API calls: network-only, never cache
  if (url.pathname.startsWith("/api/") || url.port === "3001" || url.hostname.includes("api.")) {
    return; // let browser handle normally
  }

  // Navigation requests (HTML): serve index.html from cache or network
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          // cache the latest index.html while online
          if (res.ok && isSameOrigin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(async () => {
          // offline: serve cached index.html (app shell)
          const cached = await caches.match("/index.html") ?? await caches.match("/fr-CA") ?? await caches.match("/");
          return cached ?? new Response(offlinePage(), { headers: { "Content-Type": "text/html" } });
        }),
    );
    return;
  }

  // Static assets: cache-first, then network
  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // Cross-origin: network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r ?? Response.error())),
  );
});

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Jobizy", body: "Vous avez une nouvelle notification." };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Jobizy", {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

// ── Minimal offline page ───────────────────────────────────────────────────
function offlinePage() {
  return `<!doctype html>
<html lang="fr-CA">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#17352f" />
  <title>Jobizy — Hors connexion</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f4ecdf; font-family: system-ui, -apple-system, sans-serif; color: #1f2937; display: flex; align-items: center; justify-content: center; min-height: 100dvh; padding: 1.5rem; text-align: center; }
    .card { background: #fffdf9; border-radius: 20px; padding: 2.5rem 2rem; max-width: 360px; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.75rem; color: #17352f; }
    p { font-size: 0.9rem; color: #6b7280; line-height: 1.6; margin-bottom: 1.5rem; }
    button { background: #17352f; color: #fff; border: none; border-radius: 12px; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; width: 100%; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Pas de connexion</h1>
    <p>Jobizy nécessite une connexion internet. Vérifiez votre réseau et réessayez.</p>
    <button onclick="location.reload()">Réessayer</button>
  </div>
</body>
</html>`;
}
