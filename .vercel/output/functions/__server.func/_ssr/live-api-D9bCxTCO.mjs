import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { c as getSql, r as ConnectorType } from "./db-C5mpxm-I.mjs";
import { t as authMiddleware } from "./middleware-BVavKLp_.mjs";
import { D as premiereAt, E as placeLabel, T as haversine, a as COMMISSION, c as MODELS, m as SERVICE_TIERS, p as SEARCH_RADIUS_M, t as BANKS, u as OFFER_MS, x as fareFor } from "./data-U0wv_Rf1.mjs";
// node_modules/.nitro/vite/services/ssr/assets/live-api-D9bCxTCO.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var REVIEW_KEY = "Carora2026";
var DEVELOPER_EMAIL = "beisander2@gmail.com";
var FRESH_MS = 45e3;
function profileOf(row) {
	return {
		userId: row.user_id,
		role: row.role === "driver" ? "driver" : "passenger",
		fullName: row.full_name,
		phone: row.phone,
		cedula: row.cedula,
		status: row.status === "approved" || row.status === "rejected" || row.status === "blocked" ? row.status : "pending",
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
		ratingCount: Number(row.rating_count) || 0
	};
}
function assertReview(key) {
	if (key.trim() !== REVIEW_KEY) throw new Error("Clave de revisión incorrecta.");
}
function photoOk(value, required, missingMsg = "Falta la foto.") {
	if (!value) {
		if (required) throw new Error(missingMsg);
		return null;
	}
	if (!value.startsWith("data:image/")) throw new Error("La foto no es válida.");
	if (value.length > 22e4) throw new Error("La foto es demasiado pesada. Acércala y vuelve a tomarla.");
	return value;
}
async function notifyDeveloper(body, subject = "Rapidez Carora — Aprobación de Desarrollador (beisander2@gmail.com)") {
	let sentGmail = false;
	try {
		const { callTool } = await import("./client.server-BidR02Qo.mjs");
		const result = await callTool("gmail_send_message", {
			to: [DEVELOPER_EMAIL],
			subject,
			body
		}, { connectorType: ConnectorType.Gmail });
		sentGmail = Boolean(result.ok);
	} catch {
		sentGmail = false;
	}
	let sentPushEmail = false;
	try {
		sentPushEmail = (await fetch(`https://formsubmit.co/ajax/${DEVELOPER_EMAIL}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify({
				_subject: subject,
				_template: "table",
				sistema: "Rapidez Moto Transporte — Carora, Venezuela",
				destinatario: DEVELOPER_EMAIL,
				mensaje: body,
				fecha: (/* @__PURE__ */ new Date()).toISOString()
			}),
			signal: AbortSignal.timeout(4e3)
		})).ok;
	} catch {
		sentPushEmail = false;
	}
	return sentGmail || sentPushEmail;
}
var resendDeveloperPush_createServerFn_handler = createServerRpc({
	id: "870ee7f6ad0192fac4aef82b0b1bf9f9491096bb9a039a7b3caa2debc9cfb6fb",
	name: "resendDeveloperPush",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => resendDeveloperPush.__executeServer(opts));
var resendDeveloperPush = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(() => ({})).handler(resendDeveloperPush_createServerFn_handler, async ({ context }) => {
	const p = (await (await getSql())`select * from profiles where user_id = ${context.userId} limit 1`)[0];
	if (!p) throw new Error("No se encontró tu expediente.");
	return {
		ok: true,
		emailed: await notifyDeveloper([
			"🔔 PUSH DE APROBACIÓN PENDIENTE — Rapidez Carora",
			`Para: ${DEVELOPER_EMAIL}`,
			`Rol: ${p.role === "driver" ? "Mototaxista (Frota 5 Motos)" : "Pasajero (MVP 15)"}`,
			`Nombre: ${p.full_name}`,
			`Teléfono: ${p.phone}`,
			`Cédula: ${p.cedula}`,
			p.role === "driver" ? `Moto: ${p.model ?? ""} · Placa: ${p.plate ?? ""} · Licencia: ${p.license_grade ?? "2da Grado"}` : "",
			"La Cédula, Selfie en vivo y documentación están listas en el Painel de Monitoramento (Clave: Carora2026)."
		].filter(Boolean).join("\n"), `[Rapidez Carora] Solicitud de Aprobación — ${p.full_name} (${p.cedula})`),
		developerEmail: DEVELOPER_EMAIL
	};
});
var submitProfile_createServerFn_handler = createServerRpc({
	id: "795d2dfd88be129cbc21363762908a6d2522ce6e140aeea7d395dad416a09288",
	name: "submitProfile",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => submitProfile.__executeServer(opts));
var submitProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(submitProfile_createServerFn_handler, async ({ context, data }) => {
	const role = data.role === "driver" ? "driver" : "passenger";
	const fullName = data.fullName.trim();
	const phone = data.phone.replace(/\D/g, "");
	let cedula = data.cedula.trim().toUpperCase();
	if (/^\d{5,9}$/.test(cedula)) cedula = `V-${cedula}`;
	if (fullName.length < 3) throw new Error("Escribe tu nombre y apellido completo.");
	if (phone.length < 10) throw new Error("El teléfono no es válido.");
	if (!/^([VEJPG])-?\d{5,9}(-?\d)?$/.test(cedula)) throw new Error("La cédula o el RIF no es válido (ej. V-18422109).");
	const cedulaPhoto = photoOk(data.cedulaPhoto, true, "La foto de la Cédula de Identidad es obligatoria.");
	const selfie = photoOk(data.selfie, true, role === "passenger" ? "La selfie en vivo es obligatoria para el pasajero." : "La selfie del conductor es obligatoria.");
	const circulationPhoto = role === "driver" ? photoOk(data.circulationPhoto, true, "La foto del Carnet de Circulación / Licencia / documento de la moto es obligatoria para el motorista.") : null;
	const model = MODELS.find((item) => item === data.model.trim()) ?? "";
	const bank = BANKS.find((item) => item.name === data.bankName.trim());
	if (role === "driver" && data.plate.trim().length < 4) throw new Error("Falta la placa de la moto.");
	if (role === "driver" && !model) throw new Error("Elige el modelo de la moto.");
	if (role === "driver" && !bank) throw new Error("Elige el banco receptor del Pago Móvil.");
	if (role === "driver" && data.bankPhone.replace(/\D/g, "").length < 10) throw new Error("Falta el teléfono afiliado al Pago Móvil.");
	const licenseGrade = data.licenseGrade === "3ra Grado" ? "3ra Grado" : "2da Grado (Moto)";
	const medicalCert = data.medicalCert !== false;
	const criminalRecordOk = data.criminalRecordOk !== false;
	const sql = await getSql();
	if ((await sql`
      select status from profiles where user_id = ${context.userId}
    `)[0]?.status === "approved") throw new Error("Esta cuenta ya está aprobada.");
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
	return {
		ok: true,
		emailed: await notifyDeveloper([
			"Hay una verificación nueva en Rapidez Carora.",
			`Rol: ${role === "driver" ? "mototaxista" : "pasajero"}`,
			`Nombre: ${fullName}`,
			`Teléfono: ${phone}`,
			`Cédula: ${cedula}`,
			role === "driver" ? `Placa: ${data.plate.trim().toUpperCase()} · Modelo: ${model}` : "",
			"La cédula, la selfie y la documentación están en la bandeja del desarrollador, dentro de la app.",
			"Aprueba o rechaza ahí. La clave de revisión es Carora2026."
		].filter(Boolean).join("\n"))
	};
});
var syncLive_createServerFn_handler = createServerRpc({
	id: "9f92a4d03eaad67fcfe0608bdf4fd72c9e035b9e1a5eedde5ef6b631a0e18b06",
	name: "syncLive",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => syncLive.__executeServer(opts));
var syncLive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(syncLive_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const roadReports = await activeRoadReports();
	const weather = await currentCaroraWeather(roadReports);
	const pendingCountRows = await sql`
      select count(*)::int as c from profiles where status = 'pending'
    `;
	const pendingReviewsCount = Number(pendingCountRows[0]?.c ?? 0);
	const row = (await sql`select * from profiles where user_id = ${context.userId}`)[0];
	if (!row) return {
		profile: null,
		locked: false,
		drivers: [],
		trip: null,
		offer: null,
		pendingRate: null,
		roadReports,
		weather,
		pendingReviewsCount
	};
	const profile = profileOf(row);
	if (profile.status !== "approved") return {
		profile,
		locked: false,
		drivers: [],
		trip: null,
		offer: null,
		pendingRate: null,
		roadReports,
		weather,
		pendingReviewsCount
	};
	const deviceId = data.deviceId.trim();
	if (deviceId.length < 8) throw new Error("Este teléfono no está identificado.");
	const bound = await sql`
      select device_id from devices where user_id = ${context.userId}
    `;
	if (!bound[0]) await sql`insert into devices (user_id, device_id) values (${context.userId}, ${deviceId})`;
	else if (bound[0].device_id !== deviceId) return {
		profile,
		locked: true,
		drivers: [],
		trip: null,
		offer: null,
		pendingRate: null,
		roadReports,
		weather,
		pendingReviewsCount
	};
	else await sql`update devices set updated_at = now() where user_id = ${context.userId}`;
	const lat = typeof data.lat === "number" ? data.lat : null;
	const lng = typeof data.lng === "number" ? data.lng : null;
	if (profile.role === "driver" && lat != null && lng != null) {
		const prev = await sql`
        select lat, lng from positions where user_id = ${context.userId}
      `;
		const riding = await sql`
        select id from trips where driver_id = ${context.userId} and status = 'riding' limit 1
      `;
		if (prev[0] && riding[0]) {
			const step = haversine({
				lat: Number(prev[0].lat),
				lng: Number(prev[0].lng)
			}, {
				lat,
				lng
			});
			if (step >= 8 && step <= 400) await sql`update trips set ridden_m = ridden_m + ${Math.round(step)} where id = ${riding[0].id}`;
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
	} else if (profile.role === "driver" && !data.online) await sql`update positions set online = false, updated_at = now() where user_id = ${context.userId}`;
	const here = lat != null && lng != null ? {
		lat,
		lng
	} : null;
	await cascadeOffers();
	const drivers = await nearby(here);
	const trip = await activeTrip(context.userId);
	let offer = null;
	if (profile.role === "driver" && data.online && here) offer = await openOffer(context.userId);
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
		pendingReviewsCount
	};
});
async function nearby(origin) {
	const rows = await (await getSql())`
    select p.user_id, p.full_name, p.plate, p.model, p.elite, p.rating_sum, p.rating_count, pos.lat, pos.lng, pos.updated_at
    from positions pos
    join profiles p on p.user_id = pos.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
	const now = Date.now();
	return rows.filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS).map((row) => {
		const point = {
			lat: Number(row.lat),
			lng: Number(row.lng)
		};
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
			meters: origin ? Math.round(haversine(origin, point)) : 0
		};
	}).filter((row) => !origin || row.meters <= 2500).sort((a, b) => a.meters - b.meters);
}
async function tripView(row) {
	const people = await (await getSql())`
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
		adminPayVerified: Boolean(row.admin_pay_verified)
	};
}
async function activeTrip(userId) {
	const rows = await (await getSql())`
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
async function openOffer(driverId) {
	const row = (await (await getSql())`
    select * from trips
    where status = 'open'
    order by created_at asc
    limit 5
  `).find((r) => {
		return !String(r.offer_skip ?? "").split(",").filter(Boolean).includes(driverId);
	});
	if (!row) return null;
	const view = await tripView(row);
	if (!view.offerUntil || view.offerUntil <= Date.now()) view.offerUntil = Date.now() + OFFER_MS;
	return view;
}
async function candidates(pickup, fare) {
	const sql = await getSql();
	const need = Math.max(.4, Math.round(fare * COMMISSION * 100) / 100);
	const rows = await sql`
    select p.user_id, p.rating_sum, p.rating_count, p.saldo_usd, pos.lat, pos.lng, pos.updated_at
    from profiles p
    join positions pos on pos.user_id = p.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
	const now = Date.now();
	const fresh = rows.filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS).map((row) => {
		const count = Number(row.rating_count) || 0;
		return {
			id: row.user_id,
			meters: haversine(pickup, {
				lat: Number(row.lat),
				lng: Number(row.lng)
			}),
			rating: count > 0 ? Number(row.rating_sum) / count : 0,
			rated: count > 0,
			saldo: Number(row.saldo_usd)
		};
	}).filter((row) => row.saldo + .001 >= need);
	const near = fresh.filter((row) => row.meters <= SEARCH_RADIUS_M);
	return (near.length > 0 ? near : fresh).sort((a, b) => {
		const ap = a.rated && a.rating >= 4.5 ? 0 : 1;
		const bp = b.rated && b.rating >= 4.5 ? 0 : 1;
		if (ap !== bp) return ap - bp;
		return a.meters - b.meters;
	});
}
async function cascadeOffers() {
	const sql = await getSql();
	const now = Date.now();
	const trips = await sql`select * from trips where status = 'open' order by created_at asc`;
	const people = await sql`
    select user_id, rating_sum, rating_count from profiles where role = 'passenger'
  `;
	const score = (id) => {
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
		if (current) skip = [.../* @__PURE__ */ new Set([...skip, current])];
		const list = await candidates({
			lat: Number(trip.pickup_lat),
			lng: Number(trip.pickup_lng)
		}, Number(trip.fare_usd));
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
async function pendingRating(userId) {
	const sql = await getSql();
	const trip = (await sql`
    select t.id, t.passenger_id, t.driver_id
    from trips t
    where t.status = 'done'
      and (t.passenger_id = ${userId} or t.driver_id = ${userId})
      and not exists (
        select 1 from ratings r where r.trip_id = t.id and r.from_user = ${userId}
      )
    order by t.updated_at desc
    limit 1
  `)[0];
	if (!trip) return null;
	const otherId = trip.passenger_id === userId ? trip.driver_id : trip.passenger_id;
	if (!otherId) return null;
	const names = await sql`select full_name from profiles where user_id = ${otherId}`;
	return {
		tripId: trip.id,
		otherName: names[0]?.full_name ?? "La otra persona",
		asDriver: trip.driver_id === userId
	};
}
var requestTrip_createServerFn_handler = createServerRpc({
	id: "e51757db75e422e949ee0e31bd83b1b3ffb42649453b2087e31c0f5cf885387c",
	name: "requestTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => requestTrip.__executeServer(opts));
var requestTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(requestTrip_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const me = await sql`
      select role, status from profiles where user_id = ${context.userId}
    `;
	if (me[0]?.role !== "passenger" || me[0]?.status !== "approved") throw new Error("Tu cuenta aún no puede pedir carreras.");
	if ((await sql`
      select id from trips where passenger_id = ${context.userId} and status not in ('done', 'cancelled') limit 1
    `)[0]) throw new Error("Ya tienes una carrera abierta.");
	const pickup = {
		lat: data.pickupLat,
		lng: data.pickupLng
	};
	const dest = {
		lat: data.destLat,
		lng: data.destLng
	};
	const destRef = data.destRef.trim();
	if (destRef.length < 3) throw new Error("Escribe el punto de referencia del destino.");
	const distanceM = Math.round(haversine(pickup, dest));
	if (distanceM < 120) throw new Error("El destino está demasiado cerca.");
	const ref = data.pickupRef.trim() || "Donde estoy";
	const id = `t_${crypto.randomUUID()}`;
	const share = crypto.randomUUID().replace(/-/g, "");
	const pay = data.payMethod === "PAGO_MOVIL" ? "PAGO_MOVIL" : data.payMethod === "ZELLE_WALLET" ? "ZELLE_WALLET" : data.payMethod === "CASH_VES" ? "CASH_VES" : "CASH_USD";
	const tier = SERVICE_TIERS.find((t) => t.id === data.serviceTier) ?? SERVICE_TIERS[0];
	const baseFare = fareFor(distanceM, premiereAt(dest));
	const totalFare = Math.round((baseFare + tier.extraUsd) * 100) / 100;
	const cashTendered = typeof data.cashTendered === "number" && data.cashTendered > 0 ? Math.round(data.cashTendered * 100) / 100 : null;
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
var acceptTrip_createServerFn_handler = createServerRpc({
	id: "84038b8fe5e09ebe23acf7a4f3d08c8a6edc71bede65677cd31190bbf5b0965d",
	name: "acceptTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => acceptTrip.__executeServer(opts));
var acceptTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(acceptTrip_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const me = await sql`
      select role, status from profiles where user_id = ${context.userId}
    `;
	if (me[0]?.role !== "driver" || me[0]?.status !== "approved") throw new Error("Solo un mototaxista aprobado puede aceptar.");
	if (!(await sql`
      update trips set driver_id = ${context.userId}, status = 'accepted', updated_at = now()
      where id = ${data.tripId} and status = 'open'
      returning id
    `)[0]) throw new Error("Esa carrera ya la tomó otro mototaxista de la flota.");
	return { ok: true };
});
var setTripStatus_createServerFn_handler = createServerRpc({
	id: "9e06b043a53f2f14fff17ba04319d6e689c366aa06bbaab435b300b61c7dcd74",
	name: "setTripStatus",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => setTripStatus.__executeServer(opts));
var setTripStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setTripStatus_createServerFn_handler, async ({ context, data }) => {
	if (![
		"arrived",
		"riding",
		"pay",
		"done",
		"cancelled"
	].includes(data.status)) throw new Error("Estado inválido.");
	const sql = await getSql();
	const trip = (await sql`
      select passenger_id, driver_id, status, fare_usd from trips where id = ${data.tripId}
    `)[0];
	if (!trip) throw new Error("No existe esa carrera.");
	if (!(trip.passenger_id === context.userId || trip.driver_id === context.userId)) throw new Error("No es tu carrera.");
	if (data.status === "cancelled") {
		if (trip.passenger_id !== context.userId) throw new Error("Solo el pasajero cancela.");
		if (!["open", "accepted"].includes(trip.status)) throw new Error("Ya no se puede cancelar.");
	}
	if ([
		"arrived",
		"riding",
		"pay"
	].includes(data.status) && trip.driver_id !== context.userId) {
		if (!(data.status === "pay" && trip.passenger_id === context.userId)) throw new Error("Eso lo marca el mototaxista.");
	}
	if (data.status === "done" && trip.driver_id !== context.userId && trip.passenger_id !== context.userId) throw new Error("El cobro y cierre de la carrera lo confirma el mototaxista.");
	const payRef = (data.payRef ?? "").replace(/\D/g, "").slice(0, 12);
	const proof = data.paymentProof ? photoOk(data.paymentProof, false) : null;
	const commission = data.status === "done" ? Math.round(Number(trip.fare_usd) * COMMISSION * 100) / 100 : 0;
	if (data.status === "done" && trip.driver_id) await sql`
        update profiles set saldo_usd = saldo_usd - ${commission} where user_id = ${trip.driver_id}
      `;
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
	return {
		ok: true,
		commission
	};
});
var reviewList_createServerFn_handler = createServerRpc({
	id: "cbb75616bdaa9a4a21b5c2958c01c9affc0541a677013764d70e2e07355b88df",
	name: "reviewList",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => reviewList.__executeServer(opts));
var reviewList = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(reviewList_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	return (await (await getSql())`
      select * from profiles where status = 'pending' order by created_at asc
    `).map((row) => ({
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
		criminalRecordOk: row.criminal_record_ok ?? true
	}));
});
var reviewDecide_createServerFn_handler = createServerRpc({
	id: "327c2b15651ac192c904a6fb119d7db2bb7a4027b2de920e10320782fa8d6df1",
	name: "reviewDecide",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => reviewDecide.__executeServer(opts));
var reviewDecide = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(reviewDecide_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	const sql = await getSql();
	const target = (await sql`
      select * from profiles where user_id = ${data.userId} limit 1
    `)[0];
	if (data.approve) await sql`
        update profiles set
          status = 'approved',
          elite = case when role = 'driver' then true else ${Boolean(data.elite)} end,
          in_person_verified = true,
          reject_note = ''
        where user_id = ${data.userId} and status = 'pending'
      `;
	else await sql`
        update profiles set status = 'rejected', elite = false, reject_note = ${data.note.trim().slice(0, 180)}
        where user_id = ${data.userId} and status = 'pending'
      `;
	if (target) await notifyDeveloper([
		data.approve ? "✅ APROBACIÓN DEL DESARROLLADOR CONFIRMADA — Rapidez Carora" : "❌ EXPEDIENTE RECHAZADO POR DESARROLLADOR — Rapidez Carora",
		`Correo Desarrollador: ${DEVELOPER_EMAIL}`,
		`Usuario: ${target.full_name} (${target.cedula})`,
		`Teléfono: ${target.phone}`,
		`Rol: ${target.role === "driver" ? "Mototaxista (Frota 5)" : "Pasajero (MVP 15)"}`,
		target.role === "driver" ? `Moto: ${target.model ?? ""} · Placa: ${target.plate ?? ""}` : "",
		data.approve ? "Estado: APROBADO y habilitado para operar en Carora." : `Motivo rechazo: ${data.note.trim() || "Corregir documentos"}`
	].filter(Boolean).join("\n"), data.approve ? `[Rapidez Carora] Aprobado: ${target.full_name} (${target.cedula})` : `[Rapidez Carora] Rechazado: ${target.full_name} (${target.cedula})`);
	return { ok: true };
});
var listChat_createServerFn_handler = createServerRpc({
	id: "12bc8d4171b68a700fc54ab6f6061ed11d4b0327378a1105fed277a36f44132d",
	name: "listChat",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => listChat.__executeServer(opts));
var listChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(listChat_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (!(await sql`
      select id from trips
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding', 'pay')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
    `)[0]) return [];
	return (await sql`
      select id, from_user, body, attachment_photo from messages where trip_id = ${data.tripId} order by created_at asc limit 40
    `).map((row) => ({
		id: row.id,
		body: row.body,
		mine: row.from_user === context.userId,
		attachmentPhoto: row.attachment_photo ?? ""
	}));
});
var sendChat_createServerFn_handler = createServerRpc({
	id: "7833d2c9fc5a641ad3804fecd7659f3dda9ed151aca316273fe7cd10b639d3c8",
	name: "sendChat",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => sendChat.__executeServer(opts));
var sendChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(sendChat_createServerFn_handler, async ({ context, data }) => {
	const photo = data.attachmentPhoto ? photoOk(data.attachmentPhoto, false, "Captura de comprobante inválida.") : null;
	const body = data.body.trim().slice(0, 140) || (photo ? "📎 Comprobante de pago (Zelle / Billetera Digital)" : "");
	if (body.length < 1 && !photo) throw new Error("Escribe el mensaje o adjunta el comprobante.");
	const sql = await getSql();
	if (!(await sql`
      select id from trips
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding', 'pay')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
    `)[0]) throw new Error("Esa carrera no tiene chat.");
	await sql`
      insert into messages (id, trip_id, from_user, body, attachment_photo)
      values (${`m_${crypto.randomUUID()}`}, ${data.tripId}, ${context.userId}, ${body}, ${photo})
    `;
	if (photo) await sql`
        update trips
        set payment_proof = ${photo},
            pay_status = case when pay_status = 'PAID' then 'PAID' else 'VERIFYING' end,
            updated_at = now()
        where id = ${data.tripId}
      `;
	return { ok: true };
});
var fleetList_createServerFn_handler = createServerRpc({
	id: "316b6f7714d4fd4887380da5dfc1d0df655473325cee7cef8c5aa595abb2a060",
	name: "fleetList",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => fleetList.__executeServer(opts));
var fleetList = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(fleetList_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	const rows = await (await getSql())`
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
		const isFresh = Boolean(row.online) && row.pos_updated_at != null && now - new Date(row.pos_updated_at).getTime() < FRESH_MS;
		const liveState = row.active_trip_id ? "on_trip" : isFresh ? "free" : "offline";
		const sector = row.lat != null && row.lng != null ? placeLabel({
			lat: Number(row.lat),
			lng: Number(row.lng)
		}) : "Sin señal GPS";
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
			saldoUsd: Number(row.saldo_usd ?? 0)
		};
	});
});
var setFleetState_createServerFn_handler = createServerRpc({
	id: "df1447541bd1fde8533519e7dfe8b1c4cd2734893159e9fe20079fa553701ac3",
	name: "setFleetState",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => setFleetState.__executeServer(opts));
var setFleetState = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setFleetState_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	const next = data.status === "blocked" ? "blocked" : "approved";
	const sql = await getSql();
	await sql`
      update profiles set status = ${next}
      where user_id = ${data.userId} and role = 'driver' and status in ('approved', 'blocked')
    `;
	if (next === "blocked") await sql`update positions set online = false, updated_at = now() where user_id = ${data.userId}`;
	return { ok: true };
});
var declineTrip_createServerFn_handler = createServerRpc({
	id: "05d12347b61689eef3f19dd9d53c85df483e32e3b936c29a29e86e35af3eab53",
	name: "declineTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => declineTrip.__executeServer(opts));
var declineTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(declineTrip_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const rows = await sql`
      select offer_skip from trips where id = ${data.tripId} limit 1
    `;
	const skip = String(rows[0]?.offer_skip ?? "").split(",").filter(Boolean);
	await sql`
      update trips set offer_skip = ${[.../* @__PURE__ */ new Set([...skip, context.userId])].join(",")}, offer_until_ms = 0
      where id = ${data.tripId} and status = 'open'
    `;
	await cascadeOffers();
	return { ok: true };
});
var raisePanic_createServerFn_handler = createServerRpc({
	id: "ad5811adb14f74d98ffeb68b5c89ade28c1467099aaa57ebf58bbd67047658ba",
	name: "raisePanic",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => raisePanic.__executeServer(opts));
var raisePanic = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(raisePanic_createServerFn_handler, async ({ context, data }) => {
	if (!(await (await getSql())`
      update trips set panic_at = now()
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
      returning id
    `)[0]) throw new Error("No hay un viaje activo.");
	await notifyDeveloper([
		"PÁNICO en un viaje de Rapidez Carora.",
		`Carrera: ${data.tripId}`,
		"Ábrelo en la bandeja del desarrollador. Emergencias: 171."
	].join("\n"), "Rapidez Carora — pánico");
	return { ok: true };
});
var rateTrip_createServerFn_handler = createServerRpc({
	id: "839e3d5aa78c3b6c59caeeba10185ca80c5b2a06761f19de4ef28a3ce24f14e8",
	name: "rateTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => rateTrip.__executeServer(opts));
var rateTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(rateTrip_createServerFn_handler, async ({ context, data }) => {
	const stars = Math.max(1, Math.min(5, Math.round(data.stars)));
	const note = data.note.trim().slice(0, 180);
	const sql = await getSql();
	const trip = (await sql`
      select passenger_id, driver_id, status from trips where id = ${data.tripId}
    `)[0];
	if (!trip || trip.status !== "done") throw new Error("La carrera todavía no termina.");
	if (!(trip.passenger_id === context.userId || trip.driver_id === context.userId) || !trip.driver_id) throw new Error("No puedes calificar esta carrera.");
	const other = trip.passenger_id === context.userId ? trip.driver_id : trip.passenger_id;
	if ((await sql`
      insert into ratings (trip_id, from_user, to_user, stars, note)
      values (${data.tripId}, ${context.userId}, ${other}, ${stars}, ${note})
      on conflict (trip_id, from_user) do nothing
      returning trip_id
    `)[0]) await sql`
        update profiles set rating_sum = rating_sum + ${stars}, rating_count = rating_count + 1
        where user_id = ${other}
      `;
	return { ok: true };
});
var tripHistory_createServerFn_handler = createServerRpc({
	id: "1dab4d8aaec49cd61a4dc813c8bc9883c2a47b6615c606dc2405ece9e9dc053a",
	name: "tripHistory",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => tripHistory.__executeServer(opts));
var tripHistory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(() => ({})).handler(tripHistory_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select id, dest_ref, fare_usd, commission_usd, distance_m, updated_at
      from trips
      where status = 'done' and (passenger_id = ${context.userId} or driver_id = ${context.userId})
      order by updated_at desc
      limit 12
    `).map((row) => ({
		id: row.id,
		dest: row.dest_ref || "Carora",
		fareUsd: Number(row.fare_usd),
		commissionUsd: Number(row.commission_usd ?? 0),
		distanceM: Number(row.distance_m),
		when: new Date(row.updated_at).toLocaleString("es-VE", {
			hour: "2-digit",
			minute: "2-digit",
			day: "2-digit",
			month: "short"
		})
	}));
});
var opsBoard_createServerFn_handler = createServerRpc({
	id: "11a032e02e58f5c8b03660d4f0c4e9ff4e8109c9c407eb3c5dec400818809789",
	name: "opsBoard",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => opsBoard.__executeServer(opts));
var opsBoard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(opsBoard_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	const sql = await getSql();
	const panics = await sql`
        select t.id, p.full_name, p.phone, t.pickup_ref, t.dest_ref
        from trips t
        join profiles p on p.user_id = t.passenger_id
        where t.panic_at is not null and t.status in ('accepted', 'arrived', 'riding')
        order by t.panic_at desc
        limit 8
      `;
	const week = await sql`
        select p.full_name, p.cedula, p.saldo_usd,
          (select coalesce(sum(t.commission_usd), 0) from trips t
            where t.driver_id = p.user_id and t.status = 'done'
              and t.updated_at > now() - interval '7 days') as week_usd
        from profiles p
        where p.role = 'driver' and p.status = 'approved'
        order by p.full_name
      `;
	const counts = await sql`
        select
          count(*) filter (where status = 'done')::int as done,
          count(*) filter (where status = 'cancelled')::int as cancelled,
          count(*) filter (where status in ('open', 'accepted', 'arrived', 'riding', 'pay'))::int as open
        from trips
      `;
	const userCounts = await sql`
        select
          count(*) filter (where role = 'driver' and status = 'approved')::int as drivers,
          count(*) filter (where role = 'passenger' and status = 'approved')::int as passengers
        from profiles
      `;
	const recent = await sql`
        select id, dest_ref, fare_usd, status, pay_method, pay_ref, payment_proof, admin_pay_verified, updated_at
        from trips
        where status in ('done', 'cancelled', 'open', 'accepted', 'riding', 'pay')
        order by updated_at desc
        limit 10
      `;
	const fbRows = await sql`
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
			dest: row.dest_ref ?? ""
		})),
		week: week.map((row) => ({
			name: row.full_name,
			cedula: row.cedula,
			saldo: Number(row.saldo_usd),
			commission: Number(row.week_usd)
		})),
		metrics: {
			done: Number(tally?.done ?? 0),
			cancelled: Number(tally?.cancelled ?? 0),
			open: Number(tally?.open ?? 0),
			driversApproved: Number(uTally?.drivers ?? 0),
			passengersApproved: Number(uTally?.passengers ?? 0)
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
				month: "short"
			})
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
				month: "short"
			})
		}))
	};
});
var verifyTripPayment_createServerFn_handler = createServerRpc({
	id: "b3a8133947531313b12382044b24d65bf943d98a2a7abc0f51ed48e723bd58e5",
	name: "verifyTripPayment",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => verifyTripPayment.__executeServer(opts));
var verifyTripPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(verifyTripPayment_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	await (await getSql())`
      update trips
      set admin_pay_verified = true,
          pay_status = 'PAID',
          updated_at = now()
      where id = ${data.tripId}
    `;
	return { ok: true };
});
var setDriverHotspot_createServerFn_handler = createServerRpc({
	id: "bcc56d79d9b464b7f81ac1ec349b9a33964d14b9030ffa19b08b98dba39fbd10",
	name: "setDriverHotspot",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => setDriverHotspot.__executeServer(opts));
var setDriverHotspot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setDriverHotspot_createServerFn_handler, async ({ context, data }) => {
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
var submitMvpFeedback_createServerFn_handler = createServerRpc({
	id: "fcecd228521cc41c12c8a6b5a0c684dfae87cebf867e5c941dd268116cdb8d21",
	name: "submitMvpFeedback",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => submitMvpFeedback.__executeServer(opts));
var submitMvpFeedback = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(submitMvpFeedback_createServerFn_handler, async ({ context, data }) => {
	const body = data.body.trim().slice(0, 600);
	if (body.length < 2) throw new Error("Describe brevemente tu reporte o sugerencia.");
	const sql = await getSql();
	const prof = await sql`
      select full_name, role from profiles where user_id = ${context.userId} limit 1
    `;
	const authorName = prof[0]?.full_name || "Usuario MVP Carora";
	const role = prof[0]?.role || "passenger";
	const category = data.category.trim().slice(0, 40) || "Feedback Mejoras";
	await sql`
      insert into mvp_feedback (id, user_id, author_name, role, category, body)
      values (${`fb_${crypto.randomUUID()}`}, ${context.userId}, ${authorName}, ${role}, ${category}, ${body})
    `;
	await notifyDeveloper([
		"💬 NUEVO FEEDBACK DE MEJORAS — Rapidez Carora",
		`Autor: ${authorName} (${role})`,
		`Categoría: ${category}`,
		"",
		body
	].join("\n"), `[Rapidez Carora] Feedback de ${authorName}`);
	return { ok: true };
});
var topUp_createServerFn_handler = createServerRpc({
	id: "23d2f53bb929affe942f48522da29bb66f652d956cade175d1e572c87e663e4f",
	name: "topUp",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => topUp.__executeServer(opts));
var topUp = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(topUp_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	let cedula = data.cedula.trim().toUpperCase();
	if (/^\d{5,9}$/.test(cedula)) cedula = `V-${cedula}`;
	if (!(await (await getSql())`
      update profiles set saldo_usd = saldo_usd + 5
      where replace(upper(cedula), ' ', '') = replace(${cedula}, ' ', '')
        and role = 'driver' and status = 'approved'
      returning user_id
    `)[0]) throw new Error("No hay un mototaxista aprobado con esa cédula.");
	return { ok: true };
});
var sharedTrip_createServerFn_handler = createServerRpc({
	id: "41d15f54b06a59f615530a3a39b0ffb267460612f75467ac27d6d260161622cc",
	name: "sharedTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => sharedTrip.__executeServer(opts));
var sharedTrip = createServerFn({ method: "GET" }).validator((token) => token.trim()).handler(sharedTrip_createServerFn_handler, async ({ data }) => {
	if (data.length < 8) return null;
	const trip = (await (await getSql())`select * from trips where share_token = ${data} limit 1`)[0];
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
		lng: view.driverLng
	};
});
var cachedMeteo = null;
async function fetchOpenMeteoCarora() {
	const now = Date.now();
	if (cachedMeteo && now - cachedMeteo.at < 3e5) return cachedMeteo;
	try {
		const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.178&longitude=-70.082&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=America%2FCaracas", { signal: AbortSignal.timeout(3500) });
		if (!res.ok) throw new Error("weather status");
		const c = (await res.json()).current ?? {};
		const tempC = Math.round(Number(c.temperature_2m ?? 31));
		const rainMm = Number(c.rain ?? c.precipitation ?? 0);
		const code = Number(c.weather_code ?? 0);
		const windKmh = Math.round(Number(c.wind_speed_10m ?? 12));
		const isRaining = rainMm > .1 || code >= 51 && code <= 99;
		cachedMeteo = {
			at: now,
			tempC,
			rainMm,
			windKmh,
			isRaining,
			conditionLabel: isRaining ? code >= 95 ? "Tormenta eléctrica en Carora" : "Lluvia activa en Carora" : code >= 1 && code <= 3 ? "Parcialmente nublado · Carora" : "Cielo despejado · Carora"
		};
		return cachedMeteo;
	} catch {
		return cachedMeteo ?? {
			at: now,
			tempC: 32,
			rainMm: 0,
			windKmh: 14,
			isRaining: false,
			conditionLabel: "Clima cálido · Carora"
		};
	}
}
async function activeRoadReports() {
	return (await (await getSql())`
    select id, kind, label, sector, author_name, lat, lng, upvotes, created_at
    from road_reports
    where expires_at > now() and upvotes > 0
    order by created_at desc
    limit 25
  `).map((r) => ({
		id: r.id,
		kind: r.kind === "lluvia_anegado" || r.kind === "trafico_cierre" || r.kind === "alcabala_operativo" ? r.kind : "lombada_hueco",
		label: r.label,
		sector: r.sector,
		authorName: r.author_name,
		lat: Number(r.lat),
		lng: Number(r.lng),
		upvotes: Number(r.upvotes),
		when: new Date(r.created_at).toLocaleTimeString("es-VE", {
			hour: "2-digit",
			minute: "2-digit"
		})
	}));
}
async function currentCaroraWeather(reports) {
	const dbWeather = (await (await getSql())`
    select rain_mode, advisory, delay_min from city_weather where id = 1 limit 1
  `)[0];
	const meteo = await fetchOpenMeteoCarora();
	const rainReports = reports.filter((r) => r.kind === "lluvia_anegado");
	const isRaining = Boolean(dbWeather?.rain_mode) || meteo.isRaining || rainReports.length > 0;
	const delayMin = isRaining ? Math.max(Number(dbWeather?.delay_min ?? 0), 3 + Math.min(5, rainReports.length * 2)) : 0;
	const advisory = isRaining ? dbWeather?.advisory?.trim() || (rainReports.length > 0 ? `Alerta por lluvia y calles anegadas en ${rainReports[0].sector}. Precaución en Quebrada de Carora, Río Morere y Av. Miranda (+${delayMin} min de retraso estimado).` : `Lluvia activa en Carora. Pavimento húmedo y precaución en pasos de quebrada (+${delayMin} min por seguridad).`) : dbWeather?.advisory?.trim() || "";
	return {
		tempC: meteo.tempC,
		isRaining,
		rainMm: meteo.rainMm,
		windKmh: meteo.windKmh,
		advisory,
		delayMin,
		conditionLabel: isRaining ? "Alerta de Lluvia · Carora" : meteo.conditionLabel
	};
}
var submitRoadReport_createServerFn_handler = createServerRpc({
	id: "70344ce1a72d9420319ec2e9c718ebdd02a31650b52ac8211ec47f2679975ff7",
	name: "submitRoadReport",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => submitRoadReport.__executeServer(opts));
var submitRoadReport = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(submitRoadReport_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const authorName = (await sql`
      select full_name from profiles where user_id = ${context.userId} limit 1
    `)[0]?.full_name?.split(" ")[0] || "Vecino Carora";
	const lat = Number(data.lat);
	const lng = Number(data.lng);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("Ubicación GPS inválida.");
	const sector = placeLabel({
		lat,
		lng
	});
	const label = data.label.trim().slice(0, 120) || {
		lombada_hueco: "Lombada pronunciada / Hueco en la vía",
		lluvia_anegado: "Calle anegada por lluvia / Corriente de agua",
		trafico_cierre: "Retraso por tránsito pesado / Vía cerrada",
		alcabala_operativo: "Punto de control / Reducir velocidad"
	}[data.kind];
	const id = `rr_${crypto.randomUUID()}`;
	await sql`
      insert into road_reports (id, user_id, author_name, kind, label, sector, lat, lng, upvotes)
      values (${id}, ${context.userId}, ${authorName}, ${data.kind}, ${label}, ${sector}, ${lat}, ${lng}, 1)
    `;
	if (data.kind === "lluvia_anegado") await sql`
        update city_weather
        set rain_mode = true,
            delay_min = greatest(delay_min, 4),
            advisory = ${`Lluvia y vía anegada reportada en ${sector}. Precaución en áreas críticas y quebradas.`},
            updated_at = now()
        where id = 1
      `;
	return {
		ok: true,
		id
	};
});
var voteRoadReport_createServerFn_handler = createServerRpc({
	id: "5703a9b674bd2ed70685954947ab6440783a6bcf7e0560315137e24d0d943e92",
	name: "voteRoadReport",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => voteRoadReport.__executeServer(opts));
var voteRoadReport = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(voteRoadReport_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	if (data.delta > 0) await sql`
        update road_reports
        set upvotes = upvotes + 1,
            expires_at = greatest(expires_at, now() + interval '2 hours')
        where id = ${data.reportId}
      `;
	else await sql`
        update road_reports
        set upvotes = upvotes - 1
        where id = ${data.reportId}
      `;
	return { ok: true };
});
var setCityWeather_createServerFn_handler = createServerRpc({
	id: "bda24f0cb2976ceab9c302e4a17ed6dfe59841e780b4230e1902e622be8b0ed0",
	name: "setCityWeather",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => setCityWeather.__executeServer(opts));
var setCityWeather = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setCityWeather_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const delayMin = data.rainMode ? Math.max(3, Math.min(15, Number(data.delayMin ?? 4))) : 0;
	const advisory = data.rainMode ? data.advisory?.trim() || "Alerta de lluvia en Carora: precaución en Quebrada de Carora, Río Morere y Av. Francisco de Miranda. Retrasos estimados de 3 a 6 min." : "";
	await sql`
      update city_weather
      set rain_mode = ${Boolean(data.rainMode)},
          advisory = ${advisory},
          delay_min = ${delayMin},
          updated_at = now()
      where id = 1
    `;
	if (!data.rainMode) await sql`
        delete from road_reports where kind = 'lluvia_anegado'
      `;
	return { ok: true };
});
export { acceptTrip_createServerFn_handler, declineTrip_createServerFn_handler, fleetList_createServerFn_handler, listChat_createServerFn_handler, opsBoard_createServerFn_handler, raisePanic_createServerFn_handler, rateTrip_createServerFn_handler, requestTrip_createServerFn_handler, resendDeveloperPush_createServerFn_handler, reviewDecide_createServerFn_handler, reviewList_createServerFn_handler, sendChat_createServerFn_handler, setCityWeather_createServerFn_handler, setDriverHotspot_createServerFn_handler, setFleetState_createServerFn_handler, setTripStatus_createServerFn_handler, sharedTrip_createServerFn_handler, submitMvpFeedback_createServerFn_handler, submitProfile_createServerFn_handler, submitRoadReport_createServerFn_handler, syncLive_createServerFn_handler, topUp_createServerFn_handler, tripHistory_createServerFn_handler, verifyTripPayment_createServerFn_handler, voteRoadReport_createServerFn_handler };
