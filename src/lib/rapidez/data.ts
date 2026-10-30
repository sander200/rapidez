import { haversine, type LatLng } from "@/lib/rapidez/geo";

export interface Place {
  id: string;
  name: string;
  hint: string;
  lat: number;
  lng: number;
  premiere?: boolean;
}

export interface Bank {
  code: string;
  name: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  plate: string;
  model: string;
  rating: number;
  bank: string;
  bankName: string;
  phone: string;
  cedula: string;
  pos: LatLng;
  registered: true;
  elite: boolean;
}

export type ServiceTierId = "moto" | "encomienda" | "elite";

export interface ServiceTier {
  id: ServiceTierId;
  name: string;
  subtitle: string;
  badge: string;
  extraUsd: number;
}

export type RoadNodeKind = "speed_bump" | "rain_critical" | "traffic_hotspot";

export interface CaroraRoadNode {
  id: string;
  kind: RoadNodeKind;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  radiusM: number;
  rainDelayMin: number;
}

export interface LiveRoadReport {
  id: string;
  kind: "lombada_hueco" | "lluvia_anegado" | "trafico_cierre" | "alcabala_operativo";
  label: string;
  sector: string;
  authorName: string;
  lat: number;
  lng: number;
  upvotes: number;
  when: string;
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: "moto",
    name: "Rapidez Moto",
    subtitle: "1 pasajero · Casco extra incluido",
    badge: "2–4 min",
    extraUsd: 0,
  },
  {
    id: "encomienda",
    name: "Encomienda / Mandado",
    subtitle: "Paquetes, farmacia, comida o compras",
    badge: "Express",
    extraUsd: 0,
  },
  {
    id: "elite",
    name: "Moto Élite",
    subtitle: "Conductor 4.8★+ prioritario · Unidad nueva",
    badge: "Prioridad",
    extraUsd: 0.5,
  },
];

export const MODELS = [
  "Bera SBR 150",
  "Keeway Arsen II",
  "Empire Horse 150",
  "Bera BRZ 200",
  "Empire Owen 150",
  "Suzuki GN 125",
] as const;

export const BANKS: Bank[] = [
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0134", name: "Banesco" },
  { code: "0105", name: "Banco Mercantil" },
  { code: "0108", name: "Banco Provincial" },
  { code: "0114", name: "Banco del Tesoro" },
  { code: "0172", name: "Bancamiga" },
  { code: "0191", name: "BNC Nacional de Crédito" },
];

export const PLACES: Place[] = [
  {
    id: "calicanto",
    name: "Calicanto",
    hint: "Iglesia San José · Av. Principal",
    lat: 10.1904812,
    lng: -70.0723012,
  },
  {
    id: "la-osa",
    name: "La Osa",
    hint: "Urbanización La Osa",
    lat: 10.1742,
    lng: -70.0798,
    premiere: true,
  },
  {
    id: "catedral",
    name: "Catedral San Juan Bautista",
    hint: "Frente a la Plaza Bolívar",
    lat: 10.18073,
    lng: -70.08813,
  },
  {
    id: "plaza",
    name: "Plaza Bolívar",
    hint: "Casco colonial de Carora",
    lat: 10.1804,
    lng: -70.08755,
  },
  {
    id: "centro",
    name: "Centro histórico",
    hint: "Calle Bolívar · Comercio",
    lat: 10.1789,
    lng: -70.0854,
  },
  {
    id: "hospital",
    name: "Hospital Dr. Pastor Oropeza",
    hint: "Entrada de Emergencias",
    lat: 10.1766,
    lng: -70.0832,
  },
  {
    id: "miranda",
    name: "Av. Francisco de Miranda",
    hint: "Zona comercial y bancos",
    lat: 10.1736,
    lng: -70.0796,
  },
  {
    id: "terminal",
    name: "Terminal de Pasajeros",
    hint: "Andén principal de Carora",
    lat: 10.1702,
    lng: -70.0746,
    premiere: true,
  },
  {
    id: "industrial",
    name: "Zona Industrial",
    hint: "Portón principal",
    lat: 10.1654,
    lng: -70.0678,
    premiere: true,
  },
  {
    id: "barrio-nuevo",
    name: "Barrio Nuevo",
    hint: "Cancha techada",
    lat: 10.1835,
    lng: -70.0812,
  },
  {
    id: "las-veras",
    name: "Las Veras",
    hint: "Entrada principal",
    lat: 10.1862,
    lng: -70.0764,
  },
  {
    id: "pueblo-aparte",
    name: "Pueblo Aparte",
    hint: "Plaza de Pueblo Aparte",
    lat: 10.1718,
    lng: -70.0845,
  },
  {
    id: "campanero",
    name: "Campanero",
    hint: "Av. 14 de Febrero",
    lat: 10.1774,
    lng: -70.0752,
  },
];

