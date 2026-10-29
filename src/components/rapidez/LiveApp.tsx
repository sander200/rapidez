import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Minus, Plus } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AuthPanel } from "@/components/rapidez/AuthPanel";
import { MapCanvas } from "@/components/rapidez/MapCanvas";
import { beepOffer } from "@/lib/rapidez/audio";
import { PLACES, BANKS, MODELS, placeLabel, type Place } from "@/lib/rapidez/data";
import { COMMISSION, OFFER_MS, buildRoute, etaMin, fareFor, formatKm, formatUsd, formatVes, haversine, vesOf } from "@/lib/rapidez/geo";
import {
  acceptTrip,
  declineTrip,
  fleetList,
  listChat,
  raisePanic,
  rateTrip,
  requestTrip,
  reviewDecide,
  reviewList,
  opsBoard,
  sendChat,
  setFleetState,
  setTripStatus,
  submitProfile,
  syncLive,
  topUp,
  tripHistory,
  type ChatLine,
  type FleetDriver,
  type HistoryItem,
  type NearbyMoto,
  type OpsMetrics,
  type AuditTrip,
  type PendingRate,
  type PanicItem,
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

async function pingOffer(place: string) {
  useRapidez.setState({ pushText: place });
  if (typeof Notification === "undefined") return;
  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") return;
    new Notification("Rapidez Carora", { body: `Carrera cerca: ${place}`, tag: "rapidez-offer" });
  } catch {
    /* el navegador no mostró el aviso */
  }
}

async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo leer la foto.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.62);
}

