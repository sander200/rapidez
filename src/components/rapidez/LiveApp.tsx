import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Bike,
  Bookmark,
  Camera,
  Check,
  CloudRain,
  Copy,
  FileText,
  History,
  KeyRound,
  Layers,
  LocateFixed,
  MapPin,
  MessageSquare,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  ThumbsUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AuthPanel } from "@/components/rapidez/AuthPanel";
import { MapCanvas } from "@/components/rapidez/MapCanvas";
import { beepOffer, unlockAudio } from "@/lib/rapidez/audio";
import { PushNotificationModal } from "@/components/rapidez/PushNotificationModal";
import {
  registerServiceWorker,
  showServiceWorkerNotification,
  notifyAccountApproved,
  notifyNewRideOffer,
  notifyRideStatusChange,
} from "@/lib/rapidez/sw-push";
import {
  BANKS,
  CARORA_HOTSPOTS,
  CARORA_ROAD_NODES,
  CENTRAL_CARORA_CONFIG,
  GPS_ECO_INTERVAL_MS,
  HOME,
  MODELS,
  MVP_MAX_DRIVERS,
  MVP_MAX_PASSENGERS,
  PLACES,
  SERVICE_TIERS,
  analyzeRouteHazards,
  buildFeedbackWhatsappUrl,
  placeLabel,
  premiereAt,
  safetyPinOf,
  type LiveRoadReport,
  type Place,
  type ServiceTierId,
} from "@/lib/rapidez/data";
import {
  COMMISSION,
  OFFER_MS,
  PROXIMITY_M,
  RATE_VES,
  buildRoute,
  etaMin,
  fareFor,
  formatKm,
  formatUsd,
  formatVes,
  haversine,
  vesOf,
  type LatLng,
} from "@/lib/rapidez/geo";
import {
  acceptTrip,
  declineTrip,
  fleetList,
  listChat,
  opsBoard,
  raisePanic,
  rateTrip,
   requestTrip,
  resendDeveloperPush,
  reviewDecide,
  reviewList,
  sendChat,
  setCityWeather,
  setDriverHotspot,
  setFleetState,
  setTripStatus,
  submitMvpFeedback,
  submitProfile,
  submitRoadReport,
  syncLive,
  topUp,
  tripHistory,
  verifyTripPayment,
  voteRoadReport,
  type AuditTrip,
  type ChatLine,
  type CityWeatherState,
  type FleetDriver,
  type HistoryItem,
  type MvpFeedbackItem,
  type NearbyMoto,
  type OpsMetrics,
  type PanicItem,
  type PendingRate,
  type Profile,
  type ReviewItem,
  type TripView,
  type WeekItem,
} from "@/lib/rapidez/live-api";
import { useRapidez } from "@/lib/rapidez/store";

function deviceId() {
  const key = "rapidez-device";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function messageOf(err: unknown) {
  return err instanceof Error ? err.message : "No se pudo completar.";
}

function prettyPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  } catch {
    toast.error("No se pudo copiar");
  }
}

async function pingOffer(place: string, fareUsd: number = 2.0) {
  useRapidez.setState({ pushText: place });
  await notifyNewRideOffer(place, fareUsd);
}

async function sendBrowserPush(title: string, body: string, tag = "rapidez-dev-push") {
  await showServiceWorkerNotification(title, {
    body,
    tag,
    vibrate: [250, 100, 250],
  });
}

async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo leer la foto.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.68);
}

const DEFAULT_WEATHER: CityWeatherState = {
  tempC: 32,
  isRaining: false,
  rainMm: 0,
  windKmh: 12,
  advisory: "",
  delayMin: 0,
  conditionLabel: "Clima cálido · Carora",
};

export function LiveApp() {
  const { user, isPending } = useCurrentUserState();
  const zoomBy = useRapidez((s) => s.zoomBy);
  const phase = useRapidez((s) => s.phase);
  const showRoadLayer = useRapidez((s) => s.showRoadLayer);
  const showPin = phase === "pickup" || phase === "destination";

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  const centerOnCarora = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const lat = p.coords.latitude;
          const lng = p.coords.longitude;
          if (lat >= 10.05 && lat <= 10.35 && lng >= -70.25 && lng <= -69.9) {
            const seq = useRapidez.getState().mapSeq + 1;
            useRapidez.setState({
              center: { lat, lng },
              mapSeq: seq,
              mapCmd: { seq, type: "fly", lat, lng },
            });
            toast("Ubicación GPS en Carora actualizada");
            return;
          }
          const seq = useRapidez.getState().mapSeq + 1;
          useRapidez.setState({
            center: HOME,
            mapSeq: seq,
            mapCmd: { seq, type: "fly", lat: HOME.lat, lng: HOME.lng },
          });
          toast("Centrado en Carora, Estado Lara");
        },
        () => {
          const seq = useRapidez.getState().mapSeq + 1;
          useRapidez.setState({
            center: HOME,
            mapSeq: seq,
            mapCmd: { seq, type: "fly", lat: HOME.lat, lng: HOME.lng },
          });
          toast("Centrado en Carora, Estado Lara");
        },
        { enableHighAccuracy: true, timeout: 4000 },
      );
      return;
    }
    const seq = useRapidez.getState().mapSeq + 1;
    useRapidez.setState({
      center: HOME,
      mapSeq: seq,
      mapCmd: { seq, type: "fly", lat: HOME.lat, lng: HOME.lng },
    });
  };

  return (
    <div className="phone">
      <MapCanvas />
      <header className="top-bar absolute right-3 left-3 z-20 flex items-center gap-2">
        <div className="flex h-11 items-center gap-2 rounded-full bg-paper pr-3 pl-1 shadow-lg">
          <img
            src="/logo.jpg"
            alt="Rapidez Moto transporte"
            className="size-9 rounded-full object-cover"
          />
          <div className="leading-tight">
            <span className="block font-display text-xs font-extrabold tracking-wide text-ink">
              RAPIDEZ
            </span>
            <span className="block text-[10px] font-semibold text-muted">
              Moto transporte · Carora
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-push-modal"))}
          title="Alertas Web Push & Service Worker"
          className="ml-auto flex h-10 items-center gap-1 rounded-full bg-paper px-2.5 text-[11px] font-bold text-ink shadow-lg border border-line"
        >
          <BellRing className="size-3.5 text-brand shrink-0" />
          <span className="hidden sm:inline">Push</span>
        </button>
        <a
          href={buildFeedbackWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title="Enviar Feedback de Mejoras por WhatsApp (+5519986083932)"
          className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-3 text-[11px] font-extrabold text-ink shadow-lg"
        >
          <MessageSquare className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">Feedback</span> {CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay}
        </a>
        <div className="rounded-full bg-paper px-2.5 py-1 shadow-lg">
          <UserButton />
        </div>
      </header>
      <div className="zoom-stack">
        <button
          type="button"
          aria-label="Acercar"
          onClick={() => zoomBy(1)}
          className="grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg"
        >
          <Plus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Alejar"
          onClick={() => zoomBy(-1)}
          className="grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg"
        >
          <Minus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Mostrar u ocultar lombadas y áreas críticas"
          title="Capas de lombadas, lluvia y tránsito"
          onClick={() => {
            const next = !showRoadLayer;
            useRapidez.setState({ showRoadLayer: next });
            toast(
              next
                ? "Capa vial activa: lombadas, zonas de lluvia y tránsito visibles"
                : "Capa vial oculta en el mapa",
            );
          }}
          className={
            showRoadLayer
              ? "grid size-11 place-items-center rounded-full bg-ink text-paper shadow-lg"
              : "grid size-11 place-items-center rounded-full bg-paper text-muted shadow-lg"
          }
        >
          <Layers className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Centrar en Carora"
          onClick={centerOnCarora}
          className="grid size-11 place-items-center rounded-full bg-brand text-ink shadow-lg"
        >
          <LocateFixed className="size-5" />
        </button>
      </div>
      {showPin && (
        <div className="center-pin" aria-hidden="true">
          <MapPin className="size-12" fill="currentColor" strokeWidth={1.5} />
        </div>
      )}
      <div data-sheet className="sheet">
        <div className="sheet-in px-4 pt-3 pb-5">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
          {isPending ? (
            <p className="text-sm text-muted">Cargando tu cuenta…</p>
          ) : !user ? (
            <AuthPanel />
          ) : (
            <Desk userId={user.id} userName={user.displayName ?? "Usuario Carora"} />
          )}
        </div>
      </div>
    </div>
  );
}

