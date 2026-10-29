import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bike,
  Camera,
  Check,
  Copy,
  FileText,
  History,
  LocateFixed,
  MapPin,
  MessageSquare,
  Minus,
  Package,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
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
import {
  BANKS,
  HOME,
  MODELS,
  PLACES,
  SERVICE_TIERS,
  placeLabel,
  premiereAt,
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
  reviewDecide,
  reviewList,
  sendChat,
  setFleetState,
  setTripStatus,
  submitProfile,
  syncLive,
  topUp,
  tripHistory,
  type AuditTrip,
  type ChatLine,
  type FleetDriver,
  type HistoryItem,
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

async function pingOffer(place: string) {
  useRapidez.setState({ pushText: place });
  if (typeof Notification === "undefined") return;
  try {
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== "granted") return;
    new Notification("Rapidez Carora", { body: `Carrera cerca: ${place}`, tag: "rapidez-offer" });
  } catch {
    /* el navegador no mostró el aviso */
  }
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

export function LiveApp() {
  const { user, isPending } = useCurrentUserState();
  const zoomBy = useRapidez((s) => s.zoomBy);
  const phase = useRapidez((s) => s.phase);
  const showPin = phase === "pickup" || phase === "destination";

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
            <span className="block text-[10px] font-semibold text-muted">Carora · Lara</span>
          </div>
        </div>
        <div className="ml-auto rounded-full bg-paper px-2.5 py-1 shadow-lg">
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
  const [review, setReview] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");
  const pos = useRef<{ lat: number; lng: number } | null>(null);
  const seenOffer = useRef("");
  const proximityNotified = useRef("");
  const quote = useRef<{
    dest: { lat: number; lng: number };
    route: { lat: number; lng: number }[];
  } | null>(null);

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
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        if (lat >= 10.05 && lat <= 10.35 && lng >= -70.25 && lng <= -69.9) {
          pos.current = { lat, lng };
        }
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 4000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [online, profile?.role]);

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
      setProfile(result.profile);
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

      const routePts =
        driverPoint && active
          ? buildRoute({ lat: driverPoint.lat, lng: driverPoint.lng }, targetOf(active))
          : (held?.route ?? []);

      useRapidez.setState({
        useLive: true,
        profileStatus: result.profile?.status ?? null,
        fleet,
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
        void pingOffer(result.offer.pickupRef);
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
    const id = setInterval(() => void run(), 2500);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [forceSync]);

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
  if (review) return <Review onClose={() => setReview(false)} />;
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
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/25 px-2.5 py-0.5 text-xs font-bold text-ink">
            <ShieldCheck className="size-3.5" />{" "}
            {profile.role === "driver" ? "Registro Mototaxista" : "Registro Pasajero"}
          </span>
          <span className="text-xs font-bold uppercase text-muted">{profile.cedula}</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold">
          {profile.status === "rejected"
            ? "Hay que corregir documentos"
            : profile.status === "blocked"
              ? "Unidad bloqueada"
              : "Verificación en revisión"}
        </h1>
        <p className="text-sm text-muted">
          {profile.status === "rejected"
            ? profile.rejectNote ||
              "La administración solicitó volver a tomar tu selfie o documento con mayor claridad."
            : profile.status === "blocked"
              ? "La administración bloqueó esta unidad temporalmente."
              : "Recibimos tu Cédula, Selfie obligatoria y documentación. Tu expediente fue enviado a beisander2@gmail.com para aprobación."}
        </p>
        <div className="rounded-2xl bg-paper p-3 text-xs">
          <p className="font-bold text-ink">
            {profile.fullName} · {profile.phone}
          </p>
          {profile.role === "driver" && (
            <p className="mt-0.5 text-muted">
              Moto: {profile.model} · Placa {profile.plate} · {profile.bankName}
            </p>
          )}
        </div>
        <button
          type="button"
          className="h-12 rounded-full bg-ink text-sm font-semibold text-paper"
          onClick={() => setReview(true)}
        >
          Bandeja del desarrollador
        </button>
        <button
          type="button"
          className="h-12 rounded-full border border-line text-sm font-semibold"
          onClick={() => setProfile(null)}
        >
          Actualizar fotos o documentos
        </button>
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
        onSync={() => void forceSync()}
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
        onReview={() => setReview(true)}
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
      error={error}
      onQuote={onQuote}
      onSync={() => void forceSync()}
      onReview={() => setReview(true)}
      onRequest={async (destPoint, destName, pickupText, pay, point, tierId) => {
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
            },
          });
          await forceSync();
          toast.success("Solicitud enviada a las motos verificadas en Carora");
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
    (role === "driver" && (plate.trim().length < 4 || (bankPhone || phone).replace(/\D/g, "").length < 10));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-wide text-muted uppercase">
            Verificación Real · Carora
          </span>
          <h1 className="font-display text-2xl font-extrabold">Catastro obligatorio</h1>
        </div>
        <ShieldCheck className="size-7 text-brand" />
      </div>
      <p className="text-xs text-muted">
        {role === "passenger"
          ? "Por seguridad de todos en Carora, la foto de tu Cédula y tu Selfie en vivo son obligatorias para pedir mototaxi."
          : "Para trabajar como Mototaxista debes subir tu Cédula, Selfie en vivo y Carnet de Circulación / Título de la moto."}
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
          Soy Pasajero
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
          Soy Mototaxista
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
          <p className="text-xs font-bold uppercase text-muted">
            Datos obligatorios de la Moto y Pago Móvil
          </p>
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
        </div>
      )}

      {/* Mandatory Verification Photos Section */}
      <div className="space-y-2 rounded-2xl border border-line bg-paper p-3">
        <p className="text-xs font-extrabold uppercase text-ink">
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
            label="3. Carnet de Circulación / Documentación de la Moto *"
            sublabel="Título, carnet de circulación o certificado INTT donde se vea placa/serial"
            photo={circulationPhoto}
            capture="environment"
            onOpenCamera={() =>
              setActiveCamera({
                target: "circulation",
                facingMode: "environment",
                title: "Fotografiar Documentación de la Moto",
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
            },
          })
            .then(() => {
              toast.success("Expediente enviado a verificación en Rapidez Carora");
              onDone();
            })
            .catch((err) => setError(messageOf(err)))
            .finally(() => setPending(false));
        }}
      >
        {pending
          ? "Enviando expediente…"
          : missingPhotos
            ? role === "driver"
              ? "Falta Cédula, Selfie o Documento de la Moto"
              : "Falta subir Cédula y Selfie obligatoria"
            : "Enviar a verificación"}
      </button>

      <button
        type="button"
        className="h-9 text-xs font-semibold text-muted underline"
        onClick={onReview}
      >
        Bandeja del desarrollador (Aprobación)
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
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold text-ink">
            <Check className="size-3" /> Lista
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-signal/15 px-2 py-0.5 text-[10px] font-bold text-signal">
            Obligatorio
          </span>
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
        <span className="text-xs font-extrabold uppercase text-brand">{title}</span>
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
            className="h-52 w-full rounded-xl bg-black object-cover"
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

