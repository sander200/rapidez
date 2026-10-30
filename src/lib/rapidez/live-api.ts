import { createServerFn } from "@tanstack/react-start";
import { ConnectorType } from "@/lib/app-data";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  BANKS,
  MODELS,
  placeLabel,
  premiereAt,
  SERVICE_TIERS,
  type LiveRoadReport,
  type ServiceTierId,
} from "@/lib/rapidez/data";
import { COMMISSION, OFFER_MS, SEARCH_RADIUS_M, fareFor, haversine, type LatLng } from "@/lib/rapidez/geo";

const REVIEW_KEY = "Carora2026";
const DEVELOPER_EMAIL = "beisander2@gmail.com";
// 45s window supports 8–10s Modo Económico de GPS on Carora 3G/4G networks
const FRESH_MS = 45000;

type Role = "passenger" | "driver";

export interface Profile {
  userId: string;
  role: Role;
  fullName: string;
  phone: string;
  cedula: string;
  status: "pending" | "approved" | "rejected" | "blocked";
  elite: boolean;
  plate: string;
  model: string;
  bankPhone: string;
  bankName: string;
  rejectNote: string;
  hasCedulaPhoto: boolean;
  hasSelfie: boolean;
  hasCirculationPhoto: boolean;
  licenseGrade: string;
  medicalCert: boolean;
  criminalRecordOk: boolean;
  inPersonVerified: boolean;
  hotspotId: string;
  saldoUsd: number;
  rating: number;
  ratingCount: number;
}

export interface NearbyMoto {
  id: string;
  name: string;
  lat: number;
  lng: number;
  plate: string;
  model: string;
  elite: boolean;
  rating: number;
  meters: number;
}

export interface TripView {
  id: string;
  passengerId: string;
  driverId: string | null;
  preferredDriverId: string | null;
  status: string;
  pickupLat: number;
  pickupLng: number;
  pickupRef: string;
  destLat: number;
  destLng: number;
  destRef: string;
  fareUsd: number;
  distanceM: number;
  payMethod: string;
  payRef: string;
  payStatus: string;
  driverName: string;
  driverPlate: string;
  driverModel: string;
  driverPhone: string;
  driverCedula: string;
  driverRating: number;
  driverElite: boolean;
  driverLat: number | null;
  driverLng: number | null;
  passengerName: string;
  passengerPhone: string;
  shareToken: string;
  offerUntil: number | null;
  commissionUsd: number;
  panicked: boolean;
  startedAt: string | null;
  riddenM: number;
  driverBank: string;
  driverBankCode: string;
  driverBankPhone: string;
  cashTendered: number | null;
  paymentProof: string;
  adminPayVerified: boolean;
}

export interface PendingRate {
  tripId: string;
  otherName: string;
  asDriver: boolean;
}

export interface CityWeatherState {
  tempC: number;
  isRaining: boolean;
  rainMm: number;
  windKmh: number;
  advisory: string;
  delayMin: number;
  conditionLabel: string;
}

export interface SyncResult {
  profile: Profile | null;
  locked: boolean;
  drivers: NearbyMoto[];
  trip: TripView | null;
  offer: TripView | null;
  pendingRate: PendingRate | null;
  roadReports: LiveRoadReport[];
  weather: CityWeatherState;
  pendingReviewsCount: number;
}

interface ProfileRow {
  user_id: string;
  role: string;
  full_name: string;
  phone: string;
  cedula: string;
  status: string;
  elite: boolean;
  plate: string | null;
  model: string | null;
  bank_phone: string | null;
  bank_name: string | null;
  reject_note: string | null;
  cedula_photo: string | null;
  selfie: string | null;
  circulation_photo: string | null;
  license_grade?: string | null;
  medical_cert?: boolean | null;
  criminal_record_ok?: boolean | null;
  in_person_verified?: boolean | null;
  hotspot_id?: string | null;
  saldo_usd: number | null;
  rating_sum: number | null;
  rating_count: number | null;
}

function profileOf(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    role: row.role === "driver" ? "driver" : "passenger",
    fullName: row.full_name,
    phone: row.phone,
    cedula: row.cedula,
    status:
      row.status === "approved" || row.status === "rejected" || row.status === "blocked"
        ? row.status
        : "pending",
    elite: Boolean(row.elite),
    plate: row.plate ?? "",
    model: row.model ?? "",
    bankPhone: row.bank_phone ?? "",
    bankName: row.bank_name ?? "",
    rejectNote: row.reject_note ?? "",
    hasCedulaPhoto: Boolean(row.cedula_photo),
    hasSelfie: Boolean(row.selfie),
    hasCirculationPhoto: Boolean(row.circulation_photo),
    licenseGrade: row.license_grade ?? "2da Grado (Moto)",
    medicalCert: row.medical_cert ?? true,
    criminalRecordOk: row.criminal_record_ok ?? true,
    inPersonVerified: Boolean(row.in_person_verified),
    hotspotId: row.hotspot_id ?? "hotspot-centro",
    saldoUsd: Number(row.saldo_usd ?? 0),
    rating: Number(row.rating_count) > 0 ? Number(row.rating_sum) / Number(row.rating_count) : 0,
    ratingCount: Number(row.rating_count) || 0,
  };
}

function assertReview(key: string) {
  if (key.trim() !== REVIEW_KEY) throw new Error("Clave de revisión incorrecta.");
}

function photoOk(value: string | undefined, required: boolean, missingMsg = "Falta la foto.") {
  if (!value) {
    if (required) throw new Error(missingMsg);
    return null;
  }
  if (!value.startsWith("data:image/")) throw new Error("La foto no es válida.");
  if (value.length > 220000) {
    throw new Error("La foto es demasiado pesada. Acércala y vuelve a tomarla.");
  }
  return value;
}

async function notifyDeveloper(
  body: string,
  subject = "Rapidez Carora — Aprobación de Desarrollador (beisander2@gmail.com)",
) {
  let sentGmail = false;
  try {
    const { callTool } = await import("@/lib/app-data/client.server");
    const result = await callTool(
      "gmail_send_message",
      {
        to: [DEVELOPER_EMAIL],
        subject,
        body,
      },
      { connectorType: ConnectorType.Gmail },
    );
    sentGmail = Boolean(result.ok);
  } catch {
    sentGmail = false;
  }

  let sentPushEmail = false;
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${DEVELOPER_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        sistema: "Rapidez Moto Transporte — Carora, Venezuela",
        destinatario: DEVELOPER_EMAIL,
        mensaje: body,
        fecha: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(4000),
    });
    sentPushEmail = res.ok;
  } catch {
    sentPushEmail = false;
  }

  return sentGmail || sentPushEmail;
}