function Desk({ userId, userName }: { userId: string; userName: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const [drivers, setDrivers] = useState<NearbyMoto[]>([]);
  const [trip, setTrip] = useState<TripView | null>(null);
  const [offer, setOffer] = useState<TripView | null>(null);
  const [pendingRate, setPendingRate] = useState<PendingRate | null>(null);
  const [roadReports, setRoadReports] = useState<LiveRoadReport[]>([]);
  const [weather, setWeather] = useState<CityWeatherState>(DEFAULT_WEATHER);
  const [review, setReview] = useState(false);
  const [roadModal, setRoadModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [pushModal, setPushModal] = useState(false);
  const [ecoGps, setEcoGps] = useState(true);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");
  const pos = useRef<{ lat: number; lng: number } | null>(null);
  const seenOffer = useRef("");
  const proximityNotified = useRef("");
  const prevProfileStatus = useRef<string | null>(null);
  const prevTripStatus = useRef<string | null>(null);
  const prevPendingReviews = useRef<number | null>(null);
  const staticTripRoute = useRef<{ tripId: string; pts: LatLng[] } | null>(null);
  const quote = useRef<{
    dest: { lat: number; lng: number };
    route: { lat: number; lng: number }[];
  } | null>(null);

  useEffect(() => {
    const handler = () => setPushModal(true);
    window.addEventListener("open-push-modal", handler);
    return () => window.removeEventListener("open-push-modal", handler);
  }, []);

  const onQuote = useCallback((destPoint: LatLng | null) => {
    if (!destPoint) {
      quote.current = null;
      const state = useRapidez.getState();
      if (state.phase === "pickup" || state.phase === "destination") {
        useRapidez.setState({ dest: null, route: [] });
      }
      return;
    }
    const here = useRapidez.getState().center;
    const dest = { lat: destPoint.lat, lng: destPoint.lng };
    const route = buildRoute(here, dest);
    quote.current = { dest, route };
    useRapidez.setState({ dest, route });
  }, []);

  useEffect(() => {
    useRapidez.setState({ useLive: true, fleet: [] });
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        if (lat < 10.05 || lat > 10.35 || lng < -70.25 || lng > -69.9) return;
        pos.current = { lat, lng };
        const seq = useRapidez.getState().mapSeq + 1;
        useRapidez.setState({
          center: { lat, lng },
          mapSeq: seq,
          mapCmd: { seq, type: "fly", lat, lng },
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!online || profile?.role !== "driver") return;
    if (!navigator.geolocation) return;
    // Modo Económico de GPS (8 a 10 segundos) para preservar plan de datos 3G/4G en Carora
    const pollGps = () => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const lat = p.coords.latitude;
          const lng = p.coords.longitude;
          if (lat >= 10.05 && lat <= 10.35 && lng >= -70.25 && lng <= -69.9) {
            pos.current = { lat, lng };
          }
        },
        () => undefined,
        { enableHighAccuracy: !ecoGps, maximumAge: GPS_ECO_INTERVAL_MS, timeout: 6000 },
      );
    };
    pollGps();
    const gpsTimer = setInterval(pollGps, GPS_ECO_INTERVAL_MS);
    return () => clearInterval(gpsTimer);
  }, [online, profile?.role, ecoGps]);

  const forceSync = useCallback(async () => {
    try {
      const point = pos.current ?? useRapidez.getState().center;
      const result = await syncLive({
        data: {
          deviceId: deviceId(),
          lat: point?.lat ?? null,
          lng: point?.lng ?? null,
          online,
        },
      });
      setLocked(result.locked);
      if (
        prevProfileStatus.current === "pending" &&
        result.profile?.status === "approved"
      ) {
        beepOffer();
        toast.success(
          `✅ ¡Aprobación confirmada por ${CENTRAL_CARORA_CONFIG.developerEmail}! Ya puedes usar Rapidez Carora.`,
        );
        void notifyAccountApproved(result.profile.fullName, result.profile.role);
      }
      prevProfileStatus.current = result.profile?.status ?? null;

      if (
        prevPendingReviews.current !== null &&
        result.pendingReviewsCount > prevPendingReviews.current
      ) {
        beepOffer();
        toast.info(
          `🔔 Nueva solicitud de aprobación enviada a ${CENTRAL_CARORA_CONFIG.developerEmail}`,
        );
        void sendBrowserPush(
          `Push Aprobación · ${CENTRAL_CARORA_CONFIG.developerEmail}`,
          `Hay ${result.pendingReviewsCount} expediente(s) pendiente(s) de aprobación en Rapidez Carora.`,
          "rapidez-pending-review",
        );
      }
      prevPendingReviews.current = result.pendingReviewsCount;

      setProfile(result.profile);
      setDrivers(result.drivers.filter((d) => d.id !== userId));
      setTrip(result.trip);
      setOffer(result.offer);
      setPendingRate(result.pendingRate);
      setRoadReports(result.roadReports);
      setWeather(result.weather);
      if (result.trip) quote.current = null;
      const held = result.trip ? null : quote.current;
      const fleet = result.drivers.map((d) => ({
        id: d.id,
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        elite: d.elite,
      }));
      const active = result.trip;
      const driverPoint =
        active?.driverLat != null && active.driverLng != null
          ? { lat: active.driverLat, lng: active.driverLng }
          : null;

      if (
        active &&
        active.status === "accepted" &&
        driverPoint &&
        result.profile?.role === "passenger"
      ) {
        const dist = haversine(driverPoint, { lat: active.pickupLat, lng: active.pickupLng });
        if (dist <= PROXIMITY_M && proximityNotified.current !== active.id) {
          proximityNotified.current = active.id;
          beepOffer();
          toast.success("¡Tu mototaxi está a menos de 100 metros! Ten tu casco o pago listo.");
        }
      }

      if (active && prevTripStatus.current && active.status !== prevTripStatus.current) {
        if (active.status === "accepted" && result.profile?.role === "passenger") {
          void notifyRideStatusChange("accepted", active.driverName, active.driverPlate);
        } else if (active.status === "arrived" && result.profile?.role === "passenger") {
          void notifyRideStatusChange("arrived", active.driverName, active.driverPlate);
        } else if (active.status === "riding" && result.profile?.role === "passenger") {
          void notifyRideStatusChange("riding", active.driverName, active.driverPlate);
        } else if (active.status === "done") {
          void notifyRideStatusChange("done", active.driverName, active.driverPlate);
        }
      }
      prevTripStatus.current = active?.status ?? null;

      // Cálculo de Rotas Estático: calcula la línea guía una sola vez al momento del pedido
      // para economizar datos móviles 3G/4G y procesamiento durante el viaje.
      let routePts: LatLng[] = held?.route ?? [];
      if (active) {
        if (!staticTripRoute.current || staticTripRoute.current.tripId !== active.id) {
          staticTripRoute.current = {
            tripId: active.id,
            pts: buildRoute(
              { lat: active.pickupLat, lng: active.pickupLng },
              { lat: active.destLat, lng: active.destLng },
            ),
          };
        }
        routePts = staticTripRoute.current.pts;
      } else {
        staticTripRoute.current = null;
      }

      useRapidez.setState({
        useLive: true,
        profileStatus: result.profile?.status ?? null,
        fleet,
        rainActive: result.weather.isRaining,
        roadReports: result.roadReports,
        pickup: active ? { lat: active.pickupLat, lng: active.pickupLng } : null,
        dest: active ? { lat: active.destLat, lng: active.destLng } : (held?.dest ?? null),
        driverPos: driverPoint,
        phase: phaseOf(active),
        route: routePts,
        routeIndex: 1,
      });
      if (result.offer && `${result.offer.id}:${result.offer.offerUntil}` !== seenOffer.current) {
        seenOffer.current = `${result.offer.id}:${result.offer.offerUntil}`;
        beepOffer();
        void pingOffer(result.offer.pickupRef, result.offer.fareUsd);
      }
      if (!result.offer) seenOffer.current = "";
    } catch (err) {
      setError(messageOf(err));
    }
  }, [online, userId]);

  useEffect(() => {
    let stop = false;
    const run = async () => {
      if (stop) return;
      await forceSync();
    };
    void run();
    // Modo Económico de GPS (8 a 10 segundos = 8500ms) en modo ahorro 3G/4G Carora
    const syncMs = ecoGps ? 8500 : 3500;
    const id = setInterval(() => void run(), syncMs);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [forceSync, ecoGps]);

  if (locked) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-extrabold">Un solo teléfono</h1>
        <p className="text-sm text-muted">
          Tu cuenta ya está abierta en otro dispositivo. Cierra esa sesión o espera un minuto para
          entrar desde este teléfono.
        </p>
      </div>
    );
  }

  if (profile === undefined) return <p className="text-sm text-muted">Conectando con Carora…</p>;
  if (pushModal) {
    return (
      <PushNotificationModal
        onClose={() => setPushModal(false)}
        userName={profile?.fullName || userName}
        role={profile?.role || "passenger"}
      />
    );
  }
  if (review) {
    return (
      <Review
        weather={weather}
        onClose={() => {
          setReview(false);
          void forceSync();
        }}
      />
    );
  }
  if (feedbackModal) {
    return (
      <MvpFeedbackDrawer
        onClose={() => setFeedbackModal(false)}
        onDone={() => {
          setFeedbackModal(false);
          void forceSync();
        }}
      />
    );
  }
  if (roadModal) {
    return (
      <RoadAndWeatherDrawer
        weather={weather}
        reports={roadReports}
        onClose={() => setRoadModal(false)}
        onSync={() => void forceSync()}
      />
    );
  }
  if (!profile) {
    return (
      <Cadastro
        defaultName={userName}
        onDone={() => void forceSync()}
        onReview={() => setReview(true)}
      />
    );
  }

  if (profile.status !== "approved") {
    const mailtoApprovalHref = `mailto:${CENTRAL_CARORA_CONFIG.developerEmail}?subject=${encodeURIComponent(
      `[Rapidez Carora] Solicitud de Aprobación — ${profile.fullName} (${profile.cedula})`,
    )}&body=${encodeURIComponent(
      [
        "Hola Desarrollador Rapidez Carora (beisander2@gmail.com),",
        "",
        "Solicito la aprobación de mi expediente en la aplicación:",
        `• Rol: ${profile.role === "driver" ? "Mototaxista (Frota 5 Motos)" : "Pasajero (MVP 15)"}`,
        `• Nombre: ${profile.fullName}`,
        `• Cédula: ${profile.cedula}`,
        `• Teléfono: ${profile.phone}`,
        profile.role === "driver" ? `• Moto: ${profile.model} · Placa: ${profile.plate}` : "",
        "",
        "Ya subí mi Selfie obligatoria y mi Cédula de Identidad.",
      ]
        .filter(Boolean)
        .join("\n"),
    )}`;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-bold text-ink">
            {profile.role === "driver" ? "Expediente Mototaxista" : "Expediente Pasajero"}
          </span>
          <span>{profile.cedula}</span>
        </div>
        <h1 className="font-display text-2xl font-extrabold">
          {profile.status === "rejected"
            ? "Hay que corregir documentos"
            : profile.status === "blocked"
              ? "Unidad bloqueada"
              : "Aprobación enviada a beisander2@gmail.com"}
        </h1>
        <p className="text-xs text-muted">
          {profile.status === "rejected"
            ? profile.rejectNote ||
              "La administración solicitó volver a tomar tu selfie o documento con mayor claridad."
            : profile.status === "blocked"
              ? "La administración bloqueó esta unidad temporalmente."
              : `Recibimos tu Cédula, Selfie obligatoria y documentación. Se envió una notificación Push / Email a ${CENTRAL_CARORA_CONFIG.developerEmail} para aprobar tu cuenta.`}
        </p>
        <div className="rounded-2xl border border-line bg-paper p-3 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-bold text-ink">
              {profile.fullName} · {profile.phone}
            </p>
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-ink">
              Push → {CENTRAL_CARORA_CONFIG.developerEmail}
            </span>
          </div>
          {profile.role === "driver" && (
            <p className="mt-0.5 text-muted">
              Moto: {profile.model} · Placa {profile.plate} · {profile.bankName}
            </p>
          )}
        </div>

        <button
          type="button"
          className="h-11 rounded-full bg-brand text-xs font-extrabold text-ink shadow-sm"
          onClick={() => {
            void resendDeveloperPush({ data: {} })
              .then(() => {
                toast.success(
                  `Notificación Push / Email enviada a ${CENTRAL_CARORA_CONFIG.developerEmail}`,
                );
                void sendBrowserPush(
                  "Solicitud de Aprobación Enviada",
                  `Se notificó a ${CENTRAL_CARORA_CONFIG.developerEmail} para aprobar a ${profile.fullName}.`,
                );
              })
              .catch((err) => toast.error(messageOf(err)));
          }}
        >
          Reenviar Push / Email a {CENTRAL_CARORA_CONFIG.developerEmail}
        </button>

        <button
          type="button"
          onClick={() => setPushModal(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-brand bg-paper text-xs font-bold text-ink shadow-sm"
        >
          <BellRing className="size-3.5 text-brand" />
          Alertas Web Push (Alerta de Aprobación en Service Worker)
        </button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={mailtoApprovalHref}
            className="flex h-10 items-center justify-center rounded-full border border-line bg-paper px-3 text-xs font-bold text-ink"
          >
            Abrir Email Directo
          </a>
          <button
            type="button"
            className="h-10 rounded-full bg-ink px-3 text-xs font-bold text-paper"
            onClick={() => setReview(true)}
          >
            Bandeja Desarrollador
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            type="button"
            className="font-semibold text-muted underline"
            onClick={() => setProfile(null)}
          >
            Actualizar fotos o documentos
          </button>
          <button
            type="button"
            className="font-bold text-ink underline"
            onClick={() => setFeedbackModal(true)}
          >
            Feedback ({CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay})
          </button>
        </div>
      </div>
    );
  }

  if (profile.role === "driver") {
    return (
      <DriverDesk
        profile={profile}
        online={online}
        ecoGps={ecoGps}
        onToggleEco={() => {
          const next = !ecoGps;
          setEcoGps(next);
          toast(
            next
              ? "Modo Económico 3G/4G activado (GPS cada 8–10s)"
              : "Modo GPS rápido activado (3.5s)",
          );
        }}
        offer={trip?.driverId === userId ? null : offer}
        trip={trip?.driverId === userId ? trip : null}
        pendingRate={pendingRate}
        weather={weather}
        roadReports={roadReports}
        error={error}
        onSync={() => void forceSync()}
        onOpenRoadModal={() => setRoadModal(true)}
        onOpenFeedback={() => setFeedbackModal(true)}
        onOnline={(value) => {
          unlockAudio();
          if (value && !pos.current) pos.current = { ...useRapidez.getState().center };
          setOnline(value);
        }}
        onPin={() => {
          pos.current = { ...useRapidez.getState().center };
          setOnline(true);
          void forceSync();
          toast.success("Ubicación GPS de tu moto actualizada en el mapa de Carora");
        }}
        onSelectHotspot={(hs) => {
          pos.current = { lat: hs.lat, lng: hs.lng };
          const seq = useRapidez.getState().mapSeq + 1;
          useRapidez.setState({
            center: { lat: hs.lat, lng: hs.lng },
            mapSeq: seq,
            mapCmd: { seq, type: "fly", lat: hs.lat, lng: hs.lng },
          });
          setOnline(true);
          void setDriverHotspot({
            data: { hotspotId: hs.id, lat: hs.lat, lng: hs.lng },
          }).then(() => {
            toast.success(`Posicionado en Hotspot: ${hs.shortName}`);
            void forceSync();
          });
        }}
        onReview={() => setReview(true)}
        onOpenPushModal={() => setPushModal(true)}
      />
    );
  }

  if (!trip && pendingRate) {
    return <RateCard item={pendingRate} onDone={() => void forceSync()} />;
  }

  return (
    <PassengerDesk
      nearby={drivers}
      rating={profile.rating}
      ratingCount={profile.ratingCount}
      trip={trip}
      weather={weather}
      roadReports={roadReports}
      ecoGps={ecoGps}
      onToggleEco={() => {
        const next = !ecoGps;
        setEcoGps(next);
        toast(
          next
            ? "Modo Económico 3G/4G activado (ahorro de datos en Carora)"
            : "Sincronización rápida activada",
        );
      }}
      error={error}
      onQuote={onQuote}
      onSync={() => void forceSync()}
      onOpenRoadModal={() => setRoadModal(true)}
      onOpenFeedback={() => setFeedbackModal(true)}
      onOpenPushModal={() => setPushModal(true)}
      onReview={() => setReview(true)}
      onRequest={async (destPoint, destName, pickupText, pay, point, tierId, cashTendered) => {
        unlockAudio();
        const here = pos.current ?? useRapidez.getState().center;
        setError("");
        try {
          const cleanPickupRef = pickupText.trim()
            ? `${placeLabel(here)} (${pickupText.trim()})`
            : placeLabel(here);
          const cleanDestRef = point.trim()
            ? `${destName} · ${point.trim()}`
            : `${destName} · Punto principal`;
          await requestTrip({
            data: {
              pickupLat: here.lat,
              pickupLng: here.lng,
              pickupRef: cleanPickupRef,
              destLat: destPoint.lat,
              destLng: destPoint.lng,
              destRef: cleanDestRef,
              payMethod: pay,
              preferredDriverId: null,
              serviceTier: tierId,
              cashTendered,
            },
          });
          await forceSync();
          toast.success("Disparo simultáneo enviado a las 5 motos de la flota en Carora");
        } catch (err) {
          setError(messageOf(err));
        }
      }}
      onCancel={async () => {
        if (!trip) return;
        await setTripStatus({ data: { tripId: trip.id, status: "cancelled" } });
        await forceSync();
        toast("Carrera cancelada");
      }}
    />
  );
}

function WeatherAndTrafficBar({
  weather,
  reportsCount,
  ecoGps = true,
  onToggleEco,
  onOpenRoadModal,
  onOpenPushModal,
}: {
  weather: CityWeatherState;
  reportsCount: number;
  ecoGps?: boolean;
  onToggleEco?: () => void;
  onOpenRoadModal: () => void;
  onOpenPushModal?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-paper px-3 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-1.5">
          {weather.isRaining ? (
            <CloudRain className="size-4 shrink-0 text-signal" />
          ) : (
            <Sun className="size-4 shrink-0 text-brand" />
          )}
          <span className="truncate font-bold text-ink">
            {weather.tempC}°C · {weather.conditionLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onOpenPushModal && (
            <button
              type="button"
              onClick={onOpenPushModal}
              title="Alertas Web Push & Service Worker"
              className="flex items-center gap-1 rounded-full bg-brand/30 px-2 py-1 text-[10px] font-extrabold text-ink whitespace-nowrap"
            >
              <Bell className="size-3 text-brand shrink-0" />
              <span>Push</span>
            </button>
          )}
          {onToggleEco && (
            <button
              type="button"
              onClick={onToggleEco}
              title="Modo Económico de GPS (8–10s) para ahorrar datos 3G/4G en Carora"
              className={
                ecoGps
                  ? "rounded-full bg-brand/30 px-2 py-1 text-[10px] font-extrabold text-ink whitespace-nowrap"
                  : "rounded-full border border-line bg-sheet px-2 py-1 text-[10px] font-semibold text-muted whitespace-nowrap"
              }
            >
              {ecoGps ? "3G Eco 9s" : "GPS 3s"}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenRoadModal}
            className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-paper whitespace-nowrap"
          >
            Vialidad ({CARORA_ROAD_NODES.length + reportsCount})
          </button>
        </div>
      </div>

      {weather.isRaining && (
        <div className="flex items-start justify-between gap-2 rounded-2xl bg-signal px-3 py-2 text-xs text-paper">
          <div>
            <p className="font-extrabold">
              Aviso por lluvia en Carora (+{weather.delayMin} min de retraso estimado)
            </p>
            <p className="mt-0.5 text-[11px] text-paper/90">
              {weather.advisory ||
                "Precaución en áreas críticas: Quebrada de Carora, Río Morere y Av. Francisco de Miranda."}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRoadModal}
            className="shrink-0 rounded-lg bg-paper px-2 py-1 text-[10px] font-extrabold text-ink whitespace-nowrap"
          >
            Ver zonas
          </button>
        </div>
      )}
    </div>
  );
}

