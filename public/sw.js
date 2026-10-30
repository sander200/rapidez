// Service Worker para Rapidez Moto transporte · Carora
// Gestiona el ciclo de vida PWA/WebAPK (instalación, caché offline, fetch) y notificaciones Web Push

const CACHE_NAME = "rapidez-carora-v2";
const STATIC_ASSETS = [
  "/",
  "/logo.jpg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png",
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorar errores si algún asset opcional aún no está disponible
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      ),
    ])
  );
});

// Manejador fetch obligatorio para que Android Chrome / WebAPK y PWABuilder
// reconozcan la app como instalable nativa (APK) y funcione en zonas de señal débil en Carora.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // No interceptar llamadas a la API, autenticación o rutas internas de plataforma
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/__grok/") ||
    url.pathname.startsWith("/auth/") ||
    url.searchParams.has("install")
  ) {
    return;
  }

  // Navegación HTML: Network-first con fallback a caché para modo económico de datos
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Iconos y assets estáticos de marca: Cache-first con actualización en segundo plano
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});

// Evento Web Push (Notificaciones enviadas desde el servidor)
self.addEventListener("push", (event) => {
  let payload = {
    title: "Rapidez Carora",
    body: "Tienes una nueva actualización en tu servicio de mototaxi.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "rapidez-notification",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const json = event.data.json();
      payload = { ...payload, ...json };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/pwa-192x192.png",
    badge: payload.badge || "/pwa-192x192.png",
    tag: payload.tag || "rapidez-notification",
    vibrate: payload.vibrate || [300, 100, 300],
    data: payload.data || { url: "/" },
    requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : true,
    actions: payload.actions || [
      { action: "open", title: "Abrir Rapidez" },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Evento de Mensaje desde la aplicación cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      vibrate: [200, 100, 200],
      tag: "rapidez-app-alert",
      ...options,
    };
    event.waitUntil(
      self.registration.showNotification(title || "Rapidez Carora", notificationOptions)
    );
  }
});

// Clic en la notificación: abre o enfoca la ventana de la aplicación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