export function LiveApp() {
  const { user, isPending } = useCurrentUserState();
  const zoomBy = useRapidez((s) => s.zoomBy);
  const phase = useRapidez((s) => s.phase);
  const showPin = phase === "pickup" || phase === "destination";

  return (
    <div className="phone">
      <MapCanvas />
      <header className="top-bar absolute right-3 left-3 z-20 flex items-center gap-2">
        <div className="flex h-11 items-center gap-2 rounded-full bg-paper pr-3 pl-1 shadow-lg">
          <img src="/logo.jpg" alt="Rapidez Moto transporte" className="size-9 rounded-full object-cover" />
          <span className="font-display text-sm font-extrabold tracking-wide text-ink">RAPIDEZ</span>
        </div>
        <div className="ml-auto rounded-full bg-paper px-2 py-1 shadow-lg">
          <UserButton />
        </div>
      </header>
      <div className="zoom-stack">
        <button type="button" aria-label="Acercar" onClick={() => zoomBy(1)} className="grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg">
          <Plus className="size-5" />
        </button>
        <button type="button" aria-label="Alejar" onClick={() => zoomBy(-1)} className="grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg">
          <Minus className="size-5" />
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
            <Desk userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function Desk({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const [drivers, setDrivers] = useState<NearbyMoto[]>([]);
  const [trip, setTrip] = useState<TripView | null>(null);
  const [offer, setOffer] = useState<TripView | null>(null);
  const [pendingRate, setPendingRate] = useState<PendingRate | null>(null);
  const [review, setReview] = useState(false);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");
  const pos = useRef<{ lat: number; lng: number } | null>(null);
  const seenOffer = useRef("");
  const quote = useRef<{ dest: { lat: number; lng: number }; route: { lat: number; lng: number }[] } | null>(null);
  const onQuote = useCallback((place: Place | null) => {
    if (!place) {
      quote.current = null;
      const state = useRapidez.getState();
      if (state.phase === "pickup" || state.phase === "destination") {
        useRapidez.setState({ dest: null, route: [] });
      }
      return;
    }
    const here = useRapidez.getState().center;
    const dest = { lat: place.lat, lng: place.lng };
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
        useRapidez.setState({ center: { lat, lng }, mapSeq: seq, mapCmd: { seq, type: "fly", lat, lng } });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!online || profile?.role !== "driver") return;
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        pos.current = { lat: p.coords.latitude, lng: p.coords.longitude };
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 4000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [online, profile?.role]);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const point = pos.current ?? (profile?.role === "passenger" ? useRapidez.getState().center : null);
        const result = await syncLive({
          data: {
            deviceId: deviceId(),
            lat: point?.lat ?? null,
            lng: point?.lng ?? null,
            online,
          },
        });
        if (stop) return;
        setProfile(result.profile);
        setLocked(result.locked);
        setDrivers(result.drivers.filter((d) => d.id !== userId));
        setTrip(result.trip);
        setOffer(result.offer);
        setPendingRate(result.pendingRate);
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
        useRapidez.setState({
          useLive: true,
          profileStatus: result.profile?.status ?? null,
          fleet,
          pickup: active ? { lat: active.pickupLat, lng: active.pickupLng } : null,
          dest: active ? { lat: active.destLat, lng: active.destLng } : held?.dest ?? null,
          driverPos: driverPoint,
          phase: phaseOf(active),
          route: driverPoint && active ? [{ lat: driverPoint.lat, lng: driverPoint.lng }, targetOf(active)] : held?.route ?? [],
          routeIndex: 1,
        });
        if (result.offer && `${result.offer.id}:${result.offer.offerUntil}` !== seenOffer.current) {
          seenOffer.current = `${result.offer.id}:${result.offer.offerUntil}`;
          beepOffer();
          void pingOffer(result.offer.pickupRef);
        }
        if (!result.offer) seenOffer.current = "";
      } catch (err) {
        if (!stop) setError(messageOf(err));
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 2500);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [online, profile?.role, userId]);

  if (profile === undefined) return <p className="text-sm text-muted">Conectando con Carora…</p>;
  if (review) return <Review onClose={() => setReview(false)} />;
  if (!profile) {
    return (
      <Cadastro
        onDone={() => setProfile(undefined)}
        onReview={() => setReview(true)}
      />
    );
  }
  if (locked) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-extrabold">Un solo teléfono</h1>
        <p className="text-sm text-muted">Esta cuenta ya está abierta en otro dispositivo. Cierra la sesión allá para usar este.</p>
      </div>
    );
  }
  if (profile.status !== "approved") {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-extrabold">
          {profile.status === "rejected" ? "Hay que corregir" : profile.status === "blocked" ? "Unidad bloqueada" : "En revisión"}
        </h1>
        <p className="text-sm text-muted">
          {profile.status === "rejected"
            ? profile.rejectNote || "El desarrollador no aprobó esta identidad."
            : profile.status === "blocked"
              ? "El administrador bloqueó esta unidad. No aparece en el mapa."
              : "Cédula y selfie quedaron en la bandeja del desarrollador. Cuando apruebe, este teléfono queda vinculado."}
        </p>
        <p className="text-sm font-semibold">{profile.fullName} · {profile.cedula}</p>
        <button type="button" className="h-12 rounded-full bg-ink text-sm font-semibold text-paper" onClick={() => setReview(true)}>
          Bandeja del desarrollador
        </button>
        {profile.status === "rejected" && (
          <button type="button" className="h-12 rounded-full border border-line text-sm font-semibold" onClick={() => setProfile(null)}>
            Enviar de nuevo
          </button>
        )}
      </div>
    );
  }

  if (profile.role === "driver") {
    return (
      <DriverDesk
        profile={profile}
        online={online}
        offer={trip?.driverId === userId ? null : offer}
        trip={trip?.driverId === userId ? trip : null}
        pendingRate={pendingRate}
        error={error}
        onOnline={(value) => {
          if (value && !pos.current) pos.current = { ...useRapidez.getState().center };
          setOnline(value);
        }}
        onPin={() => {
          pos.current = { ...useRapidez.getState().center };
          setOnline(true);
        }}
        onReview={() => setReview(true)}
      />
    );
  }

  if (!trip && pendingRate) return <RateCard item={pendingRate} />;

  return (
      <PassengerDesk
        nearby={drivers.length}
        rating={profile.rating}
        ratingCount={profile.ratingCount}
        trip={trip}
        error={error}
        onQuote={onQuote}
        onRequest={async (place, pay, point) => {
        const here = pos.current ?? useRapidez.getState().center;
        setError("");
        try {
          await requestTrip({
            data: {
              pickupLat: here.lat,
              pickupLng: here.lng,
              pickupRef: placeLabel(here),
              destLat: place.lat,
              destLng: place.lng,
              destRef: `${place.name}. ${point.trim()}`,
              payMethod: pay,
              preferredDriverId: null,
            },
          });
        } catch (err) {
          setError(messageOf(err));
        }
      }}
      onCancel={async () => {
        if (!trip) return;
        await setTripStatus({ data: { tripId: trip.id, status: "cancelled" } });
      }}
    />
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
  if (trip.status === "riding" || trip.status === "pay") return { lat: trip.destLat, lng: trip.destLng };
  return { lat: trip.pickupLat, lng: trip.pickupLng };
}