export const resendDeveloperPush = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(() => ({}))
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId} limit 1`;
    const p = rows[0];
    if (!p) throw new Error("No se encontró tu expediente.");
    const emailed = await notifyDeveloper(
      [
        "🔔 PUSH DE APROBACIÓN PENDIENTE — Rapidez Carora",
        `Para: ${DEVELOPER_EMAIL}`,
        `Rol: ${p.role === "driver" ? "Mototaxista (Frota 5 Motos)" : "Pasajero (MVP 15)"}`,
        `Nombre: ${p.full_name}`,
        `Teléfono: ${p.phone}`,
        `Cédula: ${p.cedula}`,
        p.role === "driver"
          ? `Moto: ${p.model ?? ""} · Placa: ${p.plate ?? ""} · Licencia: ${p.license_grade ?? "2da Grado"}`
          : "",
        "La Cédula, Selfie en vivo y documentación están listas en el Painel de Monitoramento (Clave: Carora2026).",
      ]
        .filter(Boolean)
        .join("\n"),
      `[Rapidez Carora] Solicitud de Aprobación — ${p.full_name} (${p.cedula})`,
    );
    return { ok: true, emailed, developerEmail: DEVELOPER_EMAIL };
  });

export const submitProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    role: Role;
    fullName: string;
    phone: string;
    cedula: string;
    plate: string;
    model: string;
    bankPhone: string;
    bankName: string;
    cedulaPhoto: string;
    selfie: string;
    circulationPhoto?: string;
    licenseGrade?: string;
    medicalCert?: boolean;
    criminalRecordOk?: boolean;
  }) => input)
  .handler(async ({ context, data }) => {
    const role: Role = data.role === "driver" ? "driver" : "passenger";
    const fullName = data.fullName.trim();
    const phone = data.phone.replace(/\D/g, "");
    let cedula = data.cedula.trim().toUpperCase();
    if (/^\d{5,9}$/.test(cedula)) cedula = `V-${cedula}`;
    if (fullName.length < 3) throw new Error("Escribe tu nombre y apellido completo.");
    if (phone.length < 10) throw new Error("El teléfono no es válido.");
    if (!/^([VEJPG])-?\d{5,9}(-?\d)?$/.test(cedula)) {
      throw new Error("La cédula o el RIF no es válido (ej. V-18422109).");
    }

    const cedulaPhoto = photoOk(
      data.cedulaPhoto,
      true,
      "La foto de la Cédula de Identidad es obligatoria.",
    );
    const selfie = photoOk(
      data.selfie,
      true,
      role === "passenger"
        ? "La selfie en vivo es obligatoria para el pasajero."
        : "La selfie del conductor es obligatoria.",
    );
    const circulationPhoto =
      role === "driver"
        ? photoOk(
            data.circulationPhoto,
            true,
            "La foto del Carnet de Circulación / Licencia / documento de la moto es obligatoria para el motorista.",
          )
        : null;

    const model = MODELS.find((item) => item === data.model.trim()) ?? "";
    const bank = BANKS.find((item) => item.name === data.bankName.trim());
    if (role === "driver" && data.plate.trim().length < 4) {
      throw new Error("Falta la placa de la moto.");
    }
    if (role === "driver" && !model) {
      throw new Error("Elige el modelo de la moto.");
    }
    if (role === "driver" && !bank) {
      throw new Error("Elige el banco receptor del Pago Móvil.");
    }
    if (role === "driver" && data.bankPhone.replace(/\D/g, "").length < 10) {
      throw new Error("Falta el teléfono afiliado al Pago Móvil.");
    }

    const licenseGrade =
      data.licenseGrade === "3ra Grado" ? "3ra Grado" : "2da Grado (Moto)";
    const medicalCert = data.medicalCert !== false;
    const criminalRecordOk = data.criminalRecordOk !== false;

    const sql = await getSql();
    const existing = await sql<{ status: string }>`
      select status from profiles where user_id = ${context.userId}
    `;
    if (existing[0]?.status === "approved") {
      throw new Error("Esta cuenta ya está aprobada.");
    }

    await sql`
      insert into profiles (
        user_id, role, full_name, phone, cedula, status, elite,
        cedula_photo, selfie, circulation_photo, plate, model, bank_phone, bank_name, reject_note,
        license_grade, medical_cert, criminal_record_ok
      ) values (
        ${context.userId}, ${role}, ${fullName}, ${phone}, ${cedula}, 'pending', false,
        ${cedulaPhoto}, ${selfie}, ${circulationPhoto},
        ${data.plate.trim().toUpperCase()}, ${model},
        ${data.bankPhone.replace(/\D/g, "")}, ${bank?.name ?? ""}, '',
        ${licenseGrade}, ${medicalCert}, ${criminalRecordOk}
      )
      on conflict (user_id) do update set
        role = excluded.role,
        full_name = excluded.full_name,
        phone = excluded.phone,
        cedula = excluded.cedula,
        status = 'pending',
        elite = false,
        cedula_photo = excluded.cedula_photo,
        selfie = excluded.selfie,
        circulation_photo = excluded.circulation_photo,
        plate = excluded.plate,
        model = excluded.model,
        bank_phone = excluded.bank_phone,
        bank_name = excluded.bank_name,
        reject_note = '',
        license_grade = excluded.license_grade,
        medical_cert = excluded.medical_cert,
        criminal_record_ok = excluded.criminal_record_ok
    `;

    const emailed = await notifyDeveloper(
      [
        "Hay una verificación nueva en Rapidez Carora.",
        `Rol: ${role === "driver" ? "mototaxista" : "pasajero"}`,
        `Nombre: ${fullName}`,
        `Teléfono: ${phone}`,
        `Cédula: ${cedula}`,
        role === "driver" ? `Placa: ${data.plate.trim().toUpperCase()} · Modelo: ${model}` : "",
        "La cédula, la selfie y la documentación están en la bandeja del desarrollador, dentro de la app.",
        "Aprueba o rechaza ahí. La clave de revisión es Carora2026.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return { ok: true, emailed };
  });

export const syncLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { deviceId: string; lat: number | null; lng: number | null; online: boolean }) => input)
  .handler(async ({ context, data }): Promise<SyncResult> => {
    const sql = await getSql();
    const roadReports = await activeRoadReports();
    const weather = await currentCaroraWeather(roadReports);

    const pendingCountRows = await sql<{ c: number }>`
      select count(*)::int as c from profiles where status = 'pending'
    `;
    const pendingReviewsCount = Number(pendingCountRows[0]?.c ?? 0);

    const rows = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) {
      return {
        profile: null,
        locked: false,
        drivers: [],
        trip: null,
        offer: null,
        pendingRate: null,
        roadReports,
        weather,
        pendingReviewsCount,
      };
    }
    const profile = profileOf(row);
    if (profile.status !== "approved") {
      return {
        profile,
        locked: false,
        drivers: [],
        trip: null,
        offer: null,
        pendingRate: null,
        roadReports,
        weather,
        pendingReviewsCount,
      };
    }
    const deviceId = data.deviceId.trim();
    if (deviceId.length < 8) throw new Error("Este teléfono no está identificado.");
    const bound = await sql<{ device_id: string }>`
      select device_id from devices where user_id = ${context.userId}
    `;
    if (!bound[0]) {
      await sql`insert into devices (user_id, device_id) values (${context.userId}, ${deviceId})`;
    } else if (bound[0].device_id !== deviceId) {
      return {
        profile,
        locked: true,
        drivers: [],
        trip: null,
        offer: null,
        pendingRate: null,
        roadReports,
        weather,
        pendingReviewsCount,
      };
    } else {
      await sql`update devices set updated_at = now() where user_id = ${context.userId}`;
    }

    const lat = typeof data.lat === "number" ? data.lat : null;
    const lng = typeof data.lng === "number" ? data.lng : null;
    if (profile.role === "driver" && lat != null && lng != null) {
      const prev = await sql<{ lat: number; lng: number }>`
        select lat, lng from positions where user_id = ${context.userId}
      `;
      const riding = await sql<{ id: string }>`
        select id from trips where driver_id = ${context.userId} and status = 'riding' limit 1
      `;
      if (prev[0] && riding[0]) {
        const step = haversine({ lat: Number(prev[0].lat), lng: Number(prev[0].lng) }, { lat, lng });
        if (step >= 8 && step <= 400) {
          await sql`update trips set ridden_m = ridden_m + ${Math.round(step)} where id = ${riding[0].id}`;
        }
      }
    }
    if (lat != null && lng != null && lat > 9 && lat < 12 && lng < -69 && lng > -72) {
      const online = profile.role === "driver" ? Boolean(data.online) : true;
      await sql`
        insert into positions (user_id, lat, lng, online, updated_at)
        values (${context.userId}, ${lat}, ${lng}, ${online}, now())
        on conflict (user_id) do update set
          lat = excluded.lat, lng = excluded.lng, online = excluded.online, updated_at = now()
      `;
    } else if (profile.role === "driver" && !data.online) {
      await sql`update positions set online = false, updated_at = now() where user_id = ${context.userId}`;
    }
    const here: LatLng | null = lat != null && lng != null ? { lat, lng } : null;
    await cascadeOffers();
    const drivers = await nearby(here);
    const trip = await activeTrip(context.userId);
    let offer: TripView | null = null;
    if (profile.role === "driver" && data.online && here) {
      offer = await openOffer(context.userId);
    }
    const pendingRate = trip ? null : await pendingRating(context.userId);
    return {
      profile,
      locked: false,
      drivers,
      trip,
      offer,
      pendingRate,
      roadReports,
      weather,
      pendingReviewsCount,
    };
  });

async function nearby(origin: LatLng | null): Promise<NearbyMoto[]> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    full_name: string;
    plate: string | null;
    model: string | null;
    elite: boolean;
    rating_sum: number | null;
    rating_count: number | null;
    lat: number;
    lng: number;
    updated_at: string | Date;
  }>`
    select p.user_id, p.full_name, p.plate, p.model, p.elite, p.rating_sum, p.rating_count, pos.lat, pos.lng, pos.updated_at
    from positions pos
    join profiles p on p.user_id = pos.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
  const now = Date.now();
  return rows
    .filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS)
    .map((row) => {
      const point = { lat: Number(row.lat), lng: Number(row.lng) };
      const count = Number(row.rating_count) || 0;
      const rating = count > 0 ? Number(row.rating_sum) / count : 0;
      return {
        id: row.user_id,
        name: row.full_name,
        lat: point.lat,
        lng: point.lng,
        plate: row.plate ?? "",
        model: row.model ?? "",
        elite: Boolean(row.elite),
        rating: Math.round(rating * 100) / 100,
        meters: origin ? Math.round(haversine(origin, point)) : 0,
      };
    })
    .filter((row) => !origin || row.meters <= SEARCH_RADIUS_M)
    .sort((a, b) => a.meters - b.meters);
}

