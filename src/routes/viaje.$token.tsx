import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Share2, ShieldCheck } from "lucide-react";
import type { CircleMarker, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { sharedTrip, type SharedView } from "@/lib/rapidez/live-api";

export const Route = createFileRoute("/viaje/$token")({
  component: ViajeCompartido,
});

function ViajeCompartido() {
  const { token } = Route.useParams();
  const [view, setView] = useState<SharedView | null | undefined>(undefined);

  useEffect(() => {
    let stop = false;
    const tick = () => {
      void sharedTrip({ data: token })
        .then((next) => {
          if (!stop) setView(next);
        })
        .catch(() => {
          if (!stop) setView(null);
        });
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [token]);

  const title =
    !view
      ? ""
      : view.status === "riding"
        ? "En viaje hacia el destino"
        : view.status === "accepted"
          ? "La moto va en camino"
          : view.status === "arrived"
            ? "La moto llegó al punto"
            : view.status === "done" || view.status === "pay"
              ? "Viaje finalizado"
              : view.status === "cancelled"
                ? "Viaje cancelado"
                : "Buscando mototaxi";

  const live = Boolean(
    view &&
      view.lat != null &&
      view.lng != null &&
      !["done", "cancelled", "pay"].includes(view.status),
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappText = view
    ? [
        `🛵 *Seguimiento en vivo · Rapidez Carora*`,
        `📍 *Salida:* ${view.pickup}`,
        `🏁 *Destino:* ${view.dest}`,
        view.driverName
          ? `👤 *Mototaxista:* ${view.driverName} (${view.driverModel} · Placa ${view.driverPlate})`
          : "",
        `🔗 ${shareUrl}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-6">
      <article className="w-full max-w-sm rounded-3xl bg-sheet p-5 text-ink shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-extrabold tracking-wide">RAPIDEZ · CARORA</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/30 px-2.5 py-0.5 text-xs font-bold text-ink">
            <ShieldCheck className="size-3.5" /> GPS en vivo
          </span>
        </div>
        {view === undefined && <p className="mt-4 text-sm text-muted">Cargando corrida en vivo…</p>}
        {view === null && (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">Enlace sin viaje</h1>
            <p className="mt-2 text-sm text-muted">
              Pide a quien va en la moto que te comparta nuevamente la corrida por WhatsApp.
            </p>
          </>
        )}
        {view && (
          <>
            <h1 className="mt-3 font-display text-2xl font-extrabold">{title}</h1>
            {view.driverName && (
              <div className="mt-2 rounded-2xl bg-paper p-3 text-xs">
                <p className="font-bold text-ink">Mototaxista: {view.driverName}</p>
                {(view.driverModel || view.driverPlate) && (
                  <p className="mt-0.5 font-semibold text-muted">
                    {view.driverModel} · Placa {view.driverPlate}
                  </p>
                )}
              </div>
            )}
            <div className="mt-3 space-y-1.5 text-xs">
              <p className="text-muted">Sale de</p>
              <p className="text-sm font-semibold text-ink">{view.pickup}</p>
              <p className="mt-2 text-muted">Va hacia</p>
              <p className="text-sm font-semibold text-ink">{view.dest}</p>
            </div>
            {live && view.lat != null && view.lng != null && <LiveMap lat={view.lat} lng={view.lng} />}
            {whatsappText && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-xs font-bold text-paper"
              >
                <Share2 className="size-4" />
                Reenviar corrida por WhatsApp
              </a>
            )}
            <p className="mt-3 text-center text-[11px] text-muted">
              Seguimiento de seguridad en tiempo real · Carora, Estado Lara.
            </p>
          </>
        )}
      </article>
    </main>
  );
}

function LiveMap({ lat, lng }: { lat: number; lng: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markRef = useRef<CircleMarker | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let dead = false;
    void import("leaflet").then((mod) => {
      const leaflet = mod as typeof import("leaflet") & { default?: typeof import("leaflet") };
      const L = typeof leaflet.map === "function" ? leaflet : (leaflet.default ?? leaflet);
      if (dead || !hostRef.current || mapRef.current) return;
      const map = L.map(hostRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.setView([lat, lng], 16);
      markRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        color: "#1a1c14",
        weight: 2,
        fillColor: "#e6a100",
        fillOpacity: 1,
      }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 50);
    });
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markRef.current = null;
    };
  }, []);

  useEffect(() => {
    markRef.current?.setLatLng([lat, lng]);
    mapRef.current?.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={hostRef} className="mt-4 h-52 overflow-hidden rounded-2xl" />;
}