/**
 * Mapa vial real de Carora: Lombadas (policías acostados), Áreas Críticas de inundación/escorrentía
 * cuando llueve y puntos de tránsito pesado.
 */
export const CARORA_ROAD_NODES: CaroraRoadNode[] = [
  // LOMBADAS / POLICÍAS ACOSTADOS
  {
    id: "lombada-hospital",
    kind: "speed_bump",
    name: "Lombadas Hospital Pastor Oropeza",
    detail: "Doble policía acostado alto frente a Emergencias. Reducir a 15 km/h.",
    lat: 10.1768,
    lng: -70.083,
    radiusM: 120,
    rainDelayMin: 1,
  },
  {
    id: "lombada-miranda-bancos",
    kind: "speed_bump",
    name: "Reductores Av. Francisco de Miranda",
    detail: "Serie de 3 reductores en zona bancaria y comercial.",
    lat: 10.174,
    lng: -70.0802,
    radiusM: 140,
    rainDelayMin: 1,
  },
  {
    id: "lombada-calicanto",
    kind: "speed_bump",
    name: "Lombadas Escolares Calicanto",
    detail: "Policías acostados frente a Iglesia San José y zona escolar.",
    lat: 10.1895,
    lng: -70.0731,
    radiusM: 130,
    rainDelayMin: 1,
  },
  {
    id: "lombada-14-febrero",
    kind: "speed_bump",
    name: "Lombada Av. 14 de Febrero (Campanero)",
    detail: "Reductor pronunciado sin pintura reflectante. Precaución nocturna.",
    lat: 10.1776,
    lng: -70.0756,
    radiusM: 130,
    rainDelayMin: 1,
  },
  {
    id: "lombada-la-osa",
    kind: "speed_bump",
    name: "Reductor Entrada Urb. La Osa",
    detail: "Policía acostado en acceso principal a La Osa.",
    lat: 10.1745,
    lng: -70.0793,
    radiusM: 110,
    rainDelayMin: 0,
  },
  {
    id: "lombada-terminal",
    kind: "speed_bump",
    name: "Lombadas Salida Terminal de Pasajeros",
    detail: "Reductores de velocidad en cruce de autobuses y carritos.",
    lat: 10.1706,
    lng: -70.0751,
    radiusM: 130,
    rainDelayMin: 1,
  },
  // ÁREAS CRÍTICAS CUANDO LLUEVE (QUEBRADAS / DRENAJES / CALLES ANEGADAS)
  {
    id: "lluvia-quebrada-carora",
    kind: "rain_critical",
    name: "Paso Quebrada de Carora (Área Crítica)",
    detail: "Crecida súbita y corriente fuerte cuando llueve. Evitar cruce con agua alta.",
    lat: 10.1818,
    lng: -70.0835,
    radiusM: 240,
    rainDelayMin: 4,
  },
  {
    id: "lluvia-rio-morere",
    kind: "rain_critical",
    name: "Ribera Río Morere · Pueblo Aparte",
    detail: "Zona propensa a anegación y lodo resbaladizo para motos durante lluvias.",
    lat: 10.1722,
    lng: -70.0858,
    radiusM: 260,
    rainDelayMin: 4,
  },
  {
    id: "lluvia-bajada-miranda",
    kind: "rain_critical",
    name: "Drenaje Av. Miranda con Calle Bolívar",
    detail: "Acumulación de agua rápida en aguaceros; pavimento resbaloso.",
    lat: 10.1755,
    lng: -70.0815,
    radiusM: 210,
    rainDelayMin: 3,
  },
  {
    id: "lluvia-las-veras",
    kind: "rain_critical",
    name: "Bajada de Las Veras / Calicanto",
    detail: "Escorrentía de tierra y charcos profundos que tapan huecos al llover.",
    lat: 10.1872,
    lng: -70.0752,
    radiusM: 220,
    rainDelayMin: 3,
  },
  // TRÁNSITO PESADO / PUNTOS CRÍTICOS
  {
    id: "trafico-redoma-terminal",
    kind: "traffic_hotspot",
    name: "Redoma Terminal · Conector Lara-Zulia",
    detail: "Alto flujo de transporte pesado y autobuses. Mantener carril derecho.",
    lat: 10.1695,
    lng: -70.0738,
    radiusM: 190,
    rainDelayMin: 2,
  },
  {
    id: "trafico-centro-comercio",
    kind: "traffic_hotspot",
    name: "Corredor Comercial Centro Histórico",
    detail: "Calles angostas y alto flujo peatonal entre 9:00 am y 5:00 pm.",
    lat: 10.1794,
    lng: -70.0861,
    radiusM: 180,
    rainDelayMin: 2,
  },
];