interface TripRow {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  preferred_driver_id: string | null;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_ref: string;
  dest_lat: number;
  dest_lng: number;
  dest_ref: string | null;
  fare_usd: number;
  distance_m: number;
  pay_method: string;
  pay_ref: string | null;
  pay_status: string;
  offer_driver_id: string | null;
  offer_until_ms: number | null;
  offer_skip: string | null;
  share_token: string | null;
  commission_usd: number | null;
  panic_at: string | Date | null;
  started_at: string | Date | null;
  ridden_m: number | null;
  cash_tendered?: number | null;
  payment_proof?: string | null;
  admin_pay_verified?: boolean | null;
}

async function tripView(row: TripRow): Promise<TripView> {
  const sql = await getSql();
  const people = await sql<{
    user_id: string;
    full_name: string;
    phone: string;
    cedula: string;
    plate: string | null;
    model: string | null;
    elite: boolean;
    rating_sum: number | null;
    rating_count: number | null;
    lat: number | null;
    lng: number | null;
    bank_name: string | null;
    bank_phone: string | null;
  }>`
    select p.user_id, p.full_name, p.phone, p.cedula, p.plate, p.model, p.elite,
           p.rating_sum, p.rating_count, pos.lat, pos.lng, p.bank_name, p.bank_phone
    from profiles p
    left join positions pos on pos.user_id = p.user_id
    where p.user_id = ${row.passenger_id} or p.user_id = ${row.driver_id ?? ""}
  `;
  const passenger = people.find((p) => p.user_id === row.passenger_id);
  const driver = people.find((p) => p.user_id === row.driver_id);
  const dCount = Number(driver?.rating_count) || 0;
  const dRating = dCount > 0 ? Number(driver?.rating_sum) / dCount : 0;
  const bankObj = BANKS.find((b) => b.name === (driver?.bank_name ?? ""));

  return {
    id: row.id,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    preferredDriverId: row.preferred_driver_id,
    status: row.status,
    pickupLat: Number(row.pickup_lat),
    pickupLng: Number(row.pickup_lng),
    pickupRef: row.pickup_ref,
    destLat: Number(row.dest_lat),
    destLng: Number(row.dest_lng),
    destRef: row.dest_ref ?? "",
    fareUsd: Number(row.fare_usd),
    distanceM: Number(row.distance_m),
    payMethod: row.pay_method,
    payRef: row.pay_ref ?? "",
    payStatus: row.pay_status,
    driverName: driver?.full_name ?? "",
    driverPlate: driver?.plate ?? "",
    driverModel: driver?.model ?? "",
    driverPhone: driver?.phone ?? "",
    driverCedula: driver?.cedula ?? "",
    driverRating: Math.round(dRating * 100) / 100,
    driverElite: Boolean(driver?.elite),
    driverLat: driver?.lat == null ? null : Number(driver.lat),
    driverLng: driver?.lng == null ? null : Number(driver.lng),
    passengerName: passenger?.full_name ?? "",
    passengerPhone: passenger?.phone ?? "",
    shareToken: row.share_token ?? "",
    offerUntil: row.offer_until_ms == null ? null : Number(row.offer_until_ms),
    commissionUsd: Number(row.commission_usd ?? 0),
    panicked: Boolean(row.panic_at),
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    riddenM: Number(row.ridden_m ?? 0),
    driverBank: driver?.bank_name ?? "",
    driverBankCode: bankObj?.code ?? "",
    driverBankPhone: driver?.bank_phone ?? "",
    cashTendered: row.cash_tendered == null ? null : Number(row.cash_tendered),
    paymentProof: row.payment_proof ?? "",
    adminPayVerified: Boolean(row.admin_pay_verified),
  };
}

async function activeTrip(userId: string): Promise<TripView | null> {
  const sql = await getSql();
  const rows = await sql<TripRow>`
    select * from trips
    where status not in ('done', 'cancelled')
      and (passenger_id = ${userId} or driver_id = ${userId})
    order by created_at desc
    limit 1
  `;
  return rows[0] ? tripView(rows[0]) : null;
}

/**
 * Algoritmo de Match Direto (Modelo "Pesca" / Disparo Simultâneo para os 5 motoristas):
 * O pedido aberto ('open') é exibido simultaneamente para todos os motoristas livres.
 * O primeiro que aceitar na tela assume a corrida.
 */
async function openOffer(driverId: string): Promise<TripView | null> {
  const sql = await getSql();
  const rows = await sql<TripRow>`
    select * from trips
    where status = 'open'
    order by created_at asc
    limit 5
  `;
  const row = rows.find((r) => {
    const skipped = String(r.offer_skip ?? "")
      .split(",")
      .filter(Boolean);
    return !skipped.includes(driverId);
  });
  if (!row) return null;
  const view = await tripView(row);
  // Provide a live countdown window so the alert bar pulses for all 5 drivers
  if (!view.offerUntil || view.offerUntil <= Date.now()) {
    view.offerUntil = Date.now() + OFFER_MS;
  }
  return view;
}