function PassengerDesk({
  nearby,
  rating,
  ratingCount,
  trip,
  error,
  onQuote,
  onSync,
  onReview,
  onRequest,
  onCancel,
}: {
  nearby: NearbyMoto[];
  rating: number;
  ratingCount: number;
  trip: TripView | null;
  error: string;
  onQuote: (destPoint: LatLng | null) => void;
  onSync: () => void;
  onReview: () => void;
  onRequest: (
    destPoint: LatLng,
    destName: string,
    pickupText: string,
    pay: string,
    point: string,
    tierId: ServiceTierId,
  ) => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const center = useRapidez((s) => s.center);
  const focusPlace = useRapidez((s) => s.focusPlace);
  const [placeId, setPlaceId] = useState<string | null>("plaza");
  const [customDest, setCustomDest] = useState<LatLng | null>(null);
  const [pickingMapDest, setPickingMapDest] = useState(false);
  const [tierId, setTierId] = useState<ServiceTierId>("moto");
  const [pay, setPay] = useState("PAGO_MOVIL");
  const [pickupNote, setPickupNote] = useState("");
  const [point, setPoint] = useState("Frente a la entrada principal");
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
        onSync={onSync}
        onCancel={() => void onCancel()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <span className="size-2 rounded-full bg-brand" />
          {nearby.length > 0
            ? `${nearby.length} ${nearby.length === 1 ? "moto verificada" : "motos verificadas"} en línea`
            : "Sin motos conectadas cerca en este instante"}
        </span>
        <span className="font-medium text-muted">
          BCV: Bs {RATE_VES.toFixed(2)}/$
          {ratingCount > 0 ? ` · ★ ${rating.toFixed(1)}` : ""}
        </span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-extrabold">¿A dónde vamos hoy?</h1>
        <p className="text-xs text-muted">
          Salida en <span className="font-bold text-ink">{placeLabel(center)}</span>. Mueve el mapa
          para ajustar el pin exacto.
        </p>
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
          <span className="text-xs font-bold uppercase text-muted">Elige destino en Carora</span>
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

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
        <span className="shrink-0 text-muted">Ir a:</span>
        {PLACES.slice(0, 5).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => focusPlace(p)}
            className="shrink-0 rounded-lg bg-paper px-2 py-1 font-medium text-ink"
          >
            {p.name}
          </button>
        ))}
      </div>

      <input
        className="field"
        aria-label="Punto de referencia del destino"
        placeholder="Referencia del destino (ej. frente a emergencias, portón azul)"
        value={point}
        onChange={(e) => setPoint(e.target.value)}
      />

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
                <span className="rounded-full bg-brand/30 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                  {t.badge}
                </span>
              </div>
              <span className="mt-1 text-xs font-extrabold text-ink">{t.name}</span>
              <span className="font-display text-sm font-extrabold tabular-nums text-ink">
                {formatUsd(tFare)}
              </span>
            </button>
          );
        })}
      </div>

      {destPoint && (
        <div className="flex items-center justify-between rounded-2xl bg-paper px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold text-muted">
              {formatKm(meters)} hasta <span className="text-ink">{destName}</span> · ~
              {etaMin(meters)} min
            </p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-ink">
              {pay === "CASH_VES" ? formatVes(vesOf(fare)) : formatUsd(fare)}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-xs font-bold text-muted">Equivalente BCV</span>
            <span className="font-display text-base font-extrabold tabular-nums text-ink">
              {pay === "CASH_VES" ? formatUsd(fare) : formatVes(vesOf(fare))}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["PAGO_MOVIL", "Pago Móvil"],
            ["CASH_USD", "Efectivo $"],
            ["CASH_VES", "Efectivo Bs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              pay === id
                ? "h-10 rounded-full bg-ink text-xs font-bold text-paper"
                : "h-10 rounded-full border border-line bg-paper text-xs font-semibold text-ink"
            }
            onClick={() => setPay(id)}
          >
            {label}
          </button>
        ))}
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
            void onRequest(
              destPoint,
              destName,
              pickupNote,
              pay,
              point.trim() || "Entrada principal",
              tierId,
            ).finally(() => setBusy(false));
          }}
        >
          {busy ? "Enviando solicitud…" : `Pedir ${tier.name}`}
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

      <button
        type="button"
        onClick={onReview}
        className="text-center text-[11px] font-semibold text-muted underline"
      >
        Bandeja del desarrollador
      </button>
    </div>
  );
}