export interface RouteHazardAnalysis {
  speedBumps: CaroraRoadNode[];
  rainZones: CaroraRoadNode[];
  trafficHotspots: CaroraRoadNode[];
  liveReports: LiveRoadReport[];
  extraRainMinutes: number;
}

export function analyzeRouteHazards(
  route: LatLng[],
  liveReports: LiveRoadReport[],
  isRaining: boolean,
): RouteHazardAnalysis {
  if (route.length === 0) {
    return {
      speedBumps: [],
      rainZones: [],
      trafficHotspots: [],
      liveReports: [],
      extraRainMinutes: isRaining ? 2 : 0,
    };
  }
  const nearRoute = (point: LatLng, maxDistM: number) =>
    route.some((pt) => haversine(pt, point) <= maxDistM);

  const speedBumps = CARORA_ROAD_NODES.filter(
    (n) => n.kind === "speed_bump" && nearRoute(n, Math.max(160, n.radiusM)),
  );
  const rainZones = CARORA_ROAD_NODES.filter(
    (n) => n.kind === "rain_critical" && nearRoute(n, Math.max(220, n.radiusM)),
  );
  const trafficHotspots = CARORA_ROAD_NODES.filter(
    (n) => n.kind === "traffic_hotspot" && nearRoute(n, Math.max(200, n.radiusM)),
  );
  const matchingReports = liveReports.filter((r) => nearRoute(r, 220));

  let extraRainMinutes = 0;
  if (isRaining) {
    extraRainMinutes =
      2 +
      rainZones.reduce((acc, z) => acc + z.rainDelayMin, 0) +
      matchingReports.filter((r) => r.kind === "lluvia_anegado").length * 2;
  } else if (matchingReports.some((r) => r.kind === "trafico_cierre")) {
    extraRainMinutes = 2;
  }

  return {
    speedBumps,
    rainZones,
    trafficHotspots,
    liveReports: matchingReports,
    extraRainMinutes: Math.min(12, extraRainMinutes),
  };
}

export function safetyPinOf(tripId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < tripId.length; i++) {
    hash ^= tripId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const pin = (Math.abs(hash) % 9000) + 1000;
  return String(pin);
}

export const HOME: LatLng = { lat: PLACES[1].lat, lng: PLACES[1].lng };

export function premiereAt(point: LatLng): boolean {
  return PLACES.some((place) => place.premiere && haversine(point, place) < 180);
}

export const NPCS: DriverProfile[] = [];

export const YOU_BASE: DriverProfile = {
  id: "you",
  name: "Conductor Carora",
  plate: "",
  model: "Bera SBR 150",
  rating: 5.0,
  bank: "0102",
  bankName: "Banco de Venezuela",
  phone: "",
  cedula: "",
  pos: { lat: 10.1831, lng: -70.0824 },
  registered: true,
  elite: true,
};