async function candidates(pickup: LatLng, fare: number) {
  const sql = await getSql();
  const need = Math.max(0.4, Math.round(fare * COMMISSION * 100) / 100);
  const rows = await sql<{
    user_id: string;
    rating_sum: number;
    rating_count: number;
    saldo_usd: number;
    lat: number;
    lng: number;
    updated_at: string | Date;
  }>`
    select p.user_id, p.rating_sum, p.rating_count, p.saldo_usd, pos.lat, pos.lng, pos.updated_at
    from profiles p
    join positions pos on pos.user_id = p.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
  const now = Date.now();
  const fresh = rows
    .filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS)
    .map((row) => {
      const count = Number(row.rating_count) || 0;
      return {
        id: row.user_id,
        meters: haversine(pickup, { lat: Number(row.lat), lng: Number(row.lng) }),
        rating: count > 0 ? Number(row.rating_sum) / count : 0,
        rated: count > 0,
        saldo: Number(row.saldo_usd),
      };
    })
    .filter((row) => row.saldo + 0.001 >= need);
  const near = fresh.filter((row) => row.meters <= SEARCH_RADIUS_M);
  const pool = near.length > 0 ? near : fresh;
  return pool.sort((a, b) => {
    const ap = a.rated && a.rating >= 4.5 ? 0 : 1;
    const bp = b.rated && b.rating >= 4.5 ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.meters - b.meters;
  });
}

async function cascadeOffers() {
  const sql = await getSql();
  const now = Date.now();
  const trips = await sql<TripRow>`select * from trips where status = 'open' order by created_at asc`;
  const people = await sql<{ user_id: string; rating_sum: number; rating_count: number }>`
    select user_id, rating_sum, rating_count from profiles where role = 'passenger'
  `;
  const score = (id: string) => {
    const row = people.find((person) => person.user_id === id);
    if (!row || !Number(row.rating_count)) return 0;
    return Number(row.rating_sum) / Number(row.rating_count);
  };
  trips.sort((a, b) => score(b.passenger_id) - score(a.passenger_id));
  for (const trip of trips) {
    const until = Number(trip.offer_until_ms ?? 0);
    const current = trip.offer_driver_id;
    if (current && until > now) continue;
    let skip = String(trip.offer_skip ?? "").split(",").filter(Boolean);
    if (current) skip = [...new Set([...skip, current])];
    const list = await candidates(
      { lat: Number(trip.pickup_lat), lng: Number(trip.pickup_lng) },
      Number(trip.fare_usd),
    );
    let next = list.find((driver) => !skip.includes(driver.id));
    if (!next && list.length) {
      skip = [];
      next = list[0];
    }
    await sql`
      update trips set
        offer_driver_id = ${next ? next.id : null},
        offer_until_ms = ${next ? now + OFFER_MS : null},
        offer_skip = ${skip.join(",")}
      where id = ${trip.id} and status = 'open'
        and (offer_driver_id is null or offer_until_ms is null or offer_until_ms <= ${now})
    `;
  }
}

async function pendingRating(userId: string): Promise<PendingRate | null> {
  const sql = await getSql();
  const rows = await sql<{ id: string; passenger_id: string; driver_id: string | null }>`
    select t.id, t.passenger_id, t.driver_id
    from trips t
    where t.status = 'done'
      and (t.passenger_id = ${userId} or t.driver_id = ${userId})
      and not exists (
        select 1 from ratings r where r.trip_id = t.id and r.from_user = ${userId}
      )
    order by t.updated_at desc
    limit 1
  `;
  const trip = rows[0];
  if (!trip) return null;
  const otherId = trip.passenger_id === userId ? trip.driver_id : trip.passenger_id;
  if (!otherId) return null;
  const names = await sql<{ full_name: string }>`select full_name from profiles where user_id = ${otherId}`;
  return {
    tripId: trip.id,
    otherName: names[0]?.full_name ?? "La otra persona",
    asDriver: trip.driver_id === userId,
  };
}

export const requestTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    pickupLat: number;
    pickupLng: number;
    pickupRef: string;
    destLat: number;
    destLng: number;
    destRef: string;
    payMethod: string;
    preferredDriverId: string | null;
    serviceTier?: ServiceTierId;
    cashTendered?: number | null;
  }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await sql<{ role: string; status: string }>`
      select role, status from profiles where user_id = ${context.userId}
    `;
    if (me[0]?.role !== "passenger" || me[0]?.status !== "approved") {
      throw new Error("Tu cuenta aún no puede pedir carreras.");
    }
    const busy = await sql<{ id: string }>`
      select id from trips where passenger_id = ${context.userId} and status not in ('done', 'cancelled') limit 1
    `;
    if (busy[0]) throw new Error("Ya tienes una carrera abierta.");
    const pickup = { lat: data.pickupLat, lng: data.pickupLng };
    const dest = { lat: data.destLat, lng: data.destLng };
    const destRef = data.destRef.trim();
    if (destRef.length < 3) throw new Error("Escribe el punto de referencia del destino.");
    const distanceM = Math.round(haversine(pickup, dest));
    if (distanceM < 120) throw new Error("El destino está demasiado cerca.");
    const ref = data.pickupRef.trim() || "Donde estoy";
    const id = `t_${crypto.randomUUID()}`;
    const share = crypto.randomUUID().replace(/-/g, "");
    const pay =
      data.payMethod === "PAGO_MOVIL"
        ? "PAGO_MOVIL"
        : data.payMethod === "ZELLE_WALLET"
          ? "ZELLE_WALLET"
          : data.payMethod === "CASH_VES"
            ? "CASH_VES"
            : "CASH_USD";
    const tier = SERVICE_TIERS.find((t) => t.id === data.serviceTier) ?? SERVICE_TIERS[0];
    const baseFare = fareFor(distanceM, premiereAt(dest));
    const totalFare = Math.round((baseFare + tier.extraUsd) * 100) / 100;
    const cashTendered =
      typeof data.cashTendered === "number" && data.cashTendered > 0
        ? Math.round(data.cashTendered * 100) / 100
        : null;

    await sql`
      insert into trips (
        id, passenger_id, preferred_driver_id, status,
        pickup_lat, pickup_lng, pickup_ref, dest_lat, dest_lng, dest_ref,
        fare_usd, distance_m, pay_method, share_token, offer_until_ms, cash_tendered
      ) values (
        ${id}, ${context.userId}, ${data.preferredDriverId}, 'open',
        ${pickup.lat}, ${pickup.lng}, ${ref}, ${dest.lat}, ${dest.lng}, ${destRef},
        ${totalFare}, ${distanceM}, ${pay}, ${share}, ${Date.now() + OFFER_MS}, ${cashTendered}
      )
    `;
    await cascadeOffers();
    return { id };
  });

/**
 * Modelo "Pesca" / Disparo Simultâneo:
 * Qualquer um dos 5 motoristas aprovados da frota que clicar primeiro assume a corrida.
 */
export const acceptTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await sql<{ role: string; status: string }>`
      select role, status from profiles where user_id = ${context.userId}
    `;
    if (me[0]?.role !== "driver" || me[0]?.status !== "approved") {
      throw new Error("Solo un mototaxista aprobado puede aceptar.");
    }
    const taken = await sql<{ id: string }>`
      update trips set driver_id = ${context.userId}, status = 'accepted', updated_at = now()
      where id = ${data.tripId} and status = 'open'
      returning id
    `;
    if (!taken[0]) throw new Error("Esa carrera ya la tomó otro mototaxista de la flota.");
    return { ok: true };
  });

export const setTripStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string; status: string; payRef?: string; paymentProof?: string }) => input)
  .handler(async ({ context, data }) => {
    const allowed = ["arrived", "riding", "pay", "done", "cancelled"];
    if (!allowed.includes(data.status)) throw new Error("Estado inválido.");
    const sql = await getSql();
    const rows = await sql<{
      passenger_id: string;
      driver_id: string | null;
      status: string;
      fare_usd: number;
    }>`
      select passenger_id, driver_id, status, fare_usd from trips where id = ${data.tripId}
    `;
    const trip = rows[0];
    if (!trip) throw new Error("No existe esa carrera.");
    const mine = trip.passenger_id === context.userId || trip.driver_id === context.userId;
    if (!mine) throw new Error("No es tu carrera.");
    if (data.status === "cancelled") {
      if (trip.passenger_id !== context.userId) throw new Error("Solo el pasajero cancela.");
      if (!["open", "accepted"].includes(trip.status)) throw new Error("Ya no se puede cancelar.");
    }
    if (["arrived", "riding", "pay"].includes(data.status) && trip.driver_id !== context.userId) {
      // Allow passenger to submit payRef or paymentProof while in 'pay' or 'riding'
      if (!(data.status === "pay" && trip.passenger_id === context.userId)) {
        throw new Error("Eso lo marca el mototaxista.");
      }
    }
    if (data.status === "done" && trip.driver_id !== context.userId && trip.passenger_id !== context.userId) {
      throw new Error("El cobro y cierre de la carrera lo confirma el mototaxista.");
    }
    const payRef = (data.payRef ?? "").replace(/\D/g, "").slice(0, 12);
    const proof = data.paymentProof ? photoOk(data.paymentProof, false) : null;
    const commission =
      data.status === "done" ? Math.round(Number(trip.fare_usd) * COMMISSION * 100) / 100 : 0;
    if (data.status === "done" && trip.driver_id) {
      await sql`
        update profiles set saldo_usd = saldo_usd - ${commission} where user_id = ${trip.driver_id}
      `;
    }
    await sql`
      update trips set
        status = ${data.status},
        commission_usd = case when ${data.status} = 'done' then ${commission} else commission_usd end,
        pay_ref = case when ${payRef} = '' then pay_ref else ${payRef} end,
        payment_proof = case when ${proof} is null then payment_proof else ${proof} end,
        pay_status = case
          when ${data.status} = 'done' then 'PAID'
          when ${payRef} <> '' or ${proof} is not null then 'VERIFYING'
          else pay_status
        end,
        started_at = case
          when ${data.status} = 'riding' and started_at is null then now()
          else started_at
        end,
        updated_at = now()
      where id = ${data.tripId}
    `;
    return { ok: true, commission };
  });

export interface ReviewItem {
  userId: string;
  role: Role;
  fullName: string;
  phone: string;
  cedula: string;
  plate: string;
  model: string;
  bankName: string;
  bankPhone: string;
  cedulaPhoto: string;
  selfie: string;
  circulationPhoto: string;
  licenseGrade: string;
  medicalCert: boolean;
  criminalRecordOk: boolean;
}

export const reviewList = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string }) => input)
  .handler(async ({ data }): Promise<ReviewItem[]> => {
    assertReview(data.key);
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select * from profiles where status = 'pending' order by created_at asc
    `;
    return rows.map((row) => ({
      userId: row.user_id,
      role: row.role === "driver" ? "driver" : "passenger",
      fullName: row.full_name,
      phone: row.phone,
      cedula: row.cedula,
      plate: row.plate ?? "",
      model: row.model ?? "",
      bankName: row.bank_name ?? "",
      bankPhone: row.bank_phone ?? "",
      cedulaPhoto: row.cedula_photo ?? "",
      selfie: row.selfie ?? "",
      circulationPhoto: row.circulation_photo ?? "",
      licenseGrade: row.license_grade ?? "2da Grado (Moto)",
      medicalCert: row.medical_cert ?? true,
      criminalRecordOk: row.criminal_record_ok ?? true,
    }));
  });