function Cadastro({ onDone, onReview }: { onDone: () => void; onReview: () => void }) {
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cedula, setCedula] = useState("");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState<string>(MODELS[0]);
  const [bankPhone, setBankPhone] = useState("");
  const [bankName, setBankName] = useState<string>(BANKS[0].name);
  const [cedulaPhoto, setCedulaPhoto] = useState("");
  const [selfie, setSelfie] = useState("");
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

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Verificación</h1>
      <p className="text-sm text-muted">Cédula y selfie. Entras cuando el desarrollador aprueba.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={role === "passenger" ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper" : "h-11 rounded-full bg-paper text-sm font-semibold"} onClick={() => setRole("passenger")}>Pasajero</button>
        <button type="button" className={role === "driver" ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper" : "h-11 rounded-full bg-paper text-sm font-semibold"} onClick={() => setRole("driver")}>Mototaxista</button>
      </div>
      <input className="field" aria-label="Nombre y apellido" placeholder="Nombre y apellido" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input className="field" aria-label="Teléfono" inputMode="numeric" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="field" aria-label="Cédula" placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
      {role === "driver" && (
        <>
          <input className="field" placeholder="Placa" value={plate} onChange={(e) => setPlate(e.target.value)} />
          <select className="field" aria-label="Moto" value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select className="field" aria-label="Banco" value={bankName} onChange={(e) => setBankName(e.target.value)}>
            {BANKS.map((item) => (
              <option key={item.code} value={item.name}>{item.name}</option>
            ))}
          </select>
          <input className="field" placeholder="Teléfono Pago Móvil" value={bankPhone} onChange={(e) => setBankPhone(e.target.value)} />
        </>
      )}
      <Photo label="Foto de la cédula" ready={Boolean(cedulaPhoto)} onFile={(file) => void onFile(file, setCedulaPhoto)} />
      <Photo label="Selfie de perfil" ready={Boolean(selfie)} capture="user" onFile={(file) => void onFile(file, setSelfie)} />
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      <button
        type="button"
        disabled={pending || !cedulaPhoto || !selfie}
        className="h-12 rounded-full bg-brand text-base font-semibold text-ink disabled:opacity-40"
        onClick={() => {
          setPending(true);
          void submitProfile({
            data: { role, fullName, phone, cedula, plate, model: role === "driver" ? model : "", bankPhone, bankName: role === "driver" ? bankName : "", cedulaPhoto, selfie },
          })
            .then(() => onDone())
            .catch((err) => setError(messageOf(err)))
            .finally(() => setPending(false));
        }}
      >
        {pending ? "Enviando…" : "Enviar a revisión"}
      </button>
      <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={onReview}>
        Soy el desarrollador
      </button>
    </div>
  );
}

function Photo({
  label,
  ready,
  capture,
  onFile,
}: {
  label: string;
  ready: boolean;
  capture?: "user" | "environment";
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="flex h-12 items-center justify-between rounded-2xl border border-line bg-paper px-3 text-sm font-semibold">
      {label}
      <span className="text-muted">{ready ? "Lista" : "Tomar"}</span>
      <input className="sr-only" type="file" accept="image/*" capture={capture} onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  );
}

