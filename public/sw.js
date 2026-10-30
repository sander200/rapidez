// Service Worker para Rapidez Moto transporte · Carora
// Gestiona el ciclo de vida PWA, eventos de Web Push y notificaciones directas

const CACHE_NAME = "rapidez-v1";
const STATIC_ASSETS = ["/", "/logo.jpg", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorar errores si algún asset estático no está disponible de inmediato
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

// Evento Web Push (Notificaciones enviadas desde el servidor)
self.addEventListener("push", (event) => {
  let payload = {
    title: "Rapidez Carora",
    body: "Tienes una nueva actualización en tu servicio de mototaxi.",
    icon: "/logo.jpg",
    badge: "/logo.jpg",
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
    icon: payload.icon || "/logo.jpg",
    badge: payload.badge || "/logo.jpg",
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
// Permite que la app ordene al Service Worker mostrar notificaciones nativas en el sistema operativo
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: "/logo.jpg",
      badge: "/logo.jpg",
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