export const reviewDecide = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string; userId: string; approve: boolean; elite: boolean; note: string }) => input)
  .handler(async ({ data }) => {
    assertReview(data.key);
    const sql = await getSql();
    const targetRows = await sql<ProfileRow>`
      select * from profiles where user_id = ${data.userId} limit 1
    `;
    const target = targetRows[0];
    if (data.approve) {
      await sql`
        update profiles set
          status = 'approved',
          elite = case when role = 'driver' then true else ${Boolean(data.elite)} end,
          in_person_verified = true,
          reject_note = ''
        where user_id = ${data.userId} and status = 'pending'
      `;
    } else {
      await sql`
        update profiles set status = 'rejected', elite = false, reject_note = ${data.note.trim().slice(0, 180)}
        where user_id = ${data.userId} and status = 'pending'
      `;
    }
    if (target) {
      await notifyDeveloper(
        [
          data.approve
            ? "✅ APROBACIÓN DEL DESARROLLADOR CONFIRMADA — Rapidez Carora"
            : "❌ EXPEDIENTE RECHAZADO POR DESARROLLADOR — Rapidez Carora",
          `Correo Desarrollador: ${DEVELOPER_EMAIL}`,
          `Usuario: ${target.full_name} (${target.cedula})`,
          `Teléfono: ${target.phone}`,
          `Rol: ${target.role === "driver" ? "Mototaxista (Frota 5)" : "Pasajero (MVP 15)"}`,
          target.role === "driver" ? `Moto: ${target.model ?? ""} · Placa: ${target.plate ?? ""}` : "",
          data.approve
            ? "Estado: APROBADO y habilitado para operar en Carora."
            : `Motivo rechazo: ${data.note.trim() || "Corregir documentos"}`,
        ]
          .filter(Boolean)
          .join("\n"),
        data.approve
          ? `[Rapidez Carora] Aprobado: ${target.full_name} (${target.cedula})`
          : `[Rapidez Carora] Rechazado: ${target.full_name} (${target.cedula})`,
      );
    }
    return { ok: true };
  });

export interface ChatLine {
  id: string;
  body: string;
  mine: boolean;
  attachmentPhoto: string;
}

export const listChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }): Promise<ChatLine[]> => {
    const sql = await getSql();
    const trip = await sql<{ id: string }>`
      select id from trips
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding', 'pay')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
    `;
    if (!trip[0]) return [];
    const rows = await sql<{ id: string; from_user: string; body: string; attachment_photo: string | null }>`
      select id, from_user, body, attachment_photo from messages where trip_id = ${data.tripId} order by created_at asc limit 40
    `;
    return rows.map((row) => ({
      id: row.id,
      body: row.body,
      mine: row.from_user === context.userId,
      attachmentPhoto: row.attachment_photo ?? "",
    }));
  });

export const sendChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string; body: string; attachmentPhoto?: string }) => input)
  .handler(async ({ context, data }) => {
    const photo = data.attachmentPhoto
      ? photoOk(data.attachmentPhoto, false, "Captura de comprobante inválida.")
      : null;
    const body =
      data.body.trim().slice(0, 140) ||
      (photo ? "📎 Comprobante de pago (Zelle / Billetera Digital)" : "");
    if (body.length < 1 && !photo) throw new Error("Escribe el mensaje o adjunta el comprobante.");
    const sql = await getSql();
    const trip = await sql<{ id: string }>`
      select id from trips
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding', 'pay')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
    `;
    if (!trip[0]) throw new Error("Esa carrera no tiene chat.");
    await sql`
      insert into messages (id, trip_id, from_user, body, attachment_photo)
      values (${`m_${crypto.randomUUID()}`}, ${data.tripId}, ${context.userId}, ${body}, ${photo})
    `;
    if (photo) {
      await sql`
        update trips
        set payment_proof = ${photo},
            pay_status = case when pay_status = 'PAID' then 'PAID' else 'VERIFYING' end,
            updated_at = now()
        where id = ${data.tripId}
      `;
    }
    return { ok: true };
  });

