import React, { useEffect, useState } from "react";
import { Bell, BellRing, Check, ShieldCheck, X, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  getPushNotificationStatus,
  subscribeToWebPush,
  notifyAccountApproved,
  notifyNewRideOffer,
  notifyRideStatusChange,
  type PushStatus,
} from "@/lib/rapidez/sw-push";

export function PushNotificationModal({
  onClose,
  userName = "Usuario Carora",
  role = "passenger",
}: {
  onClose: () => void;
  userName?: string;
  role?: string;
}) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    void getPushNotificationStatus().then(setStatus);
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    const result = await subscribeToWebPush();
    setSubscribing(false);
    if (result.success) {
      toast.success("¡Notificaciones Web Push y Service Worker activados exitosamente!");
      void getPushNotificationStatus().then(setStatus);
    } else {
      toast.error(result.error || "No se pudo activar las notificaciones");
    }
  };

  const handleTestRideOffer = async () => {
    await notifyNewRideOffer("Plaza Bolívar frente a la Catedral de Carora", 2.0);
    toast.success("Alerta enviada a través del Service Worker");
  };

  const handleTestApproval = async () => {
    await notifyAccountApproved(userName, role);
    toast.success("Alerta de cuenta aprobada enviada a través del Service Worker");
  };

  const handleTestArrival = async () => {
    await notifyRideStatusChange("arrived", "José Pérez", "AB98CD");
    toast.success("Alerta de llegada enviada a través del Service Worker");
  };

  const isGranted = status?.permission === "granted";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-full bg-brand text-ink">
            <BellRing className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-muted">
              PWA & Service Worker
            </span>
            <h2 className="font-display text-xl font-extrabold text-ink">Alertas Web Push</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper p-1.5 text-ink shadow-sm"
          aria-label="Cerrar modal"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Las alertas funcionan mediante el <strong>Service Worker (/sw.js)</strong> y la API de Web Push,
        garantizando que recibas notificaciones directas con sonido y vibración en tu teléfono u ordenador
        cuando tu cuenta sea aprobada o recibas una carrera en Carora.
      </p>

      {/* Estado del Service Worker y Permisos */}
      <div className="rounded-2xl border border-line bg-paper p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">Registro de Service Worker:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 text-[10px] font-extrabold text-ink">
            <Check className="size-3 text-brand" /> Activo (/sw.js)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">Permiso del Sistema Operativo:</span>
          <span
            className={
              isGranted
                ? "inline-flex items-center gap-1 rounded-full bg-brand/30 px-2 py-0.5 text-[10px] font-extrabold text-ink"
                : "rounded-full bg-line px-2 py-0.5 text-[10px] font-bold text-muted"
            }
          >
            {isGranted ? "✓ Concedido" : "○ Pendiente de activación"}
          </span>
        </div>
      </div>

      {/* Botón de activación principal */}
      {!isGranted ? (
        <button
          type="button"
          disabled={subscribing}
          onClick={handleSubscribe}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-extrabold text-ink shadow-md disabled:opacity-50"
        >
          <Bell className="size-4" />
          {subscribing ? "Activando Service Worker…" : "Activar Notificaciones Web Push"}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-2xl bg-brand/20 p-2.5 text-center text-xs font-extrabold text-ink">
            ✓ Notificaciones directas configuradas y listas
          </div>

          <p className="text-[11px] font-bold text-muted pt-1">
            Prueba cómo se reciben las alertas en tu dispositivo:
          </p>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleTestRideOffer}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-bold text-paper shadow-sm"
            >
              <Zap className="size-3.5 text-brand" /> Probar Alerta de Carrera
            </button>
            <button
              type="button"
              onClick={handleTestApproval}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-xs font-bold text-ink"
            >
              <ShieldCheck className="size-3.5 text-brand" /> Probar Cuenta Aprobada
            </button>
          </div>

          <button
            type="button"
            onClick={handleTestArrival}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-sheet px-3 text-[11px] font-semibold text-ink"
          >
            Probar Alerta de Mototaxi en el punto
          </button>
        </div>
      )}

      <div className="rounded-xl bg-sheet p-2.5 text-[10px] text-muted leading-tight">
        <strong>Nota de instalación en móviles:</strong> Para recibir alertas en segundo plano cuando la pantalla esté bloqueada, instala la app en tu pantalla de inicio desde el menú de opciones del navegador.
      </div>
    </div>
  );
}