function PassengerDesk({
  nearby,
  rating,
  ratingCount,
  trip,
  error,
  onQuote,
  onRequest,
  onCancel,
}: {
  nearby: number;
  rating: number;
  ratingCount: number;
  trip: TripView | null;
  error: string;
  onQuote: (place: Place | null) => void;
  onRequest: (place: Place, pay: string, point: string) => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const center = useRapidez((s) => s.center);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [pay, setPay] = useState("CASH_USD");
  const [point, setPoint] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);
  const place = PLACES.find((item) => item.id === placeId) ?? null;
  const meters = place ? haversine(center, place) : 0;
  const fare = place ? fareFor(meters, Boolean(place.premiere)) : 0;
  const tooClose = Boolean(place) && meters < 120;

  useEffect(() => {
    if (trip && trip.status !== "cancelled") return;
    onQuote(place);
  }, [trip, place, center.lat, center.lng, onQuote]);

  if (history) return <HistoryList onClose={() => setHistory(false)} />;
  if (trip && trip.status !== "cancelled") return <TripCard trip={trip} mine="passenger" onCancel={() => void onCancel()} />;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">¿A dónde vamos?</h1>
      <p className="text-sm">
        Te buscamos en <span className="font-semibold">{placeLabel(center)}</span>. Mueve el mapa si el pin no está en la puerta.
      </p>
      <div className="chip-row">
        {PLACES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === placeId}
            className={item.id === placeId ? "rounded-full bg-ink px-3 py-2 text-sm font-semibold text-paper" : "rounded-full border border-line bg-paper px-3 py-2 text-sm font-medium"}
            onClick={() => setPlaceId(item.id === placeId ? null : item.id)}
          >
            {item.name}{item.premiere ? " · $1" : ""}
          </button>
        ))}
      </div>
      <input
        className="field"
        aria-label="Punto de referencia del destino"
        placeholder="Punto de referencia del destino"
        value={point}
        onChange={(e) => setPoint(e.target.value)}
      />
      {place && (
        <div>
          <p className="font-display text-4xl font-extrabold tabular-nums">
            {pay === "CASH_VES" ? formatVes(vesOf(fare)) : formatUsd(fare)}
          </p>
          <p className="text-sm text-muted">
            {formatKm(meters)} hasta {place.name}
            {place.premiere ? " · estreno del sector" : ""}
            {" · "}
            {pay === "CASH_VES" ? formatUsd(fare) : formatVes(vesOf(fare))}
          </p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["CASH_USD", "Efectivo"],
            ["CASH_VES", "Bs"],
            ["PAGO_MOVIL", "Pago Móvil"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={pay === id ? "h-11 rounded-full bg-ink text-xs font-semibold text-paper" : "h-11 rounded-full bg-paper text-xs font-semibold"}
            onClick={() => setPay(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        {nearby > 0 ? `${nearby} ${nearby === 1 ? "moto en línea" : "motos en línea"}` : "Ninguna moto en línea"}
      </p>
      {ratingCount > 0 && <p className="text-sm">Reputación {rating.toFixed(1)}</p>}
      {tooClose && <p className="text-sm font-medium text-signal">Ese punto es donde estás. Elige otro.</p>}
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      <button
        type="button"
        disabled={!place || tooClose || point.trim().length < 3 || busy}
        className="h-12 rounded-full bg-brand text-base font-semibold text-ink disabled:opacity-40"
        onClick={() => {
          if (!place) return;
          setBusy(true);
          void onRequest(place, pay, point).finally(() => setBusy(false));
        }}
      >
        {busy ? "Enviando…" : "Pedir la más cercana"}
      </button>
      <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={() => setHistory(true)}>
        Carreras hechas
      </button>
    </div>
  );
}

function TripCard({ trip, mine, onCancel }: { trip: TripView; mine: "passenger" | "driver"; onCancel: () => void }) {
  const [payRef, setPayRef] = useState("");
  const [copied, setCopied] = useState("");
  const [panicNote, setPanicNote] = useState(trip.panicked ? "Aviso enviado. Emergencias Venezuela: 171." : "");
  const meters =
    trip.driverLat != null && trip.driverLng != null
      ? haversine(
          { lat: trip.driverLat, lng: trip.driverLng },
          trip.status === "riding" ? { lat: trip.destLat, lng: trip.destLng } : { lat: trip.pickupLat, lng: trip.pickupLng },
        )
      : null;
  const title =
    trip.status === "open"
      ? "Oferta a la más cercana"
      : trip.status === "accepted"
        ? mine === "driver"
          ? "Hacia el pasajero"
          : "La moto va hacia ti"
        : trip.status === "arrived"
          ? "La moto llegó"
          : trip.status === "riding"
            ? "En camino"
            : trip.status === "pay"
              ? "Cobro"
              : "Carrera lista";
  const shareUrl = trip.shareToken ? `${window.location.origin}/viaje/${trip.shareToken}` : "";

  async function share() {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rapidez Carora", text: "Sigue mi viaje en vivo.", url: shareUrl });
        return;
      }
    } catch {
      /* el usuario canceló o el navegador no compartió */
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied("Enlace copiado.");
    } catch {
      setCopied(shareUrl);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      {trip.status === "open" && mine === "passenger" && (
        <p className="text-sm text-muted">Esperando al más cercano.</p>
      )}
      {trip.driverName && <p className="text-sm font-semibold">{trip.driverName} · sello catastrado</p>}
      {mine === "driver" && <p className="text-sm font-semibold">{trip.passengerName}</p>}
      <p className="text-sm">{trip.status === "riding" || trip.status === "open" ? trip.destRef || "Destino" : trip.pickupRef}</p>
      {trip.status === "open" && <p className="text-sm text-muted">Recogida: {trip.pickupRef}</p>}
      {meters != null && <p className="font-display text-2xl font-extrabold tabular-nums">{formatKm(meters)}</p>}
      <p className="text-sm text-muted">
        {formatUsd(trip.fareUsd)} · {formatVes(vesOf(trip.fareUsd))}
        {trip.payMethod === "CASH_USD" ? " · efectivo" : trip.payMethod === "CASH_VES" ? " · bolívares" : " · pago móvil"}
      </p>
      {meters != null && (trip.status === "accepted" || trip.status === "arrived") && (
        <p className="text-sm font-semibold">Llega en {etaMin(meters)} min</p>
      )}
      {trip.status === "riding" && <RideMeter startedAt={trip.startedAt} riddenM={trip.riddenM} />}
      {trip.payMethod === "PAGO_MOVIL" && trip.driverBankPhone && (
        <button
          type="button"
          className="h-11 rounded-full bg-paper text-sm font-semibold"
          onClick={() => void navigator.clipboard?.writeText(`${trip.driverBank} ${trip.driverBankPhone}`)}
        >
          Copiar pago móvil {trip.driverBank} {trip.driverBankPhone}
        </button>
      )}
      {["accepted", "arrived", "riding"].includes(trip.status) && <RideChat tripId={trip.id} />}
      {panicNote && <p className="rounded-2xl bg-signal px-3 py-2 text-sm font-semibold text-paper">{panicNote}</p>}
      {mine === "driver" && trip.status === "accepted" && (
        <button type="button" className="h-12 rounded-full bg-brand font-semibold" onClick={() => void setTripStatus({ data: { tripId: trip.id, status: "arrived" } })}>Ya llegué al punto</button>
      )}
      {mine === "driver" && trip.status === "arrived" && (
        <button type="button" className="h-12 rounded-full bg-brand font-semibold" onClick={() => void setTripStatus({ data: { tripId: trip.id, status: "riding" } })}>Iniciar viaje</button>
      )}
      {mine === "driver" && trip.status === "riding" && (
        <button type="button" className="h-12 rounded-full bg-brand font-semibold" onClick={() => void setTripStatus({ data: { tripId: trip.id, status: "pay" } })}>Finalizar viaje</button>
      )}
      {mine === "passenger" && trip.status === "pay" && trip.payMethod === "PAGO_MOVIL" && (
        <>
          <input className="field" inputMode="numeric" placeholder="Últimos dígitos" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          <button type="button" className="h-12 rounded-full bg-brand font-semibold" onClick={() => void setTripStatus({ data: { tripId: trip.id, status: "pay", payRef } })}>Enviar referencia</button>
        </>
      )}
      {mine === "passenger" && trip.status === "pay" && trip.payMethod !== "PAGO_MOVIL" && (
        <p className="text-sm font-semibold">
          Paga en efectivo: {trip.payMethod === "CASH_VES" ? formatVes(vesOf(trip.fareUsd)) : formatUsd(trip.fareUsd)}.
        </p>
      )}
      {mine === "driver" && trip.status === "pay" && (
        <>
          {trip.payRef && <p className="font-display text-3xl font-extrabold tabular-nums">{trip.payRef}</p>}
          <p className="text-sm text-muted">Al confirmar se descuentan {formatUsd(Math.round(trip.fareUsd * COMMISSION * 100) / 100)} de tu saldo.</p>
          <button type="button" className="h-12 rounded-full bg-ink font-semibold text-paper" onClick={() => void setTripStatus({ data: { tripId: trip.id, status: "done" } })}>Confirmar pago</button>
        </>
      )}
      {mine === "passenger" && shareUrl && ["open", "accepted", "arrived", "riding"].includes(trip.status) && (
        <>
          <button type="button" className="h-12 rounded-full bg-paper font-semibold" onClick={() => void share()}>Compartir viaje</button>
          {copied && <p className="text-sm break-all">{copied}</p>}
        </>
      )}
      {["accepted", "arrived", "riding"].includes(trip.status) && (
        <button
          type="button"
          className="h-12 rounded-full bg-signal font-semibold text-paper"
          onClick={() => {
            void raisePanic({ data: { tripId: trip.id } })
              .then(() => setPanicNote("Aviso enviado. Emergencias Venezuela: 171."))
              .catch((err) => setPanicNote(messageOf(err)));
          }}
        >
          Pánico · 171
        </button>
      )}
      {["open", "accepted"].includes(trip.status) && mine === "passenger" && (
        <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={onCancel}>Cancelar</button>
      )}
    </div>
  );
}

function RateCard({ item }: { item: PendingRate }) {
  const aspects = item.asDriver
    ? [
        ["puntual", "Puntualidad"],
        ["respeto", "Respeto"],
      ]
    : [
        ["manejo", "Conducción segura"],
        ["trato", "Amabilidad"],
        ["casco", "Casco extra"],
      ];
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(aspects.map(([id]) => [id, 5])));
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const stars = Math.max(1, Math.min(5, Math.round(aspects.reduce((sum, [id]) => sum + (scores[id] ?? 5), 0) / aspects.length)));

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">¿Cómo estuvo?</h1>
      <p className="text-sm text-muted">
        {item.asDriver ? `Califica a ${item.otherName}.` : `Califica a ${item.otherName}.`} Quien pasa de 4.5 tiene prioridad.
      </p>
      {aspects.map(([id, label]) => (
        <div key={id} className="flex flex-col gap-1">
          <p className="text-sm font-semibold">{label}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} de 5 en ${label}`}
                className={(scores[id] ?? 0) >= n ? "h-10 flex-1 rounded-full bg-brand text-sm font-semibold" : "h-10 flex-1 rounded-full bg-paper text-sm font-semibold"}
                onClick={() => setScores((prev) => ({ ...prev, [id]: n }))}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      <button
        type="button"
        disabled={sent}
        className="h-12 rounded-full bg-ink font-semibold text-paper disabled:opacity-40"
        onClick={() => {
          setSent(true);
          void rateTrip({
            data: {
              tripId: item.tripId,
              stars,
              note: aspects.map(([id, label]) => `${label} ${scores[id] ?? 5}`).join(", "),
            },
          })
            .catch((err) => {
              setSent(false);
              setError(messageOf(err));
            });
        }}
      >
        {sent ? "Listo" : `Enviar ${stars} de 5`}
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
  const seconds = startedAt ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)) : 0;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <p className="font-display text-2xl font-extrabold tabular-nums">
      {clock} · {formatKm(riddenM)}
    </p>
  );
}

function RideChat({ tripId }: { tripId: string }) {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const presets = ["Ya voy en la puerta", "Estoy en el punto", "Llego en un minuto"];

  async function load() {
    try {
      setLines(await listChat({ data: { tripId } }));
    } catch {
      /* el siguiente intento vuelve a leer */
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 2500);
    return () => clearInterval(id);
  }, [tripId]);

  async function send(body: string) {
    const clean = body.trim();
    if (!clean) return;
    await sendChat({ data: { tripId, body: clean } });
    setText("");
    await load();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {presets.map((item) => (
          <button key={item} type="button" className="rounded-full bg-paper px-3 py-2 text-xs font-semibold" onClick={() => void send(item)}>
            {item}
          </button>
        ))}
      </div>
      {lines.map((line) => (
        <p key={line.id} className={line.mine ? "text-sm font-semibold" : "text-sm text-muted"}>
          {line.body}
        </p>
      ))}
      <div className="flex gap-2">
        <input className="field" aria-label="Mensaje" placeholder="Mensaje" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" className="h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper" onClick={() => void send(text)}>
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
      <h1 className="font-display text-3xl font-extrabold">Carreras</h1>
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      {items && items.length === 0 && <p className="text-sm text-muted">Todavía no hay carreras finalizadas.</p>}
      {items?.map((item) => (
        <article key={item.id} className="rounded-2xl bg-paper px-3 py-3">
          <p className="font-semibold">{item.dest}</p>
          <p className="text-sm text-muted">
            {item.when} · {formatKm(item.distanceM)} · {formatUsd(item.fareUsd)}
            {item.commissionUsd > 0 ? ` · comisión ${formatUsd(item.commissionUsd)}` : ""}
          </p>
        </article>
      ))}
      <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={onClose}>Volver</button>
    </div>
  );
}

function OfferPanel({ offer }: { offer: TripView }) {
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [offer.id, offer.offerUntil]);
  const left = Math.max(0, Math.ceil(((offer.offerUntil ?? 0) - now) / 1000));
  const width = Math.min(100, (left / Math.round(OFFER_MS / 1000)) * 100);

  return (
    <div className="rounded-2xl bg-ink p-3 text-paper">
      <p className="text-xs font-semibold tracking-wide uppercase">Solo para ti · {left}s</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/20">
        <div className="h-full bg-brand" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-lg font-semibold">{offer.pickupRef}</p>
      <p className="text-sm">Hacia {offer.destRef || "el destino"}</p>
      <p className="text-sm">{formatUsd(offer.fareUsd)} · {formatKm(offer.distanceM)}</p>
      {left === 0 && <p className="mt-2 text-sm">Pasando a la siguiente moto…</p>}
      {error && <p className="mt-2 text-sm font-medium text-brand">{error}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== "" || left === 0}
          className="h-11 rounded-full bg-paper font-semibold text-ink disabled:opacity-40"
          onClick={() => {
            setBusy("no");
            void declineTrip({ data: { tripId: offer.id } })
              .catch((err) => setError(messageOf(err)))
              .finally(() => setBusy(""));
          }}
        >
          Rechazar
        </button>
        <button
          type="button"
          disabled={busy !== "" || left === 0}
          className="h-11 rounded-full bg-brand font-semibold text-ink disabled:opacity-40"
          onClick={() => {
            setBusy("yes");
            void acceptTrip({ data: { tripId: offer.id } })
              .catch((err) => setError(messageOf(err)))
              .finally(() => setBusy(""));
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

function DriverDesk({
  profile,
  online,
  offer,
  trip,
  pendingRate,
  error,
  onOnline,
  onPin,
  onReview,
}: {
  profile: Profile;
  online: boolean;
  offer: TripView | null;
  trip: TripView | null;
  pendingRate: PendingRate | null;
  error: string;
  onOnline: (value: boolean) => void;
  onPin: () => void;
  onReview: () => void;
}) {
  const [history, setHistory] = useState(false);
  if (history) return <HistoryList onClose={() => setHistory(false)} />;
  if (trip) return <TripCard trip={trip} mine="driver" onCancel={() => undefined} />;
  if (!offer && pendingRate) return <RateCard item={pendingRate} />;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        Sello catastrado{profile.elite ? " · Élite" : ""}
      </p>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">{profile.fullName}</h1>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label={online ? "Pasar a desconectado" : "Pasar a en línea"}
          onClick={() => onOnline(!online)}
          className={online ? "relative h-8 w-14 rounded-full bg-brand" : "relative h-8 w-14 rounded-full bg-line"}
        >
          <span className={online ? "absolute top-1 right-1 size-6 rounded-full bg-ink" : "absolute top-1 left-1 size-6 rounded-full bg-ink"} />
        </button>
      </div>
      <p className="text-sm font-semibold tabular-nums">
        Saldo {formatUsd(profile.saldoUsd)}
        {profile.ratingCount > 0 ? ` · ${profile.rating.toFixed(1)} ★` : ""}
      </p>
      <p className="text-sm text-muted">{online ? "En línea" : "Desconectado"}</p>
      {profile.saldoUsd < 0.4 && <p className="text-sm font-medium text-signal">Sin saldo de comisión.</p>}
      <button type="button" className="h-11 rounded-full bg-paper text-sm font-semibold" onClick={onPin}>
        Publicar el punto del mapa
      </button>
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      {offer && <OfferPanel offer={offer} />}
      <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={() => setHistory(true)}>Carreras hechas</button>
      <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={onReview}>Gestión</button>
    </div>
  );
}

function Review({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState("");
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [error, setError] = useState("");
  const [cedula, setCedula] = useState("");
  const [note, setNote] = useState("");
  const [panics, setPanics] = useState<PanicItem[]>([]);
  const [week, setWeek] = useState<WeekItem[]>([]);
  const [fleet, setFleet] = useState<FleetDriver[]>([]);
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [audit, setAudit] = useState<AuditTrip[]>([]);

  async function load(next = key) {
    setError("");
    try {
      setItems(await reviewList({ data: { key: next } }));
      const board = await opsBoard({ data: { key: next } });
      setPanics(board.panics);
      setWeek(board.week);
      setFleet(await fleetList({ data: { key: next } }));
      setMetrics(board.metrics);
      setAudit(board.trips);
    } catch (err) {
      setItems(null);
      setError(messageOf(err));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Gestión</h1>
      <p className="text-sm text-muted">Cédula y selfie, pasajero o mototaxista. Al aprobar, esa persona entra y queda en un solo teléfono.</p>
      <input className="field" placeholder="Clave de revisión" value={key} onChange={(e) => setKey(e.target.value)} />
      <button type="button" className="h-12 rounded-full bg-ink font-semibold text-paper" onClick={() => void load()}>Abrir pendientes</button>
      {error && <p className="text-sm font-medium text-signal">{error}</p>}
      {items?.length === 0 && <p className="text-sm">No hay solicitudes pendientes.</p>}
      {panics.length > 0 && (
        <div className="rounded-2xl bg-signal p-3 text-paper">
          <p className="text-sm font-semibold">Pánico activo</p>
          {panics.map((item) => (
            <p key={item.id} className="mt-1 text-sm">
              {item.who} · {item.phone} · {item.pickup} → {item.dest}
            </p>
          ))}
        </div>
      )}
      {metrics && (
        <div className="rounded-2xl bg-paper p-3">
          <p className="text-sm font-semibold">Corridas</p>
          <p className="mt-1 text-sm">
            {metrics.done} listas · {metrics.cancelled} canceladas · {metrics.open} en oferta
          </p>
          <p className="text-sm text-muted">
            {metrics.done + metrics.cancelled === 0
              ? "Todavía no hay carreras cerradas."
              : `Efectividad ${Math.round((metrics.done / (metrics.done + metrics.cancelled)) * 100)}%`}
          </p>
          <p className="text-sm text-muted">Si no hay moto en 2.5 km, se ofrece a la más cercana en línea.</p>
        </div>
      )}
      {audit.length > 0 && (
        <div className="rounded-2xl bg-paper p-3">
          <p className="text-sm font-semibold">Historial</p>
          {audit.map((item) => (
            <p key={item.id} className="mt-1 text-sm">
              {item.when} · {item.dest} · {formatUsd(item.fareUsd)} · {formatVes(vesOf(item.fareUsd))} · {item.status}
            </p>
          ))}
        </div>
      )}
      {week.length > 0 && (
        <div className="rounded-2xl bg-paper p-3">
          <p className="text-sm font-semibold">Comisión de 7 días</p>
          {week.map((item) => (
            <p key={item.cedula} className="mt-1 text-sm">
              {item.name} · saldo {formatUsd(item.saldo)} · cobrado {formatUsd(item.commission)}
            </p>
          ))}
        </div>
      )}
      {items?.map((item) => (
        <article key={item.userId} className="rounded-2xl bg-paper p-3">
          <p className="font-semibold">{item.fullName}</p>
          <p className="text-sm text-muted">{item.role === "driver" ? "Mototaxista" : "Pasajero"} · {item.cedula} · {item.phone}</p>
          {item.plate && <p className="text-sm">{item.plate} · {item.model}</p>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {item.cedulaPhoto && <img src={item.cedulaPhoto} alt="Cédula" className="h-28 w-full rounded-xl object-cover" />}
            {item.selfie && <img src={item.selfie} alt="Selfie" className="h-28 w-full rounded-xl object-cover" />}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" className="h-11 rounded-full bg-brand text-sm font-semibold" onClick={() => void reviewDecide({ data: { key, userId: item.userId, approve: true, elite: item.role === "driver", note: "" } }).then(() => load())}>
              {item.role === "driver" ? "Aprobar y dar sello" : "Aprobar"}
            </button>
            <button type="button" className="h-11 rounded-full bg-signal text-sm font-semibold text-paper" onClick={() => void reviewDecide({ data: { key, userId: item.userId, approve: false, elite: false, note: "La foto no coincide con la cédula." } }).then(() => load())}>Rechazar</button>
          </div>
        </article>
      ))}
      {fleet.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Flota</p>
          {fleet.map((item) => (
            <div key={item.userId} className="flex items-center justify-between gap-2 rounded-2xl bg-paper p-3">
              <p className="text-sm">
                {item.fullName} · {item.plate} · {item.status === "blocked" ? "bloqueado" : "sello catastrado"}
              </p>
              <button
                type="button"
                className="h-9 rounded-full bg-ink px-3 text-xs font-semibold text-paper"
                onClick={() =>
                  void setFleetState({
                    data: { key, userId: item.userId, status: item.status === "blocked" ? "approved" : "blocked" },
                  }).then(() => load())
                }
              >
                {item.status === "blocked" ? "Reactivar" : "Bloquear"}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 flex flex-col gap-2 rounded-2xl border border-line p-3">
        <p className="text-sm font-semibold">Recargar saldo de comisión</p>
        <p className="text-sm text-muted">Suma $5 al mototaxista aprobado con esta cédula.</p>
        <input className="field" aria-label="Cédula del mototaxista" placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
        <button
          type="button"
          className="h-11 rounded-full bg-brand text-sm font-semibold"
          onClick={() => {
            setNote("");
            void topUp({ data: { key, cedula } })
              .then(() => setNote("Listo. Se sumaron $5."))
              .catch((err) => setNote(messageOf(err)));
          }}
        >
          Recargar $5
        </button>
        {note && <p className="text-sm">{note}</p>}
      </div>
      <button type="button" className="h-11 text-sm font-semibold text-muted" onClick={onClose}>Volver</button>
    </div>
  );
}