export interface FleetDriver {
  userId: string;
  fullName: string;
  phone: string;
  cedula: string;
  plate: string;
  model: string;
  status: "approved" | "blocked";
  liveState: "free" | "on_trip" | "offline";
  sector: string;
  hotspotId: string;
  licenseGrade: string;
  medicalCert: boolean;
  criminalRecordOk: boolean;
  inPersonVerified: boolean;
  saldoUsd: number;
}

export const fleetList = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string }) => input)
  .handler(async ({ data }): Promise<FleetDriver[]> => {
    assertReview(data.key);
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      full_name: string;
      phone: string;
      cedula: string;
      plate: string | null;
      model: string | null;
      status: string;
      hotspot_id: string | null;
      license_grade: string | null;
      medical_cert: boolean | null;
      criminal_record_ok: boolean | null;
      in_person_verified: boolean | null;
      saldo_usd: number | null;
      lat: number | null;
      lng: number | null;
      online: boolean | null;
      pos_updated_at: string | Date | null;
      active_trip_id: string | null;
    }>`
      select
        p.user_id, p.full_name, p.phone, p.cedula, p.plate, p.model, p.status,
        p.hotspot_id, p.license_grade, p.medical_cert, p.criminal_record_ok, p.in_person_verified, p.saldo_usd,
        pos.lat, pos.lng, pos.online, pos.updated_at as pos_updated_at,
        (select t.id from trips t where t.driver_id = p.user_id and t.status in ('accepted', 'arrived', 'riding', 'pay') limit 1) as active_trip_id
      from profiles p
      left join positions pos on pos.user_id = p.user_id
      where p.role = 'driver' and p.status in ('approved', 'blocked')
      order by p.full_name asc
    `;
    const now = Date.now();
    return rows.map((row) => {
      const isFresh =
        Boolean(row.online) &&
        row.pos_updated_at != null &&
        now - new Date(row.pos_updated_at).getTime() < FRESH_MS;
      const liveState: "free" | "on_trip" | "offline" = row.active_trip_id
        ? "on_trip"
        : isFresh
          ? "free"
          : "offline";
      const sector =
        row.lat != null && row.lng != null
          ? placeLabel({ lat: Number(row.lat), lng: Number(row.lng) })
          : "Sin señal GPS";
      return {
        userId: row.user_id,
        fullName: row.full_name,
        phone: row.phone,
        cedula: row.cedula,
        plate: row.plate ?? "",
        model: row.model ?? "",
        status: row.status === "blocked" ? "blocked" : "approved",
        liveState,
        sector,
        hotspotId: row.hotspot_id ?? "hotspot-centro",
        licenseGrade: row.license_grade ?? "2da Grado (Moto)",
        medicalCert: row.medical_cert ?? true,
        criminalRecordOk: row.criminal_record_ok ?? true,
        inPersonVerified: Boolean(row.in_person_verified),
        saldoUsd: Number(row.saldo_usd ?? 0),
      };
    });
  });

export const setFleetState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string; userId: string; status: "approved" | "blocked" }) => input)
  .handler(async ({ data }) => {
    assertReview(data.key);
    const next = data.status === "blocked" ? "blocked" : "approved";
    const sql = await getSql();
    await sql`
      update profiles set status = ${next}
      where user_id = ${data.userId} and role = 'driver' and status in ('approved', 'blocked')
    `;
    if (next === "blocked") {
      await sql`update positions set online = false, updated_at = now() where user_id = ${data.userId}`;
    }
    return { ok: true };
  });

export const declineTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ offer_skip: string | null }>`
      select offer_skip from trips where id = ${data.tripId} limit 1
    `;
    const skip = String(rows[0]?.offer_skip ?? "")
      .split(",")
      .filter(Boolean);
    const nextSkip = [...new Set([...skip, context.userId])].join(",");
    await sql`
      update trips set offer_skip = ${nextSkip}, offer_until_ms = 0
      where id = ${data.tripId} and status = 'open'
    `;
    await cascadeOffers();
    return { ok: true };
  });

