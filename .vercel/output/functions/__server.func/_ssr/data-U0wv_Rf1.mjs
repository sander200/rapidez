// node_modules/.nitro/vite/services/ssr/assets/data-U0wv_Rf1.js
var RATE_VES = 46.85;
var SEARCH_RADIUS_M = 2500;
var OFFER_MS = 15e3;
var COMMISSION = .1;
function haversine(a, b) {
	const R = 6371e3;
	const p1 = a.lat * Math.PI / 180;
	const p2 = b.lat * Math.PI / 180;
	const dp = (b.lat - a.lat) * Math.PI / 180;
	const dl = (b.lng - a.lng) * Math.PI / 180;
	const h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
	return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
var FARE_USD = 1.5;
function fareFor(_distanceM, premiere = false) {
	return premiere ? 1 : FARE_USD;
}
function vesOf(usd) {
	return Math.round(usd * RATE_VES * 100) / 100;
}
function formatUsd(n) {
	return `$ ${n.toFixed(2)}`;
}
function formatVes(n) {
	return `Bs ${n.toLocaleString("es-VE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}
function etaMin(meters) {
	const minutes = meters / (22e3 / 60);
	return Math.max(1, Math.round(minutes));
}
function formatKm(meters) {
	if (meters < 1e3) return `${Math.max(1, Math.round(meters))} m`;
	return `${(meters / 1e3).toFixed(1)} km`;
}
function bearing(a, b) {
	const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
	const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
	return Math.atan2(y, x) * 180 / Math.PI;
}
function toRad(d) {
	return d * Math.PI / 180;
}
/** Curved path so the moto doesn't cut through blocks in a straight line. */
function buildRoute(from, to) {
	const dist = haversine(from, to);
	const steps = Math.max(28, Math.min(70, Math.round(dist / 30)));
	const dx = to.lat - from.lat;
	const dy = to.lng - from.lng;
	const len = Math.hypot(dx, dy) || 1;
	const bend = Math.min(len * .16, .0035);
	const c = {
		lat: (from.lat + to.lat) / 2 + -dy / len * bend,
		lng: (from.lng + to.lng) / 2 + dx / len * bend
	};
	const pts = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const o = 1 - t;
		pts.push({
			lat: o * o * from.lat + 2 * o * t * c.lat + t * t * to.lat,
			lng: o * o * from.lng + 2 * o * t * c.lng + t * t * to.lng
		});
	}
	return pts;
}
var SERVICE_TIERS = [
	{
		id: "moto",
		name: "Rapidez Moto",
		subtitle: "1 pasajero · Casco extra incluido",
		badge: "2–4 min",
		extraUsd: 0
	},
	{
		id: "encomienda",
		name: "Encomienda / Mandado",
		subtitle: "Paquetes, farmacia, comida o compras",
		badge: "Express",
		extraUsd: 0
	},
	{
		id: "elite",
		name: "Moto Élite",
		subtitle: "Conductor 4.8★+ prioritario · Unidad nueva",
		badge: "Prioridad",
		extraUsd: .5
	}
];
var MODELS = [
	"Bera SBR 150",
	"Keeway Arsen II",
	"Empire Horse 150",
	"Bera BRZ 200",
	"Empire Owen 150",
	"Suzuki GN 125"
];
var BANKS = [
	{
		code: "0102",
		name: "Banco de Venezuela"
	},
	{
		code: "0134",
		name: "Banesco"
	},
	{
		code: "0105",
		name: "Banco Mercantil"
	},
	{
		code: "0108",
		name: "Banco Provincial"
	},
	{
		code: "0114",
		name: "Banco del Tesoro"
	},
	{
		code: "0172",
		name: "Bancamiga"
	},
	{
		code: "0191",
		name: "BNC Nacional de Crédito"
	}
];
var PLACES = [
	{
		id: "calicanto",
		name: "Calicanto",
		hint: "Iglesia San José · Av. Principal",
		lat: 10.1904812,
		lng: -70.0723012
	},
	{
		id: "la-osa",
		name: "La Osa",
		hint: "Urbanización La Osa",
		lat: 10.1742,
		lng: -70.0798,
		premiere: true
	},
	{
		id: "catedral",
		name: "Catedral San Juan Bautista",
		hint: "Frente a la Plaza Bolívar",
		lat: 10.18073,
		lng: -70.08813
	},
	{
		id: "plaza",
		name: "Plaza Bolívar",
		hint: "Casco colonial de Carora",
		lat: 10.1804,
		lng: -70.08755
	},
	{
		id: "centro",
		name: "Centro histórico",
		hint: "Calle Bolívar · Comercio",
		lat: 10.1789,
		lng: -70.0854
	},
	{
		id: "hospital",
		name: "Hospital Dr. Pastor Oropeza",
		hint: "Entrada de Emergencias",
		lat: 10.1766,
		lng: -70.0832
	},
	{
		id: "miranda",
		name: "Av. Francisco de Miranda",
		hint: "Zona comercial y bancos",
		lat: 10.1736,
		lng: -70.0796
	},
	{
		id: "terminal",
		name: "Terminal de Pasajeros",
		hint: "Andén principal de Carora",
		lat: 10.1702,
		lng: -70.0746,
		premiere: true
	},
	{
		id: "industrial",
		name: "Zona Industrial",
		hint: "Portón principal",
		lat: 10.1654,
		lng: -70.0678,
		premiere: true
	},
	{
		id: "barrio-nuevo",
		name: "Barrio Nuevo",
		hint: "Cancha techada",
		lat: 10.1835,
		lng: -70.0812
	},
	{
		id: "las-veras",
		name: "Las Veras",
		hint: "Entrada principal",
		lat: 10.1862,
		lng: -70.0764
	},
	{
		id: "pueblo-aparte",
		name: "Pueblo Aparte",
		hint: "Plaza de Pueblo Aparte",
		lat: 10.1718,
		lng: -70.0845
	},
	{
		id: "campanero",
		name: "Campanero",
		hint: "Av. 14 de Febrero",
		lat: 10.1774,
		lng: -70.0752
	}
];
/**
* Mapa vial real de Carora: Lombadas (policías acostados), Áreas Críticas de inundación/escorrentía
* cuando llueve y puntos de tránsito pesado.
*/
var CARORA_ROAD_NODES = [
	{
		id: "lombada-hospital",
		kind: "speed_bump",
		name: "Lombadas Hospital Pastor Oropeza",
		detail: "Doble policía acostado alto frente a Emergencias. Reducir a 15 km/h.",
		lat: 10.1768,
		lng: -70.083,
		radiusM: 120,
		rainDelayMin: 1
	},
	{
		id: "lombada-miranda-bancos",
		kind: "speed_bump",
		name: "Reductores Av. Francisco de Miranda",
		detail: "Serie de 3 reductores en zona bancaria y comercial.",
		lat: 10.174,
		lng: -70.0802,
		radiusM: 140,
		rainDelayMin: 1
	},
	{
		id: "lombada-calicanto",
		kind: "speed_bump",
		name: "Lombadas Escolares Calicanto",
		detail: "Policías acostados frente a Iglesia San José y zona escolar.",
		lat: 10.1895,
		lng: -70.0731,
		radiusM: 130,
		rainDelayMin: 1
	},
	{
		id: "lombada-14-febrero",
		kind: "speed_bump",
		name: "Lombada Av. 14 de Febrero (Campanero)",
		detail: "Reductor pronunciado sin pintura reflectante. Precaución nocturna.",
		lat: 10.1776,
		lng: -70.0756,
		radiusM: 130,
		rainDelayMin: 1
	},
	{
		id: "lombada-la-osa",
		kind: "speed_bump",
		name: "Reductor Entrada Urb. La Osa",
		detail: "Policía acostado en acceso principal a La Osa.",
		lat: 10.1745,
		lng: -70.0793,
		radiusM: 110,
		rainDelayMin: 0
	},
	{
		id: "lombada-terminal",
		kind: "speed_bump",
		name: "Lombadas Salida Terminal de Pasajeros",
		detail: "Reductores de velocidad en cruce de autobuses y carritos.",
		lat: 10.1706,
		lng: -70.0751,
		radiusM: 130,
		rainDelayMin: 1
	},
	{
		id: "lluvia-quebrada-carora",
		kind: "rain_critical",
		name: "Paso Quebrada de Carora (Área Crítica)",
		detail: "Crecida súbita y corriente fuerte cuando llueve. Evitar cruce con agua alta.",
		lat: 10.1818,
		lng: -70.0835,
		radiusM: 240,
		rainDelayMin: 4
	},
	{
		id: "lluvia-rio-morere",
		kind: "rain_critical",
		name: "Ribera Río Morere · Pueblo Aparte",
		detail: "Zona propensa a anegación y lodo resbaladizo para motos durante lluvias.",
		lat: 10.1722,
		lng: -70.0858,
		radiusM: 260,
		rainDelayMin: 4
	},
	{
		id: "lluvia-bajada-miranda",
		kind: "rain_critical",
		name: "Drenaje Av. Miranda con Calle Bolívar",
		detail: "Acumulación de agua rápida en aguaceros; pavimento resbaloso.",
		lat: 10.1755,
		lng: -70.0815,
		radiusM: 210,
		rainDelayMin: 3
	},
	{
		id: "lluvia-las-veras",
		kind: "rain_critical",
		name: "Bajada de Las Veras / Calicanto",
		detail: "Escorrentía de tierra y charcos profundos que tapan huecos al llover.",
		lat: 10.1872,
		lng: -70.0752,
		radiusM: 220,
		rainDelayMin: 3
	},
	{
		id: "trafico-redoma-terminal",
		kind: "traffic_hotspot",
		name: "Redoma Terminal · Conector Lara-Zulia",
		detail: "Alto flujo de transporte pesado y autobuses. Mantener carril derecho.",
		lat: 10.1695,
		lng: -70.0738,
		radiusM: 190,
		rainDelayMin: 2
	},
	{
		id: "trafico-centro-comercio",
		kind: "traffic_hotspot",
		name: "Corredor Comercial Centro Histórico",
		detail: "Calles angostas y alto flujo peatonal entre 9:00 am y 5:00 pm.",
		lat: 10.1794,
		lng: -70.0861,
		radiusM: 180,
		rainDelayMin: 2
	}
];
function analyzeRouteHazards(route, liveReports, isRaining) {
	if (route.length === 0) return {
		speedBumps: [],
		rainZones: [],
		trafficHotspots: [],
		liveReports: [],
		extraRainMinutes: isRaining ? 2 : 0
	};
	const nearRoute = (point, maxDistM) => route.some((pt) => haversine(pt, point) <= maxDistM);
	const speedBumps = CARORA_ROAD_NODES.filter((n) => n.kind === "speed_bump" && nearRoute(n, Math.max(160, n.radiusM)));
	const rainZones = CARORA_ROAD_NODES.filter((n) => n.kind === "rain_critical" && nearRoute(n, Math.max(220, n.radiusM)));
	const trafficHotspots = CARORA_ROAD_NODES.filter((n) => n.kind === "traffic_hotspot" && nearRoute(n, Math.max(200, n.radiusM)));
	const matchingReports = liveReports.filter((r) => nearRoute(r, 220));
	let extraRainMinutes = 0;
	if (isRaining) extraRainMinutes = 2 + rainZones.reduce((acc, z) => acc + z.rainDelayMin, 0) + matchingReports.filter((r) => r.kind === "lluvia_anegado").length * 2;
	else if (matchingReports.some((r) => r.kind === "trafico_cierre")) extraRainMinutes = 2;
	return {
		speedBumps,
		rainZones,
		trafficHotspots,
		liveReports: matchingReports,
		extraRainMinutes: Math.min(12, extraRainMinutes)
	};
}
function safetyPinOf(tripId) {
	let hash = 2166136261;
	for (let i = 0; i < tripId.length; i++) {
		hash ^= tripId.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	const pin = Math.abs(hash) % 9e3 + 1e3;
	return String(pin);
}
var HOME = {
	lat: PLACES[1].lat,
	lng: PLACES[1].lng
};
function premiereAt(point) {
	return PLACES.some((place) => place.premiere && haversine(point, place) < 180);
}
var NPCS = [];
var YOU_BASE = {
	id: "you",
	name: "Conductor Carora",
	plate: "",
	model: "Bera SBR 150",
	rating: 5,
	bank: "0102",
	bankName: "Banco de Venezuela",
	phone: "",
	cedula: "",
	pos: {
		lat: 10.1831,
		lng: -70.0824
	},
	registered: true,
	elite: true
};
function nearestPlace(point) {
	let place = PLACES[0];
	let meters = Infinity;
	for (const candidate of PLACES) {
		const d = haversine(point, candidate);
		if (d < meters) {
			place = candidate;
			meters = d;
		}
	}
	return {
		place,
		meters
	};
}
function placeLabel(point) {
	const { place, meters } = nearestPlace(point);
	if (meters < 180) return place.name;
	return `Cerca de ${place.name}`;
}
var GPS_ECO_INTERVAL_MS = 9e3;
var CENTRAL_CARORA_CONFIG = {
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
	platformSharePct: 10
};
function buildFeedbackWhatsappUrl(answers) {
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
		`4. ¿Indicarías a alguien?: ${q4}`
	].join("\n");
	return `https://wa.me/${CENTRAL_CARORA_CONFIG.feedbackWhatsapp}?text=${encodeURIComponent(text)}`;
}
/**
* 3 Zonas de Espera Estratégicas (Hotspots) para distribuir las 5 motos de la flota inicial
* y mantener el tiempo de espera bajo en Carora.
*/
var CARORA_HOTSPOTS = [
	{
		id: "hotspot-centro",
		name: "Zona Centro (Calle Comercio / Plaza Bolívar)",
		shortName: "Zona Centro",
		detail: "Parada estratégica para casco central, Catedral y comercio colonial.",
		lat: 10.1798,
		lng: -70.0865,
		targetMotos: 2
	},
	{
		id: "hotspot-terminal",
		name: "Terminal de Pasajeros de Carora",
		shortName: "Terminal de Pasajeros",
		detail: "Cobertura inmediata para viajeros, encomiendas y salida Lara-Zulia.",
		lat: 10.1702,
		lng: -70.0746,
		targetMotos: 2
	},
	{
		id: "hotspot-miranda",
		name: "Entorno Av. Francisco de Miranda",
		shortName: "Av. Fco. de Miranda",
		detail: "Eje bancario, comercial, Hospital Pastor Oropeza y Urb. La Osa.",
		lat: 10.1736,
		lng: -70.0796,
		targetMotos: 1
	}
];
export { formatUsd as C, premiereAt as D, placeLabel as E, safetyPinOf as O, formatKm as S, haversine as T, bearing as _, COMMISSION as a, etaMin as b, MODELS as c, PLACES as d, RATE_VES as f, analyzeRouteHazards as g, YOU_BASE as h, CENTRAL_CARORA_CONFIG as i, vesOf as k, NPCS as l, SERVICE_TIERS as m, CARORA_HOTSPOTS as n, GPS_ECO_INTERVAL_MS as o, SEARCH_RADIUS_M as p, CARORA_ROAD_NODES as r, HOME as s, BANKS as t, OFFER_MS as u, buildFeedbackWhatsappUrl as v, formatVes as w, fareFor as x, buildRoute as y };