function TripCard({
  trip,
  mine,
  onSync,
  onCancel,
}: {
  trip: TripView;
  mine: "passenger" | "driver";
  onSync: () => void;
  onCancel: () => void;
}) {
  const [payRef, setPayRef] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [panicNote, setPanicNote] = useState(
    trip.panicked ? "Alerta SOS activa. Emergencias Lara: 171 / 911." : "",
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

  const title =
    trip.status === "open"
      ? "Esperando respuesta de mototaxistas cercanos…"
      : trip.status === "accepted"
        ? mine === "driver"
          ? "En camino a recoger al pasajero"
          : "Tu mototaxi va en camino"
        : trip.status === "arrived"
          ? mine === "driver"
            ? "Llegaste al punto de recogida"
            : "¡Tu mototaxi está en la puerta!"
          : trip.status === "riding"
            ? "En viaje hacia el destino"
            : trip.status === "pay"
              ? "Llegaron al destino · Pago"
              : "Carrera finalizada";

  const steps = [
    { key: "open", label: "Solicitud" },
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
    `🛵 *Sigue mi corrida en vivo en Rapidez Carora*`,
    `📍 *Salida:* ${trip.pickupRef}`,
    `🏁 *Destino:* ${trip.destRef || "Carora"}`,
    trip.driverName
      ? `👤 *Mototaxista:* ${trip.driverName} (${trip.driverModel} · Placa ${trip.driverPlate})`
      : `⏳ *Estado:* Buscando mototaxista verificado`,
    shareUrl ? `🔗 *Mapa GPS en vivo:* ${shareUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const vesAmount = vesOf(trip.fareUsd);
  const pagoMovilBlock = [
    `Pago Móvil Rapidez Carora`,
    `Banco: ${trip.driverBank} (${trip.driverBankCode})`,
    `Teléfono: ${trip.driverBankPhone || trip.driverPhone}`,
    `Cédula: ${trip.driverCedula}`,
    `Monto: ${formatVes(vesAmount)} (${formatUsd(trip.fareUsd)})`,
  ].join("\n");

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-1">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex flex-col items-center gap-1">
            <div
              className={
                idx <= currentStepIdx
                  ? "h-1.5 w-full rounded-full bg-brand"
                  : "h-1.5 w-full rounded-full bg-line"
              }
            />
            <span
              className={
                idx === currentStepIdx
                  ? "text-[10px] font-extrabold text-ink"
                  : "text-[10px] font-medium text-muted"
              }
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          {trip.status === "open" && mine === "passenger" && (
            <p className="text-xs text-muted">
              Enviando alerta de 15s por orden de cercanía y reputación en Carora…
            </p>
          )}
        </div>
        {meters != null && (
          <div className="shrink-0 rounded-2xl bg-paper px-3 py-1.5 text-right">
            <span className="block font-display text-lg font-extrabold tabular-nums text-ink">
              {formatKm(meters)}
            </span>
            {(trip.status === "accepted" || trip.status === "riding") && (
              <span className="block text-[11px] font-semibold text-muted">
                ~{etaMin(meters)} min
              </span>
            )}
          </div>
        )}
      </div>

      {trip.driverName && mine === "passenger" && (
        <div className="rounded-2xl border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-base font-extrabold text-ink">{trip.driverName}</p>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/30 px-2 py-0.5 text-xs font-bold text-ink">
                  <Star className="size-3 fill-current" /> {trip.driverRating.toFixed(2)}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted">
                {trip.driverModel} · Cédula {trip.driverCedula}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase text-ink">
                <ShieldCheck className="size-3.5 text-brand" />
                Sello Catastrado{trip.driverElite ? " · Élite Carora" : ""}
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
              Chat en vivo
            </button>
            <a
              href={`https://wa.me/58${trip.driverPhone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${trip.driverName}, soy tu pasajero en Rapidez Carora (${trip.pickupRef}).`)}`}
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
              <span className="text-xs font-bold uppercase text-muted">Pasajero verificado</span>
              <p className="font-display text-lg font-extrabold">{trip.passengerName}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-bold text-paper"
            >
              <MessageSquare className="size-3.5" /> Chat
            </button>
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
            <p className="font-display text-base font-extrabold text-ink">
              {formatUsd(trip.fareUsd)}
            </p>
            <p className="font-semibold text-muted">{formatVes(vesAmount)}</p>
            <span className="inline-block rounded-md bg-brand/30 px-1.5 py-0.5 text-[10px] font-bold text-ink">
              {trip.payMethod === "PAGO_MOVIL"
                ? "Pago Móvil"
                : trip.payMethod === "CASH_VES"
                  ? "Efectivo Bs"
                  : "Efectivo USD"}
            </span>
          </div>
        </div>
      </div>

      {trip.status === "riding" && <RideMeter startedAt={trip.startedAt} riddenM={trip.riddenM} />}

      {showChat && ["accepted", "arrived", "riding", "pay"].includes(trip.status) && (
        <RideChat tripId={trip.id} />
      )}

      {trip.payMethod === "PAGO_MOVIL" && trip.driverName && (
        <div className="rounded-2xl border border-line bg-paper p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase text-ink">
              Datos de Pago Móvil del Conductor
            </span>
            <button
              type="button"
              onClick={() => void copyText("Pago Móvil completo", pagoMovilBlock)}
              className="inline-flex items-center gap-1 font-bold text-ink underline"
            >
              <Copy className="size-3.5" /> Copiar todo
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-sheet p-2">
              <span className="block text-[10px] text-muted">Banco</span>
              <span className="font-bold text-ink">
                {trip.driverBankCode} · {trip.driverBank}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sheet p-2">
              <div>
                <span className="block text-[10px] text-muted">Teléfono</span>
                <span className="font-bold text-ink">
                  {prettyPhone(trip.driverBankPhone || trip.driverPhone)}
                </span>
              </div>
              <button
                type="button"
                aria-label="Copiar teléfono"
                onClick={() =>
                  void copyText("Teléfono", trip.driverBankPhone || trip.driverPhone)
                }
                className="p-1 text-ink"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sheet p-2">
              <div>
                <span className="block text-[10px] text-muted">Cédula</span>
                <span className="font-bold text-ink">{trip.driverCedula}</span>
              </div>
              <button
                type="button"
                aria-label="Copiar cédula"
                onClick={() => void copyText("Cédula", trip.driverCedula)}
                className="p-1 text-ink"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-sheet p-2">
              <div>
                <span className="block text-[10px] text-muted">Monto exacto</span>
                <span className="font-bold text-ink">{formatVes(vesAmount)}</span>
              </div>
              <button
                type="button"
                aria-label="Copiar monto"
                onClick={() => void copyText("Monto en Bs", vesAmount.toFixed(2))}
                className="p-1 text-ink"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {panicNote && (
        <p className="rounded-2xl bg-signal px-3 py-2 text-xs font-bold text-paper">{panicNote}</p>
      )}

      {mine === "driver" && trip.status === "accepted" && (
        <button
          type="button"
          className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md"
          onClick={() =>
            void setTripStatus({ data: { tripId: trip.id, status: "arrived" } }).then(onSync)
          }
        >
          Ya llegué al punto de recogida
        </button>
      )}
      {mine === "driver" && trip.status === "arrived" && (
        <button
          type="button"
          className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md"
          onClick={() =>
            void setTripStatus({ data: { tripId: trip.id, status: "riding" } }).then(onSync)
          }
        >
          Pasajero a bordo · Iniciar viaje
        </button>
      )}
      {mine === "driver" && trip.status === "riding" && (
        <button
          type="button"
          className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md"
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
          className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md"
          onClick={() =>
            void setTripStatus({ data: { tripId: trip.id, status: "riding" } }).then(onSync)
          }
        >
          Ya me subí a la moto · Iniciar viaje
        </button>
      )}

      {mine === "passenger" && trip.status === "pay" && trip.payMethod === "PAGO_MOVIL" && (
        <div className="flex flex-col gap-2">
          <input
            className="field tabular-nums"
            inputMode="numeric"
            maxLength={6}
            placeholder="Últimos 4 a 6 dígitos de referencia Pago Móvil"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button
            type="button"
            disabled={payRef.length < 4}
            className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md disabled:opacity-40"
            onClick={() =>
              void setTripStatus({
                data: { tripId: trip.id, status: "pay", payRef },
              }).then(() => {
                toast.success("Referencia de Pago Móvil enviada al mototaxista");
                onSync();
              })
            }
          >
            Enviar referencia Pago Móvil ({formatVes(vesAmount)})
          </button>
        </div>
      )}

      {mine === "passenger" && trip.status === "pay" && trip.payMethod !== "PAGO_MOVIL" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted">
            Entrega en efectivo al conductor:{" "}
            <span className="font-bold text-ink">
              {trip.payMethod === "CASH_VES" ? formatVes(vesAmount) : formatUsd(trip.fareUsd)}
            </span>
          </p>
          <button
            type="button"
            className="h-12 rounded-full bg-brand font-extrabold text-ink shadow-md"
            onClick={() =>
              void setTripStatus({ data: { tripId: trip.id, status: "done" } }).then(() => {
                toast.success("¡Pago en efectivo confirmado!");
                onSync();
              })
            }
          >
            Ya entregué el efectivo · Finalizar
          </button>
        </div>
      )}

      {mine === "driver" && trip.status === "pay" && (
        <div className="flex flex-col gap-2">
          {trip.payRef && (
            <p className="rounded-xl bg-paper p-2 text-center font-display text-2xl font-extrabold tabular-nums">
              Ref. Pago Móvil: #{trip.payRef}
            </p>
          )}
          <p className="text-xs text-muted">
            Al confirmar se descuentan{" "}
            {formatUsd(Math.round(trip.fareUsd * COMMISSION * 100) / 100)} (10%) de tu saldo de
            comisión.
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

      {/* Share Ride via WhatsApp & Emergency SOS 171 */}
      <div className="grid grid-cols-2 gap-2">
        {shareUrl && ["open", "accepted", "arrived", "riding"].includes(trip.status) && (
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper"
          >
            <Share2 className="size-3.5" />
            Compartir por WhatsApp
          </a>
        )}
        {["accepted", "arrived", "riding"].includes(trip.status) && (
          <button
            type="button"
            className="flex h-10 items-center justify-center gap-1 rounded-full bg-signal text-xs font-bold text-paper"
            onClick={() => {
              void raisePanic({ data: { tripId: trip.id } })
                .then(() => {
                  setPanicNote("Alerta SOS enviada a la Central. Emergencias Venezuela: 171.");
                  toast.error("Alerta SOS enviada a Central Operativa Carora");
                })
                .catch((err) => setPanicNote(messageOf(err)));
            }}
          >
            <AlertTriangle className="size-3.5" /> SOS · 171
          </button>
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
      <span className="text-xs font-semibold uppercase tracking-wide text-brand">
        Taxímetro GPS en vivo
      </span>
      <span className="font-display text-lg font-extrabold tabular-nums">
        {clock} · {formatKm(riddenM)}
      </span>
    </div>
  );
}

function RideChat({ tripId }: { tripId: string }) {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const presets = [
    "Ya salgo a la puerta",
    "Estoy en el punto exacto",
    "Tengo Pago Móvil listo",
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
    const id = setInterval(() => void load(), 2200);
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
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3">
      <p className="text-xs font-extrabold uppercase text-muted">Chat directo de la carrera</p>
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
      <div className="max-h-28 space-y-1.5 overflow-y-auto py-1">
        {lines.length === 0 && (
          <p className="text-xs text-muted">Escribe o toca un mensaje rápido arriba.</p>
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
            {line.body}
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
            <span className="font-display text-base font-extrabold text-ink">
              {formatUsd(item.fareUsd)}
            </span>
          </div>
          <p className="text-xs text-muted">
            {item.when} · {formatKm(item.distanceM)} · {formatVes(vesOf(item.fareUsd))}
            {item.commissionUsd > 0 ? ` · comisión ${formatUsd(item.commissionUsd)}` : ""}
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
  const left = Math.max(0, Math.ceil(((offer.offerUntil ?? 0) - now) / 1000));
  const width = Math.min(100, (left / Math.round(OFFER_MS / 1000)) * 100);

  return (
    <div className="rounded-2xl bg-ink p-3.5 text-paper shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold tracking-wide text-brand uppercase">
          ¡Nueva carrera en Carora! · {left}s
        </p>
        <span className="rounded-full bg-paper/15 px-2.5 py-0.5 text-xs font-bold">
          {offer.payMethod === "PAGO_MOVIL"
            ? "Pago Móvil"
            : offer.payMethod === "CASH_VES"
              ? "Efectivo Bs"
              : "Efectivo USD"}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper/20">
        <div className="h-full bg-brand transition-all" style={{ width: `${width}%` }} />
      </div>
      <div className="mt-2.5 space-y-1">
        <p className="text-xs text-paper/75">Pasajero: {offer.passengerName}</p>
        <p className="text-base font-extrabold">Recoger en: {offer.pickupRef}</p>
        <p className="text-sm text-paper/90">Destino: {offer.destRef || "Centro de Carora"}</p>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-paper/15 pt-2">
        <span className="font-display text-2xl font-extrabold text-brand">
          {formatUsd(offer.fareUsd)} ({formatVes(vesOf(offer.fareUsd))})
        </span>
        <span className="text-xs font-bold">{formatKm(offer.distanceM)}</span>
      </div>
      {left === 0 && <p className="mt-2 text-xs">Pasando a la siguiente moto en línea…</p>}
      {error && <p className="mt-2 text-xs font-medium text-brand">{error}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== "" || left === 0}
          className="h-11 rounded-full bg-paper font-bold text-ink disabled:opacity-40"
          onClick={() => {
            setBusy("no");
            void declineTrip({ data: { tripId: offer.id } })
              .then(onSync)
              .catch((err) => setError(messageOf(err)))
              .finally(() => setBusy(""));
          }}
        >
          Rechazar
        </button>
        <button
          type="button"
          disabled={busy !== "" || left === 0}
          className="h-11 rounded-full bg-brand font-extrabold text-ink disabled:opacity-40"
          onClick={() => {
            setBusy("yes");
            void acceptTrip({ data: { tripId: offer.id } })
              .then(() => {
                toast.success("¡Carrera aceptada! Dirígete al punto de recogida.");
                onSync();
              })
              .catch((err) => setError(messageOf(err)))
              .finally(() => setBusy(""));
          }}
        >
          Aceptar carrera
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
  onSync,
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
  onSync: () => void;
  onOnline: (value: boolean) => void;
  onPin: () => void;
  onReview: () => void;
}) {
  const [history, setHistory] = useState(false);

  if (history) return <HistoryList onClose={() => setHistory(false)} />;
  if (trip) {
    return <TripCard trip={trip} mine="driver" onSync={onSync} onCancel={() => undefined} />;
  }
  if (!offer && pendingRate) return <RateCard item={pendingRate} onDone={onSync} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1 text-xs font-extrabold tracking-wide text-muted uppercase">
            <ShieldCheck className="size-3.5 text-brand" />
            Unidad Catastrada{profile.elite ? " · Élite" : ""}
          </p>
          <h1 className="font-display text-2xl font-extrabold">{profile.fullName}</h1>
          <p className="text-xs font-semibold text-muted">
            {profile.model} · Placa{" "}
            <span className="rounded bg-brand/30 px-1.5 py-0.5 font-bold text-ink">
              {profile.plate}
            </span>
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
          <span className="block text-[10px] font-bold uppercase text-muted">Estado</span>
          <span className="text-xs font-extrabold text-ink">
            {online ? "En Línea" : "Desconectado"}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-muted">Saldo Comisión</span>
          <span className="font-display text-sm font-extrabold tabular-nums text-ink">
            {formatUsd(profile.saldoUsd)}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-muted">Reputación</span>
          <span className="font-display text-sm font-extrabold text-ink">
            {profile.rating.toFixed(1)} ★
          </span>
        </div>
      </div>

      {offer && <OfferPanel offer={offer} onSync={onSync} />}

      {!offer && (
        <div className="rounded-2xl border border-line bg-paper/70 p-3">
          <p className="text-xs font-semibold text-ink">
            {online
              ? "Estás visible en el mapa de Carora. Cuando un pasajero pida moto cerca, sonará la alerta de 15 segundos."
              : "Activa el interruptor arriba para ponerte En Línea y recibir carreras reales en Carora."}
          </p>
          <button
            type="button"
            onClick={onPin}
            className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-paper"
          >
            <MapPin className="size-3.5" /> Actualizar mi posición GPS en el mapa
          </button>
        </div>
      )}

      {error && <p className="text-xs font-medium text-signal">{error}</p>}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          className="text-xs font-bold text-muted underline"
          onClick={() => setHistory(true)}
        >
          Ver mis carreras hechas
        </button>
        <button
          type="button"
          className="text-xs font-bold text-muted underline"
          onClick={onReview}
        >
          Bandeja del desarrollador
        </button>
      </div>
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
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase text-muted">
            beisander2@gmail.com · Carora
          </span>
          <h1 className="font-display text-2xl font-extrabold">Bandeja del desarrollador</h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-ink"
        >
          Volver
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="field h-10 text-sm"
          type="password"
          placeholder="Clave de desarrollador"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button
          type="button"
          className="h-10 shrink-0 rounded-full bg-ink px-4 text-xs font-bold text-paper"
          onClick={() => void load()}
        >
          Abrir
        </button>
      </div>

      {error && <p className="text-xs font-medium text-signal">{error}</p>}

      {panics.length > 0 && (
        <div className="rounded-2xl bg-signal p-3 text-paper">
          <p className="text-xs font-extrabold uppercase">Alertas SOS 171 Activas</p>
          {panics.map((item) => (
            <p key={item.id} className="mt-1 text-xs font-semibold">
              {item.who} ({item.phone}) · {item.pickup} → {item.dest}
            </p>
          ))}
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-paper p-3 text-center">
          <div>
            <span className="block font-display text-xl font-extrabold text-ink">
              {metrics.done}
            </span>
            <span className="text-[11px] font-semibold text-muted">Completadas</span>
          </div>
          <div>
            <span className="block font-display text-xl font-extrabold text-brand">
              {metrics.open}
            </span>
            <span className="text-[11px] font-semibold text-muted">En curso</span>
          </div>
          <div>
            <span className="block font-display text-xl font-extrabold text-muted">
              {metrics.cancelled}
            </span>
            <span className="text-[11px] font-semibold text-muted">Canceladas</span>
          </div>
        </div>
      )}

      {items !== null && (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3">
          <div className="flex items-center gap-1.5">
            <Wallet className="size-4 text-ink" />
            <p className="text-xs font-extrabold uppercase">Recargar saldo a Mototaxista (+$5.00)</p>
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

      {items && items.length === 0 && (
        <p className="text-xs text-muted">No hay expedientes pendientes por revisar.</p>
      )}

      {items && items.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-extrabold uppercase text-muted">
            Expedientes pendientes de verificación ({items.length})
          </p>
          {items.map((item) => (
            <article key={item.userId} className="rounded-2xl bg-paper p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{item.fullName}</p>
                <span className="rounded-full bg-brand/30 px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink">
                  {item.role === "driver" ? "Mototaxista" : "Pasajero"}
                </span>
              </div>
              <p className="text-xs text-muted">
                Cédula: {item.cedula} · Tel: {item.phone}
              </p>
              {item.role === "driver" && (
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink">
                  <FileText className="size-3.5 text-brand" />
                  Moto: {item.model} · Placa {item.plate}
                </p>
              )}

              {/* Verification Photos: Cédula, Selfie, and Moto Circulation Document */}
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
                    <span className="block text-[10px] font-bold text-muted">Doc. Moto</span>
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
                    }).then(() => load())
                  }
                >
                  Aprobar expediente
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
                    }).then(() => load())
                  }
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {fleet.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-extrabold uppercase text-muted">
            Flota Catastrada en Carora ({fleet.length})
          </p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {fleet.map((item) => (
              <div
                key={item.userId}
                className="flex items-center justify-between gap-2 rounded-2xl bg-paper px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink">
                    {item.fullName} · {item.plate}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {item.cedula} · {item.model} ·{" "}
                    {item.status === "blocked" ? "Bloqueado" : "Activo"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setCedula(item.cedula)}
                    className="h-8 rounded-full border border-line bg-sheet px-2.5 text-[11px] font-semibold text-ink"
                  >
                    Usar Cédula
                  </button>
                  <button
                    type="button"
                    className="h-8 rounded-full bg-ink px-2.5 text-[11px] font-semibold text-paper"
                    onClick={() =>
                      void setFleetState({
                        data: {
                          key,
                          userId: item.userId,
                          status: item.status === "blocked" ? "approved" : "blocked",
                        },
                      }).then(() => load())
                    }
                  >
                    {item.status === "blocked" ? "Reactivar" : "Bloquear"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {week.length > 0 && (
        <div className="rounded-2xl bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-muted">
            Saldos y Comisiones (Últimos 7 días)
          </p>
          <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
            {week.map((item) => (
              <p key={item.cedula} className="flex justify-between text-xs">
                <span>
                  {item.name} ({item.cedula})
                </span>
                <span className="font-bold">
                  Saldo {formatUsd(item.saldo)} · Com. {formatUsd(item.commission)}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {audit.length > 0 && (
        <div className="rounded-2xl bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-muted">Últimas carreras en Carora</p>
          <div className="mt-1.5 space-y-1">
            {audit.map((item) => (
              <p key={item.id} className="text-xs">
                {item.when} · <span className="font-semibold">{item.dest}</span> ·{" "}
                {formatUsd(item.fareUsd)} ({item.status})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