function RouteHazardsSummary({
  route,
  roadReports,
  isRaining,
  onOpenRoadModal,
}: {
  route: LatLng[];
  roadReports: LiveRoadReport[];
  isRaining: boolean;
  onOpenRoadModal: () => void;
}) {
  const analysis = analyzeRouteHazards(route, roadReports, isRaining);
  const totalAlerts =
    analysis.speedBumps.length +
    analysis.rainZones.length +
    analysis.trafficHotspots.length +
    analysis.liveReports.length;

  if (totalAlerts === 0 && !isRaining) return null;

  return (
    <div className="rounded-2xl border border-line bg-paper px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-extrabold text-ink"> Información vial en tu trayecto</span>
        <button
          type="button"
          onClick={onOpenRoadModal}
          className="text-[11px] font-bold text-ink underline whitespace-nowrap"
        >
          Ver mapa vial
        </button>
      </div>
      <div className="mt-1 space-y-0.5 text-[11px] text-muted">
        {analysis.speedBumps.length > 0 && (
          <p>
            <span className="font-bold text-ink">
              {analysis.speedBumps.length}{" "}
              {analysis.speedBumps.length === 1 ? "lombada / reductor" : "lombadas / reductores"}:
            </span>{" "}
            {analysis.speedBumps.map((b) => b.name).join(" · ")}
          </p>
        )}
        {analysis.rainZones.length > 0 && (
          <p className={isRaining ? "font-bold text-signal" : ""}>
            <span className="font-bold text-ink">
              {analysis.rainZones.length === 1 ? "Área crítica de lluvia:" : "Áreas críticas de lluvia:"}
            </span>{" "}
            {analysis.rainZones.map((z) => z.name).join(" · ")}
            {isRaining ? ` (+${analysis.extraRainMinutes} min por lluvia)` : " (precaución si llueve)"}
          </p>
        )}
        {analysis.trafficHotspots.length > 0 && (
          <p>
            <span className="font-bold text-ink">Tránsito activo:</span>{" "}
            {analysis.trafficHotspots.map((t) => t.name).join(" · ")}
          </p>
        )}
        {analysis.liveReports.length > 0 && (
          <p className="font-semibold text-signal">
            Reporte comunitario en ruta:{" "}
            {analysis.liveReports.map((r) => `${r.label} (${r.sector})`).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function RoadAndWeatherDrawer({
  weather,
  reports,
  onClose,
  onSync,
}: {
  weather: CityWeatherState;
  reports: LiveRoadReport[];
  onClose: () => void;
  onSync: () => void;
}) {
  const center = useRapidez((s) => s.center);
  const [kind, setKind] = useState<
    "lombada_hueco" | "lluvia_anegado" | "trafico_cierre" | "alcabala_operativo"
  >("lombada_hueco");
  const [label, setLabel] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"mapa" | "reportar">("mapa");

  const focusNode = (node: { lat: number; lng: number; name: string }) => {
    const seq = useRapidez.getState().mapSeq + 1;
    useRapidez.setState({
      showRoadLayer: true,
      center: { lat: node.lat, lng: node.lng },
      mapSeq: seq,
      mapCmd: { seq, type: "fly", lat: node.lat, lng: node.lng },
    });
    toast(`Centrado en ${node.name}`);
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-muted">
            Tránsito, Lombadas y Clima · Carora
          </span>
          <h1 className="font-display text-2xl font-extrabold">Radar Vial Carora</h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink"
        >
          Volver
        </button>
      </div>

      {/* Weather & Rain Delay Status Card */}
      <div
        className={
          weather.isRaining
            ? "rounded-2xl bg-signal p-3 text-xs text-paper"
            : "rounded-2xl bg-paper p-3 text-xs text-ink"
        }
      >
        <div className="flex items-center justify-between">
          <span className="font-extrabold">
            {weather.tempC}°C · {weather.conditionLabel}
          </span>
          <button
            type="button"
            onClick={() => {
              void setCityWeather({
                data: {
                  rainMode: !weather.isRaining,
                  delayMin: !weather.isRaining ? 4 : 0,
                },
              }).then(() => {
                toast.success(
                  !weather.isRaining
                    ? "Alerta por lluvia y retrasos activada en Carora"
                    : "Alerta de lluvia desactivada · Vías secas",
                );
                onSync();
              });
            }}
            className={
              weather.isRaining
                ? "rounded-full bg-paper px-2.5 py-1 text-[11px] font-extrabold text-ink whitespace-nowrap"
                : "rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-paper whitespace-nowrap"
            }
          >
            {weather.isRaining ? "Marcar fin de lluvia" : "Reportar lluvia en Carora"}
          </button>
        </div>
        <p className="mt-1 text-[11px] opacity-90">
          {weather.isRaining
            ? `Aviso activo: +${weather.delayMin} min de retraso estimado por pavimento mojado y pasos de quebrada.`
            : "Vías principales secas. Si comienza a llover en tu sector, activa el aviso para alertar a las motos."}
        </p>
      </div>

      {/* Mode Switch */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-paper p-1">
        <button
          type="button"
          onClick={() => setTab("mapa")}
          className={
            tab === "mapa"
              ? "h-9 rounded-xl bg-ink text-xs font-bold text-paper"
              : "h-9 rounded-xl text-xs font-semibold text-muted"
          }
        >
          Lombadas y Zonas Críticas
        </button>
        <button
          type="button"
          onClick={() => setTab("reportar")}
          className={
            tab === "reportar"
              ? "h-9 rounded-xl bg-ink text-xs font-bold text-paper"
              : "h-9 rounded-xl text-xs font-semibold text-muted"
          }
        >
          Reportar en la Vía (+1)
        </button>
      </div>

      {tab === "reportar" ? (
        <div className="space-y-2.5 rounded-2xl border border-line bg-paper p-3">
          <p className="text-xs font-bold text-ink">
            Reportar novedad vial en <span className="underline">{placeLabel(center)}</span>
          </p>
          <p className="text-[11px] text-muted">
            Mueve el pin en el mapa al punto exacto o elige el tipo de alerta para avisar a todos los
            mototaxistas y pasajeros de Carora:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["lombada_hueco", "Lombada / Hueco"],
                ["lluvia_anegado", "Calle anegada / Lluvia"],
                ["trafico_cierre", "Trancón / Vía cerrada"],
                ["alcabala_operativo", "Punto de control"],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={
                  kind === id
                    ? "h-10 rounded-xl bg-ink px-2.5 text-xs font-bold text-paper"
                    : "h-10 rounded-xl border border-line bg-sheet px-2.5 text-xs font-semibold text-ink"
                }
              >
                {text}
              </button>
            ))}
          </div>
          <input
            className="field h-10 text-sm"
            placeholder="Detalle opcional (ej. hueco grande frente a panadería)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => {
              setSending(true);
              void submitRoadReport({
                data: {
                  kind,
                  label,
                  lat: center.lat,
                  lng: center.lng,
                },
              })
                .then(() => {
                  toast.success("Reporte vial publicado en el mapa de Carora");
                  setLabel("");
                  setTab("mapa");
                  onSync();
                })
                .catch((err) => toast.error(messageOf(err)))
                .finally(() => setSending(false));
            }}
            className="h-11 w-full rounded-full bg-brand text-xs font-extrabold text-ink shadow-sm disabled:opacity-40"
          >
            {sending ? "Publicando en mapa…" : "Publicar alerta en el mapa de Carora"}
          </button>
        </div>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
          {reports.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-extrabold text-ink">
                Reportes en vivo de usuarios ({reports.length})
              </p>
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-paper p-2.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => focusNode({ lat: r.lat, lng: r.lng, name: r.label })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-bold text-ink">{r.label}</p>
                    <p className="text-[11px] text-muted">
                      {r.sector} · por {r.authorName} · {r.when}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        void voteRoadReport({ data: { reportId: r.id, delta: 1 } }).then(onSync)
                      }
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-brand/30 px-2.5 text-[11px] font-bold text-ink"
                    >
                      <ThumbsUp className="size-3" /> {r.upvotes}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void voteRoadReport({ data: { reportId: r.id, delta: -1 } }).then(onSync)
                      }
                      className="h-8 rounded-full bg-sheet px-2 text-[11px] font-semibold text-muted"
                    >
                      Ya pasó
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-ink">
              Áreas críticas cuando llueve (Quebradas y Drenajes)
            </p>
            {CARORA_ROAD_NODES.filter((n) => n.kind === "rain_critical").map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => focusNode(node)}
                className="flex w-full items-start justify-between gap-2 rounded-2xl bg-paper p-2.5 text-left text-xs"
              >
                <div>
                  <p className="font-bold text-ink">{node.name}</p>
                  <p className="text-[11px] text-muted">{node.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] font-extrabold text-signal whitespace-nowrap">
                  +{node.rainDelayMin} min lluvia
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-ink">
              Lombadas / Policías Acostados en Carora
            </p>
            {CARORA_ROAD_NODES.filter((n) => n.kind === "speed_bump").map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => focusNode(node)}
                className="flex w-full items-start justify-between gap-2 rounded-2xl bg-paper p-2.5 text-left text-xs"
              >
                <div>
                  <p className="font-bold text-ink">{node.name}</p>
                  <p className="text-[11px] text-muted">{node.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-ink whitespace-nowrap">
                  Ver en mapa
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-ink">Puntos de Tránsito Pesado</p>
            {CARORA_ROAD_NODES.filter((n) => n.kind === "traffic_hotspot").map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => focusNode(node)}
                className="flex w-full items-start justify-between gap-2 rounded-2xl bg-paper p-2.5 text-left text-xs"
              >
                <div>
                  <p className="font-bold text-ink">{node.name}</p>
                  <p className="text-[11px] text-muted">{node.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-muted whitespace-nowrap">
                  +{node.rainDelayMin} min
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function phaseOf(trip: TripView | null) {
  if (!trip) return "pickup" as const;
  if (trip.status === "open") return "searching" as const;
  if (trip.status === "accepted") return "enroute" as const;
  if (trip.status === "arrived") return "arrived" as const;
  if (trip.status === "riding") return "riding" as const;
  if (trip.status === "pay") return "pay" as const;
  return "done" as const;
}

function targetOf(trip: TripView) {
  if (trip.status === "riding" || trip.status === "pay") {
    return { lat: trip.destLat, lng: trip.destLng };
  }
  return { lat: trip.pickupLat, lng: trip.pickupLng };
}

function Cadastro({
  defaultName,
  onDone,
  onReview,
}: {
  defaultName: string;
  onDone: () => void;
  onReview: () => void;
}) {
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [cedula, setCedula] = useState("");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState<string>(MODELS[0]);
  const [bankPhone, setBankPhone] = useState("");
  const [bankName, setBankName] = useState<string>(BANKS[0].name);
  const [cedulaPhoto, setCedulaPhoto] = useState("");
  const [selfie, setSelfie] = useState("");
  const [circulationPhoto, setCirculationPhoto] = useState("");
  const [licenseGrade, setLicenseGrade] = useState("2da Grado (Moto)");
  const [medicalCert, setMedicalCert] = useState(true);
  const [criminalRecordOk, setCriminalRecordOk] = useState(true);
  const [activeCamera, setActiveCamera] = useState<
    null | { target: "selfie" | "cedula" | "circulation"; facingMode: "user" | "environment"; title: string }
  >(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onFile(file: File | undefined, set: (value: string) => void) {
    if (!file) return;
    try {
      set(await shrink(file));
      setError("");
    } catch (err) {
      setError(messageOf(err));
    }
  }

  const missingPhotos =
    !cedulaPhoto || !selfie || (role === "driver" && !circulationPhoto);
  const missingFields =
    fullName.trim().length < 3 ||
    phone.replace(/\D/g, "").length < 10 ||
    cedula.replace(/\D/g, "").length < 6 ||
    (role === "driver" &&
      (plate.trim().length < 4 ||
        (bankPhone || phone).replace(/\D/g, "").length < 10 ||
        !medicalCert ||
        !criminalRecordOk));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-wide text-muted">
            Operación Controlada · Carora ({MVP_MAX_DRIVERS} Motos · {MVP_MAX_PASSENGERS} Pasajeros MVP)
          </span>
          <h1 className="font-display text-2xl font-extrabold">Filtro de Catastro Físico</h1>
        </div>
        <ShieldCheck className="size-7 text-brand" />
      </div>
      <p className="text-xs text-muted">
        {role === "passenger"
          ? `Base inicial de ${MVP_MAX_PASSENGERS} pasajeros verificados en Carora. Tu Cédula y Selfie en vivo son obligatorias.`
          : `Frota inicial de ${MVP_MAX_DRIVERS} pilotos con retención del 90% por carrera. Requiere Cédula, Licencia 2da/3ra, Certificado Médico y Antecedentes.`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={
            role === "passenger"
              ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper"
              : "h-11 rounded-full bg-paper text-sm font-semibold"
          }
          onClick={() => setRole("passenger")}
        >
          Soy Pasajero (MVP)
        </button>
        <button
          type="button"
          className={
            role === "driver"
              ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper"
              : "h-11 rounded-full bg-paper text-sm font-semibold"
          }
          onClick={() => setRole("driver")}
        >
          Soy Piloto (Frota 5)
        </button>
      </div>

      <input
        className="field"
        aria-label="Nombre y apellido"
        placeholder="Nombre y apellido completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="field"
          aria-label="Teléfono"
          inputMode="numeric"
          placeholder="Teléfono (ej. 04145551234)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="field"
          aria-label="Cédula"
          placeholder="Cédula (ej. V-19888777)"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
      </div>

      {role === "driver" && (
        <div className="grid gap-2 rounded-2xl border border-line bg-paper/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-ink">
              Filtro Físico: Moto, Licencia, Médico y Antecedentes
            </p>
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-ink">
              90% Piloto / 10% Central
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="field"
              placeholder="Placa (ej. AB12CD)"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
            />
            <select
              className="field"
              aria-label="Modelo de moto"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="field"
              aria-label="Banco Pago Móvil"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            >
              {BANKS.map((item) => (
                <option key={item.code} value={item.name}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
            <input
              className="field"
              inputMode="numeric"
              placeholder="Tel. Pago Móvil (0412...)"
              value={bankPhone}
              onChange={(e) => setBankPhone(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="field text-xs"
              aria-label="Grado de Licencia"
              value={licenseGrade}
              onChange={(e) => setLicenseGrade(e.target.value)}
            >
              <option value="2da Grado (Moto)">Licencia 2da Grado (Moto)</option>
              <option value="3ra Grado">Licencia 3ra Grado</option>
            </select>
            <label className="flex items-center gap-1.5 rounded-xl bg-sheet px-2.5 py-1.5 text-[11px] font-bold text-ink">
              <input
                type="checkbox"
                checked={medicalCert}
                onChange={(e) => setMedicalCert(e.target.checked)}
              />
              Certificado Médico Vial
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-xl bg-sheet px-2.5 py-2 text-[11px] font-bold text-ink">
            <input
              type="checkbox"
              checked={criminalRecordOk}
              onChange={(e) => setCriminalRecordOk(e.target.checked)}
            />
            Declaración de Antecedentes Penales limpios + Validación presencial en Central Carora
          </label>
        </div>
      )}

      {/* Mandatory Verification Photos Section */}
      <div className="space-y-2 rounded-2xl border border-line bg-paper p-3">
        <p className="text-xs font-extrabold text-ink">
          Verificación biométrica y documental (Obligatoria)
        </p>

        <div className="grid grid-cols-2 gap-2">
          <PhotoCaptureCard
            label="1. Foto de Cédula *"
            sublabel="Documento legible"
            photo={cedulaPhoto}
            capture="environment"
            onOpenCamera={() =>
              setActiveCamera({
                target: "cedula",
                facingMode: "environment",
                title: "Fotografiar Cédula de Identidad",
              })
            }
            onFile={(file) => void onFile(file, setCedulaPhoto)}
          />
          <PhotoCaptureCard
            label="2. Selfie en vivo *"
            sublabel="Rostro descubierto"
            photo={selfie}
            capture="user"
            onOpenCamera={() =>
              setActiveCamera({
                target: "selfie",
                facingMode: "user",
                title: "Tomar Selfie Obligatoria",
              })
            }
            onFile={(file) => void onFile(file, setSelfie)}
          />
        </div>

        {role === "driver" && (
          <PhotoCaptureCard
            label="3. Licencia 2da/3ra + Carnet de Circulación + Cert. Médico *"
            sublabel="Foto de Licencia vigente, Certificado Médico y Carnet de Circulación de la moto"
            photo={circulationPhoto}
            capture="environment"
            onOpenCamera={() =>
              setActiveCamera({
                target: "circulation",
                facingMode: "environment",
                title: "Fotografiar Documentación Completa del Piloto",
              })
            }
            onFile={(file) => void onFile(file, setCirculationPhoto)}
          />
        )}
      </div>

      {activeCamera && (
        <CameraModal
          title={activeCamera.title}
          facingMode={activeCamera.facingMode}
          onClose={() => setActiveCamera(null)}
          onCapture={(dataUrl) => {
            if (activeCamera.target === "selfie") setSelfie(dataUrl);
            if (activeCamera.target === "cedula") setCedulaPhoto(dataUrl);
            if (activeCamera.target === "circulation") setCirculationPhoto(dataUrl);
            setActiveCamera(null);
            setError("");
          }}
        />
      )}

      {error && <p className="text-sm font-medium text-signal">{error}</p>}

      <button
        type="button"
        disabled={pending || missingPhotos || missingFields}
        className="h-12 rounded-full bg-brand text-base font-extrabold text-ink shadow-md disabled:opacity-40"
        onClick={() => {
          setPending(true);
          setError("");
          void submitProfile({
            data: {
              role,
              fullName,
              phone,
              cedula,
              plate: role === "driver" ? plate : "",
              model: role === "driver" ? model : "",
              bankPhone: role === "driver" ? bankPhone || phone : "",
              bankName: role === "driver" ? bankName : "",
              cedulaPhoto,
              selfie,
              circulationPhoto: role === "driver" ? circulationPhoto : "",
              licenseGrade: role === "driver" ? licenseGrade : "2da Grado (Moto)",
              medicalCert: role === "driver" ? medicalCert : true,
              criminalRecordOk: role === "driver" ? criminalRecordOk : true,
            },
          })
            .then(() => {
              toast.success(
                `Expediente y alerta Push enviados a ${CENTRAL_CARORA_CONFIG.developerEmail}`,
              );
              void sendBrowserPush(
                `Nuevo Registro · ${CENTRAL_CARORA_CONFIG.developerEmail}`,
                `${fullName} (${cedula}) envió su expediente para aprobación en Rapidez Carora.`,
              );
              onDone();
            })
            .catch((err) => setError(messageOf(err)))
            .finally(() => setPending(false));
        }}
      >
        {pending
          ? `Enviando Push a ${CENTRAL_CARORA_CONFIG.developerEmail}…`
          : missingPhotos
            ? role === "driver"
              ? "Falta Cédula, Selfie o Documentación"
              : "Falta subir Cédula y Selfie obligatoria"
            : `Enviar aprobación a ${CENTRAL_CARORA_CONFIG.developerEmail}`}
      </button>

      <button
        type="button"
        className="h-9 text-xs font-semibold text-muted underline"
        onClick={onReview}
      >
        Painel del Desarrollador ({CENTRAL_CARORA_CONFIG.developerEmail})
      </button>
    </div>
  );
}

function PhotoCaptureCard({
  label,
  sublabel,
  photo,
  capture,
  onOpenCamera,
  onFile,
}: {
  label: string;
  sublabel: string;
  photo: string;
  capture: "user" | "environment";
  onOpenCamera: () => void;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-2xl border border-line bg-sheet p-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <div>
          <p className="text-xs font-extrabold text-ink">{label}</p>
          <p className="text-[10px] text-muted">{sublabel}</p>
        </div>
        {photo ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-extrabold text-ink">
            <Check className="size-3 text-brand" /> Lista
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-bold text-signal">Obligatorio</span>
        )}
      </div>

      {photo && (
        <img
          src={photo}
          alt={label}
          className="h-20 w-full rounded-xl border border-line object-cover"
        />
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onOpenCamera}
          className="flex h-9 items-center justify-center gap-1 rounded-xl bg-ink px-2 text-[11px] font-bold text-paper"
        >
          <Camera className="size-3.5 shrink-0" />
          Cámara
        </button>
        <label className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-line bg-paper px-2 text-[11px] font-bold text-ink">
          <Upload className="size-3.5 shrink-0" />
          Archivo
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture={capture}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}

function CameraModal({
  title,
  facingMode,
  onClose,
  onCapture,
}: {
  title: string;
  facingMode: "user" | "environment";
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Tu navegador no permite abrir la cámara en directo. Usa el botón 'Archivo'.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
          setReady(true);
        }
      })
      .catch(() => {
        setCamError(
          "No se pudo acceder a la cámara. Concede permiso o usa el botón 'Archivo' para subir la foto.",
        );
      });
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.72));
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-ink p-3 text-paper">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-extrabold text-brand">{title}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper/15 p-1 text-paper"
          aria-label="Cerrar cámara"
        >
          <X className="size-4" />
        </button>
      </div>
      {camError ? (
        <p className="py-3 text-xs text-paper/90">{camError}</p>
      ) : (
        <div className="space-y-2">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-52 w-full rounded-xl bg-ink object-cover"
          />
          <button
            type="button"
            disabled={!ready}
            onClick={snap}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand font-extrabold text-ink disabled:opacity-40"
          >
            <Camera className="size-4" /> Capturar foto ahora
          </button>
        </div>
      )}
    </div>
  );
}

interface SavedAddress {
  label: string;
  lat: number;
  lng: number;
}

function PassengerDesk({
  nearby,
  rating,
  ratingCount,
  trip,
  weather,
  roadReports,
  ecoGps,
  onToggleEco,
  error,
  onQuote,
  onSync,
  onOpenRoadModal,
  onOpenFeedback,
  onOpenPushModal,
  onReview,
  onRequest,
  onCancel,
}: {
  nearby: NearbyMoto[];
  rating: number;
  ratingCount: number;
  trip: TripView | null;
  weather: CityWeatherState;
  roadReports: LiveRoadReport[];
  ecoGps: boolean;
  onToggleEco: () => void;
  error: string;
  onQuote: (destPoint: LatLng | null) => void;
  onSync: () => void;
  onOpenRoadModal: () => void;
  onOpenFeedback: () => void;
  onOpenPushModal: () => void;
  onReview: () => void;
  onRequest: (
    destPoint: LatLng,
    destName: string,
    pickupText: string,
    pay: string,
    point: string,
    tierId: ServiceTierId,
    cashTendered: number | null,
  ) => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const center = useRapidez((s) => s.center);
  const route = useRapidez((s) => s.route);
  const focusPlace = useRapidez((s) => s.focusPlace);
  const [placeId, setPlaceId] = useState<string | null>("plaza");
  const [customDest, setCustomDest] = useState<LatLng | null>(null);
  const [pickingMapDest, setPickingMapDest] = useState(false);
  const [tierId, setTierId] = useState<ServiceTierId>("moto");
  const [pay, setPay] = useState("PAGO_MOVIL");
  const [cashBillUsd, setCashBillUsd] = useState<number | null>(null);
  const [pickupNote, setPickupNote] = useState("");
  const [point, setPoint] = useState("Frente a la entrada principal");
  const [needHelmet, setNeedHelmet] = useState(true);
  const [hasBag, setHasBag] = useState(false);
  const [savedHome, setSavedHome] = useState<SavedAddress | null>(() => {
    try {
      const raw = localStorage.getItem("rapidez-fav-casa");
      return raw ? (JSON.parse(raw) as SavedAddress) : null;
    } catch {
      return null;
    }
  });
  const [savedWork, setSavedWork] = useState<SavedAddress | null>(() => {
    try {
      const raw = localStorage.getItem("rapidez-fav-trabajo");
      return raw ? (JSON.parse(raw) as SavedAddress) : null;
    } catch {
      return null;
    }
  });
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);

  const selectedPlace: Place | null = PLACES.find((item) => item.id === placeId) ?? null;
  const destPoint: LatLng | null = customDest ?? selectedPlace;
  const destName = customDest ? placeLabel(customDest) : (selectedPlace?.name ?? "");
  const isPremiere = destPoint ? premiereAt(destPoint) : false;
  const tier = SERVICE_TIERS.find((t) => t.id === tierId) ?? SERVICE_TIERS[0];
  const meters = destPoint ? haversine(center, destPoint) : 0;
  const baseFare = destPoint ? fareFor(meters, isPremiere) : 0;
  const fare = destPoint ? Math.round((baseFare + tier.extraUsd) * 100) / 100 : 0;
  const tooClose = Boolean(destPoint) && meters < 80;

  const routeAnalysis = analyzeRouteHazards(route, roadReports, weather.isRaining);
  const normalEta = etaMin(meters);
  const adjustedEta = normalEta + routeAnalysis.extraRainMinutes;

  const changeUsd =
    (pay === "CASH_USD" || pay === "CASH_VES") && cashBillUsd && cashBillUsd > fare
      ? Math.round((cashBillUsd - fare) * 100) / 100
      : 0;

  useEffect(() => {
    if (trip && trip.status !== "cancelled") return;
    onQuote(destPoint);
  }, [trip, destPoint, center.lat, center.lng, onQuote]);

  if (history) return <HistoryList onClose={() => setHistory(false)} />;
  if (trip && trip.status !== "cancelled") {
    return (
      <TripCard
        trip={trip}
        mine="passenger"
        weather={weather}
        roadReports={roadReports}
        onOpenRoadModal={onOpenRoadModal}
        onSync={onSync}
        onCancel={() => void onCancel()}
      />
    );
  }

  const handleFavorite = (slot: "casa" | "trabajo") => {
    const current = slot === "casa" ? savedHome : savedWork;
    if (current) {
      setCustomDest({ lat: current.lat, lng: current.lng });
      setPlaceId(null);
      setPoint(`Favorito (${slot === "casa" ? "Casa" : "Trabajo"}): ${current.label}`);
      toast.success(`Destino fijado en tu ${slot === "casa" ? "Casa" : "Trabajo"} (${current.label})`);
    } else {
      const next: SavedAddress = {
        label: placeLabel(center),
        lat: center.lat,
        lng: center.lng,
      };
      localStorage.setItem(`rapidez-fav-${slot}`, JSON.stringify(next));
      if (slot === "casa") setSavedHome(next);
      else setSavedWork(next);
      toast.success(
        `Pin actual guardado como tu ${slot === "casa" ? "Casa" : "Trabajo"} (${next.label})`,
      );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <WeatherAndTrafficBar
        weather={weather}
        reportsCount={roadReports.length}
        ecoGps={ecoGps}
        onToggleEco={onToggleEco}
        onOpenRoadModal={onOpenRoadModal}
        onOpenPushModal={onOpenPushModal}
      />

      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="font-semibold text-ink">
          {nearby.length > 0
            ? `${nearby.length} de ${MVP_MAX_DRIVERS} motos activas en Hotspots Carora`
            : `Frota de ${MVP_MAX_DRIVERS} motos · Disparo general activo`}
        </span>
        <span className="font-medium tabular-nums">
          BCV: Bs {RATE_VES.toFixed(2)}/$
          {ratingCount > 0 ? ` · ★ ${rating.toFixed(1)}` : ""}
        </span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-extrabold">¿A dónde vamos hoy?</h1>
        <p className="text-xs text-muted">
          Salida en <span className="font-bold text-ink">{placeLabel(center)}</span>. Ruta estática
          de bajo consumo 3G/4G.
        </p>
      </div>

      {/* 1-Tap Uber/99 Style Favorites: Casa & Trabajo + Strategic Hotspots */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
        <button
          type="button"
          onClick={() => handleFavorite("casa")}
          onDoubleClick={() => {
            localStorage.removeItem("rapidez-fav-casa");
            setSavedHome(null);
            toast("Favorito Casa borrado");
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-bold text-paper whitespace-nowrap"
        >
          <Bookmark className="size-3" />
          {savedHome ? `Casa (${savedHome.label})` : "Guardar Casa"}
        </button>
        <button
          type="button"
          onClick={() => handleFavorite("trabajo")}
          onDoubleClick={() => {
            localStorage.removeItem("rapidez-fav-trabajo");
            setSavedWork(null);
            toast("Favorito Trabajo borrado");
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-bold text-paper whitespace-nowrap"
        >
          <Bookmark className="size-3" />
          {savedWork ? `Trabajo (${savedWork.label})` : "Guardar Trabajo"}
        </button>
        {CARORA_HOTSPOTS.map((hs) => (
          <button
            key={hs.id}
            type="button"
            onClick={() =>
              focusPlace({
                id: hs.id,
                name: hs.shortName,
                hint: hs.detail,
                lat: hs.lat,
                lng: hs.lng,
              })
            }
            className="shrink-0 rounded-full border border-brand bg-paper px-2.5 py-1 font-bold text-ink whitespace-nowrap"
          >
            Hotspot: {hs.shortName}
          </button>
        ))}
      </div>

      <input
        className="field"
        aria-label="Referencia de recogida"
        placeholder="Referencia de salida (ej. portón blanco, frente a farmacia)"
        value={pickupNote}
        onChange={(e) => setPickupNote(e.target.value)}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-bold text-muted">Elige destino en Carora</span>
          <button
            type="button"
            onClick={() => {
              if (pickingMapDest) {
                setCustomDest({ ...center });
                setPlaceId(null);
                setPickingMapDest(false);
                toast.success(`Destino fijado en ${placeLabel(center)}`);
              } else {
                setPickingMapDest(true);
                toast("Mueve el mapa hasta tu destino y pulsa 'Confirmar este punto'");
              }
            }}
            className="text-xs font-bold text-ink underline"
          >
            {pickingMapDest ? "Confirmar este punto del mapa" : "O fijar destino en el mapa"}
          </button>
        </div>

        <div className="chip-row max-h-28 overflow-y-auto py-0.5">
          {PLACES.map((item) => {
            const active = !customDest && item.id === placeId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-paper shadow-sm"
                    : "rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink"
                }
                onClick={() => {
                  setCustomDest(null);
                  setPickingMapDest(false);
                  setPlaceId(item.id);
                  if (!point.trim()) setPoint(`Cerca de ${item.hint}`);
                }}
              >
                {item.name}
                {item.premiere ? " · $1" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <input
        className="field"
        aria-label="Punto de referencia del destino"
        placeholder={
          tierId === "encomienda"
            ? "Quién recibe y teléfono (ej. María 0414-5551234, frente a plaza)"
            : "Referencia del destino (ej. frente a emergencias, portón azul)"
        }
        value={point}
        onChange={(e) => setPoint(e.target.value)}
      />

      {/* Uber Moto / 99Moto Passenger Ride Preferences */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setNeedHelmet(!needHelmet)}
          className={
            needHelmet
              ? "rounded-full bg-brand/30 px-3 py-1 font-bold text-ink"
              : "rounded-full border border-line bg-paper px-3 py-1 font-medium text-muted"
          }
        >
          {needHelmet ? "✓ Casco extra requerido" : "Casco propio"}
        </button>
        <button
          type="button"
          onClick={() => setHasBag(!hasBag)}
          className={
            hasBag
              ? "rounded-full bg-brand/30 px-3 py-1 font-bold text-ink"
              : "rounded-full border border-line bg-paper px-3 py-1 font-medium text-muted"
          }
        >
          {hasBag ? "✓ Llevo bolso / compra" : "Sin equipaje extra"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {SERVICE_TIERS.map((t) => {
          const active = t.id === tierId;
          const tFare = destPoint ? Math.round((baseFare + t.extraUsd) * 100) / 100 : 1.5 + t.extraUsd;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTierId(t.id)}
              className={
                active
                  ? "flex flex-col items-start rounded-2xl border-2 border-ink bg-paper p-2.5 text-left shadow-sm"
                  : "flex flex-col items-start rounded-2xl border border-line bg-sheet p-2.5 text-left"
              }
            >
              <div className="flex w-full items-center justify-between">
                {t.id === "encomienda" ? (
                  <Package className="size-4 text-ink" />
                ) : t.id === "elite" ? (
                  <Sparkles className="size-4 text-brand" />
                ) : (
                  <Bike className="size-4 text-ink" />
                )}
                <span className="text-[10px] font-bold text-muted">{t.badge}</span>
              </div>
              <span className="mt-1 text-xs font-extrabold text-ink">{t.name}</span>
              <span className="font-display text-sm font-extrabold tabular-nums text-ink">
                {formatUsd(tFare)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Automatic Route Hazard, Lombadas & Rain Delay Analysis */}
      {destPoint && (
        <RouteHazardsSummary
          route={route}
          roadReports={roadReports}
          isRaining={weather.isRaining}
          onOpenRoadModal={onOpenRoadModal}
        />
      )}

      {destPoint && (
        <div className="flex items-center justify-between rounded-2xl bg-paper px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold text-muted">
              {formatKm(meters)} hasta <span className="text-ink">{destName}</span> · ~{adjustedEta}{" "}
              min
              {routeAnalysis.extraRainMinutes > 0 && (
                <span className="text-signal">
                  {" "}
                  (incluye +{routeAnalysis.extraRainMinutes}m por lluvia/vía)
                </span>
              )}
            </p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-ink">
              {pay === "CASH_VES" ? formatVes(vesOf(fare)) : formatUsd(fare)}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-xs font-bold text-muted">Valor Exacto BCV</span>
            <span className="font-display text-base font-extrabold tabular-nums text-ink">
              {pay === "CASH_VES" ? formatUsd(fare) : formatVes(vesOf(fare))}
            </span>
          </div>
        </div>
      )}

      {/* Sistema de Pagamentos Integrado (Foco Local: Pago Móvil, Efectivo USD/VES, Zelle/Wallet) */}
      <div className="space-y-2">
        <span className="block text-xs font-bold text-muted">
          Método de pago local (Carora):
        </span>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {(
            [
              ["PAGO_MOVIL", "Pago Móvil"],
              ["CASH_USD", "Efectivo USD"],
              ["CASH_VES", "Efectivo Bs"],
              ["ZELLE_WALLET", "Zelle / Wallet"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={
                pay === id
                  ? "h-10 rounded-full bg-ink px-2 text-xs font-bold text-paper"
                  : "h-10 rounded-full border border-line bg-paper px-2 text-xs font-semibold text-ink"
              }
              onClick={() => setPay(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {(pay === "CASH_USD" || pay === "CASH_VES") && destPoint && (
          <div className="rounded-2xl border border-line bg-paper p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">
                ¿Con qué billete pagarás? (Para calcular tu vuelto exacto)
              </span>
              {changeUsd > 0 && (
                <span className="font-extrabold text-signal tabular-nums">
                  Vuelto: {formatUsd(changeUsd)} ({formatVes(vesOf(changeUsd))})
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[
                { label: `Exacto (${formatUsd(fare)})`, val: null },
                { label: "Billete $5", val: 5 },
                { label: "Billete $10", val: 10 },
                { label: "Billete $20", val: 20 },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setCashBillUsd(b.val)}
                  className={
                    cashBillUsd === b.val
                      ? "rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-ink"
                      : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[11px] font-semibold text-ink"
                  }
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {tooClose && (
        <p className="text-xs font-semibold text-signal">
          El destino está en el mismo punto de salida. Mueve el mapa o elige otro sector.
        </p>
      )}
      {error && <p className="text-xs font-semibold text-signal">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!destPoint || tooClose || busy}
          className="h-12 flex-1 rounded-full bg-brand text-base font-extrabold text-ink shadow-md disabled:opacity-40"
          onClick={() => {
            if (!destPoint) return;
            setBusy(true);
            const tags = [
              needHelmet ? "Casco extra" : "",
              hasBag ? "Lleva bolso" : "",
              tierId === "encomienda" ? "ENCOMIENDA" : "",
              (pay === "CASH_USD" || pay === "CASH_VES") && cashBillUsd && cashBillUsd > fare
                ? `Paga con $${cashBillUsd} (Vuelto $${changeUsd.toFixed(2)})`
                : "",
            ]
              .filter(Boolean)
              .join(", ");
            const fullPickupNote = [pickupNote.trim(), tags].filter(Boolean).join(" · ");
            void onRequest(
              destPoint,
              destName,
              fullPickupNote,
              pay,
              point.trim() || "Entrada principal",
              tierId,
              pay === "CASH_USD" || pay === "CASH_VES" ? (cashBillUsd ?? fare) : null,
            ).finally(() => setBusy(false));
          }}
        >
          {busy ? "Disparando a las 5 motos…" : `Pedir ${tier.name}`}
        </button>
        <button
          type="button"
          aria-label="Historial de carreras"
          onClick={() => setHistory(true)}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink"
        >
          <History className="size-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
        <button
          type="button"
          onClick={onOpenPushModal}
          className="inline-flex items-center gap-1 font-bold text-ink underline"
        >
          <Bell className="size-3 text-brand" />
          Alertas Push Web (SW)
        </button>
        <button
          type="button"
          onClick={onOpenFeedback}
          className="font-bold text-ink underline"
        >
          Feedback ({CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay})
        </button>
        <button
          type="button"
          onClick={onReview}
          className="font-semibold text-muted underline"
        >
          Central ({CENTRAL_CARORA_CONFIG.developerEmail})
        </button>
      </div>
    </div>
  );
}

function TripCard({
  trip,
  mine,
  weather,
  roadReports,
  onOpenRoadModal,
  onSync,
  onCancel,
}: {
  trip: TripView;
  mine: "passenger" | "driver";
  weather: CityWeatherState;
  roadReports: LiveRoadReport[];
  onOpenRoadModal: () => void;
  onSync: () => void;
  onCancel: () => void;
}) {
  const route = useRapidez((s) => s.route);
  const [payRef, setPayRef] = useState(trip.payRef || "");
  const [showChat, setShowChat] = useState(trip.payMethod === "ZELLE_WALLET");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [panicNote, setPanicNote] = useState(
    trip.panicked ? "Alerta SOS activa en Central Carora. Emergencias Lara: 171 / 911." : "",
  );

  const meters =
    trip.driverLat != null && trip.driverLng != null
      ? haversine(
          { lat: trip.driverLat, lng: trip.driverLng },
          trip.status === "riding"
            ? { lat: trip.destLat, lng: trip.destLng }
            : { lat: trip.pickupLat, lng: trip.pickupLng },
        )
      : null;

  const routeAnalysis = analyzeRouteHazards(route, roadReports, weather.isRaining);
  const safetyPin = safetyPinOf(trip.id);

  const title =
    trip.status === "open"
      ? "Disparo simultáneo activo para las 5 motos…"
      : trip.status === "accepted"
        ? mine === "driver"
          ? "En camino a recoger al pasajero"
          : "Tu mototaxi va en camino"
        : trip.status === "arrived"
          ? mine === "driver"
            ? "Llegaste al punto de recogida"
            : "¡Tu mototaxi está en la puerta!"
          : trip.status === "riding"
            ? "En viaje hacia el destino (Ruta Estática)"
            : trip.status === "pay"
              ? "Llegaron al destino · Cierre y Pago"
              : "Carrera finalizada";

  const steps = [
    { key: "open", label: "Disparo" },
    { key: "accepted", label: "En camino" },
    { key: "arrived", label: "En puerta" },
    { key: "riding", label: "En viaje" },
    { key: "pay", label: "Pago" },
  ];
  const currentStepIdx = Math.max(
    0,
    steps.findIndex((s) => s.key === trip.status),
  );

  const shareUrl =
    typeof window !== "undefined" && trip.shareToken
      ? `${window.location.origin}/viaje/${trip.shareToken}`
      : "";

  const whatsappShareText = [
    `🛵 *Compartilhamento de Rota Familiar — Rapidez Carora*`,
    `📍 *Salida:* ${trip.pickupRef}`,
    `🏁 *Destino:* ${trip.destRef || "Carora"}`,
    trip.driverName
      ? `👤 *Piloto Catastrado:* ${trip.driverName} (${trip.driverModel} · Placa ${trip.driverPlate})`
      : `⏳ *Estado:* Disparo general a las 5 motos de la flota`,
    `🔐 *Código PIN de seguridad:* ${safetyPin}`,
    shareUrl ? `🔗 *Rastreo en vivo:* ${shareUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  // Botão de Pânico Operacional: envía coordenadas GPS de la corrida activa directo al WhatsApp del Administrador de la Central
  const currentLat = trip.driverLat ?? trip.pickupLat;
  const currentLng = trip.driverLng ?? trip.pickupLng;
  const mapsUrl = `https://maps.google.com/?q=${currentLat.toFixed(6)},${currentLng.toFixed(6)}`;
  const panicWhatsappText = [
    `🚨 *BOTÓN DE PÁNICO OPERACIONAL — CENTRAL RAPIDEZ CARORA* 🚨`,
    `🆔 *Carrera:* ${trip.id}`,
    `👤 *Pasajero:* ${trip.passengerName} (${trip.passengerPhone})`,
    `🛵 *Motorista:* ${trip.driverName || "En asignación"} · Placa ${trip.driverPlate || "N/A"} (${trip.driverModel || ""})`,
    `📍 *Salida:* ${trip.pickupRef}`,
    `🏁 *Destino:* ${trip.destRef}`,
    `🌐 *Coordenadas GPS exactas:* ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`,
    `🗺️ *Ubicación en Google Maps:* ${mapsUrl}`,
  ].join("\n");
  const panicWhatsappHref = `https://wa.me/${CENTRAL_CARORA_CONFIG.whatsappAdmin}?text=${encodeURIComponent(panicWhatsappText)}`;

  const vesAmount = vesOf(trip.fareUsd);
  const tenderedUsd =
    trip.cashTendered != null && trip.cashTendered > trip.fareUsd ? trip.cashTendered : null;
  const changeUsd = tenderedUsd ? Math.round((tenderedUsd - trip.fareUsd) * 100) / 100 : 0;
  const driverNetUsd = Math.round(trip.fareUsd * (1 - COMMISSION) * 100) / 100;

  const centralPagoMovilBlock = [
    `Pago Móvil Central Rapidez Carora`,
    `RIF: ${CENTRAL_CARORA_CONFIG.rif}`,
    `Banco: ${CENTRAL_CARORA_CONFIG.bankCode} (${CENTRAL_CARORA_CONFIG.bankName})`,
    `Teléfono: ${CENTRAL_CARORA_CONFIG.phone}`,
    `Monto exacto: ${formatVes(vesAmount)} (${formatUsd(trip.fareUsd)})`,
  ].join("\n");

  async function onUploadProof(file: File | undefined) {
    if (!file) return;
    setUploadingProof(true);
    try {
      const dataUrl = await shrink(file);
      await sendChat({
        data: {
          tripId: trip.id,
          body: "📎 Comprobante de pago Zelle / Billetera Digital adjunto",
          attachmentPhoto: dataUrl,
        },
      });
      await setTripStatus({
        data: {
          tripId: trip.id,
          status: trip.status === "pay" ? "pay" : trip.status,
          paymentProof: dataUrl,
        },
      });
      setShowChat(true);
      toast.success("Comprobante subido al chat de la corrida y enviado a Central");
      onSync();
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setUploadingProof(false);
    }
  }

  const statusMeta =
    trip.status === "open"
      ? {
          badge: "Buscando unidad en Hotspots",
          sub: "Disparo simultáneo activo para las 5 motos de Carora",
          tone: "bg-paper text-ink border-line",
        }
      : trip.status === "accepted"
        ? {
            badge: "En camino · Moto asignada",
            sub:
              mine === "driver"
                ? "Dirígete al punto de recogida del pasajero"
                : "Tu mototaxi se acerca al punto de recogida",
            tone: "bg-brand/25 text-ink border-brand",
          }
        : trip.status === "arrived"
          ? {
              badge: "¡En puerta! · Listo para abordar",
              sub:
                mine === "driver"
                  ? "Esperando al pasajero · Verifica el PIN de 4 dígitos"
                  : "Tu mototaxi ya está afuera esperando por ti",
              tone: "bg-brand text-ink border-ink trip-arrival-glow",
            }
          : trip.status === "riding"
            ? {
                badge: "En viaje · Ruta activa",
                sub: "Desplazamiento en curso por Carora",
                tone: "bg-ink text-paper border-ink",
              }
            : {
                badge: "En destino · Cierre y Pago",
                sub: "Confirma el pago para finalizar la carrera",
                tone: "bg-paper text-ink border-brand",
              };

  return (
    <div className="flex flex-col gap-3 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]">
      {/* Smooth Animated 5-Step Progress Tracker */}
      <div className="space-y-1.5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
            style={{
              width: `${Math.min(100, Math.max(10, ((currentStepIdx + 0.5) / steps.length) * 100))}%`,
            }}
          />
        </div>
        <div className="grid grid-cols-5 gap-1">
          {steps.map((s, idx) => {
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={s.key} className="flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${
                    isCurrent
                      ? "scale-y-125 bg-brand shadow-sm"
                      : isDone
                        ? "bg-brand/75"
                        : "bg-line/70"
                  }`}
                />
                <span
                  className={`text-[10px] transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                    isCurrent
                      ? " origin-center scale-105 font-extrabold text-ink"
                      : isDone
                        ? "font-bold text-ink/75"
                        : "font-medium text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Status Pill with Cross-Fading Icons */}
      <div
        className={`flex items-center justify-between gap-2.5 rounded-2xl border px-3 py-2 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${statusMeta.tone}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative grid size-8 shrink-0 place-items-center rounded-full bg-ink/10">
            <div
              className={`absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                trip.status === "open"
                  ? "scale-100 opacity-100 blur-none"
                  : "scale-[0.25] opacity-0 blur-[4px]"
              }`}
            >
              <Sparkles className="size-4" />
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                trip.status === "accepted"
                  ? "scale-100 opacity-100 blur-none"
                  : "scale-[0.25] opacity-0 blur-[4px]"
              }`}
            >
              <Bike className="size-4" />
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                trip.status === "arrived"
                  ? "scale-100 opacity-100 blur-none"
                  : "scale-[0.25] opacity-0 blur-[4px]"
              }`}
            >
              <MapPin className="size-4" />
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                trip.status === "riding"
                  ? "scale-100 opacity-100 blur-none"
                  : "scale-[0.25] opacity-0 blur-[4px]"
              }`}
            >
              <Navigation className="size-4" />
            </div>
            <div
              className={` flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                trip.status === "pay" || trip.status === "done"
                  ? "scale-100 opacity-100 blur-none"
                  : "scale-[0.25] opacity-0 blur-[4px]"
              }`}
            >
              <Wallet className="size-4" />
            </div>
          </div>
          <div key={`meta-${trip.status}`} className="trip-state-enter min-w-0">
            <span className="block truncate text-xs font-extrabold">{statusMeta.badge}</span>
            <span className="block truncate text-[11px] opacity-85">{statusMeta.sub}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
          Paso {currentStepIdx + 1}/5
        </span>
      </div>

      {/* Animated State Title & Distance Badge */}
      <div
        key={`header-${trip.status}`}
        className="trip-state-enter flex items-start justify-between gap-2"
      >
        <div>
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          {trip.status === "open" && mine === "passenger" && (
            <p className="text-xs text-muted">
              Alerta enviada en simultáneo a los 5 motoristas de Carora (el primero en aceptar toma
              la corrida)…
            </p>
          )}
        </div>
        {meters != null && (
          <div className="shrink-0 rounded-2xl bg-paper px-3 py-1.5 text-right transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]">
            <span className="block font-display text-lg font-extrabold tabular-nums text-ink">
              {formatKm(meters)}
            </span>
            {(trip.status === "accepted" || trip.status === "riding") && (
              <span className="block text-[11px] font-semibold text-muted">
                ~{etaMin(meters) + routeAnalysis.extraRainMinutes} min
              </span>
            )}
          </div>
        )}
      </div>

      {/* Uber Moto / 99Moto 4-Digit Safety Verification PIN */}
      {["accepted", "arrived"].includes(trip.status) && (
        <div
          className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${
            trip.status === "arrived"
              ? "border-2 border-brand bg-ink text-paper shadow-md"
              : "border border-transparent bg-ink text-paper"
          }`}
        >
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <KeyRound
              className={`size-4 text-brand transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${
                trip.status === "arrived" ? "scale-110 rotate-12" : ""
              }`}
            />
            {trip.status === "arrived"
              ? mine === "passenger"
                ? "¡Moto en puerta! Dicta este PIN al subir:"
                : "¡En puerta! Confirma este PIN con el pasajero:"
              : mine === "passenger"
                ? "Código PIN de seguridad para subir:"
                : "Confirma este PIN con el pasajero:"}
          </span>
          <span className="rounded-lg bg-brand/20 px-2 py-0.5 font-display text-base font-extrabold tracking-widest text-brand tabular-nums">
            {safetyPin}
          </span>
        </div>
      )}

      {/* Rain & Road Hazards on Active Trip */}
      <RouteHazardsSummary
        route={route}
        roadReports={roadReports}
        isRaining={weather.isRaining}
        onOpenRoadModal={onOpenRoadModal}
      />

      {trip.driverName && mine === "passenger" && (
        <div className="rounded-2xl border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-base font-extrabold text-ink">{trip.driverName}</p>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-ink">
                  <Star className="size-3 fill-current text-brand" /> {trip.driverRating.toFixed(2)}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted">
                {trip.driverModel} · Cédula {trip.driverCedula}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-ink">
                <ShieldCheck className="size-3.5 text-brand" />
                Validado Presencialmente · Frota Oficial Carora
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-lg border-2 border-ink bg-brand px-2.5 py-1 font-display text-sm font-extrabold tracking-widest text-ink">
                {trip.driverPlate}
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-ink px-2 text-xs font-bold text-paper"
            >
              <MessageSquare className="size-3.5" />
              Chat / Print
            </button>
            <a
              href={`https://wa.me/58${trip.driverPhone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${trip.driverName}, soy tu pasajero en Rapidez Carora (${trip.pickupRef}). Mi PIN es ${safetyPin}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-line bg-sheet px-2 text-xs font-bold text-ink"
            >
              WhatsApp Moto
            </a>
            <a
              href={`tel:${trip.driverPhone}`}
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-line bg-sheet px-2 text-xs font-bold text-ink"
            >
              <Phone className="size-3.5" />
              Llamar
            </a>
          </div>
        </div>
      )}

      {mine === "driver" && (
        <div className="rounded-2xl border border-line bg-paper p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted">
                Pasajero MVP verificado · Tu ganancia 90%: {formatUsd(driverNetUsd)}
              </span>
              <p className="font-display text-lg font-extrabold">{trip.passengerName}</p>
            </div>
            <div className="flex gap-1.5">
              {trip.passengerPhone && (
                <a
                  href={`https://wa.me/58${trip.passengerPhone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${trip.passengerName}, soy tu mototaxista de Rapidez Carora.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 items-center rounded-xl border border-line bg-sheet px-2.5 text-xs font-bold text-ink"
                >
                  WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-bold text-paper"
              >
                <MessageSquare className="size-3.5" /> Chat
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-paper px-3 py-2.5 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p>
              <span className="font-bold text-muted">Recogida: </span>
              <span className="font-semibold text-ink">{trip.pickupRef}</span>
            </p>
            <p>
              <span className="font-bold text-muted">Destino: </span>
              <span className="font-semibold text-ink">{trip.destRef || "Carora"}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-base font-extrabold tabular-nums text-ink">
              {formatUsd(trip.fareUsd)}
            </p>
            <p className="font-semibold tabular-nums text-muted">{formatVes(vesAmount)}</p>
            <span className="text-[10px] font-bold text-ink">
              {trip.payMethod === "PAGO_MOVIL"
                ? "Pago Móvil"
                : trip.payMethod === "ZELLE_WALLET"
                  ? "Zelle / Wallet"
                  : trip.payMethod === "CASH_VES"
                    ? "Efectivo Bs"
                    : "Efectivo USD"}
            </span>
          </div>
        </div>

        {/* Exact Cash & Change (Troco / Vuelto) Breakdown for Driver & Passenger */}
        {(trip.payMethod === "CASH_USD" || trip.payMethod === "CASH_VES") && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-sheet px-2.5 py-1.5 text-[11px]">
            <span className="font-semibold text-ink">
              {tenderedUsd
                ? `Pasajero entrega billete de ${formatUsd(tenderedUsd)} (${formatVes(vesOf(tenderedUsd))})`
                : `Pago en efectivo exacto: ${formatUsd(trip.fareUsd)} (${formatVes(vesAmount)})`}
            </span>
            {changeUsd > 0 && (
              <span className="font-extrabold text-signal tabular-nums">
                Vuelto a dar: {formatUsd(changeUsd)} / {formatVes(vesOf(changeUsd))}
              </span>
            )}
          </div>
        )}
      </div>

      {trip.status === "riding" && <RideMeter startedAt={trip.startedAt} riddenM={trip.riddenM} />}

      {showChat && ["accepted", "arrived", "riding", "pay"].includes(trip.status) && (
        <RideChat tripId={trip.id} onSync={onSync} />
      )}

      {/* 1. PAGO MÓVIL: Datos Bancarios de la Central (RIF, Banco, Teléfono) + Conductor */}
      {trip.payMethod === "PAGO_MOVIL" && (
        <div className="rounded-2xl border border-line bg-paper p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-ink">
              Pago Móvil · Central Rapidez Carora
            </span>
            <button
              type="button"
              onClick={() => void copyText("Datos Pago Móvil Central", centralPagoMovilBlock)}
              className="inline-flex items-center gap-1 font-bold text-ink underline"
            >
              <Copy className="size-3.5" /> Copiar datos
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-xl bg-sheet p-2">
              <span className="block text-[10px] text-muted">Banco Central</span>
              <span className="font-bold text-ink">
                {CENTRAL_CARORA_CONFIG.bankCode} · {CENTRAL_CARORA_CONFIG.bankName}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sheet p-2">
              <div>
                <span className="block text-[10px] text-muted">RIF Central</span>
                <span className="font-bold text-ink">{CENTRAL_CARORA_CONFIG.rif}</span>
              </div>
              <button
                type="button"
                onClick={() => void copyText("RIF Central", CENTRAL_CARORA_CONFIG.rif)}
                className="p-1 text-ink"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sheet p-2">
              <div>
                <span className="block text-[10px] text-muted">Teléfono Central</span>
                <span className="font-bold tabular-nums text-ink">
                  {CENTRAL_CARORA_CONFIG.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void copyText("Teléfono Central", CENTRAL_CARORA_CONFIG.phoneRaw)}
                className="p-1 text-ink"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sheet p-2">
              <div>
                <span className="block text-[10px] text-muted">Monto exacto Bs</span>
                <span className="font-bold tabular-nums text-ink">{formatVes(vesAmount)}</span>
              </div>
              <button
                type="button"
                onClick={() => void copyText("Monto en Bs", vesAmount.toFixed(2))}
                className="p-1 text-ink"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
          {trip.driverName && (
            <p className="mt-1.5 text-[11px] text-muted">
              Pago directo al piloto ({trip.driverName}): {trip.driverBankCode} {trip.driverBank} ·
              Tel {prettyPhone(trip.driverBankPhone || trip.driverPhone)} · C.I. {trip.driverCedula}
            </p>
          )}
          {trip.adminPayVerified && (
            <p className="mt-1.5 rounded-xl bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold text-ink">
              ✓ Referencia #{trip.payRef} validada por la Administración Central
            </p>
          )}
        </div>
      )}

      {/* 3. ZELLE / CARTEIRAS DIGITAIS: Upload de captura de tela en el chat */}
      {trip.payMethod === "ZELLE_WALLET" && (
        <div className="rounded-2xl border border-line bg-paper p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-ink">Zelle / Billetera Digital Central</span>
            <button
              type="button"
              onClick={() => void copyText("Correo Zelle", CENTRAL_CARORA_CONFIG.zelleEmail)}
              className="inline-flex items-center gap-1 font-bold text-ink underline"
            >
              <Copy className="size-3.5" /> Copiar correo
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Titular: <span className="font-bold text-ink">{CENTRAL_CARORA_CONFIG.zelleHolder}</span>{" "}
            · <span className="font-bold text-ink">{CENTRAL_CARORA_CONFIG.zelleEmail}</span> · Monto:{" "}
            <span className="font-bold text-ink">{formatUsd(trip.fareUsd)}</span>
          </p>
          {trip.paymentProof && (
            <div className="mt-2">
              <span className="block text-[10px] font-bold text-muted">
                Comprobante enviado al chat de la corrida:
              </span>
              <img
                src={trip.paymentProof}
                alt="Comprobante Zelle / Wallet"
                className="mt-1 h-24 w-full rounded-xl border border-line object-cover"
              />
            </div>
          )}
          {mine === "passenger" && (
            <label className="mt-2 flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper">
              <Upload className="size-3.5" />
              {uploadingProof
                ? "Subiendo captura…"
                : trip.paymentProof
                  ? "Actualizar captura de comprobante en el chat"
                  : "Subir captura (print) de comprobante al chat"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void onUploadProof(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      )}

      {panicNote && (
        <p className="rounded-2xl bg-signal px-3 py-2 text-xs font-bold text-paper">{panicNote}</p>
      )}

      <div key={`cta-${trip.status}`} className="trip-state-enter flex flex-col gap-2">
        {mine === "driver" && trip.status === "accepted" && (
          <button
            type="button"
            className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={() =>
              void setTripStatus({ data: { tripId: trip.id, status: "arrived" } }).then(onSync)
            }
          >
            Ya llegué al punto de recogida (Pasar a En puerta)
          </button>
        )}
        {mine === "driver" && trip.status === "arrived" && (
          <button
            type="button"
            className="trip-arrival-glow h-12 rounded-full bg-brand font-extrabold text-ink shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={() =>
              void setTripStatus({ data: { tripId: trip.id, status: "riding" } }).then(onSync)
            }
          >
            Pasajero a bordo (PIN {safetyPin}) · Iniciar viaje
          </button>
        )}
        {mine === "driver" && trip.status === "riding" && (
          <button
            type="button"
            className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={() =>
              void setTripStatus({ data: { tripId: trip.id, status: "pay" } }).then(onSync)
            }
          >
            Llegamos al destino · Cobrar
          </button>
        )}

        {mine === "passenger" && trip.status === "arrived" && (
          <button
            type="button"
            className="trip-arrival-glow h-12 rounded-full bg-brand font-extrabold text-ink shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={() =>
              void setTripStatus({ data: { tripId: trip.id, status: "riding" } }).then(onSync)
            }
          >
            Ya me subí a la moto · Iniciar viaje
          </button>
        )}
      </div>

      {mine === "passenger" &&
        (trip.status === "pay" || trip.status === "riding") &&
        trip.payMethod === "PAGO_MOVIL" && (
          <div className="flex flex-col gap-2">
            <input
              className="field tabular-nums"
              inputMode="numeric"
              maxLength={12}
              placeholder="Número de referencia Pago Móvil (4 a 12 dígitos)"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value.replace(/\D/g, "").slice(0, 12))}
            />
            <button
              type="button"
              disabled={payRef.length < 4}
              className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md disabled:opacity-40"
              onClick={() =>
                void setTripStatus({
                  data: { tripId: trip.id, status: "pay", payRef },
                }).then(() => {
                  toast.success(
                    "Referencia enviada para validación administrativa y del motorista",
                  );
                  onSync();
                })
              }
            >
              Enviar Referencia Pago Móvil ({formatVes(vesAmount)})
            </button>
          </div>
        )}

      {mine === "passenger" &&
        trip.status === "pay" &&
        (trip.payMethod === "CASH_USD" ||
          trip.payMethod === "CASH_VES" ||
          trip.payMethod === "ZELLE_WALLET") && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted">
              {trip.payMethod === "ZELLE_WALLET"
                ? "Tras subir la captura de Zelle/Wallet al chat, confirma el cierre:"
                : `Entrega en efectivo al conductor: ${
                    trip.payMethod === "CASH_VES" ? formatVes(vesAmount) : formatUsd(trip.fareUsd)
                  }${changeUsd > 0 ? ` (Recibes vuelto de ${formatUsd(changeUsd)})` : ""}`}
            </p>
            <button
              type="button"
              className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md"
              onClick={() =>
                void setTripStatus({ data: { tripId: trip.id, status: "done" } }).then(() => {
                  toast.success("¡Pago confirmado y viaje completado!");
                  onSync();
                })
              }
            >
              Confirmar pago realizado · Finalizar
            </button>
          </div>
        )}

      {mine === "driver" && trip.status === "pay" && (
        <div className="flex flex-col gap-2">
          {trip.payRef && (
            <p className="rounded-xl bg-paper p-2 text-center font-display text-xl font-extrabold tabular-nums">
              Ref. Pago Móvil: #{trip.payRef}
              {trip.adminPayVerified ? " (Validado Central)" : ""}
            </p>
          )}
          {trip.paymentProof && (
            <div className="rounded-xl bg-paper p-2">
              <span className="block text-[10px] font-bold text-muted">
                Comprobante Zelle / Wallet del pasajero:
              </span>
              <img
                src={trip.paymentProof}
                alt="Comprobante"
                className="mt-1 h-24 w-full rounded-lg object-cover"
              />
            </div>
          )}
          <p className="text-xs text-muted">
            Retención Piloto 90%: recibes neto{" "}
            <span className="font-bold text-ink">{formatUsd(driverNetUsd)}</span> · Comisión Central
            (10%): {formatUsd(Math.round(trip.fareUsd * COMMISSION * 100) / 100)}.
          </p>
          <button
            type="button"
            className="h-12 rounded-full bg-ink font-extrabold text-paper shadow-md"
            onClick={() =>
              void setTripStatus({ data: { tripId: trip.id, status: "done" } }).then(() => {
                toast.success("Pago confirmado y carrera cerrada");
                onSync();
              })
            }
          >
            Confirmar pago recibido ({formatUsd(trip.fareUsd)})
          </button>
        </div>
      )}

      {/* Compartilhamento de Rota Familiar + Botão de Pânico Operacional (WhatsApp Central con GPS) */}
      <div className="grid grid-cols-2 gap-2">
        {shareUrl && ["open", "accepted", "arrived", "riding"].includes(trip.status) && (
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper whitespace-nowrap"
          >
            <Share2 className="size-3.5" />
            Compartir Viaje (Familiar)
          </a>
        )}
        {["accepted", "arrived", "riding", "pay"].includes(trip.status) && (
          <a
            href={panicWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              void raisePanic({ data: { tripId: trip.id } })
                .then(() => {
                  setPanicNote(
                    `Coordenadas GPS (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}) enviadas al WhatsApp del Admin Central.`,
                  );
                  toast.error("Botón de Pánico activado: enviando GPS al WhatsApp de la Central");
                })
                .catch((err) => setPanicNote(messageOf(err)));
            }}
            className="flex h-10 items-center justify-center gap-1 rounded-full bg-signal px-2.5 text-xs font-bold text-paper whitespace-nowrap"
          >
            <AlertTriangle className="size-3.5" /> Pánico · WhatsApp Central
          </a>
        )}
      </div>

      {["open", "accepted", "arrived"].includes(trip.status) && mine === "passenger" && (
        <button
          type="button"
          className="h-9 text-xs font-semibold text-muted underline"
          onClick={onCancel}
        >
          Cancelar solicitud
        </button>
      )}
    </div>
  );
}

function RateCard({ item, onDone }: { item: PendingRate; onDone: () => void }) {
  const aspects = item.asDriver
    ? [
        ["puntual", "Puntualidad en el punto"],
        ["respeto", "Trato y respeto"],
      ]
    : [
        ["manejo", "Conducción segura en Carora"],
        ["trato", "Amabilidad del mototaxista"],
        ["casco", "Entregó casco extra limpio"],
      ];
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(aspects.map(([id]) => [id, 5])),
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const stars = Math.max(
    1,
    Math.min(
      5,
      Math.round(aspects.reduce((sum, [id]) => sum + (scores[id] ?? 5), 0) / aspects.length),
    ),
  );

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-2xl font-extrabold">¡Viaje completado!</h1>
      <p className="text-xs text-muted">
        Califica a <span className="font-bold text-ink">{item.otherName}</span>. Quienes mantienen
        más de 4.5 ★ tienen despacho prioritario en Carora.
      </p>
      {aspects.map(([id, label]) => (
        <div key={id} className="flex flex-col gap-1">
          <p className="text-xs font-bold">{label}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} de 5 en ${label}`}
                className={
                  (scores[id] ?? 0) >= n
                    ? "h-10 flex-1 rounded-full bg-brand text-sm font-extrabold text-ink"
                    : "h-10 flex-1 rounded-full bg-paper text-sm font-semibold text-muted"
                }
                onClick={() => setScores((prev) => ({ ...prev, [id]: n }))}
              >
                {n} ★
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      <button
        type="button"
        disabled={sent}
        className="h-12 rounded-full bg-ink font-extrabold text-paper disabled:opacity-40"
        onClick={() => {
          setSent(true);
          void rateTrip({
            data: {
              tripId: item.tripId,
              stars,
              note: aspects.map(([id, label]) => `${label} ${scores[id] ?? 5}`).join(", "),
            },
          })
            .then(() => {
              toast.success("¡Gracias por calificar tu viaje en Carora!");
              onDone();
            })
            .catch((err) => {
              setSent(false);
              setError(messageOf(err));
            });
        }}
      >
        {sent ? "Enviando…" : `Enviar calificación (${stars} ★)`}
      </button>
    </div>
  );
}

function RideMeter({ startedAt, riddenM }: { startedAt: string | null; riddenM: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = startedAt
    ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
    : 0;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
  return (
    <div className="flex items-center justify-between rounded-2xl bg-ink px-3.5 py-2 text-paper">
      <span className="text-xs font-semibold tracking-wide text-brand">
        Ruta Estática · GPS Económico (8–10s)
      </span>
      <span className="font-display text-lg font-extrabold tabular-nums">
        {clock} · {formatKm(riddenM)}
      </span>
    </div>
  );
}

function RideChat({ tripId, onSync }: { tripId: string; onSync?: () => void }) {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const presets = [
    "Ya salgo a la puerta",
    "Estoy en el punto exacto",
    "Tengo Pago Móvil listo",
    "Envío comprobante Zelle por aquí",
  ];

  async function load() {
    try {
      setLines(await listChat({ data: { tripId } }));
    } catch {
      /* el siguiente intento vuelve a leer */
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 3000);
    return () => clearInterval(id);
  }, [tripId]);

  async function send(body: string, attachmentPhoto?: string) {
    const clean = body.trim();
    if (!clean && !attachmentPhoto) return;
    await sendChat({ data: { tripId, body: clean, attachmentPhoto } });
    setText("");
    await load();
    onSync?.();
  }

  async function onChatPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await shrink(file);
      await send("📎 Captura de comprobante de pago", dataUrl);
      toast.success("Captura de comprobante enviada al chat de la corrida");
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-muted">
          Chat interno de la corrida (Soporta captura Zelle / Pago Móvil)
        </p>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold text-ink">
          <Upload className="size-3" />
          {uploading ? "Subiendo…" : "Subir Print / Comprobante"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onChatPhoto(e.target.files?.[0])}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-line bg-sheet px-2.5 py-1 text-xs font-semibold text-ink"
            onClick={() => void send(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="max-h-36 space-y-1.5 overflow-y-auto py-1">
        {lines.length === 0 && (
          <p className="text-xs text-muted">
            Escribe un mensaje o sube la captura de pantalla del pago arriba.
          </p>
        )}
        {lines.map((line) => (
          <div
            key={line.id}
            className={
              line.mine
                ? "ml-auto max-w-[85%] rounded-2xl bg-ink px-3 py-1.5 text-xs font-semibold text-paper"
                : "mr-auto max-w-[85%] rounded-2xl bg-brand/30 px-3 py-1.5 text-xs font-semibold text-ink"
            }
          >
            <p>{line.body}</p>
            {line.attachmentPhoto && (
              <img
                src={line.attachmentPhoto}
                alt="Comprobante en chat"
                className="mt-1.5 max-h-36 w-full rounded-xl border border-line object-cover"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="field h-10 text-sm"
          aria-label="Mensaje"
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(text);
          }}
        />
        <button
          type="button"
          className="h-10 rounded-full bg-ink px-4 text-xs font-bold text-paper"
          onClick={() => void send(text)}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

function HistoryList({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void tripHistory({ data: {} })
      .then(setItems)
      .catch((err) => setError(messageOf(err)));
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Historial de carreras</h1>
        <button
          type="button"
          className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink"
          onClick={onClose}
        >
          Volver
        </button>
      </div>
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      {items && items.length === 0 && (
        <p className="text-sm text-muted">Todavía no hay carreras finalizadas en tu cuenta.</p>
      )}
      {items?.map((item) => (
        <article key={item.id} className="rounded-2xl bg-paper px-3.5 py-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">{item.dest}</p>
            <span className="font-display text-base font-extrabold tabular-nums text-ink">
              {formatUsd(item.fareUsd)}
            </span>
          </div>
          <p className="text-xs text-muted">
            {item.when} · {formatKm(item.distanceM)} · {formatVes(vesOf(item.fareUsd))}
            {item.commissionUsd > 0 ? ` · comisión 10%: ${formatUsd(item.commissionUsd)}` : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function OfferPanel({ offer, onSync }: { offer: TripView; onSync: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [offer.id, offer.offerUntil]);
  const left = Math.max(1, Math.ceil(((offer.offerUntil ?? Date.now() + OFFER_MS) - now) / 1000));
  const width = Math.min(100, (left / Math.round(OFFER_MS / 1000)) * 100);
  const driverNet = Math.round(offer.fareUsd * (1 - COMMISSION) * 100) / 100;
  const changeUsd =
    offer.cashTendered && offer.cashTendered > offer.fareUsd
      ? Math.round((offer.cashTendered - offer.fareUsd) * 100) / 100
      : 0;

  return (
    <div className="rounded-2xl bg-ink p-3.5 text-paper shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold tracking-wide text-brand">
          ¡Disparo Simultáneo (Frota 5)! · {left}s
        </p>
        <span className="rounded-full bg-paper/15 px-2 py-0.5 text-[11px] font-bold text-paper">
          {offer.payMethod === "PAGO_MOVIL"
            ? "Pago Móvil"
            : offer.payMethod === "ZELLE_WALLET"
              ? "Zelle / Wallet"
              : offer.payMethod === "CASH_VES"
                ? "Efectivo Bs"
                : "Efectivo USD"}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper/20">
        <div className="h-full bg-brand transition-all" style={{ width: `${width}%` }} />
      </div>
      <div className="mt-2.5 space-y-1">
        <p className="text-xs text-paper/75">
          Pasajero verificado: {offer.passengerName} · El primero en aceptar asume la corrida
        </p>
        <p className="text-base font-extrabold">Recoger en: {offer.pickupRef}</p>
        <p className="text-sm text-paper/90">Destino: {offer.destRef || "Centro de Carora"}</p>
        {changeUsd > 0 && (
          <p className="rounded-lg bg-brand/20 px-2 py-1 text-xs font-bold text-brand">
            Efectivo: Pasajero paga con ${offer.cashTendered?.toFixed(2)} → Preparar vuelto de{" "}
            {formatUsd(changeUsd)} ({formatVes(vesOf(changeUsd))})
          </p>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-paper/15 pt-2">
        <div>
          <span className="font-display text-2xl font-extrabold tabular-nums text-brand">
            {formatUsd(offer.fareUsd)} ({formatVes(vesOf(offer.fareUsd))})
          </span>
          <span className="block text-[11px] font-bold text-paper/80">
            Tu ganancia neta (90%): {formatUsd(driverNet)} · Central (10%):{" "}
            {formatUsd(offer.fareUsd - driverNet)}
          </span>
        </div>
        <span className="text-xs font-bold tabular-nums">{formatKm(offer.distanceM)}</span>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-brand">{error}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== ""}
          className="h-11 rounded-full bg-paper font-bold text-ink disabled:opacity-40"
          onClick={() => {
            setBusy("no");
            void declineTrip({ data: { tripId: offer.id } })
              .then(onSync)
              .catch((err) => setError(messageOf(err)))
              .finally(() => setBusy(""));
          }}
        >
          Pasar
        </button>
        <button
          type="button"
          disabled={busy !== ""}
          className="h-11 rounded-full bg-brand font-extrabold text-ink disabled:opacity-40"
          onClick={() => {
            setBusy("yes");
            void acceptTrip({ data: { tripId: offer.id } })
              .then(() => {
                toast.success("¡Tomaste la carrera! Dirígete al punto de recogida.");
                onSync();
              })
              .catch((err) => setError(messageOf(err)))
              .finally(() => setBusy(""));
          }}
        >
          Aceptar carrera (Pesca)
        </button>
      </div>
    </div>
  );
}

function DriverDesk({
  profile,
  online,
  ecoGps,
  onToggleEco,
  offer,
  trip,
  pendingRate,
  weather,
  roadReports,
  error,
  onSync,
  onOpenRoadModal,
  onOpenFeedback,
  onOnline,
  onPin,
  onSelectHotspot,
  onReview,
  onOpenPushModal,
}: {
  profile: Profile;
  online: boolean;
  ecoGps: boolean;
  onToggleEco: () => void;
  offer: TripView | null;
  trip: TripView | null;
  pendingRate: PendingRate | null;
  weather: CityWeatherState;
  roadReports: LiveRoadReport[];
  error: string;
  onSync: () => void;
  onOpenRoadModal: () => void;
  onOpenFeedback: () => void;
  onOnline: (value: boolean) => void;
  onPin: () => void;
  onSelectHotspot: (hs: (typeof CARORA_HOTSPOTS)[number]) => void;
  onReview: () => void;
  onOpenPushModal: () => void;
}) {
  const [history, setHistory] = useState(false);

  if (history) return <HistoryList onClose={() => setHistory(false)} />;
  if (trip) {
    return (
      <TripCard
        trip={trip}
        mine="driver"
        weather={weather}
        roadReports={roadReports}
        onOpenRoadModal={onOpenRoadModal}
        onSync={onSync}
        onCancel={() => undefined}
      />
    );
  }
  if (!offer && pendingRate) return <RateCard item={pendingRate} onDone={onSync} />;

  return (
    <div className="flex flex-col gap-3">
      <WeatherAndTrafficBar
        weather={weather}
        reportsCount={roadReports.length}
        ecoGps={ecoGps}
        onToggleEco={onToggleEco}
        onOpenRoadModal={onOpenRoadModal}
        onOpenPushModal={onOpenPushModal}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1 text-xs font-extrabold text-muted">
            <ShieldCheck className="size-3.5 text-brand" />
            Frota Inicial Carora (5 Motos) · Retención 90% Piloto
          </p>
          <h1 className="font-display text-2xl font-extrabold">{profile.fullName}</h1>
          <p className="text-xs font-semibold text-muted">
            {profile.model} · Placa <span className="font-extrabold text-ink">{profile.plate}</span>{" "}
            · {profile.licenseGrade}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label={online ? "Pasar a desconectado" : "Pasar a en línea"}
          onClick={() => onOnline(!online)}
          className={
            online
              ? "relative h-8 w-14 shrink-0 rounded-full bg-brand"
              : "relative h-8 w-14 shrink-0 rounded-full bg-line"
          }
        >
          <span
            className={
              online
                ? "absolute top-1 right-1 size-6 rounded-full bg-ink"
                : "absolute top-1 left-1 size-6 rounded-full bg-ink"
            }
          />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-paper p-3 text-center">
        <div>
          <span className="block text-[10px] font-bold text-muted">Estado GPS (8–10s)</span>
          <span className="text-xs font-extrabold text-ink">
            {online ? "Livre · En Línea" : "Offline"}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-muted">Saldo Central (10%)</span>
          <span className="font-display text-sm font-extrabold tabular-nums text-ink">
            {formatUsd(profile.saldoUsd)}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-muted">Comisión Piloto</span>
          <span className="font-display text-sm font-extrabold tabular-nums text-ink">
            90% · {profile.rating > 0 ? `${profile.rating.toFixed(1)} ★` : "5.0 ★"}
          </span>
        </div>
      </div>

      {offer && <OfferPanel offer={offer} onSync={onSync} />}

      {!offer && (
        <div className="space-y-2 rounded-2xl border border-line bg-paper/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-ink">
              Zonas de Espera Estratégicas (Hotspots Carora)
            </p>
            <span className="text-[10px] font-bold text-muted">Evita dispersión</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {CARORA_HOTSPOTS.map((hs) => {
              const active = profile.hotspotId === hs.id;
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => onSelectHotspot(hs)}
                  className={
                    active
                      ? "rounded-xl bg-ink px-2 py-2 text-left text-[11px] font-bold text-paper"
                      : "rounded-xl border border-line bg-sheet px-2 py-2 text-left text-[11px] font-semibold text-ink"
                  }
                >
                  <span className="block truncate font-extrabold">{hs.shortName}</span>
                  <span className="block text-[10px] opacity-80">Meta: {hs.targetMotos} motos</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onPin}
              className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper whitespace-nowrap"
            >
              <MapPin className="size-3.5" /> Fijar mi GPS aquí
            </button>
            <button
              type="button"
              onClick={onOpenRoadModal}
              className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-line bg-sheet px-3 text-xs font-bold text-ink whitespace-nowrap"
            >
              <Navigation className="size-3.5" /> Radar Vial / Lluvia
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-signal">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <button
          type="button"
          className="font-bold text-muted underline"
          onClick={() => setHistory(true)}
        >
          Mis carreras (90%)
        </button>
        <button
          type="button"
          onClick={onOpenPushModal}
          className="inline-flex items-center gap-1 font-bold text-ink underline"
        >
          <Bell className="size-3 text-brand" />
          Alertas Push (SW)
        </button>
        <button
          type="button"
          className="font-bold text-ink underline"
          onClick={onOpenFeedback}
        >
          Feedback ({CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay})
        </button>
        <button
          type="button"
          className="font-bold text-muted underline"
          onClick={onReview}
        >
          Dashboard Central
        </button>
      </div>
    </div>
  );
}

function MvpFeedbackDrawer({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [queTeParecio, setQueTeParecio] = useState("Muy buena y rápida para Carora");
  const [gustoDiseno, setGustoDiseno] = useState("Sí, el diseño es claro y fácil de usar");
  const [erroresEncontraste, setErroresEncontraste] = useState("Ninguno hasta ahora");
  const [indicariasAlguien, setIndicariasAlguien] = useState(
    "Sí, la recomendaría a familiares y amigos en Carora",
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const whatsappFeedbackHref = buildFeedbackWhatsappUrl({
    queTeParecio,
    gustoDiseno,
    erroresEncontraste,
    indicariasAlguien,
  });

  const combinedBody = [
    `1. ¿Qué te pareció?: ${queTeParecio}`,
    `2. ¿Te gustó el diseño de la aplicación?: ${gustoDiseno}`,
    `3. ¿Qué errores encontraste?: ${erroresEncontraste}`,
    `4. ¿Indicarías a alguien?: ${indicariasAlguien}`,
  ].join(" | ");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-muted">
            Feedback para Mejoras · WhatsApp {CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay}
          </span>
          <h1 className="font-display text-2xl font-extrabold">
            Evaluación de Rapidez Carora
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink"
        >
          Volver
        </button>
      </div>
      <p className="text-xs text-muted">
        Responde estas 4 preguntas y envíalas directo al WhatsApp{" "}
        <span className="font-extrabold text-ink">
          {CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay}
        </span>{" "}
        y al correo del desarrollador ({CENTRAL_CARORA_CONFIG.developerEmail}):
      </p>

      <div className="space-y-2.5 rounded-2xl border border-line bg-paper p-3 text-xs">
        {/* Pregunta 1: ¿Qué te pareció? */}
        <div className="space-y-1">
          <label className="block font-extrabold text-ink">1. ¿Qué te pareció?</label>
          <div className="flex flex-wrap gap-1">
            {[
              "Excelente iniciativa para Carora",
              "Muy buena y rápida",
              "Práctica y económica",
            ].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setQueTeParecio(opt)}
                className={
                  queTeParecio === opt
                    ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper"
                    : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink"
                }
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            className="field h-9 text-xs"
            placeholder="¿Qué te pareció la aplicación?"
            value={queTeParecio}
            onChange={(e) => setQueTeParecio(e.target.value)}
          />
        </div>

        {/* Pregunta 2: ¿Te gustó el diseño de la aplicación? */}
        <div className="space-y-1">
          <label className="block font-extrabold text-ink">
            2. ¿Te gustó el diseño de la aplicación?
          </label>
          <div className="flex flex-wrap gap-1">
            {[
              "Sí, me gustó mucho el diseño",
              "Claro, moderno y fácil de usar",
              "Me gustaría mejorar detalles",
            ].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setGustoDiseno(opt)}
                className={
                  gustoDiseno === opt
                    ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper"
                    : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink"
                }
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            className="field h-9 text-xs"
            placeholder="¿Te gustó el diseño de la aplicación?"
            value={gustoDiseno}
            onChange={(e) => setGustoDiseno(e.target.value)}
          />
        </div>

        {/* Pregunta 3: ¿Qué errores encontraste? */}
        <div className="space-y-1">
          <label className="block font-extrabold text-ink">3. ¿Qué errores encontraste?</label>
          <div className="flex flex-wrap gap-1">
            {[
              "Ninguno hasta ahora",
              "Detalle en el mapa / GPS",
              "Detalle en registro o pagos",
            ].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setErroresEncontraste(opt)}
                className={
                  erroresEncontraste === opt
                    ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper"
                    : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink"
                }
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            className="field h-9 text-xs"
            placeholder="Describe si encontraste algún error o qué mejorarías…"
            value={erroresEncontraste}
            onChange={(e) => setErroresEncontraste(e.target.value)}
          />
        </div>

        {/* Pregunta 4: ¿Indicarías a alguien? */}
        <div className="space-y-1">
          <label className="block font-extrabold text-ink">4. ¿Indicarías a alguien?</label>
          <div className="flex flex-wrap gap-1">
            {[
              "¡Sí, a familiares y amigos en Carora!",
              "Sí, a toda la ciudad",
              "Sí, a motoristas conocidos",
            ].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIndicariasAlguien(opt)}
                className={
                  indicariasAlguien === opt
                    ? "rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-paper"
                    : "rounded-full border border-line bg-sheet px-2.5 py-1 text-[10px] font-semibold text-ink"
                }
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            className="field h-9 text-xs"
            placeholder="¿Indicarías la aplicación a alguien?"
            value={indicariasAlguien}
            onChange={(e) => setIndicariasAlguien(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-signal">{error}</p>}

      <a
        href={whatsappFeedbackHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void submitMvpFeedback({
            data: {
              category: `WhatsApp ${CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay}`,
              body: combinedBody,
            },
          });
        }}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-extrabold text-ink shadow-md"
      >
        <Share2 className="size-4 shrink-0" />
        Enviar a WhatsApp ({CENTRAL_CARORA_CONFIG.feedbackPhoneDisplay})
      </a>

      <button
        type="button"
        disabled={sending}
        onClick={() => {
          setSending(true);
          setError("");
          void submitMvpFeedback({
            data: {
              category: "Encuesta 4 Preguntas",
              body: combinedBody,
            },
          })
            .then(() => {
              toast.success(
                `Feedback enviado al panel y a ${CENTRAL_CARORA_CONFIG.developerEmail}`,
              );
              onDone();
            })
            .catch((err) => setError(messageOf(err)))
            .finally(() => setSending(false));
        }}
        className="h-10 rounded-full bg-ink text-xs font-bold text-paper disabled:opacity-40"
      >
        {sending
          ? "Enviando…"
          : `Guardar y enviar copia a ${CENTRAL_CARORA_CONFIG.developerEmail}`}
      </button>
    </div>
  );
}

function Review({ weather, onClose }: { weather: CityWeatherState; onClose: () => void }) {
  const [key, setKey] = useState("Carora2026");
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [error, setError] = useState("");
  const [cedula, setCedula] = useState("");
  const [note, setNote] = useState("");
  const [panics, setPanics] = useState<PanicItem[]>([]);
  const [week, setWeek] = useState<WeekItem[]>([]);
  const [fleet, setFleet] = useState<FleetDriver[]>([]);
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [audit, setAudit] = useState<AuditTrip[]>([]);
  const [feedbacks, setFeedbacks] = useState<MvpFeedbackItem[]>([]);

  const load = useCallback(
    async (next = key) => {
      setError("");
      try {
        setItems(await reviewList({ data: { key: next } }));
        const board = await opsBoard({ data: { key: next } });
        setPanics(board.panics);
        setWeek(board.week);
        setFleet(await fleetList({ data: { key: next } }));
        setMetrics(board.metrics);
        setAudit(board.trips);
        setFeedbacks(board.feedbacks);
      } catch (err) {
        setItems(null);
        setError(messageOf(err));
      }
    },
    [key],
  );

  useEffect(() => {
    void load("Carora2026");
  }, [load]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-muted">
            beisander2@gmail.com · Central Rapidez Carora
          </span>
          <h1 className="font-display text-2xl font-extrabold">
            Painel de Monitoramento (5 Motos)
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink"
        >
          Volver
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex gap-2">
          <input
            className="field h-10 text-sm font-bold"
            type="text"
            placeholder="Clave de Central (Carora2026)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button
            type="button"
            className="h-10 shrink-0 rounded-full bg-ink px-4 text-xs font-bold text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={() => void load()}
          >
            Actualizar
          </button>
        </div>
        <p className="text-[11px] font-semibold text-muted">
          Clave maestra del desarrollador / Central:{" "}
          <span className="font-extrabold text-ink">Carora2026</span>
        </p>
      </div>

      {error && <p className="text-xs font-medium text-signal">{error}</p>}

      {panics.length > 0 && (
        <div className="rounded-2xl bg-signal p-3 text-paper">
          <p className="text-xs font-extrabold">Alertas de Botón de Pánico Operacional Activas</p>
          {panics.map((item) => (
            <p key={item.id} className="mt-1 text-xs font-semibold">
              {item.who} ({item.phone}) · {item.pickup} → {item.dest}
            </p>
          ))}
        </div>
      )}

      {/* Escopo MVP Controlado: 5 Motocicletas & 15 Passageiros */}
      {metrics && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-3 text-xs">
          <div>
            <span className="block text-[10px] font-bold text-muted">
              Frota Inicial Controlada
            </span>
            <span className="font-display text-lg font-extrabold tabular-nums text-ink">
              {metrics.driversApproved} / {MVP_MAX_DRIVERS} Motos
            </span>
            <span className="block text-[10px] text-muted">Comisión 90% Piloto / 10% Central</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-muted">
              Base de Usuários MVP
            </span>
            <span className="font-display text-lg font-extrabold tabular-nums text-ink">
              {metrics.passengersApproved} / {MVP_MAX_PASSENGERS} Pasajeros
            </span>
            <span className="block text-[10px] text-muted">
              Carreras: {metrics.done} hechas · {metrics.open} activas
            </span>
          </div>
        </div>
      )}

      {/* Monitoramento em Tempo Real dos 5 Motoristas (Livre, Em Viagem, Offline) */}
      <div className="rounded-2xl border border-line bg-paper p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold text-ink">
            Estado de los {MVP_MAX_DRIVERS} Motoristas (Livre / Em Viagem / Offline)
          </p>
          <span className="text-[10px] font-bold text-muted">GPS Eco 8–10s</span>
        </div>

        {fleet.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted">
            Aún no hay motoristas aprobados en la flota de 5 unidades. Aprueba expedientes abajo.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {fleet.map((item, idx) => {
              const hs =
                CARORA_HOTSPOTS.find((h) => h.id === item.hotspotId) ?? CARORA_HOTSPOTS[0];
              return (
                <div
                  key={item.userId}
                  className="rounded-2xl border border-line bg-sheet p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-ink">
                        Unidad #{idx + 1}: {item.fullName} · Placa {item.plate}
                      </p>
                      <p className="text-[11px] text-muted">
                        {item.model} · C.I. {item.cedula} · Hotspot:{" "}
                        <span className="font-semibold text-ink">{hs.shortName}</span> ({item.sector})
                      </p>
                    </div>
                    <span
                      className={
                        item.liveState === "free"
                          ? "shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-extrabold text-ink"
                          : item.liveState === "on_trip"
                            ? "shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-extrabold text-brand"
                            : "shrink-0 rounded-full bg-line px-2.5 py-0.5 text-[10px] font-bold text-muted"
                      }
                    >
                      {item.liveState === "free"
                        ? "● LIVRE"
                        : item.liveState === "on_trip"
                          ? "● EM VIAGEM"
                          : "○ OFFLINE"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                    <span className="font-semibold text-muted">
                      ✓ {item.licenseGrade} · ✓ Cert. Médico · ✓ Antecedentes OK ·{" "}
                      {item.inPersonVerified ? "✓ Validado Presencial" : "Pend. Presencial"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCedula(item.cedula)}
                        className="rounded-full border border-line bg-paper px-2 py-0.5 font-bold text-ink"
                      >
                        Saldo {formatUsd(item.saldoUsd)}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void setFleetState({
                            data: {
                              key,
                              userId: item.userId,
                              status: item.status === "blocked" ? "approved" : "blocked",
                            },
                          }).then(() => load())
                        }
                        className="rounded-full bg-ink px-2 py-0.5 font-bold text-paper"
                      >
                        {item.status === "blocked" ? "Reactivar" : "Bloquear"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items !== null && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-paper p-3 text-xs">
          <div>
            <p className="font-extrabold text-ink">Estado de Lluvia / Quebradas en Carora</p>
            <p className="text-[11px] text-muted">
              {weather.isRaining
                ? `Alerta activa (+${weather.delayMin} min retraso estimado)`
                : "Sin alerta de lluvia activa"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              void setCityWeather({
                data: { rainMode: !weather.isRaining, delayMin: !weather.isRaining ? 4 : 0 },
              }).then(() => {
                toast.success("Estado climático de Carora actualizado");
                onClose();
              })
            }
            className="h-9 shrink-0 rounded-full bg-ink px-3 text-xs font-bold text-paper whitespace-nowrap"
          >
            {weather.isRaining ? "Desactivar lluvia" : "Activar alerta lluvia"}
          </button>
        </div>
      )}

      {items !== null && (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3">
          <div className="flex items-center gap-1.5">
            <Wallet className="size-4 text-ink" />
            <p className="text-xs font-extrabold">Recargar saldo a Mototaxista (+$5.00)</p>
          </div>
          <div className="flex gap-2">
            <input
              className="field h-10 text-sm"
              aria-label="Cédula del mototaxista"
              placeholder="Cédula (ej. V-18999888)"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
            <button
              type="button"
              className="h-10 shrink-0 rounded-full bg-brand px-4 text-xs font-extrabold text-ink"
              onClick={() => {
                setNote("");
                void topUp({ data: { key, cedula } })
                  .then(() => {
                    setNote(`Se sumaron $5.00 a la cédula ${cedula}.`);
                    toast.success("Saldo recargado (+$5.00)");
                    void load();
                  })
                  .catch((err) => setNote(messageOf(err)));
              }}
            >
              Recargar $5
            </button>
          </div>
          {note && <p className="text-xs font-semibold text-ink">{note}</p>}
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-extrabold text-muted">
            Filtro de Cadastro Físico Pendiente ({items.length})
          </p>
          {items.map((item) => (
            <article key={item.userId} className="rounded-2xl bg-paper p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{item.fullName}</p>
                <span className="text-[11px] font-extrabold text-ink">
                  {item.role === "driver" ? "Piloto (Frota 5)" : "Pasajero (MVP 15)"}
                </span>
              </div>
              <p className="text-xs text-muted">
                Cédula: {item.cedula} · Tel: {item.phone}
              </p>
              {item.role === "driver" && (
                <div className="mt-1 space-y-0.5 text-xs font-semibold text-ink">
                  <p className="flex items-center gap-1">
                    <FileText className="size-3.5 text-brand" />
                    Moto: {item.model} · Placa {item.plate} · {item.licenseGrade}
                  </p>
                  <p className="text-[11px] text-muted">
                    Cert. Médico: {item.medicalCert ? "Sí" : "No"} · Antecedentes Penales:{" "}
                    {item.criminalRecordOk ? "Verificados" : "Pendiente"}
                  </p>
                </div>
              )}

              {/* Verification Photos: Cédula, Selfie, and Moto/License Document */}
              <div
                className={
                  item.role === "driver"
                    ? "mt-2 grid grid-cols-3 gap-1.5"
                    : "mt-2 grid grid-cols-2 gap-2"
                }
              >
                <div>
                  <span className="block text-[10px] font-bold text-muted">Cédula</span>
                  {item.cedulaPhoto ? (
                    <img
                      src={item.cedulaPhoto}
                      alt="Cédula"
                      className="mt-0.5 h-20 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 grid h-20 place-items-center rounded-xl bg-sheet text-[10px] text-muted">
                      Sin foto
                    </div>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted">Selfie en vivo</span>
                  {item.selfie ? (
                    <img
                      src={item.selfie}
                      alt="Selfie"
                      className="mt-0.5 h-20 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 grid h-20 place-items-center rounded-xl bg-sheet text-[10px] text-muted">
                      Sin selfie
                    </div>
                  )}
                </div>
                {item.role === "driver" && (
                  <div>
                    <span className="block text-[10px] font-bold text-muted">
                      Licencia / Doc.
                    </span>
                    {item.circulationPhoto ? (
                      <img
                        src={item.circulationPhoto}
                        alt="Documentación de la moto"
                        className="mt-0.5 h-20 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="mt-0.5 grid h-20 place-items-center rounded-xl bg-sheet text-[10px] text-muted">
                        Sin doc
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-9 rounded-full bg-brand text-xs font-bold text-ink"
                  onClick={() =>
                    void reviewDecide({
                      data: {
                        key,
                        userId: item.userId,
                        approve: true,
                        elite: item.role === "driver",
                        note: "",
                      },
                    }).then(() => {
                      toast.success(
                        `Aprobado · Push / Email enviado a ${CENTRAL_CARORA_CONFIG.developerEmail}`,
                      );
                      void sendBrowserPush(
                        "Aprobación Confirmada",
                        `${item.fullName} (${item.cedula}) aprobado y notificado a ${CENTRAL_CARORA_CONFIG.developerEmail}.`,
                      );
                      void load();
                    })
                  }
                >
                  Validar Presencial y Aprobar
                </button>
                <button
                  type="button"
                  className="h-9 rounded-full bg-signal text-xs font-bold text-paper"
                  onClick={() =>
                    void reviewDecide({
                      data: {
                        key,
                        userId: item.userId,
                        approve: false,
                        elite: false,
                        note: "Por favor vuelve a subir fotos nítidas de tu Cédula, Selfie y documentos.",
                      },
                    }).then(() => {
                      toast(
                        `Expediente rechazado · Notificado a ${CENTRAL_CARORA_CONFIG.developerEmail}`,
                      );
                      void load();
                    })
                  }
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Validación Administrativa de Pago Móvil y Comprobantes Zelle */}
      {audit.length > 0 && (
        <div className="rounded-2xl border border-line bg-paper p-3">
          <p className="text-xs font-extrabold text-ink">
            Auditoría de Corridas y Validación de Pago Móvil / Zelle
          </p>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {audit.map((item) => (
              <div key={item.id} className="rounded-xl bg-sheet p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">
                    {item.dest} · {formatUsd(item.fareUsd)}
                  </span>
                  <span className="text-[10px] font-bold text-muted">
                    {item.payMethod} · {item.status}
                  </span>
                </div>
                {item.payRef && (
                  <p className="mt-0.5 font-extrabold text-ink">
                    Ref. Pago Móvil Central: #{item.payRef}
                  </p>
                )}
                {item.paymentProof && (
                  <img
                    src={item.paymentProof}
                    alt="Comprobante Zelle"
                    className="mt-1 h-16 w-full rounded-lg object-cover"
                  />
                )}
                {(item.payRef || item.paymentProof) && !item.adminPayVerified && (
                  <button
                    type="button"
                    onClick={() =>
                      void verifyTripPayment({ data: { key, tripId: item.id } }).then(() => {
                        toast.success("Pago validado administrativamente por la Central");
                        void load();
                      })
                    }
                    className="mt-1.5 h-8 w-full rounded-full bg-brand text-[11px] font-extrabold text-ink"
                  >
                    Validar Referencia / Comprobante en Central
                  </button>
                )}
                {item.adminPayVerified && (
                  <span className="mt-1 block text-[10px] font-extrabold text-ink">
                    ✓ Validado por Administración Central
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canal Direto de Feedback MVP (15 Pasajeros) */}
      {feedbacks.length > 0 && (
        <div className="rounded-2xl border border-line bg-paper p-3">
          <p className="text-xs font-extrabold text-ink">
            Feedback Directo Fase MVP ({feedbacks.length})
          </p>
          <div className="mt-1.5 max-h-36 space-y-1.5 overflow-y-auto">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="rounded-xl bg-sheet p-2 text-xs">
                <p className="font-bold text-ink">
                  {fb.authorName} ({fb.role === "driver" ? "Piloto" : "Pasajero MVP"}) ·{" "}
                  <span className="text-muted">{fb.category}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink">{fb.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

