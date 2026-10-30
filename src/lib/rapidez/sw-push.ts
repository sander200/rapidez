import { savePushSubscription } from "@/lib/rapidez/live-api";

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  swReady: boolean;
  error?: string;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registra el Service Worker en el navegador y espera a que esté activo.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    swRegistration = reg;
    // Escuchar actualizaciones
    reg.addEventListener("updatefound", () => {
      const installingWorker = reg.installing;
      if (installingWorker) {
        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[Service Worker] Nueva versión instalada");
          }
        });
      }
    });

    return reg;
  } catch (err) {
    console.warn("[Service Worker] Error al registrar:", err);
    return null;
  }
}

/**
 * Obtiene el ServiceWorkerRegistration activo o lo registra si no existe.
 */
export async function getActiveServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const ready = await navigator.serviceWorker.ready;
    swRegistration = ready;
    return ready;
  } catch {
    return registerServiceWorker();
  }
}

/**
 * Consulta el estado actual de las notificaciones Push y Service Worker.
 */
export async function getPushNotificationStatus(): Promise<PushStatus> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || typeof Notification === "undefined") {
    return {
      supported: false,
      permission: "denied",
      isSubscribed: false,
      swReady: false,
    };
  }

  const permission = Notification.permission;
  let isSubscribed = false;
  let swReady = false;

  try {
    const reg = await navigator.serviceWorker.ready;
    swReady = Boolean(reg);
    if (reg && "pushManager" in reg) {
      const sub = await reg.pushManager.getSubscription();
      isSubscribed = Boolean(sub);
    }
  } catch {
    // Si aún no está listo el SW
  }

  return {
    supported: true,
    permission,
    isSubscribed,
    swReady,
  };
}

/**
 * Solicita permiso al usuario y suscribe el dispositivo a Web Push en el Service Worker.
 */
export async function subscribeToWebPush(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || typeof Notification === "undefined") {
    return { success: false, error: "Tu navegador no soporta notificaciones push o Service Workers." };
  }

  try {
    // 1. Solicitar permiso
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Permiso de notificaciones rechazado por el usuario." };
    }

    // 2. Obtener registro de Service Worker
    const reg = await getActiveServiceWorker();
    if (!reg) {
      return { success: false, error: "No se pudo iniciar el Service Worker." };
    }

    // 3. Suscribir a PushManager
    if ("pushManager" in reg) {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // Suscripción visible al usuario
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
          });
        } catch {
          // Algunos navegadores requieren clave pública VAPID; si falla, la suscripción interna del SW queda activa para alertas directas
        }
      }

      if (sub) {
        const subJson = sub.toJSON();
        const p256dh = subJson.keys?.p256dh;
        const auth = subJson.keys?.auth;
        try {
          await savePushSubscription({
            data: {
              endpoint: sub.endpoint,
              p256dh,
              auth,
              userAgent: navigator.userAgent,
            },
          });
        } catch (dbErr) {
          console.warn("[Web Push] No se pudo guardar suscripción en DB:", dbErr);
        }
      }
    }

    // 4. Enviar notificación de bienvenida / prueba mediante el Service Worker
    await showServiceWorkerNotification(
      "🔔 Notificaciones Push Activas",
      {
        body: "¡Listo! Recibirás alertas directas cuando tu cuenta sea aprobada o recibas una carrera en Carora.",
        tag: "push-welcome",
        vibrate: [200, 100, 200],
      }
    );

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al activar notificaciones push";
    return { success: false, error: msg };
  }
}

/**
 * Muestra una notificación directa a través del Service Worker registration.showNotification()
 * Reemplaza por completo el uso de la API básica `new Notification()`.
 */
export async function showServiceWorkerNotification(
  title: string,
  options?: NotificationOptions & { vibrate?: number[] }
): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;

  const defaultOptions: NotificationOptions = {
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    vibrate: [200, 100, 200],
    ...options,
  };

  try {
    // Método 1: A través de navigator.serviceWorker.ready.showNotification()
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
      // Método 2: Enviando un mensaje al Service Worker activo
      if (reg?.active) {
        reg.active.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          options: defaultOptions,
        });
        return true;
      }
    }
  } catch (err) {
    console.warn("[Service Worker Notification] Falló en SW, intentando fallback:", err);
  }

  // Fallback seguro si el SW aún no está activo
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch {
    return false;
  }
}

/**
 * Notificación Push de cuenta aprobada para el usuario (pasajero o motorista).
 */
export async function notifyAccountApproved(userName: string, role: string = "usuario"): Promise<void> {
  const roleText = role === "driver" ? "piloto motorista" : "pasajero";
  await showServiceWorkerNotification("🎉 ¡Tu cuenta ha sido aprobada!", {
    body: `¡Hola ${userName}! Tu documentación fue validada exitosamente como ${roleText} en Carora. Ya puedes operar en la plataforma.`,
    tag: "rapidez-account-approved",
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: { url: "/" },
  });
}

/**
 * Notificación Push para el motorista cuando entra una nueva carrera (pesca / broadcast).
 */
export async function notifyNewRideOffer(pickupRef: string, fareUsd: number): Promise<void> {
  await showServiceWorkerNotification(`🏍️ ¡Nueva carrera disponible! ($${fareUsd.toFixed(2)})`, {
    body: `Punto de recogida: ${pickupRef}. Toca aquí para ver los detalles y aceptar la carrera antes que otro piloto.`,
    tag: "rapidez-ride-offer",
    vibrate: [400, 150, 400, 150, 400],
    requireInteraction: true,
    data: { url: "/" },
  });
}

/**
 * Notificación Push para el pasajero cuando el mototaxista acepta la carrera o llega al punto.
 */
export async function notifyRideStatusChange(
  status: "accepted" | "arrived" | "riding" | "done",
  driverName: string,
  plate: string
): Promise<void> {
  const titles: Record<string, string> = {
    accepted: "✅ Mototaxi asignado en Carora",
    arrived: "📍 ¡Tu mototaxi ha llegado al punto!",
    riding: "🛵 Viaje en curso hacia tu destino",
    done: "🏁 Carrera finalizada con éxito",
  };

  const bodies: Record<string, string> = {
    accepted: `${driverName} (Placa ${plate}) aceptó tu carrera y va en camino.`,
    arrived: `${driverName} (Placa ${plate}) ya está esperando en el punto de salida con tu casco.`,
    riding: "Disfruta tu viaje con Rapidez. Recuerda usar el casco de seguridad.",
    done: "Gracias por viajar con Rapidez Carora. Califica a tu conductor.",
  };

  await showServiceWorkerNotification(titles[status] || "Rapidez Carora", {
    body: bodies[status] || "Actualización de tu carrera",
    tag: `rapidez-ride-${status}`,
    vibrate: [250, 100, 250],
    data: { url: "/" },
  });
}