export const raisePanic = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      update trips set panic_at = now()
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
      returning id
    `;
    if (!rows[0]) throw new Error("No hay un viaje activo.");
    await notifyDeveloper(
      [
        "PÁNICO en un viaje de Rapidez Carora.",
        `Carrera: ${data.tripId}`,
        "Ábrelo en la bandeja del desarrollador. Emergencias: 171.",
      ].join("\n"),
      "Rapidez Carora — pánico",
    );
    return { ok: true };
  });

export const rateTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string; stars: number; note: string }) => input)
  .handler(async ({ context, data }) => {
    const stars = Math.max(1, Math.min(5, Math.round(data.stars)));
    const note = data.note.trim().slice(0, 180);
    const sql = await getSql();
    const rows = await sql<{ passenger_id: string; driver_id: string | null; status: string }>`
      select passenger_id, driver_id, status from trips where id = ${data.tripId}
    `;
    const trip = rows[0];
    if (!trip || trip.status !== "done") throw new Error("La carrera todavía no termina.");
    const mine = trip.passenger_id === context.userId || trip.driver_id === context.userId;
    if (!mine || !trip.driver_id) throw new Error("No puedes calificar esta carrera.");
    const other = trip.passenger_id === context.userId ? trip.driver_id : trip.passenger_id;
    const inserted = await sql<{ trip_id: string }>`
      insert into ratings (trip_id, from_user, to_user, stars, note)
      values (${data.tripId}, ${context.userId}, ${other}, ${stars}, ${note})
      on conflict (trip_id, from_user) do nothing
      returning trip_id
    `;
    if (inserted[0]) {
      await sql`
        update profiles set rating_sum = rating_sum + ${stars}, rating_count = rating_count + 1
        where user_id = ${other}
      `;
    }
    return { ok: true };
  });

export interface HistoryItem {
  id: string;
  dest: string;
  fareUsd: number;
  commissionUsd: number;
  distanceM: number;
  when: string;
}

export const tripHistory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(() => ({}))
  .handler(async ({ context }): Promise<HistoryItem[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      dest_ref: string | null;
      fare_usd: number;
      commission_usd: number | null;
      distance_m: number;
      updated_at: string | Date;
    }>`
      select id, dest_ref, fare_usd, commission_usd, distance_m, updated_at
      from trips
      where status = 'done' and (passenger_id = ${context.userId} or driver_id = ${context.userId})
      order by updated_at desc
      limit 12
    `;
    return rows.map((row) => ({
      id: row.id,
      dest: row.dest_ref || "Carora",
      fareUsd: Number(row.fare_usd),
      commissionUsd: Number(row.commission_usd ?? 0),
      distanceM: Number(row.distance_m),
      when: new Date(row.updated_at).toLocaleString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }),
    }));
  });

export interface PanicItem {
  id: string;
  who: string;
  phone: string;
  pickup: string;
  dest: string;
}

export interface WeekItem {
  name: string;
  cedula: string;
  saldo: number;
  commission: number;
}

export interface AuditTrip {
  id: string;
  dest: string;
  fareUsd: number;
  status: string;
  payMethod: string;
  payRef: string;
  paymentProof: string;
  adminPayVerified: boolean;
  when: string;
}

export interface OpsMetrics {
  done: number;
  cancelled: number;
  open: number;
  driversApproved: number;
  passengersApproved: number;
}

export interface MvpFeedbackItem {
  id: string;
  authorName: string;
  role: string;
  category: string;
  body: string;
  when: string;
}

export const opsBoard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{
      panics: PanicItem[];
      week: WeekItem[];
      metrics: OpsMetrics;
      trips: AuditTrip[];
      feedbacks: MvpFeedbackItem[];
    }> => {
      assertReview(data.key);
      const sql = await getSql();
      const panics = await sql<{
        id: string;
        full_name: string;
        phone: string;
        pickup_ref: string;
        dest_ref: string | null;
      }>`
        select t.id, p.full_name, p.phone, t.pickup_ref, t.dest_ref
        from trips t
        join profiles p on p.user_id = t.passenger_id
        where t.panic_at is not null and t.status in ('accepted', 'arrived', 'riding')
        order by t.panic_at desc
        limit 8
      `;
      const week = await sql<{
        full_name: string;
        cedula: string;
        saldo_usd: number;
        week_usd: number;
      }>`
        select p.full_name, p.cedula, p.saldo_usd,
          (select coalesce(sum(t.commission_usd), 0) from trips t
            where t.driver_id = p.user_id and t.status = 'done'
              and t.updated_at > now() - interval '7 days') as week_usd
        from profiles p
        where p.role = 'driver' and p.status = 'approved'
        order by p.full_name
      `;
      const counts = await sql<{ done: number; cancelled: number; open: number }>`
        select
          count(*) filter (where status = 'done')::int as done,
          count(*) filter (where status = 'cancelled')::int as cancelled,
          count(*) filter (where status in ('open', 'accepted', 'arrived', 'riding', 'pay'))::int as open
        from trips
      `;
      const userCounts = await sql<{ drivers: number; passengers: number }>`
        select
          count(*) filter (where role = 'driver' and status = 'approved')::int as drivers,
          count(*) filter (where role = 'passenger' and status = 'approved')::int as passengers
        from profiles
      `;
      const recent = await sql<{
        id: string;
        dest_ref: string | null;
        fare_usd: number;
        status: string;
        pay_method: string;
        pay_ref: string | null;
        payment_proof: string | null;
        admin_pay_verified: boolean | null;
        updated_at: string | Date;
      }>`
        select id, dest_ref, fare_usd, status, pay_method, pay_ref, payment_proof, admin_pay_verified, updated_at
        from trips
        where status in ('done', 'cancelled', 'open', 'accepted', 'riding', 'pay')
        order by updated_at desc
        limit 10
      `;
      const fbRows = await sql<{
        id: string;
        author_name: string;
        role: string;
        category: string;
        body: string;
        created_at: string | Date;
      }>`
        select id, author_name, role, category, body, created_at
        from mvp_feedback
        order by created_at desc
        limit 15
      `;
      const tally = counts[0];
      const uTally = userCounts[0];
      return {
        panics: panics.map((row) => ({
          id: row.id,
          who: row.full_name,
          phone: row.phone,
          pickup: row.pickup_ref,
          dest: row.dest_ref ?? "",
        })),
        week: week.map((row) => ({
          name: row.full_name,
          cedula: row.cedula,
          saldo: Number(row.saldo_usd),
          commission: Number(row.week_usd),
        })),
        metrics: {
          done: Number(tally?.done ?? 0),
          cancelled: Number(tally?.cancelled ?? 0),
          open: Number(tally?.open ?? 0),
          driversApproved: Number(uTally?.drivers ?? 0),
          passengersApproved: Number(uTally?.passengers ?? 0),
        },
        trips: recent.map((row) => ({
          id: row.id,
          dest: row.dest_ref || "Carora",
          fareUsd: Number(row.fare_usd),
          status: row.status,
          payMethod: row.pay_method,
          payRef: row.pay_ref ?? "",
          paymentProof: row.payment_proof ?? "",
          adminPayVerified: Boolean(row.admin_pay_verified),
          when: new Date(row.updated_at).toLocaleString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          }),
        })),
        feedbacks: fbRows.map((f) => ({
          id: f.id,
          authorName: f.author_name,
          role: f.role,
          category: f.category,
          body: f.body,
          when: new Date(f.created_at).toLocaleString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
          }),
        })),
      };
    },
  );

export const verifyTripPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string; tripId: string }) => input)
  .handler(async ({ data }) => {
    assertReview(data.key);
    const sql = await getSql();
    await sql`
      update trips
      set admin_pay_verified = true,
          pay_status = 'PAID',
          updated_at = now()
      where id = ${data.tripId}
    `;
    return { ok: true };
  });

export const setDriverHotspot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { hotspotId: string; lat: number; lng: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update profiles set hotspot_id = ${data.hotspotId}
      where user_id = ${context.userId} and role = 'driver'
    `;
    await sql`
      insert into positions (user_id, lat, lng, online, updated_at)
      values (${context.userId}, ${data.lat}, ${data.lng}, true, now())
      on conflict (user_id) do update set
        lat = excluded.lat, lng = excluded.lng, online = true, updated_at = now()
    `;
    return { ok: true };
  });

