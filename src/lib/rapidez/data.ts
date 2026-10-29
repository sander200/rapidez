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

export const HOME: LatLng = { lat: PLACES[1].lat, lng: PLACES[1].lng };

export function premiereAt(point: LatLng): boolean {
  return PLACES.some((place) => place.premiere && haversine(point, place) < 180);
}

export const NPCS: DriverProfile[] = [
  {
    id: "jose",
    name: "José Rivas",
    plate: "AB12CD",
    model: "Bera SBR 150",
    rating: 4.92,
    bank: "0102",
    bankName: "Banco de Venezuela",
    phone: "04145551020",
    cedula: "V-18422109",
    pos: { lat: 10.1782, lng: -70.0848 },
    registered: true,
    elite: true,
  },
  {
    id: "maria",
    name: "María Torres",
    plate: "KT09LM",
    model: "Keeway Arsen II",
    rating: 4.88,
    bank: "0134",
    bankName: "Banesco",
    phone: "04245559876",
    cedula: "V-20114555",
    pos: { lat: 10.1748, lng: -70.0785 },
    registered: true,
    elite: true,
  },
  {
    id: "luis",
    name: "Luis Peña",
    plate: "CR44PQ",
    model: "Empire Horse 150",
    rating: 4.81,
    bank: "0105",
    bankName: "Banco Mercantil",
    phone: "04165551200",
    cedula: "V-15900321",
    pos: { lat: 10.1725, lng: -70.0815 },
    registered: true,
    elite: false,
  },
  {
    id: "rosa",
    name: "Rosa Méndez",
    plate: "MC18RS",
    model: "Empire Horse 150",
    rating: 4.94,
    bank: "0108",
    bankName: "Banco Provincial",
    phone: "04245550111",
    cedula: "V-16881200",
    pos: { lat: 10.1769, lng: -70.0811 },
    registered: true,
    elite: true,
  },
  {
    id: "pedro",
    name: "Pedro Alvarado",
    plate: "TR07PD",
    model: "Bera BRZ 200",
    rating: 4.83,
    bank: "0114",
    bankName: "Banco del Tesoro",
    phone: "04165550990",
    cedula: "V-14220018",
    pos: { lat: 10.1708, lng: -70.0759 },
    registered: true,
    elite: false,
  },
  {
    id: "ana",
    name: "Ana Gil",
    plate: "GL33AN",
    model: "Bera SBR 150",
    rating: 4.96,
    bank: "0134",
    bankName: "Banesco",
    phone: "04125557890",
    cedula: "V-22334001",
    pos: { lat: 10.1801, lng: -70.0869 },
    registered: true,
    elite: true,
  },
  {
    id: "hector",
    name: "Héctor Suárez",
    plate: "HS02CR",
    model: "Keeway Arsen II",
    rating: 4.79,
    bank: "0102",
    bankName: "Banco de Venezuela",
    phone: "04265554421",
    cedula: "V-13009876",
    pos: { lat: 10.1885, lng: -70.0742 },
    registered: true,
    elite: false,
  },
];

export const YOU_BASE: DriverProfile = {
  id: "you",
  name: "Carlos Mendoza",
  plate: "RP21EZ",
  model: "Bera SBR 150",
  rating: 4.97,
  bank: "0102",
  bankName: "Banco de Venezuela",
  phone: "04125551234",
  cedula: "V-18999888",
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