export function nearestPlace(point: LatLng): { place: Place; meters: number } {
  let place = PLACES[0];
  let meters = Infinity;
  for (const candidate of PLACES) {
    const d = haversine(point, candidate);
    if (d < meters) {
      place = candidate;
      meters = d;
    }
  }
  return { place, meters };
}

export function placeLabel(point: LatLng): string {
  const { place, meters } = nearestPlace(point);
  if (meters < 180) return place.name;
  return `Cerca de ${place.name}`;
}

export const MVP_MAX_DRIVERS = 5;
export const MVP_MAX_PASSENGERS = 15;
export const GPS_ECO_INTERVAL_MS = 9000; // 8–10s Modo Económico 3G/4G Carora

export const CENTRAL_CARORA_CONFIG = {
  name: "Central Rapidez Carora",
  developerEmail: "beisander2@gmail.com",
  rif: "J-50482910-4",
  bankCode: "0102",
  bankName: "Banco de Venezuela",
  phone: "0414-552-9100",
  phoneRaw: "04145529100",
  whatsappAdmin: "584145529100",
  feedbackPhoneDisplay: "+5519986083932",
  feedbackWhatsapp: "5519986083932",
  zelleEmail: "beisander2@gmail.com",
  zelleHolder: "Central Rapidez Carora (beisander2@gmail.com)",
  driverSharePct: 90,
  platformSharePct: 10,
} as const;

export function buildFeedbackWhatsappUrl(answers?: {
  queTeParecio?: string;
  gustoDiseno?: string;
  erroresEncontraste?: string;
  indicariasAlguien?: string;
}): string {
  const q1 = answers?.queTeParecio?.trim() || "";
  const q2 = answers?.gustoDiseno?.trim() || "";
  const q3 = answers?.erroresEncontraste?.trim() || "";
  const q4 = answers?.indicariasAlguien?.trim() || "";

  const text = [
    "Hola! Feedback de mejoras — Rapidez Moto Transporte (Carora):",
    "",
    `1. ¿Qué te pareció?: ${q1}`,
    `2. ¿Te gustó el diseño de la aplicación?: ${q2}`,
    `3. ¿Qué errores encontraste?: ${q3}`,
    `4. ¿Indicarías a alguien?: ${q4}`,
  ].join("\n");

  return `https://wa.me/${CENTRAL_CARORA_CONFIG.feedbackWhatsapp}?text=${encodeURIComponent(text)}`;
}

export interface CaroraHotspot {
  id: string;
  name: string;
  shortName: string;
  detail: string;
  lat: number;
  lng: number;
  targetMotos: number;
}

/**
 * 3 Zonas de Espera Estratégicas (Hotspots) para distribuir las 5 motos de la flota inicial
 * y mantener el tiempo de espera bajo en Carora.
 */
export const CARORA_HOTSPOTS: CaroraHotspot[] = [
  {
    id: "hotspot-centro",
    name: "Zona Centro (Calle Comercio / Plaza Bolívar)",
    shortName: "Zona Centro",
    detail: "Parada estratégica para casco central, Catedral y comercio colonial.",
    lat: 10.1798,
    lng: -70.0865,
    targetMotos: 2,
  },
  {
    id: "hotspot-terminal",
    name: "Terminal de Pasajeros de Carora",
    shortName: "Terminal de Pasajeros",
    detail: "Cobertura inmediata para viajeros, encomiendas y salida Lara-Zulia.",
    lat: 10.1702,
    lng: -70.0746,
    targetMotos: 2,
  },
  {
    id: "hotspot-miranda",
    name: "Entorno Av. Francisco de Miranda",
    shortName: "Av. Fco. de Miranda",
    detail: "Eje bancario, comercial, Hospital Pastor Oropeza y Urb. La Osa.",
    lat: 10.1736,
    lng: -70.0796,
    targetMotos: 1,
  },
];

export function nearestHotspot(point: LatLng): { hotspot: CaroraHotspot; meters: number } {
  let hotspot = CARORA_HOTSPOTS[0];
  let meters = Infinity;
  for (const h of CARORA_HOTSPOTS) {
    const d = haversine(point, h);
    if (d < meters) {
      hotspot = h;
      meters = d;
    }
  }
  return { hotspot, meters };
}