export const submitMvpFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { category: string; body: string }) => input)
  .handler(async ({ context, data }) => {
    const body = data.body.trim().slice(0, 600);
    if (body.length < 2) throw new Error("Describe brevemente tu reporte o sugerencia.");
    const sql = await getSql();
    const prof = await sql<{ full_name: string; role: string }>`
      select full_name, role from profiles where user_id = ${context.userId} limit 1
    `;
    const authorName = prof[0]?.full_name || "Usuario MVP Carora";
    const role = prof[0]?.role || "passenger";
    const category = data.category.trim().slice(0, 40) || "Feedback Mejoras";
    await sql`
      insert into mvp_feedback (id, user_id, author_name, role, category, body)
      values (${`fb_${crypto.randomUUID()}`}, ${context.userId}, ${authorName}, ${role}, ${category}, ${body})
    `;
    await notifyDeveloper(
      [
        "💬 NUEVO FEEDBACK DE MEJORAS — Rapidez Carora",
        `Autor: ${authorName} (${role})`,
        `Categoría: ${category}`,
        "",
        body,
      ].join("\n"),
      `[Rapidez Carora] Feedback de ${authorName}`,
    );
    return { ok: true };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { endpoint: string; p256dh?: string; auth?: string; userAgent?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
      values (${context.userId}, ${data.endpoint}, ${data.p256dh ?? null}, ${data.auth ?? null}, ${data.userAgent ?? null}, now())
      on conflict (endpoint) do update set
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now()
    `;
    return { ok: true };
  });

export const topUp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string; cedula: string }) => input)
  .handler(async ({ data }) => {
    assertReview(data.key);
    let cedula = data.cedula.trim().toUpperCase();
    if (/^\d{5,9}$/.test(cedula)) cedula = `V-${cedula}`;
    const sql = await getSql();
    const rows = await sql<{ user_id: string }>`
      update profiles set saldo_usd = saldo_usd + 5
      where replace(upper(cedula), ' ', '') = replace(${cedula}, ' ', '')
        and role = 'driver' and status = 'approved'
      returning user_id
    `;
    if (!rows[0]) throw new Error("No hay un mototaxista aprobado con esa cédula.");
    return { ok: true };
  });

export interface SharedView {
  status: string;
  dest: string;
  pickup: string;
  driverName: string;
  driverPlate: string;
  driverModel: string;
  lat: number | null;
  lng: number | null;
}

export const sharedTrip = createServerFn({ method: "GET" })
  .validator((token: string) => token.trim())
  .handler(async ({ data }): Promise<SharedView | null> => {
    if (data.length < 8) return null;
    const sql = await getSql();
    const rows = await sql<TripRow>`select * from trips where share_token = ${data} limit 1`;
    const trip = rows[0];
    if (!trip) return null;
    const view = await tripView(trip);
    return {
      status: view.status,
      dest: view.destRef,
      pickup: view.pickupRef,
      driverName: view.driverName.split(" ")[0] ?? "",
      driverPlate: view.driverPlate,
      driverModel: view.driverModel,
      lat: view.driverLat,
      lng: view.driverLng,
    };
  });

let cachedMeteo: {
  at: number;
  tempC: number;
  rainMm: number;
  windKmh: number;
  isRaining: boolean;
  conditionLabel: string;
} | null = null;

async function fetchOpenMeteoCarora() {
  const now = Date.now();
  if (cachedMeteo && now - cachedMeteo.at < 300_000) {
    return cachedMeteo;
  }
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=10.178&longitude=-70.082&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=America%2FCaracas",
      { signal: AbortSignal.timeout(3500) },
    );
    if (!res.ok) throw new Error("weather status");
    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        precipitation?: number;
        rain?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    const c = json.current ?? {};
    const tempC = Math.round(Number(c.temperature_2m ?? 31));
    const rainMm = Number(c.rain ?? c.precipitation ?? 0);
    const code = Number(c.weather_code ?? 0);
    const windKmh = Math.round(Number(c.wind_speed_10m ?? 12));
    const isRaining = rainMm > 0.1 || (code >= 51 && code <= 99);
    const conditionLabel = isRaining
      ? code >= 95
        ? "Tormenta eléctrica en Carora"
        : "Lluvia activa en Carora"
      : code >= 1 && code <= 3
        ? "Parcialmente nublado · Carora"
        : "Cielo despejado · Carora";
    cachedMeteo = { at: now, tempC, rainMm, windKmh, isRaining, conditionLabel };
    return cachedMeteo;
  } catch {
    return (
      cachedMeteo ?? {
        at: now,
        tempC: 32,
        rainMm: 0,
        windKmh: 14,
        isRaining: false,
        conditionLabel: "Clima cálido · Carora",
      }
    );
  }
}

async function activeRoadReports(): Promise<LiveRoadReport[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    kind: string;
    label: string;
    sector: string;
    author_name: string;
    lat: number;
    lng: number;
    upvotes: number;
    created_at: string | Date;
  }>`
    select id, kind, label, sector, author_name, lat, lng, upvotes, created_at
    from road_reports
    where expires_at > now() and upvotes > 0
    order by created_at desc
    limit 25
  `;
  return rows.map((r) => ({
    id: r.id,
    kind:
      r.kind === "lluvia_anegado" ||
      r.kind === "trafico_cierre" ||
      r.kind === "alcabala_operativo"
        ? r.kind
        : "lombada_hueco",
    label: r.label,
    sector: r.sector,
    authorName: r.author_name,
    lat: Number(r.lat),
    lng: Number(r.lng),
    upvotes: Number(r.upvotes),
    when: new Date(r.created_at).toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
}

async function currentCaroraWeather(reports: LiveRoadReport[]): Promise<CityWeatherState> {
  const sql = await getSql();
  const rows = await sql<{ rain_mode: boolean; advisory: string; delay_min: number }>`
    select rain_mode, advisory, delay_min from city_weather where id = 1 limit 1
  `;
  const dbWeather = rows[0];
  const meteo = await fetchOpenMeteoCarora();
  const rainReports = reports.filter((r) => r.kind === "lluvia_anegado");
  const isRaining =
    Boolean(dbWeather?.rain_mode) || meteo.isRaining || rainReports.length > 0;
  const delayMin = isRaining
    ? Math.max(
        Number(dbWeather?.delay_min ?? 0),
        3 + Math.min(5, rainReports.length * 2),
      )
    : 0;
  const advisory = isRaining
    ? dbWeather?.advisory?.trim() ||
      (rainReports.length > 0
        ? `Alerta por lluvia y calles anegadas en ${rainReports[0].sector}. Precaución en Quebrada de Carora, Río Morere y Av. Miranda (+${delayMin} min de retraso estimado).`
        : `Lluvia activa en Carora. Pavimento húmedo y precaución en pasos de quebrada (+${delayMin} min por seguridad).`)
    : dbWeather?.advisory?.trim() || "";

  return {
    tempC: meteo.tempC,
    isRaining,
    rainMm: meteo.rainMm,
    windKmh: meteo.windKmh,
    advisory,
    delayMin,
    conditionLabel: isRaining ? "Alerta de Lluvia · Carora" : meteo.conditionLabel,
  };
}

export const submitRoadReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    kind: "lombada_hueco" | "lluvia_anegado" | "trafico_cierre" | "alcabala_operativo";
    label: string;
    lat: number;
    lng: number;
  }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const prof = await sql<{ full_name: string }>`
      select full_name from profiles where user_id = ${context.userId} limit 1
    `;
    const authorName = prof[0]?.full_name?.split(" ")[0] || "Vecino Carora";
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Ubicación GPS inválida.");
    }
    const sector = placeLabel({ lat, lng });
    const defaultLabels: Record<typeof data.kind, string> = {
      lombada_hueco: "Lombada pronunciada / Hueco en la vía",
      lluvia_anegado: "Calle anegada por lluvia / Corriente de agua",
      trafico_cierre: "Retraso por tránsito pesado / Vía cerrada",
      alcabala_operativo: "Punto de control / Reducir velocidad",
    };
    const label = data.label.trim().slice(0, 120) || defaultLabels[data.kind];
    const id = `rr_${crypto.randomUUID()}`;

    await sql`
      insert into road_reports (id, user_id, author_name, kind, label, sector, lat, lng, upvotes)
      values (${id}, ${context.userId}, ${authorName}, ${data.kind}, ${label}, ${sector}, ${lat}, ${lng}, 1)
    `;

    if (data.kind === "lluvia_anegado") {
      await sql`
        update city_weather
        set rain_mode = true,
            delay_min = greatest(delay_min, 4),
            advisory = ${`Lluvia y vía anegada reportada en ${sector}. Precaución en áreas críticas y quebradas.`},
            updated_at = now()
        where id = 1
      `;
    }
    return { ok: true, id };
  });

export const voteRoadReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reportId: string; delta: 1 | -1 }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    if (data.delta > 0) {
      await sql`
        update road_reports
        set upvotes = upvotes + 1,
            expires_at = greatest(expires_at, now() + interval '2 hours')
        where id = ${data.reportId}
      `;
    } else {
      await sql`
        update road_reports
        set upvotes = upvotes - 1
        where id = ${data.reportId}
      `;
    }
    return { ok: true };
  });

export const setCityWeather = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { rainMode: boolean; advisory?: string; delayMin?: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const delayMin = data.rainMode ? Math.max(3, Math.min(15, Number(data.delayMin ?? 4))) : 0;
    const advisory = data.rainMode
      ? data.advisory?.trim() ||
        "Alerta de lluvia en Carora: precaución en Quebrada de Carora, Río Morere y Av. Francisco de Miranda. Retrasos estimados de 3 a 6 min."
      : "";
    await sql`
      update city_weather
      set rain_mode = ${Boolean(data.rainMode)},
          advisory = ${advisory},
          delay_min = ${delayMin},
          updated_at = now()
      where id = 1
    `;
    if (!data.rainMode) {
      await sql`
        delete from road_reports where kind = 'lluvia_anegado'
      `;
    }
    return { ok: true };
  });

